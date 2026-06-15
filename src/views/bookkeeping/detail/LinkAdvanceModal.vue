<template>
  <a-modal v-model:visible="visible" title="关联垫付" fullscreen :footer="false" unmount-on-close>
    <div class="link-advance-modal-content">
      <!-- 左侧 -->
      <div class="left-panel">
        <!-- 当前报销明细信息卡 -->
        <div class="source-detail-banner">
          <div class="banner-title-group">
            <icon-info-circle class="banner-icon" />
            <span class="banner-title">当前报销明细</span>
          </div>
          <div class="banner-divider"></div>
          <div class="banner-content-inline">
            <div class="info-item" title="日期">
              <icon-calendar class="info-icon" />
              <span class="info-value">{{ sourceDetail?.detailDate || '--' }}</span>
            </div>
            <div class="info-item" title="所属用户">
              <icon-user class="info-icon" />
              <span class="info-value">{{ sourceDetail?.userNickname || '--' }}</span>
            </div>
            <div class="info-item" title="标签">
              <icon-tag class="info-icon" />
              <span class="info-value tag-text">{{ sourceDetail?.tagName || '--' }}</span>
            </div>
            <div class="info-item" title="明细名称">
              <icon-bookmark class="info-icon" />
              <span class="info-value name-value" :title="sourceDetail?.name">{{ sourceDetail?.name || '--' }}</span>
            </div>
            <div class="info-item" title="金额">
              <span class="info-icon amount-icon">¥</span>
              <span class="info-value amount-value">{{ Math.abs(sourceDetail?.amount || 0).toFixed(2) }}</span>
            </div>
            <div class="info-item" title="备注">
              <icon-message class="info-icon" />
              <span class="info-value remark-value" :title="sourceDetail?.remark">{{ sourceDetail?.remark || '--' }}</span>
            </div>
          </div>
        </div>

        <!-- 搜索区 -->
        <div class="search-area">
          <a-space direction="vertical" size="medium" fill>
            <!-- 顶层必须选择账户 -->
            <a-select v-model="selectedAdvanceUserId" placeholder="请选择要报销的用户 (必须)" allow-clear allow-search
              :options="filteredUserOptions" @change="onAdvanceUserChange" />
              
            <!-- 过滤条件表单 -->
            <GiForm
              v-model="filterForm"
              search
              :columns="queryFormColumns"
              size="small"
              :hide-fold-btn="true"
              @search="loadCandidates"
              @reset="onResetSearch"
            >
              <template #category>
                <div class="subject-query-radio-scroll">
                  <a-radio-group
                    v-model="filterForm.category"
                    :options="categoryQueryOptions"
                    @change="handleCategoryQueryChange"
                  />
                </div>
              </template>
              <template #subjectId>
                <div class="subject-query-radio-scroll">
                  <a-radio-group
                    v-model="filterForm.subjectId"
                    :options="subjectQueryOptions"
                    @change="handleSubjectQueryChange"
                  />
                </div>
              </template>
              <template #tagId>
                <div class="subject-query-radio-scroll">
                  <a-radio-group
                    v-model="filterForm.tagId"
                    :options="tagQueryOptions"
                    :disabled="!filterForm.subjectId"
                    @change="handleTagQueryChange"
                  />
                </div>
              </template>
              <template #paymentMethod>
                <div class="subject-query-radio-scroll">
                  <a-radio-group
                    v-model="filterForm.paymentMethod"
                    :options="paymentMethodQueryOptions"
                    @change="handlePaymentMethodQueryChange"
                  />
                </div>
              </template>
              <template #paymentAccountId>
                <div class="subject-query-radio-scroll">
                  <a-radio-group
                    v-model="filterForm.paymentAccountId"
                    :options="paymentAccountQueryOptions"
                    @change="handlePaymentAccountQueryChange"
                  />
                </div>
              </template>
              <template #isNecessary>
                <div class="subject-query-radio-scroll">
                  <a-radio-group
                    v-model="filterForm.isNecessary"
                    :options="isNecessaryQueryOptions"
                    @change="handleIsNecessaryQueryChange"
                  />
                </div>
              </template>
              <template #timeFilter>
                <div class="detail-time-filter">
                  <a-radio-group
                    v-model="filterForm.timeMode"
                    type="button"
                    size="small"
                    class="detail-time-filter__mode"
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
                    <div v-if="filterForm.timeMode === 'preset'" class="detail-time-filter__preset-list">
                      <a-radio-group
                        v-model="filterForm.datePreset"
                        type="button"
                        size="small"
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
                      v-else-if="filterForm.timeMode === 'week'"
                      v-model="timePickerState.weekDate"
                      class="detail-time-filter__picker"
                      format="YYYY-MM-DD"
                      value-format="YYYY-MM-DD"
                      :allow-clear="false"
                      @change="handleWeekPickerChange"
                    />

                    <a-month-picker
                      v-else-if="filterForm.timeMode === 'month'"
                      v-model="timePickerState.month"
                      class="detail-time-filter__picker"
                      format="YYYY-MM"
                      value-format="YYYY-MM"
                      :allow-clear="false"
                      @change="handleMonthPickerChange"
                    />

                    <a-quarter-picker
                      v-else-if="filterForm.timeMode === 'quarter'"
                      v-model="timePickerState.quarter"
                      class="detail-time-filter__picker"
                      format="YYYY-[Q]Q"
                      value-format="YYYY-[Q]Q"
                      :allow-clear="false"
                      @change="handleQuarterPickerChange"
                    />

                    <a-year-picker
                      v-else-if="filterForm.timeMode === 'year'"
                      v-model="timePickerState.year"
                      class="detail-time-filter__picker"
                      format="YYYY"
                      value-format="YYYY"
                      :allow-clear="false"
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
                      @change="handleRangePickerChange"
                    />

                    <span class="detail-time-filter__range-text">
                      {{ activeDateRangeText }}
                    </span>
                  </div>
                </div>
              </template>
            </GiForm>
          </a-space>
        </div>

        <!-- 候选明细列表 -->
        <div class="candidate-list">
          <a-table :data="candidateList" :loading="loading" :pagination="false" row-key="id"
            :row-selection="{ type: 'radio', selectedRowKeys: selectedKeys }" size="small"
            @selection-change="onSelectionChange">
            <template #columns>
              <a-table-column title="名称" data-index="name" :width="120" ellipsis />
              <a-table-column title="金额" data-index="amount" :width="100" align="right">
                <template #cell="{ record }">{{ Math.abs(record.amount) }}</template>
              </a-table-column>
              <a-table-column title="日期" data-index="detailDate" :width="110" />
              <a-table-column title="科目" data-index="subjectName" :width="100" ellipsis />
            </template>
          </a-table>
        </div>

        <!-- 确认按钮 -->
        <div class="action-bar">
          <a-space>
            <a-button type="primary" :disabled="!selectedDetailId" @click="onConfirmLink">确认关联</a-button>
            <a-button @click="visible = false">取消</a-button>
          </a-space>
        </div>
      </div>

      <!-- 右侧 -->
      <div class="right-panel">
        <div class="panel-title">为用户新增垫付明细</div>
        <div class="add-action-area" style="text-align: center; padding: 40px 0;">
          <a-space direction="vertical" align="center" fill>
            <a-button type="outline" @click="openAddForUser">
              <template #icon><icon-plus /></template>
              立即新增垫付明细
            </a-button>
            <span style="font-size: 12px; color: var(--color-text-3);">
              新增后将自动出现在左侧候选列表中
            </span>
          </a-space>
        </div>
        <AddModal ref="addModalRef" @save-success="onAddSuccess" />
      </div>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
/**
 * 关联垫付弹窗
 *
 * @author Wangsongsong
 * @date 2026-05-30
 * @update 2026-05-30 @Wangsongsong
 * @desc 优化并对齐搜索条件至明细管理筛选项，支持多维度过滤和重置查询
 * @update 2026-06-07 @Codex
 * @desc 右侧快捷新增不再手工传 isReimbursed，关联完成后由后端按真实双向关系自动派生
 */
import { Message } from '@arco-design/web-vue'
import { computed, ref, reactive } from 'vue'
import AddModal from './AddModal.vue'
import { linkReimburse, listAdvanceCandidates } from '@/apis/bookkeeping/detail'
import type { DetailResp } from '@/apis/bookkeeping/type'
import { useDetailUserOptions } from '../shared/useDetailUserOptions'
import { useBookkeepingCommonFilters } from '../shared/useBookkeepingCommonFilters'
import { GiForm, type ColumnItem } from '@/components/GiForm'
import {
  DETAIL_DATE_PRESET_OPTIONS,
  DETAIL_DEFAULT_DATE_PRESET,
  DETAIL_DEFAULT_TIME_MODE,
  DETAIL_TIME_MODE_OPTIONS,
  type DetailTimePickerState,
  createDefaultDetailTimePickerState,
  getDetailMonthRange,
  getDetailPresetRange,
  getDetailQuarterRange,
  getDetailWeekRange,
  getDetailYearRange,
} from '../shared/detailTime'
import type { DetailDatePreset, DetailTimeMode } from '@/apis/bookkeeping/type'

interface Props {
  sourceDetail: DetailResp
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'link-success'): void
}>()

const visible = ref(false)
const loading = ref(false)
const selectedAdvanceUserId = ref('')
const selectedDetailId = ref('')
const selectedKeys = computed(() => selectedDetailId.value ? [selectedDetailId.value] : [])
const candidateList = ref<DetailResp[]>([])
const addModalRef = ref<InstanceType<typeof AddModal>>()

const { userOptions, loadUserOptions } = useDetailUserOptions()

// 过滤掉当前明细所属的用户（自己不能选自己关联自己）
const filteredUserOptions = computed(() => {
  if (!props.sourceDetail?.userId) return userOptions.value
  return userOptions.value.filter((item: any) => String(item.value) !== String(props.sourceDetail.userId))
})

// 反向关联垫付时，同样先按当前报销明细金额做精确匹配，
// 避免候选列表把同时间段下的全部支出都摊开给用户逐条翻找。
const exactCandidateAmount = computed(() => {
  const amount = Math.abs(Number(props.sourceDetail?.amount ?? 0))
  return Number.isFinite(amount) && amount !== 0 ? amount : undefined
})

// 创建弹窗过滤表单默认状态
const createDefaultFilterForm = () => {
  const presetRange = getDetailPresetRange(DETAIL_DEFAULT_DATE_PRESET)
  return {
    name: '',
    category: '',
    subjectId: '',
    tagId: '',
    paymentMethod: '',
    paymentAccountId: '',
    isNecessary: '',
    remark: '',
    timeMode: DETAIL_DEFAULT_TIME_MODE as DetailTimeMode,
    datePreset: DETAIL_DEFAULT_DATE_PRESET as DetailDatePreset,
    startDate: presetRange.startDate,
    endDate: presetRange.endDate,
  }
}

// 搜索过滤表单条件
const filterForm = reactive(createDefaultFilterForm())
const timePickerState = reactive<DetailTimePickerState>(createDefaultDetailTimePickerState())

const detailTimeModeOptions = DETAIL_TIME_MODE_OPTIONS
const detailDatePresetOptions = DETAIL_DATE_PRESET_OPTIONS

const detailRangePickerStyle = {
  flex: '0 0 320px',
  width: '320px',
  minWidth: '320px',
  maxWidth: '320px',
}

const activeDateRangeText = computed(() => {
  if (!filterForm.startDate || !filterForm.endDate) {
    return '未选择时间范围'
  }
  return `${filterForm.startDate} 至 ${filterForm.endDate}`
})

/**
 * 同步候选列表选中项。
 *
 * 筛选条件变化后，旧的 selectedDetailId 可能已经不在当前候选列表中。
 * 这里统一兜底清理，避免用户确认时关联到当前界面不可见的历史选中明细。
 */
function syncSelectedCandidate() {
  if (!selectedDetailId.value) {
    return
  }
  const exists = candidateList.value.some(item => String(item.id) === String(selectedDetailId.value))
  if (!exists) {
    selectedDetailId.value = ''
  }
}

// 通用筛选项挂载
const {
  paymentMethodQueryOptions,
  paymentAccountQueryOptions,
  isNecessaryQueryOptions,
  subjectQueryOptions,
  tagQueryOptions,
  categoryQueryOptions,
  clearSubjectSelection,
  loadCommonFilterOptions,
  createCommonQueryColumns,
} = useBookkeepingCommonFilters({
  form: filterForm,
  labels: {
    userAll: '全部',
    categoryAll: '全部',
    subjectAll: '全部',
    paymentAll: '全部',
  },
})

// 复用一比一 Radio Group 查询列
const commonQueryColumns = createCommonQueryColumns({
  category: {
    span: 24,
    useRadioGroup: true,
    onChange: handleCategoryQueryChange,
  },
  subject: {
    span: 24,
    useRadioGroup: true,
    onChange: handleSubjectQueryChange,
  },
  tag: {
    span: 24,
    useRadioGroup: true,
    onChange: handleTagQueryChange,
  },
  paymentMethod: {
    span: 24,
    useRadioGroup: true,
    onChange: handlePaymentMethodQueryChange,
  },
  paymentAccount: {
    span: 24,
    useRadioGroup: true,
    onChange: handlePaymentAccountQueryChange,
  },
  isNecessary: {
    span: 24,
    useRadioGroup: true,
    onChange: handleIsNecessaryQueryChange,
  },
})

// 表单列结构配置定义
const queryFormColumns = computed<ColumnItem[]>(() => [
  {
    label: '时间范围',
    field: 'timeFilter',
    span: 24,
  },
  commonQueryColumns.categoryColumn,
  commonQueryColumns.subjectColumn,
  commonQueryColumns.tagColumn,
  commonQueryColumns.paymentMethodColumn,
  commonQueryColumns.paymentAccountColumn,
  {
    ...commonQueryColumns.isNecessaryColumn,
    span: 8,
  },
  {
    type: 'input',
    label: '明细名称',
    field: 'name',
    span: 8,
    props: {
      placeholder: '请输入明细名称',
      allowClear: true,
    },
  },
  {
    type: 'input',
    label: '备注',
    field: 'remark',
    span: 8,
    props: {
      placeholder: '备注关键字搜索',
      allowClear: true,
    },
  },
])

// 联动处理函数
function handleCategoryQueryChange() {
  clearSubjectSelection()
  loadCandidates()
}

function handleSubjectQueryChange() {
  loadCandidates()
}

function handleTagQueryChange() {
  loadCandidates()
}

function handlePaymentMethodQueryChange() {
  loadCandidates()
}

function handlePaymentAccountQueryChange() {
  loadCandidates()
}

function handleIsNecessaryQueryChange() {
  loadCandidates()
}

// 时间过滤相关处理函数
const applyTimeRangeToQuery = (options: {
  timeMode: DetailTimeMode
  startDate: string
  endDate: string
  datePreset?: DetailDatePreset
}) => {
  filterForm.timeMode = options.timeMode
  filterForm.startDate = options.startDate
  filterForm.endDate = options.endDate
  filterForm.datePreset = options.datePreset ?? filterForm.datePreset
}

const handleTimeModeChange = (value: string | number | boolean) => {
  const nextMode = String(value) as DetailTimeMode
  if (filterForm.startDate && filterForm.endDate) {
    timePickerState.range = [filterForm.startDate, filterForm.endDate]
  }

  switch (nextMode) {
    case 'preset': {
      const preset = filterForm.datePreset || DETAIL_DEFAULT_DATE_PRESET
      const range = getDetailPresetRange(preset)
      applyTimeRangeToQuery({ timeMode: 'preset', datePreset: preset, ...range })
      timePickerState.range = [range.startDate, range.endDate]
      break
    }
    case 'week': {
      const range = getDetailWeekRange(timePickerState.weekDate)
      applyTimeRangeToQuery({ timeMode: 'week', ...range })
      break
    }
    case 'month': {
      const range = getDetailMonthRange(timePickerState.month)
      applyTimeRangeToQuery({ timeMode: 'month', ...range })
      break
    }
    case 'quarter': {
      const range = getDetailQuarterRange(timePickerState.quarter)
      applyTimeRangeToQuery({ timeMode: 'quarter', ...range })
      break
    }
    case 'year': {
      const range = getDetailYearRange(timePickerState.year)
      applyTimeRangeToQuery({ timeMode: 'year', ...range })
      break
    }
    case 'range': {
      const [startDate, endDate] = timePickerState.range
      if (startDate && endDate) {
        applyTimeRangeToQuery({ timeMode: 'range', startDate, endDate })
      }
      break
    }
  }

  loadCandidates()
}

const handleDatePresetChange = (value: string | number | boolean) => {
  const preset = String(value || DETAIL_DEFAULT_DATE_PRESET) as DetailDatePreset
  const range = getDetailPresetRange(preset)
  applyTimeRangeToQuery({ timeMode: 'preset', datePreset: preset, ...range })
  timePickerState.range = [range.startDate, range.endDate]
  loadCandidates()
}

const handleWeekPickerChange = (value?: string) => {
  timePickerState.weekDate = value || timePickerState.weekDate
  const range = getDetailWeekRange(timePickerState.weekDate)
  applyTimeRangeToQuery({ timeMode: 'week', ...range })
  loadCandidates()
}

const handleMonthPickerChange = (value?: string) => {
  timePickerState.month = value || timePickerState.month
  const range = getDetailMonthRange(timePickerState.month)
  applyTimeRangeToQuery({ timeMode: 'month', ...range })
  loadCandidates()
}

const handleQuarterPickerChange = (value?: string) => {
  timePickerState.quarter = value || timePickerState.quarter
  const range = getDetailQuarterRange(timePickerState.quarter)
  applyTimeRangeToQuery({ timeMode: 'quarter', ...range })
  loadCandidates()
}

const handleYearPickerChange = (value?: string) => {
  timePickerState.year = value || timePickerState.year
  const range = getDetailYearRange(timePickerState.year)
  applyTimeRangeToQuery({ timeMode: 'year', ...range })
  loadCandidates()
}

const handleRangePickerChange = (value?: string[]) => {
  if (!value || value.length !== 2 || !value[0] || !value[1]) {
    return
  }
  timePickerState.range = [...value]
  applyTimeRangeToQuery({ timeMode: 'range', startDate: value[0], endDate: value[1] })
  loadCandidates()
}

/** 用户切换时重新加载候选列表 */
function onAdvanceUserChange() {
  selectedDetailId.value = ''
  loadCandidates()
}

/** 加载候选明细列表 */
async function loadCandidates() {
  if (!selectedAdvanceUserId.value) {
    candidateList.value = []
    selectedDetailId.value = ''
    return
  }
  loading.value = true
  try {
    const params: any = {
      userId: selectedAdvanceUserId.value,
      name: filterForm.name || undefined,
      category: filterForm.category || undefined,
      subjectId: filterForm.subjectId || undefined,
      tagId: filterForm.tagId || undefined,
      paymentMethod: filterForm.paymentMethod || undefined,
      paymentAccountId: filterForm.paymentAccountId || undefined,
      remark: filterForm.remark || undefined,
      sort: ['detailDate,desc'],
    }
    if (exactCandidateAmount.value != null) {
      params.candidateAmount = exactCandidateAmount.value
    }
    if (filterForm.isNecessary !== '') {
      params.isNecessary = Number(filterForm.isNecessary)
    }
    if (filterForm.startDate && filterForm.endDate) {
      params.startDate = filterForm.startDate
      params.endDate = filterForm.endDate
    }
    const res = await listAdvanceCandidates(params)
    candidateList.value = res.data ?? res ?? []
    syncSelectedCandidate()
  } finally {
    loading.value = false
  }
}

/** 单选变化 */
function onSelectionChange(keys: string[]) {
  selectedDetailId.value = keys[0] || ''
}

/** 确认关联 */
async function onConfirmLink() {
  if (!selectedDetailId.value) {
    Message.warning('请先选择要关联的垫付明细')
    return
  }
  try {
    await linkReimburse({
      advanceDetailId: selectedDetailId.value,
      reimburseDetailId: String(props.sourceDetail.id),
    })
    Message.success('关联成功')
    emit('link-success')
    visible.value = false
  } catch (e) {
    // 错误由 http 拦截器处理
  }
}

/** 右侧新增成功后刷新左侧列表 */
function onAddSuccess() {
  loadCandidates()
}

/** 重置搜索 */
function onResetSearch() {
  Object.assign(filterForm, createDefaultFilterForm())
  Object.assign(timePickerState, createDefaultDetailTimePickerState())
  selectedDetailId.value = ''
  loadCandidates()
}

/** 打开弹窗 */
function open() {
  visible.value = true
  selectedAdvanceUserId.value = ''
  selectedDetailId.value = ''
  Object.assign(filterForm, createDefaultFilterForm())
  Object.assign(timePickerState, createDefaultDetailTimePickerState())
  candidateList.value = []
  loadUserOptions()
  loadCommonFilterOptions()
}

/** 打开右侧新增表单 */
function openAddForUser() {
  if (!selectedAdvanceUserId.value) {
    Message.warning('请先选择要报销的用户')
    return
  }
  addModalRef.value?.onAddForUser({
    userId: selectedAdvanceUserId.value,
    category: 'expense',
    isAdvance: 1,
    isReimburseOther: 0,
  })
}

defineExpose({ open })
</script>

<style scoped lang="scss">
.link-advance-modal-content {
  display: flex;
  gap: 16px;
  min-height: 500px;
}

.left-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-x: hidden;
}

.right-panel {
  width: 380px;
  border-left: 1px solid var(--color-border-2);
  padding-left: 16px;
}

.panel-title {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 12px;
  color: var(--color-text-1);
}

.source-detail-banner {
  display: flex;
  align-items: center;
  background: linear-gradient(to right, rgba(var(--primary-6), 0.08), rgba(var(--primary-6), 0.02));
  border: 1px solid rgba(var(--primary-6), 0.15);
  border-radius: 6px;
  padding: 10px 16px;
  margin-bottom: 8px;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 2px 8px rgba(var(--primary-6), 0.05);
  }

  .banner-title-group {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
    
    .banner-icon {
      color: rgb(var(--primary-6));
      font-size: 16px;
    }
    
    .banner-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--color-text-1);
    }
  }

  .banner-divider {
    width: 1px;
    height: 16px;
    background-color: var(--color-border-2);
    margin: 0 16px;
    flex-shrink: 0;
  }

  .banner-content-inline {
    display: flex;
    align-items: center;
    gap: 24px;
    flex: 1;
    min-width: 0;
    
    .info-item {
      display: flex;
      align-items: center;
      gap: 6px;
      min-width: 0;
      
      .info-icon {
        color: var(--color-text-3);
        font-size: 14px;
        flex-shrink: 0;

        &.amount-icon {
          color: rgb(var(--danger-6));
          font-weight: bold;
          font-family: Arial, sans-serif;
        }
      }
      
      .info-value {
        font-size: 13px;
        color: var(--color-text-1);
        
        &.amount-value {
          color: rgb(var(--danger-6));
          font-family: 'Din', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          font-weight: 600;
          font-size: 15px;
        }
        
        &.name-value {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 120px;
          display: inline-block;
          vertical-align: middle;
        }

        &.remark-value {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 150px;
          display: inline-block;
          vertical-align: middle;
        }

        &.tag-text {
          color: rgb(var(--primary-6));
          background: rgba(var(--primary-6), 0.1);
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 12px;
        }
      }
    }
  }
}

.search-area {
  :deep(.arco-space) {
    width: 100%;
  }
}

.candidate-list {
  flex: 1;
  overflow-y: auto;
}

.action-bar {
  padding-top: 12px;
  border-top: 1px solid var(--color-border-2);
  display: flex;
  justify-content: flex-end;
}

.subject-query-radio-scroll {
  width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  white-space: nowrap;

  :deep(.arco-radio-group) {
    display: flex;
    flex-wrap: nowrap;
    width: max-content;
    padding-bottom: 4px;
  }

  :deep(.arco-radio) {
    flex: 0 0 auto;
    margin-right: 16px;
    margin-bottom: 0;
    white-space: nowrap;
  }

  :deep(.arco-radio-label) {
    white-space: nowrap;
  }
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
