import dayjs from 'dayjs'
import { REPORT_DATE_PRESET_OPTIONS } from './reportConstants'
import type * as T from '@/apis/bookkeeping/type'
import type { LabelValueState } from '@/types/global'

const DEFAULT_AMOUNT_DIGITS = 2
const REPORT_WEEKDAY_TEXT = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
const REPORT_PAYMENT_METHOD_LABEL_MAP: Record<string, string> = {
  default: '默认',
  wechat: '微信',
  alipay: '支付宝',
  huabei: '花呗',
  cash: '现金',
  douyin_monthly: '抖音月付',
  meituan_monthly: '美团月付',
  jd_baitiao: '京东白条',
  bank: '银行卡',
  JD_super_card: '京东超市卡',
  jd_super_card: '京东超市卡',
}

const toFiniteNumber = (value: number | string | undefined | null) => {
  const numericValue = Number(value)
  return Number.isFinite(numericValue) ? numericValue : 0
}

export const getReportDateRangeByPreset = (preset: T.ReportDatePreset): string[] => {
  const now = dayjs()
  switch (preset) {
    case 'lastMonth': {
      const lastMonth = now.subtract(1, 'month')
      return [lastMonth.startOf('month').format('YYYY-MM-DD'), lastMonth.endOf('month').format('YYYY-MM-DD')]
    }
    case 'last3Months':
      return [now.subtract(2, 'month').startOf('month').format('YYYY-MM-DD'), now.endOf('month').format('YYYY-MM-DD')]
    case 'last6Months':
      return [now.subtract(5, 'month').startOf('month').format('YYYY-MM-DD'), now.endOf('month').format('YYYY-MM-DD')]
    case 'currentYear':
      return [now.startOf('year').format('YYYY-MM-DD'), now.endOf('year').format('YYYY-MM-DD')]
    case 'custom':
      return [now.startOf('month').format('YYYY-MM-DD'), now.endOf('month').format('YYYY-MM-DD')]
    case 'currentMonth':
    default:
      return [now.startOf('month').format('YYYY-MM-DD'), now.endOf('month').format('YYYY-MM-DD')]
  }
}

export const getReportPresetLabel = (preset: T.ReportDatePreset) => {
  return REPORT_DATE_PRESET_OPTIONS.find((item) => item.value === preset)?.label ?? '本月'
}

export const formatReportAmount = (
  value: number | string | undefined | null,
  options?: { signed?: boolean, compact?: boolean },
) => {
  const amount = toFiniteNumber(value)
  const formatter = new Intl.NumberFormat('zh-CN', {
    minimumFractionDigits: options?.compact ? 0 : DEFAULT_AMOUNT_DIGITS,
    maximumFractionDigits: options?.compact ? DEFAULT_AMOUNT_DIGITS : DEFAULT_AMOUNT_DIGITS,
  })
  const prefix = options?.signed && amount > 0 ? '+' : ''
  return `${prefix}${formatter.format(amount)}`
}

export const formatReportCurrency = (
  value: number | string | undefined | null,
  options?: { signed?: boolean, compact?: boolean },
) => `￥${formatReportAmount(value, options)}`

export const formatReportSignedAmount = (
  value: number | string | undefined | null,
  category: string | undefined | null,
  options?: { compact?: boolean, currency?: boolean },
) => {
  const amount = Math.abs(toFiniteNumber(value))
  const sign = category === 'income' ? '+' : category === 'expense' ? '-' : ''
  const amountText = formatReportAmount(amount, { compact: options?.compact })
  return options?.currency ? `￥${sign}${amountText}` : `${sign}${amountText}`
}

export const formatReportRatio = (value: number | string | undefined | null, digits = 2) => {
  const ratio = toFiniteNumber(value) * 100
  return `${ratio.toFixed(digits).replace(/\.?0+$/, '')}%`
}

export const formatReportDate = (value: string | undefined | null, template = 'YYYY-MM-DD') => {
  if (!value) {
    return ''
  }
  return dayjs(value).isValid() ? dayjs(value).format(template) : value
}

export const formatReportWeekday = (value: string | undefined | null) => {
  if (!value || !dayjs(value).isValid()) {
    return ''
  }
  return REPORT_WEEKDAY_TEXT[dayjs(value).day()] || ''
}

export const resolveReportPaymentMethodLabel = (
  value: string | undefined | null,
  label?: string | undefined | null,
  options?: LabelValueState[],
) => {
  const normalizedValue = String(value ?? '')
  if (!normalizedValue) {
    return ''
  }
  if (label && label !== normalizedValue) {
    return label
  }
  const matchedOption = options?.find((item) => String(item.value ?? '') === normalizedValue)
  if (matchedOption?.label) {
    return matchedOption.label
  }
  return REPORT_PAYMENT_METHOD_LABEL_MAP[normalizedValue] || label || normalizedValue
}

export const formatTrendAxisLabel = (label: string, granularity: 'day' | 'month', compact = false) => {
  if (!label) {
    return ''
  }
  if (granularity === 'month') {
    return compact ? dayjs(`${label}-01`).format('M月') : dayjs(`${label}-01`).format('YYYY.MM')
  }
  return compact ? dayjs(label).format('M/D') : dayjs(label).format('MM-DD')
}

export const buildReportQuery = (
  form: T.ReportFilterForm,
  privacyMode = false,
): T.ReportQuery => {
  const query: T.ReportQuery = {
    privacyMode,
  }

  const rangeStartDate = form.startDate || form.dateRange?.[0]
  const rangeEndDate = form.endDate || form.dateRange?.[1]
  const useCustomRange = form.timeMode !== 'preset' || form.datePreset === 'custom'

  if (useCustomRange) {
    query.datePreset = 'custom'
    if (rangeStartDate && rangeEndDate) {
      query.startDate = rangeStartDate
      query.endDate = rangeEndDate
    }
  } else {
    query.datePreset = form.datePreset
  }

  if (form.category) {
    query.category = form.category
  }
  if (form.subjectId) {
    query.subjectId = form.subjectId
  }
  if (form.tagId) {
    query.tagId = form.tagId
  }
  if (form.paymentMethod) {
    query.paymentMethod = form.paymentMethod
  }
  if (form.paymentAccountId) {
    query.paymentAccountId = form.paymentAccountId
  }
  if (form.isNecessary !== '' && form.isNecessary !== null && form.isNecessary !== undefined) {
    query.isNecessary = Number(form.isNecessary)
  }
  if (form.hidden !== '' && form.hidden !== null && form.hidden !== undefined) {
    query.hidden = Number(form.hidden)
  }
  if (form.userScope !== 'all' && form.userId) {
    query.userId = form.userId
  }
  return query
}
