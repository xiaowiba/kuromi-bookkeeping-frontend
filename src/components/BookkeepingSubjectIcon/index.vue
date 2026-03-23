<template>
  <span class="bookkeeping-subject-icon">
    <component
      :is="webComponent"
      v-if="mode === 'web' && webComponent"
      :size="resolvedSizeNumber"
    />
    <GiSvgIcon
      v-else-if="mode === 'web' && iconMeta.web.type === 'svg'"
      :name="iconMeta.web.name"
      :size="resolvedSize"
    />
    <TIcon
      v-else-if="mode === 'mobile' && iconMeta.mobile.type === 'tdesign'"
      :name="iconMeta.mobile.name"
      :size="resolvedSize"
    />
    <GiSvgIcon
      v-else
      :name="iconMeta.mobile.name"
      :size="resolvedSize"
    />
  </span>
</template>

<script setup lang="ts">
/**
 * 记账科目图标统一渲染组件
 *
 * @author Wangsongsong
 * @date 2026-03-23
 * @update 2026-03-23 @Wangsongsong
 * @desc 补充响应式依赖引入，统一承接 Web 与移动端图标编码渲染
 */
import { computed } from 'vue'
import { Icon as TIcon } from 'tdesign-mobile-vue'
import GiSvgIcon from '@/components/GiSvgIcon/index.vue'
import { getSubjectIconMeta } from '@/constants/bookkeeping-subject-icon'

interface Props {
  icon?: string
  mode?: 'web' | 'mobile'
  size?: string | number
}

const props = withDefaults(defineProps<Props>(), {
  icon: '',
  mode: 'web',
  size: 18,
})

const getUnitValue = (value: string | number): string => {
  const text = String(value)
  return /(px|em|rem|%)$/.test(text) ? text : `${text}px`
}

const iconMeta = computed(() => getSubjectIconMeta(props.icon))
const resolvedSize = computed(() => getUnitValue(props.size))
const resolvedSizeNumber = computed(() => {
  const value = Number(props.size)
  return Number.isNaN(value) ? 18 : value
})
const webComponent = computed(() => iconMeta.value.web.component || null)
</script>

<style scoped lang="scss">
.bookkeeping-subject-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  color: inherit;
}

.bookkeeping-subject-icon :deep(.t-icon) {
  color: inherit;
}
</style>
