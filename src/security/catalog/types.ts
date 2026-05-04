import type { NetRunnerAgentType } from '../agentTypes.js'
import type { CapabilityExecutionModel } from '../capabilities.js'
import type { CapabilityPackName } from '../workflows.js'

/**
 * Pentest tool catalog entry. A cataloged external binary (nmap, sqlmap, etc.)
 * mapped to capability packs, recommended specialist agents, and optional
 * MITRE ATT&CK techniques.
 *
 * See CONTEXT.md → "Pentest Tool Entry" for the canonical definition.
 */
export type ImportedPentestCapability = {
  id: `kali-${string}`
  label: string
  description: string
  capabilityPacks: CapabilityPackName[]
  recommendedAgents: NetRunnerAgentType[]
  executionModel: CapabilityExecutionModel
  netRunnerTools: string[]
  requiredCommands: string[]
  optionalMcpServers?: string[]
  mitreAttackTechniques?: string[]
}
