/**
 * 终端路由映射工具
 *
 * @author Wangsongsong
 * @date 2026-03-21
 */
import { isMobile } from '@/utils'

export const MOBILE_HOME_PATH = '/m/bookkeeping/detail'
export const DESKTOP_HOME_PATH = '/dashboard/workplace'

const desktopToMobileRouteMap: Record<string, string> = {
  '/': MOBILE_HOME_PATH,
  '/dashboard/workplace': MOBILE_HOME_PATH,
  '/dashboard/analysis': '/m/report',
  '/bookkeeping/detail': MOBILE_HOME_PATH,
  '/bookkeeping/report': '/m/report',
  '/bookkeeping/bill': '/m/bill',
  '/bookkeeping/subject': '/m/subject',
  '/user/profile': '/m/me',
}

const mobileToDesktopRouteMap: Record<string, string> = {
  '/m': '/bookkeeping/detail',
  '/m/bookkeeping/detail': '/bookkeeping/detail',
  '/m/report': '/bookkeeping/report',
  '/m/bill': '/bookkeeping/bill',
  '/m/subject': '/bookkeeping/subject',
  '/m/me': '/user/profile',
}

const normalizePath = (path: string) => {
  if (!path) return ''
  if (path === '/') return path
  return path.replace(/\/+$/, '')
}

/** @desc 是否是移动端路由 */
export const isMobileTerminalPath = (path: string) => {
  const normalizedPath = normalizePath(path)
  return normalizedPath === '/m' || normalizedPath.startsWith('/m/')
}

/** @desc 获取当前终端默认首页 */
export const getDefaultTerminalHomePath = () => {
  return isMobile() ? MOBILE_HOME_PATH : DESKTOP_HOME_PATH
}

/**
 * @desc 按当前终端解析目标路径
 * @returns 需要纠偏时返回目标路径，否则返回空字符串
 */
export const resolveTerminalTargetPath = (path: string) => {
  const normalizedPath = normalizePath(path)
  if (!normalizedPath) return ''

  if (isMobile()) {
    if (isMobileTerminalPath(normalizedPath)) return ''
    return desktopToMobileRouteMap[normalizedPath] || ''
  }

  if (!isMobileTerminalPath(normalizedPath)) return ''

  return mobileToDesktopRouteMap[normalizedPath] || DESKTOP_HOME_PATH
}
