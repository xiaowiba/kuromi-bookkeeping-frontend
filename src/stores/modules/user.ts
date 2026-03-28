import { defineStore } from 'pinia'
import { computed, reactive, ref } from 'vue'
import { useTenantStore } from './tenant'
import { resetRouter } from '@/router'
import {
  type AccountLoginReq,
  AuthTypeConstants,
  type EmailLoginReq,
  type EntryLoginReq,
  type PhoneLoginReq,
  type UserInfo,
  accountLogin as accountLoginApi,
  emailLogin as emailLoginApi,
  entryLogin as entryLoginApi,
  getUserInfo as getUserInfoApi,
  logout as logoutApi,
  phoneLogin as phoneLoginApi,
  socialLogin as socialLoginApi,
} from '@/apis'
import {
  clearEntryLoginState,
  clearToken,
  getEntryLoginEnabled,
  getEntryLoginKey,
  getToken,
  setEntryLoginEnabled,
  setEntryLoginKey,
  setToken,
} from '@/utils/auth'
import { resetHasRouteFlag } from '@/router/guard'

const storeSetup = () => {
  const tenantStore = useTenantStore()
  const userInfo = reactive<UserInfo>({
    id: '',
    username: '',
    nickname: '',
    gender: 0,
    email: '',
    phone: '',
    avatar: '',
    pwdResetTime: '',
    pwdExpired: false,
    registrationDate: '',
    deptName: '',
    roles: [],
    roleNames: [],
    permissions: [],
  })
  const nickname = computed(() => userInfo.nickname)
  const username = computed(() => userInfo.username)
  const avatar = computed(() => userInfo.avatar)

  const token = ref(getToken() || '')
  const pwdExpiredShow = ref<boolean>(true)
  const roles = ref<string[]>([]) // 当前用户角色
  const permissions = ref<string[]>([]) // 当前角色权限标识集合
  // 同一标签页内复用专属入口登录请求，避免并发触发时重复生成 token
  let entryLoginTask: Promise<void> | null = null
  const applyLoginResp = (data: { token: string; tenantId: string }) => {
    setToken(data.token)
    tenantStore.setTenantId(data.tenantId)
    token.value = data.token
  }

  const saveEntryLoginState = (entryKey: string) => {
    setEntryLoginKey(entryKey)
    setEntryLoginEnabled(true)
  }

  const canEntryLogin = () => {
    return getEntryLoginEnabled() && !!getEntryLoginKey()
  }

  const clearLocalEntryLoginState = () => {
    clearEntryLoginState()
  }

  // 重置token
  const resetToken = () => {
    token.value = ''
    clearToken()
    resetHasRouteFlag()
  }

  // 登录
  const accountLogin = async (req: AccountLoginReq, tenantCode?: string) => {
    const res = await accountLoginApi({ ...req, clientId: import.meta.env.VITE_CLIENT_ID, authType: AuthTypeConstants.ACCOUNT }, tenantCode)
    clearLocalEntryLoginState()
    applyLoginResp(res.data)
  }

  // 邮箱登录
  const emailLogin = async (req: EmailLoginReq, tenantCode?: string) => {
    const res = await emailLoginApi({ ...req, clientId: import.meta.env.VITE_CLIENT_ID, authType: AuthTypeConstants.EMAIL }, tenantCode)
    clearLocalEntryLoginState()
    applyLoginResp(res.data)
  }

  // 手机号登录
  const phoneLogin = async (req: PhoneLoginReq, tenantCode?: string) => {
    const res = await phoneLoginApi({ ...req, clientId: import.meta.env.VITE_CLIENT_ID, authType: AuthTypeConstants.PHONE }, tenantCode)
    clearLocalEntryLoginState()
    applyLoginResp(res.data)
  }

  // 三方账号登录
  const socialLogin = async (source: string, req: any) => {
    const res: any = await socialLoginApi({ ...req, source, clientId: import.meta.env.VITE_CLIENT_ID, authType: AuthTypeConstants.SOCIAL })
    clearLocalEntryLoginState()
    applyLoginResp(res.data)
  }

  // 专属入口登录
  const entryLogin = async (entryKey: string, options?: { silent?: boolean; persist?: boolean }) => {
    if (!entryLoginTask) {
      entryLoginTask = (async () => {
        const req: EntryLoginReq = {
          entryKey,
          clientId: import.meta.env.VITE_CLIENT_ID,
          authType: AuthTypeConstants.ENTRY,
        }
        const res = await entryLoginApi(req, {
          __skipEntryRetry: true,
          __silentAuthError: options?.silent,
        })
        applyLoginResp(res.data)
        if (options?.persist !== false) {
          saveEntryLoginState(entryKey)
        }
      })().finally(() => {
        entryLoginTask = null
      })
    }
    await entryLoginTask
  }

  // 使用本地专属入口恢复登录
  const restoreLoginByEntryKey = async (options?: { silent?: boolean }) => {
    const entryKey = getEntryLoginKey()
    if (!entryKey || !getEntryLoginEnabled()) {
      throw new Error('专属入口未启用')
    }
    await entryLogin(entryKey, { silent: options?.silent })
  }

  // 退出登录回调
  const logoutCallBack = async () => {
    roles.value = []
    permissions.value = []
    pwdExpiredShow.value = true
    // 手动退出、强退、顶下线最终都要走这里，统一清理本地自动登录痕迹
    clearLocalEntryLoginState()
    resetToken()
    resetRouter()
    tenantStore.resetTenantId()
  }

  // 退出登录
  const logout = async () => {
    try {
      await logoutApi({
        __skipEntryRetry: true,
        __silentAuthError: true,
      })
    } catch (error) {
      // 手动退出时，即便服务端会话已失效，也要清理本地自动登录状态
    }
    await logoutCallBack()
    return true
  }

  // 获取用户信息
  const getInfo = async () => {
    const res = await getUserInfoApi()
    Object.assign(userInfo, res.data)
    userInfo.avatar = res.data.avatar
    if (res.data.roles && res.data.roles.length) {
      roles.value = res.data.roles
      permissions.value = res.data.permissions
    }
  }

  return {
    userInfo,
    nickname,
    username,
    avatar,
    token,
    roles,
    permissions,
    pwdExpiredShow,
    accountLogin,
    emailLogin,
    phoneLogin,
    socialLogin,
    entryLogin,
    restoreLoginByEntryKey,
    logout,
    logoutCallBack,
    getInfo,
    resetToken,
    canEntryLogin,
    clearEntryLoginState: clearLocalEntryLoginState,
  }
}

export const useUserStore = defineStore('user', storeSetup, {
  persist: { paths: ['token', 'roles', 'permissions', 'pwdExpiredShow'], storage: localStorage },
})
