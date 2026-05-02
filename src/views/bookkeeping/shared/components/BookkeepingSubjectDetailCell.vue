<template>
  <div class="bookkeeping-subject-detail-cell">
    <span class="bookkeeping-subject-detail-cell__icon">
      <BookkeepingSubjectIcon :icon="icon" mode="web" :size="iconSize" />
    </span>
    <div class="bookkeeping-subject-detail-cell__meta">
      <strong :title="subjectName">{{ subjectName || '-' }}</strong>
      <span :title="detailName">{{ detailName || '-' }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import BookkeepingSubjectIcon from '@/components/BookkeepingSubjectIcon/index.vue'

defineOptions({ name: 'BookkeepingSubjectDetailCell' })

withDefaults(defineProps<{
  icon?: string
  subjectName?: string
  detailName?: string
  iconSize?: number
}>(), {
  icon: '',
  subjectName: '',
  detailName: '',
  iconSize: 18,
})
</script>

<style scoped lang="scss">
.bookkeeping-subject-detail-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-width: 0;
}

.bookkeeping-subject-detail-cell__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  flex: 0 0 28px;
  border-radius: 50%;
  background: rgba(254, 243, 199, 0.8);
  color: #8b5e00;
}

.bookkeeping-subject-detail-cell__meta {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.bookkeeping-subject-detail-cell__meta strong,
.bookkeeping-subject-detail-cell__meta span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bookkeeping-subject-detail-cell__meta strong {
  color: #342714;
  font-size: 14px;
  font-weight: 700;
}

.bookkeeping-subject-detail-cell__meta span {
  color: #907b58;
  font-size: 12px;
}
</style>
