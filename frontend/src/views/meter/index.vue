<template>
  <ModuleListPage :config="config" :stats="stats" />
</template>

<script setup lang="ts">
import ModuleListPage from '@/views/ModuleListPage.vue'
import { MODULE_CONFIGS } from '@/api/module-config'

const config = MODULE_CONFIGS.meter
const stats = [{"label": "日发电量", "value": 0}, {"label": "日上网电量", "value": 0}, {"label": "异常表计数", "value": 0}]
</script>
