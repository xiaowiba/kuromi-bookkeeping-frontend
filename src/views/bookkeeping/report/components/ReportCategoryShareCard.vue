<template>
  <a-card :bordered="false" class="report-chart-card">
    <template #title>
      <div class="report-chart-card__title">
        <span>分类占比</span>
        <small>点击下方分类可联动筛选到对应科目</small>
      </div>
    </template>
    <a-spin :loading="loading" class="report-chart-card__spin">
      <div class="report-category-card">
        <Chart :option="option" :update-options="{ notMerge: true }" height="320px" />
        <div class="report-category-card__list">
          <button
            v-for="item in items.slice(0, 6)"
            :key="item.name"
            type="button"
            class="report-category-card__item"
            @click="emit('select', item.name)"
          >
            <span>{{ item.name }}</span>
            <strong>{{ formatReportCurrency(item.amount) }}</strong>
            <small>{{ formatReportRatio(item.ratio) }}</small>
          </button>
        </div>
      </div>
    </a-spin>
  </a-card>
</template>

<script setup lang="ts">
import type { EChartsOption } from 'echarts'
import type { ReportCategoryShareItemResp } from '@/apis/bookkeeping/type'
import Chart from '@/components/Chart/index.vue'
import { formatReportCurrency, formatReportRatio } from '../shared/reportFormat'

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
.report-chart-card {
  border-radius: 24px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(255, 250, 240, 0.96) 100%);
  box-shadow: 0 16px 28px rgba(130, 90, 22, 0.06);
}

.report-chart-card__title {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.report-chart-card__title span {
  color: #342714;
  font-size: 16px;
  font-weight: 800;
}

.report-chart-card__title small {
  color: #907b58;
  font-size: 12px;
  font-weight: 600;
}

.report-category-card {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(220px, 0.9fr);
  gap: 20px;
  align-items: center;
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
  border: 1px solid rgba(202, 138, 4, 0.1);
  border-radius: 16px;
  background: rgba(255, 252, 244, 0.9);
  color: #453521;
  text-align: left;
}

.report-chart-card__spin {
  display: block;
  width: 100%;
}

.report-chart-card__spin :deep(.arco-spin) {
  display: block;
  width: 100%;
}

.report-chart-card__spin :deep(.arco-spin-children) {
  display: block;
  width: 100%;
}

@media (max-width: 1280px) {
  .report-category-card {
    grid-template-columns: 1fr;
  }
}
</style>
