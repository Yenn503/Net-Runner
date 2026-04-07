import { exitWithError } from '../../utils/process.js'

export async function templatesMain(_args: string[]): Promise<never> {
  return exitWithError(
    'Template job commands are not included in this open-source Net-Runner snapshot.',
  )
}
