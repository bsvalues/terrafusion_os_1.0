#!/usr/bin/env bash
set -euo pipefail

# Gate A: Preflight
# Environment checks for TerraFusion OS toolchain.
# Checks: git, bash, dotnet, node, npm/pnpm, docker, pwsh
# Validates minimum versions where applicable.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ARTIFACTS_DIR="$ROOT_DIR/artifacts"
LOG_FILE="$ARTIFACTS_DIR/logs/gate-a-preflight.log"

mkdir -p "$ARTIFACTS_DIR/logs"

# Minimum version requirements
MIN_DOTNET_MAJOR=8
MIN_NODE_MAJOR=18
MIN_PNPM_MAJOR=8

ERRORS=0
WARNINGS=0

log() {
  local msg="[Gate A - $(date -Iseconds)] $*"
  echo "$msg"
  echo "$msg" >> "$LOG_FILE"
}

log_ok() {
  log "✅ $*"
}

log_warn() {
  log "⚠️  WARN: $*"
  ((WARNINGS++)) || true
}

log_error() {
  log "❌ ERROR: $*"
  ((ERRORS++)) || true
}

require_cmd() {
  local cmd="$1"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    log_error "Required command not found: $cmd"
    return 1
  fi
  log_ok "Found '$cmd' at $(command -v "$cmd")"
  return 0
}

check_version_gte() {
  local actual="$1"
  local required="$2"
  # Extract major version number
  local actual_major
  actual_major=$(echo "$actual" | grep -oE '^[0-9]+' | head -1)
  if [[ -z "$actual_major" ]]; then
    return 1
  fi
  if (( actual_major >= required )); then
    return 0
  fi
  return 1
}

log "════════════════════════════════════════════════════════════════"
log "Starting Gate A: Preflight checks for TerraFusion OS"
log "════════════════════════════════════════════════════════════════"

# --- System Info ---
log ""
log "--- System Information ---"
log "System: $(uname -a || echo 'unknown')"
log "Shell: $SHELL"
log "User: $(whoami || echo 'unknown')"
log "PWD: $(pwd)"

if command -v nproc >/dev/null 2>&1; then
  log "CPUs: $(nproc)"
elif [[ "$OSTYPE" == "darwin"* ]]; then
  log "CPUs: $(sysctl -n hw.ncpu 2>/dev/null || echo 'unknown')"
fi

# Check available memory (best effort)
if command -v free >/dev/null 2>&1; then
  log "Memory: $(free -h 2>/dev/null | grep Mem | awk '{print $2}' || echo 'unknown')"
fi

# --- Required Tools ---
log ""
log "--- Required Tools ---"
require_cmd git || true
require_cmd bash || true

# --- .NET SDK ---
log ""
log "--- .NET SDK ---"
if command -v dotnet >/dev/null 2>&1; then
  DOTNET_VERSION=$(dotnet --version 2>/dev/null || echo "unknown")
  log_ok "dotnet version: $DOTNET_VERSION"
  if check_version_gte "$DOTNET_VERSION" "$MIN_DOTNET_MAJOR"; then
    log_ok "dotnet meets minimum version requirement (>= $MIN_DOTNET_MAJOR)"
  else
    log_error "dotnet version $DOTNET_VERSION is below minimum required ($MIN_DOTNET_MAJOR.x)"
  fi
else
  log_warn "dotnet not found. Required for backend builds."
fi

# --- Node.js ---
log ""
log "--- Node.js ---"
if command -v node >/dev/null 2>&1; then
  NODE_VERSION=$(node --version 2>/dev/null | tr -d 'v' || echo "unknown")
  log_ok "node version: $NODE_VERSION"
  if check_version_gte "$NODE_VERSION" "$MIN_NODE_MAJOR"; then
    log_ok "node meets minimum version requirement (>= $MIN_NODE_MAJOR)"
  else
    log_error "node version $NODE_VERSION is below minimum required ($MIN_NODE_MAJOR.x)"
  fi
else
  log_warn "node not found. Required for frontend builds."
fi

# --- Package Managers (npm/pnpm) ---
log ""
log "--- Package Managers ---"
if command -v pnpm >/dev/null 2>&1; then
  PNPM_VERSION=$(pnpm --version 2>/dev/null || echo "unknown")
  log_ok "pnpm version: $PNPM_VERSION (preferred)"
  if check_version_gte "$PNPM_VERSION" "$MIN_PNPM_MAJOR"; then
    log_ok "pnpm meets minimum version requirement (>= $MIN_PNPM_MAJOR)"
  else
    log_warn "pnpm version $PNPM_VERSION is below recommended ($MIN_PNPM_MAJOR.x)"
  fi
elif command -v npm >/dev/null 2>&1; then
  NPM_VERSION=$(npm --version 2>/dev/null || echo "unknown")
  log_ok "npm version: $NPM_VERSION"
  log_warn "pnpm not found. Consider installing: npm i -g pnpm"
else
  log_warn "No package manager (npm/pnpm) found."
fi

# --- PowerShell (pwsh) ---
log ""
log "--- PowerShell ---"
if command -v pwsh >/dev/null 2>&1; then
  PWSH_VERSION=$(pwsh -NoProfile -Command '$PSVersionTable.PSVersion.ToString()' 2>/dev/null || echo "unknown")
  log_ok "pwsh version: $PWSH_VERSION"
elif command -v powershell >/dev/null 2>&1; then
  log_ok "powershell (Windows built-in) available"
else
  log_warn "pwsh not found. Some Windows-native scripts may not work."
fi

# --- Docker ---
log ""
log "--- Docker ---"
if command -v docker >/dev/null 2>&1; then
  # Check if docker command actually works (not just WSL wrapper)
  if docker --version >/dev/null 2>&1; then
    DOCKER_VERSION=$(docker --version 2>/dev/null || echo "unknown")
    log_ok "$DOCKER_VERSION"

    # Check if Docker daemon is running
    if docker info >/dev/null 2>&1; then
      log_ok "Docker daemon is running"
    else
      log_warn "Docker installed but daemon not running"
    fi
  else
    log_warn "docker command exists but is not functional (WSL integration may be disabled)"
  fi
else
  log_warn "docker not found. Required for containerized deployments."
fi

# --- Docker Compose ---
if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
  COMPOSE_VERSION=$(docker compose version --short 2>/dev/null || echo "unknown")
  log_ok "docker compose version: $COMPOSE_VERSION"
elif command -v docker-compose >/dev/null 2>&1 && docker-compose --version >/dev/null 2>&1; then
  COMPOSE_VERSION=$(docker-compose --version 2>/dev/null || echo "unknown")
  log_ok "docker-compose (legacy): $COMPOSE_VERSION"
else
  log "INFO: docker compose not available"
fi# --- Git Configuration ---
log ""
log "--- Git Configuration ---"
if command -v git >/dev/null 2>&1; then
  GIT_VERSION=$(git --version 2>/dev/null || echo "unknown")
  log_ok "$GIT_VERSION"

  GIT_USER=$(git config user.name 2>/dev/null || echo "")
  GIT_EMAIL=$(git config user.email 2>/dev/null || echo "")
  if [[ -n "$GIT_USER" ]] && [[ -n "$GIT_EMAIL" ]]; then
    log_ok "Git user: $GIT_USER <$GIT_EMAIL>"
  else
    log_warn "Git user.name or user.email not configured"
  fi
fi

# --- Optional: Rust (for some services) ---
log ""
log "--- Optional Tools ---"
if command -v cargo >/dev/null 2>&1; then
  RUST_VERSION=$(rustc --version 2>/dev/null || echo "unknown")
  log_ok "Rust: $RUST_VERSION"
else
  log "INFO: Rust/Cargo not found (optional for some services)"
fi

# --- Summary ---
log ""
log "════════════════════════════════════════════════════════════════"
log "Gate A Summary: $ERRORS error(s), $WARNINGS warning(s)"
log "Log written to: $LOG_FILE"
log "════════════════════════════════════════════════════════════════"

if (( ERRORS > 0 )); then
  log "❌ Gate A: FAILED - Fix errors above before proceeding"
  exit 1
fi

if (( WARNINGS > 0 )); then
  log "⚠️  Gate A: PASSED with warnings"
else
  log "✅ Gate A: PASSED"
fi

exit 0
