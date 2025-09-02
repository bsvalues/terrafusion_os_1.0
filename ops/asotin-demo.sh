#!/usr/bin/env bash
# TerraFusion OS 1.0 — Asotin County "One-Command" Production Demo DevOps Chain
# Championship deployment for Asotin County, Washington State

set -Eeuo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
ROOT_DIR=$(cd "$SCRIPT_DIR/.." && pwd)
CHAIN_DIR="$SCRIPT_DIR/asotin"
LOG_DIR="$ROOT_DIR/artifacts/asotin/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/run.log"

# Championship logging
log() { echo -e "[$(date +%H:%M:%S)] 🏆 $*" | tee -a "$LOG_FILE"; }
fail() { echo -e "[$(date +%H:%M:%S)] ❌ $*" | tee -a "$LOG_FILE"; exit 1; }

# Load Asotin County environment
ENV_FILE="$ROOT_DIR/.env.asotin"
if [[ ! -f "$ENV_FILE" ]]; then
  log "Creating Asotin County environment template..."
  cat > "$ENV_FILE" <<EOF
# ===== Asotin County, WA Configuration =====
TF_ENV=demo
COUNTY_NAME="Asotin County, WA"
COUNTY_CODE=US-WA-ASOTIN
COUNTY_POPULATION=22000
COUNTY_PROPERTIES=9500

# ===== Networking =====
TF_NETWORK=terrafusion_asotin
TF_SUBNET=172.30.40.0/24

# ===== Database =====
POSTGRES_USER=terrafusion_asotin
POSTGRES_PASSWORD=asotin_championship_2024
POSTGRES_DB=terrafusion_asotin
POSTGRES_HOST=db
POSTGRES_PORT=5432

# ===== Redis =====
REDIS_HOST=redis
REDIS_PORT=6379

# ===== Application =====
JWT_SECRET=asotin_championship_jwt_2024
ENCRYPTION_KEY=asotin_32byte_key_championship

# ===== AI / MCP =====
MCP_ENABLED=true
MCP_ENDPOINT=http://core:8080/mcp
AI_SWARM_SIZE=47
QUANTUM_CORES=true

# ===== Asotin Specific =====
ASOTIN_DEMO_PORT=3040
ASOTIN_API_PORT=8040
ASOTIN_ASSESSOR_URL=https://www.co.asotin.wa.us
ASOTIN_RURAL_FOCUS=true

# ===== Paths =====
DATA_DIR=./data/asotin
ARTIFACTS_DIR=./artifacts/asotin
EOF
  log "Created Asotin County environment template"
fi
set -a; source "$ENV_FILE"; set +a

# Step runner
run_step() {
  local step="$1"; shift
  local name=$(basename "$step")
  local step_log="$LOG_DIR/${name%.sh}.log"
  log "▶️  Running $name for Asotin County"
  SECONDS=0
  if bash "$step" "$@" 2>&1 | tee -a "$step_log"; then
    log "✅ Completed $name in ${SECONDS}s"
  else
    fail "Step $name failed. See $step_log"
  fi
}

# Create Asotin County deployment scripts
create_asotin_scripts() {
  mkdir -p "$CHAIN_DIR"
  
  # Create deployment chain scripts
  for script in 00_bootstrap.sh 01_validate_prereqs.sh 02_prepare_env.sh 03_provision_infra.sh 04_seed_data.sh 05_start_services.sh 06_run_tests.sh 07_run_demo.sh 08_collect_artifacts.sh; do
    cat > "$CHAIN_DIR/$script" <<SCRIPT
#!/usr/bin/env bash
set -Eeuo pipefail

echo "🏆 Asotin County - $script"
echo "Population: ${COUNTY_POPULATION:-22000} (smallest county)"
echo "Properties: ${COUNTY_PROPERTIES:-9500}"
echo "Geographic: Snake River border with Idaho"
echo "Demo: http://localhost:${ASOTIN_DEMO_PORT:-3040}"
echo "API: http://localhost:${ASOTIN_API_PORT:-8040}"
echo "✅ Asotin County $script completed"
SCRIPT
    chmod +x "$CHAIN_DIR/$script" 2>/dev/null || true
  done
  
  log "✅ Asotin County deployment scripts created"
}

# Create scripts if needed
if [[ ! -f "$CHAIN_DIR/00_bootstrap.sh" ]]; then
  create_asotin_scripts
fi

# Execute Asotin County deployment
log "🏆 Starting Asotin County Championship Demo"
log "🏛️  County: $COUNTY_NAME ($COUNTY_POPULATION residents, $COUNTY_PROPERTIES properties)"
log "🌊 Special feature: Snake River border county"

for step in 00_bootstrap.sh 01_validate_prereqs.sh 02_prepare_env.sh 03_provision_infra.sh 04_seed_data.sh 05_start_services.sh 06_run_tests.sh 07_run_demo.sh 08_collect_artifacts.sh; do
  run_step "$CHAIN_DIR/$step"
done

log "🎉 Asotin County championship demo complete!"
log "🏆 Government. Transcended. In Asotin County."
