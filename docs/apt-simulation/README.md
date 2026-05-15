# APT Simulation — Reference

## Overview

Simulate realistic APT attack chains against specific industries (finance, government, healthcare, telecom, …). The operator picks a workflow mirroring the threat actors most likely to target the client's sector.

**Key stats:**
- 40 APT groups profiled with MITRE ATT&CK technique mappings
- 10 detailed attack chains with phase-by-phase simulation guidance
- 10 simulation workflows covering 7+ industry sectors
- 13 industry threat profiles mapping sectors to relevant threat actors
- A MITRE ATT&CK technique reference library
- Every group profile links to MITRE ATT&CK, CISA advisories, Microsoft threat intel, and Mandiant reports

## Architecture

```
src/security/apt-simulation/
├── types.ts              # Core type definitions
├── techniques.ts         # MITRE ATT&CK technique reference library
├── aptGroups.ts          # 40 APT group profiles with TTP mappings
├── industryMapping.ts    # 13 industry → threat actor mappings
├── attackChains.ts       # 10 detailed multi-phase attack chains
├── aptWorkflows.ts       # 10 simulation workflows with LLM guidance
└── index.ts              # Public API, composite lookups, prompt formatting
```

The `/apt-simulation` skill (`src/skills/bundled/aptSimulation.ts`) detects
APT-group and industry intent in natural language; `autoEngagement.ts` routes
APT keywords onto the `lab-target-testing` base workflow. Read `types.ts` for
the authoritative interface shapes rather than mirroring them here.

## Source References

Per-group MITRE ATT&CK pages, CISA advisories, Microsoft TI, and Mandiant reports are linked inline within `attack-chain-reference.md`. Master source list:

### MITRE ATT&CK Group Pages
- APT29: https://attack.mitre.org/groups/G0016/
- APT28: https://attack.mitre.org/groups/G0007/
- Turla: https://attack.mitre.org/groups/G0010/
- Sandworm: https://attack.mitre.org/groups/G0034/
- APT41: https://attack.mitre.org/groups/G0096/
- Volt Typhoon: https://attack.mitre.org/groups/G1017/
- Salt Typhoon: https://attack.mitre.org/groups/G1045/
- HAFNIUM/Silk Typhoon: https://attack.mitre.org/groups/G0125/
- GALLIUM: https://attack.mitre.org/groups/G0093/
- Mustang Panda: https://attack.mitre.org/groups/G0129/
- Leviathan/APT40: https://attack.mitre.org/groups/G0065/
- BlackTech: https://attack.mitre.org/groups/G0098/
- Deep Panda: https://attack.mitre.org/groups/G0009/
- APT31: https://attack.mitre.org/groups/G0128/
- Ke3chang: https://attack.mitre.org/groups/G0004/
- Thrip: https://attack.mitre.org/groups/G0076/
- Tropic Trooper: https://attack.mitre.org/groups/G0081/
- APT18: https://attack.mitre.org/groups/G0026/
- Lazarus: https://attack.mitre.org/groups/G0032/
- APT38: https://attack.mitre.org/groups/G0082/
- Kimsuky: https://attack.mitre.org/groups/G0094/
- Andariel: https://attack.mitre.org/groups/G0138/
- Contagious Interview: https://attack.mitre.org/groups/G1034/
- APT42: https://attack.mitre.org/groups/G1044/
- Magic Hound: https://attack.mitre.org/groups/G0059/
- APT33: https://attack.mitre.org/groups/G0064/
- MuddyWater: https://attack.mitre.org/groups/G0069/
- OilRig: https://attack.mitre.org/groups/G0049/
- APT39: https://attack.mitre.org/groups/G0087/
- Patchwork: https://attack.mitre.org/groups/G0040/
- Blind Eagle: https://attack.mitre.org/groups/G1030/
- TA2541: https://attack.mitre.org/groups/G1018/
- FIN7: https://attack.mitre.org/groups/G0046/
- Silence: https://attack.mitre.org/groups/G0091/
- Carbanak: https://attack.mitre.org/groups/G0008/
- Scattered Spider: https://attack.mitre.org/groups/G1015/
- LAPSUS$: https://attack.mitre.org/groups/G1004/
- TeamTNT: https://attack.mitre.org/groups/G0139/
- EXOTIC LILY: https://attack.mitre.org/groups/G1011/

### CISA Advisories
- AA24-057A — SVR Cloud Access (APT29)
- AA20-296A — Russian GRU Cyber Actors (APT28)
- AA23-129A — Snake Malware (Turla)
- AA24-038A — Volt Typhoon
- Telecom Hardening Guidance 2024-12-04 (Salt Typhoon)
- AA21-200A — APT40
- AA23-270A — BlackTech
- AA22-108A — North Korean State-Sponsored (Lazarus)
- AA20-301A — Kimsuky
- AA22-187A — Andariel / Maui Ransomware
- AA22-055A — MuddyWater

### Microsoft Threat Intelligence
- Midnight Blizzard (APT29)
- Volt Typhoon Living-Off-The-Land
- Silk Typhoon IT Supply Chain (2025)
- Mint Sandstorm (Magic Hound)
- Octo Tempest (Scattered Spider)

### Mandiant Reports
- APT44 / Sandworm
- APT41 Dual Espionage
- APT42 Charms, Cons, Compromises
- UNC3886 VMware ESXi Zero-Day

## Usage

### Via Skill (Interactive)
```
/apt-simulation APT29 against government
/apt-simulation financial services
/apt-simulation Volt Typhoon critical infrastructure
/apt-simulation telecom
```

### Via Code (Programmatic)
```typescript
import {
  getSimulationContextForIndustry,
  formatAptSimulationPrompt,
  findAptGroup,
  getAptSimulationStats,
} from './src/security/apt-simulation/index.js'

const context = getSimulationContextForIndustry('financial-services')
const prompt = formatAptSimulationPrompt('apt-sim-apt38-financial')
const group = findAptGroup('apt29')
const stats = getAptSimulationStats()
```

## Integration

- `/apt-simulation` skill registered in `src/skills/bundled/index.ts`
- `autoEngagement.ts` detects APT keywords, routes to the `lab-target-testing` base workflow
- `formatAptSimulationPrompt()` injects per-chain MITRE technique guidance into the LLM system prompt
- Each chain phase declares the specialist agent that handles it
- Destructive phases (wiper, ransomware) are marked SIMULATION ONLY; guardrails still gate high-impact actions
- All activity flows through `.netrunner/evidence/` like any other engagement
