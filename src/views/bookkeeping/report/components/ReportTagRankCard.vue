<template>
  <ReportPanelShell
    title="标签排行"
    description="当筛选到某个科目后，继续查看该科目下各标签的金额贡献。"
    :loading="loading"
  >
    <div class="report-chart-card__body">
      <Chart :option="option" :update-options="{ notMerge: true }" :height="chartHeight" @click="handleChartClick" />
    </div>
  </ReportPanelShell>
</template>

<script setup lang="ts">
import type { EChartsOption } from 'echarts'
import { computed } from 'vue'
import ReportPanelShell from './ReportPanelShell.vue'
import type { ReportTagRankChartDataItem } from '../shared/useReportOptions'
import Chart from '@/components/Chart/index.vue'
import type { ReportTagRankItemResp } from '@/apis/bookkeeping/type'

const props = withDefaults(defineProps<{
  option: EChartsOption
  loading?: boolean
}>(), {
  loading: false,
})

const emit = defineEmits<{
  (e: 'select-tag', payload: ReportTagRankItemResp): void
}>()

const chartHeight = computed(() => {
  const yAxis = Array.isArray(props.option?.yAxis) ? props.option.yAxis[0] : props.option?.yAxis
  const categoryCount = Array.isArray((yAxis as any)?.data) ? (yAxis as any).data.length : 0
  return `${Math.max(280, 72 + categoryCount * 34)}px`
})

const normalizeTagRankPayload = (
  payload: Partial<ReportTagRankChartDataItem> | undefined,
): ReportTagRankItemResp | null => {
  if (!payload?.tagName || !payload?.subjectId || !payload?.subjectName) {
    return null
  }

  return {
    tagId: payload.tagId == null ? undefined : String(payload.tagId),
    tagName: payload.tagName,
    subjectId: String(payload.subjectId),
    subjectName: payload.subjectName,
    amount: Number(payload.amount ?? payload.value ?? 0),
    ratio: Number(payload.ratio ?? 0),
    count: Number(payload.count ?? 0),
  }
}

const handleChartClick = (params: any) => {
  const payload = normalizeTagRankPayload(params?.data as Partial<ReportTagRankChartDataItem> | undefined)
  if (payload) {
    emit('select-tag', payload)
  }
}
</script>

<style scoped lang="scss">
.report-chart-card__body {
  width: 100%;
  min-width: 0;
  padding-top: 2px;
}
</style>
