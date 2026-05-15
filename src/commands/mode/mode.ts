import type { LocalCommandCall } from '../../types/command.js'
import {
  SECURITY_WORKFLOWS,
  WORKFLOW_CATEGORIES,
  findWorkflow,
  getWorkflowsByCategory,
  isWorkflowId,
  type SecurityWorkflow,
  type WorkflowCategory,
} from '../../security/workflows.js'

const KICKOFF_HINT = 'Start any workflow:  /engagement init <id> <target>'

/** Right-pads `s` to `width` with spaces. */
function pad(s: string, width: number): string {
  return s.length >= width ? s : s + ' '.repeat(width - s.length)
}

/** Renders one category block: header, blurb, and its workflows. */
function renderCategory(category: WorkflowCategory): string {
  const info = WORKFLOW_CATEGORIES.find(c => c.id === category)!
  const workflows = getWorkflowsByCategory(category)
  const idWidth = Math.max(...SECURITY_WORKFLOWS.map(w => w.id.length)) + 2
  const lines = workflows.map(
    w => `    ${pad(w.id, idWidth)}${w.label}`,
  )
  return `  ${info.label.toUpperCase()} — ${info.blurb}\n${lines.join('\n')}`
}

/** Full menu: every category, then the kickoff hint. */
function renderMenu(): string {
  const blocks = WORKFLOW_CATEGORIES.map(c => renderCategory(c.id))
  return `Net-Runner — mode menu\n\n${blocks.join('\n\n')}\n\n${KICKOFF_HINT}`
}

/** Detail view for a single workflow. */
function renderWorkflow(workflow: SecurityWorkflow): string {
  const specialists = [...new Set(workflow.specialistAgents)]
  return `${workflow.label}  (${workflow.id})
category:    ${workflow.category}
${workflow.description}

specialists: ${specialists.join(', ')}
skills:      ${workflow.defaultSkills.length} default skills loaded
packs:       ${workflow.capabilityPacks.join(', ')}

Start it:    /engagement init ${workflow.id} <target>`
}

const call: LocalCommandCall = async args => {
  const arg = args.trim().toLowerCase()

  if (!arg) {
    return { type: 'text', value: renderMenu() }
  }

  // /mode <category>
  const category = WORKFLOW_CATEGORIES.find(
    c => c.id === arg || c.label.toLowerCase() === arg,
  )
  if (category) {
    return {
      type: 'text',
      value: `${renderCategory(category.id)}\n\n${KICKOFF_HINT}`,
    }
  }

  // /mode <workflow-id>
  if (isWorkflowId(arg)) {
    return { type: 'text', value: renderWorkflow(findWorkflow(arg)!) }
  }

  return {
    type: 'text',
    value: `Unknown mode or workflow: ${args.trim()}

Run /mode with no argument for the full menu.
Categories: ${WORKFLOW_CATEGORIES.map(c => c.id).join(', ')}`,
  }
}

export { call }
