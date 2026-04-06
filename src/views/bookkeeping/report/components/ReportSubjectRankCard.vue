<template>
  <ReportPanelShell
    title="科目排行"
    :description="description"
    :loading="loading"
  >
    <template #toolbar>
      <div class="report-subject-rank-card__toolbar">
        <a-radio-group
          v-if="showCategorySwitch"
          v-model:model-value="activeCategory"
          type="button"
          size="small"
        >
          <a-radio value="expense">支出排行</a-radio>
          <a-radio value="income">收入排行</a-radio>
        </a-radio-group>
        <span v-else class="report-subject-rank-card__toolbar-text">
          当前仅展示{{ activeCategoryLabel }}科目
        </span>
      </div>
    </template>

    <div class="report-subject-rank-card__body">
      <Chart :option="currentOption" :update-options="{ notMerge: true }" :height="chartHeight" />
    </div>
  </ReportPanelShell>
</template>

<script setup lang="ts">
import type { EChartsOption } from 'echarts'
import { computed, ref, watch } from 'vue'
import { buildSubjectRankOption } from '../shared/useReportOptions'
import ReportPanelShell from './ReportPanelShell.vue'
import Chart from '@/components/Chart/index.vue'
import type { ReportSubjectRankItemResp } from '@/apis/bookkeeping/type'

type SubjectRankCategory = 'expense' | 'income'

const props = withDefaults(defineProps<{
  list: ReportSubjectRankItemResp[]
  loading?: boolean
  selectedCategory?: string
}>(), {
  loading: false,
  selectedCategory: '',
})

const expenseList = computed(() => props.list.filter((item) => item.category === 'expense'))
const incomeList = computed(() => props.list.filter((item) => item.category === 'income'))

const resolvePreferredCategory = (): SubjectRankCategory => {
  if (props.selectedCategory === 'expense' && expenseList.value.length) {
    return 'expense'
  }
  if (props.selectedCategory === 'income' && incomeList.value.length) {
    return 'income'
  }
  if (expenseList.value.length) {
    return 'expense'
  }
  return 'income'
}

const activeCategory = ref<SubjectRankCategory>('expense')

watch(
  [expenseList, incomeList, () => props.selectedCategory],
  () => {
    const preferredCategory = resolvePreferredCategory()
    if (activeCategory.value === 'expense' && !expenseList.value.length) {
      activeCategory.value = preferredCategory
      return
    }
    if (activeCategory.value === 'income' && !incomeList.value.length) {
      activeCategory.value = preferredCategory
      return
    }
    if (props.selectedCategory === 'expense' || props.selectedCategory === 'income') {
      activeCategory.value = preferredCategory
    }
  },
  { immediate: true },
)

const showCategorySwitch = computed(() => expenseList.value.length > 0 && incomeList.value.length > 0)

const activeCategoryLabel = computed(() => (activeCategory.value === 'income' ? '收入' : '支出'))

const description = computed(() => {
  if (activeCategory.value === 'income') {
    return '按金额查看当前区间内收入贡献最高的科目，避免收入与支出混排导致对比失真。'
  }
  return '按金额查看当前区间内支出最高的科目，便于观察真实消费差异。'
})

const currentList = computed(() => (activeCategory.value === 'income' ? incomeList.value : expenseList.value))
const currentOption = computed<EChartsOption>(() => buildSubjectRankOption(currentList.value))

const chartHeight = computed(() => {
  const yAxis = Array.isArray(currentOption.value?.yAxis) ? currentOption.value.yAxis[0] : currentOption.value?.yAxis
  const categoryCount = Array.isArray((yAxis as any)?.data) ? (yAxis as any).data.length : 0
  return `${Math.max(320, 72 + categoryCount * 34)}px`
})
</script>

<style scoped lang="scss">
.report-subject-rank-card__toolbar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  min-height: 28px;
}

.report-subject-rank-card__toolbar-text {
  color: var(--color-text-3);
  font-size: 12px;
  line-height: 1.5;
  white-space: nowrap;
}

.report-subject-rank-card__body {
  width: 100%;
  min-width: 0;
  padding-top: 2px;
}
</style>
