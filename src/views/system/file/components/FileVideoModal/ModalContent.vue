<template>
  <div id="videoId"></div>
</template>

<script setup lang="ts">
import type { FileItem } from '@/apis/system'

interface Props {
  data: FileItem
}
const props = withDefaults(defineProps<Props>(), {})
let playerInstance: { destroy?: () => void } | null = null

onMounted(async () => {
  const { default: Player } = await import('xgplayer')
  playerInstance = new Player({
    id: 'videoId',
    url: props.data?.url ?? '',
    lang: 'zh-cn',
    autoplay: true,
    closeVideoClick: true,
    videoInit: true,
  })
})

onUnmounted(() => {
  playerInstance?.destroy?.()
  playerInstance = null
})
</script>

<style scoped lang="scss"></style>
