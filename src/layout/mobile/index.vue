<template>
  <div class="mobile-layout" :class="{ 'mobile-layout--bill': isBillRoute }">
    <t-navbar
      v-if="showNavbar"
      fixed
      placeholder
      class="mobile-layout__navbar"
      :title="pageTitle"
      :left-arrow="showBack"
      @left-click="handleBack"
    />

    <main class="mobile-layout__body" :class="{ 'mobile-layout__body--bill': isBillRoute }">
      <router-view v-slot="{ Component }">
        <Suspense>
          <component :is="Component" />
          <template #fallback>
            <MobilePageSkeleton :variant="routeSkeletonVariant" />
          </template>
        </Suspense>
      </router-view>
    </main>

    <MobileTabBar />

    <MobileDetailDirectCreatePopup
      v-model:visible="directCreatePopupVisible"
      :detail-id="editingDetailId"
      @save-success="handleSaveSuccess"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * 移动端独立布局
 *
 * @author Wangsongsong
 * @date 2026-03-21
 * @update 2026-03-21 @Wangsongsong
 * @desc 明细首页隐藏全局导航栏，由页面自行承接顶部视觉
 * @update 2026-03-21 @Wangsongsong
 * @desc 补充移动端明细编辑事件，统一管理新增与编辑弹层
 * @update 2026-03-21 @Wangsongsong
 * @desc 新增移动端新增专用表单组件，新增与编辑分离挂载
 * @update 2026-03-21 @Wangsongsong
 * @desc 将移动端明细编辑入口切换为复用新记账表单流程，不再挂载旧编辑弹层
 * @update 2026-03-22 @Wangsongsong
 * @desc 移动端布局层增加路由级骨架屏，占位页面异步加载过程
 * @update 2026-03-22 @Wangsongsong
 * @desc 移动端布局层增加下拉刷新容器，统一派发页面刷新事件
 * @update 2026-03-22 @Wangsongsong
 * @desc 下拉刷新加载态显示切换为移动端 Loading 风格
 * @update 2026-03-22 @Wangsongsong
 * @desc 统一移动端布局和下拉刷新区域为黄色系风格
 * @update 2026-03-22 @Wangsongsong
 * @desc 修复下拉刷新容器固定高度导致移动端页面内容被裁剪、无法向下滚动的问题
 * @update 2026-03-22 @Wangsongsong
 * @desc 取消移动端布局内层滚动容器，改为页面自然滚动，修复明细页数据无法滚动到底的问题
 * @update 2026-03-22 @Wangsongsong
 * @desc 移除移动端全局下拉刷新容器及事件派发，避免布局层刷新能力引入额外交互与滚动问题
 * @update 2026-03-27 @Wangsongsong
 * @desc 新增与编辑入口统一切换为移动端直接填写明细弹层，旧的先选科目流程组件保留但不再作为布局层入口
 */
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MobileTabBar from './components/MobileTabBar.vue'
import MobilePageSkeleton from '@/views/mobile/components/MobilePageSkeleton.vue'
import MobileDetailDirectCreatePopup from '@/views/mobile/bookkeeping/detail/components/MobileDetailDirectCreatePopup.vue'
import mittBus from '@/utils/mitt'
import { bindMobileRemResize } from '@/utils/mobile-rem'

defineOptions({ name: 'LayoutMobile' })

const route = useRoute()
const router = useRouter()

const directCreatePopupVisible = ref(false)
const editingDetailId = ref('')
const rootPaths = ['/m/bookkeeping/detail', '/m/report', '/m/me']
const MOBILE_SCROLL_UNLOCK_CLASS = 'mobile-scroll-unlocked'
let cleanupMobileRemResize: (() => void) | null = null

const pageTitle = computed(() => (route.meta.title as string) || '移动端')
const showNavbar = computed(() => !route.meta.hideMobileNavbar)
const showBack = computed(() => !rootPaths.includes(route.path))
const isBillRoute = computed(() => route.path.startsWith('/m/bill'))
const routeSkeletonVariant = computed(() => {
  if (route.path.startsWith('/m/report')) {
    return 'report'
  }
  if (route.path.startsWith('/m/me') || route.path.startsWith('/m/subject')) {
    return route.path.startsWith('/m/subject') ? 'subject' : 'me'
  }
  return 'detail'
})

const openAddPopup = () => {
  editingDetailId.value = ''
  directCreatePopupVisible.value = true
}

const openEditPopup = (id: string) => {
  editingDetailId.value = id
  directCreatePopupVisible.value = true
}

const handleSaveSuccess = () => {
  mittBus.emit('mobile-detail-refresh')
}

const handleBack = () => {
  if (route.path === '/m/subject') {
    router.push('/m/me')
    return
  }

  if (window.history.length > 1) {
    router.back()
    return
  }

  router.push('/m/bookkeeping/detail')
}

watch(directCreatePopupVisible, (value) => {
  if (!value) {
    editingDetailId.value = ''
  }
})

onMounted(() => {
  cleanupMobileRemResize = bindMobileRemResize()
  document.body.classList.add(MOBILE_SCROLL_UNLOCK_CLASS)
  document.getElementById('app')?.classList.add(MOBILE_SCROLL_UNLOCK_CLASS)
  mittBus.on('mobile-detail-add-open', openAddPopup)
  mittBus.on('mobile-detail-edit-open', openEditPopup)
})

onUnmounted(() => {
  cleanupMobileRemResize?.()
  cleanupMobileRemResize = null
  document.body.classList.remove(MOBILE_SCROLL_UNLOCK_CLASS)
  document.getElementById('app')?.classList.remove(MOBILE_SCROLL_UNLOCK_CLASS)
  mittBus.off('mobile-detail-add-open', openAddPopup)
  mittBus.off('mobile-detail-edit-open', openEditPopup)
})
</script>

<style scoped lang="scss">
.mobile-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  overflow: visible;
  background:
    radial-gradient(circle at top left, rgba(255, 221, 115, 0.72) 0%, transparent 30%),
    linear-gradient(180deg, #fffaf0 0%, #f5eee2 100%);
}

.mobile-layout--bill {
  height: 100dvh;
  min-height: 100dvh;
  overflow: hidden;
}

.mobile-layout__navbar {
  :deep(.t-navbar) {
    background: rgba(255, 249, 236, 0.9);
    backdrop-filter: blur(16px);
    box-shadow: 0 8px 24px rgba(130, 90, 22, 0.06);
  }

  :deep(.t-navbar__title) {
    color: var(--color-text-1);
    font-weight: 700;
    letter-spacing: 0.02em;
  }

  :deep(.t-navbar__left),
  :deep(.t-navbar__left-arrow),
  :deep(.t-navbar__text) {
    color: var(--mobile-brand-deep);
  }
}

.mobile-layout__body {
  flex: 1;
  min-height: 0;
  overflow: visible;
}

.mobile-layout__body--bill {
  display: flex;
  min-height: 0;
  overflow: hidden;
}

@supports not (height: 100dvh) {
  .mobile-layout--bill {
    height: 100vh;
    min-height: 100vh;
  }
}

</style>
