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
  captcha: [{ required: isCaptchaEnabled.value, message: '请输入验证码' }],
}

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
const getCaptcha = () => {
  if (isCaptchaEnabled.value) {
    return getImageCaptcha().then((res) => {
      const { uuid, img, expireTime, isEnabled } = res.data
      isCaptchaEnabled.value = isEnabled
      captchaImgBase64.value = img
      form.uuid = uuid
      form.expired = false
      startTimer(expireTime, Number(res.timestamp))
    })
  } else {
    console.error('未开启验证码')
  }
}

const tenantStore = useTenantStore()
const userStore = useUserStore()
const tabsStore = useTabsStore()
const router = useRouter()
const route = useRoute()
const loading = ref(false)

/**
 * 执行登录请求
 */
const doLogin = async () => {
  try {
    loading.value = true
    await userStore.accountLogin({
      username: form.username,
      password: encryptByRsa(form.password) || '',
      captcha: form.captcha,
      uuid: form.uuid,
    }, tenantCode.value)
    tabsStore.reset()
    const { redirect, ...othersQuery } = router.currentRoute.value.query
    const { rememberMe } = loginConfig.value
    loginConfig.value.username = rememberMe ? form.username : ''

    // 如果有重定向参数，解码并直接跳转到完整路径
    if (redirect) {
      const redirectPath = decodeURIComponent(redirect as string)
      await router.push(redirectPath)
    } else {
      await router.push({
        path: '/',
        query: {
          ...othersQuery,
        },
      })
    }
    Message.success('欢迎使用')
  } catch (error) {
    console.error(error)
    await getCaptcha()
    form.captcha = ''
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
  await doLogin()
}

/**
 * 从 URL 参数获取账号密码并自动登录
 * 使用场景：内部人员通过链接快速登录，如 http://localhost:5173/login?username=ChangWei&password=Qw5211314!
 */
const autoLoginFromQuery = async () => {
  const { username, password } = route.query
  // 只有当用户名和密码都存在时才执行自动登录
  if (!username || !password) return

  form.username = String(username)
  form.password = String(password)
  // 先获取验证码（无论是否启用，确保后续流程正常）
  await getCaptcha()
  await doLogin()
}

onMounted(async () => {
  // 如果有 URL 参数则自动登录，否则只加载验证码
  if (route.query.username && route.query.password) {
    await autoLoginFromQuery()
  } else {
    await getCaptcha()
  }
})
</script>

<style scoped lang="scss">
.arco-input-wrapper,
:deep(.arco-select-view-single) {
  height: 40px;
  border-radius: 4px;
  font-size: 13px;
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

.arco-input-wrapper:hover {
  border-color: rgb(var(--arcoblue-6));
}

.captcha {
  width: 111px;
  height: 36px;
  margin: 0 0 0 5px;
}

.btn {
  height: 40px;
}

.captcha-container {
  position: relative;
  display: flex;
  cursor: pointer;
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
