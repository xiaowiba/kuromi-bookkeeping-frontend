<template>
  <ReportPanelShell
    title="支付方式分布"
    description="查看当前周期内主要支付渠道的金额分布，识别常用支付习惯。"
    :loading="loading"
  >
    <div class="report-chart-card__body">
      <Chart :option="option" :update-options="{ notMerge: true }" height="320px" />
    </div>
  </ReportPanelShell>
</template>

<script setup lang="ts">
import type { EChartsOption } from 'echarts'
import Chart from '@/components/Chart/index.vue'
import ReportPanelShell from './ReportPanelShell.vue'

withDefaults(defineProps<{
  option: EChartsOption
  loading?: boolean
}>(), {
  loading: false,
})
</script>

<style scoped lang="scss">
.report-chart-card__body {
  width: 100%;
  min-width: 0;
  padding-top: 2px;
}
</style>
