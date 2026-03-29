<template>
  <div class="mobile-detail-form-skeleton">
    <div class="mobile-detail-form-skeleton__body">
      <div class="mobile-detail-form-skeleton__section is-intro">
        <t-skeleton :loading="true" animation="gradient" :row-col="introRows" />
      </div>

      <div v-if="showUserField" class="mobile-detail-form-skeleton__section">
        <t-skeleton :loading="true" animation="gradient" :row-col="fieldRows" />
      </div>

      <div class="mobile-detail-form-skeleton__section">
        <t-skeleton :loading="true" animation="gradient" :row-col="categoryRows" />
      </div>

      <div
        v-for="(rows, index) in regularFieldRows"
        :key="`field-${index}`"
        class="mobile-detail-form-skeleton__section"
      >
        <t-skeleton :loading="true" animation="gradient" :row-col="rows" />
      </div>

      <div class="mobile-detail-form-skeleton__section">
        <t-skeleton :loading="true" animation="gradient" :row-col="textareaRows" />
      </div>

      <div v-if="showSwitchField" class="mobile-detail-form-skeleton__section">
        <t-skeleton :loading="true" animation="gradient" :row-col="switchRows" />
      </div>
    </div>

    <div class="mobile-detail-form-skeleton__footer">
      <t-skeleton :loading="true" animation="gradient" :row-col="footerRows" />
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  showUserField?: boolean
  showSwitchField?: boolean
}>(), {
  showUserField: false,
  showSwitchField: false,
})

const introRows = [
  { type: 'text', width: '1.6rem', height: '0.26rem' },
  { type: 'text', width: '2.6rem', height: '0.44rem' },
]

const fieldRows = [
  { type: 'text', width: '0.86rem', height: '0.22rem' },
  [{ type: 'rect', width: '100%', height: '1.18rem' }],
]

const categoryRows = [
  { type: 'text', width: '0.72rem', height: '0.22rem' },
  [
    { type: 'rect', width: '48%', height: '1.12rem', marginRight: '4%' },
    { type: 'rect', width: '48%', height: '1.12rem' },
  ],
]

const selectorRows = [
  { type: 'text', width: '0.82rem', height: '0.22rem' },
  [{ type: 'rect', width: '100%', height: '1.18rem' }],
]

const inputRows = [
  { type: 'text', width: '1rem', height: '0.22rem' },
  [{ type: 'rect', width: '100%', height: '1.18rem' }],
]

const amountRows = [
  { type: 'text', width: '0.72rem', height: '0.22rem' },
  [{ type: 'rect', width: '100%', height: '1.18rem' }],
]

const dateRows = [
  { type: 'text', width: '1rem', height: '0.22rem' },
  [{ type: 'rect', width: '100%', height: '1.18rem' }],
]

const paymentRows = [
  { type: 'text', width: '1rem', height: '0.22rem' },
  [{ type: 'rect', width: '100%', height: '1.18rem' }],
]

const regularFieldRows = [selectorRows, inputRows, amountRows, dateRows, paymentRows]

const textareaRows = [
  { type: 'text', width: '0.72rem', height: '0.22rem' },
  [{ type: 'rect', width: '100%', height: '1.52rem' }],
]

const switchRows = [
  { type: 'text', width: '1.48rem', height: '0.22rem' },
  [{ type: 'rect', width: '100%', height: '1.12rem' }],
]

const footerRows = [[
  { type: 'rect', width: '48%', height: '0.96rem', marginRight: '4%' },
  { type: 'rect', width: '48%', height: '0.96rem' },
]]
</script>

<style scoped lang="scss">
.mobile-detail-form-skeleton {
  display: flex;
  flex: 1;
  min-height: 0;
  flex-direction: column;
}

.mobile-detail-form-skeleton__body {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  padding: 0.1rem 0.2rem;
}

.mobile-detail-form-skeleton__section {
  margin-bottom: 0.16rem;
}

.mobile-detail-form-skeleton__section.is-intro {
  margin-bottom: 0.22rem;
}

.mobile-detail-form-skeleton__footer {
  flex-shrink: 0;
  padding-top: 0.12rem;
  padding-right: 0.28rem;
  padding-bottom: calc(env(safe-area-inset-bottom) + 0.16rem);
  padding-left: 0.28rem;
  background: linear-gradient(180deg, rgba(255, 246, 230, 0) 0%, rgba(255, 246, 230, 0.9) 28%, rgba(255, 246, 230, 1) 100%);
}

.mobile-detail-form-skeleton :deep(.t-skeleton__row:not(:last-child)) {
  margin-bottom: 0.12rem;
}

.mobile-detail-form-skeleton :deep(.t-skeleton__col),
.mobile-detail-form-skeleton :deep(.t-skeleton__text),
.mobile-detail-form-skeleton :deep(.t-skeleton__rect) {
  border-radius: 0.22rem;
}
</style>
