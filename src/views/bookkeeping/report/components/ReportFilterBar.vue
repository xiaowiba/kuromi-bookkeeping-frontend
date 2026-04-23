<template>
  <a-card :bordered="false" class="report-filter-bar">
    <GiForm
      v-model="filterFormModel"
      search
      :columns="queryFormColumns"
      size="medium"
      :disabled="loading"
      @search="emit('search')"
      @reset="emit('reset')"
    >
      <template #prefix-extra>
        <a-button v-if="privacyMode" status="warning" size="small" :disabled="loading" @click="emit('exit-privacy')">
          <template #icon><icon-lock /></template>
          退出隐私模式
        </a-button>
        <a-tag v-if="privacyMode" size="small" color="orange">
          剩余 {{ privacyRemainingText }}
        </a-tag>
      </template>

      <template #timeFilter>
        <div class="detail-time-filter">
          <a-radio-group
            v-model="filterFormModel.timeMode"
            type="button"
            size="small"
            class="detail-time-filter__mode"
            :disabled="loading"
            @change="handleTimeModeChange"
          >
            <a-radio
              v-for="item in detailTimeModeOptions"
              :key="String(item.value)"
              :value="item.value"
            >
              {{ item.label }}
            </a-radio>
          </a-radio-group>

          <div class="detail-time-filter__panel">
            <div v-if="filterFormModel.timeMode === 'preset'" class="detail-time-filter__preset-list">
              <a-radio-group
                v-model="filterFormModel.datePreset"
                type="button"
                size="small"
                :disabled="loading"
                @change="handleDatePresetChange"
              >
                <a-radio
                  v-for="item in detailDatePresetOptions"
                  :key="String(item.value)"
                  :value="item.value"
                >
                  {{ item.label }}
                </a-radio>
              </a-radio-group>
            </div>

            <a-date-picker
              v-else-if="filterFormModel.timeMode === 'week'"
              v-model="timePickerState.weekDate"
              class="detail-time-filter__picker"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              :allow-clear="false"
              :disabled="loading"
              @change="handleWeekPickerChange"
            />

            <a-month-picker
              v-else-if="filterFormModel.timeMode === 'month'"
              v-model="timePickerState.month"
              class="detail-time-filter__picker"
              format="YYYY-MM"
              value-format="YYYY-MM"
              :allow-clear="false"
              :disabled="loading"
              @change="handleMonthPickerChange"
            />

            <a-quarter-picker
              v-else-if="filterFormModel.timeMode === 'quarter'"
              v-model="timePickerState.quarter"
              class="detail-time-filter__picker"
              format="YYYY-[Q]Q"
              value-format="YYYY-[Q]Q"
              :allow-clear="false"
              :disabled="loading"
              @change="handleQuarterPickerChange"
            />

            <a-year-picker
              v-else-if="filterFormModel.timeMode === 'year'"
              v-model="timePickerState.year"
              class="detail-time-filter__picker"
              format="YYYY"
              value-format="YYYY"
              :allow-clear="false"
              :disabled="loading"
              @change="handleYearPickerChange"
            />

            <a-range-picker
              v-else
              v-model="timePickerState.range"
              class="detail-time-filter__picker detail-time-filter__picker--range"
              :style="detailRangePickerStyle"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              :allow-clear="false"
              :disabled="loading"
              @change="handleRangePickerChange"
            />

            <span class="detail-time-filter__range-text">
              {{ activeDateRangeText }}
            </span>
          </div>
        </div>
      </template>

      <template #userId>
        <div class="subject-query-radio-scroll">
          <a-radio-group
            v-model="selectedUserId"
            :options="userQueryOptions"
            :disabled="loading"
            @change="handleUserChange"
          />
        </div>
      </template>

      <template #category>
        <div class="subject-query-radio-scroll">
          <a-radio-group
            v-model="filterFormModel.category"
            :options="categoryOptions"
            :disabled="loading"
            @change="handleCategoryChange"
          />
        </div>
      </template>

      <template #subjectId>
        <div class="subject-query-radio-scroll">
          <a-radio-group
            v-model="filterFormModel.subjectId"
            :options="subjectOptions"
            :disabled="loading"
            @change="handleSubjectChange"
          />
        </div>
      </template>

      <template #tagId>
        <div class="subject-query-radio-scroll">
          <a-radio-group
            v-model="filterFormModel.tagId"
            :options="tagOptions"
            :disabled="loading || !filterFormModel.subjectId"
            @change="handleTagChange"
          />
        </div>
      </template>

      <template #paymentMethod>
        <div class="subject-query-radio-scroll">
          <a-radio-group
            v-model="filterFormModel.paymentMethod"
            :options="paymentMethodOptions"
            :disabled="loading"
            @change="handlePaymentMethodChange"
          />
        </div>
      </template>
      <template #paymentAccountId>
        <div class="subject-query-radio-scroll">
          <a-radio-group
            v-model="filterFormModel.paymentAccountId"
            :options="paymentAccountOptions"
            :disabled="loading"
            @change="handlePaymentAccountChange"
          />
        </div>
      </template>
    </GiForm>
  </a-card>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import { computed, nextTick, reactive, watch } from 'vue'
import type { DetailDatePreset, DetailTimeMode, ReportFilterForm } from '@/apis/bookkeeping/type'
import type { ColumnItem } from '@/components/GiForm'
import type { LabelValueState } from '@/types/global'
import {
  DETAIL_DATE_PRESET_OPTIONS,
  DETAIL_DEFAULT_DATE_PRESET,
  DETAIL_TIME_MODE_OPTIONS,
  type DetailTimePickerState,
  createDefaultDetailTimePickerState,
  getDetailMonthRange,
  getDetailPresetRange,
  getDetailQuarterRange,
  getDetailWeekRange,
  getDetailYearRange,
} from '@/views/bookkeeping/shared/detailTime'

interface Props {
  filterForm: ReportFilterForm
  categoryOptions: LabelValueState[]
  subjectOptions: LabelValueState[]
  tagOptions: LabelValueState[]
  paymentMethodOptions: LabelValueState[]
  paymentAccountOptions: LabelValueState[]
  userQueryOptions: LabelValueState[]
  onSelectUser: (value?: string | number | null) => void
  isAdmin: boolean
  privacyMode?: boolean
  privacyRemainingText?: string
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
})

const emit = defineEmits<{
  (e: 'update:filterForm', value: ReportFilterForm): void
  (e: 'search'): void
  (e: 'reset'): void
  (e: 'exit-privacy'): void
}>()

const filterFormModel = computed({
  get: () => props.filterForm,
  set: (value) => {
    emit('update:filterForm', value)
  },
})

const timePickerState = reactive<DetailTimePickerState>(createDefaultDetailTimePickerState())
const detailTimeModeOptions = DETAIL_TIME_MODE_OPTIONS
const detailDatePresetOptions = DETAIL_DATE_PRESET_OPTIONS

/** 自定义范围选择器在桌面端使用固定宽度，避免占满整行。 */
const detailRangePickerStyle = {
  flex: '0 0 320px',
  width: '320px',
  minWidth: '320px',
  maxWidth: '320px',
}

const selectedUserId = computed({
  get: () => (filterFormModel.value.userScope === 'all' ? '' : filterFormModel.value.userId),
  set: (value) => {
    props.onSelectUser(value)
  },
})

/** 当前查询时间范围文案，直接复用明细页的展示口径。 */
const activeDateRangeText = computed(() => {
  if (!filterFormModel.value.startDate || !filterFormModel.value.endDate) {
    return '未选择时间范围'
  }
  return `${filterFormModel.value.startDate} 至 ${filterFormModel.value.endDate}`
})

const queryFormColumns: ColumnItem<ReportFilterForm>[] = reactive([
  {
    label: '时间范围',
    field: 'timeFilter',
    span: { xs: 24, sm: 24, xxl: 24 },
  },
  {
    type: 'radio-group',
    label: '所属用户',
    field: 'userId',
    span: { xs: 24, sm: 12, xxl: 12 },
  },
  {
    type: 'radio-group',
    label: '分类',
    field: 'category',
    span: { xs: 24, sm: 12, xxl: 12 },
  },
  {
    type: 'radio-group',
    label: '科目',
    field: 'subjectId',
    span: { xs: 24, sm: 24, xxl: 24 },
  },
  {
    type: 'radio-group',
    label: '标签',
    field: 'tagId',
    span: { xs: 24, sm: 24, xxl: 24 },
  },
  {
    type: 'radio-group',
    label: '支付方式',
    field: 'paymentMethod',
    span: { xs: 24, sm: 24, xxl: 24 },
  },
  {
    type: 'radio-group',
    label: '支付账号',
    field: 'paymentAccountId',
    span: { xs: 24, sm: 24, xxl: 24 },
  },
  {
    type: 'radio-group',
    label: '是否隐藏',
    field: 'hidden',
    span: { xs: 24, sm: 24, xxl: 24 },
    show: () => props.isAdmin,
    props: {
      options: [
        { label: '全部', value: '' },
        { label: '正常', value: 0 },
        { label: '隐藏', value: 1 },
      ],
    },
  },
])

const triggerSearch = () => {
  nextTick(() => {
    emit('search')
  })
}

const applyTimeRangeToFilter = (options: {
  timeMode: DetailTimeMode
  startDate: string
  endDate: string
  datePreset?: DetailDatePreset
}) => {
  filterFormModel.value.timeMode = options.timeMode
  filterFormModel.value.startDate = options.startDate
  filterFormModel.value.endDate = options.endDate
  filterFormModel.value.dateRange = [options.startDate, options.endDate]
  if (options.datePreset) {
    filterFormModel.value.datePreset = options.datePreset
  }
}

const resolveQuarterValue = (dateText?: string) => {
  if (!dateText || !dayjs(dateText).isValid()) {
    return timePickerState.quarter
  }
  const current = dayjs(dateText)
  return `${current.format('YYYY')}-Q${Math.ceil((current.month() + 1) / 3)}`
}

/** 表单被重置或外部回填时，同步更新各类时间选择器的显示值。 */
const syncTimePickerStateFromForm = () => {
  const startDate = filterFormModel.value.startDate
  const endDate = filterFormModel.value.endDate
  if (!startDate || !endDate) {
    return
  }

  timePickerState.range = [startDate, endDate]
  timePickerState.weekDate = startDate
  timePickerState.month = dayjs(startDate).isValid() ? dayjs(startDate).format('YYYY-MM') : timePickerState.month
  timePickerState.quarter = resolveQuarterValue(startDate)
  timePickerState.year = dayjs(startDate).isValid() ? dayjs(startDate).format('YYYY') : timePickerState.year
}

const handleTimeModeChange = (value: string | number | boolean) => {
  const nextMode = String(value || 'preset') as DetailTimeMode

  switch (nextMode) {
    case 'preset': {
      const preset = (filterFormModel.value.datePreset === 'custom' ? DETAIL_DEFAULT_DATE_PRESET : filterFormModel.value.datePreset) as DetailDatePreset
      const range = getDetailPresetRange(preset)
      applyTimeRangeToFilter({ timeMode: 'preset', datePreset: preset, ...range })
      break
    }
    case 'week': {
      const range = getDetailWeekRange(timePickerState.weekDate)
      applyTimeRangeToFilter({ timeMode: 'week', ...range })
      break
    }
    case 'month': {
      const range = getDetailMonthRange(timePickerState.month)
      applyTimeRangeToFilter({ timeMode: 'month', ...range })
      break
    }
    case 'quarter': {
      const range = getDetailQuarterRange(timePickerState.quarter)
      applyTimeRangeToFilter({ timeMode: 'quarter', ...range })
      break
    }
    case 'year': {
      const range = getDetailYearRange(timePickerState.year)
      applyTimeRangeToFilter({ timeMode: 'year', ...range })
      break
    }
    case 'range': {
      const [startDate, endDate] = timePickerState.range
      if (!startDate || !endDate) {
        return
      }
      applyTimeRangeToFilter({ timeMode: 'range', startDate, endDate })
      break
    }
  }

  triggerSearch()
}

const handleDatePresetChange = (value: string | number | boolean) => {
  const preset = String(value || DETAIL_DEFAULT_DATE_PRESET) as DetailDatePreset
  const range = getDetailPresetRange(preset)
  applyTimeRangeToFilter({ timeMode: 'preset', datePreset: preset, ...range })
  triggerSearch()
}

const handleWeekPickerChange = (value?: string) => {
  timePickerState.weekDate = value || timePickerState.weekDate
  const range = getDetailWeekRange(timePickerState.weekDate)
  applyTimeRangeToFilter({ timeMode: 'week', ...range })
  triggerSearch()
}

const handleMonthPickerChange = (value?: string) => {
  timePickerState.month = value || timePickerState.month
  const range = getDetailMonthRange(timePickerState.month)
  applyTimeRangeToFilter({ timeMode: 'month', ...range })
  triggerSearch()
}

const handleQuarterPickerChange = (value?: string) => {
  timePickerState.quarter = value || timePickerState.quarter
  const range = getDetailQuarterRange(timePickerState.quarter)
  applyTimeRangeToFilter({ timeMode: 'quarter', ...range })
  triggerSearch()
}

const handleYearPickerChange = (value?: string) => {
  timePickerState.year = value || timePickerState.year
  const range = getDetailYearRange(timePickerState.year)
  applyTimeRangeToFilter({ timeMode: 'year', ...range })
  triggerSearch()
}

const handleRangePickerChange = (value?: string[]) => {
  if (!value || value.length !== 2 || !value[0] || !value[1]) {
    return
  }
  timePickerState.range = [...value]
  applyTimeRangeToFilter({ timeMode: 'range', startDate: value[0], endDate: value[1] })
  triggerSearch()
}

/** 分类切换后主动清空科目，避免继续带着旧分类下的无效科目查询。 */
const handleCategoryChange = () => {
  filterFormModel.value.subjectId = ''
  filterFormModel.value.tagId = ''
  triggerSearch()
}

const handleSubjectChange = () => {
  filterFormModel.value.tagId = ''
  triggerSearch()
}

const handleTagChange = () => {
  triggerSearch()
}

const handlePaymentMethodChange = () => {
  triggerSearch()
}

const handlePaymentAccountChange = () => {
  triggerSearch()
}

const handleUserChange = () => {
  triggerSearch()
}

watch(
  () => [filterFormModel.value.timeMode, filterFormModel.value.startDate, filterFormModel.value.endDate, filterFormModel.value.datePreset],
  () => {
    syncTimePickerStateFromForm()
  },
  { immediate: true },
)
</script>

<style scoped lang="scss">
.report-filter-bar {
  border: 1px solid rgba(229, 230, 235, 0.9);
  border-radius: 16px;
  background: var(--color-bg-1);
  box-shadow: none;
}

.report-filter-bar :deep(.arco-card-body) {
  padding: 18px;
}

.detail-time-filter {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: nowrap;
  width: 100%;
}

.detail-time-filter__mode {
  flex: 0 0 auto;

  :deep(.arco-radio-group) {
    flex-wrap: nowrap;
  }
}

.detail-time-filter__panel {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1 1 auto;
  flex-wrap: nowrap;
  min-width: 0;
}

.detail-time-filter__preset-list {
  display: flex;
  align-items: center;
  flex: 0 0 auto;
}

.detail-time-filter__picker {
  flex: 0 0 220px;
  min-width: 220px;
}

.detail-time-filter__picker--range {
  flex-basis: 320px;
  min-width: 320px;
  max-width: 320px;
}

.detail-time-filter__range-text {
  flex: 0 1 auto;
  color: var(--color-text-3);
  font-size: 13px;
  line-height: 1.6;
  white-space: nowrap;
}

.subject-query-radio-scroll {
  width: 100%;
  overflow: visible;

  :deep(.arco-radio-group) {
    display: flex;
    flex-wrap: wrap;
    width: 100%;
  }

  :deep(.arco-radio) {
    flex: 0 0 auto;
    margin-right: 16px;
    margin-bottom: 8px;
    white-space: nowrap;
  }

  :deep(.arco-radio-label) {
    white-space: nowrap;
  }
}

@media (max-width: 768px) {
  .detail-time-filter {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }

  .detail-time-filter__mode {
    width: 100%;

    :deep(.arco-radio-group) {
      flex-wrap: wrap;
    }
  }

  .detail-time-filter__panel {
    flex-wrap: wrap;
  }

  .detail-time-filter__preset-list {
    flex-wrap: wrap;
  }

  .detail-time-filter__picker {
    min-width: 100%;
  }

  .detail-time-filter__range-text {
    width: 100%;
    white-space: normal;
  }
}
</style>
