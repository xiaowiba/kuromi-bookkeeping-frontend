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
        <div>
          <p class="mobile-amount-keyboard__eyebrow">金额输入</p>
          <strong class="mobile-amount-keyboard__value">{{ keyboardValue || '0' }}</strong>
        </div>
        <div class="mobile-amount-keyboard__actions">
          <button type="button" class="mobile-amount-keyboard__action" @click="handleClear">
            清空
          </button>
          <!-- button
            type="button"
            class="mobile-amount-keyboard__action mobile-amount-keyboard__action--primary"
            @click="popupVisible = false"
          >
            完成
          </button -->
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
/**
 * 移动端金额数字键盘
 *
 * @author Wangsongsong
 * @date 2026-03-21
 * @update 2026-03-22 @Wangsongsong
 * @desc 放大金额键盘弹层、数字按键和右上角操作按钮，提升移动端输入触控面积
 * @update 2026-03-23 @Wangsongsong
 * @desc 进一步放大金额键盘可视区域与键位尺寸，尽量扩展到金额输入框下方可用空间
 * @update 2026-03-23 @Wangsongsong
 * @desc 修复金额键盘放大后最后一行被遮挡的问题，通过抬升键盘高度并重新平衡间距，确保四行按键完整可见
 */
import { computed } from 'vue'

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

const keyboardValue = computed({
  get: () => String(props.modelValue || ''),
  set: (value: string) => emit('update:modelValue', value),
})

const isValidAmount = (value: string) => {
  if (!value) return true
  if (!/^\d+(\.\d{0,2})?$/.test(value)) return false
  const [integerPart = '', decimalPart = ''] = value.split('.')
  if (decimalPart.length > MAX_DECIMAL_LENGTH) return false
  if (Number(integerPart || '0') > MAX_AMOUNT) return false
  return Number(value) <= MAX_AMOUNT
}

const appendDigit = (digit: string) => {
  const current = keyboardValue.value

  if (digit === '.') {
    if (current.includes('.')) return
    keyboardValue.value = current ? `${current}.` : '0.'
    return
  }

  const nextValue = current === '0' ? digit : `${current}${digit}`
  if (!isValidAmount(nextValue)) return
  keyboardValue.value = nextValue
}

const handleDelete = () => {
  keyboardValue.value = keyboardValue.value.slice(0, -1)
}

const handleClear = () => {
  keyboardValue.value = ''
}

const handleKeyPress = (key: KeyboardKey) => {
  if (key.type === 'delete') {
    handleDelete()
    return
  }

  appendDigit(key.value)
}
</script>

<style scoped lang="scss">
.mobile-amount-keyboard {
  border-radius: 0.48rem 0.48rem 0 0;
  background: linear-gradient(180deg, #fff9ef 0%, #fff4db 100%);
  height: min(7.88rem, calc(100dvh - 4.16rem));
  padding: 0.46rem 0.32rem calc(env(safe-area-inset-bottom) + 0.26rem);
  box-shadow: 0 -0.16rem 0.48rem rgba(146, 97, 0, 0.12);
  overflow: hidden;
}

.mobile-amount-keyboard__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.28rem;
  margin-bottom: 0.34rem;
}

.mobile-amount-keyboard__eyebrow {
  margin: 0 0 0.08rem;
  color: #b47b00;
  font-size: 0.28rem;
  font-weight: 600;
}

.mobile-amount-keyboard__value {
  display: block;
  color: #4c3200;
  font-size: 0.68rem;
  font-weight: 700;
  line-height: 1.1;
}

.mobile-amount-keyboard__actions {
  display: flex;
  align-items: center;
  gap: 0.18rem;
}

.mobile-amount-keyboard__action {
  border: none;
  border-radius: 999rem;
  background: rgba(255, 255, 255, 0.88);
  color: #7d5a00;
  min-height: 0.92rem;
  padding: 0.2rem 0.42rem;
  font-size: 0.36rem;
  font-weight: 700;
  box-shadow: 0 0.08rem 0.18rem rgba(146, 97, 0, 0.08);
}

.mobile-amount-keyboard__action--primary {
  background: linear-gradient(135deg, #f7cf4b 0%, #f2b91f 100%);
  color: #533500;
}

.mobile-amount-keyboard__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.2rem;
}

.mobile-amount-keyboard__key {
  min-height: 1.24rem;
  border: none;
  border-radius: 0.28rem;
  background: rgba(255, 255, 255, 0.92);
  color: #4c3200;
  font-size: 0.6rem;
  font-weight: 700;
  box-shadow: inset 0 -0.02rem 0 rgba(146, 97, 0, 0.08);
}

.mobile-amount-keyboard__key.is-action {
  font-size: 0.48rem;
}
</style>
