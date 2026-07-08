<template>
  <ReportPanelShell
    title="用户对比"
    description="仅在多用户视角下展示，横向比较不同用户的收入与支出表现。"
    :loading="loading"
  >
    <div class="report-chart-card__body">
      <Chart :option="option" :update-options="{ notMerge: true }" height="320px" />
    </div>
  </ReportPanelShell>
</template>

<script setup lang="ts">
/**
 * 用户对比图卡片。
 *
 * 负责展示多用户收支对比图，图表配置由报表 options 工具统一生成。
 *
 * @author Wangsongsong
 * @date 2026-07-02
 * @update 2026-07-02 @Wangsongsong
 * @desc 补充用户对比卡片职责说明
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
