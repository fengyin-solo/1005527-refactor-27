<template>
  <!-- 动作回执提示：列表页脚与详情抽屉渲染的是同一处状态，文案口径唯一。 -->
  <span v-if="receipt" :class="['receipt-text', receipt.ok ? 'success-text' : 'error-text']" data-role="action-receipt">
    {{ receipt.message }}
  </span>
</template>

<script setup lang="ts">
import type { ActionReceipt } from '@/stores/receipt'

defineProps<{
  receipt: ActionReceipt | null
}>()
</script>
