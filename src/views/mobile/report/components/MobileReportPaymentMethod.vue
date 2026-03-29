<template>
  <section class="mobile-panel mobile-report-chart-panel">
    <div class="mobile-report-chart-panel__header">
      <h3 class="mobile-section-title">支付方式</h3>
      <span>渠道</span>
    </div>
    <Chart :option="option" :update-options="{ notMerge: true }" height="240px" />
  </section>
</template>

<script setup lang="ts">
import type { EChartsOption } from 'echarts'
import Chart from '@/components/Chart/index.vue'

defineProps<{
  option: EChartsOption
}>()
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
