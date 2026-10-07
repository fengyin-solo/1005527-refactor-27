<template>
  <ModuleListPage :config="config" :stats="stats" />
</template>

<script setup lang="ts">
import ModuleListPage from '@/views/ModuleListPage.vue'
import { MODULE_CONFIGS } from '@/api/module-config'

const config = MODULE_CONFIGS.pv_array
const stats = [{"label": "运行阵列数", "value": 0}, {"label": "限电阵列数", "value": 0}, {"label": "故障停机数", "value": 0}]
</script>
