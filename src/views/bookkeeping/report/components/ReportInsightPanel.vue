<template>
  <a-card :bordered="false" class="report-insight-card">
    <template #title>
      <div class="report-insight-card__title">
        <span>报表洞察</span>
        <small>把图表结果转换成更容易扫读的结论</small>
      </div>
    </template>
    <a-spin :loading="loading">
      <div class="report-insight-card__summary">
        <div class="report-insight-card__summary-item">
          <span>支出</span>
          <strong>{{ formatReportCurrency(overview?.totalExpense) }}</strong>
        </div>
        <div class="report-insight-card__summary-item">
          <span>收入</span>
          <strong>{{ formatReportCurrency(overview?.totalIncome) }}</strong>
        </div>
        <div class="report-insight-card__summary-item">
          <span>结余</span>
          <strong>{{ formatReportCurrency(overview?.balance) }}</strong>
        </div>
      </div>

      <ol v-if="insight.length" class="report-insight-card__list">
        <li v-for="(item, index) in insight" :key="`${index}-${item}`" class="report-insight-card__item">
          {{ item }}
        </li>
      </ol>
      <div v-else class="report-insight-card__empty">
        当前筛选条件下暂无可生成的洞察文案，可以尝试切换到多用户或更长时间范围。
      </div>
    </a-spin>
  </a-card>
</template>

<script setup lang="ts">
import type { ReportOverviewResp } from '@/apis/bookkeeping/type'
import { formatReportCurrency } from '../shared/reportFormat'

withDefaults(defineProps<{
  insight: string[]
  overview: ReportOverviewResp
  loading?: boolean
}>(), {
  loading: false,
})
</script>

<style scoped lang="scss">
.report-insight-card {
  border-radius: 24px;
  background:
    radial-gradient(circle at top right, rgba(251, 191, 36, 0.18) 0%, transparent 32%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(255, 248, 236, 0.96) 100%);
  box-shadow: 0 16px 28px rgba(130, 90, 22, 0.06);
}

.report-insight-card__title {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.report-insight-card__title span {
  color: #342714;
  font-size: 16px;
  font-weight: 800;
}

.report-insight-card__title small {
  color: #907b58;
  font-size: 12px;
  font-weight: 600;
}

.report-insight-card__summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.report-insight-card__summary-item {
  padding: 12px 14px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.84);
}

.report-insight-card__summary-item span {
  display: block;
  color: #907b58;
  font-size: 12px;
  font-weight: 700;
}

.report-insight-card__summary-item strong {
  display: block;
  margin-top: 8px;
  color: #392c16;
  font-size: 16px;
  font-weight: 800;
}

.report-insight-card__list {
  margin: 18px 0 0;
  padding-left: 20px;
  color: #4e4029;
}

.report-insight-card__item + .report-insight-card__item {
  margin-top: 10px;
}

.report-insight-card__empty {
  margin-top: 18px;
  color: #8f7a57;
  font-size: 14px;
  line-height: 1.7;
}
</style>
