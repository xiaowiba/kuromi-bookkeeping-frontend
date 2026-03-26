<!--
  @file Layout 组件
  @description 布局根组件，支持默认布局、混合布局和顶部布局三种模式
  @update 2026-03-21 @Wangsongsong
  @desc 支持 /m 路由切换到独立移动端布局
-->
<template>
  <component :is="currentLayout" />
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import { isMobileTerminalPath } from '@/router/terminal'
import { useAppStore } from '@/stores'

/** 组件名称 */
defineOptions({ name: 'Layout' })
const LayoutDefault = defineAsyncComponent(() => import('./LayoutDefault.vue'))
const LayoutColumns = defineAsyncComponent(() => import('./LayoutColumns.vue'))
const LayoutMix = defineAsyncComponent(() => import('./LayoutMix.vue'))
const LayoutTop = defineAsyncComponent(() => import('./LayoutTop.vue'))
const LayoutMobile = defineAsyncComponent(() => import('./mobile/index.vue'))

/** 状态管理 */
const appStore = useAppStore()
const route = useRoute()

/** 布局组件映射 */
const layoutMap = {
  mix: LayoutMix,
  top: LayoutTop,
  default: LayoutDefault,
  columns: LayoutColumns,
} as const

/** 当前布局组件 */
const currentLayout = computed(() => {
  if (isMobileTerminalPath(route.path)) {
    return LayoutMobile
  }
  return layoutMap[appStore.layout as keyof typeof layoutMap] || layoutMap.default
})
</script>

<style lang="scss" scoped></style>
