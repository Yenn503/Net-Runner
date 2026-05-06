// @ts-nocheck
/**
 * Net-Runner Camofox setup probe.
 *
 * Camofox is the optional stealth-browser backend used by the
 * `headless-browser-validation` skill. It is a custom Firefox build patched at
 * the C++ level for anti-bot bypass, distributed by upstream:
 *   https://github.com/jo-inc/camofox-browser
 *
 * This script does NOT install Camofox automatically — the upstream binary is
 * platform-specific and large, and silent installs are a footgun. Instead it:
 *   1. Probes $CAMOFOX_URL/health (default http://localhost:9377)
 *   2. If reachable, prints success and exits 0
 *   3. If unreachable, prints a clear, copy-pastable setup hint and exits 0
 *      (non-fatal — the validation skill falls back to Playwright/Chromium)
 *
 * Run manually:        bun run setup:camofox
 * Run with custom url: CAMOFOX_URL=http://host:port bun run setup:camofox
 */

const DEFAULT_URL = 'http://localhost:9377'
const TIMEOUT_MS = 2000

const url = process.env.CAMOFOX_URL?.replace(/\/$/, '') || DEFAULT_URL
const healthEndpoint = `${url}/health`

async function probe(): Promise<{ ok: boolean; status?: number; error?: string }> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(healthEndpoint, { signal: controller.signal })
    clearTimeout(timer)
    return { ok: res.ok, status: res.status }
  } catch (err) {
    clearTimeout(timer)
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}

async function dockerAvailable(): Promise<boolean> {
  try {
    const proc = Bun.spawn(['docker', '--version'], {
      stdout: 'pipe',
      stderr: 'pipe',
    })
    const code = await proc.exited
    return code === 0
  } catch {
    return false
  }
}

function printReachable(): void {
  console.log(`[camofox] reachable at ${url} — headless-browser-validation will use the stealth backend`)
}

function printSetupHints(reason: string, hasDocker: boolean): void {
  const lines: string[] = []
  lines.push(`[camofox] not reachable at ${url} (${reason})`)
  lines.push('')
  lines.push('  Camofox is OPTIONAL. The headless-browser-validation skill will')
  lines.push('  automatically fall back to local Playwright or headless Chromium.')
  lines.push('')
  lines.push('  To enable the stealth backend (recommended for anti-bot OSINT and')
  lines.push('  DOM-XSS/CSP validation against hardened targets):')
  lines.push('')
  lines.push('  1. Pull and run upstream: https://github.com/jo-inc/camofox-browser')
  if (hasDocker) {
    lines.push('     Docker detected on this host. Follow upstream instructions for the')
    lines.push('     docker image; once running, expose port 9377 to the host.')
  } else {
    lines.push('     (Docker is NOT detected on this host — install Docker first if')
    lines.push('     using the containerized distribution.)')
  }
  lines.push('  2. Verify:   curl -s "$CAMOFOX_URL/health"   (or default http://localhost:9377/health)')
  lines.push('  3. Re-run:   bun run setup:camofox')
  lines.push('')
  for (const line of lines) console.log(line)
}

async function main(): Promise<void> {
  const probeResult = await probe()
  if (probeResult.ok) {
    printReachable()
    process.exit(0)
  }
  const reason = probeResult.status
    ? `HTTP ${probeResult.status}`
    : (probeResult.error ?? 'connection refused')
  const hasDocker = await dockerAvailable()
  printSetupHints(reason, hasDocker)
  process.exit(0)
}

main().catch(err => {
  console.error('[camofox] setup probe failed unexpectedly:', err)
  process.exit(0)
})
