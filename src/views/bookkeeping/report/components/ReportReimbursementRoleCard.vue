<template>
  <ReportPanelShell
    title="报销角色"
    :description="panelDescription"
    :loading="loading"
  >
    <div class="report-reimbursement-role">
      <button
        v-for="item in roleCards"
        :key="item.key"
        class="report-reimbursement-role__item"
        :class="[
          `is-${item.key}`,
          { 'is-clickable': item.drilldownType },
        ]"
        type="button"
        :disabled="!item.drilldownType"
        @click="handleDrilldown(item.drilldownType)"
      >
        <span class="report-reimbursement-role__label">{{ item.label }}</span>
        <strong class="report-reimbursement-role__amount">{{ item.amountText }}</strong>
        <span class="report-reimbursement-role__count">{{ item.countText }}</span>
        <span class="report-reimbursement-role__hint">{{ item.hint }}</span>
      </button>
    </div>

    <p class="report-reimbursement-role__note">
      {{ roleNote }}
    </p>
  </ReportPanelShell>
</template>

<script setup lang="ts">
/**
 * 报表报销角色卡片。
 *
 * 展示当前筛选范围内的垫付、已被报销、待报销和报销他人数据。
 * 这里的“已被报销”是“垫付总额”的已关联子集，不与垫付总额重复相加。
 *
 * @author Wangsongsong
 * @date 2026-07-08
 */
import { computed } from 'vue'
import ReportPanelShell from './ReportPanelShell.vue'
import type { ReportReimbursementRoleSummaryResp } from '@/apis/bookkeeping/type'
import { formatReportAmount, formatReportCurrency } from '../shared/reportFormat'

type ReimbursementRoleDrilldownType = 'advance' | 'reimburseOther'

interface RoleCard {
  key: string
  label: string
  amountText: string
  countText: string
  hint: string
  drilldownType?: ReimbursementRoleDrilldownType
}

const props = withDefaults(defineProps<{
  summary: ReportReimbursementRoleSummaryResp
  allUserScope?: boolean
  loading?: boolean
}>(), {
  allUserScope: false,
  loading: false,
})

const emit = defineEmits<{
  drilldown: [type: ReimbursementRoleDrilldownType]
}>()

const panelDescription = computed(() => {
  if (props.allUserScope) {
    return '按全部可见用户汇总报销链路角色，帮助区分垫付与真实承担支出。'
  }
  return '按当前选中所属用户汇总报销链路角色，帮助识别垫付、被报销和报销他人的情况。'
})

const roleNote = computed(() => {
  if (props.allUserScope) {
    return '当前展示为全部可见用户的报销角色汇总，角色金额不等同于实际净支出。'
  }
  return '已被报销属于垫付总额中的已关联部分；报销他人代表当前账户作为报销方实际承担的支出。'
})

const roleCards = computed<RoleCard[]>(() => [
  {
    key: 'advance',
    label: '垫付总额',
    amountText: formatReportCurrency(props.summary?.advanceAmount),
    countText: `${formatReportAmount(props.summary?.advanceCount, { compact: true })} 笔`,
    hint: '当前范围内被标记为垫付的明细',
    drilldownType: 'advance',
  },
  {
    key: 'reimbursed',
    label: '已被报销',
    amountText: formatReportCurrency(props.summary?.reimbursedAdvanceAmount),
    countText: `${formatReportAmount(props.summary?.reimbursedAdvanceCount, { compact: true })} 笔`,
    hint: '垫付中已经关联报销方的部分',
  },
  {
    key: 'pending',
    label: '待报销',
    amountText: formatReportCurrency(props.summary?.pendingAdvanceAmount),
    countText: `${formatReportAmount(props.summary?.pendingAdvanceCount, { compact: true })} 笔`,
    hint: '垫付中尚未关联报销方的部分',
  },
  {
    key: 'reimburse-other',
    label: '报销他人',
    amountText: formatReportCurrency(props.summary?.reimburseOtherAmount),
    countText: `${formatReportAmount(props.summary?.reimburseOtherCount, { compact: true })} 笔`,
    hint: '当前账户作为报销方承担的支出',
    drilldownType: 'reimburseOther',
  },
])

const handleDrilldown = (type?: ReimbursementRoleDrilldownType) => {
  if (!type) {
    return
  }
  emit('drilldown', type)
}
</script>

<style scoped lang="scss">
.report-reimbursement-role {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.report-reimbursement-role__item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-width: 0;
  min-height: 132px;
  padding: 14px;
  border: 1px solid var(--color-border-2);
  border-radius: 14px;
  background: linear-gradient(145deg, var(--color-fill-1), var(--color-bg-1));
  color: inherit;
  text-align: left;
  cursor: default;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}

.report-reimbursement-role__item.is-clickable {
  cursor: pointer;
}

.report-reimbursement-role__item.is-clickable:hover {
  border-color: rgba(var(--primary-6), 0.35);
  box-shadow: 0 10px 28px rgba(29, 33, 41, 0.08);
  transform: translateY(-2px);
}

.report-reimbursement-role__item:disabled {
  opacity: 1;
}

.report-reimbursement-role__label {
  color: var(--color-text-2);
  font-size: 13px;
  font-weight: 700;
  line-height: 1.4;
}

.report-reimbursement-role__amount {
  margin-top: 10px;
  color: var(--color-text-1);
  font-size: 22px;
  font-weight: 800;
  line-height: 1.25;
  word-break: break-word;
}

.report-reimbursement-role__count {
  margin-top: 6px;
  color: rgb(var(--primary-6));
  font-size: 12px;
  font-weight: 700;
  line-height: 1.4;
}

.report-reimbursement-role__hint {
  margin-top: auto;
  padding-top: 12px;
  color: var(--color-text-3);
  font-size: 12px;
  line-height: 1.5;
}

.report-reimbursement-role__item.is-advance .report-reimbursement-role__amount,
.report-reimbursement-role__item.is-pending .report-reimbursement-role__amount,
.report-reimbursement-role__item.is-reimburse-other .report-reimbursement-role__amount {
  color: var(--amount-expense-primary);
}

.report-reimbursement-role__item.is-reimbursed .report-reimbursement-role__amount {
  color: var(--amount-income-primary);
}

.report-reimbursement-role__note {
  margin: 12px 0 0;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(var(--primary-6), 0.06);
  color: var(--color-text-2);
  font-size: 12px;
  line-height: 1.7;
}

@media (max-width: 1180px) {
  .report-reimbursement-role {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 680px) {
  .report-reimbursement-role {
    grid-template-columns: 1fr;
  }
}
</style>
