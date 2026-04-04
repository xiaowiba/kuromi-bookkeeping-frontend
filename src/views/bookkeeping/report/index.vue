<template>
  <GiPageLayout :body-style="{ overflowY: 'auto', overflowX: 'hidden' }">
    <div class="report-page">
      <!--
        报表筛选栏：
        展示形式对齐明细管理查询区，
        负责统一承接时间范围、分类、科目、支付方式、用户范围等查询条件，
        并向当前页面抛出 查询 / 重置 事件。
      -->
      <ReportFilterBar
        :filter-form="dashboardFilterForm"
        :is-admin="isAdmin"
        :category-options="dashboardCategoryOptions"
        :subject-options="dashboardSubjectOptions"
        :payment-method-options="dashboardPaymentMethodOptions"
        :user-query-options="dashboardUserQueryOptions"
        :on-select-user="setDashboardSelectedUser"
        :loading="dashboardLoading"
        @search="handleSearch"
        @reset="handleReset"
      />

      <!-- 报表顶部汇总卡：展示总支出、总收入、结余、记录数等核心概览指标 -->
      <ReportSummaryCards :overview="dashboard.overview" :loading="dashboardLoading" />
      <ReportInsightPanel :insight="dashboard.insight" :loading="dashboardLoading" />

      <div class="report-grid report-grid--top">
        <!-- 收支趋势图：按日 / 月展示当前筛选条件下的收入、支出变化趋势 -->
        <ReportTrendChartCard :option="trendOption" :loading="dashboardLoading" />

        <!--
          分类占比图：
          展示当前区间内各分类 / 科目的金额占比，
          点击右侧列表项后会回填科目筛选，形成钻取联动。
        -->
        <ReportCategoryShareCard
          :option="categoryOption"
          :items="dashboard.categoryShare"
          :loading="dashboardLoading"
          @select="handleCategoryDrilldown"
        />
      </div>

      <div class="report-grid report-grid--bottom">
        <!-- 科目排行图：按金额倒序展示当前区间内消费 / 收入贡献最高的科目 -->
        <ReportSubjectRankCard :option="subjectRankOption" :loading="dashboardLoading" />

        <!-- 支付方式分布图：展示微信、支付宝、银行卡等支付渠道的金额分布 -->
        <ReportPaymentMethodCard :option="paymentMethodOption" :loading="dashboardLoading" />

        <!-- 多用户对比图：仅在存在多个用户数据时展示不同用户的收支对比 -->
        <ReportUserCompareCard v-if="showUserCompare" :option="userCompareOption" :loading="dashboardLoading" />

        <!-- 报表洞察面板：基于当前报表结果输出简要结论，帮助快速读数 -->
      </div>
    </div>
  </GiPageLayout>
</template>

<script setup lang="ts">
/**
 * Web 端报表中心主页面
 *
 * 页面职责：
 * 1. 管理报表筛选条件
 * 2. 拉取报表看板数据（图表 + 概览 + 洞察）
 * 3. 负责组件之间的筛选联动，例如分类占比点击后回填科目筛选
 *
 * 说明：
 * 底部“明细排行表”区域已按当前迭代要求临时隐藏，
 * 对应组件和接口仍然保留，后续需要恢复时可以直接接回。
 *
 * 你可以把这个页面理解为“报表模块总控台”：
 * 当前保留的子组件只负责展示，真正的数据请求、状态管理、交互串联都在这里完成。
 */
import { Message } from '@arco-design/web-vue'
import { computed, onMounted, ref, watch } from 'vue'
import { createEmptyReportDashboard } from './shared/reportConstants'
import { resolveReportPaymentMethodLabel } from './shared/reportFormat'
import { useReportFilters } from './shared/useReportFilters'
import { useReportOptions } from './shared/useReportOptions'
import ReportCategoryShareCard from './components/ReportCategoryShareCard.vue'
import ReportFilterBar from './components/ReportFilterBar.vue'
import ReportInsightPanel from './components/ReportInsightPanel.vue'
import ReportPaymentMethodCard from './components/ReportPaymentMethodCard.vue'
import ReportSubjectRankCard from './components/ReportSubjectRankCard.vue'
import ReportSummaryCards from './components/ReportSummaryCards.vue'
import ReportTrendChartCard from './components/ReportTrendChartCard.vue'
import ReportUserCompareCard from './components/ReportUserCompareCard.vue'
import type * as T from '@/apis/bookkeeping/type'
import { getReportDashboard } from '@/apis/bookkeeping/report'
import { usePrivacyStore } from '@/stores'

defineOptions({ name: 'BookkeepingReport' })

const privacyStore = usePrivacyStore()

/** 看板区域加载状态：控制汇总卡、图表、洞察等模块的 loading */
const dashboardLoading = ref(false)
/** 当前报表看板数据，所有图表和汇总卡都从这里取值 */
const dashboard = ref<T.ReportDashboardResp>(createEmptyReportDashboard())

/**
 * 共享筛选逻辑：
 * 这里集中维护筛选表单、下拉选项、分页状态、查询参数构造等逻辑，
 * 让 Web 端和移动端复用同一套报表筛选规则。
 */
const {
  isAdmin,
  filterForm: dashboardFilterForm,
  allSubjects: dashboardSubjects,
  userQueryOptions: dashboardUserQueryOptions,
  categoryOptions: dashboardCategoryOptions,
  paymentMethodOptions: dashboardPaymentMethodOptions,
  subjectOptions: dashboardSubjectOptions,
  loadFilterOptions: loadDashboardFilterOptions,
  resetFilters: resetDashboardFilters,
  setSelectedUser: setDashboardSelectedUser,
  buildDashboardQuery,
} = useReportFilters()

/**
 * 图表 option 计算逻辑：
 * 根据 dashboard 响应式数据，实时生成 ECharts 所需配置。
 * 页面本身不手写 option，交给共享 hooks 统一维护。
 */
const { trendOption, categoryOption, subjectRankOption, paymentMethodOption, userCompareOption } = useReportOptions(() => dashboard.value)

/** 是否展示“多用户对比”图表。只有多用户数据时才有展示意义 */
const showUserCompare = computed(() => dashboard.value.userCompare.length > 1)

/** 拉取上半部分看板数据：汇总卡、图表、洞察都依赖这个接口 */
const loadDashboard = async () => {
  dashboardLoading.value = true
  try {
    const { data } = await getReportDashboard(buildDashboardQuery())
    dashboard.value = data
      ? {
          ...data,
          paymentMethodShare: (data.paymentMethodShare ?? []).map((item) => ({
            ...item,
            label: resolveReportPaymentMethodLabel(item.key, item.label, dashboardPaymentMethodOptions.value),
          })),
        }
      : createEmptyReportDashboard()
  } catch {
    dashboard.value = createEmptyReportDashboard()
    Message.error('加载报表看板失败')
  } finally {
    dashboardLoading.value = false
  }
}

/** 点击“查询”按钮：按当前筛选条件重新加载整页报表数据。 */
const handleSearch = async () => {
  await loadDashboard()
}

/** 点击“重置”按钮：恢复默认筛选条件后重新加载报表。 */
const handleReset = async () => {
  resetDashboardFilters()
  await loadDashboard()
}

/**
 * 分类占比钻取：
 * 当用户点击“分类占比”列表项时，尝试找到对应科目，
 * 然后自动把该科目回填到筛选项里，再触发一次查询。
 */
const handleCategoryDrilldown = async (subjectName: string) => {
  const matchedSubject = dashboardSubjects.value.find((item) => item.name === subjectName && (!dashboardFilterForm.category || item.category === dashboardFilterForm.category))
  if (!matchedSubject) {
    return
  }
  dashboardFilterForm.subjectId = String(matchedSubject.id)
  await loadDashboard()
}

/**
 * 隐私模式切换或自动过期后，立即按最新口径刷新图表和汇总卡。
 *
 * 否则页面会继续展示上一次查询得到的隐藏数据统计结果。
 */
watch(
  () => privacyStore.isPrivacyMode,
  () => {
    void loadDashboard()
  },
)

/** 页面初始化：先加载筛选项，再拉取首屏报表数据 */
onMounted(async () => {
  await loadDashboardFilterOptions()
  await loadDashboard()
})
</script>

<style scoped lang="scss">
.report-page {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 4px;
}

.report-grid {
  display: grid;
  gap: 18px;
}

.report-grid--top {
  grid-template-columns: 1fr;
}

.report-grid--bottom {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

@media (max-width: 1440px) {
  .report-grid--top,
  .report-grid--bottom {
    grid-template-columns: 1fr;
  }
}
</style>
