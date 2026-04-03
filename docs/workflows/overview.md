# Net-Runner Workflow Overview

`Net-Runner` runs assessments as one inline runtime loop: engagement state, orchestration, guardrails, evidence, and memory.

## Current workflow registry

- `web-app-testing`
  - For route mapping, parameter testing, auth/session validation, and evidence-backed web findings.
- `api-testing`
  - For endpoint discovery, schema-aware validation, state transition testing, and API-specific findings.
- `lab-target-testing`
  - For HTB-style targets, internal labs, and scoped training or research environments.
- `ctf-mode`
  - For challenge-oriented workflows where speed, evidence, and iteration matter more than polished reporting.
- `ad-testing`
  - For Active Directory enumeration, Kerberos abuse, trust-path analysis, and domain escalation validation.
- `wifi-testing`
  - For wireless assessments, WPA/WPA2 attack paths, rogue AP testing, and 802.11 analysis.

## Runtime flow

1. Start with a plain-language assessment instruction that includes a target.
2. If the prompt is non-slash, has assessment intent, and includes a detectable URL, IP, or domain, Net-Runner auto-initializes `.netrunner/engagement.json` if needed.
3. Auto-init starts operator-directed (`authorization=confirmed`) and infers an initial `maxImpact` from the prompt (`limited` by default, `read-only` or `intrusive` when explicitly requested).
4. The operator can raise or lower `maxImpact` later in normal chat without leaving the main flow, or initialize manually with `/engagement init [workflow] [target]` if the heuristic did not fire.
5. The runtime injects engagement context into model turns (scope, status, restrictions, impact).
6. The main agent executes tools directly and can delegate scoped tasks to specialists through `AgentTool` when needed.
7. Guardrails evaluate higher-impact actions before execution.
8. Guardrail review actions are queued in run-state and can be resolved with `/engagement review|approve|reject`.
9. Evidence entries, artifacts, and execution steps are appended during execution.
10. Reports are generated from the evidence chain.
11. Specialist memory persists under `.netrunner/memory/agents/` for later sessions.
12. Relevant-memory retrieval injects useful prior context from auto memory and engagement agent memory during future turns.
13. If the prompt explicitly `@agent` targets a specialist, retrieval narrows to that agent memory scope.

## Specialist agents

- `engagement-lead`
  - Coordinates the workflow and keeps execution inside scope.
- `recon-specialist`
  - Focuses on discovery, attack-surface mapping, and validation opportunities.
- `web-testing-specialist`
  - Focuses on HTTP and application behavior with evidence-backed validation.
- `api-testing-specialist`
  - Focuses on endpoint, auth, and state-transition testing for APIs.
- `network-testing-specialist`
  - Focuses on host/service/path validation in scoped infrastructure.
- `exploit-specialist`
  - Focuses on controlled proof-of-impact for confirmed weaknesses.
- `privilege-escalation-specialist`
  - Focuses on privilege-boundary testing in post-access phases.
- `lateral-movement-specialist`
  - Focuses on pivot-path and trust-boundary validation in multi-host targets.
- `ad-specialist`
  - Focuses on Active Directory, Kerberos, trust relationships, and domain attack-path validation.
- `retest-specialist`
  - Focuses on remediation verification and false-positive reduction.
- `evidence-specialist`
  - Focuses on artifact quality, traceability, and report-ready evidence.
- `reporting-specialist`
  - Focuses on final finding narratives and export-ready reporting.

## Capability packs

- `recon`
- `web`
- `api`
- `exploitation`
- `privilege-escalation`
- `lateral-movement`
- `exfiltration`
- `cloud`
- `binary`
- `network`
- `evidence`
- `reporting`
- `coordination`
- `lab-control`
- `active-directory`
- `wifi`
- `database`

Optional operator checks before deep execution:
- Run `/engagement capabilities [workflow]` to inspect missing local commands or env dependencies for a workflow.
- Run `/engagement alignment` to inspect the static agent/capability mapping in the current build.

Most workflows should rely first on skills plus direct tool execution. `lab-control` and similar integrations are available when the environment benefits from extra infrastructure, but they are not the default expression of framework logic.

If a workflow needs hosted support, check `docs/capabilities/service-surfaces.md` first. That file is the source of truth for which service-backed features are intentionally retained and which still need replacement or removal.
