<template>
  <t-popup
    v-model:visible="sheetVisible"
    placement="bottom"
    destroy-on-close
    :z-index="1500"
    :close-on-overlay-click="false"
  >
    <div class="mobile-create-sheet">
      <div class="mobile-create-sheet__header">
        <button type="button" class="mobile-create-sheet__ghost-btn" @click="sheetVisible = false">
          返回
        </button>

        <div class="mobile-create-sheet__heading">
          <p class="mobile-create-sheet__eyebrow">{{ categoryLabel }}</p>
          <h3 class="mobile-create-sheet__title">{{ sheetTitle }}</h3>
          <p class="mobile-create-sheet__subject">{{ subjectName }}</p>
        </div>

        <div class="mobile-create-sheet__ghost-placeholder" />
      </div>

      <div class="mobile-create-sheet__body">
        <div class="mobile-field">
          <label class="mobile-field__label">明细名称</label>
          <t-input
            v-model="form.name"
            class="mobile-create-sheet__td-control"
            placeholder="请输入明细名称"
            :maxlength="20"
            clearable
          />
        </div>

        <div class="mobile-field">
          <label class="mobile-field__label">金额</label>
          <button type="button" class="mobile-create-sheet__amount-field" @click="amountKeyboardVisible = true">
            <span class="mobile-create-sheet__amount-placeholder">
              {{ form.amount ? '已录入金额' : '点击输入金额' }}
            </span>
            <strong class="mobile-create-sheet__amount-value">
              {{ form.amount ? `￥ ${form.amount}` : '￥ 0' }}
            </strong>
          </button>
        </div>

        <div class="mobile-field">
          <label class="mobile-field__label">明细日期</label>
          <button type="button" class="mobile-create-sheet__date-field" @click="openDatePicker">
            <span>{{ form.detailDate || '请选择日期' }}</span>
            <small>点击选择</small>
          </button>
        </div>

        <div class="mobile-field">
          <label class="mobile-field__label">备注</label>
          <t-textarea
            v-model="form.remark"
            class="mobile-create-sheet__td-control"
            placeholder="选填，补充这笔明细的说明"
            :maxlength="20"
            :indicator="true"
            :autosize="{ minRows: 3, maxRows: 4 }"
          />
        </div>

        <div v-if="canManageHidden" class="mobile-create-sheet__switch-card">
          <div>
            <p class="mobile-create-sheet__switch-title">隐藏此笔</p>
            <small class="mobile-create-sheet__switch-desc">当前已进入隐私模式，可选择隐藏本次明细</small>
          </div>
          <t-switch v-model="form.hidden" size="large" :custom-value="[1, 0]" />
        </div>
      </div>

      <div class="mobile-create-sheet__footer">
        <t-button block variant="outline" size="large" @click="sheetVisible = false">
          返回选择科目
        </t-button>
        <t-button block theme="primary" size="large" :loading="submitting" @click="handleSubmit">
          {{ submitButtonText }}
        </t-button>
      </div>
    </div>
  </t-popup>

  <t-popup
    v-model:visible="datePickerVisible"
    placement="bottom"
    destroy-on-close
    :z-index="1550"
    :close-on-overlay-click="false"
  >
    <div class="mobile-create-sheet__picker-popup">
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
 * 移动端新增/编辑明细表单层
 *
 * @author Wangsongsong
 * @date 2026-03-21
 * @update 2026-03-21 @Wangsongsong
 * @desc 复用新增表单层承接移动端明细编辑，并补充编辑态回填与保存逻辑
 */
import { Message } from '@arco-design/web-vue'
import dayjs from 'dayjs'
import { computed, reactive, ref, watch } from 'vue'
import { addDetail, updateDetail } from '@/apis/bookkeeping/detail'
import { usePrivacyStore, useUserStore } from '@/stores'
import has from '@/utils/has'
import MobileAmountKeyboard from './MobileAmountKeyboard.vue'

interface Props {
  visible: boolean
  detailId?: string
  detailUserId?: string
  category: string
  categoryLabel: string
  subjectId: string
  subjectName: string
  initialName?: string
  initialAmount?: string | number
  initialDetailDate?: string
  initialRemark?: string
  initialHidden?: number
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'submit-success'): void
}>()

defineOptions({ name: 'MobileDetailCreateFormSheet' })

const userStore = useUserStore()
const privacyStore = usePrivacyStore()

const MAX_AMOUNT = 999999
const getToday = () => dayjs().format('YYYY-MM-DD')

const sheetVisible = computed({
  get: () => props.visible,
  set: (value: boolean) => emit('update:visible', value),
})

const isUpdate = computed(() => !!props.detailId)
const sheetTitle = computed(() => (isUpdate.value ? '编辑明细' : '填写明细'))
const submitButtonText = computed(() => (isUpdate.value ? '保存' : '完成'))
const canManageHidden = computed(() => has.hasPermOr(['bk:hide-target:manage']) && privacyStore.isPrivacyMode)
const datePickerVisible = ref(false)
const amountKeyboardVisible = ref(false)
const datePickerValue = ref(getToday())
const submitting = ref(false)

const resolveInitialAmount = () => {
  const amount = props.initialAmount
  if (amount === '' || amount == null) return ''
  return String(Math.abs(Number(amount)))
}

const createDefaultForm = () => ({
  userId: props.detailUserId || userStore.userInfo.id,
  category: props.category,
  subjectId: props.subjectId,
  name: props.initialName || props.subjectName || '',
  amount: resolveInitialAmount(),
  detailDate: props.initialDetailDate || getToday(),
  remark: props.initialRemark || '',
  hidden: props.initialHidden ?? 0,
})

const form = reactive(createDefaultForm())

const syncFormFromProps = () => {
  Object.assign(form, createDefaultForm())
  datePickerValue.value = form.detailDate || getToday()
  datePickerVisible.value = false
  amountKeyboardVisible.value = false
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

const validateForm = () => {
  const name = String(form.name || '').trim()
  const remark = String(form.remark || '').trim()
  const amount = Number(form.amount)

  if (!form.category) {
    Message.warning('请先选择分类')
    return false
  }
  if (!form.subjectId) {
    Message.warning('请先选择科目')
    return false
  }
  if (!name) {
    Message.warning('请输入明细名称')
    return false
  }
  if (name.length > 20) {
    Message.warning('明细名称最多 20 个字')
    return false
  }
  if (!form.amount) {
    Message.warning('请输入金额')
    return false
  }
  if (Number.isNaN(amount) || amount <= 0) {
    Message.warning('请输入正确的金额')
    return false
  }
  if (amount > MAX_AMOUNT) {
    Message.warning(`金额不能超过 ${MAX_AMOUNT}`)
    return false
  }
  if (!form.detailDate) {
    Message.warning('请选择明细日期')
    return false
  }
  if (remark.length > 20) {
    Message.warning('备注最多 20 个字')
    return false
  }
  return true
}

const handleSubmit = async () => {
  if (!validateForm()) return

  const payload = {
    ...form,
    name: String(form.name || '').trim(),
    remark: String(form.remark || '').trim(),
    amount: Number(form.amount),
    userId: form.userId || userStore.userInfo.id,
  }

  submitting.value = true
  try {
    if (isUpdate.value && props.detailId) {
      await updateDetail(payload, props.detailId)
      Message.success('修改成功')
    } else {
      await addDetail(payload)
      Message.success('新增成功')
    }

    sheetVisible.value = false
    emit('submit-success')
  } finally {
    submitting.value = false
  }
}

watch(
  () => props.visible,
  () => {
    syncFormFromProps()
  },
)
</script>

<style scoped lang="scss">
.mobile-create-sheet {
  border-radius: 0.48rem 0.48rem 0 0;
  background: linear-gradient(180deg, #fffaf1 0%, #fff6e6 100%);
  padding: 0.32rem 0.32rem calc(env(safe-area-inset-bottom) + 0.32rem);
  box-shadow: 0 -0.18rem 0.52rem rgba(146, 97, 0, 0.14);
}

.mobile-create-sheet__header {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: start;
  gap: 0.2rem;
  margin-bottom: 0.28rem;
}

.mobile-create-sheet__ghost-btn,
.mobile-create-sheet__ghost-placeholder {
  min-width: 0.92rem;
}

.mobile-create-sheet__ghost-btn {
  border: none;
  border-radius: 999rem;
  background: rgba(255, 255, 255, 0.88);
  color: #7d5a00;
  padding: 0.14rem 0.2rem;
  font-size: 0.28rem;
  font-weight: 600;
}

.mobile-create-sheet__heading {
  text-align: center;
}

.mobile-create-sheet__eyebrow {
  margin: 0 0 0.08rem;
  color: #b47b00;
  font-size: 0.26rem;
  font-weight: 600;
}

.mobile-create-sheet__title {
  margin: 0;
  color: #4c3200;
  font-size: 0.44rem;
  font-weight: 700;
  line-height: 1.2;
}

.mobile-create-sheet__subject {
  margin: 0.08rem 0 0;
  color: #8f6a11;
  font-size: 0.28rem;
}

.mobile-create-sheet__body {
  display: flex;
  flex-direction: column;
  gap: 0.24rem;
}

.mobile-create-sheet__td-control :deep(.t-input),
.mobile-create-sheet__td-control :deep(.t-textarea) {
  border-radius: 0.28rem;
  border-color: rgba(146, 97, 0, 0.1);
  background: rgba(255, 255, 255, 0.94);
}

.mobile-create-sheet__td-control :deep(.t-input__inner),
.mobile-create-sheet__td-control :deep(.t-textarea__inner) {
  color: #4c3200;
  font-size: 0.3rem;
}

.mobile-create-sheet__amount-field,
.mobile-create-sheet__date-field,
.mobile-create-sheet__switch-card {
  width: 100%;
  border: 0.02rem solid rgba(146, 97, 0, 0.1);
  border-radius: 0.28rem;
  background: rgba(255, 255, 255, 0.94);
}

.mobile-create-sheet__amount-field,
.mobile-create-sheet__date-field {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.24rem;
  min-height: 0.96rem;
  padding: 0 0.28rem;
  text-align: left;
}

.mobile-create-sheet__amount-placeholder,
.mobile-create-sheet__date-field small {
  color: #a07f32;
  font-size: 0.26rem;
}

.mobile-create-sheet__amount-value,
.mobile-create-sheet__date-field span {
  color: #4c3200;
  font-size: 0.34rem;
  font-weight: 700;
}

.mobile-create-sheet__switch-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.24rem;
  padding: 0.24rem 0.28rem;
}

.mobile-create-sheet__switch-title {
  margin: 0 0 0.08rem;
  color: #4c3200;
  font-size: 0.3rem;
  font-weight: 700;
}

.mobile-create-sheet__switch-desc {
  color: #a07f32;
  font-size: 0.24rem;
  line-height: 1.4;
}

.mobile-create-sheet__footer {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.2rem;
  margin-top: 0.32rem;
}

.mobile-create-sheet__picker-popup {
  overflow: hidden;
  background: #fff;
  border-radius: 0.32rem 0.32rem 0 0;
  padding-bottom: calc(env(safe-area-inset-bottom) + 0.24rem);
  box-shadow: 0 -0.08rem 0.32rem rgba(15, 23, 42, 0.08);
}

.mobile-create-sheet__picker-popup :deep(.t-picker) {
  background: transparent;
}
</style>
