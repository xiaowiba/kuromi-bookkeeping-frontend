<template>
  <section class="mobile-panel mobile-report-chart-panel">
    <div class="mobile-report-chart-panel__header">
      <h3 class="mobile-section-title">分类占比</h3>
      <span>可轻点下钻</span>
    </div>
    <Chart :option="option" :update-options="{ notMerge: true }" height="260px" />

    <div class="mobile-report-category-list">
      <button
        v-for="item in items.slice(0, 5)"
        :key="item.name"
        type="button"
        class="mobile-report-category-list__item"
        @click="emit('select', item.name)"
      >
        <span>{{ item.name }}</span>
        <strong>{{ formatReportCurrency(item.amount) }}</strong>
        <small>{{ formatReportRatio(item.ratio) }}</small>
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { EChartsOption } from 'echarts'
import type { ReportCategoryShareItemResp } from '@/apis/bookkeeping/type'
import Chart from '@/components/Chart/index.vue'
import { formatReportCurrency, formatReportRatio } from '@/views/bookkeeping/report/shared/reportFormat'

defineProps<{
  option: EChartsOption
  items: ReportCategoryShareItemResp[]
}>()

const emit = defineEmits<{
  (e: 'select', value: string): void
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

.mobile-report-category-list {
  display: grid;
  gap: 10px;
  margin-top: 12px;
}

.mobile-report-category-list__item {
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 8px;
  align-items: center;
  padding: 10px 12px;
  border: 1px solid rgba(143, 99, 17, 0.08);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.86);
  color: #453521;
  text-align: left;
}
</style>
