<template>
  <ReportPanelShell
    title="报表洞察"
    description="将图表与汇总结果转成可直接阅读的结论，方便快速判断当前账务情况。"
    :loading="loading"
  >
    <div class="report-insight-card__row">
      <ol v-if="insight.length" class="report-insight-card__list">
        <li v-for="(item, index) in insight" :key="`${index}-${item}`" class="report-insight-card__item">
          <span class="report-insight-card__item-index">{{ index + 1 }}</span>
          <span class="report-insight-card__item-text">{{ item }}</span>
        </li>
      </ol>

      <div v-else class="report-insight-card__empty">
        当前筛选条件下暂无可生成的洞察文案，可以尝试切换到多用户或更长时间范围。
      </div>
    </div>
  </ReportPanelShell>
</template>

<script setup lang="ts">
/**
 * 报表洞察卡片。
 *
 * 展示后端返回的文字洞察列表，用于在图表之外补充当前筛选周期的关键结论。
 *
 * @author Wangsongsong
 * @date 2026-07-02
 * @update 2026-07-02 @Wangsongsong
 * @desc 补充报表洞察组件职责说明
 */
import ReportPanelShell from './ReportPanelShell.vue'

withDefaults(defineProps<{
  insight: string[]
  loading?: boolean
}>(), {
  loading: false,
})
</script>

<style scoped lang="scss">
.report-insight-card__row {
  padding-top: 2px;
}

.report-insight-card__list {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(0, 1fr);
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
  color: var(--color-text-1);
}

.report-insight-card__item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  min-width: 0;
  padding: 12px 14px;
  border: 1px solid var(--color-border-2);
  border-radius: 12px;
  background: var(--color-fill-1);
}

.report-insight-card__item-index {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 22px;
  height: 22px;
  border-radius: 999px;
  background: rgba(var(--primary-6), 0.12);
  color: rgb(var(--primary-6));
  font-size: 12px;
  font-weight: 700;
}

.report-insight-card__item-text {
  min-width: 0;
  color: var(--color-text-1);
  font-size: 13px;
  line-height: 1.65;
  word-break: break-word;
}

.report-insight-card__empty {
  display: flex;
  align-items: center;
  min-width: 0;
  padding: 12px 14px;
  border: 1px solid var(--color-border-2);
  border-radius: 12px;
  background: var(--color-fill-1);
  color: var(--color-text-3);
  font-size: 13px;
  line-height: 1.7;
}

@media (max-width: 1180px) {
  .report-insight-card__list {
    grid-auto-flow: row;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .report-insight-card__list {
    grid-template-columns: 1fr;
  }
}
</style>
