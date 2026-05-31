<template>
  <div class="gi_page workplace-page">
    <div class="workplace-grid">
      <section class="workplace-grid__welcome">
        <Welcome :scope-label="scopeLabel" :period-label="periodLabel" />
      </section>

      <section class="workplace-grid__quick">
        <QuickOperation />
      </section>

      <section class="workplace-grid__overview">
        <WorkplaceOverviewCards
          :sections="overviewSections"
          :loading="dashboardLoading"
          :scope-label="scopeLabel"
        />
      </section>

      <section class="workplace-grid__trend">
        <WorkplaceTrendInsight
          :sections="trendSections"
          :loading="dashboardLoading"
          :scope-label="scopeLabel"
        />
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Message } from '@arco-design/web-vue'
import dayjs from 'dayjs'
import { computed, ref, watch } from 'vue'
import type * as T from '@/apis/bookkeeping/type'
import { getReportDashboard, getReportEarliestDate } from '@/apis/bookkeeping/report'
import { usePrivacyStore, useUserStore } from '@/stores'
import { createEmptyReportDashboard } from '@/views/bookkeeping/report/shared/reportConstants'
import Welcome from './components/Welcome.vue'
import QuickOperation from './components/QuickOperation.vue'
import WorkplaceOverviewCards from './components/WorkplaceOverviewCards.vue'
import WorkplaceTrendInsight from './components/WorkplaceTrendInsight.vue'

defineOptions({ name: 'Workplace' })

interface WorkplaceDashboardSection {
  key: 'all' | 'currentMonth' | 'lastMonth'
  title: string
  description: string
  accentClass: string
  dashboard: T.ReportDashboardResp
}

const userStore = useUserStore()
const privacyStore = usePrivacyStore()

const dashboardLoading = ref(false)
const dashboardSections = ref<Record<WorkplaceDashboardSection['key'], T.ReportDashboardResp>>({
  all: createEmptyReportDashboard(),
  currentMonth: createEmptyReportDashboard(),
  lastMonth: createEmptyReportDashboard(),
})

const periodLabel = '全部 / 本月 / 上月'
const currentUserId = computed(() => String(userStore.userInfo.id ?? ''))
const scopeLabel = '当前用户'
const ALL_TIME_START_DATE = '1970-01-01'
const ALL_TIME_END_DATE = '2099-12-31'
const currentMonthEndDate = computed(() => dayjs().endOf('month').format('YYYY-MM-DD'))

const createAllTimeQuery = (userId: string): T.ReportQuery => ({
  userId,
  startDate: ALL_TIME_START_DATE,
  endDate: ALL_TIME_END_DATE,
  privacyMode: privacyStore.isPrivacyMode,
})

const createAllTrendBaseQuery = (userId: string): T.ReportQuery => ({
  userId,
  privacyMode: privacyStore.isPrivacyMode,
})

const createAllTrendQuery = (userId: string, startDate: string): T.ReportQuery => ({
  userId,
  startDate,
  endDate: currentMonthEndDate.value,
  privacyMode: privacyStore.isPrivacyMode,
})

const createPresetQuery = (userId: string, datePreset: T.ReportDatePreset): T.ReportQuery => ({
  userId,
  datePreset,
  privacyMode: privacyStore.isPrivacyMode,
})

const createEmptySectionMap = () => ({
  all: createEmptyReportDashboard(),
  currentMonth: createEmptyReportDashboard(),
  lastMonth: createEmptyReportDashboard(),
})

const loadDashboard = async () => {
  if (!currentUserId.value) {
    dashboardSections.value = createEmptySectionMap()
    return
  }

  dashboardLoading.value = true
  try {
    const [allOverviewResp, allTrendStartResp, currentMonthResp, lastMonthResp] = await Promise.all([
      getReportDashboard(createAllTimeQuery(currentUserId.value)),
      getReportEarliestDate(createAllTrendBaseQuery(currentUserId.value)),
      getReportDashboard(createPresetQuery(currentUserId.value, 'currentMonth')),
      getReportDashboard(createPresetQuery(currentUserId.value, 'lastMonth')),
    ])
    const allTrendStartDate = allTrendStartResp.data?.date
    const canLoadAllTrend = Boolean(allTrendStartDate) && allTrendStartDate! <= currentMonthEndDate.value
    const allTrendResp = canLoadAllTrend
      ? await getReportDashboard(createAllTrendQuery(currentUserId.value, allTrendStartDate!))
      : null
    const emptyDashboard = createEmptyReportDashboard()
    dashboardSections.value = {
      all: {
        ...(allOverviewResp.data ?? emptyDashboard),
        trend: allTrendResp?.data?.trend ?? emptyDashboard.trend,
        insight: allTrendResp?.data?.insight ?? [],
      },
      currentMonth: currentMonthResp.data ?? createEmptyReportDashboard(),
      lastMonth: lastMonthResp.data ?? createEmptyReportDashboard(),
    }
  } catch {
    dashboardSections.value = createEmptySectionMap()
    Message.error('加载工作台数据失败')
  } finally {
    dashboardLoading.value = false
  }
}

const overviewSections = computed<WorkplaceDashboardSection[]>(() => [
  {
    key: 'all',
    title: '全部总览',
    description: '',
    accentClass: 'is-all',
    dashboard: dashboardSections.value.all,
  },
  {
    key: 'currentMonth',
    title: '本月总览',
    description: '',
    accentClass: 'is-current-month',
    dashboard: dashboardSections.value.currentMonth,
  },
  {
    key: 'lastMonth',
    title: '上月总览',
    description: '',
    accentClass: 'is-last-month',
    dashboard: dashboardSections.value.lastMonth,
  },
])

const trendSections = computed<WorkplaceDashboardSection[]>(() => [
  {
    key: 'all',
    title: '全部收支趋势',
    description: '',
    accentClass: 'is-all',
    dashboard: dashboardSections.value.all,
  },
  {
    key: 'currentMonth',
    title: '本月收支趋势',
    description: '',
    accentClass: 'is-current-month',
    dashboard: dashboardSections.value.currentMonth,
  },
  {
    key: 'lastMonth',
    title: '上月收支趋势',
    description: '',
    accentClass: 'is-last-month',
    dashboard: dashboardSections.value.lastMonth,
  },
])

watch(
  () => [currentUserId.value, privacyStore.isPrivacyMode] as const,
  ([userId]) => {
    if (!userId) {
      dashboardSections.value = createEmptySectionMap()
      return
    }
    void loadDashboard()
  },
  { immediate: true },
)
</script>

<style scoped lang="scss">
.workplace-page {
  // padding 由全局 .gi_page 统一提供，不再单独覆盖
}

.workplace-grid {
  display: grid;
  grid-template-columns: minmax(300px, 360px) minmax(0, 1fr);
  gap: 16px;
}

.workplace-grid__welcome,
.workplace-grid__trend {
  grid-column: 1 / -1;
}

.workplace-grid__quick,
.workplace-grid__overview,
.workplace-grid__trend,
.workplace-grid__welcome {
  min-width: 0;
}

@media (max-width: 1280px) {
  .workplace-grid {
    grid-template-columns: 1fr;
  }

  .workplace-grid__welcome,
  .workplace-grid__trend {
    grid-column: auto;
  }
}

@media (max-width: 768px) {
  .workplace-page {
    padding: 0;
  }
}
</style>
