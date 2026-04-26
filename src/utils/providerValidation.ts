import { resolve } from 'node:path'
import {
  isLocalProviderUrl,
  resolveCodexApiCredentials,
  resolveProviderRequest,
} from '../services/api/providerConfig.js'
import {
  PROFILE_FILE_NAME,
} from './providerProfile.js'

function isEnvTruthy(value: string | undefined): boolean {
  if (!value) return false
  const normalized = value.trim().toLowerCase()
  return normalized !== '' && normalized !== '0' && normalized !== 'false' && normalized !== 'no'
}

function getOpenAIMissingKeyMessage(): string {
  const profilePath = resolve(process.cwd(), PROFILE_FILE_NAME)
  return [
    'OPENAI_API_KEY is required when NETRUNNER_USE_OPENAI=1 and OPENAI_BASE_URL is not local.',
    'To recover, run /provider and switch provider, or unset NETRUNNER_USE_OPENAI in your shell.',
    `Saved startup settings can come from ${profilePath}.`,
  ].join('\n')
}

export async function getProviderValidationError(
  env: NodeJS.ProcessEnv = process.env,
): Promise<string | null> {
  const useGithub =
    isEnvTruthy(env.NETRUNNER_USE_GITHUB) ||
    isEnvTruthy(env.CLAUDE_CODE_USE_GITHUB)
  const useGemini =
    isEnvTruthy(env.NETRUNNER_USE_GEMINI) ||
    isEnvTruthy(env.CLAUDE_CODE_USE_GEMINI)
  const useOpenAI =
    isEnvTruthy(env.NETRUNNER_USE_OPENAI) ||
    isEnvTruthy(env.CLAUDE_CODE_USE_OPENAI)

  if (useGithub) {
    const token = env.GITHUB_TOKEN?.trim() || env.GH_TOKEN?.trim() || env.OPENAI_API_KEY?.trim()
    if (!token) {
      return 'GitHub Models authentication required.\nRun /provider in the CLI to configure GitHub Models.'
    }
    return null
  }

  if (useGemini) {
    const key = env.GEMINI_API_KEY?.trim() || env.GOOGLE_API_KEY?.trim()
    if (!key) {
      return 'GEMINI_API_KEY or GOOGLE_API_KEY is required when NETRUNNER_USE_GEMINI=1.'
    }
    return null
  }

  if (!useOpenAI) {
    return null
  }

  const request = resolveProviderRequest({
    model: env.OPENAI_MODEL,
    baseUrl: env.OPENAI_BASE_URL,
  })

  if (env.OPENAI_API_KEY === 'SUA_CHAVE') {
    return 'Invalid OPENAI_API_KEY: placeholder value SUA_CHAVE detected. Set a real key or unset for local providers.'
  }

  if (request.transport === 'codex_responses') {
    const credentials = resolveCodexApiCredentials(env)
    if (!credentials.apiKey) {
      const authHint = credentials.authPath
        ? ` or put auth.json at ${credentials.authPath}`
        : ''
      return `Codex auth is required for ${request.requestedModel}. Set CODEX_API_KEY${authHint}.`
    }
    if (!credentials.accountId) {
      return 'Codex auth is missing chatgpt_account_id. Re-login with Codex or set CHATGPT_ACCOUNT_ID/CODEX_ACCOUNT_ID.'
    }
    return null
  }

  if (!env.OPENAI_API_KEY && !isLocalProviderUrl(request.baseUrl)) {
    return getOpenAIMissingKeyMessage()
  }

  return null
}

export function shouldExitForStartupProviderValidationError(options: {
  args?: string[]
  stdoutIsTTY?: boolean
} = {}): boolean {
  const args = options.args ?? process.argv.slice(2)
  const stdoutIsTTY = options.stdoutIsTTY ?? process.stdout.isTTY

  if (!stdoutIsTTY) {
    return true
  }

  return (
    args.includes('-p') ||
    args.includes('--print') ||
    args.includes('--init-only')
  )
}

export async function validateProviderEnvForStartupOrExit(
  env: NodeJS.ProcessEnv = process.env,
  options?: {
    args?: string[]
    stdoutIsTTY?: boolean
  },
): Promise<void> {
  const error = await getProviderValidationError(env)
  if (!error) {
    return
  }

  if (shouldExitForStartupProviderValidationError(options)) {
    console.error(error)
    process.exit(1)
  }

  console.error(
    `Warning: provider configuration is incomplete.\n${error}\nNet-Runner will continue starting so you can run /provider and repair the saved provider settings.`,
  )
}
