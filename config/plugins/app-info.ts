import boxen from 'boxen'
import picocolors from 'picocolors'
import type { Plugin } from 'vite'

export default function appInfo(): Plugin {
  return {
    name: 'appInfo',
    apply: 'serve',
    async buildStart() {
      const { bold, green, cyan, bgGreen, underline } = picocolors
      // eslint-disable-next-line no-console
      console.log(
        boxen(
          `${bold(green(`${bgGreen('Kuromi Bookkeeping Frontend v4.2.0-SNAPSHOT')}`))}\n${cyan('项目仓库：')}${underline('https://github.com/xiaowiba/kuromi-bookkeeping-frontend')}\n${cyan('README：')}${underline('https://github.com/xiaowiba/kuromi-bookkeeping-frontend#readme')}\n${cyan('Issues：')}${underline('https://github.com/xiaowiba/kuromi-bookkeeping-frontend/issues')}\n${cyan('基于 ContiNew Admin UI 二次开发的 Web / H5 记账系统前端')}`,
          {
            padding: 1,
            margin: 1,
            borderStyle: 'double',
            textAlignment: 'center',
          },
        ),
      )
    },
  }
}
