#!/usr/bin/env bash
set -euo pipefail

# Gate F: Validate All
# Comprehensive test suite: unit, integration, E2E, performance smoke
# Aggregates results and generates final report

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ARTIFACTS_DIR="$ROOT_DIR/artifacts"
REPORTS_DIR="$ARTIFACTS_DIR/reports"
LOG_FILE="$ARTIFACTS_DIR/logs/gate-f-validate.log"

mkdir -p "$REPORTS_DIR" "$ARTIFACTS_DIR/logs"

ERRORS=0
WARNINGS=0
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Test configuration
RUN_UNIT=${RUN_UNIT_TESTS:-true}
RUN_INTEGRATION=${RUN_INTEGRATION_TESTS:-false}
RUN_E2E=${RUN_E2E_TESTS:-false}
RUN_PERF=${RUN_PERF_TESTS:-false}
FAIL_FAST=${FAIL_FAST:-false}

log() {
  local msg="[Gate F - $(date -Iseconds)] $*"
  echo "$msg"
  echo "$msg" >> "$LOG_FILE"
}

log_ok() { log "✅ $*"; }
log_warn() { log "⚠️  WARN: $*"; ((WARNINGS++)) || true; }
log_error() { log "❌ ERROR: $*"; ((ERRORS++)) || true; }
log_skip() { log "⏭️  SKIP: $*"; }

run_test_suite() {
  local name="$1"
  local cmd="$2"
  local cwd="${3:-$ROOT_DIR}"

  log ""
  log "--- Running: $name ---"
  ((TESTS_RUN++)) || true

  if (cd "$cwd" && eval "$cmd" 2>&1 | tee -a "$LOG_FILE"); then
    log_ok "$name PASSED"
    ((TESTS_PASSED++)) || true
    return 0
  else
    log_error "$name FAILED"
    ((TESTS_FAILED++)) || true
    if [[ "$FAIL_FAST" == "true" ]]; then
      log "FAIL_FAST enabled - stopping test run"
      return 1
    fi
    return 0  # Continue to next test
  fi
}

log "════════════════════════════════════════════════════════════════"
log "Starting Gate F: Validate All"
log "════════════════════════════════════════════════════════════════"
log "Configuration:"
log "  RUN_UNIT_TESTS=$RUN_UNIT"
log "  RUN_INTEGRATION_TESTS=$RUN_INTEGRATION"
log "  RUN_E2E_TESTS=$RUN_E2E"
log "  RUN_PERF_TESTS=$RUN_PERF"
log "  FAIL_FAST=$FAIL_FAST"

# --- Backend Unit Tests (.NET) ---
log ""
log "═══ Backend Tests (.NET) ═══"

BACKEND_TESTS="$ROOT_DIR/backend/tests"

if [[ "$RUN_UNIT" == "true" ]] && command -v dotnet >/dev/null 2>&1; then
  # Smoke tests (fast)
  SMOKE_TESTS="$BACKEND_TESTS/TerraFusion.Unit.SmokeTests"
  if [[ -d "$SMOKE_TESTS" ]]; then
    run_test_suite "Backend Smoke Tests" "dotnet test --nologo --verbosity quiet" "$SMOKE_TESTS"
  fi

  # Unit tests
  UNIT_TESTS="$BACKEND_TESTS/unit"
  if [[ -d "$UNIT_TESTS" ]] && [[ -f "$BACKEND_TESTS/TerraFusion.Tests.csproj" ]]; then
    run_test_suite "Backend Unit Tests" "dotnet test --nologo --verbosity quiet --filter 'Category=Unit'" "$BACKEND_TESTS"
  fi
else
  if [[ "$RUN_UNIT" != "true" ]]; then
    log_skip "Backend unit tests disabled"
  else
    log_warn "dotnet not available - skipping backend tests"
  fi
fi

# --- Backend Integration Tests ---
if [[ "$RUN_INTEGRATION" == "true" ]] && command -v dotnet >/dev/null 2>&1; then
  INT_TESTS="$BACKEND_TESTS/TerraFusion.Integration.Tests"
  if [[ -d "$INT_TESTS" ]]; then
    run_test_suite "Backend Integration Tests" "dotnet test --nologo --verbosity quiet" "$INT_TESTS"
  fi
else
  log_skip "Backend integration tests (RUN_INTEGRATION_TESTS=$RUN_INTEGRATION)"
fi

# --- Frontend Tests (Jest) ---
log ""
log "═══ Frontend Tests ═══"

FRONTEND_DIR="$ROOT_DIR/frontend"

if [[ "$RUN_UNIT" == "true" ]] && [[ -f "$FRONTEND_DIR/package.json" ]]; then
  cd "$FRONTEND_DIR"

  # Determine package manager
  PKG_MGR="npm"
  if [[ -f "pnpm-lock.yaml" ]] && command -v pnpm >/dev/null 2>&1; then
    PKG_MGR="pnpm"
  fi

  # Check if test script exists
  if grep -q '"test"' package.json 2>/dev/null; then
    run_test_suite "Frontend Unit Tests" "$PKG_MGR run test -- --passWithNoTests --watchAll=false" "$FRONTEND_DIR"
  else
    log "INFO: No test script in frontend/package.json"
  fi

  cd "$ROOT_DIR"
else
  if [[ "$RUN_UNIT" != "true" ]]; then
    log_skip "Frontend unit tests disabled"
  else
    log "INFO: Frontend package.json not found"
  fi
fi

# --- E2E Tests (Playwright) ---
log ""
log "═══ E2E Tests ═══"

if [[ "$RUN_E2E" == "true" ]]; then
  E2E_DIR="$FRONTEND_DIR"

  if [[ -f "$E2E_DIR/playwright.config.ts" ]]; then
    if command -v npx >/dev/null 2>&1; then
      run_test_suite "Playwright E2E Tests" "npx playwright test --reporter=list" "$E2E_DIR"
    else
      log_warn "npx not available for Playwright tests"
    fi
  else
    log "INFO: No playwright.config.ts found"
  fi
else
  log_skip "E2E tests (RUN_E2E_TESTS=$RUN_E2E)"
fi

# --- Performance Tests ---
log ""
log "═══ Performance Tests ═══"

if [[ "$RUN_PERF" == "true" ]]; then
  PERF_TESTS="$BACKEND_TESTS/TerraFusion.Performance.Tests"

  if [[ -d "$PERF_TESTS" ]] && command -v dotnet >/dev/null 2>&1; then
    run_test_suite "Performance Tests" "dotnet test --nologo --verbosity quiet" "$PERF_TESTS"
  else
    log "INFO: Performance tests not found or dotnet unavailable"
  fi
else
  log_skip "Performance tests (RUN_PERF_TESTS=$RUN_PERF)"
fi

# --- Lint Checks ---
log ""
log "═══ Lint Checks ═══"

# Frontend ESLint
if [[ -f "$FRONTEND_DIR/package.json" ]] && grep -q '"lint"' "$FRONTEND_DIR/package.json" 2>/dev/null; then
  cd "$FRONTEND_DIR"
  PKG_MGR="npm"
  if [[ -f "pnpm-lock.yaml" ]] && command -v pnpm >/dev/null 2>&1; then
    PKG_MGR="pnpm"
  fi

  log "Running ESLint..."
  if $PKG_MGR run lint 2>&1 | tail -20 | tee -a "$LOG_FILE"; then
    log_ok "ESLint passed"
  else
    log_warn "ESLint found issues"
  fi
  cd "$ROOT_DIR"
fi

# --- Generate Test Report ---
log ""
log "═══ Test Report ═══"

REPORT_FILE="$REPORTS_DIR/test-summary.json"
cat > "$REPORT_FILE" << EOF
{
  "timestamp": "$(date -Iseconds)",
  "gate": "F",
  "summary": {
    "total_suites": $TESTS_RUN,
    "passed": $TESTS_PASSED,
    "failed": $TESTS_FAILED,
    "warnings": $WARNINGS
  },
  "configuration": {
    "unit_tests": $RUN_UNIT,
    "integration_tests": $RUN_INTEGRATION,
    "e2e_tests": $RUN_E2E,
    "perf_tests": $RUN_PERF
  }
}
EOF

log_ok "Test report written: $REPORT_FILE"

# --- Summary ---
log ""
log "════════════════════════════════════════════════════════════════"
log "Gate F Summary"
log "════════════════════════════════════════════════════════════════"
log "Test Suites: $TESTS_RUN total, $TESTS_PASSED passed, $TESTS_FAILED failed"
log "Errors: $ERRORS | Warnings: $WARNINGS"
log "Reports: $REPORTS_DIR"
log "Log: $LOG_FILE"
log "════════════════════════════════════════════════════════════════"

if (( TESTS_FAILED > 0 )) || (( ERRORS > 0 )); then
  log "❌ Gate F: FAILED ($TESTS_FAILED test suite(s) failed)"
  exit 1
fi

if (( WARNINGS > 0 )); then
  log "⚠️  Gate F: PASSED with warnings"
else
  log "✅ Gate F: PASSED (all $TESTS_PASSED test suites passed)"
fi

exit 0
