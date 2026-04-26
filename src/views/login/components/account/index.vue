<template>
  <a-form
    ref="formRef"
    :model="form"
    :rules="rules"
    :label-col-style="{ display: 'none' }"
    :wrapper-col-style="{ flex: 1 }"
    size="large"
    @submit="handleLogin"
  >
    <a-form-item v-if="tenantStore.needInputTenantCode" field="tenantCode" hide-label>
      <a-input v-model="tenantCode" placeholder="请输入租户编码（不输入时为默认租户）" allow-clear />
    </a-form-item>
    <a-form-item field="username" hide-label>
      <a-input v-model="form.username" placeholder="请输入用户名" allow-clear />
    </a-form-item>
    <a-form-item field="password" hide-label>
      <a-input-password v-model="form.password" placeholder="请输入密码" />
    </a-form-item>
    <a-form-item v-if="isCaptchaEnabled" field="captcha" hide-label>
      <a-input v-model="form.captcha" placeholder="请输入验证码" :max-length="4" allow-clear style="flex: 1 1" />
      <div class="captcha-container" @click="getCaptcha">
        <img :src="captchaImgBase64" alt="验证码" class="captcha" />
        <div v-if="form.expired" class="overlay">
          <p>已过期，请刷新</p>
        </div>
      </div>
    </a-form-item>
    <a-form-item>
      <a-row justify="space-between" align="center" class="w-full">
        <a-checkbox v-model="loginConfig.rememberMe">记住我</a-checkbox>
        <a-link v-show="false">忘记密码</a-link>
      </a-row>
    </a-form-item>
    <a-form-item>
      <a-space direction="vertical" fill class="w-full">
        <a-button class="btn" type="primary" :loading="loading" html-type="submit" size="large" long>立即登录</a-button>
      </a-space>
    </a-form-item>
  </a-form>
</template>

<script setup lang="ts">
import { type FormInstance, Message } from '@arco-design/web-vue'
import { useStorage } from '@vueuse/core'
import { useRoute } from 'vue-router'
import { getImageCaptcha } from '@/apis/common'
import { getDefaultTerminalHomePath, resolveTerminalTargetPath } from '@/router/terminal'
import { useTabsStore, useTenantStore, useUserStore } from '@/stores'
import { encryptByRsa } from '@/utils/encrypt'

const loginConfig = useStorage('login-config', {
  rememberMe: true,
  username: '', // 演示默认值
  password: '', // 演示默认值
  // username: debug ? 'admin' : '', // 演示默认值
  // password: debug ? 'admin123' : '', // 演示默认值
})
// 是否启用验证码（从后端配置动态获取）
const isCaptchaEnabled = ref(false)
// 验证码图片
const captchaImgBase64 = ref()
const tenantCode = ref()
const formRef = ref<FormInstance>()
const form = reactive({
  username: loginConfig.value.username,
  password: loginConfig.value.password,
  captcha: '',
  uuid: '',
  expired: false,
})
// 校验规则部分
const rules: FormInstance['rules'] = {
  username: [{ required: true, message: '请输入用户名' }],
  password: [{ required: true, message: '请输入密码' }],
  captcha: [{ required: false, message: '请输入验证码' }],
}

watch(isCaptchaEnabled, (value) => {
  rules.captcha = [{ required: value, message: '请输入验证码' }]
}, { immediate: true })

// 验证码过期定时器
let timer
const startTimer = (expireTime: number, curTime = Date.now()) => {
  if (timer) {
    clearTimeout(timer)
  }
  const remainingTime = expireTime - curTime
  if (remainingTime <= 0) {
    form.expired = true
    return
  }
  timer = setTimeout(() => {
    form.expired = true
  }, remainingTime)
}
// 组件销毁时清理定时器
onBeforeUnmount(() => {
  if (timer) {
    clearTimeout(timer)
  }
})

// 获取验证码
const getCaptcha = async () => {
  const res = await getImageCaptcha()
  const { uuid, img, expireTime, isEnabled } = res.data
  isCaptchaEnabled.value = isEnabled
  form.captcha = ''
  form.expired = false
  if (!isEnabled) {
    captchaImgBase64.value = undefined
    form.uuid = ''
    return
  }
  captchaImgBase64.value = img
  form.uuid = uuid
  startTimer(expireTime, Number(res.timestamp))
}

const tenantStore = useTenantStore()
const userStore = useUserStore()
const tabsStore = useTabsStore()
const router = useRouter()
const route = useRoute()
const loading = ref(false)

const navigateAfterLogin = async () => {
  tabsStore.reset()
  const { redirect, ...othersQuery } = router.currentRoute.value.query
  const { rememberMe } = loginConfig.value
  loginConfig.value.username = rememberMe ? form.username : ''

  if (redirect) {
    const redirectPath = decodeURIComponent(redirect as string)
    const resolvedRoute = router.resolve(redirectPath)
    const targetPath = resolveTerminalTargetPath(resolvedRoute.path) || resolvedRoute.path
    await router.push({
      path: targetPath,
      query: resolvedRoute.query,
      hash: resolvedRoute.hash,
    })
    return
  }

  await router.push({
    path: getDefaultTerminalHomePath(),
    query: {
      ...othersQuery,
    },
  })
}

const getHashEntryKey = () => {
  if (!route.hash) {
    return ''
  }
  return new URLSearchParams(route.hash.replace(/^#/, '')).get('entryKey') || ''
}

const clearHashEntryKey = async () => {
  if (!route.hash) {
    return
  }
  await router.replace({
    path: route.path,
    query: route.query,
    hash: '',
  })
}

/**
 * 执行账号密码登录
 */
const doAccountLogin = async () => {
  try {
    loading.value = true
    await userStore.accountLogin({
      username: form.username,
      password: encryptByRsa(form.password) || '',
      captcha: form.captcha,
      uuid: form.uuid,
    }, tenantCode.value)
    await navigateAfterLogin()
    Message.success('欢迎使用')
  } catch (error) {
    console.error(error)
    await getCaptcha()
  } finally {
    loading.value = false
  }
}

/**
 * 执行专属入口登录
 */
const doEntryLogin = async (entryKey: string, options?: { silent?: boolean }) => {
  try {
    loading.value = true
    await userStore.entryLogin(entryKey, { silent: options?.silent, persist: true })
    await clearHashEntryKey()
    await navigateAfterLogin()
    if (!options?.silent) {
      Message.success('欢迎使用')
    }
    return true
  } catch (error) {
    console.error(error)
    userStore.clearEntryLoginState()
    await clearHashEntryKey()
    await getCaptcha()
    return false
  } finally {
    loading.value = false
  }
}

const doStoredEntryLogin = async (options?: { silent?: boolean }) => {
  try {
    loading.value = true
    await userStore.restoreLoginByEntryKey({ silent: options?.silent })
    await navigateAfterLogin()
    return true
  } catch (error) {
    console.error(error)
    userStore.clearEntryLoginState()
    await getCaptcha()
    return false
  } finally {
    loading.value = false
  }
}

/**
 * 处理表单登录（用户手动点击按钮）
 */
const handleLogin = async () => {
  const isInvalid = await formRef.value?.validate()
  if (isInvalid) return
  await doAccountLogin()
}

onMounted(async () => {
  const hashEntryKey = getHashEntryKey()
  if (hashEntryKey) {
    await doEntryLogin(hashEntryKey)
    return
  }

  if (userStore.canEntryLogin()) {
    const restored = await doStoredEntryLogin({ silent: true })
    if (restored) {
      return
    }
  }

  await getCaptcha()
})
</script>

<style scoped lang="scss">
:deep(.arco-form-item) {
  margin-bottom: 18px;
}

.arco-input-wrapper,
:deep(.arco-select-view-single) {
  height: 40px;
  border-radius: 12px;
  font-size: 13px;
  background: var(--login-surface-soft, #fff8e6);
  border-color: var(--login-accent-border, rgba(197, 138, 18, 0.2));
  box-shadow: var(--login-input-shadow, 0 8px 20px rgba(130, 90, 22, 0.06));
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
}

.arco-input-wrapper.arco-input-error {
  background-color: rgb(var(--danger-1));
  border-color: rgb(var(--danger-3));
}

.arco-input-wrapper.arco-input-error:hover {
  background-color: rgb(var(--danger-1));
  border-color: rgb(var(--danger-6));
}

.arco-input-wrapper :deep(.arco-input) {
  font-size: 13px;
  color: var(--color-text-1);
}

.arco-input-wrapper :deep(.arco-input::placeholder) {
  color: var(--login-placeholder, rgba(110, 89, 50, 0.56));
}

.arco-input-wrapper:hover {
  border-color: var(--login-accent, #d8a117);
  background: var(--login-input-hover-bg, #fffdf5);
}

.captcha {
  width: 111px;
  height: 36px;
  margin: 0 0 0 5px;
}

.btn {
  height: 40px;
  border: none;
  border-radius: 12px;
  color: var(--login-button-text, #6a4300);
  font-weight: 700;
  letter-spacing: 0.04em;
  background: var(--login-button-bg, linear-gradient(135deg, #ffe082 0%, #f6c33f 100%));
  box-shadow: var(--login-button-shadow, 0 12px 24px rgba(197, 138, 18, 0.22));
}

.btn:hover {
  color: var(--login-button-text, #6a4300);
  background: var(--login-button-bg-hover, linear-gradient(135deg, #ffe7a6 0%, #f8cb58 100%));
  box-shadow: var(--login-button-shadow-hover, 0 14px 28px rgba(197, 138, 18, 0.28));
}

.btn:active {
  color: var(--login-button-text, #6a4300);
  background: var(--login-button-bg-active, linear-gradient(135deg, #f7d56f 0%, #e8b62b 100%));
}

:deep(.arco-checkbox-checked .arco-checkbox-icon),
:deep(.arco-checkbox-indeterminate .arco-checkbox-icon) {
  border-color: var(--login-accent, #d8a117);
  background-color: var(--login-accent, #d8a117);
}

:deep(.arco-checkbox:hover .arco-checkbox-icon),
:deep(.arco-checkbox:hover .arco-checkbox-label) {
  color: var(--login-accent-deep, #8b5e00);
  border-color: var(--login-accent, #d8a117);
}

:deep(.arco-form-item-status-error .arco-input-wrapper:not(.arco-input-disabled):hover) {
  border-color: rgb(var(--danger-6));
}

:deep(.arco-input-wrapper-focus),
:deep(.arco-input-wrapper.arco-input-focus) {
  border-color: var(--login-accent, #d8a117);
  background: var(--login-input-hover-bg, #fffdf5);
  box-shadow: var(--login-focus-ring, 0 0 0 3px rgba(216, 161, 23, 0.14));
}

:deep(.arco-input-wrapper .arco-input-suffix),
:deep(.arco-input-wrapper .arco-input-password-icon) {
  color: var(--login-text-secondary, rgba(110, 89, 50, 0.7));
}

.captcha-container {
  position: relative;
  display: flex;
  cursor: pointer;
  overflow: hidden;
  border-radius: 10px;
}

.overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(51, 51, 51, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
}

.overlay p {
  font-size: 12px;
  color: white;
}
</style>
