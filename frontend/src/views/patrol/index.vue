<template>
  <ModuleListPage :config="config" :stats="stats" />
</template>

<script setup lang="ts">
import ModuleListPage from '@/views/ModuleListPage.vue'
import { MODULE_CONFIGS } from '@/api/module-config'

const config = MODULE_CONFIGS.patrol
const stats = [{"label": "今日巡视数", "value": 0}, {"label": "发现缺陷数", "value": 0}, {"label": "待巡视区域", "value": 0}]
</script>
