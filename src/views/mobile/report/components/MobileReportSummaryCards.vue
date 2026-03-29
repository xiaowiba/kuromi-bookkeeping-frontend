<template>
  <section class="mobile-panel mobile-report-summary">
    <div class="mobile-report-summary__grid">
      <article class="mobile-report-summary__card is-expense">
        <span>总支出</span>
        <strong>{{ formatReportCurrency(overview.totalExpense) }}</strong>
      </article>
      <article class="mobile-report-summary__card is-income">
        <span>总收入</span>
        <strong>{{ formatReportCurrency(overview.totalIncome) }}</strong>
      </article>
      <article class="mobile-report-summary__card">
        <span>结余</span>
        <strong>{{ formatReportCurrency(overview.balance, { signed: overview.balance > 0 }) }}</strong>
      </article>
      <article class="mobile-report-summary__card">
        <span>记录数</span>
        <strong>{{ overview.recordCount }} 笔</strong>
      </article>
    </div>

    <div class="mobile-report-summary__meta">
      <div>
        <span>最高支出</span>
        <strong>{{ overview.maxExpenseCategoryName || '暂无' }}</strong>
      </div>
      <div>
        <span>最高收入</span>
        <strong>{{ overview.maxIncomeSubjectName || '暂无' }}</strong>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { ReportOverviewResp } from '@/apis/bookkeeping/type'
import { formatReportCurrency } from '@/views/bookkeeping/report/shared/reportFormat'

defineProps<{
  overview: ReportOverviewResp
}>()
</script>

<style scoped lang="scss">
.mobile-report-summary {
  padding: 16px;
}

.mobile-report-summary__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.mobile-report-summary__card {
  padding: 14px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.88);
}

.mobile-report-summary__card span {
  display: block;
  color: #8a7a68;
  font-size: 12px;
  font-weight: 700;
}

.mobile-report-summary__card strong {
  display: block;
  margin-top: 8px;
  color: #3b2a16;
  font-size: 18px;
  font-weight: 800;
}

.mobile-report-summary__meta {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(143, 99, 17, 0.08);
}

.mobile-report-summary__meta span {
  display: block;
  color: #907b58;
  font-size: 12px;
  font-weight: 700;
}

.mobile-report-summary__meta strong {
  display: block;
  margin-top: 6px;
  color: #4a3822;
  font-size: 14px;
  font-weight: 700;
}
</style>
