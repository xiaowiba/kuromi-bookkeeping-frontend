<template>
  <GiPageLayout :body-style="{ overflowY: 'auto', overflowX: 'hidden' }">
    <GiTable
      row-key="id"
      :data="tableData"
      :columns="columns"
      :loading="loading"
      :scroll="{ x: '100%', y: '100%', minWidth: 760 }"
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
              <a-radio-group v-model="queryForm.userId" :options="userQueryOptions" />
            </div>
          </template>
          <template #category>
            <div class="bill-query-radio-scroll">
              <a-radio-group v-model="queryForm.category" :options="categoryQueryOptions" />
            </div>
          </template>
          <template #subjectId>
            <div class="bill-query-radio-scroll">
              <a-radio-group v-model="queryForm.subjectId" :options="subjectQueryOptions" />
            </div>
          </template>
          <template #tagId>
            <div class="bill-query-radio-scroll">
              <a-radio-group
                v-model="queryForm.tagId"
                :options="tagQueryOptions"
                :disabled="!queryForm.subjectId"
              />
            </div>
          </template>
          <template #paymentMethod>
            <div class="bill-query-radio-scroll">
              <a-radio-group
                v-model="queryForm.paymentMethod"
                :options="paymentMethodQueryOptions"
              />
            </div>
          </template>
          <template #paymentAccountId>
            <div class="bill-query-radio-scroll">
              <a-radio-group
                v-model="queryForm.paymentAccountId"
                :options="paymentAccountQueryOptions"
              />
            </div>
          </template>
          <template #isNecessary>
            <div class="bill-query-radio-scroll">
              <a-radio-group
                v-model="queryForm.isNecessary"
                :options="isNecessaryQueryOptions"
              />
            </div>
          </template>
          <template #hidden>
            <div class="bill-query-radio-scroll">
              <a-radio-group
                v-model="queryForm.hidden"
                :options="hiddenQueryOptions"
              />
            </div>
          </template>
        </GiForm>

        <div class="bill-summary">
          <div
            v-for="item in summaryCards"
            :key="item.label"
            class="bill-summary__card"
            :class="`is-${item.tone}`"
          >
            <p class="bill-summary__label">{{ item.label }}</p>
            <strong class="bill-summary__value">{{ item.value }}</strong>
          </div>
        </div>
      </template>

      <template #period="{ record }">
        <span class="bill-period">
          {{ queryForm.billType === 'monthly' ? record.month : `${record.year} 年` }}
        </span>
      </template>

      <template #income="{ record }">
        <span class="bill-amount bill-amount--income">
          {{ formatAmount(record.income) }}
        </span>
      </template>

      <template #expense="{ record }">
        <span class="bill-amount bill-amount--expense">
          {{ formatAmount(record.expense) }}
        </span>
      </template>

      <template #balance="{ record }">
        <span class="bill-amount" :class="resolveBalanceClass(record.balance)">
          {{ formatBalance(record.balance) }}
        </span>
      </template>

      <template #recordCount="{ record }">
        <a-tag size="small" color="gray">
          {{ record.recordCount || 0 }} 笔
        </a-tag>
      </template>
    </GiTable>
  </GiPageLayout>
</template>

<script setup lang="ts">
/**
 * Web 账单管理页面
 *
 * @author Codex
 * @date 2026-04-26
 */
import { Message } from '@arco-design/web-vue'
import { computed, onMounted, ref, watch } from 'vue'
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

const createDefaultBillQueryForm = (): T.BillFilterForm => ({
  billType: 'monthly',
  year: currentYear,
  category: '',
  subjectId: '',
  tagId: '',
  paymentMethod: '',
  paymentAccountId: '',
  isNecessary: '',
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
  },
  category: {
    span: { xs: 24, sm: 12, xxl: 12 },
    useRadioGroup: true,
  },
  subject: {
    span: { xs: 24, sm: 24, xxl: 24 },
    useRadioGroup: true,
  },
  tag: {
    span: { xs: 24, sm: 24, xxl: 24 },
    useRadioGroup: true,
  },
  paymentMethod: {
    span: { xs: 24, sm: 24, xxl: 24 },
    useRadioGroup: true,
  },
  paymentAccount: {
    span: { xs: 24, sm: 24, xxl: 24 },
    useRadioGroup: true,
  },
  isNecessary: {
    span: { xs: 24, sm: 24, xxl: 24 },
    useRadioGroup: true,
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

const summaryCards = computed(() => [
  {
    label: '支出',
    value: formatAmount(currentSummary.value.totalExpense),
    tone: 'expense',
  },
  {
    label: '收入',
    value: formatAmount(currentSummary.value.totalIncome),
    tone: 'income',
  },
  {
    label: '结余',
    value: formatBalance(currentSummary.value.balance),
    tone: resolveSummaryTone(currentSummary.value.balance),
  },
  {
    label: '记录数',
    value: `${currentSummary.value.recordCount || 0} 笔`,
    tone: 'neutral',
  },
])

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

  return [
    {
      title: periodTitle,
      dataIndex: 'period',
      slotName: 'period',
      width: 180,
      align: 'center',
    },
    {
      title: '收入',
      dataIndex: 'income',
      slotName: 'income',
      width: 160,
      align: 'right',
    },
    {
      title: '支出',
      dataIndex: 'expense',
      slotName: 'expense',
      width: 160,
      align: 'right',
    },
    {
      title: '结余',
      dataIndex: 'balance',
      slotName: 'balance',
      width: 160,
      align: 'right',
    },
    {
      title: '记录数',
      dataIndex: 'recordCount',
      slotName: 'recordCount',
      width: 120,
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
  grid-template-columns: repeat(4, minmax(0, 1fr));
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
  color: var(--color-text-1);
  font-weight: 600;
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

@media (max-width: 1440px) {
  .bill-summary {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .bill-summary {
    grid-template-columns: 1fr;
  }
}
</style>
