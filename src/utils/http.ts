import axios from 'axios'
import qs from 'query-string'
import type { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { useTenantStore } from '@/stores/modules/tenant'
import { useUserStore } from '@/stores'
import { getEntryLoginKey, getToken } from '@/utils/auth'
import authExpiredModal from '@/utils/auth-expired-modal'
import messageErrorWrapper from '@/utils/message-error-wrapper'
import notificationErrorWrapper from '@/utils/notification-error-wrapper'
import router from '@/router'

interface ICodeMessage {
  [propName: number]: string
}

interface RequestConfig extends AxiosRequestConfig {
  __entryRetried?: boolean
  __silentAuthError?: boolean
  __skipEntryRetry?: boolean
}

// 这两类 401 代表用户被明确下线，不能再走专属入口自动续登
const KICK_OUT_MSG = '您已被踢下线'
const BE_REPLACED_MSG = '您已被顶下线'

const StatusCodeMessage: ICodeMessage = {
  200: '服务器成功返回请求的数据',
  201: '新建或修改数据成功。',
  202: '一个请求已经进入后台排队（异步任务）',
  204: '删除数据成功',
  400: '请求错误(400)',
  401: '未授权，请重新登录(401)',
  403: '拒绝访问(403)',
  404: '请求出错(404)',
  408: '请求超时(408)',
  500: '服务器错误(500)',
  501: '服务未实现(501)',
  502: '网络错误(502)',
  503: '服务不可用(503)',
  504: '网络超时(504)',
}

const http: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_PREFIX ?? import.meta.env.VITE_API_BASE_URL,
  timeout: 30 * 1000,
})

let entryLoginRefreshing: Promise<boolean> | null = null
let authExpiredHandling = false

const handleError = (msg: string) => {
  if (msg.length >= 15) {
    return notificationErrorWrapper({
      content: msg || '服务器端错误',
      duration: 5 * 1000,
    })
  }
  return messageErrorWrapper({
    content: msg || '服务器端错误',
    duration: 5 * 1000,
  })
}

const isLoginEndpoint = (config?: RequestConfig) => {
  const url = config?.url || ''
  return url.includes('/auth/login') || url.includes('/auth/entry-login')
}

// 只要是被踢下线或被顶下线，就视为强制退出
const isForcedOfflineMessage = (msg?: string) => {
  return msg === KICK_OUT_MSG || msg === BE_REPLACED_MSG
}

// 专属入口静默续登只用于“正常过期”，不能拦截明确的强制下线场景
const canRetryByEntryLogin = (config?: RequestConfig, msg?: string) => {
  const url = config?.url || ''
  if (!config || config.__skipEntryRetry || config.__entryRetried || isForcedOfflineMessage(msg)) {
    return false
  }
  return !url.includes('/auth/login') && !url.includes('/auth/entry-login') && !url.includes('/auth/logout')
}

/**
 * 打开认证失效弹窗
 *
 * 根据场景区分为：
 * 1. 顶下线：保留专属入口重新登录与回登录页两个动作
 * 2. 踢下线：仅允许回登录页
 * 3. 普通过期：沿用单一回登录页动作
 *
 * @author Wangsongsong
 * @date 2026-08-28
 */
const openAuthExpiredModal = (options: {
  content: string
  entryKey?: string
  allowEntryLogin: boolean
  onEntryLogin: () => Promise<void> | void
  onBackToLogin: () => Promise<void> | void
}) => {
  const hasEntryLogin = options.allowEntryLogin && !!options.entryKey
  authExpiredModal({
    title: '提示',
    content: options.content,
    okText: hasEntryLogin ? '重新登录' : '回登录页',
    cancelText: '回登录页',
    hideCancel: !hasEntryLogin,
    async onOk() {
      if (hasEntryLogin) {
        await options.onEntryLogin()
        return
      }
      await options.onBackToLogin()
    },
    async onCancel() {
      await options.onBackToLogin()
    },
  })
}

/**
 * 处理认证失效弹窗
 *
 * 顶下线场景保留专属入口重新登录和回登录页两个动作；
 * 踢下线与普通认证失效场景仅允许回登录页。
 *
 * @author Wangsongsong
 * @date 2026-08-28
 * @update 2026-08-28 @Wangsongsong
 * @desc 拆分顶下线与踢下线的弹窗交互，避免强制退出时误走无感续登
 */
const handleAuthExpired = (msg: string) => {
  if (authExpiredHandling) {
    return
  }
  authExpiredHandling = true
  const userStore = useUserStore()
  const expiredPath = router.currentRoute.value.fullPath || '/'
  const entryKey = getEntryLoginKey()
  const canEntryLogin = userStore.canEntryLogin() && !!entryKey

  const redirectToLogin = async () => {
    const loginTarget = router.resolve({
      path: '/login',
      query: { redirect: expiredPath },
    }).fullPath
    try {
      await userStore.logoutCallBack()
    } finally {
      authExpiredHandling = false
    }
    window.location.replace(loginTarget)
  }

  const redirectToEntryLogin = async () => {
    // 必须在退出回调清理本地入口状态前生成地址，但使用已捕获的 key，确保快捷登录参数不丢失
    const loginTarget = router.resolve({
      path: '/login',
      query: { redirect: expiredPath },
      // Vue Router 的 hash 参数必须包含 #，否则会被错误拼接到 redirect 路径末尾
      hash: `#entryKey=${encodeURIComponent(entryKey || '')}`,
    }).fullPath
    try {
      await userStore.logoutCallBack()
    } finally {
      authExpiredHandling = false
    }
    window.location.replace(loginTarget)
  }

  if (msg === BE_REPLACED_MSG) {
    // 被顶下线时保留专属入口重新登录能力，用户可以主动接回当前账户
    openAuthExpiredModal({
      content: msg,
      entryKey: canEntryLogin ? entryKey : '',
      allowEntryLogin: true,
      onEntryLogin: redirectToEntryLogin,
      onBackToLogin: redirectToLogin,
    })
    return
  }

  // 被踢下线或普通认证过期时，按普通回登录页处理
  openAuthExpiredModal({
    content: msg,
    entryKey: '',
    allowEntryLogin: false,
    onEntryLogin: redirectToLogin,
    onBackToLogin: redirectToLogin,
  })
}

/**
 * 使用本地专属入口静默恢复登录
 *
 * @author Wangsongsong
 * @date 2026-08-28
 */
const tryRestoreByEntryLogin = async () => {
  const userStore = useUserStore()
  if (!userStore.canEntryLogin()) {
    return false
  }
  if (!entryLoginRefreshing) {
    entryLoginRefreshing = userStore.restoreLoginByEntryKey({ silent: true })
      .then(() => true)
      .catch(async () => {
        await userStore.logoutCallBack()
        return false
      })
      .finally(() => {
        entryLoginRefreshing = null
      })
  }
  return entryLoginRefreshing
}

// 请求拦截器
http.interceptors.request.use(
  (config: RequestConfig) => {
    const token = getToken()
    if (!config.headers) {
      config.headers = {}
    }
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    const tenantStore = useTenantStore()
    if (tenantStore.tenantEnabled && tenantStore.tenantId) {
      config.headers['X-Tenant-Id'] = tenantStore.tenantId
    }
    return config
  },
  (error) => Promise.reject(error),
)

// 响应拦截器
http.interceptors.response.use(
  async (response: AxiosResponse) => {
    const { data } = response
    const { success, code, msg } = data

    if (response.request.responseType === 'blob') {
      const contentType = data.type
      if (contentType.startsWith('application/json')) {
        const reader = new FileReader()
        reader.readAsText(data)
        reader.onload = () => {
          const { success, msg } = JSON.parse(reader.result as string)
          if (!success) {
            handleError(msg)
          }
        }
        return Promise.reject(msg)
      } else {
        return response
      }
    }

    if (success) {
      return response
    }

    const requestConfig = response.config as RequestConfig
    if (code === '401') {
      // 被踢下线时直接清理本地专属入口信息，避免继续保留可自动续登的痕迹
      // 被顶下线时要先保留 entryKey，供弹窗里的“重新登录”继续走无感登录
      if (msg === KICK_OUT_MSG) {
        const userStore = useUserStore()
        userStore.clearEntryLoginState()
      }
      if (canRetryByEntryLogin(requestConfig, msg)) {
        const restored = await tryRestoreByEntryLogin()
        if (restored) {
          requestConfig.__entryRetried = true
          return http.request(requestConfig)
        }
      }
      if (requestConfig.__silentAuthError) {
        return Promise.reject(new Error(msg || '认证已失效'))
      }
      if (isLoginEndpoint(requestConfig)) {
        handleError(msg)
      } else {
        handleAuthExpired(msg)
      }
    } else {
      handleError(msg)
    }
    return Promise.reject(new Error(msg || '服务器端错误'))
  },
  (error: AxiosError) => {
    if (!error.response) {
      handleError('网络连接失败，请检查您的网络')
      return Promise.reject(error)
    }
    const status = error.response?.status
    const errorMsg = StatusCodeMessage[status] || '服务器暂时未响应，请刷新页面并重试。若无法解决，请联系管理员'
    handleError(errorMsg)
    return Promise.reject(error)
  },
)

const request = async <T = unknown>(config: RequestConfig): Promise<ApiRes<T>> => {
  return http.request<T>(config)
    .then((res: AxiosResponse) => res.data)
    .catch((err: { msg: string }) => Promise.reject(err))
}

const requestNative = async <T = unknown>(config: RequestConfig): Promise<AxiosResponse> => {
  return http.request<T>(config)
    .then((res: AxiosResponse) => res)
    .catch((err: { msg: string }) => Promise.reject(err))
}

const createRequest = (method: string) => {
  return <T = any>(url: string, params?: object, config?: RequestConfig): Promise<ApiRes<T>> => {
    return request({
      method,
      url,
      [method === 'get' ? 'params' : 'data']: params,
      ...(method === 'get'
        ? {
            paramsSerializer: (obj) => qs.stringify(obj),
          }
        : {}),
      ...config,
    })
  }
}

const download = (url: string, params?: object, config?: RequestConfig): Promise<AxiosResponse> => {
  return requestNative({
    method: 'get',
    url,
    responseType: 'blob',
    params,
    paramsSerializer: (obj) => qs.stringify(obj),
    ...config,
  })
}

export default {
  get: createRequest('get'),
  post: createRequest('post'),
  put: createRequest('put'),
  patch: createRequest('patch'),
  del: createRequest('delete'),
  request,
  requestNative,
  download,
}
