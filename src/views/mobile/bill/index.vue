<template>
  <div class="mobile-page mobile-bill-page">
    <div class="mobile-bill-page__fixed">
      <section class="mobile-panel mobile-bill-hero">
      <div class="mobile-bill-hero__tab-group">
        <button
          v-for="item in billTypeOptions"
          :key="item.value"
          type="button"
          class="mobile-bill-hero__tab"
          :class="{ 'is-active': activeBillType === item.value }"
          @click="handleBillTypeChange(item.value)"
        >
          {{ item.label }}
        </button>
      </div>

      <div v-if="activeBillType === 'monthly'" class="mobile-bill-hero__year-switch">
        <button type="button" class="mobile-bill-hero__year-btn" @click="handleYearChange(-1)">
          上一年
        </button>
        <div class="mobile-bill-hero__year-value">
          <span>{{ selectedYear }}</span>
        </div>
        <button type="button" class="mobile-bill-hero__year-btn" @click="handleYearChange(1)">
          下一年
        </button>
        <button
          type="button"
          class="mobile-bill-hero__year-btn is-ghost"
          :disabled="selectedYear === currentYear"
          @click="handleResetCurrentYear"
        >
          今年
        </button>
      </div>

      <!-- 删除描述文字 -->
      </section>

      <section v-if="!loading" class="mobile-panel mobile-bill-summary">
        <div class="mobile-bill-overview">
          <div class="mobile-bill-overview__head">
            <div class="mobile-bill-overview__headline">
              <p class="mobile-bill-overview__label">{{ overviewBalanceLabel }}</p>
              <strong
                class="mobile-bill-overview__balance"
                :class="resolveBalanceClass(currentSummary.balance)"
              >
                {{ formatBalance(currentSummary.balance) }}
              </strong>
            </div>
          </div>

          <div class="mobile-bill-overview__stats">
            <div class="mobile-bill-overview__stat is-income">
              <span>{{ overviewIncomeLabel }}</span>
              <strong>{{ formatAmount(currentSummary.totalIncome) }}</strong>
            </div>
            <div class="mobile-bill-overview__stat is-expense">
              <span>{{ overviewExpenseLabel }}</span>
              <strong>{{ formatAmount(currentSummary.totalExpense) }}</strong>
            </div>
          </div>

          <div class="mobile-bill-overview__watermark">¥</div>
        </div>
      </section>
      <MobilePageSkeleton v-else variant="report" />
    </div>

    <div v-if="!loading" class="mobile-bill-page__scroll">
      <section class="mobile-panel mobile-bill-list">
        <div class="mobile-bill-list__header is-compact">
          <div>
            <h2 class="mobile-section-title">{{ listTitle }}</h2>
          </div>
          <span class="mobile-chip is-active">共 {{ currentSummary.recordCount || 0 }} 笔</span>
        </div>

        <template v-if="activeBillType === 'monthly'">
          <div class="mobile-bill-table">
            <div class="mobile-bill-table__head">
              <span class="mobile-bill-table__cell is-month">月份</span>
              <span class="mobile-bill-table__cell">月收入</span>
              <span class="mobile-bill-table__cell">月支出</span>
              <span class="mobile-bill-table__cell">月结余</span>
            </div>
            <article
              v-for="item in monthlyItems"
              :key="item.month"
              class="mobile-bill-table__row"
              :class="{ 'is-empty': isEmptyMonth(item) }"
            >
              <span class="mobile-bill-table__cell is-month">{{ item.monthNumber }}月</span>
              <span class="mobile-bill-table__cell is-income">{{ formatAmount(item.income) }}</span>
              <span class="mobile-bill-table__cell is-expense">{{ formatAmount(item.expense) }}</span>
              <span
                class="mobile-bill-table__cell is-balance"
                :class="resolveBalanceClass(item.balance)"
              >
                {{ formatBalance(item.balance) }}
              </span>
            </article>
          </div>
        </template>

        <template v-else-if="yearlyBill.years.length">
          <div class="mobile-bill-table is-yearly">
            <div class="mobile-bill-table__head">
              <span class="mobile-bill-table__cell is-month">年份</span>
              <span class="mobile-bill-table__cell">年收入</span>
              <span class="mobile-bill-table__cell">年支出</span>
              <span class="mobile-bill-table__cell">年结余</span>
            </div>
            <article
              v-for="item in yearlyBill.years"
              :key="item.year"
              class="mobile-bill-table__row"
              :class="{ 'is-empty': isEmptyYear(item) }"
            >
              <span class="mobile-bill-table__cell is-month">{{ item.year }}年</span>
              <span class="mobile-bill-table__cell is-income">{{ formatAmount(item.income) }}</span>
              <span class="mobile-bill-table__cell is-expense">{{ formatAmount(item.expense) }}</span>
              <span
                class="mobile-bill-table__cell is-balance"
                :class="resolveBalanceClass(item.balance)"
              >
                {{ formatBalance(item.balance) }}
              </span>
            </article>
          </div>
        </template>

        <div v-else class="mobile-empty">
          当前暂无年账单数据。
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 移动端账单管理页面
 *
 * @author Codex
 * @date 2026-04-26
 */
import { computed, onMounted, ref } from 'vue'
import MobilePageSkeleton from '@/views/mobile/components/MobilePageSkeleton.vue'
import type * as T from '@/apis/bookkeeping/type'
import {
  createEmptyMonthlyBillResp,
  createEmptyYearlyBillResp,
  getMonthlyBill,
  getYearlyBill,
} from '@/apis/bookkeeping/bill'
import { useUserStore } from '@/stores'
import { mobileToast } from '@/utils/mobile-toast'

defineOptions({ name: 'MobileBill' })

const amountFormatter = new Intl.NumberFormat('zh-CN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const billTypeOptions: Array<{ label: string, value: T.BillType }> = [
  { label: '月账单', value: 'monthly' },
  { label: '年账单', value: 'yearly' },
]

const userStore = useUserStore()
const currentYear = String(new Date().getFullYear())
const currentUserId = computed(() => String(userStore.userInfo.id ?? ''))

const loading = ref(false)
const activeBillType = ref<T.BillType>('monthly')
const selectedYear = ref(currentYear)
const monthlyBill = ref<T.BillMonthlyResp>(createEmptyMonthlyBillResp(currentYear))
const yearlyBill = ref<T.BillYearlyResp>(createEmptyYearlyBillResp())

const currentSummary = computed(() =>
  activeBillType.value === 'monthly' ? monthlyBill.value.summary : yearlyBill.value.summary,
)

const monthlyItems = computed(() => {
  if (monthlyBill.value.months.length) {
    return monthlyBill.value.months
  }
  return createEmptyMonthlyBillResp(selectedYear.value).months
})

const overviewBalanceLabel = computed(() => (activeBillType.value === 'monthly' ? `${selectedYear.value} 年结余` : '总结余'))
const overviewIncomeLabel = computed(() => (activeBillType.value === 'monthly' ? '年收入' : '总收入'))
const overviewExpenseLabel = computed(() => (activeBillType.value === 'monthly' ? '年支出' : '总支出'))

const listTitle = computed(() => (activeBillType.value === 'monthly' ? `${selectedYear.value} 年月账单` : '全部年账单'))

function buildBaseQuery(): T.BillQuery {
  return {
    userId: currentUserId.value,
  }
}

function formatAmount(value: number | string | undefined | null) {
  const amount = Number(value || 0)
  return amountFormatter.format(Number.isFinite(amount) ? amount : 0)
}

function formatBalance(value: number | string | undefined | null) {
  const amount = Number(value || 0)
  const normalized = Number.isFinite(amount) ? amount : 0
  const prefix = normalized > 0 ? '+' : ''
  return `${prefix}${amountFormatter.format(normalized)}`
}

function resolveBalanceTone(value: number | string | undefined | null) {
  const amount = Number(value || 0)
  if (amount < 0) {
    return 'expense'
  }
  if (amount > 0) {
    return 'income'
  }
  return 'balance'
}

function resolveBalanceClass(value: number | string | undefined | null) {
  return `is-${resolveBalanceTone(value)}`
}

function isEmptyMonth(item: T.BillMonthItemResp) {
  return Number(item.income || 0) === 0
    && Number(item.expense || 0) === 0
    && Number(item.balance || 0) === 0
    && Number(item.recordCount || 0) === 0
}

function isEmptyYear(item: T.BillYearItemResp) {
  return Number(item.income || 0) === 0
    && Number(item.expense || 0) === 0
    && Number(item.balance || 0) === 0
    && Number(item.recordCount || 0) === 0
}

async function loadMonthlyBill() {
  loading.value = true
  try {
    const { data } = await getMonthlyBill({
      ...buildBaseQuery(),
      year: Number(selectedYear.value),
    })
    monthlyBill.value = data || createEmptyMonthlyBillResp(selectedYear.value)
  } catch {
    monthlyBill.value = createEmptyMonthlyBillResp(selectedYear.value)
    mobileToast.error('加载月账单失败')
  } finally {
    loading.value = false
  }
}

async function loadYearlyBill() {
  loading.value = true
  try {
    const { data } = await getYearlyBill(buildBaseQuery())
    yearlyBill.value = data || createEmptyYearlyBillResp()
  } catch {
    yearlyBill.value = createEmptyYearlyBillResp()
    mobileToast.error('加载年账单失败')
  } finally {
    loading.value = false
  }
}

async function loadActiveBill() {
  if (activeBillType.value === 'monthly') {
    await loadMonthlyBill()
    return
  }
  await loadYearlyBill()
}

async function handleBillTypeChange(value: T.BillType) {
  if (activeBillType.value === value) {
    return
  }
  activeBillType.value = value
  await loadActiveBill()
}

async function handleYearChange(offset: number) {
  selectedYear.value = String(Number(selectedYear.value) + offset)
  await loadMonthlyBill()
}

async function handleResetCurrentYear() {
  if (selectedYear.value === currentYear) {
    return
  }
  selectedYear.value = currentYear
  await loadMonthlyBill()
}

onMounted(async () => {
  await loadActiveBill()
})
</script>

<style scoped lang="scss">
.mobile-bill-page {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 8px;
  height: 100%;
  min-height: 0;
  margin-inline: -16px;
  padding-top: 0;
  padding-bottom: 0;
  overflow: hidden;
}

.mobile-bill-page__fixed {
  display: flex;
  flex: none;
  flex-direction: column;
  gap: 8px;
  min-height: 0;
}

.mobile-bill-page__scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  padding-bottom: calc(56px + env(safe-area-inset-bottom));
}

.mobile-bill-hero {
  padding: 14px 12px 12px;
  border-radius: 0 0 20px 20px;
}

.mobile-bill-hero__tab-group {
  display: inline-flex;
  gap: 6px;
  padding: 3px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 2px 8px rgba(197, 138, 18, 0.08);
}

.mobile-bill-hero__tab {
  min-width: 82px;
  min-height: 34px;
  padding: 0 16px;
  border: none;
  border-radius: 14px;
  background: transparent;
  color: #8b7350;
  font-size: 13px;
  font-weight: 600;
  backdrop-filter: blur(8px);
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.mobile-bill-hero__tab.is-active {
  background: linear-gradient(135deg, #f0c444 0%, #d9a92a 100%);
  color: #fff;
  box-shadow: 0 4px 12px rgba(217, 169, 42, 0.35);
  transform: scale(1.02);
}

.mobile-bill-hero__year-switch {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, auto));
  gap: 6px;
  margin-top: 10px;
  align-items: center;
}

.mobile-bill-hero__year-btn {
  min-height: 30px;
  padding: 0 10px;
  border: 1px solid rgba(197, 138, 18, 0.12);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.92);
  color: #7a6542;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.mobile-bill-hero__year-btn:active {
  transform: scale(0.96);
}

.mobile-bill-hero__year-btn.is-ghost {
  background: rgba(255, 250, 235, 0.95);
  border-color: rgba(217, 169, 42, 0.18);
}

.mobile-bill-hero__year-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.mobile-bill-hero__year-value {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 78px;
  min-height: 30px;
  padding: 0 12px;
  border-radius: 18px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(255, 252, 244, 0.95) 100%);
  box-shadow: 0 2px 8px rgba(197, 138, 18, 0.08);
  color: #4f3910;
  font-weight: 700;
}

.mobile-bill-hero__year-value span {
  font-size: 15px;
  line-height: 1.2;
  letter-spacing: 0.3px;
}

.mobile-bill-summary {
  display: block;
  padding: 0;
  background: transparent;
  border: none;
  box-shadow: none;
  backdrop-filter: none;
  border-radius: 0;
}

.mobile-bill-overview {
  position: relative;
  overflow: hidden;
  padding: 12px 12px 10px;
  border-radius: 0;
  background: linear-gradient(135deg, #ffd84d 0%, #ffc835 52%, #ffbd24 100%);
  box-shadow: 0 10px 24px rgba(217, 169, 42, 0.22);
}

.mobile-bill-overview__head {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.mobile-bill-overview__headline {
  display: flex;
  align-items: baseline;
  gap: 8px;
  min-width: 0;
}

.mobile-bill-overview__label {
  margin: 0;
  color: rgba(92, 57, 0, 0.74);
  font-size: 12px;
  font-weight: 700;
  line-height: 1.2;
  white-space: nowrap;
}

.mobile-bill-overview__balance {
  display: inline-block;
  margin-top: 0;
  color: #3d2b00;
  font-size: 24px;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.4px;
  white-space: nowrap;
}

.mobile-bill-overview__balance.is-income {
  color: #d32f2f;
}

.mobile-bill-overview__balance.is-expense {
  color: #389e0d;
}

.mobile-bill-overview__balance.is-balance {
  color: #3d2b00;
}

.mobile-bill-overview__stats {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-top: 6px;
}

.mobile-bill-overview__stat {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  min-width: 0;
}

.mobile-bill-overview__stat span {
  display: inline-block;
  color: rgba(91, 56, 0, 0.62);
  font-size: 10px;
  font-weight: 600;
  line-height: 1.2;
  white-space: nowrap;
}

.mobile-bill-overview__stat strong {
  display: inline-block;
  margin-top: 0;
  color: #4a3200;
  font-size: 15px;
  font-weight: 800;
  line-height: 1;
  white-space: nowrap;
}

.mobile-bill-overview__stat.is-income strong {
  color: var(--amount-income-primary);
}

.mobile-bill-overview__stat.is-expense strong {
  color: var(--amount-expense-primary);
}

.mobile-bill-overview__watermark {
  position: absolute;
  right: 10px;
  top: 0;
  color: rgba(255, 255, 255, 0.22);
  font-size: 72px;
  font-weight: 800;
  line-height: 1;
  pointer-events: none;
}

.mobile-bill-list {
  padding: 0 12px 12px;
  border-radius: 0;
}

.mobile-bill-list__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  position: sticky;
  top: 0;
  z-index: 2;
  margin: 0 -12px 0;
  padding: 8px 12px 8px;
  background: rgba(255, 250, 240, 0.96);
  backdrop-filter: blur(10px);
}

.mobile-bill-list__header.is-compact {
  margin-bottom: 8px;
}

.mobile-bill-list__header.is-compact .mobile-section-title {
  margin-bottom: 0;
  font-size: 14px;
}

.mobile-bill-list__note {
  margin: 4px 0 0;
  color: rgba(120, 94, 51, 0.58);
  font-size: 12px;
  line-height: 1.6;
}

.mobile-bill-list__stack {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 10px;
}

.mobile-bill-table {
  overflow: hidden;
  border-radius: 0;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: inset 0 0 0 1px rgba(238, 223, 194, 0.7);
}

.mobile-bill-list .mobile-chip {
  border-radius: 14px;
}

.mobile-bill-table__head,
.mobile-bill-table__row {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1.08fr);
  column-gap: 6px;
  align-items: center;
}

.mobile-bill-table__head {
  min-height: 26px;
  padding: 0 10px;
  background: rgba(255, 249, 237, 0.92);
}

.mobile-bill-table__row {
  min-height: 28px;
  padding: 0 10px;
  border-top: 1px solid rgba(238, 223, 194, 0.68);
}

.mobile-bill-table__row.is-empty {
  opacity: 0.58;
}

.mobile-bill-table.is-yearly .mobile-bill-table__head,
.mobile-bill-table.is-yearly .mobile-bill-table__row {
  grid-template-columns: 50px minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1.08fr);
}

.mobile-bill-table__cell {
  min-width: 0;
  color: #58472b;
  font-size: 11px;
  font-weight: 600;
  line-height: 1.2;
  text-align: right;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

.mobile-bill-table__head .mobile-bill-table__cell {
  color: rgba(102, 77, 35, 0.62);
  font-size: 10px;
  font-weight: 700;
}

.mobile-bill-table__cell.is-month {
  text-align: left;
  color: #2f2617;
}

.mobile-bill-table__cell.is-income {
  color: var(--amount-income-primary);
}

.mobile-bill-table__cell.is-expense {
  color: var(--amount-expense-primary);
}

.mobile-bill-table__cell.is-balance.is-income {
  color: var(--amount-income-primary);
}

.mobile-bill-table__cell.is-balance.is-expense {
  color: var(--amount-expense-primary);
}

.mobile-bill-table__cell.is-balance.is-balance {
  color: #6d5b3a;
}

.mobile-bill-card {
  padding: 18px 16px;
  border: none;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  transition: all 0.2s ease;
}

.mobile-bill-card:active {
  transform: scale(0.99);
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.06);
}

.mobile-bill-card__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.mobile-bill-card__meta {
  margin: 0 0 6px;
  color: rgba(120, 94, 51, 0.55);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.3px;
}

.mobile-bill-card__title {
  margin: 0;
  color: #2c2416;
  font-size: 20px;
  font-weight: 800;
  letter-spacing: 0.3px;
}

.mobile-bill-card__balance {
  padding: 7px 12px;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 700;
  white-space: nowrap;
  letter-spacing: 0.2px;
}

.mobile-bill-card__balance.is-income {
  background: linear-gradient(135deg, rgba(245, 34, 45, 0.12) 0%, rgba(245, 34, 45, 0.08) 100%);
  color: #d32f2f;
}

.mobile-bill-card__balance.is-expense {
  background: linear-gradient(135deg, rgba(82, 196, 26, 0.12) 0%, rgba(82, 196, 26, 0.08) 100%);
  color: #389e0d;
}

.mobile-bill-card__balance.is-balance {
  background: linear-gradient(135deg, rgba(217, 169, 42, 0.14) 0%, rgba(217, 169, 42, 0.08) 100%);
  color: #b8860b;
}

.mobile-bill-card__stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-top: 16px;
}

.mobile-bill-card__stat {
  padding: 12px 10px;
  border-radius: 14px;
  background: linear-gradient(135deg, rgba(255, 250, 235, 0.85) 0%, rgba(255, 253, 245, 0.75) 100%);
}

.mobile-bill-card__stat span {
  display: block;
  color: rgba(109, 82, 33, 0.62);
  font-size: 11px;
  font-weight: 600;
}

.mobile-bill-card__stat strong {
  display: block;
  margin-top: 7px;
  color: #3d2f1a;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.4;
  word-break: break-all;
  letter-spacing: 0.2px;
}

@media (max-width: 420px) {
  .mobile-bill-hero__year-switch {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .mobile-bill-hero__year-value {
    order: -1;
    grid-column: 1 / -1;
  }

  .mobile-bill-summary {
    display: block;
  }

  .mobile-bill-overview {
    padding: 10px 10px 9px;
  }

  .mobile-bill-overview__balance {
    font-size: 22px;
  }

  .mobile-bill-overview__stat strong {
    font-size: 13px;
  }

  .mobile-bill-table__head,
  .mobile-bill-table__row {
    grid-template-columns: 40px minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1.04fr);
    column-gap: 6px;
  }

  .mobile-bill-table.is-yearly .mobile-bill-table__head,
  .mobile-bill-table.is-yearly .mobile-bill-table__row {
    grid-template-columns: 48px minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1.04fr);
  }

  .mobile-bill-table__head,
  .mobile-bill-table__row {
    padding: 0 8px;
  }

  .mobile-bill-table__cell {
    font-size: 10px;
  }

  .mobile-bill-table__head .mobile-bill-table__cell {
    font-size: 9px;
  }
}
</style>
