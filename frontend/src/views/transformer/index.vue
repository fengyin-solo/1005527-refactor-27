<template>
  <ModuleListPage :config="config" :stats="stats" />
</template>

<script setup lang="ts">
import ModuleListPage from '@/views/ModuleListPage.vue'
import { MODULE_CONFIGS } from '@/api/module-config'

const config = MODULE_CONFIGS.transformer
const stats = [{"label": "运行变压器", "value": 0}, {"label": "超温台数", "value": 0}, {"label": "待检台数", "value": 0}]
</script>
