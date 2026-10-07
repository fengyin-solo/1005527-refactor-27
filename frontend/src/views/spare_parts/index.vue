<template>
  <ModuleListPage :config="config" :stats="stats" />
</template>

<script setup lang="ts">
import ModuleListPage from '@/views/ModuleListPage.vue'
import { MODULE_CONFIGS } from '@/api/module-config'

const config = MODULE_CONFIGS.spare_parts
const stats = [{"label": "备件种类数", "value": 0}, {"label": "低存量备件", "value": 0}, {"label": "本月领用数", "value": 0}]
</script>
