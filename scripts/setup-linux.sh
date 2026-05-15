#!/usr/bin/env bash
#
# Net-Runner Linux bootstrap.
#
# Installs the toolchain (bun, node, build deps), installs dependencies,
# builds the dist bundle, and points the user at the interactive provider
# setup. Designed for a clean Debian / Ubuntu / Kali VM but should run on
# any apt-based distro. Idempotent — re-running is safe.
#
# Usage:
#   bash scripts/setup-linux.sh           # full bootstrap, prompts for sudo
#   bash scripts/setup-linux.sh --no-build  # skip the production build step
#
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

SKIP_BUILD=0
for arg in "$@"; do
  case "$arg" in
    --no-build) SKIP_BUILD=1 ;;
    -h|--help)
      sed -n '2,20p' "$0"
      exit 0
      ;;
  esac
done

step() { printf '\n\033[1;36m== %s\033[0m\n' "$1"; }
ok()   { printf '   \033[32m✓\033[0m %s\n' "$1"; }
warn() { printf '   \033[33m!\033[0m %s\n' "$1"; }

have() { command -v "$1" >/dev/null 2>&1; }

need_sudo() {
  if [ "$(id -u)" -eq 0 ]; then
    "$@"
  else
    sudo "$@"
  fi
}

step "Detecting environment"
. /etc/os-release 2>/dev/null || true
DISTRO="${ID:-unknown}"
ok "Distro: ${PRETTY_NAME:-$DISTRO}"
ok "Repo:   $REPO_ROOT"

step "System packages"
if have apt-get; then
  need_sudo apt-get update -qq
  need_sudo apt-get install -y -qq \
    curl ca-certificates git build-essential unzip \
    >/dev/null
  ok "apt packages installed"
else
  warn "apt-get not found — install curl, git, build-essential manually for your distro"
fi

step "Node.js (>= 20)"
if have node && [ "$(node -v | sed 's/v//' | cut -d. -f1)" -ge 20 ]; then
  ok "node $(node -v)"
else
  curl -fsSL https://deb.nodesource.com/setup_22.x | need_sudo bash - >/dev/null
  need_sudo apt-get install -y -qq nodejs >/dev/null
  ok "node $(node -v) installed"
fi

step "Bun runtime"
if have bun; then
  ok "bun $(bun --version)"
else
  curl -fsSL https://bun.sh/install | bash >/dev/null
  export BUN_INSTALL="${BUN_INSTALL:-$HOME/.bun}"
  export PATH="$BUN_INSTALL/bin:$PATH"
  if have bun; then
    ok "bun $(bun --version) installed"
    warn "Add \$HOME/.bun/bin to your PATH for future shells (~/.bashrc or ~/.zshrc)"
  else
    warn "Bun install did not land on PATH — restart your shell and re-run"
    exit 1
  fi
fi

step "Project dependencies"
bun install --frozen-lockfile
ok "node_modules ready"

if [ "$SKIP_BUILD" -eq 0 ]; then
  step "Production build"
  bun run build
  ok "dist/cli.mjs built"
fi

step "Profile"
if [ -f ".net-runner-profile.json" ]; then
  ok "Existing provider profile detected — keeping it"
else
  warn "No provider profile yet"
  cat <<'EOF'

   Next step:
     bun run setup        # interactive provider picker (Copilot, OpenAI, Gemini, Ollama, ...)

   Or directly launch with any saved profile:
     bun run dev:profile
EOF
fi

step "Custom red-team tooling"
warn "Net-Runner's specialist agents reference ~60 tools."
cat <<'EOF'

   Check what's missing on this host:
     bash scripts/install-tools.sh --check

   Install everything missing (apt + pipx + go + GitHub releases):
     bash scripts/install-tools.sh

   Or by group:
     bash scripts/install-tools.sh --apt-only
     bash scripts/install-tools.sh --pipx-only
     bash scripts/install-tools.sh --go-only
     bash scripts/install-tools.sh --gh-only
EOF

step "Optional MCP packs"
cat <<'EOF'

   Enable reverse-engineering / web-proxy MCP servers (Ghidra, Binary Ninja,
   Burp) — the harness preloads them on every launch once enabled:
     bun run mcp:packs                # list
     bun run mcp:packs enable <id>    # e.g. ghidra-mcp
EOF

step "Done"
ok "Net-Runner is ready on this host"
