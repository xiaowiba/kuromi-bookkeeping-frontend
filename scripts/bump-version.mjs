import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const packageJsonPath = resolve(__dirname, '../package.json')
const mode = process.argv[2]

if (!['patch', 'minor'].includes(mode)) {
  throw new Error('只支持 patch 或 minor 作为版本递增模式')
}

const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'))
const matched = packageJson.version.match(/^(v?)(\d+)\.(\d+)\.(\d+)(.*)$/)

if (!matched) {
  throw new Error('未在 package.json 中找到合法的前端版本号')
}

const prefix = matched[1]
const major = Number.parseInt(matched[2], 10)
let minor = Number.parseInt(matched[3], 10)
let patch = Number.parseInt(matched[4], 10)
const suffix = matched[5]

if (mode === 'patch') {
  patch += 1
} else {
  minor += 1
  patch = 0
}

const nextVersion = `${prefix}${major}.${minor}.${patch}${suffix}`
packageJson.version = nextVersion

writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`, 'utf8')
console.log(nextVersion)
