<template>
  <ModuleListPage :config="config" :stats="stats" />
</template>

<script setup lang="ts">
import ModuleListPage from '@/views/ModuleListPage.vue'
import { MODULE_CONFIGS } from '@/api/module-config'

const config = MODULE_CONFIGS.boosting_station
const stats = [{"label": "并网电压", "value": 0}, {"label": "无功出力", "value": 0}, {"label": "保护动作次数", "value": 0}]
</script>
