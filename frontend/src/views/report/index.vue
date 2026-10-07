<template>
  <section class="page" data-module="report">
    <header class="page-head">
      <div>
        <h2>运行月报管理</h2>
        <p class="page-desc">维护运行月报，围绕月报编号、统计月份、发电量、等效利用小时做登记、筛选与状态流转。</p>
      </div>
      <div class="page-actions">
        <button class="btn primary" type="button" @click="openCreate">登记运行月报</button>
        <button class="btn" type="button" @click="exportRows">导出运行月报清单</button>
      </div>
    </header>

    <div class="stat-row">
      <article v-for="item in stats" :key="item.label" class="stat-card">
        <span class="stat-label">{{ item.label }}</span>
        <strong class="stat-value">{{ item.value }}</strong>
      </article>
    </div>

    <form class="filter-bar" @submit.prevent="reload()">
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
            <button
              v-if="columnIndex === 0"
              class="cell-link"
              type="button"
              @click="openDetail(row)"
            >{{ row[column] ?? '—' }}</button>
            <template v-else>{{ row[column] ?? '—' }}</template>
          </td>
          <td class="row-actions">
            <button
              v-for="action in actions"
              :key="action"
              class="link"
              type="button"
              @click="executeAction(action, row)"
            >
              {{ action }}
            </button>
          </td>
        </tr>
        <tr v-if="!rows.length">
          <td :colspan="columns.length + 1" class="empty-state">暂无运行月报数据，可先登记运行月报</td>
        </tr>
      </tbody>
    </table>

    <footer class="page-foot">
      <span>共 {{ total }} 条运行月报记录</span>
      <span v-if="listError" class="error-text">{{ listError }}</span>
      <ReceiptNotice v-else :receipt="receipt" />
    </footer>

    <DetailDrawer
      :row="detailRow"
      :columns="columns"
      :actions="actions"
      :receipt="receipt"
      @close="closeDetail"
      @run="(action: string) => detailRow && executeAction(action, detailRow)"
    />
  </section>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'

import DetailDrawer from '@/components/DetailDrawer.vue'
import ReceiptNotice from '@/components/ReceiptNotice.vue'
import { useModulePage } from '@/composables/useModulePage'
import { publishHint } from '@/stores/receipt'

type Row = Record<string, string | number | null>

const ENDPOINT = '/api/report'
const columns = ["月报编号", "统计月份", "发电量", "等效利用小时", "综合效率PR", "设备可利用率", "故障停机时间", "月报状态"]
const actions = ["填写月报", "提交审核", "发布月报"]
const statuses = ["待填写", "已填写", "已审核", "已发布"]
const stats = [{"label": "当月发电量", "value": 0}, {"label": "当月PR值", "value": 0}, {"label": "待填月报数", "value": 0}]
const filterFields = columns.slice(0, 3)

const {
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
} = useModulePage({
  endpoint: ENDPOINT,
  listReadFailure: '运行月报列表读取失败',
  listCatchFailure: '运行月报列表读取失败',
  actionFailure: '运行月报动作未生效，请稍后重试',
})

function exportRows() {
  window.open(`${ENDPOINT}/export`, '_blank')
}

function openCreate() {
  // 登记入口未接入审批流时的提示沿用历史文案；它不是动作接口，提示也落到
  // 与列表/详情同一份回执数据源。
  publishHint(ENDPOINT, '运行月报登记入口尚未接入审批流')
}

onMounted(() => reload())
</script>
