<template>
  <section class="mobile-panel mobile-report-chart-panel">
    <div class="mobile-report-chart-panel__header">
      <h3 class="mobile-section-title">科目排行</h3>
      <span>{{ countText }}</span>
    </div>
    <Chart :option="option" :update-options="{ notMerge: true }" :height="chartHeight" />
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { EChartsOption } from 'echarts'
import Chart from '@/components/Chart/index.vue'

const props = withDefaults(defineProps<{
  option: EChartsOption
  count?: number
}>(), {
  count: 0,
})

const chartHeight = computed(() => `${Math.max(260, 88 + props.count * 44)}px`)
const countText = computed(() => (props.count > 0 ? `共${props.count}项` : '暂无数据'))
</script>

<style scoped lang="scss">
.mobile-report-chart-panel {
  padding: 16px;
}

.mobile-report-chart-panel__header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 8px;
}

.mobile-report-chart-panel__header span {
  color: #907b58;
  font-size: 12px;
  font-weight: 700;
}
</style>
