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
            :maxlength="MAX_DETAIL_NAME_LENGTH"
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
          <label class="mobile-field__label">支付方式</label>
          <div class="mobile-create-sheet__payment-methods">
            <div
              class="mobile-create-sheet__payment-method-group"
              role="radiogroup"
              aria-label="支付方式"
            >
              <button
                v-for="item in paymentMethodOptions"
                :key="item.value"
                type="button"
                :class="[
                  'mobile-create-sheet__payment-method-option',
                  { 'is-active': form.paymentMethod === item.value },
                ]"
                role="radio"
                :aria-checked="form.paymentMethod === item.value"
                @click="form.paymentMethod = item.value"
              >
                <span class="mobile-create-sheet__payment-method-circle">
                  {{ resolvePaymentMethodMarker(item.label) }}
                </span>
                <span class="mobile-create-sheet__payment-method-label">
                  {{ item.label }}
                </span>
              </button>
            </div>
          </div>
        </div>

        <div class="mobile-field">
          <label class="mobile-field__label">{{ necessaryFieldLabel }}</label>
          <div class="mobile-create-sheet__necessary-group" role="radiogroup" :aria-label="necessaryFieldLabel">
            <button
              v-for="item in isNecessaryOptions"
              :key="item.value"
              type="button"
              :class="[
                'mobile-create-sheet__necessary-option',
                { 'is-active': Number(form.isNecessary) === Number(item.value) },
              ]"
              role="radio"
              :aria-checked="Number(form.isNecessary) === Number(item.value)"
              @click="form.isNecessary = Number(item.value)"
            >
              {{ item.label }}
            </button>
          </div>
        </div>

        <div class="mobile-field">
          <label class="mobile-field__label">备注</label>
          <t-textarea
            v-model="form.remark"
            class="mobile-create-sheet__td-control"
            placeholder="选填，补充这笔明细的说明"
            :maxlength="MAX_DETAIL_REMARK_LENGTH"
            :indicator="true"
            :autosize="{ minRows: 3, maxRows: 4 }"
          />
        </div>

        <div v-if="canManageHidden" class="mobile-create-sheet__switch-card">
          <div>
            <p class="mobile-create-sheet__switch-title">隐藏此笔</p>
            <small class="mobile-create-sheet__switch-desc">当前已进入隐私模式，可选择隐藏本次明细</small>
          </div>
          <t-switch
            v-model="form.hidden"
            class="mobile-create-sheet__switch"
            size="large"
            :custom-value="[1, 0]"
          />
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
 * @update 2026-03-24 @Wangsongsong
 * @desc 修复移动端明细表单层在小屏设备上底部按钮被遮挡且无法滚动的问题，改为视口内布局加内部滚动
 * @update 2026-03-21 @Wangsongsong
 * @desc 复用新增表单层承接移动端明细编辑，并补充编辑态回填与保存逻辑
 * @update 2026-03-22 @Wangsongsong
 * @desc 移动端表单提示统一改为使用 TDesign Toast
 * @update 2026-03-22 @Wangsongsong
 * @desc 调整填写明细弹层顶部返回按钮和底部主按钮顺序、尺寸与黄色主题样式
 * @update 2026-03-23 @Wangsongsong
 * @desc 移动端新增支付方式单选组，默认值为“默认”，并统一编辑态回填逻辑
 * @update 2026-03-23 @Wangsongsong
 * @desc 移动端支付方式改为横向 Radio 单选布局，统一按 TDesign Mobile Radio 组件渲染
 * @update 2026-03-23 @Wangsongsong
 * @desc 移动端支付方式样式改为三列卡片单选框，统一行列间距与选中态视觉反馈
 * @update 2026-03-23 @Wangsongsong
 * @desc 移动端支付方式进一步对齐 TDesign 横向卡片单选框示例，使用外层卡片容器与角标选中态
 * @update 2026-03-23 @Wangsongsong
 * @desc 移动端支付方式去除尖角角标，改为与分类选择一致的圆润胶囊式选中效果
 * @update 2026-03-23 @Wangsongsong
 * @desc 移动端支付方式改为原型稿风格的圆形入口选择器，使用圆形高亮和底部标签布局
 */
import dayjs from 'dayjs'
import { computed, reactive, ref, watch } from 'vue'
import { addDetail, updateDetail } from '@/apis/bookkeeping/detail'
import { useDict } from '@/hooks/app'
import { usePrivacyStore, useUserStore } from '@/stores'
import { mobileToast } from '@/utils/mobile-toast'
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
  initialPaymentMethod?: string
  initialIsNecessary?: number
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
const { bk_payment_method: bkPaymentMethod, common_yes_no: commonYesNo } = useDict('bk_payment_method', 'common_yes_no')

const MAX_AMOUNT = 999999
const MAX_DETAIL_NAME_LENGTH = 100
const MAX_DETAIL_REMARK_LENGTH = 200
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
const paymentMethodOptions = computed(() =>
  bkPaymentMethod.value.map(item => ({
    label: item.label,
    value: item.value,
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
const resolvePaymentMethodMarker = (label: string) => String(label || '').trim().slice(0, 1) || '?'

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
  paymentMethod: props.initialPaymentMethod || 'default',
  isNecessary: props.initialIsNecessary ?? 1,
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
    mobileToast.warning('请先选择分类')
    return false
  }
  if (!form.subjectId) {
    mobileToast.warning('请先选择科目')
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
    name: String(form.name || '').trim(),
    remark: String(form.remark || '').trim(),
    amount: Number(form.amount),
    isNecessary: Number(form.isNecessary ?? 1),
    userId: form.userId || userStore.userInfo.id,
  }

  submitting.value = true
  try {
    if (isUpdate.value && props.detailId) {
      await updateDetail(payload, props.detailId)
      mobileToast.success('修改成功')
    } else {
      await addDetail(payload)
      mobileToast.success('新增成功')
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
  display: flex;
  flex-direction: column;
  border-radius: 0.48rem 0.48rem 0 0;
  background: linear-gradient(180deg, #fffaf1 0%, #fff6e6 100%);
  max-height: calc(100dvh - env(safe-area-inset-top) - 0.24rem);
  padding: 0.32rem 0.32rem calc(env(safe-area-inset-bottom) + 0.44rem);
  box-shadow: 0 -0.18rem 0.52rem rgba(146, 97, 0, 0.14);
  overflow: hidden;
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
  min-width: 1.18rem;
}

.mobile-create-sheet__ghost-btn {
  grid-column: 3;
  border: none;
  border-radius: 999rem;
  background: rgba(255, 255, 255, 0.88);
  color: #7d5a00;
  justify-self: end;
  padding: 0.18rem 0.3rem;
  font-size: 0.32rem;
  font-weight: 700;
  line-height: 1;
  box-shadow: 0 0.08rem 0.2rem rgba(146, 97, 0, 0.08);
}

.mobile-create-sheet__ghost-placeholder {
  grid-column: 1;
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
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 0.24rem;
  overflow-y: auto;
  padding-right: 0.04rem;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  touch-action: pan-y;
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

.mobile-create-sheet__payment-methods {
  padding-top: 0.04rem;
}

.mobile-create-sheet__payment-method-group {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.2rem 0.08rem;
  align-items: start;
}

.mobile-create-sheet__payment-method-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.12rem;
  min-width: 0;
  border: none;
  background: transparent;
  padding: 0;
}

.mobile-create-sheet__payment-method-circle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 0.96rem;
  height: 0.96rem;
  border-radius: 50%;
  background: #f2f2f2;
  color: #666;
  font-size: 0.32rem;
  font-weight: 700;
  line-height: 1;
  transition: background-color 0.2s ease, box-shadow 0.2s ease, color 0.2s ease, transform 0.2s ease;
}

.mobile-create-sheet__payment-method-option.is-active .mobile-create-sheet__payment-method-circle {
  background: linear-gradient(180deg, #ffe986 0%, #ffd84d 100%);
  color: #5f4a00;
  box-shadow: 0 0.08rem 0.18rem rgba(255, 209, 61, 0.28);
  transform: translateY(-0.01rem);
}

.mobile-create-sheet__payment-method-label {
  min-width: 0;
  min-height: 0.56rem;
  color: #303133;
  font-size: 0.24rem;
  font-weight: 400;
  line-height: 1.2;
  text-align: center;
  word-break: break-all;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.mobile-create-sheet__payment-method-option.is-active .mobile-create-sheet__payment-method-label {
  color: #1f1f1f;
  font-weight: 500;
}

.mobile-create-sheet__necessary-group {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.16rem;
}

.mobile-create-sheet__necessary-option {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 0.88rem;
  border: 0.02rem solid rgba(146, 97, 0, 0.12);
  border-radius: 0.24rem;
  background: rgba(255, 255, 255, 0.92);
  color: #7d5a00;
  font-size: 0.3rem;
  font-weight: 700;
}

.mobile-create-sheet__necessary-option.is-active {
  border-color: rgba(239, 188, 46, 0.35);
  background: linear-gradient(135deg, #f7cf4b 0%, #efbc2e 100%);
  color: #5f4a00;
  box-shadow: 0 0.12rem 0.24rem rgba(239, 188, 46, 0.18);
}

.mobile-create-sheet__switch-card {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.24rem;
  padding: 0.24rem 0.36rem 0.24rem 0.28rem;
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

.mobile-create-sheet__switch {
  flex-shrink: 0;
  margin-right: 0.04rem;
}

.mobile-create-sheet__footer {
  flex-shrink: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.2rem;
  margin-top: 0.28rem;
  padding-top: 0.22rem;
  padding-bottom: 0.16rem;
  background: linear-gradient(180deg, rgba(255, 246, 230, 0) 0%, rgba(255, 246, 230, 0.9) 28%, rgba(255, 246, 230, 1) 100%);
}

.mobile-create-sheet__footer :deep(.t-button) {
  min-height: 0.96rem;
  border-radius: 0.26rem;
  font-size: 0.3rem;
  font-weight: 700;
}

.mobile-create-sheet__footer :deep(.t-button--primary) {
  order: 1;
  border: none;
  background: linear-gradient(135deg, #f7cf4b 0%, #efbc2e 100%);
  color: #5c3d00;
  box-shadow: 0 0.12rem 0.26rem rgba(239, 188, 46, 0.24);
}

.mobile-create-sheet__footer :deep(.t-button--primary.t-button--disabled),
.mobile-create-sheet__footer :deep(.t-button--primary:disabled) {
  color: rgba(92, 61, 0, 0.6);
  background: linear-gradient(135deg, rgba(247, 207, 75, 0.78) 0%, rgba(239, 188, 46, 0.72) 100%);
}

.mobile-create-sheet__footer :deep(.t-button--outline) {
  order: 2;
  border-color: rgba(146, 97, 0, 0.14);
  background: rgba(255, 255, 255, 0.9);
  color: #7d5a00;
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
