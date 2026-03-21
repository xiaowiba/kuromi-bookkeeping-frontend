/**
 * 移动端 rem 适配工具
 *
 * @author Wangsongsong
 * @date 2026-03-21
 */
import { MOBILE_DESIGN_WIDTH, MOBILE_MAX_WIDTH, MOBILE_REM_ROOT_VALUE } from '@/constants/mobile'

const MOBILE_PATH_PREFIX = '/m'
const MOBILE_REM_CLASS = 'mobile-rem-enabled'

const getMobileViewportWidth = () => {
  if (typeof window === 'undefined') {
    return MOBILE_DESIGN_WIDTH
  }

  const viewportWidth = window.innerWidth || document.documentElement.clientWidth || MOBILE_DESIGN_WIDTH
  return Math.min(viewportWidth, MOBILE_MAX_WIDTH)
}

export const applyMobileRem = () => {
  if (typeof document === 'undefined') {
    return
  }

  const root = document.documentElement
  const fontSize = (getMobileViewportWidth() / MOBILE_DESIGN_WIDTH) * MOBILE_REM_ROOT_VALUE

  root.style.fontSize = `${fontSize}px`
  root.classList.add(MOBILE_REM_CLASS)
}

export const resetMobileRem = () => {
  if (typeof document === 'undefined') {
    return
  }

  const root = document.documentElement
  root.style.removeProperty('font-size')
  root.classList.remove(MOBILE_REM_CLASS)
}

export const isMobileRemPath = (path: string) =>
  path === MOBILE_PATH_PREFIX || path.startsWith(`${MOBILE_PATH_PREFIX}/`)

export const syncMobileRemByPath = (path: string) => {
  if (isMobileRemPath(path)) {
    applyMobileRem()
    return
  }

  resetMobileRem()
}

export const bindMobileRemResize = () => {
  if (typeof window === 'undefined') {
    return () => {}
  }

  const handleResize = () => applyMobileRem()

  handleResize()
  window.addEventListener('resize', handleResize)
  window.addEventListener('orientationchange', handleResize)

  return () => {
    window.removeEventListener('resize', handleResize)
    window.removeEventListener('orientationchange', handleResize)
    resetMobileRem()
  }
}
