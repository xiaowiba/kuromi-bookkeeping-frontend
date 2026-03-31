import { computed, reactive, ref, watch } from 'vue'
import { listSubject } from '@/apis/bookkeeping/subject'
import type * as T from '@/apis/bookkeeping/type'
import { useDict } from '@/hooks/app'
import { usePrivacyStore, useUserStore } from '@/stores'
import type { LabelValueState } from '@/types/global'
import { useDetailUserOptions } from '@/views/bookkeeping/shared/useDetailUserOptions'
import {
  createReportAllOption,
  createReportFilterForm,
  REPORT_DEFAULT_PAGE_SIZE,
  REPORT_DEFAULT_SORT,
} from './reportConstants'
import { buildReportQuery, getReportDateRangeByPreset } from './reportFormat'

const normalizeLabelValue = (item: LabelValueState): LabelValueState => ({
  label: item.label,
  value: String(item.value ?? ''),
  extra: item.extra,
})

export const useReportFilters = () => {
  const userStore = useUserStore()
  const privacyStore = usePrivacyStore()
  const { bk_subject_category, bk_payment_method } = useDict('bk_subject_category', 'bk_payment_method')
  const { isAdmin, userOptions, loadUserOptions } = useDetailUserOptions()

  const currentUserId = computed(() => String(userStore.userInfo.id ?? ''))
  const currentUserLabel = computed(() => userStore.userInfo.nickname || userStore.userInfo.username || '当前用户')
  const createDefaultFilterForm = () => createReportFilterForm(currentUserId.value, isAdmin.value ? 'all' : 'current')
  const filterForm = reactive<T.ReportFilterForm>(createDefaultFilterForm())
  const rankingPage = reactive({
    page: 1,
    size: REPORT_DEFAULT_PAGE_SIZE,
    sort: [...REPORT_DEFAULT_SORT],
  })
  const allSubjects = ref<T.SubjectResp[]>([])

  const currentUserOption = computed<LabelValueState>(() => ({
    label: currentUserLabel.value,
    value: currentUserId.value,
  }))

  const userSelectOptions = computed<LabelValueState[]>(() => {
    const uniqueMap = new Map<string, LabelValueState>()
    ;[currentUserOption.value, ...(userOptions.value ?? []).map(normalizeLabelValue)].forEach((item) => {
      if (!item.value) {
        return
      }
      uniqueMap.set(String(item.value), item)
    })
    return Array.from(uniqueMap.values())
  })

  const userQueryOptions = computed<LabelValueState[]>(() => [
    createReportAllOption('全部'),
    ...userSelectOptions.value,
  ])

  const categoryOptions = computed<LabelValueState[]>(() => [
    createReportAllOption(),
    ...((bk_subject_category.value ?? []).map(normalizeLabelValue)),
  ])

  const paymentMethodOptions = computed<LabelValueState[]>(() => [
    createReportAllOption(),
    ...((bk_payment_method.value ?? []).map(normalizeLabelValue)),
  ])

  const subjectOptions = computed<LabelValueState[]>(() => {
    const matchedSubjects = filterForm.category
      ? allSubjects.value.filter(item => item.category === filterForm.category)
      : allSubjects.value

    return [
      createReportAllOption('全部科目'),
      ...matchedSubjects.map(item => ({ label: item.name, value: item.id })),
    ]
  })

  const hasMultipleUsers = computed(() => userSelectOptions.value.length > 1)

  const syncDateRange = (preset: T.ReportDatePreset) => {
    if (preset !== 'custom') {
      filterForm.dateRange = getReportDateRangeByPreset(preset)
      return
    }

    if (filterForm.dateRange.length !== 2) {
      filterForm.dateRange = getReportDateRangeByPreset('custom')
    }
  }

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

  const ensureAdminDefaultScope = () => {
    if (!isAdmin.value) {
      return
    }
    if (filterForm.userScope === 'current' && filterForm.userId === currentUserId.value) {
      filterForm.userScope = 'all'
    }
  }

  const loadSubjectOptions = async () => {
    try {
      const { data } = await listSubject({ sort: ['sort,asc', 'id,desc'], page: 1, size: 1000 } as any)
      allSubjects.value = data.list ?? []
    } catch {
      allSubjects.value = []
    }
  }

  const loadFilterOptions = async () => {
    await Promise.allSettled([loadUserOptions(), loadSubjectOptions()])
    ensureAdminDefaultScope()
    syncUserScope()
  }

  const resetFilters = () => {
    Object.assign(filterForm, createDefaultFilterForm())
    syncDateRange(filterForm.datePreset)
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
      syncDateRange(preset)
    },
    { immediate: true },
  )

  watch(
    () => filterForm.category,
    () => {
      const matchedSubjects = filterForm.category
        ? allSubjects.value.filter(item => item.category === filterForm.category)
        : allSubjects.value
      const exists = matchedSubjects.some(item => String(item.id) === filterForm.subjectId)
      if (!exists) {
        filterForm.subjectId = ''
      }
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
    subjectOptions,
    hasMultipleUsers,
    loadFilterOptions,
    resetFilters,
    resetRankingPage,
    setSelectedUser,
    buildDashboardQuery,
    buildRankingQuery,
  }
}
