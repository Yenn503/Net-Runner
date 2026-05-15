#!/usr/bin/env bash
#
# Net-Runner one-shot demo bootstrap.
#
# Runs the standard Linux bootstrap, ensures Docker is available, pulls and
# starts the OWASP Juice Shop container (locally tagged octorig-juiceshop),
# and seeds an authorized lab engagement under .netrunner/. After this
# completes the harness is one prompt away from attacking the lab — open
# the CLI and ask it to start a vulnerability assessment against
# http://localhost:3000.
#
# Usage:
#   bash scripts/setup-demo.sh
#   bash scripts/setup-demo.sh --port 3001            # alternate juice-shop port
#   bash scripts/setup-demo.sh --keep                  # leave existing container running
#   bash scripts/setup-demo.sh --teardown              # stop and remove the demo container, clear seeded engagement
#
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

CONTAINER_NAME="octorig-juiceshop"
JUICESHOP_IMAGE="bkimminich/juice-shop:latest"
JUICESHOP_PORT=3000
KEEP_RUNNING=0
TEARDOWN=0

while [ $# -gt 0 ]; do
  case "$1" in
    --port) JUICESHOP_PORT="$2"; shift 2 ;;
    --keep) KEEP_RUNNING=1; shift ;;
    --teardown) TEARDOWN=1; shift ;;
    -h|--help)
      sed -n '2,22p' "$0"
      exit 0
      ;;
    *) shift ;;
  esac
done

step() { printf '\n\033[1;36m== %s\033[0m\n' "$1"; }
ok()   { printf '   \033[32m✓\033[0m %s\n' "$1"; }
warn() { printf '   \033[33m!\033[0m %s\n' "$1"; }
fail() { printf '   \033[31m✗\033[0m %s\n' "$1" >&2; exit 1; }

have() { command -v "$1" >/dev/null 2>&1; }

need_sudo() {
  if [ "$(id -u)" -eq 0 ]; then
    "$@"
  else
    sudo "$@"
  fi
}

if [ "$TEARDOWN" -eq 1 ]; then
  step "Tearing down demo"
  if have docker && docker inspect "$CONTAINER_NAME" >/dev/null 2>&1; then
    docker rm -f "$CONTAINER_NAME" >/dev/null
    ok "Stopped and removed $CONTAINER_NAME"
  else
    warn "No demo container to remove"
  fi
  rm -f .netrunner/engagement.json .netrunner/run-state.json 2>/dev/null || true
  ok "Cleared seeded engagement (kept .netrunner/ directory intact)"
  exit 0
fi

step "Net-Runner Linux bootstrap"
bash "$REPO_ROOT/scripts/setup-linux.sh"

step "Docker"
if have docker; then
  ok "docker $(docker --version | awk '{print $3}' | tr -d ',')"
else
  warn "Docker not installed — installing via apt (requires sudo)"
  if have apt-get; then
    need_sudo apt-get install -y -qq docker.io >/dev/null
    need_sudo systemctl enable --now docker >/dev/null 2>&1 || true
    ok "docker.io installed"
  else
    fail "Docker missing and apt-get not available — install Docker manually then re-run"
  fi
fi

# Make sure the calling user can run docker without sudo for the rest of the
# session. If the daemon socket is unreadable, fall back to sudo for the
# container commands so the bootstrap still finishes cleanly.
DOCKER="docker"
if ! docker ps >/dev/null 2>&1; then
  if need_sudo docker ps >/dev/null 2>&1; then
    DOCKER="sudo docker"
    warn "Using sudo docker — add yourself to the docker group to skip the prompt:  sudo usermod -aG docker \$USER"
  else
    fail "docker ps failed even with sudo — check the daemon"
  fi
fi

step "Juice Shop container"
if $DOCKER inspect "$CONTAINER_NAME" >/dev/null 2>&1; then
  if [ "$KEEP_RUNNING" -eq 1 ]; then
    ok "Existing container kept (--keep)"
  else
    $DOCKER rm -f "$CONTAINER_NAME" >/dev/null
    ok "Removed stale $CONTAINER_NAME container"
  fi
fi

if ! $DOCKER inspect "$CONTAINER_NAME" >/dev/null 2>&1; then
  $DOCKER pull "$JUICESHOP_IMAGE" >/dev/null
  $DOCKER tag "$JUICESHOP_IMAGE" "$CONTAINER_NAME:demo"
  $DOCKER run -d \
    --name "$CONTAINER_NAME" \
    --restart unless-stopped \
    -p "${JUICESHOP_PORT}:3000" \
    "$CONTAINER_NAME:demo" >/dev/null
  ok "Started $CONTAINER_NAME on :${JUICESHOP_PORT}"
fi

# Wait for Juice Shop to actually start serving so the demo prompt does not
# race the container.
step "Waiting for Juice Shop to come up"
for i in $(seq 1 60); do
  if curl -sf -o /dev/null "http://localhost:${JUICESHOP_PORT}/"; then
    ok "Juice Shop responding at http://localhost:${JUICESHOP_PORT}"
    break
  fi
  if [ "$i" -eq 60 ]; then
    fail "Juice Shop did not respond after 60 seconds — check $DOCKER logs $CONTAINER_NAME"
  fi
  sleep 1
done

step "Seeding authorized lab engagement"
mkdir -p .netrunner
TARGET_URL="http://localhost:${JUICESHOP_PORT}"
TIMESTAMP="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

cat > .netrunner/engagement.json <<EOF
{
  "name": "octorig-juiceshop-demo",
  "workflowId": "web-app-testing",
  "createdAt": "${TIMESTAMP}",
  "targets": ["${TARGET_URL}"],
  "authorization": {
    "authorizedBy": "lab-demo",
    "status": "confirmed",
    "maxImpact": "unrestricted",
    "scopeSummary": "OWASP Juice Shop running locally for the Net-Runner demo. All actions on this target are pre-authorized.",
    "restrictions": []
  },
  "execution": {
    "defaultSkills": [
      "engagement-setup",
      "target-fingerprinting",
      "recon-plan",
      "vuln-assessment",
      "exploit-validation",
      "evidence-capture",
      "report-generation"
    ]
  }
}
EOF

cat > .netrunner/run-state.json <<EOF
{
  "workflowId": "web-app-testing",
  "phase": "engagement-setup",
  "currentSpecialist": "engagement-lead",
  "createdAt": "${TIMESTAMP}",
  "updatedAt": "${TIMESTAMP}"
}
EOF

ok "Seeded .netrunner/engagement.json (target: ${TARGET_URL})"

step "Demo ready"
cat <<EOF

   Lab:     ${TARGET_URL}
   Engagement: octorig-juiceshop-demo (web-app-testing, unrestricted impact)

   Launch the harness:
     bun run dev:profile

   First prompt:
     Run a full vulnerability assessment against the Juice Shop at ${TARGET_URL}.
     Cover authentication, injection, XSS, IDOR, sensitive data exposure, and business-logic flaws.

   Tear down later:
     bash scripts/setup-demo.sh --teardown

EOF
