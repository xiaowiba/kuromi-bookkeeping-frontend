type ImportVueFileType = typeof import('*.vue')
type ImportVueFileFnType = () => Promise<ImportVueFileType>

// 动态路由只映射真正的页面入口组件，避免把 AddModal、报表卡片等业务子组件也纳入路由模块图。
const moduleFiles = import.meta.glob<ImportVueFileType>('@/views/**/index.vue')

export const asyncRouteModules = Object.entries(moduleFiles).reduce((routes, [url, importFn]) => {
  if (!/\/(views\/login|components)\//.test(url)) {
    const path = url.replace('/src/views/', '').replace('.vue', '')
    routes[path] = importFn
  }

  return routes
}, {} as Recordable<ImportVueFileFnType>)
