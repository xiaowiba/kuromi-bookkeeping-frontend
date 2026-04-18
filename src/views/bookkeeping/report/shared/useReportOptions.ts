import type { EChartsOption } from 'echarts'
import { computed, toValue } from 'vue'
import type { MaybeRefOrGetter } from 'vue'
import {
  REPORT_MOBILE_RANK_LIMIT,
} from './reportConstants'
import {
  formatReportAmount,
  formatReportCurrency,
  formatReportRatio,
  formatTrendAxisLabel,
  resolveReportPaymentMethodLabel,
} from './reportFormat'
import type * as T from '@/apis/bookkeeping/type'

interface ReportOptionMode {
  compact?: boolean
  dualAxis?: boolean
  rankLimit?: number | false
  colors?: ReportColorScheme
}

/** 报表配色方案类型 */
interface ReportColorScheme {
  expense: string
  income: string
  primary: string
  accent: string
  secondary: string
  tertiary: string
  muted: string
  border: string
  text: string
  subText: string
  grid: string
  tooltipBg?: string
  pieColors?: string[]
  expenseArea?: string
  incomeArea?: string
}

/** 默认暖色系配色（移动端使用） */
const REPORT_COLORS: ReportColorScheme = {
  expense: '#d97706',
  income: '#0f766e',
  primary: '#ca8a04',
  accent: '#f59e0b',
  secondary: '#7c5a0a',
  tertiary: '#3b7a57',
  muted: '#947e57',
  border: 'rgba(148, 126, 87, 0.18)',
  text: '#3f341d',
  subText: '#8a7857',
  grid: 'rgba(148, 126, 87, 0.12)',
  tooltipBg: 'rgba(62, 46, 18, 0.92)',
  pieColors: ['#ca8a04', '#f59e0b', '#d97706', '#fbbf24', '#0f766e', '#3b7a57', '#8a7857'],
  expenseArea: 'rgba(217, 119, 6, 0.12)',
  incomeArea: 'rgba(15, 118, 110, 0.1)',
}

/**
 * 蓝色科技感配色（Web 端报表中心使用）
 *
 * @author Wangsongsong
 * @date 2026-04-17
 */
export const REPORT_COLORS_TECH_BLUE: ReportColorScheme = {
  expense: '#3b82f6',
  income: '#06b6d4',
  primary: '#2563eb',
  accent: '#60a5fa',
  secondary: '#1e40af',
  tertiary: '#0ea5e9',
  muted: '#64748b',
  border: 'rgba(59, 130, 246, 0.15)',
  text: '#1e293b',
  subText: '#64748b',
  grid: 'rgba(59, 130, 246, 0.08)',
  tooltipBg: 'rgba(15, 23, 42, 0.92)',
  pieColors: ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#06b6d4', '#0ea5e9', '#7dd3fc'],
  expenseArea: 'rgba(59, 130, 246, 0.12)',
  incomeArea: 'rgba(6, 182, 212, 0.1)',
}

const toChartNumber = (value: number | string | undefined | null) => {
  const numericValue = Number(value)
  return Number.isFinite(numericValue) ? numericValue : 0
}

type RankSortableItem = {
  amount?: number | string | null
  count?: number | string | null
}

type HorizontalBarDataItem = {
  name: string
  value: number
  extra?: string
}

export type ReportTagRankChartDataItem = T.ReportTagRankItemResp & HorizontalBarDataItem

/**
 * 排行类横向柱状图需要先按金额降序稳定排序，再根据横向类目轴的展示方向反转一次。
 * 这里显式克隆数组，避免直接 reverse() 改写原列表，导致频繁切换时顺序来回翻转。
 */
const buildOrderedRankSource = <T extends RankSortableItem>(
  list: T[] | undefined,
  mode: ReportOptionMode,
) => {
  const sortedSource = (list ?? [])
    .map((item, index) => ({ item, index }))
    .sort((left, right) => {
      const amountDifference = toChartNumber(right.item.amount) - toChartNumber(left.item.amount)
      if (amountDifference !== 0) {
        return amountDifference
      }

      const countDifference = toChartNumber(right.item.count) - toChartNumber(left.item.count)
      if (countDifference !== 0) {
        return countDifference
      }

      return left.index - right.index
    })
    .map(({ item }) => item)

  return resolveRankSource(sortedSource, mode).slice().reverse()
}

const buildEmptyOption = (text: string, colors?: ReportColorScheme): EChartsOption => ({
  animation: false,
  xAxis: { show: false, type: 'category', data: [] },
  yAxis: { show: false, type: 'value' },
  series: [],
  graphic: [
    {
      type: 'text',
      left: 'center',
      top: 'middle',
      style: {
        text,
        fill: (colors || REPORT_COLORS).subText,
        fontSize: 14,
        fontWeight: 500,
      },
    },
  ],
})

export const buildTrendChartOption = (
  trend: T.ReportTrendResp | undefined,
  mode: ReportOptionMode = {},
): EChartsOption => {
  const colors = mode.colors || REPORT_COLORS
  const points = trend?.points ?? []
  if (!points.length) {
    return buildEmptyOption('当前区间暂无趋势数据', colors)
  }

  const expenseData = points.map((item) => toChartNumber(item.expense))
  const incomeData = points.map((item) => toChartNumber(item.income))
  const useDualAxis = mode.compact ? !!mode.dualAxis : true

  return {
    color: [colors.expense, colors.income],
    tooltip: {
      trigger: 'axis',
      backgroundColor: colors.tooltipBg || 'rgba(62, 46, 18, 0.92)',
      borderWidth: 0,
      textStyle: { color: '#fff' },
      formatter: (params: any) => {
        const lines = (Array.isArray(params) ? params : [params]).map((item) => {
          return `${item.marker}${item.seriesName}：${formatReportCurrency(item.value)}`
        })
        return [params?.[0]?.axisValueLabel ?? '', ...lines].join('<br/>')
      },
    },
    legend: {
      top: 0,
      right: 0,
      icon: 'roundRect',
      itemWidth: 12,
      itemHeight: 8,
      textStyle: {
        color: colors.subText,
        fontSize: mode.compact ? 11 : 12,
      },
    },
    grid: {
      left: mode.compact ? 12 : useDualAxis ? 48 : 20,
      right: mode.compact ? 12 : useDualAxis ? 48 : 20,
      top: 44,
      bottom: mode.compact ? 16 : 24,
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: points.map((item) => formatTrendAxisLabel(item.label, trend?.granularity ?? 'day', !!mode.compact)),
      axisLine: { lineStyle: { color: colors.border } },
      axisLabel: {
        color: colors.subText,
        fontSize: mode.compact ? 11 : 12,
      },
      axisTick: { show: false },
    },
    yAxis: useDualAxis
      ? [
          {
            type: 'value',
            name: '支出',
            nameTextStyle: {
              color: colors.expense,
              fontSize: 12,
              fontWeight: 700,
              padding: [0, 0, 6, 0],
            },
            axisLabel: {
              color: colors.expense,
              fontSize: 12,
              formatter: (value: number) => formatReportAmount(value, { compact: true }),
            },
            axisLine: { show: true, lineStyle: { color: `${colors.expense}38` } },
            splitLine: { lineStyle: { color: colors.grid } },
          },
          {
            type: 'value',
            name: '收入',
            nameTextStyle: {
              color: colors.income,
              fontSize: 12,
              fontWeight: 700,
              padding: [0, 0, 6, 0],
            },
            axisLabel: {
              color: colors.income,
              fontSize: 12,
              formatter: (value: number) => formatReportAmount(value, { compact: true }),
            },
            axisLine: { show: true, lineStyle: { color: `${colors.income}38` } },
            splitLine: { show: false },
          },
        ]
      : {
          type: 'value',
          axisLabel: {
            color: colors.subText,
            fontSize: mode.compact ? 11 : 12,
            formatter: (value: number) => formatReportAmount(value, { compact: true }),
          },
          splitLine: { lineStyle: { color: colors.grid } },
        },
    series: [
      {
        name: '支出',
        type: 'line',
        yAxisIndex: 0,
        smooth: true,
        symbol: 'circle',
        symbolSize: mode.compact ? 6 : 7,
        lineStyle: { width: 3 },
        itemStyle: { color: colors.expense },
        areaStyle: { color: colors.expenseArea || 'rgba(217, 119, 6, 0.12)' },
        data: expenseData,
      },
      {
        name: '收入',
        type: 'line',
        yAxisIndex: useDualAxis ? 1 : 0,
        smooth: true,
        symbol: 'circle',
        symbolSize: mode.compact ? 6 : 7,
        lineStyle: { width: 3 },
        itemStyle: { color: colors.income },
        areaStyle: { color: colors.incomeArea || 'rgba(15, 118, 110, 0.1)' },
        data: incomeData,
      },
    ],
  }
}

export const buildCategoryShareOption = (
  list: T.ReportCategoryShareItemResp[] | undefined,
  mode: ReportOptionMode = {},
): EChartsOption => {
  const colors = mode.colors || REPORT_COLORS
  const source = list ?? []
  if (!source.length) {
    return buildEmptyOption('当前区间暂无分类占比', colors)
  }

  return {
    color: colors.pieColors || ['#ca8a04', '#f59e0b', '#d97706', '#fbbf24', '#0f766e', '#3b7a57', '#8a7857'],
    tooltip: {
      trigger: 'item',
      backgroundColor: colors.tooltipBg || 'rgba(62, 46, 18, 0.92)',
      borderWidth: 0,
      textStyle: { color: '#fff' },
      formatter: (params: any) => {
        const { name, value, percent } = params
        return `${name}<br/>金额：${formatReportCurrency(value)}<br/>占比：${percent}%`
      },
    },
    legend: mode.compact
      ? undefined
      : {
          orient: 'vertical',
          right: 0,
          top: 'center',
          itemWidth: 10,
          itemHeight: 10,
          textStyle: {
            color: colors.subText,
            fontSize: 12,
          },
        },
    series: [
      {
        type: 'pie',
        radius: mode.compact ? ['48%', '72%'] : ['52%', '74%'],
        center: mode.compact ? ['50%', '54%'] : ['36%', '52%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          color: colors.text,
          fontSize: mode.compact ? 11 : 12,
          formatter: ({ name, percent }: any) => `${name}\n${percent}%`,
        },
        labelLine: {
          lineStyle: { color: colors.border },
        },
        data: source.map((item) => ({
          name: item.name,
          value: toChartNumber(item.amount),
        })),
      },
    ],
  }
}

const buildHorizontalBarOption = (
  source: HorizontalBarDataItem[],
  color: string,
  emptyText: string,
  mode: ReportOptionMode = {},
): EChartsOption => {
  const colors = mode.colors || REPORT_COLORS
  if (!source.length) {
    return buildEmptyOption(emptyText, colors)
  }

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: colors.tooltipBg || 'rgba(62, 46, 18, 0.92)',
      borderWidth: 0,
      textStyle: { color: '#fff' },
      formatter: (params: any) => {
        const item = Array.isArray(params) ? params[0] : params
        const detail = item?.data?.extra ? `<br/>${item.data.extra}` : ''
        return `${item.name}<br/>金额：${formatReportCurrency(item.value)}${detail}`
      },
    },
    grid: {
      left: mode.compact ? 12 : 18,
      right: mode.compact ? 12 : 24,
      top: 12,
      bottom: 12,
      containLabel: true,
    },
    xAxis: {
      type: 'value',
      axisLabel: {
        color: colors.subText,
        fontSize: mode.compact ? 11 : 12,
        formatter: (value: number) => formatReportAmount(value, { compact: true }),
      },
      splitLine: { lineStyle: { color: colors.grid } },
    },
    yAxis: {
      type: 'category',
      axisTick: { show: false },
      axisLine: { show: false },
      axisLabel: {
        color: colors.text,
        fontSize: mode.compact ? 11 : 12,
        overflow: 'truncate',
        width: mode.compact ? 84 : 112,
      },
      data: source.map((item) => item.name),
    },
    series: [
      {
        type: 'bar',
        barWidth: mode.compact ? 12 : 14,
        itemStyle: {
          color,
          borderRadius: [0, 999, 999, 0],
        },
        label: {
          show: true,
          position: 'right',
          color: colors.subText,
          fontSize: mode.compact ? 11 : 12,
          formatter: ({ value }: any) => formatReportAmount(value, { compact: true }),
        },
        data: source,
      },
    ],
  }
}

const resolveRankSource = <T>(list: T[] | undefined, mode: ReportOptionMode) => {
  const source = list ?? []
  if (mode.rankLimit === false) {
    return source
  }
  if (typeof mode.rankLimit === 'number') {
    return source.slice(0, mode.rankLimit)
  }
  return mode.compact ? source.slice(0, REPORT_MOBILE_RANK_LIMIT) : source
}

export const buildSubjectRankOption = (
  list: T.ReportSubjectRankItemResp[] | undefined,
  mode: ReportOptionMode = {},
): EChartsOption => {
  const colors = mode.colors || REPORT_COLORS
  const source = buildOrderedRankSource(list, mode)
    .map((item) => ({
      name: item.subjectName,
      value: toChartNumber(item.amount),
      extra: `占比 ${formatReportRatio(item.ratio)} / ${item.count} 笔`,
    }))

  return buildHorizontalBarOption(source, colors.primary, '当前区间暂无科目排行', mode)
}

export const buildTagRankOption = (
  list: T.ReportTagRankItemResp[] | undefined,
  mode: ReportOptionMode = {},
): EChartsOption => {
  const colors = mode.colors || REPORT_COLORS
  const source = buildOrderedRankSource(list, mode)
    .map<ReportTagRankChartDataItem>((item) => ({
      name: item.tagName,
      value: toChartNumber(item.amount),
      extra: `科目 ${item.subjectName} / 占比 ${formatReportRatio(item.ratio)} / ${item.count} 笔`,
      tagId: item.tagId,
      tagName: item.tagName,
      subjectId: item.subjectId,
      subjectName: item.subjectName,
      amount: toChartNumber(item.amount),
      ratio: item.ratio,
      count: item.count,
    }))

  return buildHorizontalBarOption(source, colors.secondary, '当前条件下暂无标签排行', mode)
}

export const buildPaymentMethodOption = (
  list: T.ReportPaymentMethodShareItemResp[] | undefined,
  mode: ReportOptionMode = {},
): EChartsOption => {
  const colors = mode.colors || REPORT_COLORS
  const source = buildOrderedRankSource(list, mode)
    .map((item) => ({
      name: resolveReportPaymentMethodLabel(item.key, item.label),
      value: toChartNumber(item.amount),
      extra: `占比 ${formatReportRatio(item.ratio)}`,
    }))

  return buildHorizontalBarOption(source, colors.accent, '当前区间暂无支付方式分布', mode)
}

export const buildUserCompareOption = (
  list: T.ReportUserCompareItemResp[] | undefined,
  mode: ReportOptionMode = {},
): EChartsOption => {
  const colors = mode.colors || REPORT_COLORS
  const source = list ?? []
  if (!source.length) {
    return buildEmptyOption('当前区间暂无用户对比', colors)
  }

  return {
    color: [colors.expense, colors.income],
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: colors.tooltipBg || 'rgba(62, 46, 18, 0.92)',
      borderWidth: 0,
      textStyle: { color: '#fff' },
      formatter: (params: any) => {
        const lines = (Array.isArray(params) ? params : [params]).map((item) => {
          return `${item.marker}${item.seriesName}：${formatReportCurrency(item.value)}`
        })
        return [params?.[0]?.axisValueLabel ?? '', ...lines].join('<br/>')
      },
    },
    legend: {
      top: 0,
      right: 0,
      itemWidth: 12,
      itemHeight: 8,
      textStyle: {
        color: colors.subText,
        fontSize: mode.compact ? 11 : 12,
      },
    },
    grid: {
      left: mode.compact ? 12 : 18,
      right: mode.compact ? 12 : 18,
      top: 44,
      bottom: 16,
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      axisTick: { show: false },
      axisLine: { lineStyle: { color: colors.border } },
      axisLabel: {
        color: colors.text,
        fontSize: mode.compact ? 11 : 12,
      },
      data: source.map((item) => item.userName),
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        color: colors.subText,
        fontSize: mode.compact ? 11 : 12,
        formatter: (value: number) => formatReportAmount(value, { compact: true }),
      },
      splitLine: { lineStyle: { color: colors.grid } },
    },
    series: [
      {
        name: '支出',
        type: 'bar',
        barMaxWidth: mode.compact ? 18 : 22,
        itemStyle: {
          color: colors.expense,
          borderRadius: [999, 999, 0, 0],
        },
        data: source.map((item) => toChartNumber(item.expense)),
      },
      {
        name: '收入',
        type: 'bar',
        barMaxWidth: mode.compact ? 18 : 22,
        itemStyle: {
          color: colors.income,
          borderRadius: [999, 999, 0, 0],
        },
        data: source.map((item) => toChartNumber(item.income)),
      },
    ],
  }
}

export const useReportOptions = (
  source: MaybeRefOrGetter<T.ReportDashboardResp | undefined>,
  mode: MaybeRefOrGetter<ReportOptionMode> = {},
) => {
  const trendOption = computed(() => buildTrendChartOption(toValue(source)?.trend, toValue(mode)))
  const categoryOption = computed(() => buildCategoryShareOption(toValue(source)?.categoryShare, toValue(mode)))
  const subjectRankOption = computed(() => buildSubjectRankOption(toValue(source)?.subjectRank, toValue(mode)))
  const tagRankOption = computed(() => buildTagRankOption(toValue(source)?.tagRank, toValue(mode)))
  const paymentMethodOption = computed(() => buildPaymentMethodOption(toValue(source)?.paymentMethodShare, toValue(mode)))
  const userCompareOption = computed(() => buildUserCompareOption(toValue(source)?.userCompare, toValue(mode)))

  return {
    trendOption,
    categoryOption,
    subjectRankOption,
    tagRankOption,
    paymentMethodOption,
    userCompareOption,
  }
}
