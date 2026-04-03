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
import type { SubjectResp } from '@/apis/bookkeeping/type'
import type { ColumnItem } from '@/components/GiForm'
import { useDict } from '@/hooks/app'
import type { LabelValueState } from '@/types/global'

interface CommonFilterForm {
  userId?: string
  category: string
  subjectId: string
  paymentMethod?: string
}

type CommonFilterChangeValue = string | number | boolean

interface CommonFilterLabels {
  userAll?: string
  categoryAll?: string
  subjectAll?: string
  paymentAll?: string
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
  paymentMethod?: CommonFilterColumnConfig
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

  const subjectQueryOptions = computed<LabelValueState[]>(() => {
    const matchedSubjects = form.category
      ? allSubjects.value.filter((item) => item.category === form.category)
      : allSubjects.value

    return [
      createAllOption(labels?.subjectAll ?? '全部科目'),
      ...matchedSubjects.map((item) => ({ label: item.name, value: String(item.id) })),
    ]
  })

  /** 分类变化后统一清空科目，避免保留无效筛选值。 */
  const clearSubjectSelection = () => {
    form.subjectId = ''
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

  const loadSubjectOptions = async () => {
    try {
      const { data } = await listSubject({ sort: ['sort,asc', 'id,desc'], page: 1, size: 1000 } as any)
      allSubjects.value = data.list ?? []
    } catch {
      allSubjects.value = []
    }
  }

  /** 同时加载用户与科目选项，供页面首屏初始化复用。 */
  const loadCommonFilterOptions = async () => {
    await Promise.allSettled([loadUserOptions(), loadSubjectOptions()])
    syncSubjectSelection()
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
    const paymentMethodConfig = resolveColumnConfig(columnOptions.paymentMethod, {
      label: '支付方式',
      placeholder: '请选择支付方式',
      allowClear: true,
      allowSearch: false,
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

    return {
      userColumn,
      categoryColumn,
      subjectColumn,
      paymentMethodColumn,
    }
  }

  watch(
    [() => form.category, allSubjects],
    () => {
      syncSubjectSelection()
    },
    { immediate: true },
  )

  return {
    isAdmin,
    allSubjects,
    userQueryOptions,
    categoryQueryOptions,
    paymentMethodQueryOptions,
    subjectQueryOptions,
    clearSubjectSelection,
    loadCommonFilterOptions,
    createCommonQueryColumns,
  }
}
