<template>
  <div class="mobile-page mobile-report-page">
    <section class="mobile-panel mobile-report-hero">
      <div class="mobile-report-hero__top">
        <t-button size="small" variant="outline" @click="filterPopupVisible = true">筛选</t-button>
      </div>

      <div class="mobile-report-hero__preset-group">
        <button
          v-for="item in datePresetOptions"
          :key="String(item.value)"
          type="button"
          class="mobile-report-hero__preset"
          :class="{ 'is-active': filterForm.datePreset === item.value }"
          @click="handlePresetChange(item.value as any)"
        >
          {{ item.shortLabel }}
        </button>
      </div>

      <p class="mobile-report-hero__desc">{{ filterSummaryText }}</p>
    </section>

    <MobilePageSkeleton v-if="loading" variant="report" />

    <template v-else>
      <MobileReportSummaryCards :overview="dashboard.overview" />
      <MobileReportTrendChart :option="trendOption" />
      <MobileReportCategoryPie :option="categoryOption" :items="dashboard.categoryShare" @select="handleCategoryDrilldown" />
      <MobileReportSubjectRank :option="subjectRankOption" />
      <MobileReportPaymentMethod :option="paymentMethodOption" />
      <MobileReportUserCompare v-if="showUserCompare" :option="userCompareOption" />
      <MobileReportInsightPanel :insight="dashboard.insight" />
    </template>

    <MobileReportFilterPopup
      v-model:visible="filterPopupVisible"
      :filter-form="filterForm"
      :date-preset-options="datePresetOptions"
      :category-options="categoryOptions"
      :subject-options="subjectOptions"
      :payment-method-options="paymentMethodOptions"
      :user-scope-options="userScopeOptions"
      :user-select-options="userSelectOptions"
      :all-subjects="allSubjects"
      :auto-open-calendar="autoOpenCalendar"
      @confirm="handleConfirmFilters"
      @reset="handleResetFilters"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { getReportDashboard } from '@/apis/bookkeeping/report'
import type * as T from '@/apis/bookkeeping/type'
import MobilePageSkeleton from '@/views/mobile/components/MobilePageSkeleton.vue'
import { mobileToast } from '@/utils/mobile-toast'
import {
  REPORT_DATE_PRESET_OPTIONS,
  REPORT_USER_SCOPE_OPTIONS,
  createEmptyReportDashboard,
} from '@/views/bookkeeping/report/shared/reportConstants'
import { useReportFilters } from '@/views/bookkeeping/report/shared/useReportFilters'
import { useReportOptions } from '@/views/bookkeeping/report/shared/useReportOptions'
import MobileReportCategoryPie from './components/MobileReportCategoryPie.vue'
import MobileReportFilterPopup from './components/MobileReportFilterPopup.vue'
import MobileReportInsightPanel from './components/MobileReportInsightPanel.vue'
import MobileReportPaymentMethod from './components/MobileReportPaymentMethod.vue'
import MobileReportSubjectRank from './components/MobileReportSubjectRank.vue'
import MobileReportSummaryCards from './components/MobileReportSummaryCards.vue'
import MobileReportTrendChart from './components/MobileReportTrendChart.vue'
import MobileReportUserCompare from './components/MobileReportUserCompare.vue'

defineOptions({ name: 'MobileReport' })

const loading = ref(false)
const filterPopupVisible = ref(false)
const autoOpenCalendar = ref(false)
const dashboard = ref<T.ReportDashboardResp>(createEmptyReportDashboard())

const {
  filterForm,
  allSubjects,
  userSelectOptions,
  categoryOptions,
  paymentMethodOptions,
  subjectOptions,
  loadFilterOptions,
  resetFilters,
  buildDashboardQuery,
} = useReportFilters()

const datePresetOptions = REPORT_DATE_PRESET_OPTIONS
const userScopeOptions = REPORT_USER_SCOPE_OPTIONS
const showUserCompare = computed(() => dashboard.value.userCompare.length > 1)
const { trendOption, categoryOption, subjectRankOption, paymentMethodOption, userCompareOption } = useReportOptions(
  () => dashboard.value,
  () => ({ compact: true, dualAxis: true }),
)

const resolveOptionLabel = (options: Array<{ label: string; value: any }>, value: string) => {
  return options.find(item => String(item.value) === String(value))?.label || '全部'
}

const filterSummaryText = computed(() => {
  const categoryText = resolveOptionLabel(categoryOptions.value, filterForm.category)
  const subjectText = resolveOptionLabel(subjectOptions.value, filterForm.subjectId)
  const paymentText = resolveOptionLabel(paymentMethodOptions.value, filterForm.paymentMethod)
  const userText = filterForm.userScope === 'all'
    ? '全部用户'
    : filterForm.userScope === 'specific'
      ? resolveOptionLabel(userSelectOptions.value, filterForm.userId)
      : '当前用户'
  return `${userText} · ${categoryText} · ${subjectText} · ${paymentText}`
})

const loadDashboard = async () => {
  loading.value = true
  try {
    const { data } = await getReportDashboard(buildDashboardQuery())
    dashboard.value = data || createEmptyReportDashboard()
  } catch {
    dashboard.value = createEmptyReportDashboard()
    mobileToast.error('加载报表失败')
  } finally {
    loading.value = false
  }
}

const handlePresetChange = async (preset: T.ReportDatePreset) => {
  if (preset === 'custom') {
    filterForm.datePreset = 'custom'
    autoOpenCalendar.value = true
    filterPopupVisible.value = true
    return
  }

  autoOpenCalendar.value = false
  if (filterForm.datePreset === preset) {
    return
  }
  filterForm.datePreset = preset
  await loadDashboard()
}

const handleConfirmFilters = async () => {
  filterPopupVisible.value = false
  await loadDashboard()
}

const handleResetFilters = async () => {
  resetFilters()
  filterPopupVisible.value = false
  await loadDashboard()
}

const handleCategoryDrilldown = async (subjectName: string) => {
  const matchedSubject = allSubjects.value.find(item => item.name === subjectName && (!filterForm.category || item.category === filterForm.category))
  if (!matchedSubject) {
    return
  }
  filterForm.subjectId = String(matchedSubject.id)
  await loadDashboard()
}

onMounted(async () => {
  await loadFilterOptions()
  await loadDashboard()
})

watch(filterPopupVisible, (visible) => {
  if (!visible) {
    autoOpenCalendar.value = false
  }
})
</script>

<style scoped lang="scss">
.mobile-report-page {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.mobile-report-hero {
  padding: 18px 16px;
}

.mobile-report-hero__top {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
}

.mobile-report-hero__preset-group {
  display: flex;
  gap: 10px;
  margin-top: 14px;
  overflow-x: auto;
  scrollbar-width: none;
}

.mobile-report-hero__preset-group::-webkit-scrollbar {
  display: none;
}

.mobile-report-hero__preset {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 62px;
  min-height: 34px;
  padding: 0 14px;
  border: 1px solid rgba(143, 99, 17, 0.1);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.86);
  color: #6f5b37;
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
}

.mobile-report-hero__preset.is-active {
  border-color: rgba(197, 138, 18, 0.26);
  background: linear-gradient(135deg, rgba(255, 243, 201, 0.98) 0%, rgba(251, 191, 36, 0.24) 100%);
  color: #8b5e00;
}

.mobile-report-hero__desc {
  margin: 14px 0 0;
  color: #7d6a47;
  font-size: 13px;
  line-height: 1.7;
}
</style>
