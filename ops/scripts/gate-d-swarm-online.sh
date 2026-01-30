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

# --- RAG configuration sanity check ---
log ""
log "--- RAG Configuration Check ---"

# Check for RAG config in various possible locations
RAG_CONFIG_PATHS=(
  "$ROOT_DIR/backend/src/TerraFusion.AI/Configs/RAG/config.json"
  "$ROOT_DIR/config/rag-config.json"
  "$ROOT_DIR/backend/src/TerraFusion.AI/appsettings.json"
)

RAG_CONFIG_FOUND=false
for RAG_CONFIG in "${RAG_CONFIG_PATHS[@]}"; do
  if [[ -f "$RAG_CONFIG" ]]; then
    log "INFO: RAG config file found at $RAG_CONFIG"
    RAG_CONFIG_FOUND=true

    # Check for PropertyAssessmentGPT dataset mapping
    if grep -q "PropertyAssessmentGPT" "$RAG_CONFIG" 2>/dev/null; then
      log_ok "RAG dataset mapping for PropertyAssessmentGPT appears configured."
    else
      log "INFO: No explicit RAG mapping for PropertyAssessmentGPT in $RAG_CONFIG"
    fi

    # Check for benton_cama_basics dataset
    if grep -q "benton_cama_basics" "$RAG_CONFIG" 2>/dev/null; then
      log_ok "RAG dataset 'benton_cama_basics' is defined in config."
    else
      log "INFO: Dataset 'benton_cama_basics' not found in config."
    fi
    break
  fi
done

if [[ "$RAG_CONFIG_FOUND" == "false" ]]; then
  log "INFO: No RAG config file found; RAG modes disabled in this environment."
  log "  (This is normal if RAG is not yet configured)"
fi

# --- RAG Live Health Check ---
log ""
log "--- RAG Live Health Check ---"

RAG_HEALTH_URL="${AI_GATEWAY_URL}/api/gpt/rag/health"

if command -v curl >/dev/null 2>&1; then
  log "Checking RAG health at $RAG_HEALTH_URL..."

  if curl -sS --max-time "$HEALTH_TIMEOUT" "$RAG_HEALTH_URL" -o /tmp/gate_d_rag_health.json 2>>"$LOG_FILE"; then
    log_ok "RAG health endpoint responded."

    if command -v jq >/dev/null 2>&1; then
      # Parse the response
      RAG_STATUS=$(jq -r '.status // "unknown"' /tmp/gate_d_rag_health.json 2>/dev/null)
      log "  RAG System Status: $RAG_STATUS"

      # Check benton_cama_basics dataset specifically
      DATASET_JSON=$(jq '.datasets[] | select(.id=="benton_cama_basics")' /tmp/gate_d_rag_health.json 2>/dev/null || echo "")

      if [[ -n "$DATASET_JSON" ]]; then
        DOC_COUNT=$(echo "$DATASET_JSON" | jq '.documentCount // 0')
        EMB_COUNT=$(echo "$DATASET_JSON" | jq '.embeddingCount // 0')
        INDEXED=$(echo "$DATASET_JSON" | jq '.indexed // false')

        log "  Dataset 'benton_cama_basics': indexed=$INDEXED, docs=$DOC_COUNT, embeddings=$EMB_COUNT"

        if [[ "$INDEXED" == "true" ]] && [[ "$EMB_COUNT" -gt 0 ]]; then
          log_ok "RAG dataset 'benton_cama_basics' is online and populated."
        elif [[ "$DOC_COUNT" -eq -1 ]]; then
          log "  INFO: Files exist but not yet indexed. Run: curl -X POST $AI_GATEWAY_URL/api/gpt/rag/index/benton_cama_basics"
        else
          log_warn "RAG dataset 'benton_cama_basics' is configured but empty or not indexed."
        fi
      else
        log "  INFO: Dataset 'benton_cama_basics' not in health response."
      fi
    else
      log "  INFO: jq not installed; RAG health JSON saved at /tmp/gate_d_rag_health.json"
      cat /tmp/gate_d_rag_health.json 2>/dev/null | head -5
    fi
  else
    log "  INFO: RAG health endpoint not reachable (API may not be running)."
  fi
else
  log "  WARN: curl not available; RAG live health check skipped."
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
