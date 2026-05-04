<template>
  <ReportPanelShell
    title="收支趋势与洞察"
    description=""
    :loading="loading"
  >
    <div class="workplace-trend-sections">
      <section
        v-for="section in sections"
        :key="section.key"
        class="workplace-trend-section"
        :class="section.accentClass"
      >
        <div class="workplace-trend-section__head">
          <div>
            <strong>{{ section.title }}</strong>
            <p>{{ section.description }}</p>
          </div>
        </div>

        <Chart :option="buildSectionTrendOption(section.dashboard.trend, section.key)" :update-options="{ notMerge: true }" height="280px" />

        <div class="workplace-trend-section__insight">
          <div class="workplace-trend-section__insight-head">
            <strong>洞察摘要</strong>
            <span>最多 3 条</span>
          </div>

          <ol v-if="section.dashboard.insight.length" class="workplace-trend-section__list">
            <li
              v-for="(item, index) in section.dashboard.insight.slice(0, 3)"
              :key="`${section.key}-${index}-${item}`"
              class="workplace-trend-section__item"
            >
              <span class="workplace-trend-section__index">{{ index + 1 }}</span>
              <span class="workplace-trend-section__text">{{ item }}</span>
            </li>
          </ol>

          <div v-else class="workplace-trend-section__empty">
            暂无可直接生成的洞察摘要。
          </div>
        </div>
      </section>
    </div>
  </ReportPanelShell>
</template>

<script setup lang="ts">
import type { EChartsOption, SeriesOption } from 'echarts'
import type { ReportDashboardResp, ReportTrendResp } from '@/apis/bookkeeping/type'
import Chart from '@/components/Chart/index.vue'
import ReportPanelShell from '@/views/bookkeeping/report/components/ReportPanelShell.vue'
import { buildTrendChartOption } from '@/views/bookkeeping/report/shared/useReportOptions'

interface WorkplaceTrendSection {
  key: 'all' | 'currentMonth' | 'lastMonth'
  title: string
  description: string
  accentClass: string
  dashboard: ReportDashboardResp
}

withDefaults(defineProps<{
  sections: WorkplaceTrendSection[]
  loading?: boolean
  scopeLabel?: string
}>(), {
  loading: false,
  scopeLabel: '当前用户',
})

const REPORT_COLORS_ALL = {
  expense: '#f97316',
  income: '#10b981',
  primary: '#0ea5e9',
  accent: '#38bdf8',
  secondary: '#0284c7',
  tertiary: '#14b8a6',
  muted: '#64748b',
  border: 'rgba(14, 165, 233, 0.14)',
  text: '#0f172a',
  subText: '#64748b',
  grid: 'rgba(14, 165, 233, 0.08)',
  tooltipBg: 'rgba(15, 23, 42, 0.92)',
  expenseArea: 'rgba(249, 115, 22, 0.12)',
  incomeArea: 'rgba(16, 185, 129, 0.12)',
}

const REPORT_COLORS_CURRENT_MONTH = {
  expense: '#ef4444',
  income: '#16a34a',
  primary: '#65a30d',
  accent: '#84cc16',
  secondary: '#4d7c0f',
  tertiary: '#22c55e',
  muted: '#6b7280',
  border: 'rgba(101, 163, 13, 0.14)',
  text: '#1f2937',
  subText: '#6b7280',
  grid: 'rgba(101, 163, 13, 0.08)',
  tooltipBg: 'rgba(20, 32, 12, 0.92)',
  expenseArea: 'rgba(239, 68, 68, 0.12)',
  incomeArea: 'rgba(34, 197, 94, 0.12)',
}

const REPORT_COLORS_LAST_MONTH = {
  expense: '#f97316',
  income: '#0f766e',
  primary: '#d97706',
  accent: '#f59e0b',
  secondary: '#b45309',
  tertiary: '#0f766e',
  muted: '#78716c',
  border: 'rgba(217, 119, 6, 0.14)',
  text: '#292524',
  subText: '#78716c',
  grid: 'rgba(217, 119, 6, 0.08)',
  tooltipBg: 'rgba(41, 37, 36, 0.92)',
  expenseArea: 'rgba(249, 115, 22, 0.12)',
  incomeArea: 'rgba(15, 118, 110, 0.12)',
}

const colorMap = {
  all: REPORT_COLORS_ALL,
  currentMonth: REPORT_COLORS_CURRENT_MONTH,
  lastMonth: REPORT_COLORS_LAST_MONTH,
} as const

const buildAllTrendBarOption = (trend: ReportTrendResp): EChartsOption => {
  const baseOption = buildTrendChartOption(trend, {
    compact: true,
    dualAxis: true,
    colors: colorMap.all,
  }) as EChartsOption & {
    xAxis?: Record<string, any>
    series?: SeriesOption[]
  }

  return {
    ...baseOption,
    xAxis: {
      ...(baseOption.xAxis ?? {}),
      boundaryGap: true,
    },
    series: (baseOption.series ?? []).map((series, index) => ({
      ...series,
      type: 'bar',
      barMaxWidth: 18,
      smooth: undefined,
      symbol: undefined,
      symbolSize: undefined,
      lineStyle: undefined,
      areaStyle: undefined,
      itemStyle: {
        ...(series as Record<string, any>).itemStyle,
        borderRadius: [8, 8, 0, 0],
      },
      emphasis: {
        focus: 'series',
      },
      z: index + 1,
    })),
  }
}

const buildSectionTrendOption = (trend: ReportTrendResp, key: WorkplaceTrendSection['key']) => {
  if (key === 'all') {
    return buildAllTrendBarOption(trend)
  }
  return buildTrendChartOption(trend, {
    compact: true,
    dualAxis: true,
    colors: colorMap[key],
  })
}
</script>

<style scoped lang="scss">
.workplace-trend-sections {
  display: grid;
  gap: 16px;
}

.workplace-trend-section {
  position: relative;
  overflow: hidden;
  padding: 16px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.98);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.82),
    0 16px 34px rgba(15, 23, 42, 0.04);
}

.workplace-trend-section.is-all {
  background: #f5fbff;
}

.workplace-trend-section.is-current-month {
  background: #f9fff3;
}

.workplace-trend-section.is-last-month {
  background: #fffcf4;
}

.workplace-trend-section__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.workplace-trend-section__head strong {
  color: var(--color-text-1);
  font-size: 17px;
  font-weight: 800;
  line-height: 1.3;
}

.workplace-trend-section__head p {
  margin: 6px 0 0;
  color: var(--color-text-3);
  font-size: 12px;
  line-height: 1.7;
}

.workplace-trend-section__insight {
  margin-top: 14px;
}

.workplace-trend-section__insight-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.workplace-trend-section__insight-head strong {
  color: var(--color-text-1);
  font-size: 14px;
  font-weight: 700;
}

.workplace-trend-section__insight-head span {
  color: var(--color-text-3);
  font-size: 12px;
}

.workplace-trend-section__list {
  display: flex;
  gap: 10px;
  align-items: stretch;
  flex-wrap: nowrap;
  margin: 0;
  padding: 0;
  list-style: none;
  overflow: hidden;
}

.workplace-trend-section__item {
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  flex: 1 1 0;
  min-width: 0;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.78);
}

.workplace-trend-section__index {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 22px;
  height: 22px;
  border-radius: 999px;
  background: rgba(219, 234, 254, 0.92);
  color: rgb(var(--primary-6));
  font-size: 12px;
  font-weight: 700;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

.workplace-trend-section__text {
  min-width: 0;
  color: var(--color-text-1);
  font-size: 12px;
  line-height: 1.5;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.workplace-trend-section__empty {
  padding: 12px 14px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.94);
  color: var(--color-text-3);
  font-size: 13px;
  line-height: 1.7;
}

@media (max-width: 768px) {
  .workplace-trend-section {
    padding: 14px;
  }

  .workplace-trend-section__list {
    flex-direction: column;
  }
}
</style>
