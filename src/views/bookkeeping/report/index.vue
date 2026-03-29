<template>
  <GiPageLayout :body-style="{ overflowY: 'auto', overflowX: 'hidden' }">
    <div class="report-page">
      <!--
        报表筛选栏：
        负责统一承接时间范围、分类、科目、支付方式、用户范围等查询条件，
        并向当前页面抛出 查询 / 重置 / 预设时间切换 事件。
      -->
      <ReportFilterBar
        :filter-form="dashboardFilterForm"
        :date-preset-options="datePresetOptions"
        :category-options="dashboardCategoryOptions"
        :subject-options="dashboardSubjectOptions"
        :payment-method-options="dashboardPaymentMethodOptions"
        :user-scope-options="userScopeOptions"
        :user-select-options="dashboardUserOptions"
        :loading="dashboardLoading"
        @search="handleSearch"
        @reset="handleReset"
        @preset-change="handlePresetChange"
      />

      <!-- 报表顶部汇总卡：展示总支出、总收入、结余、记录数等核心概览指标 -->
      <ReportSummaryCards :overview="dashboard.overview" :loading="dashboardLoading" />

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
        <ReportInsightPanel :insight="dashboard.insight" :overview="dashboard.overview" :loading="dashboardLoading" />
      </div>

      <!-- 排行明细表格：展示组成报表结果的原始明细排行，支持分页和排序 -->
      <div class="report-ranking-section">
        <ReportFilterBar
          :filter-form="rankingFilterForm"
          :date-preset-options="datePresetOptions"
          :category-options="rankingCategoryOptions"
          :subject-options="rankingSubjectOptions"
          :payment-method-options="rankingPaymentMethodOptions"
          :user-scope-options="userScopeOptions"
          :user-select-options="rankingUserOptions"
          :loading="tableLoading"
          @search="handleRankingSearch"
          @reset="handleRankingReset"
          @preset-change="handleRankingPresetChange"
        />

        <ReportRankingTable
          :list="rankingList"
          :total="rankingTotal"
          :page="rankingPage.page"
          :page-size="rankingPage.size"
          :sort-value="rankingSort"
          :loading="tableLoading"
          @page-change="handlePageChange"
          @page-size-change="handlePageSizeChange"
          @sort-change="handleSortChange"
          @refresh="handleRankingRefresh"
        />
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
 * 3. 拉取排行表格数据
 * 4. 负责组件之间的筛选联动，例如分类占比点击后回填科目筛选
 *
 * 你可以把这个页面理解为“报表模块总控台”：
 * 子组件只负责展示，真正的数据请求、状态管理、交互串联都在这里完成。
 */
import { Message } from '@arco-design/web-vue'
import { computed, onMounted, ref } from 'vue'
import { getReportDashboard, listReportRankingTable } from '@/apis/bookkeeping/report'
import type * as T from '@/apis/bookkeeping/type'
import {
  REPORT_DATE_PRESET_OPTIONS,
  REPORT_USER_SCOPE_OPTIONS,
  createEmptyReportDashboard,
} from './shared/reportConstants'
import { resolveReportPaymentMethodLabel } from './shared/reportFormat'
import { useReportFilters } from './shared/useReportFilters'
import { useReportOptions } from './shared/useReportOptions'
import ReportCategoryShareCard from './components/ReportCategoryShareCard.vue'
import ReportFilterBar from './components/ReportFilterBar.vue'
import ReportInsightPanel from './components/ReportInsightPanel.vue'
import ReportPaymentMethodCard from './components/ReportPaymentMethodCard.vue'
import ReportRankingTable from './components/ReportRankingTable.vue'
import ReportSubjectRankCard from './components/ReportSubjectRankCard.vue'
import ReportSummaryCards from './components/ReportSummaryCards.vue'
import ReportTrendChartCard from './components/ReportTrendChartCard.vue'
import ReportUserCompareCard from './components/ReportUserCompareCard.vue'

defineOptions({ name: 'BookkeepingReport' })

/**
 * 表格排序映射：
 * UI 上选择的排序值，会在这里转换成后端分页接口需要的 sort 数组。
 */
const rankingSortMap: Record<string, string[]> = {
  'amount-desc': ['amount,desc', 'detailDate,desc', 'detailId,desc'],
  'amount-asc': ['amount,asc', 'detailDate,desc', 'detailId,desc'],
  'date-desc': ['detailDate,desc', 'detailId,desc'],
  'date-asc': ['detailDate,asc', 'detailId,asc'],
}

/** 看板区域加载状态：控制汇总卡、图表、洞察等模块的 loading */
const dashboardLoading = ref(false)
/** 表格区域加载状态：单独控制底部排行表格的 loading */
const tableLoading = ref(false)
/** 当前报表看板数据，所有图表和汇总卡都从这里取值 */
const dashboard = ref<T.ReportDashboardResp>(createEmptyReportDashboard())
/** 排行表格当前页数据 */
const rankingList = ref<T.ReportRankingTableResp[]>([])
/** 排行表格总条数 */
const rankingTotal = ref(0)
/** 当前表格排序值，和 rankingSortMap 配合使用 */
const rankingSort = ref('amount-desc')

/**
 * 共享筛选逻辑：
 * 这里集中维护筛选表单、下拉选项、分页状态、查询参数构造等逻辑，
 * 让 Web 端和移动端复用同一套报表筛选规则。
 */
const {
  filterForm: dashboardFilterForm,
  allSubjects: dashboardSubjects,
  userSelectOptions: dashboardUserOptions,
  categoryOptions: dashboardCategoryOptions,
  paymentMethodOptions: dashboardPaymentMethodOptions,
  subjectOptions: dashboardSubjectOptions,
  loadFilterOptions: loadDashboardFilterOptions,
  resetFilters: resetDashboardFilters,
  buildDashboardQuery,
} = useReportFilters()

const {
  filterForm: rankingFilterForm,
  rankingPage,
  userSelectOptions: rankingUserOptions,
  categoryOptions: rankingCategoryOptions,
  paymentMethodOptions: rankingPaymentMethodOptions,
  subjectOptions: rankingSubjectOptions,
  loadFilterOptions: loadRankingFilterOptions,
  resetFilters: resetRankingFilters,
  resetRankingPage: resetRankingTablePage,
  buildRankingQuery,
} = useReportFilters()

/**
 * 图表 option 计算逻辑：
 * 根据 dashboard 响应式数据，实时生成 ECharts 所需配置。
 * 页面本身不手写 option，交给共享 hooks 统一维护。
 */
const { trendOption, categoryOption, subjectRankOption, paymentMethodOption, userCompareOption } = useReportOptions(() => dashboard.value)

/** 时间预设按钮选项，例如本月、上月、近 3 个月等 */
const datePresetOptions = REPORT_DATE_PRESET_OPTIONS
/** 用户范围选项，例如当前用户、全部用户、指定用户 */
const userScopeOptions = REPORT_USER_SCOPE_OPTIONS

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
          paymentMethodShare: (data.paymentMethodShare ?? []).map(item => ({
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

/** 拉取底部排行表格数据 */
const loadRankingTable = async () => {
  tableLoading.value = true
  try {
    const { data } = await listReportRankingTable(buildRankingQuery())
    rankingList.value = data.list ?? []
    rankingTotal.value = data.total ?? 0
  } catch {
    rankingList.value = []
    rankingTotal.value = 0
    Message.error('加载报表表格失败')
  } finally {
    tableLoading.value = false
  }
}

/** 点击“查询”按钮：重置表格页码后重新加载全部数据 */
const handleSearch = async () => {
  await loadDashboard()
}

/** 点击“重置”按钮：恢复默认筛选条件和默认排序 */
const handleReset = async () => {
  resetDashboardFilters()
  await loadDashboard()
}

/** 点击时间预设按钮：切换预设后重置页码并刷新全部数据 */
const handlePresetChange = async () => {
  await loadDashboard()
}

/** 明细排行查询：重置页码后只刷新表格 */
const handleRankingSearch = async () => {
  resetRankingTablePage()
  await loadRankingTable()
}

/** 明细排行重置：恢复独立筛选条件、排序和页码 */
const handleRankingReset = async () => {
  resetRankingFilters()
  rankingSort.value = 'amount-desc'
  await loadRankingTable()
}

/** 明细排行时间预设切换：仅刷新表格 */
const handleRankingPresetChange = async () => {
  resetRankingTablePage()
  await loadRankingTable()
}

/** 明细排行手动刷新：保持当前筛选、排序和分页，仅重新请求表格 */
const handleRankingRefresh = async () => {
  await loadRankingTable()
}

/** 表格翻页：仅刷新表格，不重复请求上方看板 */
const handlePageChange = async (page: number) => {
  rankingPage.page = page
  await loadRankingTable()
}

/** 表格每页条数切换：切换后回到第一页，避免当前页越界 */
const handlePageSizeChange = async (size: number) => {
  rankingPage.size = size
  rankingPage.page = 1
  await loadRankingTable()
}

/** 表格排序切换：同步更新后端 sort 参数，并重置到第一页 */
const handleSortChange = async (value: string) => {
  rankingSort.value = value
  rankingPage.sort = [...(rankingSortMap[value] ?? rankingSortMap['amount-desc'])]
  rankingPage.page = 1
  await loadRankingTable()
}

/**
 * 分类占比钻取：
 * 当用户点击“分类占比”列表项时，尝试找到对应科目，
 * 然后自动把该科目回填到筛选项里，再触发一次查询。
 */
const handleCategoryDrilldown = async (subjectName: string) => {
  const matchedSubject = dashboardSubjects.value.find(item => item.name === subjectName && (!dashboardFilterForm.category || item.category === dashboardFilterForm.category))
  if (!matchedSubject) {
    return
  }
  dashboardFilterForm.subjectId = String(matchedSubject.id)
  await loadDashboard()
}

/** 页面初始化：先加载筛选项，再拉取首屏报表数据 */
onMounted(async () => {
  await Promise.all([loadDashboardFilterOptions(), loadRankingFilterOptions()])
  await Promise.all([loadDashboard(), loadRankingTable()])
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

.report-ranking-section {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

@media (max-width: 1440px) {
  .report-grid--top,
  .report-grid--bottom {
    grid-template-columns: 1fr;
  }
}
</style>
