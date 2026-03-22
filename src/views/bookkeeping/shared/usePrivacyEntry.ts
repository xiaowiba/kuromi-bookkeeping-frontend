/**
 * 隐私模式入口逻辑
 *
 * 统一管理隐私配置读取、密码验证、首次设置与进入隐私模式，
 * 供移动端“我的”页面及后续其他隐私入口复用。
 *
 * @author Wangsongsong
 * @date 2026-03-22
 * @update 2026-03-22 @Wangsongsong
 * @desc 移动端隐私入口提示改为统一使用 TDesign Toast
 */
import { computed, reactive, ref } from 'vue'
import { getPrivacyConfig, setPrivacyPassword, verifyPrivacyPassword } from '@/apis/bookkeeping/privacy'
import { usePrivacyStore } from '@/stores'
import has from '@/utils/has'
import { mobileToast } from '@/utils/mobile-toast'

export const DEFAULT_PRIVACY_EXPIRE_MINUTES = 10

const normalizeExpireMinutes = (minutes?: number) => {
  const parsedMinutes = Number(minutes)
  if (!Number.isFinite(parsedMinutes) || parsedMinutes <= 0) {
    return DEFAULT_PRIVACY_EXPIRE_MINUTES
  }
  return Math.floor(parsedMinutes)
}

interface UsePrivacyEntryOptions {
  onSuccess?: () => void | Promise<void>
}

export function usePrivacyEntry(options: UsePrivacyEntryOptions = {}) {
  const privacyStore = usePrivacyStore()

  const hasPrivacyPermission = computed(() => has.hasPermOr(['bk:hide-target:manage']))
  const verifyPopupVisible = ref(false)
  const setupPopupVisible = ref(false)
  const verifyPassword = ref('')
  const privacySubmitting = ref(false)
  const currentExpireMinutes = ref(normalizeExpireMinutes(privacyStore.expireMinutes))
  const setupForm = reactive({
    password: '',
    confirmPassword: '',
  })

  const closeVerifyPopup = () => {
    verifyPassword.value = ''
    verifyPopupVisible.value = false
  }

  const closeSetupPopup = () => {
    setupForm.password = ''
    setupForm.confirmPassword = ''
    setupPopupVisible.value = false
  }

  const syncPrivacyConfig = async () => {
    const { data } = await getPrivacyConfig()
    currentExpireMinutes.value = normalizeExpireMinutes(data.expireMinutes)
    privacyStore.syncExpireMinutes(currentExpireMinutes.value)
    return data
  }

  const handlePrivacySuccess = async (successMessage: string) => {
    privacyStore.enterPrivacyMode(currentExpireMinutes.value)
    closeVerifyPopup()
    closeSetupPopup()
    mobileToast.success(successMessage)
    await options.onSuccess?.()
  }

  const openPrivacyEntry = async () => {
    if (!hasPrivacyPermission.value) {
      return false
    }

    try {
      const config = await syncPrivacyConfig()
      if (privacyStore.isPrivacyMode) {
        mobileToast.info('当前已处于隐私模式')
        return true
      }

      if (config.hasPassword) {
        closeSetupPopup()
        verifyPopupVisible.value = true
      } else {
        closeVerifyPopup()
        setupPopupVisible.value = true
      }
      return true
    } catch {
      mobileToast.error('读取隐私配置失败')
      return false
    }
  }

  const handleVerifyPassword = async () => {
    if (!verifyPassword.value) {
      mobileToast.warning('请输入隐私密码')
      return false
    }

    privacySubmitting.value = true
    try {
      const { data } = await verifyPrivacyPassword({ password: verifyPassword.value })
      if (!data.verified) {
        mobileToast.error('密码错误')
        return false
      }

      await handlePrivacySuccess('已进入隐私模式')
      return true
    } catch {
      mobileToast.error('验证失败')
      return false
    } finally {
      privacySubmitting.value = false
    }
  }

  const handleSetupPassword = async () => {
    if (!setupForm.password) {
      mobileToast.warning('请输入密码')
      return false
    }
    if (setupForm.password.length < 4) {
      mobileToast.warning('密码长度不能少于 4 位')
      return false
    }
    if (setupForm.password !== setupForm.confirmPassword) {
      mobileToast.warning('两次输入的密码不一致')
      return false
    }

    privacySubmitting.value = true
    try {
      await setPrivacyPassword({ password: setupForm.password })
      await handlePrivacySuccess('密码设置成功，已进入隐私模式')
      return true
    } catch {
      mobileToast.error('设置隐私密码失败')
      return false
    } finally {
      privacySubmitting.value = false
    }
  }

  return {
    hasPrivacyPermission,
    currentExpireMinutes,
    verifyPopupVisible,
    setupPopupVisible,
    verifyPassword,
    privacySubmitting,
    setupForm,
    closeVerifyPopup,
    closeSetupPopup,
    syncPrivacyConfig,
    openPrivacyEntry,
    handleVerifyPassword,
    handleSetupPassword,
  }
}
