<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'

const bannerRef = ref<HTMLElement | null>(null)
const mouseX = ref(0)
const isHovering = ref(false)
const windowWidth = ref(1920)
let pendingMouseX = 0
let frameId = 0

const layersData = [
  { resources: [{ src: '/bilibili-banner-snow/48bee957f95b7bc5f0e1b7fc14b25a4cca26901a.png' }], scale: { initial: 0.45 }, rotate: {}, translate: { offset: [3, 0] }, blur: {}, opacity: { wrap: 'clamp' }, id: 1, name: '030背景光' },
  { resources: [{ src: '/bilibili-banner-snow/eca4ed09885bef57072526002c8900467a07dc3f.png' }], scale: { initial: 0.45 }, rotate: {}, translate: { initial: [-20, 0], offset: [10, 10] }, blur: {}, opacity: { wrap: 'clamp' }, id: 2, name: '029背景山坡' },
  { resources: [{ src: '/bilibili-banner-snow/e52d6aecd75db0e310c73185304fd927834ac716.png' }], scale: { initial: 0.45, offset: 0.02 }, rotate: {}, translate: { initial: [200, 0], offset: [50, 10] }, blur: {}, opacity: { wrap: 'clamp' }, id: 3, name: '028远景白树' },
  { resources: [{ src: '/bilibili-banner-snow/62aee277e1d935580f66d296f349bd358cd956a0.png' }], scale: { initial: 0.45, offset: 0.02 }, rotate: {}, translate: { offset: [-20, 10] }, blur: {}, opacity: { wrap: 'clamp' }, id: 4, name: '027远景粉树' },
  { resources: [{ src: '/bilibili-banner-snow/b3ee9e71fbcc0520a1ac32e2b3a2d0dc6086bb9b.png' }], scale: { initial: 0.45, offset: 0.02 }, rotate: {}, translate: { initial: [1200, 0], offset: [-50, 10] }, blur: {}, opacity: { wrap: 'clamp' }, id: 5, name: '026夹层白树' },
  { resources: [{ src: '/bilibili-banner-snow/85e5279a1d53d4cb46033e1619d78628415f98c4.png' }], scale: { initial: 0.45, offset: 0.02 }, rotate: {}, translate: { offset: [50, 10] }, blur: {}, opacity: { wrap: 'clamp' }, id: 6, name: '025更远的树' },
  { resources: [{ src: '/bilibili-banner-snow/0095303b06f64e05ba354655c0a6c83fb618f8e7.png' }], scale: { initial: 0.45, offset: 0.02 }, rotate: {}, translate: { offset: [70, 10] }, blur: {}, opacity: { wrap: 'clamp' }, id: 7, name: '024远景紫树' },
  { resources: [{ src: '/bilibili-banner-snow/0415c092aa2c61c1ca25ba69b8c77130f1ab37c3.png' }], scale: { initial: 0.45 }, rotate: {}, translate: { offset: [0, 5] }, blur: {}, opacity: { wrap: 'clamp' }, id: 8, name: '023大树' },
  { resources: [{ src: '/bilibili-banner-snow/752ba46c080dca88401aac470f134ac0e6444705.png' }], scale: { initial: 0.4, offset: 0.02 }, rotate: {}, translate: { initial: [-20, 5], offset: [30, 0] }, blur: {}, opacity: { wrap: 'clamp' }, id: 9, name: '022鹿' },
  { resources: [{ src: '/bilibili-banner-snow/1fb1501cd66d326f296e78a4561f7cc89c48d719.png' }], scale: { initial: 0.45, offset: 0.05 }, rotate: {}, translate: {}, blur: {}, opacity: { wrap: 'clamp' }, id: 10, name: '021雪地' },
  { resources: [{ src: '/bilibili-banner-snow/34c3621fc6fed4e16eab30d0448b35554711bfeb.png' }], scale: { initial: 0.45, offset: 0.05 }, rotate: {}, translate: { offset: [40, 0] }, blur: {}, opacity: { wrap: 'clamp' }, id: 11, name: '020脚印+碎影子' },
  { resources: [{ src: '/bilibili-banner-snow/0546ed600f8dcfcf4c2eb3212ed1e12178abdb86.png' }], scale: { initial: 0.45, offset: 0.05 }, rotate: {}, translate: { offset: [40, 0] }, blur: {}, opacity: { wrap: 'clamp' }, id: 12, name: '019远处混乱影子' },
  { resources: [{ src: '/bilibili-banner-snow/d81527e08e5031badd870819fa801f6fd41fc021.png' }], scale: { initial: 0.45, offset: 0.01 }, rotate: {}, translate: { offset: [30, 0] }, blur: {}, opacity: { wrap: 'clamp' }, id: 21, name: '010-33+设施' },
  { resources: [{ src: '/bilibili-banner-snow/fa622f4b21c7fb66f84ebf87d36faaaa993363f0.png' }], scale: { initial: 0.45, offset: 0.01 }, rotate: {}, translate: { initial: [20, 0], offset: [30, 0] }, blur: {}, opacity: { wrap: 'clamp' }, id: 35, name: '栅栏' },
  { resources: [{ src: '/bilibili-banner-snow/0cfe34374720653a8f67d68af761d239eca15da7.png' }], scale: { initial: 0.45, offset: 0.01 }, rotate: {}, translate: { offset: [35, 0] }, blur: {}, opacity: { wrap: 'clamp' }, id: 13, name: '018杆子' },
  { resources: [{ src: '/bilibili-banner-snow/9afdb972babc0fed529e241176bad847a8094774.png' }], scale: { initial: 0.45, offset: 0.05 }, rotate: {}, translate: { offset: [50, 0] }, blur: {}, opacity: { wrap: 'clamp' }, id: 14, name: '017远处碎草' },
  { resources: [{ src: '/bilibili-banner-snow/0b9b00f62fd5760dc64fa16c564591957c3ace05.png' }], scale: { initial: 0.45, offset: 0.01 }, rotate: {}, translate: { offset: [50, 0] }, blur: {}, opacity: { wrap: 'clamp' }, id: 15, name: '016-22+影子' },
  { resources: [{ src: '/bilibili-banner-snow/de5cbdcbf90a2eb32225d6b32923e76c00f48ce3.webm' }], scale: { initial: 0.43 }, rotate: {}, translate: { initial: [310, 25], offset: [50, 0] }, blur: {}, opacity: { wrap: 'clamp' }, id: 36, name: '雪动画' },
  { resources: [{ src: '/bilibili-banner-snow/9316d140598d5dc7e86d72e4a99ed903953d2e76.png' }], scale: { initial: 0.45, offset: 0.05 }, rotate: {}, translate: { offset: [130, 0] }, blur: {}, opacity: { wrap: 'clamp' }, id: 16, name: '015中景树2-右侧' },
  { resources: [{ src: '/bilibili-banner-snow/82a15b3fda5ce240bac44b8d0b793b13c3bafc4e.png' }], scale: { initial: 0.45, offset: 0.01 }, rotate: {}, translate: { offset: [125, 0] }, blur: {}, opacity: { wrap: 'clamp' }, id: 17, name: '014中景树1' },
  { resources: [{ src: '/bilibili-banner-snow/83e19c7274daec8f0e7d97cd6ad888e3e43b8083.png' }], scale: { initial: 0.45, offset: 0.01 }, rotate: {}, translate: { offset: [-75, 0] }, blur: {}, opacity: { wrap: 'clamp' }, id: 34, name: '014中景树左侧' },
  { resources: [{ src: '/bilibili-banner-snow/4e2110157727360d88357840903ed05b6b94c453.png' }], scale: { initial: 0.45, offset: 0.05 }, rotate: {}, translate: { offset: [75, 0] }, blur: {}, opacity: { wrap: 'clamp' }, id: 18, name: '013右侧中远树' },
  { resources: [{ src: '/bilibili-banner-snow/3505e4538c81fce91fa5e6dacd4703d8277df021.png' }], scale: { initial: 0.45, offset: 0.05 }, rotate: {}, translate: { initial: [50, 0], offset: [200, 0] }, blur: {}, opacity: { wrap: 'clamp' }, id: 19, name: '012左侧边缘中景树' },
  { resources: [{ src: '/bilibili-banner-snow/8f51a0828e322ca0576f449ceb45cca453735506.png' }], scale: { initial: 0.45, offset: 0.01 }, rotate: {}, translate: { offset: [50, 0] }, blur: {}, opacity: { wrap: 'clamp' }, id: 20, name: '011右侧中景' },
  { resources: [{ src: '/bilibili-banner-snow/3d4a9667931a9a20011a384b7d699c3b286b82ab.png' }], scale: { initial: 0.5, offset: 0.1 }, rotate: {}, translate: { offset: [-40, 40] }, blur: {}, opacity: { wrap: 'clamp' }, id: 22, name: '009中层遮挡雪' },
  { resources: [{ src: '/bilibili-banner-snow/3c711c23ae57db96468a23e2beca49ce66f12c73.png' }], scale: { initial: 0.45, offset: 0.05 }, rotate: {}, translate: { offset: [80, 0] }, blur: {}, opacity: { wrap: 'clamp' }, id: 23, name: '008地上碎草' },
  { resources: [{ src: '/bilibili-banner-snow/e3607ba671317e2b1e4990a9225cbf9981a7a414.png' }], scale: { initial: 0.45, offset: 0.05 }, rotate: {}, translate: { offset: [300, 0] }, blur: {}, opacity: { wrap: 'clamp' }, id: 24, name: '007近处左树' },
  { resources: [{ src: '/bilibili-banner-snow/2a4e5f40421d467e841b24eed228910bf965d4a1.png' }], scale: { initial: 0.45, offset: 0.05 }, rotate: {}, translate: { initial: [360, 0], offset: [-300, 0] }, blur: {}, opacity: { wrap: 'clamp' }, id: 25, name: '006近处右树' },
  { resources: [{ src: '/bilibili-banner-snow/446466499bd9615bc950ec4d8ec63647defc05b6.png' }], scale: { initial: 0.49, offset: 0.05 }, rotate: {}, translate: { initial: [0, 20], offset: [120, 5] }, blur: {}, opacity: { wrap: 'clamp' }, id: 33, name: '005' },
  { resources: [{ src: '/bilibili-banner-snow/f8720df769d23c497096f57b73528265fd6b554a.png' }], scale: { initial: 0.48, offset: 0.05 }, rotate: {}, translate: { initial: [-30, 20], offset: [0, 5] }, blur: {}, opacity: { wrap: 'clamp' }, id: 32, name: '004' },
  { resources: [{ src: '/bilibili-banner-snow/6970b12a96d85dd28a0aeb803eb3428dfec771bb.png' }], scale: { initial: 0.48, offset: 0.05 }, rotate: {}, translate: { initial: [-30, 20], offset: [250, 0] }, blur: {}, opacity: { wrap: 'clamp' }, id: 31, name: '003左侧边缘草丛' },
  { resources: [{ src: '/bilibili-banner-snow/83615a69b1ecab29163a54912260fd624a886906.png' }], scale: { initial: 0.5, offset: -0.05 }, rotate: {}, translate: { initial: [50, 20], offset: [50, 5] }, blur: {}, opacity: { wrap: 'clamp' }, id: 29, name: '002左前中间草丛' },
  { resources: [{ src: '/bilibili-banner-snow/f14b431627327dda93f34b13392a3a773be5e788.png' }], scale: { initial: 0.55, offset: 0.02 }, rotate: {}, translate: { initial: [0, -20], offset: [50, 100] }, blur: {}, opacity: { wrap: 'clamp' }, id: 0, name: '001顶层雪' },
]

const syncMouseX = (nextMouseX: number) => {
  if (typeof window === 'undefined') {
    mouseX.value = nextMouseX
    return
  }
  pendingMouseX = nextMouseX
  if (frameId) return
  frameId = window.requestAnimationFrame(() => {
    mouseX.value = pendingMouseX
    frameId = 0
  })
}

const handleMouseMove = (event: MouseEvent) => {
  if (!isHovering.value) return
  syncMouseX(event.clientX)
}

const handleMouseEnter = (event: MouseEvent) => {
  isHovering.value = true
  syncMouseX(event.clientX)
}

const handleMouseLeave = () => {
  isHovering.value = false
  syncMouseX(windowWidth.value / 2)
}

const handleResize = () => {
  windowWidth.value = window.innerWidth
  if (!isHovering.value) {
    syncMouseX(windowWidth.value / 2)
  }
}

onMounted(() => {
  if (typeof window !== 'undefined') {
    handleResize()
    window.addEventListener('resize', handleResize)
  }
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', handleResize)
    if (frameId) {
      window.cancelAnimationFrame(frameId)
      frameId = 0
    }
  }
})

const getMediaStyle = (layer: any) => {
  let progress = 0
  if (windowWidth.value > 0) {
    progress = (mouseX.value - windowWidth.value / 2) / (windowWidth.value / 2)
    progress = Math.max(-1, Math.min(1, progress))
  }
  if (!isHovering.value) progress = 0

  const scaleOffset = layer.scale?.offset ?? 0
  const translateInitialX = layer.translate?.initial?.[0] ?? 0
  const translateInitialY = layer.translate?.initial?.[1] ?? 0
  const translateOffsetX = layer.translate?.offset?.[0] ?? 0
  const translateOffsetY = layer.translate?.offset?.[1] ?? 0
  const rotateInitial = layer.rotate?.initial ?? 0
  const rotateOffset = layer.rotate?.offset ?? 0
  const blurInitial = layer.blur?.initial ?? 0
  const opacityInitial = layer.opacity?.initial !== undefined ? layer.opacity.initial : 1

  const finalX = translateInitialX + progress * translateOffsetX
  const finalY = translateInitialY + progress * translateOffsetY
  const finalScale = 1 + Math.abs(progress) * scaleOffset
  const finalRotate = rotateInitial + progress * rotateOffset

  return {
    transform: `translate3d(${finalX}px, ${finalY}px, 0) scale(${finalScale}) rotate(${finalRotate}deg)`,
    filter: blurInitial ? `blur(${blurInitial}px)` : 'none',
    opacity: opacityInitial,
    transition: isHovering.value ? 'none' : 'transform 0.4s ease-out, filter 0.4s ease-out',
  }
}
</script>

<template>
  <div class="bilibili-banner-wrap">
    <div
      ref="bannerRef"
      class="banner-inner"
      @mousemove="handleMouseMove"
      @mouseenter="handleMouseEnter"
      @mouseleave="handleMouseLeave"
    >
      <div v-for="(layer, index) in layersData" :key="index" class="layer">
        <video
          v-if="layer.resources[0].src.endsWith('.webm')"
          :src="layer.resources[0].src"
          autoplay
          loop
          muted
          playsinline
          class="media"
          :style="getMediaStyle(layer)"
        />
        <img
          v-else
          :src="layer.resources[0].src"
          class="media"
          alt=""
          :style="getMediaStyle(layer)"
        >
      </div>
      <div class="banner-mask" />
    </div>
  </div>
</template>

<style scoped>
.bilibili-banner-wrap {
  width: 100vw;
  margin-left: calc(-50vw + 50%);
  margin-top: 0;
  margin-bottom: 0;
  overflow: hidden;
  border-radius: 0;
  box-shadow: none;
  border: none;
}

.banner-inner {
  position: relative;
  width: 100%;
  height: clamp(150px, 16vw, 260px);
  background-color: transparent;
  overflow: hidden;
  cursor: default;
  user-select: none;
  isolation: isolate;
}

.layer {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  contain: paint;
}

.media {
  display: block;
  height: 100%;
  width: auto;
  max-width: none;
  will-change: transform, filter;
  backface-visibility: hidden;
  transform-origin: center center;
}

.banner-mask {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 40px;
  background: linear-gradient(to bottom, transparent, var(--login-page-blend, #f7f0e3));
  pointer-events: none;
  z-index: 100;
}
</style>
