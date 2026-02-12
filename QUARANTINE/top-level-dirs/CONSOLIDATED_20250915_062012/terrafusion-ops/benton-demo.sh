#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
ROOT_DIR=$(cd "$SCRIPT_DIR/.." && pwd)
CHAIN_DIR="$SCRIPT_DIR/benton"
LOG_DIR="$ROOT_DIR/artifacts/benton/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/run.log"

# Pretty logging
log() { echo -e "[$(date +%H:%M:%S)] $*" | tee -a "$LOG_FILE"; }
fail() { echo -e "[$(date +%H:%M:%S)] ❌ $*" | tee -a "$LOG_FILE"; exit 1; }

# Load env
ENV_FILE="$ROOT_DIR/.env.benton"
if [[ ! -f "$ENV_FILE" ]]; then
  cp "$ROOT_DIR/.env.benton.example" "$ENV_FILE"
  log "Created .env.benton from template. Review if needed."
fi
set -a; source "$ENV_FILE"; set +a

# Step runner with timing and per-step logs
run_step() {
  local step="$1"; shift
  local name=$(basename "$step")
  local step_log="$LOG_DIR/${name%.sh}.log"
  log "▶️  Running $name"
  SECONDS=0
  if bash "$step" "$@" 2>&1 | tee -a "$step_log"; then
    log "✅ Completed $name in ${SECONDS}s"
  else
    fail "Step $name failed. See $step_log"
  fi
}

# Chain (idempotent)
run_step "$CHAIN_DIR/00_bootstrap.sh"
run_step "$CHAIN_DIR/01_validate_prereqs.sh"
run_step "$CHAIN_DIR/02_prepare_env.sh"
run_step "$CHAIN_DIR/03_provision_infra.sh"
run_step "$CHAIN_DIR/04_seed_data.sh"
run_step "$CHAIN_DIR/05_start_services.sh"
run_step "$CHAIN_DIR/06_run_tests.sh"
run_step "$CHAIN_DIR/07_run_demo.sh"
run_step "$CHAIN_DIR/08_collect_artifacts.sh"

log "🎉 Benton County demo chain complete. Artifacts: $LOG_DIR"
