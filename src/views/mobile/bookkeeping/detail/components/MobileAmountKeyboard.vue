<template>
  <t-popup
    v-model:visible="popupVisible"
    placement="bottom"
    destroy-on-close
    :prevent-scroll-through="true"
    :z-index="AMOUNT_KEYBOARD_POPUP_Z_INDEX"
    :show-overlay="true"
    :overlay-props="amountKeyboardOverlayProps"
    :close-on-overlay-click="true"
  >
    <div class="mobile-amount-keyboard">
      <div class="mobile-amount-keyboard__header">
        <div class="mobile-amount-keyboard__actions">
          <button type="button" class="mobile-amount-keyboard__action" @click="handleClear">
            清空
          </button>
          <button type="button" class="mobile-amount-keyboard__action" @click="handleCancel">
            取消
          </button>
          <button
            type="button"
            class="mobile-amount-keyboard__action mobile-amount-keyboard__action--primary"
            @click="handleConfirm"
          >
            确认
          </button>
        </div>

        <div class="mobile-amount-keyboard__summary">
          <p class="mobile-amount-keyboard__eyebrow">金额输入</p>
          <strong class="mobile-amount-keyboard__value">{{ draftValue || '0' }}</strong>
        </div>
      </div>

      <div class="mobile-amount-keyboard__grid">
        <button
          v-for="key in keyList"
          :key="key.value"
          type="button"
          class="mobile-amount-keyboard__key"
          :class="{ 'is-action': key.type !== 'digit' }"
          @click="handleKeyPress(key)"
        >
          {{ key.label }}
        </button>
      </div>
    </div>
  </t-popup>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

interface Props {
  visible: boolean
  modelValue?: string
}

interface KeyboardKey {
  label: string
  value: string
  type: 'digit' | 'delete'
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'update:modelValue', value: string): void
}>()

defineOptions({ name: 'MobileAmountKeyboard' })

const MAX_AMOUNT = 999999
const MAX_DECIMAL_LENGTH = 2
const AMOUNT_KEYBOARD_POPUP_Z_INDEX = 1600
const amountKeyboardOverlayProps = {
  zIndex: AMOUNT_KEYBOARD_POPUP_Z_INDEX - 1,
}

const keyList: KeyboardKey[] = [
  { label: '1', value: '1', type: 'digit' },
  { label: '2', value: '2', type: 'digit' },
  { label: '3', value: '3', type: 'digit' },
  { label: '4', value: '4', type: 'digit' },
  { label: '5', value: '5', type: 'digit' },
  { label: '6', value: '6', type: 'digit' },
  { label: '7', value: '7', type: 'digit' },
  { label: '8', value: '8', type: 'digit' },
  { label: '9', value: '9', type: 'digit' },
  { label: '.', value: '.', type: 'digit' },
  { label: '0', value: '0', type: 'digit' },
  { label: '删除', value: 'delete', type: 'delete' },
]

const popupVisible = computed({
  get: () => props.visible,
  set: (value: boolean) => emit('update:visible', value),
})

const draftValue = ref('')

const syncDraftValue = () => {
  draftValue.value = String(props.modelValue || '')
}

const isValidAmount = (value: string) => {
  if (!value) return true
  if (!/^\d+(\.\d{0,2})?$/.test(value)) return false
  const [integerPart = '', decimalPart = ''] = value.split('.')
  if (decimalPart.length > MAX_DECIMAL_LENGTH) return false
  if (Number(integerPart || '0') > MAX_AMOUNT) return false
  return Number(value) <= MAX_AMOUNT
}

const appendDigit = (digit: string) => {
  const current = draftValue.value

  if (digit === '.') {
    if (current.includes('.')) return
    draftValue.value = current ? `${current}.` : '0.'
    return
  }

  const nextValue = current === '0' ? digit : `${current}${digit}`
  if (!isValidAmount(nextValue)) return
  draftValue.value = nextValue
}

const handleDelete = () => {
  draftValue.value = draftValue.value.slice(0, -1)
}

const handleClear = () => {
  draftValue.value = ''
}

const handleKeyPress = (key: KeyboardKey) => {
  if (key.type === 'delete') {
    handleDelete()
    return
  }

  appendDigit(key.value)
}

const normalizeAmountValue = (value: string) => {
  if (!value) {
    return ''
  }
  return value.endsWith('.') ? value.slice(0, -1) : value
}

const handleCancel = () => {
  syncDraftValue()
  popupVisible.value = false
}

const handleConfirm = () => {
  emit('update:modelValue', normalizeAmountValue(draftValue.value))
  popupVisible.value = false
}

watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      syncDraftValue()
    }
  },
  { immediate: true },
)
</script>

<style scoped lang="scss">
.mobile-amount-keyboard {
  box-sizing: border-box;
  border-radius: 0.56rem 0.56rem 0 0;
  background: linear-gradient(180deg, #fff9ef 0%, #fff4db 100%);
  min-height: 8.96rem;
  max-height: calc(100dvh - 1.92rem);
  padding:
    max(0.6rem, calc(env(safe-area-inset-top) + 0.18rem))
    0.36rem
    calc(env(safe-area-inset-bottom) + 1.12rem);
  box-shadow: 0 -0.16rem 0.48rem rgba(146, 97, 0, 0.12);
  overflow-x: hidden;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.mobile-amount-keyboard__header {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0.24rem;
  margin-bottom: 0.42rem;
}

.mobile-amount-keyboard__summary {
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  text-align: right;
}

.mobile-amount-keyboard__eyebrow {
  margin: 0 0 0.08rem;
  color: #b47b00;
  font-size: 0.3rem;
  font-weight: 600;
}

.mobile-amount-keyboard__value {
  display: block;
  color: #4c3200;
  font-size: 0.82rem;
  font-weight: 700;
  line-height: 1.1;
}

.mobile-amount-keyboard__actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.16rem;
  width: 100%;
  flex-wrap: nowrap;
}

.mobile-amount-keyboard__action {
  border: none;
  border-radius: 0.28rem;
  background: rgba(255, 255, 255, 0.88);
  color: #7d5a00;
  min-height: 0.98rem;
  padding: 0.28rem 0.68rem;
  font-size: 0.5rem;
  font-weight: 700;
  line-height: 1;
  box-shadow: 0 0.08rem 0.18rem rgba(146, 97, 0, 0.08);
}

.mobile-amount-keyboard__action--primary {
  background: linear-gradient(135deg, #f7cf4b 0%, #f2b91f 100%);
  color: #533500;
}

.mobile-amount-keyboard__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.24rem;
  padding-bottom: 0.72rem;
}

.mobile-amount-keyboard__key {
  min-height: 1.38rem;
  border: none;
  border-radius: 0.32rem;
  background: rgba(255, 255, 255, 0.92);
  color: #4c3200;
  font-size: 0.66rem;
  font-weight: 700;
  box-shadow: inset 0 -0.02rem 0 rgba(146, 97, 0, 0.08);
}

.mobile-amount-keyboard__key.is-action {
  font-size: 0.52rem;
}
</style>
