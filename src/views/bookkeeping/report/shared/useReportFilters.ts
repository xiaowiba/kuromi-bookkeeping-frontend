import { computed, reactive, watch } from 'vue'
import {
  REPORT_DEFAULT_PAGE_SIZE,
  REPORT_DEFAULT_SORT,
  createReportFilterForm,
} from './reportConstants'
import { buildReportQuery, getReportDateRangeByPreset } from './reportFormat'
import type * as T from '@/apis/bookkeeping/type'
import type { LabelValueState } from '@/types/global'
import { usePrivacyStore, useUserStore } from '@/stores'
import { useBookkeepingCommonFilters } from '@/views/bookkeeping/shared/useBookkeepingCommonFilters'

/**
 * 报表筛选状态共享逻辑。
 *
 * 说明：
 * 1. Web 端报表中心会复用明细管理的筛选展示形式
 * 2. 移动端仍沿用既有 userScope / datePreset 交互，不在当前迭代内改造
 * 3. 因此这里同时维护“统一查询口径字段”和“移动端历史交互字段”
 */
export const useReportFilters = () => {
  const userStore = useUserStore()
  const privacyStore = usePrivacyStore()

  const isAdmin = computed(() => userStore.roles.includes('super_admin'))
  const currentUserId = computed(() => String(userStore.userInfo.id ?? ''))
  const createDefaultFilterForm = () => createReportFilterForm(currentUserId.value, isAdmin.value ? 'all' : 'current')
  const filterForm = reactive<T.ReportFilterForm>(createDefaultFilterForm())
  const rankingPage = reactive({
    page: 1,
    size: REPORT_DEFAULT_PAGE_SIZE,
    sort: [...REPORT_DEFAULT_SORT],
  })

  const {
    allSubjects,
    userQueryOptions,
    categoryQueryOptions: categoryOptions,
    paymentMethodQueryOptions: paymentMethodOptions,
    paymentAccountQueryOptions: paymentAccountOptions,
    isNecessaryQueryOptions: isNecessaryOptions,
    subjectQueryOptions: subjectOptions,
    tagQueryOptions,
    loadCommonFilterOptions,
  } = useBookkeepingCommonFilters({
    form: filterForm,
    labels: {
      userAll: '全部',
      categoryAll: '全部',
      subjectAll: '全部',
      paymentAll: '全部',
      paymentAccountAll: '全部',
    },
  })

  /** 仅保留真实用户选项，移动端“指定用户”模式会使用这一份数据。 */
  const userSelectOptions = computed<LabelValueState[]>(() => {
    return userQueryOptions.value.filter((item) => String(item.value ?? '') !== '')
  })

  /** 按预设同步查询起止时间，兼容移动端仍以 preset 驱动的旧交互。 */
  const syncDateRangeByPreset = (preset: T.ReportDatePreset) => {
    const [startDate, endDate] = getReportDateRangeByPreset(preset)
    filterForm.dateRange = [startDate, endDate]
    filterForm.startDate = startDate
    filterForm.endDate = endDate
  }

  /** 按用户范围回填真实 userId，保证查询参数始终可直接提交。 */
  const syncUserScope = () => {
    if (filterForm.userScope === 'all') {
      filterForm.userId = ''
      return
    }

    if (filterForm.userScope === 'current') {
      filterForm.userId = currentUserId.value
      return
    }

    if (filterForm.userId) {
      return
    }
    filterForm.userId = String(userSelectOptions.value[0]?.value ?? currentUserId.value)
  }

  /** Web 端单选查询直接走这个入口，同步 userScope 供移动端继续复用。 */
  const setSelectedUser = (value?: string | number | null) => {
    const normalizedValue = String(value ?? '')
    if (!normalizedValue) {
      filterForm.userScope = 'all'
      filterForm.userId = ''
      return
    }

    filterForm.userId = normalizedValue
    filterForm.userScope = normalizedValue === currentUserId.value ? 'current' : 'specific'
  }

  /** 超管默认放开到“全部用户”，避免首次进入报表时只看自己。 */
  const ensureAdminDefaultScope = () => {
    if (!isAdmin.value) {
      return
    }
    if (filterForm.userScope === 'current' && filterForm.userId === currentUserId.value) {
      filterForm.userScope = 'all'
    }
  }

  const loadFilterOptions = async () => {
    await loadCommonFilterOptions()
    ensureAdminDefaultScope()
    syncUserScope()
  }

  const resetFilters = () => {
    Object.assign(filterForm, createDefaultFilterForm())
    syncDateRangeByPreset(filterForm.datePreset)
    syncUserScope()
    Object.assign(rankingPage, { page: 1, size: REPORT_DEFAULT_PAGE_SIZE, sort: [...REPORT_DEFAULT_SORT] })
  }

  const resetRankingPage = () => {
    rankingPage.page = 1
  }

  const buildDashboardQuery = () => {
    return buildReportQuery(filterForm, privacyStore.isPrivacyMode)
  }

  const buildRankingQuery = () => {
    return {
      ...buildDashboardQuery(),
      page: rankingPage.page,
      size: rankingPage.size,
      sort: rankingPage.sort,
    }
  }

  watch(
    () => filterForm.datePreset,
    (preset) => {
      if (filterForm.timeMode !== 'preset' && preset !== 'custom') {
        return
      }
      if (preset !== 'custom') {
        filterForm.timeMode = 'preset'
      }
      syncDateRangeByPreset(preset)
    },
    { immediate: true },
  )

  /** 移动端自定义时间弹窗仍然直接维护 dateRange，这里同步到统一查询字段。 */
  watch(
    () => [...filterForm.dateRange],
    (range) => {
      if (filterForm.datePreset !== 'custom') {
        return
      }
      if (range.length !== 2 || !range[0] || !range[1]) {
        return
      }
      filterForm.startDate = range[0]
      filterForm.endDate = range[1]
    },
  )

  watch(currentUserId, (value) => {
    if (filterForm.userScope === 'current') {
      filterForm.userId = value
    }
  })

  watch(
    () => filterForm.userScope,
    () => {
      syncUserScope()
    },
    { immediate: true },
  )

  watch(userSelectOptions, () => {
    syncUserScope()
  })

  watch(isAdmin, () => {
    ensureAdminDefaultScope()
  })

  return {
    isAdmin,
    filterForm,
    rankingPage,
    allSubjects,
    userQueryOptions,
    userSelectOptions,
    categoryOptions,
    paymentMethodOptions,
    paymentAccountOptions,
    isNecessaryOptions,
    subjectOptions,
    tagQueryOptions,
    loadFilterOptions,
    resetFilters,
    resetRankingPage,
    setSelectedUser,
    buildDashboardQuery,
    buildRankingQuery,
  }
}
