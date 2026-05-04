import type { NetRunnerAgentType } from '../agentTypes.js'
import type { CapabilityPackName } from '../workflows.js'
import type { ImportedPentestCapability } from './types.js'
import { ALL_PACK_TOOLS } from './tools/index.js'

export type { ImportedPentestCapability } from './types.js'
export {
  ALL_PACK_TOOLS,
  ACTIVE_DIRECTORY_PACK_TOOLS,
  API_PACK_TOOLS,
  BINARY_PACK_TOOLS,
  CLOUD_PACK_TOOLS,
  COORDINATION_PACK_TOOLS,
  EVIDENCE_PACK_TOOLS,
  EXPLOITATION_PACK_TOOLS,
  LATERAL_MOVEMENT_PACK_TOOLS,
  MOBILE_PACK_TOOLS,
  NETWORK_PACK_TOOLS,
  RECON_PACK_TOOLS,
  WEB_PACK_TOOLS,
  WIFI_PACK_TOOLS,
} from './tools/index.js'

/** Flat catalog preserved for compatibility with older iteration-based callers. */
export const IMPORTED_PENTEST_CAPABILITIES: ImportedPentestCapability[] =
  ALL_PACK_TOOLS

/** Return every tool whose `capabilityPacks` contains the given pack. */
export function getToolsByPack(
  pack: CapabilityPackName,
): ImportedPentestCapability[] {
  return ALL_PACK_TOOLS.filter((tool) => tool.capabilityPacks.includes(pack))
}

/** Return every tool that recommends the given specialist agent. */
export function getToolsForAgent(
  agent: NetRunnerAgentType,
): ImportedPentestCapability[] {
  return ALL_PACK_TOOLS.filter((tool) => tool.recommendedAgents.includes(agent))
}

/** Return the single tool with the given id, or undefined. */
export function getToolById(
  id: ImportedPentestCapability['id'],
): ImportedPentestCapability | undefined {
  return ALL_PACK_TOOLS.find((tool) => tool.id === id)
}

/** Return the set of agents recommended for the given tool id. */
export function getAgentsForTool(
  id: ImportedPentestCapability['id'],
): NetRunnerAgentType[] {
  const tool = getToolById(id)
  return tool ? [...tool.recommendedAgents] : []
}
