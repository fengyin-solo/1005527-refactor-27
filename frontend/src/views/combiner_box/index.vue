<template>
  <ModuleListPage :config="config" :stats="stats" />
</template>

<script setup lang="ts">
import ModuleListPage from '@/views/ModuleListPage.vue'
import { MODULE_CONFIGS } from '@/api/module-config'

const config = MODULE_CONFIGS.combiner_box
const stats = [{"label": "正常运行数", "value": 0}, {"label": "异常汇流箱", "value": 0}, {"label": "停用设备数", "value": 0}]
</script>
