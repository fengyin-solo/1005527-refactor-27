/**
 * 动作执行公共链路：请求体、执行结果与提示语都由这一份约定生成。
 *
 * - 页面只声明动作名（`runModuleAction(moduleKey, entryId, '降功率运行')`）；
 * - 请求体统一打包：规范字段放在 values.action，同时保留历史的顶层 action 字段，
 *   兼容既有调用方与后端的旧解析口径；
 * - 成功以业务结果 ActionResult.ok 为准（HTTP 200 但 ok=false 一律按失败处理，
 *   不再“失败当成功刷新”），失败时由公共链路统一兜底，页面不允许吞错误；
 * - 同一条记录的动作在途时，并发的第二次提交不再发请求，直接按失败回执处理，
 *   两次拿到的是同一份提示语；
 * - 回执只写进 action receipt store，列表与详情从同一个入口读取。
 */
import { moduleMeta, type ModuleKey } from '@/api/modules'
import { request } from '@/api/client'
import { useActionReceiptStore, type ActionReceipt } from '@/stores/receipt'

export type RowId = number | string

interface ActionResultPayload {
  ok?: unknown
  message?: unknown
  entry?: unknown
}

/** 公共兜底提示：与各页面原有措辞保持同一口径，不覆盖后端给出的可读说明。 */
const FALLBACK_MESSAGES = {
  /** 并发重复提交时两次调用看到同一份提示。 */
  duplicated: '该动作正在执行，请勿重复提交',
  /** 后端判定动作不允许（HTTP 正常但业务失败且没给说明）。 */
  rejected: '动作未生效，请稍后重试',
  /** HTTP 非 2xx 或响应体无法解析。 */
  http: (name: string) => `${name}动作未生效，请稍后重试`,
  /** 网络层失败（请求未送达等）。 */
  network: (name: string) => `${name}操作失败，请检查网络后重试`,
} as const

/**
 * 在途动作登记：key 为 `模块:记录id`。
 * 模块级单例，列表页与详情页同时挂载时也共享同一张在途表。
 */
const pending = new Set<string>()

function inflightKey(moduleKey: string, entryId: RowId): string {
  return `${moduleKey}:${entryId}`
}

/** 公共约定生成请求体：values.action 为规范字段，顶层 action 为历史兼容字段。 */
export function buildActionBody(action: string): Record<string, unknown> {
  return {
    values: { action },
    action,
  }
}

function toFailure(
  receipt: Omit<ActionReceipt, 'outcome' | 'duplicated' | 'at'> & { duplicated?: boolean },
): ActionReceipt {
  const store = useActionReceiptStore()
  return store.record({ ...receipt, outcome: 'failure', duplicated: receipt.duplicated ?? false })
}

/**
 * 执行模块动作并落一份回执。
 *
 * @returns 落库后的动作回执；调用方按 receipt.outcome 决定是否刷新列表/详情。
 */
export async function runModuleAction(
  moduleKey: ModuleKey,
  entryId: RowId,
  action: string,
): Promise<ActionReceipt> {
  const meta = moduleMeta(moduleKey)
  const key = inflightKey(moduleKey, entryId)

  // 并发点两次（或列表与详情同时点）：只放行第一次，后到的按失败处理。
  if (pending.has(key)) {
    return toFailure({
      module: moduleKey,
      entryId,
      action,
      message: FALLBACK_MESSAGES.duplicated,
      entry: null,
      duplicated: true,
    })
  }
  pending.add(key)
  try {
    let response: Response
    try {
      response = await request(`${meta.endpoint}/${entryId}/actions`, {
        method: 'POST',
        body: JSON.stringify(buildActionBody(action)),
      })
    } catch (error) {
      // 网络错误统一兜底，不再把异常抛给页面各自处理。
      const detail = error instanceof Error ? error.message : ''
      return toFailure({
        module: moduleKey,
        entryId,
        action,
        message: detail || FALLBACK_MESSAGES.network(meta.name),
        entry: null,
      })
    }

    let payload: ActionResultPayload | null = null
    try {
      payload = (await response.json()) as ActionResultPayload
    } catch {
      payload = null
    }

    if (!response.ok) {
      const serverMessage =
        (payload && typeof payload.message === 'string' && payload.message) ||
        (payload && typeof (payload as { detail?: unknown }).detail === 'string'
          ? String((payload as { detail: unknown }).detail)
          : '')
      return toFailure({
        module: moduleKey,
        entryId,
        action,
        message: serverMessage || FALLBACK_MESSAGES.http(meta.name),
        entry: null,
      })
    }

    // HTTP 成功后必须再看业务结果：ok=false 一律是失败，不能刷新成“成功”。
    if (!payload || payload.ok !== true) {
      const message =
        (payload && typeof payload.message === 'string' && payload.message) ||
        FALLBACK_MESSAGES.rejected
      return toFailure({
        module: moduleKey,
        entryId,
        action,
        message,
        entry: null,
      })
    }

    const store = useActionReceiptStore()
    return store.record({
      module: moduleKey,
      entryId,
      action,
      outcome: 'success',
      message: typeof payload.message === 'string' && payload.message ? payload.message : `${meta.name}已${action}`,
      entry: payload.entry && typeof payload.entry === 'object'
        ? (payload.entry as Record<string, unknown>)
        : null,
      duplicated: false,
    })
  } finally {
    pending.delete(key)
  }
}
