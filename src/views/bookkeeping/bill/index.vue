<template>
  <GiPageLayout :body-style="{ overflowY: 'auto', overflowX: 'hidden' }">
    <GiTable
      row-key="id"
      :data="tableData"
      :columns="columns"
      :loading="loading"
      :scroll="{ x: '100%', y: '100%', minWidth: tableMinWidth }"
      :pagination="false"
      :disabled-tools="['size']"
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
          <template #year>
            <a-year-picker
              v-model="queryForm.year"
              format="YYYY"
              value-format="YYYY"
              :allow-clear="false"
              style="width: 100%"
              @change="handleYearChange"
            />
          </template>
          <template #userId>
            <div class="bill-query-radio-scroll">
              <a-radio-group v-model="queryForm.userId" :options="userQueryOptions" @change="triggerQuerySearch" />
            </div>
          </template>
          <template #category>
            <div class="bill-query-radio-scroll">
              <a-radio-group v-model="queryForm.category" :options="categoryQueryOptions" @change="triggerQuerySearch" />
            </div>
          </template>
          <template #subjectId>
            <div class="bill-query-radio-scroll">
              <a-radio-group v-model="queryForm.subjectId" :options="subjectQueryOptions" @change="triggerQuerySearch" />
            </div>
          </template>
          <template #tagId>
            <div class="bill-query-radio-scroll">
              <a-radio-group
                v-model="queryForm.tagId"
                :options="tagQueryOptions"
                :disabled="!queryForm.subjectId"
                @change="triggerQuerySearch"
              />
            </div>
          </template>
          <template #paymentMethod>
            <div class="bill-query-radio-scroll">
              <a-radio-group
                v-model="queryForm.paymentMethod"
                :options="paymentMethodQueryOptions"
                @change="triggerQuerySearch"
              />
            </div>
          </template>
          <template #paymentAccountId>
            <div class="bill-query-radio-scroll">
              <a-radio-group
                v-model="queryForm.paymentAccountId"
                :options="paymentAccountQueryOptions"
                @change="triggerQuerySearch"
              />
            </div>
          </template>
          <template #isNecessary>
            <div class="bill-query-radio-scroll">
              <a-radio-group
                v-model="queryForm.isNecessary"
                :options="isNecessaryQueryOptions"
                @change="triggerQuerySearch"
              />
            </div>
          </template>
          <template #hidden>
            <div class="bill-query-radio-scroll">
              <a-radio-group
                v-model="queryForm.hidden"
                :options="hiddenQueryOptions"
                @change="triggerQuerySearch"
              />
            </div>
          </template>
        </GiForm>

        <div class="bill-summary">
          <div
            v-for="item in summaryCards"
            :key="item.label"
            class="bill-summary__card"
            :class="[`is-${item.tone}`, { 'is-stacked': item.stacked }]"
          >
            <template v-if="item.rows">
              <div
                v-for="row in item.rows"
                :key="row.label"
                class="bill-summary__row"
              >
                <span class="bill-summary__label">{{ row.label }}</span>
                <strong
                  class="bill-summary__value"
                  :class="row.tone ? `bill-amount--${row.tone}` : undefined"
                >
                  {{ row.value }}
                </strong>
              </div>
            </template>
            <template v-else>
              <p class="bill-summary__label">{{ item.label }}</p>
              <strong class="bill-summary__value">{{ item.value }}</strong>
            </template>
          </div>
        </div>
      </template>

      <template #period="{ record }">
        <div class="bill-period-cell">
          <span class="bill-period">
            {{ queryForm.billType === 'monthly' ? record.month : `${record.year} 年` }}
          </span>
        </div>
      </template>

      <template #income="{ record }">
        <span class="bill-amount bill-amount--income">
          {{ formatAmount(record.income) }}
        </span>
      </template>

      <template #expense="{ record }">
        <div class="bill-comparison">
          <div class="bill-comparison__row">
            <strong class="bill-amount bill-amount--expense">
              {{ formatAmount(record.expense) }}
            </strong>
          </div>
          <div class="bill-comparison__row">
            <span class="bill-comparison__label">实际</span>
            <strong class="bill-amount bill-amount--expense">
              {{ formatAmount(record.actualTotalExpense) }}
            </strong>
          </div>
        </div>
      </template>

      <template #balance="{ record }">
        <div class="bill-comparison">
          <div class="bill-comparison__row">
            <strong class="bill-amount" :class="resolveBalanceClass(record.balance)">
              {{ formatBalance(record.balance) }}
            </strong>
          </div>
          <div class="bill-comparison__row">
            <span class="bill-comparison__label">实际</span>
            <strong class="bill-amount" :class="resolveBalanceClass(record.actualBalance)">
              {{ formatBalance(record.actualBalance) }}
            </strong>
          </div>
        </div>
      </template>

      <template #recordCount="{ record }">
        <div class="bill-comparison">
          <div class="bill-comparison__row">
            <a-tag size="small" color="gray">
              {{ record.recordCount || 0 }} 笔
            </a-tag>
          </div>
          <div class="bill-comparison__row">
            <span class="bill-comparison__label">实际</span>
            <a-tag size="small" color="arcoblue">
              {{ record.actualRecordCount || 0 }} 笔
            </a-tag>
          </div>
        </div>
      </template>
    </GiTable>
  </GiPageLayout>
</template>

<script setup lang="ts">
/**
 * Web 账单管理页面
 *
 * 用于按月或按年汇总记账明细，并复用记账通用筛选项控制统计口径。
 *
 * @author Wangsongsong
 * @date 2026-04-26
 * @update 2026-07-02 @Wangsongsong
 * @desc 完善页面职责说明，强调账单页与通用筛选口径的关系
 * @update 2026-07-09 @Wangsongsong
 * @desc 月账单模式增加实际统计与总统计展示，表格列采用平铺方式兼容列设置
 * @update 2026-08-30 @Wangsongsong
 * @desc 合并月账单实际总收入与总收入展示，统一保留总收入并置于最左侧
 * @update 2026-08-30 @Wangsongsong
 * @desc 合并月账单总支出与实际总支出，使用同一卡片分两行展示
 * @update 2026-08-30 @Wangsongsong
 * @desc 月账单列表参考移动端双行口径展示，合并总支出与实际总支出
 * @update 2026-08-30 @Wangsongsong
 * @desc 月账单列表移除月份实际标识，支出首行隐藏总支出标签并将次行标签简化为实际
 * @update 2026-08-30 @Wangsongsong
 * @desc 月账单列表统一简化结余和条数双行标签，首行隐藏总值标签，次行统一显示实际
 * @update 2026-08-30 @Wangsongsong
 * @desc 年账单统计和列表复用月账单的总值/实际值双行展示结构
 * @update 2026-08-30 @Wangsongsong
 * @desc Web 账单总收入卡片和收入列统一使用项目收入红色样式，移除蓝色收入样式
 */
import { Message } from '@arco-design/web-vue'
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import type { TableColumnData } from '@arco-design/web-vue'
import { createEmptyMonthlyBillResp, createEmptyYearlyBillResp, getMonthlyBill, getYearlyBill } from '@/apis/bookkeeping/bill'
import type * as T from '@/apis/bookkeeping/type'
import type { ColumnItem } from '@/components/GiForm'
import { useResetReactive } from '@/hooks'
import { useUserStore } from '@/stores'
import type { LabelValueState } from '@/types/global'
import { useBookkeepingCommonFilters } from '@/views/bookkeeping/shared/useBookkeepingCommonFilters'

defineOptions({ name: 'BookkeepingBill' })

const amountFormatter = new Intl.NumberFormat('zh-CN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const userStore = useUserStore()
const currentYear = String(new Date().getFullYear())
const currentUserId = computed(() => String(userStore.userInfo.id ?? ''))

/**
 * 创建账单查询默认条件。
 *
 * 默认查看当前登录人的本年度月账单，管理员进入后会由权限监听切换为全部用户口径。
 *
 * @author Wangsongsong
 * @date 2026-07-02
 */
const createDefaultBillQueryForm = (): T.BillFilterForm => ({
  billType: 'monthly',
  year: currentYear,
  category: '',
  subjectId: '',
  tagId: '',
  paymentMethod: '',
  paymentAccountId: '',
  isNecessary: '',
  isReimburseOther: '',
  isAdvance: '',
  userId: currentUserId.value,
  hidden: '',
})

const [queryForm, resetForm] = useResetReactive(createDefaultBillQueryForm)
const loading = ref(false)
const monthlyBill = ref<T.BillMonthlyResp>(createEmptyMonthlyBillResp(currentYear))
const yearlyBill = ref<T.BillYearlyResp>(createEmptyYearlyBillResp())

const {
  isAdmin,
  loadCommonFilterOptions,
  createCommonQueryColumns,
  userQueryOptions,
  categoryQueryOptions,
  paymentMethodQueryOptions,
  paymentAccountQueryOptions,
  isNecessaryQueryOptions,
  subjectQueryOptions,
  tagQueryOptions,
} = useBookkeepingCommonFilters({
  form: queryForm,
  labels: {
    userAll: '全部',
    categoryAll: '全部',
    subjectAll: '全部',
    paymentAll: '全部',
    paymentAccountAll: '全部',
  },
})

watch(isAdmin, (value) => {
  if (value) {
    queryForm.userId = ''
  }
}, { immediate: true })

const commonQueryColumns = createCommonQueryColumns({
  user: {
    span: { xs: 24, sm: 12, xxl: 12 },
    useRadioGroup: true,
    onChange: triggerQuerySearch,
  },
  category: {
    span: { xs: 24, sm: 12, xxl: 12 },
    useRadioGroup: true,
    onChange: triggerQuerySearch,
  },
  subject: {
    span: { xs: 24, sm: 24, xxl: 24 },
    useRadioGroup: true,
    onChange: triggerQuerySearch,
  },
  tag: {
    span: { xs: 24, sm: 24, xxl: 24 },
    useRadioGroup: true,
    onChange: triggerQuerySearch,
  },
  paymentMethod: {
    span: { xs: 24, sm: 24, xxl: 24 },
    useRadioGroup: true,
    onChange: triggerQuerySearch,
  },
  paymentAccount: {
    span: { xs: 24, sm: 24, xxl: 24 },
    useRadioGroup: true,
    onChange: triggerQuerySearch,
  },
  isNecessary: {
    span: { xs: 24, sm: 8, xxl: 8 },
    useRadioGroup: true,
    onChange: triggerQuerySearch,
  },
  isReimburseOther: {
    span: { xs: 24, sm: 8, xxl: 8 },
    useRadioGroup: true,
    onChange: triggerQuerySearch,
  },
  isAdvance: {
    span: { xs: 24, sm: 8, xxl: 8 },
    useRadioGroup: true,
    onChange: triggerQuerySearch,
  },
})

const queryFormColumns: ColumnItem[] = [
  {
    type: 'radio-group',
    label: '账单类型',
    field: 'billType',
    span: { xs: 24, sm: 12, xxl: 8 },
    props: {
      options: [
        { label: '月账单', value: 'monthly' },
        { label: '年账单', value: 'yearly' },
      ],
      onChange: handleBillTypeChange,
    },
  },
  {
    label: '年份',
    field: 'year',
    span: { xs: 24, sm: 12, xxl: 4 },
    show: (form: T.BillFilterForm) => form.billType === 'monthly',
  },
  commonQueryColumns.userColumn,
  commonQueryColumns.categoryColumn,
  commonQueryColumns.subjectColumn,
  commonQueryColumns.tagColumn,
  commonQueryColumns.paymentMethodColumn,
  commonQueryColumns.paymentAccountColumn,
  commonQueryColumns.isNecessaryColumn,
  commonQueryColumns.isAdvanceColumn,
  commonQueryColumns.isReimburseOtherColumn,
  {
    type: 'radio-group',
    label: '是否隐藏',
    field: 'hidden',
    span: { xs: 24, sm: 24, xxl: 24 },
    show: () => isAdmin.value,
  },
]

const hiddenQueryOptions: LabelValueState[] = [
  { label: '全部', value: '' },
  { label: '正常', value: 0 },
  { label: '隐藏', value: 1 },
]

const currentSummary = computed(() =>
  queryForm.billType === 'monthly' ? monthlyBill.value.summary : yearlyBill.value.summary,
)

// 月、年账单均将支出、结余、条数的总统计与实际统计合并到各自单元格中。
const tableMinWidth = computed(() => 920)

/**
 * 构建顶部汇总卡片。
 *
 * 月账单和年账单都展示总统计与实际统计；实际总收入与总收入当前业务口径一致，
 * 因此页面只保留总收入，避免重复展示。
 */
interface SummaryCard {
  label: string
  value?: string
  tone: string
  stacked?: boolean
  rows?: Array<{
    label: string
    value: string
    tone?: string
  }>
}

const summaryCards = computed<SummaryCard[]>(() => {
  return [
    {
      label: '总收入',
      value: formatAmount(currentSummary.value.totalIncome),
      tone: 'income',
    },
    {
      label: '支出',
      rows: [
        {
          label: '总支出',
          value: formatAmount(currentSummary.value.totalExpense),
        },
        {
          label: '实际总支出',
          value: formatAmount(currentSummary.value.actualTotalExpense),
        },
      ],
      tone: 'expense',
      stacked: true,
    },
    {
      label: '结余',
      rows: [
        {
          label: '总结余',
          value: formatBalance(currentSummary.value.balance),
          tone: resolveBalanceTone(currentSummary.value.balance),
        },
        {
          label: '实际总结余',
          value: formatBalance(currentSummary.value.actualBalance),
          tone: resolveBalanceTone(currentSummary.value.actualBalance),
        },
      ],
      tone: 'neutral',
      stacked: true,
    },
    {
      label: '条数',
      rows: [
        {
          label: '总条数',
          value: `${currentSummary.value.recordCount || 0} 笔`,
        },
        {
          label: '实际总条数',
          value: `${currentSummary.value.actualRecordCount || 0} 笔`,
        },
      ],
      tone: 'neutral',
      stacked: true,
    },
  ]
})

const tableData = computed<Array<(T.BillMonthItemResp | T.BillYearItemResp) & { id: string }>>(() => {
  if (queryForm.billType === 'monthly') {
    return monthlyBill.value.months.map(item => ({
      ...item,
      id: item.month,
    }))
  }

  return yearlyBill.value.years.map(item => ({
    ...item,
    id: String(item.year),
  }))
})

const columns = computed<TableColumnData[]>(() => {
  const periodTitle = queryForm.billType === 'monthly' ? '月份' : '年份'
  const periodColumn: TableColumnData = {
    title: periodTitle,
    dataIndex: 'period',
    slotName: 'period',
    width: 180,
    align: 'center',
  }

  if (queryForm.billType === 'monthly') {
    // 月、年账单的总统计与实际统计均在单元格内按上下两行展示，避免同一周期横向拆散。
    return [
      periodColumn,
      {
        title: '总收入',
        dataIndex: 'income',
        slotName: 'income',
        width: 140,
        align: 'right',
      },
      {
        title: '支出',
        dataIndex: 'expense',
        slotName: 'expense',
        width: 185,
        align: 'right',
      },
      {
        title: '结余',
        dataIndex: 'balance',
        slotName: 'balance',
        width: 185,
        align: 'right',
      },
      {
        title: '条数',
        dataIndex: 'recordCount',
        slotName: 'recordCount',
        width: 165,
        align: 'center',
      },
    ]
  }

  return [
    periodColumn,
    {
      title: '总收入',
      dataIndex: 'income',
      slotName: 'income',
      width: 140,
      align: 'right',
    },
    {
      title: '支出',
      dataIndex: 'expense',
      slotName: 'expense',
      width: 185,
      align: 'right',
    },
    {
      title: '结余',
      dataIndex: 'balance',
      slotName: 'balance',
      width: 185,
      align: 'right',
    },
    {
      title: '条数',
      dataIndex: 'recordCount',
      slotName: 'recordCount',
      width: 165,
      align: 'center',
    },
  ]
})

function formatAmount(value: number | string | undefined | null) {
  const amount = Number(value || 0)
  return amountFormatter.format(Number.isFinite(amount) ? amount : 0)
}

function formatBalance(value: number | string | undefined | null) {
  const amount = Number(value || 0)
  const normalized = Number.isFinite(amount) ? amount : 0
  const prefix = normalized > 0 ? '+' : ''
  return `${prefix}${amountFormatter.format(normalized)}`
}

function resolveBalanceTone(value: number | string | undefined | null) {
  const amount = Number(value || 0)
  if (amount < 0) {
    return 'expense'
  }
  if (amount > 0) {
    return 'income'
  }
  return 'balance'
}

function resolveSummaryTone(value: number | string | undefined | null) {
  const amount = Number(value || 0)
  if (amount < 0) {
    return 'negative'
  }
  if (amount > 0) {
    return 'positive'
  }
  return 'neutral'
}

function resolveBalanceClass(value: number | string | undefined | null) {
  return `bill-amount--${resolveBalanceTone(value)}`
}

function buildBaseQuery(): T.BillQuery {
  const query: T.BillQuery = {}

  if (queryForm.category) {
    query.category = queryForm.category
  }
  if (queryForm.subjectId) {
    query.subjectId = queryForm.subjectId
  }
  if (queryForm.tagId) {
    query.tagId = queryForm.tagId
  }
  if (queryForm.paymentMethod) {
    query.paymentMethod = queryForm.paymentMethod
  }
  if (queryForm.paymentAccountId) {
    query.paymentAccountId = queryForm.paymentAccountId
  }
  if (queryForm.isNecessary !== '' && queryForm.isNecessary !== null && queryForm.isNecessary !== undefined) {
    query.isNecessary = Number(queryForm.isNecessary)
  }
  if (queryForm.isReimburseOther !== '' && queryForm.isReimburseOther !== null && queryForm.isReimburseOther !== undefined) {
    query.isReimburseOther = Number(queryForm.isReimburseOther)
  }
  if (queryForm.isAdvance !== '' && queryForm.isAdvance !== null && queryForm.isAdvance !== undefined) {
    query.isAdvance = Number(queryForm.isAdvance)
  }
  if (queryForm.hidden !== '' && queryForm.hidden !== null && queryForm.hidden !== undefined) {
    query.hidden = Number(queryForm.hidden)
  }
  if (queryForm.userId) {
    query.userId = queryForm.userId
  }

  return query
}

async function searchMethod() {
  loading.value = true

  try {
    if (queryForm.billType === 'monthly') {
      const { data } = await getMonthlyBill({
        ...buildBaseQuery(),
        year: Number(queryForm.year),
      })
      monthlyBill.value = data || createEmptyMonthlyBillResp(queryForm.year)
      return
    }

    const { data } = await getYearlyBill(buildBaseQuery())
    yearlyBill.value = data || createEmptyYearlyBillResp()
  } catch {
    if (queryForm.billType === 'monthly') {
      monthlyBill.value = createEmptyMonthlyBillResp(queryForm.year)
    } else {
      yearlyBill.value = createEmptyYearlyBillResp()
    }
    Message.error('加载账单数据失败')
  } finally {
    loading.value = false
  }
}

function reset() {
  resetForm()
  if (isAdmin.value) {
    queryForm.userId = ''
  }
  searchMethod()
}

function triggerQuerySearch() {
  void nextTick(() => searchMethod())
}

function handleBillTypeChange() {
  void searchMethod()
}

function handleYearChange() {
  if (queryForm.billType !== 'monthly') {
    return
  }
  void searchMethod()
}

onMounted(async () => {
  await loadCommonFilterOptions()
  await searchMethod()
})
</script>

<style scoped lang="scss">
.bill-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 10px;
  width: 100%;
  margin: 18px 0 12px;
}

.bill-summary__card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-height: 32px;
  padding: 0 10px;
  border-radius: 12px;
  border: 1px solid rgba(229, 230, 235, 0.7);
  background: rgba(255, 255, 255, 0.92);
}

.bill-summary__card.is-stacked {
  display: block;
  padding-top: 5px;
  padding-bottom: 5px;
}

.bill-summary__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-height: 25px;
}

.bill-summary__card.is-income {
  background: linear-gradient(135deg, var(--amount-income-bg), rgba(255, 255, 255, 0.98));
}

.bill-summary__card.is-expense {
  background: linear-gradient(135deg, var(--amount-expense-bg), rgba(255, 255, 255, 0.98));
}

.bill-summary__card.is-positive {
  background: linear-gradient(135deg, var(--amount-income-bg), rgba(255, 255, 255, 0.98));
}

.bill-summary__card.is-negative {
  background: linear-gradient(135deg, var(--amount-expense-bg), rgba(255, 255, 255, 0.98));
}

.bill-summary__card.is-neutral {
  background: linear-gradient(135deg, rgba(242, 243, 245, 0.92), rgba(255, 255, 255, 0.98));
}

.bill-summary__label {
  margin: 0;
  color: var(--color-text-2);
  font-size: 12px;
  line-height: 1.4;
  white-space: nowrap;
}

.bill-summary__value {
  color: var(--color-text-1);
  font-size: 15px;
  font-weight: 700;
  line-height: 1.4;
  white-space: nowrap;
}

.bill-summary__card.is-income .bill-summary__value {
  color: var(--amount-income-primary);
}

.bill-summary__card.is-expense .bill-summary__value {
  color: var(--amount-expense-primary);
}

.bill-summary__card.is-positive .bill-summary__value {
  color: var(--amount-income-primary);
}

.bill-summary__card.is-negative .bill-summary__value {
  color: var(--amount-expense-primary);
}

.bill-period {
  display: block;
  color: var(--color-text-1);
  font-weight: 600;
}

.bill-period-cell {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  line-height: 1.2;
}

.bill-comparison {
  display: inline-flex;
  flex-direction: column;
  gap: 4px;
  min-width: 170px;
  text-align: right;
}

.bill-comparison__row {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  min-height: 22px;
  white-space: nowrap;
}

.bill-comparison__row + .bill-comparison__row {
  padding-top: 3px;
  border-top: 1px solid rgba(229, 230, 235, 0.7);
}

.bill-comparison__label {
  color: var(--color-text-3);
  font-size: 11px;
  line-height: 1.2;
}

.bill-query-radio-scroll {
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

.bill-amount {
  font-weight: 700;
}

.bill-amount--income {
  color: var(--amount-income-primary);
}

.bill-amount--expense {
  color: var(--amount-expense-primary);
}

.bill-amount--balance {
  color: var(--color-text-1);
}

@media (max-width: 768px) {
  .bill-summary {
    grid-template-columns: 1fr;
  }
}
</style>
