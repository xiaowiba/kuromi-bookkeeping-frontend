<template>
  <ReportPanelShell
    title="支付方式分布"
    :description="description"
    :loading="loading"
  >
    <template #toolbar>
      <div class="report-payment-method-card__toolbar">
        <a-radio-group
          v-if="showViewSwitch"
          v-model:model-value="viewMode"
          type="button"
          size="small"
        >
          <a-radio value="rest">其余方式</a-radio>
          <a-radio value="all">全部方式</a-radio>
        </a-radio-group>
      </div>
    </template>

    <div v-if="showViewSwitch && dominantItem" class="report-payment-method-card__summary">
      <div class="report-payment-method-card__summary-label">头部支付方式</div>
      <div class="report-payment-method-card__summary-main">
        <strong>{{ dominantLabel }}</strong>
        <span>{{ dominantAmount }}</span>
      </div>
      <div class="report-payment-method-card__summary-meta">
        <span>占比 {{ dominantRatioText }}</span>
        <span v-if="dominantLeadText">{{ dominantLeadText }}</span>
      </div>
    </div>

    <div class="report-payment-method-card__body">
      <Chart :option="currentOption" :update-options="{ notMerge: true }" :height="chartHeight" />
    </div>
  </ReportPanelShell>
</template>

<script setup lang="ts">
/**
 * 支付方式占比卡片。
 *
 * 支持突出主支付方式，并可在“其余方式”和“全部方式”图表视角间切换。
 *
 * @author Wangsongsong
 * @date 2026-07-02
 * @update 2026-07-02 @Wangsongsong
 * @desc 补充支付方式卡片展示模式和主支付方式说明
 */
import type { EChartsOption } from 'echarts'
import { computed, ref, watch } from 'vue'
import { formatReportCurrency, formatReportRatio, resolveReportPaymentMethodLabel } from '../shared/reportFormat'
import { buildPaymentMethodOption } from '../shared/useReportOptions'
import ReportPanelShell from './ReportPanelShell.vue'
import Chart from '@/components/Chart/index.vue'
import type { ReportPaymentMethodShareItemResp } from '@/apis/bookkeeping/type'

type PaymentChartMode = 'rest' | 'all'

const props = withDefaults(defineProps<{
  list: ReportPaymentMethodShareItemResp[]
  loading?: boolean
  colors?: Record<string, any>
}>(), {
  loading: false,
  colors: undefined,
})

const sortedList = computed(() => {
  return [...props.list].sort((prev, next) => Number(next.amount || 0) - Number(prev.amount || 0))
})

const dominantItem = computed(() => sortedList.value[0] || null)
const secondItem = computed(() => sortedList.value[1] || null)

const dominantRatioValue = computed(() => {
  if (!dominantItem.value) {
    return 0
  }
  if (Number(dominantItem.value.ratio || 0) > 0) {
    return Number(dominantItem.value.ratio || 0)
  }
  const totalAmount = sortedList.value.reduce((sum, item) => sum + Number(item.amount || 0), 0)
  if (!totalAmount) {
    return 0
  }
  return Number(dominantItem.value.amount || 0) / totalAmount
})

const dominanceMultiple = computed(() => {
  const dominantAmount = Number(dominantItem.value?.amount || 0)
  const secondAmount = Number(secondItem.value?.amount || 0)
  if (!dominantAmount || !secondAmount) {
    return 0
  }
  return dominantAmount / secondAmount
})

const isDominantMode = computed(() => {
  if (!dominantItem.value || sortedList.value.length <= 1) {
    return false
  }
  if (dominantRatioValue.value >= 0.55) {
    return true
  }
  if (!secondItem.value) {
    return true
  }
  return dominanceMultiple.value >= 3
})

const remainingList = computed(() => sortedList.value.slice(1))
const showViewSwitch = computed(() => isDominantMode.value && remainingList.value.length > 0)

const viewMode = ref<PaymentChartMode>('all')

watch(
  [isDominantMode, remainingList],
  () => {
    viewMode.value = showViewSwitch.value ? 'rest' : 'all'
  },
  { immediate: true },
)

const visibleList = computed(() => {
  if (viewMode.value === 'rest' && showViewSwitch.value) {
    return remainingList.value
  }
  return sortedList.value
})

const description = computed(() => {
  if (showViewSwitch.value) {
    return '头部支付方式已单独摘出，默认观察其余支付方式之间的差异，避免极大值压缩图表可读性。'
  }
  return '查看当前周期内主要支付渠道的金额分布，识别常用支付习惯。'
})

const dominantLabel = computed(() => {
  if (!dominantItem.value) {
    return ''
  }
  return resolveReportPaymentMethodLabel(dominantItem.value.key, dominantItem.value.label)
})

const dominantAmount = computed(() => formatReportCurrency(dominantItem.value?.amount || 0))
const dominantRatioText = computed(() => formatReportRatio(dominantRatioValue.value))

const dominantLeadText = computed(() => {
  if (!secondItem.value || dominanceMultiple.value <= 1) {
    return ''
  }
  return `约为第 2 名的 ${dominanceMultiple.value.toFixed(1)} 倍`
})

const currentOption = computed<EChartsOption>(() => buildPaymentMethodOption(visibleList.value, { colors: props.colors as any }))

const chartHeight = computed(() => {
  const yAxis = Array.isArray(currentOption.value?.yAxis) ? currentOption.value.yAxis[0] : currentOption.value?.yAxis
  const categoryCount = Array.isArray((yAxis as any)?.data) ? (yAxis as any).data.length : 0
  return `${Math.max(320, 72 + categoryCount * 34)}px`
})
</script>

<style scoped lang="scss">
.report-payment-method-card__toolbar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  min-height: 28px;
}

.report-payment-method-card__summary {
  margin-bottom: 12px;
  border: 1px solid rgba(245, 158, 11, 0.18);
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(255, 247, 214, 0.9) 0%, rgba(255, 251, 235, 0.96) 100%);
  padding: 12px 14px;
}

.report-payment-method-card__summary-label {
  color: #8a7857;
  font-size: 12px;
  line-height: 1.4;
}

.report-payment-method-card__summary-main {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-top: 6px;
}

.report-payment-method-card__summary-main strong {
  color: #3f341d;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.2;
}

.report-payment-method-card__summary-main span {
  color: #ca8a04;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.2;
  white-space: nowrap;
}

.report-payment-method-card__summary-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 14px;
  margin-top: 8px;
  color: #6b5d42;
  font-size: 12px;
  line-height: 1.5;
}

.report-payment-method-card__body {
  width: 100%;
  min-width: 0;
  padding-top: 2px;
}
</style>
