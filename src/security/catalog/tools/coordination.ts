import type { ImportedPentestCapability } from '../types.js'

export const COORDINATION_PACK_TOOLS: ImportedPentestCapability[] = [
  {
    id: "kali-sliver-c2" as const,
    label: "Sliver C2 Operations",
    description: "Optional C2 integration capability for authorized adversary-emulation command-and-control workflows.",
    capabilityPacks: ["coordination","lab-control","lateral-movement","exploitation"],
    recommendedAgents: ["engagement-lead","infra-specialist","infra-specialist","infra-specialist"],
    executionModel: "hybrid",
    netRunnerTools: ["Bash","WebFetch","TodoWrite","Write","Read","ListMcpResources","ReadMcpResource","Agent","SendMessage"],
    requiredCommands: ["sliver-client"],
    optionalMcpServers: ["sliver","c2"],
  },
  {
    id: "kali-mythic-c2" as const,
    label: "Mythic C2 Operations",
    description: "Optional C2 integration capability for authorized operator-managed command-and-control workflows.",
    capabilityPacks: ["coordination","lab-control","lateral-movement","exploitation"],
    recommendedAgents: ["engagement-lead","infra-specialist","infra-specialist","infra-specialist"],
    executionModel: "hybrid",
    netRunnerTools: ["Bash","WebFetch","TodoWrite","Write","Read","ListMcpResources","ReadMcpResource","Agent","SendMessage"],
    requiredCommands: ["mythic-cli"],
    optionalMcpServers: ["mythic","c2"],
  },
]
