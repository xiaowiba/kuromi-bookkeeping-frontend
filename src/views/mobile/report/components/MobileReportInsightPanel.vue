<template>
  <section class="mobile-panel mobile-report-insight">
    <h3 class="mobile-section-title">报表洞察</h3>
    <div v-if="insight.length" class="mobile-report-insight__list">
      <article
        v-for="(item, index) in insight"
        :key="`${index}-${item}`"
        class="mobile-report-insight__item"
      >
        <span class="mobile-report-insight__index">0{{ index + 1 }}</span>
        <p>{{ item }}</p>
      </article>
    </div>
    <div v-else class="mobile-empty">
      当前筛选条件下暂无洞察文案，可以尝试切换时间范围或放宽筛选条件。
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  insight: string[]
}>()
</script>

<style scoped lang="scss">
.mobile-report-insight {
  padding: 16px;
}

.mobile-report-insight__list {
  display: grid;
  gap: 12px;
}

.mobile-report-insight__item {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 12px;
  align-items: start;
  padding: 12px 14px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.86);
}

.mobile-report-insight__index {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 36px;
  height: 30px;
  border-radius: 999px;
  background: rgba(250, 204, 21, 0.18);
  color: #9a6b00;
  font-size: 12px;
  font-weight: 800;
}

.mobile-report-insight__item p {
  margin: 0;
  color: #4b3a24;
  font-size: 14px;
  line-height: 1.7;
}
</style>
