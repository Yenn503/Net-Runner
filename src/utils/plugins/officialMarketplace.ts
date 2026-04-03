/**
 * Constants for the first-party Net-Runner plugins marketplace.
 *
 * The marketplace runtime remains built in, but the backing first-party
 * repository must be configured explicitly until a public Net-Runner
 * marketplace repo is published.
 */

import type { MarketplaceSource } from './schemas.js'

export const OFFICIAL_MARKETPLACE_NAME =
  process.env.NETRUNNER_OFFICIAL_MARKETPLACE_NAME || 'net-runner-official'

export function getOfficialMarketplaceSource(): MarketplaceSource | null {
  const repo = process.env.NETRUNNER_OFFICIAL_MARKETPLACE_REPO?.trim()
  if (!repo) return null

  return {
    source: 'github',
    repo,
  } as const satisfies MarketplaceSource
}

export function hasOfficialMarketplaceSource(): boolean {
  return getOfficialMarketplaceSource() !== null
}
