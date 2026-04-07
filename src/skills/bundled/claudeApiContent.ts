// Content for the claude-api bundled skill.
// Each .md file is inlined as a string at build time via Bun's text loader.

function loadMarkdown(path: string): string {
  try {
    /* eslint-disable @typescript-eslint/no-require-imports */
    return require(path) as string
    /* eslint-enable @typescript-eslint/no-require-imports */
  } catch {
    return ''
  }
}

const csharpClaudeApi = loadMarkdown('./claude-api/csharp/claude-api.md')
const curlExamples = loadMarkdown('./claude-api/curl/examples.md')
const goClaudeApi = loadMarkdown('./claude-api/go/claude-api.md')
const javaClaudeApi = loadMarkdown('./claude-api/java/claude-api.md')
const phpClaudeApi = loadMarkdown('./claude-api/php/claude-api.md')
const pythonAgentSdkPatterns = loadMarkdown('./claude-api/python/agent-sdk/patterns.md')
const pythonAgentSdkReadme = loadMarkdown('./claude-api/python/agent-sdk/README.md')
const pythonClaudeApiBatches = loadMarkdown('./claude-api/python/claude-api/batches.md')
const pythonClaudeApiFilesApi = loadMarkdown('./claude-api/python/claude-api/files-api.md')
const pythonClaudeApiReadme = loadMarkdown('./claude-api/python/claude-api/README.md')
const pythonClaudeApiStreaming = loadMarkdown('./claude-api/python/claude-api/streaming.md')
const pythonClaudeApiToolUse = loadMarkdown('./claude-api/python/claude-api/tool-use.md')
const rubyClaudeApi = loadMarkdown('./claude-api/ruby/claude-api.md')
const skillPrompt = loadMarkdown('./claude-api/SKILL.md')
const sharedErrorCodes = loadMarkdown('./claude-api/shared/error-codes.md')
const sharedLiveSources = loadMarkdown('./claude-api/shared/live-sources.md')
const sharedModels = loadMarkdown('./claude-api/shared/models.md')
const sharedPromptCaching = loadMarkdown('./claude-api/shared/prompt-caching.md')
const sharedToolUseConcepts = loadMarkdown('./claude-api/shared/tool-use-concepts.md')
const typescriptAgentSdkPatterns = loadMarkdown('./claude-api/typescript/agent-sdk/patterns.md')
const typescriptAgentSdkReadme = loadMarkdown('./claude-api/typescript/agent-sdk/README.md')
const typescriptClaudeApiBatches = loadMarkdown('./claude-api/typescript/claude-api/batches.md')
const typescriptClaudeApiFilesApi = loadMarkdown('./claude-api/typescript/claude-api/files-api.md')
const typescriptClaudeApiReadme = loadMarkdown('./claude-api/typescript/claude-api/README.md')
const typescriptClaudeApiStreaming = loadMarkdown('./claude-api/typescript/claude-api/streaming.md')
const typescriptClaudeApiToolUse = loadMarkdown('./claude-api/typescript/claude-api/tool-use.md')

// @[MODEL LAUNCH]: Update the model IDs/names below. These are substituted into {{VAR}}
// placeholders in the .md files at runtime before the skill prompt is sent.
// After updating these constants, manually update the two files that still hardcode models:
//   - claude-api/SKILL.md (Current Models pricing table)
//   - claude-api/shared/models.md (full model catalog with legacy versions and alias mappings)
export const SKILL_MODEL_VARS = {
  OPUS_ID: 'claude-opus-4-6',
  OPUS_NAME: 'Claude Opus 4.6',
  SONNET_ID: 'claude-sonnet-4-6',
  SONNET_NAME: 'Claude Sonnet 4.6',
  HAIKU_ID: 'claude-haiku-4-5',
  HAIKU_NAME: 'Claude Haiku 4.5',
  // Previous Sonnet ID — used in "do not append date suffixes" example in SKILL.md.
  PREV_SONNET_ID: 'claude-sonnet-4-5',
} satisfies Record<string, string>

export const SKILL_PROMPT: string = skillPrompt

export const SKILL_FILES: Record<string, string> = {
  'csharp/claude-api.md': csharpClaudeApi,
  'curl/examples.md': curlExamples,
  'go/claude-api.md': goClaudeApi,
  'java/claude-api.md': javaClaudeApi,
  'php/claude-api.md': phpClaudeApi,
  'python/agent-sdk/README.md': pythonAgentSdkReadme,
  'python/agent-sdk/patterns.md': pythonAgentSdkPatterns,
  'python/claude-api/README.md': pythonClaudeApiReadme,
  'python/claude-api/batches.md': pythonClaudeApiBatches,
  'python/claude-api/files-api.md': pythonClaudeApiFilesApi,
  'python/claude-api/streaming.md': pythonClaudeApiStreaming,
  'python/claude-api/tool-use.md': pythonClaudeApiToolUse,
  'ruby/claude-api.md': rubyClaudeApi,
  'shared/error-codes.md': sharedErrorCodes,
  'shared/live-sources.md': sharedLiveSources,
  'shared/models.md': sharedModels,
  'shared/prompt-caching.md': sharedPromptCaching,
  'shared/tool-use-concepts.md': sharedToolUseConcepts,
  'typescript/agent-sdk/README.md': typescriptAgentSdkReadme,
  'typescript/agent-sdk/patterns.md': typescriptAgentSdkPatterns,
  'typescript/claude-api/README.md': typescriptClaudeApiReadme,
  'typescript/claude-api/batches.md': typescriptClaudeApiBatches,
  'typescript/claude-api/files-api.md': typescriptClaudeApiFilesApi,
  'typescript/claude-api/streaming.md': typescriptClaudeApiStreaming,
  'typescript/claude-api/tool-use.md': typescriptClaudeApiToolUse,
}
