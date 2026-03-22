<template>
  <div class="mobile-page-skeleton" :class="`is-${variant}`">
    <template v-if="variant === 'detail'">
      <section class="mobile-page-skeleton__detail-hero">
        <div class="mobile-page-skeleton__block">
          <t-skeleton :loading="true" animation="gradient" :row-col="detailUserChipRows" />
        </div>
        <div class="mobile-page-skeleton__block">
          <t-skeleton :loading="true" animation="gradient" :row-col="detailCategoryChipRows" />
        </div>
        <div class="mobile-page-skeleton__block">
          <t-skeleton :loading="true" animation="gradient" :row-col="detailMonthRows" />
        </div>
        <div class="mobile-page-skeleton__summary-grid">
          <div
            v-for="index in 3"
            :key="`detail-summary-${index}`"
            class="mobile-page-skeleton__summary-card"
          >
            <t-skeleton :loading="true" animation="gradient" :row-col="detailSummaryRows" />
          </div>
        </div>
      </section>

      <section class="mobile-page-skeleton__section is-detail-ledger">
        <div class="mobile-page-skeleton__header-card">
          <t-skeleton :loading="true" animation="gradient" :row-col="detailLedgerHeaderRows" />
        </div>
        <div class="mobile-page-skeleton__stack">
          <div
            v-for="groupIndex in 2"
            :key="`detail-group-${groupIndex}`"
            class="mobile-page-skeleton__ledger-group"
          >
            <div class="mobile-page-skeleton__group-header">
              <t-skeleton :loading="true" animation="gradient" :row-col="detailGroupHeaderRows" />
            </div>
            <div class="mobile-page-skeleton__group-panel">
              <div
                v-for="itemIndex in 3"
                :key="`detail-item-${groupIndex}-${itemIndex}`"
                class="mobile-page-skeleton__group-item"
              >
                <t-skeleton :loading="true" animation="gradient" :row-col="detailItemRows" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </template>

    <template v-else-if="variant === 'detail-list'">
      <div class="mobile-page-skeleton__stack is-tight">
        <div
          v-for="groupIndex in 2"
          :key="`detail-list-group-${groupIndex}`"
          class="mobile-page-skeleton__ledger-group"
        >
          <div class="mobile-page-skeleton__group-header">
            <t-skeleton :loading="true" animation="gradient" :row-col="detailGroupHeaderRows" />
          </div>
          <div class="mobile-page-skeleton__group-panel">
            <div
              v-for="itemIndex in 4"
              :key="`detail-list-item-${groupIndex}-${itemIndex}`"
              class="mobile-page-skeleton__group-item"
            >
              <t-skeleton :loading="true" animation="gradient" :row-col="detailItemRows" />
            </div>
          </div>
        </div>
      </div>
    </template>

    <template v-else-if="variant === 'subject'">
      <section class="mobile-panel mobile-page-skeleton__panel">
        <t-skeleton :loading="true" animation="gradient" :row-col="subjectHeroRows" />
      </section>
      <section class="mobile-panel mobile-page-skeleton__panel">
        <t-skeleton :loading="true" animation="gradient" :row-col="subjectFilterRows" />
      </section>
      <div class="mobile-page-skeleton__stack">
        <section
          v-for="index in 4"
          :key="`subject-card-${index}`"
          class="mobile-panel mobile-page-skeleton__panel mobile-page-skeleton__subject-card"
        >
          <t-skeleton :loading="true" animation="gradient" :row-col="subjectCardRows" />
        </section>
      </div>
    </template>

    <template v-else-if="variant === 'subject-list'">
      <div class="mobile-page-skeleton__stack is-list">
        <section
          v-for="index in 4"
          :key="`subject-list-card-${index}`"
          class="mobile-panel mobile-page-skeleton__panel mobile-page-skeleton__subject-card"
        >
          <t-skeleton :loading="true" animation="gradient" :row-col="subjectCardRows" />
        </section>
      </div>
    </template>

    <template v-else-if="variant === 'me'">
      <section class="mobile-panel mobile-page-skeleton__panel mobile-page-skeleton__me-profile">
        <t-skeleton :loading="true" animation="gradient" :row-col="meProfileRows" />
      </section>
      <section class="mobile-panel mobile-page-skeleton__panel">
        <t-skeleton :loading="true" animation="gradient" :row-col="meGridTitleRows" />
        <div class="mobile-page-skeleton__grid">
          <div
            v-for="index in 3"
            :key="`me-grid-${index}`"
            class="mobile-page-skeleton__grid-item"
          >
            <t-skeleton :loading="true" animation="gradient" :row-col="meGridItemRows" />
          </div>
        </div>
      </section>
      <section class="mobile-panel mobile-page-skeleton__panel">
        <t-skeleton :loading="true" animation="gradient" :row-col="meActionRows" />
      </section>
      <div class="mobile-page-skeleton__footer">
        <t-skeleton :loading="true" animation="gradient" :row-col="footerRows" />
      </div>
    </template>

    <template v-else>
      <section class="mobile-panel mobile-page-skeleton__panel">
        <t-skeleton :loading="true" animation="gradient" :row-col="reportHeroRows" />
      </section>
      <section class="mobile-panel mobile-page-skeleton__panel">
        <t-skeleton :loading="true" animation="gradient" :row-col="reportCardRows" />
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
/**
 * 移动端页面骨架屏
 *
 * @author Wangsongsong
 * @date 2026-03-22
 */
type MobilePageSkeletonVariant = 'detail' | 'detail-list' | 'subject' | 'subject-list' | 'me' | 'report'

withDefaults(defineProps<{ variant?: MobilePageSkeletonVariant }>(), {
  variant: 'detail',
})

const detailUserChipRows = [[
  { type: 'rect', width: '1.12rem', height: '0.72rem', marginRight: '0.16rem' },
  { type: 'rect', width: '1.2rem', height: '0.72rem', marginRight: '0.16rem' },
  { type: 'rect', width: '1.36rem', height: '0.72rem', marginRight: '0.16rem' },
  { type: 'rect', width: '1.28rem', height: '0.72rem' },
]]

const detailCategoryChipRows = [[
  { type: 'rect', width: '0.72rem', height: '0.72rem', marginRight: '0.16rem' },
  { type: 'rect', width: '0.72rem', height: '0.72rem', marginRight: '0.16rem' },
  { type: 'rect', width: '0.72rem', height: '0.72rem' },
]]

const detailMonthRows = [[
  { type: 'rect', width: '1.1rem', height: '0.92rem', marginRight: '0.16rem' },
  { type: 'rect', width: '4.12rem', height: '1.02rem', marginRight: '0.16rem' },
  { type: 'rect', width: '1.1rem', height: '0.92rem' },
]]

const detailSummaryRows = [
  { type: 'text', width: '42%', height: '0.28rem' },
  { type: 'text', width: '86%', height: '0.42rem' },
]

const detailLedgerHeaderRows = [[
  { type: 'text', width: '2.3rem', height: '0.34rem', marginRight: '0.24rem' },
  { type: 'rect', width: '1.04rem', height: '0.72rem', marginRight: '0.16rem' },
  { type: 'rect', width: '0.92rem', height: '0.72rem' },
]]

const detailGroupHeaderRows = [[
  { type: 'text', width: '1.6rem', height: '0.36rem', marginRight: '0.18rem' },
  { type: 'text', width: '1.12rem', height: '0.32rem' },
], {
  type: 'text',
  width: '1.8rem',
  height: '0.3rem',
}]

const detailItemRows = [[
  { type: 'circle', size: '0.84rem', marginRight: '0.24rem' },
  { type: 'text', width: '2.28rem', height: '0.36rem', marginRight: '0.16rem' },
  { type: 'text', width: '1.1rem', height: '0.4rem' },
], [
  { type: 'text', width: '1.24rem', height: '0.28rem', marginLeft: '1.08rem', marginRight: '0.16rem' },
  { type: 'text', width: '0.92rem', height: '0.28rem' },
]]

const subjectHeroRows = [
  { type: 'text', width: '1.2rem', height: '0.26rem' },
  { type: 'text', width: '2.6rem', height: '0.46rem' },
  { type: 'text', width: '5.3rem', height: '0.32rem' },
  { type: 'text', width: '4.7rem', height: '0.32rem' },
]

const subjectFilterRows = [[
  { type: 'rect', width: '1.1rem', height: '0.66rem', marginRight: '0.16rem' },
  { type: 'rect', width: '1.1rem', height: '0.66rem', marginRight: '0.16rem' },
  { type: 'rect', width: '1.1rem', height: '0.66rem', marginRight: '0.16rem' },
  { type: 'rect', width: '1.1rem', height: '0.66rem' },
]]

const subjectCardRows = [
  { type: 'text', width: '1.2rem', height: '0.28rem' },
  { type: 'text', width: '2.8rem', height: '0.44rem' },
]

const meProfileRows = [[
  { type: 'circle', size: '1.28rem', marginRight: '0.24rem' },
  { type: 'text', width: '1.32rem', height: '0.26rem' },
], {
  type: 'text',
  width: '2.36rem',
  height: '0.46rem',
}, {
  type: 'text',
  width: '2.12rem',
  height: '0.32rem',
}]

const meGridTitleRows = [
  { type: 'text', width: '1.4rem', height: '0.38rem' },
]

const meGridItemRows = [
  { type: 'circle', size: '0.72rem' },
  { type: 'text', width: '0.9rem', height: '0.28rem' },
  { type: 'text', width: '1.1rem', height: '0.24rem' },
]

const meActionRows = [
  { type: 'text', width: '1.4rem', height: '0.38rem' },
  [{ type: 'rect', width: '100%', height: '0.82rem' }],
  [{ type: 'rect', width: '100%', height: '0.82rem' }],
]

const reportHeroRows = [
  { type: 'text', width: '1.4rem', height: '0.26rem' },
  { type: 'text', width: '2.9rem', height: '0.48rem' },
  { type: 'text', width: '5.4rem', height: '0.32rem' },
  { type: 'text', width: '4.9rem', height: '0.32rem' },
]

const reportCardRows = [
  { type: 'text', width: '1.8rem', height: '0.38rem' },
  [{ type: 'rect', width: '100%', height: '1rem' }],
  [{ type: 'rect', width: '100%', height: '1rem' }],
  [{ type: 'rect', width: '100%', height: '1rem' }],
]

const footerRows = [
  { type: 'text', width: '2rem', height: '0.24rem' },
]
</script>

<style scoped lang="scss">
.mobile-page-skeleton {
  min-height: 100%;
  padding: 0.32rem 0.32rem calc(env(safe-area-inset-bottom) + 1.72rem);
  box-sizing: border-box;
}

.mobile-page-skeleton.is-detail {
  padding: 0 0 calc(env(safe-area-inset-bottom) + 1.72rem);
}

.mobile-page-skeleton.is-detail-list,
.mobile-page-skeleton.is-subject-list {
  padding: 0;
}

.mobile-page-skeleton__detail-hero {
  padding: 0.16rem 0.16rem 0.24rem;
  background: linear-gradient(180deg, #f9d86d 0%, #f2c338 100%);
  border-radius: 0 0 0.4rem 0.4rem;
  box-shadow: inset 0 -0.0267rem 0 rgba(255, 255, 255, 0.25);
}

.mobile-page-skeleton__block + .mobile-page-skeleton__block {
  margin-top: 0.16rem;
}

.mobile-page-skeleton__summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.16rem;
  margin-top: 0.16rem;
}

.mobile-page-skeleton__summary-card {
  padding: 0.2rem 0.2rem 0.18rem;
  border-radius: 0.32rem;
  background: rgba(255, 255, 255, 0.26);
}

.mobile-page-skeleton__section {
  padding: 0.16rem 0 0;
}

.mobile-page-skeleton__section.is-detail-ledger {
  margin-top: 0.08rem;
}

.mobile-page-skeleton__header-card {
  padding: 0 0.16rem 0.16rem;
}

.mobile-page-skeleton__stack {
  display: flex;
  flex-direction: column;
  gap: 0.24rem;
}

.mobile-page-skeleton__stack.is-tight {
  gap: 0.16rem;
}

.mobile-page-skeleton__stack.is-list {
  gap: 0.16rem;
  margin-top: 0.14rem;
}

.mobile-page-skeleton__ledger-group,
.mobile-page-skeleton__panel {
  overflow: hidden;
}

.mobile-page-skeleton__group-header {
  padding: 0.2rem 0.22rem 0.18rem;
  background: rgba(255, 255, 255, 0.98);
  border-bottom: 0.0267rem solid rgba(93, 74, 42, 0.06);
}

.mobile-page-skeleton__group-panel {
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 0.2133rem 0.48rem rgba(65, 45, 11, 0.04);
}

.mobile-page-skeleton__group-item {
  padding: 0.26rem 0.22rem;
  border-bottom: 0.0267rem solid rgba(93, 74, 42, 0.06);
}

.mobile-page-skeleton__group-item:last-child {
  border-bottom: none;
}

.mobile-page-skeleton__panel {
  padding: 0.36rem 0.32rem;
}

.mobile-page-skeleton__panel + .mobile-page-skeleton__panel {
  margin-top: 0.2rem;
}

.mobile-page-skeleton__subject-card {
  padding: 0.32rem;
}

.mobile-page-skeleton__me-profile {
  padding: 0.4rem 0.34rem;
}

.mobile-page-skeleton__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.2rem;
  margin-top: 0.24rem;
}

.mobile-page-skeleton__grid-item {
  padding: 0.24rem 0.16rem;
  border: 0.0267rem solid rgba(15, 23, 42, 0.06);
  border-radius: 0.32rem;
  background: rgba(255, 255, 255, 0.72);
}

.mobile-page-skeleton__footer {
  margin-top: 0.36rem;
  padding: 0.18rem 0;
  text-align: center;
}

.mobile-page-skeleton :deep(.t-skeleton__row:not(:last-child)) {
  margin-bottom: 0.16rem;
}

.mobile-page-skeleton :deep(.t-skeleton__col) {
  border-radius: 0.18rem;
}
</style>
