import { z } from 'zod/v4'
import { buildTool, type ToolDef } from '../../Tool.js'
import {
  loadArsenal,
  matchArsenal,
  renderArsenalLookupResult,
  sortArsenalHits,
  type ArsenalLookupFilter,
  type ExploitType,
  type ReliabilityScore,
} from '../../security/arsenal.js'
import { getCwd } from '../../utils/cwd.js'
import { lazySchema } from '../../utils/lazySchema.js'
import { ARSENAL_LOOKUP_TOOL_NAME } from './constants.js'
import { DESCRIPTION, PROMPT } from './prompt.js'

const EXPLOIT_TYPE_VALUES = [
  'rce',
  'privilege-escalation',
  'auth-bypass',
  'defense-evasion',
  'credential-access',
  'info-disclosure',
  'dos',
  'lateral-movement',
] as const

const RELIABILITY_VALUES = ['high', 'medium', 'low', 'unverified'] as const

const inputSchema = lazySchema(() =>
  z.strictObject({
    product: z
      .string()
      .optional()
      .describe('Product / vendor substring matched against name + affected_versions.'),
    version: z
      .string()
      .optional()
      .describe('Version string matched against affected_versions.'),
    cve: z.string().optional().describe('Exact CVE id, e.g. CVE-2021-44228.'),
    exploit_type: z.enum(EXPLOIT_TYPE_VALUES).optional(),
    surface: z
      .string()
      .optional()
      .describe('Restrict to one surface yaml: windows | linux | web-and-appliance | active-directory'),
    min_reliability: z.enum(RELIABILITY_VALUES).optional(),
    limit: z
      .number()
      .int()
      .min(1)
      .max(50)
      .optional()
      .describe('Maximum entries to render in detail (default 8).'),
  }).refine(
    v =>
      v.product !== undefined ||
      v.version !== undefined ||
      v.cve !== undefined ||
      v.exploit_type !== undefined ||
      v.surface !== undefined ||
      v.min_reliability !== undefined,
    { message: 'Supply at least one filter.' },
  ),
)
type InputSchema = ReturnType<typeof inputSchema>
export type Input = z.infer<InputSchema>

const outputSchema = lazySchema(() =>
  z.object({
    scanned: z.number(),
    hits: z.number(),
    shown: z.number(),
    rendered: z.string(),
    errors: z.array(z.object({ file: z.string(), reason: z.string() })),
  }),
)
type OutputSchema = ReturnType<typeof outputSchema>
export type Output = z.infer<OutputSchema>

export const ArsenalLookupTool = buildTool({
  name: ARSENAL_LOOKUP_TOOL_NAME,
  searchHint: 'query exploit arsenal by CVE, product, version, surface, reliability',
  maxResultSizeChars: 40_000,
  strict: true,
  async description() {
    return DESCRIPTION
  },
  async prompt() {
    return PROMPT
  },
  get inputSchema(): InputSchema {
    return inputSchema()
  },
  get outputSchema(): OutputSchema {
    return outputSchema()
  },
  userFacingName() {
    return 'ArsenalLookup'
  },
  isConcurrencySafe() {
    return true
  },
  isReadOnly() {
    return true
  },
  toAutoClassifierInput(input) {
    return [input.cve, input.product, input.version, input.surface, input.exploit_type]
      .filter(Boolean)
      .join(' ')
  },
  renderToolUseMessage() {
    return null
  },
  async call(input) {
    const filter: ArsenalLookupFilter = {
      product: input.product,
      version: input.version,
      cve: input.cve,
      exploit_type: input.exploit_type as ExploitType | undefined,
      surface: input.surface,
      min_reliability: input.min_reliability as ReliabilityScore | undefined,
    }
    const { entries, errors } = await loadArsenal(getCwd())
    const hits = sortArsenalHits(matchArsenal(entries, filter))
    const limit = input.limit ?? 8
    const rendered = renderArsenalLookupResult(entries.length, hits, errors, { limit })
    return {
      data: {
        scanned: entries.length,
        hits: hits.length,
        shown: Math.min(hits.length, limit),
        rendered,
        errors,
      },
    }
  },
  mapToolResultToToolResultBlockParam(content, toolUseID) {
    const output = content as Output
    return {
      tool_use_id: toolUseID,
      type: 'tool_result',
      content: output.rendered,
    }
  },
} satisfies ToolDef<InputSchema, Output>)
