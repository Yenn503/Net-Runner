#!/usr/bin/env bash
#
# Net-Runner custom-tool installer.
#
# Installs the red-team tooling each specialist agent references but that
# is not already on the host. Idempotent — re-running skips already-present
# binaries. Use after `scripts/setup-linux.sh`.
#
# Groups:
#   apt    — distro packages (Kali / Debian / Ubuntu)
#   pipx   — Python CLIs in isolated envs
#   go     — go-installable tools
#   gh     — GitHub release binaries (grype, trivy, etc.)
#
# Usage:
#   bash scripts/install-tools.sh             # install everything missing
#   bash scripts/install-tools.sh --apt-only  # just apt batch
#   bash scripts/install-tools.sh --check     # report missing, install nothing
#
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

MODE="all"
for arg in "$@"; do
  case "$arg" in
    --apt-only)  MODE="apt" ;;
    --pipx-only) MODE="pipx" ;;
    --go-only)   MODE="go" ;;
    --gh-only)   MODE="gh" ;;
    --check)     MODE="check" ;;
    -h|--help)   sed -n '2,22p' "$0"; exit 0 ;;
  esac
done

step()  { printf '\n\033[1;36m== %s\033[0m\n' "$1"; }
ok()    { printf '   \033[32m✓\033[0m %s\n' "$1"; }
warn()  { printf '   \033[33m!\033[0m %s\n' "$1"; }
skip()  { printf '   \033[2m·\033[0m %s already present\n' "$1"; }

have()  { command -v "$1" >/dev/null 2>&1; }

need_sudo() {
  if [ "$(id -u)" -eq 0 ]; then "$@"; else sudo "$@"; fi
}

# ---- apt batch -----------------------------------------------------------
APT_PKGS=(
  jadx apktool yara sleuthkit volatility3 chisel
  golang-go
  python3-pip python3-venv pipx
)
# ghidra ships with Kali; install if missing on Debian/Ubuntu
APT_OPTIONAL=(ghidra bloodhound)

install_apt() {
  step "apt packages"
  if ! have apt-get; then warn "apt-get not found — skipping"; return; fi
  need_sudo apt-get update -qq
  local to_install=()
  for p in "${APT_PKGS[@]}" "${APT_OPTIONAL[@]}"; do
    if dpkg -s "$p" >/dev/null 2>&1; then skip "$p"; else to_install+=("$p"); fi
  done
  if [ ${#to_install[@]} -gt 0 ]; then
    need_sudo apt-get install -y -qq "${to_install[@]}" || warn "Some apt packages failed; continuing"
    ok "apt batch done"
  else
    ok "All apt packages present"
  fi
}

# ---- pipx batch ----------------------------------------------------------
PIPX_PKGS=(
  maigret holehe ghunt certipy-ad pacu frida-tools objection
  arjun apkleaks pwntools semgrep checkov bbot
)

install_pipx() {
  step "pipx Python tools"
  if ! have pipx; then
    if have python3; then python3 -m pip install --user -q pipx && python3 -m pipx ensurepath || warn "pipx bootstrap failed"
    else warn "python3 not found — skipping pipx batch"; return
    fi
  fi
  export PATH="$HOME/.local/bin:$PATH"
  for p in "${PIPX_PKGS[@]}"; do
    if pipx list 2>/dev/null | grep -q "package $p "; then skip "$p"
    else pipx install -q "$p" 2>/dev/null && ok "$p" || warn "pipx install $p failed"
    fi
  done
}

# ---- go install batch ----------------------------------------------------
GO_PKGS=(
  "github.com/projectdiscovery/subfinder/v2/cmd/subfinder@latest"
  "github.com/projectdiscovery/nuclei/v3/cmd/nuclei@latest"
  "github.com/hahwul/dalfox/v2@latest"
  "github.com/gitleaks/gitleaks/v8@latest"
  "github.com/BishopFox/cloudfox@latest"
  "github.com/inguardians/peirates/cmd/peirates@latest"
)

install_go() {
  step "go-installable tools"
  if ! have go; then warn "go not installed (install via apt golang-go first) — skipping"; return; fi
  export PATH="$HOME/go/bin:$PATH"
  for pkg in "${GO_PKGS[@]}"; do
    local bin="${pkg##*/}"; bin="${bin%@*}"; bin="${bin%/*}"
    if have "$bin"; then skip "$bin"
    else go install "$pkg" 2>/dev/null && ok "$bin" || warn "go install $pkg failed"
    fi
  done
}

# ---- github release batch -----------------------------------------------
install_gh_release() {
  local name=$1 url=$2
  if have "$name"; then skip "$name"; return; fi
  local tmp; tmp=$(mktemp -d)
  curl -sSL -o "$tmp/dl" "$url" || { warn "download $name failed"; return; }
  case "$url" in
    *.tar.gz|*.tgz) tar -xzf "$tmp/dl" -C "$tmp" ;;
    *.zip)          unzip -q "$tmp/dl" -d "$tmp" ;;
    *)              mv "$tmp/dl" "$tmp/$name" ;;
  esac
  local found; found=$(find "$tmp" -type f -name "$name" -perm -u+x | head -1)
  [ -n "$found" ] || found=$(find "$tmp" -type f -name "$name" | head -1)
  if [ -n "$found" ]; then
    chmod +x "$found"
    need_sudo install -m 0755 "$found" /usr/local/bin/"$name"
    ok "$name"
  else
    warn "Could not find $name binary in archive"
  fi
  rm -rf "$tmp"
}

install_gh() {
  step "GitHub release binaries"
  local arch; arch=$(uname -m)
  [ "$arch" = "x86_64" ] || { warn "Non-amd64 host ($arch) — skipping release binaries"; return; }
  install_gh_release grype  "https://github.com/anchore/grype/releases/latest/download/grype_linux_amd64.tar.gz"
  install_gh_release trivy  "https://github.com/aquasecurity/trivy/releases/latest/download/trivy_Linux-64bit.tar.gz"
  install_gh_release chainsaw "https://github.com/WithSecureLabs/chainsaw/releases/latest/download/chainsaw_x86_64-unknown-linux-gnu.tar.gz"
}

# ---- check-only mode -----------------------------------------------------
if [ "$MODE" = "check" ]; then
  exec bash "$REPO_ROOT/scripts/check-tools.sh"
fi

step "Net-Runner tool installer"
ok "Mode: $MODE"

case "$MODE" in
  all)  install_apt; install_pipx; install_go; install_gh ;;
  apt)  install_apt ;;
  pipx) install_pipx ;;
  go)   install_go ;;
  gh)   install_gh ;;
esac

step "Done"
ok "Re-run with --check to verify coverage"
