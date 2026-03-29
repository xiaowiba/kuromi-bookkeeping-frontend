<template>
  <div class="report-panel-shell">
    <div class="report-panel-shell__header" :class="{ 'report-panel-shell__header--split': !!$slots.toolbar }">
      <div class="report-panel-shell__title">
        <strong>{{ title }}</strong>
        <span>{{ description }}</span>
      </div>
      <div v-if="$slots.toolbar" class="report-panel-shell__toolbar">
        <slot name="toolbar" />
      </div>
    </div>
    <a-spin :loading="loading" class="report-panel-shell__spin">
      <div class="report-panel-shell__body">
        <slot />
      </div>
    </a-spin>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'ReportPanelShell' })

withDefaults(defineProps<{
  title: string
  description: string
  loading?: boolean
}>(), {
  loading: false,
})
</script>

<style scoped lang="scss">
.report-panel-shell {
  border: 1px solid rgba(229, 230, 235, 0.9);
  border-radius: 16px;
  background: var(--color-bg-1);
  padding: 18px 18px 12px;
}

.report-panel-shell__header {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  margin-bottom: 12px;
}

.report-panel-shell__header--split {
  justify-content: space-between;
}

.report-panel-shell__title {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.report-panel-shell__title strong {
  color: var(--color-text-1);
  font-size: 16px;
  font-weight: 700;
  line-height: 1.2;
}

.report-panel-shell__title span {
  color: var(--color-text-3);
  font-size: 12px;
  line-height: 1.6;
}

.report-panel-shell__toolbar {
  flex: 0 0 auto;
}

.report-panel-shell__spin {
  display: block;
  width: 100%;
}

.report-panel-shell__spin :deep(.arco-spin) {
  display: block;
  width: 100%;
}

.report-panel-shell__spin :deep(.arco-spin-children) {
  display: block;
  width: 100%;
}

.report-panel-shell__body {
  width: 100%;
  min-width: 0;
}

@media (max-width: 900px) {
  .report-panel-shell {
    padding: 14px 14px 10px;
  }

  .report-panel-shell__header--split {
    flex-direction: column;
  }
}
</style>
