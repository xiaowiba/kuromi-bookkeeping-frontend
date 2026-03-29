<template>
  <a-card :bordered="false" class="report-ranking-card">
    <template #title>
      <div class="report-ranking-card__header">
        <div class="report-ranking-card__title">
          <span>明细排行表</span>
          <small>底部表格用于按金额和日期核对具体明细</small>
        </div>
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

    <a-table
      :data="list"
      :loading="loading"
      :pagination="false"
      :scroll="{ x: 1080 }"
      row-key="detailId"
    >
      <template #columns>
        <a-table-column title="日期" data-index="detailDate" :width="148">
          <template #cell="{ record }">
            <div class="report-ranking-card__date">
              <strong>{{ formatReportDate(record.detailDate) }}</strong>
              <small>{{ formatReportWeekday(record.detailDate) }}</small>
            </div>
          </template>
        </a-table-column>

        <a-table-column title="分类" data-index="category" :width="110">
          <template #cell="{ record }">
            <GiCellTag :value="record.category" :dict="bk_subject_category" />
          </template>
        </a-table-column>

        <a-table-column title="科目 / 明细" :width="260">
          <template #cell="{ record }">
            <div class="report-ranking-card__subject">
              <span class="report-ranking-card__subject-icon">
                <BookkeepingSubjectIcon :icon="record.subjectIcon" mode="web" :size="18" />
              </span>
              <div class="report-ranking-card__subject-meta">
                <strong>{{ record.subjectName }}</strong>
                <span>{{ record.detailName }}</span>
              </div>
            </div>
          </template>
        </a-table-column>

        <a-table-column title="支付方式" data-index="paymentMethodLabel" :width="140">
          <template #cell="{ record }">
            <a-tag color="gold">
              {{ resolveReportPaymentMethodLabel(record.paymentMethod, record.paymentMethodLabel, bk_payment_method) }}
            </a-tag>
          </template>
        </a-table-column>

        <a-table-column title="用户" data-index="userName" :width="120" />

        <a-table-column title="金额" data-index="amount" align="right" :width="140">
          <template #cell="{ record }">
            <span
              class="report-ranking-card__amount"
              :class="record.category === 'income' ? 'report-ranking-card__amount--income' : 'report-ranking-card__amount--expense'"
            >
              {{ formatRankingAmount(record.amount, record.category) }}
            </span>
          </template>
        </a-table-column>

        <a-table-column title="占比" data-index="ratio" align="right" :width="120">
          <template #cell="{ record }">
            {{ formatReportRatio(record.ratio) }}
          </template>
        </a-table-column>
      </template>
    </a-table>

    <div class="report-ranking-card__footer">
      <span class="report-ranking-card__total">共 {{ total }} 条</span>
      <a-pagination
        :current="page"
        :page-size="pageSize"
        :page-size-options="REPORT_WEB_PAGE_SIZE_OPTIONS"
        :show-page-size="true"
        :total="total"
        size="small"
        @change="emit('page-change', $event)"
        @page-size-change="emit('page-size-change', $event)"
      />
    </div>
  </a-card>
</template>

<script setup lang="ts">
import BookkeepingSubjectIcon from '@/components/BookkeepingSubjectIcon/index.vue'
import GiCellTag from '@/components/GiCell/GiCellTag.vue'
import { useDict } from '@/hooks/app'
import type { ReportRankingTableResp } from '@/apis/bookkeeping/type'
import { REPORT_WEB_PAGE_SIZE_OPTIONS } from '../shared/reportConstants'
import {
  formatReportDate,
  formatReportRatio,
  formatReportWeekday,
  resolveReportPaymentMethodLabel,
} from '../shared/reportFormat'

withDefaults(defineProps<{
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
}>()

const { bk_subject_category, bk_payment_method } = useDict('bk_subject_category', 'bk_payment_method')

const formatRankingAmount = (value: number | string, category: string) => {
  const numericValue = Math.abs(Number(value) || 0)
  const prefix = category === 'income' ? '+' : '-'
  return `${prefix}${numericValue.toFixed(2)}`
}
</script>

<style scoped lang="scss">
.report-ranking-card {
  border-radius: 24px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(255, 250, 240, 0.96) 100%);
  box-shadow: 0 16px 28px rgba(130, 90, 22, 0.06);
}

.report-ranking-card__header,
.report-ranking-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.report-ranking-card__title {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.report-ranking-card__title span {
  color: #342714;
  font-size: 16px;
  font-weight: 800;
}

.report-ranking-card__title small {
  color: #907b58;
  font-size: 12px;
  font-weight: 600;
}

.report-ranking-card__subject {
  display: flex;
  align-items: center;
  gap: 12px;
}

.report-ranking-card__subject-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(254, 243, 199, 0.8);
  color: #8b5e00;
}

.report-ranking-card__subject-meta {
  display: flex;
  flex-direction: column;
}

.report-ranking-card__subject-meta strong {
  color: #342714;
  font-size: 14px;
  font-weight: 700;
}

.report-ranking-card__subject-meta span,
.report-ranking-card__total {
  color: #907b58;
  font-size: 12px;
}

.report-ranking-card__date {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.report-ranking-card__date strong {
  color: #342714;
  font-size: 13px;
  font-weight: 700;
}

.report-ranking-card__date small {
  color: #907b58;
  font-size: 12px;
}

.report-ranking-card__amount {
  font-weight: 800;
}

.report-ranking-card__amount--income {
  color: #00b42a;
}

.report-ranking-card__amount--expense {
  color: #f53f3f;
}

.report-ranking-card__footer {
  margin-top: 16px;
}

@media (max-width: 900px) {
  .report-ranking-card__header,
  .report-ranking-card__footer {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
