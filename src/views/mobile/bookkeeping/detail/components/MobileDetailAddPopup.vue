<template>
  <t-popup
    v-model:visible="popupVisible"
    placement="bottom"
    destroy-on-close
    class="mobile-detail-popup"
  >
    <div class="mobile-detail-popup__panel">
      <div class="mobile-detail-popup__header">
        <div>
          <p class="mobile-detail-popup__eyebrow">移动端独立表单</p>
          <h3 class="mobile-detail-popup__title">{{ popupTitle }}</h3>
        </div>
        <button class="mobile-detail-popup__close" type="button" @click="popupVisible = false">
          关闭
        </button>
      </div>

      <t-loading :loading="optionsLoading">
        <div class="mobile-detail-popup__form">
          <div v-if="isAdmin" class="mobile-field">
            <label class="mobile-field__label">记账用户</label>
            <select v-model="form.userId" class="mobile-select">
              <option value="">请选择用户</option>
              <option v-for="item in userOptions" :key="item.value" :value="item.value">
                {{ item.label }}
              </option>
            </select>
          </div>

          <div class="mobile-field">
            <label class="mobile-field__label">分类</label>
            <div class="mobile-detail-popup__chips">
              <button
                v-for="item in bkSubjectCategory"
                :key="item.value"
                type="button"
                class="mobile-chip"
                :class="{ 'is-active': form.category === String(item.value) }"
                @click="handleCategoryChange(String(item.value))"
              >
                {{ item.label }}
              </button>
            </div>
          </div>

          <div class="mobile-field">
            <label class="mobile-field__label">所属科目</label>
            <select v-model="form.subjectId" class="mobile-select">
              <option value="">请选择科目</option>
              <option v-for="item in subjectOptions" :key="item.value" :value="item.value">
                {{ item.label }}
              </option>
            </select>
          </div>

          <div class="mobile-field">
            <label class="mobile-field__label">所属标签</label>
            <select v-model="form.tagId" class="mobile-select" :disabled="!form.subjectId">
              <option v-for="item in tagOptions" :key="String(item.value)" :value="item.value">
                {{ item.label }}
              </option>
            </select>
          </div>

          <div class="mobile-field">
            <label class="mobile-field__label">明细名称</label>
            <input
              v-model.trim="form.name"
              class="mobile-input"
              type="text"
              maxlength="100"
              placeholder="请输入明细名称"
            />
          </div>

          <div class="mobile-field">
            <label class="mobile-field__label">金额</label>
            <input
              v-model="form.amount"
              class="mobile-input"
              type="number"
              min="0.01"
              step="0.01"
              placeholder="请输入金额"
            />
          </div>

          <div class="mobile-field">
            <label class="mobile-field__label">明细日期</label>
            <input v-model="form.detailDate" class="mobile-input" type="date" />
          </div>

          <div class="mobile-field">
            <label class="mobile-field__label">备注</label>
            <textarea
              v-model.trim="form.remark"
              class="mobile-textarea"
              maxlength="200"
              placeholder="选填，补充说明这笔明细"
            />
          </div>

          <label v-if="canManageHidden" class="mobile-detail-popup__switch">
            <span>隐私模式下隐藏该明细</span>
            <input v-model="hiddenChecked" type="checkbox" />
          </label>

          <div class="mobile-form-actions">
            <t-button block variant="outline" size="large" @click="popupVisible = false">
              取消
            </t-button>
            <t-button block theme="primary" size="large" :loading="submitting" @click="handleSubmit">
              {{ submitButtonText }}
            </t-button>
          </div>
        </div>
      </t-loading>
    </div>
  </t-popup>
</template>

<script setup lang="ts">
/**
 * 移动端明细新增/编辑弹层
 *
 * @author Wangsongsong
 * @date 2026-03-21
 * @update 2026-03-21 @Wangsongsong
 * @desc 补充编辑态回填，并复用共享的用户选项加载逻辑
 * @update 2026-03-22 @Wangsongsong
 * @desc 移动端表单提示统一改为使用 TDesign Toast
 * @update 2026-03-22 @Wangsongsong
 * @desc 统一旧版移动弹层的背景与眉标配色，避免与当前黄色系新框架冲突
 */
import { computed, reactive, ref, watch } from 'vue'
import { addDetail, getDetail, updateDetail } from '@/apis/bookkeeping/detail'
import { listSubject } from '@/apis/bookkeeping/subject'
import { listSubjectTagAll } from '@/apis/bookkeeping/subject-tag'
import type { SubjectResp, SubjectTagResp } from '@/apis/bookkeeping/type'
import { useDict } from '@/hooks/app'
import { usePrivacyStore, useUserStore } from '@/stores'
import { mobileToast } from '@/utils/mobile-toast'
import has from '@/utils/has'
import { useDetailUserOptions } from '@/views/bookkeeping/shared/useDetailUserOptions'

interface Props {
  visible: boolean
  detailId?: string
}

defineOptions({ name: 'MobileDetailAddPopup' })
const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'save-success'): void
}>()

const userStore = useUserStore()
const privacyStore = usePrivacyStore()
const { bk_subject_category: bkSubjectCategory } = useDict('bk_subject_category')
const { isAdmin, userOptions, loadUserOptions } = useDetailUserOptions()

const popupVisible = computed({
  get: () => props.visible,
  set: (value: boolean) => emit('update:visible', value),
})
const currentDetailId = computed(() => props.detailId || '')
const isUpdate = computed(() => !!currentDetailId.value)
const popupTitle = computed(() => (isUpdate.value ? '编辑明细' : '新增明细'))
const submitButtonText = computed(() => (isUpdate.value ? '保存修改' : '保存'))
const canManageHidden = computed(() => has.hasPermOr(['bk:hide-target:manage']) && privacyStore.isPrivacyMode)

const optionsLoading = ref(false)
const submitting = ref(false)
const allSubjects = ref<SubjectResp[]>([])
const subjectTags = ref<SubjectTagResp[]>([])

const createDefaultForm = () => ({
  userId: userStore.userInfo.id,
  category: '',
  subjectId: '',
  tagId: '',
  name: '',
  amount: '',
  detailDate: new Date().toISOString().slice(0, 10),
  remark: '',
  hidden: 0,
})

const form = reactive(createDefaultForm())

const hiddenChecked = computed({
  get: () => form.hidden === 1,
  set: (value: boolean) => {
    form.hidden = value ? 1 : 0
  },
})

const subjectOptions = computed(() =>
  allSubjects.value
    .filter((item) => !form.category || item.category === form.category)
    .map((item) => ({
      label: item.name,
      value: item.id,
    })),
)
const buildTagLabel = (tag: SubjectTagResp) => {
  const suffixList: string[] = []
  if (tag.isDefault) {
    suffixList.push('默认')
  }
  if (tag.status === 2) {
    suffixList.push('停用')
  }
  return suffixList.length ? `${tag.name}（${suffixList.join(' / ')}）` : tag.name
}
const tagOptions = computed(() => [
  { label: '不选择标签', value: '' },
  ...subjectTags.value.map((item) => ({
    label: buildTagLabel(item),
    value: String(item.id),
  })),
])

const resetForm = () => {
  Object.assign(form, createDefaultForm())
  subjectTags.value = []
}

const loadSubjectOptions = async () => {
  if (allSubjects.value.length) return
  const { data } = await listSubject({ sort: ['sort,asc'], page: 1, size: 200 } as any)
  allSubjects.value = data.list
}

const ensureOptionsLoaded = async () => {
  const tasks: Promise<any>[] = [loadSubjectOptions()]
  if (isAdmin.value) {
    tasks.push(loadUserOptions())
  }
  await Promise.all(tasks)
}

/**
 * 旧版移动弹层虽然当前不是主入口，但仍补齐标签链路，
 * 避免后续临时启用时出现“新增支持、编辑不支持”的断层。
 */
const loadSubjectTagOptions = async (subjectId?: string | number, selectedTagId?: string | number) => {
  if (!subjectId) {
    subjectTags.value = []
    form.tagId = ''
    return
  }
  const keepTagId = String(selectedTagId ?? form.tagId ?? '')
  try {
    const { data } = await listSubjectTagAll({ subjectId: String(subjectId) })
    subjectTags.value = data ?? []
    const exists = subjectTags.value.some((item) => String(item.id) === keepTagId)
    form.tagId = keepTagId && exists ? keepTagId : ''
  } catch {
    subjectTags.value = []
    form.tagId = ''
  }
}

const fillFormByDetail = async (id: string) => {
  const { data } = await getDetail(id)
  Object.assign(form, createDefaultForm(), {
    ...data,
    category: data.subjectCategory || '',
    tagId: data.tagId ? String(data.tagId) : '',
    amount: data.amount != null ? String(Math.abs(Number(data.amount))) : '',
    detailDate: data.detailDate || new Date().toISOString().slice(0, 10),
    hidden: data.hidden ?? 0,
  })
  await loadSubjectTagOptions(form.subjectId, form.tagId)
}

const handleCategoryChange = (category: string) => {
  form.category = category
  form.subjectId = ''
  form.tagId = ''
  subjectTags.value = []
}

const validateForm = () => {
  if (isAdmin.value && !form.userId) {
    mobileToast.warning('请选择记账用户')
    return false
  }
  if (!form.category) {
    mobileToast.warning('请选择分类')
    return false
  }
  if (!form.subjectId) {
    mobileToast.warning('请选择科目')
    return false
  }
  if (!form.name) {
    mobileToast.warning('请输入明细名称')
    return false
  }
  if (!form.amount || Number(form.amount) <= 0) {
    mobileToast.warning('请输入正确的金额')
    return false
  }
  if (!form.detailDate) {
    mobileToast.warning('请选择明细日期')
    return false
  }
  return true
}

const handleSubmit = async () => {
  if (!validateForm()) return

  submitting.value = true
  try {
    const payload = {
      ...form,
      tagId: form.tagId ? form.tagId : null,
      amount: Number(form.amount),
      userId: isAdmin.value ? form.userId : userStore.userInfo.id,
    }

    if (isUpdate.value) {
      await updateDetail(payload, currentDetailId.value)
      mobileToast.success('修改成功')
    } else {
      await addDetail(payload)
      mobileToast.success('新增成功')
    }

    popupVisible.value = false
    emit('save-success')
  } finally {
    submitting.value = false
  }
}

watch([() => props.visible, currentDetailId], async ([visible]) => {
  if (!visible) {
    resetForm()
    return
  }

  resetForm()
  optionsLoading.value = true
  try {
    await ensureOptionsLoaded()
    if (currentDetailId.value) {
      await fillFormByDetail(currentDetailId.value)
    }
  } finally {
    optionsLoading.value = false
  }
})

watch(
  () => form.subjectId,
  async (value, oldValue) => {
    if (!value) {
      form.tagId = ''
      subjectTags.value = []
      return
    }
    if (value !== oldValue) {
      form.tagId = ''
    }
    await loadSubjectTagOptions(value, form.tagId)
  },
)
</script>

<style scoped lang="scss">
.mobile-detail-popup__panel {
  padding: 18px 16px calc(24px + env(safe-area-inset-bottom));
  border-radius: 24px 24px 0 0;
  background:
    radial-gradient(circle at top right, rgba(255, 214, 98, 0.22) 0%, transparent 38%),
    linear-gradient(180deg, #fffdf7 0%, #fbf2df 100%);
  box-shadow: 0 -12px 28px rgba(130, 90, 22, 0.12);
}

.mobile-detail-popup__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 18px;
}

.mobile-detail-popup__eyebrow {
  margin: 0 0 6px;
  color: var(--mobile-brand);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.mobile-detail-popup__title {
  margin: 0;
  color: var(--color-text-1);
  font-size: 22px;
  font-weight: 700;
}

.mobile-detail-popup__close {
  padding: 0;
  border: none;
  background: transparent;
  color: var(--color-text-3);
  font-size: 14px;
}

.mobile-detail-popup__form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.mobile-detail-popup__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.mobile-detail-popup__switch {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  border: 1px solid rgba(143, 99, 17, 0.1);
  border-radius: 16px;
  background: rgba(255, 252, 244, 0.84);
  color: var(--color-text-2);
  font-size: 14px;
}

.mobile-detail-popup__switch input {
  width: 18px;
  height: 18px;
}
</style>
