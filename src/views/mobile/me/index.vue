<template>
  <div class="mobile-page mobile-me-page">
    <section class="mobile-me-profile mobile-panel">
      <div class="mobile-me-profile__avatar">
        {{ avatarText }}
      </div>
      <div class="mobile-me-profile__content">
        <h2 class="mobile-me-profile__name">{{ userStore.userInfo.nickname }}</h2>
        <p class="mobile-me-profile__account">{{ userStore.userInfo.username }}</p>
      </div>
    </section>

    <section class="mobile-panel mobile-me-shortcuts">
      <div class="mobile-me-shortcuts__header">
        <h3 class="mobile-section-title">常用功能</h3>
      </div>
      <div class="mobile-me-shortcuts__grid">
        <button
          v-for="item in shortcutItems"
          :key="item.path"
          type="button"
          class="mobile-me-shortcuts__item"
          @click="handleShortcutClick(item.path)"
        >
          <span class="mobile-me-shortcuts__icon">
            <BookkeepingSubjectIcon :icon="shortcutIconMap[item.path]" mode="mobile" :size="24" />
          </span>
          <strong class="mobile-me-shortcuts__title">{{ item.title }}</strong>
        </button>
      </div>
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
        title="切换账户"
        arrow
        bordered
        @click="handleSwitchAccount"
      >
        <template #leftIcon>
          <span class="mobile-me-action-icon">
            <GiSvgIcon name="swap" :size="18" color="#7a4f00" />
          </span>
        </template>
      </t-cell>
      <t-cell
        title="退出登录"
        note=""
        arrow
        bordered
        @click="handleLogout"
      >
        <template #leftIcon>
          <span class="mobile-me-action-icon is-danger">
            <GiSvgIcon name="poweroff" :size="18" color="#8f2d1a" />
          </span>
        </template>
      </t-cell>
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
            <t-input
              v-model.trim="verifyPassword"
              class="mobile-me__password-input"
              type="password"
              :maxlength="32"
              placeholder="请输入隐私密码"
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
            <t-input
              v-model.trim="setupForm.password"
              class="mobile-me__password-input"
              type="password"
              :maxlength="32"
              placeholder="请输入新密码"
            />
          </div>

          <div class="mobile-field">
            <label class="mobile-field__label">确认密码</label>
            <t-input
              v-model.trim="setupForm.confirmPassword"
              class="mobile-me__password-input"
              type="password"
              :maxlength="32"
              placeholder="请再次输入密码"
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
import { computed, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ActionSheetPlugin, Toast } from 'tdesign-mobile-vue'
import { MOBILE_DISPLAY_VERSION } from '@/config/app-version'
import BookkeepingSubjectIcon from '@/components/BookkeepingSubjectIcon/index.vue'
import GiSvgIcon from '@/components/GiSvgIcon/index.vue'
import { usePrivacyStore, useUserStore } from '@/stores'
import { usePrivacyEntry } from '@/views/bookkeeping/shared/usePrivacyEntry'
import { listSwitchableAccounts, type SwitchableAccount } from '@/apis/bookkeeping/follow'

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

const shortcutItems = [
  { title: '明细管理', path: '/m/bookkeeping/detail' },
  { title: '报表中心', path: '/m/report' },
  { title: '账单管理', path: '/m/bill' },
] as const

const shortcutIconMap = {
  '/m/bookkeeping/detail': 'storage',
  '/m/report': 'project',
  '/m/bill': 'income',
} as const

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

const handleShortcutClick = (path: string) => {
  router.push(path)
}

const handleSwitchAccount = async () => {
  let accounts: SwitchableAccount[] = []

  try {
    const { data } = await listSwitchableAccounts()
    accounts = data ?? []
  } catch (error) {
    Toast.error('查询失败')
    return
  }

  if (accounts.length === 0) {
    Toast('暂无可切换的账户')
    return
  }

  ActionSheetPlugin.show({
    cancelText: '取消',
    description: '请选择要切换的账户',
    items: accounts.map(account => ({
      label: account.nickname,
      description: `@${account.username}`,
    })),
    onSelected: (_, index) => {
      const selectedAccount = accounts[index]
      if (selectedAccount) {
        handleConfirmSwitch(selectedAccount)
      }
      ActionSheetPlugin.close()
    },
    onCancel: () => {
      ActionSheetPlugin.close()
    },
    onClose: (trigger: { trigger?: string }) => {
      if (trigger?.trigger === 'overlay') {
        ActionSheetPlugin.close(trigger)
      }
    },
  })
}

const handleConfirmSwitch = async (account: SwitchableAccount) => {
  try {
    Toast.loading('切换中...')
    await userStore.entryLogin(account.entryKey, { persist: false })
    Toast.success('切换成功')
    setTimeout(() => {
      window.location.reload()
    }, 500)
  } catch (error) {
    Toast.error('切换失败')
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
  padding: 0 0 28px;

  :deep(.mobile-panel) {
    margin-left: 0;
    margin-right: 0;
    border-radius: 0;
    border-left: none;
    border-right: none;
  }
}

.mobile-me-profile {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 16px;
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

.mobile-me-actions {
  margin-top: 14px;
  padding: 18px 16px;
}

.mobile-me-shortcuts {
  margin-top: 14px;
  padding: 18px 16px;
}

.mobile-me-shortcuts__header {
  margin-bottom: 14px;
}

.mobile-me-shortcuts__desc {
  margin: -6px 0 0;
  color: var(--color-text-3);
  font-size: 12px;
  line-height: 1.6;
}

.mobile-me-shortcuts__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.mobile-me-shortcuts__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 10px 14px;
  border: 1px solid rgba(143, 99, 17, 0.08);
  border-radius: 20px;
  background: rgba(255, 252, 244, 0.86);
  color: var(--color-text-1);
  text-align: center;
}

.mobile-me-shortcuts__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 16px;
  background: linear-gradient(135deg, #ffd764 0%, #e1ad24 100%);
  box-shadow: 0 8px 18px rgba(197, 138, 18, 0.16);
  color: #7a4f00;
}

.mobile-me-shortcuts__icon :deep(.t-icon),
.mobile-me-shortcuts__icon :deep(.svg-icon) {
  font-size: 24px;
}

.mobile-me-shortcuts__title {
  color: var(--color-text-1);
  font-size: 14px;
  line-height: 1.4;
}

.mobile-me-actions :deep(.t-cell) {
  background: rgba(255, 252, 244, 0.8);
  border-color: rgba(143, 99, 17, 0.08);
}

.mobile-me-actions :deep(.t-cell__left),
.mobile-me-actions :deep(.t-cell__left-icon),
.mobile-me-actions :deep(.t-cell__title),
.mobile-me-actions :deep(.t-cell__title-text) {
  display: flex;
  align-items: center;
}

.mobile-me-action-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  background: transparent;
}

.mobile-me-action-icon :deep(.svg-icon) {
  display: block;
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

:deep(.mobile-me__password-input.t-input) {
  min-height: 48px;
  padding: 0 14px;
  border: 1px solid rgba(146, 97, 0, 0.14);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.72);
}

.mobile-me__password-input :deep(.t-input__wrap),
.mobile-me__password-input :deep(.t-input__content) {
  align-items: center;
}

.mobile-me__password-input :deep(.t-input__control) {
  color: #4c3200;
  font-size: 15px;
}

.mobile-me__password-input :deep(.t-input__control::placeholder) {
  color: #a07f32;
}

:deep(.mobile-me__password-input.t-input.t-is-focused) {
  border-color: rgba(197, 138, 18, 0.4);
  box-shadow:
    0 0 0 4px rgba(197, 138, 18, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.72);
}

@media (max-width: 420px) {
  .mobile-me-shortcuts__grid {
    gap: 8px;
  }

  .mobile-me-shortcuts__item {
    padding-inline: 8px;
  }
}
</style>
