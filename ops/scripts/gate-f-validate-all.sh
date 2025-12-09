#!/usr/bin/env bash
set -euo pipefail

# Gate F: Validate All
# Responsibilities:
#   - Run backend tests (dotnet test) where appropriate.
#   - Run frontend tests (pnpm/npm test).
#   - Run frontend lint (pnpm/npm lint).
#   - Treat WSL as "frontend node" (backend tests optional).
#   - Produce logs under artifacts/logs/.

ROOT_DIR="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
ARTIFACTS_DIR="$ROOT_DIR/artifacts"
LOG_FILE="$ARTIFACTS_DIR/logs/gate-f-validate-all.log"

mkdir -p "$(dirname "$LOG_FILE")"

log() {
  echo "[Gate F - $(date -Iseconds)] $*"
  echo "[Gate F - $(date -Iseconds)] $*" >> "$LOG_FILE"
}

errors=0
warnings=0

increment_error() {
  errors=$((errors + 1))
}

increment_warning() {
  warnings=$((warnings + 1))
}

is_wsl() {
  if grep -qi "microsoft" /proc/sys/kernel/osrelease 2>/dev/null; then
    return 0
  fi
  if env | grep -qE '^WSL_INTEROP='; then
    return 0
  fi
  return 1
}

require_cmd_soft() {
  local cmd="$1"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    log "WARN: Command '$cmd' not found."
    increment_warning
    return 1
  fi
  return 0
}

log "════════════════════════════════════════════════════════════════"
log "Starting Gate F: Validate All"
log "ROOT_DIR=$ROOT_DIR"
log "Log file: $LOG_FILE"
log "════════════════════════════════════════════════════════════════"
log ""

BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

# -----------------------------------------------------------------------------
# 1) Backend tests (dotnet test) – optional in WSL, required elsewhere
# -----------------------------------------------------------------------------

log "--- Backend test suite (dotnet test) ---"

if [ ! -d "$BACKEND_DIR" ]; then
  log "INFO: Backend directory not found at $BACKEND_DIR; skipping backend tests."
  increment_warning
else
  if is_wsl; then
    log "INFO: Detected WSL environment; treating backend tests as optional."
    log "INFO: Run 'dotnet test' from Windows host if backend validation is required."
  else
    if require_cmd_soft dotnet; then
      pushd "$BACKEND_DIR" >/dev/null
      log "INFO: Running 'dotnet test' in $BACKEND_DIR ..."
      if ! dotnet test >>"$LOG_FILE" 2>&1; then
        log "ERROR: dotnet test failed."
        increment_error
      else
        log "✅ Backend tests (dotnet test) succeeded."
      fi
      popd >/dev/null
    else
      log "WARN: dotnet not available; backend tests skipped on this machine."
    fi
  fi
fi

log ""

# -----------------------------------------------------------------------------
# 2) Frontend tests (pnpm/npm test) – required everywhere
# -----------------------------------------------------------------------------

log "--- Frontend unit tests ---"

if [ ! -d "$FRONTEND_DIR" ]; then
  log "ERROR: Frontend directory not found at $FRONTEND_DIR; cannot run tests."
  increment_error
else
  pushd "$FRONTEND_DIR" >/dev/null

  PM=""
  if command -v pnpm >/dev/null 2>&1; then
    PM="pnpm"
    log "INFO: Using pnpm to run frontend tests."
  elif command -v npm >/dev/null 2>&1; then
    PM="npm"
    log "INFO: pnpm not found; falling back to npm for frontend tests."
  else
    log "ERROR: Neither pnpm nor npm available for frontend tests."
    increment_error
  fi

  if [ -n "$PM" ]; then
    # Use non-watch mode if configured (Jest/Vitest usually detect CI)
    log "INFO: Running '$PM test'..."
    if ! $PM test >>"$LOG_FILE" 2>&1; then
      log "ERROR: Frontend tests failed."
      increment_error
    else
      log "✅ Frontend tests succeeded."
    fi
  fi

  popd >/dev/null
fi

log ""

# -----------------------------------------------------------------------------
# 3) Frontend lint (pnpm/npm lint) – best-effort (warn if missing)
# -----------------------------------------------------------------------------

log "--- Frontend lint ---"

if [ ! -d "$FRONTEND_DIR" ]; then
  log "INFO: Frontend directory not found; skipping lint."
else
  pushd "$FRONTEND_DIR" >/dev/null

  PM_LINT=""
  if command -v pnpm >/dev/null 2>&1; then
    PM_LINT="pnpm"
  elif command -v npm >/dev/null 2>&1; then
    PM_LINT="npm"
  fi

  if [ -n "$PM_LINT" ]; then
    # Check if a lint script exists
    if $PM_LINT run | grep -q "lint"; then
      log "INFO: Running '$PM_LINT run lint'..."
      if ! $PM_LINT run lint >>"$LOG_FILE" 2>&1; then
        log "WARN: Frontend lint failed."
        increment_warning
      else
        log "✅ Frontend lint succeeded."
      fi
    else
      log "INFO: No 'lint' script defined; skipping frontend lint."
    fi
  else
    log "WARN: No JS package manager available for lint."
    increment_warning
  fi

  popd >/dev/null
fi

log ""
log "════════════════════════════════════════════════════════════════"
log "Gate F Summary: $errors error(s), $warnings warning(s)"
log "Log written to: $LOG_FILE"
log "════════════════════════════════════════════════════════════════"

if ((errors > 0)); then
  log "❌ Gate F: FAILED"
  exit 1
elif ((warnings > 0)); then
  log "⚠️  Gate F: PASSED with warnings"
  exit 0
else
  log "✅ Gate F: PASSED clean"
  exit 0
fi
