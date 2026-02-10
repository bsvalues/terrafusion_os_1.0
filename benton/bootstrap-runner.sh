#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════════
# TerraFusion OS — Benton County Self-Hosted Runner Bootstrap
# ═══════════════════════════════════════════════════════════════════════════════
#
# One-command, idempotent provisioning for the Benton on-prem GitHub Actions
# runner. Run once on a fresh Ubuntu 22.04+ host; safe to re-run.
#
# Usage:
#   sudo ./bootstrap-runner.sh --token <GITHUB_RUNNER_TOKEN>
#
# Optional flags:
#   --user <username>     Runner service account (default: tf-runner)
#   --work-dir <path>     Runner working directory (default: /opt/actions-runner)
#   --proxy <url>         HTTP(S) proxy for outbound traffic (optional)
#   --runner-version <v>  Runner binary version (default: 2.321.0)
#   --dry-run             Print what would happen without making changes
#
# Generates a registration token:
#   gh api repos/bsvalues/terrafusion_os_1.0/actions/runners/registration-token \
#     --method POST --jq '.token'
#
# Source of truth: platform.json (runners.pilot.toolchain)
# ═══════════════════════════════════════════════════════════════════════════════
set -euo pipefail

# ─── Defaults (from platform.json) ───────────────────────────────────────────
REPO_URL="https://github.com/bsvalues/terrafusion_os_1.0"
RUNNER_LABELS="self-hosted,benton,linux-x64,no-docker"
RUNNER_USER="tf-runner"
WORK_DIR="/opt/actions-runner"
RUNNER_VERSION="2.321.0"
RUNNER_TOKEN=""
PROXY_URL=""
DRY_RUN=false

# Toolchain requirements (from platform.json → runners.pilot.toolchain)
REQUIRED_DOTNET="8.0"
REQUIRED_NODE="20"
REQUIRED_PNPM_MAJOR="9"
REQUIRED_GIT_MAJOR="2"
REQUIRED_GIT_MINOR="30"

# ─── Colors ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

ok()   { echo -e "  ${GREEN}✅${NC} $1"; }
warn() { echo -e "  ${YELLOW}⚠️${NC}  $1"; }
fail() { echo -e "  ${RED}❌${NC} $1"; }
info() { echo -e "  ${CYAN}ℹ${NC}  $1"; }

# ─── Parse arguments ────────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case "$1" in
    --token)        RUNNER_TOKEN="$2"; shift 2 ;;
    --user)         RUNNER_USER="$2"; shift 2 ;;
    --work-dir)     WORK_DIR="$2"; shift 2 ;;
    --proxy)        PROXY_URL="$2"; shift 2 ;;
    --runner-version) RUNNER_VERSION="$2"; shift 2 ;;
    --dry-run)      DRY_RUN=true; shift ;;
    -h|--help)
      echo "Usage: sudo $0 --token <GITHUB_RUNNER_TOKEN> [options]"
      echo ""
      echo "Options:"
      echo "  --token <token>       GitHub runner registration token (required)"
      echo "  --user <username>     Service account (default: tf-runner)"
      echo "  --work-dir <path>     Install directory (default: /opt/actions-runner)"
      echo "  --proxy <url>         HTTP(S) proxy URL"
      echo "  --runner-version <v>  Runner version (default: 2.321.0)"
      echo "  --dry-run             Print actions without executing"
      echo ""
      echo "Generate a token:"
      echo "  gh api repos/bsvalues/terrafusion_os_1.0/actions/runners/registration-token \\"
      echo "    --method POST --jq '.token'"
      exit 0
      ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

# ─── Validation ──────────────────────────────────────────────────────────────
if [[ -z "$RUNNER_TOKEN" ]]; then
  fail "Runner token is required. Use --token <TOKEN>"
  echo ""
  echo "Generate one with:"
  echo "  gh api repos/bsvalues/terrafusion_os_1.0/actions/runners/registration-token \\"
  echo "    --method POST --jq '.token'"
  exit 1
fi

if [[ "$EUID" -ne 0 ]] && [[ "$DRY_RUN" == false ]]; then
  fail "This script must be run as root (sudo). Use --dry-run for preview."
  exit 1
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  TerraFusion OS — Benton Runner Bootstrap"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "  Repo:       $REPO_URL"
echo "  Labels:     $RUNNER_LABELS"
echo "  User:       $RUNNER_USER"
echo "  Work dir:   $WORK_DIR"
echo "  Runner ver: $RUNNER_VERSION"
echo "  Proxy:      ${PROXY_URL:-none}"
echo "  Dry run:    $DRY_RUN"
echo ""

if [[ "$DRY_RUN" == true ]]; then
  info "DRY RUN — no changes will be made"
  echo ""
fi

# ═══════════════════════════════════════════════════════════════════════════════
# Phase 1: Toolchain Verification / Installation
# ═══════════════════════════════════════════════════════════════════════════════
echo "── Phase 1: Toolchain ──────────────────────────────────────────"

PHASE1_FAIL=0

# ─── dotnet ──────────────────────────────────────────────────────────────────
if command -v dotnet &>/dev/null; then
  DOTNET_VER=$(dotnet --version 2>/dev/null || echo "unknown")
  if [[ "$DOTNET_VER" == ${REQUIRED_DOTNET}.* ]]; then
    ok "dotnet $DOTNET_VER (required: ${REQUIRED_DOTNET}.x)"
  else
    fail "dotnet $DOTNET_VER does not match required ${REQUIRED_DOTNET}.x"
    PHASE1_FAIL=1
  fi
else
  warn "dotnet not found — installing dotnet-sdk-8.0..."
  if [[ "$DRY_RUN" == false ]]; then
    apt-get update -qq
    apt-get install -y -qq dotnet-sdk-8.0
    DOTNET_VER=$(dotnet --version)
    ok "dotnet $DOTNET_VER installed"
  else
    info "[dry-run] would run: apt-get install -y dotnet-sdk-8.0"
  fi
fi

# ─── node ────────────────────────────────────────────────────────────────────
if command -v node &>/dev/null; then
  NODE_VER=$(node --version)
  if [[ "$NODE_VER" == v${REQUIRED_NODE}.* ]]; then
    ok "node $NODE_VER (required: v${REQUIRED_NODE}.x)"
  else
    fail "node $NODE_VER does not match required v${REQUIRED_NODE}.x"
    PHASE1_FAIL=1
  fi
else
  warn "node not found — installing Node.js ${REQUIRED_NODE}..."
  if [[ "$DRY_RUN" == false ]]; then
    curl -fsSL "https://deb.nodesource.com/setup_${REQUIRED_NODE}.x" | bash -
    apt-get install -y -qq nodejs
    NODE_VER=$(node --version)
    ok "node $NODE_VER installed"
  else
    info "[dry-run] would run: NodeSource setup_${REQUIRED_NODE}.x + apt install nodejs"
  fi
fi

# ─── pnpm ────────────────────────────────────────────────────────────────────
if command -v pnpm &>/dev/null; then
  PNPM_VER=$(pnpm --version)
  PNPM_MAJOR=$(echo "$PNPM_VER" | cut -d. -f1)
  if [[ "$PNPM_MAJOR" -ge "$REQUIRED_PNPM_MAJOR" ]]; then
    ok "pnpm $PNPM_VER (required: >=${REQUIRED_PNPM_MAJOR}.0.0)"
  else
    fail "pnpm $PNPM_VER below required >=${REQUIRED_PNPM_MAJOR}.0.0"
    PHASE1_FAIL=1
  fi
else
  warn "pnpm not found — installing..."
  if [[ "$DRY_RUN" == false ]]; then
    npm install -g pnpm@latest
    PNPM_VER=$(pnpm --version)
    ok "pnpm $PNPM_VER installed"
  else
    info "[dry-run] would run: npm install -g pnpm@latest"
  fi
fi

# ─── git ─────────────────────────────────────────────────────────────────────
if command -v git &>/dev/null; then
  GIT_VER=$(git --version | awk '{print $3}')
  GIT_MAJOR=$(echo "$GIT_VER" | cut -d. -f1)
  GIT_MINOR=$(echo "$GIT_VER" | cut -d. -f2)
  if [[ "$GIT_MAJOR" -gt "$REQUIRED_GIT_MAJOR" ]] || \
     { [[ "$GIT_MAJOR" -eq "$REQUIRED_GIT_MAJOR" ]] && [[ "$GIT_MINOR" -ge "$REQUIRED_GIT_MINOR" ]]; }; then
    ok "git $GIT_VER (required: >=${REQUIRED_GIT_MAJOR}.${REQUIRED_GIT_MINOR}.0)"
  else
    fail "git $GIT_VER below required >=${REQUIRED_GIT_MAJOR}.${REQUIRED_GIT_MINOR}.0"
    PHASE1_FAIL=1
  fi
else
  fail "git not found (critical)"
  PHASE1_FAIL=1
fi

# ─── Docker (informational) ─────────────────────────────────────────────────
if command -v docker &>/dev/null; then
  DOCKER_VER=$(docker --version 2>/dev/null || echo "unknown")
  info "Docker found: $DOCKER_VER (not required for PR gates)"
else
  info "Docker not installed (not required — all 8 PR-gate jobs are pure compute)"
fi

if [[ "$PHASE1_FAIL" -ne 0 ]]; then
  echo ""
  fail "Toolchain verification failed. Fix issues above and re-run."
  exit 1
fi

echo ""

# ═══════════════════════════════════════════════════════════════════════════════
# Phase 2: Network Connectivity
# ═══════════════════════════════════════════════════════════════════════════════
echo "── Phase 2: Network ────────────────────────────────────────────"

ENDPOINTS=(
  "https://api.github.com/zen"
  "https://registry.npmjs.org/-/ping"
  "https://api.nuget.org/v3/index.json"
)

CURL_OPTS="--max-time 10 -sS -o /dev/null -w %{http_code}"
if [[ -n "$PROXY_URL" ]]; then
  CURL_OPTS="$CURL_OPTS --proxy $PROXY_URL"
fi

NET_FAIL=0
for url in "${ENDPOINTS[@]}"; do
  HOST=$(echo "$url" | sed 's|https://||' | cut -d/ -f1)
  HTTP_CODE=$(curl $CURL_OPTS "$url" 2>/dev/null || echo "000")
  if [[ "$HTTP_CODE" == "000" ]]; then
    fail "$HOST → unreachable (firewall? proxy? DNS?)"
    NET_FAIL=1
  else
    ok "$HOST → HTTP $HTTP_CODE"
  fi
done

if [[ "$NET_FAIL" -ne 0 ]]; then
  echo ""
  fail "Network connectivity check failed. Ensure firewall allows outbound HTTPS to:"
  echo "    github.com:443, *.github.com:443, *.githubusercontent.com:443"
  echo "    registry.npmjs.org:443, api.nuget.org:443"
  exit 1
fi

echo ""

# ═══════════════════════════════════════════════════════════════════════════════
# Phase 3: Service Account
# ═══════════════════════════════════════════════════════════════════════════════
echo "── Phase 3: Service Account ────────────────────────────────────"

if id "$RUNNER_USER" &>/dev/null; then
  ok "User '$RUNNER_USER' already exists"
else
  if [[ "$DRY_RUN" == false ]]; then
    useradd --system --create-home --shell /bin/bash "$RUNNER_USER"
    ok "Created system user '$RUNNER_USER'"
  else
    info "[dry-run] would create user: $RUNNER_USER"
  fi
fi

echo ""

# ═══════════════════════════════════════════════════════════════════════════════
# Phase 4: Runner Binary
# ═══════════════════════════════════════════════════════════════════════════════
echo "── Phase 4: Runner Binary ──────────────────────────────────────"

RUNNER_TARBALL="actions-runner-linux-x64-${RUNNER_VERSION}.tar.gz"
RUNNER_URL="https://github.com/actions/runner/releases/download/v${RUNNER_VERSION}/${RUNNER_TARBALL}"

# Fetch the SHA256 checksum from GitHub releases (canonical source)
get_expected_checksum() {
  local version="$1"
  local tarball="actions-runner-linux-x64-${version}.tar.gz"
  # GitHub publishes checksums in the release body; fall back to API hash
  local checksum_url="https://github.com/actions/runner/releases/download/v${version}/${tarball}.sha256"
  curl -fsSL "$checksum_url" 2>/dev/null | awk '{print $1}' || echo ""
}

if [[ -f "${WORK_DIR}/run.sh" ]]; then
  ok "Runner binary already installed at ${WORK_DIR}"
else
  if [[ "$DRY_RUN" == false ]]; then
    mkdir -p "$WORK_DIR"
    cd "$WORK_DIR"

    info "Downloading runner v${RUNNER_VERSION}..."
    curl -fsSL -o "$RUNNER_TARBALL" "$RUNNER_URL"

    # Verify download integrity (SHA256)
    ACTUAL_HASH=$(sha256sum "$RUNNER_TARBALL" | awk '{print $1}')
    EXPECTED_HASH=$(get_expected_checksum "$RUNNER_VERSION")
    if [[ -n "$EXPECTED_HASH" ]]; then
      if [[ "$ACTUAL_HASH" == "$EXPECTED_HASH" ]]; then
        ok "SHA256 verified: ${ACTUAL_HASH:0:16}..."
      else
        fail "SHA256 mismatch! Expected: ${EXPECTED_HASH:0:16}... Got: ${ACTUAL_HASH:0:16}..."
        fail "Download may be corrupted or tampered with. Aborting."
        rm -f "$RUNNER_TARBALL"
        exit 1
      fi
    else
      warn "SHA256 checksum not available for v${RUNNER_VERSION} — skipping verification"
      warn "Download integrity relies on HTTPS transport security only"
      info "Actual SHA256: $ACTUAL_HASH (record this for future pinning)"
    fi

    tar xzf "$RUNNER_TARBALL"
    rm -f "$RUNNER_TARBALL"

    chown -R "$RUNNER_USER:$RUNNER_USER" "$WORK_DIR"
    ok "Runner v${RUNNER_VERSION} installed to ${WORK_DIR}"
  else
    info "[dry-run] would download runner v${RUNNER_VERSION} to ${WORK_DIR}"
  fi
fi

echo ""

# ═══════════════════════════════════════════════════════════════════════════════
# Phase 5: Runner Registration
# ═══════════════════════════════════════════════════════════════════════════════
echo "── Phase 5: Registration ───────────────────────────────────────"

if [[ -f "${WORK_DIR}/.runner" ]]; then
  ok "Runner already registered (${WORK_DIR}/.runner exists)"
  info "To re-register, run: sudo -u $RUNNER_USER ${WORK_DIR}/config.sh remove && re-run this script"
else
  if [[ "$DRY_RUN" == false ]]; then
    cd "$WORK_DIR"

    # Set proxy environment if provided
    if [[ -n "$PROXY_URL" ]]; then
      export http_proxy="$PROXY_URL"
      export https_proxy="$PROXY_URL"
      export HTTP_PROXY="$PROXY_URL"
      export HTTPS_PROXY="$PROXY_URL"
      info "Proxy configured: $PROXY_URL"
    fi

    sudo -u "$RUNNER_USER" ./config.sh \
      --url "$REPO_URL" \
      --labels "$RUNNER_LABELS" \
      --token "$RUNNER_TOKEN" \
      --unattended \
      --replace

    ok "Runner registered with labels: $RUNNER_LABELS"
  else
    info "[dry-run] would register runner at $REPO_URL with labels: $RUNNER_LABELS"
  fi
fi

echo ""

# ═══════════════════════════════════════════════════════════════════════════════
# Phase 6: Systemd Service
# ═══════════════════════════════════════════════════════════════════════════════
echo "── Phase 6: Systemd Service ────────────────────────────────────"

SERVICE_NAME="tf-runner"
SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [[ -f "$SERVICE_FILE" ]]; then
  ok "Service unit ${SERVICE_NAME}.service already installed"
else
  if [[ "$DRY_RUN" == false ]]; then
    # Generate service file inline (self-contained, no external file dependency)
    cat > "$SERVICE_FILE" << UNIT
[Unit]
Description=TerraFusion GitHub Actions Runner (Benton County)
Documentation=https://github.com/bsvalues/terrafusion_os_1.0/blob/main/BENTON_ONPREM_PILOT.md
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=${RUNNER_USER}
Group=${RUNNER_USER}
WorkingDirectory=${WORK_DIR}
ExecStart=${WORK_DIR}/run.sh
Restart=on-failure
RestartSec=10
KillSignal=SIGTERM
TimeoutStopSec=30

# Security hardening
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=read-only
ReadWritePaths=${WORK_DIR}
PrivateTmp=true

# Cache directories (pnpm store, npm cache, NuGet cache)
# Required because ProtectHome=read-only blocks writes to ~tf-runner/
ReadWritePaths=/home/${RUNNER_USER}

# Environment
Environment=DOTNET_CLI_TELEMETRY_OPTOUT=1
Environment=DOTNET_NOLOGO=1
$(if [[ -n "$PROXY_URL" ]]; then
echo "Environment=http_proxy=${PROXY_URL}"
echo "Environment=https_proxy=${PROXY_URL}"
echo "Environment=HTTP_PROXY=${PROXY_URL}"
echo "Environment=HTTPS_PROXY=${PROXY_URL}"
fi)

[Install]
WantedBy=multi-user.target
UNIT

    systemctl daemon-reload
    systemctl enable "$SERVICE_NAME"
    ok "Service unit installed and enabled: ${SERVICE_NAME}.service"
  else
    info "[dry-run] would install systemd service: ${SERVICE_NAME}.service"
  fi
fi

echo ""

# ═══════════════════════════════════════════════════════════════════════════════
# Phase 7: Start & Verify
# ═══════════════════════════════════════════════════════════════════════════════
echo "── Phase 7: Start & Verify ─────────────────────────────────────"

if [[ "$DRY_RUN" == false ]]; then
  systemctl start "$SERVICE_NAME" 2>/dev/null || true
  sleep 3

  if systemctl is-active --quiet "$SERVICE_NAME"; then
    ok "Service ${SERVICE_NAME} is running"
  else
    fail "Service ${SERVICE_NAME} failed to start"
    echo ""
    echo "  Debug with:"
    echo "    journalctl -u ${SERVICE_NAME} -n 50 --no-pager"
    echo "    systemctl status ${SERVICE_NAME}"
    exit 1
  fi
else
  info "[dry-run] would start and verify ${SERVICE_NAME} service"
fi

echo ""

# ═══════════════════════════════════════════════════════════════════════════════
# Summary
# ═══════════════════════════════════════════════════════════════════════════════
echo "═══════════════════════════════════════════════════════════════"
echo "  Bootstrap Complete"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "  Runner should appear online at:"
echo "    ${REPO_URL}/settings/actions/runners"
echo ""
echo "  Next steps:"
echo "    1. Verify runner is 'Idle' in GitHub UI"
echo "    2. Trigger smoke: gh workflow run benton-runner-smoke.yml"
echo "    3. Enable routing: gh variable set BENTON_RUNNER --body true"
echo "    4. Open a docs-only PR to validate routing"
echo ""
echo "  Service management:"
echo "    systemctl status  ${SERVICE_NAME}"
echo "    systemctl restart ${SERVICE_NAME}"
echo "    systemctl stop    ${SERVICE_NAME}"
echo "    journalctl -u ${SERVICE_NAME} -f"
echo ""
echo "  Rollback (instant, no code change):"
echo "    gh variable delete BENTON_RUNNER"
echo ""
echo "  Government. Transcended."
echo ""
