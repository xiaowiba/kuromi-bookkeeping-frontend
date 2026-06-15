<template>
  <div class="detail-form-wrapper">
    <a-alert
      v-if="showReimburseRoleLockedNotice"
      class="reimburse-role-lock-alert"
      type="warning"
      show-icon
    >
      该明细已存在报销关联，请先取消关联后再修改“是否报销他人”和“是否垫付”。
    </a-alert>
    <GiForm ref="formRef" v-model="form" :columns="columns" :layout="formLayout" :size="formSize" />
  </div>
</template>

<script setup lang="ts">
import { Message } from '@arco-design/web-vue'
import { computed, h, reactive, ref, watch } from 'vue'
import { useDetailUserOptions } from '../shared/useDetailUserOptions'
import { addDetail, getDetail, updateDetail } from '@/apis/bookkeeping/detail'
import { listSubject } from '@/apis/bookkeeping/subject'
import { listSubjectTagAll } from '@/apis/bookkeeping/subject-tag'
import { listMyPaymentAccount, listPaymentAccount } from '@/apis/bookkeeping/payment-account'
import { type ColumnItem, GiForm } from '@/components/GiForm'
import { useResetReactive } from '@/hooks'
import { useDict } from '@/hooks/app'
import { usePrivacyStore, useUserStore } from '@/stores'
import type { LabelValueState } from '@/types/global'
import has from '@/utils/has'
import { isMobile } from '@/utils'

const emit = defineEmits<{
  (e: 'save-success'): void
}>()

const userStore = useUserStore()
const privacyStore = usePrivacyStore()
const { bk_subject_category, bk_payment_method, common_yes_no } = useDict(
  'bk_subject_category',
  'bk_payment_method',
  'common_yes_no',
)
const { isAdmin, userOptions, loadUserOptions } = useDetailUserOptions()

/** 表单布局：移动端垂直排列，PC端水平排列 */
const formLayout = computed(() => (isMobile() ? 'vertical' : 'horizontal'))

/** 表单尺寸：移动端大号，PC端大号 */
const formSize = computed(() => (isMobile() ? 'large' : 'large'))

const dataId = ref('')
const isUpdate = computed(() => !!dataId.value)
const formRef = ref<InstanceType<typeof GiForm>>()
const linkedDetailId = ref('')
const amountDisabled = ref(false)
const categoryDisabled = ref(false)
const isAdvanceDisabled = ref(false)
const isReimburseOtherDisabled = ref(false)

interface AddForUserOptions {
  userId: string | number
  category?: string
  isAdvance?: number
  isReimburseOther?: number
  amount?: number
  amountDisabled?: boolean
  categoryDisabled?: boolean
  isAdvanceDisabled?: boolean
  isReimburseOtherDisabled?: boolean
}

/** 全部科目数据（原始） */
const allSubjects = ref<any[]>([])
/** 当前分类下的科目选项 */
const subjectOptions = ref<LabelValueState[]>([])
/** 当前科目下的标签选项，首项固定为"不选择标签" */
const subjectTagOptions = ref<Array<LabelValueState & { disabled?: boolean }>>([
  { label: '不选择标签', value: '' },
])
/** 当前用户的支付账号选项 */
const paymentAccountOptions = ref<LabelValueState[]>([
  { label: '不选择', value: '' },
])
const yesNoFallbackOptions: LabelValueState[] = [
  { label: '是', value: 1 },
  { label: '否', value: 0 },
]
const isNecessaryOptions = computed<LabelValueState[]>(() => {
  const options = common_yes_no.value?.length ? common_yes_no.value : yesNoFallbackOptions
  return options.map((item) => ({
    label: String(item.label ?? ''),
    value: Number(item.value ?? 0),
  }))
})
const necessaryFieldLabel = computed(() => (form.category === 'income' ? '是否必要收入' : '是否必要支出'))

// 报销相关选项（复用 common_yes_no 字典）
const isReimburseOtherOptions = computed<LabelValueState[]>(() => {
  const options = common_yes_no.value?.length ? common_yes_no.value : yesNoFallbackOptions
  return options.map((item) => ({
    label: String(item.label ?? ''),
    value: Number(item.value ?? 0),
  }))
})
const isAdvanceOptions = isReimburseOtherOptions
// 已关联报销关系的明细不允许在编辑弹窗里直接改角色字段，避免前后关系被改乱。
const showReimburseRoleLockedNotice = computed(() => isUpdate.value && !!linkedDetailId.value)

const [form, resetForm] = useResetReactive({
  detailDate: new Date().toISOString().slice(0, 10),
  category: '',
  paymentMethod: 'default',
  paymentAccountId: '',
  tagId: '',
  isNecessary: 1,
  isReimburseOther: 0,
  isAdvance: 0,
  hidden: 0,
})

const columns = computed<ColumnItem[]>(() => [
  {
    label: '所属用户',
    field: 'userId',
    type: 'select',
    span: 24,
    required: true,
    show: () => isAdmin.value,
    props: {
      options: userOptions.value,
      placeholder: '请选择所属用户',
      allowSearch: true,
    },
  },
  {
    label: '分类',
    field: 'category',
    type: 'radio-group',
    span: 24,
    required: true,
    disabled: () => categoryDisabled.value,
    props: {
      options: bk_subject_category.value,
    },
  },
  {
    label: '所属科目',
    field: 'subjectId',
    type: 'radio-group',
    span: 24,
    required: true,
    props: {
      options: subjectOptions.value,
    },
  },
  {
    label: '所属标签',
    field: 'tagId',
    type: 'radio-group',
    span: 24,
    props: {
      options: subjectTagOptions.value,
    },
    disabled: () => !form.subjectId,
  },
  {
    label: '明细名称',
    field: 'name',
    type: 'input',
    span: 24,
    required: true,
    props: {
      maxLength: 100,
      placeholder: '请输入明细名称',
    },
  },
  {
    label: '金额',
    field: 'amount',
    type: 'input-number',
    span: 24,
    required: true,
    disabled: () => amountDisabled.value,
    props: {
      min: 0.01,
      precision: 2,
      placeholder: '请输入金额（绝对值）',
    },
  },
  {
    label: '支付方式',
    field: 'paymentMethod',
    type: 'radio-group',
    span: 24,
    required: true,
    props: {
      options: bk_payment_method.value,
    },
  },
  {
    label: '明细日期',
    field: 'detailDate',
    type: 'date-picker',
    span: 24,
    required: true,
  },
  {
    label: '支付账号',
    field: 'paymentAccountId',
    type: 'radio-group',
    span: 24,
    props: {
      options: paymentAccountOptions.value,
    },
  },
  {
    label: () => h('span', necessaryFieldLabel.value),
    field: 'isNecessary',
    type: 'radio-group',
    span: 24,
    props: {
      options: isNecessaryOptions.value,
    },
  },
  // ======== 报销相关字段 ========
  {
    label: '是否报销他人',
    field: 'isReimburseOther',
    type: 'radio-group',
    span: 24,
    show: () => form.category === 'expense',
    disabled: () => showReimburseRoleLockedNotice.value || isReimburseOtherDisabled.value,
    props: { options: isReimburseOtherOptions.value },
  },
  // 表单只负责标记当前明细的报销角色；真正的双向关联在列表操作列中完成。
  // 当选择“报销他人”时，垫付字段需要隐藏并由后端兜底清零，避免两个角色同时成立。
  {
    label: '是否垫付',
    field: 'isAdvance',
    type: 'radio-group',
    span: 24,
    show: () => form.category === 'expense' && form.isReimburseOther !== 1,
    disabled: () => showReimburseRoleLockedNotice.value || isAdvanceDisabled.value,
    props: { options: isAdvanceOptions.value },
  },
  {
    label: '备注',
    field: 'remark',
    type: 'textarea',
    span: 24,
    props: {
      maxLength: 200,
      showWordLimit: true,
      placeholder: '请输入备注',
    },
  },
  {
    label: '隐藏此笔',
    field: 'hidden',
    type: 'switch',
    span: 24,
    show: () => has.hasPermOr(['bk:hide-target:manage']) && privacyStore.isPrivacyMode,
    props: {
      checkedValue: 1,
      uncheckedValue: 0,
    },
  },
])

watch(() => form.category, (val) => {
  if (val) {
    subjectOptions.value = allSubjects.value
      .filter((item: any) => item.category === val)
      .map((item: any) => ({ label: item.name, value: item.id }))
  } else {
    subjectOptions.value = []
  }
  // 切换分类时同时清空科目和标签，保证三级联动口径正确。
  form.subjectId = undefined
  form.tagId = ''
  subjectTagOptions.value = [{ label: '不选择标签', value: '' }]

  // 切换分类时重置报销相关字段
  if (val !== 'expense') {
    form.isReimburseOther = 0
    form.isAdvance = 0
  }
})

const loadSubjectOptions = async () => {
  if (allSubjects.value.length) return
  const { data } = await listSubject({ sort: ['sort,asc'], page: 1, size: 200 } as any)
  allSubjects.value = data.list
}

const loadPaymentAccountOptions = async (targetUserId?: string | number) => {
  try {
    const response = targetUserId
      ? await listPaymentAccount({
          userId: String(targetUserId),
          page: 1,
          size: 200,
        } as any)
      : await listMyPaymentAccount()
    const data = targetUserId ? response.data?.list ?? [] : response.data ?? []
    paymentAccountOptions.value = [
      { label: '不选择', value: '' },
      ...(data ?? []).map((item) => ({ label: item.name, value: String(item.id) })),
    ]
    return data ?? []
  } catch {
    paymentAccountOptions.value = [{ label: '不选择', value: '' }]
    return []
  }
}

const loadSubjectTagOptions = async (
  subjectId: string | number,
  selectedTagId?: string | number,
) => {
  const keepTagId = String(selectedTagId ?? form.tagId ?? '')
  try {
    const { data } = await listSubjectTagAll({ subjectId: String(subjectId) })
    const tagOptions = (data ?? []).map((item) => {
      const suffixList: string[] = []
      if (item.isDefault) {
        suffixList.push('默认')
      }
      if (item.status === 2) {
        suffixList.push('停用')
      }
      return {
        label: suffixList.length ? `${item.name}（${suffixList.join(' / ')}）` : item.name,
        value: String(item.id),
        disabled: item.status === 2 && String(item.id) !== keepTagId,
      }
    })
    subjectTagOptions.value = [{ label: '不选择标签', value: '' }, ...tagOptions]
    if (!keepTagId) {
      form.tagId = ''
      return
    }
    const exists = tagOptions.some((item) => String(item.value) === keepTagId)
    form.tagId = exists ? keepTagId : ''
  } catch {
    subjectTagOptions.value = [{ label: '不选择标签', value: '' }]
    form.tagId = ''
  }
}

watch(() => form.subjectId, async (subjectId) => {
  if (!subjectId) {
    form.tagId = ''
    subjectTagOptions.value = [{ label: '不选择标签', value: '' }]
    return
  }
  await loadSubjectTagOptions(subjectId, form.tagId)
})

watch(() => form.userId, async (userId) => {
  if (!isAdmin.value || isUpdate.value) {
    return
  }
  if (!userId) {
    paymentAccountOptions.value = [{ label: '不选择', value: '' }]
    form.paymentAccountId = ''
    return
  }
  await loadPaymentAccountOptions(userId)
  form.paymentAccountId = ''
})


watch(() => form.isReimburseOther, (val) => {
  if (val === 1) {
    form.isAdvance = 0
  }
})

/** 重置 */
const reset = () => {
  formRef.value?.formRef?.resetFields()
  resetForm()
  linkedDetailId.value = ''
  amountDisabled.value = false
  categoryDisabled.value = false
  isAdvanceDisabled.value = false
  isReimburseOtherDisabled.value = false
  subjectTagOptions.value = [{ label: '不选择标签', value: '' }]
}

/** 保存 */
const save = async () => {
  try {
    const isInvalid = await formRef.value?.formRef?.validate()
    if (isInvalid) return false
    const payload = {
      userId: form.userId,
      subjectId: form.subjectId,
      tagId: form.tagId ? form.tagId : null,
      name: form.name,
      amount: form.amount,
      detailDate: form.detailDate,
      paymentMethod: form.paymentMethod,
      paymentAccountId: form.paymentAccountId ? form.paymentAccountId : null,
      isNecessary: Number(form.isNecessary ?? 1),
      isReimburseOther: form.category === 'expense' ? Number(form.isReimburseOther ?? 0) : 0,
      isAdvance: (form.category === 'expense' && form.isReimburseOther !== 1) ? Number(form.isAdvance ?? 0) : 0,
      remark: form.remark,
      hidden: Number(form.hidden ?? 0),
    }
    if (isUpdate.value) {
      await updateDetail(payload, dataId.value)
      Message.success('修改成功')
    } else {
      await addDetail(payload)
      Message.success('新增成功')
    }
    emit('save-success')
    return true
  } catch (error) {
    return false
  }
}

/** 新增 */
const onAdd = async () => {
  reset()
  dataId.value = ''
  const tasks: Promise<any>[] = [loadSubjectOptions()]
  if (!isAdmin.value) {
    tasks.push(loadPaymentAccountOptions())
  }
  if (isAdmin.value) {
    tasks.push(loadUserOptions())
  }
  const [accounts] = await Promise.all(tasks)
  if (!isAdmin.value) {
    form.userId = userStore.userInfo.id
    if (accounts && Array.isArray(accounts)) {
      const defaultAccount = accounts.find((item: any) => item.isDefault === 1)
      if (defaultAccount) {
        form.paymentAccountId = String(defaultAccount.id)
      }
    }
  }
}

/** 为指定用户新增 */
const onAddForUser = async (options: AddForUserOptions) => {
  reset()
  dataId.value = ''
  const tasks: Promise<any>[] = [loadSubjectOptions(), loadPaymentAccountOptions(options.userId)]
  if (isAdmin.value) {
    tasks.push(loadUserOptions())
  }
  await Promise.all(tasks)

  form.userId = String(options.userId)
  form.category = options.category || 'expense'
  form.isAdvance = Number(options.isAdvance ?? 0)
  form.isReimburseOther = Number(options.isReimburseOther ?? 0)
  if (options.amount != null) {
    form.amount = options.amount
  }
  amountDisabled.value = !!options.amountDisabled
  categoryDisabled.value = !!options.categoryDisabled
  isAdvanceDisabled.value = !!options.isAdvanceDisabled
  isReimburseOtherDisabled.value = !!options.isReimburseOtherDisabled
}

/** 修改 */
const onUpdate = async (id: string) => {
  reset()
  dataId.value = id
  const tasks: Promise<any>[] = [loadSubjectOptions()]
  if (isAdmin.value) {
    tasks.push(loadUserOptions())
  }
  await Promise.all(tasks)
  const { data } = await getDetail(id)
  linkedDetailId.value = String(data.linkedDetailId ?? '')
  await loadPaymentAccountOptions(data.userId)
  if (data.amount != null) {
    data.amount = Math.abs(data.amount) as any
  }
  data.paymentMethod = data.paymentMethod || 'default'
  data.paymentAccountId = data.paymentAccountId ? String(data.paymentAccountId) : ''
  data.tagId = data.tagId || ''
  data.isNecessary = Number(data.isNecessary ?? 1)
  form.category = data.subjectCategory || ''
  await new Promise((resolve) => setTimeout(resolve, 0))
  const { isReimbursed: _ignoredReimbursed, ...detailForm } = data
  Object.assign(form, detailForm)
  if (form.subjectId) {
    await loadSubjectTagOptions(form.subjectId, form.tagId)
  }
  if (!isAdmin.value) {
    form.userId = data.userId
  }
}

defineExpose({ onAdd, onAddForUser, onUpdate, save, reset })
</script>

<style scoped lang="scss">
.detail-form-wrapper {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.reimburse-role-lock-alert {
  margin-bottom: 4px;
}
</style>
