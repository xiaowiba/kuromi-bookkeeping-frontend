<template>
  <GiPageLayout>
    <GiTable
      ref="tableRef"
      row-key="id"
      :data="dataList"
      :columns="columns"
      :loading="loading"
      :scroll="isMobile() ? { x: '100%', y: '100%' } : { x: '100%', y: '100%', minWidth: 900 }"
      :pagination="tablePagination"
      :disabled-tools="['size']"
      :disabled-column-keys="['subjectDetail']"
      @refresh="searchMethod"
      @change="handleTableChange"
    >
      <template #top>
        <GiForm
          v-model="queryForm"
          search
          :columns="queryFormColumns"
          :default-collapsed="isMobile()"
          size="medium"
          @search="searchMethod"
          @reset="reset"
        >
          <template #subjectId>
            <a-select
              v-if="isMobile()"
              v-model="queryForm.subjectId"
              :options="subjectOptions"
              placeholder="请选择科目"
              allow-clear
              allow-search
              @change="handleSubjectQueryChange"
            />
            <div v-else class="subject-query-radio-scroll">
              <a-radio-group
                v-model="queryForm.subjectId"
                :options="subjectOptions"
                @change="handleSubjectQueryChange"
              />
            </div>
          </template>
          <template #paymentMethod>
            <a-select
              v-if="isMobile()"
              v-model="queryForm.paymentMethod"
              :options="paymentMethodQueryOptions"
              placeholder="请选择支付方式"
              allow-clear
              @change="handlePaymentMethodQueryChange"
            />
            <div v-else class="subject-query-radio-scroll">
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
                  class="detail-time-filter__picker"
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
        </div>
      </template>
      <!-- 移动端紧凑布局 -->
      <template #mobileDetail="{ record }">
        <div class="mobile-detail-compact" :class="{ 'is-hidden': privacyStore.isPrivacyMode && record.hidden === 1 }">
          <!-- 第一行：主要信息 -->
          <div class="compact-row info-line">
            <span class="user-name">{{ record.userNickname }}</span>
            <span class="date-text">{{ record.detailDate }}</span>
            <span class="subject-name">{{ record.subjectName }}</span>
            <GiCellTag :value="record.subjectCategory" :dict="bk_subject_category" />
            <GiCellTag :value="record.paymentMethod || 'default'" :dict="bk_payment_method" />
            <span class="detail-name">{{ record.name }}</span>
            <span class="amount" :style="{ color: record.amount < 0 ? '#f53f3f' : '#00b42a' }">
              {{ record.amount < 0 ? record.amount.toFixed(2) : `+${record.amount.toFixed(2)}` }}
            </span>
          </div>
          <!-- 第二行：备注信息（如果有） -->
          <div v-if="record.remark" class="compact-row remark-line">
            <span class="remark-text">{{ record.remark }}</span>
          </div>
          <!-- 最后一行：操作按钮 -->
          <div class="compact-row action-row">
            <a-space size="small">
              <a-button
                v-permission="['bookkeeping:detail:update']"
                type="primary"
                size="large"
                @click="onUpdate(record)"
              >
                <template #icon><icon-edit /></template>
                <template #default>修改</template>
              </a-button>
              <a-button
                v-permission="['bookkeeping:detail:delete']"
                status="danger"
                size="large"
                @click="onDelete(record)"
              >
                <template #icon><icon-delete /></template>
                <template #default>删除</template>
              </a-button>
            </a-space>
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
 * 明细管理列表页面
 *
 * @author Wangsongsong
 * @date 2026-03-18
 * @update 2026-03-18 @Wangsongsong
 * @desc 查询条件增加用户下拉选择（仅管理员可见）
 * @update 2026-03-18 @Wangsongsong
 * @desc 非超管用户通过关注列表构建用户下拉选项，可查看关注的人的明细
 * @update 2026-03-19 @Wangsongsong
 * @desc 集成隐私模式：隐蔽入口、密码验证/设置、隐私模式查询参数、退出按钮
 * @update 2026-03-19 @Wangsongsong
 * @desc 超管增加"是否隐藏"筛选条件，默认展示全部
 * @update 2026-03-19 @Wangsongsong
 * @desc 移动端优化：默认全屏模式、默认收起搜索条件、分页页码最大化
 * @update 2026-03-19 @Wangsongsong
 * @desc 移动端列表优化：
 *       第一行：主要数据信息（用户、日期、科目、分类、名称、金额）
 *       第二行：备注信息（如果有备注）
 *       最后一行：大尺寸操作按钮
 *       字体加大，便于移动端阅读
 * @update 2026-03-19 @Wangsongsong
 * @desc 修复移动端表格横向滚动问题：移动端不设置 minWidth，避免不必要的横向滚动
 * @update 2026-03-19 @Wangsongsong
 * @desc 移动端隐藏数据优化：不显示"隐"标签，改用橙色背景色区分隐藏数据
 * @update 2026-03-19 @Wangsongsong
 * @desc 增加明细统计功能：
 *       在刷新按钮左边显示总支出和总收入统计数据
 *       统计数据通过后端接口获取，统计所有符合查询条件的明细
 *       不区分PC端和移动端，统一显示
 * @update 2026-03-21 @Wangsongsong
 * @desc 复用共享的明细用户选项加载逻辑，统一桌面端与移动端口径
 * @update 2026-03-22 @Wangsongsong
 * @desc Web 端统计区补充结余展示，保持与移动端统计口径一致
 * @update 2026-03-22 @Wangsongsong
 * @desc 进入 web 端隐私模式前同步数据库中的有效时长配置，确保过期时间与隐藏配置页保持一致
 * @update 2026-03-23 @Wangsongsong
 * @desc 新增支付方式标签展示与 Web 端筛选，移动态不增加支付方式查询条件
 * @update 2026-04-03 @Wangsongsong
 * @desc 新增统一时间模型、自适应分页和表格排序联动，承接报表模块拆分后的明细查询职责
 */
import type { TableChangeExtra, TableInstance } from '@arco-design/web-vue'
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
import { useDetailUserOptions } from '../shared/useDetailUserOptions'
import AddModal from './AddModal.vue'
import {
  type DetailResp,
  deleteDetail,
  getDetailQueryMode,
  getDetailStatistics,
  listDetail,
  listMobileDetail,
} from '@/apis/bookkeeping/detail'
import type { DetailDatePreset, DetailTimeMode } from '@/apis/bookkeeping/type'
import { getPrivacyConfig, setPrivacyPassword, verifyPrivacyPassword } from '@/apis/bookkeeping/privacy'
import { type SubjectResp, listSubject } from '@/apis/bookkeeping/subject'
import type { ColumnItem } from '@/components/GiForm'
import { useResetReactive, useTable } from '@/hooks'
import { useDict } from '@/hooks/app'
import { usePrivacyStore, useUserStore } from '@/stores'
import { isMobile } from '@/utils'
import has from '@/utils/has'
import mittBus from '@/utils/mitt'

defineOptions({ name: 'BookkeepingDetail' })

const router = useRouter()
const userStore = useUserStore()
const privacyStore = usePrivacyStore()
const { bk_subject_category, bk_payment_method } = useDict('bk_subject_category', 'bk_payment_method')
const { isAdmin, userOptions, loadUserOptions } = useDetailUserOptions()

/** 是否拥有隐藏权限 */
const hasHidePermission = computed(() => has.hasPermOr(['bk:hide-target:manage']))

/**
 * 创建明细列表默认查询条件。
 *
 * 这里把“默认排序 + 默认时间范围”集中管理，避免重置、首屏加载和手动切换条件时口径不一致。
 */
const createDefaultDetailQueryForm = () => {
  const presetRange = getDetailPresetRange(DETAIL_DEFAULT_DATE_PRESET)
  return {
    sort: [...DETAIL_DEFAULT_SORT],
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

const allSubjects = ref<SubjectResp[]>([])
const createAllOption = () => ({ label: '全部', value: '' })

const userQueryOptions = computed(() => [
  createAllOption(),
  ...(userOptions.value ?? []),
])

const categoryQueryOptions = computed(() => [
  createAllOption(),
  ...(bk_subject_category.value ?? []),
])

const paymentMethodQueryOptions = computed(() => [
  createAllOption(),
  ...(bk_payment_method.value ?? []),
])

const subjectOptions = computed(() => {
  const matchedSubjects = queryForm.category
    ? allSubjects.value.filter((item) => item.category === queryForm.category)
    : allSubjects.value

  return [
    createAllOption(),
    ...matchedSubjects.map((item) => ({ label: item.name, value: item.id })),
  ]
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
  queryForm.subjectId = ''
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

const queryFormColumns: ColumnItem[] = reactive([
  {
    type: 'select',
    label: '所属用户',
    field: 'userId',
    span: { xs: 24, sm: 12, xxl: 9 },
    ...(!isMobile() ? { type: 'radio-group' as const } : {}),
    props: {
      options: userQueryOptions,
      onChange: handleUserQueryChange,
      ...(isMobile()
        ? {
            placeholder: '请选择用户',
            allowClear: true,
            allowSearch: true,
          }
        : {}),
    },
  },
  {
    label: '时间范围',
    field: 'timeFilter',
    span: { xs: 24, sm: 24, xxl: 24 },
  },
  {
    type: 'select',
    label: '分类',
    field: 'category',
    span: { xs: 24, sm: 8, xxl: 6 },
    ...(!isMobile() ? { type: 'radio-group' as const } : {}),
    props: {
      options: categoryQueryOptions,
      placeholder: '请选择分类',
      allowClear: true,
      onChange: handleCategoryQueryChange,
    },
  },
  {
    type: 'select',
    label: '科目',
    field: 'subjectId',
    span: { xs: 24, sm: 24, xxl: 24 },
    ...(!isMobile() ? { type: 'radio-group' as const } : {}),
    props: {
      options: subjectOptions,
      placeholder: '请选择科目',
      allowClear: true,
      allowSearch: true,
      onChange: handleSubjectQueryChange,
    },
  },
  {
    type: 'select',
    label: '支付方式',
    field: 'paymentMethod',
    span: { xs: 24, sm: 24, xxl: 24 },
    ...(!isMobile() ? { type: 'radio-group' as const } : {}),
    props: {
      options: paymentMethodQueryOptions,
      placeholder: '请选择支付方式',
      allowClear: true,
      onChange: handlePaymentMethodQueryChange,
    },
  },
  {
    type: 'input',
    label: '明细名称',
    field: 'name',
    span: { xs: 24, sm: 8, xxl: 6 },
    props: {
      placeholder: '请输入明细名称',
    },
  },
  {
    type: 'select',
    label: '是否隐藏',
    field: 'hidden',
    span: { xs: 24, sm: 8, xxl: 6 },
    show: () => isAdmin.value,
    ...(!isMobile() ? { type: 'radio-group' as const } : {}),
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

const {
  tableData: dataList,
  loading,
  pagination,
  search,
  handleDelete,
} = useTable(
  (page) => {
    const query = { ...queryForm, sort: [...queryForm.sort], privacyMode: privacyStore.isPrivacyMode }
    if (detailQueryMode.pageMode) {
      return listDetail({ ...query, ...page })
    }
    return listMobileDetail(query)
  },
  {
    immediate: false,
    paginationOption: isMobile()
      ? { defaultPageSize: 50, defaultSizeOptions: [50, 100, 200, 500] }
      : undefined,
  },
)

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

const amountSortOrder = computed(() => {
  if (queryForm.sort[0] === 'amount,desc') {
    return 'descend'
  }
  if (queryForm.sort[0] === 'amount,asc') {
    return 'ascend'
  }
  return ''
})

const detailDateSortOrder = computed(() => {
  if (queryForm.sort[0] === 'detailDate,desc') {
    return 'descend'
  }
  if (queryForm.sort[0] === 'detailDate,asc') {
    return 'ascend'
  }
  return ''
})

const loadSubjectOptions = async () => {
  try {
    const { data } = await listSubject({ sort: ['sort,asc', 'id,desc'], page: 1, size: 1000 } as any)
    allSubjects.value = data.list ?? []
  } catch {
    allSubjects.value = []
  }
}

/**
 * 把表格排序事件统一映射成后端识别的 sort 数组。
 *
 * 金额排序会追加日期和主键兜底，避免同金额场景下顺序飘动。
 */
const resolveTableSort = (sorter?: TableChangeExtra['sorter']) => {
  if (!sorter?.field || !sorter.direction) {
    return [...DETAIL_DEFAULT_SORT]
  }
  const order = sorter.direction === 'ascend' ? 'asc' : 'desc'
  if (sorter.field === 'amount') {
    return [`amount,${order}`, 'detailDate,desc', 'id,desc']
  }
  if (sorter.field === 'detailDate') {
    return [`detailDate,${order}`, 'id,desc']
  }
  return [...DETAIL_DEFAULT_SORT]
}

const handleTableChange = (_data: unknown[], extra: TableChangeExtra) => {
  if (extra.type !== 'sorter') {
    return
  }
  queryForm.sort = resolveTableSort(extra.sorter)
  searchMethod()
}

/**
 * 查询当前筛选结果是否超过阈值。
 *
 * 小于等于阈值时前端直接改走全量接口，减少用户翻页成本。
 */
const loadDetailQueryMode = async () => {
  const { data } = await getDetailQueryMode({ ...queryForm, sort: [...queryForm.sort], privacyMode: privacyStore.isPrivacyMode })
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
    const { data } = await getDetailStatistics({ ...queryForm, sort: [...queryForm.sort], privacyMode: privacyStore.isPrivacyMode })
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
  {
    title: '明细信息',
    dataIndex: 'mobileDetail',
    slotName: 'mobileDetail',
    width: 100,
    show: isMobile(),
  },
  { title: '科目 / 明细', dataIndex: 'subjectDetail', slotName: 'subjectDetail', width: 240, show: !isMobile() },
  { title: '所属用户', dataIndex: 'userNickname', slotName: 'userNickname', width: 90, ellipsis: true, tooltip: true, show: !isMobile() },
  { title: '分类', dataIndex: 'subjectCategory', slotName: 'subjectCategory', width: 70, align: 'center', show: !isMobile() },
  { title: '支付方式', dataIndex: 'paymentMethod', slotName: 'paymentMethod', width: 90, align: 'center', show: !isMobile() },
  {
    title: '金额',
    dataIndex: 'amount',
    slotName: 'amount',
    width: 100,
    align: 'right',
    show: !isMobile(),
    sortable: {
      sortDirections: ['descend', 'ascend'],
      sortOrder: amountSortOrder.value,
    },
  },
  {
    title: '明细日期',
    dataIndex: 'detailDate',
    slotName: 'detailDate',
    width: 180,
    align: 'center',
    show: !isMobile(),
    sortable: {
      sortDirections: ['descend', 'ascend'],
      sortOrder: detailDateSortOrder.value,
    },
  },
  { title: '备注', dataIndex: 'remark', width: 120, ellipsis: true, tooltip: true, show: !isMobile() },
  {
    title: '隐藏',
    dataIndex: 'hidden',
    slotName: 'hidden',
    width: 60,
    align: 'center',
    show: ((has.hasPermOr(['bk:hide-target:manage']) && privacyStore.isPrivacyMode) || isAdmin.value) && !isMobile(),
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
    fixed: !isMobile() ? 'right' : undefined,
    show: has.hasPermOr([
      'bookkeeping:detail:update',
      'bookkeeping:detail:delete',
    ]) && !isMobile(),
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
  await Promise.allSettled([loadUserOptions(), loadSubjectOptions()])
  // 初始加载数据和统计
  searchMethod()
  // 移动端默认进入全屏模式
  if (isMobile() && tableRef.value) {
    // 延迟执行，确保组件已完全挂载
    setTimeout(() => {
      const giTable = tableRef.value as any
      if (giTable && typeof giTable.toggleFullscreen === 'function') {
        giTable.toggleFullscreen()
      }
    }, 100)
  }
})

onUnmounted(() => {
  mittBus.off('footer-click', onFooterClick)
})
</script>

<style scoped lang="scss">
.detail-time-filter {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}

.detail-time-filter__mode {
  width: 100%;
  flex-wrap: wrap;
}

.detail-time-filter__panel {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.detail-time-filter__preset-list {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.detail-time-filter__picker {
  min-width: 240px;
}

.detail-time-filter__range-text {
  color: var(--color-text-3);
  font-size: 13px;
  line-height: 1.6;
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

// 移动端紧凑布局样式
.mobile-detail-compact {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 4px 0;

  // 隐藏数据的背景色
  &.is-hidden {
    background-color: rgba(255, 125, 0, 0.08);
    border-radius: 4px;
    padding: 8px;
    margin: -4px 0;
  }

  .compact-row {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
    line-height: 1.6;

    // 第一行：主要信息
    &.info-line {
      font-size: 17px;

      .user-name {
        color: var(--color-text-1);
        font-weight: 600;
        font-size: 18px;
      }

      .date-text {
        color: var(--color-text-3);
        font-size: 16px;
      }

      .subject-name {
        color: var(--color-text-2);
        font-size: 16px;
      }

      .detail-name {
        color: var(--color-text-1);
        font-weight: 600;
        font-size: 18px;
      }

      .amount {
        font-weight: bold;
        font-size: 19px;
        white-space: nowrap;
      }
    }

    // 第二行：备注信息
    &.remark-line {
      .remark-text {
        color: var(--color-text-3);
        font-size: 15px;
        font-style: italic;
        word-break: break-all;
      }
    }

    // 最后一行：操作按钮
    &.action-row {
      padding-top: 4px;
    }
  }
}

@media (max-width: 768px) {
  .detail-time-filter__picker {
    min-width: 100%;
  }

  .detail-time-filter__range-text {
    width: 100%;
  }

  .statistics-container {
    flex-wrap: wrap;
    gap: 10px;
    margin-right: 0;
  }
}
</style>
