/**
 * 详情页公共装配：与列表页共用同一条动作链路与同一份回执。
 */
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

import { runModuleAction } from '@/api/action'
import { request } from '@/api/client'
import { isModuleKey, moduleMeta } from '@/api/modules'
import { useActionReceiptStore, type ActionReceipt } from '@/stores/receipt'

type Entry = Record<string, string | number | boolean | null>

export function useModuleDetail() {
  const route = useRoute()
  const receiptStore = useActionReceiptStore()

  const moduleKey = computed(() => String(route.params.module ?? ''))
  const entryId = computed(() => String(route.params.id ?? ''))
  const valid = computed(() => isModuleKey(moduleKey.value))
  const meta = computed(() => (valid.value ? moduleMeta(moduleKey.value) : null))

  const entry = ref<Entry | null>(null)
  const loadError = ref('')
  const receipt = ref<ActionReceipt | null>(null)

  /** 回执统一从 store 取：详情打开时与列表看到的是同一条。 */
  function syncReceipt() {
    receipt.value = receiptStore.receiptOf(moduleKey.value, entryId.value)
  }

  async function loadEntry() {
    loadError.value = ''
    if (!isModuleKey(moduleKey.value) || !entryId.value) {
      loadError.value = '详情地址不正确，找不到对应模块'
      entry.value = null
      return
    }
    const current = moduleMeta(moduleKey.value)
    try {
      const response = await request(`${current.endpoint}/${entryId.value}`)
      if (!response.ok) {
        loadError.value = `${current.name}详情读取失败`
        entry.value = null
        syncReceipt()
        return
      }
      entry.value = (await response.json()) as Entry
    } catch (error) {
      loadError.value =
        error instanceof Error && error.message ? error.message : `${current.name}详情读取失败`
      entry.value = null
    }
    syncReceipt()
  }

  /**
   * 详情页动作：与列表走同一条公共链路。
   * 页面只声明动作名；成功后刷新明细，失败不刷新、只看统一回执。
   */
  async function runAction(action: string) {
    const key = moduleKey.value
    if (!isModuleKey(key)) {
      return
    }
    const saved = await runModuleAction(key, entryId.value, action)
    receipt.value = saved
    if (saved.outcome === 'success') {
      await loadEntry()
    }
  }

  // 仅在路由指向的记录变化时重新加载；动作结果不触发重复请求。
  watch([moduleKey, entryId], () => void loadEntry(), { immediate: true })

  return {
    moduleKey,
    entryId,
    valid,
    meta,
    entry,
    loadError,
    receipt,
    listPath: computed(() => `/${moduleKey.value}`),
    runAction,
  }
}
