import type {
  SSHSessionManager,
  SSHSessionManagerCallbacks,
} from './SSHSessionManager.js'

export type SSHSession = {
  remoteCwd: string
  proc: {
    exitCode: number | null
    signalCode: NodeJS.Signals | null
  }
  proxy: {
    stop(): void
  }
  getStderrTail(): string
  createManager(callbacks: SSHSessionManagerCallbacks): SSHSessionManager
}

export class SSHSessionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SSHSessionError'
  }
}

function unsupported(): never {
  throw new SSHSessionError(
    'SSH remote sessions are not included in this OSS build.',
  )
}

export async function createSSHSession(_config: {
  host: string
  cwd?: string
  localVersion: string
  permissionMode?: string
  dangerouslySkipPermissions?: boolean
  extraCliArgs?: string[]
}, _options?: {
  onProgress?: (message: string) => void
}): Promise<SSHSession> {
  unsupported()
}

export function createLocalSSHSession(_config: {
  cwd?: string
  permissionMode?: string
  dangerouslySkipPermissions?: boolean
}): SSHSession {
  unsupported()
}
