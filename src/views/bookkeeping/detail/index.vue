<template>
  <GiPageLayout>
    <GiTable
      ref="tableRef"
      row-key="id"
      :data="dataList"
      :columns="columns"
      :loading="loading"
      :scroll="{ x: '100%', y: '100%', minWidth: 900 }"
      :pagination="tablePagination"
      :disabled-tools="['size']"
      :disabled-column-keys="['subjectDetail']"
      @refresh="searchMethod"
    >
      <template #top>
        <GiForm
          v-model="queryForm"
          search
          :columns="queryFormColumns"
          size="medium"
          @search="searchMethod"
          @reset="reset"
        >
          <template #subjectId>
            <div class="subject-query-radio-scroll">
              <a-radio-group
                v-model="queryForm.subjectId"
                :options="subjectOptions"
                @change="handleSubjectQueryChange"
              />
            </div>
          </template>
          <template #paymentMethod>
            <div class="subject-query-radio-scroll">
              <a-radio-group
                v-model="queryForm.paymentMethod"
                :options="paymentMethodQueryOptions"
                @change="handlePaymentMethodQueryChange"
              />
            </div>
          </template>
          <template #timeFilter>
            <div class="detail-time-filter">
              <a-radio-group
                v-model="queryForm.timeMode"
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
                <div v-if="queryForm.timeMode === 'preset'" class="detail-time-filter__preset-list">
                  <a-radio-group
                    v-model="queryForm.datePreset"
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
                  v-else-if="queryForm.timeMode === 'week'"
                  v-model="timePickerState.weekDate"
                  class="detail-time-filter__picker"
                  format="YYYY-MM-DD"
                  value-format="YYYY-MM-DD"
                  :allow-clear="false"
                  @change="handleWeekPickerChange"
                />

                <a-month-picker
                  v-else-if="queryForm.timeMode === 'month'"
                  v-model="timePickerState.month"
                  class="detail-time-filter__picker"
                  format="YYYY-MM"
                  value-format="YYYY-MM"
                  :allow-clear="false"
                  @change="handleMonthPickerChange"
                />

                <a-quarter-picker
                  v-else-if="queryForm.timeMode === 'quarter'"
                  v-model="timePickerState.quarter"
                  class="detail-time-filter__picker"
                  format="YYYY-[Q]Q"
                  value-format="YYYY-[Q]Q"
                  :allow-clear="false"
                  @change="handleQuarterPickerChange"
                />

                <a-year-picker
                  v-else-if="queryForm.timeMode === 'year'"
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
      </template>
      <template #toolbar-left>
        <a-button v-permission="['bookkeeping:detail:create']" type="primary" @click="onAdd">
          <template #icon><icon-plus /></template>
          <template #default>新增</template>
        </a-button>
        <!-- 隐私模式退出按钮 -->
        <a-button v-if="privacyStore.isPrivacyMode" status="warning" size="small" style="margin-left: 12px" @click="onExitPrivacy">
          <template #icon><icon-lock /></template>
          退出隐私模式
        </a-button>
        <!-- 隐私模式下进入隐藏配置 -->
        <a-button v-if="privacyStore.isPrivacyMode" size="small" style="margin-left: 8px" @click="router.push('/bookkeeping/hide-target')">
          <template #icon><icon-settings /></template>
          隐藏配置
        </a-button>
      </template>
      <template #toolbar-right>
        <!-- 统计数据展示 -->
        <div class="statistics-container">
          <div class="statistics-item expense">
            <span class="label">总支出：</span>
            <span class="value">{{ statistics.totalExpense.toFixed(2) }}</span>
          </div>
          <div class="statistics-item income">
            <span class="label">总收入：</span>
            <span class="value">{{ statistics.totalIncome.toFixed(2) }}</span>
          </div>
          <div class="statistics-item" :class="statistics.netIncome >= 0 ? 'income' : 'expense'">
            <span class="label">结余：</span>
            <span class="value">{{ statistics.netIncome.toFixed(2) }}</span>
          </div>
          <div class="statistics-item count">
            <span class="label">条数：</span>
            <span class="value">{{ detailRecordCount }}</span>
          </div>
        </div>
      </template>
      <template #userNickname="{ record }">
        <span>{{ record.userNickname }}</span>
      </template>
      <template #subjectCategory="{ record }">
        <GiCellTag :value="record.subjectCategory" :dict="bk_subject_category" />
      </template>
      <template #subjectDetail="{ record }">
        <BookkeepingSubjectDetailCell
          :icon="record.subjectIcon"
          :subject-name="record.subjectName"
          :detail-name="record.name"
        />
      </template>
      <template #paymentMethod="{ record }">
        <GiCellTag :value="record.paymentMethod" :dict="bk_payment_method" />
      </template>
      <template #detailDate="{ record }">
        <div class="detail-date-inline">
          <span class="detail-date-inline__text">{{ record.detailDate }}</span>
          <BookkeepingWeekdayTag :date="record.detailDate" />
        </div>
      </template>
      <template #amount="{ record }">
        <span :style="{ color: record.amount < 0 ? '#f53f3f' : '#00b42a', fontWeight: 'bold' }">
          {{ record.amount < 0 ? record.amount.toFixed(2) : `+${record.amount.toFixed(2)}` }}
        </span>
        <a-tag v-if="privacyStore.isPrivacyMode && record.hidden === 1" color="orangered" size="small" style="margin-left: 4px">隐</a-tag>
      </template>
      <template #hidden="{ record }">
        <a-tag v-if="record.hidden === 1" color="orangered" size="small">隐藏</a-tag>
        <a-tag v-else color="arcoblue" size="small">正常</a-tag>
      </template>
      <template #action="{ record }">
        <a-space>
          <a-link v-permission="['bookkeeping:detail:update']" title="修改" @click="onUpdate(record)">修改</a-link>
          <a-link
            v-permission="['bookkeeping:detail:delete']"
            status="danger"
            title="删除"
            @click="onDelete(record)"
          >
            删除
          </a-link>
        </a-space>
      </template>
    </GiTable>

    <AddModal ref="AddModalRef" @save-success="onSaveSuccess" />

    <!-- 密码验证弹窗 -->
    <a-modal v-model:visible="verifyModalVisible" title="请输入密码" :width="360" :mask-closable="false" simple @before-ok="onVerifyPassword" @close="verifyPassword = ''">
      <a-input-password v-model="verifyPassword" placeholder="请输入隐私密码" allow-clear />
    </a-modal>

    <!-- 首次设置密码弹窗 -->
    <a-modal v-model:visible="setupModalVisible" title="设置隐私密码" :width="360" :mask-closable="false" :esc-to-close="false" simple @before-ok="onSetupPassword">
      <a-space direction="vertical" fill>
        <a-input-password v-model="setupForm.password" placeholder="请输入隐私密码" allow-clear />
        <a-input-password v-model="setupForm.confirmPassword" placeholder="请再次输入密码" allow-clear />
      </a-space>
    </a-modal>
  </GiPageLayout>
</template>

<script setup lang="ts">
/**
 * Web 端明细管理列表页面
 *
 * 当前职责：
 * 1. 提供按时间、排序、用户、分类、科目、支付方式、名称等条件查询明细
 * 2. 支持分页查询与全量查询两种模式切换
 * 3. 展示总支出、总收入、结余、条数等统计信息
 * 4. 集成隐私模式入口、验证、过期同步与隐藏数据展示
 *
 * 说明：
 * 1. 当前页面只服务 Web 端展示
 * 2. 移动端明细能力由独立页面维护，不再在本页保留移动端展示分支
 *
 * @author Wangsongsong
 * @date 2026-03-18
 * @update 2026-04-03 @Wangsongsong
 * @desc 查询区重构为 Web 专用布局，统一时间模型、排序方式与共享筛选项
 * @update 2026-04-03 @Wangsongsong
 * @desc Web 端统计区补充当前查询条数，便于无分页模式下确认命中结果规模
 */
import type { TableInstance } from '@arco-design/web-vue'
import { Message } from '@arco-design/web-vue'
import { computed, h, nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import BookkeepingSubjectDetailCell from '../shared/components/BookkeepingSubjectDetailCell.vue'
import BookkeepingWeekdayTag from '../shared/components/BookkeepingWeekdayTag.vue'
import {
  DETAIL_DATE_PRESET_OPTIONS,
  DETAIL_DEFAULT_DATE_PRESET,
  DETAIL_DEFAULT_SORT,
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
import { useBookkeepingCommonFilters } from '../shared/useBookkeepingCommonFilters'
import AddModal from './AddModal.vue'
import {
  type DetailResp,
  deleteDetail,
  getDetailQueryMode,
  getDetailStatistics,
  listDetail,
  listDetailAll,
} from '@/apis/bookkeeping/detail'
import type { DetailDatePreset, DetailTimeMode } from '@/apis/bookkeeping/type'
import { getPrivacyConfig, setPrivacyPassword, verifyPrivacyPassword } from '@/apis/bookkeeping/privacy'
import type { ColumnItem } from '@/components/GiForm'
import { useResetReactive, useTable } from '@/hooks'
import { useDict } from '@/hooks/app'
import { usePrivacyStore, useUserStore } from '@/stores'
import has from '@/utils/has'
import mittBus from '@/utils/mitt'

defineOptions({ name: 'BookkeepingDetail' })

const router = useRouter()
const userStore = useUserStore()
const privacyStore = usePrivacyStore()
const { bk_subject_category, bk_payment_method } = useDict('bk_subject_category', 'bk_payment_method')

/** 是否拥有隐藏权限 */
const hasHidePermission = computed(() => has.hasPermOr(['bk:hide-target:manage']))

const detailSortModeOptions = [
  { label: '日期最新', value: 'date-desc' },
  { label: '日期最早', value: 'date-asc' },
  { label: '金额从高到低', value: 'amount-desc' },
  { label: '金额从低到高', value: 'amount-asc' },
]

const DETAIL_SORT_QUERY_MAP = {
  'date-desc': [...DETAIL_DEFAULT_SORT],
  'date-asc': ['detailDate,asc', 'id,desc'],
  'amount-desc': ['amount,desc', 'detailDate,desc', 'id,desc'],
  'amount-asc': ['amount,asc', 'detailDate,desc', 'id,desc'],
} as const

type DetailSortMode = keyof typeof DETAIL_SORT_QUERY_MAP
const DETAIL_DEFAULT_SORT_MODE: DetailSortMode = 'date-desc'

/**
 * 创建明细列表默认查询条件。
 *
 * 这里把“默认排序 + 默认时间范围”集中管理，避免重置、首屏加载和手动切换条件时口径不一致。
 */
const createDefaultDetailQueryForm = () => {
  const presetRange = getDetailPresetRange(DETAIL_DEFAULT_DATE_PRESET)
  return {
    sort: [...DETAIL_DEFAULT_SORT],
    sortMode: DETAIL_DEFAULT_SORT_MODE as DetailSortMode,
    name: '',
    category: '',
    subjectId: '',
    paymentMethod: '',
    timeMode: DETAIL_DEFAULT_TIME_MODE as DetailTimeMode,
    datePreset: DETAIL_DEFAULT_DATE_PRESET as DetailDatePreset,
    startDate: presetRange.startDate,
    endDate: presetRange.endDate,
    hidden: '',
    userId: String(userStore.userInfo.id ?? ''),
  }
}

const [queryForm, resetForm] = useResetReactive(createDefaultDetailQueryForm)
const timePickerState = reactive<DetailTimePickerState>(createDefaultDetailTimePickerState())

const detailTimeModeOptions = DETAIL_TIME_MODE_OPTIONS
const detailDatePresetOptions = DETAIL_DATE_PRESET_OPTIONS

/** 自定义范围选择器在 Web 端限制为更短的固定宽度，避免横向占用过大。 */
const detailRangePickerStyle = {
  flex: '0 0 320px',
  width: '320px',
  minWidth: '320px',
  maxWidth: '320px',
}

/** 通用筛选项下沉到 shared，明细页只保留自身特有的时间、排序、名称和隐藏条件。 */
const {
  isAdmin,
  paymentMethodQueryOptions,
  subjectQueryOptions: subjectOptions,
  clearSubjectSelection,
  loadCommonFilterOptions,
  createCommonQueryColumns,
} = useBookkeepingCommonFilters({
  form: queryForm,
  labels: {
    userAll: '全部',
    categoryAll: '全部',
    subjectAll: '全部',
    paymentAll: '全部',
  },
})

/** 当前时间范围的文案回显，方便用户确认筛选口径。 */
const activeDateRangeText = computed(() => {
  if (!queryForm.startDate || !queryForm.endDate) {
    return '未选择时间范围'
  }
  return `${queryForm.startDate} 至 ${queryForm.endDate}`
})

/** 记录当前查询是否进入分页模式。 */
const detailQueryMode = reactive({
  total: 0,
  threshold: 1000,
  pageMode: false,
})

const triggerQuerySearch = () => {
  nextTick(() => {
    searchMethod()
  })
}

/**
 * 统一更新明细时间查询条件。
 *
 * 真实查询只依赖 timeMode + startDate + endDate，datePreset 仅用于记住快捷范围选中项。
 */
const applyTimeRangeToQuery = (options: {
  timeMode: DetailTimeMode
  startDate: string
  endDate: string
  datePreset?: DetailDatePreset
}) => {
  queryForm.timeMode = options.timeMode
  queryForm.startDate = options.startDate
  queryForm.endDate = options.endDate
  queryForm.datePreset = options.datePreset ?? queryForm.datePreset
}

const handleTimeModeChange = (value: string | number | boolean) => {
  const nextMode = String(value) as DetailTimeMode
  if (queryForm.startDate && queryForm.endDate) {
    timePickerState.range = [queryForm.startDate, queryForm.endDate]
  }

  switch (nextMode) {
    case 'preset': {
      const preset = queryForm.datePreset || DETAIL_DEFAULT_DATE_PRESET
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

  triggerQuerySearch()
}

const handleDatePresetChange = (value: string | number | boolean) => {
  const preset = String(value || DETAIL_DEFAULT_DATE_PRESET) as DetailDatePreset
  const range = getDetailPresetRange(preset)
  applyTimeRangeToQuery({ timeMode: 'preset', datePreset: preset, ...range })
  timePickerState.range = [range.startDate, range.endDate]
  triggerQuerySearch()
}

const handleWeekPickerChange = (value?: string) => {
  timePickerState.weekDate = value || timePickerState.weekDate
  const range = getDetailWeekRange(timePickerState.weekDate)
  applyTimeRangeToQuery({ timeMode: 'week', ...range })
  triggerQuerySearch()
}

const handleMonthPickerChange = (value?: string) => {
  timePickerState.month = value || timePickerState.month
  const range = getDetailMonthRange(timePickerState.month)
  applyTimeRangeToQuery({ timeMode: 'month', ...range })
  triggerQuerySearch()
}

const handleQuarterPickerChange = (value?: string) => {
  timePickerState.quarter = value || timePickerState.quarter
  const range = getDetailQuarterRange(timePickerState.quarter)
  applyTimeRangeToQuery({ timeMode: 'quarter', ...range })
  triggerQuerySearch()
}

const handleYearPickerChange = (value?: string) => {
  timePickerState.year = value || timePickerState.year
  const range = getDetailYearRange(timePickerState.year)
  applyTimeRangeToQuery({ timeMode: 'year', ...range })
  triggerQuerySearch()
}

const handleRangePickerChange = (value?: string[]) => {
  if (!value || value.length !== 2 || !value[0] || !value[1]) {
    return
  }
  timePickerState.range = [...value]
  applyTimeRangeToQuery({ timeMode: 'range', startDate: value[0], endDate: value[1] })
  triggerQuerySearch()
}

const handleCategoryQueryChange = () => {
  clearSubjectSelection()
  triggerQuerySearch()
}

const handleSubjectQueryChange = () => {
  triggerQuerySearch()
}

const handlePaymentMethodQueryChange = () => {
  triggerQuerySearch()
}

const handleUserQueryChange = () => {
  triggerQuerySearch()
}

/**
 * 表头排序已移除，统一改为搜索区排序条件，避免排序入口分散。
 */
const handleSortModeChange = (value: string | number | boolean) => {
  const nextSortMode = String(value || DETAIL_DEFAULT_SORT_MODE) as DetailSortMode
  queryForm.sortMode = nextSortMode
  queryForm.sort = [...DETAIL_SORT_QUERY_MAP[nextSortMode]]
  triggerQuerySearch()
}

/**
 * 统一复用“所属用户 / 分类 / 科目 / 支付方式”列定义，避免明细页和日历页各维护一套。
 *
 * 当前明细页查询区布局：
 * 1. 第一行：时间范围
 * 2. 第二行：排序方式
 * 3. 第三行：所属用户 + 分类
 * 4. 第四行：科目
 * 5. 第五行：支付方式
 * 6. 第六行：明细名称
 * 7. 第七行：是否隐藏（仅管理员可见）
 */
const commonQueryColumns = createCommonQueryColumns({
  user: {
    span: { xs: 24, sm: 12, xxl: 12 },
    useRadioGroup: true,
    placeholder: '请选择用户',
    allowSearch: true,
    onChange: handleUserQueryChange,
  },
  category: {
    span: { xs: 24, sm: 12, xxl: 12 },
    useRadioGroup: true,
    onChange: handleCategoryQueryChange,
  },
  subject: {
    span: { xs: 24, sm: 24, xxl: 24 },
    useRadioGroup: true,
    onChange: handleSubjectQueryChange,
  },
  paymentMethod: {
    span: { xs: 24, sm: 24, xxl: 24 },
    useRadioGroup: true,
    onChange: handlePaymentMethodQueryChange,
  },
})

const queryFormColumns: ColumnItem[] = reactive([
  {
    label: '时间范围',
    field: 'timeFilter',
    span: { xs: 24, sm: 24, xl: 18, xxl: 18 },
  },
  {
    type: 'input',
    label: '明细名称',
    field: 'name',
    span: { xs: 24, sm: 24, xl: 6, xxl: 6 },
    props: {
      placeholder: '请输入明细名称',
    },
  },
  {
    type: 'select',
    label: '排序方式',
    field: 'sortMode',
    span: { xs: 24, sm: 24, xxl: 24 },
    type: 'radio-group',
    props: {
      options: detailSortModeOptions,
      placeholder: '请选择排序方式',
      allowClear: false,
      onChange: handleSortModeChange,
    },
  },
  commonQueryColumns.userColumn,
  commonQueryColumns.categoryColumn,
  commonQueryColumns.subjectColumn,
  commonQueryColumns.paymentMethodColumn,
  {
    type: 'select',
    label: '是否隐藏',
    field: 'hidden',
    span: { xs: 24, sm: 24, xxl: 24 },
    show: () => isAdmin.value,
    type: 'radio-group',
    props: {
      options: [
        { label: '全部', value: '' },
        { label: '正常', value: 0 },
        { label: '隐藏', value: 1 },
      ],
      placeholder: '请选择',
      allowClear: true,
    },
  },
])

/**
 * 搜索区会带上仅供前端展示的 sortMode 字段，这里统一在请求前剔除。
 */
const buildDetailQuery = () => {
  const query = {
    ...queryForm,
    sort: [...queryForm.sort],
    privacyMode: privacyStore.isPrivacyMode,
  }
  delete (query as typeof query & { sortMode?: DetailSortMode }).sortMode
  return query
}

const {
  tableData: dataList,
  loading,
  pagination,
  search,
  handleDelete,
} = useTable(
  (page) => {
    const query = buildDetailQuery()
    if (detailQueryMode.pageMode) {
      return listDetail({ ...query, ...page })
    }
    return listDetailAll(query)
  },
  { immediate: false },
)

/** 当前查询结果条数，优先展示后端统计总数，兜底使用当前列表长度。 */
const detailRecordCount = computed(() => {
  if (detailQueryMode.total > 0) {
    return detailQueryMode.total
  }
  return dataList.value.length
})

const tablePagination = computed(() => (detailQueryMode.pageMode ? pagination : false))
const currentTableOffset = computed(() => (detailQueryMode.pageMode ? (pagination.current - 1) * pagination.pageSize : 0))

/**
 * 统计数据
 *
 * @author Wangsongsong
 * @date 2026-03-19
 */
const statistics = ref({
  totalExpense: 0,
  totalIncome: 0,
  netIncome: 0,
})

/**
 * 查询当前筛选结果是否超过阈值。
 *
 * 小于等于阈值时前端直接改走全量接口，减少用户翻页成本。
 */
const loadDetailQueryMode = async () => {
  const { data } = await getDetailQueryMode(buildDetailQuery())
  detailQueryMode.total = data.total
  detailQueryMode.threshold = data.threshold
  detailQueryMode.pageMode = data.pageMode
}

/**
 * 加载统计数据
 *
 * @author Wangsongsong
 * @date 2026-03-19
 */
const loadStatistics = async () => {
  try {
    const { data } = await getDetailStatistics(buildDetailQuery())
    statistics.value = data
  } catch {
    // 加载失败不影响列表展示
    statistics.value = { totalExpense: 0, totalIncome: 0, netIncome: 0 }
  }
}

/**
 * 统一的查询方法，同时加载列表和统计数据
 *
 * @author Wangsongsong
 * @date 2026-03-19
 */
async function searchMethod() {
  await loadDetailQueryMode()
  await Promise.all([search(), loadStatistics()])
}

/** 表格引用 */
const tableRef = ref()

const columns = computed<TableInstance['columns']>(() => [
  {
    title: '序号',
    width: 66,
    align: 'center',
    render: ({ rowIndex }) => h('span', {}, rowIndex + 1 + currentTableOffset.value),
    show: false,
  },
  { title: '科目 / 明细', dataIndex: 'subjectDetail', slotName: 'subjectDetail', width: 240, show: true },
  { title: '所属用户', dataIndex: 'userNickname', slotName: 'userNickname', width: 90, ellipsis: true, tooltip: true, show: true },
  { title: '分类', dataIndex: 'subjectCategory', slotName: 'subjectCategory', width: 70, align: 'center', show: true },
  { title: '支付方式', dataIndex: 'paymentMethod', slotName: 'paymentMethod', width: 90, align: 'center', show: true },
  {
    title: '金额',
    dataIndex: 'amount',
    slotName: 'amount',
    width: 100,
    align: 'right',
    show: true,
  },
  {
    title: '明细日期',
    dataIndex: 'detailDate',
    slotName: 'detailDate',
    width: 180,
    align: 'center',
    show: true,
  },
  { title: '备注', dataIndex: 'remark', width: 120, ellipsis: true, tooltip: true, show: true },
  {
    title: '隐藏',
    dataIndex: 'hidden',
    slotName: 'hidden',
    width: 60,
    align: 'center',
    show: ((has.hasPermOr(['bk:hide-target:manage']) && privacyStore.isPrivacyMode) || isAdmin.value),
  },
  { title: '创建人', dataIndex: 'createUserString', width: 100, ellipsis: true, tooltip: true, show: false },
  { title: '创建时间', dataIndex: 'createTime', width: 160, show: false },
  { title: '修改人', dataIndex: 'updateUserString', width: 100, ellipsis: true, tooltip: true, show: false },
  { title: '修改时间', dataIndex: 'updateTime', width: 160, show: false },
  {
    title: '操作',
    dataIndex: 'action',
    slotName: 'action',
    width: 120,
    align: 'center',
    fixed: 'right',
    show: has.hasPermOr([
      'bookkeeping:detail:update',
      'bookkeeping:detail:delete',
    ]),
  },
])

/** 重置查询条件 */
const reset = () => {
  resetForm()
  Object.assign(timePickerState, createDefaultDetailTimePickerState())
  searchMethod()
}

/**
 * 删除明细。
 *
 * 删除成功后需要重新同步：
 * 1. 列表数据
 * 2. 统计卡片
 * 3. 是否分页模式
 *
 * 否则当删除后总数跨过分页阈值时，界面状态会和真实数据不一致。
 */
const onDelete = async (record: DetailResp) => {
  const success = await handleDelete(() => deleteDetail(record.id), {
    content: `是否确定删除明细「${record.name}」？`,
    showModal: true,
  })
  if (success) {
    await searchMethod()
  }
  return success
}

const AddModalRef = ref<InstanceType<typeof AddModal>>()

/** 新增 */
const onAdd = () => {
  AddModalRef.value?.onAdd()
}

/** 修改 */
const onUpdate = (record: DetailResp) => {
  AddModalRef.value?.onUpdate(record.id)
}

/**
 * 保存成功后刷新列表和统计数据
 *
 * @author Wangsongsong
 * @date 2026-03-19
 */
const onSaveSuccess = () => {
  searchMethod()
}

// ==================== 隐私模式相关 ====================

/** 版权区域点击计数器 */
let footerClickCount = 0
let footerClickTimer: ReturnType<typeof setTimeout> | null = null

/** 密码验证弹窗 */
const verifyModalVisible = ref(false)
const verifyPassword = ref('')

/** 首次设置密码弹窗 */
const setupModalVisible = ref(false)
const setupForm = reactive({ password: '', confirmPassword: '' })

/**
 * 检查是否已设置隐私密码，决定弹出验证还是设置弹窗
 *
 * @author Wangsongsong
 * @date 2026-03-19
 */
const checkAndShowPasswordModal = async () => {
  try {
    const { data } = await getPrivacyConfig()
    privacyStore.syncExpireMinutes(data.expireMinutes)
    if (data.hasPassword) {
      verifyPassword.value = ''
      verifyModalVisible.value = true
    } else {
      setupForm.password = ''
      setupForm.confirmPassword = ''
      setupModalVisible.value = true
    }
  } catch {
    Message.error('检查密码状态失败')
  }
}

/**
 * 验证隐私密码
 *
 * @author Wangsongsong
 * @date 2026-03-19
 */
const onVerifyPassword = async () => {
  if (!verifyPassword.value) {
    Message.warning('请输入密码')
    return false
  }
  try {
    const { data } = await verifyPrivacyPassword({ password: verifyPassword.value })
    if (data.verified) {
      const { data: config } = await getPrivacyConfig()
      privacyStore.syncExpireMinutes(config.expireMinutes)
      privacyStore.enterPrivacyMode(config.expireMinutes)
      Message.success('已进入隐私模式')
      verifyPassword.value = ''
      return true
    } else {
      Message.error('密码错误')
      return false
    }
  } catch {
    Message.error('验证失败')
    return false
  }
}

/**
 * 首次设置隐私密码
 *
 * @author Wangsongsong
 * @date 2026-03-19
 */
const onSetupPassword = async () => {
  if (!setupForm.password) {
    Message.warning('请输入密码')
    return false
  }
  if (setupForm.password.length < 4) {
    Message.warning('密码长度不能少于4位')
    return false
  }
  if (setupForm.password !== setupForm.confirmPassword) {
    Message.warning('两次输入的密码不一致')
    return false
  }
  try {
    await setPrivacyPassword({ password: setupForm.password })
    const { data } = await getPrivacyConfig()
    privacyStore.syncExpireMinutes(data.expireMinutes)
    privacyStore.enterPrivacyMode(data.expireMinutes)
    Message.success('密码设置成功，已进入隐私模式')
    return true
  } catch {
    Message.error('设置密码失败')
    return false
  }
}

/**
 * 退出隐私模式
 *
 * @author Wangsongsong
 * @date 2026-03-19
 */
const onExitPrivacy = () => {
  privacyStore.exitPrivacyMode()
  Message.success('已退出隐私模式')
}

/**
 * 页脚版权区域点击事件（通过 mitt 监听）
 *
 * 连续点击 3 次触发隐私模式入口
 *
 * @author Wangsongsong
 * @date 2026-03-19
 * @update 2026-03-19 @Wangsongsong
 * @desc 改为监听 GiFooter 的 mitt 事件，用底部版权区域作为隐蔽入口
 */
const onFooterClick = () => {
  if (!hasHidePermission.value) return
  footerClickCount++
  if (footerClickTimer) clearTimeout(footerClickTimer)
  footerClickTimer = setTimeout(() => {
    footerClickCount = 0
  }, 2000)
  if (footerClickCount >= 3) {
    footerClickCount = 0
    if (footerClickTimer) clearTimeout(footerClickTimer)
    if (privacyStore.isPrivacyMode) {
      Message.info('当前已在隐私模式')
      return
    }
    checkAndShowPasswordModal()
  }
}

/**
 * 隐私模式状态变化后立即重刷列表和统计。
 *
 * 这样无论是手动进入 / 退出，还是停留超时后自动失效，
 * 页面都不会继续残留旧口径下的隐藏数据。
 */
watch(
  () => privacyStore.isPrivacyMode,
  () => {
    void searchMethod()
  },
)

onMounted(async () => {
  mittBus.on('footer-click', onFooterClick)
  await loadCommonFilterOptions()
  // 初始加载数据和统计
  searchMethod()
})

onUnmounted(() => {
  mittBus.off('footer-click', onFooterClick)
})
</script>

<style scoped lang="scss">
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

/** 自定义范围选择器比默认全宽更短，避免在桌面端挤占过多横向空间。 */
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

// 统计数据样式
.statistics-container {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-right: 12px;

  .statistics-item {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 14px;
    font-weight: 500;

    .label {
      color: var(--color-text-2);
    }

    .value {
      font-size: 16px;
      font-weight: 600;
    }

    &.expense .value {
      color: #f53f3f;
    }

    &.income .value {
      color: #00b42a;
    }

    &.count .value {
      color: var(--color-text-1);
    }
  }
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

.detail-date-inline {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  max-width: 100%;
  white-space: nowrap;
}

.detail-date-inline__text {
  color: var(--color-text-1);
  font-weight: 600;
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

  .statistics-container {
    flex-wrap: wrap;
    gap: 10px;
    margin-right: 0;
  }
}
</style>
