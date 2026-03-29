<template>
  <ReportPanelShell
    title="报表洞察"
    description="将图表与汇总结果转成可直接阅读的结论，方便快速判断当前账务情况。"
    :loading="loading"
  >
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
      当前筛选条件下暂时没有可生成的洞察文案，可以尝试切换到多用户或更长时间范围。
    </div>
  </ReportPanelShell>
</template>

<script setup lang="ts">
import type { ReportOverviewResp } from '@/apis/bookkeeping/type'
import { formatReportCurrency } from '../shared/reportFormat'
import ReportPanelShell from './ReportPanelShell.vue'

withDefaults(defineProps<{
  insight: string[]
  overview: ReportOverviewResp
  loading?: boolean
}>(), {
  loading: false,
})
</script>

<style scoped lang="scss">
.report-insight-card__summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  padding-top: 2px;
}

.report-insight-card__summary-item {
  padding: 12px 14px;
  border: 1px solid var(--color-border-2);
  border-radius: 12px;
  background: var(--color-fill-1);
}

.report-insight-card__summary-item span {
  display: block;
  color: var(--color-text-3);
  font-size: 12px;
  font-weight: 600;
}

.report-insight-card__summary-item strong {
  display: block;
  margin-top: 8px;
  color: var(--color-text-1);
  font-size: 16px;
  font-weight: 700;
}

.report-insight-card__list {
  margin: 18px 0 0;
  padding-left: 20px;
  color: var(--color-text-1);
}

.report-insight-card__item + .report-insight-card__item {
  margin-top: 10px;
}

.report-insight-card__empty {
  margin-top: 18px;
  color: var(--color-text-3);
  font-size: 14px;
  line-height: 1.7;
}

@media (max-width: 900px) {
  .report-insight-card__summary {
    grid-template-columns: 1fr;
  }
}
</style>
