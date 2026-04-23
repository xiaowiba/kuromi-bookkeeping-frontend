<template>
  <a-modal
    v-model:visible="visible"
    :title="title"
    :mask-closable="false"
    :esc-to-close="false"
    :width="width >= 800 ? 800 : '100%'"
    :class="{ 'mobile-modal': isMobile() }"
    draggable
    @before-ok="save"
    @close="reset"
  >
    <GiForm ref="formRef" v-model="form" :columns="columns" :layout="formLayout" :size="formSize" />
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
 * @desc 新增支付方式单选字段，必填且默认值为“默认”
 * @update 2026-04-23
 * @desc 支付账号字段改为与所属科目一致的单选按钮组
 */
import { Message } from '@arco-design/web-vue'
import { useWindowSize } from '@vueuse/core'
import { computed, reactive, ref, watch } from 'vue'
import { useDetailUserOptions } from '../shared/useDetailUserOptions'
import { addDetail, getDetail, updateDetail } from '@/apis/bookkeeping/detail'
import { listSubject } from '@/apis/bookkeeping/subject'
import { listSubjectTagAll } from '@/apis/bookkeeping/subject-tag'
import { listMyPaymentAccount } from '@/apis/bookkeeping/payment-account'
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
const { bk_subject_category, bk_payment_method } = useDict('bk_subject_category', 'bk_payment_method')
const { isAdmin, userOptions, loadUserOptions } = useDetailUserOptions()

/** 表单布局：移动端垂直排列，PC端水平排列 */
const formLayout = computed(() => (isMobile() ? 'vertical' : 'horizontal'))

/** 表单尺寸：移动端大号，PC端大号 */
const formSize = computed(() => (isMobile() ? 'large' : 'large'))

const dataId = ref('')
const visible = ref(false)
const isUpdate = computed(() => !!dataId.value)
const title = computed(() => (isUpdate.value ? '修改明细' : '新增明细'))
const formRef = ref<InstanceType<typeof GiForm>>()

/** 全部科目数据（原始） */
const allSubjects = ref<any[]>([])
/** 当前分类下的科目选项 */
const subjectOptions = ref<LabelValueState[]>([])
/** 当前科目下的标签选项，首项固定为“不选择标签” */
const subjectTagOptions = ref<Array<LabelValueState & { disabled?: boolean }>>([
  { label: '不选择标签', value: '' },
])
/** 当前用户的支付账号选项 */
const paymentAccountOptions = ref<LabelValueState[]>([
  { label: '不选择', value: '' },
])
const [form, resetForm] = useResetReactive({
  detailDate: new Date().toISOString().slice(0, 10),
  category: '',
  paymentMethod: 'default',
  paymentAccountId: '',
  tagId: '',
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
const loadPaymentAccountOptions = async () => {
  try {
    const { data } = await listMyPaymentAccount()
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
 * 标签是“可选单选”，因此首项始终保留“不选择标签”；
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

/** 重置 */
const reset = () => {
  formRef.value?.formRef?.resetFields()
  resetForm()
  subjectTagOptions.value = [{ label: '不选择标签', value: '' }]
}

/** 保存 */
const save = async () => {
  try {
    const isInvalid = await formRef.value?.formRef?.validate()
    if (isInvalid) return false
    const payload = {
      ...form,
      tagId: form.tagId ? form.tagId : undefined,
      paymentAccountId: form.paymentAccountId ? form.paymentAccountId : undefined,
    }
    // 非管理员自动设置当前用户 ID
    if (!isAdmin.value) {
      payload.userId = userStore.userInfo.id
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
  const tasks: Promise<any>[] = [loadSubjectOptions(), loadPaymentAccountOptions()]
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

/** 修改 */
const onUpdate = async (id: string) => {
  reset()
  dataId.value = id
  const tasks: Promise<any>[] = [loadSubjectOptions(), loadPaymentAccountOptions()]
  if (isAdmin.value) {
    tasks.push(loadUserOptions())
  }
  await Promise.all(tasks)
  const { data } = await getDetail(id)
  // 金额取绝对值回显（后端存储带正负号）
  if (data.amount != null) {
    data.amount = Math.abs(data.amount) as any
  }
  data.paymentMethod = data.paymentMethod || 'default'
  data.paymentAccountId = data.paymentAccountId ? String(data.paymentAccountId) : ''
  data.tagId = data.tagId || ''
  // 回填分类（从详情的 subjectCategory 获取）
  form.category = data.subjectCategory || ''
  // 等分类 watch 触发后再赋值科目和名称
  await new Promise((resolve) => setTimeout(resolve, 0))
  Object.assign(form, data)
  if (form.subjectId) {
    await loadSubjectTagOptions(form.subjectId, form.tagId)
  }
  // 非管理员不显示用户选择
  if (!isAdmin.value) {
    form.userId = data.userId
  }
  visible.value = true
}

defineExpose({ onAdd, onUpdate })
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
</style>
