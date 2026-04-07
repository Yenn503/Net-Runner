# APT Simulation — Implementation Reference

> Comprehensive documentation for the APT Simulation subsystem in Net-Runner.
> This document is designed for agent review — every claim maps to a specific file and line range.

---

## Overview

The APT Simulation subsystem enables red teams to simulate realistic Advanced Persistent Threat (APT) attack chains against specific industries. When a client operates in finance, government, healthcare, telecom, or another sector, the operator selects an APT simulation workflow that mirrors the real-world threat actors most likely to target that industry.

**Key stats:**
- **40 APT groups** profiled with full MITRE ATT&CK technique mappings
- **10 detailed attack chains** with phase-by-phase simulation guidance
- **10 simulation workflows** ready to use, covering 7+ industry sectors
- **13 industry threat profiles** mapping sectors to relevant threat actors
- **172 MITRE ATT&CK technique definitions** in the technique library
- **115 unique MITRE ATT&CK techniques currently referenced** across APT group mappings
- **Sources**: Every group profile links to MITRE ATT&CK group pages, CISA advisories, Microsoft threat intel, and Mandiant reports

---

## Architecture

```
src/security/apt-simulation/
├── types.ts              # Core type definitions (all interfaces)
├── techniques.ts         # MITRE ATT&CK technique reference library
├── aptGroups.ts          # 40 APT group profiles with TTP mappings
├── industryMapping.ts    # 13 industry → threat actor mappings
├── attackChains.ts       # 10 detailed multi-phase attack chains
├── aptWorkflows.ts       # 10 simulation workflows with LLM guidance
└── index.ts              # Public API, composite lookups, prompt formatting
```

### Integration Points

| Engine File | What Changed | Lines |
|---|---|---|
| `src/security/skillDefinitions.ts` | Added `'apt-simulation'` to `NetRunnerSkillName` union and `NET_RUNNER_SKILL_DEFINITIONS` | L12, L92-98 |
| `src/skills/bundled/aptSimulation.ts` | New skill registration with NLP detection for APT groups and industries | Full file |
| `src/skills/bundled/index.ts` | Import + registration call for `registerAptSimulationSkill()` | L22, L44 |
| `src/security/autoEngagement.ts` | Added APT simulation intent detection in `inferWorkflow()` and exported `isAptSimulationIntent()` | L74-76, L96-103 |

---

## File-by-File Reference

### `types.ts` — Core Type Definitions

Defines all TypeScript interfaces used across the subsystem. No runtime logic — pure type definitions.

| Type | Purpose |
|---|---|
| `MitreTacticId` | Union of 14 MITRE ATT&CK Enterprise tactic IDs (TA0001–TA0043) |
| `MITRE_TACTIC_LABELS` | Tactic ID → human-readable label mapping |
| `MitreTechnique` | Technique reference: id, name, tactics[], url |
| `Attribution` | Nation-state attribution: russia, china, north-korea, iran, unknown, cybercrime |
| `IndustrySector` | 13 industry sectors from government to legal |
| `AptGroup` | Full group profile: id, name, aliases, attribution, techniques[], sources[] |
| `AptSource` | Source reference with label, url, and type (mitre/cisa/microsoft/vendor/ncsc/mandiant) |
| `AttackChainPhase` | Single phase: order, tacticId, techniques[], suggestedTools[], suggestedAgents[] |
| `AptAttackChain` | Ordered chain of phases for a specific APT group |
| `IndustryThreatProfile` | Sector → primaryThreats[], secondaryThreats[], commonInitialAccess[], highValueTargets[] |
| `AptSimulationWorkflow` | Workflow definition with capabilityPacks, skills, agents, and simulationGuidance |
| `AptSimulationRegistry` | Container holding groups, chains, profiles, and workflows |

### `techniques.ts` — MITRE ATT&CK Technique Library

172 technique definitions organized by tactic, each with:
- Technique ID (e.g. `T1566.001`)
- Human-readable name
- Tactic mapping (many techniques span multiple tactics)
- MITRE ATT&CK permalink

**Functions:**
- `getTechnique(id)` — Single technique lookup
- `getTechniquesByTactic(tacticId)` — All techniques for a tactic
- `resolveTechniqueIds(ids[])` — Batch resolve technique IDs to full objects

### `aptGroups.ts` — APT Group Profiles

40 groups organized by attribution:

#### Russia (4 groups)
| Group | Aliases | Key Industries | Techniques | Source |
|---|---|---|---|---|
| **APT29** | Cozy Bear, Midnight Blizzard, NOBELIUM | Government, Technology, Healthcare | 42 | [MITRE G0016](https://attack.mitre.org/groups/G0016/), [CISA AA24-057A](https://www.cisa.gov/news-events/cybersecurity-advisories/aa24-057a) |
| **APT28** | Fancy Bear, Forest Blizzard, Sofacy | Government, Defense, Energy | 50 | [MITRE G0007](https://attack.mitre.org/groups/G0007/), [CISA AA20-296A](https://www.cisa.gov/news-events/cybersecurity-advisories/aa20-296a) |
| **Turla** | Venomous Bear, Secret Blizzard, Snake | Government, Defense, Education | 48 | [MITRE G0010](https://attack.mitre.org/groups/G0010/), [CISA AA23-129A](https://www.cisa.gov/news-events/cybersecurity-advisories/aa23-129a) |
| **Sandworm** | APT44, ELECTRUM, IRIDIUM, Seashell Blizzard | Critical Infrastructure, Energy, Government | 45 | [MITRE G0034](https://attack.mitre.org/groups/G0034/), [Mandiant APT44](https://www.mandiant.com/resources/blog/apt44-unearthing-sandworm) |

#### China (15 groups)
| Group | Aliases | Key Industries | Techniques | Source |
|---|---|---|---|---|
| **APT41** | Brass Typhoon, Wicked Panda, Winnti | Technology, Telecom, Healthcare, Finance | 49 | [MITRE G0096](https://attack.mitre.org/groups/G0096/), [Mandiant](https://www.mandiant.com/resources/apt41-dual-espionage-and-cyber-crime-operation) |
| **Volt Typhoon** | BRONZE SILHOUETTE, Vanguard Panda | Critical Infrastructure, Manufacturing, Energy | 33 | [MITRE G1017](https://attack.mitre.org/groups/G1017/), [CISA AA24-038A](https://www.cisa.gov/news-events/cybersecurity-advisories/aa24-038a), [Microsoft](https://www.microsoft.com/en-us/security/blog/2023/05/24/volt-typhoon-targets-us-critical-infrastructure-with-living-off-the-land-techniques/) |
| **Salt Typhoon** | GhostEmperor, FamousSparrow | Telecommunications, Government | 28 | [MITRE G1045](https://attack.mitre.org/groups/G1045/), [CISA Telecom Hardening](https://www.cisa.gov/news-events/alerts/2024/12/04/cisa-and-partners-release-joint-guide-securing-communications-infrastructure) |
| **Silk Typhoon** | HAFNIUM | Technology, Healthcare, Education, Defense, Legal | 30 | [MITRE G0125](https://attack.mitre.org/groups/G0125/), [Microsoft](https://www.microsoft.com/en-us/security/blog/2025/03/05/silk-typhoon-targeting-it-supply-chain/) |
| **GALLIUM** | Granite Typhoon | Telecommunications, Finance, Government | 24 | [MITRE G0093](https://attack.mitre.org/groups/G0093/) |
| **Mustang Panda** | BRONZE PRESIDENT, RedDelta, Earth Preta | Government, Telecom, Defense | 28 | [MITRE G0129](https://attack.mitre.org/groups/G0129/) |
| **APT40 / Leviathan** | Gingham Typhoon, TEMP.Periscope | Defense, Government, Healthcare, Education | 42 | [MITRE G0065](https://attack.mitre.org/groups/G0065/), [CISA AA21-200A](https://www.cisa.gov/news-events/cybersecurity-advisories/aa21-200a) |
| **BlackTech** | Palmerworm, Circuit Panda | Telecom, Manufacturing, Finance | 28 | [MITRE G0098](https://attack.mitre.org/groups/G0098/), [CISA AA23-270A](https://www.cisa.gov/news-events/cybersecurity-advisories/aa23-270a) |
| **Deep Panda** | Shell Crew, KungFu Kittens | Government, Defense, Finance, Telecom, Healthcare | 26 | [MITRE G0009](https://attack.mitre.org/groups/G0009/) |
| **Violet Typhoon / APT31** | Zirconium, Judgment Panda | Government, Defense, Technology | 26 | [MITRE G0128](https://attack.mitre.org/groups/G0128/) |
| **Ke3chang / APT15** | Nylon Typhoon, Vixen Panda | Government, Energy, Defense | 20 | [MITRE G0004](https://attack.mitre.org/groups/G0004/) |
| **Thrip** | Lotus Blossom | Telecommunications, Defense | 18 | [MITRE G0076](https://attack.mitre.org/groups/G0076/) |
| **Tropic Trooper** | Pirate Panda, Earth Centaur | Healthcare, Government, Defense, Technology | 22 | [MITRE G0081](https://attack.mitre.org/groups/G0081/) |
| **UNC3886** | — | Telecommunications, Technology, Defense | 18 | [Mandiant](https://www.mandiant.com/resources/blog/unc3886-vmware-esxi-zero-day) |
| **APT18** | Wekby, Dynamite Panda | Healthcare, Technology, Manufacturing, Government | 20 | [MITRE G0026](https://attack.mitre.org/groups/G0026/) |

#### North Korea (5 groups)
| Group | Aliases | Key Industries | Techniques | Source |
|---|---|---|---|---|
| **Lazarus Group** | HIDDEN COBRA, Diamond Sleet, Zinc | Financial, Technology, Defense, Media | 58 | [MITRE G0032](https://attack.mitre.org/groups/G0032/), [CISA AA22-108A](https://www.cisa.gov/news-events/cybersecurity-advisories/aa22-108a) |
| **APT38** | BeagleBoyz, Bluenoroff, Sapphire Sleet | Financial Services | 42 | [MITRE G0082](https://attack.mitre.org/groups/G0082/), [CISA BeagleBoyz](https://www.cisa.gov/news-events/alerts/2020/08/26/north-korean-state-sponsored-cyber-actors-use-beagleboyz-cryptocurrency) |
| **Kimsuky** | Velvet Chollima, Emerald Sleet, Thallium | Government, Education, Manufacturing | 36 | [MITRE G0094](https://attack.mitre.org/groups/G0094/), [CISA AA20-301A](https://www.cisa.gov/news-events/cybersecurity-advisories/aa20-301a) |
| **Andariel** | Onyx Sleet, Silent Chollima, Stonefly | Financial, Healthcare, Government, Defense | 32 | [MITRE G0138](https://attack.mitre.org/groups/G0138/), [CISA AA22-187A](https://www.cisa.gov/news-events/cybersecurity-advisories/aa22-187a) |
| **Contagious Interview** | Famous Chollima | Technology, Financial | 18 | [MITRE G1034](https://attack.mitre.org/groups/G1034/) |

#### Iran (6 groups)
| Group | Aliases | Key Industries | Techniques | Source |
|---|---|---|---|---|
| **APT42** | Calanque, UNC788 | Government, Media, Education, Healthcare | 28 | [MITRE G1044](https://attack.mitre.org/groups/G1044/), [Mandiant](https://www.mandiant.com/resources/blog/apt42-charms-cons-compromises) |
| **Magic Hound / APT35** | Charming Kitten, Mint Sandstorm | Government, Defense, Media, Education | 38 | [MITRE G0059](https://attack.mitre.org/groups/G0059/), [Microsoft](https://www.microsoft.com/en-us/security/blog/2023/04/18/nation-state-threat-actor-mint-sandstorm-refines-tradecraft-to-attack-high-value-targets/) |
| **APT33** | Peach Sandstorm, Elfin, Magnallium | Energy, Defense, Government | 28 | [MITRE G0064](https://attack.mitre.org/groups/G0064/) |
| **MuddyWater** | Mercury, Mango Sandstorm | Telecom, Government, Defense, Energy | 30 | [MITRE G0069](https://attack.mitre.org/groups/G0069/), [CISA AA22-055A](https://www.cisa.gov/news-events/cybersecurity-advisories/aa22-055a) |
| **OilRig / APT34** | Hazel Sandstorm, Helix Kitten | Telecom, Finance, Government, Energy | 36 | [MITRE G0049](https://attack.mitre.org/groups/G0049/) |
| **APT39** | Chafer, Remix Kitten | Telecommunications, Government | 24 | [MITRE G0087](https://attack.mitre.org/groups/G0087/) |

#### Other / South Asia (3 groups)
| Group | Key Industries | Source |
|---|---|---|
| **Patchwork** | Government, Defense | [MITRE G0040](https://attack.mitre.org/groups/G0040/) |
| **Blind Eagle** | Government, Finance, Energy | [MITRE G1030](https://attack.mitre.org/groups/G1030/) |
| **TA2541** | Defense, Manufacturing | [MITRE G1018](https://attack.mitre.org/groups/G1018/) |

#### Cybercrime / APT-Style (7 groups)
| Group | Aliases | Key Industries | Source |
|---|---|---|---|
| **FIN7** | Carbanak Group, Sangria Tempest | Finance, Retail, Healthcare | [MITRE G0046](https://attack.mitre.org/groups/G0046/) |
| **Silence** | Whisper Spider | Financial Services | [MITRE G0091](https://attack.mitre.org/groups/G0091/) |
| **Carbanak** | Anunak | Financial Services | [MITRE G0008](https://attack.mitre.org/groups/G0008/) |
| **Scattered Spider** | UNC3944, Octo Tempest | Technology, Telecom, Finance | [MITRE G1015](https://attack.mitre.org/groups/G1015/), [Microsoft](https://www.microsoft.com/en-us/security/blog/2023/10/25/octo-tempest-crosses-boundaries-to-facilitate-extortion-encryption-and-destruction/) |
| **LAPSUS$** | DEV-0537, Strawberry Tempest | Technology, Telecom, Government | [MITRE G1004](https://attack.mitre.org/groups/G1004/) |
| **TeamTNT** | — | Technology (Cloud/Container) | [MITRE G0139](https://attack.mitre.org/groups/G0139/) |
| **EXOTIC LILY** | — | Technology, Healthcare | [MITRE G1011](https://attack.mitre.org/groups/G1011/) |

**Functions:**
- `findAptGroup(id)` — Lookup by ID
- `findAptGroupsByAttribution(attr)` — Filter by nation-state
- `findAptGroupsByIndustry(sector)` — Filter by target industry

### `industryMapping.ts` — Industry Threat Profiles

13 industry profiles, each containing:
- Primary and secondary threat actor IDs (priority ordered)
- Common initial-access vectors with MITRE technique references
- High-value targets that threat actors pursue in that sector

| Industry | Primary Threats | Secondary Threats |
|---|---|---|
| Government | APT29, APT28, Turla, Kimsuky, APT42, Magic Hound | Mustang Panda, Violet Typhoon, Ke3chang, Patchwork, Volt Typhoon, MuddyWater, LAPSUS$ |
| Telecommunications | Salt Typhoon, GALLIUM, APT41, OilRig | Thrip, BlackTech, UNC3886, APT39, MuddyWater, LAPSUS$ |
| Critical Infrastructure | Volt Typhoon, Sandworm, APT33, MuddyWater | APT39, LAPSUS$, OilRig |
| Energy | APT33, Sandworm, OilRig, MuddyWater | Volt Typhoon, Ke3chang, Blind Eagle, LAPSUS$ |
| Defense | APT40, APT28, Lazarus, APT33 | TA2541, Turla, Volt Typhoon, Magic Hound, Tropic Trooper, Violet Typhoon, Ke3chang |
| Healthcare | APT29, Silk Typhoon, APT40, Deep Panda | Tropic Trooper, APT18, Andariel, APT42, EXOTIC LILY, LAPSUS$ |
| Financial Services | APT38, Lazarus, Andariel, FIN7 | Silence, Carbanak, OilRig, GALLIUM, Blind Eagle, Contagious Interview, Scattered Spider |
| Technology | APT29, Silk Typhoon, APT41, Scattered Spider | TeamTNT, Contagious Interview, EXOTIC LILY, UNC3886, LAPSUS$ |
| Manufacturing | Volt Typhoon, APT41, BlackTech, Kimsuky | LAPSUS$, TA2541, APT18 |
| Education | Kimsuky, Turla, Silk Typhoon | APT40, Magic Hound, Tropic Trooper, LAPSUS$ |
| Media | Magic Hound, APT42 | Lazarus, FIN7, LAPSUS$ |
| Retail | FIN7, Scattered Spider | APT41, LAPSUS$ |
| Legal | Silk Typhoon, APT29 | APT41, Scattered Spider |

### `attackChains.ts` — Attack Chain Definitions

10 multi-phase attack chains, each with:
- Ordered phases mapped to MITRE ATT&CK tactics
- MITRE technique IDs per phase
- Suggested Net-Runner tools per phase
- Suggested specialist agents per phase
- Recommended impact level

| Chain | APT Group | Target Industries | Phases | Impact |
|---|---|---|---|---|
| APT29 Gov Cloud Espionage | APT29 | Government, Technology, Healthcare | 11 | Intrusive |
| APT28 Gov Credential Harvesting | APT28 | Government, Defense, Energy | 11 | Intrusive |
| Volt Typhoon Infra Pre-Positioning | Volt Typhoon | Critical Infrastructure, Manufacturing, Energy, Government | 11 | Limited |
| Sandworm ICS/OT Destructive Ops | Sandworm | Critical Infrastructure, Energy, Government | 9 | Intrusive |
| APT38 SWIFT Heist | APT38 | Financial Services | 10 | Intrusive |
| Scattered Spider Identity Compromise | Scattered Spider | Financial, Technology, Telecom, Retail | 9 | Intrusive |
| Salt Typhoon Telecom Espionage | Salt Typhoon | Telecommunications, Government | 9 | Intrusive |
| Silk Typhoon Supply Chain | Silk Typhoon | Technology, Healthcare, Education, Legal, Government | 9 | Intrusive |
| Lazarus Healthcare Ransomware | Lazarus | Healthcare, Financial | 11 | Intrusive |
| APT41 Manufacturing IP Theft | APT41 | Manufacturing, Technology, Healthcare | 10 | Intrusive |

### `aptWorkflows.ts` — Simulation Workflows

10 ready-to-use workflows that pair attack chains with engine components:

| Workflow ID | Label | APT | Industry |
|---|---|---|---|
| `apt-sim-apt29-government` | APT29 Government Cloud Espionage | APT29 | Government |
| `apt-sim-apt28-government` | APT28 Government Credential Harvesting | APT28 | Government |
| `apt-sim-volt-typhoon-infrastructure` | Volt Typhoon Critical Infrastructure | Volt Typhoon | Critical Infrastructure |
| `apt-sim-sandworm-ics` | Sandworm ICS/OT Destructive Operations | Sandworm | Critical Infrastructure |
| `apt-sim-apt38-financial` | APT38 Financial SWIFT Heist | APT38 | Financial |
| `apt-sim-scattered-spider-financial` | Scattered Spider Identity-Centric | Scattered Spider | Financial |
| `apt-sim-salt-typhoon-telecom` | Salt Typhoon Telecom Espionage | Salt Typhoon | Telecom |
| `apt-sim-silk-typhoon-technology` | Silk Typhoon Supply Chain | Silk Typhoon | Technology |
| `apt-sim-lazarus-healthcare` | Lazarus Healthcare Ransomware | Lazarus | Healthcare |
| `apt-sim-apt41-manufacturing` | APT41 Manufacturing IP Theft | APT41 | Manufacturing |

Each workflow includes:
- **Capability packs**: Which tool packs to activate
- **Default skills**: Which skills to load
- **Specialist agents**: Which agents to deploy
- **Simulation guidance**: Full prompt injected into the LLM with step-by-step attack pattern, key techniques, and MITRE ATT&CK links

### `index.ts` — Public API

Central export point with composite functions:

| Function | Purpose |
|---|---|
| `getAptSimulationRegistry()` | Full registry of all groups, chains, profiles, workflows |
| `getSimulationContextForIndustry(sector)` | Industry profile + matching groups, chains, workflows |
| `formatAptSimulationPrompt(workflowId)` | Build prompt-injectable APT simulation context |
| `getAptSimulationStats()` | Quick stats (counts by attribution, techniques, etc.) |

### `aptSimulation.ts` (skill) — Engine Integration

The `/apt-simulation` skill provides:
- **NLP detection**: Recognizes 20+ APT group names/aliases and 30+ industry keywords from natural language
- **Three modes**:
  1. Specific APT group requested → loads that group's simulation workflow and prompt
  2. Industry specified → shows available simulations, primary threats, initial access vectors
  3. No input → lists all available simulations with usage examples

### `autoEngagement.ts` — Auto-Detection

- `inferWorkflow()` now detects APT simulation intent keywords and routes to `lab-target-testing` as the base workflow
- `isAptSimulationIntent()` exported for use by other modules
- Pattern matches: `apt-N`, `apt simulation`, `threat simulation`, `threat actor`, `attack chain`, plus 15+ specific group name/alias patterns

---

## Source References

All APT group profiles reference authoritative sources:

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

---

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

// Get all threats for a sector
const context = getSimulationContextForIndustry('financial-services')

// Build LLM prompt for a specific simulation
const prompt = formatAptSimulationPrompt('apt-sim-apt38-financial')

// Look up a specific group
const group = findAptGroup('apt29')

// Get stats
const stats = getAptSimulationStats()
```

---

## How It Integrates with the Existing Engine

1. **Skill System**: The `/apt-simulation` skill is registered alongside existing security skills in `src/skills/bundled/index.ts`. It uses the same `registerBundledSkill()` API.

2. **Auto-Engagement**: When a user mentions APT-related keywords (group names, "threat simulation", etc.), `autoEngagement.ts` detects this and routes to the `lab-target-testing` base workflow, which provides the broadest set of capability packs and agents.

3. **Prompt Injection**: `formatAptSimulationPrompt()` builds a structured context block that can be injected into the LLM's system prompt, giving it step-by-step attack guidance, key techniques, and MITRE ATT&CK references.

4. **Agent Routing**: Each attack chain phase specifies which specialist agents should handle that phase. The engagement-lead agent uses this to delegate work correctly.

5. **Guardrails**: Impact phases in attack chains that involve destructive operations (wiper, ransomware) are explicitly marked as "SIMULATION ONLY" in the guidance text. The existing guardrail system will still block or flag high-impact actions.

6. **Evidence**: All simulation activity flows through the normal evidence capture system — findings, artifacts, and notes are stored in `.netrunner/evidence/`.
