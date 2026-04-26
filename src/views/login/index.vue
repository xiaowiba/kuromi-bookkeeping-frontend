<template>
  <div class="login pc" :class="{ 'login--dark': isDark }">
    <div class="login-hero">
      <LoginHeroBanner class="login-banner" />
    </div>

    <div class="login-box">
      <div class="login-right">
        <div class="login-right__brand">
          <img v-if="logo" :src="logo" alt="logo" />
          <img v-else src="/logo.svg" alt="logo" />
          <span>{{ title }}</span>
        </div>
        <h3 v-if="isEmailLogin" class="login-right__title">邮箱登录</h3>
        <EmailLogin v-if="isEmailLogin" />
        <a-tabs v-else v-model:activeKey="activeTab" class="login-right__form">
          <a-tab-pane key="1" title="账号登录">
            <component :is="AccountLogin" v-if="activeTab === '1'" />
          </a-tab-pane>
          <!-- a-tab-pane key="2" title="手机号登录">
            <component :is="PhoneLogin" v-if="activeTab === '2'" />
          </a-tab-pane -->
        </a-tabs>
        <div v-if="false" class="login-right__oauth">
          <a-divider orientation="center">其他登录方式</a-divider>
          <div class="list">
            <div v-if="isEmailLogin" class="mode item" @click="toggleLoginMode"><icon-user /> 账号/手机号登录</div>
            <div v-else class="mode item" @click="toggleLoginMode"><icon-email /> 邮箱登录</div>
            <a class="item" title="使用 Gitee 账号登录" @click="onOauth('gitee')">
              <GiSvgIcon name="gitee" :size="24" />
            </a>
            <a class="item" title="使用 GitHub 账号登录" @click="onOauth('github')">
              <GiSvgIcon name="github" :size="24" />
            </a>
            <a class="item" title="使用微信账号登录" @click="onOauth('wechat_open')">
              <GiSvgIcon name="wechat" :size="24" />
            </a>
          </div>
        </div>
        <div class="login-right__copyright">{{ copyrightText }}</div>
      </div>
    </div>

    <div v-if="false" class="footer">
      <div class="beian">
        <div class="below text">{{ appStore.getCopyright() }}{{ appStore.getForRecord() ? ` · ${appStore.getForRecord()}` : '' }}</div>
      </div>
    </div>

    <GiThemeBtn class="theme-btn" />
    <Background />
  </div>

  <div class="login h5" :class="{ 'login--dark': isDark }">
    <div class="login-logo">
      <img v-if="logo" :src="logo" alt="logo" />
      <img v-else src="/logo.svg" alt="logo" />
      <span>{{ title }}</span>
    </div>
    <a-row align="stretch" class="login-box">
      <a-col :xs="24" :sm="12" :md="11">
        <div class="login-right">
          <h3 v-if="isEmailLogin" class="login-right__title">邮箱登录</h3>
          <EmailLogin v-if="isEmailLogin" />
          <a-tabs v-else v-model:activeKey="activeTab" class="login-right__form">
            <a-tab-pane key="1" title="账号登录">
              <component :is="AccountLogin" v-if="activeTab === '1'" />
            </a-tab-pane>
            <!-- a-tab-pane key="2" title="手机号登录">
              <component :is="PhoneLogin" v-if="activeTab === '2'" />
            </a-tab-pane -->
          </a-tabs>
          <div class="login-right__copyright">{{ copyrightText }}</div>
        </div>
      </a-col>
    </a-row>
    <div v-show="false" class="login-right__oauth">
      <a-divider orientation="center">其他登录方式</a-divider>
      <div class="list">
        <div v-if="isEmailLogin" class="mode item" @click="toggleLoginMode"><icon-user /> 账号/手机号登录</div>
        <div v-else class="mode item" @click="toggleLoginMode"><icon-email /> 邮箱登录</div>
        <a class="item" title="使用 Gitee 账号登录" @click="onOauth('gitee')">
          <GiSvgIcon name="gitee" :size="24" />
        </a>
        <a class="item" title="使用 GitHub 账号登录" @click="onOauth('github')">
          <GiSvgIcon name="github" :size="24" />
        </a>
        <a class="item" title="使用微信账号登录" @click="onOauth('wechat_open')">
          <GiSvgIcon name="wechat" :size="24" />
        </a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import Background from './components/background/index.vue'
import AccountLogin from './components/account/index.vue'
import PhoneLogin from './components/phone/index.vue'
import EmailLogin from './components/email/index.vue'
import LoginHeroBanner from './components/LoginHeroBanner.vue'
import { socialAuth } from '@/apis/auth'
import { useAppStore } from '@/stores'
import { useTenantStore } from '@/stores/modules/tenant'
import { getTenantIdByDomain, getTenantStatus } from '@/apis'

defineOptions({ name: 'Login' })

/**
 * 登录页
 * @author Wangsongsong
 * @date 2026-03-23
 * @update 2026-03-23 @Wangsongsong
 * @desc 修复登录页中文乱码，并保留生产环境构建后的桌面端与移动端样式隔离方案
 * @update 2026-03-23 @Wangsongsong
 * @desc 统一登录页黄色调视觉，收敛标签页、容器与交互状态中的蓝色样式
 */
const appStore = useAppStore()
const tenantStore = useTenantStore()

const title = computed(() => appStore.getTitle())
const logo = computed(() => appStore.getLogo())
const copyrightText = computed(() => `${appStore.getCopyright()}${appStore.getForRecord() ? ` | ${appStore.getForRecord()}` : ''}`)
const isDark = computed(() => appStore.theme === 'dark')

const isEmailLogin = ref(false)
const activeTab = ref('1')

// 切换登录模式
const toggleLoginMode = () => {
  isEmailLogin.value = !isEmailLogin.value
}

// 第三方登录授权
const onOauth = async (source: string) => {
  const { data } = await socialAuth(source)
  window.location.href = data.authorizeUrl
}

// 查询租户状态和租户编码
const onGetTenant = async () => {
  const { data } = await getTenantStatus()
  tenantStore.setTenantEnable(data)
  // 开启租户 根据地址(域名)查询租户code
  if (data) {
    const domain = window.location.hostname
    const { data: tenantId } = await getTenantIdByDomain(domain)
    tenantStore.setTenantId(tenantId)
  }
}
onMounted(() => {
  onGetTenant()
})
</script>

<style scoped lang="scss">
.login {
  --login-accent: #d8a117;
  --login-accent-hover: #c58a12;
  --login-accent-deep: #8b5e00;
  --login-accent-soft: rgba(216, 161, 23, 0.14);
  --login-accent-border: rgba(197, 138, 18, 0.2);
  --login-surface: rgba(255, 252, 244, 0.96);
  --login-surface-soft: #fff8e6;
  --login-shadow: 0 16px 42px rgba(130, 90, 22, 0.12);
  --login-card-shadow:
    0 28PX 60PX rgba(130, 90, 22, 0.16),
    0 8PX 18PX rgba(130, 90, 22, 0.06);
  --login-input-shadow: 0 8px 20px rgba(130, 90, 22, 0.06);
  --login-focus-ring: 0 0 0 3px rgba(216, 161, 23, 0.14);
  --login-page-bg:
    radial-gradient(circle at top left, rgba(255, 224, 130, 0.24) 0%, transparent 34%),
    linear-gradient(180deg, #fffaf0 0%, #f7f0e3 100%);
  --login-page-bg-mobile:
    radial-gradient(circle at top left, rgba(255, 223, 120, 0.34) 0%, transparent 38%),
    linear-gradient(180deg, #fffaf0 0%, #f8f1e4 100%);
  --login-mobile-hero-bg:
    linear-gradient(120deg, rgba(255, 248, 225, 0.94) 0%, rgba(255, 220, 124, 0.44) 100%),
    url('/src/assets/images/login_h5.jpg');
  --login-mobile-header-shadow: inset 0 -1PX 0 rgba(197, 138, 18, 0.12);
  --login-text-main: #121314;
  --login-text-secondary: rgba(110, 89, 50, 0.72);
  --login-placeholder: rgba(110, 89, 50, 0.56);
  --login-input-hover-bg: #fffdf5;
  --login-button-text: #6a4300;
  --login-button-bg: linear-gradient(135deg, #ffe082 0%, #f6c33f 100%);
  --login-button-bg-hover: linear-gradient(135deg, #ffe7a6 0%, #f8cb58 100%);
  --login-button-bg-active: linear-gradient(135deg, #f7d56f 0%, #e8b62b 100%);
  --login-button-shadow: 0 12px 24px rgba(197, 138, 18, 0.22);
  --login-button-shadow-hover: 0 14px 28px rgba(197, 138, 18, 0.28);
  --login-page-blend: #f7f0e3;
}

.login--dark {
  --login-accent: #f0c65a;
  --login-accent-hover: #ffd97a;
  --login-accent-deep: #f6dda0;
  --login-accent-soft: rgba(240, 198, 90, 0.16);
  --login-accent-border: rgba(240, 198, 90, 0.24);
  --login-surface: rgba(24, 26, 31, 0.92);
  --login-surface-soft: rgba(255, 223, 141, 0.08);
  --login-shadow: 0 16px 42px rgba(0, 0, 0, 0.26);
  --login-card-shadow:
    0 28PX 60PX rgba(0, 0, 0, 0.42),
    0 8PX 18PX rgba(0, 0, 0, 0.24);
  --login-input-shadow: 0 10px 24px rgba(0, 0, 0, 0.22);
  --login-focus-ring: 0 0 0 3px rgba(240, 198, 90, 0.16);
  --login-page-bg:
    radial-gradient(circle at top left, rgba(240, 198, 90, 0.12) 0%, transparent 34%),
    linear-gradient(180deg, #17191f 0%, #101116 100%);
  --login-page-bg-mobile:
    radial-gradient(circle at top left, rgba(240, 198, 90, 0.16) 0%, transparent 40%),
    linear-gradient(180deg, #17191f 0%, #101116 100%);
  --login-mobile-hero-bg:
    linear-gradient(120deg, rgba(34, 29, 18, 0.92) 0%, rgba(93, 70, 18, 0.5) 100%),
    url('/src/assets/images/login_h5.jpg');
  --login-mobile-header-shadow: inset 0 -1PX 0 rgba(240, 198, 90, 0.16);
  --login-text-main: #f6f3eb;
  --login-text-secondary: rgba(236, 225, 190, 0.72);
  --login-placeholder: rgba(236, 225, 190, 0.42);
  --login-input-hover-bg: rgba(255, 223, 141, 0.12);
  --login-button-text: #2f2207;
  --login-button-bg: linear-gradient(135deg, #f5d47a 0%, #dca632 100%);
  --login-button-bg-hover: linear-gradient(135deg, #f8dea0 0%, #e6b64d 100%);
  --login-button-bg-active: linear-gradient(135deg, #e8c45e 0%, #c89326 100%);
  --login-button-shadow: 0 12px 24px rgba(0, 0, 0, 0.32);
  --login-button-shadow-hover: 0 14px 28px rgba(0, 0, 0, 0.38);
  --login-page-blend: #101116;
}

@media screen and (max-width: 570PX) {
  .pc {
    display: none !important;
    background-color: white !important;
  }

  .login {
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: start;
    align-items: center;
    background: var(--login-page-bg-mobile);
    color: var(--login-text-main);

    &-logo {
      width: 100%;
      height: 104PX;
      font-weight: 700;
      font-size: 20PX;
      line-height: 32PX;
      display: flex;
      padding: 0 20PX;
      align-items: center;
      justify-content: start;
      color: var(--login-text-main);
      background-image: var(--login-mobile-hero-bg);
      background-size: 100% 100%;
      background-position: center;
      box-sizing: border-box;
      box-shadow: var(--login-mobile-header-shadow);

      img {
        width: 34PX;
        height: 34PX;
        margin-right: 8PX;
      }
    }

    &-box {
      width: 100%;
      display: flex;
      z-index: 999;
    }
  }

  .login-right {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    padding: 30PX 30PX 0;
    box-sizing: border-box;

    &__title {
      color: var(--login-accent-deep);
      font-weight: 700;
      font-size: 20PX;
      line-height: 32PX;
      margin-bottom: 20PX;
    }

    &__form {
      :deep(.arco-tabs-nav) {
        margin-bottom: 4PX;
      }

      :deep(.arco-tabs-nav-tab) {
        display: flex;
        justify-content: start;
        align-items: center;
      }

      :deep(.arco-tabs-tab) {
        color: var(--color-text-2);
        margin: 0 20PX 0 0;
        transition: color 0.2s ease;
      }

      :deep(.arco-tabs-tab-title) {
        font-size: 16PX;
        font-weight: 500;
        line-height: 22PX;
      }

      :deep(.arco-tabs-nav-ink) {
        height: 3PX;
        border-radius: 999PX;
        background: linear-gradient(90deg, #e7b62f 0%, #c58a12 100%);
      }

      :deep(.arco-tabs-content) {
        margin-top: 10PX;
      }

      :deep(.arco-tabs-tab-active),
      :deep(.arco-tabs-tab-title:hover) {
        color: var(--login-accent-deep);
      }

      :deep(.arco-tabs-tab-active .arco-tabs-tab-title) {
        font-weight: 700;
      }

      :deep(.arco-tabs-nav::before) {
        display: none;
      }

      :deep(.arco-tabs-tab-title:before) {
        display: none;
      }
    }

    &__oauth {
      width: 100%;
      position: fixed;
      bottom: 0;
      left: 0;
      padding-bottom: 20PX;

      // margin-top: auto;
      // margin-bottom: 20PX;
      :deep(.arco-divider-text) {
        color: var(--color-text-4);
        font-size: 12PX;
        font-weight: 400;
        line-height: 20PX;
      }

      .list {
        align-items: center;
        display: flex;
        justify-content: center;
        width: 100%;

        .item {
          margin-right: 15PX;
        }

        .mode {
          color: var(--color-text-2);
          font-size: 12PX;
          font-weight: 400;
          line-height: 20PX;
          padding: 6PX 10PX;
          align-items: center;
          border: 1PX solid var(--color-border-3);
          border-radius: 32PX;
          box-sizing: border-box;
          display: flex;
          height: 32PX;
          justify-content: center;
          cursor: pointer;

          .icon {
            width: 21PX;
            height: 20PX;
          }
        }

        .mode svg {
          font-size: 16PX;
          margin-right: 10PX;
        }

        .mode:hover,
        .mode svg:hover {
          background: var(--login-accent-soft);
          border: 1PX solid rgba(197, 138, 18, 0.28);
          color: var(--login-accent-deep);
        }
      }
    }

    &__copyright {
      margin-top: 20PX;
      color: var(--login-text-secondary);
      font-size: 12PX;
      line-height: 20PX;
      text-align: center;
      word-break: break-word;
    }
  }

  .theme-btn {
    position: fixed;
    top: 20PX;
    right: 30PX;
    z-index: 999;
  }

  // 新增弹窗层级设置
  .arco-modal-wrapper {
    z-index: 1000;
  }

  .footer {
    align-items: center;
    box-sizing: border-box;
    position: absolute;
    bottom: 10PX;
    z-index: 999;

    .beian {
      .text {
        font-size: 12PX;
        font-weight: 400;
        letter-spacing: 0.2PX;
        line-height: 20PX;
        text-align: center;
      }

      .below {
        align-items: center;
        display: flex;
      }
    }
  }
}

@media screen and (min-width: 571PX) {
  .h5 {
    display: none !important;
  }

  .login {
    position: relative;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: stretch;
    overflow: hidden;
    background: var(--login-page-bg);

    &-box {
      position: relative;
      z-index: 20;
      width: min(92%, 460PX);
      margin: clamp(16PX, 3vh, 28PX) auto 0;
      overflow: visible;
      display: flex;
    }
  }

  .login-hero {
    position: relative;
    z-index: 5;
    width: 100%;
    flex: none;
  }

  .login-banner {
    position: relative;
    display: block;
    width: 100%;
  }

  .login-right {
    width: 100%;
    min-height: 0;
    background: var(--login-surface);
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 34PX 36PX 28PX;
    box-sizing: border-box;
    border: 1PX solid var(--login-accent-border);
    border-radius: 30PX;
    box-shadow: var(--login-card-shadow);
    backdrop-filter: blur(14px);

    &__brand {
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 22PX;
      color: var(--login-accent-deep);
      font-size: 20PX;
      font-weight: 700;
      line-height: 32PX;
      text-align: center;

      img {
        width: 34PX;
        height: 34PX;
        margin-right: 8PX;
        flex: none;
        object-fit: contain;
      }

      span {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }

    &__title {
      color: var(--login-accent-deep);
      font-weight: 700;
      font-size: 20PX;
      line-height: 32PX;
      margin-bottom: 20PX;
    }

    &__form {
      :deep(.arco-tabs-nav) {
        margin-bottom: 4PX;
      }

      :deep(.arco-tabs-nav-tab) {
        display: flex;
        justify-content: center;
        align-items: center;
      }

      :deep(.arco-tabs-tab) {
        color: var(--color-text-2);
        transition: color 0.2s ease;
      }

      :deep(.arco-tabs-tab-title) {
        font-size: 16PX;
        font-weight: 500;
        line-height: 22PX;
      }

      :deep(.arco-tabs-nav-ink) {
        height: 3PX;
        border-radius: 999PX;
        background: linear-gradient(90deg, #e7b62f 0%, #c58a12 100%);
      }

      :deep(.arco-tabs-content) {
        margin-top: 10PX;
      }

      :deep(.arco-tabs-tab-active),
      :deep(.arco-tabs-tab-title:hover) {
        color: var(--login-accent-deep);
      }

      :deep(.arco-tabs-tab-active .arco-tabs-tab-title) {
        font-weight: 700;
      }

      :deep(.arco-tabs-nav::before) {
        display: none;
      }

      :deep(.arco-tabs-tab-title:before) {
        display: none;
      }
    }

    &__oauth {
      margin-top: auto;
      margin-bottom: 20PX;

      :deep(.arco-divider-text) {
        color: var(--color-text-4);
        font-size: 12PX;
        font-weight: 400;
        line-height: 20PX;
      }

      .list {
        align-items: center;
        display: flex;
        justify-content: center;
        width: 100%;

        .item {
          margin-right: 15PX;
        }

        .mode {
          color: var(--color-text-2);
          font-size: 12PX;
          font-weight: 400;
          line-height: 20PX;
          padding: 6PX 10PX;
          align-items: center;
          border: 1PX solid var(--color-border-3);
          border-radius: 32PX;
          box-sizing: border-box;
          display: flex;
          height: 32PX;
          justify-content: center;
          cursor: pointer;

          .icon {
            width: 21PX;
            height: 20PX;
          }
        }

        .mode svg {
          font-size: 16PX;
          margin-right: 10PX;
        }

        .mode:hover {
          background: var(--login-accent-soft);
          border: 1PX solid rgba(197, 138, 18, 0.28);
          color: var(--login-accent-deep);
        }
      }
    }

    &__copyright {
      margin-top: 20PX;
      color: var(--login-text-secondary);
      font-size: 12PX;
      line-height: 20PX;
      text-align: center;
      word-break: break-word;
    }
  }

  .theme-btn {
    position: fixed;
    top: 20PX;
    right: 30PX;
    z-index: 30;
  }

  // 新增弹窗层级设置
  .arco-modal-wrapper {
    z-index: 1000;
  }

  .footer {
    align-items: center;
    box-sizing: border-box;
    position: absolute;
    bottom: 10PX;
    z-index: 30;

    .beian {
      .text {
        font-size: 12PX;
        font-weight: 400;
        letter-spacing: 0.2PX;
        line-height: 20PX;
        text-align: center;
      }

      .below {
        align-items: center;
        display: flex;
      }
    }
  }
}
</style>
