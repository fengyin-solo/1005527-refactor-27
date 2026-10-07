<template>
  <section class="page" :data-module="config.key">
    <header class="page-head">
      <div>
        <h2>{{ config.title }}</h2>
        <p class="page-desc">{{ config.description }}</p>
      </div>
      <div class="page-actions">
        <!-- 顶部按钮位置与交互保持原样：登记仍提示未接入，导出仍开新窗口 -->
        <button class="btn primary" type="button" @click="openCreate">{{ config.createLabel }}</button>
        <button class="btn" type="button" @click="exportRows">{{ config.exportLabel }}</button>
      </div>
    </header>

    <div class="stat-row">
      <article v-for="item in stats" :key="item.label" class="stat-card">
        <span class="stat-label">{{ item.label }}</span>
        <strong class="stat-value">{{ item.value }}</strong>
      </article>
    </div>

    <form class="filter-bar" @submit.prevent="reload">
      <label v-for="field in filterFields" :key="field" class="filter-item">
        <span>{{ field }}</span>
        <input v-model="filters[field]" :placeholder="`按${field}检索`" />
      </label>
      <button class="btn" type="submit">查询</button>
      <button class="btn ghost" type="button" @click="resetFilters">重置条件</button>
    </form>

    <table class="data-table">
      <thead>
        <tr>
          <th v-for="column in columns" :key="column">{{ column }}</th>
          <th>可执行动作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="String(row.id)">
          <td v-for="(column, columnIndex) in columns" :key="column">
            <!-- 第一列编号链接到详情；位置不变，只是文字可点 -->
            <RouterLink
              v-if="columnIndex === 0"
              class="link"
              :to="`/module/${config.key}/${row.id}`"
            >{{ row[column] ?? '—' }}</RouterLink>
            <template v-else>{{ row[column] ?? '—' }}</template>
          </td>
          <td class="row-actions">
            <!-- 动作按钮仍逐行就地排布，页面只声明动作名，执行走公共链路 -->
            <button
              v-for="action in config.actions"
              :key="action"
              class="link"
              type="button"
              @click="runAction(action, row)"
            >
              {{ action }}
            </button>
          </td>
        </tr>
        <tr v-if="!rows.length">
          <td :colspan="columns.length + 1" class="empty-state">{{ config.emptyText }}</td>
        </tr>
      </tbody>
    </table>

    <!-- 逐行回执：某条记录动作后的提示挂在该行，与详情读到同一条 -->
    <ul v-if="rowReceipts.length" class="receipt-list">
      <li v-for="item in rowReceipts" :key="item.key">
        <RouterLink class="link" :to="`/module/${config.key}/${item.key}`">#{{ item.key }}</RouterLink>
        <span :class="item.receipt.outcome === 'success' ? 'success-text' : 'error-text'">
          {{ item.receipt.message }}
        </span>
      </li>
    </ul>

    <footer class="page-foot">
      <span>共 {{ total }} 条{{ config.recordNoun }}</span>
      <!-- 最近一次动作结果驱动列表提示；与详情读同一 store，文案逐字一致 -->
      <span v-if="footerMessage" :class="footerMessage.tone === 'success' ? 'success-text' : 'error-text'">
        {{ footerMessage.text }}
      </span>
    </footer>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { type ModuleConfig } from '@/api/module-config'
import { useModuleList } from '@/composables/useModuleList'
import { useActionReceiptStore } from '@/stores/receipt'

const props = defineProps<{ config: ModuleConfig; stats: Array<{ label: string; value: number }> }>()

const receiptStore = useActionReceiptStore()
const { rows, total, filters, filterFields, reload, resetFilters, notify, runAction, footerMessage } =
  useModuleList(props.config.key, props.config.columns, { listLoadFailed: props.config.listLoadFailed })

const columns = computed(() => props.config.columns)

function exportRows() {
  window.open(`${props.config.endpoint}/export`, '_blank')
}

function openCreate() {
  // 沿用每个页面原有的登记入口提示，文案不动。
  notify(props.config.createPendingMessage)
}

/** 当前列表数据中已有动作回执的记录；提示直接来自公共回执 store。 */
const rowReceipts = computed(() =>
  rows.value
    .map((row) => {
      const id = String(row.id ?? '')
      return { key: id, receipt: receiptStore.receiptOf(props.config.key, id) }
    })
    .filter((item): item is { key: string; receipt: NonNullable<ReturnType<typeof receiptStore.receiptOf>> } =>
      Boolean(item.receipt)),
)
</script>
