import type { ImportedPentestCapability } from '../types.js'

export const LATERAL_MOVEMENT_PACK_TOOLS: ImportedPentestCapability[] = [
  {
    id: "kali-bloodhound" as const,
    label: "BloodHound Collection",
    description: "Active Directory relationship graph collection capability for attack-path analysis.",
    capabilityPacks: ["lateral-movement","privilege-escalation","network","active-directory"],
    recommendedAgents: ["lateral-movement-specialist","privilege-escalation-specialist","ad-specialist"],
    executionModel: "hybrid",
    netRunnerTools: ["Bash","WebFetch","TodoWrite","Write","Read","ListMcpResources","ReadMcpResource"],
    requiredCommands: ["bloodhound-python"],
    optionalMcpServers: ["active-directory","bloodhound"],
  },
]
