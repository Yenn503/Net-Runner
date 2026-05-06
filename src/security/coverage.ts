import { readEvidenceEntries, type FindingEntry, type ValidationEntry } from './evidence.js'
import { IMPORTED_PENTEST_CAPABILITIES } from './catalog/index.js'
import { readEngagementManifest } from './engagement.js'
import { findWorkflow } from './workflows.js'

export type CoverageResult = {
  expected: number
  covered: number
  pct: number
  coveredTechniques: string[]
  gapTechniques: string[]
}

export async function computeCoverage(
  cwd: string,
  workflowId?: string,
  target?: string,
): Promise<CoverageResult> {
  const entries = await readEvidenceEntries(cwd)

  let resolvedWorkflowId = workflowId
  if (!resolvedWorkflowId) {
    const manifest = await readEngagementManifest(cwd)
    resolvedWorkflowId = manifest?.workflowId
  }

  const workflow = resolvedWorkflowId ? findWorkflow(resolvedWorkflowId as any) : undefined

  const expectedSet = new Set<string>()
  if (workflow) {
    for (const pack of workflow.capabilityPacks) {
      for (const tool of IMPORTED_PENTEST_CAPABILITIES) {
        if (tool.capabilityPacks.includes(pack)) {
          for (const t of tool.mitreAttackTechniques ?? []) {
            expectedSet.add(t)
          }
        }
      }
    }
  } else {
    for (const tool of IMPORTED_PENTEST_CAPABILITIES) {
      for (const t of tool.mitreAttackTechniques ?? []) {
        expectedSet.add(t)
      }
    }
  }

  const validatedFindingIds = new Set(
    entries
      .filter((e): e is ValidationEntry => e.type === 'validation' && e.verdict === 'reproduces')
      .map(e => e.findingId),
  )

  const findings = entries.filter((e): e is FindingEntry => {
    if (e.type !== 'finding') return false
    if (!validatedFindingIds.has(e.id)) return false
    if (target) {
      const f = e as FindingEntry
      const haystack = [f.title, f.evidence, f.recommendation ?? ''].join(' ').toLowerCase()
      if (!haystack.includes(target.toLowerCase())) return false
    }
    return true
  })

  const coveredSet = new Set<string>()
  for (const f of findings) {
    for (const t of f.mitreAttackTechniques ?? []) {
      coveredSet.add(t)
    }
    for (const ref of f.mitreAttack ?? []) {
      coveredSet.add(ref.techniqueId)
    }
  }

  const expected = expectedSet.size
  const covered = [...coveredSet].filter(t => expectedSet.has(t)).length
  const pct = expected > 0 ? Math.round((covered / expected) * 100) : 0

  const coveredTechniques = [...coveredSet].filter(t => expectedSet.has(t)).slice(0, 15)
  const gapTechniques = [...expectedSet].filter(t => !coveredSet.has(t)).slice(0, 15)

  return { expected, covered, pct, coveredTechniques, gapTechniques }
}
