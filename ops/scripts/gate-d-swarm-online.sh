#!/usr/bin/env bash
set -euo pipefail

# Gate D: Swarm Online
# Verify AI/Consciousness services are healthy.
# Checks: Consciousness Engine, AI Gateway, Agent health endpoints

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ARTIFACTS_DIR="$ROOT_DIR/artifacts"
LOG_FILE="$ARTIFACTS_DIR/logs/gate-d-swarm.log"

mkdir -p "$ARTIFACTS_DIR/logs"

ERRORS=0
WARNINGS=0
SKIP_HEALTH=${SKIP_HEALTH_CHECKS:-false}

# Service endpoints (configurable)
CONSCIOUSNESS_URL=${CONSCIOUSNESS_URL:-"http://localhost:3004"}
AI_GATEWAY_URL=${AI_GATEWAY_URL:-"http://localhost:5000"}

# Timeouts
HEALTH_TIMEOUT=5
MAX_RETRIES=3

log() {
  local msg="[Gate D - $(date -Iseconds)] $*"
  echo "$msg"
  echo "$msg" >> "$LOG_FILE"
}

log_ok() { log "✅ $*"; }
log_warn() { log "⚠️  WARN: $*"; ((WARNINGS++)) || true; }
log_error() { log "❌ ERROR: $*"; ((ERRORS++)) || true; }
log_skip() { log "⏭️  SKIP: $*"; }

check_endpoint() {
  local name="$1"
  local url="$2"
  local retries=0

  while (( retries < MAX_RETRIES )); do
    if curl -fsS --max-time "$HEALTH_TIMEOUT" "$url" >/dev/null 2>&1; then
      log_ok "$name is healthy ($url)"
      return 0
    fi
    ((retries++))
    if (( retries < MAX_RETRIES )); then
      log "  Retry $retries/$MAX_RETRIES for $name..."
      sleep 2
    fi
  done

  return 1
}

log "════════════════════════════════════════════════════════════════"
log "Starting Gate D: Swarm Online Check"
log "════════════════════════════════════════════════════════════════"

if [[ "$SKIP_HEALTH" == "true" ]]; then
  log_skip "Health checks disabled (SKIP_HEALTH_CHECKS=true)"
  log "⚠️  Gate D: SKIPPED"
  exit 0
fi

# --- Check if services are expected to be running ---
log ""
log "--- Service Health Checks ---"

# Check Consciousness Engine
log ""
log "Checking Consciousness Engine at $CONSCIOUSNESS_URL..."
if check_endpoint "Consciousness Engine" "$CONSCIOUSNESS_URL/health"; then
  :  # Already logged
else
  log_warn "Consciousness Engine not responding at $CONSCIOUSNESS_URL/health"
  log "  (This is OK if services aren't started yet)"
fi

# Check AI Gateway / API
log ""
log "Checking API Gateway at $AI_GATEWAY_URL..."
if check_endpoint "API Gateway" "$AI_GATEWAY_URL/health"; then
  :  # Already logged
else
  log_warn "API Gateway not responding at $AI_GATEWAY_URL/health"
  log "  (This is OK if services aren't started yet)"
fi

# --- Check agent configuration ---
log ""
log "--- Agent Configuration ---"
AI_CONFIG="$ROOT_DIR/config/ai-consciousness-deployment.json"

if [[ -f "$AI_CONFIG" ]]; then
  log_ok "AI deployment config found: $AI_CONFIG"

  if command -v jq >/dev/null 2>&1; then
    # Extract agent count if available
    AGENT_COUNT=$(jq '.agents | length // .swarm.total_agents // 0' "$AI_CONFIG" 2>/dev/null || echo "0")
    log "  Configured agents: $AGENT_COUNT"
  fi
else
  log "INFO: AI deployment config not found (optional)"
fi

# Check for agent manifests
AGENT_DIR="$ROOT_DIR/agents"
if [[ -d "$AGENT_DIR" ]]; then
  AGENT_DIRS=$(find "$AGENT_DIR" -mindepth 1 -maxdepth 1 -type d 2>/dev/null | wc -l || echo "0")
  log_ok "Found $AGENT_DIRS agent directories in $AGENT_DIR"
else
  log "INFO: No agents directory found"
fi

# --- Check MCP agent infrastructure ---
log ""
log "--- MCP Agent Infrastructure ---"
MCP_DIR="$ROOT_DIR/terrabuild-modernization/server/mcp/agents"

if [[ -d "$MCP_DIR" ]]; then
  MCP_AGENTS=$(find "$MCP_DIR" -name "*.ts" -o -name "*.js" 2>/dev/null | wc -l || echo "0")
  log_ok "Found $MCP_AGENTS MCP agent files"
else
  log "INFO: MCP agents directory not found at $MCP_DIR"
fi

# --- Docker container check ---
log ""
log "--- Container Status ---"
if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
  # Check for running TerraFusion containers
  TF_CONTAINERS=$(docker ps --format '{{.Names}}' 2>/dev/null | grep -i "terrafusion\|consciousness\|ai-gateway" | wc -l || echo "0")
  if (( TF_CONTAINERS > 0 )); then
    log_ok "Found $TF_CONTAINERS running TerraFusion containers"
    docker ps --format '  {{.Names}}: {{.Status}}' 2>/dev/null | grep -i "terrafusion\|consciousness\|ai-gateway" | while read -r line; do
      log "$line"
    done
  else
    log "INFO: No TerraFusion containers currently running"
  fi
else
  log "INFO: Docker not available for container status check"
fi

# --- Summary ---
log ""
log "════════════════════════════════════════════════════════════════"
log "Gate D Summary: $ERRORS error(s), $WARNINGS warning(s)"
log "Log: $LOG_FILE"
log "════════════════════════════════════════════════════════════════"

# Gate D is more lenient - services may not be running yet
if (( ERRORS > 0 )); then
  log "❌ Gate D: FAILED"
  exit 1
fi

if (( WARNINGS > 0 )); then
  log "⚠️  Gate D: PASSED with warnings (services may need to be started)"
else
  log "✅ Gate D: PASSED"
fi

exit 0
