<template>
  <ReportPanelShell
    title="支付方式分布"
    description="查看当前周期内主要支付渠道的金额分布，识别常用支付习惯。"
    :loading="loading"
  >
    <div class="report-chart-card__body">
      <Chart :option="option" :update-options="{ notMerge: true }" :height="chartHeight" />
    </div>
  </ReportPanelShell>
</template>

<script setup lang="ts">
import type { EChartsOption } from 'echarts'
import { computed } from 'vue'
import Chart from '@/components/Chart/index.vue'
import ReportPanelShell from './ReportPanelShell.vue'

const props = withDefaults(defineProps<{
  option: EChartsOption
  loading?: boolean
}>(), {
  loading: false,
})

const chartHeight = computed(() => {
  const yAxis = Array.isArray(props.option?.yAxis) ? props.option.yAxis[0] : props.option?.yAxis
  const categoryCount = Array.isArray((yAxis as any)?.data) ? (yAxis as any).data.length : 0
  return `${Math.max(320, 72 + categoryCount * 34)}px`
})
</script>

<style scoped lang="scss">
.report-chart-card__body {
  width: 100%;
  min-width: 0;
  padding-top: 2px;
}
</style>
