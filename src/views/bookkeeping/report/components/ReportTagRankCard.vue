<template>
  <ReportPanelShell
    title="标签排行"
    description="当筛选到某个科目后，继续查看该科目下各标签的金额贡献。"
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
import ReportPanelShell from './ReportPanelShell.vue'
import Chart from '@/components/Chart/index.vue'

const props = withDefaults(defineProps<{
  option: EChartsOption
  loading?: boolean
}>(), {
  loading: false,
})

const chartHeight = computed(() => {
  const yAxis = Array.isArray(props.option?.yAxis) ? props.option.yAxis[0] : props.option?.yAxis
  const categoryCount = Array.isArray((yAxis as any)?.data) ? (yAxis as any).data.length : 0
  return `${Math.max(280, 72 + categoryCount * 34)}px`
})
</script>

<style scoped lang="scss">
.report-chart-card__body {
  width: 100%;
  min-width: 0;
  padding-top: 2px;
}
</style>
