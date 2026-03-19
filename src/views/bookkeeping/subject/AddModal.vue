<template>
  <a-modal
    v-model:visible="visible"
    :title="title"
    :mask-closable="false"
    :esc-to-close="false"
    :width="width >= 500 ? 500 : '100%'"
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
 * 科目新增/编辑弹窗
 *
 * @author Wangsongsong
 * @date 2026-03-18
 * @update 2026-03-19 @Wangsongsong
 * @desc 所属分类字段从下拉选择改为单选按钮
 * @update 2026-03-19 @Wangsongsong
 * @desc 使用框架 isMobile 方法判断移动端,移动端垂直布局,PC端水平布局,优化移动端表单样式
 */
import { Message } from '@arco-design/web-vue'
import { useWindowSize } from '@vueuse/core'
import { computed, reactive, ref } from 'vue'
import { addSubject, getSubject, updateSubject } from '@/apis/bookkeeping/subject'
import { type ColumnItem, GiForm } from '@/components/GiForm'
import { useResetReactive } from '@/hooks'
import { useDict } from '@/hooks/app'
import { isMobile } from '@/utils'

const emit = defineEmits<{
  (e: 'save-success'): void
}>()

const { width } = useWindowSize()
const { bk_subject_category } = useDict('bk_subject_category')

/** 表单布局：移动端垂直排列，PC端水平排列 */
const formLayout = computed(() => (isMobile() ? 'vertical' : 'horizontal'))

/** 表单尺寸：移动端大号，PC端大号 */
const formSize = computed(() => (isMobile() ? 'large' : 'large'))

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
    type: 'radio-group',
    span: 24,
    rules: [{ required: true, message: '请选择所属分类' }],
    props: {
      options: bk_subject_category,
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
