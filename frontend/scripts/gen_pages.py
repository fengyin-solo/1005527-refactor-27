"""按公共骨架重新生成 18 个模块页面。

页面里写死的业务文案（标题、描述、按钮、空状态、页脚、登记入口提示、
列表读取失败、动作失败兜底）全部从原文件正则提取，原样回填，不改文案；
只把「请求体、执行结果、提示语」的重复实现换成公共链路声明。
"""
import re
import pathlib

VIEWS = pathlib.Path(__file__).resolve().parents[1] / 'src' / 'views'

TEMPLATE = '''<template>
  <section class="page" data-module="__MODULE__">
    <header class="page-head">
      <div>
        <h2>__H2__</h2>
        <p class="page-desc">__DESC__</p>
      </div>
      <div class="page-actions">
        <button class="btn primary" type="button" @click="openCreate">__CREATE_BTN__</button>
        <button class="btn" type="button" @click="exportRows">__EXPORT_BTN__</button>
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
          <td :colspan="columns.length + 1" class="empty-state">__EMPTY__</td>
        </tr>
      </tbody>
    </table>

    <footer class="page-foot">
      <span>__FOOT_TOTAL_LEFT__ {{ total }} __FOOT_TOTAL_RIGHT__</span>
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

const ENDPOINT = '__ENDPOINT__'
const columns = __COLUMNS__
const actions = __ACTIONS__
const statuses = __STATUSES__
const stats = __STATS__
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
  listReadFailure: '__LIST_READ_FAILURE__',
  listCatchFailure: '__LIST_CATCH_FAILURE__',
  actionFailure: '__ACTION_FAILURE__',
})

function exportRows() {
  window.open(`${ENDPOINT}/export`, '_blank')
}

function openCreate() {
  // 登记入口未接入审批流时的提示沿用历史文案；它不是动作接口，提示也落到
  // 与列表/详情同一份回执数据源。
  publishHint(ENDPOINT, '__OPEN_CREATE__')
}

onMounted(() => reload())
</script>
'''


def extract(text: str, pattern: str, name: str, module: str) -> str:
    m = re.search(pattern, text, re.S)
    if not m:
        raise SystemExit(f'{module}: missing {name}')
    return m.group(1).strip()


def main() -> None:
    for view_dir in sorted(p for p in VIEWS.iterdir() if p.is_dir()):
        module = view_dir.name
        source = (view_dir / 'index.vue').read_text(encoding='utf-8')

        endpoint = extract(source, r"const ENDPOINT = '([^']+)'", 'endpoint', module)
        columns = extract(source, r'const columns = (\[.*?\])', 'columns', module)
        actions = extract(source, r'const actions = (\[.*?\])', 'actions', module)
        statuses = extract(source, r'const statuses = (\[.*?\])', 'statuses', module)
        stats = extract(source, r'const stats = (\[.*?\])', 'stats', module)
        h2 = extract(source, r'<h2>(.*?)</h2>', 'h2', module)
        desc = extract(source, r'<p class="page-desc">(.*?)</p>', 'desc', module)
        create_btn = extract(source, r'class="btn primary" type="button" @click="openCreate">(.*?)</button>', 'create_btn', module)
        export_btn = extract(source, r'class="btn" type="button" @click="exportRows">(.*?)</button>', 'export_btn', module)
        empty = extract(source, r'class="empty-state">(.*?)</td>', 'empty', module)
        foot = extract(source, r'<span>共 \{\{ total \}\} 条(.*?)记录</span>', 'foot', module)
        open_create = extract(source, r"function openCreate\(\) \{\n\s*errorMessage\.value = '(.*?)'\n\s*\}", 'open_create', module)
        action_failure = extract(source, r"throw new Error\('(.*?)'\)\n\s*\}\n\s*await reload\(\)", 'action_failure', module)
        list_read_failure = extract(
            source,
            r"const response = await request\(`\$\{ENDPOINT\}\?\$\{query\}`\)\n\s*if \(!response\.ok\) \{\n\s*throw new Error\('(.*?)'\)",
            'list_read_failure', module,
        )
        list_catch_failure = extract(
            source,
            r"total\.value = payload\.total \?\? rows\.value\.length\n\s*\} catch \(error\) \{\n"
            r"\s*errorMessage\.value = error instanceof Error \? error\.message : '(.*?)'\n\s*\}",
            'list_catch_failure', module,
        )

        out = TEMPLATE
        replacements = {
            '__MODULE__': module,
            '__MODULE_CLASS__': ''.join(part.capitalize() for part in module.split('_')) + 'Page',
            '__H2__': h2,
            '__DESC__': desc,
            '__CREATE_BTN__': create_btn,
            '__EXPORT_BTN__': export_btn,
            '__EMPTY__': empty,
            '__FOOT_TOTAL_LEFT__': '共',
            '__FOOT_TOTAL_RIGHT__': f'条{foot}记录',
            '__ENDPOINT__': endpoint,
            '__COLUMNS__': columns,
            '__ACTIONS__': actions,
            '__STATUSES__': statuses,
            '__STATS__': stats,
            '__LIST_READ_FAILURE__': list_read_failure,
            '__LIST_CATCH_FAILURE__': list_catch_failure,
            '__ACTION_FAILURE__': action_failure,
            '__OPEN_CREATE__': open_create,
        }
        for key, value in replacements.items():
            out = out.replace(key, value)
        (view_dir / 'index.vue').write_text(out, encoding='utf-8')
        print('generated:', module)


if __name__ == '__main__':
    main()
