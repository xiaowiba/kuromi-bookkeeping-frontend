<template>
  <div class="report-summary-grid">
    <article
      v-for="item in cards"
      :key="item.key"
      class="report-summary-card"
      :class="`is-${item.key}`"
    >
      <a-spin :loading="loading">
        <div class="report-summary-card__head">
          <span class="report-summary-card__icon" :class="item.iconClass">
            <component :is="item.icon" />
          </span>
          <p class="report-summary-card__label">{{ item.label }}</p>
        </div>
        <strong class="report-summary-card__value" :class="item.valueClass">{{ item.value }}</strong>
        <p class="report-summary-card__meta">{{ item.meta }}</p>
      </a-spin>
    </article>
  </div>
</template>

<script setup lang="ts">
import { IconBook, IconCalendar, IconFire, IconGift, IconStorage, IconTag } from '@arco-design/web-vue/es/icon'
import { computed } from 'vue'
import type { Component } from 'vue'
import type { ReportOverviewResp } from '@/apis/bookkeeping/type'
import { formatReportAmount, formatReportCurrency } from '../shared/reportFormat'

interface SummaryCard {
  key: string
  label: string
  value: string
  meta: string
  icon: Component
  iconClass: string
  valueClass?: string
}

const props = withDefaults(defineProps<{
  overview: ReportOverviewResp
  loading?: boolean
}>(), {
  loading: false,
})

const balanceValue = computed(() => Number(props.overview?.balance ?? 0))
const balanceValueClass = computed(() => {
  if (balanceValue.value > 0) {
    return 'is-positive'
  }
  if (balanceValue.value < 0) {
    return 'is-negative'
  }
  return ''
})

const balanceIconClass = computed(() => {
  if (balanceValue.value > 0) {
    return 'is-balance-positive'
  }
  if (balanceValue.value < 0) {
    return 'is-balance-negative'
  }
  return 'is-balance-neutral'
})

const cards = computed<SummaryCard[]>(() => [
  {
    key: 'expense',
    label: '总支出',
    value: formatReportCurrency(props.overview?.totalExpense),
    meta: props.overview?.maxExpenseCategoryName
      ? `最高支出：${props.overview.maxExpenseCategoryName}`
      : '当前区间暂无支出峰值',
    icon: IconFire,
    iconClass: 'is-expense',
    valueClass: 'is-negative',
  },
  {
    key: 'income',
    label: '总收入',
    value: formatReportCurrency(props.overview?.totalIncome),
    meta: props.overview?.maxIncomeSubjectName
      ? `最高收入：${props.overview.maxIncomeSubjectName}`
      : '当前区间暂无收入峰值',
    icon: IconGift,
    iconClass: 'is-income',
    valueClass: 'is-positive',
  },
  {
    key: 'balance',
    label: '结余',
    value: formatReportCurrency(props.overview?.balance, { signed: balanceValue.value > 0 }),
    meta: balanceValue.value >= 0 ? '本期收入高于支出' : '本期支出高于收入',
    icon: IconStorage,
    iconClass: balanceIconClass.value,
    valueClass: balanceValueClass.value,
  },
  {
    key: 'count',
    label: '记录笔数',
    value: `${formatReportAmount(props.overview?.recordCount, { compact: true })} 笔`,
    meta: '当前筛选条件下可见明细总数',
    icon: IconCalendar,
    iconClass: 'is-count',
  },
  {
    key: 'expense-top',
    label: '最高支出科目',
    value: props.overview?.maxExpenseCategoryName || '暂无',
    meta: props.overview?.maxExpenseCategoryAmount
      ? formatReportCurrency(props.overview.maxExpenseCategoryAmount)
      : '暂无数据',
    icon: IconTag,
    iconClass: 'is-expense-top',
  },
  {
    key: 'income-top',
    label: '最高收入科目',
    value: props.overview?.maxIncomeSubjectName || '暂无',
    meta: props.overview?.maxIncomeSubjectAmount
      ? formatReportCurrency(props.overview.maxIncomeSubjectAmount)
      : '暂无数据',
    icon: IconBook,
    iconClass: 'is-income-top',
  },
])
</script>

<style scoped lang="scss">
.report-summary-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 16px;
}

.report-summary-card {
  padding: 18px 18px 16px;
  border: 1px solid rgba(202, 138, 4, 0.12);
  border-radius: 22px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(255, 250, 238, 0.94) 100%);
  box-shadow: 0 14px 24px rgba(130, 90, 22, 0.06);
}

.report-summary-card__head {
  display: flex;
  align-items: center;
  gap: 10px;
}

.report-summary-card__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 12px;
  font-size: 16px;
}

.report-summary-card__icon.is-expense,
.report-summary-card__icon.is-balance-negative,
.report-summary-card__icon.is-expense-top {
  color: #f53f3f;
  background: rgba(245, 63, 63, 0.1);
}

.report-summary-card__icon.is-income,
.report-summary-card__icon.is-balance-positive,
.report-summary-card__icon.is-income-top {
  color: #00b42a;
  background: rgba(0, 180, 42, 0.1);
}

.report-summary-card__icon.is-count,
.report-summary-card__icon.is-balance-neutral {
  color: #c58a12;
  background: rgba(197, 138, 18, 0.14);
}

.report-summary-card__label {
  margin: 0;
  color: #8a7754;
  font-size: 13px;
  font-weight: 700;
}

.report-summary-card__value {
  display: block;
  margin-top: 10px;
  color: #362a14;
  font-size: 24px;
  font-weight: 800;
}

.report-summary-card__value.is-negative {
  color: #f53f3f;
}

.report-summary-card__value.is-positive {
  color: #00b42a;
}

.report-summary-card__meta {
  margin: 10px 0 0;
  color: #8f7a57;
  font-size: 12px;
  line-height: 1.6;
}

@media (max-width: 1600px) {
  .report-summary-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .report-summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
