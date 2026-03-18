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
 */
import { Message } from '@arco-design/web-vue'
import { useWindowSize } from '@vueuse/core'
import { computed, onMounted, reactive, ref } from 'vue'
import { addDetail, getDetail, updateDetail } from '@/apis/bookkeeping/detail'
import { listSubject } from '@/apis/bookkeeping/subject'
import { listUserDict } from '@/apis/system/user'
import { type ColumnItem, GiForm } from '@/components/GiForm'
import { useResetReactive } from '@/hooks'
import type { LabelValueState } from '@/types/global'

const emit = defineEmits<{
  (e: 'save-success'): void
}>()

const { width } = useWindowSize()

const dataId = ref('')
const visible = ref(false)
const isUpdate = computed(() => !!dataId.value)
const title = computed(() => (isUpdate.value ? '修改明细' : '新增明细'))
const formRef = ref<InstanceType<typeof GiForm>>()

/** 用户选项列表 */
const userOptions = ref<LabelValueState[]>([])
/** 科目选项列表 */
const subjectOptions = ref<LabelValueState[]>([])

const [form, resetForm] = useResetReactive({
  detailDate: new Date().toISOString().slice(0, 10),
})

const columns: ColumnItem[] = reactive([
  {
    label: '所属用户',
    field: 'userId',
    type: 'select',
    span: 24,
    required: true,
    props: {
      options: userOptions,
      placeholder: '请选择所属用户',
      allowSearch: true,
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
      placeholder: '请选择所属科目',
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
  if (subjectOptions.value.length) return
  const { data } = await listSubject({ sort: ['sort,asc'], page: 1, size: 200 } as any)
  subjectOptions.value = data.list.map((item: any) => ({
    label: `${item.name}（${item.category === 'expense' ? '支出' : '收入'}）`,
    value: item.id,
  }))
}

/** 重置 */
const reset = () => {
  formRef.value?.formRef?.resetFields()
  resetForm()
}

/** 保存 */
const save = async () => {
  try {
    const isInvalid = await formRef.value?.formRef?.validate()
    if (isInvalid) return false
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
  await Promise.all([loadUserOptions(), loadSubjectOptions()])
  visible.value = true
}

/** 修改 */
const onUpdate = async (id: string) => {
  reset()
  dataId.value = id
  await Promise.all([loadUserOptions(), loadSubjectOptions()])
  const { data } = await getDetail(id)
  // 金额取绝对值回显（后端存储带正负号）
  if (data.amount != null) {
    data.amount = Math.abs(data.amount) as any
  }
  Object.assign(form, data)
  visible.value = true
}

defineExpose({ onAdd, onUpdate })
</script>

<style scoped lang="scss"></style>
