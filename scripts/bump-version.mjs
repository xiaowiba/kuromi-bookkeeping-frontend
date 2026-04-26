// 从 Node.js 文件系统模块中引入同步读写文件的方法。
import { readFileSync, writeFileSync } from 'node:fs'

// 从 Node.js 路径模块中引入目录名获取与路径拼接方法。
import { dirname, resolve } from 'node:path'

// 从 Node.js URL 模块中引入 URL 转本地文件路径的方法。
import { fileURLToPath } from 'node:url'

// 根据当前脚本文件 URL 还原出当前脚本所在目录，等价于 CommonJS 中的 __dirname。
const __dirname = dirname(fileURLToPath(import.meta.url))

// 定位前端项目根目录下的 package.json，它是前端展示版本号的唯一来源。
const packageJsonPath = resolve(__dirname, '../package.json')

// 读取命令行传入的版本递增模式，例如 patch 或 minor。
const mode = process.argv[2]

// 校验版本递增模式，避免传入未支持的参数导致版本号被错误修改。
if (!['patch', 'minor'].includes(mode)) {
  // 当前脚本只支持补丁版本递增和小版本递增。
  throw new Error('只支持 patch 或 minor 作为版本递增模式')
}

// 读取 package.json 文件内容，并解析为 JavaScript 对象。
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'))

// 解析版本号，支持 v1.2.0、1.2.0、v1.2.0-SNAPSHOT 等格式。
const matched = packageJson.version.match(/^(v?)(\d+)\.(\d+)\.(\d+)(.*)$/)

// 校验 package.json.version 是否符合 major.minor.patch 的基本版本格式。
if (!matched) {
  // 找不到合法版本号时直接中断，避免写回错误版本。
  throw new Error('未在 package.json 中找到合法的前端版本号')
}

// 保存版本号前缀，通常是 v，也允许为空。
const prefix = matched[1]

// 解析 major 主版本号。
const major = Number.parseInt(matched[2], 10)

// 解析 minor 小版本号，minor 模式下会递增它。
let minor = Number.parseInt(matched[3], 10)

// 解析 patch 补丁版本号，patch 模式下会递增它。
let patch = Number.parseInt(matched[4], 10)

// 保存版本号后缀，例如 -SNAPSHOT，递增版本时保持原样。
const suffix = matched[5]

// 如果是 patch 模式，只递增补丁版本号。
if (mode === 'patch') {
  // 补丁版本号加 1，例如 v1.2.0 -> v1.2.1。
  patch += 1
} else {
  // minor 模式递增小版本号，例如 v1.2.8 -> v1.3.0。
  minor += 1

  // 小版本号递增后，补丁版本号重置为 0。
  patch = 0
}

// 按原有前缀、版本数字和后缀重新组装新的版本号。
const nextVersion = `${prefix}${major}.${minor}.${patch}${suffix}`

// 将新的版本号写回 package.json 对象。
packageJson.version = nextVersion

// 把更新后的 package.json 格式化为 2 空格缩进，并写回文件。
writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`, 'utf8')

// 输出新版本号，方便命令执行后快速确认结果。
console.log(nextVersion)
