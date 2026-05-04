<template>
  <a-card
    class="general-card quick-operation-card"
    title="业务快捷入口"
    :header-style="{ paddingBottom: '0' }"
    :body-style="{ padding: '20px' }"
  >
    <a-empty v-if="!visibleLinks.length" description="暂无可用入口" />

    <div v-else class="quick-operation__grid">
      <button
        v-for="link in visibleLinks"
        :key="link.path"
        type="button"
        class="quick-operation__item"
        @click="onNavigate(link.path)"
      >
        <span class="quick-operation__icon">
          <component :is="link.icon" />
        </span>
        <strong class="quick-operation__title">{{ link.text }}</strong>
      </button>
    </div>
  </a-card>
</template>

<script setup lang="ts">
import {
  IconApps,
  IconBook,
  IconCalendar,
  IconSafe,
  IconStorage,
  IconTag,
  IconUserGroup,
} from '@arco-design/web-vue/es/icon'
import { computed } from 'vue'
import type { Component } from 'vue'
import type { RouteRecordRaw } from 'vue-router'
import { useRouteStore } from '@/stores'

const router = useRouter()
const routeStore = useRouteStore()

interface QuickLinkItem {
  text: string
  path: string
  icon: Component
}

const links: QuickLinkItem[] = [
  { text: '明细管理', path: '/bookkeeping/detail', icon: IconStorage },
  { text: '报表中心', path: '/bookkeeping/report', icon: IconApps },
  { text: '账单管理', path: '/bookkeeping/bill', icon: IconBook },
  { text: '日历报表', path: '/bookkeeping/report-calendar', icon: IconCalendar },
  { text: '科目管理', path: '/bookkeeping/subject', icon: IconTag },
  { text: '支付账号', path: '/bookkeeping/payment-account', icon: IconSafe },
  { text: '关注管理', path: '/bookkeeping/follow', icon: IconUserGroup },
]

const collectRoutePaths = (routes: RouteRecordRaw[]) => {
  const pathSet = new Set<string>()

  const walk = (items: RouteRecordRaw[]) => {
    items.forEach((item) => {
      if (item.path) {
        pathSet.add(item.path)
      }
      if (item.children?.length) {
        walk(item.children)
      }
    })
  }

  walk(routes)
  return pathSet
}

const visibleLinks = computed(() => {
  const availablePaths = collectRoutePaths(routeStore.routes)
  return links.filter(link => availablePaths.has(link.path))
})

const onNavigate = (path: string) => {
  router.push({ path })
}
</script>

<style scoped lang="scss">
.quick-operation-card {
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(59, 130, 246, 0.1);
  border-radius: 24px;
  background: #f8fbff;
  box-shadow: 0 16px 36px rgba(15, 23, 42, 0.04);
}

.quick-operation-card :deep(.arco-card-header) {
  padding: 20px 22px 0;
  border-bottom: none;
}

.quick-operation-card :deep(.arco-card-body) {
  padding: 18px 22px 22px !important;
}

.quick-operation-card :deep(.arco-card-header-title) {
  color: var(--color-text-1);
  font-size: 18px;
  font-weight: 800;
}

.quick-operation__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.quick-operation__item {
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 12px;
  width: 100%;
  min-width: 0;
  min-height: 108px;
  padding: 18px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.88),
    0 10px 24px rgba(15, 23, 42, 0.03);
  cursor: pointer;
  appearance: none;
  text-align: left;
  transition:
    border-color 0.2s ease,
    transform 0.2s ease,
    box-shadow 0.2s ease,
    background 0.2s ease;
}

.quick-operation__item::after {
  content: '';
  position: absolute;
  inset: auto 18px 0 auto;
  width: 76px;
  height: 76px;
  border-radius: 999px;
  background: rgba(59, 130, 246, 0.06);
  opacity: 0.6;
  transform: translate(28px, 28px);
  pointer-events: none;
}

.quick-operation__item:hover {
  border-color: rgba(59, 130, 246, 0.28);
  background: #ffffff;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.92),
    0 18px 36px rgba(59, 130, 246, 0.1);
  transform: translateY(-2px);
}

.quick-operation__item:focus-visible {
  outline: 2px solid rgba(59, 130, 246, 0.28);
  outline-offset: 2px;
}

.quick-operation__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 46px;
  border-radius: 16px;
  background: rgba(219, 234, 254, 0.95);
  color: rgb(var(--primary-6));
  font-size: 19px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.78);
}

.quick-operation__title {
  color: var(--color-text-1);
  font-size: 15px;
  font-weight: 800;
  line-height: 1.4;
}

@media (max-width: 768px) {
  .quick-operation__grid {
    grid-template-columns: 1fr;
  }
}
</style>
