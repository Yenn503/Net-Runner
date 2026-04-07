# Net-Runner Design

Date: 2026-04-02
Codebase: `Net-Runner`
Product name: `Net-Runner`

## Goal

Keep `Net-Runner` as a security-first agentic testing framework that preserves its core orchestration, MCP, skills, memory, and provider portability while orienting the default product around authorized security testing workflows. Where remote-session concepts exist in inherited code, they should be treated as optional or future-facing unless they are explicitly shipped and working in the OSS runtime.

The result should be an operator-grade framework for running structured testing engagements against authorized targets such as labs, CTFs, HTB environments, internal test systems, and customer-approved scopes. It must remain extensible enough to support broader workflows without hard-coding itself to a single benchmark or platform.

## Product Boundary

`Net-Runner` is not a generic coding CLI with a pentesting prompt layered on top. It is a security testing framework whose default behaviors, skills, workflows, terminology, and memory model are aligned to testing engagements.

It should:

- Preserve model portability across OpenAI-compatible providers and Codex-backed transports.
- Preserve the multi-agent orchestration model already present in Net-Runner.
- Preserve skills as the primary capability surface and MCP as a supporting integration surface.
- Preserve code execution as a first-class mechanism for creating and adapting testing workflows at runtime.
- Add security testing workflows, engagement state, artifacts, and reporting as core concepts.
- Add scope and authorization controls as first-class runtime policy, not just prompt guidance.

It should not:

- Depend on a single provider or model family.
- Ship as a pure external baseline clone.
- Optimize only for HTB or only for CTFs.
- Treat dangerous actions as ordinary shell activity without explicit scope and policy checks.

## Existing Implementation Foundations

The implementation will build on the existing Net-Runner runtime rather than replacing it.

Relevant existing foundations:

- Tool contract and tool execution context: `src/Tool.ts`
- Agent orchestration and worker lifecycle: `src/tools/AgentTool/*`
- Shell, file, search, and web capabilities: `src/tools/*`
- Skill loading and bundled skill infrastructure: `src/skills/*`
- MCP auth and transport integration: `src/services/mcp/*`
- Local-first session/runtime management, plus inherited experimental remote-session surfaces in `src/main.tsx` and related modules
- Session memory and background consolidation: `src/services/SessionMemory/*`, `src/services/autoDream/*`, `src/services/teamMemorySync/*`
- Provider transport abstraction and Codex/OpenAI shims: `src/services/api/*`

These pieces are already strong enough to support a security-first product if the system identity and workflow layer are replaced in a coherent way.

## Core Design

`Net-Runner` should be organized around five layers.

### 1. Runtime Layer

This layer is inherited from Net-Runner and remains the execution backbone.

Responsibilities:

- Conversation loop and model invocation
- Tool schema and tool execution
- Agent spawning, continuation, and stop controls
- MCP connection and tool exposure
- Session state and resumability, with local-first transport as the default supported OSS path
- Provider portability

This layer should be changed only where required for renaming, packaging, policy hooks, workflow registration, and security-specific defaults.

### 2. Security Workflow Layer

This is the new product-defining layer. It maps operator goals into structured workflows and specialist agents.

Initial workflow families:

- Web application testing
- API testing
- HTB and lab target testing
- CTF workflow mode
- Recon and asset profiling
- Validation and retesting
- Evidence-backed reporting

Each workflow should define:

- Entry conditions
- Required scope and authorization metadata
- Specialist subagents to spawn
- Expected artifacts
- Stopping conditions
- Reporting outputs

### 3. Capability Layer

Tools, skills, and selected MCP-backed integrations should be grouped into operator-facing capability packs rather than presented as an undifferentiated tool pile.

Initial capability packs:

- `recon`
- `web`
- `api`
- `cloud`
- `binary`
- `network`
- `reporting`
- `lab-control`
- `evidence`
- `coordination`

Each capability pack should describe:

- What problems it is for
- Which skills, tools, and optional MCP integrations it exposes
- What preconditions or approvals it needs
- Which workflows depend on it

### 4. Policy Layer

The current permission and shell safety system should be extended into engagement policy.

Policy concepts:

- Authorized target scope
- Allowed target types
- Engagement mode
  - `lab`
  - `customer-authorized`
  - `research`
- Dangerous action classes
- Explicit approval requirements
- Allowed credential sources
- Artifact retention rules
- Audit logging

Policy must gate tool execution and workflow transitions where appropriate. This should be enforced in runtime state and tool checks, not only inside prompts.

### 5. Memory and Knowledge Layer

The current memory services should be repurposed around security engagements.

Memory domains:

- Engagement profile
- Target profile
- Findings ledger
- Evidence index
- Credentials and secrets references
- Workflow history
- Operator preferences
- Reusable playbooks

The memory model must support both short-lived lab sessions and long-running engagements while keeping sensitive material separable from general session summaries.

## Default User Experience

The default `Net-Runner` experience should feel like starting a testing engagement rather than opening a generic assistant shell or an MCP console.

At a minimum, startup should orient around:

- active engagement identity
- target scope
- workflow selection
- capability packs and bundled skills available
- required approvals or missing prerequisites

The terminology across commands, system prompt, help text, and documentation should reflect the product shift from "open model coding agent" to "security testing framework".

## Agent Model

The current agentic orchestration should be kept and specialized instead of replaced.

`Net-Runner` should define specialist roles aligned to security workflows. Initial roles:

- Engagement lead
- Recon specialist
- Web testing specialist
- API testing specialist
- Validation and retest specialist
- Evidence curator
- Reporting specialist
- Lab/CTF specialist

The engagement lead remains the primary coordinator and delegates concrete tasks to specialists. Delegation rules should follow the existing worker model:

- prompts must be self-contained
- workers must receive exact scope and constraints
- results must come back as artifacts plus concise findings
- follow-up prompts must be grounded in returned evidence

## Skills Strategy

Skills are one of the strongest existing surfaces and should become the primary differentiator.

Changes required:

- replace generic bundled defaults with security workflow defaults
- add bundled security skills for common testing phases
- support project-local or engagement-local skills
- support MCP-derived skills for specialized environments
- make skill invocation part of workflow orchestration rather than an ad hoc extra
- bias workflow design toward skills plus code execution before introducing new MCP dependencies
- ensure specialist agents rely on skills and shell/file/web tooling even when MCP is unavailable

Initial bundled skill families:

- engagement setup
- recon planning
- web validation
- API validation
- evidence capture
- report drafting
- scope enforcement
- retest workflow
- lab/CTF mode

The framework should encourage skills to encode repeatable methodology rather than one-off prompts.
MCP should only fill gaps where a stable external interface or provider-built capability is genuinely better than skill-driven orchestration.

## MCP Strategy

MCP remains important, but it is not the center of the product. In `Net-Runner`, MCP should be framed as capability extension for testing workflows, not the default way to express framework logic.

Requirements:

- keep existing server connection and auth flows
- surface MCP tools through capability packs as optional or infrastructure-level extensions
- attach policy metadata to MCP-backed actions where possible
- support environment-specific MCP servers for lab control, proxying, evidence stores, ticketing, or reporting pipelines
- prefer built-in tools, skills, and runtime code execution for methodology and workflow behavior
- reserve MCP for provider APIs, external systems, and integrations that are materially better handled through a typed protocol

The operator should be able to understand which MCP servers are connected, which workflows they augment, and whether they are required or optional for the current engagement.
No core workflow should require an MCP-heavy setup when the same outcome can be achieved through built-in tools and skill-guided execution.

## Provider Strategy

The Net-Runner provider model is already valuable and should remain intact.

Requirements:

- keep OpenAI-compatible transport support
- keep Codex-backed transport support
- preserve local-model compatibility where current code allows it
- allow workflow or agent role defaults to recommend models without hard-binding the product to one vendor

This keeps `Net-Runner` usable across local-first and provider-backed setups without requiring hosted Net-Runner infrastructure.

## Reporting and Artifacts

`Net-Runner` must treat findings and evidence as primary outputs.

Required artifact classes:

- command outputs
- HTTP captures or request summaries
- screenshots or terminal captures where relevant
- files collected during testing
- structured finding drafts
- final report outputs

Required reporting outputs:

- session summary
- findings ledger
- evidence index
- retest summary
- exportable engagement report

Artifacts should be linked back to workflows and target context instead of remaining buried inside unstructured chat history.

## Security and Safety Defaults

Because this product is security-focused, the default behavior must be conservative with dangerous actions even when the engagement is authorized.

Required defaults:

- explicit engagement scope before high-risk workflows
- stronger review gates for destructive or potentially disruptive actions
- clear separation between exploration, validation, and high-impact actions
- audit trail of key actions and approvals
- configurable but visible safety mode

This design supports legitimate testing while reducing accidental misuse and operator ambiguity.

## Rename and Packaging

The codebase and operator surface need a coherent rename from Net-Runner to Net-Runner.

Rename scope:

- package metadata
- binary name
- help text
- onboarding copy
- command descriptions
- branding in generated outputs where currently Net-Runner-specific
- docs and examples

The rename should be coherent enough that the product no longer feels like a renamed fork with old product language leaking through normal use.

## Implementation Milestones

The work should be delivered in phases, but all phases belong to one product conversion.

### Milestone 1: Product Conversion Foundation

- rename package and CLI surface to `Net-Runner`
- replace default system identity and help text
- introduce security-first product copy and onboarding
- add engagement/session metadata model
- add security workflow registry and specialist agent definitions
- add initial bundled security skills
- add documentation structure for workflows and capabilities

### Milestone 2: Policy, Artifacts, and Workflow Execution

- extend permission model into engagement policy
- add scope and authorization state
- add artifact and evidence storage model
- add workflow-aware reporting outputs
- add initial web testing and lab/HTB workflow implementations

### Milestone 3: Operator Hardening

- improve tracing and run visibility for workflow execution
- strengthen audit trail and approval surfaces
- improve memory separation for findings, evidence, and session notes
- align MCP and skill UX to capability packs
- finish documentation and examples

## Out of Scope for the First Planning Pass

To keep the plan buildable, the first implementation plan should not require:

- full parity with every external framework feature on day one
- broad GUI redesign
- every specialized security workflow category
- provider-specific optimization beyond preserving current abstraction
- unsupported claims of autonomous end-to-end testing without human oversight

## Success Criteria

The conversion is successful when:

- the product is consistently branded as `Net-Runner`
- the default runtime behavior is clearly security-testing oriented
- workflows, skills, and agents align to testing engagements
- skills and code execution are the primary extension and execution model
- MCP is used selectively for integrations and provider-built capabilities rather than as the main framework abstraction
- scope and authorization are represented in runtime state
- artifacts and reports are first-class outputs
- existing orchestration, MCP, memory, and provider portability remain functional
- the codebase documentation matches the implemented product direction

## Planning Notes

The implementation plan should target the `research/net-runner` repository directly. It should favor adapting existing modules over building duplicate infrastructure.

The first plan should be explicit about file ownership and avoid sweeping rewrites where targeted changes to prompts, onboarding, skills, workflow registration, and session state are sufficient.
