<template>
  <a-tag
    v-if="weekdayLabel"
    :size="size"
    bordered
    class="bookkeeping-weekday-tag"
    :class="weekdayClass"
  >
    {{ weekdayLabel }}
  </a-tag>
</template>

<script setup lang="ts">
/**
 * 记账日期星期标签。
 *
 * 根据明细日期生成星期文案和样式类，供明细表格、排行表等场景复用。
 *
 * @author Wangsongsong
 * @date 2026-07-02
 * @update 2026-07-02 @Wangsongsong
 * @desc 补充星期标签组件职责说明
 */
import dayjs from 'dayjs'
import { computed } from 'vue'

defineOptions({ name: 'BookkeepingWeekdayTag' })

const props = withDefaults(defineProps<{
  date?: string | null
  size?: 'small' | 'medium' | 'large'
}>(), {
  date: '',
  size: 'small',
})

const WEEKDAY_TEXT = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

const weekdayIndex = computed(() => {
  if (!props.date || !dayjs(props.date).isValid()) {
    return -1
  }
  return dayjs(props.date).day()
})

const weekdayLabel = computed(() => {
  return weekdayIndex.value >= 0 ? WEEKDAY_TEXT[weekdayIndex.value] : ''
})

const weekdayClass = computed(() => {
  return weekdayIndex.value >= 0 ? `bookkeeping-weekday-tag--${weekdayIndex.value}` : ''
})
</script>

<style scoped lang="scss">
.bookkeeping-weekday-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 42px;
  padding: 0 8px;
  border-radius: 999px;
  font-weight: 700;
  line-height: 1;
}

.bookkeeping-weekday-tag--0 {
  color: #c44536;
  background: rgba(245, 63, 63, 0.12);
  border-color: rgba(245, 63, 63, 0.24);
}

.bookkeeping-weekday-tag--1 {
  color: #165dff;
  background: rgba(22, 93, 255, 0.12);
  border-color: rgba(22, 93, 255, 0.24);
}

.bookkeeping-weekday-tag--2 {
  color: #0f766e;
  background: rgba(20, 184, 166, 0.12);
  border-color: rgba(20, 184, 166, 0.24);
}

.bookkeeping-weekday-tag--3 {
  color: #15803d;
  background: rgba(34, 197, 94, 0.12);
  border-color: rgba(34, 197, 94, 0.24);
}

.bookkeeping-weekday-tag--4 {
  color: #9a6700;
  background: rgba(255, 183, 3, 0.14);
  border-color: rgba(255, 183, 3, 0.28);
}

.bookkeeping-weekday-tag--5 {
  color: #c2410c;
  background: rgba(249, 115, 22, 0.12);
  border-color: rgba(249, 115, 22, 0.24);
}

.bookkeeping-weekday-tag--6 {
  color: #6d28d9;
  background: rgba(139, 92, 246, 0.12);
  border-color: rgba(139, 92, 246, 0.24);
}
</style>
