import { FastMCP, type Logger } from 'fastmcp'
import { z } from 'zod'
import { exec } from 'child_process'
import { promisify } from 'util'
import { mkdir, readFile, writeFile } from 'fs/promises'
import { join, relative, resolve } from 'path'
import {
  initializeNetRunnerProject,
  readEngagementManifest,
  summarizeEngagement,
  assessPlannedAction,
  type InitializeEngagementOptions,
} from '../security/engagement.js'
import {
  appendEvidenceEntry,
  readEvidenceEntries,
  countEvidenceEntriesByType,
  type EvidenceSeverity,
  type FindingEntry,
} from '../security/evidence.js'
import {
  getCapabilityReadinessSnapshot,
  getNetRunnerCapabilities,
  type CapabilityReadiness,
} from '../security/capabilities.js'
import { IMPORTED_PENTEST_CAPABILITIES } from '../security/pentestToolCatalog.js'
import { SECURITY_WORKFLOWS } from '../security/workflows.js'
import { NET_RUNNER_SKILL_DEFINITIONS } from '../security/skillDefinitions.js'
import {
  getNetRunnerProjectDir,
  getArtifactsDir,
  getRunStatePath,
} from '../security/paths.js'
import {
  formatIntelligenceContext,
  planNextActionsWithPersistence,
  shouldGateBlindFinding,
} from '../security/intelligenceMiddleware.js'
import {
  handleHttpResponse,
  handleToolFailure,
  syncEvidenceToKnowledgeGraph,
} from '../security/runtimeIntegration.js'
import {
  ensureIntelligenceState,
  incrementPendingBlindVerifications,
} from '../security/intelligenceState.js'
import {
  clearAgentDefinitionsCache,
  getAgentDefinitionsWithOverrides,
} from '../tools/AgentTool/loadAgentsDir.js'

const execAsync = promisify(exec)

const VERSION = '0.1.6'
const PORT = parseInt(process.env.NR_PORT ?? '8745', 10)
const CWD = process.env.NR_CWD || process.cwd()

type SessionBudget = {
  outputChars: number
  toolCalls: number
}

type ParsedHttpResponse = {
  statusCode: number
  headers: Record<string, string>
  body: string
  cookies?: string
}

type ExecReturnPayload = {
  text: string
  artifactPath?: string
}

type ExecCommandResult = {
  command: string
  ok: boolean
  exitCode: number | string
  renderedText: string
  artifactPath?: string
  intelligenceContexts: string[]
}

const READ_ONLY_TOOL_ANNOTATIONS = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
} as const

const MUTATING_STATE_TOOL_ANNOTATIONS = {
  readOnlyHint: false,
  destructiveHint: false,
  idempotentHint: false,
} as const

const OPEN_WORLD_EXEC_TOOL_ANNOTATIONS = {
  readOnlyHint: false,
  destructiveHint: true,
  idempotentHint: false,
  openWorldHint: true,
} as const

const EXEC_MAX_BUFFER_BYTES = 10 * 1024 * 1024
const EXEC_TRUNCATE_THRESHOLD_CHARS = parseInt(
  process.env.NR_EXEC_MAX_CHARS ?? '8000',
  10,
)
const EXEC_PREVIEW_HEAD_LINES = parseInt(
  process.env.NR_EXEC_PREVIEW_HEAD_LINES ?? '50',
  10,
)
const EXEC_PREVIEW_TAIL_LINES = parseInt(
  process.env.NR_EXEC_PREVIEW_TAIL_LINES ?? '50',
  10,
)
const CONTEXT_BUDGET_WARN_TOKENS = parseInt(
  process.env.NR_CONTEXT_BUDGET_WARN_TOKENS ?? '45000',
  10,
)

const sessionBudgets = new Map<string, SessionBudget>()

function getSessionBudgetKey(sid?: string): string {
  return sid ?? '__default__'
}

export function resetSessionBudgets(): void {
  sessionBudgets.clear()
}

export function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / 4)
}

export function getSessionBudgetSnapshot(sid?: string): {
  outputChars: number
  toolCalls: number
  estimatedTokens: number
} {
  const snapshot = sessionBudgets.get(getSessionBudgetKey(sid)) ?? {
    outputChars: 0,
    toolCalls: 0,
  }
  return {
    ...snapshot,
    estimatedTokens: Math.ceil(snapshot.outputChars / 4),
  }
}

function recordSessionOutput(sid: string | undefined, text: string): {
  outputChars: number
  toolCalls: number
  estimatedTokens: number
} {
  const key = getSessionBudgetKey(sid)
  const current = sessionBudgets.get(key) ?? { outputChars: 0, toolCalls: 0 }
  const next = {
    outputChars: current.outputChars + text.length,
    toolCalls: current.toolCalls + 1,
  }
  sessionBudgets.set(key, next)
  return {
    ...next,
    estimatedTokens: Math.ceil(next.outputChars / 4),
  }
}

function formatContextBudgetMessage(sid?: string): string | null {
  const snapshot = getSessionBudgetSnapshot(sid)
  if (snapshot.estimatedTokens < CONTEXT_BUDGET_WARN_TOKENS) {
    return null
  }
  return `[Context budget] Approx ${snapshot.estimatedTokens} tokens returned across ${snapshot.toolCalls} tool results in this session. Consider summarizing or offloading findings before continuing.`
}

function sanitizeArtifactStem(command: string): string {
  const stem = command
    .trim()
    .split(/\s+/)
    .slice(0, 3)
    .join('-')
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48)
  return stem || 'command-output'
}

function applyMaxLines(output: string, maxLines?: number): string {
  if (!maxLines || maxLines < 1) {
    return output
  }
  const lines = output.split(/\r?\n/)
  if (lines.length <= maxLines) {
    return output
  }
  return [
    ...lines.slice(0, maxLines),
    `[truncated ${lines.length - maxLines} additional lines by max_lines=${maxLines}]`,
  ].join('\n')
}

export function summarizeOutputPreview(
  output: string,
  headLines = EXEC_PREVIEW_HEAD_LINES,
  tailLines = EXEC_PREVIEW_TAIL_LINES,
): string {
  const lines = output.split(/\r?\n/)
  if (lines.length <= headLines + tailLines) {
    return output
  }
  return [
    ...lines.slice(0, headLines),
    `[... ${lines.length - headLines - tailLines} lines omitted ...]`,
    ...lines.slice(-tailLines),
  ].join('\n')
}

function getSafeExecArtifactPath(fileName: string): string {
  const artifactsDir = resolve(getArtifactsDir(CWD))
  const artifactPath = resolve(artifactsDir, fileName)
  const relativePath = relative(artifactsDir, artifactPath)
  if (relativePath.startsWith('..')) {
    throw new Error('Resolved artifact path escaped the artifacts directory')
  }
  return artifactPath
}

function summarizeTextBlock(text: string, maxLines = 6): string {
  const lines = text.split(/\r?\n/)
  if (lines.length <= maxLines) {
    return text
  }
  return [...lines.slice(0, maxLines), `[... ${lines.length - maxLines} lines omitted ...]`].join('\n')
}

async function writeExecArtifact(command: string, output: string): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const stem = sanitizeArtifactStem(command)
  const fileName = `${stem}-${timestamp}.txt`
  const artifactPath = getSafeExecArtifactPath(fileName)
  await mkdir(getArtifactsDir(CWD), { recursive: true })
  await writeFile(artifactPath, output, 'utf8')

  const relativeArtifactPath = relative(CWD, artifactPath)
  logRuntimeEvent(
    'ART',
    `saved ${relativeArtifactPath} (${output.split(/\r?\n/).length} lines, ${output.length} chars) for ${formatCommandPreview(command)}`,
    undefined,
    GREEN,
  )
  const manifest = await readEngagementManifest(CWD)
  if (manifest) {
    await appendEvidenceEntry(CWD, {
      type: 'artifact',
      label: `nr_exec:${stem}`,
      path: relativeArtifactPath,
      description: `Raw nr_exec output for: ${command.slice(0, 160)}`,
    })
    logRuntimeEvent('EVD', `recorded artifact evidence ${relativeArtifactPath}`, undefined, GREEN)
  }

  return relativeArtifactPath
}

async function formatExecOutput(
  command: string,
  output: string,
  maxLines?: number,
): Promise<ExecReturnPayload> {
  const rawOutput = output.trim() || '(no output)'
  const visibleOutput = applyMaxLines(rawOutput, maxLines)

  if (
    rawOutput.length <= EXEC_TRUNCATE_THRESHOLD_CHARS &&
    visibleOutput.length <= EXEC_TRUNCATE_THRESHOLD_CHARS
  ) {
    return { text: visibleOutput }
  }

  const artifactPath = await writeExecArtifact(command, rawOutput)
  return {
    text: [
      `[output saved] ${artifactPath} — ${rawOutput.split(/\r?\n/).length} lines, ${rawOutput.length} chars`,
      `[command] ${command}`,
      '[preview]',
      summarizeOutputPreview(visibleOutput),
    ].join('\n'),
    artifactPath,
  }
}

async function detectHttpIntelligence(output: string): Promise<string[]> {
  const httpResponse = parseHttpResponseFromOutput(output)
  if (!httpResponse) {
    return []
  }

  const wafResult = await handleHttpResponse(
    CWD,
    httpResponse.statusCode,
    httpResponse.headers,
    httpResponse.body,
    httpResponse.cookies,
  )

  if (wafResult?.isNew && wafResult.detection.detected) {
    return [wafResult.agentContext]
  }

  return []
}

async function executeCommandWithIntelligence(
  command: string,
  timeout: number,
  maxLines?: number,
): Promise<ExecCommandResult> {
  logRuntimeEvent(
    'EXEC',
    `running ${formatCommandPreview(command)} · timeout=${timeout}ms`,
  )
  try {
    const { stdout, stderr } = await execAsync(command, {
      cwd: CWD,
      timeout,
      maxBuffer: EXEC_MAX_BUFFER_BYTES,
      env: { ...process.env, TERM: 'dumb' },
    })
    const parts: string[] = []
    if (stdout.trim()) parts.push(stdout.trim())
    if (stderr.trim()) parts.push(`[stderr]\n${stderr.trim()}`)
    const rawOutput = parts.join('\n') || '(no output)'
    const intelligenceContexts = await detectHttpIntelligence(rawOutput)
    if (intelligenceContexts.length > 0) {
      logRuntimeEvent(
        'INT',
        `captured ${intelligenceContexts.length} intelligence hint(s) for ${formatCommandPreview(command)}`,
        undefined,
        YELLOW,
      )
    }
    const rendered = await formatExecOutput(command, rawOutput, maxLines)

    logRuntimeEvent(
      'EXEC',
      `completed exit=0 ${formatCommandPreview(command)}${rendered.artifactPath ? ` · artifact=${rendered.artifactPath}` : ''}`,
      undefined,
      GREEN,
    )

    return {
      command,
      ok: true,
      exitCode: 0,
      renderedText: rendered.text,
      artifactPath: rendered.artifactPath,
      intelligenceContexts,
    }
  } catch (err: any) {
    const parts: string[] = []
    if (err.stdout?.trim()) parts.push(err.stdout.trim())
    if (err.stderr?.trim()) parts.push(`[stderr]\n${err.stderr.trim()}`)
    if (err.killed) parts.push(`[killed] Command timed out after ${timeout}ms`)
    if (parts.length === 0) parts.push(err.message ?? String(err))
    const body = parts.join('\n')
    const rawOutput = `[exit ${err.code ?? '?'}]\n${body}`
    const intelligenceContexts = await detectHttpIntelligence(body)
    if (intelligenceContexts.length > 0) {
      logRuntimeEvent(
        'INT',
        `captured ${intelligenceContexts.length} intelligence hint(s) from failed command ${formatCommandPreview(command)}`,
        undefined,
        YELLOW,
      )
    }

    const httpResponse = parseHttpResponseFromOutput(body)
    const failureResult = await handleToolFailure(CWD, {
      attempt: 0,
      payload: command,
      error: {
        message: err.message,
        code: typeof err.code === 'string' ? err.code : undefined,
        statusCode: httpResponse?.statusCode,
      },
      responseBody: httpResponse?.body ?? body,
      responseHeaders: httpResponse?.headers,
      statusCode: httpResponse?.statusCode,
    })

    if (failureResult) {
      intelligenceContexts.push(failureResult.agentContext)
      logRuntimeEvent(
        'INT',
        `failure intelligence generated for ${formatCommandPreview(command)}`,
        undefined,
        YELLOW,
      )
    }

    const rendered = await formatExecOutput(command, rawOutput, maxLines)
    logRuntimeEvent(
      'EXEC',
      `failed exit=${String(err.code ?? '?')} ${formatCommandPreview(command)}${rendered.artifactPath ? ` · artifact=${rendered.artifactPath}` : ''}`,
      undefined,
      RED,
    )
    return {
      command,
      ok: false,
      exitCode: err.code ?? '?',
      renderedText: rendered.text,
      artifactPath: rendered.artifactPath,
      intelligenceContexts,
    }
  }
}

function renderCompositeExecResult(
  results: ExecCommandResult[],
  summaryOnly: boolean,
  stopOnError: boolean,
): string {
  const successCount = results.filter(result => result.ok).length
  const failureCount = results.length - successCount
  const lines = [
    `[composite execution] ${results.length} command(s) completed — ${successCount} ok, ${failureCount} failed`,
    `[mode] ${summaryOnly ? 'summary-first' : 'full-preview'}${stopOnError ? ' · stop-on-error enabled' : ''}`,
    '',
  ]

  results.forEach((result, index) => {
    lines.push(`${index + 1}. [${result.ok ? 'ok' : `exit ${result.exitCode}`}] ${result.command}`)
    lines.push(summaryOnly ? summarizeTextBlock(result.renderedText) : result.renderedText)
    if (result.intelligenceContexts.length > 0) {
      const intelligenceSummary = result.intelligenceContexts
        .map(context => summarizeTextBlock(context, 4))
        .join('\n\n')
      lines.push(intelligenceSummary)
    }
    lines.push('')
  })

  return lines.join('\n').trim()
}

export function parseHttpResponseFromOutput(output: string): ParsedHttpResponse | null {
  const normalized = output.replace(/\r\n/g, '\n')
  const start = normalized.search(/HTTP\/(?:1\.\d|2)\s+\d{3}\b/)
  if (start === -1) {
    return null
  }

  const candidate = normalized.slice(start)
  const separatorIndex = candidate.indexOf('\n\n')
  const head = separatorIndex === -1 ? candidate : candidate.slice(0, separatorIndex)
  const body = separatorIndex === -1 ? '' : candidate.slice(separatorIndex + 2).trim()
  const lines = head.split('\n').filter(Boolean)
  if (lines.length === 0) {
    return null
  }

  const statusMatch = lines[0]?.match(/^HTTP\/(?:1\.\d|2)\s+(\d{3})\b/)
  if (!statusMatch) {
    return null
  }

  const headers: Record<string, string> = {}
  for (const line of lines.slice(1)) {
    const separator = line.indexOf(':')
    if (separator <= 0) {
      continue
    }
    const key = line.slice(0, separator).trim().toLowerCase()
    const value = line.slice(separator + 1).trim()
    headers[key] = value
  }

  return {
    statusCode: Number(statusMatch[1]),
    headers,
    body,
    cookies: headers['set-cookie'],
  }
}

// ─── Colors (matching harness StartupScreen.ts) ────────────────────────────

const ESC = '\x1b['
const DIM = `${ESC}2m`
const RESET = `${ESC}0m`
const BOLD = `${ESC}1m`
const CYAN = `${ESC}36m`
const GREEN = `${ESC}32m`
const YELLOW = `${ESC}33m`
const RED = `${ESC}31m`

type RGB = [number, number, number]
const rgb = (r: number, g: number, b: number) => `${ESC}38;2;${r};${g};${b}m`

function lerpC(a: RGB, b: RGB, t: number): RGB {
  return [Math.round(a[0]+(b[0]-a[0])*t), Math.round(a[1]+(b[1]-a[1])*t), Math.round(a[2]+(b[2]-a[2])*t)]
}
function gradAt(stops: RGB[], t: number): RGB {
  const c = Math.max(0, Math.min(1, t)), s = c * (stops.length - 1), i = Math.floor(s)
  return i >= stops.length - 1 ? stops[stops.length - 1] : lerpC(stops[i], stops[i + 1], s - i)
}
function paintLine(text: string, stops: RGB[], lineT: number): string {
  let out = ''
  for (let i = 0; i < text.length; i++) {
    const t = text.length > 1 ? lineT * 0.5 + (i / (text.length - 1)) * 0.5 : lineT
    const [r, g, b] = gradAt(stops, t)
    out += `${rgb(r, g, b)}${text[i]}`
  }
  return out + RESET
}

const SUNSET: RGB[] = [[255,180,100],[240,140,80],[217,119,87],[193,95,60],[160,75,55],[130,60,50]]
const ACCENT: RGB = [240, 148, 100]
const CREAM: RGB = [220, 195, 170]
const DIMCOL: RGB = [120, 100, 82]
const BORDER_C: RGB = [100, 80, 65]

function ts(): string {
  return new Date().toISOString().replace('T', ' ').slice(0, 19)
}

// ─── Logger ─────────────────────────────────────────────────────────────────

class TerminalLogger implements Logger {
  debug(...args: unknown[]): void {
    console.error(`${DIM}${ts()} [DBG]${RESET}`, ...args)
  }
  error(...args: unknown[]): void {
    console.error(`${RED}${ts()} [ERR]${RESET}`, ...args)
  }
  info(...args: unknown[]): void {
    const msg = args.map(String).join(' ')
    if (msg.includes('session established')) {
      console.error(`${GREEN}${ts()} [SES]${RESET} ${rgb(...ACCENT)}Client connected${RESET} ${DIM}${msg}${RESET}`)
    } else if (msg.includes('server is running')) {
      console.error(`${GREEN}${ts()} [RUN]${RESET} ${BOLD}${msg}${RESET}`)
    } else {
      console.error(`${CYAN}${ts()} [INF]${RESET}`, ...args)
    }
  }
  log(...args: unknown[]): void {
    console.error(`${DIM}${ts()} [LOG]${RESET}`, ...args)
  }
  warn(...args: unknown[]): void {
    console.error(`${YELLOW}${ts()} [WRN]${RESET}`, ...args)
  }
}

const logger = new TerminalLogger()

// ─── Tool call tracing ──────────────────────────────────────────────────────

function logToolCall(name: string, args: Record<string, unknown>, sid?: string): void {
  const argStr = Object.entries(args)
    .map(([k, v]) => {
      const val = typeof v === 'string' && v.length > 80 ? v.slice(0, 77) + '...' : v
      return `${k}=${JSON.stringify(val)}`
    })
    .join(' ')
  const s = sid ? ` ${DIM}${rgb(...DIMCOL)}sid:${sid.slice(0, 8)}${RESET}` : ''
  console.error(`${rgb(...ACCENT)}${ts()} [CALL]${RESET} ${BOLD}${name}${RESET}${s} ${DIM}${argStr}${RESET}`)
}

function logToolResult(name: string, ok: boolean, ms: number, bytes: number, sid?: string): void {
  const status = ok ? `${GREEN}OK${RESET}` : `${RED}FAIL${RESET}`
  const s = sid ? ` ${DIM}${rgb(...DIMCOL)}sid:${sid.slice(0, 8)}${RESET}` : ''
  const sz = bytes > 0 ? ` ${DIM}${bytes}b${RESET}` : ''
  console.error(`${rgb(...ACCENT)}${ts()} [DONE]${RESET} ${name} → ${status}${s} ${DIM}(${ms}ms)${sz}${RESET}`)
}

function formatCommandPreview(command: string): string {
  const compact = command.replace(/\s+/g, ' ').trim()
  return compact.length > 120 ? `${compact.slice(0, 117)}...` : compact
}

function logRuntimeEvent(
  tag: string,
  message: string,
  sid?: string,
  colorCode: string = CYAN,
): void {
  const session = sid ? ` ${DIM}${rgb(...DIMCOL)}sid:${sid.slice(0, 8)}${RESET}` : ''
  console.error(`${colorCode}${ts()} [${tag}]${RESET}${session} ${message}`)
}

function logBudgetSnapshot(
  name: string,
  snapshot: { outputChars: number; toolCalls: number; estimatedTokens: number },
  sid?: string,
): void {
  const overBudget = snapshot.estimatedTokens >= CONTEXT_BUDGET_WARN_TOKENS
  logRuntimeEvent(
    'CTX',
    `${name} -> approx ${snapshot.estimatedTokens} tokens across ${snapshot.toolCalls} result(s) (${snapshot.outputChars} chars returned)`,
    sid,
    overBudget ? YELLOW : DIM,
  )
}

function traced<T extends Record<string, unknown>>(
  name: string,
  fn: (args: T, ctx: any) => Promise<string>,
): (args: T, ctx: any) => Promise<string> {
  return async (args: T, ctx: any) => {
    const sid = ctx?.sessionId as string | undefined
    logToolCall(name, args, sid)
    const start = Date.now()
    try {
      const result = await fn(args, ctx)
      const snapshot = recordSessionOutput(sid, result)
      logBudgetSnapshot(name, snapshot, sid)
      const budgetMessage =
        snapshot.estimatedTokens >= CONTEXT_BUDGET_WARN_TOKENS
          ? formatContextBudgetMessage(sid)
          : null
      const finalResult = budgetMessage ? `${result}\n\n${budgetMessage}` : result
      logToolResult(name, true, Date.now() - start, finalResult.length, sid)
      return finalResult
    } catch (err) {
      logToolResult(name, false, Date.now() - start, 0, sid)
      throw err
    }
  }
}

// ─── Server ─────────────────────────────────────────────────────────────────
//
// Architecture: "Code Execution with MCP" (Anthropic pattern)
//   https://www.anthropic.com/engineering/code-execution-with-mcp
//
// Net-Runner presents a MINIMAL MCP surface and delegates all tool execution
// to code. 153 red-team tools are accessed through nr_exec (shell), not as
// individual MCP definitions. Skills, agents, and workflows are discovered
// on demand through nr_discover (progressive disclosure), not loaded upfront.
//
// Only typed boundaries get their own MCP tools:
//   - Engagement state  (nr_engagement_init, nr_engagement_status)
//   - Evidence ledger   (nr_save_finding, nr_save_note, nr_list_evidence)
//   - Guardrail checks  (nr_scope_check)
//   - Discovery         (nr_discover — single progressive-disclosure tool)
//   - Shell execution   (nr_exec — the workhorse)
//
// ─────────────────────────────────────────────────────────────────────────────

const TOOL_COUNT = 8

const server = new FastMCP({
  name: 'net-runner',
  version: VERSION,
  instructions: [
    'Net-Runner MCP — skills-first, code-execution-first security harness.',
    `CWD: ${CWD}`,
    'nr_exec is the primary tool — all 153 red-team tools run through shell.',
    'Use nr_engagement_init to start an assessment, nr_scope_check before risky actions.',
    'Save findings with nr_save_finding, notes with nr_save_note.',
    'Use nr_discover to list agents, skills, workflows, or capabilities on demand.',
    'Do NOT request separate tools for what nr_exec can already do.',
  ].join(' '),
  logger,
})

// ═══════════════════════════════════════════════════════════════════════════
//  1. nr_exec — Shell execution (the workhorse)
// ═══════════════════════════════════════════════════════════════════════════

server.addTool({
  name: 'nr_exec',
  description: 'Run one or more shell commands. All 153 pentest tools (nmap, sqlmap, nuclei, etc.) are invoked here. Supports composite execution with summary-first results.',
  annotations: OPEN_WORLD_EXEC_TOOL_ANNOTATIONS,
  parameters: z.object({
    command: z.string().optional().describe('Single shell command'),
    commands: z.array(z.string()).optional().describe('Optional batch of shell commands to execute sequentially inside nr_exec'),
    timeout_ms: z.number().optional().describe('Timeout in ms per command (default 120000)'),
    max_lines: z.number().optional().describe('Optional line cap for the returned preview'),
    summary_only: z.boolean().optional().describe('When using commands, return condensed per-command summaries instead of full previews'),
    stop_on_error: z.boolean().optional().describe('When using commands, stop executing the batch after the first failed command'),
  }).superRefine((value, ctx) => {
    const hasCommand = typeof value.command === 'string' && value.command.trim().length > 0
    const hasCommands = Array.isArray(value.commands) && value.commands.length > 0
    if (!hasCommand && !hasCommands) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Provide either command or commands.',
        path: ['command'],
      })
    }
    if (hasCommand && hasCommands) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Provide command or commands, not both.',
        path: ['commands'],
      })
    }
  }),
  execute: traced('nr_exec', async (args) => {
    const timeout = args.timeout_ms ?? 120_000
    const batchCommands = args.commands?.length
      ? args.commands.filter(command => command.trim().length > 0)
      : null

    if (!batchCommands || batchCommands.length === 0) {
      const result = await executeCommandWithIntelligence(
        args.command ?? '',
        timeout,
        args.max_lines,
      )
      return result.intelligenceContexts.length > 0
        ? [result.renderedText, ...result.intelligenceContexts].join('\n\n')
        : result.renderedText
    }

    const stopOnError = args.stop_on_error ?? false
    const summaryOnly = args.summary_only ?? true
    const results: ExecCommandResult[] = []

    for (const command of batchCommands) {
      const result = await executeCommandWithIntelligence(command, timeout, args.max_lines)
      results.push(result)
      if (!result.ok && stopOnError) {
        break
      }
    }

    const compositeOutput = renderCompositeExecResult(results, summaryOnly, stopOnError)
    if (stopOnError && results.some(result => !result.ok) && results.length < batchCommands.length) {
      return `${compositeOutput}\n\n[halted] Composite execution stopped after the first failed command.`
    }

    return compositeOutput
  }),
})

// ═══════════════════════════════════════════════════════════════════════════
//  2. nr_engagement_init — Typed state boundary
// ═══════════════════════════════════════════════════════════════════════════

server.addTool({
  name: 'nr_engagement_init',
  description: 'Initialize a .netrunner/ engagement. Creates project folder, manifest, evidence ledger, and memory surfaces.',
  annotations: MUTATING_STATE_TOOL_ANNOTATIONS,
  parameters: z.object({
    name: z.string().optional().describe('Engagement name'),
    workflow: z.enum([
      'web-app-testing', 'api-testing', 'mobile-app-testing',
      'lab-target-testing', 'ctf-mode', 'ad-testing', 'wifi-testing',
    ]).optional().describe('Workflow (default: web-app-testing)'),
    targets: z.array(z.string()).optional().describe('Target hosts/URLs'),
    objectives: z.array(z.string()).optional().describe('Testing objectives'),
    scope_summary: z.string().optional().describe('Scope description'),
    max_impact: z.enum(['read-only', 'limited', 'intrusive']).optional().describe('Max impact level'),
  }),
  execute: traced('nr_engagement_init', async (args) => {
    const opts: InitializeEngagementOptions = {
      cwd: CWD,
      name: args.name,
      workflowId: args.workflow,
      targets: args.targets,
      objectives: args.objectives,
      scopeSummary: args.scope_summary,
      maxImpact: args.max_impact,
    }
    const manifest = await initializeNetRunnerProject(opts)
    return `Engagement initialized:\n${summarizeEngagement(manifest)}\nProject dir: ${getNetRunnerProjectDir(CWD)}`
  }),
})

// ═══════════════════════════════════════════════════════════════════════════
//  3. nr_engagement_status — Typed state boundary
// ═══════════════════════════════════════════════════════════════════════════

server.addTool({
  name: 'nr_engagement_status',
  description: 'Get engagement manifest, evidence counts, and run state.',
  annotations: READ_ONLY_TOOL_ANNOTATIONS,
  parameters: z.object({}),
  execute: traced('nr_engagement_status', async (_args, ctx) => {
    const manifest = await readEngagementManifest(CWD)
    if (!manifest) return 'No engagement found. Use nr_engagement_init first.'

    const entries = await readEvidenceEntries(CWD)
    const counts = countEvidenceEntriesByType(entries)
    const evidenceSummary = Object.entries(counts)
      .filter(([, v]) => v > 0)
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ')

    let runState = '(not found)'
    try { runState = await readFile(getRunStatePath(CWD), 'utf8') } catch {}

    const intelligenceState = await ensureIntelligenceState(CWD)
    const sessionBudget = getSessionBudgetSnapshot(ctx?.sessionId as string | undefined)

    return [
      '=== Engagement ===',
      summarizeEngagement(manifest),
      '',
      '=== Evidence ===',
      evidenceSummary || '(none yet)',
      '',
      '=== Run State ===',
      runState,
      '',
      '=== Intelligence ===',
      formatIntelligenceContext(intelligenceState),
      '',
      '=== Context Budget ===',
      sessionBudget.toolCalls > 0
        ? `Approx ${sessionBudget.estimatedTokens} tokens returned across ${sessionBudget.toolCalls} tool results in this session.`
        : '(no tool output recorded yet)',
    ].join('\n')
  }),
})

// ═══════════════════════════════════════════════════════════════════════════
//  4. nr_scope_check — Guardrail boundary
// ═══════════════════════════════════════════════════════════════════════════

server.addTool({
  name: 'nr_scope_check',
  description: 'Check a planned action against engagement guardrails. Returns allow/review/block with reason.',
  annotations: READ_ONLY_TOOL_ANNOTATIONS,
  parameters: z.object({
    planned_action: z.string().describe('Action to validate against scope and impact rules'),
  }),
  execute: traced('nr_scope_check', async (args) => {
    const manifest = await readEngagementManifest(CWD)
    if (!manifest) return 'No engagement found. Initialize one first.'
    const decision = assessPlannedAction(manifest, args.planned_action)
    return JSON.stringify(decision, null, 2)
  }),
})

// ═══════════════════════════════════════════════════════════════════════════
//  5. nr_save_finding — Structured evidence boundary
// ═══════════════════════════════════════════════════════════════════════════

server.addTool({
  name: 'nr_save_finding',
  description: 'Record a security finding with severity, evidence, and optional CWE/recommendation.',
  annotations: MUTATING_STATE_TOOL_ANNOTATIONS,
  parameters: z.object({
    title: z.string().describe('Finding title'),
    severity: z.enum(['info', 'low', 'medium', 'high', 'critical']),
    evidence: z.string().describe('Proof/evidence details'),
    recommendation: z.string().optional().describe('Remediation'),
    cwe_ids: z.array(z.string()).optional().describe('CWE IDs'),
  }),
  execute: traced('nr_save_finding', async (args) => {
    const entry = await appendEvidenceEntry(CWD, {
      type: 'finding',
      title: args.title,
      severity: args.severity as EvidenceSeverity,
      evidence: args.evidence,
      recommendation: args.recommendation,
      cweIds: args.cwe_ids,
    })
    const findingEntry = entry as FindingEntry
    const details = [`Finding saved: ${entry.id} (${args.severity}) — ${args.title}`]
    logRuntimeEvent(
      'EVD',
      `finding ${entry.id} saved (${args.severity}) ${args.title}`,
      undefined,
      GREEN,
    )

    if (shouldGateBlindFinding(findingEntry)) {
      await incrementPendingBlindVerifications(CWD)
      details.push(
        '[verification required] This finding matches blind or out-of-band patterns. Run statistical or OOB verification before treating it as confirmed.',
      )
      logRuntimeEvent(
        'INT',
        `finding ${entry.id} queued for blind/OOB verification follow-up`,
        undefined,
        YELLOW,
      )
    }

    const syncResult = await syncEvidenceToKnowledgeGraph(CWD)
    if (syncResult && syncResult.imported > 0) {
      details.push(`[intelligence] Knowledge graph sync completed (${syncResult.imported} entries imported).`)
      logRuntimeEvent(
        'INT',
        `knowledge graph synced ${syncResult.imported} entry(ies) after finding ${entry.id}`,
        undefined,
        GREEN,
      )

      const manifest = await readEngagementManifest(CWD)
      const target = manifest?.targets[0]
      if (target) {
        await planNextActionsWithPersistence(CWD, target)
        details.push(`[intelligence] Attack-path plan refreshed for ${target}.`)
        logRuntimeEvent(
          'INT',
          `attack-path plan refreshed for ${target}`,
          undefined,
          GREEN,
        )
      }
    }

    return details.join('\n\n')
  }),
})

// ═══════════════════════════════════════════════════════════════════════════
//  6. nr_save_note — Evidence boundary
// ═══════════════════════════════════════════════════════════════════════════

server.addTool({
  name: 'nr_save_note',
  description: 'Append a note to the evidence ledger.',
  annotations: MUTATING_STATE_TOOL_ANNOTATIONS,
  parameters: z.object({
    note: z.string().describe('Note content'),
  }),
  execute: traced('nr_save_note', async (args) => {
    const entry = await appendEvidenceEntry(CWD, { type: 'note', note: args.note })
    logRuntimeEvent('EVD', `note ${entry.id} saved`, undefined, GREEN)
    return `Note saved: ${entry.id}`
  }),
})

// ═══════════════════════════════════════════════════════════════════════════
//  7. nr_list_evidence — Evidence boundary
// ═══════════════════════════════════════════════════════════════════════════

server.addTool({
  name: 'nr_list_evidence',
  description: 'List evidence entries with optional type filter.',
  annotations: READ_ONLY_TOOL_ANNOTATIONS,
  parameters: z.object({
    type: z.enum([
      'finding', 'note', 'artifact', 'execution_step',
      'guardrail', 'session_start', 'session_end', 'approval',
    ]).optional().describe('Filter by type'),
    limit: z.number().optional().describe('Max entries (default 50)'),
  }),
  execute: traced('nr_list_evidence', async (args) => {
    let entries = await readEvidenceEntries(CWD)
    if (args.type) entries = entries.filter(e => e.type === args.type)
    const sliced = entries.slice(-(args.limit ?? 50))
    if (sliced.length === 0) return '(no evidence entries)'
    return sliced.map(e => JSON.stringify(e)).join('\n')
  }),
})

// ═══════════════════════════════════════════════════════════════════════════
//  8. nr_discover — Progressive disclosure (single discovery tool)
// ═══════════════════════════════════════════════════════════════════════════
//
// Instead of 5 separate reference tools (agents, skills, workflows,
// capabilities, project tree), one tool with a topic selector.
// This follows the Anthropic "progressive disclosure" pattern —
// load only what you need, when you need it.

server.addTool({
  name: 'nr_discover',
  description: 'Progressive disclosure: list agents, skills, workflows, or capabilities. Load only what you need.',
  annotations: READ_ONLY_TOOL_ANNOTATIONS,
  parameters: z.object({
    topic: z.enum(['agents', 'skills', 'workflows', 'capabilities']).describe('What to discover'),
    filter: z.string().optional().describe('Optional filter (e.g. capability pack name like "recon" or "web")'),
  }),
  execute: traced('nr_discover', async (args) => {
    switch (args.topic) {
      case 'agents': {
        clearAgentDefinitionsCache()
        const { activeAgents } = await getAgentDefinitionsWithOverrides(CWD)
        return activeAgents
          .map(agent => `${agent.agentType}: ${agent.whenToUse}`)
          .join('\n')
      }

      case 'skills':
        return NET_RUNNER_SKILL_DEFINITIONS.map(
          s => `${s.name}: ${s.description}`,
        ).join('\n')

      case 'workflows':
        return SECURITY_WORKFLOWS.map(w =>
          `${w.id}: ${w.label} — ${w.description} [packs: ${w.capabilityPacks.join(',')}]`,
        ).join('\n')

      case 'capabilities': {
        const snapshot = await getCapabilityReadinessSnapshot()
        let checks: CapabilityReadiness[] = snapshot.checks
        if (args.filter) {
          const ids = new Set<string>()
          for (const c of IMPORTED_PENTEST_CAPABILITIES) {
            if (c.capabilityPacks.includes(args.filter as any)) ids.add(c.id)
          }
          for (const c of getNetRunnerCapabilities()) {
            if (c.capabilityPacks.includes(args.filter as any)) ids.add(c.id)
          }
          checks = checks.filter(c => ids.has(c.capabilityId))
        }
        const available = checks.filter(c => c.available)
        const missing = checks.filter(c => !c.available)
        const lines = [`Available: ${available.length} | Missing: ${missing.length}`]
        lines.push(...available.map(c => `  + ${c.capabilityId}`))
        if (missing.length > 0 && missing.length <= 20) {
          lines.push(...missing.map(c => `  - ${c.capabilityId} (need: ${c.missingCommands.join(',')})`))
        }
        return lines.join('\n')
      }

      default:
        return 'Unknown topic. Use: agents, skills, workflows, or capabilities.'
    }
  }),
})

// ═══════════════════════════════════════════════════════════════════════════
//  BANNER & START (matching harness StartupScreen.ts gradient + box style)
// ═══════════════════════════════════════════════════════════════════════════

const LOGO_NET = [
  '  ███╗   ██╗ ███████╗ ████████╗',
  '  ████╗  ██║ ██╔════╝ ╚══██╔══╝',
  '  ██╔██╗ ██║ █████╗      ██║   ',
  '  ██║╚██╗██║ ██╔══╝      ██║   ',
  '  ██║ ╚████║ ███████╗    ██║   ',
  '  ╚═╝  ╚═══╝ ╚══════╝    ╚═╝   ',
]

const LOGO_RUNNER = [
  '  ██████╗  ██╗   ██╗ ███╗   ██╗ ███╗   ██╗ ███████╗ ██████╗ ',
  '  ██╔══██╗ ██║   ██║ ████╗  ██║ ████╗  ██║ ██╔════╝ ██╔══██╗',
  '  ██████╔╝ ██║   ██║ ██╔██╗ ██║ ██╔██╗ ██║ █████╗   ██████╔╝',
  '  ██╔══██╗ ██║   ██║ ██║╚██╗██║ ██║╚██╗██║ ██╔══╝   ██╔══██╗',
  '  ██║  ██║ ╚██████╔╝ ██║ ╚████║ ██║ ╚████║ ███████╗ ██║  ██║',
  '  ╚═╝  ╚═╝  ╚═════╝  ╚═╝  ╚═══╝ ╚═╝  ╚═══╝ ╚══════╝ ╚═╝  ╚═╝',
]

const TOOLS_MANIFEST: [string, string][] = [
  ['nr_exec', 'Shell execution \u2014 the workhorse for 153 tools'],
  ['nr_engagement_init', 'Initialize .netrunner/ engagement'],
  ['nr_engagement_status', 'Engagement state + evidence summary'],
  ['nr_scope_check', 'Guardrail check (allow/review/block)'],
  ['nr_save_finding', 'Record security finding'],
  ['nr_save_note', 'Append evidence note'],
  ['nr_list_evidence', 'Query evidence ledger'],
  ['nr_discover', 'Progressive disclosure (agents/skills/workflows/caps)'],
]

function boxRow(content: string, width: number, rawLen: number): string {
  const pad = Math.max(0, width - 2 - rawLen)
  return `${rgb(...BORDER_C)}\u2502${RESET}${content}${' '.repeat(pad)}${rgb(...BORDER_C)}\u2502${RESET}`
}

function printBanner(): void {
  const W = 62
  const out: string[] = ['']

  const allLogo = [...LOGO_NET, '', ...LOGO_RUNNER]
  const total = allLogo.length
  for (let i = 0; i < total; i++) {
    const t = total > 1 ? i / (total - 1) : 0
    allLogo[i] === '' ? out.push('') : out.push(paintLine(allLogo[i], SUNSET, t))
  }

  out.push('')
  out.push(`  ${rgb(...ACCENT)}\u2726${RESET} ${rgb(...CREAM)}Skill-first workflows. Real tools. Selective MCP.${RESET} ${rgb(...ACCENT)}\u2726${RESET}`)
  out.push('')

  out.push(`${rgb(...BORDER_C)}\u2554${'\u2550'.repeat(W - 2)}\u2557${RESET}`)

  const lbl = (k: string, v: string, c: RGB = CREAM): [string, number] => {
    const padK = k.padEnd(11)
    return [` ${DIM}${rgb(...DIMCOL)}${padK}${RESET} ${rgb(...c)}${v}${RESET}`, ` ${padK} ${v}`.length]
  }

  let [r, l] = lbl('Pattern', 'Code Execution with MCP (skills-first)', ACCENT)
  out.push(boxRow(r, W, l))
  ;[r, l] = lbl('Transport', 'httpStream')
  out.push(boxRow(r, W, l))
  ;[r, l] = lbl('Endpoint', `http://localhost:${PORT}/mcp`)
  out.push(boxRow(r, W, l))
  ;[r, l] = lbl('CWD', CWD.length > 38 ? CWD.slice(0, 35) + '...' : CWD)
  out.push(boxRow(r, W, l))
  ;[r, l] = lbl('Tools', `${TOOL_COUNT} (nr_* prefix, minimal surface)`)
  out.push(boxRow(r, W, l))

  out.push(`${rgb(...BORDER_C)}\u2560${'\u2550'.repeat(W - 2)}\u2563${RESET}`)
  const sRow = ` ${rgb(...ACCENT)}\u25cf${RESET} ${DIM}${rgb(...DIMCOL)}ready${RESET}    ${DIM}${rgb(...DIMCOL)}Listening on ${RESET}${rgb(...ACCENT)}http://localhost:${PORT}/mcp${RESET}`
  const sLen = ` \u25cf ready    Listening on http://localhost:${PORT}/mcp`.length
  out.push(boxRow(sRow, W, sLen))
  out.push(`${rgb(...BORDER_C)}\u255a${'\u2550'.repeat(W - 2)}\u255d${RESET}`)

  out.push(`  ${DIM}${rgb(...DIMCOL)}net-runner mcp ${RESET}${rgb(...ACCENT)}v${VERSION}${RESET}`)
  out.push('')

  out.push(`${rgb(...BORDER_C)}\u2500\u2500 Registered Tools ${'\u2500'.repeat(W - 21)}${RESET}`)
  out.push('')
  for (const [name, desc] of TOOLS_MANIFEST) {
    out.push(`  ${rgb(...ACCENT)}\u25cf${RESET} ${BOLD}${name.padEnd(24)}${RESET} ${DIM}${rgb(...DIMCOL)}${desc}${RESET}`)
  }
  out.push('')

  out.push(`${rgb(...BORDER_C)}\u2500\u2500 Philosophy ${'\u2500'.repeat(W - 15)}${RESET}`)
  out.push(`  ${DIM}${rgb(...DIMCOL)}Shell execution is the workhorse \u2014 all pentest tools via nr_exec${RESET}`)
  out.push(`  ${DIM}${rgb(...DIMCOL)}Typed MCP boundaries only for state, evidence, and guardrails${RESET}`)
  out.push(`  ${DIM}${rgb(...DIMCOL)}Progressive disclosure via nr_discover, not upfront loading${RESET}`)
  out.push('')

  out.push(`${rgb(...BORDER_C)}\u2500\u2500 Activity ${'\u2500'.repeat(W - 13)}${RESET}`)
  out.push(`  ${DIM}${rgb(...DIMCOL)}Sessions, tool calls, and results logged below \u2193${RESET}`)
  out.push('')

  process.stderr.write(out.join('\n') + '\n')
}

const USE_STDIO = process.argv.includes('--stdio')

export async function startNetRunnerMcpServer(options?: {
  transportType?: 'stdio' | 'httpStream'
  printStartupBanner?: boolean
}): Promise<void> {
  const transportType = options?.transportType ?? (USE_STDIO ? 'stdio' : 'httpStream')
  const printStartupBanner =
    options?.printStartupBanner ?? transportType !== 'stdio'

  if (printStartupBanner) {
    printBanner()
  }

  if (transportType === 'stdio') {
    await server.start({ transportType: 'stdio' })
  } else {
    await server.start({
      transportType: 'httpStream',
      httpStream: {
        port: PORT,
        host: 'localhost',
      },
    })
  }
}

async function main(): Promise<void> {
  await startNetRunnerMcpServer({
    transportType: USE_STDIO ? 'stdio' : 'httpStream',
    printStartupBanner: !USE_STDIO,
  })
}

if (import.meta.main) {
  main().catch((err) => {
    console.error(`${RED}Fatal: ${err.message ?? err}${RESET}`)
    process.exit(1)
  })
}
