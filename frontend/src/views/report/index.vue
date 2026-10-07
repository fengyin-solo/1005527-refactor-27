<template>
  <ModuleListPage :config="config" :stats="stats" />
</template>

<script setup lang="ts">
import ModuleListPage from '@/views/ModuleListPage.vue'
import { MODULE_CONFIGS } from '@/api/module-config'

const config = MODULE_CONFIGS.report
const stats = [{"label": "当月发电量", "value": 0}, {"label": "当月PR值", "value": 0}, {"label": "待填月报数", "value": 0}]
</script>
