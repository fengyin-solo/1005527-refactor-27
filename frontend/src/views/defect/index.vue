<template>
  <ModuleListPage :config="config" :stats="stats" />
</template>

<script setup lang="ts">
import ModuleListPage from '@/views/ModuleListPage.vue'
import { MODULE_CONFIGS } from '@/api/module-config'

const config = MODULE_CONFIGS.defect
const stats = [{"label": "待处理缺陷", "value": 0}, {"label": "处理中缺陷", "value": 0}, {"label": "超期缺陷", "value": 0}]
</script>
