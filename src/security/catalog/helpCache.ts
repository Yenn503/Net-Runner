import { spawn } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const HELP_CACHE_DIR = '.netrunner/help-cache'
const HELP_TIMEOUT_MS = 5_000
const HELP_MAX_LINES = 200
const ANSI_RE = /\x1b\[[0-9;]*[a-zA-Z]/g

function stripAnsi(text: string): string {
  return text.replace(ANSI_RE, '')
}

function helpCachePath(cwd: string, toolId: string): string {
  return join(cwd, HELP_CACHE_DIR, `${toolId}.txt`)
}

export async function getCachedHelp(
  cwd: string,
  toolId: string,
): Promise<string | null> {
  try {
    const content = await readFile(helpCachePath(cwd, toolId), 'utf8')
    return content || null
  } catch {
    return null
  }
}

/**
 * Run a single binary attempt, returning stdout+stderr combined.
 * Returns null on timeout, empty output, or spawn error.
 */
function runAttempt(binary: string, args: string[]): Promise<string | null> {
  return new Promise((resolve) => {
    let output = ''
    let timedOut = false

    let child: ReturnType<typeof spawn>
    try {
      child = spawn(binary, args, {
        shell: false,
        env: { ...process.env, TERM: 'dumb' },
        stdio: ['ignore', 'pipe', 'pipe'],
      })
    } catch {
      resolve(null)
      return
    }

    const timer = setTimeout(() => {
      timedOut = true
      try { child.kill('SIGKILL') } catch {}
    }, HELP_TIMEOUT_MS)

    child.stdout?.on('data', (chunk: Buffer) => { output += chunk.toString() })
    child.stderr?.on('data', (chunk: Buffer) => { output += chunk.toString() })

    child.on('error', () => {
      clearTimeout(timer)
      resolve(null)
    })

    child.on('close', () => {
      clearTimeout(timer)
      if (timedOut) {
        resolve(null)
        return
      }
      const trimmed = stripAnsi(output).trim()
      resolve(trimmed.length > 0 ? trimmed : null)
    })
  })
}

function headLines(text: string, max: number): string {
  const lines = text.split(/\r?\n/)
  return lines.slice(0, max).join('\n')
}

/**
 * Probe binary for help text using a fallback chain:
 *   1. `<binary> --help 2>&1`
 *   2. `<binary> -h 2>&1`
 *   3. `<binary> --invalid-flag-nr 2>&1` (capture usage from stderr)
 * Returns first non-empty result or empty string.
 */
async function probeHelp(binary: string): Promise<string> {
  const attempts: [string, string[]][] = [
    [binary, ['--help']],
    [binary, ['-h']],
    [binary, ['--invalid-flag-nr']],
  ]

  for (const [bin, args] of attempts) {
    const result = await runAttempt(bin, args)
    if (result) return result
  }
  return ''
}

export async function populateHelpCache(
  cwd: string,
  toolId: string,
  binary: string,
): Promise<{ cached: boolean; output: string }> {
  const raw = await probeHelp(binary)
  const output = headLines(raw, HELP_MAX_LINES)

  if (!output) {
    return { cached: false, output: '' }
  }

  const cachePath = helpCachePath(cwd, toolId)
  await mkdir(join(cwd, HELP_CACHE_DIR), { recursive: true })
  await writeFile(cachePath, output, 'utf8')

  return { cached: true, output }
}

export async function getOrPopulateHelp(
  cwd: string,
  toolId: string,
  binary: string,
): Promise<string> {
  const cached = await getCachedHelp(cwd, toolId)
  if (cached) return cached

  const { output } = await populateHelpCache(cwd, toolId, binary)
  return output
}
