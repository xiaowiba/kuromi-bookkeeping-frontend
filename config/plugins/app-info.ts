import boxen from 'boxen'
import picocolors from 'picocolors'
import type { Plugin } from 'vite'
import { version } from '../../package.json'

export default function appInfo(): Plugin {
  return {
    name: 'appInfo',
    apply: 'serve',
    async buildStart() {
      const { bold, green, cyan, bgGreen, underline } = picocolors
      const title = bold(green(bgGreen(`Kuromi Bookkeeping Frontend ${version}`)))
      const repo = `${cyan('项目仓库：')}${underline('https://github.com/xiaowiba/kuromi-bookkeeping-frontend')}`
      const readme = `${cyan('README：')}${underline('https://github.com/xiaowiba/kuromi-bookkeeping-frontend#readme')}`
      // const issues = `${cyan('Issues：')}${underline('https://github.com/xiaowiba/kuromi-bookkeeping-frontend/issues')}`
      const description = cyan('基于 ContiNew Admin UI 二次开发的 Web / H5 系统前端')
      const message = [
        title,
        repo,
        readme,
        // issues,
        description,
      ].join('\n')

      // eslint-disable-next-line no-console
      console.log(
        boxen(message, {
          padding: 1,
          margin: 1,
          borderStyle: 'double',
          textAlignment: 'center',
        }),
      )
    },
  }
}
