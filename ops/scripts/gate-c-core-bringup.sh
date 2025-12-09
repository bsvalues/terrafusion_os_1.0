#!/usr/bin/env bash
set -euo pipefail

# Gate C: Core Bringup
# Responsibilities:
#   - Ensure backend and frontend can build.
#   - On non-WSL environments, start the API on a fixed port for Gate E.
#   - Treat WSL as a "frontend/dev-only" node (backend optional).

ROOT_DIR="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
ARTIFACTS_DIR="$ROOT_DIR/artifacts"
LOG_FILE="$ARTIFACTS_DIR/logs/gate-c-core-bringup.log"
PIDS_DIR="$ARTIFACTS_DIR/pids"

mkdir -p "$(dirname "$LOG_FILE")" "$PIDS_DIR"

log() {
  echo "[Gate C - $(date -Iseconds)] $*"
  echo "[Gate C - $(date -Iseconds)] $*" >> "$LOG_FILE"
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

require_cmd() {
  local cmd="$1"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    log "ERROR: Required command not found: $cmd"
    increment_error
    exit 1
  fi
}

# Paths – adjust if needed
BACKEND_API_DIR="$ROOT_DIR/backend/src/TerraFusion.API"
FRONTEND_DIR="$ROOT_DIR/frontend"

# Port & base URL for API; Gate E should use the same
TF_API_PORT="${TF_API_PORT:-5000}"
TF_API_BASE_URL="${TF_API_BASE_URL:-http://localhost:$TF_API_PORT}"

log "════════════════════════════════════════════════════════════════"
log "Starting Gate C: Core Bringup"
log "ROOT_DIR=$ROOT_DIR"
log "BACKEND_API_DIR=$BACKEND_API_DIR"
log "FRONTEND_DIR=$FRONTEND_DIR"
log "TF_API_BASE_URL=$TF_API_BASE_URL"
log "Log file: $LOG_FILE"
log "════════════════════════════════════════════════════════════════"
log ""

# -----------------------------------------------------------------------------
# 1) Frontend build (required everywhere)
# -----------------------------------------------------------------------------

log "--- Frontend core build ---"

if [ ! -d "$FRONTEND_DIR" ]; then
  log "ERROR: Frontend directory not found at $FRONTEND_DIR"
  increment_error
else
  pushd "$FRONTEND_DIR" >/dev/null

  # Prefer pnpm, fallback to npm
  if command -v pnpm >/dev/null 2>&1; then
    log "INFO: Using pnpm for frontend"
    PM="pnpm"
  elif command -v npm >/dev/null 2>&1; then
    log "INFO: pnpm not found, falling back to npm"
    PM="npm"
  else
    log "ERROR: Neither pnpm nor npm is available for frontend build."
    increment_error
    PM=""
  fi

  if [ -n "$PM" ]; then
    log "INFO: Installing frontend dependencies..."
    if ! $PM install >>"$LOG_FILE" 2>&1; then
      log "ERROR: Frontend dependency install failed."
      increment_error
    else
      log "INFO: Running frontend build..."
      if ! $PM run build >>"$LOG_FILE" 2>&1; then
        log "ERROR: Frontend build failed."
        increment_error
      else
        log "✅ Frontend build succeeded."
      fi
    fi
  fi

  popd >/dev/null
fi

log ""

# -----------------------------------------------------------------------------
# 2) Backend build + API bringup (optional in WSL, required elsewhere)
# -----------------------------------------------------------------------------

log "--- Backend core build + API bringup ---"

if [ ! -d "$BACKEND_API_DIR" ]; then
  log "WARN: Backend API directory not found at $BACKEND_API_DIR; skipping backend bringup."
  increment_warning
else
  if is_wsl; then
    log "INFO: Detected WSL environment."
    log "INFO: Treating backend bringup as optional inside WSL (expected to run on Windows host)."
    # You could still try dotnet build here if you end up installing it in WSL.
  else
    # Non-WSL: require dotnet and actually bring up the API
    require_cmd dotnet

    pushd "$BACKEND_API_DIR" >/dev/null

    log "INFO: Restoring backend packages..."
    if ! dotnet restore >>"$LOG_FILE" 2>&1; then
      log "ERROR: dotnet restore failed."
      increment_error
    else
      log "INFO: Building backend (Release)..."
      if ! dotnet build -c Release >>"$LOG_FILE" 2>&1; then
        log "ERROR: dotnet build failed."
        increment_error
      else
        log "✅ Backend build succeeded."

        # Start API on fixed port in background
        log "INFO: Starting API on $TF_API_BASE_URL ..."
        ASPNETCORE_URLS="$TF_API_BASE_URL" dotnet run --no-build >>"$LOG_FILE" 2>&1 &
        API_PID=$!
        echo "$API_PID" >"$PIDS_DIR/api.pid"
        log "INFO: API started with PID $API_PID"
      fi
    fi

    popd >/dev/null
  fi
fi

log ""
log "════════════════════════════════════════════════════════════════"
log "Gate C Summary: $errors error(s), $warnings warning(s)"
log "Log written to: $LOG_FILE"
log "════════════════════════════════════════════════════════════════"

if ((errors > 0)); then
  log "❌ Gate C: FAILED"
  exit 1
elif ((warnings > 0)); then
  log "⚠️  Gate C: PASSED with warnings"
  exit 0
else
  log "✅ Gate C: PASSED clean"
  exit 0
fi
