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
      <router-view />
    </main>

    <MobileTabBar />

    <MobileDetailCreatePopup
      v-model:visible="createPopupVisible"
      @save-success="handleSaveSuccess"
    />

    <MobileDetailAddPopup
      v-model:visible="editPopupVisible"
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
 * @desc 补充移动端明细编辑事件，统一管理新增/编辑弹层
 * @update 2026-03-21 @Wangsongsong
 * @desc 新增移动端新增专用表单组件，新增与编辑分离挂载
 */
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MobileTabBar from './components/MobileTabBar.vue'
import MobileDetailCreatePopup from '@/views/mobile/bookkeeping/detail/components/MobileDetailCreatePopup.vue'
import MobileDetailAddPopup from '@/views/mobile/bookkeeping/detail/components/MobileDetailAddPopup.vue'
import mittBus from '@/utils/mitt'
import { bindMobileRemResize } from '@/utils/mobile-rem'

defineOptions({ name: 'LayoutMobile' })

const route = useRoute()
const router = useRouter()

const createPopupVisible = ref(false)
const editPopupVisible = ref(false)
const editingDetailId = ref('')
const rootPaths = ['/m/bookkeeping/detail', '/m/report', '/m/me']
let cleanupMobileRemResize: (() => void) | null = null

const pageTitle = computed(() => (route.meta.title as string) || '移动端')
const showNavbar = computed(() => route.path !== '/m/bookkeeping/detail')
const showBack = computed(() => !rootPaths.includes(route.path))

const openAddPopup = () => {
  createPopupVisible.value = true
}

const openEditPopup = (id: string) => {
  editingDetailId.value = id
  editPopupVisible.value = true
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

watch(editPopupVisible, (value) => {
  if (!value) {
    editingDetailId.value = ''
  }
})

onMounted(() => {
  cleanupMobileRemResize = bindMobileRemResize()
  mittBus.on('mobile-detail-add-open', openAddPopup)
  mittBus.on('mobile-detail-edit-open', openEditPopup)
})

onUnmounted(() => {
  cleanupMobileRemResize?.()
  cleanupMobileRemResize = null
  mittBus.off('mobile-detail-add-open', openAddPopup)
  mittBus.off('mobile-detail-edit-open', openEditPopup)
})
</script>

<style scoped lang="scss">
.mobile-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  min-height: 100vh;
  overflow: hidden;
  background:
    radial-gradient(circle at top left, rgba(var(--arcoblue-2), 0.95) 0%, transparent 28%),
    linear-gradient(180deg, #f7fafc 0%, #edf2f7 100%);
}

.mobile-layout__navbar {
  :deep(.t-navbar) {
    background: rgba(247, 250, 252, 0.82);
    backdrop-filter: blur(16px);
  }

  :deep(.t-navbar__title) {
    color: var(--color-text-1);
    font-weight: 700;
    letter-spacing: 0.02em;
  }
}

.mobile-layout__body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
}

.mobile-layout__body.has-navbar {
  min-height: 0;
}

.mobile-layout__body::-webkit-scrollbar {
  display: none;
}
</style>
