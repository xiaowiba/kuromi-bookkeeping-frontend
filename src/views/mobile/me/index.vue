<template>
  <div class="mobile-page mobile-me-page">
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
        v-if="hasPrivacyPermission && privacyStore.isPrivacyMode"
        title="隐私模式"
        :note="privacyStatusText"
        bordered
      />
      <t-cell
        title="退出登录"
        note=""
        arrow
        bordered
        @click="handleLogout"
      />
    </section>

    <div
      class="mobile-me-footer"
      role="button"
      tabindex="0"
      @click="handleVersionFooterClick"
      @keydown.enter.prevent="handleVersionFooterClick"
    >
      <t-footer class="mobile-me-footer__content" :text="footerText" />
    </div>

    <t-popup v-model:visible="verifyPopupVisible" placement="bottom" destroy-on-close>
      <div class="mobile-bottom-sheet">
        <div class="mobile-bottom-sheet__panel">
          <div class="mobile-bottom-sheet__header">
            <p class="mobile-bottom-sheet__eyebrow">隐私模式</p>
            <h3 class="mobile-bottom-sheet__title">输入隐私密码</h3>
            <p class="mobile-bottom-sheet__meta">验证通过后，将切换到隐私明细视图。</p>
          </div>

          <div class="mobile-field">
            <label class="mobile-field__label">隐私密码</label>
            <input
              v-model.trim="verifyPassword"
              class="mobile-input"
              type="password"
              maxlength="32"
              placeholder="请输入隐私密码"
              @keydown.enter="handleVerifyPassword"
            />
          </div>

          <div class="mobile-form-actions mobile-bottom-sheet__actions">
            <t-button block variant="outline" size="large" @click="closeVerifyPopup">
              取消
            </t-button>
            <t-button block theme="primary" size="large" :loading="privacySubmitting" @click="handleVerifyPassword">
              进入隐私模式
            </t-button>
          </div>
        </div>
      </div>
    </t-popup>

    <t-popup v-model:visible="setupPopupVisible" placement="bottom" destroy-on-close>
      <div class="mobile-bottom-sheet">
        <div class="mobile-bottom-sheet__panel">
          <div class="mobile-bottom-sheet__header">
            <p class="mobile-bottom-sheet__eyebrow">隐私模式</p>
            <h3 class="mobile-bottom-sheet__title">首次设置隐私密码</h3>
            <p class="mobile-bottom-sheet__meta">密码至少 4 位，后续进入隐私模式时需要验证。</p>
          </div>

          <div class="mobile-field">
            <label class="mobile-field__label">新密码</label>
            <input
              v-model.trim="setupForm.password"
              class="mobile-input"
              type="password"
              maxlength="32"
              placeholder="请输入新密码"
            />
          </div>

          <div class="mobile-field">
            <label class="mobile-field__label">确认密码</label>
            <input
              v-model.trim="setupForm.confirmPassword"
              class="mobile-input"
              type="password"
              maxlength="32"
              placeholder="请再次输入密码"
              @keydown.enter="handleSetupPassword"
            />
          </div>

          <div class="mobile-form-actions mobile-bottom-sheet__actions">
            <t-button block variant="outline" size="large" @click="closeSetupPopup">
              取消
            </t-button>
            <t-button block theme="primary" size="large" :loading="privacySubmitting" @click="handleSetupPassword">
              保存并进入
            </t-button>
          </div>
        </div>
      </div>
    </t-popup>
  </div>
</template>

<script setup lang="ts">
/**
 * 移动端我的页面
 *
 * @author Wangsongsong
 * @date 2026-03-21
 * @update 2026-03-22 @Wangsongsong
 * @desc 底部版本号切换为 TDesign Footer，并改为三连击触发隐私模式入口
 * @update 2026-03-22 @Wangsongsong
 * @desc 移动端页面提示统一改为使用 TDesign Toast
 * @update 2026-03-22 @Wangsongsong
 * @desc 接入移动端布局层下拉刷新，页面注册个人中心刷新回调
 * @update 2026-03-22 @Wangsongsong
 * @desc 统一我的页面、九宫格和隐私弹层为黄色系风格
 * @update 2026-03-22 @Wangsongsong
 * @desc 移除我的页面下拉刷新回调，避免隐私入口页再依赖全局手势刷新链路
 */
import { computed, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { MOBILE_DISPLAY_VERSION } from '@/config/app-version'
import { usePrivacyStore, useUserStore } from '@/stores'
import { mobileToast } from '@/utils/mobile-toast'
import { usePrivacyEntry } from '@/views/bookkeeping/shared/usePrivacyEntry'

defineOptions({ name: 'MobileMe' })

const router = useRouter()
const userStore = useUserStore()
const privacyStore = usePrivacyStore()
const {
  hasPrivacyPermission,
  currentExpireMinutes,
  verifyPopupVisible,
  setupPopupVisible,
  verifyPassword,
  privacySubmitting,
  setupForm,
  closeVerifyPopup,
  closeSetupPopup,
  openPrivacyEntry,
  handleVerifyPassword,
  handleSetupPassword,
} = usePrivacyEntry()

let versionClickCount = 0
let versionClickTimer: ReturnType<typeof window.setTimeout> | null = null

const avatarText = computed(() => {
  return (userStore.userInfo.nickname || userStore.userInfo.username || '我').slice(0, 1).toUpperCase()
})

const privacyStatusText = computed(() => {
  if (privacyStore.isPrivacyMode) {
    return `已开启（${currentExpireMinutes.value} 分钟内有效）`
  }
  return '未开启'
})

const footerText = computed(() => `版本 ${MOBILE_DISPLAY_VERSION}`)

const gridItems = [
  { key: 'subject', text: '科目', description: '管理科目', icon: '科' },
  { key: 'report', text: '报表', description: '查看规划', icon: '报' },
  { key: 'follow', text: '关注', description: '后续接入', icon: '关' },
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

  mobileToast.info('该移动端能力将在后续阶段补充')
}

const resetVersionClickState = () => {
  versionClickCount = 0
  if (versionClickTimer) {
    window.clearTimeout(versionClickTimer)
    versionClickTimer = null
  }
}

const handleVersionFooterClick = async () => {
  versionClickCount += 1

  if (versionClickTimer) {
    window.clearTimeout(versionClickTimer)
  }
  versionClickTimer = window.setTimeout(() => {
    versionClickCount = 0
    versionClickTimer = null
  }, 2000)

  if (versionClickCount < 3) {
    return
  }

  resetVersionClickState()
  await openPrivacyEntry()
}

const handleLogout = async () => {
  const success = await userStore.logout()
  if (success) {
    router.replace('/login')
  }
}

onUnmounted(() => {
  resetVersionClickState()
})
</script>

<style scoped lang="scss">
.mobile-me-page {
  display: flex;
  flex-direction: column;
  min-height: 100%;
}

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
  background: linear-gradient(135deg, #ffd764 0%, #e1ad24 100%);
  box-shadow: 0 12px 24px rgba(197, 138, 18, 0.24);
  color: #fff;
  font-size: 28px;
  font-weight: 700;
}

.mobile-me-profile__eyebrow {
  margin: 0 0 6px;
  color: var(--mobile-brand);
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

.mobile-me-grid :deep(.t-grid-item) {
  background: rgba(255, 252, 244, 0.82);
  border-color: rgba(143, 99, 17, 0.08);
}

.mobile-me-grid :deep(.t-grid-item__text) {
  color: var(--color-text-1);
  font-weight: 600;
}

.mobile-me-grid :deep(.t-grid-item__description) {
  color: rgba(120, 94, 51, 0.62);
}

.mobile-me-actions :deep(.t-cell) {
  background: rgba(255, 252, 244, 0.8);
  border-color: rgba(143, 99, 17, 0.08);
}

.mobile-me-grid__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 12px;
  background: rgba(255, 214, 98, 0.22);
  color: var(--mobile-brand-deep);
  font-size: 14px;
  font-weight: 700;
}

.mobile-me-footer {
  margin-top: auto;
  padding: 18px 0 calc(env(safe-area-inset-bottom) + 16px);
  outline: none;
}

.mobile-me-footer__content {
  cursor: pointer;

  :deep(.t-footer) {
    padding: 0;
  }

  :deep(.t-footer__text) {
    color: rgba(120, 94, 51, 0.48);
    font-size: 12px;
    letter-spacing: 0.04em;
  }
}

.mobile-bottom-sheet {
  padding: 0 0 calc(8px + env(safe-area-inset-bottom));
}

.mobile-bottom-sheet__panel {
  padding: 20px 16px 16px;
  border-radius: 26px 26px 0 0;
  background:
    radial-gradient(circle at top right, rgba(255, 214, 98, 0.24) 0%, transparent 40%),
    linear-gradient(180deg, #fffdf7 0%, #fbf2df 100%);
  box-shadow: 0 -12px 28px rgba(130, 90, 22, 0.12);
}

.mobile-bottom-sheet__header {
  margin-bottom: 14px;
}

.mobile-bottom-sheet__eyebrow {
  margin: 0 0 6px;
  color: var(--mobile-brand);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.mobile-bottom-sheet__title {
  margin: 0;
  color: #1f2937;
  font-size: 22px;
  font-weight: 800;
}

.mobile-bottom-sheet__meta {
  margin: 8px 0 0;
  color: #6b7280;
  font-size: 13px;
  line-height: 1.6;
}

.mobile-bottom-sheet__actions {
  margin-top: 18px;
}
</style>
