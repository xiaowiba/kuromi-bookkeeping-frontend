/**
 * 移动端页面下拉刷新事件
 *
 * 统一管理 `/m` 页面下拉刷新触发与页面级刷新回调注册。
 *
 * @author Wangsongsong
 * @date 2026-03-22
 */
import { onMounted, onUnmounted } from 'vue'
import mittBus from '@/utils/mitt'

const MOBILE_PAGE_REFRESH_EVENT = 'mobile-page-refresh'
const MOBILE_PAGE_REFRESH_FALLBACK_MS = 300

interface MobilePageRefreshPayload {
  done?: () => void
}

type MobilePageRefreshHandler = () => Promise<void> | void

export const emitMobilePageRefresh = () =>
  new Promise<void>((resolve) => {
    let settled = false

    const finish = () => {
      if (settled) return
      settled = true
      resolve()
    }

    mittBus.emit(MOBILE_PAGE_REFRESH_EVENT, {
      done: finish,
    } as MobilePageRefreshPayload)

    window.setTimeout(finish, MOBILE_PAGE_REFRESH_FALLBACK_MS)
  })

export const useMobilePageRefresh = (handler: MobilePageRefreshHandler) => {
  const listener = async (payload?: MobilePageRefreshPayload) => {
    try {
      await handler()
    } finally {
      payload?.done?.()
    }
  }

  onMounted(() => {
    mittBus.on(MOBILE_PAGE_REFRESH_EVENT, listener)
  })

  onUnmounted(() => {
    mittBus.off(MOBILE_PAGE_REFRESH_EVENT, listener)
  })
}

