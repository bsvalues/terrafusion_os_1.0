#!/usr/bin/env bash
set -euo pipefail

# Gate E: API Surface Check
# Verifies:
#   - API is reachable on a known base URL
#   - /health responds with HTTP 200
#   - /api/gpt/system responds with HTTP 200
#   - /api/gpt/system includes PropertyAssessmentGPT (or at least one system GPT)

ROOT_DIR="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
ARTIFACTS_DIR="$ROOT_DIR/artifacts"
LOG_FILE="$ARTIFACTS_DIR/logs/gate-e-api-surface.log"

mkdir -p "$(dirname "$LOG_FILE")"

log() {
  echo "[Gate E - $(date -Iseconds)] $*"
  echo "[Gate E - $(date -Iseconds)] $*" >> "$LOG_FILE"
}

errors=0
warnings=0

increment_error() {
  errors=$((errors + 1))
}

increment_warning() {
  warnings=$((warnings + 1))
}

require_cmd() {
  local cmd="$1"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    log "ERROR: Required command not found: $cmd"
    increment_error
    exit 1
  fi
}

# Allow override via env; default to localhost:5000
API_BASE_URL="${TF_API_BASE_URL:-http://localhost:5000}"

log "════════════════════════════════════════════════════════════════"
log "Starting Gate E: API Surface Check"
log "ROOT_DIR=$ROOT_DIR"
log "API_BASE_URL=$API_BASE_URL"
log "Log file: $LOG_FILE"
log "════════════════════════════════════════════════════════════════"
log ""

# -----------------------------------------------------------------------------
# 0) Tooling
# -----------------------------------------------------------------------------

require_cmd curl

# -----------------------------------------------------------------------------
# Skip live checks if running in CI without a backend
# -----------------------------------------------------------------------------
if [[ "${SKIP_LIVE_CHECKS:-false}" == "true" ]]; then
  log "INFO: SKIP_LIVE_CHECKS=true — skipping live endpoint verification."
  log "INFO: This is expected in CI where the backend is not running."
  log "✅ Gate E: PASSED (live checks skipped)"
  exit 0
fi

if command -v jq >/dev/null 2>&1; then
  HAS_JQ=1
  log "INFO: jq found - will use it for JSON assertions."
else
  HAS_JQ=0
  log "INFO: jq not found - falling back to grep for JSON assertions."
fi

log ""

# -----------------------------------------------------------------------------
# 1) Health endpoint
# -----------------------------------------------------------------------------

log "--- Checking /health endpoint ---"

HEALTH_URL="$API_BASE_URL/health"

if ! HEALTH_RESP="$(curl -sS -w '%{http_code}' -o /tmp/gate_e_health_body.txt "$HEALTH_URL" 2>>"$LOG_FILE")"; then
  log "ERROR: Failed to call $HEALTH_URL"
  increment_error
else
  log "INFO: /health HTTP status: $HEALTH_RESP"
  if [[ "$HEALTH_RESP" != "200" ]]; then
    log "ERROR: /health did not return 200 (got $HEALTH_RESP)"
    increment_error
  else
    log "✅ /health returned 200 OK"
  fi
fi

log ""

# -----------------------------------------------------------------------------
# 2) GPT system catalog
# -----------------------------------------------------------------------------

log "--- Checking /api/gpt/system ---"

GPT_SYSTEM_URL="$API_BASE_URL/api/gpt/system"

if ! GPT_STATUS="$(curl -sS -w '%{http_code}' -o /tmp/gate_e_gpt_system_body.txt "$GPT_SYSTEM_URL" 2>>"$LOG_FILE")"; then
  log "ERROR: Failed to call $GPT_SYSTEM_URL"
  increment_error
else
  log "INFO: /api/gpt/system HTTP status: $GPT_STATUS"
  if [[ "$GPT_STATUS" != "200" ]]; then
    log "ERROR: /api/gpt/system did not return 200 (got $GPT_STATUS)"
    increment_error
  else
    log "✅ /api/gpt/system returned 200 OK"
  fi
fi

# If we got 200, do a quick sanity check on body
if [[ "${GPT_STATUS:-}" == "200" ]]; then
  GPT_BODY="$(cat /tmp/gate_e_gpt_system_body.txt)"

  if [[ $HAS_JQ -eq 1 ]]; then
    # Expect at least one GPT configuration
    COUNT="$(echo "$GPT_BODY" | jq 'length' 2>/dev/null || echo "0")"
    log "INFO: System GPT count according to jq: $COUNT"
    if [[ "$COUNT" -lt 1 ]]; then
      log "ERROR: /api/gpt/system returned an empty list of GPTs."
      increment_error
    else
      log "✅ /api/gpt/system returned at least one GPT."
    fi

    # Optional: look for PropertyAssessmentGPT by key or name
    if echo "$GPT_BODY" | jq -e '.[] | select(.key=="PropertyAssessmentGPT" or .name=="Property Assessment GPT" or .name=="PropertyAssessmentGPT")' >/dev/null 2>&1; then
      log "✅ PropertyAssessmentGPT found in system catalog."
    else
      log "⚠️  WARN: PropertyAssessmentGPT not found in system catalog (may be OK if not yet seeded)."
      increment_warning
    fi
  else
    # Fallback: just check non-empty and look for a GPT-like string
    if [[ -n "$GPT_BODY" ]]; then
      log "✅ /api/gpt/system body is non-empty."
      if echo "$GPT_BODY" | grep -qi "PropertyAssessmentGPT"; then
        log "✅ PropertyAssessmentGPT found in system catalog (via grep)."
      else
        log "⚠️  WARN: PropertyAssessmentGPT not clearly present in body."
        increment_warning
      fi
    else
      log "ERROR: /api/gpt/system body is empty."
      increment_error
    fi
  fi
fi

log ""
log "════════════════════════════════════════════════════════════════"
log "Gate E Summary: $errors error(s), $warnings warning(s)"
log "Log written to: $LOG_FILE"
log "════════════════════════════════════════════════════════════════"

if ((errors > 0)); then
  log "❌ Gate E: FAILED"
  exit 1
elif ((warnings > 0)); then
  log "⚠️  Gate E: PASSED with warnings"
  exit 0
else
  log "✅ Gate E: PASSED clean"
  exit 0
fi
