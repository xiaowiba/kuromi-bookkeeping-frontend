<template>
  <t-tab-bar
    class="mobile-tabbar"
    :value="activeTab"
    fixed
    placeholder
    :safe-area-inset-bottom="true"
    :z-index="1200"
    @change="handleTabChange"
  >
    <t-tab-bar-item value="detail">
      <template #icon>
        <icon-unordered-list />
      </template>
      明细
    </t-tab-bar-item>

    <t-tab-bar-item value="add">
      <template #icon>
        <icon-plus />
      </template>
      记账
    </t-tab-bar-item>

    <t-tab-bar-item value="bill">
      <template #icon>
        <icon-file />
      </template>
      账单
    </t-tab-bar-item>

    <t-tab-bar-item value="report">
      <template #icon>
        <icon-bar-chart />
      </template>
      报表
    </t-tab-bar-item>

    <t-tab-bar-item value="me">
      <template #icon>
        <icon-user />
      </template>
      我的
    </t-tab-bar-item>
  </t-tab-bar>
</template>

<script setup lang="ts">
/**
 * 移动端底部导航
 *
 * @author Wangsongsong
 * @date 2026-03-21
 * @update 2026-03-21 @Wangsongsong
 * @desc 调整为 TDesign 默认图标加文字标签栏，保留记账标签点击后打开移动端新增弹层
 * @update 2026-03-22 @Wangsongsong
 * @desc 统一底部标签栏选中态与背景配色，使其与移动端黄色系主题保持一致
 * @update 2026-08-29 @Wangsongsong
 * @desc 新增账单底部导航入口，跳转至移动端账单页面
 */
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import mittBus from '@/utils/mitt'

defineOptions({ name: 'MobileTabBar' })

type MobileTab = 'detail' | 'bill' | 'report' | 'me'

const route = useRoute()
const router = useRouter()

const tabRouteMap: Record<MobileTab, string> = {
  detail: '/m/bookkeeping/detail',
  bill: '/m/bill',
  report: '/m/report',
  me: '/m/me',
}

const activeTab = computed<MobileTab>(() => {
  if (route.path.startsWith('/m/bill')) {
    return 'bill'
  }
  if (route.path.startsWith('/m/report')) {
    return 'report'
  }
  if (route.path.startsWith('/m/me') || route.path.startsWith('/m/subject')) {
    return 'me'
  }
  return 'detail'
})

const isRouteTab = (value: string): value is MobileTab =>
  Object.prototype.hasOwnProperty.call(tabRouteMap, value)

const goToTab = (tab: MobileTab) => {
  const targetPath = tabRouteMap[tab]
  if (targetPath && targetPath !== route.path) {
    router.push(targetPath)
  }
}

const openAddPopup = () => {
  mittBus.emit('mobile-detail-add-open')
}

const handleTabChange = (value: string | number) => {
  if (value === 'add') {
    openAddPopup()
    return
  }

  if (typeof value === 'string' && isRouteTab(value)) {
    goToTab(value)
  }
}
</script>

<style scoped lang="scss">
.mobile-tabbar {
  :deep(.t-tab-bar) {
    border-top: 1px solid rgba(143, 99, 17, 0.08);
    //background: rgba(255, 250, 240, 0.96);
    backdrop-filter: blur(20px);
    box-shadow: 0 -8px 24px rgba(130, 90, 22, 0.08);
  }

  :deep(.t-tab-bar-item__content) {
    color: rgba(120, 94, 51, 0.58);
    transition: color 0.2s ease;
  }

  :deep(.t-tab-bar-item__text) {
    font-weight: 500;
  }

  :deep(.t-tab-bar-item__content--checked) {
    color: var(--mobile-brand);
  }

  :deep(.t-tab-bar-item__content--checked .t-tab-bar-item__text) {
    color: var(--mobile-brand-deep);
    font-weight: 700;
  }
}
</style>
