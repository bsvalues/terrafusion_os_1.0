#!/usr/bin/env bash
set -euo pipefail

# Gate E: API Surface
# Validate API contracts, OpenAPI specs, health probes, GraphQL schema

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ARTIFACTS_DIR="$ROOT_DIR/artifacts"
REPORTS_DIR="$ARTIFACTS_DIR/reports"
LOG_FILE="$ARTIFACTS_DIR/logs/gate-e-api.log"

mkdir -p "$REPORTS_DIR" "$ARTIFACTS_DIR/logs"

ERRORS=0
WARNINGS=0
SKIP_LIVE=${SKIP_LIVE_CHECKS:-false}

# API endpoints
API_URL=${API_URL:-"http://localhost:5000"}
GATEWAY_URL=${GATEWAY_URL:-"http://localhost:3002"}

log() {
  local msg="[Gate E - $(date -Iseconds)] $*"
  echo "$msg"
  echo "$msg" >> "$LOG_FILE"
}

log_ok() { log "✅ $*"; }
log_warn() { log "⚠️  WARN: $*"; ((WARNINGS++)) || true; }
log_error() { log "❌ ERROR: $*"; ((ERRORS++)) || true; }
log_skip() { log "⏭️  SKIP: $*"; }

log "════════════════════════════════════════════════════════════════"
log "Starting Gate E: API Surface Validation"
log "════════════════════════════════════════════════════════════════"

# --- OpenAPI Spec Validation ---
log ""
log "--- OpenAPI Specification ---"

# Find OpenAPI specs
OPENAPI_SPECS=(
  "$ROOT_DIR/docs/api/openapi.yaml"
  "$ROOT_DIR/docs/api/openapi.json"
  "$ROOT_DIR/backend/TerraFusion.API/openapi.json"
  "$ROOT_DIR/api/openapi.yaml"
)

FOUND_SPEC=""
for spec in "${OPENAPI_SPECS[@]}"; do
  if [[ -f "$spec" ]]; then
    FOUND_SPEC="$spec"
    log_ok "Found OpenAPI spec: $spec"
    break
  fi
done

if [[ -z "$FOUND_SPEC" ]]; then
  log "INFO: No OpenAPI specification found in standard locations"
  log "      Consider generating one from controllers"
fi

# Validate OpenAPI spec if spectral is available
if [[ -n "$FOUND_SPEC" ]] && command -v spectral >/dev/null 2>&1; then
  log "Validating OpenAPI spec with Spectral..."
  SPECTRAL_REPORT="$REPORTS_DIR/spectral-report.json"
  if spectral lint "$FOUND_SPEC" --format json --output "$SPECTRAL_REPORT" 2>/dev/null; then
    log_ok "OpenAPI spec validation passed"
  else
    log_warn "OpenAPI spec has linting issues (see $SPECTRAL_REPORT)"
  fi
fi

# --- Controller/Route Inventory ---
log ""
log "--- API Controllers ---"

# .NET Controllers
if [[ -d "$ROOT_DIR/backend" ]]; then
  CONTROLLERS=$(find "$ROOT_DIR/backend" -name "*Controller.cs" -type f 2>/dev/null | wc -l || echo "0")
  log_ok "Found $CONTROLLERS .NET API controllers"

  # List controller names
  if (( CONTROLLERS > 0 )) && (( CONTROLLERS <= 20 )); then
    find "$ROOT_DIR/backend" -name "*Controller.cs" -type f 2>/dev/null | while read -r f; do
      log "  - $(basename "$f" .cs)"
    done
  fi
fi

# Express/Node routes
if [[ -d "$ROOT_DIR/terrabuild-modernization/server" ]]; then
  ROUTES=$(find "$ROOT_DIR/terrabuild-modernization/server" -name "*.ts" -path "*/routes/*" 2>/dev/null | wc -l || echo "0")
  if (( ROUTES > 0 )); then
    log_ok "Found $ROUTES Node.js route files"
  fi
fi

# --- Ocelot Gateway Configuration ---
log ""
log "--- API Gateway Configuration ---"
OCELOT_CONFIG="$ROOT_DIR/backend/TerraFusion.Gateway/ocelot.json"

if [[ -f "$OCELOT_CONFIG" ]]; then
  log_ok "Ocelot gateway config found"

  if command -v jq >/dev/null 2>&1; then
    ROUTE_COUNT=$(jq '.Routes | length // 0' "$OCELOT_CONFIG" 2>/dev/null || echo "0")
    log "  Configured routes: $ROUTE_COUNT"
  fi
else
  log "INFO: Ocelot gateway config not found at $OCELOT_CONFIG"
fi

# --- Live API Health Checks ---
log ""
log "--- Live API Checks ---"

if [[ "$SKIP_LIVE" == "true" ]]; then
  log_skip "Live API checks disabled (SKIP_LIVE_CHECKS=true)"
else
  # Check API health endpoint
  if curl -fsS --max-time 5 "$API_URL/health" >/dev/null 2>&1; then
    log_ok "API health endpoint responding at $API_URL/health"

    # Try to get OpenAPI from running service
    if curl -fsS --max-time 5 "$API_URL/swagger/v1/swagger.json" -o "$REPORTS_DIR/live-openapi.json" 2>/dev/null; then
      log_ok "Retrieved live OpenAPI spec from running service"
    fi
  else
    log "INFO: API not responding at $API_URL (service may not be running)"
  fi

  # Check Gateway
  if curl -fsS --max-time 5 "$GATEWAY_URL/health" >/dev/null 2>&1; then
    log_ok "Gateway health endpoint responding at $GATEWAY_URL/health"
  else
    log "INFO: Gateway not responding at $GATEWAY_URL"
  fi
fi

# --- API Contract Tests ---
log ""
log "--- API Contract Tests ---"

# Check for contract test files
CONTRACT_TESTS="$ROOT_DIR/backend/tests/TerraFusion.Integration.Tests"
if [[ -d "$CONTRACT_TESTS" ]]; then
  TEST_COUNT=$(find "$CONTRACT_TESTS" -name "*Tests.cs" -type f 2>/dev/null | wc -l || echo "0")
  log_ok "Found $TEST_COUNT API integration test files"
else
  log "INFO: No integration test directory found"
fi

# --- GraphQL Schema (if present) ---
log ""
log "--- GraphQL Schema ---"
GRAPHQL_SCHEMAS=(
  "$ROOT_DIR/backend/TerraFusion.API/schema.graphql"
  "$ROOT_DIR/api/schema.graphql"
  "$ROOT_DIR/graphql/schema.graphql"
)

for schema in "${GRAPHQL_SCHEMAS[@]}"; do
  if [[ -f "$schema" ]]; then
    log_ok "GraphQL schema found: $schema"
    break
  fi
done

# --- Summary ---
log ""
log "════════════════════════════════════════════════════════════════"
log "Gate E Summary: $ERRORS error(s), $WARNINGS warning(s)"
log "Reports: $REPORTS_DIR"
log "Log: $LOG_FILE"
log "════════════════════════════════════════════════════════════════"

if (( ERRORS > 0 )); then
  log "❌ Gate E: FAILED"
  exit 1
fi

if (( WARNINGS > 0 )); then
  log "⚠️  Gate E: PASSED with warnings"
else
  log "✅ Gate E: PASSED"
fi

exit 0
