<template>
  <section class="page" :data-module="moduleKey">
    <header class="page-head">
      <div>
        <h2>{{ meta?.name ?? '业务详情' }}</h2>
        <p class="page-desc">单条记录明细与可执行动作；提示语与列表页来自同一份动作回执。</p>
      </div>
      <div class="page-actions">
        <RouterLink class="btn" :to="listPath">返回列表</RouterLink>
      </div>
    </header>

    <p v-if="!valid" class="error-text">详情地址不正确，找不到对应模块。</p>
    <template v-else>
      <table class="data-table" v-if="entry">
        <tbody>
          <tr v-for="(value, key) in detailFields" :key="key">
            <th>{{ key }}</th>
            <td>{{ value ?? '—' }}</td>
          </tr>
        </tbody>
      </table>
      <p v-else-if="loadError" class="error-text">{{ loadError }}</p>

      <!-- 动作按钮与列表页同构、同名，仍在页面上就地排布，只是执行链路换成公共约定 -->
      <div v-if="entry" class="detail-actions">
        <button
          v-for="action in actions"
          :key="action"
          class="btn"
          type="button"
          @click="runAction(action)"
        >
          {{ action }}
        </button>
      </div>

      <footer class="page-foot">
        <span>{{ meta?.name }} #{{ entryId }}</span>
        <!-- 详情与列表读到的是 store 里同一条回执，文案逐字一致 -->
        <span v-if="receipt" :class="receipt.outcome === 'success' ? 'success-text' : 'error-text'">
          {{ receipt.message }}
        </span>
        <span v-else-if="loadError" class="error-text">{{ loadError }}</span>
      </footer>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { MODULE_LIST } from '@/api/module-config'
import { useModuleDetail } from '@/composables/useModuleDetail'

const { moduleKey, entryId, valid, meta, entry, loadError, receipt, listPath, runAction } =
  useModuleDetail()

/** 各模块的列与动作仍由一份公共配置声明，页面不再各写一遍。 */
const moduleConfig = computed(() => MODULE_LIST.find((item) => item.key === moduleKey.value))
const actions = computed(() => moduleConfig.value?.actions ?? [])

/** 明细字段：按模块列定义展示，再补上状态流转用的内部字段。 */
const detailFields = computed<Record<string, unknown>>(() => {
  if (!entry.value) {
    return {}
  }
  const fields: Record<string, unknown> = { 记录ID: entry.value.id }
  for (const column of moduleConfig.value?.columns ?? []) {
    fields[column] = entry.value[column]
  }
  if ('status' in entry.value) {
    fields.当前状态 = entry.value.status
  }
  if ('pending' in entry.value) {
    fields.待处理 = entry.value.pending ? '是' : '否'
  }
  if ('abnormal' in entry.value) {
    fields.异常标记 = entry.value.abnormal ? '是' : '否'
  }
  return fields
})
</script>

<style scoped>
.detail-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}
.detail-actions .btn {
  color: var(--brand);
}
</style>
