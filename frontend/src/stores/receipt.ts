/**
 * 动作回执：一条公共约定，列表与详情读到的永远是同一份记录。
 *
 * 数据放在 Pinia store 里而不是页面局部状态：同一条记录在列表页执行动作后，
 * 打开详情（或反过来）看到的提示语与执行结果必须一致，因此只能有一份真相。
 */
import { defineStore } from 'pinia'

export type ActionOutcome = 'success' | 'failure'

export interface ActionReceipt {
  /** 业务模块，与接口前缀对应，如 pv_array。 */
  module: string
  /** 动作目标记录 id，字符串化后与 id 拼接成回执键。 */
  entryId: number | string
  /** 页面声明的动作名，如「降功率运行」。 */
  action: string
  outcome: ActionOutcome
  /** 提示语：成功取后端 ActionResult.message；失败取后端说明或公共兜底。 */
  message: string
  /** 后端返回的最新记录（成功时可能携带），用于列表/详情就地核对。 */
  entry: Record<string, unknown> | null
  /** 标记这次失败是并发重复点击被公共链路拦下的。 */
  duplicated: boolean
  at: number
}

function receiptKey(module: string, entryId: number | string): string {
  return `${module}:${entryId}`
}

interface ReceiptState {
  receipts: Record<string, ActionReceipt>
}

export const useActionReceiptStore = defineStore('action-receipt', {
  state: (): ReceiptState => ({
    receipts: {},
  }),
  getters: {
    /** 读取某条记录最近一次动作回执；列表与详情共用这一入口。 */
    receiptOf: (state) => (module: string, entryId: number | string) =>
      state.receipts[receiptKey(module, entryId)] ?? null,
  },
  actions: {
    /** 公共链路只通过这里落回执，任何页面都不允许各自写提示。 */
    record(receipt: Omit<ActionReceipt, 'at'>): ActionReceipt {
      const saved: ActionReceipt = { ...receipt, at: Date.now() }
      this.receipts[receiptKey(saved.module, saved.entryId)] = saved
      return saved
    },
  },
})
