/**
 * 隐私模式状态管理
 *
 * 管理隐私模式的会话状态，状态存储在 sessionStorage 中，
 * 关闭页面即失效。隐私模式的有效时长由数据库配置驱动，
 * 到期后自动退出。
 *
 * @author Wangsongsong
 * @date 2026-03-19
 * @update 2026-03-22 @Wangsongsong
 * @desc 改造为记录进入时间、过期时间和有效时长，并支持绝对过期自动退出
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'

const DEFAULT_EXPIRE_MINUTES = 10
let visibilityListenerInitialized = false
let expireTimer: ReturnType<typeof window.setTimeout> | null = null

const normalizeExpireMinutes = (minutes?: number) => {
  const parsedMinutes = Number(minutes)
  if (!Number.isFinite(parsedMinutes) || parsedMinutes <= 0) {
    return DEFAULT_EXPIRE_MINUTES
  }
  return Math.floor(parsedMinutes)
}

const storeSetup = () => {
  /** 是否处于隐私模式 */
  const isPrivacyMode = ref(false)

  /** 隐私模式有效时长（分钟） */
  const expireMinutes = ref(DEFAULT_EXPIRE_MINUTES)

  /** 进入隐私模式的时间戳 */
  const enteredAt = ref(0)

  /** 隐私模式过期时间戳 */
  const expireAt = ref(0)

  /**
   * 清理过期定时器
   *
   * @author Wangsongsong
   * @date 2026-03-22
   */
  const clearExpireTimer = () => {
    if (expireTimer) {
      window.clearTimeout(expireTimer)
      expireTimer = null
    }
  }

  /**
   * 调度隐私模式过期定时器
   *
   * @author Wangsongsong
   * @date 2026-03-22
   */
  const scheduleExpireTimer = () => {
    clearExpireTimer()
    if (!isPrivacyMode.value || !expireAt.value) {
      return
    }

    const remainingMilliseconds = expireAt.value - Date.now()
    if (remainingMilliseconds <= 0) {
      isPrivacyMode.value = false
      enteredAt.value = 0
      expireAt.value = 0
      return
    }

    expireTimer = window.setTimeout(() => {
      isPrivacyMode.value = false
      enteredAt.value = 0
      expireAt.value = 0
      clearExpireTimer()
    }, remainingMilliseconds)
  }

  /**
   * 进入隐私模式
   *
   * @author Wangsongsong
   * @date 2026-03-19
   * @update 2026-03-22 @Wangsongsong
   * @desc 支持写入有效时长与绝对过期时间
   */
  const enterPrivacyMode = (minutes = expireMinutes.value) => {
    expireMinutes.value = normalizeExpireMinutes(minutes)
    enteredAt.value = Date.now()
    expireAt.value = enteredAt.value + expireMinutes.value * 60 * 1000
    isPrivacyMode.value = true
    scheduleExpireTimer()
  }

  /**
   * 退出隐私模式
   *
   * @author Wangsongsong
   * @date 2026-03-19
   * @update 2026-03-22 @Wangsongsong
   * @desc 退出时同时清理进入时间、过期时间和定时器
   */
  const exitPrivacyMode = () => {
    isPrivacyMode.value = false
    enteredAt.value = 0
    expireAt.value = 0
    clearExpireTimer()
  }

  /**
   * 同步隐私模式有效时长
   *
   * @param minutes 有效时长（分钟）
   * @author Wangsongsong
   * @date 2026-03-22
   */
  const syncExpireMinutes = (minutes?: number) => {
    expireMinutes.value = normalizeExpireMinutes(minutes)
    if (isPrivacyMode.value && enteredAt.value) {
      expireAt.value = enteredAt.value + expireMinutes.value * 60 * 1000
      scheduleExpireTimer()
    }
  }

  /**
   * 判断隐私模式是否已过期
   *
   * @author Wangsongsong
   * @date 2026-03-22
   */
  const isExpired = () => {
    if (!isPrivacyMode.value || !expireAt.value) {
      return false
    }
    return Date.now() >= expireAt.value
  }

  /**
   * 确保隐私模式仍然有效
   *
   * @author Wangsongsong
   * @date 2026-03-22
   */
  const ensureValid = () => {
    if (isExpired()) {
      exitPrivacyMode()
      return false
    }

    if (isPrivacyMode.value) {
      scheduleExpireTimer()
    }
    return isPrivacyMode.value
  }

  /**
   * 初始化页面可见性监听
   *
   * @author Wangsongsong
   * @date 2026-03-19
   * @update 2026-03-22 @Wangsongsong
   * @desc 页面初始化和切回前台时校验隐私模式是否过期
   */
  const initVisibilityListener = () => {
    ensureValid()
    if (visibilityListenerInitialized) {
      return
    }

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        ensureValid()
      }
    })
    visibilityListenerInitialized = true
  }

  return {
    isPrivacyMode,
    expireMinutes,
    enteredAt,
    expireAt,
    enterPrivacyMode,
    exitPrivacyMode,
    syncExpireMinutes,
    isExpired,
    ensureValid,
    initVisibilityListener,
  }
}

export const usePrivacyStore = defineStore('privacy', storeSetup, {
  persist: { paths: ['isPrivacyMode', 'expireMinutes', 'enteredAt', 'expireAt'], storage: sessionStorage },
})
