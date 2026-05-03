import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const packageJsonPath = resolve(__dirname, '../package.json')

const args = process.argv.slice(2)
const mode = args.find(arg => !arg.startsWith('--')) ?? 'patch'
const shouldAppendTimestamp = args.includes('--timestamp') || mode === 'timestamp'
const isDryRun = args.includes('--dry-run')

const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'))
const currentVersion = packageJson.version

const VERSION_PATTERN = /^(v?)(\d+)\.(\d+)\.(\d+)(?:\.(\d{4})\.(\d{4})\.(\d{4}))?([-\w.]+)?$/
const matched = currentVersion.match(VERSION_PATTERN)

if (!matched) {
  throw new Error(`Invalid package.json version: ${currentVersion}`)
}

const [, prefix, majorText, minorText, patchText, , , , suffix = ''] = matched
let major = Number.parseInt(majorText, 10)
let minor = Number.parseInt(minorText, 10)
let patch = Number.parseInt(patchText, 10)

const pad = value => String(value).padStart(2, '0')

const createTimestamp = (date = new Date()) => {
  const yyyy = String(date.getFullYear())
  const MMdd = `${pad(date.getMonth() + 1)}${pad(date.getDate())}`
  const HHmm = `${pad(date.getHours())}${pad(date.getMinutes())}`
  return `${yyyy}.${MMdd}.${HHmm}`
}

const normalizeTargetVersion = (targetVersion) => {
  if (!VERSION_PATTERN.test(targetVersion)) {
    throw new Error(`Invalid target version: ${targetVersion}`)
  }
  return targetVersion
}

let nextVersion

if (mode.startsWith('set:')) {
  nextVersion = normalizeTargetVersion(mode.slice('set:'.length))
} else if (['patch', 'minor', 'major', 'timestamp'].includes(mode)) {
  if (mode === 'patch') {
    patch += 1
  }
  if (mode === 'minor') {
    minor += 1
    patch = 0
  }
  if (mode === 'major') {
    major += 1
    minor = 0
    patch = 0
  }

  nextVersion = `${prefix}${major}.${minor}.${patch}`
  if (shouldAppendTimestamp) {
    nextVersion = `${nextVersion}.${createTimestamp()}`
  }
  nextVersion = `${nextVersion}${suffix}`
} else {
  throw new Error('Supported modes: patch, minor, major, timestamp, set:<version>')
}

if (!isDryRun) {
  packageJson.version = nextVersion
  writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`, 'utf8')
}

console.log(nextVersion)
