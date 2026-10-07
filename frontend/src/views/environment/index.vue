<template>
  <ModuleListPage :config="config" :stats="stats" />
</template>

<script setup lang="ts">
import ModuleListPage from '@/views/ModuleListPage.vue'
import { MODULE_CONFIGS } from '@/api/module-config'

const config = MODULE_CONFIGS.environment
const stats = [{"label": "当日辐照总量", "value": 0}, {"label": "环境平均温度", "value": 0}, {"label": "故障站点数", "value": 0}]
</script>
