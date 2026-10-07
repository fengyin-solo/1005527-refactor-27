<template>
  <ModuleListPage :config="config" :stats="stats" />
</template>

<script setup lang="ts">
import ModuleListPage from '@/views/ModuleListPage.vue'
import { MODULE_CONFIGS } from '@/api/module-config'

const config = MODULE_CONFIGS.maintenance
const stats = [{"label": "待审批计划", "value": 0}, {"label": "执行中计划", "value": 0}, {"label": "本月完工数", "value": 0}]
</script>
