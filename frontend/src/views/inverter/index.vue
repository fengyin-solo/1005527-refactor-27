<template>
  <ModuleListPage :config="config" :stats="stats" />
</template>

<script setup lang="ts">
import ModuleListPage from '@/views/ModuleListPage.vue'
import { MODULE_CONFIGS } from '@/api/module-config'

const config = MODULE_CONFIGS.inverter
const stats = [{"label": "在线逆变器", "value": 0}, {"label": "降容台数", "value": 0}, {"label": "报修台数", "value": 0}]
</script>
