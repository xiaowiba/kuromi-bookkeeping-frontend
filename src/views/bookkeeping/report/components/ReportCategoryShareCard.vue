<template>
  <ReportPanelShell
    title="分类占比"
    description="查看当前区间内主要分类的结构分布，右侧列表点击后可继续联动筛选。"
    :loading="loading"
  >
    <div class="report-category-card">
      <Chart :option="option" :update-options="{ notMerge: true }" height="320px" />
      <div class="report-category-card__list">
        <button
          v-for="item in items.slice(0, 6)"
          :key="item.key || item.name"
          type="button"
          class="report-category-card__item"
          @click="emit('select', item.key || item.name)"
        >
          <span class="report-category-card__name">{{ item.name }}</span>
          <strong class="report-category-card__amount">{{ formatReportCurrency(item.amount) }}</strong>
          <small class="report-category-card__ratio">{{ formatReportRatio(item.ratio) }}</small>
        </button>
      </div>
    </div>
  </ReportPanelShell>
</template>

<script setup lang="ts">
import type { EChartsOption } from 'echarts'
import { formatReportCurrency, formatReportRatio } from '../shared/reportFormat'
import ReportPanelShell from './ReportPanelShell.vue'
import type { ReportCategoryShareItemResp } from '@/apis/bookkeeping/type'
import Chart from '@/components/Chart/index.vue'

withDefaults(defineProps<{
  option: EChartsOption
  items: ReportCategoryShareItemResp[]
  loading?: boolean
}>(), {
  loading: false,
})

const emit = defineEmits<{
  (e: 'select', value: string): void
}>()
</script>

<style scoped lang="scss">
.report-category-card {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(240px, 0.9fr);
  gap: 20px;
  align-items: center;
  padding-top: 2px;
}

.report-category-card__list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.report-category-card__item {
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 8px;
  align-items: center;
  padding: 10px 12px;
  border: 1px solid var(--color-border-2);
  border-radius: 12px;
  background: var(--color-fill-1);
  color: var(--color-text-1);
  text-align: left;
  transition: border-color 0.2s ease, background-color 0.2s ease;
}

.report-category-card__item:hover {
  border-color: rgb(var(--primary-4));
  background: var(--color-fill-2);
}

.report-category-card__name {
  color: var(--color-text-1);
  font-size: 13px;
  font-weight: 600;
}

.report-category-card__amount {
  color: var(--color-text-1);
  font-size: 13px;
  font-weight: 700;
}

.report-category-card__ratio {
  color: var(--color-text-3);
  font-size: 12px;
}

@media (max-width: 1280px) {
  .report-category-card {
    grid-template-columns: 1fr;
  }
}
</style>
