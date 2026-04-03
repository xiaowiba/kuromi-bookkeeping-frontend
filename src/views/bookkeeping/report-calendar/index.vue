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
                format="YYYY-MM"
                value-format="YYYY-MM"
                :allow-clear="false"
                @change="handleAnchorPickerChange"
              />
              <a-year-picker
                v-else
                :model-value="anchorPickerValue"
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
          class="report-calendar-summary__card"
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
                }"
                @click="handleCalendarCellClick(cell)"
              >
                <div class="report-calendar-cell__head">
                  <span class="report-calendar-cell__date">{{ cell.dayText }}</span>
                  <span v-if="cell.stat" class="report-calendar-cell__count">{{ cell.stat.recordCount }}笔</span>
                </div>

                <div v-if="cell.stat" class="report-calendar-cell__amounts">
                  <span class="expense">支 {{ formatReportCurrency(cell.stat.expense, { compact: true }) }}</span>
                  <span class="income">收 {{ formatReportCurrency(cell.stat.income, { compact: true }) }}</span>
                </div>

                <div v-if="cell.stat?.previewItems?.length" class="report-calendar-cell__preview">
                  <div
                    v-for="item in cell.stat.previewItems"
                    :key="`${cell.date}-${item.detailId}`"
                    class="report-calendar-cell__preview-item"
                  >
                    <span class="name" :title="item.detailName || item.subjectName">
                      {{ item.detailName || item.subjectName }}
                    </span>
                    <span
                      class="amount"
                      :class="item.category === 'income' ? 'income' : 'expense'"
                    >
                      {{ formatReportSignedAmount(item.amount, item.category, { compact: true }) }}
                    </span>
                  </div>
                  <div v-if="cell.stat.overflowCount > 0" class="report-calendar-cell__overflow">
                    +{{ cell.stat.overflowCount }}
                  </div>
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
                  <span class="count">{{ panel.stat?.recordCount ?? 0 }}笔</span>
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
              <div class="summary-item expense">
                <span>支出</span>
                <strong>{{ formatReportCurrency(dayDetail.summary.expense) }}</strong>
              </div>
              <div class="summary-item income">
                <span>收入</span>
                <strong>{{ formatReportCurrency(dayDetail.summary.income) }}</strong>
              </div>
              <div
                class="summary-item"
                :class="dayDetail.summary.balance >= 0 ? 'income' : 'expense'"
              >
                <span>结余</span>
                <strong>{{ formatReportCurrency(dayDetail.summary.balance, { signed: dayDetail.summary.balance > 0 }) }}</strong>
              </div>
              <div class="summary-item neutral">
                <span>记录数</span>
                <strong>{{ dayDetail.summary.recordCount }}</strong>
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
 * 1. 提供按用户、分类、科目、支付方式筛选的日历报表入口
 * 2. 支持月视图 / 年视图切换和周期跳转
 * 3. 左侧展示日历聚合，右侧展示选中日期的完整明细
 *
 * 设计约束：
 * 1. 查询口径必须和明细列表、报表中心保持一致
 * 2. 页面风格尽量贴近现有明细页，使用 GiPageLayout + GiForm + 卡片分区
 * 3. 复杂日期推导下沉到 shared 工具文件，避免页面脚本失控
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
import { listSubject } from '@/apis/bookkeeping/subject'
import type * as T from '@/apis/bookkeeping/type'
import type { ColumnItem } from '@/components/GiForm'
import { useDict } from '@/hooks/app'
import { usePrivacyStore } from '@/stores'
import type { LabelValueState } from '@/types/global'
import { useDetailUserOptions } from '@/views/bookkeeping/shared/useDetailUserOptions'

defineOptions({ name: 'BookkeepingReportCalendar' })

const privacyStore = usePrivacyStore()
const { bk_subject_category, bk_payment_method } = useDict('bk_subject_category', 'bk_payment_method')
const { userOptions, loadUserOptions } = useDetailUserOptions()

const queryForm = reactive<T.ReportCalendarFilterForm>(createDefaultReportCalendarForm())
const allSubjects = ref<T.SubjectResp[]>([])
const calendarLoading = ref(false)
const dayDetailLoading = ref(false)
const calendarData = ref<T.ReportCalendarResp>(createEmptyReportCalendar())
const dayDetail = ref<T.ReportCalendarDayDetailResp>(createEmptyReportCalendarDayDetail())
const selectedDate = ref('')

const normalizeOption = (item: LabelValueState): LabelValueState => ({
  label: item.label,
  value: String(item.value ?? ''),
  extra: item.extra,
})

const createAllOption = (label = '全部') => ({ label, value: '' })

const userQueryOptions = computed<LabelValueState[]>(() => [
  { label: '全部用户', value: '' },
  ...((userOptions.value ?? []).map(normalizeOption)),
])

const categoryQueryOptions = computed<LabelValueState[]>(() => [
  createAllOption(),
  ...((bk_subject_category.value ?? []).map(normalizeOption)),
])

const paymentMethodQueryOptions = computed<LabelValueState[]>(() => [
  createAllOption(),
  ...((bk_payment_method.value ?? []).map(normalizeOption)),
])

const subjectQueryOptions = computed<LabelValueState[]>(() => {
  const matchedSubjects = queryForm.category
    ? allSubjects.value.filter((item) => item.category === queryForm.category)
    : allSubjects.value
  return [
    { label: '全部科目', value: '' },
    ...matchedSubjects.map((item) => ({ label: item.name, value: String(item.id) })),
  ]
})

const queryFormColumns: ColumnItem[] = reactive([
  {
    type: 'select',
    label: '所属用户',
    field: 'userId',
    span: { xs: 24, sm: 12, xxl: 6 },
    props: {
      options: userQueryOptions,
      placeholder: '请选择所属用户',
      allowClear: true,
      allowSearch: true,
    },
  },
  {
    label: '日历视图',
    field: 'viewMode',
    span: { xs: 24, sm: 12, xxl: 6 },
  },
  {
    label: '统计周期',
    field: 'anchorDate',
    span: { xs: 24, sm: 24, xxl: 12 },
  },
  {
    type: 'select',
    label: '分类',
    field: 'category',
    span: { xs: 24, sm: 8, xxl: 6 },
    props: {
      options: categoryQueryOptions,
      placeholder: '请选择分类',
      allowClear: true,
    },
  },
  {
    type: 'select',
    label: '科目',
    field: 'subjectId',
    span: { xs: 24, sm: 8, xxl: 6 },
    props: {
      options: subjectQueryOptions,
      placeholder: '请选择科目',
      allowClear: true,
      allowSearch: true,
    },
  },
  {
    type: 'select',
    label: '支付方式',
    field: 'paymentMethod',
    span: { xs: 24, sm: 8, xxl: 6 },
    props: {
      options: paymentMethodQueryOptions,
      placeholder: '请选择支付方式',
      allowClear: true,
    },
  },
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
      value: formatReportCurrency(summary.balance, { signed: summary.balance > 0 }),
      tone: summary.balance >= 0 ? 'income' : 'expense',
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
 * 这里统一负责把空值剔除，避免把无意义的空字符串传给后端，
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

const loadSubjectOptions = async () => {
  try {
    const { data } = await listSubject({ sort: ['sort,asc', 'id,desc'], page: 1, size: 1000 } as any)
    allSubjects.value = data.list ?? []
  } catch {
    allSubjects.value = []
  }
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
 * 左侧整个月历不会反复闪烁。
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
 * 先拉左侧总览，再根据后端返回的 defaultSelectedDate
 * 决定右侧应该展示哪一天，确保月切换和筛选切换后的默认选中口径一致。
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
 * 1. 月视图点击前后月的占位日期时，直接跳转到对应月份
 * 2. 点击当前周期内日期时，只刷新右侧详情区
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
 * 分类变化后，如果当前选中的科目不再属于该分类，自动清空科目。
 *
 * 这样可以避免继续带着无效 subjectId 去查，导致用户以为数据被过滤没了。
 */
watch(
  () => queryForm.category,
  () => {
    const exists = allSubjects.value.some((item) => String(item.id) === queryForm.subjectId && (!queryForm.category || item.category === queryForm.category))
    if (!exists) {
      queryForm.subjectId = ''
    }
  },
)

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
  await Promise.allSettled([loadUserOptions(), loadSubjectOptions()])
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
  flex-wrap: wrap;
}

.report-calendar-filter__range {
  color: var(--color-text-3);
  font-size: 13px;
  line-height: 1.6;
}

.report-calendar-summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.report-calendar-summary__card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 96px;
  padding: 18px;
  border-radius: 16px;
  border: 1px solid rgba(229, 230, 235, 0.9);
  background: var(--color-bg-1);
}

.report-calendar-summary__card.expense {
  background: linear-gradient(135deg, rgba(255, 236, 232, 0.9), rgba(255, 255, 255, 0.98));
}

.report-calendar-summary__card.income {
  background: linear-gradient(135deg, rgba(232, 255, 237, 0.92), rgba(255, 255, 255, 0.98));
}

.report-calendar-summary__card.neutral {
  background: linear-gradient(135deg, rgba(242, 243, 245, 0.92), rgba(255, 255, 255, 0.98));
}

.report-calendar-summary__label {
  color: var(--color-text-2);
  font-size: 13px;
}

.report-calendar-summary__value {
  color: var(--color-text-1);
  font-size: 24px;
  font-weight: 700;
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
  min-height: 152px;
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

.report-calendar-cell__count {
  color: var(--color-text-3);
  font-size: 12px;
}

.report-calendar-cell__amounts {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
}

.report-calendar-cell__amounts .expense,
.report-calendar-mini-month__meta .expense {
  color: #f53f3f;
}

.report-calendar-cell__amounts .income,
.report-calendar-mini-month__meta .income {
  color: #00b42a;
}

.report-calendar-cell__preview {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-height: 0;
}

.report-calendar-cell__preview-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 12px;
}

.report-calendar-cell__preview-item .name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--color-text-2);
}

.report-calendar-cell__preview-item .amount.expense {
  color: #f53f3f;
}

.report-calendar-cell__preview-item .amount.income {
  color: #00b42a;
}

.report-calendar-cell__overflow {
  color: rgb(var(--primary-6));
  font-size: 12px;
  font-weight: 600;
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

.report-calendar-mini-cell--today {
  border-color: rgba(var(--primary-5), 0.55);
}

.report-calendar-mini-cell--selected {
  color: #fff;
  background: rgb(var(--primary-6));
}

.report-calendar-detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.report-calendar-detail__summary {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.report-calendar-detail__summary .summary-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px;
  border-radius: 12px;
  background: rgba(247, 248, 250, 0.9);
}

.report-calendar-detail__summary .summary-item span {
  color: var(--color-text-3);
  font-size: 12px;
}

.report-calendar-detail__summary .summary-item strong {
  font-size: 18px;
  font-weight: 700;
}

.report-calendar-detail__summary .summary-item.expense strong {
  color: #f53f3f;
}

.report-calendar-detail__summary .summary-item.income strong {
  color: #00b42a;
}

.report-calendar-detail__summary .summary-item.neutral strong {
  color: var(--color-text-1);
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
  .report-calendar-summary {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .report-calendar-year {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .report-calendar-page__search {
    padding: 14px 14px 4px;
  }

  .report-calendar-summary {
    grid-template-columns: 1fr;
  }

  .report-calendar-grid {
    gap: 8px;
  }

  .report-calendar-cell {
    min-height: 136px;
    padding: 10px;
  }

  .report-calendar-year {
    grid-template-columns: 1fr;
  }

  .report-calendar-detail__summary {
    grid-template-columns: 1fr;
  }

  .report-calendar-detail__item {
    flex-direction: column;
  }
}
</style>
