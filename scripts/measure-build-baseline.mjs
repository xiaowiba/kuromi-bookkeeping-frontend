import { spawn } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

const projectRoot = process.cwd()
const baselineDir = path.join(projectRoot, 'docs', 'build')
const baselinePath = path.join(baselineDir, 'build-baseline.md')

const runTimedCommand = (command, args) => {
  return new Promise((resolve, reject) => {
    const startTime = process.hrtime.bigint()
    const child = spawn(command, args, {
      cwd: projectRoot,
      shell: true,
      stdio: 'inherit',
    })

    child.on('error', reject)
    child.on('close', (code) => {
      const durationMs = Number(process.hrtime.bigint() - startTime) / 1e6
      if (code !== 0) {
        reject(new Error(`${command} ${args.join(' ')} failed with exit code ${code}`))
        return
      }
      resolve(durationMs)
    })
  })
}

const formatDuration = (durationMs) => `${(durationMs / 1000).toFixed(2)} s`

const main = async () => {
  console.log('==> Measuring vue-tsc --noEmit')
  const typecheckDurationMs = await runTimedCommand('pnpm', ['exec', 'vue-tsc', '--noEmit'])

  console.log('==> Measuring vite build')
  const buildDurationMs = await runTimedCommand('pnpm', ['exec', 'vite', 'build'])

  console.log('==> Measuring vite build --mode analyze')
  const analyzeBuildDurationMs = await runTimedCommand('pnpm', ['exec', 'vite', 'build', '--mode', 'analyze'])

  const generatedAt = new Date().toLocaleString('zh-CN', { hour12: false })
  const content = [
    '# Build Baseline',
    '',
    `- Generated at: ${generatedAt}`,
    `- Type check \`pnpm exec vue-tsc --noEmit\`: ${formatDuration(typecheckDurationMs)}`,
    `- Build only \`pnpm exec vite build\`: ${formatDuration(buildDurationMs)}`,
    `- Analyze build \`pnpm exec vite build --mode analyze\`: ${formatDuration(analyzeBuildDurationMs)}`,
    `- Combined baseline (\`vue-tsc --noEmit && vite build\`): ${formatDuration(typecheckDurationMs + buildDurationMs)}`,
    '',
    '## Notes',
    '',
    '- `stats.html` is generated in the project root when analyze build runs successfully.',
    '- Re-run this script after each optimization phase to compare deltas.',
    '',
  ].join('\n')

  await mkdir(baselineDir, { recursive: true })
  await writeFile(baselinePath, content, 'utf8')

  console.log(`==> Baseline written to ${baselinePath}`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
