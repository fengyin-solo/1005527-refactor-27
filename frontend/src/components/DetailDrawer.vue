<template>
  <!-- 详情抽屉：动作结果驱动详情处的提示，回执与列表页脚读的是同一份状态。 -->
  <div v-if="row" class="drawer-mask" @click.self="$emit('close')">
    <aside class="drawer" data-role="detail-drawer">
      <header class="drawer-head">
        <strong>记录详情</strong>
        <button class="btn ghost" type="button" @click="$emit('close')">关闭</button>
      </header>

      <dl class="detail-grid">
        <template v-for="column in columns" :key="column">
          <dt>{{ column }}</dt>
          <dd>{{ row[column] ?? '—' }}</dd>
        </template>
      </dl>

      <!-- 动作按钮与列表行同位置、同交互：同样声明一份 actions，走同一条公共链路。 -->
      <div class="detail-actions">
        <button
          v-for="action in actions"
          :key="action"
          class="link"
          type="button"
          @click="$emit('run', action)"
        >
          {{ action }}
        </button>
      </div>

      <footer class="drawer-foot">
        <ReceiptNotice :receipt="receipt" />
      </footer>
    </aside>
  </div>
</template>

<script setup lang="ts">
import ReceiptNotice from './ReceiptNotice.vue'
import type { Row } from '@/composables/useModulePage'

defineProps<{
  row: Row | null
  columns: string[]
  actions: string[]
  receipt: import('@/stores/receipt').ActionReceipt | null
}>()

defineEmits<{
  (e: 'close'): void
  (e: 'run', action: string): void
}>()
</script>
