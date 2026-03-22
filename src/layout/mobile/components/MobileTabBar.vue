<template>
  <t-tab-bar
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
 */
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import mittBus from '@/utils/mitt'

defineOptions({ name: 'MobileTabBar' })

type MobileTab = 'detail' | 'report' | 'me'

const route = useRoute()
const router = useRouter()

const tabRouteMap: Record<MobileTab, string> = {
  detail: '/m/bookkeeping/detail',
  report: '/m/report',
  me: '/m/me',
}

const activeTab = computed<MobileTab>(() => {
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
