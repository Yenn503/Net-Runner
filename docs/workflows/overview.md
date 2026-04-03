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

## Runtime flow

1. Start with a plain-language assessment instruction that includes a target.
2. Net-Runner auto-initializes `.netrunner/engagement.json` if needed.
3. Auto-init starts in safe mode (`authorization=unconfirmed`, `maxImpact=read-only`).
4. Confirm authorization in normal chat (no slash command required) to unlock the intended impact boundary.
5. The runtime injects engagement context into model turns (scope, status, restrictions, impact).
6. Specialist agents execute scoped tasks and return outputs to the main thread.
7. Guardrails evaluate higher-impact actions before execution.
8. Evidence entries and artifacts are appended during execution.
9. Reports are generated from the evidence chain.
10. Specialist memory persists under `.netrunner/memory/agents/` for later sessions.

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
- `network`
- `evidence`
- `reporting`
- `coordination`
- `lab-control`

Before deep execution, run `/engagement capabilities` to verify workflow readiness and missing dependencies.
Run `/engagement alignment` to confirm specialist-agent capability coverage remains coherent across workflows.

Most workflows should rely first on skills plus direct tool execution. `lab-control` and similar integrations are available when the environment benefits from extra infrastructure, but they are not the default expression of framework logic.
