import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const versionFilePath = resolve(__dirname, '../src/config/app-version.ts')
const mode = process.argv[2]

if (!['patch', 'minor'].includes(mode)) {
  throw new Error('只支持 patch 或 minor 作为版本递增模式')
}

const fileContent = readFileSync(versionFilePath, 'utf8')
const versionRegExp = /MOBILE_DISPLAY_VERSION = 'v(\d+)\.(\d+)\.(\d+)'/
const matched = fileContent.match(versionRegExp)

if (!matched) {
  throw new Error('未在 app-version.ts 中找到合法的移动端版本号')
}

const major = Number.parseInt(matched[1], 10)
let minor = Number.parseInt(matched[2], 10)
let patch = Number.parseInt(matched[3], 10)

if (mode === 'patch') {
  patch += 1
} else {
  minor += 1
  patch = 0
}

const nextVersion = `v${major}.${minor}.${patch}`
const nextContent = fileContent.replace(versionRegExp, `MOBILE_DISPLAY_VERSION = '${nextVersion}'`)

writeFileSync(versionFilePath, nextContent, 'utf8')
console.log(nextVersion)
