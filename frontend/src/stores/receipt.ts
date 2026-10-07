/**
 * 动作回执的唯一数据源。
 *
 * 所有页面的动作按钮都只把动作名交给公共链路（@/api/action），执行结果
 * （成功/失败、提示语、目标记录、时间戳）统一落到这里。列表页脚与详情抽屉
 * 都只从这份状态读提示，保证两处看到的回执必然一致，页面不再各自维护一套
 * 成功失败文案。
 */
import { defineStore } from 'pinia'

/** 一次动作执行的公共回执：请求动作、执行结果与提示语都在这一份结构里。 */
export interface ActionReceipt {
  /** 所属模块的接口前缀，如 /api/contract。 */
  endpoint: string
  /** 页面声明的动作名，如「确认签订」。 */
  action: string
  /** 目标记录 id。 */
  entryId: string | number
  /** 公共链路判定的执行结果；并发重复提交的后到请求按失败处理。 */
  ok: boolean
  /** 给用户看的提示语：成功取后端回执，失败优先取后端原因再走页面兜底文案。 */
  message: string
  /** 后端回执里带回的记录快照；失败时可能为 null。 */
  entry: Record<string, string | number | null> | null
  /** 同一次提交的时间标识，供列表与详情定位「最新一条」。 */
  at: number
  /** 这一条是否是并发重复提交被拦下后生成的失败回执。 */
  duplicated: boolean
}

interface ReceiptState {
  /** 每个模块保留最新一条回执；key 为接口前缀。 */
  latest: Record<string, ActionReceipt>
}

export const useActionReceiptStore = defineStore('action-receipt', {
  state: (): ReceiptState => ({
    latest: {},
  }),
  getters: {
    /** 按模块取最新回执；模块尚无动作时为 null。 */
    receiptOf: (state) => (endpoint: string): ActionReceipt | null =>
      state.latest[endpoint] ?? null,
  },
  actions: {
    /** 公共链路执行完动作后，把回执写到唯一数据源。 */
    publish(receipt: ActionReceipt) {
      this.latest[receipt.endpoint] = receipt
    },
    /** 重新加载列表等场景清空模块提示，避免旧回执误导。 */
    clear(endpoint: string) {
      delete this.latest[endpoint]
    },
  },
})

/**
 * 发布一条纯提示（不经过动作接口的场景，如「登记入口尚未接入审批流」）。
 * 提示同样进入回执的唯一数据源，列表页脚与详情抽屉读到的口径一致。
 */
export function publishHint(endpoint: string, message: string): ActionReceipt {
  const receipt: ActionReceipt = {
    endpoint,
    action: '',
    entryId: '',
    ok: false,
    message,
    entry: null,
    at: Date.now(),
    duplicated: false,
  }
  useActionReceiptStore().publish(receipt)
  return receipt
}
