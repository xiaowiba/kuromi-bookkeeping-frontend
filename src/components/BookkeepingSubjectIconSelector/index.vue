<template>
  <a-popover
    v-model:popup-visible="popupVisible"
    trigger="click"
    position="right"
    :disabled="disabled"
  >
    <a-input
      :model-value="selectedMeta?.label || ''"
      :placeholder="placeholder"
      allow-clear
      readonly
      :disabled="disabled"
      @clear="handleClear"
    >
      <template #prefix>
        <BookkeepingSubjectIcon
          v-if="modelValue"
          :icon="modelValue"
          mode="web"
          :size="18"
        />
        <icon-search v-else />
      </template>
    </a-input>

    <template #content>
      <div class="subject-icon-selector">
        <a-input
          v-model="searchValue"
          placeholder="搜索图标名称"
          allow-clear
          size="small"
        >
          <template #prefix>
            <icon-search />
          </template>
        </a-input>

        <div class="subject-icon-selector__grid">
          <button
            v-for="item in filteredOptions"
            :key="item.key"
            type="button"
            class="subject-icon-selector__item"
            :class="{ 'is-active': modelValue === item.key }"
            @click="handleSelect(item.key)"
          >
            <div class="subject-icon-selector__preview">
              <BookkeepingSubjectIcon :icon="item.key" mode="web" :size="22" />
            </div>
            <div class="subject-icon-selector__name">{{ item.label }}</div>
            <div class="subject-icon-selector__mobile">
              <span class="subject-icon-selector__mobile-label">移动端</span>
              <BookkeepingSubjectIcon :icon="item.key" mode="mobile" :size="16" />
            </div>
          </button>
        </div>

        <a-empty v-if="!filteredOptions.length" description="未找到匹配图标" />
      </div>
    </template>
  </a-popover>
</template>

<script setup lang="ts">
/**
 * 记账科目图标选择器
 *
 * @author Wangsongsong
 * @date 2026-03-23
 */
import BookkeepingSubjectIcon from '@/components/BookkeepingSubjectIcon/index.vue'
import { SUBJECT_ICON_OPTIONS, getSubjectIconMeta } from '@/constants/bookkeeping-subject-icon'

interface Props {
  modelValue?: string
  disabled?: boolean
  placeholder?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  disabled: false,
  placeholder: '请选择图标',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const popupVisible = ref(false)
const searchValue = ref('')

const selectedMeta = computed(() => (props.modelValue ? getSubjectIconMeta(props.modelValue) : null))
const filteredOptions = computed(() => {
  const keyword = searchValue.value.trim().toLowerCase()
  if (!keyword) return SUBJECT_ICON_OPTIONS
  return SUBJECT_ICON_OPTIONS.filter(item =>
    item.label.includes(keyword) || item.searchText.toLowerCase().includes(keyword) || item.key.includes(keyword),
  )
})

const handleSelect = (key: string) => {
  emit('update:modelValue', key)
  popupVisible.value = false
}

const handleClear = () => {
  emit('update:modelValue', '')
}
</script>

<style scoped lang="scss">
.subject-icon-selector {
  // width: min(50vw, 40vw);
  width: 40vw;
}

.subject-icon-selector__grid {
  display: grid;
  grid-template-columns: repeat(8, minmax(0, 1fr));
  gap: 8px;
  max-height: 90vh;
  margin-top: 10px;
  overflow-y: auto;
  padding-right: 2px;
}

.subject-icon-selector__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  min-width: 0;
  border: 1px solid var(--color-border-2);
  border-radius: 10px;
  background: var(--color-bg-2);
  padding: 10px 6px 8px;
  transition: border-color 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease;
}

.subject-icon-selector__item:hover {
  border-color: rgb(var(--primary-4));
}

.subject-icon-selector__item.is-active {
  border-color: rgb(var(--primary-6));
  background: rgba(var(--primary-6), 0.06);
  box-shadow: inset 0 0 0 1px rgba(var(--primary-3), 0.2);
}

.subject-icon-selector__preview {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--color-fill-2);
  color: rgb(var(--primary-6));
}

.subject-icon-selector__name {
  min-height: 32px;
  color: var(--color-text-1);
  font-size: 12px;
  font-weight: 500;
  line-height: 16px;
  text-align: center;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.subject-icon-selector__mobile {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--color-text-3);
  font-size: 11px;
  line-height: 1;
}

.subject-icon-selector__mobile-label {
  white-space: nowrap;
}

@media (max-width: 640px) {
  .subject-icon-selector__grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
