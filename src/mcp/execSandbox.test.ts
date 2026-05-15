import assert from 'node:assert/strict'
import test from 'node:test'
import { buildDockerArgs, getSandboxConfig } from './execSandbox.ts'

test('getSandboxConfig is disabled when NETRUNNER_EXEC_SANDBOX is unset', () => {
  const cfg = getSandboxConfig({})
  assert.equal(cfg.enabled, false)
})

test('getSandboxConfig is disabled for non-docker values', () => {
  assert.equal(getSandboxConfig({ NETRUNNER_EXEC_SANDBOX: 'yes' }).enabled, false)
  assert.equal(getSandboxConfig({ NETRUNNER_EXEC_SANDBOX: '' }).enabled, false)
})

test('getSandboxConfig enables on docker with safe defaults', () => {
  const cfg = getSandboxConfig({ NETRUNNER_EXEC_SANDBOX: 'docker' })
  assert.equal(cfg.enabled, true)
  assert.equal(cfg.image, 'kalilinux/kali-rolling')
  assert.equal(cfg.network, 'none')
  assert.equal(cfg.memory, '2g')
  assert.equal(cfg.cpus, '2')
  assert.equal(cfg.fallbackToHost, false)
})

test('getSandboxConfig honours overrides', () => {
  const cfg = getSandboxConfig({
    NETRUNNER_EXEC_SANDBOX: 'docker',
    NETRUNNER_EXEC_SANDBOX_IMAGE: 'custom:latest',
    NETRUNNER_EXEC_SANDBOX_NETWORK: 'host',
    NETRUNNER_EXEC_SANDBOX_MEMORY: '4g',
    NETRUNNER_EXEC_SANDBOX_CPUS: '4',
    NETRUNNER_EXEC_SANDBOX_FALLBACK: 'host',
  })
  assert.equal(cfg.image, 'custom:latest')
  assert.equal(cfg.network, 'host')
  assert.equal(cfg.memory, '4g')
  assert.equal(cfg.cpus, '4')
  assert.equal(cfg.fallbackToHost, true)
})

test('buildDockerArgs produces a hardened, read-only run invocation', () => {
  const cfg = getSandboxConfig({ NETRUNNER_EXEC_SANDBOX: 'docker' })
  const args = buildDockerArgs('id; whoami', '/home/op/engagement', cfg, 'nr-exec-test')

  assert.equal(args[0], 'run')
  assert.ok(args.includes('--rm'))
  assert.ok(args.includes('--cap-drop') && args.includes('ALL'))
  assert.ok(args.includes('--security-opt') && args.includes('no-new-privileges'))
  assert.ok(args.includes('--network'))
  assert.equal(args[args.indexOf('--network') + 1], 'none')
  assert.ok(args.includes('-v') && args.includes('/home/op/engagement:/work:ro'))
  // the user command is the final single argv element — not shell-spliced
  assert.equal(args[args.length - 1], 'id; whoami')
  assert.equal(args[args.length - 2], '-c')
  assert.equal(args[args.length - 3], 'sh')
})

test('buildDockerArgs uses host network when configured', () => {
  const cfg = getSandboxConfig({
    NETRUNNER_EXEC_SANDBOX: 'docker',
    NETRUNNER_EXEC_SANDBOX_NETWORK: 'host',
  })
  const args = buildDockerArgs('nmap target', '/work', cfg, 'nr-exec-test')
  assert.equal(args[args.indexOf('--network') + 1], 'host')
})
