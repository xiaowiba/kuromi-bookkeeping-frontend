import { h } from 'vue'
import { Button, Message, Notification, Space } from '@arco-design/web-vue'
import { DialogPlugin } from 'tdesign-mobile-vue'
import NProgress from 'nprogress'
import type { Router } from 'vue-router'
import { setRouteEmitter } from '@/hooks'
import { useRouteStore, useUserStore } from '@/stores'
import { getToken } from '@/utils/auth'
import { isHttp } from '@/utils/validate'
import { getDefaultTerminalHomePath, resolveTerminalTargetPath, isMobileTerminalPath } from '@/router/terminal'
import { version } from '../../package.json'
import 'nprogress/nprogress.css'

NProgress.configure({
  easing: 'ease', // 动画方式
  speed: 500, // 递增进度条的速度
  showSpinner: false, // 是否显示圆圈加载
  trickleSpeed: 200, // 自动递增间隔
  minimum: 0.3, // 初始化时的最小百分比
})

// 版本更新
let versionTag: string | null = null // 版本标识

/**
 * 获取当前版本号
 * @returns {string} 当前版本号，如 "v1.2.0.2026.0503.0806"
 * @author Wangsongsong
 * @date 2026-05-07
 */
const getCurrentVersion = () => {
  return version
}

// 更新
const onUpdateSystem = (id: string) => {
  Notification.remove(id)
  window.location.reload()
}
// 关闭更新弹窗
const onCloseUpdateSystem = (id: string) => {
  Notification.remove(id)
}

/**
 * Web 端更新提示（非强制，展示版本号）
 * @author Wangsongsong
 * @date 2026-05-07
 */
const handleWebNotification = () => {
  const id = 'updateModel'
  const currentVersion = getCurrentVersion()

  Notification.info({
    id,
    title: '新版本更新',
    content: `检测到新版本，当前版本：${currentVersion}，建议及时更新`,
    duration: 0,
    closable: true,
    position: 'bottomRight',
    footer: () => {
      return h(Space, {}, () => [h(Button, {
        type: 'primary',
        onClick: () => onUpdateSystem(id),
      }, '更新'), h(Button, { type: 'secondary', onClick: () => onCloseUpdateSystem(id) }, '关闭')])
    },
  })
}

/**
 * 移动端更新提示（强制更新，展示版本号）
 * @author Wangsongsong
 * @date 2026-05-07
 */
const handleMobileNotification = () => {
  const currentVersion = getCurrentVersion()

  DialogPlugin({
    title: '新版本更新',
    content: `系统已发布新版本\n\n当前版本：${currentVersion}\n\n请立即更新后继续使用`,
    confirmBtn: {
      content: '立即更新',
      theme: 'primary',
    },
    // 强制更新配置
    closeBtn: false,           // 隐藏关闭按钮
    closeOnOverlayClick: false, // 禁止点击遮罩层关闭
    showOverlay: true,          // 显示遮罩层
    preventScrollThrough: true, // 阻止背景滚动
    onConfirm: () => {
      window.location.reload()
    },
  })
}

/**
 * 提示用户更新
 * 根据当前路由路径判断使用 Web 端还是移动端提示
 * @author Wangsongsong
 * @date 2026-05-07
 */
const handleNotification = () => {
  const currentPath = window.location.pathname
  if (isMobileTerminalPath(currentPath)) {
    handleMobileNotification() // 移动端：强制更新
  } else {
    handleWebNotification()    // Web 端：非强制
  }
}

/**
 * 获取首页的 ETag 或 Last-Modified 值，作为当前版本标识
 * @returns {Promise<string|null>} 返回 ETag 或 Last-Modified 值
 */
const getVersionTag = async () => {
  const response = await fetch('/', {
    cache: 'no-cache',
  })
  return response.headers.get('etag') || response.headers.get('last-modified')
}

/**
 * 比较当前的 ETag 或 Last-Modified 值与最新获取的值
 * @author Wangsongsong
 * @date 2026-05-07
 * @update 2026-05-07 @Wangsongsong
 * @desc 添加异常处理，确保版本检测失败不影响路由跳转
 */
const compareTag = async () => {
  try {
    const newVersionTag = await getVersionTag()
    if (versionTag === null) {
      versionTag = newVersionTag
    } else if (versionTag !== newVersionTag) {
      // 如果 ETag 或 Last-Modified 发生变化，则认为有更新
      handleNotification()
    }
  } catch (error) {
    // 静默失败，不影响路由跳转
    console.warn('版本检测失败:', error)
  }
}

/** 免登录白名单 */
const whiteList = ['/login', '/social/callback', '/pwdExpired']

/** 是否已经生成过路由表 */
let hasRouteFlag = false
export const resetHasRouteFlag = () => {
  hasRouteFlag = false
}

const resolveTerminalRoute = (to: Parameters<Router['beforeEach']>[0]) => {
  const terminalTargetPath = resolveTerminalTargetPath(to.path)
  if (!terminalTargetPath || terminalTargetPath === to.path) {
    return null
  }

  return {
    path: terminalTargetPath,
    query: to.query,
    hash: to.hash,
    replace: true,
  }
}

const loadUserRoutes = async (
  to: Parameters<Router['beforeEach']>[0],
  router: Router,
  userStore: ReturnType<typeof useUserStore>,
  routeStore: ReturnType<typeof useRouteStore>,
) => {
  if (!hasRouteFlag) {
    await userStore.getInfo()

    if (userStore.userInfo.pwdExpired && to.path !== '/pwdExpired') {
      Message.warning('密码已过期，请修改密码')
      return '/pwdExpired'
    }

    const accessRoutes = await routeStore.generateRoutes()
    accessRoutes.forEach((route) => {
      if (!isHttp(route.path)) {
        router.addRoute(route)
      }
    })
    hasRouteFlag = true

    const terminalRoute = resolveTerminalRoute(to)
    if (terminalRoute) {
      return terminalRoute
    }

    return { ...to, replace: true }
  }

  const terminalRoute = resolveTerminalRoute(to)
  if (terminalRoute) {
    return terminalRoute
  }

  return true
}

/** 初始化路由守卫 */
export const setupRouterGuard = (router: Router) => {
  router.beforeEach(async (to) => {
    NProgress.start()
    const userStore = useUserStore()
    const routeStore = useRouteStore()

    try {
      if (getToken()) {
        if (to.path === '/login' && !to.hash.includes('entryKey=')) {
          return {
            path: getDefaultTerminalHomePath(),
            replace: true,
          }
        }

        if (!hasRouteFlag) {
          try {
            return await loadUserRoutes(to, router, userStore, routeStore)
          } catch (error) {
            await userStore.logoutCallBack()
            return `/login?redirect=${encodeURIComponent(to.fullPath)}`
          }
        }
        return await loadUserRoutes(to, router, userStore, routeStore)
      }

      if (whiteList.includes(to.path)) {
        return true
      }

      if (userStore.canEntryLogin()) {
        try {
          await userStore.restoreLoginByEntryKey({ silent: true })
          return await loadUserRoutes(to, router, userStore, routeStore)
        } catch (error) {
          await userStore.logoutCallBack()
        }
      }

      return `/login?redirect=${encodeURIComponent(to.fullPath)}`
    } finally {
      if (import.meta.env.PROD) {
        await compareTag()
      }
    }
  })

  router.onError(() => {
    NProgress.done()
  })

  router.afterEach(() => {
    NProgress.done()
  })
}

/**
 * 设置页面路由守卫
 * @description 处理路由变化时的页面级操作，如路由变化事件通知
 * @param router - Vue Router 实例
 */
export const setupPageGuard = (router: Router) => {
  router.beforeEach((to, from) => {
    setRouteEmitter(to, from)
  })
}
