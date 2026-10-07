/**
 * 业务模块列表页的公共逻辑。
 *
 * 页面只声明自己的模块接口、字段列、动作名与历史文案（登记入口提示、列表
 * 读取失败、动作失败兜底），其余行为全部复用本组合式函数：
 * - 动作执行走 @/api/action 的公共链路，页面不再自行 try/catch 吞错误；
 * - 动作回执来自 @/stores/receipt 的唯一数据源，列表页脚和详情抽屉读同一份；
 * - 动作成功后刷新列表，失败不刷新，避免「把失败当成功」；
 * - 动作命中的记录会在详情抽屉里展开，抽屉与列表行共用同一组动作按钮。
 */
import { computed, ref } from 'vue'

import { clearActionReceipt, runAction as runActionRequest } from '@/api/action'
import { request } from '@/api/client'
import { useActionReceiptStore } from '@/stores/receipt'

export type Row = Record<string, string | number | null>

interface UseModulePageOptions {
  /** 模块接口前缀，如 /api/contract。 */
  endpoint: string
  /** 列表读取失败时页面历史上写好的提示（response 非 2xx 时抛出的那句）。 */
  listReadFailure: string
  /** 列表读取异常兜底文案（catch 分支那句，个别模块与上面不同）。 */
  listCatchFailure: string
  /** 动作失败时页面历史上写好的兜底文案，公共链路在接口没给原因时原样使用。 */
  actionFailure: string
}

export function useModulePage(options: UseModulePageOptions) {
  const { endpoint } = options
  const receiptStore = useActionReceiptStore()

  const rows = ref<Row[]>([])
  const total = ref(0)
  const filters = ref<Record<string, string>>({})
  const listError = ref('')
  const detailRow = ref<Row | null>(null)

  /** 列表与详情共用的动作回执：两处都从 store 这一处读。 */
  const receipt = computed(() => receiptStore.receiptOf(endpoint))

  async function reload(keepReceipt = false) {
    if (!keepReceipt) {
      clearActionReceipt(endpoint)
    }
    listError.value = ''
    const query = new URLSearchParams(filters.value as Record<string, string>).toString()
    try {
      const response = await request(`${endpoint}?${query}`)
      if (!response.ok) {
        throw new Error(options.listReadFailure)
      }
      const payload = (await response.json()) as { items?: Row[]; total?: number }
      rows.value = payload.items ?? []
      total.value = payload.total ?? rows.value.length
      // 详情抽屉若正开着，用刷新后的同一行数据回填，仍展示同一条动作回执。
      if (detailRow.value) {
        detailRow.value = rows.value.find((row) => String(row.id) === String(detailRow.value?.id)) ?? detailRow.value
      }
    } catch (error) {
      listError.value = error instanceof Error ? error.message : options.listCatchFailure
    }
  }

  function resetFilters() {
    filters.value = {}
    void reload()
  }

  function openDetail(row: Row) {
    detailRow.value = row
  }

  function closeDetail() {
    detailRow.value = null
  }

  async function executeAction(action: string, row: Row) {
    const result = await runActionRequest({
      endpoint,
      entryId: row.id ?? '',
      action,
      failureText: options.actionFailure,
    })
    if (result.ok) {
      // 只有公共链路判定成功才刷新；失败保持原列表，不再误刷新。
      detailRow.value = row
      await reload(true)
    } else {
      // 失败也把详情停在目标记录上，让详情处能读到同一份失败回执。
      detailRow.value = result.entry ?? row
    }
    return result
  }

  return {
    rows,
    total,
    filters,
    listError,
    receipt,
    detailRow,
    reload,
    resetFilters,
    openDetail,
    closeDetail,
    executeAction,
  }
}
