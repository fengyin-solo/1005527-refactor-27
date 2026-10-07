// 公共动作链路的语义验证：并发去重、失败不吞、回执单一来源。
// 通过 esbuild 直接打包前端真实源码（src/api/action.ts、stores/receipt.ts），
// 只在 Node 侧替换 fetch 来模拟接口。
import { build } from 'esbuild'
import { pathToFileURL } from 'node:url'
import path from 'node:path'
import os from 'node:os'
import fs from 'node:fs'

const root = path.resolve(process.cwd())
const entry = path.join(root, 'node_modules', '.action-chain-test.mjs')

const code = `
import { setActivePinia, createPinia } from 'pinia'
import { runAction } from '${path.join(root, 'src/api/action.ts').replaceAll(path.sep, '/')}'
import { useActionReceiptStore } from '${path.join(root, 'src/stores/receipt.ts').replaceAll(path.sep, '/')}'

export async function main(calls) {
  setActivePinia(createPinia())
  globalThis.fetch = async (url, init) => {
    calls.count++
    calls.urls?.push(url)
    calls.bodies?.push(JSON.parse(init.body))
    const mode = calls.mode
    await new Promise((r) => setTimeout(r, mode.delayMs ?? 50))
    const payload = mode.respond(url, init)
    return new Response(JSON.stringify(payload.body), { status: payload.status, headers: { 'Content-Type': 'application/json' } })
  }
  const store = useActionReceiptStore()
  return { runAction, store }
}
`
fs.writeFileSync(entry, code)

await build({
  entryPoints: [entry],
  bundle: true,
  format: 'esm',
  platform: 'node',
  outfile: entry,
  allowOverwrite: true,
  alias: { '@': path.join(root, 'src') },
  define: { 'import.meta.env.VITE_API_BASE': '""' },
  logLevel: 'silent',
})

const mod = await import(pathToFileURL(entry).href)

const json = (body, status = 200) => ({ body, status })
let pass = 0
function assert(cond, label) {
  if (!cond) throw new Error('断言失败: ' + label)
  pass++
  console.log('  ✓', label)
}

// 1) 并发点两次同一动作：只提交一次，后到按失败处理，同一份兜底文案
{
  const calls = { count: 0, urls: [], bodies: [], mode: { delayMs: 60, respond: () => json({ ok: true, message: '运维合同已确认签订', entry: { id: 1 } }) } }
  const { runAction, store } = await mod.main(calls)
  const opts = { endpoint: '/api/contract', entryId: 1, action: '确认签订', failureText: '运维合同动作未生效，请稍后重试' }
  const [r1, r2] = await Promise.all([runAction(opts), runAction(opts)])
  assert(calls.count === 1, '并发两次只发起 1 个请求（实际 ' + calls.count + '）')
  assert(r1.ok === true && r1.message === '运维合同已确认签订', '先到的一次按后端回执成功')
  assert(r2.ok === false, '后到的一次按失败处理')
  assert(r2.duplicated === true, '后到的一次标记为重复提交')
  assert(r2.message === '运维合同动作未生效，请稍后重试', '后到的一次使用页面同一份兜底文案')
  const stored = store.receiptOf('/api/contract')
  assert(stored.message === r2.message && stored.ok === false && stored.duplicated === true, '失败回执覆盖为最新一条，列表与详情读同一份')
}

// 2) 串行再点同一动作（在途已清空）：正常再次提交
{
  const calls = { count: 0, urls: [], bodies: [], mode: { delayMs: 10, respond: () => json({ ok: true, message: '告警事件已确认告警', entry: { id: 2 } }) } }
  const { runAction } = await mod.main(calls)
  const opts = { endpoint: '/api/alarm', entryId: 2, action: '确认告警', failureText: '告警事件动作未生效，请稍后重试' }
  const a = await runAction(opts)
  const b = await runAction(opts)
  assert(calls.count === 2, '在途清空后再次点击会重新提交（2 次）')
  assert(a.ok && b.ok, '两次串行点击均成功')
}

// 3) 业务失败 HTTP 200 + ok:false：不当成功，提示取后端原因
{
  const calls = { count: 0, mode: { delayMs: 0, respond: () => json({ ok: false, message: '动作「删除」不属于运维合同可执行范围', entry: null }) } }
  const { runAction, store } = await mod.main(calls)
  const r = await runAction({ endpoint: '/api/contract', entryId: 1, action: '删除', failureText: '运维合同动作未生效，请稍后重试' })
  assert(r.ok === false, 'ok:false 判为失败')
  assert(r.message === '动作「删除」不属于运维合同可执行范围', '失败提示取后端可读原因，不吞错误')
  assert(store.receiptOf('/api/contract').message === r.message, '详情/列表读到同一条失败提示')
}

// 4) 网络层失败：不吞错误，统一兜底（错误信息可读）
{
  const calls = { count: 0, mode: { delayMs: 0, respond: () => { throw new TypeError('Failed to fetch') } } }
  const { runAction } = await mod.main(calls)
  const r = await runAction({ endpoint: '/api/contract', entryId: 1, action: '确认签订', failureText: '运维合同动作未生效，请稍后重试' })
  assert(r.ok === false, '网络异常判失败')
  assert(r.message.includes('接口请求失败'), '网络异常给出可读兜底，不留空白: ' + r.message)
}

// 5) HTTP 500 + detail：提示取 detail；无 detail 时用页面兜底
{
  const calls500 = { count: 0, mode: { delayMs: 0, respond: () => json({ detail: '服务暂时不可用' }, 500) } }
  const ctx1 = await mod.main(calls500)
  const r1 = await ctx1.runAction({ endpoint: '/api/contract', entryId: 1, action: '确认签订', failureText: 'FALLBACK' })
  assert(r1.message === '服务暂时不可用', 'HTTP 500 优先展示后端 detail')

  const calls500b = { count: 0, mode: { delayMs: 0, respond: () => json({}, 502) } }
  const ctx2 = await mod.main(calls500b)
  const r2 = await ctx2.runAction({ endpoint: '/api/contract', entryId: 1, action: '确认签订', failureText: 'FALLBACK' })
  assert(r2.message === 'FALLBACK', 'HTTP 502 无详情时使用页面历史兜底文案')
}

// 6) 不同动作并发不互斥；请求体包含平铺 action（兼容字段）与 values
{
  const calls = { count: 0, bodies: [], mode: { delayMs: 40, respond: () => json({ ok: true, message: 'ok', entry: { id: 3 } }) } }
  const { runAction } = await mod.main(calls)
  await Promise.all([
    runAction({ endpoint: '/api/contract', entryId: 3, action: '确认签订', failureText: 'F' }),
    runAction({ endpoint: '/api/contract', entryId: 3, action: '开始履行', failureText: 'F' }),
  ])
  assert(calls.count === 2, '不同动作并发各提交一次')
  assert(calls.bodies.every((b) => b.action && b.values.action === b.action), '请求体平铺 action 与 values.action 同时带上，兼容两种后端读法')
}

console.log(`\n公共动作链路 ${pass} 条断言全部通过`)
