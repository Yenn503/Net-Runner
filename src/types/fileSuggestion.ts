import type { HookBaseInput } from './statusLine.js'

export type FileSuggestionCommandInput = HookBaseInput & {
  query: string
}
