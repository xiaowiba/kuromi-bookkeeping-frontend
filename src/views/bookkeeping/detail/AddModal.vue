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
    <DetailForm ref="formRef" @save-success="onSaveSuccess" />
  </a-modal>
</template>

<script setup lang="ts">
/**
 * 明细新增/编辑弹窗外壳
 */
import { computed, ref, nextTick } from 'vue'
import { isMobile } from '@/utils'
import DetailForm from './DetailForm.vue'

const emit = defineEmits<{
  (e: 'save-success'): void
}>()

const visible = ref(false)
const dataId = ref('')
const isUpdate = computed(() => !!dataId.value)
const title = computed(() => (isUpdate.value ? '修改明细' : '新增明细'))
const formRef = ref<InstanceType<typeof DetailForm>>()

const reset = () => {
  formRef.value?.reset()
}

const save = async () => {
  const success = await formRef.value?.save()
  return success === true
}

const onSaveSuccess = () => {
  emit('save-success')
  visible.value = false
}

const onAdd = async () => {
  dataId.value = ''
  visible.value = true
  await nextTick()
  await formRef.value?.onAdd()
}

const onAddForUser = async (options: any) => {
  dataId.value = ''
  visible.value = true
  await nextTick()
  await formRef.value?.onAddForUser(options)
}

const onUpdate = async (id: string) => {
  dataId.value = id
  visible.value = true
  await nextTick()
  await formRef.value?.onUpdate(id)
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
</style>
