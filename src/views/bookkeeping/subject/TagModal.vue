<template>
  <a-modal
    v-model:visible="visible"
    :title="title"
    :mask-closable="false"
    :esc-to-close="false"
    :width="width >= 560 ? 560 : '100%'"
    :class="{ 'mobile-modal': isMobile() }"
    draggable
    @before-ok="save"
    @close="reset"
  >
    <a-alert v-if="subjectContext" class="tag-modal__alert" type="info" show-icon>
      <template #title>当前所属科目</template>
      <div class="tag-modal__subject-line">
        <span class="tag-modal__subject-name">{{ subjectContext.name }}</span>
        <a-tag size="small" color="arcoblue">{{ currentSubjectCategoryLabel }}</a-tag>
      </div>
    </a-alert>

    <a-alert v-if="isDefaultTag" class="tag-modal__alert" type="warning" show-icon>
      默认标签由系统兜底使用，不允许改名，也不允许停用。
    </a-alert>

    <GiForm ref="formRef" v-model="form" :columns="columns" :layout="formLayout" :size="formSize">
      <template #icon="{ disabled }">
        <div class="tag-icon-field">
          <BookkeepingSubjectIconSelector
            v-model="form.icon"
            :disabled="disabled"
          />
          <div v-if="form.icon" class="tag-icon-field__preview">
            <div class="tag-icon-field__preview-item">
              <span class="tag-icon-field__preview-label">Web</span>
              <BookkeepingSubjectIcon :icon="form.icon" mode="web" :size="18" />
            </div>
            <div class="tag-icon-field__preview-item">
              <span class="tag-icon-field__preview-label">移动端</span>
              <BookkeepingSubjectIcon :icon="form.icon" mode="mobile" :size="18" />
            </div>
          </div>
        </div>
      </template>
    </GiForm>
  </a-modal>
</template>

<script setup lang="ts">
/**
 * 科目标签新增/编辑弹窗
 *
 * 当前弹窗只服务于“右侧标签列表”，因此所属科目不在表单内切换，
 * 而是直接绑定当前选中的科目，避免出现跨科目误操作。
 */
import { Message } from '@arco-design/web-vue'
import { useWindowSize } from '@vueuse/core'
import { computed, reactive, ref } from 'vue'
import type { SubjectTagReq } from '@/apis/bookkeeping/subject-tag'
import {
  addSubjectTag,
  getSubjectTag,
  updateSubjectTag,
} from '@/apis/bookkeeping/subject-tag'
import type { SubjectResp } from '@/apis/bookkeeping/subject'
import BookkeepingSubjectIcon from '@/components/BookkeepingSubjectIcon/index.vue'
import BookkeepingSubjectIconSelector from '@/components/BookkeepingSubjectIconSelector/index.vue'
import { type ColumnItem, GiForm } from '@/components/GiForm'
import { useResetReactive } from '@/hooks'
import { useDict } from '@/hooks/app'
import { isMobile } from '@/utils'

type SubjectContext = Pick<SubjectResp, 'id' | 'name' | 'category'>

const emit = defineEmits<{
  (e: 'save-success'): void
}>()

const { width } = useWindowSize()
const { bk_subject_category } = useDict('bk_subject_category')

const formLayout = computed(() => (isMobile() ? 'vertical' : 'horizontal'))
const formSize = computed(() => (isMobile() ? 'large' : 'large'))

const dataId = ref('')
const visible = ref(false)
const formRef = ref<InstanceType<typeof GiForm>>()
const subjectContext = ref<SubjectContext | null>(null)
const isDefaultTag = ref(false)

const isUpdate = computed(() => !!dataId.value)
const title = computed(() => (isUpdate.value ? '编辑标签' : '新增标签'))

const [form, resetForm] = useResetReactive({
  subjectId: '',
  name: '',
  icon: '',
  sort: 999,
  status: 1 as 1 | 2,
})

const categoryLabelMap = computed(() => {
  return Object.fromEntries(
    (bk_subject_category.value || []).map((item) => [String(item.value), item.label]),
  ) as Record<string, string>
})

const currentSubjectCategoryLabel = computed(() => {
  if (!subjectContext.value) {
    return ''
  }
  return categoryLabelMap.value[subjectContext.value.category] || subjectContext.value.category
})

const columns: ColumnItem[] = reactive([
  {
    label: '标签名称',
    field: 'name',
    type: 'input',
    span: 24,
    required: true,
    props: {
      maxLength: 30,
      placeholder: '请输入标签名称',
    },
    disabled: () => isDefaultTag.value,
  },
  {
    label: '图标',
    field: 'icon',
    type: 'input',
    span: 24,
    required: true,
    props: {
      maxLength: 50,
      placeholder: '请选择图标',
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
      uncheckedText: '停用',
    },
    disabled: () => isDefaultTag.value,
  },
])

/** 统一重置弹窗状态，避免上一次编辑残留到下一次打开。 */
const reset = () => {
  formRef.value?.formRef?.resetFields()
  resetForm()
  dataId.value = ''
  subjectContext.value = null
  isDefaultTag.value = false
}

/** 保存时强制写回当前科目，防止编辑弹窗发生跨科目提交。 */
const save = async () => {
  if (!subjectContext.value) {
    Message.warning('请先选择一个科目')
    return false
  }
  try {
    form.subjectId = subjectContext.value.id
    const isInvalid = await formRef.value?.formRef?.validate()
    if (isInvalid) {
      return false
    }
    if (isUpdate.value) {
      await updateSubjectTag(form as SubjectTagReq, dataId.value)
      Message.success('标签修改成功')
    } else {
      await addSubjectTag(form as SubjectTagReq)
      Message.success('标签新增成功')
    }
    emit('save-success')
    return true
  } catch {
    return false
  }
}

/** 打开新增弹窗，直接继承当前选中科目。 */
const onAdd = (subject: SubjectResp) => {
  reset()
  subjectContext.value = {
    id: subject.id,
    name: subject.name,
    category: subject.category,
  }
  form.subjectId = subject.id
  visible.value = true
}

/** 打开编辑弹窗，并带出标签详情。 */
const onUpdate = async (subject: SubjectResp, id: string) => {
  reset()
  subjectContext.value = {
    id: subject.id,
    name: subject.name,
    category: subject.category,
  }
  dataId.value = id
  const { data } = await getSubjectTag(id)
  isDefaultTag.value = data.isDefault
  Object.assign(form, {
    subjectId: subject.id,
    name: data.name,
    icon: data.icon,
    sort: data.sort,
    status: data.status,
  })
  visible.value = true
}

defineExpose({ onAdd, onUpdate })
</script>

<style scoped lang="scss">
.mobile-modal {
  :deep(.arco-modal-body) {
    padding: 12px;
  }
}

.tag-modal__alert {
  margin-bottom: 16px;
}

.tag-modal__subject-line {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.tag-modal__subject-name {
  color: var(--color-text-1);
  font-weight: 600;
}

.tag-icon-field {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.tag-icon-field__preview {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  border-radius: 10px;
  background: var(--color-fill-1);
  padding: 10px 12px;
}

.tag-icon-field__preview-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--color-text-2);
  font-size: 12px;
}

.tag-icon-field__preview-label {
  color: var(--color-text-3);
}
</style>
