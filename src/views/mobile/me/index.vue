<template>
  <div class="mobile-page">
    <section class="mobile-me-profile mobile-panel">
      <div class="mobile-me-profile__avatar">
        {{ avatarText }}
      </div>
      <div class="mobile-me-profile__content">
        <p class="mobile-me-profile__eyebrow">个人中心</p>
        <h2 class="mobile-me-profile__name">{{ userStore.userInfo.nickname }}</h2>
        <p class="mobile-me-profile__account">{{ userStore.userInfo.username }}</p>
      </div>
    </section>

    <section class="mobile-panel mobile-me-grid">
      <h3 class="mobile-section-title">常用功能</h3>
      <t-grid :column="3" theme="card" border>
        <t-grid-item
          v-for="item in gridItems"
          :key="item.key"
          :text="item.text"
          :description="item.description"
          @click="handleGridClick(item.key)"
        >
          <template #icon>
            <span class="mobile-me-grid__icon">{{ item.icon }}</span>
          </template>
        </t-grid-item>
      </t-grid>
    </section>

    <section class="mobile-panel mobile-me-actions">
      <h3 class="mobile-section-title">账户设置</h3>
      <t-cell
          v-show="false"
        title="隐私模式"
        :note="privacyStore.isPrivacyMode ? '当前已开启' : '当前未开启'"
        bordered
      />
      <t-cell
        title="版本说明"
        note="移动端独立框架 Phase 1"
        bordered
      />
      <t-cell
        title="退出登录"
        note="返回登录页"
        arrow
        bordered
        @click="handleLogout"
      />
    </section>
  </div>
</template>

<script setup lang="ts">
/**
 * 移动端我的页面
 *
 * @author Wangsongsong
 * @date 2026-03-21
 */
import { Message } from '@arco-design/web-vue'
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { usePrivacyStore, useUserStore } from '@/stores'

defineOptions({ name: 'MobileMe' })

const router = useRouter()
const userStore = useUserStore()
const privacyStore = usePrivacyStore()

const avatarText = computed(() => {
  return (userStore.userInfo.nickname || userStore.userInfo.username || '我').slice(0, 1).toUpperCase()
})

const gridItems = [
  { key: 'subject', text: '科目', description: '管理科目', icon: '科' },
  { key: 'report', text: '报表', description: '查看规划', icon: '报' },
  { key: 'follow', text: '关注', description: '后续接入', icon: '关' },
  // { key: 'hide', text: '隐藏', description: '后续接入', icon: '隐' },
  // { key: 'privacy', text: '隐私', description: '查看状态', icon: '密' },
  { key: 'version', text: '版本', description: '阶段说明', icon: '版' },
]

const handleGridClick = (key: string) => {
  if (key === 'subject') {
    router.push('/m/subject')
    return
  }

  if (key === 'report') {
    router.push('/m/report')
    return
  }

  if (key === 'privacy') {
    Message.info(privacyStore.isPrivacyMode ? '当前处于隐私模式' : '当前未开启隐私模式')
    return
  }

  if (key === 'version') {
    Message.info('移动端独立框架正在按阶段推进')
    return
  }

  Message.info('该移动端能力将在后续阶段补充')
}

const handleLogout = async () => {
  const success = await userStore.logout()
  if (success) {
    router.replace('/login')
  }
}
</script>

<style scoped lang="scss">
.mobile-me-profile {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 18px;
}

.mobile-me-profile__avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border-radius: 24px;
  background: linear-gradient(135deg, rgb(var(--arcoblue-5)) 0%, rgb(var(--arcoblue-7)) 100%);
  box-shadow: 0 12px 24px rgba(var(--arcoblue-6), 0.28);
  color: #fff;
  font-size: 28px;
  font-weight: 700;
}

.mobile-me-profile__eyebrow {
  margin: 0 0 6px;
  color: rgb(var(--arcoblue-6));
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.mobile-me-profile__name {
  margin: 0;
  color: var(--color-text-1);
  font-size: 24px;
  font-weight: 700;
}

.mobile-me-profile__account {
  margin: 6px 0 0;
  color: var(--color-text-3);
  font-size: 14px;
}

.mobile-me-grid,
.mobile-me-actions {
  margin-top: 14px;
  padding: 18px 16px;
}

.mobile-me-grid__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 12px;
  background: rgba(var(--arcoblue-6), 0.1);
  color: rgb(var(--arcoblue-6));
  font-size: 14px;
  font-weight: 700;
}
</style>
