<template>
  <a-card :bordered="false" class="report-chart-card">
    <template #title>
      <div class="report-chart-card__title">
        <span>收支趋势</span>
        <small>按时间粒度观察收入与支出变化</small>
      </div>
    </template>
    <a-spin :loading="loading" class="report-chart-card__spin">
      <div class="report-chart-card__body">
        <Chart :option="option" :update-options="{ notMerge: true }" height="320px" />
      </div>
    </a-spin>
  </a-card>
</template>

<script setup lang="ts">
import type { EChartsOption } from 'echarts'
import Chart from '@/components/Chart/index.vue'

withDefaults(defineProps<{
  option: EChartsOption
  loading?: boolean
}>(), {
  loading: false,
})
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

.report-chart-card__body {
  width: 100%;
  min-width: 0;
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
</style>
