import { afterEach, expect, test } from 'bun:test'

import {
  getAPIProvider,
  usesAnthropicAccountFlow,
} from './providers.js'

const originalEnv = {
  NETRUNNER_USE_GEMINI: process.env.NETRUNNER_USE_GEMINI,
  NETRUNNER_USE_OPENAI: process.env.NETRUNNER_USE_OPENAI,
  NETRUNNER_USE_BEDROCK: process.env.NETRUNNER_USE_BEDROCK,
  NETRUNNER_USE_VERTEX: process.env.NETRUNNER_USE_VERTEX,
  NETRUNNER_USE_FOUNDRY: process.env.NETRUNNER_USE_FOUNDRY,
}

afterEach(() => {
  process.env.NETRUNNER_USE_GEMINI = originalEnv.NETRUNNER_USE_GEMINI
  process.env.NETRUNNER_USE_OPENAI = originalEnv.NETRUNNER_USE_OPENAI
  process.env.NETRUNNER_USE_BEDROCK = originalEnv.NETRUNNER_USE_BEDROCK
  process.env.NETRUNNER_USE_VERTEX = originalEnv.NETRUNNER_USE_VERTEX
  process.env.NETRUNNER_USE_FOUNDRY = originalEnv.NETRUNNER_USE_FOUNDRY
})

function clearProviderEnv(): void {
  delete process.env.NETRUNNER_USE_GEMINI
  delete process.env.NETRUNNER_USE_OPENAI
  delete process.env.NETRUNNER_USE_BEDROCK
  delete process.env.NETRUNNER_USE_VERTEX
  delete process.env.NETRUNNER_USE_FOUNDRY
}

test('first-party provider keeps Anthropic account setup flow enabled', () => {
  clearProviderEnv()

  expect(getAPIProvider()).toBe('firstParty')
  expect(usesAnthropicAccountFlow()).toBe(true)
})

test.each([
  ['NETRUNNER_USE_OPENAI', 'openai'],
  ['NETRUNNER_USE_GEMINI', 'gemini'],
  ['NETRUNNER_USE_BEDROCK', 'bedrock'],
  ['NETRUNNER_USE_VERTEX', 'vertex'],
  ['NETRUNNER_USE_FOUNDRY', 'foundry'],
] as const)(
  '%s disables Anthropic account setup flow',
  (envKey, provider) => {
    clearProviderEnv()
    process.env[envKey] = '1'

    expect(getAPIProvider()).toBe(provider)
    expect(usesAnthropicAccountFlow()).toBe(false)
  },
)
