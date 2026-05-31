/**
 * 记账模块类型定义
 *
 * @author Wangsongsong
 * @date 2026-03-18
 * @update 2026-03-23 @Wangsongsong
 * @desc 明细响应补充 subjectIcon 字段，供移动端列表渲染科目图标
 * @update 2026-03-19 @Wangsongsong
 * @desc 增加明细统计响应类型 DetailStatisticsResp
 * @update 2026-03-22 @Wangsongsong
 * @desc 增加隐私配置响应类型 PrivacyConfigResp
 * @update 2026-03-22 @Wangsongsong
 * @desc 增加隐私配置修改请求类型 PrivacyConfigUpdateReq
 * @update 2026-03-23 @Wangsongsong
 * @desc 明细模型补充支付方式字段及查询条件，统一桌面端与移动端类型定义
 * @update 2026-04-03 @Wangsongsong
 * @desc 增加日历报表查询与响应类型，供 Web 端日历报表页面使用
 */

/** 科目响应类型 */
export interface SubjectResp {
  id: string
  name: string
  category: string
  icon: string
  sort: number
  isDefault: boolean
  status: 1 | 2
  createUserString: string
  createTime: string
  updateUserString: string
  updateTime: string
}

/** 科目查询条件 */
export interface SubjectQuery {
  name?: string
  category?: string
  status?: number
  sort: Array<string>
}

/** 科目分页查询条件 */
export interface SubjectPageQuery extends SubjectQuery, PageQuery {}
/** 科目标签响应类型 */
export interface SubjectTagResp {
  id: string
  subjectId: string
  subjectName: string
  subjectCategory: string
  name: string
  icon: string
  isDefault: boolean
  sort: number
  status: 1 | 2
  createUserString: string
  createTime: string
  updateUserString: string
  updateTime: string
}

/** 科目标签查询条件 */
export interface SubjectTagQuery {
  subjectId?: string
  name?: string
  status?: number
}

/** 科目标签分页查询条件 */
export interface SubjectTagPageQuery extends SubjectTagQuery, PageQuery {}

/** 科目标签新增/修改参数 */
export interface SubjectTagReq {
  subjectId: string | number
  name: string
  icon: string
  sort?: number
  status: 1 | 2
}

/** 标签删除影响预检查响应 */
export interface SubjectTagDeleteImpactResp {
  tagId: string
  tagName: string
  subjectId: string
  subjectName: string
  isDefault: boolean
  canDelete: boolean
  defaultTagId: string
  defaultTagName: string
  affectedDetailCount: number
  warningMessage: string
}

/** 明细响应类型 */
export interface DetailResp {
  id: string
  userId: string
  userNickname: string
  subjectId: string
  subjectName: string
  subjectCategory: string
  subjectIcon?: string
  tagId?: string
  tagName?: string
  name: string
  amount: number
  detailDate: string
  paymentMethod: string
  paymentAccountId?: string
  paymentAccountName?: string
  paymentAccountDeleted?: boolean
  isNecessary: number
  /** 是否垫付（0：否；1：是） */
  isAdvance: number
  /** 是否报销他人（0：否；1：是） */
  isReimburseOther: number
  /** 是否已报销（0：否；1：是） */
  isReimbursed: number
  /** 关联明细 ID */
  linkedDetailId?: string
  /** 关联用户 ID */
  linkedUserId?: string
  /** 关联用户昵称 */
  linkedUserNickname?: string
  /** 关联明细名称 */
  linkedDetailName?: string
  /** 关联明细金额 */
  linkedDetailAmount?: number
  /** 关联明细日期 */
  linkedDetailDate?: string
  remark: string
  hidden: number
  createUserString: string
  createTime: string
  updateUserString: string
  updateTime: string
}

/** 明细时间模式 */
export type DetailTimeMode = 'preset' | 'week' | 'month' | 'quarter' | 'year' | 'range'

/** 明细快捷范围预设 */
export type DetailDatePreset =
  | 'currentMonth'
  | 'lastMonth'
  | 'last3Months'
  | 'last6Months'
  | 'currentYear'

/** 明细查询条件 */
export interface DetailQuery {
  userId?: string
  name?: string
  category?: string
  subjectId?: string
  tagId?: string
  paymentAccountId?: string
  unselectedTagOnly?: boolean
  paymentMethod?: string
  isNecessary?: number | string
  /** 是否垫付 */
  isAdvance?: number | string
  /** 是否报销他人 */
  isReimburseOther?: number | string
  /** 是否已报销 */
  isReimbursed?: number | string
  /** 备注模糊查询 */
  remark?: string
  timeMode?: DetailTimeMode
  datePreset?: DetailDatePreset
  startDate?: string
  endDate?: string
  month?: string
  minAmount?: number
  maxAmount?: number
  hidden?: number | string
  privacyMode?: boolean
  sort: Array<string>
}

/** 明细分页查询条件 */
export interface DetailPageQuery extends DetailQuery, PageQuery {}

/** 明细查询模式响应 */
export interface DetailQueryModeResp {
  total: number
  pageMode: boolean
  threshold: number
}

/**
 * 明细统计响应类型
 *
 * @author Wangsongsong
 * @date 2026-03-19
 */
export interface DetailStatisticsResp {
  /** 总支出 */
  totalExpense: number
  /** 总收入 */
  totalIncome: number
  /** 净收入 */
  netIncome: number
}

/** 关注响应类型 */
export interface FollowResp {
  id: string
  userId: string
  userNickname: string
  followUserId: string
  followUserNickname: string
  allowSwitch?: boolean
  mutualFollow?: boolean
  createTime: string
}

/** 关注查询条件 */
export interface FollowQuery {
  userId?: string
  sort?: Array<string>
}

/** 关注分页查询条件 */
export interface FollowPageQuery extends FollowQuery, PageQuery {}

/** 关注配置请求参数 */
export interface FollowReq {
  userId: string | number
  followUserIds: Array<string | number>
}

/** 可切换账户 */
export interface SwitchableAccount {
  userId: string
  username: string
  nickname: string
  avatar: string
  entryKey: string
}

/** 隐藏对象配置响应类型 */
export interface HideTargetResp {
  id: string
  userId: string
  userNickname: string
  targetUserId: string
  targetUserNickname: string
  createTime: string
}

/** 隐藏对象配置请求参数 */
export interface HideTargetReq {
  userId: string | number
  targetUserIds: Array<string | number>
}

/** 隐私密码验证请求 */
export interface PrivacyVerifyReq {
  password: string
}

/** 隐私密码验证响应 */
export interface PrivacyVerifyResp {
  verified: boolean
}

/** 隐私密码设置/修改请求 */
export interface PrivacyPasswordReq {
  password: string
  oldPassword?: string
}

/** 是否已设置隐私密码响应 */
export interface PrivacyHasPasswordResp {
  hasPassword: boolean
}

/** 隐私配置响应 */
export interface PrivacyConfigResp {
  hasPassword: boolean
  expireMinutes: number
}

/** 隐私配置修改请求 */
export interface PrivacyConfigUpdateReq {
  expireMinutes: number
}

/** 报表时间预设 */
export type ReportDatePreset =
  | 'currentMonth'
  | 'lastMonth'
  | 'last3Months'
  | 'last6Months'
  | 'currentYear'
  | 'custom'

/** 账单类型 */
export type BillType = 'monthly' | 'yearly'

/** 报表用户范围 */
export type ReportUserScope = 'current' | 'all' | 'specific'

/** 日历报表视图模式 */
export type ReportCalendarViewMode = 'month' | 'year'

/** 报表查询条件 */
export interface ReportQuery {
  datePreset?: ReportDatePreset
  startDate?: string
  endDate?: string
  category?: string
  subjectId?: string
  tagId?: string
  paymentMethod?: string
  paymentAccountId?: string
  isNecessary?: number | string
  userId?: string
  hidden?: number | string
  privacyMode?: boolean
}

/** 账单查询条件 */
export interface BillQuery {
  category?: string
  subjectId?: string
  tagId?: string
  paymentMethod?: string
  paymentAccountId?: string
  isNecessary?: number | string
  userId?: string
  hidden?: number | string
  privacyMode?: boolean
}

/** 月账单查询条件 */
export interface BillMonthlyQuery extends BillQuery {
  year: number | string
}

/** 年账单查询条件 */
export interface BillYearlyQuery extends BillQuery {}

/** 账单筛选表单 */
export interface BillFilterForm {
  billType: BillType
  year: string
  category: string
  subjectId: string
  tagId: string
  paymentMethod: string
  paymentAccountId: string
  isNecessary: number | string
  userId: string
  hidden: number | string
}

/** 账单汇总响应 */
export interface BillSummaryResp {
  totalIncome: number
  totalExpense: number
  balance: number
  recordCount: number
}

/** 月账单项 */
export interface BillMonthItemResp {
  month: string
  monthNumber: number
  income: number
  expense: number
  balance: number
  recordCount: number
}

/** 月账单响应 */
export interface BillMonthlyResp {
  year: number
  summary: BillSummaryResp
  months: BillMonthItemResp[]
}

/** 年账单项 */
export interface BillYearItemResp {
  year: number
  income: number
  expense: number
  balance: number
  recordCount: number
}

/** 年账单响应 */
export interface BillYearlyResp {
  summary: BillSummaryResp
  years: BillYearItemResp[]
}

/** 报表分页查询条件 */
export interface ReportPageQuery extends ReportQuery, PageQuery {
  sort: Array<string>
}

/** 报表筛选表单 */
export interface ReportFilterForm {
  datePreset: ReportDatePreset
  dateRange: string[]
  timeMode: DetailTimeMode
  startDate: string
  endDate: string
  category: string
  subjectId: string
  tagId: string
  paymentMethod: string
  paymentAccountId: string
  isNecessary: number | string
  userScope: ReportUserScope
  userId: string
  hidden: number | string
}

/** 日历报表筛选表单 */
export interface ReportCalendarFilterForm {
  viewMode: ReportCalendarViewMode
  anchorDate: string
  category: string
  subjectId: string
  tagId: string
  paymentMethod: string
  paymentAccountId: string
  isNecessary: number | string
  userId: string
}

/** 报表总览 */
export interface ReportOverviewResp {
  totalExpense: number
  totalIncome: number
  balance: number
  recordCount: number
  maxExpenseCategoryName: string
  maxExpenseCategoryAmount: number
  maxIncomeSubjectName: string
  maxIncomeSubjectAmount: number
}

/** 报表趋势点 */
export interface ReportTrendPointResp {
  label: string
  expense: number
  income: number
}

/** 报表趋势 */
export interface ReportTrendResp {
  granularity: 'day' | 'month'
  points: ReportTrendPointResp[]
}

/** 报表分类占比项 */
export interface ReportCategoryShareItemResp {
  key?: string
  name: string
  amount: number
  ratio: number
}

/** 报表科目排行项 */
export interface ReportSubjectRankItemResp {
  subjectId: string
  subjectName: string
  category: string
  amount: number
  ratio: number
  count: number
}

/** 报表标签排行项 */
export interface ReportTagRankItemResp {
  tagId?: string
  tagName: string
  subjectId: string
  subjectName: string
  amount: number
  ratio: number
  count: number
}

/** 报表支付方式占比项 */
export interface ReportPaymentMethodShareItemResp {
  key: string
  label: string
  amount: number
  ratio: number
}

/** 报表用户对比项 */
export interface ReportUserCompareItemResp {
  userId: string
  userName: string
  expense: number
  income: number
}

/** 报表看板响应 */
export interface ReportDashboardResp {
  overview: ReportOverviewResp
  trend: ReportTrendResp
  categoryShare: ReportCategoryShareItemResp[]
  subjectRank: ReportSubjectRankItemResp[]
  tagRank: ReportTagRankItemResp[]
  paymentMethodShare: ReportPaymentMethodShareItemResp[]
  userCompare: ReportUserCompareItemResp[]
  insight: string[]
}

export interface ReportEarliestDateResp {
  date?: string
}

/** 报表表格行 */
export interface ReportRankingTableResp {
  detailId: string
  detailDate: string
  detailName: string
  subjectId: string
  subjectName: string
  subjectIcon?: string
  tagId?: string
  tagName?: string
  dimensionName: string
  category: string
  paymentMethod: string
  paymentMethodLabel: string
  paymentAccountId?: string
  paymentAccountName?: string
  paymentAccountDeleted?: boolean
  isNecessary: number
  userId: string
  userName: string
  amount: number
  ratio: number
  count: number
}

/** 日历报表查询条件 */
export interface ReportCalendarQuery extends ReportQuery {
  viewMode?: ReportCalendarViewMode
  anchorDate?: string
  date?: string
}

/** 日历报表汇总 */
export interface ReportCalendarSummaryResp {
  totalExpense: number
  totalIncome: number
  balance: number
  recordCount: number
}

/** 日历格子内的预览明细 */
export interface ReportCalendarPreviewItemResp {
  detailId: string
  subjectId: string
  subjectName: string
  subjectIcon?: string
  tagId?: string
  tagName?: string
  detailName: string
  category: string
  amount: number
  paymentAccountId?: string
  paymentAccountName?: string
  paymentAccountDeleted?: boolean
  userId: string
  userName: string
}

/** 日历按日统计项 */
export interface ReportCalendarDayStatItemResp {
  date: string
  expense: number
  income: number
  balance: number
  recordCount: number
  previewItems: ReportCalendarPreviewItemResp[]
  overflowCount: number
}

/** 日历按月统计项 */
export interface ReportCalendarMonthStatItemResp {
  month: string
  expense: number
  income: number
  balance: number
  recordCount: number
  activeDayCount: number
}

/** 日历报表总览响应 */
export interface ReportCalendarResp {
  viewMode: ReportCalendarViewMode
  anchorDate: string
  rangeStart: string
  rangeEnd: string
  summary: ReportCalendarSummaryResp
  defaultSelectedDate?: string
  dayStats: ReportCalendarDayStatItemResp[]
  monthStats: ReportCalendarMonthStatItemResp[]
}

/** 日历报表单日汇总 */
export interface ReportCalendarDayDetailSummaryResp {
  expense: number
  income: number
  balance: number
  recordCount: number
}

/** 日历报表单日详情项 */
export interface ReportCalendarDayDetailItemResp {
  id: string
  detailDate: string
  subjectId: string
  subjectName: string
  subjectIcon?: string
  tagId?: string
  tagName?: string
  detailName: string
  category: string
  paymentMethod: string
  paymentMethodLabel: string
  paymentAccountId?: string
  paymentAccountName?: string
  paymentAccountDeleted?: boolean
  isNecessary: number
  userId: string
  userName: string
  amount: number
  remark: string
  hidden: number
}

/** 日历报表单日详情响应 */
export interface ReportCalendarDayDetailResp {
  date: string
  summary: ReportCalendarDayDetailSummaryResp
  details: ReportCalendarDayDetailItemResp[]
}

/** 支付账号响应类型 */
export interface PaymentAccountResp {
  id: string
  userId: string
  userNickname: string
  name: string
  sort: number
  status: 1 | 2
  createUserString: string
  createTime: string
  updateUserString: string
  updateTime: string
}

/** 支付账号查询条件 */
export interface PaymentAccountQuery {
  userId?: string
  name?: string
  status?: number
}

/** 支付账号分页查询条件 */
export interface PaymentAccountPageQuery extends PaymentAccountQuery, PageQuery {}

/** 支付账号新增/修改参数 */
export interface PaymentAccountReq {
  name: string
  sort?: number
  status: 1 | 2
}
