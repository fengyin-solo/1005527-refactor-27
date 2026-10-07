<template>
  <section class="page" data-module="combiner_box">
    <header class="page-head">
      <div>
        <h2>汇流箱检测管理</h2>
        <p class="page-desc">维护汇流箱，围绕汇流箱编号、所属阵列、输入路数、熔断器状态做登记、筛选与状态流转。</p>
      </div>
      <div class="page-actions">
        <button class="btn primary" type="button" @click="openCreate">登记汇流箱</button>
        <button class="btn" type="button" @click="exportRows">导出汇流箱检测清单</button>
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
          <td :colspan="columns.length + 1" class="empty-state">暂无汇流箱检测数据，可先登记汇流箱</td>
        </tr>
      </tbody>
    </table>

    <footer class="page-foot">
      <span>共 {{ total }} 条汇流箱检测记录</span>
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

const ENDPOINT = '/api/combiner_box'
const columns = ["汇流箱编号", "所属阵列", "输入路数", "熔断器状态", "防雷模块状态", "通讯状态", "箱体温度", "运行状态"]
const actions = ["恢复正常", "标记异常", "停用设备"]
const statuses = ["运行正常", "熔断器异常", "通讯中断", "已停用"]
const stats = [{"label": "正常运行数", "value": 0}, {"label": "异常汇流箱", "value": 0}, {"label": "停用设备数", "value": 0}]
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
  listReadFailure: '汇流箱列表读取失败',
  listCatchFailure: '汇流箱检测列表读取失败',
  actionFailure: '汇流箱检测动作未生效，请稍后重试',
})

function exportRows() {
  window.open(`${ENDPOINT}/export`, '_blank')
}

function openCreate() {
  // 登记入口未接入审批流时的提示沿用历史文案；它不是动作接口，提示也落到
  // 与列表/详情同一份回执数据源。
  publishHint(ENDPOINT, '汇流箱登记入口尚未接入审批流')
}

onMounted(() => reload())
</script>
