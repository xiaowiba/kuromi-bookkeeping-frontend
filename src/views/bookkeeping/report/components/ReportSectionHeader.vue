<template>
  <div class="report-section-header">
    <span class="report-section-header__icon">
      <component :is="icon" />
    </span>
    <div class="report-section-header__content">
      <div class="report-section-header__row">
        <span class="report-section-header__title">{{ title }}</span>
        <span v-if="badge" class="report-section-header__badge">{{ badge }}</span>
      </div>
      <small class="report-section-header__desc">{{ description }}</small>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 报表分区标题组件。
 *
 * 统一图标、标题、描述和徽标展示，保持报表页面各区块标题样式一致。
 *
 * @author Wangsongsong
 * @date 2026-07-02
 * @update 2026-07-02 @Wangsongsong
 * @desc 补充报表分区标题组件职责说明
 */
import type { Component } from 'vue'

defineOptions({ name: 'ReportSectionHeader' })

defineProps<{
  icon: Component
  title: string
  description: string
  badge?: string
}>()
</script>

<style scoped lang="scss">
.report-section-header {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}

.report-section-header__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  flex: 0 0 40px;
  border-radius: 14px;
  color: #9a6700;
  background: linear-gradient(180deg, rgba(255, 238, 194, 0.96) 0%, rgba(255, 246, 222, 0.88) 100%);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6);
  font-size: 18px;
}

.report-section-header__content {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.report-section-header__row {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  flex-wrap: wrap;
}

.report-section-header__title {
  color: #342714;
  font-size: 17px;
  font-weight: 800;
  line-height: 1.2;
}

.report-section-header__badge {
  display: inline-flex;
  align-items: center;
  height: 24px;
  padding: 0 10px;
  border-radius: 999px;
  background: rgba(255, 244, 214, 0.9);
  color: #a16207;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.report-section-header__desc {
  color: #907b58;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.6;
}
</style>
