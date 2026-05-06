// @ts-nocheck
/**
 * ChatGPT subscription OAuth helpers.
 *
 * Device-code flow against auth.openai.com. Lets ChatGPT Plus/Pro/Team/Enterprise
 * subscribers use their subscription credits in Net-Runner — the same mechanism
 * used by other third-party harnesses that integrate with OpenAI's platform OAuth.
 *
 * Flow:
 *   1. POST /oauth/device/code  → device_code + user_code + verification_uri
 *   2. User opens browser, enters code.
 *   3. Poll /oauth/token until access_token arrives.
 *   4. access_token is used as Bearer on api.openai.com/v1.
 *   5. refresh_token stored in profile for silent re-auth on expiry.
 *
 * The access_token is an OpenAI user-scoped JWT that authorises requests on
 * behalf of the authenticated ChatGPT account. Model calls are billed to the
 * account's subscription tier, not an API key balance.
 */

export const CHATGPT_CLIENT_ID = 'app_EMoamEEZ73f0CkXaXp7hrann'
export const CHATGPT_AUTH_BASE = 'https://auth.openai.com'
export const CHATGPT_DEVICE_CODE_URL = `${CHATGPT_AUTH_BASE}/oauth/device/code`
export const CHATGPT_TOKEN_URL = `${CHATGPT_AUTH_BASE}/oauth/token`
export const CHATGPT_API_BASE = 'https://api.openai.com/v1'
export const CHATGPT_MODELS_URL = `${CHATGPT_API_BASE}/models`

const CHATGPT_SCOPES = 'openid profile email offline_access'

export type ChatGPTDeviceCodeResponse = {
  device_code: string
  user_code: string
  verification_uri: string
  verification_uri_complete?: string
  expires_in: number
  interval: number
}

export type ChatGPTTokenResponse =
  | {
      access_token: string
      refresh_token: string
      token_type: string
      expires_in: number
      scope?: string
    }
  | {
      error: string
      error_description?: string
      interval?: number
    }

export type ChatGPTTokenSuccess = {
  access_token: string
  refresh_token: string
  expires_in: number
}

export type ChatGPTModelEntry = {
  id: string
  object?: string
  created?: number
  owned_by?: string
}

const JSON_HEADERS = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
  'User-Agent': 'Net-Runner-CLI',
}

/**
 * Begin the device-code flow. Returns the user_code + verification_uri to display.
 */
export async function startChatGPTDeviceCodeFlow(): Promise<ChatGPTDeviceCodeResponse> {
  const res = await fetch(CHATGPT_DEVICE_CODE_URL, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({
      client_id: CHATGPT_CLIENT_ID,
      scope: CHATGPT_SCOPES,
    }),
  })
  if (!res.ok) {
    throw new Error(`ChatGPT device-code request failed: HTTP ${res.status} ${await safeText(res)}`)
  }
  return await res.json() as ChatGPTDeviceCodeResponse
}

/**
 * Poll for the access token. Resolves once the user authorises, rejects on error or expiry.
 * Handles authorization_pending and slow_down codes from the server.
 */
export async function pollChatGPTForToken(
  device: ChatGPTDeviceCodeResponse,
  onStatus?: (msg: string) => void,
): Promise<ChatGPTTokenSuccess> {
  const deadline = Date.now() + device.expires_in * 1000
  let interval = Math.max(5, device.interval) * 1000

  while (Date.now() < deadline) {
    await sleep(interval)
    const res = await fetch(CHATGPT_TOKEN_URL, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({
        client_id: CHATGPT_CLIENT_ID,
        device_code: device.device_code,
        grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
      }),
    })
    if (!res.ok) {
      const body = await safeText(res)
      // Some error codes come back as non-200 with JSON body
      try {
        const parsed = JSON.parse(body) as { error?: string; error_description?: string; interval?: number }
        if (parsed.error === 'authorization_pending') {
          onStatus?.('Waiting for authorization...')
          continue
        }
        if (parsed.error === 'slow_down') {
          interval += (parsed.interval ?? 5) * 1000
          onStatus?.(`Rate limited — slowing poll to ${interval / 1000}s`)
          continue
        }
        throw new Error(`Auth failed: ${parsed.error}${parsed.error_description ? ` (${parsed.error_description})` : ''}`)
      } catch (parseErr) {
        if (parseErr instanceof SyntaxError) {
          throw new Error(`Token poll failed: HTTP ${res.status} ${body}`)
        }
        throw parseErr
      }
    }
    const body = await res.json() as ChatGPTTokenResponse
    if ('access_token' in body) {
      return {
        access_token: body.access_token,
        refresh_token: body.refresh_token,
        expires_in: body.expires_in,
      }
    }
    if (body.error === 'authorization_pending') {
      onStatus?.('Waiting for authorization...')
      continue
    }
    if (body.error === 'slow_down') {
      interval += ((body.interval ?? 5) + 5) * 1000
      onStatus?.(`Rate limited — slowing poll to ${interval / 1000}s`)
      continue
    }
    throw new Error(`Auth failed: ${body.error}${body.error_description ? ` (${body.error_description})` : ''}`)
  }
  throw new Error('Authorization timed out — re-run setup and authorize within the time limit.')
}

/**
 * Use the stored refresh_token to obtain a fresh access_token without user interaction.
 */
export async function refreshChatGPTToken(refreshToken: string): Promise<ChatGPTTokenSuccess> {
  const res = await fetch(CHATGPT_TOKEN_URL, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({
      client_id: CHATGPT_CLIENT_ID,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  })
  if (!res.ok) {
    if (res.status === 401 || res.status === 400) {
      throw new Error(
        `ChatGPT token refresh failed: HTTP ${res.status}. ` +
        `The refresh token may have expired or been revoked. Re-run \`bun run setup --force\`.`
      )
    }
    throw new Error(`ChatGPT token refresh failed: HTTP ${res.status} ${await safeText(res)}`)
  }
  const body = await res.json() as ChatGPTTokenResponse
  if (!('access_token' in body)) {
    throw new Error(`ChatGPT token refresh returned error: ${'error' in body ? body.error : 'unknown'}`)
  }
  return {
    access_token: body.access_token,
    refresh_token: body.refresh_token ?? refreshToken,
    expires_in: body.expires_in,
  }
}

/**
 * Fetch available models from api.openai.com for the authenticated account.
 * Filters to chat-capable (gpt-* and o*) models only.
 */
export async function fetchChatGPTModels(accessToken: string): Promise<ChatGPTModelEntry[]> {
  const res = await fetch(CHATGPT_MODELS_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
      'User-Agent': 'Net-Runner-CLI',
    },
  })
  if (!res.ok) {
    throw new Error(`ChatGPT /models failed: HTTP ${res.status} ${await safeText(res)}`)
  }
  const body = await res.json() as { data?: ChatGPTModelEntry[] } | ChatGPTModelEntry[]
  const models = Array.isArray(body) ? body : body?.data
  if (!Array.isArray(models)) {
    throw new Error('ChatGPT /models returned unexpected shape.')
  }
  return models.filter(m => /^(gpt-|o\d|chatgpt-)/.test(m.id))
}

/**
 * Send a minimal probe to verify the access token and model are working.
 */
export async function probeChatGPTModel(
  accessToken: string,
  modelId: string,
): Promise<{ ok: true } | { ok: false; status: number; reason: string }> {
  try {
    const res = await fetch(`${CHATGPT_API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Net-Runner-CLI',
      },
      body: JSON.stringify({
        model: modelId,
        messages: [{ role: 'user', content: 'ping' }],
        max_tokens: 1,
        stream: false,
      }),
    })
    if (res.ok) return { ok: true }
    const raw = await safeText(res)
    let reason = `HTTP ${res.status}`
    try {
      const json = JSON.parse(raw)
      reason = json?.error?.message || json?.message || reason
    } catch {
      if (raw) reason = `${reason}: ${raw}`
    }
    return { ok: false, status: res.status, reason }
  } catch (err) {
    return { ok: false, status: 0, reason: (err as Error).message }
  }
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
