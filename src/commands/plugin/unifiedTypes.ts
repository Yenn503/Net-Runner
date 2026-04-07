import type { ConfigScope, MCPServerConnection } from '../../services/mcp/types.js'
import type { LoadedPlugin, PluginError } from '../../types/plugin.js'

export type UnifiedPluginScope =
  | 'user'
  | 'project'
  | 'local'
  | 'managed'
  | 'builtin'

export type UnifiedItemScope = ConfigScope | 'builtin' | 'flagged'

export type UnifiedMcpStatus =
  | 'connected'
  | 'disabled'
  | 'pending'
  | 'needs-auth'
  | 'failed'

export type PendingToggleState = 'will-enable' | 'will-disable'

export type UnifiedPluginItem = {
  type: 'plugin'
  id: string
  name: string
  description?: string
  marketplace: string
  scope: UnifiedPluginScope
  isEnabled: boolean
  errorCount: number
  errors: PluginError[]
  plugin: LoadedPlugin
  pendingEnable?: boolean
  pendingUpdate?: boolean
  pendingToggle?: PendingToggleState
}

export type UnifiedFlaggedPluginItem = {
  type: 'flagged-plugin'
  id: string
  name: string
  marketplace: string
  scope: 'flagged'
  reason: string
  text: string
  flaggedAt: string
}

export type UnifiedFailedPluginItem = {
  type: 'failed-plugin'
  id: string
  name: string
  marketplace: string
  scope: UnifiedPluginScope
  errorCount: number
  errors: PluginError[]
}

export type UnifiedMcpItem = {
  type: 'mcp'
  id: string
  name: string
  description?: string
  scope: UnifiedItemScope
  status: UnifiedMcpStatus
  client: MCPServerConnection
  indented?: boolean
}

export type UnifiedInstalledItem =
  | UnifiedPluginItem
  | UnifiedFlaggedPluginItem
  | UnifiedFailedPluginItem
  | UnifiedMcpItem
