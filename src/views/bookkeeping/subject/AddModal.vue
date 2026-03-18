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
 * 科目新增/编辑弹窗
 *
 * @author Wangsongsong
 * @date 2026-03-18
 */
import { Message } from '@arco-design/web-vue'
import { useWindowSize } from '@vueuse/core'
import { addSubject, getSubject, updateSubject } from '@/apis/bookkeeping/subject'
import { type ColumnItem, GiForm } from '@/components/GiForm'
import { useResetReactive } from '@/hooks'
import { useDict } from '@/hooks/app'

const emit = defineEmits<{
  (e: 'save-success'): void
}>()

const { width } = useWindowSize()
const { bk_subject_category } = useDict('bk_subject_category')

const dataId = ref('')
const visible = ref(false)
const isUpdate = computed(() => !!dataId.value)
const title = computed(() => (isUpdate.value ? '修改科目' : '新增科目'))
const formRef = ref<InstanceType<typeof GiForm>>()

/** 是否为默认类型（修改时用于禁用字段） */
const isDefaultSubject = ref(false)

const [form, resetForm] = useResetReactive({
  sort: 999,
  status: 1,
})

const columns: ColumnItem[] = reactive([
  {
    label: '类型名称',
    field: 'name',
    type: 'input',
    span: 24,
    required: true,
    props: {
      maxLength: 30,
      placeholder: '请输入类型名称',
    },
    disabled: () => isDefaultSubject.value,
  },
  {
    label: '所属分类',
    field: 'category',
    type: 'select',
    span: 24,
    required: true,
    options: bk_subject_category,
    props: {
      placeholder: '请选择所属分类',
    },
    disabled: () => isDefaultSubject.value,
  },
  {
    label: '图标',
    field: 'icon',
    type: 'input',
    span: 24,
    props: {
      maxLength: 50,
      placeholder: '请输入图标标识',
    },
  },
  {
    label: '排序',
    field: 'sort',
    type: 'input-number',
    span: 24,
    props: {
      min: 0,
      mode: 'button',
    },
  },
  {
    label: '状态',
    field: 'status',
    type: 'switch',
    span: 24,
    props: {
      type: 'round',
      checkedValue: 1,
      uncheckedValue: 2,
      checkedText: '启用',
      uncheckedText: '禁用',
    },
  },
])

/** 重置 */
const reset = () => {
  formRef.value?.formRef?.resetFields()
  resetForm()
  isDefaultSubject.value = false
}

/** 保存 */
const save = async () => {
  try {
    const isInvalid = await formRef.value?.formRef?.validate()
    if (isInvalid) return false
    if (isUpdate.value) {
      await updateSubject(form, dataId.value)
      Message.success('修改成功')
    } else {
      await addSubject(form)
      Message.success('新增成功')
    }
    emit('save-success')
    return true
  } catch (error) {
    return false
  }
}

/** 新增 */
const onAdd = () => {
  reset()
  dataId.value = ''
  visible.value = true
}

/** 修改 */
const onUpdate = async (id: string) => {
  reset()
  dataId.value = id
  const { data } = await getSubject(id)
  isDefaultSubject.value = data.isDefault
  Object.assign(form, data)
  visible.value = true
}

defineExpose({ onAdd, onUpdate })
</script>

<style scoped lang="scss"></style>
