/**
 * 报表中心常量与默认模型。
 *
 * 集中维护排序、分页、筛选默认值和空态数据，保证 Web 报表与移动端报表使用同一套初始口径。
 *
 * @author Wangsongsong
 * @date 2026-07-02
 * @update 2026-07-02 @Wangsongsong
 * @desc 补充报表默认口径和空态模型说明
 * @update 2026-07-08 @Wangsongsong
 * @desc 补充报表中心报销角色汇总空态，避免页面加载和异常回退时出现空字段
 */
import type * as T from '@/apis/bookkeeping/type'
import type { LabelValueState } from '@/types/global'
import {
  DETAIL_DEFAULT_DATE_PRESET,
  DETAIL_DEFAULT_TIME_MODE,
  getDetailPresetRange,
} from '@/views/bookkeeping/shared/detailTime'

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
  tagRank: [],
  paymentMethodShare: [],
  userCompare: [],
  reimbursementRoleSummary: {
    advanceAmount: 0,
    advanceCount: 0,
    reimbursedAdvanceAmount: 0,
    reimbursedAdvanceCount: 0,
    pendingAdvanceAmount: 0,
    pendingAdvanceCount: 0,
    reimburseOtherAmount: 0,
    reimburseOtherCount: 0,
    linkedReimburseOtherAmount: 0,
    linkedReimburseOtherCount: 0,
    pendingReimburseOtherAmount: 0,
    pendingReimburseOtherCount: 0,
  },
  insight: [],
})

export const createReportFilterForm = (
  currentUserId = '',
  userScope: T.ReportUserScope = 'current',
): T.ReportFilterForm => {
  const presetRange = getDetailPresetRange(DETAIL_DEFAULT_DATE_PRESET)
  return {
    datePreset: 'currentMonth',
    dateRange: [presetRange.startDate, presetRange.endDate],
    timeMode: DETAIL_DEFAULT_TIME_MODE,
    startDate: presetRange.startDate,
    endDate: presetRange.endDate,
    category: '',
    subjectId: '',
    tagId: '',
    paymentMethod: '',
    paymentAccountId: '',
    isNecessary: '',
    isReimburseOther: '',
    isAdvance: '',
    userScope,
    userId: userScope === 'all' ? '' : currentUserId,
    hidden: '',
  }
}
