<template>
  <ModuleListPage :config="config" :stats="stats" />
</template>

<script setup lang="ts">
import ModuleListPage from '@/views/ModuleListPage.vue'
import { MODULE_CONFIGS } from '@/api/module-config'

const config = MODULE_CONFIGS.alarm
const stats = [{"label": "未确认告警", "value": 0}, {"label": "今日新增告警", "value": 0}, {"label": "未消除告警", "value": 0}]
</script>
