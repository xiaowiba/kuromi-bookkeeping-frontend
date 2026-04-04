<template>
  <ReportPanelShell
    title="科目排行"
    description="按金额倒序查看当前区间贡献最高的科目，定位主要支出或收入来源。"
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
