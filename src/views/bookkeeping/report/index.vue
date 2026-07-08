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
        :privacy-mode="privacyStore.isPrivacyMode"
        :privacy-remaining-text="privacyStore.remainingDurationText"
        :category-options="dashboardCategoryOptions"
        :subject-options="dashboardSubjectOptions"
        :tag-options="dashboardTagOptions"
        :payment-method-options="dashboardPaymentMethodOptions"
        :payment-account-options="dashboardPaymentAccountOptions"
        :is-necessary-options="dashboardIsNecessaryOptions"
        :user-query-options="dashboardUserQueryOptions"
        :on-select-user="setDashboardSelectedUser"
        :loading="dashboardLoading"
        @search="handleSearch"
        @reset="handleReset"
        @exit-privacy="onExitPrivacy"
      />

      <!-- 报表顶部汇总卡：展示总支出、总收入、结余、记录数等核心概览指标 -->
      <ReportSummaryCards :overview="dashboard.overview" :loading="dashboardLoading" />
      <ReportReimbursementRoleCard
        :summary="dashboard.reimbursementRoleSummary"
        :all-user-scope="dashboardFilterForm.userScope === 'all'"
        :loading="dashboardLoading"
        @drilldown="handleReimbursementRoleDrilldown"
      />
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

      <!-- 科目钻取：点击科目排行中的某个科目后，展示该科目下的标签排行 -->
      <div v-if="drilldownSubjectId" class="report-drilldown">
        <ReportPanelShell
          :title="`${drilldownSubjectName} - 标签排行`"
          :description="`点击科目排行中的「${drilldownSubjectName}」后展示其下属标签的金额排行`"
          :loading="drilldownLoading"
        >
          <template #toolbar>
            <div class="report-drilldown__toolbar">
              <a-breadcrumb>
                <a-breadcrumb-item @click="clearDrilldown">全部科目</a-breadcrumb-item>
                <a-breadcrumb-item>{{ drilldownSubjectName }}</a-breadcrumb-item>
              </a-breadcrumb>
              <a-button size="mini" type="text" @click="clearDrilldown">关闭</a-button>
            </div>
          </template>
          <div class="report-drilldown__body">
            <Chart :option="drilldownTagRankOption" :update-options="{ notMerge: true }" :height="drilldownChartHeight" @click="handleDrilldownTagRankClick" />
          </div>
        </ReportPanelShell>
      </div>

      <div class="report-grid report-grid--bottom">
        <!-- 科目排行图：按金额倒序展示当前区间内消费 / 收入贡献最高的科目 -->
        <ReportSubjectRankCard
          :list="dashboard.subjectRank"
          :selected-category="dashboardFilterForm.category"
          :loading="dashboardLoading"
          :colors="REPORT_COLORS_TECH_BLUE"
          @select-subject="handleSubjectDrilldown"
        />

        <ReportTagRankCard v-if="showTagRank" :option="tagRankOption" :loading="dashboardLoading" @select-tag="handleTagRankSelect" />

        <!-- 支付方式分布图：展示微信、支付宝、银行卡等支付渠道的金额分布 -->
        <ReportPaymentMethodCard :list="dashboard.paymentMethodShare" :loading="dashboardLoading" :colors="REPORT_COLORS_TECH_BLUE" />

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
 *
 * @author Wangsongsong
 * @date 2026-07-02
 * @update 2026-07-08 @Wangsongsong
 * @desc 增加报销角色汇总卡片和明细钻取入口，展示垫付、被报销和报销他人数据
 */
import { Message } from '@arco-design/web-vue'
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { createEmptyReportDashboard } from './shared/reportConstants'
import { resolveReportPaymentMethodLabel } from './shared/reportFormat'
import { useReportFilters } from './shared/useReportFilters'
import { useReportOptions, REPORT_COLORS_TECH_BLUE, buildTagRankOption } from './shared/useReportOptions'
import type { ReportTagRankChartDataItem } from './shared/useReportOptions'
import ReportCategoryShareCard from './components/ReportCategoryShareCard.vue'
import ReportFilterBar from './components/ReportFilterBar.vue'
import ReportInsightPanel from './components/ReportInsightPanel.vue'
import ReportPaymentMethodCard from './components/ReportPaymentMethodCard.vue'
import ReportReimbursementRoleCard from './components/ReportReimbursementRoleCard.vue'
import ReportSubjectRankCard from './components/ReportSubjectRankCard.vue'
import ReportSummaryCards from './components/ReportSummaryCards.vue'
import ReportTagRankCard from './components/ReportTagRankCard.vue'
import ReportTrendChartCard from './components/ReportTrendChartCard.vue'
import ReportUserCompareCard from './components/ReportUserCompareCard.vue'
import ReportPanelShell from './components/ReportPanelShell.vue'
import Chart from '@/components/Chart/index.vue'
import type * as T from '@/apis/bookkeeping/type'
import { getReportDashboard, getReportTagRankBySubject } from '@/apis/bookkeeping/report'
import { usePrivacyStore } from '@/stores'

defineOptions({ name: 'BookkeepingReport' })

const DETAIL_ROUTE_PATH = '/bookkeeping/detail'
const DETAIL_ROUTE_SOURCE_REPORT_TAG_RANK = 'reportTagRank'
const DETAIL_ROUTE_SOURCE_REPORT_REIMBURSEMENT_ROLE = 'reportReimbursementRole'
const DETAIL_TAG_MODE_EXACT = 'exact'
const DETAIL_TAG_MODE_UNSELECTED = 'unselected'

type ReportReimbursementRoleDrilldownType = 'advance' | 'reimburseOther'

const router = useRouter()
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
  userQueryOptions: dashboardUserQueryOptions,
  categoryOptions: dashboardCategoryOptions,
  paymentMethodOptions: dashboardPaymentMethodOptions,
  paymentAccountOptions: dashboardPaymentAccountOptions,
  isNecessaryOptions: dashboardIsNecessaryOptions,
  subjectOptions: dashboardSubjectOptions,
  tagQueryOptions: dashboardTagOptions,
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
const { trendOption, categoryOption, tagRankOption, userCompareOption } = useReportOptions(
  () => dashboard.value,
  () => ({ colors: REPORT_COLORS_TECH_BLUE }),
)

/** 是否展示“多用户对比”图表。只有多用户数据时才有展示意义 */
const showUserCompare = computed(() => dashboard.value.userCompare.length > 1)
/** 只有当查询已经收敛到科目或标签时，才展示标签分析模块。 */
const showTagRank = computed(() => !!dashboardFilterForm.subjectId || !!dashboardFilterForm.tagId)

/** 科目钻取状态 */
const drilldownSubjectId = ref('')
const drilldownSubjectName = ref('')
const drilldownLoading = ref(false)
const drilldownTagRankList = ref<T.ReportTagRankItemResp[]>([])

const drilldownTagRankOption = computed(() => buildTagRankOption(drilldownTagRankList.value, { colors: REPORT_COLORS_TECH_BLUE, rankLimit: false }))

const drilldownChartHeight = computed(() => {
  const yAxis = Array.isArray(drilldownTagRankOption.value?.yAxis) ? drilldownTagRankOption.value.yAxis[0] : drilldownTagRankOption.value?.yAxis
  const categoryCount = Array.isArray((yAxis as any)?.data) ? (yAxis as any).data.length : 0
  return `${Math.max(280, 72 + categoryCount * 34)}px`
})

const clearDrilldown = () => {
  drilldownSubjectId.value = ''
  drilldownSubjectName.value = ''
  drilldownTagRankList.value = []
}

const normalizeTagRankSelection = (
  payload: Partial<ReportTagRankChartDataItem> | undefined,
): T.ReportTagRankItemResp | null => {
  if (!payload?.tagName || !payload?.subjectId || !payload?.subjectName) {
    return null
  }

  return {
    tagId: payload.tagId == null ? undefined : String(payload.tagId),
    tagName: payload.tagName,
    subjectId: String(payload.subjectId),
    subjectName: payload.subjectName,
    amount: Number(payload.amount ?? payload.value ?? 0),
    ratio: Number(payload.ratio ?? 0),
    count: Number(payload.count ?? 0),
  }
}

const buildDetailRouteQueryFromTagRank = (payload: T.ReportTagRankItemResp) => {
  const dashboardQuery = buildDashboardQuery()
  const routeQuery: Record<string, string> = {
    from: DETAIL_ROUTE_SOURCE_REPORT_TAG_RANK,
    timeMode: dashboardFilterForm.timeMode,
    startDate: dashboardFilterForm.startDate,
    endDate: dashboardFilterForm.endDate,
    subjectId: String(payload.subjectId),
    subjectName: payload.subjectName,
    tagName: payload.tagName,
    tagMode: payload.tagId ? DETAIL_TAG_MODE_EXACT : DETAIL_TAG_MODE_UNSELECTED,
  }

  if (dashboardFilterForm.timeMode === 'preset' && dashboardFilterForm.datePreset && dashboardFilterForm.datePreset !== 'custom') {
    routeQuery.datePreset = dashboardFilterForm.datePreset
  }
  if (dashboardQuery.userId) {
    routeQuery.userId = String(dashboardQuery.userId)
  }
  if (dashboardQuery.category) {
    routeQuery.category = dashboardQuery.category
  }
  if (dashboardQuery.paymentMethod) {
    routeQuery.paymentMethod = dashboardQuery.paymentMethod
  }
  if (dashboardQuery.paymentAccountId) {
    routeQuery.paymentAccountId = String(dashboardQuery.paymentAccountId)
  }
  if (dashboardQuery.isNecessary !== '' && dashboardQuery.isNecessary !== null && dashboardQuery.isNecessary !== undefined) {
    routeQuery.isNecessary = String(dashboardQuery.isNecessary)
  }
  if (dashboardQuery.isReimburseOther !== '' && dashboardQuery.isReimburseOther !== null && dashboardQuery.isReimburseOther !== undefined) {
    routeQuery.isReimburseOther = String(dashboardQuery.isReimburseOther)
  }
  if (dashboardQuery.isAdvance !== '' && dashboardQuery.isAdvance !== null && dashboardQuery.isAdvance !== undefined) {
    routeQuery.isAdvance = String(dashboardQuery.isAdvance)
  }
  if (dashboardQuery.hidden !== '' && dashboardQuery.hidden !== null && dashboardQuery.hidden !== undefined) {
    routeQuery.hidden = String(dashboardQuery.hidden)
  }
  if (payload.tagId) {
    routeQuery.tagId = String(payload.tagId)
  }

  return routeQuery
}

const appendDashboardRouteQuery = (
  routeQuery: Record<string, string>,
  overrides: Partial<Record<'isAdvance' | 'isReimburseOther', string>>,
) => {
  const dashboardQuery = buildDashboardQuery()

  if (dashboardQuery.userId) {
    routeQuery.userId = String(dashboardQuery.userId)
  }
  if (dashboardQuery.category) {
    routeQuery.category = dashboardQuery.category
  }
  if (dashboardQuery.subjectId) {
    routeQuery.subjectId = String(dashboardQuery.subjectId)
  }
  if (dashboardQuery.tagId) {
    routeQuery.tagId = String(dashboardQuery.tagId)
    routeQuery.tagMode = DETAIL_TAG_MODE_EXACT
  }
  if (dashboardQuery.paymentMethod) {
    routeQuery.paymentMethod = dashboardQuery.paymentMethod
  }
  if (dashboardQuery.paymentAccountId) {
    routeQuery.paymentAccountId = String(dashboardQuery.paymentAccountId)
  }
  if (dashboardQuery.isNecessary !== '' && dashboardQuery.isNecessary !== null && dashboardQuery.isNecessary !== undefined) {
    routeQuery.isNecessary = String(dashboardQuery.isNecessary)
  }
  if (dashboardQuery.hidden !== '' && dashboardQuery.hidden !== null && dashboardQuery.hidden !== undefined) {
    routeQuery.hidden = String(dashboardQuery.hidden)
  }
  if (overrides.isAdvance !== undefined) {
    routeQuery.isAdvance = overrides.isAdvance
  }
  if (overrides.isReimburseOther !== undefined) {
    routeQuery.isReimburseOther = overrides.isReimburseOther
  }
}

const buildDetailRouteQueryFromReimbursementRole = (type: ReportReimbursementRoleDrilldownType) => {
  const routeQuery: Record<string, string> = {
    from: DETAIL_ROUTE_SOURCE_REPORT_REIMBURSEMENT_ROLE,
    timeMode: dashboardFilterForm.timeMode,
    startDate: dashboardFilterForm.startDate,
    endDate: dashboardFilterForm.endDate,
  }

  if (dashboardFilterForm.timeMode === 'preset' && dashboardFilterForm.datePreset && dashboardFilterForm.datePreset !== 'custom') {
    routeQuery.datePreset = dashboardFilterForm.datePreset
  }

  appendDashboardRouteQuery(
    routeQuery,
    type === 'advance'
      ? { isAdvance: '1' }
      : { isReimburseOther: '1' },
  )
  return routeQuery
}

const openDetailPageByTagRank = (payload: T.ReportTagRankItemResp) => {
  const resolvedRoute = router.resolve({
    path: DETAIL_ROUTE_PATH,
    query: buildDetailRouteQueryFromTagRank(payload),
  })
  window.open(resolvedRoute.href, '_blank')
}

const openDetailPageByReimbursementRole = (type: ReportReimbursementRoleDrilldownType) => {
  const resolvedRoute = router.resolve({
    path: DETAIL_ROUTE_PATH,
    query: buildDetailRouteQueryFromReimbursementRole(type),
  })
  window.open(resolvedRoute.href, '_blank')
}

const handleTagRankSelect = (payload: T.ReportTagRankItemResp) => {
  openDetailPageByTagRank(payload)
}

const handleReimbursementRoleDrilldown = (type: ReportReimbursementRoleDrilldownType) => {
  openDetailPageByReimbursementRole(type)
}

const handleDrilldownTagRankClick = (params: any) => {
  const payload = normalizeTagRankSelection(params?.data as Partial<ReportTagRankChartDataItem> | undefined)
  if (payload) {
    handleTagRankSelect(payload)
  }
}

/**
 * 科目排行钻取：点击某科目后加载该科目下的标签排行。
 * 再次点击同一科目时收起，点击不同科目时切换。
 *
 * @author Wangsongsong
 * @date 2026-04-17
 */
const handleSubjectDrilldown = async (subjectId: string, subjectName: string) => {
  if (drilldownSubjectId.value === subjectId) {
    clearDrilldown()
    return
  }

  drilldownSubjectId.value = subjectId
  drilldownSubjectName.value = subjectName
  drilldownLoading.value = true
  try {
    const query = { ...buildDashboardQuery(), subjectId }
    const { data } = await getReportTagRankBySubject(query)
    drilldownTagRankList.value = data ?? []
  } catch {
    drilldownTagRankList.value = []
    Message.error('加载标签排行失败')
  } finally {
    drilldownLoading.value = false
  }
}

/** 拉取上半部分看板数据：汇总卡、图表、洞察都依赖这个接口 */
const loadDashboard = async () => {
  dashboardLoading.value = true
  try {
    const { data } = await getReportDashboard(buildDashboardQuery())
    const emptyDashboard = createEmptyReportDashboard()
    dashboard.value = data
      ? {
          ...emptyDashboard,
          ...data,
          reimbursementRoleSummary: data.reimbursementRoleSummary ?? emptyDashboard.reimbursementRoleSummary,
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
  clearDrilldown()
  await loadDashboard()
}

/** 点击“重置”按钮：恢复默认筛选条件后重新加载报表。 */
const handleReset = async () => {
  clearDrilldown()
  resetDashboardFilters()
  await loadDashboard()
}

/** 退出隐私模式后，会由监听器自动按最新口径重刷整页报表。 */
const onExitPrivacy = () => {
  privacyStore.exitPrivacyMode()
  Message.success('已退出隐私模式')
}

/**
 * 分类占比钻取：
 * 当用户点击“分类占比”列表项时，尝试找到对应科目，
 * 然后自动把该科目回填到筛选项里，再触发一次查询。
 */
const handleCategoryDrilldown = async (categoryKey: string) => {
  if (!categoryKey) {
    return
  }
  dashboardFilterForm.category = categoryKey
  dashboardFilterForm.subjectId = ''
  dashboardFilterForm.tagId = ''
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

.report-drilldown {
  margin-top: 0;
}

.report-drilldown__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 28px;
}

.report-drilldown__toolbar :deep(.arco-breadcrumb-item:first-child) {
  cursor: pointer;
  color: rgb(var(--primary-6));
}

.report-drilldown__body {
  width: 100%;
  min-width: 0;
  padding-top: 2px;
}
</style>
