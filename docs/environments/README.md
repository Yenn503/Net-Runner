# Execution Environments

Net-Runner work runs in different places depending on what is being done.
Rather than one mixed runtime, the harness recognises distinct **execution
environments** — each with its own isolation, network, and privilege profile.
Arsenal entries (`.netrunner/arsenal/index/*.yaml`) and MCP packs
(`src/mcp/optionalPacks.ts`) declare which environment they belong to, and the
exploit specialists pick the right one before running anything.

## Profiles

| Profile | OS | Isolation | Network | Use for |
|---|---|---|---|---|
| `kali-operator` | Kali Linux | operator host | reaches in-scope targets | Recon, scanning, exploitation launch, web/AD/network tooling. The default operator box. |
| `windows-operator` | Windows | operator host | reaches in-scope targets | Windows-native tradecraft — AD tooling, .NET, tools with no Linux build. |
| `vm-isolated` | any | disposable VM, snapshot/rollback | host-only or none | Detonating **untrusted PoCs and malware** — never on the operator host. Reverse engineering of hostile samples. |
| `sandbox-container` | Linux container | container | egress-limited | SAST / dependency / IaC / container scanners — repeatable, dependency-isolated. |
| `headless-mcp-worker` | Linux | host or container, no GUI | as configured | The harness driven over MCP from an IDE — no desktop, no interactive prompts. |
| `linux-target` / `windows-target` | target's OS | the target itself | n/a | Post-exploitation actions that run **on the engagement target**, not operator-controlled. |
| `network` | n/a | n/a | network path to target | Remote, pre-auth exploitation against a service over the wire. |

## Rules

- **Untrusted code runs in `vm-isolated`.** A public PoC, an unknown binary, or
  a hostile sample is detonated in a disposable VM with snapshot/rollback —
  never on `kali-operator` or `windows-operator`. The `cve-intelligence-lookup`
  skill enforces this.
- **`nr_exec` currently runs on the operator host.** Until a container/VM
  execution adapter lands, treat every `nr_exec` call as `kali-operator` /
  `windows-operator` and do not run untrusted payloads through it. This is a
  known limitation tracked in the project docs.
- **Match the tool to the environment.** Scanners belong in
  `sandbox-container`; AD tradecraft in `windows-operator` or `network`;
  binary detonation in `vm-isolated`.
- **Declare the environment.** New arsenal entries set `execution_environment`;
  new MCP packs set `environment`. Tools added via `~/.netrunner/tools.yaml`
  should note their environment in the `agents`/notes metadata.

## Setting up the isolated VM

For `vm-isolated` work, run a disposable analysis VM (VirtualBox / VMware /
QEMU / Hyper-V) with:

- a clean snapshot to roll back to after every detonation,
- host-only or no networking,
- no shared folders to the operator host,
- the OS matching the sample under analysis.

Revert to the clean snapshot between samples.
