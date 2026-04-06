import axios from 'axios'
import qs from 'query-string'
import type { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { useTenantStore } from '@/stores/modules/tenant'
import { useUserStore } from '@/stores'
import { getToken } from '@/utils/auth'
import modalErrorWrapper from '@/utils/modal-error-wrapper'
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

const handleAuthExpired = (msg: string) => {
  if (authExpiredHandling) {
    return
  }
  authExpiredHandling = true
  modalErrorWrapper({
    title: '提示',
    content: msg,
    maskClosable: false,
    escToClose: false,
    okText: '重新登录',
    async onOk() {
      try {
        const expiredPath = router.currentRoute.value.fullPath || '/'
        const userStore = useUserStore()
        await userStore.logoutCallBack()
        const loginTarget = router.resolve({
          path: '/login',
          query: { redirect: expiredPath },
        }).fullPath
        window.location.replace(loginTarget)
      } finally {
        authExpiredHandling = false
      }
    },
  })
}

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
      // 用户被强退后，必须清理本地专属入口信息，避免下一次请求又自动登录回来
      if (isForcedOfflineMessage(msg)) {
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
