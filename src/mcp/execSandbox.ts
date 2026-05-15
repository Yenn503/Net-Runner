/**
 * Opt-in sandboxed execution for the `nr_exec` MCP tool.
 *
 * By default `nr_exec` runs commands on the operator host. Setting
 * `NETRUNNER_EXEC_SANDBOX=docker` routes them through a disposable Docker
 * container instead (working dir mounted read-only, `--network none` by
 * default, dropped capabilities). The harness's CLI-driven Bash tool is a
 * separate execution path and is intentionally not affected by this module.
 *
 * `runInSandbox` resolves with `{ stdout, stderr }` on success and throws an
 * error shaped like `child_process.exec`'s (`.stdout`, `.stderr`, `.code`,
 * `.killed`, `.message`) on failure, so the existing `nr_exec` success/catch
 * logic is reused verbatim.
 */
import { execFile } from 'child_process'
import { promisify } from 'util'
import { randomUUID } from 'crypto'

const execFileAsync = promisify(execFile)

const EXEC_MAX_BUFFER_BYTES = 10 * 1024 * 1024

export type SandboxConfig = {
  enabled: boolean
  image: string
  network: 'none' | 'host'
  memory: string
  cpus: string
  fallbackToHost: boolean
}

/**
 * Read sandbox config from the environment. An unset (or non-`docker`)
 * `NETRUNNER_EXEC_SANDBOX` yields `enabled: false` — the default host path.
 */
export function getSandboxConfig(
  env: NodeJS.ProcessEnv = process.env,
): SandboxConfig {
  const mode = (env.NETRUNNER_EXEC_SANDBOX ?? '').trim().toLowerCase()
  return {
    enabled: mode === 'docker',
    image:
      env.NETRUNNER_EXEC_SANDBOX_IMAGE?.trim() || 'kalilinux/kali-rolling',
    network:
      env.NETRUNNER_EXEC_SANDBOX_NETWORK?.trim() === 'host' ? 'host' : 'none',
    memory: env.NETRUNNER_EXEC_SANDBOX_MEMORY?.trim() || '2g',
    cpus: env.NETRUNNER_EXEC_SANDBOX_CPUS?.trim() || '2',
    fallbackToHost:
      env.NETRUNNER_EXEC_SANDBOX_FALLBACK?.trim().toLowerCase() === 'host',
  }
}

/** Build the `docker run` argv for a command. Pure — exported for tests. */
export function buildDockerArgs(
  command: string,
  cwd: string,
  cfg: SandboxConfig,
  containerName: string,
): string[] {
  return [
    'run',
    '--rm',
    '--name',
    containerName,
    '--network',
    cfg.network,
    '--memory',
    cfg.memory,
    '--cpus',
    cfg.cpus,
    '--pids-limit',
    '512',
    '--cap-drop',
    'ALL',
    '--security-opt',
    'no-new-privileges',
    '-v',
    `${cwd}:/work:ro`,
    '-w',
    '/work',
    '-e',
    'TERM=dumb',
    cfg.image,
    'sh',
    '-c',
    command,
  ]
}

let dockerProbe: Promise<string | null> | null = null

/** Cached one-shot check that the docker CLI + daemon are reachable. */
export function probeDocker(): Promise<string | null> {
  if (!dockerProbe) {
    dockerProbe = execFileAsync(
      'docker',
      ['version', '--format', '{{.Server.Version}}'],
      { timeout: 10_000 },
    )
      .then(r => r.stdout.trim() || 'unknown')
      .catch(() => null)
  }
  return dockerProbe
}

/** Reset the cached docker probe — for tests. */
export function resetDockerProbe(): void {
  dockerProbe = null
}

export type SandboxRunResult = { stdout: string; stderr: string }

/**
 * Run `command` inside a disposable Docker container. Resolves with
 * `{ stdout, stderr }`; throws an exec-shaped error on failure so callers
 * need no special handling versus the host `child_process.exec` path.
 */
export async function runInSandbox(
  command: string,
  cwd: string,
  timeout: number,
  cfg: SandboxConfig,
  log?: (msg: string) => void,
): Promise<SandboxRunResult> {
  const containerName = `nr-exec-${randomUUID()}`
  const args = buildDockerArgs(command, cwd, cfg, containerName)
  log?.(
    `docker run (image=${cfg.image} network=${cfg.network} name=${containerName})`,
  )
  try {
    const { stdout, stderr } = await execFileAsync('docker', args, {
      timeout,
      maxBuffer: EXEC_MAX_BUFFER_BYTES,
    })
    return { stdout, stderr }
  } catch (err) {
    // On timeout the docker client is signalled but the container may linger.
    if (
      err &&
      typeof err === 'object' &&
      'killed' in err &&
      (err as { killed?: boolean }).killed
    ) {
      execFile('docker', ['rm', '-f', containerName], () => {})
    }
    throw err
  }
}
