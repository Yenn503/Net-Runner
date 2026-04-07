import { exitWithError } from '../utils/process.js'

export async function runDaemonWorker(kind: string | undefined): Promise<never> {
  const suffix = kind ? ` (${kind})` : ''
  return exitWithError(
    `The daemon worker runtime${suffix} is not included in this open-source Net-Runner snapshot.`,
  )
}
