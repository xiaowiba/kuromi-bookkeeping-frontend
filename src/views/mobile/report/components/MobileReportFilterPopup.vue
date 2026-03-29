<template>
  <t-popup
    :visible="visible"
    placement="bottom"
    destroy-on-close
    :z-index="FILTER_POPUP_Z_INDEX"
    :overlay-props="filterPopupOverlayProps"
    @close="handlePopupClose"
  >
    <div class="mobile-report-filter-popup">
      <div class="mobile-report-filter-popup__header">
        <div>
          <p class="mobile-report-filter-popup__eyebrow">Report Filters</p>
          <h3 class="mobile-report-filter-popup__title">报表筛选</h3>
        </div>
        <button type="button" class="mobile-report-filter-popup__close" @click="handlePopupClose">关闭</button>
      </div>

      <div class="mobile-field">
        <label class="mobile-field__label">时间范围</label>
        <div class="mobile-report-filter-popup__chips">
          <button
            v-for="item in datePresetOptions"
            :key="String(item.value)"
            type="button"
            class="mobile-chip"
            :class="{ 'is-active': filterForm.datePreset === item.value }"
            @click="handlePresetSelect(item.value as any)"
          >
            {{ item.label }}
          </button>
        </div>
      </div>

      <div v-if="filterForm.datePreset === 'custom'" class="mobile-field">
        <label class="mobile-field__label">自定义日期</label>
        <t-button block size="large" variant="text" class="mobile-report-filter-popup__selector-field" @click="openCalendar">
          <span class="mobile-report-filter-popup__field-main">
            {{ customDateRangeText }}
          </span>
          <template #suffix>
            <small class="mobile-report-filter-popup__field-side">点击选择</small>
          </template>
        </t-button>
      </div>

      <div class="mobile-field">
        <label class="mobile-field__label">分类</label>
        <div class="mobile-report-filter-popup__chips">
          <button
            v-for="item in categoryOptions"
            :key="String(item.value)"
            type="button"
            class="mobile-chip"
            :class="{ 'is-active': filterForm.category === item.value }"
            @click="filterForm.category = String(item.value)"
          >
            {{ item.label }}
          </button>
        </div>
      </div>

      <div class="mobile-field">
        <label class="mobile-field__label">科目</label>
        <t-button block size="large" variant="text" class="mobile-report-filter-popup__selector-field" @click="openSubjectPicker">
          <span class="mobile-report-filter-popup__field-main">
            {{ selectedSubjectLabel }}
          </span>
          <template #suffix>
            <small class="mobile-report-filter-popup__field-side">点击选择</small>
          </template>
        </t-button>
      </div>

      <div class="mobile-field">
        <label class="mobile-field__label">支付方式</label>
        <t-button block size="large" variant="text" class="mobile-report-filter-popup__selector-field" @click="openPaymentPicker">
          <span class="mobile-report-filter-popup__field-main">
            {{ selectedPaymentMethodLabel }}
          </span>
          <template #suffix>
            <small class="mobile-report-filter-popup__field-side">点击选择</small>
          </template>
        </t-button>
      </div>

      <div class="mobile-field">
        <label class="mobile-field__label">用户范围</label>
        <div class="mobile-report-filter-popup__chips">
          <button
            v-for="item in userScopeOptions"
            :key="String(item.value)"
            type="button"
            class="mobile-chip"
            :class="{ 'is-active': filterForm.userScope === item.value }"
            @click="filterForm.userScope = item.value as any"
          >
            {{ item.label }}
          </button>
        </div>
      </div>

      <div v-if="filterForm.userScope === 'specific'" class="mobile-field">
        <label class="mobile-field__label">指定用户</label>
        <div class="mobile-report-filter-popup__user-chip-group">
          <button
            v-for="item in userSelectOptions"
            :key="String(item.value)"
            type="button"
            class="mobile-report-filter-popup__user-chip"
            :class="{ 'is-active': String(filterForm.userId) === String(item.value) }"
            @click="filterForm.userId = String(item.value)"
          >
            {{ item.label }}
          </button>
        </div>
      </div>

      <div class="mobile-report-filter-popup__actions">
        <t-button variant="outline" block @click="emit('reset')">重置</t-button>
        <t-button block @click="emit('confirm')">应用筛选</t-button>
      </div>
    </div>
  </t-popup>

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
      </div>

      <div class="mobile-option-picker__body">
        <div v-if="subjectPickerOptions.length" class="mobile-option-picker__subject-grid">
          <t-button
            v-for="item in subjectPickerOptions"
            :key="`${item.id || 'all'}-${item.name}`"
            block
            size="large"
            variant="text"
            class="mobile-option-picker__subject-card"
            :class="{ 'is-active': String(filterForm.subjectId) === String(item.id) }"
            @click="handleSubjectSelect(item.id)"
          >
            <span class="mobile-option-picker__subject-card-content">
              <span class="mobile-option-picker__subject-icon">
                <BookkeepingSubjectIcon
                  :icon="item.icon || 'general'"
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
      </div>

      <div class="mobile-option-picker__body">
        <div class="mobile-option-picker__payment-grid">
          <t-button
            v-for="item in paymentMethodOptions"
            :key="String(item.value)"
            block
            size="large"
            variant="text"
            class="mobile-option-picker__payment-option"
            :class="{ 'is-active': String(filterForm.paymentMethod) === String(item.value) }"
            @click="handlePaymentMethodSelect(String(item.value))"
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
    v-model:visible="calendarVisible"
    placement="bottom"
    :prevent-scroll-through="true"
    :destroy-on-close="true"
    :z-index="CALENDAR_POPUP_Z_INDEX"
    :show-overlay="true"
    :overlay-props="calendarPopupOverlayProps"
    :close-on-overlay-click="true"
  >
    <div class="mobile-report-filter-popup__calendar-panel">
      <t-calendar
        type="range"
        switch-mode="month"
        title="选择日期范围"
        :model-value="calendarValue"
        :confirm-btn="{ content: '确定' }"
        @confirm="handleCalendarConfirm"
      />
    </div>
  </t-popup>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import { computed, nextTick, ref, watch } from 'vue'
import type { CalendarValue } from 'tdesign-mobile-vue/es/calendar'
import type * as T from '@/apis/bookkeeping/type'
import BookkeepingSubjectIcon from '@/components/BookkeepingSubjectIcon/index.vue'
import type { LabelValueState } from '@/types/global'

interface SubjectPickerOption {
  id: string
  name: string
  icon?: string
}

const props = withDefaults(defineProps<{
  visible: boolean
  filterForm: T.ReportFilterForm
  datePresetOptions: Array<LabelValueState & { shortLabel?: string }>
  categoryOptions: LabelValueState[]
  subjectOptions: LabelValueState[]
  paymentMethodOptions: LabelValueState[]
  userScopeOptions: LabelValueState[]
  userSelectOptions: LabelValueState[]
  allSubjects: T.SubjectResp[]
  autoOpenCalendar?: boolean
}>(), {
  autoOpenCalendar: false,
})

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'confirm'): void
  (e: 'reset'): void
}>()

const FILTER_POPUP_Z_INDEX = 1500
const SUBJECT_PICKER_POPUP_Z_INDEX = 1550
const PAYMENT_PICKER_POPUP_Z_INDEX = 1550
const CALENDAR_POPUP_Z_INDEX = 1600
const filterPopupOverlayProps = {
  zIndex: FILTER_POPUP_Z_INDEX - 1,
}
const subjectPickerOverlayProps = {
  zIndex: SUBJECT_PICKER_POPUP_Z_INDEX - 1,
}
const paymentPickerOverlayProps = {
  zIndex: PAYMENT_PICKER_POPUP_Z_INDEX - 1,
}
const calendarPopupOverlayProps = {
  zIndex: CALENDAR_POPUP_Z_INDEX - 1,
}

const subjectPickerVisible = ref(false)
const paymentPickerVisible = ref(false)
const calendarVisible = ref(false)
const calendarValue = ref<Date[]>([])

const selectedCategoryLabel = computed(() => {
  const current = props.categoryOptions.find(item => String(item.value) === String(props.filterForm.category))
  return current?.label || '全部分类'
})

const selectedSubjectLabel = computed(() => {
  if (!props.filterForm.subjectId) {
    return '全部科目'
  }
  return props.allSubjects.find(item => String(item.id) === String(props.filterForm.subjectId))?.name || '全部科目'
})

const selectedPaymentMethodLabel = computed(() => {
  if (!props.filterForm.paymentMethod) {
    return '全部支付方式'
  }
  return props.paymentMethodOptions.find(item => String(item.value) === String(props.filterForm.paymentMethod))?.label || '全部支付方式'
})

const customDateRangeText = computed(() => {
  const [startDate, endDate] = props.filterForm.dateRange || []
  if (!startDate || !endDate) {
    return '请选择日期范围'
  }
  return `${startDate} 至 ${endDate}`
})

const subjectPickerOptions = computed<SubjectPickerOption[]>(() => {
  const source = props.allSubjects
    .filter(item => item.status === 1)
    .filter(item => !props.filterForm.category || item.category === props.filterForm.category)

  return [
    { id: '', name: '全部科目', icon: 'general' },
    ...source.map(item => ({
      id: String(item.id),
      name: item.name,
      icon: item.icon,
    })),
  ]
})

const resolvePaymentMethodMarker = (label: string) => String(label || '').trim().slice(0, 1) || '?'

const createFallbackCalendarValue = () => {
  const now = dayjs()
  return [now.startOf('month').toDate(), now.endOf('month').toDate()]
}

const syncCalendarValue = () => {
  const [startDate, endDate] = props.filterForm.dateRange || []
  if (!startDate || !endDate) {
    calendarValue.value = createFallbackCalendarValue()
    return
  }

  const start = dayjs(startDate)
  const end = dayjs(endDate)
  if (!start.isValid() || !end.isValid()) {
    calendarValue.value = createFallbackCalendarValue()
    return
  }

  calendarValue.value = [start.toDate(), end.toDate()]
}

const openSubjectPicker = () => {
  subjectPickerVisible.value = true
}

const openPaymentPicker = () => {
  paymentPickerVisible.value = true
}

const openCalendar = () => {
  syncCalendarValue()
  calendarVisible.value = true
}

const handlePopupClose = () => {
  subjectPickerVisible.value = false
  paymentPickerVisible.value = false
  calendarVisible.value = false
  emit('update:visible', false)
}

const handlePresetSelect = async (preset: T.ReportDatePreset) => {
  props.filterForm.datePreset = preset
  if (preset !== 'custom') {
    return
  }
  await nextTick()
  openCalendar()
}

const handleSubjectSelect = (subjectId: string) => {
  props.filterForm.subjectId = String(subjectId || '')
  subjectPickerVisible.value = false
}

const handlePaymentMethodSelect = (paymentMethod: string) => {
  props.filterForm.paymentMethod = String(paymentMethod || '')
  paymentPickerVisible.value = false
}

const handleCalendarConfirm = (value: CalendarValue) => {
  const range = (Array.isArray(value) ? value : [value])
    .slice(0, 2)
    .map(item => dayjs(item))
    .filter(item => item.isValid())
    .sort((a, b) => a.valueOf() - b.valueOf())

  if (range.length === 2) {
    props.filterForm.datePreset = 'custom'
    props.filterForm.dateRange = [range[0].format('YYYY-MM-DD'), range[1].format('YYYY-MM-DD')]
    calendarValue.value = [range[0].toDate(), range[1].toDate()]
  }
  calendarVisible.value = false
}

watch(
  () => [props.visible, props.autoOpenCalendar] as const,
  async ([visible, autoOpenCalendar]) => {
    if (!visible || !autoOpenCalendar || props.filterForm.datePreset !== 'custom') {
      return
    }
    await nextTick()
    openCalendar()
  },
  { immediate: true },
)
</script>

<style scoped lang="scss">
.mobile-report-filter-popup {
  max-height: calc(100dvh - env(safe-area-inset-top) - 0.48rem);
  padding: 20px 16px calc(16px + env(safe-area-inset-bottom));
  border-radius: 26px 26px 0 0;
  background:
    radial-gradient(circle at top right, rgba(249, 216, 109, 0.24) 0%, transparent 34%),
    linear-gradient(180deg, #fffdf7 0%, #f8f2e8 100%);
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.mobile-report-filter-popup__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.mobile-report-filter-popup__eyebrow {
  margin: 0 0 6px;
  color: #9a6b00;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.mobile-report-filter-popup__title {
  margin: 0;
  color: #342413;
  font-size: 22px;
  font-weight: 800;
}

.mobile-report-filter-popup__close {
  padding: 0;
  border: none;
  background: transparent;
  color: #8a7a68;
  font-size: 13px;
  font-weight: 700;
}

.mobile-report-filter-popup__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.mobile-report-filter-popup__selector-field,
.mobile-option-picker__subject-card,
.mobile-option-picker__payment-option {
  padding: 0;
  min-height: 0;
  box-sizing: border-box;
}

.mobile-report-filter-popup__selector-field::after,
.mobile-option-picker__subject-card::after,
.mobile-option-picker__payment-option::after {
  display: none;
}

.mobile-report-filter-popup__selector-field {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  min-height: 50px;
  padding: 0 14px;
  border: 1px solid rgba(146, 97, 0, 0.1);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.94);
  text-align: left;
}

.mobile-report-filter-popup__field-main,
.mobile-report-filter-popup__field-side {
  min-width: 0;
}

.mobile-report-filter-popup__field-main {
  overflow: hidden;
  color: #4c3200;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.3;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mobile-report-filter-popup__field-side {
  color: #a07f32;
  font-size: 13px;
  line-height: 1.2;
  white-space: nowrap;
}

.mobile-report-filter-popup__user-chip-group {
  display: flex;
  align-items: center;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 2px;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.mobile-report-filter-popup__user-chip-group::-webkit-scrollbar {
  display: none;
}

.mobile-report-filter-popup__user-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 12px;
  border: none;
  border-radius: 14px;
  background: rgba(255, 248, 223, 0.78);
  color: #6b4a0d;
  font-size: 14px;
  font-weight: 700;
  white-space: nowrap;
}

.mobile-report-filter-popup__user-chip.is-active {
  background: rgba(255, 255, 255, 0.96);
  color: #47300b;
  box-shadow: 0 8px 16px rgba(103, 73, 12, 0.08);
}

.mobile-report-filter-popup__actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 18px;
}

.mobile-report-filter-popup__calendar-panel {
  width: 100%;
  overflow: hidden;
  border-radius: 0.32rem 0.32rem 0 0;
  background: linear-gradient(180deg, #fffdf7 0%, #f8f2e8 100%);
  padding-bottom: calc(env(safe-area-inset-bottom) + 0.24rem);
  box-shadow: 0 -0.08rem 0.32rem rgba(15, 23, 42, 0.08);
}

.mobile-report-filter-popup__calendar-panel :deep(.t-calendar) {
  background: transparent;
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
  margin: 0 0 0.4rem;
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
</style>
