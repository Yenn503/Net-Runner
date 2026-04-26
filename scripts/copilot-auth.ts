// @ts-nocheck
/**
 * GitHub Copilot authentication helpers.
 *
 * Two-stage auth:
 *   1. GitHub OAuth device-code flow -> long-lived GitHub access token.
 *      The user enters a code at https://github.com/login/device.
 *   2. Exchange that token at /copilot_internal/v2/token for a short-lived
 *      Copilot token (~30 min). Used as the bearer for api.githubcopilot.com.
 *
 * The Copilot endpoints (api.githubcopilot.com/{models,chat/completions}) are
 * the same endpoints used by VS Code's Copilot Chat. The catalog you see here
 * is the catalog tied to your Copilot subscription tier (Pro / Pro+ / Business
 * / Enterprise), not the public GitHub Models catalog.
 *
 * Caveats:
 *   - The token-exchange endpoint is undocumented; behaviour can change.
 *   - Requires an ACTIVE Copilot subscription; Copilot Free does not expose it.
 *   - Client ID is the VS Code editor client_id (community convention).
 */

const VSCODE_CLIENT_ID = 'Iv1.b507a08c87ecfe98'

const DEVICE_CODE_URL = 'https://github.com/login/device/code'
const ACCESS_TOKEN_URL = 'https://github.com/login/oauth/access_token'
const COPILOT_TOKEN_URL = 'https://api.github.com/copilot_internal/v2/token'

export const COPILOT_API_BASE = 'https://api.githubcopilot.com'
export const COPILOT_MODELS_URL = `${COPILOT_API_BASE}/models`

export type DeviceCodeResponse = {
  device_code: string
  user_code: string
  verification_uri: string
  expires_in: number
  interval: number
}

export type AccessTokenResponse =
  | { access_token: string; token_type: string; scope: string }
  | { error: string; error_description?: string; interval?: number }

export type CopilotTokenResponse = {
  token: string
  expires_at: number
  refresh_in?: number
  endpoints?: { api?: string }
  /** Many other fields the Copilot service returns; we only use a few. */
  [key: string]: unknown
}

export type CopilotModelEntry = {
  id: string
  name?: string
  vendor?: string
  version?: string
  /**
   * Whether VS Code's Copilot Chat picker exposes this model. Models with
   * model_picker_enabled === false are typically embedding-only or scoped
   * to a different surface (e.g. completions) and reject /chat/completions
   * with HTTP 400 'model_not_supported'.
   */
  model_picker_enabled?: boolean
  /** Some Copilot service versions return this field at the top level. */
  policy?: { state?: string; terms?: string }
  capabilities?: {
    family?: string
    /**
     * 'chat' for chat-completion-capable models, 'embeddings' for embedding
     * models, 'completion' for legacy completions-only models. Only 'chat'
     * is usable through Net-Runner's OpenAI-compatible chat completions
     * endpoint.
     */
    type?: 'chat' | 'embeddings' | 'completion' | string
    supports?: { tool_calls?: boolean; streaming?: boolean }
    limits?: { max_context_window_tokens?: number; max_output_tokens?: number }
  }
  /** Top-level fields vary per Copilot service version. */
  [key: string]: unknown
}

/**
 * Returns true if the model is usable for /chat/completions on
 * api.githubcopilot.com. Filters out embedding-only models and any model
 * the picker isn't supposed to expose. Defensive about missing fields:
 * if neither model_picker_enabled nor capabilities.type is present, the
 * model is included (better UX than silently hiding usable models when
 * the catalog shape changes).
 */
export function isCopilotChatModel(m: CopilotModelEntry): boolean {
  if (m.model_picker_enabled === false) return false
  const t = m.capabilities?.type
  if (t === 'embeddings' || t === 'completion') return false
  return true
}

/**
 * Send a minimal /chat/completions probe to verify a model is entitled to
 * the current subscription. Copilot's catalog returns models the user is
 * not actually entitled to use; the only reliable way to know is to ask.
 *
 * Resolves to:
 *   { ok: true } if the model accepts a chat completion
 *   { ok: false, reason } with the server's error message otherwise
 *
 * Uses max_tokens: 1 to keep the probe cheap (single token roundtrip).
 */
export async function probeCopilotModel(
  copilotToken: string,
  modelId: string,
): Promise<{ ok: true } | { ok: false, status: number, reason: string }> {
  try {
    const res = await fetch(`${COPILOT_API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${copilotToken}`,
        'Content-Type': 'application/json',
        'User-Agent': 'GitHubCopilotChat/0.26.7',
        'Editor-Version': 'vscode/1.99.3',
        'Editor-Plugin-Version': 'copilot-chat/0.26.7',
        'Copilot-Integration-Id': 'vscode-chat',
      },
      body: JSON.stringify({
        model: modelId,
        messages: [{ role: 'user', content: 'ping' }],
        max_tokens: 1,
        stream: false,
      }),
    })
    if (res.ok) return { ok: true }
    const body = await safeText(res)
    let reason = `HTTP ${res.status}`
    try {
      const json = JSON.parse(body)
      reason = json?.error?.message || json?.message || reason
    } catch {
      if (body) reason = `${reason}: ${body}`
    }
    return { ok: false, status: res.status, reason }
  } catch (err) {
    return { ok: false, status: 0, reason: (err as Error).message }
  }
}

const JSON_HEADERS = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
  'User-Agent': 'Net-Runner-CLI',
}

/**
 * Begin the device-code flow. Returns the user_code + verification_uri to
 * display, plus the device_code we'll poll with.
 */
export async function startDeviceCodeFlow(): Promise<DeviceCodeResponse> {
  const res = await fetch(DEVICE_CODE_URL, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({
      client_id: VSCODE_CLIENT_ID,
      scope: 'read:user',
    }),
  })
  if (!res.ok) {
    throw new Error(`Device-code request failed: HTTP ${res.status} ${await safeText(res)}`)
  }
  return await res.json() as DeviceCodeResponse
}

/**
 * Poll for the access token. Resolves once the user authorises, rejects on
 * error or expiry. Pollers respect server-recommended interval and the
 * 'slow_down' / 'authorization_pending' error codes.
 */
export async function pollForAccessToken(
  device: DeviceCodeResponse,
  onStatus?: (msg: string) => void,
): Promise<string> {
  const deadline = Date.now() + device.expires_in * 1000
  let interval = Math.max(1, device.interval) * 1000

  while (Date.now() < deadline) {
    await sleep(interval)
    const res = await fetch(ACCESS_TOKEN_URL, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({
        client_id: VSCODE_CLIENT_ID,
        device_code: device.device_code,
        grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
      }),
    })
    if (!res.ok) {
      throw new Error(`Token poll failed: HTTP ${res.status} ${await safeText(res)}`)
    }
    const body = await res.json() as AccessTokenResponse
    if ('access_token' in body) {
      return body.access_token
    }
    if (body.error === 'authorization_pending') {
      continue
    }
    if (body.error === 'slow_down') {
      interval += 5000
      continue
    }
    throw new Error(`Authorisation failed: ${body.error}${body.error_description ? ` (${body.error_description})` : ''}`)
  }
  throw new Error('Authorisation timed out — re-run setup and authorise within the time limit.')
}

/**
 * Exchange a long-lived GitHub OAuth access token for a short-lived Copilot
 * service token. The returned `token` is what api.githubcopilot.com expects
 * as the Bearer credential.
 */
export async function exchangeForCopilotToken(githubAccessToken: string): Promise<CopilotTokenResponse> {
  const res = await fetch(COPILOT_TOKEN_URL, {
    method: 'GET',
    headers: {
      Authorization: `token ${githubAccessToken}`,
      Accept: 'application/json',
      'User-Agent': 'Net-Runner-CLI',
      'Editor-Version': 'Neovim/0.9.0',
      'Editor-Plugin-Version': 'copilot.lua/1.13.0',
    },
  })
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      throw new Error(
        `Copilot token exchange failed: HTTP ${res.status}. ` +
        `This usually means the GitHub account does not have an active Copilot subscription, ` +
        `or that the OAuth token does not have access to Copilot endpoints.`
      )
    }
    throw new Error(`Copilot token exchange failed: HTTP ${res.status} ${await safeText(res)}`)
  }
  return await res.json() as CopilotTokenResponse
}

/**
 * Fetch the live Copilot subscription model catalog. Requires a fresh
 * Copilot token (not a GitHub OAuth token).
 */
export async function fetchCopilotModels(copilotToken: string): Promise<CopilotModelEntry[]> {
  const res = await fetch(COPILOT_MODELS_URL, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${copilotToken}`,
      Accept: 'application/json',
      'User-Agent': 'Net-Runner-CLI',
      'Editor-Version': 'Neovim/0.9.0',
      'Editor-Plugin-Version': 'copilot.lua/1.13.0',
      'Copilot-Integration-Id': 'vscode-chat',
    },
  })
  if (!res.ok) {
    throw new Error(`Copilot models fetch failed: HTTP ${res.status} ${await safeText(res)}`)
  }
  const body = await res.json() as { data?: CopilotModelEntry[] } | CopilotModelEntry[]
  const models = Array.isArray(body) ? body : body?.data
  if (!Array.isArray(models)) {
    throw new Error('Copilot /models returned an unexpected shape.')
  }
  return models
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function safeText(res: Response): Promise<string> {
  try {
    return (await res.text()).slice(0, 200)
  } catch {
    return ''
  }
}
