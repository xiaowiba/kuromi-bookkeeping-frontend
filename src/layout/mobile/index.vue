<template>
  <div class="mobile-layout">
    <t-navbar
      v-if="showNavbar"
      fixed
      placeholder
      class="mobile-layout__navbar"
      :title="pageTitle"
      :left-arrow="showBack"
      @left-click="handleBack"
    />

    <main class="mobile-layout__body" :class="{ 'has-navbar': showNavbar }">
      <t-pull-down-refresh
        v-model="pullRefreshLoading"
        class="mobile-layout__refresh"
        :disabled="pullRefreshDisabled"
        :loading-props="pullRefreshLoadingProps"
        :loading-texts="pullRefreshTexts"
        :loading-bar-height="'1.12rem'"
        :max-bar-height="'1.52rem'"
        @refresh="handlePullRefresh"
      >
        <router-view v-slot="{ Component }">
          <Suspense>
            <component :is="Component" />
            <template #fallback>
              <MobilePageSkeleton :variant="routeSkeletonVariant" />
            </template>
          </Suspense>
        </router-view>
      </t-pull-down-refresh>
    </main>

    <MobileTabBar />

    <MobileDetailCreatePopup
      v-model:visible="createPopupVisible"
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
 */
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MobileTabBar from './components/MobileTabBar.vue'
import MobilePageSkeleton from '@/views/mobile/components/MobilePageSkeleton.vue'
import MobileDetailCreatePopup from '@/views/mobile/bookkeeping/detail/components/MobileDetailCreatePopup.vue'
import { emitMobilePageRefresh } from '@/hooks/app/useMobilePageRefresh'
import mittBus from '@/utils/mitt'
import { bindMobileRemResize } from '@/utils/mobile-rem'

defineOptions({ name: 'LayoutMobile' })

const route = useRoute()
const router = useRouter()

const createPopupVisible = ref(false)
const editingDetailId = ref('')
const pullRefreshLoading = ref(false)
const rootPaths = ['/m/bookkeeping/detail', '/m/report', '/m/me']
const MOBILE_SCROLL_UNLOCK_CLASS = 'mobile-scroll-unlocked'
let cleanupMobileRemResize: (() => void) | null = null
const PULL_REFRESH_MIN_DURATION = 600

const pageTitle = computed(() => (route.meta.title as string) || '移动端')
const showNavbar = computed(() => route.path !== '/m/bookkeeping/detail')
const showBack = computed(() => !rootPaths.includes(route.path))
const pullRefreshDisabled = computed(() => createPopupVisible.value)
const pullRefreshTexts = ['下拉即可刷新...', '松手立即刷新...', '正在刷新...', '刷新完成', '下拉即可刷新...']
const pullRefreshLoadingProps = {
  theme: 'spinner' as const,
  layout: 'vertical' as const,
  size: '0.32rem',
  inheritColor: true,
}
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
  createPopupVisible.value = true
}

const openEditPopup = (id: string) => {
  editingDetailId.value = id
  createPopupVisible.value = true
}

const handleSaveSuccess = () => {
  mittBus.emit('mobile-detail-refresh')
  if (route.path !== '/m/bookkeeping/detail') {
    router.push('/m/bookkeeping/detail')
  }
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

const wait = (duration: number) =>
  new Promise<void>((resolve) => {
    window.setTimeout(resolve, duration)
  })

const handlePullRefresh = async () => {
  const refreshStartAt = Date.now()

  try {
    await emitMobilePageRefresh()
  } finally {
    const elapsed = Date.now() - refreshStartAt
    if (elapsed < PULL_REFRESH_MIN_DURATION) {
      await wait(PULL_REFRESH_MIN_DURATION - elapsed)
    }
    pullRefreshLoading.value = false
  }
}

watch(createPopupVisible, (value) => {
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

.mobile-layout__body.has-navbar {
  min-height: 0;
}

.mobile-layout__refresh {
  height: auto;
  min-height: 100%;
  --td-pull-down-refresh-color: rgba(126, 92, 20, 0.68);
  --td-loading-text-color: rgba(126, 92, 20, 0.68);

  :deep(.t-pull-down-refresh) {
    height: auto;
    min-height: 100%;
  }

  :deep(.t-pull-down-refresh__track) {
    height: auto;
    min-height: 100%;
    background: transparent;
  }

  :deep(.t-pull-down-refresh__tips) {
    color: rgba(126, 92, 20, 0.68);
    background: linear-gradient(180deg, rgba(255, 244, 206, 0.92) 0%, rgba(255, 249, 236, 0) 100%);
  }

  :deep(.t-loading) {
    color: var(--mobile-brand);
  }

  :deep(.t-loading__text) {
    margin-top: 0.08rem;
    color: rgba(126, 92, 20, 0.68);
    font-size: 0.24rem;
    line-height: 1.4;
  }
}

</style>
