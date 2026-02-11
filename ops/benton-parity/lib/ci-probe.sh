#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════════
# ops/benton-parity/lib/ci-probe.sh — CI PR-gate job simulation
# ═══════════════════════════════════════════════════════════════════════════════
# Simulates the 8 PR-gate jobs that run in seal-gate-fast.yml under
# Benton Mode constraints. Each job is run locally and failures captured.
# ═══════════════════════════════════════════════════════════════════════════════

set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common.sh
source "$SCRIPT_DIR/common.sh"

CI_REQ_FILE="${EVIDENCE_DIR}/ci-requirements.json"
CI_LOG_DIR="${EVIDENCE_DIR}/ci-logs"

# ── PR Gate Jobs ───────────────────────────────────────────────────────────────
# These mirror the jobs in seal-gate-fast.yml

gate_classify() {
  local label="classify"
  log_info "CI Gate: $label"
  mkdir -p "$CI_LOG_DIR"

  # This gate just classifies changed files — pure git, no network required
  local exit_code=0
  (cd "$REPO_ROOT" && git diff --name-only HEAD~1 2>/dev/null || git ls-files) \
    > "$CI_LOG_DIR/${label}.log" 2>&1 || exit_code=$?

  if [ $exit_code -eq 0 ]; then
    log_ok "CI   ${label} — passed (pure git, no network)"
  else
    log_fail "CI   ${label} — failed"
    append_requirement "$CI_REQ_FILE" "ci-gate" "$label" \
      "File classification failed" "ci-probe"
  fi
}

gate_frontend_lint() {
  local label="frontend-lint"
  log_info "CI Gate: $label"
  mkdir -p "$CI_LOG_DIR"

  if ! command -v pnpm &>/dev/null; then
    log_fail "CI   ${label} — pnpm not available"
    append_requirement "$CI_REQ_FILE" "ci-gate" "$label" \
      "pnpm required for frontend lint" "ci-probe"
    return 0
  fi

  local exit_code=0
  (cd "$REPO_ROOT" && pnpm -C frontend run lint 2>&1) \
    > "$CI_LOG_DIR/${label}.log" 2>&1 || exit_code=$?

  if [ $exit_code -eq 0 ]; then
    log_ok "CI   ${label} — passed"
  else
    log_warn "CI   ${label} — failed (currently soft-fail in SEAL)"
  fi
}

gate_frontend_typecheck() {
  local label="frontend-typecheck"
  log_info "CI Gate: $label"
  mkdir -p "$CI_LOG_DIR"

  if ! command -v pnpm &>/dev/null; then
    log_fail "CI   ${label} — pnpm not available"
    append_requirement "$CI_REQ_FILE" "ci-gate" "$label" \
      "pnpm required for frontend typecheck" "ci-probe"
    return 0
  fi

  local exit_code=0
  # Try type-check, then typecheck
  (cd "$REPO_ROOT" && {
    pnpm -C frontend run type-check 2>&1 || pnpm -C frontend run typecheck 2>&1
  }) > "$CI_LOG_DIR/${label}.log" 2>&1 || exit_code=$?

  if [ $exit_code -eq 0 ]; then
    log_ok "CI   ${label} — passed"
  else
    log_fail "CI   ${label} — FAILED (blocking)"
    append_requirement "$CI_REQ_FILE" "ci-gate" "$label" \
      "Frontend typecheck must pass (see ci-logs/${label}.log)" "ci-probe"
  fi
}

gate_frontend_test() {
  local label="frontend-unit-tests"
  log_info "CI Gate: $label"
  mkdir -p "$CI_LOG_DIR"

  if ! command -v pnpm &>/dev/null; then
    log_fail "CI   ${label} — pnpm not available"
    return 0
  fi

  local exit_code=0
  (cd "$REPO_ROOT" && pnpm -C frontend run test:tier0 2>&1) \
    > "$CI_LOG_DIR/${label}.log" 2>&1 || exit_code=$?

  if [ $exit_code -eq 0 ]; then
    log_ok "CI   ${label} — passed"
  else
    log_fail "CI   ${label} — FAILED (blocking)"
    append_requirement "$CI_REQ_FILE" "ci-gate" "$label" \
      "Frontend unit tests must pass" "ci-probe"
  fi
}

gate_frontend_build() {
  local label="frontend-build"
  log_info "CI Gate: $label"
  mkdir -p "$CI_LOG_DIR"

  if ! command -v pnpm &>/dev/null; then
    return 0
  fi

  local exit_code=0
  (cd "$REPO_ROOT" && pnpm -C frontend run build 2>&1) \
    > "$CI_LOG_DIR/${label}.log" 2>&1 || exit_code=$?

  if [ $exit_code -eq 0 ]; then
    log_ok "CI   ${label} — passed"
  else
    log_fail "CI   ${label} — FAILED (blocking)"
    append_requirement "$CI_REQ_FILE" "ci-gate" "$label" \
      "Frontend build must pass" "ci-probe"
  fi
}

gate_backend_restore() {
  local label="backend-restore"
  log_info "CI Gate: $label"
  mkdir -p "$CI_LOG_DIR"

  if ! command -v dotnet &>/dev/null; then
    log_fail "CI   ${label} — dotnet not available"
    append_requirement "$CI_REQ_FILE" "ci-gate" "$label" \
      "dotnet SDK required for backend restore" "ci-probe"
    return 0
  fi

  local exit_code=0
  (cd "$REPO_ROOT" && dotnet restore backend/TerraFusion.sln 2>&1) \
    > "$CI_LOG_DIR/${label}.log" 2>&1 || exit_code=$?

  if [ $exit_code -eq 0 ]; then
    log_ok "CI   ${label} — passed"
  else
    log_fail "CI   ${label} — FAILED (blocking)"
    append_requirement "$CI_REQ_FILE" "ci-gate" "$label" \
      "dotnet restore must pass (NuGet source access required)" "ci-probe"
  fi
}

gate_backend_build() {
  local label="backend-build"
  log_info "CI Gate: $label"
  mkdir -p "$CI_LOG_DIR"

  if ! command -v dotnet &>/dev/null; then
    return 0
  fi

  local exit_code=0
  (cd "$REPO_ROOT" && dotnet build backend/TerraFusion.sln -c Release --no-restore 2>&1) \
    > "$CI_LOG_DIR/${label}.log" 2>&1 || exit_code=$?

  if [ $exit_code -eq 0 ]; then
    log_ok "CI   ${label} — passed"
  else
    log_fail "CI   ${label} — FAILED (blocking)"
    append_requirement "$CI_REQ_FILE" "ci-gate" "$label" \
      "dotnet build must pass" "ci-probe"
  fi
}

gate_governance() {
  local label="governance"
  log_info "CI Gate: $label"
  mkdir -p "$CI_LOG_DIR"

  # Governance checks are pure git — no network required
  local exit_code=0
  (cd "$REPO_ROOT" && {
    # Check forbidden paths
    echo "Checking AGENTS.md compliance..."
    test -f backend/TerraFusion.sln || { echo "Missing backend/TerraFusion.sln"; exit 1; }
    test -f platform.json || { echo "Missing platform.json"; exit 1; }
    echo "Critical files present"

    # Platform lint
    if [ -f scripts/platform-lint.mjs ] && command -v node &>/dev/null; then
      node scripts/platform-lint.mjs
    else
      echo "platform-lint: skipped (script or node not available)"
    fi
  }) > "$CI_LOG_DIR/${label}.log" 2>&1 || exit_code=$?

  if [ $exit_code -eq 0 ]; then
    log_ok "CI   ${label} — passed"
  else
    log_fail "CI   ${label} — FAILED (blocking)"
    append_requirement "$CI_REQ_FILE" "ci-gate" "$label" \
      "Governance checks must pass" "ci-probe"
  fi
}

# ── Main ───────────────────────────────────────────────────────────────────────
run_ci_probe() {
  log_phase "CI PR-GATE PROBE (8 JOBS)"
  ensure_evidence_dir
  echo '[]' > "$CI_REQ_FILE"

  local total=8
  local passed=0
  local failed=0

  # Run each gate sequentially (mirrors CI execution order)
  for gate_fn in \
    gate_classify \
    gate_frontend_lint \
    gate_frontend_typecheck \
    gate_frontend_test \
    gate_frontend_build \
    gate_backend_restore \
    gate_backend_build \
    gate_governance; do

    if $gate_fn; then
      ((passed++)) || true
    else
      ((failed++)) || true
    fi
  done

  echo ""
  log_info "CI probe complete: ${passed}/${total} gates passed, ${failed} failed"

  if command -v jq &>/dev/null && [ -f "$CI_REQ_FILE" ]; then
    local req_count
    req_count=$(jq 'length' "$CI_REQ_FILE" 2>/dev/null || echo "0")
    if [ "$req_count" -gt 0 ]; then
      log_warn "CI requirements discovered: ${req_count}"
    fi
  fi
}

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  run_ci_probe
fi
