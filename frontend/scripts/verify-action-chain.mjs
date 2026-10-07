/**
 * 公共动作链路验证（不依赖浏览器）：mock fetch 与 pinia，
 * 校验请求体兼容、业务失败判定、网络兜底与并发去重。
 * 运行：node scripts/verify-action-chain.mjs
 */
import { build } from 'esbuild'
import { createPinia, setActivePinia } from 'pinia'
import { writeFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

const bundle = await build({
  entryPoints: ['src/api/action.ts'],
  bundle: true,
  format: 'esm',
  platform: 'node',
  write: false,
  packages: 'external',
  define: { 'import.meta.env.VITE_API_BASE': '""' },
  alias: { '@': new URL('../src', import.meta.url).pathname },
})
const outPath = new URL('../.tmp-action-chain.mjs', import.meta.url).pathname
writeFileSync(outPath, bundle.outputFiles[0].text)
const { runModuleAction, buildActionBody } = await import(pathToFileURL(outPath).href)

let failures = 0
function check(name, cond, extra = '') {
  if (cond) {
    console.log(`  ok - ${name}`)
  } else {
    failures += 1
    console.error(`  FAIL - ${name} ${extra}`)
  }
}

// ---- mock fetch：记录请求次数与请求体，按场景返回 ----
const calls = []
globalThis.fetch = async (url, init) => {
  calls.push({ url, body: JSON.parse(init.body), at: Date.now() })
  await new Promise((r) => setTimeout(r, 40))
  const body = JSON.parse(init.body)
  const action = body.values?.action ?? body.action
  if (action === '__net__') {
    throw new TypeError('Failed to fetch')
  }
  if (action === '__http500__') {
    return new Response(JSON.stringify({ detail: '服务暂不可用' }), { status: 500 })
  }
  if (action === '__bizfail__') {
    return new Response(JSON.stringify({ ok: false, message: '当前状态不允许该动作' }), { status: 200 })
  }
  return new Response(
    JSON.stringify({ ok: true, message: `已执行${action}`, entry: { id: 1 } }),
    { status: 200 },
  )
}

setActivePinia(createPinia())

console.log('请求体公共约定：')
const built = buildActionBody('降功率运行')
check('规范字段 values.action', built.values.action === '降功率运行')
check('兼容历史顶层 action', built.action === '降功率运行')

console.log('成功：结果与提示来自后端：')
calls.length = 0
const okReceipt = await runModuleAction('pv_array', 1, '降功率运行')
check('只提交一次', calls.length === 1, `calls=${calls.length}`)
check('outcome=success', okReceipt.outcome === 'success')
check('提示语取后端 message', okReceipt.message === '已执行降功率运行')
check('请求体双字段兼容', calls[0].body.values.action === '降功率运行' && calls[0].body.action === '降功率运行')

console.log('业务失败（HTTP 200 但 ok=false）：不再被当成功：')
const bizReceipt = await runModuleAction('pv_array', 2, '__bizfail__')
check('outcome=failure', bizReceipt.outcome === 'failure')
check('提示取后端说明不被吞', bizReceipt.message === '当前状态不允许该动作')

console.log('HTTP 500：公共兜底，不抛给页面：')
const httpReceipt = await runModuleAction('pv_array', 3, '__http500__')
check('outcome=failure', httpReceipt.outcome === 'failure')
check('提示包含服务端 detail', httpReceipt.message === '服务暂不可用', httpReceipt.message)

console.log('网络错误：统一兜底：')
const netReceipt = await runModuleAction('pv_array', 4, '__net__')
check('outcome=failure', netReceipt.outcome === 'failure')
check('有兜底提示语', netReceipt.message.includes('接口请求失败') || netReceipt.message.includes('操作失败'), netReceipt.message)

console.log('并发点两次同一动作：')
calls.length = 0
const [r1, r2] = await Promise.all([
  runModuleAction('alarm', 7, '确认告警'),
  runModuleAction('alarm', 7, '确认告警'),
])
check('只发出一次请求', calls.length === 1, `calls=${calls.length}`)
check('先到的成功', r1.outcome === 'success' && r1.duplicated === false, JSON.stringify(r1))
check('后到的按失败处理', r2.outcome === 'failure' && r2.duplicated === true, JSON.stringify(r2))
check('后到的有统一提示', r2.message === '该动作正在执行，请勿重复提交', r2.message)

console.log('不同记录的动作互不阻塞：')
calls.length = 0
await Promise.all([
  runModuleAction('alarm', 8, '确认告警'),
  runModuleAction('alarm', 9, '确认告警'),
])
check('两条各发一次', calls.length === 2, `calls=${calls.length}`)

console.log('前一次动作结束后同一动作可再次提交：')
calls.length = 0
await runModuleAction('meter', 1, '确认正常')
await runModuleAction('meter', 1, '确认正常')
check('串行两次都发出', calls.length === 2, `calls=${calls.length}`)

if (failures) {
  console.error(`\n${failures} 项未通过`)
  process.exit(1)
}
console.log('\n全部通过')
