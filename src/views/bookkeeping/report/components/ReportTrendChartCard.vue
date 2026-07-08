<template>
  <ReportPanelShell
    title="收支趋势"
    description="按时间粒度观察收入和支出的变化趋势，快速判断波动区间。"
    :loading="loading"
  >
    <div class="report-chart-card__body">
      <Chart :option="option" :update-options="{ notMerge: true }" height="320px" />
    </div>
  </ReportPanelShell>
</template>

<script setup lang="ts">
/**
 * 收支趋势图卡片。
 *
 * 负责承载趋势图配置和 loading 状态，图表配置由报表 options 工具统一生成。
 *
 * @author Wangsongsong
 * @date 2026-07-02
 * @update 2026-07-02 @Wangsongsong
 * @desc 补充趋势图卡片职责说明
 */
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
