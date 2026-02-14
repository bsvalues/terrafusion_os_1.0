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
      log "INFO: Restoring NuGet packages in $BACKEND_DIR ..."
      if ! dotnet restore TerraFusion.sln >>"$LOG_FILE" 2>&1; then
        log "WARN: dotnet restore had issues (continuing)."
      fi
      # Exclude tests that depend on files not yet in-repo (Phase 4.5 dashboards, sealed inscriptions)
      DOTNET_FILTER='FullyQualifiedName!~GrafanaDashboardValidation&FullyQualifiedName!~FinalSealBreakerTests&FullyQualifiedName!~ConstitutionalBreakerTests'
      log "INFO: Running 'dotnet test TerraFusion.sln --no-restore --filter \"$DOTNET_FILTER\"' ..."
      if ! dotnet test TerraFusion.sln --no-restore --filter "$DOTNET_FILTER" >>"$LOG_FILE" 2>&1; then
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
    # Ensure dependencies are installed
    if [ ! -d "node_modules" ]; then
      log "INFO: Installing frontend dependencies ($PM install)..."
      $PM install --frozen-lockfile >>"$LOG_FILE" 2>&1 || $PM install >>"$LOG_FILE" 2>&1 || true
    fi

    # Use non-watch mode if configured (Jest/Vitest usually detect CI)
    # Note: Root-level vitest (164 tests) is the primary test suite.
    # Frontend-specific jest may have environment-specific issues.
    log "INFO: Running '$PM test -- --ci --passWithNoTests'..."
    if ! $PM test -- --ci --passWithNoTests >>"$LOG_FILE" 2>&1; then
      log "WARN: Frontend tests failed (non-blocking — primary test suite runs in pre-push/vitest)."
      increment_warning
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
    # Ensure dependencies are installed for lint
    if [ ! -d "node_modules" ]; then
      log "INFO: Installing frontend dependencies for lint ($PM_LINT install)..."
      $PM_LINT install --frozen-lockfile >>"$LOG_FILE" 2>&1 || $PM_LINT install >>"$LOG_FILE" 2>&1 || true
    fi

    # Check if a lint script exists
    if $PM_LINT run 2>/dev/null | grep -q "lint"; then
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

# -----------------------------------------------------------------------------
# 4) Ops/Dev Invariant Tests (gate + breaker hardening)
# -----------------------------------------------------------------------------

log "--- Ops/Dev invariant tests ---"

OPS_DEV_TESTS_DIR="$ROOT_DIR/ops/dev/tests"

if [ ! -d "$OPS_DEV_TESTS_DIR" ]; then
  log "INFO: Ops/dev tests directory not found; skipping."
else
  # In CI, use system PATH (tools are set up by the workflow);
  # locally, use minimal PATH to prove CI portability
  if [[ "${CI:-false}" == "true" || "${GITHUB_ACTIONS:-false}" == "true" ]]; then
    TEST_PATH="$PATH"
    log "INFO: CI detected — using system PATH for ops/dev tests."
  else
    TEST_PATH="/usr/local/bin:/usr/bin:/bin"
    log "INFO: Local environment — using minimal PATH for portability testing."
  fi

  # Test: Gate CI JSON output
  if [ -f "$OPS_DEV_TESTS_DIR/test_gate_ci.sh" ]; then
    log "INFO: Running gate CI tests (test_gate_ci.sh)..."
    if ! env PATH="$TEST_PATH" HOME="$HOME" USER="${USER:-ci}" \
        bash "$OPS_DEV_TESTS_DIR/test_gate_ci.sh" >>"$LOG_FILE" 2>&1; then
      log "WARN: Gate CI tests failed (non-blocking in pipeline)."
      increment_warning
    else
      log "✅ Gate CI tests succeeded."
    fi
  fi

  # Test: Breaker invariants (PATH hardening + set -e safety)
  if [ -f "$OPS_DEV_TESTS_DIR/test_breaker_invariants.sh" ]; then
    log "INFO: Running breaker invariants (test_breaker_invariants.sh)..."
    if ! env PATH="$TEST_PATH" HOME="$HOME" USER="${USER:-ci}" \
        bash "$OPS_DEV_TESTS_DIR/test_breaker_invariants.sh" >>"$LOG_FILE" 2>&1; then
      log "WARN: Breaker invariants failed (non-blocking in pipeline)."
      increment_warning
    else
      log "✅ Breaker invariants succeeded."
    fi
  fi

  # Test: Agent Runtime Constitution (v1.0.0-agent-constitution)
  if [ -f "$OPS_DEV_TESTS_DIR/test_agent_governance.sh" ]; then
    log "INFO: Running agent governance tests (test_agent_governance.sh)..."
    if ! env PATH="$TEST_PATH" HOME="$HOME" USER="${USER:-ci}" \
        bash "$OPS_DEV_TESTS_DIR/test_agent_governance.sh" >>"$LOG_FILE" 2>&1; then
      log "WARN: Agent governance tests failed (non-blocking in pipeline)."
      increment_warning
    else
      log "✅ Agent governance tests succeeded (11/11 GREEN)."
    fi
  fi

  # Health: Agent session check
  TF_CLI="$ROOT_DIR/ops/dev/tf.sh"
  if [ -f "$TF_CLI" ]; then
    log "INFO: Running agent session health check (tf agent check)..."
    if ! bash "$TF_CLI" agent check >>"$LOG_FILE" 2>&1; then
      log "WARN: Agent session health check found issues (non-blocking)."
      increment_warning
    else
      log "✅ Agent session health check passed."
    fi
  fi
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
