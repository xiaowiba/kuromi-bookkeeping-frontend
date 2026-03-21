import { Button, Message, Notification, Space } from '@arco-design/web-vue'
import NProgress from 'nprogress'
import type { Router } from 'vue-router'
import { setRouteEmitter } from '@/hooks'
import { useRouteStore, useUserStore } from '@/stores'
import { getToken } from '@/utils/auth'
import { isHttp } from '@/utils/validate'
import { getDefaultTerminalHomePath, resolveTerminalTargetPath } from '@/router/terminal'
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
// 更新
const onUpdateSystem = (id: string) => {
  Notification.remove(id)
  window.location.reload()
}
// 关闭更新弹窗
const onCloseUpdateSystem = (id: string) => {
  Notification.remove(id)
}
// 提示用户更新弹窗
const handleNotification = () => {
  const id = 'updateModel'
  Notification.info({
    id,
    title: '新版本更新',
    content: '当前系统检测到有新的版本，请及时更新',
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
 */
const compareTag = async () => {
  const newVersionTag = await getVersionTag()
  if (versionTag === null) {
    versionTag = newVersionTag
  } else if (versionTag !== newVersionTag) {
    // 如果 ETag 或 Last-Modified 发生变化，则认为有更新
    handleNotification()
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

/** 初始化路由守卫 */
export const setupRouterGuard = (router: Router) => {
  router.beforeEach(async (to) => {
    NProgress.start()
    const userStore = useUserStore()
    const routeStore = useRouteStore()

    try {
      if (getToken()) {
        if (to.path === '/login') {
          return {
            path: getDefaultTerminalHomePath(),
            replace: true,
          }
        }

        if (!hasRouteFlag) {
          try {
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
          } catch (error) {
            await userStore.logoutCallBack()
            return `/login?redirect=${encodeURIComponent(to.fullPath)}`
          }
        }

        const terminalRoute = resolveTerminalRoute(to)
        if (terminalRoute) {
          return terminalRoute
        }

        return true
      }

      if (whiteList.includes(to.path)) {
        return true
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
