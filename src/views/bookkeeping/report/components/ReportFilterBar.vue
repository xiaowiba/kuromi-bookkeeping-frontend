<template>
  <a-card :bordered="false" class="report-filter-bar">
    <div class="report-filter-bar__section">
      <div class="report-filter-bar__section-label">时间范围</div>
      <div class="report-filter-bar__preset-group">
        <button
          v-for="item in datePresetOptions"
          :key="String(item.value)"
          type="button"
          class="report-filter-bar__preset"
          :class="{ 'is-active': filterForm.datePreset === item.value }"
          :disabled="loading"
          @click="handlePresetClick(String(item.value))"
        >
          {{ item.label }}
        </button>
      </div>
      <a-range-picker
        v-if="filterForm.datePreset === 'custom'"
        v-model="filterForm.dateRange"
        class="report-filter-bar__range"
        format="YYYY-MM-DD"
        value-format="YYYY-MM-DD"
        :disabled="loading"
      />
    </div>

    <div class="report-filter-bar__grid">
      <div class="report-filter-bar__field">
        <span class="report-filter-bar__field-label">分类</span>
        <a-select
          v-model="filterForm.category"
          :options="categoryOptions"
          placeholder="全部分类"
          allow-clear
          :disabled="loading"
        />
      </div>

      <div class="report-filter-bar__field">
        <span class="report-filter-bar__field-label">科目</span>
        <a-select
          v-model="filterForm.subjectId"
          :options="subjectOptions"
          placeholder="全部科目"
          allow-clear
          allow-search
          :disabled="loading"
        />
      </div>

      <div class="report-filter-bar__field">
        <span class="report-filter-bar__field-label">支付方式</span>
        <a-select
          v-model="filterForm.paymentMethod"
          :options="paymentMethodOptions"
          placeholder="全部支付方式"
          allow-clear
          :disabled="loading"
        />
      </div>

      <div class="report-filter-bar__field">
        <span class="report-filter-bar__field-label">用户范围</span>
        <div class="report-filter-bar__scope-group">
          <button
            v-for="item in userScopeOptions"
            :key="String(item.value)"
            type="button"
            class="report-filter-bar__scope"
            :class="{ 'is-active': filterForm.userScope === item.value }"
            :disabled="loading"
            @click="filterForm.userScope = item.value as any"
          >
            {{ item.label }}
          </button>
        </div>
      </div>

      <div v-if="filterForm.userScope === 'specific'" class="report-filter-bar__field">
        <span class="report-filter-bar__field-label">指定用户</span>
        <a-select
          v-model="filterForm.userId"
          :options="userSelectOptions"
          placeholder="请选择用户"
          allow-clear
          :disabled="loading"
        />
      </div>
    </div>

    <div class="report-filter-bar__actions">
      <a-button type="primary" :loading="loading" @click="emit('search')">查询</a-button>
      <a-button :disabled="loading" @click="emit('reset')">重置</a-button>
    </div>
  </a-card>
</template>

<script setup lang="ts">
import type * as T from '@/apis/bookkeeping/type'
import type { LabelValueState } from '@/types/global'

interface Props {
  filterForm: T.ReportFilterForm
  datePresetOptions: Array<LabelValueState & { shortLabel?: string }>
  categoryOptions: LabelValueState[]
  subjectOptions: LabelValueState[]
  paymentMethodOptions: LabelValueState[]
  userScopeOptions: LabelValueState[]
  userSelectOptions: LabelValueState[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
})

const emit = defineEmits<{
  (e: 'search'): void
  (e: 'reset'): void
  (e: 'preset-change'): void
}>()

const handlePresetClick = (preset: string) => {
  if (props.filterForm.datePreset === preset) {
    return
  }
  props.filterForm.datePreset = preset as T.ReportDatePreset
  emit('preset-change')
}
</script>

<style scoped lang="scss">
.report-filter-bar {
  border-radius: 24px;
  background:
    radial-gradient(circle at top right, rgba(251, 191, 36, 0.18) 0%, transparent 32%),
    linear-gradient(180deg, rgba(255, 252, 245, 0.98) 0%, rgba(255, 248, 236, 0.96) 100%);
  box-shadow: 0 16px 30px rgba(130, 90, 22, 0.08);
}

.report-filter-bar__section + .report-filter-bar__grid {
  margin-top: 18px;
}

.report-filter-bar__section-label,
.report-filter-bar__field-label {
  display: block;
  margin-bottom: 10px;
  color: #775d2c;
  font-size: 13px;
  font-weight: 700;
}

.report-filter-bar__preset-group,
.report-filter-bar__scope-group {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.report-filter-bar__preset,
.report-filter-bar__scope {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 34px;
  padding: 0 14px;
  border: 1px solid rgba(202, 138, 4, 0.12);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.92);
  color: #6f5b37;
  font-size: 13px;
  font-weight: 600;
}

.report-filter-bar__preset.is-active,
.report-filter-bar__scope.is-active {
  border-color: rgba(202, 138, 4, 0.32);
  background: linear-gradient(135deg, rgba(254, 243, 199, 0.96) 0%, rgba(252, 211, 77, 0.26) 100%);
  color: #7c5200;
  box-shadow: 0 10px 18px rgba(202, 138, 4, 0.12);
}

.report-filter-bar__range {
  width: 100%;
  margin-top: 12px;
}

.report-filter-bar__grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.report-filter-bar__actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 18px;
}

@media (max-width: 1440px) {
  .report-filter-bar__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .report-filter-bar__grid {
    grid-template-columns: 1fr;
  }
}
</style>
