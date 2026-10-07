<template>
  <ModuleListPage :config="config" :stats="stats" />
</template>

<script setup lang="ts">
import ModuleListPage from '@/views/ModuleListPage.vue'
import { MODULE_CONFIGS } from '@/api/module-config'

const config = MODULE_CONFIGS.energy_storage
const stats = [{"label": "SOC均值", "value": 0}, {"label": "充放电组数", "value": 0}, {"label": "故障组数", "value": 0}]
</script>
