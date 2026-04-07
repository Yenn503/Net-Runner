import { exitWithError } from '../utils/process.js'

function exitUnavailable(name: string): never {
  return exitWithError(
    `Background session command "${name}" is not included in this open-source Net-Runner snapshot.`,
  )
}

export async function psHandler(_args: string[]): Promise<never> {
  return exitUnavailable('ps')
}

export async function logsHandler(_sessionId: string | undefined): Promise<never> {
  return exitUnavailable('logs')
}

export async function attachHandler(
  _sessionId: string | undefined,
): Promise<never> {
  return exitUnavailable('attach')
}

export async function killHandler(_sessionId: string | undefined): Promise<never> {
  return exitUnavailable('kill')
}

export async function handleBgFlag(_args: string[]): Promise<never> {
  return exitUnavailable('--bg')
}
