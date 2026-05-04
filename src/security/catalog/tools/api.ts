import type { ImportedPentestCapability } from '../types.js'

export const API_PACK_TOOLS: ImportedPentestCapability[] = [
  {
    id: "kali-graphql-scanner" as const,
    label: "GraphQL Scanner",
    description: "GraphQL introspection and mutation vulnerability scanning capability for API attack surface.",
    capabilityPacks: ["api","web","exploitation"],
    recommendedAgents: ["api-testing-specialist","web-testing-specialist"],
    executionModel: "skills-and-tools",
    netRunnerTools: ["Bash","WebFetch","TodoWrite","Write","Read"],
    requiredCommands: ["python3"],
  },
  {
    id: "kali-jwt-tool" as const,
    label: "JWT Attack Toolkit",
    description: "JWT token analysis and attack capability for alg:none, key confusion, and brute-force attacks.",
    capabilityPacks: ["api","web","exploitation"],
    recommendedAgents: ["api-testing-specialist","web-testing-specialist","exploit-specialist"],
    executionModel: "skills-and-tools",
    netRunnerTools: ["Bash","WebFetch","TodoWrite","Write","Read"],
    requiredCommands: ["python3"],
  },
  {
    id: "kali-api-schema-analyzer" as const,
    label: "API Schema Security Analyzer",
    description: "Analyze OpenAPI/Swagger/GraphQL schemas for security issues including auth gaps, injection points, and misconfigurations.",
    capabilityPacks: ["api","web"],
    recommendedAgents: ["api-testing-specialist","web-testing-specialist"],
    executionModel: "skills-and-tools",
    netRunnerTools: ["Bash","WebFetch","TodoWrite","Write","Read"],
    requiredCommands: ["curl"],
  },
]
