<template>
  <a-modal
    v-model:visible="visible"
    :title="title"
    :mask-closable="false"
    :esc-to-close="false"
    :width="width >= 500 ? 500 : '100%'"
    draggable
    @before-ok="save"
    @close="reset"
  >
    <GiForm ref="formRef" v-model="form" :columns="columns" />
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
 */
import { Message } from '@arco-design/web-vue'
import { useWindowSize } from '@vueuse/core'
import { computed, reactive, ref, watch } from 'vue'
import { addDetail, getDetail, updateDetail } from '@/apis/bookkeeping/detail'
import { listSubject } from '@/apis/bookkeeping/subject'
import { listUserDict } from '@/apis/system/user'
import { type ColumnItem, GiForm } from '@/components/GiForm'
import { useResetReactive } from '@/hooks'
import { useDict } from '@/hooks/app'
import { useUserStore } from '@/stores'
import type { LabelValueState } from '@/types/global'

const emit = defineEmits<{
  (e: 'save-success'): void
}>()

const { width } = useWindowSize()
const userStore = useUserStore()
const { bk_subject_category } = useDict('bk_subject_category')

/** 是否超级管理员 */
const isAdmin = computed(() => userStore.roles.includes('super_admin'))

const dataId = ref('')
const visible = ref(false)
const isUpdate = computed(() => !!dataId.value)
const title = computed(() => (isUpdate.value ? '修改明细' : '新增明细'))
const formRef = ref<InstanceType<typeof GiForm>>()

/** 用户选项列表 */
const userOptions = ref<LabelValueState[]>([])
/** 全部科目数据（原始） */
const allSubjects = ref<any[]>([])
/** 当前分类下的科目选项 */
const subjectOptions = ref<LabelValueState[]>([])
/** 上一次自动填充的名称（避免覆盖用户手动输入） */
let lastAutoFillName = ''

const [form, resetForm] = useResetReactive({
  detailDate: new Date().toISOString().slice(0, 10),
  category: '',
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
    type: 'select',
    span: 24,
    required: true,
    props: {
      options: bk_subject_category,
      placeholder: '请选择分类（支出/收入）',
      allowClear: true,
    },
  },
  {
    label: '所属科目',
    field: 'subjectId',
    type: 'select',
    span: 24,
    required: true,
    props: {
      options: subjectOptions,
      placeholder: '请先选择分类',
      allowSearch: true,
    },
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
    label: '明细日期',
    field: 'detailDate',
    type: 'date-picker',
    span: 24,
    required: true,
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
  // 切换分类时清空科目和名称
  form.subjectId = undefined
  form.name = ''
  lastAutoFillName = ''
})

/**
 * 监听科目变化，自动填充明细名称
 *
 * @author Wangsongsong
 * @date 2026-03-18
 */
watch(() => form.subjectId, (val) => {
  if (!val) return
  const selected = subjectOptions.value.find((item) => item.value === val)
  if (selected) {
    const label = selected.label as string
    // 仅在名称为空或等于上次自动填充值时才覆盖
    if (!form.name || form.name === lastAutoFillName) {
      form.name = label
      lastAutoFillName = label
    }
  }
})

/**
 * 加载用户选项
 *
 * @author Wangsongsong
 * @date 2026-03-18
 */
const loadUserOptions = async () => {
  if (userOptions.value.length) return
  const { data } = await listUserDict({ status: 1 })
  userOptions.value = data
}

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

/** 重置 */
const reset = () => {
  formRef.value?.formRef?.resetFields()
  resetForm()
  lastAutoFillName = ''
}

/** 保存 */
const save = async () => {
  try {
    const isInvalid = await formRef.value?.formRef?.validate()
    if (isInvalid) return false
    // 非管理员自动设置当前用户 ID
    if (!isAdmin.value) {
      form.userId = userStore.userInfo.id
    }
    if (isUpdate.value) {
      await updateDetail(form, dataId.value)
      Message.success('修改成功')
    } else {
      await addDetail(form)
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
  lastAutoFillName = ''
  const tasks: Promise<any>[] = [loadSubjectOptions()]
  if (isAdmin.value) {
    tasks.push(loadUserOptions())
  }
  await Promise.all(tasks)
  // 非管理员默认设置当前用户
  if (!isAdmin.value) {
    form.userId = userStore.userInfo.id
  }
  visible.value = true
}

/** 修改 */
const onUpdate = async (id: string) => {
  reset()
  dataId.value = id
  lastAutoFillName = ''
  const tasks: Promise<any>[] = [loadSubjectOptions()]
  if (isAdmin.value) {
    tasks.push(loadUserOptions())
  }
  await Promise.all(tasks)
  const { data } = await getDetail(id)
  // 金额取绝对值回显（后端存储带正负号）
  if (data.amount != null) {
    data.amount = Math.abs(data.amount) as any
  }
  // 回填分类（从详情的 subjectCategory 获取）
  form.category = data.subjectCategory || ''
  // 等分类 watch 触发后再赋值科目和名称
  await new Promise((resolve) => setTimeout(resolve, 0))
  Object.assign(form, data)
  // 记录当前名称为自动填充值，避免编辑时被覆盖
  lastAutoFillName = data.name || ''
  // 非管理员不显示用户选择
  if (!isAdmin.value) {
    form.userId = data.userId
  }
  visible.value = true
}

defineExpose({ onAdd, onUpdate })
</script>

<style scoped lang="scss"></style>
