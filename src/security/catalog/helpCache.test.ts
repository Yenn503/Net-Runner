import assert from 'node:assert/strict'
import { mkdtemp, writeFile, mkdir, chmod } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import {
  getCachedHelp,
  populateHelpCache,
  getOrPopulateHelp,
} from './helpCache.ts'

async function makeFakeBinary(dir: string, name: string, script: string): Promise<string> {
  await mkdir(dir, { recursive: true })
  const binPath = join(dir, name)
  await writeFile(binPath, `#!/bin/sh\n${script}\n`, { mode: 0o755 })
  return binPath
}

test('getCachedHelp returns null when no cache exists', async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'nr-help-cache-'))
  const result = await getCachedHelp(cwd, 'kali-nmap')
  assert.equal(result, null)
})

test('populateHelpCache writes cache and returns output', async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'nr-help-cache-'))
  const binDir = join(cwd, 'bin')
  const bin = await makeFakeBinary(binDir, 'faketool', 'echo "USAGE: faketool --bar [OPTIONS]"')

  const { cached, output } = await populateHelpCache(cwd, 'kali-faketool', bin)

  assert.equal(cached, true)
  assert.ok(output.includes('USAGE: faketool --bar'), `unexpected output: ${output}`)

  // Cache file should now exist
  const fromCache = await getCachedHelp(cwd, 'kali-faketool')
  assert.ok(fromCache !== null)
  assert.ok(fromCache!.includes('USAGE: faketool --bar'))
})

test('getOrPopulateHelp: cache miss populates, second call returns cached without re-exec', async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'nr-help-cache-'))
  const binDir = join(cwd, 'bin')

  let execCount = 0
  const countingScript = 'echo "USAGE: countme --flag"; echo "exec-count: called"'
  const bin = await makeFakeBinary(binDir, 'countme', countingScript)

  // First call — should populate
  const first = await getOrPopulateHelp(cwd, 'kali-countme', bin)
  assert.ok(first.includes('USAGE: countme'), `first call missing usage: ${first}`)

  // Overwrite binary with a script that would produce different output
  // to prove the second call reads from cache, not re-exec
  await writeFile(bin, '#!/bin/sh\necho "DIFFERENT OUTPUT"\n', { mode: 0o755 })

  const second = await getOrPopulateHelp(cwd, 'kali-countme', bin)
  assert.ok(second.includes('USAGE: countme'), `second call should be cached: ${second}`)
  assert.ok(!second.includes('DIFFERENT OUTPUT'), 'second call should NOT re-exec binary')
})

test('populateHelpCache falls back to -h when --help produces nothing', async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'nr-help-cache-'))
  const binDir = join(cwd, 'bin')

  // Script: --help prints nothing, -h prints usage
  const script = [
    'if [ "$1" = "--help" ]; then exit 1; fi',
    'if [ "$1" = "-h" ]; then echo "USAGE: fallback -h works"; exit 0; fi',
    'exit 1',
  ].join('\n')
  const bin = await makeFakeBinary(binDir, 'fallbacktool', script)

  const { cached, output } = await populateHelpCache(cwd, 'kali-fallbacktool', bin)
  assert.equal(cached, true)
  assert.ok(output.includes('USAGE: fallback -h works'), `unexpected output: ${output}`)
})

test('populateHelpCache returns cached=false for unknown binary', async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'nr-help-cache-'))
  const { cached, output } = await populateHelpCache(
    cwd,
    'kali-nonexistent',
    '/nonexistent/binary/that/does/not/exist',
  )
  assert.equal(cached, false)
  assert.equal(output, '')
})
