<template>
  <div class="gi-footer" @click="onClick">{{ footerText }}</div>
</template>

<script setup lang="ts">
/**
 * 全局页脚组件
 *
 * @author Wangsongsong
 * @date 2026-03-19
 * @update 2026-03-19 @Wangsongsong
 * @desc 增加点击事件，通过 mitt 发送 footer-click 事件
 */
import { useAppStore } from '@/stores'
import { APP_DISPLAY_VERSION } from '@/config/app-version'
import mittBus from '@/utils/mitt'

defineOptions({ name: 'GiFooter' })

const appStore = useAppStore()

const footerText = computed(() => {
  const beian = appStore.getForRecord()
  return `${appStore.getCopyright()} ${APP_DISPLAY_VERSION}${beian ? ` · ${beian}` : ''}`
})

const onClick = () => {
  mittBus.emit('footer-click')
}
</script>

<style scoped lang="scss">
.gi-footer {
  height: 40px;
  font-size: 13px;
  color: var(--color-text-3);
  background-color: var(--color-bg-1);
  border-top: 1px solid var(--color-neutral-3);
  box-sizing: border-box;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
