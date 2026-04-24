<template>
  <div v-if="popupVisible" class="mobile-direct-create-overlay">
    <div class="mobile-direct-create">
      <MobileDetailFormSkeleton
        v-if="optionsLoading"
        :show-user-field="isAdmin"
        :show-switch-field="canManageHidden"
      />
      <template v-else>
        <div ref="bodyRef" class="mobile-direct-create__body">
          <div class="mobile-direct-create__intro">
            <p class="mobile-direct-create__eyebrow">{{ popupEyebrow }}</p>
            <h3 class="mobile-direct-create__title">{{ popupTitle }}</h3>
          </div>

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
            <div class="mobile-direct-create__category-group" role="radiogroup" aria-label="分类">
              <t-button
                v-for="item in categoryOptions"
                :key="item.value"
                block
                size="large"
                variant="text"
                class="mobile-direct-create__category-btn"
                :class="{ 'is-active': form.category === item.value }"
                @click="handleCategoryChange(item.value)"
              >
                {{ item.label }}
              </t-button>
            </div>
          </div>

          <div class="mobile-field">
            <label class="mobile-field__label">科目</label>
            <t-button
              block
              size="large"
              variant="text"
              class="mobile-direct-create__selector-field"
              :class="{ 'is-disabled': !form.category }"
              @click="openSubjectPicker"
            >
              <span
                class="mobile-direct-create__field-main"
                :class="{ 'is-placeholder': !selectedSubjectName }"
              >
                {{ selectedSubjectName || '请选择科目' }}
              </span>
              <template #suffix>
                <small class="mobile-direct-create__field-side">
                  {{ form.category ? '点击选择' : '请先选择分类' }}
                </small>
              </template>
            </t-button>
          </div>

          <div class="mobile-field">
            <label class="mobile-field__label">标签</label>
            <t-button
              block
              size="large"
              variant="text"
              class="mobile-direct-create__selector-field"
              :class="{ 'is-disabled': !form.subjectId }"
              @click="openTagPicker"
            >
              <span
                class="mobile-direct-create__field-main"
                :class="{ 'is-placeholder': !form.subjectId }"
              >
                {{ selectedTagLabel }}
              </span>
              <template #suffix>
                <small class="mobile-direct-create__field-side">
                  {{ form.subjectId ? '点击选择' : '请先选择科目' }}
                </small>
              </template>
            </t-button>
          </div>

          <div class="mobile-field">
            <label class="mobile-field__label">明细名称</label>
            <t-input
              v-model="form.name"
              class="mobile-direct-create__td-control mobile-direct-create__name-input"
              placeholder="请输入明细名称"
              :maxlength="MAX_DETAIL_NAME_LENGTH"
              clearable
            />
          </div>

          <div class="mobile-field">
            <label class="mobile-field__label">金额</label>
            <t-button block size="large" variant="text" class="mobile-direct-create__value-field" @click="amountKeyboardVisible = true">
              <span class="mobile-direct-create__field-main mobile-direct-create__value-text">
                {{ form.amount ? `￥ ${form.amount}` : '￥ 0' }}
              </span>
              <template #suffix>
                <small class="mobile-direct-create__value-placeholder">
                  {{ form.amount ? '已录入金额' : '点击输入金额' }}
                </small>
              </template>
            </t-button>
          </div>

          <div class="mobile-field">
            <label class="mobile-field__label">明细日期</label>
            <t-button block size="large" variant="text" class="mobile-direct-create__value-field" @click="openDatePicker">
              <span class="mobile-direct-create__field-main mobile-direct-create__value-text">
                {{ form.detailDate || '请选择日期' }}
              </span>
              <template #suffix>
                <small class="mobile-direct-create__value-placeholder">点击选择</small>
              </template>
            </t-button>
          </div>

          <div class="mobile-field">
            <label class="mobile-field__label">支付方式</label>
            <t-button block size="large" variant="text" class="mobile-direct-create__selector-field" @click="openPaymentPicker">
              <span class="mobile-direct-create__field-main">
                {{ selectedPaymentMethodLabel }}
              </span>
              <template #suffix>
                <small class="mobile-direct-create__field-side">点击选择</small>
              </template>
            </t-button>
          </div>

          <div class="mobile-field">
            <label class="mobile-field__label">支付账号</label>
            <t-button block size="large" variant="text" class="mobile-direct-create__selector-field" @click="openPaymentAccountPicker">
              <span
                class="mobile-direct-create__field-main"
                :class="{ 'is-placeholder': !selectedPaymentAccountName }"
              >
                {{ selectedPaymentAccountName || '请选择支付账号' }}
              </span>
              <template #suffix>
                <small class="mobile-direct-create__field-side">点击选择</small>
              </template>
            </t-button>
          </div>

          <div class="mobile-field">
            <label class="mobile-field__label">{{ necessaryFieldLabel }}</label>
            <div class="mobile-direct-create__necessary-group" role="radiogroup" :aria-label="necessaryFieldLabel">
              <t-button
                v-for="item in isNecessaryOptions"
                :key="item.value"
                block
                size="large"
                variant="text"
                class="mobile-direct-create__necessary-btn"
                :class="{ 'is-active': Number(form.isNecessary) === Number(item.value) }"
                role="radio"
                :aria-checked="Number(form.isNecessary) === Number(item.value)"
                @click="form.isNecessary = Number(item.value)"
              >
                {{ item.label }}
              </t-button>
            </div>
          </div>

          <div class="mobile-field">
            <label class="mobile-field__label">备注</label>
            <t-textarea
              v-model="form.remark"
              class="mobile-direct-create__td-control"
              placeholder="选填，补充这笔明细的说明"
              :maxlength="MAX_DETAIL_REMARK_LENGTH"
              :indicator="true"
              :autosize="{ minRows: 1, maxRows: 2 }"
            />
          </div>

          <div v-if="canManageHidden" class="mobile-direct-create__switch-card">
            <div>
              <p class="mobile-direct-create__switch-title">隐藏此笔</p>
              <!-- small class="mobile-direct-create__switch-desc">当前已进入隐私模式，可选择隐藏本次明细</small -->
            </div>
            <t-switch
              v-model="form.hidden"
              size="large"
              :custom-value="[1, 0]"
            />
          </div>
        </div>
      </template>

      <div v-if="!optionsLoading" class="mobile-direct-create__footer">
        <t-button block variant="outline" size="large" @click="handleClose">
          取消
        </t-button>
        <t-button block theme="primary" size="large" :loading="submitting" @click="handleSubmit">
          {{ submitButtonText }}
        </t-button>
      </div>
    </div>
  </div>

  <t-popup
    v-model:visible="subjectPickerVisible"
    placement="bottom"
    :prevent-scroll-through="true"
    :close-btn="true"
    :destroy-on-close="true"
    :z-index="SUBJECT_PICKER_POPUP_Z_INDEX"
    :show-overlay="true"
    :overlay-props="subjectPickerOverlayProps"
    :close-on-overlay-click="true"
  >
    <div class="mobile-option-picker">
      <div class="mobile-option-picker__header">
        <div>
          <p class="mobile-option-picker__eyebrow">{{ selectedCategoryLabel }}</p>
          <h3 class="mobile-option-picker__title">选择科目</h3>
        </div>
        <!-- t-button size="large" variant="text" class="mobile-option-picker__header-btn" @click="subjectPickerVisible = false">
          取消
        </t-button -->
      </div>

      <div class="mobile-option-picker__body">
        <div v-if="subjectOptions.length" class="mobile-option-picker__subject-grid">
          <t-button
            v-for="item in subjectOptions"
            :key="item.id"
            block
            size="large"
            variant="text"
            class="mobile-option-picker__subject-card"
            :class="{ 'is-active': tempSubjectId === item.id }"
            @click="handleSubjectSelect(item.id)"
          >
            <span class="mobile-option-picker__subject-card-content">
              <span class="mobile-option-picker__subject-icon">
                <BookkeepingSubjectIcon
                  :icon="item.icon"
                  mode="mobile"
                  size="0.8rem"
                />
              </span>
              <span class="mobile-option-picker__subject-name">{{ item.name }}</span>
            </span>
          </t-button>
        </div>

        <div v-else class="mobile-option-picker__empty">
          当前分类下暂无可用科目
        </div>
      </div>
    </div>
  </t-popup>

  <t-popup
    v-model:visible="tagPickerVisible"
    placement="bottom"
    :prevent-scroll-through="true"
    :close-btn="true"
    :destroy-on-close="true"
    :z-index="TAG_PICKER_POPUP_Z_INDEX"
    :show-overlay="true"
    :overlay-props="tagPickerOverlayProps"
    :close-on-overlay-click="true"
  >
    <div class="mobile-option-picker">
      <div class="mobile-option-picker__header">
        <div>
          <p class="mobile-option-picker__eyebrow">{{ selectedSubjectName || '当前科目' }}</p>
          <h3 class="mobile-option-picker__title">选择标签</h3>
        </div>
      </div>

      <div class="mobile-option-picker__body">
        <div class="mobile-option-picker__subject-grid mobile-option-picker__tag-grid">
          <t-button
            v-for="item in tagPickerOptions"
            :key="`tag-${item.id || 'empty'}`"
            block
            size="large"
            variant="text"
            class="mobile-option-picker__subject-card mobile-option-picker__tag-card"
            :class="{
              'is-active': tempTagId === item.id,
              'is-disabled': item.disabled,
            }"
            :disabled="item.disabled"
            @click="handleTagSelect(item.id)"
          >
            <span class="mobile-option-picker__subject-card-content">
              <span class="mobile-option-picker__subject-icon mobile-option-picker__tag-icon">
                <BookkeepingSubjectIcon
                  :icon="item.icon || 'general'"
                  mode="mobile"
                  size="0.8rem"
                />
              </span>
              <span class="mobile-option-picker__subject-name" :title="item.label">
                {{ item.name }}
              </span>
            </span>
          </t-button>
        </div>
      </div>
    </div>
  </t-popup>

  <t-popup
    v-model:visible="paymentPickerVisible"
    placement="bottom"
    :prevent-scroll-through="true"
    :close-btn="true"
    :destroy-on-close="true"
    :z-index="PAYMENT_PICKER_POPUP_Z_INDEX"
    :show-overlay="true"
    :overlay-props="paymentPickerOverlayProps"
    :close-on-overlay-click="true"
  >
    <div class="mobile-option-picker">
      <div class="mobile-option-picker__header">
        <div>
          <p class="mobile-option-picker__eyebrow">支付方式</p>
          <h3 class="mobile-option-picker__title">选择支付方式</h3>
        </div>
        <!-- t-button size="large" variant="text" class="mobile-option-picker__header-btn" @click="paymentPickerVisible = false">
          取消
        </t-button -->
      </div>

      <div class="mobile-option-picker__body">
        <div class="mobile-option-picker__payment-grid">
          <t-button
            v-for="item in paymentMethodOptions"
            :key="item.value"
            block
            size="large"
            variant="text"
            class="mobile-option-picker__payment-option"
            :class="{ 'is-active': tempPaymentMethod === item.value }"
            @click="handlePaymentMethodSelect(item.value)"
          >
            <span class="mobile-option-picker__payment-option-content">
              <span class="mobile-option-picker__payment-circle">
                {{ resolvePaymentMethodMarker(item.label) }}
              </span>
              <span class="mobile-option-picker__payment-label">{{ item.label }}</span>
            </span>
          </t-button>
        </div>
      </div>
    </div>
  </t-popup>

  <t-popup
    v-model:visible="paymentAccountPickerVisible"
    placement="bottom"
    :prevent-scroll-through="true"
    :close-btn="true"
    :destroy-on-close="true"
    :z-index="PAYMENT_ACCOUNT_PICKER_POPUP_Z_INDEX"
    :show-overlay="true"
    :overlay-props="paymentAccountPickerOverlayProps"
    :close-on-overlay-click="true"
  >
    <div class="mobile-option-picker">
      <div class="mobile-option-picker__header">
        <div>
          <p class="mobile-option-picker__eyebrow">支付账号</p>
          <h3 class="mobile-option-picker__title">选择支付账号</h3>
        </div>
      </div>

      <div class="mobile-option-picker__body">
        <div class="mobile-option-picker__payment-grid">
          <t-button
            v-for="item in paymentAccountOptions"
            :key="item.value"
            block
            size="large"
            variant="text"
            class="mobile-option-picker__payment-option"
            :class="{ 'is-active': tempPaymentAccountId === item.value }"
            @click="handlePaymentAccountSelect(item.value)"
          >
            <span class="mobile-option-picker__payment-option-content">
              <span class="mobile-option-picker__payment-circle">
                {{ resolvePaymentAccountMarker(item.label) }}
              </span>
              <span class="mobile-option-picker__payment-label">{{ item.label }}</span>
            </span>
          </t-button>
        </div>
      </div>
    </div>
  </t-popup>

  <t-popup
    v-model:visible="datePickerVisible"
    placement="bottom"
    :prevent-scroll-through="true"
    destroy-on-close
    :z-index="DATE_PICKER_POPUP_Z_INDEX"
    :show-overlay="true"
    :overlay-props="datePickerOverlayProps"
    :close-on-overlay-click="true"
  >
    <div class="mobile-direct-create__picker-popup">
      <t-date-time-picker
        :default-value="datePickerValue"
        title="选择日期"
        format="YYYY-MM-DD"
        mode="date"
        @confirm="handleDateConfirm"
        @cancel="handleDateCancel"
      />
    </div>
  </t-popup>

  <MobileAmountKeyboard
    v-model:visible="amountKeyboardVisible"
    v-model="form.amount"
  />
</template>

<script setup lang="ts">
/**
 * 移动端直接填写明细弹层
 *
 * @author Wangsongsong
 * @date 2026-03-27
 * @update 2026-03-27 @Wangsongsong
 * @desc 新增移动端直达填写明细交互，新增与编辑入口复用同一表单组件，在表单内通过 Popup 选择分类科目和支付方式
 */
import dayjs from 'dayjs'
import { computed, nextTick, reactive, ref, watch } from 'vue'
import MobileAmountKeyboard from './MobileAmountKeyboard.vue'
import MobileDetailFormSkeleton from './MobileDetailFormSkeleton.vue'
import { addDetail, getDetail, updateDetail } from '@/apis/bookkeeping/detail'
import { listSubject } from '@/apis/bookkeeping/subject'
import { listSubjectTagAll } from '@/apis/bookkeeping/subject-tag'
import { listMyPaymentAccount } from '@/apis/bookkeeping/payment-account'
import type { PaymentAccountResp, SubjectResp, SubjectTagResp } from '@/apis/bookkeeping/type'
import BookkeepingSubjectIcon from '@/components/BookkeepingSubjectIcon/index.vue'
import { useDict } from '@/hooks/app'
import { usePrivacyStore, useUserStore } from '@/stores'
import has from '@/utils/has'
import { mobileToast } from '@/utils/mobile-toast'
import { useDetailUserOptions } from '@/views/bookkeeping/shared/useDetailUserOptions'

interface Props {
  visible: boolean
  detailId?: string
}

defineOptions({ name: 'MobileDetailDirectCreatePopup' })
const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'save-success'): void
}>()

const userStore = useUserStore()
const privacyStore = usePrivacyStore()
const { isAdmin, userOptions, loadUserOptions } = useDetailUserOptions()
const {
  bk_subject_category: bkSubjectCategory,
  bk_payment_method: bkPaymentMethod,
  common_yes_no: commonYesNo,
} = useDict('bk_subject_category', 'bk_payment_method', 'common_yes_no')

const MAX_AMOUNT = 999999
const MAX_DETAIL_NAME_LENGTH = 100
const MAX_DETAIL_REMARK_LENGTH = 200
const getToday = () => dayjs().format('YYYY-MM-DD')
const SUBJECT_PICKER_POPUP_Z_INDEX = 1500
const TAG_PICKER_POPUP_Z_INDEX = 1500
const PAYMENT_PICKER_POPUP_Z_INDEX = 1500
const PAYMENT_ACCOUNT_PICKER_POPUP_Z_INDEX = 1500
const DATE_PICKER_POPUP_Z_INDEX = 1550
const subjectPickerOverlayProps = {
  zIndex: SUBJECT_PICKER_POPUP_Z_INDEX - 1,
}
const tagPickerOverlayProps = {
  zIndex: TAG_PICKER_POPUP_Z_INDEX - 1,
}
const paymentPickerOverlayProps = {
  zIndex: PAYMENT_PICKER_POPUP_Z_INDEX - 1,
}
const paymentAccountPickerOverlayProps = {
  zIndex: PAYMENT_ACCOUNT_PICKER_POPUP_Z_INDEX - 1,
}
const datePickerOverlayProps = {
  zIndex: DATE_PICKER_POPUP_Z_INDEX - 1,
}

const bodyRef = ref<HTMLElement | null>(null)
const popupVisible = computed({
  get: () => props.visible,
  set: (value: boolean) => emit('update:visible', value),
})
const currentDetailId = computed(() => props.detailId || '')
const isUpdate = computed(() => !!currentDetailId.value)
const popupEyebrow = computed(() => (isUpdate.value ? '移动端编辑明细' : '移动端新增明细'))
const popupTitle = computed(() => (isUpdate.value ? '编辑明细' : '填写明细'))
const submitButtonText = computed(() => (isUpdate.value ? '保存' : '完成'))

const optionsLoading = ref(false)
const submitting = ref(false)
const allSubjects = ref<SubjectResp[]>([])
const subjectTags = ref<SubjectTagResp[]>([])
const paymentAccounts = ref<PaymentAccountResp[]>([])
const datePickerVisible = ref(false)
const amountKeyboardVisible = ref(false)
const subjectPickerVisible = ref(false)
const tagPickerVisible = ref(false)
const paymentPickerVisible = ref(false)
const paymentAccountPickerVisible = ref(false)
const tempSubjectId = ref('')
const tempTagId = ref('')
const tempPaymentMethod = ref('default')
const tempPaymentAccountId = ref('')
const datePickerValue = ref(getToday())

const canManageHidden = computed(() => has.hasPermOr(['bk:hide-target:manage']) && privacyStore.isPrivacyMode)
const categoryOptions = computed(() =>
  bkSubjectCategory.value.map((item) => ({
    label: String(item.label),
    value: String(item.value),
  })),
)
const paymentMethodOptions = computed(() =>
  bkPaymentMethod.value.map((item) => ({
    label: String(item.label),
    value: String(item.value),
  })),
)
const paymentAccountOptions = computed(() =>
  paymentAccounts.value.map((item) => ({
    label: item.name,
    value: String(item.id),
  })),
)
const yesNoFallbackOptions = [
  { label: '是', value: 1 },
  { label: '否', value: 0 },
]
const isNecessaryOptions = computed(() => {
  const options = commonYesNo.value?.length ? commonYesNo.value : yesNoFallbackOptions
  return options.map((item) => ({
    label: String(item.label ?? ''),
    value: Number(item.value ?? 0),
  }))
})
const necessaryFieldLabel = computed(() => (form.category === 'income' ? '是否必要收入' : '是否必要支出'))

const createDefaultForm = () => ({
  userId: String(userStore.userInfo.id || ''),
  category: '',
  subjectId: '',
  tagId: '',
  name: '',
  amount: '',
  detailDate: getToday(),
  paymentMethod: 'default',
  paymentAccountId: '',
  isNecessary: 1,
  remark: '',
  hidden: 0,
})

const form = reactive(createDefaultForm())

const selectedCategoryLabel = computed(() => {
  const current = categoryOptions.value.find((item) => item.value === form.category)
  return current?.label || '当前分类'
})

const subjectOptions = computed(() =>
  allSubjects.value.filter((item) => item.status === 1 && item.category === form.category),
)

const selectedSubject = computed(() =>
  subjectOptions.value.find((item) => item.id === form.subjectId) || null,
)

const selectedSubjectName = computed(() => selectedSubject.value?.name || '')
const buildSubjectTagLabel = (tag: SubjectTagResp) => {
  const suffixList: string[] = []
  if (tag.isDefault) {
    suffixList.push('默认')
  }
  if (tag.status === 2) {
    suffixList.push('停用')
  }
  return suffixList.length ? `${tag.name}（${suffixList.join(' / ')}）` : tag.name
}
const tagPickerOptions = computed(() => [
  {
    id: '',
    label: '不选择标签',
    name: '不选择标签',
    icon: 'general',
    disabled: false,
  },
  ...subjectTags.value.map((item) => ({
    id: String(item.id),
    name: item.name,
    label: buildSubjectTagLabel(item),
    icon: item.icon || 'general',
    disabled: item.status === 2 && String(item.id) !== tempTagId.value,
  })),
])
const selectedTagLabel = computed(() => {
  if (!form.subjectId) {
    return '请先选择科目'
  }
  if (!form.tagId) {
    return '不选择标签'
  }
  const current = subjectTags.value.find((item) => String(item.id) === String(form.tagId))
  return current ? buildSubjectTagLabel(current) : '不选择标签'
})

const selectedPaymentMethodLabel = computed(() => {
  const current = paymentMethodOptions.value.find((item) => item.value === form.paymentMethod)
  return current?.label || '默认'
})

const selectedPaymentAccountName = computed(() => {
  const current = paymentAccounts.value.find((item) => String(item.id) === String(form.paymentAccountId))
  return current?.name || ''
})

const resolvePaymentMethodMarker = (label: string) => String(label || '').trim().slice(0, 1) || '?'
const resolvePaymentAccountMarker = (label: string) => String(label || '').trim().slice(0, 1) || 'A'

const resetState = () => {
  Object.assign(form, createDefaultForm())
  subjectTags.value = []
  tempSubjectId.value = ''
  tempTagId.value = ''
  tempPaymentMethod.value = form.paymentMethod
  tempPaymentAccountId.value = form.paymentAccountId
  datePickerValue.value = form.detailDate || getToday()
  datePickerVisible.value = false
  amountKeyboardVisible.value = false
  subjectPickerVisible.value = false
  tagPickerVisible.value = false
  paymentPickerVisible.value = false
  paymentAccountPickerVisible.value = false
}

const loadSubjectOptions = async () => {
  if (allSubjects.value.length) return
  const { data } = await listSubject({ sort: ['sort,asc'], page: 1, size: 200 } as any)
  allSubjects.value = data.list ?? []
}

const loadPaymentAccountOptions = async () => {
  if (paymentAccounts.value.length) return paymentAccounts.value
  const { data } = await listMyPaymentAccount()
  paymentAccounts.value = data ?? []
  return paymentAccounts.value
}

/**
 * 加载当前科目下的标签选项。
 *
 * 标签不是必填项，因此这里额外保留一个“不选择标签”的前端空值。
 * 编辑态如果回显的是已停用标签，需要继续保留该标签，避免历史数据无法保存。
 */
const loadSubjectTagOptions = async (subjectId?: string, selectedTagId?: string) => {
  if (!subjectId) {
    subjectTags.value = []
    form.tagId = ''
    tempTagId.value = ''
    return
  }
  const keepTagId = String(selectedTagId ?? form.tagId ?? '')
  try {
    const { data } = await listSubjectTagAll({ subjectId })
    subjectTags.value = data ?? []
    const exists = subjectTags.value.some((item) => String(item.id) === keepTagId)
    form.tagId = keepTagId && exists ? keepTagId : ''
    tempTagId.value = form.tagId
  } catch {
    subjectTags.value = []
    form.tagId = ''
    tempTagId.value = ''
  }
}

const fillFormByDetail = async (id: string) => {
  const { data } = await getDetail(id)
  const matchedSubject = allSubjects.value.find((item) => item.id === data.subjectId)
  const category = data.subjectCategory || matchedSubject?.category || ''
  const name = String(data.name || '')

  Object.assign(form, createDefaultForm(), {
    ...data,
    userId: String(data.userId || userStore.userInfo.id || ''),
    category,
    subjectId: data.subjectId || '',
    tagId: data.tagId ? String(data.tagId) : '',
    name,
    amount: data.amount == null ? '' : String(Math.abs(Number(data.amount))),
    detailDate: data.detailDate || getToday(),
    paymentMethod: data.paymentMethod || 'default',
    paymentAccountId: data.paymentAccountId ? String(data.paymentAccountId) : '',
    isNecessary: Number(data.isNecessary ?? 0),
    remark: data.remark || '',
    hidden: data.hidden ?? 0,
  })

  tempSubjectId.value = form.subjectId
  tempTagId.value = form.tagId
  tempPaymentMethod.value = form.paymentMethod
  tempPaymentAccountId.value = form.paymentAccountId
  datePickerValue.value = form.detailDate || getToday()
  await loadSubjectTagOptions(form.subjectId, form.tagId)
}

const ensureOptionsLoaded = async () => {
  const tasks: Promise<any>[] = [loadSubjectOptions(), loadPaymentAccountOptions()]
  if (isAdmin.value) {
    tasks.push(loadUserOptions())
  }
  return await Promise.all(tasks)
}

const resetSubjectAndName = () => {
  form.subjectId = ''
  form.tagId = ''
  subjectTags.value = []
  tempTagId.value = ''
}

const handleCategoryChange = (category: string) => {
  const changed = form.category !== category
  form.category = category
  if (changed) {
    resetSubjectAndName()
  }
  tempSubjectId.value = form.subjectId
  subjectPickerVisible.value = true
}

const openSubjectPicker = () => {
  if (!form.category) {
    mobileToast.warning('请先选择分类')
    return
  }
  tempSubjectId.value = form.subjectId
  subjectPickerVisible.value = true
}

const applySubjectSelection = async (subjectId: string) => {
  if (!subjectId) return
  const changed = form.subjectId !== subjectId
  tempSubjectId.value = subjectId
  form.subjectId = subjectId
  if (changed) {
    form.tagId = ''
    tempTagId.value = ''
  }
  await loadSubjectTagOptions(subjectId, form.tagId)
}

const handleSubjectSelect = async (subjectId: string) => {
  await applySubjectSelection(subjectId)
  subjectPickerVisible.value = false
}

const openTagPicker = () => {
  if (!form.subjectId) {
    mobileToast.warning('请先选择科目')
    return
  }
  tempTagId.value = form.tagId
  tagPickerVisible.value = true
}

const handleTagSelect = (tagId: string) => {
  tempTagId.value = tagId
  form.tagId = tagId
  tagPickerVisible.value = false
}

const openPaymentPicker = () => {
  tempPaymentMethod.value = form.paymentMethod || 'default'
  paymentPickerVisible.value = true
}

const applyPaymentMethodSelection = (paymentMethod: string) => {
  tempPaymentMethod.value = paymentMethod || 'default'
  form.paymentMethod = tempPaymentMethod.value
}

const handlePaymentMethodSelect = (paymentMethod: string) => {
  applyPaymentMethodSelection(paymentMethod)
  paymentPickerVisible.value = false
}

const openPaymentAccountPicker = () => {
  tempPaymentAccountId.value = form.paymentAccountId || ''
  paymentAccountPickerVisible.value = true
}

const handlePaymentAccountSelect = (paymentAccountId: string) => {
  tempPaymentAccountId.value = paymentAccountId
  form.paymentAccountId = paymentAccountId
  paymentAccountPickerVisible.value = false
}

const openDatePicker = () => {
  datePickerValue.value = form.detailDate || getToday()
  datePickerVisible.value = true
}

const handleDateCancel = () => {
  datePickerVisible.value = false
}

const handleDateConfirm = (value: string | number) => {
  form.detailDate = dayjs(String(value)).format('YYYY-MM-DD')
  datePickerValue.value = form.detailDate
  datePickerVisible.value = false
}

const handleClose = () => {
  popupVisible.value = false
}

const validateForm = () => {
  const name = String(form.name || '').trim()
  const remark = String(form.remark || '').trim()
  const amount = Number(form.amount)

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
  if (!name) {
    mobileToast.warning('请输入明细名称')
    return false
  }
  if (name.length > MAX_DETAIL_NAME_LENGTH) {
    mobileToast.warning(`明细名称最多 ${MAX_DETAIL_NAME_LENGTH} 个字`)
    return false
  }
  if (!form.amount) {
    mobileToast.warning('请输入金额')
    return false
  }
  if (Number.isNaN(amount) || amount <= 0) {
    mobileToast.warning('请输入正确的金额')
    return false
  }
  if (amount > MAX_AMOUNT) {
    mobileToast.warning(`金额不能超过 ${MAX_AMOUNT}`)
    return false
  }
  if (!form.detailDate) {
    mobileToast.warning('请选择明细日期')
    return false
  }
  if (!form.paymentMethod) {
    mobileToast.warning('请选择支付方式')
    return false
  }
  if (!form.paymentAccountId) {
    mobileToast.warning('请选择支付账号')
    return false
  }
  if (form.isNecessary !== 0 && form.isNecessary !== 1) {
    mobileToast.warning('请选择是否必要')
    return false
  }
  if (remark.length > MAX_DETAIL_REMARK_LENGTH) {
    mobileToast.warning(`备注最多 ${MAX_DETAIL_REMARK_LENGTH} 个字`)
    return false
  }
  return true
}

const handleSubmit = async () => {
  if (!validateForm()) return

  const payload = {
    ...form,
    tagId: form.tagId ? form.tagId : undefined,
    name: String(form.name || '').trim(),
    remark: String(form.remark || '').trim(),
    amount: Number(form.amount),
    isNecessary: Number(form.isNecessary ?? 0),
    userId: isAdmin.value ? form.userId : String(userStore.userInfo.id || ''),
  }

  submitting.value = true
  try {
    if (isUpdate.value && currentDetailId.value) {
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

const initializePage = async () => {
  resetState()
  optionsLoading.value = true
  try {
    const results = await ensureOptionsLoaded()
    const accounts = results[1] // loadPaymentAccountOptions 是第二个任务
    if (currentDetailId.value) {
      await fillFormByDetail(currentDetailId.value)
    } else if (accounts && Array.isArray(accounts)) {
      // 新增模式尝试填充默认账号
      const defaultAccount = accounts.find((item) => item.isDefault === 1)
      if (defaultAccount) {
        form.paymentAccountId = String(defaultAccount.id)
        tempPaymentAccountId.value = form.paymentAccountId
      }
    }
  } finally {
    optionsLoading.value = false
    await nextTick()
    bodyRef.value?.scrollTo({ top: 0, behavior: 'auto' })
  }
}

watch(
  [() => props.visible, currentDetailId],
  async ([visible]) => {
    if (!visible) {
      resetState()
      return
    }

    await initializePage()
  },
)
</script>

<style scoped lang="scss">
.mobile-direct-create-overlay {
  position: fixed;
  inset: 0;
  z-index: 1400;
  display: flex;
  flex-direction: column;
  padding: calc(env(safe-area-inset-top) + 0.08rem) 0 calc(env(safe-area-inset-bottom) + 0.08rem);
  box-sizing: border-box;
  background: linear-gradient(180deg, rgba(255, 250, 241, 0.98) 0%, rgba(255, 246, 230, 0.98) 100%);
  overflow: hidden;
  overscroll-behavior: contain;
}

.mobile-direct-create {
  --mobile-direct-create-field-height: 1.18rem;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: none;
  height: calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 0.16rem);
  max-height: calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 0.16rem);
  margin: 0 auto;
  box-sizing: border-box;
  border-radius: 0;
  background: linear-gradient(180deg, #fffaf1 0%, #fff6e6 100%);
  padding: 0.12rem 0 0.12rem;
  // box-shadow: 0 0.16rem 0.44rem rgba(146, 97, 0, 0.12);
  overflow: hidden;
}

.mobile-direct-create__intro {
  display: flex;
  flex-direction: column;
  gap: 0.04rem;
  margin-bottom: 0.02rem;
  padding: 0;
}

.mobile-direct-create__eyebrow {
  margin: 0;
  color: #b47b00;
  font-size: 0.26rem;
  font-weight: 600;
}

.mobile-direct-create__title {
  margin: 0;
  color: #4c3200;
  font-size: 0.44rem;
  font-weight: 700;
  line-height: 1.2;
}

.mobile-option-picker__header-btn {
  border: none;
  border-radius: 999rem;
  background: rgba(255, 255, 255, 0.88);
  color: #7d5a00;
  padding: 0.18rem 0.3rem;
  font-size: 0.28rem;
  font-weight: 700;
  line-height: 1;
  box-shadow: 0 0.08rem 0.2rem rgba(146, 97, 0, 0.08);
}

.mobile-direct-create__body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 0.16rem;
  // padding: 0 0 10px;
  overflow-x: hidden;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  touch-action: pan-y;
  width: calc(100vw - 0.4rem);
  padding: 0.1rem 0.2rem;
}

.mobile-direct-create__body .mobile-field {
  gap: 0.1rem;
}

.mobile-direct-create__body .mobile-field__label {
  font-size: 0.26rem;
  line-height: 1.2;
}

.mobile-direct-create__category-btn,
.mobile-direct-create__selector-field,
.mobile-direct-create__value-field,
.mobile-option-picker__subject-card,
.mobile-option-picker__tag-card,
.mobile-option-picker__payment-option {
  padding: 0;
  min-height: 0;
  box-sizing: border-box;
}

.mobile-direct-create__category-btn::after,
.mobile-direct-create__selector-field::after,
.mobile-direct-create__value-field::after,
.mobile-option-picker__header-btn::after,
.mobile-option-picker__subject-card::after,
.mobile-option-picker__tag-card::after,
.mobile-option-picker__payment-option::after {
  display: none;
}

.mobile-direct-create__category-group {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.2rem;
}

.mobile-direct-create__category-btn,
.mobile-direct-create__necessary-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  // min-height: 0.96rem;
  border: 0.02rem solid rgba(146, 97, 0, 0.12);
  // border-radius: 0.24rem;
  background: rgba(255, 255, 255, 0.92);
  color: #7d5a00;
  // font-size: 0.4rem;
  // font-weight: 700;
  height: 1.12rem;
}

.mobile-direct-create__category-btn.is-active,
.mobile-direct-create__necessary-btn.is-active {
  border-color: rgba(239, 188, 46, 0.35);
  background: linear-gradient(135deg, #f7cf4b 0%, #efbc2e 100%);
  color: #5f4a00;
  box-shadow: 0 0.12rem 0.24rem rgba(239, 188, 46, 0.18);
}

.mobile-direct-create__necessary-group {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.2rem;
}

.mobile-direct-create__selector-field,
.mobile-direct-create__value-field,
.mobile-direct-create__switch-card {
  width: 100%;
  border: 0.02rem solid rgba(146, 97, 0, 0.1);
  border-radius: 0.28rem;
  background: rgba(255, 255, 255, 0.94);
}

.mobile-direct-create__selector-field,
.mobile-direct-create__value-field {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.24rem;
  box-sizing: border-box;
  min-height: var(--mobile-direct-create-field-height);
  height: var(--mobile-direct-create-field-height);
  padding: 0 0.28rem;
  text-align: left;
}

.mobile-direct-create__field-main,
.mobile-direct-create__field-side,
.mobile-direct-create__value-text,
.mobile-direct-create__value-placeholder {
  min-width: 0;
}

.mobile-direct-create__field-main {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mobile-direct-create__field-main.is-placeholder {
  color: #a07f32;
  font-size: 0.4rem;
  font-weight: 400;
}

.mobile-direct-create__selector-field.is-disabled {
  opacity: 0.65;
}

.mobile-direct-create__field-main,
.mobile-direct-create__value-text {
  color: #4c3200;
  font-size: 0.48rem;
  font-weight: 700;
  line-height: 1.25;
}

.mobile-direct-create__field-side,
.mobile-direct-create__value-placeholder {
  color: #a07f32;
  font-size: 0.4rem;
  line-height: 1.25;
}

.mobile-direct-create__field-side,
.mobile-direct-create__value-text {
  flex-shrink: 0;
}

:deep(.mobile-direct-create__td-control.t-input),
:deep(.mobile-direct-create__td-control.t-textarea) {
  border-color: rgba(146, 97, 0, 0.1);
  background: rgba(255, 255, 255, 0.94);
}

:deep(.mobile-direct-create__td-control.t-input) {
  // --td-input-vertical-padding: 0;
  padding: 0.28rem;
  border-radius: 0.28rem;
  align-items: left;
  border: 0.02rem solid rgba(146, 97, 0, 0.1);
}

:deep(.mobile-direct-create__name-input.t-input) {
  min-height: var(--mobile-direct-create-field-height);
  height: var(--mobile-direct-create-field-height);
  padding: 0 0.28rem;
}

:deep(.mobile-direct-create__td-control.t-input .t-input__wrap),
:deep(.mobile-direct-create__td-control.t-input .t-input__content) {
  align-items: left;
}

.mobile-direct-create__td-control :deep(.t-input__control),
.mobile-direct-create__td-control :deep(.t-textarea__inner) {
  color: #4c3200;
  font-size: 0.3rem;
}

.mobile-direct-create__name-input :deep(.t-input__control) {
  color: #4c3200;
  font-size: 0.48rem;
  font-weight: 700;
  line-height: 1.25;
}

.mobile-direct-create__name-input :deep(.t-input__control::placeholder) {
  color: #a07f32;
  font-size: 0.4rem;
  font-weight: 400;
}

.mobile-direct-create__switch-card {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.24rem;
  padding: 0.24rem 0.36rem 0.24rem 0.28rem;
}

.mobile-direct-create__switch-title {
  margin: 0 0 0.08rem;
  color: #4c3200;
  font-size: 0.48rem;
  font-weight: 700;
}

.mobile-direct-create__switch-desc {
  color: #a07f32;
  font-size: 0.24rem;
  line-height: 1.4;
}

.mobile-direct-create__footer {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.2rem;
}

.mobile-direct-create__footer {
  flex-shrink: 0;
  margin-top: 0;
  padding-top: 0.12rem;
  padding-right: 0.28rem;
  padding-bottom: calc(env(safe-area-inset-bottom) + 0.16rem);
  padding-left: 0.28rem;
  background: linear-gradient(180deg, rgba(255, 246, 230, 0) 0%, rgba(255, 246, 230, 0.9) 28%, rgba(255, 246, 230, 1) 100%);
}

.mobile-direct-create__footer :deep(.t-button) {
  min-height: 0.96rem;
  // border-radius: 0.26rem;
  // font-size: 0.3rem;
  font-weight: 700;
}

.mobile-direct-create__footer :deep(.t-button--primary) {
  --td-button-primary-border-color: transparent;
  --td-button-primary-active-border-color: transparent;
  --td-button-primary-disabled-border-color: transparent;
  border: none !important;
  background: linear-gradient(135deg, #f7cf4b 0%, #efbc2e 100%);
  color: #5c3d00;
  box-shadow: 0 0.08rem 0.22rem rgba(239, 188, 46, 0.22);
}

.mobile-direct-create__footer :deep(.t-button--primary::after) {
  border-color: transparent !important;
}

.mobile-direct-create__footer :deep(.t-button--outline) {
  border-color: rgba(146, 97, 0, 0.14);
  background: rgba(255, 255, 255, 0.9);
  color: #7d5a00;
}

.mobile-option-picker {
  display: flex;
  flex-direction: column;
  border-radius: 0.48rem 0.48rem 0 0;
  background: linear-gradient(180deg, #fffaf1 0%, #fff7ea 100%);
  max-height: calc(100dvh - env(safe-area-inset-top) - 0.64rem);
  padding: 0.32rem 0.24rem calc(env(safe-area-inset-bottom) + 0.36rem);
  box-shadow: 0 -0.18rem 0.52rem rgba(146, 97, 0, 0.14);
  overflow: hidden;
}

.mobile-option-picker__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.2rem;
  margin-bottom: 0.24rem;
}

.mobile-option-picker__eyebrow {
  margin: 0 0 0.08rem;
  color: #b47b00;
  font-size: 0.26rem;
  font-weight: 600;
}

.mobile-option-picker__title {
  margin: 0;
  color: #4c3200;
  font-size: 0.42rem;
  font-weight: 700;
  line-height: 1.2;
}

.mobile-option-picker__body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.mobile-option-picker__subject-grid {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  align-content: flex-start;
  row-gap: 0.38rem;
  padding: 0.2rem 0.1rem;
}

.mobile-option-picker__subject-card {
  min-height: 1.76rem;
  flex: 0 0 25%;
  width: 25%;
  max-width: 25%;
  border: none;
  background: transparent;
  padding: 0 0.06rem;
  margin: 0 0 0.4rem 0;
}

.mobile-option-picker__subject-card-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 0.16rem;
  width: 100%;
}

.mobile-option-picker__subject-card.is-active .mobile-option-picker__subject-icon {
  background: linear-gradient(180deg, #ffe986 0%, #ffd84d 100%);
  color: #5f4a00;
  box-shadow: 0 0.08rem 0.18rem rgba(255, 209, 61, 0.28);
}

.mobile-option-picker__subject-card.is-active .mobile-option-picker__subject-name {
  color: #1f1f1f;
  font-weight: 500;
}

.mobile-option-picker__subject-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  background: #f5f5f5;
  color: #666;
  transition: background-color 0.2s ease, box-shadow 0.2s ease, color 0.2s ease;
}

.mobile-option-picker__subject-icon :deep(.svg-icon) {
  width: 0.66rem;
  height: 0.66rem;
}

.mobile-option-picker__subject-name {
  max-width: 100%;
  overflow: hidden;
  color: #303133;
  font-size: 0.4rem;
  font-weight: 400;
  line-height: 1.2;
  text-align: center;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.mobile-option-picker__payment-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.32rem 0.08rem;
  align-items: start;
  padding: 0.18rem 0.08rem 0.28rem;
}

.mobile-option-picker__tag-grid {
  padding-bottom: 0.24rem;
}

.mobile-option-picker__tag-card {
  margin-bottom: 0.4rem;
}

.mobile-option-picker__tag-card.is-active .mobile-option-picker__tag-icon {
  background: linear-gradient(180deg, #ffe986 0%, #ffd84d 100%);
  color: #5f4a00;
  box-shadow: 0 0.08rem 0.18rem rgba(255, 209, 61, 0.28);
}

.mobile-option-picker__tag-card.is-active .mobile-option-picker__subject-name {
  color: #1f1f1f;
  font-weight: 500;
}

.mobile-option-picker__tag-card.is-disabled {
  opacity: 0.55;
}

.mobile-option-picker__tag-icon {
  background: #f5f5f5;
}

.mobile-option-picker__payment-option {
  min-width: 0;
  min-height: 2.4rem;
  border: none;
  background: transparent;
  padding: 0;
  margin: 0;
}

.mobile-option-picker__payment-option-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 0.16rem;
  width: 100%;
  min-height: 100%;
  white-space: normal;
}

.mobile-option-picker__payment-circle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  background: #f2f2f2;
  color: #666;
  font-size: 0.46rem;
  font-weight: 700;
  line-height: 1;
  transition: background-color 0.2s ease, box-shadow 0.2s ease, color 0.2s ease, transform 0.2s ease;
}

.mobile-option-picker__payment-option.is-active .mobile-option-picker__payment-circle {
  background: linear-gradient(180deg, #ffe986 0%, #ffd84d 100%);
  color: #5f4a00;
  box-shadow: 0 0.08rem 0.18rem rgba(255, 209, 61, 0.28);
  transform: translateY(-0.01rem);
}

.mobile-option-picker__payment-label {
  min-width: 100%;
  min-height: 0.96rem;
  color: #303133;
  font-size: 0.4rem;
  font-weight: 400;
  line-height: 1.25;
  text-align: center;
  word-break: break-all;
  white-space: normal;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.mobile-option-picker__payment-option.is-active .mobile-option-picker__payment-label {
  color: #1f1f1f;
  font-weight: 500;
}

.mobile-option-picker__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 3rem;
  color: #909399;
  font-size: 0.28rem;
  line-height: 1.6;
  text-align: center;
  padding: 0 0.24rem;
}

.mobile-direct-create__picker-popup {
  overflow: hidden;
  background: #fff;
  border-radius: 0.32rem 0.32rem 0 0;
  padding-bottom: calc(env(safe-area-inset-bottom) + 0.24rem);
  box-shadow: 0 -0.08rem 0.32rem rgba(15, 23, 42, 0.08);
}

.mobile-direct-create__picker-popup :deep(.t-picker) {
  background: transparent;
}
</style>
