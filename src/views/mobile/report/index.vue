<template>
  <div class="mobile-page">
    <section class="mobile-report-hero mobile-panel">
      <p class="mobile-report-hero__eyebrow">Phase 1 占位</p>
      <h2 class="mobile-report-hero__title">报表入口已预留</h2>
      <p class="mobile-report-hero__desc">
        下一阶段会在这里接入月度收支、分类分布和趋势图，当前先完成移动端独立框架与导航切换。
      </p>
    </section>

    <section class="mobile-panel mobile-report-card">
      <h3 class="mobile-section-title">规划中的报表能力</h3>
      <div class="mobile-report-grid">
        <article class="mobile-report-grid__item">
          <span class="mobile-report-grid__label">月度汇总</span>
          <strong>收入 / 支出</strong>
        </article>
        <article class="mobile-report-grid__item">
          <span class="mobile-report-grid__label">分类分析</span>
          <strong>消费结构</strong>
        </article>
        <article class="mobile-report-grid__item">
          <span class="mobile-report-grid__label">趋势对比</span>
          <strong>多月变化</strong>
        </article>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
/**
 * 移动端报表入口页
 *
 * @author Wangsongsong
 * @date 2026-03-21
 */
defineOptions({ name: 'MobileReport' })
</script>

<style scoped lang="scss">
.mobile-report-hero {
  padding: 22px 18px;
}

.mobile-report-hero__eyebrow {
  margin: 0 0 8px;
  color: rgb(var(--arcoblue-6));
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.mobile-report-hero__title {
  margin: 0 0 10px;
  color: var(--color-text-1);
  font-size: 24px;
  font-weight: 700;
}

.mobile-report-hero__desc {
  margin: 0;
  color: var(--color-text-2);
  font-size: 14px;
  line-height: 1.7;
}

.mobile-report-card {
  margin-top: 14px;
  padding: 18px 16px;
}

.mobile-report-grid {
  display: grid;
  gap: 12px;
}

.mobile-report-grid__item {
  padding: 16px;
  border: 1px solid rgba(15, 23, 42, 0.06);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.72);
}

.mobile-report-grid__item strong {
  display: block;
  color: var(--color-text-1);
  font-size: 18px;
  font-weight: 700;
}

.mobile-report-grid__label {
  display: block;
  margin-bottom: 6px;
  color: var(--color-text-3);
  font-size: 12px;
}
</style>
