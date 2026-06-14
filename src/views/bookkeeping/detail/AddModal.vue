<template>
  <a-modal
    v-model:visible="visible"
    :title="title"
    :mask-closable="false"
    :esc-to-close="false"
    fullscreen
    :class="{ 'mobile-modal': isMobile() }"
    @before-ok="save"
    @close="reset"
  >
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
  </a-modal>
</template>

<script setup lang="ts">
/**
 * 明细新增/编辑弹窗
 *
 * @author Wangsongsong
 * @date 2026-03-18
 * @update 2026-03-18 @Wangsongsong
 * @desc 优化用户字段角色控制、分类级联科目、科目联动名称
 * @update 2026-03-19 @Wangsongsong
 * @desc 隐藏开关仅在隐私模式下显示
 * @update 2026-03-19 @Wangsongsong
 * @desc 分类和所属科目字段从下拉选择改为单选按钮组
 * @update 2026-03-19 @Wangsongsong
 * @desc 使用框架 isMobile 方法判断移动端,移动端垂直布局,PC端水平布局
 * @update 2026-03-19 @Wangsongsong
 * @desc 移动端表单更紧凑,字体更大,优化触摸体验
 * @update 2026-03-19 @Wangsongsong
 * @desc 进一步优化移动端样式:字体18px,间距12px,内边距8px
 * @update 2026-03-21 @Wangsongsong
 * @desc 复用共享的明细用户选项加载逻辑，统一桌面端与移动端口径
 * @update 2026-03-22 @Wangsongsong
 * @desc 修复编辑明细时名称被科目联动逻辑覆盖的问题，自动填充仅在新增态生效
 * @update 2026-03-23 @Wangsongsong
 * @desc 新增支付方式单选字段，必填且默认值为"默认"
 * @update 2026-04-23
 * @desc 支付账号字段改为与所属科目一致的单选按钮组
 * @update 2026-05-30 @Wangsongsong
 * @desc 新增报销相关字段：是否报销他人、是否垫付
 * @update 2026-05-30 @Wangsongsong
 * @desc 优化并合并分类切换的 Watcher 监听逻辑，消除冗余订阅并增强代码鲁棒性
 * @update 2026-06-07 @Codex
 * @desc 移除“是否已报销”手工录入入口，改为由后端基于真实关联关系自动派生
 */
import { Message } from '@arco-design/web-vue'
import { useWindowSize } from '@vueuse/core'
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

const { width } = useWindowSize()
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

/** 弹窗宽度：桌面端适当放宽，窄屏保留边距避免溢出 */
const modalWidth = computed(() => (isMobile() ? '100%' : Math.min(width.value - 32, 920)))

const dataId = ref('')
const visible = ref(false)
const isUpdate = computed(() => !!dataId.value)
const title = computed(() => (isUpdate.value ? '修改明细' : '新增明细'))
const formRef = ref<InstanceType<typeof GiForm>>()
const linkedDetailId = ref('')

interface AddForUserOptions {
  userId: string | number
  category?: string
  isAdvance?: number
  isReimburseOther?: number
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

const columns: ColumnItem[] = reactive([
  {
    label: '所属用户',
    field: 'userId',
    type: 'select',
    span: 24,
    required: true,
    show: () => isAdmin.value,
    props: {
      options: userOptions,
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
    props: {
      options: bk_subject_category,
    },
  },
  {
    label: '所属科目',
    field: 'subjectId',
    type: 'radio-group',
    span: 24,
    required: true,
    props: {
      options: subjectOptions,
    },
  },
  {
    label: '所属标签',
    field: 'tagId',
    type: 'radio-group',
    span: 24,
    props: {
      options: subjectTagOptions,
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
      options: bk_payment_method,
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
      options: paymentAccountOptions,
    },
  },
  {
    label: () => h('span', necessaryFieldLabel.value),
    field: 'isNecessary',
    type: 'radio-group',
    span: 24,
    props: {
      options: isNecessaryOptions,
    },
  },
  // ======== 报销相关字段 ========
  {
    label: '是否报销他人',
    field: 'isReimburseOther',
    type: 'radio-group',
    span: 24,
    show: () => form.category === 'expense',
    disabled: () => showReimburseRoleLockedNotice.value,
    props: { options: isReimburseOtherOptions },
  },
  // 表单只负责标记当前明细的报销角色；真正的双向关联在列表操作列中完成。
  // 当选择“报销他人”时，垫付字段需要隐藏并由后端兜底清零，避免两个角色同时成立。
  {
    label: '是否垫付',
    field: 'isAdvance',
    type: 'radio-group',
    span: 24,
    show: () => form.category === 'expense' && form.isReimburseOther !== 1,
    disabled: () => showReimburseRoleLockedNotice.value,
    props: { options: isAdvanceOptions },
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

/**
 * 监听分类变化，筛选对应科目选项
 *
 * @author Wangsongsong
 * @date 2026-03-18
 */
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

/**
 * 加载科目选项
 *
 * @author Wangsongsong
 * @date 2026-03-18
 */
const loadSubjectOptions = async () => {
  if (allSubjects.value.length) return
  const { data } = await listSubject({ sort: ['sort,asc'], page: 1, size: 200 } as any)
  allSubjects.value = data.list
}

/**
 * 加载当前用户的支付账号选项
 *
 * @author Wangsongsong
 * @date 2026-04-21
 */
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

/**
 * 加载当前科目下的标签选项。
 *
 * @param subjectId      科目 ID
 * @param selectedTagId  当前已选标签。编辑态可能是停用标签，需要继续保留回显。
 */
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

/**
 * 监听科目变化并加载标签选项。
 *
 * 标签是"可选单选"，因此首项始终保留"不选择标签"；
 * 若编辑态回显的是已停用标签，会保留该项但禁止新选中其他停用标签。
 */
watch(() => form.subjectId, async (subjectId) => {
  if (!subjectId) {
    form.tagId = ''
    subjectTagOptions.value = [{ label: '不选择标签', value: '' }]
    return
  }
  await loadSubjectTagOptions(subjectId, form.tagId)
})

watch(() => form.userId, async (userId) => {
  if (!isAdmin.value || isUpdate.value || !visible.value) {
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


// 是否报销他人切换时（互斥清除）
watch(() => form.isReimburseOther, (val) => {
  if (val === 1) {
    // 报销他人 → 清除垫付相关
    form.isAdvance = 0
  }
})

/** 重置 */
const reset = () => {
  formRef.value?.formRef?.resetFields()
  resetForm()
  linkedDetailId.value = ''
  subjectTagOptions.value = [{ label: '不选择标签', value: '' }]
}

/** 保存 */
const save = async () => {
  try {
    const isInvalid = await formRef.value?.formRef?.validate()
    if (isInvalid) return false
    // 只提交 DetailReq 真正需要的字段，避免编辑态把详情响应里的展示/关联只读字段一并带回后端。
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
    // “是否已报销”已改为后端根据真实关联关系自动派生，前端不再手工提交该字段。
    // 这里保留表单里的 userId：
    // 1. 普通新增时 onAdd() 已预设为当前用户
    // 2. 关联弹窗里的“立即新增”会预设为目标报销/垫付用户
    // 3. 最终仍由后端按关注权限和编辑归属规则做兜底校验
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
  // 非管理员默认设置当前用户，并尝试填充默认账号
  if (!isAdmin.value) {
    form.userId = userStore.userInfo.id
    if (accounts && Array.isArray(accounts)) {
      const defaultAccount = accounts.find((item: any) => item.isDefault === 1)
      if (defaultAccount) {
        form.paymentAccountId = String(defaultAccount.id)
      }
    }
  }
  visible.value = true
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
  visible.value = true
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
  // 金额取绝对值回显（后端存储带正负号）
  if (data.amount != null) {
    data.amount = Math.abs(data.amount) as any
  }
  data.paymentMethod = data.paymentMethod || 'default'
  data.paymentAccountId = data.paymentAccountId ? String(data.paymentAccountId) : ''
  data.tagId = data.tagId || ''
  data.isNecessary = Number(data.isNecessary ?? 1)
  // 回填分类（从详情的 subjectCategory 获取）
  form.category = data.subjectCategory || ''
  // 等分类 watch 触发后再赋值科目和名称
  await new Promise((resolve) => setTimeout(resolve, 0))
  const { isReimbursed: _ignoredReimbursed, ...detailForm } = data
  Object.assign(form, detailForm)
  if (form.subjectId) {
    await loadSubjectTagOptions(form.subjectId, form.tagId)
  }
  // 非管理员不显示用户选择
  if (!isAdmin.value) {
    form.userId = data.userId
  }
  visible.value = true
}

defineExpose({ onAdd, onAddForUser, onUpdate })
</script>

<style scoped lang="scss">
// 移动端样式优化
.mobile-modal {
  :deep(.arco-modal-body) {
    padding: 8px 12px;
  }

  :deep(.arco-form) {
    // 表单项间距更紧凑
    .arco-form-item {
      margin-bottom: 12px;
    }

    // 标签字体更大
    .arco-form-item-label-col {
      font-size: 17px;
      font-weight: 500;
      margin-bottom: 4px;
    }

    // 输入框字体更大
    .arco-input,
    .arco-textarea,
    .arco-input-number,
    .arco-picker {
      font-size: 18px;
      padding: 8px 12px;
    }

    // 单选按钮字体更大
    .arco-radio-group {
      font-size: 17px;

      .arco-radio {
        margin-right: 20px;
        margin-bottom: 6px;
      }
    }

    // 开关组件更大
    .arco-switch {
      transform: scale(1.2);
    }

    // 日期选择器字体
    .arco-picker-input {
      font-size: 18px;
    }

    // 文本域字体
    .arco-textarea-wrapper {
      .arco-textarea {
        font-size: 18px;
        line-height: 1.5;
      }
    }
  }
}

.detail-form-wrapper {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.reimburse-role-lock-alert {
  margin-bottom: 4px;
}
</style>
