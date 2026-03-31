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
        <span class="report-filter-bar__field-label">所属用户</span>
        <a-select
            v-if="isMobileView"
            v-model="selectedUserId"
            :options="userQueryOptions"
            placeholder="请选择所属用户"
            allow-clear
            allow-search
            :disabled="loading"
            @change="handleUserChange"
        />
        <div v-else class="report-filter-bar__radio-scroll">
          <a-radio-group
              v-model="selectedUserId"
              :options="userQueryOptions"
              :disabled="loading"
              @change="handleUserChange"
          />
        </div>
      </div>

      <div class="report-filter-bar__field">
        <span class="report-filter-bar__field-label">分类</span>
        <a-select
          v-if="isMobileView"
          v-model="filterForm.category"
          :options="categoryOptions"
          placeholder="请选择分类"
          allow-clear
          :disabled="loading"
          @change="handleCategoryChange"
        />
        <div v-else class="report-filter-bar__radio-scroll">
          <a-radio-group
            v-model="filterForm.category"
            :options="categoryOptions"
            :disabled="loading"
            @change="handleCategoryChange"
          />
        </div>
      </div>

      <div class="report-filter-bar__field">
        <span class="report-filter-bar__field-label">科目</span>
        <a-select
          v-if="isMobileView"
          v-model="filterForm.subjectId"
          :options="subjectOptions"
          placeholder="请选择科目"
          allow-clear
          allow-search
          :disabled="loading"
          @change="handleSubjectChange"
        />
        <div v-else class="report-filter-bar__radio-scroll">
          <a-radio-group
            v-model="filterForm.subjectId"
            :options="subjectOptions"
            :disabled="loading"
            @change="handleSubjectChange"
          />
        </div>
      </div>

      <div class="report-filter-bar__field">
        <span class="report-filter-bar__field-label">支付方式</span>
        <a-select
          v-if="isMobileView"
          v-model="filterForm.paymentMethod"
          :options="paymentMethodOptions"
          placeholder="请选择支付方式"
          allow-clear
          :disabled="loading"
          @change="handlePaymentMethodChange"
        />
        <div v-else class="report-filter-bar__radio-scroll">
          <a-radio-group
            v-model="filterForm.paymentMethod"
            :options="paymentMethodOptions"
            :disabled="loading"
            @change="handlePaymentMethodChange"
          />
        </div>
      </div>

    </div>

    <div class="report-filter-bar__actions">
      <a-button type="primary" :loading="loading" @click="emit('search')">查询</a-button>
      <a-button :disabled="loading" @click="emit('reset')">重置</a-button>
    </div>
  </a-card>
</template>

<script setup lang="ts">
import { computed, nextTick } from 'vue'
import type * as T from '@/apis/bookkeeping/type'
import type { LabelValueState } from '@/types/global'
import { isMobile } from '@/utils'

interface Props {
  filterForm: T.ReportFilterForm
  datePresetOptions: Array<LabelValueState & { shortLabel?: string }>
  categoryOptions: LabelValueState[]
  subjectOptions: LabelValueState[]
  paymentMethodOptions: LabelValueState[]
  userQueryOptions: LabelValueState[]
  onSelectUser: (value?: string | number | null) => void
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

const isMobileView = isMobile()

const selectedUserId = computed({
  get: () => (props.filterForm.userScope === 'all' ? '' : props.filterForm.userId),
  set: (value) => {
    props.onSelectUser(value)
  },
})

const handlePresetClick = (preset: string) => {
  if (props.filterForm.datePreset === preset) {
    return
  }
  props.filterForm.datePreset = preset as T.ReportDatePreset
  emit('preset-change')
}

const triggerSearch = () => {
  nextTick(() => {
    emit('search')
  })
}

const handleCategoryChange = () => {
  triggerSearch()
}

const handleSubjectChange = () => {
  triggerSearch()
}

const handlePaymentMethodChange = () => {
  triggerSearch()
}

const handleUserChange = () => {
  triggerSearch()
}
</script>

<style scoped lang="scss">
.report-filter-bar {
  border: 1px solid rgba(229, 230, 235, 0.9);
  border-radius: 16px;
  background: var(--color-bg-1);
  box-shadow: none;
}

.report-filter-bar :deep(.arco-card-body) {
  padding: 18px;
}

.report-filter-bar__section + .report-filter-bar__grid {
  margin-top: 16px;
}

.report-filter-bar__section-label,
.report-filter-bar__field-label {
  display: block;
  margin-bottom: 10px;
  color: var(--color-text-2);
  font-size: 13px;
  font-weight: 700;
}

.report-filter-bar__preset-group {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.report-filter-bar__preset {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 34px;
  padding: 0 14px;
  border: 1px solid rgba(229, 230, 235, 0.9);
  border-radius: 999px;
  background: var(--color-fill-1);
  color: var(--color-text-2);
  font-size: 13px;
  font-weight: 600;
  transition:
    color 0.2s ease,
    border-color 0.2s ease,
    background-color 0.2s ease,
    box-shadow 0.2s ease;
}

.report-filter-bar__preset:hover {
  border-color: rgba(var(--primary-4), 0.35);
  background: rgba(var(--primary-6), 0.06);
  color: rgb(var(--primary-6));
}

.report-filter-bar__preset:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.report-filter-bar__preset.is-active {
  border-color: rgba(var(--primary-6), 0.26);
  background: rgba(var(--primary-6), 0.1);
  color: rgb(var(--primary-6));
  box-shadow: inset 0 0 0 1px rgba(var(--primary-3), 0.16);
}

.report-filter-bar__range {
  width: 100%;
  margin-top: 12px;
}

.report-filter-bar__grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.report-filter-bar__field {
  width: 100%;
}

.report-filter-bar__radio-scroll {
  width: 100%;
  overflow: visible;
}

.report-filter-bar__radio-scroll :deep(.arco-radio-group) {
  display: flex;
  flex-wrap: wrap;
  width: 100%;
}

.report-filter-bar__radio-scroll :deep(.arco-radio) {
  flex: 0 0 auto;
  margin-right: 16px;
  margin-bottom: 8px;
  white-space: nowrap;
}

.report-filter-bar__radio-scroll :deep(.arco-radio-label) {
  white-space: nowrap;
}

.report-filter-bar__field :deep(.arco-select) {
  width: 100%;
}

.report-filter-bar__actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 16px;
}

@media (max-width: 768px) {
  .report-filter-bar :deep(.arco-card-body) {
    padding: 14px;
  }

  .report-filter-bar__actions {
    justify-content: flex-start;
  }

  .report-filter-bar__actions :deep(.arco-btn) {
    flex: 1;
  }
}
</style>
