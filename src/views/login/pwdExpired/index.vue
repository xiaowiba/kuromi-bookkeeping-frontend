<template>
  <div class="login pc">
    <h3 class="login-logo">
      <img v-if="logo" :src="logo" alt="logo" />
      <img v-else src="/logo.svg" alt="logo" />
      <span>{{ title }}</span>
    </h3>

    <a-row align="stretch" class="login-box">
      <a-col :xs="0" :sm="12" :md="13">
        <div class="login-left">
          <img class="login-left__img" src="@/assets/images/banner.png" alt="banner" />
        </div>
      </a-col>
      <a-col :xs="24" :sm="12" :md="11">
        <div class="login-right">
          <a-tabs class="login-right__form">
            <template #extra>
              <span style="color: red;">密码已过期，请修改密码</span>
            </template>
            <a-tab-pane key="1" title="密码修改">
              <span></span>
              <ModifyPassword />
            </a-tab-pane>
          </a-tabs>
        </div>
      </a-col>
    </a-row>

    <div class="footer">
      <div class="beian">
        <div class="below text">
          {{ copyrightText }}
        </div>
      </div>
    </div>

    <GiThemeBtn class="theme-btn" />
    <Background />
  </div>
  <div class="login h5">
    <div class="login-logo">
      <img v-if="logo" :src="logo" alt="logo" />
      <img v-else src="/logo.svg" alt="logo" />
      <span>{{ title }}</span>
    </div>
    <a-row align="stretch" class="login-box">
      <a-col :xs="24" :sm="12" :md="11">
        <div class="login-right">
          <a-tabs class="login-right__form">
            <template #extra>
              <span style="color: red;">密码已过期，请修改密码</span>
            </template>
            <a-tab-pane key="1" title="密码修改">
              <ModifyPassword />
            </a-tab-pane>
          </a-tabs>
        </div>
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import Background from '../components/background/index.vue'
import ModifyPassword from '../components/modifyPassword/index.vue'
import { useAppStore } from '@/stores'
import { APP_DISPLAY_VERSION } from '@/config/app-version'

defineOptions({ name: 'PwdExpired' })

/**
 * 密码过期页
 * @author Wangsongsong
 * @date 2026-03-23
 * @update 2026-03-23 @Wangsongsong
 * @desc 修复密码过期页中文乱码，并保留生产环境构建后的桌面端与移动端样式隔离方案
 */
const appStore = useAppStore()
const title = computed(() => appStore.getTitle())
const logo = computed(() => appStore.getLogo())
const copyrightText = computed(() => `${appStore.getCopyright()} ${APP_DISPLAY_VERSION}${appStore.getForRecord() ? ` · ${appStore.getForRecord()}` : ''}`)
</script>

<style scoped lang="scss">
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
        background-color: var(--color-bg-5);
        color: #121314;

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
            background-image: url('/src/assets/images/login_h5.jpg');
            background-size: 100% 100%;
            box-sizing: border-box;

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
            color: var(--color-text-1);
            font-weight: 500;
            font-size: 20PX;
            line-height: 32PX;
            margin-bottom: 20PX;
        }

        &__form {
            :deep(.arco-tabs-nav-tab) {
                display: flex;
                justify-content: start;
                align-items: center;
            }

            :deep(.arco-tabs-tab) {
                color: var(--color-text-2);
                margin: 0 20PX 0 0;
            }

            :deep(.arco-tabs-tab-title) {
                font-size: 16PX;
                font-weight: 500;
                line-height: 22PX;
            }

            :deep(.arco-tabs-content) {
                margin-top: 10PX;
            }

            :deep(.arco-tabs-tab-active),
            :deep(.arco-tabs-tab-title:hover) {
                color: rgb(var(--arcoblue-6));
            }

            :deep(.arco-tabs-nav::before) {
                display: none;
            }

            :deep(.arco-tabs-tab-title:before) {
                display: none;
            }
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
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        background-color: var(--color-bg-5);

        &-logo {
            position: fixed;
            top: 20PX;
            left: 30PX;
            z-index: 9999;
            color: var(--color-text-1);
            font-weight: 500;
            font-size: 20PX;
            line-height: 32PX;
            margin-bottom: 20PX;
            display: flex;
            justify-content: center;
            align-items: center;

            img {
                width: 34PX;
                height: 34PX;
                margin-right: 8PX;
            }
        }

        &-box {
            width: 86%;
            max-width: 850PX;
            display: flex;
            z-index: 999;
            box-shadow: 0 2PX 4PX 2PX rgba(0, 0, 0, 0.08);
        }
    }

    .login-left {
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        position: relative;
        overflow: hidden;
        background: linear-gradient(60deg, rgb(var(--primary-6)), rgb(var(--primary-3)));

        &__img {
            width: 100%;
            position: absolute;
            bottom: 0;
            right: 0;
            top: 50%;
            left: 50%;
            transform: translateX(-50%) translateY(-50%);
            transition: all 0.3s;
            object-fit: cover;
        }
    }

    .login-right {
        width: 100%;
        height: 100%;
        background: var(--color-bg-1);
        display: flex;
        flex-direction: column;
        padding: 30PX 30PX 0;
        box-sizing: border-box;

        &__title {
            color: var(--color-text-1);
            font-weight: 500;
            font-size: 20PX;
            line-height: 32PX;
            margin-bottom: 20PX;
        }

        &__form {
            :deep(.arco-tabs-nav-tab) {
                display: flex;
                // justify-content: center;
                align-items: center;
            }

            :deep(.arco-tabs-tab) {
                color: var(--color-text-2);
            }

            :deep(.arco-tabs-tab-title) {
                font-size: 16PX;
                font-weight: 500;
                line-height: 22PX;
            }

            :deep(.arco-tabs-content) {
                margin-top: 10PX;
            }

            :deep(.arco-tabs-tab-active),
            :deep(.arco-tabs-tab-title:hover) {
                color: rgb(var(--arcoblue-6));
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

                .mode:hover,
                .mode svg:hover {
                    background: rgba(var(--primary-6), 0.05);
                    border: 1PX solid rgb(var(--primary-3));
                    color: rgb(var(--arcoblue-6));
                }
            }
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
</style>
