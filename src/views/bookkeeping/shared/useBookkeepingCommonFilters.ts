/**
 * 记账通用筛选项共享逻辑
 *
 * 复用范围：
 * 1. 明细管理列表页
 * 2. 日历报表页
 *
 * 共享内容：
 * 1. 所属用户选项
 * 2. 分类选项
 * 3. 科目选项
 * 4. 支付方式选项
 * 5. 分类切换后的科目联动校验
 *
 * 页面差异项（例如时间范围、排序方式、日历视图、统计周期）仍由各页面自行维护。
 */
import { computed, ref, watch } from 'vue'
import { useDetailUserOptions } from './useDetailUserOptions'
import { listSubject } from '@/apis/bookkeeping/subject'
import { listSubjectTagAll } from '@/apis/bookkeeping/subject-tag'
import { listMyPaymentAccount } from '@/apis/bookkeeping/payment-account'
import type { PaymentAccountResp, SubjectResp, SubjectTagResp } from '@/apis/bookkeeping/type'
import type { ColumnItem } from '@/components/GiForm'
import { useDict } from '@/hooks/app'
import type { LabelValueState } from '@/types/global'

interface CommonFilterForm {
  userId?: string
  category: string
  subjectId: string
  tagId?: string
  paymentMethod?: string
  paymentAccountId?: string
}

type CommonFilterChangeValue = string | number | boolean

interface CommonFilterLabels {
  userAll?: string
  categoryAll?: string
  subjectAll?: string
  paymentAll?: string
  paymentAccountAll?: string
}

interface CommonFilterColumnConfig {
  label?: string
  span?: ColumnItem['span']
  useRadioGroup?: boolean
  placeholder?: string
  allowClear?: boolean
  allowSearch?: boolean
  onChange?: (value: CommonFilterChangeValue) => void
}

interface CreateCommonQueryColumnsOptions {
  user?: CommonFilterColumnConfig
  category?: CommonFilterColumnConfig
  subject?: CommonFilterColumnConfig
  tag?: CommonFilterColumnConfig
  paymentMethod?: CommonFilterColumnConfig
  paymentAccount?: CommonFilterColumnConfig
}

interface UseBookkeepingCommonFiltersOptions<TForm extends CommonFilterForm> {
  form: TForm
  labels?: CommonFilterLabels
}

const normalizeOption = (item: LabelValueState): LabelValueState => ({
  label: item.label,
  value: String(item.value ?? ''),
  extra: item.extra,
})

const createAllOption = (label: string) => ({
  label,
  value: '',
})

const formatSubjectTagOptionLabel = (tag: SubjectTagResp) => {
  const suffixList: string[] = []
  if (tag.isDefault) {
    suffixList.push('默认')
  }
  if (tag.status === 2) {
    suffixList.push('停用')
  }
  if (!suffixList.length) {
    return tag.name
  }
  return `${tag.name}（${suffixList.join(' / ')}）`
}

/**
 * 生成带默认值的筛选列配置。
 *
 * 这里统一补齐占位文案、是否可清空、是否启用搜索等基础属性，
 * 避免各页面反复手写同一套 select 配置。
 */
const resolveColumnConfig = (
  config: CommonFilterColumnConfig | undefined,
  defaults: Omit<Required<Pick<CommonFilterColumnConfig, 'label' | 'placeholder' | 'allowClear' | 'allowSearch'>>, 'label'> & { label: string },
) => {
  return {
    label: config?.label ?? defaults.label,
    span: config?.span,
    useRadioGroup: config?.useRadioGroup ?? false,
    placeholder: config?.placeholder ?? defaults.placeholder,
    allowClear: config?.allowClear ?? defaults.allowClear,
    allowSearch: config?.allowSearch ?? defaults.allowSearch,
    onChange: config?.onChange,
  }
}

export const useBookkeepingCommonFilters = <TForm extends CommonFilterForm>(
  options: UseBookkeepingCommonFiltersOptions<TForm>,
) => {
  const { form, labels } = options
  const { bk_subject_category, bk_payment_method } = useDict('bk_subject_category', 'bk_payment_method')
  const { isAdmin, userOptions, loadUserOptions } = useDetailUserOptions()
  const allSubjects = ref<SubjectResp[]>([])
  const subjectTags = ref<SubjectTagResp[]>([])
  const paymentAccounts = ref<PaymentAccountResp[]>([])

  const userQueryOptions = computed<LabelValueState[]>(() => [
    createAllOption(labels?.userAll ?? '全部用户'),
    ...((userOptions.value ?? []).map(normalizeOption)),
  ])

  const categoryQueryOptions = computed<LabelValueState[]>(() => [
    createAllOption(labels?.categoryAll ?? '全部'),
    ...((bk_subject_category.value ?? []).map(normalizeOption)),
  ])

  const paymentMethodQueryOptions = computed<LabelValueState[]>(() => [
    createAllOption(labels?.paymentAll ?? '全部'),
    ...((bk_payment_method.value ?? []).map(normalizeOption)),
  ])

  const paymentAccountQueryOptions = computed<LabelValueState[]>(() => [
    createAllOption(labels?.paymentAccountAll ?? '全部账号'),
    ...paymentAccounts.value.map((item) => ({ label: item.name, value: String(item.id) })),
  ])

  const subjectQueryOptions = computed<LabelValueState[]>(() => {
    const matchedSubjects = form.category
      ? allSubjects.value.filter((item) => item.category === form.category)
      : allSubjects.value

    return [
      createAllOption(labels?.subjectAll ?? '全部科目'),
      ...matchedSubjects.map((item) => ({ label: item.name, value: String(item.id) })),
    ]
  })

  const tagQueryOptions = computed<Array<LabelValueState & { disabled?: boolean }>>(() => [
    createAllOption(labels?.subjectAll?.replace('科目', '标签') ?? '全部标签'),
    ...subjectTags.value.map((item) => ({
      label: formatSubjectTagOptionLabel(item),
      value: String(item.id),
    })),
  ])

  /** 分类变化后统一清空科目，避免保留无效筛选值。 */
  const clearSubjectSelection = () => {
    form.subjectId = ''
    if ('tagId' in form) {
      form.tagId = ''
    }
  }

  /** 科目变化后同步清空标签，避免跨科目保留脏值。 */
  const clearTagSelection = () => {
    if ('tagId' in form) {
      form.tagId = ''
    }
  }

  /**
   * 保证当前科目始终属于当前分类。
   *
   * 例如：
   * 1. 用户先选择了“餐饮”下的“午饭”
   * 2. 后续把分类切成“交通”
   * 3. 此时就要自动清空旧的科目值
   */
  const syncSubjectSelection = () => {
    if (!form.subjectId) {
      return
    }

    const exists = allSubjects.value.some((item) => String(item.id) === form.subjectId && (!form.category || item.category === form.category))
    if (!exists) {
      clearSubjectSelection()
    }
  }

  /** 当前标签必须从属于当前已选科目，否则自动清空。 */
  const syncTagSelection = () => {
    if (!('tagId' in form) || !form.tagId) {
      return
    }
    const exists = subjectTags.value.some((item) => String(item.id) === String(form.tagId))
    if (!exists) {
      clearTagSelection()
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

  const loadPaymentAccountOptions = async () => {
    try {
      const { data } = await listMyPaymentAccount()
      paymentAccounts.value = data ?? []
    } catch {
      paymentAccounts.value = []
    }
  }

  const loadSubjectTagOptions = async () => {
    if (!form.subjectId) {
      subjectTags.value = []
      clearTagSelection()
      return
    }
    try {
      const { data } = await listSubjectTagAll({ subjectId: form.subjectId })
      subjectTags.value = data ?? []
    } catch {
      subjectTags.value = []
    }
    syncTagSelection()
  }

  /** 同时加载用户与科目选项，供页面首屏初始化复用。 */
  const loadCommonFilterOptions = async () => {
    await Promise.allSettled([loadUserOptions(), loadSubjectOptions(), loadPaymentAccountOptions()])
    syncSubjectSelection()
    await loadSubjectTagOptions()
  }

  /**
   * 统一生成通用筛选列，页面只需要补充自身特有的筛选项即可。
   */
  const createCommonQueryColumns = (columnOptions: CreateCommonQueryColumnsOptions = {}) => {
    const userConfig = resolveColumnConfig(columnOptions.user, {
      label: '所属用户',
      placeholder: '请选择所属用户',
      allowClear: true,
      allowSearch: true,
    })
    const categoryConfig = resolveColumnConfig(columnOptions.category, {
      label: '分类',
      placeholder: '请选择分类',
      allowClear: true,
      allowSearch: false,
    })
    const subjectConfig = resolveColumnConfig(columnOptions.subject, {
      label: '科目',
      placeholder: '请选择科目',
      allowClear: true,
      allowSearch: true,
    })
    const tagConfig = resolveColumnConfig(columnOptions.tag, {
      label: '标签',
      placeholder: '请选择标签',
      allowClear: true,
      allowSearch: true,
    })
    const paymentMethodConfig = resolveColumnConfig(columnOptions.paymentMethod, {
      label: '支付方式',
      placeholder: '请选择支付方式',
      allowClear: true,
      allowSearch: false,
    })
    const paymentAccountConfig = resolveColumnConfig(columnOptions.paymentAccount, {
      label: '支付账号',
      placeholder: '请选择支付账号',
      allowClear: true,
      allowSearch: true,
    })

    const userColumn: ColumnItem = {
      type: userConfig.useRadioGroup ? 'radio-group' : 'select',
      label: userConfig.label,
      field: 'userId',
      span: userConfig.span ?? { xs: 24, sm: 12, xxl: 6 },
      props: {
        options: userQueryOptions,
        placeholder: userConfig.placeholder,
        allowClear: userConfig.allowClear,
        allowSearch: userConfig.allowSearch,
        onChange: userConfig.onChange,
      },
    }

    const categoryColumn: ColumnItem = {
      type: categoryConfig.useRadioGroup ? 'radio-group' : 'select',
      label: categoryConfig.label,
      field: 'category',
      span: categoryConfig.span ?? { xs: 24, sm: 8, xxl: 6 },
      props: {
        options: categoryQueryOptions,
        placeholder: categoryConfig.placeholder,
        allowClear: categoryConfig.allowClear,
        allowSearch: categoryConfig.allowSearch,
        onChange: categoryConfig.onChange,
      },
    }

    const subjectColumn: ColumnItem = {
      type: subjectConfig.useRadioGroup ? 'radio-group' : 'select',
      label: subjectConfig.label,
      field: 'subjectId',
      span: subjectConfig.span ?? { xs: 24, sm: 8, xxl: 6 },
      props: {
        options: subjectQueryOptions,
        placeholder: subjectConfig.placeholder,
        allowClear: subjectConfig.allowClear,
        allowSearch: subjectConfig.allowSearch,
        onChange: subjectConfig.onChange,
      },
    }

    const tagColumn: ColumnItem = {
      type: tagConfig.useRadioGroup ? 'radio-group' : 'select',
      label: tagConfig.label,
      field: 'tagId',
      span: tagConfig.span ?? { xs: 24, sm: 8, xxl: 6 },
      props: {
        options: tagQueryOptions,
        placeholder: tagConfig.placeholder,
        allowClear: tagConfig.allowClear,
        allowSearch: tagConfig.allowSearch,
        onChange: tagConfig.onChange,
      },
    }

    const paymentMethodColumn: ColumnItem = {
      type: paymentMethodConfig.useRadioGroup ? 'radio-group' : 'select',
      label: paymentMethodConfig.label,
      field: 'paymentMethod',
      span: paymentMethodConfig.span ?? { xs: 24, sm: 8, xxl: 6 },
      props: {
        options: paymentMethodQueryOptions,
        placeholder: paymentMethodConfig.placeholder,
        allowClear: paymentMethodConfig.allowClear,
        allowSearch: paymentMethodConfig.allowSearch,
        onChange: paymentMethodConfig.onChange,
      },
    }

    const paymentAccountColumn: ColumnItem = {
      type: paymentAccountConfig.useRadioGroup ? 'radio-group' : 'select',
      label: paymentAccountConfig.label,
      field: 'paymentAccountId',
      span: paymentAccountConfig.span ?? { xs: 24, sm: 8, xxl: 6 },
      props: {
        options: paymentAccountQueryOptions,
        placeholder: paymentAccountConfig.placeholder,
        allowClear: paymentAccountConfig.allowClear,
        allowSearch: paymentAccountConfig.allowSearch,
        onChange: paymentAccountConfig.onChange,
      },
    }

    return {
      userColumn,
      categoryColumn,
      subjectColumn,
      tagColumn,
      paymentMethodColumn,
      paymentAccountColumn,
    }
  }

  watch(
    [() => form.category, allSubjects],
    () => {
      syncSubjectSelection()
    },
    { immediate: true },
  )

  watch(
    () => form.subjectId,
    async (value, oldValue) => {
      if (!value) {
        subjectTags.value = []
        clearTagSelection()
        return
      }
      if (value !== oldValue) {
        clearTagSelection()
      }
      await loadSubjectTagOptions()
    },
    { immediate: true },
  )

  return {
    isAdmin,
    allSubjects,
    subjectTags,
    userQueryOptions,
    categoryQueryOptions,
    paymentMethodQueryOptions,
    paymentAccountQueryOptions,
    subjectQueryOptions,
    tagQueryOptions,
    clearSubjectSelection,
    clearTagSelection,
    loadCommonFilterOptions,
    loadPaymentAccountOptions,
    loadSubjectTagOptions,
    createCommonQueryColumns,
  }
}
