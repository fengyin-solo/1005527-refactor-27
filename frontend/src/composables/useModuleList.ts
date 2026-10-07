/**
 * 列表页公共装配：把原来散落在 18 个页面里的加载、筛选、动作与提示逻辑收成一份。
 *
 * 页面只提供模块 key、列定义、动作名以及页面自己的既有文案；
 * 动作走公共链路，回执从 receipt store 读，列表与详情拿到的必然一致。
 */
import { computed, onMounted, ref } from 'vue'

import { runModuleAction, type RowId } from '@/api/action'
import { request } from '@/api/client'
import { moduleMeta, type ModuleKey } from '@/api/modules'
import { useActionReceiptStore, type ActionReceipt } from '@/stores/receipt'

export interface ListCopy {
  /** 列表读取失败时的页面原文案（保持各页面既有措辞，不在公共层改写）。 */
  listLoadFailed: string
}

export function useModuleList(moduleKey: ModuleKey, columns: string[], copy: ListCopy) {
  const meta = moduleMeta(moduleKey)
  const receiptStore = useActionReceiptStore()

  type Row = Record<string, string | number | null>

  const rows = ref<Row[]>([])
  const total = ref(0)
  const loadError = ref('')
  /** 非动作类的页面通知（如登记入口未接入的原文案）。 */
  const pageNotice = ref('')
  const filters = ref<Record<string, string>>({})
  /** 默认按前三列做筛选，沿用原有页面约定。 */
  const filterFields = columns.slice(0, 3)

  /** 当前列表最近一条动作回执：跨页查看单条详情时仍以 store 中的那一份为准。 */
  const latestReceipt = ref<ActionReceipt | null>(null)

  async function reload() {
    loadError.value = ''
    pageNotice.value = ''
    const query = new URLSearchParams(filters.value as Record<string, string>).toString()
    try {
      const response = await request(`${meta.endpoint}?${query}`)
      if (!response.ok) {
        throw new Error(copy.listLoadFailed)
      }
      const payload = (await response.json()) as {
        items?: Row[]
        total?: number
      }
      rows.value = payload.items ?? []
      total.value = payload.total ?? rows.value.length
    } catch (error) {
      loadError.value = error instanceof Error && error.message ? error.message : copy.listLoadFailed
    }
  }

  function resetFilters() {
    filters.value = {}
    void reload()
  }

  /** 页面顶部「登记」按钮的原有提示：不接动作链路，仅保留既有交互。 */
  function notify(message: string) {
    pageNotice.value = message
  }

  /**
   * 执行动作：公共链路负责请求体、结果判定、并发去重与兜底提示；
   * 成功才刷新列表（与原交互一致），失败只回执提示、绝不刷新成“成功”。
   */
  async function runAction(action: string, row: Row) {
    const entryId = (row.id ?? '') as RowId
    const receipt = await runModuleAction(moduleKey, entryId, action)
    latestReceipt.value = receipt
    if (receipt.outcome === 'success') {
      await reload()
      // reload 只负责列表读取，不能覆盖动作回执提示。
      latestReceipt.value = receiptStore.receiptOf(moduleKey, entryId)
    }
  }

  function receiptOf(row: Row) {
    return receiptStore.receiptOf(moduleKey, (row.id ?? '') as RowId)
  }

  const footerMessage = computed(() => {
    if (latestReceipt.value) {
      return {
        text: latestReceipt.value.message,
        tone: latestReceipt.value.outcome === 'success' ? ('success' as const) : ('error' as const),
      }
    }
    if (pageNotice.value) {
      return { text: pageNotice.value, tone: 'error' as const }
    }
    return loadError.value ? { text: loadError.value, tone: 'error' as const } : null
  })

  onMounted(reload)

  return {
    rows,
    total,
    filters,
    filterFields,
    reload,
    resetFilters,
    notify,
    runAction,
    receiptOf,
    footerMessage,
  }
}
