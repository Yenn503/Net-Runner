export type ClaudeAiOauthStorage = {
  accessToken: string | null
  refreshToken: string | null
  expiresAt: number | null
  scopes: string[]
  subscriptionType: string | null
  rateLimitTier: string | null
}

export type McpOAuthDiscoveryState = {
  authorizationServerUrl?: string
  resourceMetadataUrl?: string
  resourceMetadata?: Record<string, unknown>
  authorizationServerMetadata?: Record<string, unknown>
}

export type McpOAuthStorageEntry = {
  serverName: string
  serverUrl: string
  accessToken: string
  refreshToken?: string
  expiresAt: number
  scope?: string
  clientId?: string
  clientSecret?: string
  stepUpScope?: string
  discoveryState?: McpOAuthDiscoveryState
}

export type McpOAuthClientConfigEntry = {
  clientSecret?: string
}

export type McpXaaIdpEntry = {
  idToken: string
  expiresAt: number
}

export type McpXaaIdpConfigEntry = {
  clientSecret: string
}

export type SecureStorageData = {
  claudeAiOauth?: ClaudeAiOauthStorage
  mcpOAuth?: Record<string, McpOAuthStorageEntry>
  mcpOAuthClientConfig?: Record<string, McpOAuthClientConfigEntry>
  mcpXaaIdp?: Record<string, McpXaaIdpEntry>
  mcpXaaIdpConfig?: Record<string, McpXaaIdpConfigEntry>
  [key: string]: unknown
}

export type SecureStorage = {
  name: string
  read(): SecureStorageData | null
  readAsync(): Promise<SecureStorageData | null>
  update(data: SecureStorageData): { success: boolean; warning?: string }
  delete(): boolean
}
