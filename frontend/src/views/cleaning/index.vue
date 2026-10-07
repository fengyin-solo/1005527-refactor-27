<template>
  <ModuleListPage :config="config" :stats="stats" />
</template>

<script setup lang="ts">
import ModuleListPage from '@/views/ModuleListPage.vue'
import { MODULE_CONFIGS } from '@/api/module-config'

const config = MODULE_CONFIGS.cleaning
const stats = [{"label": "待清洗片区", "value": 0}, {"label": "今日作业量", "value": 0}, {"label": "本月清洗面积", "value": 0}]
</script>
