<template>
  <ModuleListPage :config="config" :stats="stats" />
</template>

<script setup lang="ts">
import ModuleListPage from '@/views/ModuleListPage.vue'
import { MODULE_CONFIGS } from '@/api/module-config'

const config = MODULE_CONFIGS.safety
const stats = [{"label": "待签发票", "value": 0}, {"label": "执行中票", "value": 0}, {"label": "今日解除数", "value": 0}]
</script>
