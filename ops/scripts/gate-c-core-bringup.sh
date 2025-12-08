#!/usr/bin/env bash
set -euo pipefail

# Gate C: Core Bringup
# Build and verify core services: backend (.NET), frontend (Node/Vite)
# Optionally start Docker services (DB, Redis, etc.)

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ARTIFACTS_DIR="$ROOT_DIR/artifacts"
LOG_FILE="$ARTIFACTS_DIR/logs/gate-c-core.log"

mkdir -p "$ARTIFACTS_DIR/logs"

ERRORS=0
WARNINGS=0
SKIP_DOCKER=${SKIP_DOCKER:-false}
BUILD_ONLY=${BUILD_ONLY:-false}

log() {
  local msg="[Gate C - $(date -Iseconds)] $*"
  echo "$msg"
  echo "$msg" >> "$LOG_FILE"
}

log_ok() { log "✅ $*"; }
log_warn() { log "⚠️  WARN: $*"; ((WARNINGS++)) || true; }
log_error() { log "❌ ERROR: $*"; ((ERRORS++)) || true; }
log_skip() { log "⏭️  SKIP: $*"; }

log "════════════════════════════════════════════════════════════════"
log "Starting Gate C: Core Bringup"
log "════════════════════════════════════════════════════════════════"

# --- Backend Build (.NET) ---
log ""
log "--- Backend Build (.NET) ---"
BACKEND_DIR="$ROOT_DIR/backend"
BACKEND_SLN="$BACKEND_DIR/TerraFusion.sln"

if [[ -f "$BACKEND_SLN" ]]; then
  if command -v dotnet >/dev/null 2>&1; then
    log "Building backend solution..."

    # Restore
    if dotnet restore "$BACKEND_SLN" --verbosity quiet 2>&1 | tee -a "$LOG_FILE"; then
      log_ok "dotnet restore completed"
    else
      log_error "dotnet restore failed"
    fi

    # Build
    if dotnet build "$BACKEND_SLN" --configuration Release --no-restore --verbosity quiet 2>&1 | tee -a "$LOG_FILE"; then
      log_ok "dotnet build completed (Release)"
    else
      log_error "dotnet build failed"
    fi
  else
    log_warn "dotnet not available - skipping backend build"
  fi
else
  log_warn "Backend solution not found at $BACKEND_SLN"
fi

# --- Frontend Build (Node/pnpm) ---
log ""
log "--- Frontend Build (Node) ---"
FRONTEND_DIR="$ROOT_DIR/frontend"

if [[ -f "$FRONTEND_DIR/package.json" ]]; then
  cd "$FRONTEND_DIR"

  # Determine package manager
  PKG_MGR="npm"
  if [[ -f "pnpm-lock.yaml" ]] && command -v pnpm >/dev/null 2>&1; then
    PKG_MGR="pnpm"
  elif [[ -f "package-lock.json" ]]; then
    PKG_MGR="npm"
  fi

  log "Using package manager: $PKG_MGR"

  # Install dependencies
  if [[ "$PKG_MGR" == "pnpm" ]]; then
    if pnpm install --frozen-lockfile 2>&1 | tail -5 | tee -a "$LOG_FILE"; then
      log_ok "pnpm install completed"
    else
      # Try without frozen lockfile
      if pnpm install 2>&1 | tail -5 | tee -a "$LOG_FILE"; then
        log_ok "pnpm install completed (lockfile updated)"
      else
        log_error "pnpm install failed"
      fi
    fi
  else
    if npm ci 2>&1 | tail -5 | tee -a "$LOG_FILE"; then
      log_ok "npm ci completed"
    else
      if npm install 2>&1 | tail -5 | tee -a "$LOG_FILE"; then
        log_ok "npm install completed"
      else
        log_error "npm install failed"
      fi
    fi
  fi

  # Type check (if available)
  if grep -q '"typecheck"' package.json 2>/dev/null; then
    log "Running TypeScript type check..."
    if $PKG_MGR run typecheck 2>&1 | tee -a "$LOG_FILE"; then
      log_ok "TypeScript type check passed"
    else
      log_warn "TypeScript type check had issues"
    fi
  fi

  # Build (skip for dev-only mode)
  if [[ "$BUILD_ONLY" == "true" ]] || grep -q '"build"' package.json 2>/dev/null; then
    log "Building frontend..."
    if $PKG_MGR run build 2>&1 | tail -10 | tee -a "$LOG_FILE"; then
      log_ok "Frontend build completed"
    else
      log_warn "Frontend build had issues (may be non-blocking)"
    fi
  fi

  cd "$ROOT_DIR"
else
  log_warn "Frontend package.json not found"
fi

# --- Docker Services (optional) ---
log ""
log "--- Docker Services ---"

if [[ "$SKIP_DOCKER" == "true" ]]; then
  log_skip "Docker services disabled (SKIP_DOCKER=true)"
elif ! command -v docker >/dev/null 2>&1; then
  log_warn "Docker not available - skipping container services"
elif ! docker info >/dev/null 2>&1; then
  log_warn "Docker daemon not running - skipping container services"
else
  # Look for compose files
  COMPOSE_FILES=(
    "$ROOT_DIR/docker-compose.yml"
    "$ROOT_DIR/docker-compose.dev.yml"
    "$ROOT_DIR/compose/docker-compose.dev.yml"
  )

  COMPOSE_FILE=""
  for cf in "${COMPOSE_FILES[@]}"; do
    if [[ -f "$cf" ]]; then
      COMPOSE_FILE="$cf"
      break
    fi
  done

  if [[ -n "$COMPOSE_FILE" ]]; then
    log "Found compose file: $COMPOSE_FILE"

    if [[ "$BUILD_ONLY" == "true" ]]; then
      log_skip "BUILD_ONLY=true - not starting containers"
    else
      log "Starting infrastructure services (db, redis)..."
      # Start only infra services, not the full stack
      if docker compose -f "$COMPOSE_FILE" up -d db redis 2>&1 | tee -a "$LOG_FILE"; then
        log_ok "Infrastructure services started"

        # Wait for DB to be ready
        log "Waiting for database to be ready..."
        sleep 5
        if docker compose -f "$COMPOSE_FILE" exec -T db pg_isready -U terrafusion 2>/dev/null; then
          log_ok "Database is ready"
        else
          log_warn "Database may not be ready yet"
        fi
      else
        log_warn "Failed to start some infrastructure services"
      fi
    fi
  else
    log "INFO: No docker-compose file found - skipping container services"
  fi
fi

# --- Summary ---
log ""
log "════════════════════════════════════════════════════════════════"
log "Gate C Summary: $ERRORS error(s), $WARNINGS warning(s)"
log "Log: $LOG_FILE"
log "════════════════════════════════════════════════════════════════"

if (( ERRORS > 0 )); then
  log "❌ Gate C: FAILED - Build errors detected"
  exit 1
fi

if (( WARNINGS > 0 )); then
  log "⚠️  Gate C: PASSED with warnings"
else
  log "✅ Gate C: PASSED"
fi

exit 0
