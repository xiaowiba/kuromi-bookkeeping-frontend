<template>
  <div class="report-ranking-table">
    <GiTable
      row-key="detailId"
      title="明细排行表"
      :data="list"
      :columns="columns"
      :loading="loading"
      :scroll="{ x: '100%', y: '100%', minWidth: 1120 }"
      :pagination="pagination"
      :disabled-tools="['size']"
      :disabled-column-keys="['subjectDetail']"
      table-id="bookkeeping-report-ranking-table"
      @refresh="emit('refresh')"
      @change="handleTableChange"
    >
      <template #custom-title>
        <div class="report-ranking-table__title">
          <strong>明细排行表</strong>
          <span>样式和明细列表保持一致，支持字段显隐、拖拽排序和固定列。</span>
        </div>
      </template>

      <template #toolbar-left>
        <div class="report-ranking-table__sort">
          <span class="report-ranking-table__sort-label">排序</span>
          <a-radio-group
            type="button"
            size="small"
            :model-value="sortValue"
            @change="emit('sort-change', String($event))"
          >
            <a-radio value="amount-desc">金额降序</a-radio>
            <a-radio value="amount-asc">金额升序</a-radio>
            <a-radio value="date-desc">日期最新</a-radio>
            <a-radio value="date-asc">日期最早</a-radio>
          </a-radio-group>
        </div>
      </template>

      <template #detailDate="{ record }">
        <div class="report-ranking-table__date">
          <strong>{{ formatReportDate(record.detailDate) }}</strong>
          <BookkeepingWeekdayTag :date="record.detailDate" />
        </div>
      </template>

      <template #category="{ record }">
        <GiCellTag :value="record.category" :dict="bk_subject_category" />
      </template>

      <template #subjectDetail="{ record }">
        <BookkeepingSubjectDetailCell
          :icon="record.subjectIcon"
          :subject-name="record.subjectName"
          :detail-name="record.detailName"
        />
      </template>

      <template #paymentMethod="{ record }">
        <a-tag color="gold">
          {{ resolveReportPaymentMethodLabel(record.paymentMethod, record.paymentMethodLabel, bk_payment_method) }}
        </a-tag>
      </template>

      <template #paymentAccountName="{ record }">
        <a-tag
          v-if="record.paymentAccountName"
          size="small"
          :color="record.paymentAccountDeleted ? 'gray' : 'cyan'"
          :class="{ 'tag-deleted': record.paymentAccountDeleted }"
        >
          {{ formatPaymentAccountName(record.paymentAccountName, record.paymentAccountDeleted) }}
        </a-tag>
      </template>

      <template #amount="{ record }">
        <span
          class="report-ranking-table__amount"
          :class="record.category === 'income' ? 'report-ranking-table__amount--income' : 'report-ranking-table__amount--expense'"
        >
          {{ formatRankingAmount(record.amount, record.category) }}
        </span>
      </template>

      <template #ratio="{ record }">
        {{ formatReportRatio(record.ratio) }}
      </template>
    </GiTable>
  </div>
</template>

<script setup lang="ts">
import type { TableChangeExtra, TableInstance } from '@arco-design/web-vue'
import {computed, h} from 'vue'
import GiCellTag from '@/components/GiCell/GiCellTag.vue'
import { useDict } from '@/hooks/app'
import type { ReportRankingTableResp } from '@/apis/bookkeeping/type'
import BookkeepingSubjectDetailCell from '../../shared/components/BookkeepingSubjectDetailCell.vue'
import BookkeepingWeekdayTag from '../../shared/components/BookkeepingWeekdayTag.vue'
import { REPORT_WEB_PAGE_SIZE_OPTIONS } from '../shared/reportConstants'
import {
  formatReportDate,
  formatReportRatio,
  resolveReportPaymentMethodLabel,
} from '../shared/reportFormat'
import { formatPaymentAccountName } from '@/utils/paymentAccountDisplay'

const props = withDefaults(defineProps<{
  list: ReportRankingTableResp[]
  total: number
  page: number
  pageSize: number
  sortValue: string
  loading?: boolean
}>(), {
  loading: false,
})

const emit = defineEmits<{
  (e: 'page-change', value: number): void
  (e: 'page-size-change', value: number): void
  (e: 'sort-change', value: string): void
  (e: 'refresh'): void
}>()

const { bk_subject_category, bk_payment_method } = useDict('bk_subject_category', 'bk_payment_method')

const columns: TableInstance['columns'] = [
  {
    title: '序号',
    width: 66,
    align: 'center',
    render: ({ rowIndex }) => h('span', {}, rowIndex + 1 + (props.page - 1) * props.pageSize),
    show: false,
  },
  { title: '日期', dataIndex: 'detailDate', slotName: 'detailDate', width: 180, align: 'center' },
  { title: '分类', dataIndex: 'category', slotName: 'category', width: 96, align: 'center' },
  { title: '科目 / 明细', dataIndex: 'subjectDetail', slotName: 'subjectDetail', width: 280 },
  { title: '支付方式', dataIndex: 'paymentMethod', slotName: 'paymentMethod', width: 130, align: 'center' },
  { title: '支付账号', dataIndex: 'paymentAccountName', slotName: 'paymentAccountName', width: 150, align: 'center' },
  { title: '用户', dataIndex: 'userName', width: 110, ellipsis: true, tooltip: true },
  { title: '金额', dataIndex: 'amount', slotName: 'amount', width: 130, align: 'right' },
  { title: '占比', dataIndex: 'ratio', slotName: 'ratio', width: 96, align: 'right' },
]

const pagination = computed(() => ({
  current: props.page,
  pageSize: props.pageSize,
  total: props.total,
  showPageSize: true,
  pageSizeOptions: REPORT_WEB_PAGE_SIZE_OPTIONS,
  size: 'small' as const,
}))

const formatRankingAmount = (value: number | string, category: string) => {
  const numericValue = Math.abs(Number(value) || 0)
  const prefix = category === 'income' ? '+' : '-'
  return `${prefix}${numericValue.toFixed(2)}`
}

const handleTableChange = (_data: unknown[], extra: TableChangeExtra) => {
  if (extra.type !== 'pagination') {
    return
  }
  if (extra.pageSize && extra.pageSize !== props.pageSize) {
    emit('page-size-change', extra.pageSize)
    return
  }
  if (extra.page) {
    emit('page-change', extra.page)
  }
}
</script>

<style scoped lang="scss">
.report-ranking-table {
  border: 1px solid rgba(229, 230, 235, 0.9);
  border-radius: 16px;
  background: var(--color-bg-1);
  padding: 18px 18px 12px;
}

.report-ranking-table__title {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.report-ranking-table__title strong {
  color: var(--color-text-1);
  font-size: 16px;
  font-weight: 700;
  line-height: 1.2;
}

.report-ranking-table__title span {
  color: var(--color-text-3);
  font-size: 12px;
  line-height: 1.6;
}

.report-ranking-table__sort {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.report-ranking-table__sort-label {
  color: var(--color-text-2);
  font-size: 13px;
  font-weight: 600;
}

.report-ranking-table__date {
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
}

.report-ranking-table__date strong {
  color: var(--color-text-1);
  font-size: 13px;
  font-weight: 700;
}

.report-ranking-table__amount {
  font-weight: 700;
}

.report-ranking-table__amount--income {
  color: var(--amount-income-primary);
}

.report-ranking-table__amount--expense {
  color: var(--amount-expense-primary);
}

.report-ranking-table :deep(.gi-table) {
  background: transparent;
}

.report-ranking-table :deep(.gi-table__header) {
  margin-bottom: 6px;
}

.report-ranking-table :deep(.gi-table__toolbar) {
  margin-bottom: 10px;
}

.report-ranking-table :deep(.arco-table-container) {
  border-radius: 12px;
}

@media (max-width: 900px) {
  .report-ranking-table {
    padding: 14px 14px 10px;
  }
}

.tag-deleted {
  text-decoration: line-through;
  opacity: 0.6;
}
</style>
