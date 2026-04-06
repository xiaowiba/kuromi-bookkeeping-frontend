<template>
  <GiPageLayout :body-style="{ overflowY: 'auto', overflowX: 'hidden' }">
    <div class="report-calendar-page">
      <div class="report-calendar-page__search">
        <GiForm
          v-model="queryForm"
          search
          :columns="queryFormColumns"
          size="medium"
          @search="handleSearch"
          @reset="handleReset"
        >
          <template #subjectId>
            <div class="subject-query-radio-scroll">
              <a-radio-group
                v-model="queryForm.subjectId"
                :options="subjectQueryOptions"
              />
            </div>
          </template>

          <template #tagId>
            <div class="subject-query-radio-scroll">
              <a-radio-group
                v-model="queryForm.tagId"
                :options="tagQueryOptions"
                :disabled="!queryForm.subjectId"
              />
            </div>
          </template>

          <template #paymentMethod>
            <div class="subject-query-radio-scroll">
              <a-radio-group
                v-model="queryForm.paymentMethod"
                :options="paymentMethodQueryOptions"
              />
            </div>
          </template>

          <template #viewMode>
            <a-radio-group
              v-model="queryForm.viewMode"
              type="button"
              size="small"
              class="report-calendar-filter__mode"
              @change="handleViewModeChange"
            >
              <a-radio value="month">月视图</a-radio>
              <a-radio value="year">年视图</a-radio>
            </a-radio-group>
          </template>

          <template #anchorDate>
            <div class="report-calendar-filter__anchor">
              <a-month-picker
                v-if="queryForm.viewMode === 'month'"
                :model-value="anchorPickerValue"
                class="report-calendar-filter__picker"
                format="YYYY-MM"
                value-format="YYYY-MM"
                :allow-clear="false"
                @change="handleAnchorPickerChange"
              />
              <a-year-picker
                v-else
                :model-value="anchorPickerValue"
                class="report-calendar-filter__picker"
                format="YYYY"
                value-format="YYYY"
                :allow-clear="false"
                @change="handleAnchorPickerChange"
              />
              <span class="report-calendar-filter__range">
                {{ rangeText }}
              </span>
            </div>
          </template>
        </GiForm>
      </div>

      <div class="report-calendar-summary">
        <div
          v-for="item in summaryCards"
          :key="item.label"
          class="report-calendar-summary__item"
          :class="item.tone"
        >
          <span class="report-calendar-summary__label">{{ item.label }}</span>
          <strong class="report-calendar-summary__value">{{ item.value }}</strong>
        </div>
      </div>

      <div class="report-calendar-layout">
        <ReportPanelShell
          title="日历总览"
          :description="calendarPanelDescription"
          :loading="calendarLoading"
        >
          <template #toolbar>
            <div class="report-calendar-toolbar">
              <a-button-group>
                <a-button @click="handleShiftPeriod(-1)">上一{{ queryForm.viewMode === 'month' ? '月' : '年' }}</a-button>
                <a-button @click="handleBackToToday">回到今天</a-button>
                <a-button @click="handleShiftPeriod(1)">下一{{ queryForm.viewMode === 'month' ? '月' : '年' }}</a-button>
              </a-button-group>
              <span class="report-calendar-toolbar__label">{{ anchorLabel }}</span>
            </div>
          </template>

          <div v-if="queryForm.viewMode === 'month'" class="report-calendar-month">
            <div class="report-calendar-weekdays">
              <span
                v-for="weekday in calendarWeekdays"
                :key="weekday"
                class="report-calendar-weekdays__item"
              >
                {{ weekday }}
              </span>
            </div>

            <div class="report-calendar-grid">
              <button
                v-for="cell in monthCalendarCells"
                :key="cell.date"
                type="button"
                class="report-calendar-cell"
                :class="{
                  'report-calendar-cell--muted': !cell.inCurrentView,
                  'report-calendar-cell--selected': cell.isSelected,
                  'report-calendar-cell--today': cell.isToday,
                  'report-calendar-cell--active': !!cell.stat,
                  [getMonthCellToneClass(cell)]: !!cell.stat,
                }"
                @click="handleCalendarCellClick(cell)"
              >
                <div class="report-calendar-cell__head">
                  <span class="report-calendar-cell__date">{{ cell.dayText }}</span>
                  <span v-if="cell.isSelected" class="report-calendar-cell__selected-badge">已选</span>
                </div>

                <div v-if="cell.stat" class="report-calendar-cell__metrics">
                  <span class="report-calendar-metric-chip expense">
                    <span class="label">支出</span>
                    <span class="value">{{ formatReportCurrency(cell.stat.expense, { compact: true }) }}</span>
                  </span>
                  <span class="report-calendar-metric-chip income">
                    <span class="label">收入</span>
                    <span class="value">{{ formatReportCurrency(cell.stat.income, { compact: true }) }}</span>
                  </span>
                  <span
                    class="report-calendar-metric-chip balance"
                    :class="getBalanceToneClass(cell.stat.balance)"
                  >
                    <span class="label">结余</span>
                    <span class="value">{{ formatBalanceCurrency(cell.stat.balance, true) }}</span>
                  </span>
                  <span class="report-calendar-metric-chip neutral">
                    <span class="label">笔数</span>
                    <span class="value">{{ cell.stat.recordCount }}</span>
                  </span>
                </div>
              </button>
            </div>
          </div>

          <div v-else class="report-calendar-year">
            <div
              v-for="panel in yearCalendarPanels"
              :key="panel.monthKey"
              class="report-calendar-mini-month"
            >
              <div class="report-calendar-mini-month__head">
                <strong>{{ panel.monthText }}</strong>
                <div class="report-calendar-mini-month__meta">
                  <span class="expense">支 {{ formatReportCurrency(panel.stat?.expense ?? 0, { compact: true }) }}</span>
                  <span class="income">收 {{ formatReportCurrency(panel.stat?.income ?? 0, { compact: true }) }}</span>
                  <span
                    class="balance"
                    :class="getBalanceToneClass(panel.stat?.balance ?? 0)"
                  >
                    余 {{ formatBalanceCurrency(panel.stat?.balance ?? 0, true) }}
                  </span>
                  <span class="count">笔 {{ panel.stat?.recordCount ?? 0 }}</span>
                </div>
              </div>

              <div class="report-calendar-mini-month__weekdays">
                <span
                  v-for="weekday in calendarWeekdays"
                  :key="`${panel.monthKey}-${weekday}`"
                  class="report-calendar-mini-month__weekday"
                >
                  {{ weekday }}
                </span>
              </div>

              <div class="report-calendar-mini-grid">
                <button
                  v-for="cell in panel.cells"
                  :key="`${panel.monthKey}-${cell.date}`"
                  type="button"
                  class="report-calendar-mini-cell"
                  :class="{
                    'report-calendar-mini-cell--muted': !cell.inCurrentView,
                    'report-calendar-mini-cell--selected': cell.isSelected,
                    'report-calendar-mini-cell--today': cell.isToday,
                    'report-calendar-mini-cell--active': !!cell.stat,
                    [getYearCellToneClass(cell)]: !!cell.stat,
                  }"
                  @click="handleCalendarCellClick(cell)"
                >
                  <span>{{ cell.inCurrentView ? cell.dayText : '' }}</span>
                </button>
              </div>
            </div>
          </div>
        </ReportPanelShell>

        <ReportPanelShell
          title="日期详情"
          :description="detailPanelDescription"
          :loading="dayDetailLoading"
        >
          <div v-if="selectedDate" class="report-calendar-detail">
            <div class="report-calendar-detail__summary">
              <div class="report-calendar-detail__summary-item expense">
                <span class="label">支出</span>
                <strong class="value">{{ formatReportCurrency(dayDetail.summary.expense) }}</strong>
              </div>
              <div class="report-calendar-detail__summary-item income">
                <span class="label">收入</span>
                <strong class="value">{{ formatReportCurrency(dayDetail.summary.income) }}</strong>
              </div>
              <div
                class="report-calendar-detail__summary-item balance"
                :class="getBalanceToneClass(dayDetail.summary.balance)"
              >
                <span class="label">结余</span>
                <strong class="value">{{ formatBalanceCurrency(dayDetail.summary.balance) }}</strong>
              </div>
              <div class="report-calendar-detail__summary-item neutral">
                <span class="label">记录数</span>
                <strong class="value">{{ dayDetail.summary.recordCount }}</strong>
              </div>
            </div>

            <a-empty
              v-if="!resolvedDayDetailItems.length"
              description="当前日期暂无明细"
              class="report-calendar-detail__empty"
            />

            <div v-else class="report-calendar-detail__list">
              <div
                v-for="item in resolvedDayDetailItems"
                :key="item.id"
                class="report-calendar-detail__item"
              >
                <div class="report-calendar-detail__item-main">
                  <BookkeepingSubjectDetailCell
                    :icon="item.subjectIcon"
                    :subject-name="item.subjectName"
                    :detail-name="item.detailName"
                  />
                  <div class="report-calendar-detail__item-meta">
                    <div class="report-calendar-detail__item-tags">
                      <GiCellTag :value="item.category" :dict="bk_subject_category" />
                      <GiCellTag :value="item.paymentMethod || 'default'" :dict="bk_payment_method" />
                      <a-tag v-if="item.tagName" size="small" color="arcoblue">{{ item.tagName }}</a-tag>
                      <a-tag size="small">{{ item.userName }}</a-tag>
                    </div>
                    <p v-if="item.remark" class="report-calendar-detail__remark">{{ item.remark }}</p>
                  </div>
                </div>
                <div
                  class="report-calendar-detail__item-amount"
                  :class="item.category === 'income' ? 'income' : 'expense'"
                >
                  {{ formatReportSignedAmount(item.amount, item.category, { currency: true }) }}
                </div>
              </div>
            </div>
          </div>

          <a-empty
            v-else
            description="请选择左侧日历中的日期"
            class="report-calendar-detail__empty"
          />
        </ReportPanelShell>
      </div>
    </div>
  </GiPageLayout>
</template>

<script setup lang="ts">
/**
 * Web 端日历报表页面。
 *
 * 页面职责：
 * 1. 提供按用户、分类、科目、标签、支付方式筛选的日历报表入口。
 * 2. 支持月视图、年视图切换和周期跳转。
 * 3. 左侧展示日历聚合，右侧展示选中日期的完整明细。
 */
import { Message } from '@arco-design/web-vue'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import dayjs from 'dayjs'
import BookkeepingSubjectDetailCell from '../shared/components/BookkeepingSubjectDetailCell.vue'
import ReportPanelShell from '../report/components/ReportPanelShell.vue'
import {
  CALENDAR_WEEKDAY_LABELS,
  type CalendarCellItem,
  buildMonthCalendarCells,
  buildYearCalendarPanels,
  createDefaultReportCalendarForm,
  createEmptyReportCalendar,
  createEmptyReportCalendarDayDetail,
  formatCalendarAnchorLabel,
  normalizeCalendarAnchorDate,
  shiftCalendarAnchorDate,
} from './shared/calendarReport'
import {
  formatReportCurrency,
  formatReportDate,
  formatReportSignedAmount,
  formatReportWeekday,
  resolveReportPaymentMethodLabel,
} from '@/views/bookkeeping/report/shared/reportFormat'
import { getReportCalendar, getReportCalendarDayDetail } from '@/apis/bookkeeping/report-calendar'
import type * as T from '@/apis/bookkeeping/type'
import type { ColumnItem } from '@/components/GiForm'
import { useDict } from '@/hooks/app'
import { usePrivacyStore } from '@/stores'
import { useBookkeepingCommonFilters } from '@/views/bookkeeping/shared/useBookkeepingCommonFilters'

defineOptions({ name: 'BookkeepingReportCalendar' })

const privacyStore = usePrivacyStore()
const { bk_subject_category, bk_payment_method } = useDict('bk_subject_category', 'bk_payment_method')

const queryForm = reactive<T.ReportCalendarFilterForm>(createDefaultReportCalendarForm())
const calendarLoading = ref(false)
const dayDetailLoading = ref(false)
const calendarData = ref<T.ReportCalendarResp>(createEmptyReportCalendar())
const dayDetail = ref<T.ReportCalendarDayDetailResp>(createEmptyReportCalendarDayDetail())
const selectedDate = ref('')

/** 复用明细页的通用筛选项，只保留日历页自己的视图模式与统计周期。 */
const {
  subjectQueryOptions,
  tagQueryOptions,
  paymentMethodQueryOptions,
  loadCommonFilterOptions,
  createCommonQueryColumns,
} = useBookkeepingCommonFilters({
  form: queryForm,
  labels: {
    userAll: '全部用户',
    categoryAll: '全部',
    subjectAll: '全部科目',
    paymentAll: '全部',
  },
})

/**
 * 日历页在共享筛选基础上插入“日历视图”和“统计周期”两个专属条件。
 *
 * 布局规则：
 * 1. 第一行：日历视图 + 统计周期
 * 2. 第二行：所属用户 + 分类
 * 3. 第三行：科目
 * 4. 第四行：标签
 * 5. 第五行：支付方式
 */
const commonQueryColumns = createCommonQueryColumns({
  user: {
    span: { xs: 24, sm: 12, xxl: 12 },
    useRadioGroup: true,
    placeholder: '请选择所属用户',
    allowSearch: true,
  },
  category: {
    span: { xs: 24, sm: 12, xxl: 12 },
    useRadioGroup: true,
    placeholder: '请选择分类',
  },
  subject: {
    span: { xs: 24, sm: 24, xxl: 24 },
    useRadioGroup: true,
    placeholder: '请选择科目',
    allowSearch: true,
  },
  tag: {
    span: { xs: 24, sm: 24, xxl: 24 },
    useRadioGroup: true,
    placeholder: '请选择标签',
    allowSearch: true,
  },
  paymentMethod: {
    span: { xs: 24, sm: 24, xxl: 24 },
    useRadioGroup: true,
    placeholder: '请选择支付方式',
  },
})

const queryFormColumns: ColumnItem[] = reactive([
  {
    label: '日历视图',
    field: 'viewMode',
    span: { xs: 24, sm: 6, xxl: 6 },
  },
  {
    label: '统计周期',
    field: 'anchorDate',
    span: { xs: 24, sm: 18, xxl: 18 },
  },
  commonQueryColumns.userColumn,
  commonQueryColumns.categoryColumn,
  commonQueryColumns.subjectColumn,
  commonQueryColumns.tagColumn,
  commonQueryColumns.paymentMethodColumn,
])

const calendarWeekdays = CALENDAR_WEEKDAY_LABELS

const anchorPickerValue = computed(() => {
  return queryForm.viewMode === 'year'
    ? dayjs(queryForm.anchorDate).format('YYYY')
    : dayjs(queryForm.anchorDate).format('YYYY-MM')
})

const anchorLabel = computed(() => formatCalendarAnchorLabel(queryForm.anchorDate, queryForm.viewMode))

const rangeText = computed(() => {
  if (!calendarData.value.rangeStart || !calendarData.value.rangeEnd) {
    return '当前周期暂无统计区间'
  }
  return `${formatReportDate(calendarData.value.rangeStart)} 至 ${formatReportDate(calendarData.value.rangeEnd)}`
})

type BalanceTone = 'positive' | 'negative' | 'neutral'

/** 统一结余正负口径，方便月格子、年格子和右侧汇总区复用同一套样式语义。 */
const getBalanceTone = (value: number | string | undefined | null): BalanceTone => {
  const numericValue = Number(value ?? 0)
  if (numericValue > 0) {
    return 'positive'
  }
  if (numericValue < 0) {
    return 'negative'
  }
  return 'neutral'
}

/** 结余为正时补充加号，保证盈亏方向在视觉上更直观。 */
const formatBalanceCurrency = (value: number | string | undefined | null, compact = false) => {
  const numericValue = Number(value ?? 0)
  return formatReportCurrency(numericValue, { signed: numericValue > 0, compact })
}

const getBalanceToneClass = (value: number | string | undefined | null) => {
  return `is-${getBalanceTone(value)}`
}

const getMonthCellToneClass = (cell: CalendarCellItem) => {
  if (!cell.stat) {
    return ''
  }
  return `report-calendar-cell--${getBalanceTone(cell.stat.balance)}`
}

const getYearCellToneClass = (cell: CalendarCellItem) => {
  if (!cell.stat) {
    return ''
  }
  return `report-calendar-mini-cell--${getBalanceTone(cell.stat.balance)}`
}

const summaryCards = computed(() => {
  const summary = calendarData.value.summary
  return [
    {
      label: '总支出',
      value: formatReportCurrency(summary.totalExpense),
      tone: 'expense',
    },
    {
      label: '总收入',
      value: formatReportCurrency(summary.totalIncome),
      tone: 'income',
    },
    {
      label: '结余',
      value: formatBalanceCurrency(summary.balance),
      tone: getBalanceTone(summary.balance),
    },
    {
      label: '记录数',
      value: `${summary.recordCount} 笔`,
      tone: 'neutral',
    },
  ]
})

const calendarPanelDescription = computed(() => {
  return `展示周期：${rangeText.value || '暂无'}`
})

const detailPanelDescription = computed(() => {
  if (!selectedDate.value) {
    return '从左侧点击某一天后，这里会展示当天的完整明细。'
  }
  const weekday = formatReportWeekday(selectedDate.value)
  return `${formatReportDate(selectedDate.value, 'YYYY年M月D日')} ${weekday}`
})

const monthCalendarCells = computed(() => {
  return buildMonthCalendarCells(queryForm.anchorDate, calendarData.value.dayStats ?? [], selectedDate.value)
})

const yearCalendarPanels = computed(() => {
  return buildYearCalendarPanels(
    queryForm.anchorDate,
    calendarData.value.dayStats ?? [],
    calendarData.value.monthStats ?? [],
    selectedDate.value,
  )
})

const resolvedDayDetailItems = computed(() => {
  return (dayDetail.value.details ?? []).map((item) => ({
    ...item,
    paymentMethodLabel: resolveReportPaymentMethodLabel(item.paymentMethod, item.paymentMethodLabel, paymentMethodQueryOptions.value),
  }))
})

/**
 * 组装日历报表查询参数。
 *
 * 这里统一负责裁剪空值，避免把无意义的空字符串传给后端，
 * 同时固定带上隐私模式状态，确保口径和其他记账页面一致。
 */
const buildCalendarQuery = (overrides: Partial<T.ReportCalendarQuery> = {}): T.ReportCalendarQuery => {
  const query: T.ReportCalendarQuery = {
    viewMode: queryForm.viewMode,
    anchorDate: normalizeCalendarAnchorDate(queryForm.anchorDate, queryForm.viewMode),
    privacyMode: privacyStore.isPrivacyMode,
  }

  if (queryForm.category) {
    query.category = queryForm.category
  }
  if (queryForm.subjectId) {
    query.subjectId = queryForm.subjectId
  }
  if (queryForm.tagId) {
    query.tagId = queryForm.tagId
  }
  if (queryForm.paymentMethod) {
    query.paymentMethod = queryForm.paymentMethod
  }
  if (queryForm.userId) {
    query.userId = queryForm.userId
  }

  return {
    ...query,
    ...overrides,
  }
}

const clearDayDetail = () => {
  selectedDate.value = ''
  dayDetail.value = createEmptyReportCalendarDayDetail()
}

const loadCalendar = async (preferredDate?: string) => {
  calendarLoading.value = true
  try {
    const { data } = await getReportCalendar(buildCalendarQuery(preferredDate ? { date: preferredDate } : {}))
    calendarData.value = data || createEmptyReportCalendar()
    queryForm.viewMode = calendarData.value.viewMode || queryForm.viewMode
    queryForm.anchorDate = normalizeCalendarAnchorDate(calendarData.value.anchorDate || queryForm.anchorDate, queryForm.viewMode)
  } catch {
    calendarData.value = createEmptyReportCalendar()
    Message.error('加载日历报表失败')
  } finally {
    calendarLoading.value = false
  }
}

/**
 * 加载某一天的完整明细。
 *
 * 右侧详情区单独 loading，这样用户在切换日期时，
 * 左侧整个日历不会反复闪烁。
 */
const loadDayDetail = async (date: string) => {
  if (!date) {
    clearDayDetail()
    return
  }

  dayDetailLoading.value = true
  selectedDate.value = date
  try {
    const { data } = await getReportCalendarDayDetail(buildCalendarQuery({ date }))
    dayDetail.value = data || createEmptyReportCalendarDayDetail()
  } catch {
    dayDetail.value = createEmptyReportCalendarDayDetail()
    dayDetail.value.date = date
    Message.error('加载日期详情失败')
  } finally {
    dayDetailLoading.value = false
  }
}

/**
 * 统一执行查询。
 *
 * 先加载左侧总览，再根据后端返回的默认日期决定右侧详情区展示哪一天，
 * 保证月份切换和筛选切换后的默认选中口径一致。
 */
const searchMethod = async (preferredDate?: string) => {
  await loadCalendar(preferredDate)
  const nextDate = calendarData.value.defaultSelectedDate || ''
  if (!nextDate) {
    clearDayDetail()
    return
  }
  await loadDayDetail(nextDate)
}

const handleSearch = async () => {
  await searchMethod()
}

const handleReset = async () => {
  Object.assign(queryForm, createDefaultReportCalendarForm())
  clearDayDetail()
  await searchMethod()
}

const handleViewModeChange = async (value: string | number | boolean) => {
  queryForm.viewMode = String(value) as T.ReportCalendarViewMode
  queryForm.anchorDate = normalizeCalendarAnchorDate(queryForm.anchorDate, queryForm.viewMode)
  await searchMethod(selectedDate.value || undefined)
}

const handleAnchorPickerChange = async (value?: string) => {
  queryForm.anchorDate = normalizeCalendarAnchorDate(value || queryForm.anchorDate, queryForm.viewMode)
  await searchMethod(selectedDate.value || undefined)
}

const handleShiftPeriod = async (offset: number) => {
  queryForm.anchorDate = shiftCalendarAnchorDate(queryForm.anchorDate, queryForm.viewMode, offset)
  await searchMethod(selectedDate.value || undefined)
}

const handleBackToToday = async () => {
  const today = dayjs().format('YYYY-MM-DD')
  queryForm.anchorDate = normalizeCalendarAnchorDate(today, queryForm.viewMode)
  await searchMethod(today)
}

/**
 * 点击日历格子后的处理规则：
 * 1. 月视图点击前后月的占位日期时，直接跳转到对应月份。
 * 2. 点击当前周期内日期时，只刷新右侧详情区。
 */
const handleCalendarCellClick = async (cell: CalendarCellItem) => {
  if (!cell.inCurrentView) {
    if (queryForm.viewMode === 'month') {
      queryForm.anchorDate = normalizeCalendarAnchorDate(cell.date, 'month')
      await searchMethod(cell.date)
    }
    return
  }
  await loadDayDetail(cell.date)
}

/**
 * 隐私模式切换或自动过期后，重新按最新口径加载总览与详情。
 *
 * 这里不强行保留旧选中日期，让后端重新计算默认日期，
 * 避免旧日期在新口径下已经无数据时仍停留在空白详情。
 */
watch(
  () => privacyStore.isPrivacyMode,
  () => {
    void searchMethod()
  },
)

onMounted(async () => {
  await loadCommonFilterOptions()
  await searchMethod()
})
</script>

<style scoped lang="scss">
.report-calendar-page {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 4px;
}

.report-calendar-page__search {
  padding: 16px 18px 6px;
  border: 1px solid rgba(229, 230, 235, 0.9);
  border-radius: 16px;
  background: var(--color-bg-1);
}

.report-calendar-filter__mode {
  width: 100%;
  flex-wrap: wrap;
}

.report-calendar-filter__anchor {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: nowrap;
}

.report-calendar-filter__picker {
  flex: 0 0 240px;
  width: 240px;
}

.report-calendar-filter__range {
  flex: 0 1 auto;
  color: var(--color-text-3);
  font-size: 13px;
  line-height: 1.6;
  white-space: nowrap;
}

.subject-query-radio-scroll {
  width: 100%;
  overflow: visible;

  :deep(.arco-radio-group) {
    display: flex;
    flex-wrap: wrap;
    width: 100%;
  }

  :deep(.arco-radio) {
    flex: 0 0 auto;
    margin-right: 16px;
    margin-bottom: 8px;
    white-space: nowrap;
  }

  :deep(.arco-radio-label) {
    white-space: nowrap;
  }
}

.report-calendar-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding: 12px 16px;
  border: 1px solid rgba(229, 230, 235, 0.9);
  border-radius: 16px;
  background: var(--color-bg-1);
}

.report-calendar-summary__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex: 1 1 220px;
  min-height: 44px;
  padding: 10px 14px;
  border-radius: 12px;
  border: 1px solid rgba(229, 230, 235, 0.7);
  background: rgba(255, 255, 255, 0.92);
}

.report-calendar-summary__item.expense,
.report-calendar-summary__item.negative {
  background: linear-gradient(135deg, rgba(255, 236, 232, 0.9), rgba(255, 255, 255, 0.98));
}

.report-calendar-summary__item.income,
.report-calendar-summary__item.positive {
  background: linear-gradient(135deg, rgba(232, 255, 237, 0.92), rgba(255, 255, 255, 0.98));
}

.report-calendar-summary__item.neutral {
  background: linear-gradient(135deg, rgba(242, 243, 245, 0.92), rgba(255, 255, 255, 0.98));
}

.report-calendar-summary__label {
  color: var(--color-text-2);
  font-size: 13px;
  white-space: nowrap;
}

.report-calendar-summary__value {
  color: var(--color-text-1);
  font-size: 18px;
  font-weight: 700;
  white-space: nowrap;
}

.report-calendar-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 380px;
  gap: 18px;
  align-items: start;
}

.report-calendar-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.report-calendar-toolbar__label {
  color: var(--color-text-2);
  font-size: 13px;
  font-weight: 600;
}

.report-calendar-weekdays {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 10px;
}

.report-calendar-weekdays__item {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 36px;
  color: var(--color-text-2);
  font-size: 13px;
  font-weight: 600;
}

.report-calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 10px;
}

.report-calendar-cell {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 154px;
  padding: 12px;
  text-align: left;
  border: 1px solid rgba(229, 230, 235, 0.9);
  border-radius: 14px;
  background: #fff;
  cursor: pointer;
  transition: all 0.2s ease;
}

.report-calendar-cell:hover {
  border-color: rgb(var(--primary-4));
  transform: translateY(-1px);
}

.report-calendar-cell--muted {
  background: rgba(247, 248, 250, 0.75);
  color: var(--color-text-4);
}

.report-calendar-cell--today {
  box-shadow: inset 0 0 0 1px rgba(var(--primary-6), 0.35);
}

.report-calendar-cell--selected {
  border-color: rgb(var(--primary-6));
  box-shadow: 0 10px 24px rgba(var(--primary-6), 0.14);
}

.report-calendar-cell--active {
  background: linear-gradient(180deg, rgba(247, 249, 255, 0.98), rgba(255, 255, 255, 1));
}

.report-calendar-cell--positive {
  background: linear-gradient(180deg, rgba(232, 255, 237, 0.96), rgba(255, 255, 255, 1));
  border-color: rgba(0, 180, 42, 0.2);
}

.report-calendar-cell--negative {
  background: linear-gradient(180deg, rgba(255, 236, 232, 0.96), rgba(255, 255, 255, 1));
  border-color: rgba(245, 63, 63, 0.2);
}

.report-calendar-cell--neutral {
  background: linear-gradient(180deg, rgba(247, 249, 255, 0.98), rgba(255, 255, 255, 1));
}

.report-calendar-cell__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.report-calendar-cell__date {
  color: var(--color-text-1);
  font-size: 16px;
  font-weight: 700;
}

.report-calendar-cell__selected-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 20px;
  padding: 0 8px;
  border-radius: 999px;
  background: rgba(var(--primary-6), 0.92);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
  box-shadow: 0 4px 10px rgba(var(--primary-6), 0.2);
}

.report-calendar-cell__metrics {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: auto;
}

.report-calendar-metric-chip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: 24px;
  padding: 0 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
  background: rgba(247, 248, 250, 0.92);
  color: var(--color-text-2);
  overflow: hidden;
}

.report-calendar-metric-chip .label,
.report-calendar-metric-chip .value {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.report-calendar-metric-chip .label {
  flex: 0 0 auto;
}

.report-calendar-metric-chip .value {
  flex: 1;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.report-calendar-metric-chip.expense,
.report-calendar-mini-month__meta .expense,
.report-calendar-detail__summary-item.expense .value {
  color: #f53f3f;
}

.report-calendar-metric-chip.income,
.report-calendar-mini-month__meta .income,
.report-calendar-detail__summary-item.income .value {
  color: #00b42a;
}

.report-calendar-metric-chip.balance.is-positive,
.report-calendar-mini-month__meta .balance.is-positive,
.report-calendar-detail__summary-item.balance.is-positive {
  color: #00b42a;
  background: rgba(232, 255, 237, 0.95);
}

.report-calendar-metric-chip.balance.is-negative,
.report-calendar-mini-month__meta .balance.is-negative,
.report-calendar-detail__summary-item.balance.is-negative {
  color: #f53f3f;
  background: rgba(255, 236, 232, 0.95);
}

.report-calendar-metric-chip.balance.is-neutral,
.report-calendar-mini-month__meta .balance.is-neutral,
.report-calendar-detail__summary-item.balance.is-neutral {
  color: var(--color-text-2);
  background: rgba(242, 243, 245, 0.95);
}

.report-calendar-year {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.report-calendar-mini-month {
  padding: 12px;
  border: 1px solid rgba(229, 230, 235, 0.9);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.96);
}

.report-calendar-mini-month__head {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 10px;
}

.report-calendar-mini-month__head strong {
  color: var(--color-text-1);
  font-size: 15px;
}

.report-calendar-mini-month__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  color: var(--color-text-3);
  font-size: 11px;
}

.report-calendar-mini-month__meta .balance {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 22px;
  padding: 0 8px;
  border-radius: 999px;
}

.report-calendar-mini-month__weekdays,
.report-calendar-mini-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 4px;
}

.report-calendar-mini-month__weekday {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-3);
  font-size: 11px;
  min-height: 22px;
}

.report-calendar-mini-cell {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 28px;
  border: 1px solid transparent;
  border-radius: 8px;
  background: rgba(247, 248, 250, 0.8);
  color: var(--color-text-2);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.report-calendar-mini-cell--muted {
  color: transparent;
  background: transparent;
  cursor: default;
}

.report-calendar-mini-cell--active {
  color: rgb(var(--primary-6));
  background: rgba(var(--primary-1), 0.8);
}

.report-calendar-mini-cell--positive {
  color: #0f7b1d;
  background: rgba(0, 180, 42, 0.16);
}

.report-calendar-mini-cell--negative {
  color: #b71d18;
  background: rgba(245, 63, 63, 0.16);
}

.report-calendar-mini-cell--neutral {
  color: var(--color-text-2);
  background: rgba(247, 248, 250, 0.96);
}

.report-calendar-mini-cell--today {
  border-color: rgba(var(--primary-5), 0.55);
}

.report-calendar-mini-cell--selected {
  font-weight: 700;
  border-color: rgba(var(--primary-6), 0.65);
  box-shadow:
    inset 0 0 0 1px rgba(var(--primary-6), 0.28),
    0 6px 14px rgba(var(--primary-6), 0.18);
  transform: translateY(-1px);
}

.report-calendar-detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.report-calendar-detail__summary {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.report-calendar-detail__summary-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex: 1 1 160px;
  min-height: 44px;
  padding: 10px 14px;
  border-radius: 10px;
  background: rgba(247, 248, 250, 0.9);
}

.report-calendar-detail__summary-item .label {
  color: var(--color-text-3);
  font-size: 12px;
  white-space: nowrap;
}

.report-calendar-detail__summary-item .value {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text-1);
  white-space: nowrap;
}

.report-calendar-detail__list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: min(960px, calc(100vh - 360px));
  overflow-y: auto;
  padding-right: 4px;
}

.report-calendar-detail__item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  padding: 14px;
  border: 1px solid rgba(229, 230, 235, 0.9);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.98);
}

.report-calendar-detail__item-main {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
  flex: 1;
}

.report-calendar-detail__item-meta {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.report-calendar-detail__item-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.report-calendar-detail__remark {
  margin: 0;
  color: var(--color-text-3);
  font-size: 13px;
  line-height: 1.6;
  word-break: break-word;
}

.report-calendar-detail__item-amount {
  flex: 0 0 auto;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.4;
  white-space: nowrap;
}

.report-calendar-detail__item-amount.expense {
  color: #f53f3f;
}

.report-calendar-detail__item-amount.income {
  color: #00b42a;
}

.report-calendar-detail__empty {
  padding: 32px 0 18px;
}

@media (max-width: 1600px) {
  .report-calendar-year {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 1360px) {
  .report-calendar-layout {
    grid-template-columns: 1fr;
  }

  .report-calendar-detail__list {
    max-height: none;
    overflow: visible;
    padding-right: 0;
  }
}

@media (max-width: 1200px) {
  .report-calendar-year {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .report-calendar-page__search {
    padding: 14px 14px 4px;
  }

  .report-calendar-summary {
    padding: 10px 12px;
  }

  .report-calendar-grid {
    gap: 8px;
  }

  .report-calendar-cell {
    min-height: 148px;
    padding: 10px;
  }

  .report-calendar-year {
    grid-template-columns: 1fr;
  }

  .report-calendar-detail__summary {
    gap: 8px;
  }

  .report-calendar-detail__item {
    flex-direction: column;
  }
}
</style>
