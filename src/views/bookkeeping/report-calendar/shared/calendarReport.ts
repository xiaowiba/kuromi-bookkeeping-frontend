/**
 * 日历报表页面共享工具。
 *
 * 这里集中处理：
 * 1. 默认筛选条件
 * 2. 空态数据模型
 * 3. 月视图 / 年视图日历格子生成
 * 4. 锚点日期归一化与切换
 *
 * @author Wangsongsong
 * @date 2026-04-03
 */
import dayjs from 'dayjs'
import type * as T from '@/apis/bookkeeping/type'

export interface CalendarCellItem {
  date: string
  dayText: string
  inCurrentView: boolean
  isToday: boolean
  isSelected: boolean
  stat?: T.ReportCalendarDayStatItemResp
}

export interface CalendarYearPanelItem {
  monthKey: string
  monthText: string
  stat?: T.ReportCalendarMonthStatItemResp
  cells: CalendarCellItem[]
}

export const CALENDAR_WEEKDAY_LABELS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

const toValidDate = (value?: string | null) => {
  if (!value) {
    return dayjs()
  }
  if (/^\d{4}$/.test(value)) {
    return dayjs(`${value}-01-01`)
  }
  if (/^\d{4}-\d{2}$/.test(value)) {
    return dayjs(`${value}-01`)
  }
  const parsed = dayjs(value)
  return parsed.isValid() ? parsed : dayjs()
}

const getWeekStartOffset = (date: dayjs.Dayjs) => {
  return (date.day() + 6) % 7
}

const createDayStatMap = (dayStats: T.ReportCalendarDayStatItemResp[]) => {
  return new Map(dayStats.map((item) => [item.date, item]))
}

const createMonthStatMap = (monthStats: T.ReportCalendarMonthStatItemResp[]) => {
  return new Map(monthStats.map((item) => [item.month, item]))
}

/**
 * 创建默认筛选条件。
 *
 * 默认直接展示“本月 + 全部用户”，这样和需求文档里
 * “提供全部用户筛选项并默认可看全范围”保持一致。
 */
export const createDefaultReportCalendarForm = (): T.ReportCalendarFilterForm => ({
  viewMode: 'month',
  anchorDate: dayjs().startOf('month').format('YYYY-MM-DD'),
  category: '',
  subjectId: '',
  tagId: '',
  paymentMethod: '',
  paymentAccountId: '',
  isNecessary: '',
  userId: '',
})

export const createEmptyReportCalendar = (): T.ReportCalendarResp => ({
  viewMode: 'month',
  anchorDate: dayjs().startOf('month').format('YYYY-MM-DD'),
  rangeStart: '',
  rangeEnd: '',
  summary: {
    totalExpense: 0,
    totalIncome: 0,
    balance: 0,
    recordCount: 0,
  },
  defaultSelectedDate: '',
  dayStats: [],
  monthStats: [],
})

export const createEmptyReportCalendarDayDetail = (): T.ReportCalendarDayDetailResp => ({
  date: '',
  summary: {
    expense: 0,
    income: 0,
    balance: 0,
    recordCount: 0,
  },
  details: [],
})

/**
 * 归一化锚点日期。
 *
 * 月视图统一落到当月 1 号，年视图统一落到当年 1 月 1 号，
 * 避免前端不同控件回传格式不一致。
 */
export const normalizeCalendarAnchorDate = (
  value: string | undefined | null,
  viewMode: T.ReportCalendarViewMode,
) => {
  const target = toValidDate(value)
  return target.startOf(viewMode === 'year' ? 'year' : 'month').format('YYYY-MM-DD')
}

/** 按当前视图向前或向后切换周期。 */
export const shiftCalendarAnchorDate = (
  anchorDate: string,
  viewMode: T.ReportCalendarViewMode,
  offset: number,
) => {
  const unit = viewMode === 'year' ? 'year' : 'month'
  return toValidDate(anchorDate).add(offset, unit).startOf(unit).format('YYYY-MM-DD')
}

/** 当前周期标题文案。 */
export const formatCalendarAnchorLabel = (
  anchorDate: string,
  viewMode: T.ReportCalendarViewMode,
) => {
  const date = toValidDate(anchorDate)
  return viewMode === 'year' ? date.format('YYYY年') : date.format('YYYY年M月')
}

/**
 * 构建月视图格子。
 *
 * 使用固定 6 行 7 列布局，避免不同月份高度变化导致页面跳动。
 */
export const buildMonthCalendarCells = (
  anchorDate: string,
  dayStats: T.ReportCalendarDayStatItemResp[],
  selectedDate: string,
): CalendarCellItem[] => {
  const currentMonth = toValidDate(anchorDate).startOf('month')
  const startDate = currentMonth.subtract(getWeekStartOffset(currentMonth), 'day')
  const dayStatMap = createDayStatMap(dayStats)

  return Array.from({ length: 42 }, (_, index) => {
    const date = startDate.add(index, 'day')
    const dateText = date.format('YYYY-MM-DD')
    return {
      date: dateText,
      dayText: date.format('D'),
      inCurrentView: date.isSame(currentMonth, 'month'),
      isToday: date.isSame(dayjs(), 'day'),
      isSelected: dateText === selectedDate,
      stat: dayStatMap.get(dateText),
    }
  })
}

/**
 * 构建年视图的 12 个小月历。
 *
 * 年视图仍然保留日粒度点击能力，但不塞入预览明细，
 * 仅展示有无数据和月度汇总，避免信息密度过高。
 */
export const buildYearCalendarPanels = (
  anchorDate: string,
  dayStats: T.ReportCalendarDayStatItemResp[],
  monthStats: T.ReportCalendarMonthStatItemResp[],
  selectedDate: string,
): CalendarYearPanelItem[] => {
  const startOfYear = toValidDate(anchorDate).startOf('year')
  const monthStatMap = createMonthStatMap(monthStats)

  return Array.from({ length: 12 }, (_, index) => {
    const monthDate = startOfYear.add(index, 'month')
    const monthKey = monthDate.format('YYYY-MM')
    return {
      monthKey,
      monthText: monthDate.format('M月'),
      stat: monthStatMap.get(monthKey),
      cells: buildMonthCalendarCells(monthDate.format('YYYY-MM-DD'), dayStats, selectedDate),
    }
  })
}
