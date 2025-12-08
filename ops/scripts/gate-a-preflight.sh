#!/usr/bin/env bash
set -euo pipefail

# Gate A: Preflight
# Lightweight environment checks: tools, basic system info.

log() {
  echo "[Gate A - $(date -Iseconds)] $*"
}

require_cmd() {
  local cmd="$1"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    log "ERROR: Required command not found: $cmd"
    exit 1
  fi
  log "OK: Found '$cmd' ($(command -v "$cmd"))"
}

log "Starting Gate A: Preflight checks..."

# Basic system info
log "System: $(uname -a || echo 'unknown')"

# CPU count (best effort)
if command -v nproc >/dev/null 2>&1; then
  log "CPUs: $(nproc)"
fi

# Core tooling (tune this list as needed)
require_cmd git
require_cmd bash

if command -v dotnet >/dev/null 2>&1; then
  log "dotnet version: $(dotnet --version || echo 'unknown')"
else
  log "WARN: dotnet not found (OK for now if backend not building here)."
fi

if command -v node >/dev/null 2>&1; then
  log "node version: $(node --version || echo 'unknown')"
else
  log "WARN: node not found (OK for now if frontend not building here)."
fi

if command -v npm >/dev/null 2>&1; then
  log "npm version: $(npm --version || echo 'unknown')"
else
  log "WARN: npm not found."
fi

if command -v docker >/dev/null 2>&1; then
  log "docker version: $(docker --version || echo 'unknown')"
else
  log "WARN: docker not found (OK for Phase 1)."
fi

log "Gate A: Preflight checks completed successfully."
