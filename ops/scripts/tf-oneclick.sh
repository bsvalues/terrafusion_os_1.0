#!/usr/bin/env bash
set -euo pipefail

# TerraFusion OneClick Runbook - Phase 1 (Scaffold)
# - Ensures artifact directories exist
# - Runs Gate A–F in order
# - Stops on first failure

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SCRIPTS_DIR="$ROOT_DIR/ops/scripts"
ARTIFACTS_DIR="$ROOT_DIR/artifacts"

mkdir -p "$ARTIFACTS_DIR"/{logs,reports,sbom,lineage}

log() {
  echo "[$(date -Iseconds)] $*"
}

run_gate() {
  local gate_script="$1"

  log "=== RUNNING: $gate_script ==="

  if ! bash "$SCRIPTS_DIR/$gate_script"; then
    log "!!! FAILED: $gate_script"
    exit 1
  fi

  log "=== SUCCESS: $gate_script ==="
}

log "TerraFusion OneClick Runbook starting..."
log "ROOT_DIR=$ROOT_DIR"

run_gate "gate-a-preflight.sh"
run_gate "gate-b-security-baseline.sh"
run_gate "gate-c-core-bringup.sh"
run_gate "gate-d-swarm-online.sh"
run_gate "gate-e-api-surface.sh"
run_gate "gate-f-validate-all.sh"

log "TerraFusion OneClick Runbook completed successfully."
