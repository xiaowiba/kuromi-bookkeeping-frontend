/**
 * 隐私模式状态管理
 *
 * 管理隐私模式的开关状态，状态存储在 sessionStorage 中，
 * 关闭页面即失效。切后台超过 1 分钟自动退出隐私模式。
 *
 * @author Wangsongsong
 * @date 2026-03-19
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'

/** 切后台自动退出的超时时间（毫秒） */
const BACKGROUND_TIMEOUT = 60 * 1000

const storeSetup = () => {
  /** 是否处于隐私模式 */
  const isPrivacyMode = ref(false)

  /** 切后台时间戳 */
  let hiddenTimestamp = 0

  /**
   * 进入隐私模式
   *
   * @author Wangsongsong
   * @date 2026-03-19
   */
  const enterPrivacyMode = () => {
    isPrivacyMode.value = true
  }

  /**
   * 退出隐私模式
   *
   * @author Wangsongsong
   * @date 2026-03-19
   */
  const exitPrivacyMode = () => {
    isPrivacyMode.value = false
  }

  /**
   * 初始化页面可见性监听
   *
   * 切后台超过 1 分钟自动退出隐私模式
   *
   * @author Wangsongsong
   * @date 2026-03-19
   */
  const initVisibilityListener = () => {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // 切到后台，记录时间
        hiddenTimestamp = Date.now()
      } else {
        // 回到前台，检查是否超时
        if (isPrivacyMode.value && hiddenTimestamp > 0) {
          const elapsed = Date.now() - hiddenTimestamp
          if (elapsed >= BACKGROUND_TIMEOUT) {
            exitPrivacyMode()
          }
        }
        hiddenTimestamp = 0
      }
    })
  }

  return {
    isPrivacyMode,
    enterPrivacyMode,
    exitPrivacyMode,
    initVisibilityListener,
  }
}

export const usePrivacyStore = defineStore('privacy', storeSetup, {
  persist: { paths: ['isPrivacyMode'], storage: sessionStorage },
})
