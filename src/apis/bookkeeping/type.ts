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

/** 明细响应类型 */
export interface DetailResp {
  id: string
  userId: string
  userNickname: string
  subjectId: string
  subjectName: string
  subjectCategory: string
  subjectIcon?: string
  name: string
  amount: number
  detailDate: string
  paymentMethod: string
  remark: string
  hidden: number
  createUserString: string
  createTime: string
  updateUserString: string
  updateTime: string
}

/** 明细查询条件 */
export interface DetailQuery {
  userId?: string
  name?: string
  category?: string
  subjectId?: string
  paymentMethod?: string
  month?: string
  minAmount?: number
  maxAmount?: number
  hidden?: number | string
  privacyMode?: boolean
  sort: Array<string>
}

/** 明细分页查询条件 */
export interface DetailPageQuery extends DetailQuery, PageQuery {}

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

/** 报表用户范围 */
export type ReportUserScope = 'current' | 'all' | 'specific'

/** 报表查询条件 */
export interface ReportQuery {
  datePreset?: ReportDatePreset
  startDate?: string
  endDate?: string
  category?: string
  subjectId?: string
  paymentMethod?: string
  userId?: string
  privacyMode?: boolean
}

/** 报表分页查询条件 */
export interface ReportPageQuery extends ReportQuery, PageQuery {
  sort: Array<string>
}

/** 报表筛选表单 */
export interface ReportFilterForm {
  datePreset: ReportDatePreset
  dateRange: string[]
  category: string
  subjectId: string
  paymentMethod: string
  userScope: ReportUserScope
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
  paymentMethodShare: ReportPaymentMethodShareItemResp[]
  userCompare: ReportUserCompareItemResp[]
  insight: string[]
}

/** 报表表格行 */
export interface ReportRankingTableResp {
  detailId: string
  detailDate: string
  detailName: string
  subjectId: string
  subjectName: string
  subjectIcon?: string
  dimensionName: string
  category: string
  paymentMethod: string
  paymentMethodLabel: string
  userId: string
  userName: string
  amount: number
  ratio: number
  count: number
}
