<template>
  <div class="mobile-page mobile-bill-page">
    <div class="mobile-bill-page__fixed">
      <section class="mobile-panel mobile-bill-hero">
        <div class="mobile-bill-hero__mode-row">
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
          <div class="mobile-bill-hero__income">
            <span>总收入</span>
            <strong>{{ formatAmount(currentSummary.totalIncome) }}</strong>
          </div>
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
          <div class="mobile-bill-overview__metric-grid">
            <!-- 支出和结余使用双行结构，避免总值与实际值占用两个独立统计块。 -->
            <div class="mobile-bill-overview__metric-card">
              <div class="mobile-bill-overview__metric-row is-expense">
                <span>总支出</span>
                <strong>{{ formatAmount(currentSummary.totalExpense) }}</strong>
              </div>
              <div class="mobile-bill-overview__metric-row is-actual is-expense">
                <span>实际</span>
                <strong>{{ formatAmount(currentSummary.actualTotalExpense) }}</strong>
              </div>
            </div>
            <div class="mobile-bill-overview__metric-card">
              <div
                class="mobile-bill-overview__metric-row"
                :class="resolveBalanceClass(currentSummary.balance)"
              >
                <span>总结余</span>
                <strong>{{ formatBalance(currentSummary.balance) }}</strong>
              </div>
              <div
                class="mobile-bill-overview__metric-row is-actual"
                :class="resolveBalanceClass(currentSummary.actualBalance)"
              >
                <span>实际</span>
                <strong>{{ formatBalance(currentSummary.actualBalance) }}</strong>
              </div>
            </div>
            <!-- 条数保持单行展示，总条数和实际条数在同一个统计格内横向排列。 -->
            <div class="mobile-bill-overview__metric-card is-count">
              <div class="mobile-bill-overview__count-value">
                <span>总条数</span>
                <strong>{{ currentSummary.recordCount || 0 }} 笔</strong>
                <i aria-hidden="true">/</i>
                <span>实际</span>
                <strong>{{ currentSummary.actualRecordCount || 0 }} 笔</strong>
              </div>
            </div>
          </div>

          <div class="mobile-bill-overview__watermark">¥</div>
        </div>
      </section>
      <MobilePageSkeleton v-else variant="report" />
    </div>

    <div v-if="!loading" class="mobile-bill-page__scroll">
      <section class="mobile-panel mobile-bill-list">
        <template v-if="activeBillType === 'monthly'">
          <div class="mobile-bill-table">
            <div class="mobile-bill-table__head">
              <span class="mobile-bill-table__cell is-month">月份</span>
              <span class="mobile-bill-table__cell">月收入</span>
              <span class="mobile-bill-table__cell">月支出</span>
              <span class="mobile-bill-table__cell">月结余</span>
            </div>
            <template v-for="item in monthlyItems" :key="item.month">
              <article
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
              <article class="mobile-bill-table__row is-actual">
                <span class="mobile-bill-table__cell is-month">实际</span>
                <span class="mobile-bill-table__cell is-income">{{ formatAmount(item.actualTotalIncome) }}</span>
                <span class="mobile-bill-table__cell is-expense">{{ formatAmount(item.actualTotalExpense) }}</span>
                <span
                  class="mobile-bill-table__cell is-balance"
                  :class="resolveBalanceClass(item.actualBalance)"
                >
                  {{ formatBalance(item.actualBalance) }}
                </span>
              </article>
            </template>
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
              <span class="mobile-bill-table__cell is-month is-stacked">
                <span class="mobile-bill-table__cell-line">{{ item.year }}年</span>
                <span class="mobile-bill-table__cell-line is-actual">实际</span>
              </span>
              <span class="mobile-bill-table__cell is-income is-stacked">
                <span class="mobile-bill-table__cell-line">{{ formatAmount(item.income) }}</span>
                <span class="mobile-bill-table__cell-line is-actual is-income">
                  {{ formatAmount(item.actualTotalIncome) }}
                </span>
              </span>
              <span class="mobile-bill-table__cell is-expense is-stacked">
                <span class="mobile-bill-table__cell-line">{{ formatAmount(item.expense) }}</span>
                <span class="mobile-bill-table__cell-line is-actual is-expense">
                  {{ formatAmount(item.actualTotalExpense) }}
                </span>
              </span>
              <span
                class="mobile-bill-table__cell is-balance is-stacked"
                :class="resolveBalanceClass(item.balance)"
              >
                <span class="mobile-bill-table__cell-line">{{ formatBalance(item.balance) }}</span>
                <span
                  class="mobile-bill-table__cell-line is-actual"
                  :class="resolveBalanceClass(item.actualBalance)"
                >
                  {{ formatBalance(item.actualBalance) }}
                </span>
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
 * @update 2026-08-29 @Wangsongsong
 * @desc 月账单模式补充实际总支出、实际总收入、实际总结余和实际总条数展示，与 Web 端统计口径保持一致
 * @update 2026-08-29 @Wangsongsong
 * @desc 月账单列表在每个月份数据下补充实际收入、实际支出和实际结余
 * @update 2026-08-30 @Wangsongsong
 * @desc 月账单顶部将实际总收入和总收入合并到统计区最顶部同一行展示
 * @update 2026-08-30 @Wangsongsong
 * @desc 月账单顶部仅保留一个总收入展示，取消实际总收入的重复显示
 * @update 2026-08-30 @Wangsongsong
 * @desc 将唯一的总收入展示移动到月账单/年账单切换行右侧并保持垂直对齐
 * @update 2026-08-30 @Wangsongsong
 * @desc 总收入采用与上一年按钮一致的胶囊样式，统一顶部控件视觉
 * @update 2026-08-30 @Wangsongsong
 * @desc 将总支出与实际总支出、总结余与实际总结余合并为双行统计格
 * @update 2026-08-30 @Wangsongsong
 * @desc 将总条数与实际总条数合并到同一行统计格中
 * @update 2026-08-30 @Wangsongsong
 * @desc 统计卡金额颜色改为按每个数值自身的收支方向分别匹配列表颜色逻辑
 * @update 2026-08-30 @Wangsongsong
 * @desc 年账单列表各单元格增加第二行实际统计数据，与月账单实际数据展示保持一致
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

.mobile-bill-hero__mode-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
}

.mobile-bill-hero__tab-group {
  display: inline-flex;
  flex-shrink: 0;
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

.mobile-bill-hero__income {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
  min-width: 0;
  min-height: 30px;
  padding: 0 10px;
  border: 1px solid rgba(197, 138, 18, 0.12);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.92);
  color: #7a6542;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.mobile-bill-hero__income span,
.mobile-bill-hero__income strong {
  min-width: 0;
  white-space: nowrap;
}

.mobile-bill-hero__income span {
  overflow: hidden;
  color: inherit;
  font-size: 10px;
  font-weight: 600;
  text-overflow: ellipsis;
}

.mobile-bill-hero__income strong {
  color: var(--amount-income-primary);
  font-size: 12px;
  font-weight: 800;
  line-height: 1.2;
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

.mobile-bill-overview__metric-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
}

.mobile-bill-overview__metric-card {
  position: relative;
  z-index: 1;
  min-width: 0;
  padding: 6px 8px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.24);
}

.mobile-bill-overview__metric-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
  min-width: 0;
}

.mobile-bill-overview__metric-row + .mobile-bill-overview__metric-row {
  margin-top: 4px;
  padding-top: 4px;
  border-top: 1px solid rgba(137, 91, 0, 0.12);
}

.mobile-bill-overview__metric-row span,
.mobile-bill-overview__metric-row strong,
.mobile-bill-overview__count-value span,
.mobile-bill-overview__count-value strong {
  min-width: 0;
  white-space: nowrap;
}

.mobile-bill-overview__metric-row span,
.mobile-bill-overview__count-value span {
  overflow: hidden;
  color: rgba(91, 56, 0, 0.68);
  font-size: 10px;
  font-weight: 600;
  text-overflow: ellipsis;
}

.mobile-bill-overview__metric-row strong,
.mobile-bill-overview__count-value strong {
  font-size: 12px;
  font-weight: 800;
  line-height: 1.2;
}

.mobile-bill-overview__metric-row.is-income strong,
.mobile-bill-overview__metric-row.is-positive strong {
  color: var(--amount-income-primary);
}

.mobile-bill-overview__metric-row.is-expense strong,
.mobile-bill-overview__metric-row.is-negative strong {
  color: var(--amount-expense-primary);
}

.mobile-bill-overview__metric-row.is-balance strong,
.mobile-bill-overview__metric-row.is-count strong,
.mobile-bill-overview__count-value strong {
  color: #6d5b3a;
}

.mobile-bill-overview__metric-card.is-count {
  grid-column: 1 / -1;
}

.mobile-bill-overview__count-value {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  min-width: 0;
}

.mobile-bill-overview__count-value i {
  color: rgba(91, 56, 0, 0.42);
  font-size: 11px;
  font-style: normal;
  font-weight: 700;
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

.mobile-bill-table__row.is-actual {
  min-height: 22px;
  border-top: none;
  background: rgba(255, 255, 255, 0.5);
}

.mobile-bill-table__row.is-actual .mobile-bill-table__cell {
  color: rgba(102, 77, 35, 0.62);
  font-size: 10px;
  font-weight: 500;
}

.mobile-bill-table__row.is-actual .mobile-bill-table__cell.is-income {
  color: color-mix(in srgb, var(--amount-income-primary) 72%, #ffffff);
}

.mobile-bill-table__row.is-actual .mobile-bill-table__cell.is-expense {
  color: color-mix(in srgb, var(--amount-expense-primary) 72%, #ffffff);
}

.mobile-bill-table__row.is-actual .mobile-bill-table__cell.is-balance.is-income {
  color: color-mix(in srgb, var(--amount-income-primary) 72%, #ffffff);
}

.mobile-bill-table__row.is-actual .mobile-bill-table__cell.is-balance.is-expense {
  color: color-mix(in srgb, var(--amount-expense-primary) 72%, #ffffff);
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

.mobile-bill-table__cell.is-stacked {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: center;
  gap: 2px;
  min-height: 38px;
}

.mobile-bill-table__cell-line {
  display: block;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mobile-bill-table__cell-line.is-actual {
  color: rgba(102, 77, 35, 0.62);
  font-size: 10px;
  font-weight: 500;
}

.mobile-bill-table__cell-line.is-actual.is-income {
  color: color-mix(in srgb, var(--amount-income-primary) 72%, #ffffff);
}

.mobile-bill-table__cell-line.is-actual.is-expense {
  color: color-mix(in srgb, var(--amount-expense-primary) 72%, #ffffff);
}

.mobile-bill-table__cell-line.is-actual.is-balance.is-income {
  color: color-mix(in srgb, var(--amount-income-primary) 72%, #ffffff);
}

.mobile-bill-table__cell-line.is-actual.is-balance.is-expense {
  color: color-mix(in srgb, var(--amount-expense-primary) 72%, #ffffff);
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
