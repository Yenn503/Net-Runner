import { exitWithError } from '../utils/process.js'

export async function daemonMain(_args: string[]): Promise<never> {
  return exitWithError(
    'The daemon supervisor is not included in this open-source Net-Runner snapshot.',
  )
}
