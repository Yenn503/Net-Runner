import { spawn } from 'child_process'
import { writeFile, unlink } from 'fs/promises'
import { existsSync } from 'fs'
import { resolve } from 'path'
import treeKill from 'tree-kill'

const PORT = 3111
const PID_PATH = resolve('.netrunner/agentmemory.pid')
const LIVECZ_URL = `http://localhost:${PORT}/agentmemory/livez`
const POLL_INTERVAL = 500
const POLL_TIMEOUT = 30000

async function isRunning(): Promise<boolean> {
  try {
    const ctrl = new AbortController()
    const id = setTimeout(() => ctrl.abort(), 300)
    const res = await fetch(LIVECZ_URL, { signal: ctrl.signal })
    clearTimeout(id)
    return res.ok
  } catch {
    return false
  }
}

async function waitForReady(): Promise<void> {
  const deadline = Date.now() + POLL_TIMEOUT
  while (Date.now() < deadline) {
    if (await isRunning()) return
    await new Promise(r => setTimeout(r, POLL_INTERVAL))
  }
  throw new Error('agentmemory failed to start within 30s')
}

async function main() {
  if (await isRunning()) {
    console.log('agentmemory already running on port', PORT)
    process.exit(0)
  }

  const pkg = '@agentmemory/agentmemory'
  const pkgDir = resolve('node_modules', pkg)
  if (!existsSync(pkgDir)) {
    console.log('agentmemory not installed. Run: bun add', pkg)
    process.exit(1)
  }

  console.log('Starting agentmemory on port', PORT, '...')

  const proc = spawn('npx', [pkg, '--port', String(PORT)], {
    stdio: 'pipe',
    detached: false,
  })

  proc.stdout?.on('data', (d: Buffer) => process.stdout.write(d))
  proc.stderr?.on('data', (d: Buffer) => process.stderr.write(d))

  proc.on('error', (err: Error) => {
    console.error('Failed to start agentmemory:', err.message)
    process.exit(1)
  })

  proc.on('exit', (code: number | null) => {
    console.log('agentmemory exited with code', code)
    unlink(PID_PATH).catch(() => {})
  })

  try {
    await waitForReady()
  } catch (err) {
    console.error(String(err))
    if (proc.pid) treeKill(proc.pid!, 'SIGTERM')
    process.exit(1)
  }

  if (proc.pid) {
    await writeFile(PID_PATH, String(proc.pid), 'utf8')
  }

  console.log('agentmemory ready on port', PORT)

  const cleanup = () => {
    if (proc.pid) treeKill(proc.pid, 'SIGTERM')
    unlink(PID_PATH).catch(() => {})
    process.exit()
  }
  process.on('SIGINT', cleanup)
  process.on('SIGTERM', cleanup)
  process.on('exit', () => {
    if (proc.pid) treeKill(proc.pid, 'SIGTERM')
  })
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
