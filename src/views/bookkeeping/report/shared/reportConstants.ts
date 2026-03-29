import type * as T from '@/apis/bookkeeping/type'
import type { LabelValueState } from '@/types/global'

export const REPORT_DEFAULT_SORT = ['amount,desc', 'detailDate,desc', 'detailId,desc']
export const REPORT_DEFAULT_PAGE_SIZE = 10
export const REPORT_WEB_PAGE_SIZE_OPTIONS = [10, 20, 50, 100]
export const REPORT_MOBILE_PAGE_SIZE = 20
export const REPORT_WEB_RANK_LIMIT = 8
export const REPORT_MOBILE_RANK_LIMIT = 5

export const REPORT_USER_SCOPE_OPTIONS: LabelValueState[] = [
  { label: '当前用户', value: 'current' },
  { label: '全部用户', value: 'all' },
  { label: '指定用户', value: 'specific' },
]

export const REPORT_DATE_PRESET_OPTIONS: Array<LabelValueState & { shortLabel: string }> = [
  { label: '本月', shortLabel: '本月', value: 'currentMonth' },
  { label: '上月', shortLabel: '上月', value: 'lastMonth' },
  { label: '近3个月', shortLabel: '近3月', value: 'last3Months' },
  { label: '近6个月', shortLabel: '近6月', value: 'last6Months' },
  { label: '本年', shortLabel: '本年', value: 'currentYear' },
  { label: '自定义', shortLabel: '自定义', value: 'custom' },
]

export const createReportAllOption = (label = '全部'): LabelValueState => ({ label, value: '' })

export const createEmptyReportDashboard = (): T.ReportDashboardResp => ({
  overview: {
    totalExpense: 0,
    totalIncome: 0,
    balance: 0,
    recordCount: 0,
    maxExpenseCategoryName: '',
    maxExpenseCategoryAmount: 0,
    maxIncomeSubjectName: '',
    maxIncomeSubjectAmount: 0,
  },
  trend: {
    granularity: 'day',
    points: [],
  },
  categoryShare: [],
  subjectRank: [],
  paymentMethodShare: [],
  userCompare: [],
  insight: [],
})

export const createReportFilterForm = (
  currentUserId = '',
  userScope: T.ReportUserScope = 'current',
): T.ReportFilterForm => ({
  datePreset: 'currentMonth',
  dateRange: [],
  category: '',
  subjectId: '',
  paymentMethod: '',
  userScope,
  userId: userScope === 'all' ? '' : currentUserId,
})
