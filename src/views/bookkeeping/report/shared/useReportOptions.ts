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
}

const REPORT_COLORS = {
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
}

const toChartNumber = (value: number | string | undefined | null) => {
  const numericValue = Number(value)
  return Number.isFinite(numericValue) ? numericValue : 0
}

const buildEmptyOption = (text: string): EChartsOption => ({
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
        fill: REPORT_COLORS.subText,
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
  const points = trend?.points ?? []
  if (!points.length) {
    return buildEmptyOption('当前区间暂无趋势数据')
  }

  const expenseData = points.map((item) => toChartNumber(item.expense))
  const incomeData = points.map((item) => toChartNumber(item.income))
  const useDualAxis = mode.compact ? !!mode.dualAxis : true

  return {
    color: [REPORT_COLORS.expense, REPORT_COLORS.income],
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(62, 46, 18, 0.92)',
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
        color: REPORT_COLORS.subText,
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
      axisLine: { lineStyle: { color: REPORT_COLORS.border } },
      axisLabel: {
        color: REPORT_COLORS.subText,
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
              color: REPORT_COLORS.expense,
              fontSize: 12,
              fontWeight: 700,
              padding: [0, 0, 6, 0],
            },
            axisLabel: {
              color: REPORT_COLORS.expense,
              fontSize: 12,
              formatter: (value: number) => formatReportAmount(value, { compact: true }),
            },
            axisLine: { show: true, lineStyle: { color: 'rgba(217, 119, 6, 0.22)' } },
            splitLine: { lineStyle: { color: REPORT_COLORS.grid } },
          },
          {
            type: 'value',
            name: '收入',
            nameTextStyle: {
              color: REPORT_COLORS.income,
              fontSize: 12,
              fontWeight: 700,
              padding: [0, 0, 6, 0],
            },
            axisLabel: {
              color: REPORT_COLORS.income,
              fontSize: 12,
              formatter: (value: number) => formatReportAmount(value, { compact: true }),
            },
            axisLine: { show: true, lineStyle: { color: 'rgba(15, 118, 110, 0.22)' } },
            splitLine: { show: false },
          },
        ]
      : {
          type: 'value',
          axisLabel: {
            color: REPORT_COLORS.subText,
            fontSize: mode.compact ? 11 : 12,
            formatter: (value: number) => formatReportAmount(value, { compact: true }),
          },
          splitLine: { lineStyle: { color: REPORT_COLORS.grid } },
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
        itemStyle: { color: REPORT_COLORS.expense },
        areaStyle: { color: 'rgba(217, 119, 6, 0.12)' },
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
        itemStyle: { color: REPORT_COLORS.income },
        areaStyle: { color: 'rgba(15, 118, 110, 0.1)' },
        data: incomeData,
      },
    ],
  }
}

export const buildCategoryShareOption = (
  list: T.ReportCategoryShareItemResp[] | undefined,
  mode: ReportOptionMode = {},
): EChartsOption => {
  const source = list ?? []
  if (!source.length) {
    return buildEmptyOption('当前区间暂无分类占比')
  }

  return {
    color: ['#ca8a04', '#f59e0b', '#d97706', '#fbbf24', '#0f766e', '#3b7a57', '#8a7857'],
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(62, 46, 18, 0.92)',
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
            color: REPORT_COLORS.subText,
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
          color: REPORT_COLORS.text,
          fontSize: mode.compact ? 11 : 12,
          formatter: ({ name, percent }: any) => `${name}\n${percent}%`,
        },
        labelLine: {
          lineStyle: { color: REPORT_COLORS.border },
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
  source: Array<{ name: string, value: number, extra?: string }>,
  color: string,
  emptyText: string,
  mode: ReportOptionMode = {},
): EChartsOption => {
  if (!source.length) {
    return buildEmptyOption(emptyText)
  }

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(62, 46, 18, 0.92)',
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
        color: REPORT_COLORS.subText,
        fontSize: mode.compact ? 11 : 12,
        formatter: (value: number) => formatReportAmount(value, { compact: true }),
      },
      splitLine: { lineStyle: { color: REPORT_COLORS.grid } },
    },
    yAxis: {
      type: 'category',
      axisTick: { show: false },
      axisLine: { show: false },
      axisLabel: {
        color: REPORT_COLORS.text,
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
          color: REPORT_COLORS.subText,
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
  const source = resolveRankSource(list, mode)
    .reverse()
    .map((item) => ({
      name: item.subjectName,
      value: toChartNumber(item.amount),
      extra: `占比 ${formatReportRatio(item.ratio)} / ${item.count} 笔`,
    }))

  return buildHorizontalBarOption(source, REPORT_COLORS.primary, '当前区间暂无科目排行', mode)
}

export const buildTagRankOption = (
  list: T.ReportTagRankItemResp[] | undefined,
  mode: ReportOptionMode = {},
): EChartsOption => {
  const source = resolveRankSource(list, mode)
    .reverse()
    .map((item) => ({
      name: item.tagName,
      value: toChartNumber(item.amount),
      extra: `科目 ${item.subjectName} / 占比 ${formatReportRatio(item.ratio)} / ${item.count} 笔`,
    }))

  return buildHorizontalBarOption(source, REPORT_COLORS.secondary, '当前条件下暂无标签排行', mode)
}

export const buildPaymentMethodOption = (
  list: T.ReportPaymentMethodShareItemResp[] | undefined,
  mode: ReportOptionMode = {},
): EChartsOption => {
  const source = resolveRankSource(list, mode)
    .reverse()
    .map((item) => ({
      name: resolveReportPaymentMethodLabel(item.key, item.label),
      value: toChartNumber(item.amount),
      extra: `占比 ${formatReportRatio(item.ratio)}`,
    }))

  return buildHorizontalBarOption(source, REPORT_COLORS.accent, '当前区间暂无支付方式分布', mode)
}

export const buildUserCompareOption = (
  list: T.ReportUserCompareItemResp[] | undefined,
  mode: ReportOptionMode = {},
): EChartsOption => {
  const source = list ?? []
  if (!source.length) {
    return buildEmptyOption('当前区间暂无用户对比')
  }

  return {
    color: [REPORT_COLORS.expense, REPORT_COLORS.income],
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(62, 46, 18, 0.92)',
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
        color: REPORT_COLORS.subText,
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
      axisLine: { lineStyle: { color: REPORT_COLORS.border } },
      axisLabel: {
        color: REPORT_COLORS.text,
        fontSize: mode.compact ? 11 : 12,
      },
      data: source.map((item) => item.userName),
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        color: REPORT_COLORS.subText,
        fontSize: mode.compact ? 11 : 12,
        formatter: (value: number) => formatReportAmount(value, { compact: true }),
      },
      splitLine: { lineStyle: { color: REPORT_COLORS.grid } },
    },
    series: [
      {
        name: '支出',
        type: 'bar',
        barMaxWidth: mode.compact ? 18 : 22,
        itemStyle: {
          color: REPORT_COLORS.expense,
          borderRadius: [999, 999, 0, 0],
        },
        data: source.map((item) => toChartNumber(item.expense)),
      },
      {
        name: '收入',
        type: 'bar',
        barMaxWidth: mode.compact ? 18 : 22,
        itemStyle: {
          color: REPORT_COLORS.income,
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
