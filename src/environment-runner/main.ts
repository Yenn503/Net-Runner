import { exitWithError } from '../utils/process.js'

export async function environmentRunnerMain(_args: string[]): Promise<never> {
  return exitWithError(
    'The environment-runner entrypoint is not included in this open-source Net-Runner snapshot.',
  )
}
