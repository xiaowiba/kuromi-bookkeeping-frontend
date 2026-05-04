<template>
  <ReportPanelShell
    title="核心数据总览"
    :description="`${scopeLabel} · 全部 / 本月 / 上月`"
    :loading="loading"
  >
    <div class="workplace-overview-sections">
      <section
        v-for="section in sections"
        :key="section.key"
        class="workplace-overview-section"
        :class="section.accentClass"
      >
        <div class="workplace-overview-section__head">
          <div>
            <strong>{{ section.title }}</strong>
            <p>{{ section.description }}</p>
          </div>
        </div>

        <div class="workplace-overview-grid">
          <article
            v-for="item in buildCards(section.dashboard.overview, section.title)"
            :key="`${section.key}-${item.key}`"
            class="workplace-overview-card"
          >
            <span class="workplace-overview-card__icon" :class="item.iconClass">
              <component :is="item.icon" />
            </span>
            <div class="workplace-overview-card__body">
              <p class="workplace-overview-card__label">{{ item.label }}</p>
              <strong class="workplace-overview-card__value" :class="item.valueClass">{{ item.value }}</strong>
              <p class="workplace-overview-card__meta">{{ item.meta }}</p>
            </div>
          </article>
        </div>
      </section>
    </div>
  </ReportPanelShell>
</template>

<script setup lang="ts">
import { IconCalendar, IconFire, IconGift, IconStorage } from '@arco-design/web-vue/es/icon'
import type { Component } from 'vue'
import type { ReportDashboardResp, ReportOverviewResp } from '@/apis/bookkeeping/type'
import ReportPanelShell from '@/views/bookkeeping/report/components/ReportPanelShell.vue'
import { formatReportAmount } from '@/views/bookkeeping/report/shared/reportFormat'

interface WorkplaceOverviewSection {
  key: 'all' | 'currentMonth' | 'lastMonth'
  title: string
  description: string
  accentClass: string
  dashboard: ReportDashboardResp
}

interface OverviewCardItem {
  key: string
  label: string
  value: string
  meta: string
  icon: Component
  iconClass: string
  valueClass?: string
}

withDefaults(defineProps<{
  sections: WorkplaceOverviewSection[]
  loading?: boolean
  scopeLabel?: string
}>(), {
  loading: false,
  scopeLabel: '当前用户',
})

const formatCurrency = (value: number | string | undefined | null, signed = false) => {
  const amount = Number(value ?? 0)
  const prefix = signed && amount > 0 ? '+' : ''
  return `￥${prefix}${formatReportAmount(amount)}`
}

const resolveBalanceMeta = (balance: number) => {
  if (balance > 0) {
    return '当前周期收入高于支出'
  }
  if (balance < 0) {
    return '当前周期支出高于收入'
  }
  return '当前周期收支持平'
}

const resolveBalanceClass = (balance: number) => {
  if (balance > 0) {
    return 'is-income'
  }
  if (balance < 0) {
    return 'is-expense'
  }
  return 'is-neutral'
}

const buildCards = (overview: ReportOverviewResp, sectionTitle: string): OverviewCardItem[] => {
  const balance = Number(overview?.balance ?? 0)
  const balanceClass = resolveBalanceClass(balance)

  return [
    {
      key: 'expense',
      label: '总支出',
      value: formatCurrency(overview?.totalExpense),
      meta: overview?.maxExpenseCategoryName
        ? `最高支出：${overview.maxExpenseCategoryName}`
        : `${sectionTitle}暂无支出数据`,
      icon: IconFire,
      iconClass: 'is-expense',
      valueClass: 'is-expense',
    },
    {
      key: 'income',
      label: '总收入',
      value: formatCurrency(overview?.totalIncome),
      meta: overview?.maxIncomeSubjectName
        ? `最高收入：${overview.maxIncomeSubjectName}`
        : `${sectionTitle}暂无收入数据`,
      icon: IconGift,
      iconClass: 'is-income',
      valueClass: 'is-income',
    },
    {
      key: 'balance',
      label: '结余',
      value: formatCurrency(overview?.balance, balance > 0),
      meta: resolveBalanceMeta(balance),
      icon: IconStorage,
      iconClass: balanceClass,
      valueClass: balanceClass,
    },
    {
      key: 'recordCount',
      label: '记录笔数',
      value: `${formatReportAmount(overview?.recordCount, { compact: true })} 笔`,
      meta: `${sectionTitle}范围内的可见明细总数`,
      icon: IconCalendar,
      iconClass: 'is-neutral',
      valueClass: 'is-neutral',
    },
  ].map((item) => (item.key === 'recordCount' ? { ...item, meta: '' } : item))
}
</script>

<style scoped lang="scss">
.workplace-overview-sections {
  display: grid;
  gap: 16px;
}

.workplace-overview-section {
  position: relative;
  overflow: hidden;
  padding: 16px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.98);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.82),
    0 16px 34px rgba(15, 23, 42, 0.04);
}

.workplace-overview-section.is-all {
  background: #f5fbff;
}

.workplace-overview-section.is-current-month {
  background: #f9fff3;
}

.workplace-overview-section.is-last-month {
  background: #fffcf4;
}

.workplace-overview-section__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.workplace-overview-section__head strong {
  color: var(--color-text-1);
  font-size: 17px;
  font-weight: 800;
  line-height: 1.3;
}

.workplace-overview-section__head p {
  margin: 0;
  color: var(--color-text-3);
  font-size: 12px;
  line-height: 1.7;
}

.workplace-overview-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.workplace-overview-card {
  position: relative;
  overflow: hidden;
  display: flex;
  gap: 10px;
  min-width: 0;
  min-height: 80px;
  padding: 14px 15px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

.workplace-overview-card::after {
  content: '';
  position: absolute;
  right: -16px;
  bottom: -22px;
  width: 80px;
  height: 80px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.08);
  opacity: 0.5;
  pointer-events: none;
}

.workplace-overview-card__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 40px;
  height: 40px;
  border-radius: 14px;
  font-size: 16px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.78);
}

.workplace-overview-card__icon.is-expense {
  color: var(--amount-expense-primary);
  background: var(--amount-expense-bg);
}

.workplace-overview-card__icon.is-income {
  color: var(--amount-income-primary);
  background: var(--amount-income-bg);
}

.workplace-overview-card__icon.is-neutral {
  color: #c58a12;
  background: rgba(197, 138, 18, 0.14);
}

.workplace-overview-card__body {
  min-width: 0;
}

.workplace-overview-card__label {
  margin: 0;
  color: var(--color-text-2);
  font-size: 12px;
  font-weight: 700;
  line-height: 1.4;
}

.workplace-overview-card__value {
  display: block;
  margin-top: 6px;
  color: var(--color-text-1);
  font-size: 20px;
  font-weight: 800;
  line-height: 1.25;
  word-break: break-word;
}

.workplace-overview-card__value.is-expense {
  color: var(--amount-expense-primary);
}

.workplace-overview-card__value.is-income {
  color: var(--amount-income-primary);
}

.workplace-overview-card__value.is-neutral {
  color: #c58a12;
}

.workplace-overview-card__meta {
  margin: 6px 0 0;
  color: var(--color-text-3);
  font-size: 11px;
  line-height: 1.5;
  word-break: break-word;
}

@media (max-width: 1400px) {
  .workplace-overview-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .workplace-overview-section {
    padding: 14px;
  }

  .workplace-overview-grid {
    grid-template-columns: 1fr;
  }
}
</style>
