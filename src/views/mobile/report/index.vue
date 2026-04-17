<template>
  <div class="mobile-page mobile-report-page">
    <section class="mobile-panel mobile-report-hero">
      <div class="mobile-report-hero__preset-group">
        <button
          v-for="item in filteredDatePresetOptions"
          :key="String(item.value)"
          type="button"
          class="mobile-report-hero__preset"
          :class="{ 'is-active': filterForm.datePreset === item.value }"
          @click="handlePresetChange(item.value as any)"
        >
          {{ item.shortLabel }}
        </button>
      </div>

      <div class="mobile-report-hero__user-group">
        <button
          v-for="item in userChipOptions"
          :key="String(item.value)"
          type="button"
          class="mobile-report-hero__user-chip"
          :class="{ 'is-active': selectedUserValue === String(item.value) }"
          @click="handleUserChange(String(item.value))"
        >
          {{ item.label }}
        </button>
      </div>

      <p class="mobile-report-hero__desc">{{ filterSummaryText }}</p>
    </section>

    <MobilePageSkeleton v-if="loading" variant="report" />

    <template v-else>
      <MobileReportSummaryCards :overview="dashboard.overview" />
      <MobileReportTrendChart :option="trendOption" />
      <MobileReportCategoryPie :option="categoryOption" :items="dashboard.categoryShare" @select="handleCategoryDrilldown" />
      <MobileReportSubjectRank :option="subjectRankOption" :count="dashboard.subjectRank.length" />
      <MobileReportTagRank v-if="showTagRank" :option="tagRankOption" :count="dashboard.tagRank.length" />
      <MobileReportPaymentMethod :option="paymentMethodOption" :count="dashboard.paymentMethodShare.length" />
      <MobileReportUserCompare v-if="showUserCompare" :option="userCompareOption" />
      <MobileReportInsightPanel :insight="dashboard.insight" />
    </template>
  </div>
</template>

<script setup lang="ts">
/**
 * 移动端报表页面
 *
 * @author Wangsongsong
 * @date 2026-03-28
 * @update 2026-04-17 @Wangsongsong
 * @desc 移除筛选弹出层，将用户范围移到顶部 chips，隐藏自定义时间预设
 */
import { computed, onMounted, ref } from 'vue'
import MobileReportCategoryPie from './components/MobileReportCategoryPie.vue'
import MobileReportInsightPanel from './components/MobileReportInsightPanel.vue'
import MobileReportPaymentMethod from './components/MobileReportPaymentMethod.vue'
import MobileReportSubjectRank from './components/MobileReportSubjectRank.vue'
import MobileReportSummaryCards from './components/MobileReportSummaryCards.vue'
import MobileReportTagRank from './components/MobileReportTagRank.vue'
import MobileReportTrendChart from './components/MobileReportTrendChart.vue'
import MobileReportUserCompare from './components/MobileReportUserCompare.vue'
import { useReportOptions } from '@/views/bookkeeping/report/shared/useReportOptions'
import { useReportFilters } from '@/views/bookkeeping/report/shared/useReportFilters'
import {
  REPORT_DATE_PRESET_OPTIONS,
  createEmptyReportDashboard,
} from '@/views/bookkeeping/report/shared/reportConstants'
import { mobileToast } from '@/utils/mobile-toast'
import MobilePageSkeleton from '@/views/mobile/components/MobilePageSkeleton.vue'
import type * as T from '@/apis/bookkeeping/type'
import { getReportDashboard } from '@/apis/bookkeeping/report'

defineOptions({ name: 'MobileReport' })

const loading = ref(false)
const dashboard = ref<T.ReportDashboardResp>(createEmptyReportDashboard())

const {
  filterForm,
  userSelectOptions,
  loadFilterOptions,
  resetFilters,
  setSelectedUser,
  buildDashboardQuery,
} = useReportFilters()

/** 过滤掉"自定义"选项 */
const filteredDatePresetOptions = computed(() =>
  REPORT_DATE_PRESET_OPTIONS.filter((item) => item.value !== 'custom'),
)

/** 用户选择 chips：前面加一个"全部"选项 */
const userChipOptions = computed(() => [
  { label: '全部', value: '' },
  ...userSelectOptions.value,
])

/** 当前选中的用户值，用于高亮 */
const selectedUserValue = computed(() => {
  if (filterForm.userScope === 'all') {
    return ''
  }
  return filterForm.userId || ''
})

const showUserCompare = computed(() => dashboard.value.userCompare.length > 1)
const showTagRank = computed(() => !!filterForm.subjectId || !!filterForm.tagId)
const { trendOption, categoryOption, subjectRankOption, tagRankOption, paymentMethodOption, userCompareOption } = useReportOptions(
  () => dashboard.value,
  () => ({ compact: true, dualAxis: true, rankLimit: false }),
)

const resolveUserText = () => {
  if (filterForm.userScope === 'all') {
    return '全部用户'
  }
  const matched = userSelectOptions.value.find((item) => String(item.value) === String(filterForm.userId))
  return matched?.label || '当前用户'
}

const filterSummaryText = computed(() => {
  const presetLabel = filteredDatePresetOptions.value.find((item) => item.value === filterForm.datePreset)?.label || '本月'
  return `${presetLabel} · ${resolveUserText()}`
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
  if (filterForm.datePreset === preset) {
    return
  }
  filterForm.datePreset = preset
  await loadDashboard()
}

/**
 * 切换用户后直接触发查询
 *
 * @author Wangsongsong
 * @date 2026-04-17
 */
const handleUserChange = async (userId: string) => {
  setSelectedUser(userId || null)
  await loadDashboard()
}

const handleCategoryDrilldown = async (categoryKey: string) => {
  if (!categoryKey) {
    return
  }
  filterForm.category = categoryKey
  filterForm.subjectId = ''
  filterForm.tagId = ''
  await loadDashboard()
}

onMounted(async () => {
  await loadFilterOptions()
  await loadDashboard()
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

.mobile-report-hero__preset-group {
  display: flex;
  gap: 10px;
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

.mobile-report-hero__user-group {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  overflow-x: auto;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}

.mobile-report-hero__user-group::-webkit-scrollbar {
  display: none;
}

.mobile-report-hero__user-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 30px;
  padding: 0 12px;
  border: 1px solid rgba(143, 99, 17, 0.08);
  border-radius: 999px;
  background: rgba(255, 248, 223, 0.78);
  color: #6b4a0d;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

.mobile-report-hero__user-chip.is-active {
  border-color: rgba(197, 138, 18, 0.26);
  background: rgba(255, 255, 255, 0.96);
  color: #47300b;
  box-shadow: 0 4px 10px rgba(103, 73, 12, 0.08);
}

.mobile-report-hero__desc {
  margin: 12px 0 0;
  color: #7d6a47;
  font-size: 13px;
  line-height: 1.7;
}
</style>
