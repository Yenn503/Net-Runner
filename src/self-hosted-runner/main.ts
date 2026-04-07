import { exitWithError } from '../utils/process.js'

export async function selfHostedRunnerMain(_args: string[]): Promise<never> {
  return exitWithError(
    'The self-hosted-runner entrypoint is not included in this open-source Net-Runner snapshot.',
  )
}
