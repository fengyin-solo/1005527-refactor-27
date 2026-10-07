<template>
  <ModuleListPage :config="config" :stats="stats" />
</template>

<script setup lang="ts">
import ModuleListPage from '@/views/ModuleListPage.vue'
import { MODULE_CONFIGS } from '@/api/module-config'

const config = MODULE_CONFIGS.contract
const stats = [{"label": "履行中合同", "value": 0}, {"label": "本月到期合同", "value": 0}, {"label": "待签订合同", "value": 0}]
</script>
