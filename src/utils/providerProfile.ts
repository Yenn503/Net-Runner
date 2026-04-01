import {
  DEFAULT_CODEX_BASE_URL,
  DEFAULT_OPENAI_BASE_URL,
  isCodexBaseUrl,
  resolveCodexApiCredentials,
  resolveProviderRequest,
} from '../services/api/providerConfig.ts'
import {
  getGoalDefaultOpenAIModel,
  type RecommendationGoal,
} from './providerRecommendation.ts'

export type ProviderProfile = 'openai' | 'ollama' | 'codex'

export type ProfileEnv = {
  OPENAI_BASE_URL?: string
  OPENAI_MODEL?: string
  OPENAI_API_KEY?: string
  CODEX_API_KEY?: string
  CHATGPT_ACCOUNT_ID?: string
  CODEX_ACCOUNT_ID?: string
}

export type ProfileFile = {
  profile: ProviderProfile
  env: ProfileEnv
  createdAt: string
}

export function sanitizeApiKey(
  key: string | null | undefined,
): string | undefined {
  if (!key || key === 'SUA_CHAVE') return undefined
  return key
}

export function buildOllamaProfileEnv(
  model: string,
  options: {
    baseUrl?: string | null
    getOllamaChatBaseUrl: (baseUrl?: string) => string
  },
): ProfileEnv {
  return {
    OPENAI_BASE_URL: options.getOllamaChatBaseUrl(options.baseUrl ?? undefined),
    OPENAI_MODEL: model,
  }
}

export function buildOpenAIProfileEnv(options: {
  goal: RecommendationGoal
  model?: string | null
  baseUrl?: string | null
  apiKey?: string | null
  processEnv?: NodeJS.ProcessEnv
}): ProfileEnv | null {
  const processEnv = options.processEnv ?? process.env
  const key = sanitizeApiKey(options.apiKey ?? processEnv.OPENAI_API_KEY)
  if (!key) {
    return null
  }

  const defaultModel = getGoalDefaultOpenAIModel(options.goal)
  const shellOpenAIRequest = resolveProviderRequest({
    model: processEnv.OPENAI_MODEL,
    baseUrl: processEnv.OPENAI_BASE_URL,
    fallbackModel: defaultModel,
  })
  const useShellOpenAIConfig = shellOpenAIRequest.transport === 'chat_completions'

  return {
    OPENAI_BASE_URL:
      options.baseUrl ||
      (useShellOpenAIConfig ? processEnv.OPENAI_BASE_URL : undefined) ||
      DEFAULT_OPENAI_BASE_URL,
    OPENAI_MODEL:
      options.model ||
      (useShellOpenAIConfig ? processEnv.OPENAI_MODEL : undefined) ||
      defaultModel,
    OPENAI_API_KEY: key,
  }
}

export function buildCodexProfileEnv(options: {
  model?: string | null
  baseUrl?: string | null
  apiKey?: string | null
  processEnv?: NodeJS.ProcessEnv
}): ProfileEnv | null {
  const processEnv = options.processEnv ?? process.env
  const key = sanitizeApiKey(options.apiKey ?? processEnv.CODEX_API_KEY)
  const credentialEnv = key
    ? ({ ...processEnv, CODEX_API_KEY: key } as NodeJS.ProcessEnv)
    : processEnv
  const credentials = resolveCodexApiCredentials(credentialEnv)
  if (!credentials.apiKey || !credentials.accountId) {
    return null
  }

  const env: ProfileEnv = {
    OPENAI_BASE_URL: options.baseUrl || DEFAULT_CODEX_BASE_URL,
    OPENAI_MODEL: options.model || 'codexplan',
  }

  if (key) {
    env.CODEX_API_KEY = key
  }

  env.CHATGPT_ACCOUNT_ID = credentials.accountId

  return env
}

export function createProfileFile(
  profile: ProviderProfile,
  env: ProfileEnv,
): ProfileFile {
  return {
    profile,
    env,
    createdAt: new Date().toISOString(),
  }
}

export function selectAutoProfile(
  recommendedOllamaModel: string | null,
): ProviderProfile {
  return recommendedOllamaModel ? 'ollama' : 'openai'
}

export async function buildLaunchEnv(options: {
  profile: ProviderProfile
  persisted: ProfileFile | null
  goal: RecommendationGoal
  processEnv?: NodeJS.ProcessEnv
  getOllamaChatBaseUrl?: (baseUrl?: string) => string
  resolveOllamaDefaultModel?: (goal: RecommendationGoal) => Promise<string>
}): Promise<NodeJS.ProcessEnv> {
  const processEnv = options.processEnv ?? process.env
  const persistedEnv =
    options.persisted?.profile === options.profile
      ? options.persisted.env ?? {}
      : {}

  const env: NodeJS.ProcessEnv = {
    ...processEnv,
    CLAUDE_CODE_USE_OPENAI: '1',
  }

  if (options.profile === 'ollama') {
    const getOllamaBaseUrl =
      options.getOllamaChatBaseUrl ?? (() => 'http://localhost:11434/v1')
    const resolveOllamaModel =
      options.resolveOllamaDefaultModel ?? (async () => 'llama3.1:8b')

    env.OPENAI_BASE_URL = persistedEnv.OPENAI_BASE_URL || getOllamaBaseUrl()
    env.OPENAI_MODEL =
      persistedEnv.OPENAI_MODEL ||
      (await resolveOllamaModel(options.goal))

    delete env.OPENAI_API_KEY
    delete env.CODEX_API_KEY
    delete env.CHATGPT_ACCOUNT_ID
    delete env.CODEX_ACCOUNT_ID

    return env
  }

  if (options.profile === 'codex') {
    env.OPENAI_BASE_URL =
      persistedEnv.OPENAI_BASE_URL && isCodexBaseUrl(persistedEnv.OPENAI_BASE_URL)
        ? persistedEnv.OPENAI_BASE_URL
        : DEFAULT_CODEX_BASE_URL
    env.OPENAI_MODEL = persistedEnv.OPENAI_MODEL || 'codexplan'
    delete env.OPENAI_API_KEY

    const codexKey =
      sanitizeApiKey(processEnv.CODEX_API_KEY) ||
      sanitizeApiKey(persistedEnv.CODEX_API_KEY)
    const liveCodexCredentials = resolveCodexApiCredentials(processEnv)
    const codexAccountId =
      processEnv.CHATGPT_ACCOUNT_ID ||
      processEnv.CODEX_ACCOUNT_ID ||
      liveCodexCredentials.accountId ||
      persistedEnv.CHATGPT_ACCOUNT_ID ||
      persistedEnv.CODEX_ACCOUNT_ID
    if (codexKey) {
      env.CODEX_API_KEY = codexKey
    } else {
      delete env.CODEX_API_KEY
    }

    if (codexAccountId) {
      env.CHATGPT_ACCOUNT_ID = codexAccountId
    } else {
      delete env.CHATGPT_ACCOUNT_ID
    }
    delete env.CODEX_ACCOUNT_ID

    return env
  }

  const defaultOpenAIModel = getGoalDefaultOpenAIModel(options.goal)
  const shellOpenAIRequest = resolveProviderRequest({
    model: processEnv.OPENAI_MODEL,
    baseUrl: processEnv.OPENAI_BASE_URL,
    fallbackModel: defaultOpenAIModel,
  })
  const persistedOpenAIRequest = resolveProviderRequest({
    model: persistedEnv.OPENAI_MODEL,
    baseUrl: persistedEnv.OPENAI_BASE_URL,
    fallbackModel: defaultOpenAIModel,
  })
  const useShellOpenAIConfig = shellOpenAIRequest.transport === 'chat_completions'
  const usePersistedOpenAIConfig =
    (!persistedEnv.OPENAI_MODEL && !persistedEnv.OPENAI_BASE_URL) ||
    persistedOpenAIRequest.transport === 'chat_completions'

  env.OPENAI_BASE_URL =
    (useShellOpenAIConfig ? processEnv.OPENAI_BASE_URL : undefined) ||
    (usePersistedOpenAIConfig ? persistedEnv.OPENAI_BASE_URL : undefined) ||
    DEFAULT_OPENAI_BASE_URL
  env.OPENAI_MODEL =
    (useShellOpenAIConfig ? processEnv.OPENAI_MODEL : undefined) ||
    (usePersistedOpenAIConfig ? persistedEnv.OPENAI_MODEL : undefined) ||
    defaultOpenAIModel
  env.OPENAI_API_KEY = processEnv.OPENAI_API_KEY || persistedEnv.OPENAI_API_KEY
  delete env.CODEX_API_KEY
  delete env.CHATGPT_ACCOUNT_ID
  delete env.CODEX_ACCOUNT_ID
  return env
}
