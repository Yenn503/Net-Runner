# Research Alignment

This document explains how the current `Net-Runner` build aligns with the original proposal, the later progress/risk document, and the current implementation direction for the final-year project.

## What the project is now

`Net-Runner` is the current implementation artefact for a final-year university project focused on AI-assisted red-team workflows.

The project direction is now:

- modular
- skills-first
- evidence-aware
- specialist-agent driven
- selective with MCP instead of depending on it by default

That still fits the original goal. The goal was never "use as much MCP as possible". The goal was to build a stronger AI red-team framework with better reasoning, less bloat, and cleaner execution.

## Why the project changed more than once

The AI tooling space moved quickly during development, so the implementation changed as the research and experimentation matured.

That change path is:

1. **Original proposal phase**
   The proposal focused on a modular AI-driven red-team framework with containerised execution and stronger MCP-compatible code execution.
2. **Interim platform phase**
   Later work explored building on top of another agent platform so the project could benefit from existing orchestration, memory, and extension systems rather than rebuilding everything from scratch.
3. **Current Net-Runner phase**
   The current implementation keeps the same core research idea but aligns it around skills, direct tool execution, runtime structure, and selective MCP use where it is genuinely useful.

This is not a contradiction. It is the project becoming more accurate about what actually works best in practice.

## What stayed the same

Across the proposal, the change/risk write-up, and the current repository, the same core themes stayed consistent:

- reduce architectural bloat
- improve maintainability
- keep workflows modular
- support red-team style specialist roles
- capture evidence and reporting cleanly
- evaluate how architecture affects agent reliability

Those are the stable research foundations of the project.

## What changed technically

The biggest change is architectural emphasis.

### Earlier emphasis

- more MCP-centric thinking
- more focus on wrapped tool surfaces
- more platform-building around protocol layers

### Current emphasis

- skills-first workflow encoding
- direct use of built-in shell, file, web, and code execution surfaces
- specialist agents for scoped work
- MCP for external integrations and typed boundaries only when it adds real value

This change makes the project closer to the original intention of being modular and less bloated.

## How to explain the pivot in the final report

The cleanest way to explain it is:

1. The original proposal identified real problems in AI red-team frameworks: tool bloat, weak modularity, reasoning drift, and execution overhead.
2. Implementation work and further research showed that large MCP-heavy estates do not automatically improve agent quality.
3. Newer agent runtimes showed that reusable skills plus strong execution surfaces can solve a large part of the same problem with less architectural drag.
4. The project therefore refined its implementation approach while keeping the same core research question.

That turns the project evolution into a strength instead of a weakness.

## Skills-first position

The current `Net-Runner` position is:

- skills should hold methodology
- direct tool execution should handle most assessment work
- specialist agents should be used when task boundaries are clear
- MCP should stay available, but it should not be the default expression of framework behavior

This is the best-fit version of the original idea in the current AI tooling landscape.

## Scope and ethics

The project should continue to be framed as:

- for authorized targets only
- for lab, educational, and approved testing environments
- focused on runtime design, evidence handling, and workflow orchestration
- not intended as an uncontrolled offensive platform

That scope keeps the project academically defensible.

## Documentation rule

The repository docs should reflect the project honestly:

- this is a research prototype
- this version aligns with the original idea more cleanly than the earlier pivots
- the architecture changed because the evidence changed
- the current runtime is skills-first, not MCP-first
