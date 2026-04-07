import type { Dispatch, SetStateAction } from 'react'
import type { TerminalQuerier } from '../ink/terminal-querier.js'
import { oscColor } from '../ink/terminal-querier.js'
import {
  getSystemThemeName,
  setCachedSystemTheme,
  themeFromOscColor,
  type SystemTheme,
} from './systemTheme.js'

const POLL_INTERVAL_MS = 30_000

function applyTheme(
  nextTheme: SystemTheme,
  setTheme: Dispatch<SetStateAction<SystemTheme>>,
): void {
  setCachedSystemTheme(nextTheme)
  setTheme(nextTheme)
}

async function pollSystemTheme(
  querier: TerminalQuerier,
  setTheme: Dispatch<SetStateAction<SystemTheme>>,
): Promise<void> {
  const response = await querier.send(oscColor(11))
  await querier.flush()

  const nextTheme =
    response && 'data' in response && typeof response.data === 'string'
      ? themeFromOscColor(response.data)
      : undefined

  applyTheme(nextTheme ?? getSystemThemeName(), setTheme)
}

export function watchSystemTheme(
  querier: TerminalQuerier,
  setTheme: Dispatch<SetStateAction<SystemTheme>>,
): () => void {
  let disposed = false

  const runPoll = () => {
    void pollSystemTheme(querier, setTheme).catch(() => {
      if (!disposed) {
        applyTheme(getSystemThemeName(), setTheme)
      }
    })
  }

  runPoll()
  const interval = setInterval(runPoll, POLL_INTERVAL_MS)

  return () => {
    disposed = true
    clearInterval(interval)
  }
}
