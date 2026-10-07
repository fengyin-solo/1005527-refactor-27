<template>
  <ModuleListPage :config="config" :stats="stats" />
</template>

<script setup lang="ts">
import ModuleListPage from '@/views/ModuleListPage.vue'
import { MODULE_CONFIGS } from '@/api/module-config'

const config = MODULE_CONFIGS.dispatch
const stats = [{"label": "待执行指令", "value": 0}, {"label": "今日完成数", "value": 0}, {"label": "驳回指令数", "value": 0}]
</script>
