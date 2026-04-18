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
import { computed, ref, watch } from 'vue'

const DEFAULT_EXPIRE_MINUTES = 10
let visibilityListenerInitialized = false
let expireTimer: ReturnType<typeof window.setTimeout> | null = null
let countdownTimer: ReturnType<typeof window.setInterval> | null = null

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

  /** 当前时间戳，用于驱动倒计时展示每秒刷新 */
  const currentTimestamp = ref(Date.now())

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
   * 清理倒计时定时器
   *
   * @author Codex
   * @date 2026-04-18
   */
  const clearCountdownTimer = () => {
    if (countdownTimer) {
      window.clearInterval(countdownTimer)
      countdownTimer = null
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

    currentTimestamp.value = Date.now()
    const remainingMilliseconds = expireAt.value - currentTimestamp.value
    if (remainingMilliseconds <= 0) {
      exitPrivacyMode()
      return
    }

    expireTimer = window.setTimeout(() => {
      exitPrivacyMode()
    }, remainingMilliseconds)
  }

  /**
   * 调度倒计时定时器
   *
   * @author Codex
   * @date 2026-04-18
   */
  const scheduleCountdownTimer = () => {
    clearCountdownTimer()
    if (!isPrivacyMode.value || !expireAt.value) {
      currentTimestamp.value = Date.now()
      return
    }
    currentTimestamp.value = Date.now()
    countdownTimer = window.setInterval(() => {
      currentTimestamp.value = Date.now()
      if (expireAt.value && currentTimestamp.value >= expireAt.value) {
        exitPrivacyMode()
      }
    }, 1000)
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
    clearCountdownTimer()
    currentTimestamp.value = Date.now()
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
      scheduleCountdownTimer()
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

  /**
   * 隐私模式剩余秒数。
   *
   * @author Codex
   * @date 2026-04-18
   */
  const remainingSeconds = computed(() => {
    if (!isPrivacyMode.value || !expireAt.value) {
      return 0
    }
    return Math.max(0, Math.ceil((expireAt.value - currentTimestamp.value) / 1000))
  })

  /**
   * 隐私模式剩余时间文案。
   *
   * 规则：
   * 1. 大于等于 1 分钟时，显示为“X分钟YY秒”
   * 2. 小于 1 分钟时，仅显示“ZZ秒”
   *
   * @author Codex
   * @date 2026-04-18
   */
  const remainingDurationText = computed(() => {
    const seconds = remainingSeconds.value
    if (seconds >= 60) {
      const minutes = Math.floor(seconds / 60)
      const remainSeconds = String(seconds % 60).padStart(2, '0')
      return `${minutes}分钟${remainSeconds}秒`
    }
    return `${seconds}秒`
  })

  watch(
    () => [isPrivacyMode.value, expireAt.value] as const,
    () => {
      if (!isPrivacyMode.value || !expireAt.value) {
        clearExpireTimer()
        clearCountdownTimer()
        currentTimestamp.value = Date.now()
        return
      }
      if (isExpired()) {
        exitPrivacyMode()
        return
      }
      scheduleExpireTimer()
      scheduleCountdownTimer()
    },
    { immediate: true },
  )

  return {
    isPrivacyMode,
    expireMinutes,
    enteredAt,
    expireAt,
    remainingSeconds,
    remainingDurationText,
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
