/**
 * 动作执行的公共链路。
 *
 * 收拢前每个页面各写一遍：请求体字段不一致、把 HTTP 200 + ok:false 当成功
 * 刷新、失败时把接口错误吞成空白。收拢后各页面只声明「在哪个接口、对哪条
 * 记录、执行哪个动作、失败兜底说什么」，其余全部由本模块统一生成：
 *
 * 1. 请求体按公共约定构造（兼容后端历史的 values 包裹与平铺 action 两种读法）；
 * 2. 执行结果以「HTTP 成功且响应体 ok 为真」为准，失败不再被当成成功刷新；
 * 3. 成功提示语取后端回执 message，失败优先取后端原因，页面兜底文案只在
 *    接口没给原因时使用（页面里已写好的文案原样传入，不在本模块改写）；
 * 4. 同一条动作在途时再次点击只提交一次，后到的一次按失败处理，并给出同一
 *    份兜底提示；
 * 5. 回执写入 @/stores/receipt 的唯一数据源，列表与详情读到的必然相同。
 */
import { request } from './client'
import { useActionReceiptStore, type ActionReceipt } from '@/stores/receipt'

export interface RunActionOptions {
  /** 模块接口前缀，如 /api/contract。 */
  endpoint: string
  /** 目标记录 id。 */
  entryId: string | number
  /** 页面声明的动作名。 */
  action: string
  /** 页面历史上写好的失败兜底文案，接口未给原因时原样使用，不在此改写。 */
  failureText: string
}

export interface ActionOutcome {
  result: ActionReceipt
}

/** 后端动作接口的响应体约定。 */
interface ActionResultBody {
  ok: boolean
  message: string
  entry?: Record<string, string | number | null> | null
  action?: string | null
  remark?: string | null
}

/** 在途动作：key = `${endpoint}/${id}/${action}`，值为本次提交的 Promise。 */
const inflight = new Map<string, Promise<ActionReceipt>>()

function receiptKey(endpoint: string, entryId: string | number, action: string): string {
  return `${endpoint}/${entryId}/${action}`
}

/** 公共约定的请求体：平铺 action 是历史页面一直在发的字段，继续保留。 */
function buildBody(action: string): string {
  return JSON.stringify({ action, values: { action } })
}

async function execute({ endpoint, entryId, action, failureText }: RunActionOptions): Promise<ActionReceipt> {
  let body: ActionResultBody | null = null
  let ok = false
  let message: string
  try {
    const response = await request(`${endpoint}/${entryId}/actions`, {
      method: 'POST',
      body: buildBody(action),
    })
    if (response.ok) {
      body = (await response.json()) as ActionResultBody
      ok = body.ok === true
      // 后端按约定必给 message；缺失时统一用页面历史兜底文案，绝不留空白。
      message = body.message || failureText
    } else {
      // HTTP 层失败：尽量读出后端 detail；读不到就用页面的历史兜底文案。
      let detail = ''
      try {
        const errorBody = (await response.json()) as { detail?: string }
        detail = typeof errorBody.detail === 'string' ? errorBody.detail : ''
      } catch {
        detail = ''
      }
      message = detail || failureText
    }
  } catch (error) {
    // 网络层失败（request 已包装成「接口请求失败：…」）：不吞错误，统一兜底。
    message = error instanceof Error && error.message ? error.message : failureText
  }

  const receipt: ActionReceipt = {
    endpoint,
    action,
    entryId,
    ok,
    message,
    entry: body?.entry ?? null,
    at: Date.now(),
    duplicated: false,
  }
  useActionReceiptStore().publish(receipt)
  return receipt
}

/**
 * 执行页面声明的动作。
 *
 * 同一条动作（同接口、同记录、同动作名）已有在途请求时，本次点击不再提交，
 * 直接等在途请求结束，并按失败回执处理，提示语与在途请求失败时使用的页面
 * 兜底文案是同一份。
 */
export async function runAction(options: RunActionOptions): Promise<ActionReceipt> {
  const key = receiptKey(options.endpoint, options.entryId, options.action)
  const pending = inflight.get(key)
  if (pending) {
    await pending
    const receipt: ActionReceipt = {
      endpoint: options.endpoint,
      action: options.action,
      entryId: options.entryId,
      ok: false,
      message: options.failureText,
      entry: null,
      at: Date.now(),
      duplicated: true,
    }
    useActionReceiptStore().publish(receipt)
    return receipt
  }

  const task = execute(options).finally(() => {
    inflight.delete(key)
  })
  inflight.set(key, task)
  return task
}

/** 页面重新加载列表时清掉本模块的历史回执。 */
export function clearActionReceipt(endpoint: string): void {
  useActionReceiptStore().clear(endpoint)
}
