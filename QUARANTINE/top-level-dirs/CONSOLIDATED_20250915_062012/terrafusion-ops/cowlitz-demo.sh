#!/usr/bin/env bash
# TerraFusion OS 1.0 — Cowlitz County "One-Command" Production Demo DevOps Chain
# Championship deployment for Cowlitz County, Washington State

set -Eeuo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
ROOT_DIR=$(cd "$SCRIPT_DIR/.." && pwd)
CHAIN_DIR="$SCRIPT_DIR/cowlitz"
LOG_DIR="$ROOT_DIR/artifacts/cowlitz/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/run.log"

# Championship logging
log() { echo -e "[$(date +%H:%M:%S)] 🏆 $*" | tee -a "$LOG_FILE"; }
fail() { echo -e "[$(date +%H:%M:%S)] ❌ $*" | tee -a "$LOG_FILE"; exit 1; }

# Load Cowlitz County environment
ENV_FILE="$ROOT_DIR/.env.cowlitz"
if [[ ! -f "$ENV_FILE" ]]; then
  cp "$ROOT_DIR/.env.cowlitz.example" "$ENV_FILE" 2>/dev/null || {
    log "Creating Cowlitz County environment template..."
    cat > "$ENV_FILE" <<EOF
# ===== Cowlitz County, WA Configuration =====
TF_ENV=demo
COUNTY_NAME="Cowlitz County, WA"
COUNTY_CODE=US-WA-COWLITZ
COUNTY_POPULATION=110000
COUNTY_PROPERTIES=45000

# ===== Networking =====
TF_NETWORK=terrafusion_cowlitz
TF_SUBNET=172.30.20.0/24

# ===== Database =====
POSTGRES_USER=terrafusion_cowlitz
POSTGRES_PASSWORD=terrafusion_cowlitz_secure_2024
POSTGRES_DB=terrafusion_cowlitz
POSTGRES_HOST=db
POSTGRES_PORT=\${{TF_POSTGRES_PORT:-5432}}

# ===== Redis =====
REDIS_HOST=redis
REDIS_PORT=\${{TF_POSTGRES_PORT:-5432}}

# ===== Application =====
JWT_SECRET=cowlitz_championship_jwt_secret_2024
ENCRYPTION_KEY=cowlitz_32byte_encryption_key_2024

# ===== AI / MCP =====
MCP_ENABLED=true
MCP_ENDPOINT=http://core:${TF_STATIC_PORT:-8080}/mcp
AI_SWARM_SIZE=252
QUANTUM_CORES=true

# ===== Paths =====
DATA_DIR=./data/cowlitz
ARTIFACTS_DIR=./artifacts/cowlitz

# ===== Cowlitz Specific =====
COWLITZ_ASSESSOR_URL=https://www.co.cowlitz.wa.us/assessor
COWLITZ_GIS_ENDPOINT=https://gis.co.cowlitz.wa.us/arcgis/rest/services
COWLITZ_DEMO_PORT=\${{TF_POSTGRES_PORT:-5432}}
COWLITZ_API_PORT=\${{TF_POSTGRES_PORT:-5432}}
EOF
  }
  log "Created .env.cowlitz from template. Review if needed."
fi
set -a; source "$ENV_FILE"; set +a

# Step runner with championship timing
run_step() {
  local step="$1"; shift
  local name=$(basename "$step")
  local step_log="$LOG_DIR/${name%.sh}.log"
  log "▶️  Running $name for Cowlitz County"
  SECONDS=0
  if bash "$step" "$@" 2>&1 | tee -a "$step_log"; then
    log "✅ Completed $name in ${SECONDS}s"
  else
    fail "Step $name failed. See $step_log"
  fi
}

# Create Cowlitz County step scripts if they don't exist
create_cowlitz_scripts() {
  mkdir -p "$CHAIN_DIR"
  
  # 00_bootstrap.sh
  cat > "$CHAIN_DIR/00_bootstrap.sh" <<'BOOTSTRAP'
#!/usr/bin/env bash
set -Eeuo pipefail
: "${ROOT_DIR:=$(cd "$(dirname "${BASH_SOURCE[0]}")"/../.. && pwd)}"

echo "🏆 Bootstrapping Cowlitz County Championship Infrastructure"

mkdir -p "$ARTIFACTS_DIR" "$DATA_DIR"

# Create Cowlitz Docker network if missing
if ! docker network ls --format '{{.Name}}' | grep -q "^${TF_NETWORK}$"; then
  docker network create --subnet "$TF_SUBNET" "$TF_NETWORK"
  echo "✅ Created Cowlitz network: $TF_NETWORK"
fi

# Create Cowlitz data structure
mkdir -p "$DATA_DIR"/{parcels,assessments,sales,demographics}

echo "✅ Cowlitz County bootstrap complete."
BOOTSTRAP

  # 01_validate_prereqs.sh
  cat > "$CHAIN_DIR/01_validate_prereqs.sh" <<'PREREQS'
#!/usr/bin/env bash
set -Eeuo pipefail

echo "🔍 Validating Cowlitz County prerequisites..."

reqs=(docker docker-compose psql curl)
for bin in "${reqs[@]}"; do
  command -v "$bin" >/dev/null 2>&1 || { echo "❌ Missing dependency: $bin"; exit 1; }
done

# Cowlitz-specific validations
if [[ -z "${COWLITZ_DEMO_PORT:-}" ]]; then
  echo "❌ COWLITZ_DEMO_PORT not configured"
  exit 1
fi

echo "✅ Cowlitz County prerequisites validated."
PREREQS

  # 02_prepare_env.sh
  cat > "$CHAIN_DIR/02_prepare_env.sh" <<'PREPARE'
#!/usr/bin/env bash
set -Eeuo pipefail

echo "🏗️  Preparing Cowlitz County environment..."

# Ensure Cowlitz data directory structure
mkdir -p "$DATA_DIR"/{parcels,assessments,sales,zoning,boundaries}

# Create sample Cowlitz data if empty
if [[ -z $(ls -A "$DATA_DIR/parcels" 2>/dev/null || true) ]]; then
  cat > "$DATA_DIR/README.md" <<MD
# Cowlitz County Data Directory

Place Cowlitz County data files here:
- parcels/cowlitz_parcels.csv
- assessments/cowlitz_assessments.csv  
- sales/cowlitz_sales.csv
- zoning/cowlitz_zoning.geojson
- boundaries/cowlitz_boundaries.geojson

Population: 110,000
Properties: 45,000
Assessment URL: https://www.co.cowlitz.wa.us/assessor
MD
fi

echo "✅ Cowlitz County environment prepared."
PREPARE

  # 03_provision_infra.sh
  cat > "$CHAIN_DIR/03_provision_infra.sh" <<'PROVISION'
#!/usr/bin/env bash
set -Eeuo pipefail

echo "🚀 Provisioning Cowlitz County infrastructure..."

# Create Cowlitz-specific docker-compose override
cat > compose/docker-compose.cowlitz.yml <<COMPOSE
version: '3.8'
services:
  db:
    container_name: cowlitz-postgres
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    ports:
      - "5432:5432"
    networks: [ ${TF_NETWORK} ]

  redis:
    container_name: cowlitz-redis
    ports: ["6379:6379"]
    networks: [ ${TF_NETWORK} ]

  core:
    container_name: cowlitz-core
    environment:
      COUNTY_NAME: "${COUNTY_NAME}"
      COUNTY_CODE: "${COUNTY_CODE}"
      COWLITZ_DEMO_MODE: "true"
    ports: ["${COWLITZ_API_PORT}:${TF_STATIC_PORT:-8080}"]
    networks: [ ${TF_NETWORK} ]

  ui:
    container_name: cowlitz-ui
    environment:
      NEXT_PUBLIC_API_BASE: http://localhost:${COWLITZ_API_PORT}
      NEXT_PUBLIC_COUNTY_NAME: "${COUNTY_NAME}"
    ports: ["${COWLITZ_DEMO_PORT}:${TF_FRONTEND_PORT:-3102}"]
    networks: [ ${TF_NETWORK} ]

networks:
  ${TF_NETWORK}:
    external: true
COMPOSE

export COMPOSE_PROJECT_NAME=terrafusion_cowlitz
docker-compose -f compose/docker-compose.cowlitz.yml pull || true
docker-compose -f compose/docker-compose.cowlitz.yml up -d db redis

# Wait for Cowlitz Postgres
until docker exec cowlitz-postgres pg_isready -U "$POSTGRES_USER" >/dev/null 2>&1; do
  echo "⏳ Waiting for Cowlitz Postgres..."; sleep 2;
done

echo "✅ Cowlitz County infrastructure provisioned."
PROVISION

  # 04_seed_data.sh
  cat > "$CHAIN_DIR/04_seed_data.sh" <<'SEED'
#!/usr/bin/env bash
set -Eeuo pipefail

echo "📊 Seeding Cowlitz County data..."

# Create Cowlitz County schema
cat <<SQL | docker exec -i cowlitz-postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"
CREATE EXTENSION IF NOT EXISTS postgis;

-- Cowlitz County specific tables
CREATE TABLE IF NOT EXISTS cowlitz_parcels (
  parcel_id TEXT PRIMARY KEY,
  situs_address TEXT,
  city TEXT DEFAULT 'Longview',
  state TEXT DEFAULT 'WA',
  zip TEXT,
  land_sqft INT,
  bldg_sqft INT,
  year_built INT,
  lat DOUBLE PRECISION,
  lon DOUBLE PRECISION,
  zoning TEXT,
  cowlitz_district TEXT
);

CREATE TABLE IF NOT EXISTS cowlitz_assessments (
  parcel_id TEXT REFERENCES cowlitz_parcels(parcel_id),
  assessed_value BIGINT,
  tax_year INT,
  land_value BIGINT,
  improvement_value BIGINT,
  PRIMARY KEY(parcel_id, tax_year)
);

CREATE TABLE IF NOT EXISTS cowlitz_sales (
  parcel_id TEXT REFERENCES cowlitz_parcels(parcel_id),
  sale_date DATE,
  sale_price BIGINT,
  sale_type TEXT
);

-- Insert sample Cowlitz data
INSERT INTO cowlitz_parcels (parcel_id, situs_address, city, zip, land_sqft, bldg_sqft, year_built, lat, lon, zoning) VALUES
('CWL001', '123 Championship Way', 'Longview', '98632', 7200, 2100, 1995, 46.1382, -122.9382, 'R1'),
('CWL002', '456 Government Plaza', 'Kelso', '98626', 8500, 2800, 2001, 46.1479, -122.9079, 'R2'),
('CWL003', '789 County Road', 'Castle Rock', '98611', 12000, 3200, 1988, 46.2751, -122.9068, 'R1');

INSERT INTO cowlitz_assessments (parcel_id, assessed_value, tax_year, land_value, improvement_value) VALUES
('CWL001', 485000, 2024, 185000, 300000),
('CWL002', 625000, 2024, 225000, 400000),
('CWL003', 745000, 2024, 285000, 460000);

INSERT INTO cowlitz_sales (parcel_id, sale_date, sale_price, sale_type) VALUES
('CWL001', '2024-03-15', 495000, 'ARM'),
('CWL002', '2024-06-22', 635000, 'ARM');
SQL

echo "✅ Cowlitz County data seeded."
SEED

  # 05_start_services.sh
  cat > "$CHAIN_DIR/05_start_services.sh" <<'SERVICES'
#!/usr/bin/env bash
set -Eeuo pipefail

echo "🚀 Starting Cowlitz County services..."

export COMPOSE_PROJECT_NAME=terrafusion_cowlitz
docker-compose -f compose/docker-compose.cowlitz.yml up -d

# Wait for services to be ready
sleep 10

echo "✅ Cowlitz County services started."
echo "🌐 Cowlitz Demo: http://localhost:${COWLITZ_DEMO_PORT}"
echo "🔌 Cowlitz API: http://localhost:${COWLITZ_API_PORT}"
SERVICES

  # 06_run_tests.sh
  cat > "$CHAIN_DIR/06_run_tests.sh" <<'TESTS'
#!/usr/bin/env bash
set -Eeuo pipefail

echo "🧪 Running Cowlitz County quality gates..."

# Cowlitz API health check
curl -fsS "http://localhost:${COWLITZ_API_PORT}/health" || { echo "❌ Cowlitz API health failed"; exit 1; }

# Cowlitz DB connectivity
psql "postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:\${{TF_POSTGRES_PORT:-5432}}/${POSTGRES_DB}" -c "SELECT COUNT(*) FROM cowlitz_parcels;" >/dev/null

echo "✅ Cowlitz County quality gates passed."
TESTS

  # 07_run_demo.sh
  cat > "$CHAIN_DIR/07_run_demo.sh" <<'DEMO'
#!/usr/bin/env bash
set -Eeuo pipefail

echo "🎬 Executing Cowlitz County championship demo..."

# Check for championship demo scripts
if [[ -x ./championship/scripts/demo_cowlitz.sh ]]; then
  ./championship/scripts/demo_cowlitz.sh || true
else
  echo "ℹ️  Championship demo script not found, using standard demo."
fi

echo "🏆 Cowlitz County Demo Endpoints:"
echo "  🌐 UI:        http://localhost:${COWLITZ_DEMO_PORT}"
echo "  🔌 API:       http://localhost:${COWLITZ_API_PORT}"
echo "  📊 Health:    http://localhost:${COWLITZ_API_PORT}/health"
echo "  🏛️  County:    ${COUNTY_NAME} (${COUNTY_POPULATION} residents)"
echo "  🏠 Properties: ${COUNTY_PROPERTIES} parcels"

echo "✅ Cowlitz County demo ready for government officials!"
DEMO

  # 08_collect_artifacts.sh
  cat > "$CHAIN_DIR/08_collect_artifacts.sh" <<'ARTIFACTS'
#!/usr/bin/env bash
set -Eeuo pipefail

echo "📦 Collecting Cowlitz County artifacts..."

TS=$(date +%Y%m%d_%H%M%S)
OUT="${ARTIFACTS_DIR}/${TS}"
mkdir -p "$OUT"

# Cowlitz deployment logs
docker-compose -f compose/docker-compose.cowlitz.yml logs --no-color > "$OUT/cowlitz-stack.log" || true

# Cowlitz database export
docker exec cowlitz-postgres pg_dump -U "$POSTGRES_USER" -s "$POSTGRES_DB" > "$OUT/cowlitz-schema.sql" || true
docker exec cowlitz-postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "COPY cowlitz_parcels TO STDOUT WITH CSV HEADER;" > "$OUT/cowlitz-parcels.csv" || true

# Cowlitz environment snapshot
cp ".env.cowlitz" "$OUT/.env.cowlitz.snapshot" || true

# Generate Cowlitz report
python3 -c "
import json
from datetime import datetime

report = {
    'timestamp': datetime.utcnow().isoformat() + 'Z',
    'county': 'Cowlitz County, WA',
    'population': ${COUNTY_POPULATION},
    'properties': ${COUNTY_PROPERTIES},
    'services': {
        'ui': 'http://localhost:${COWLITZ_DEMO_PORT}',
        'api': 'http://localhost:${COWLITZ_API_PORT}',
        'health': 'http://localhost:${COWLITZ_API_PORT}/health'
    },
    'status': 'CHAMPIONSHIP_READY',
    'deployment_mode': 'production_demo'
}

with open('$OUT/cowlitz-report.json', 'w') as f:
    json.dump(report, f, indent=2)
" || true

echo "✅ Cowlitz County artifacts collected at $OUT"
ARTIFACTS

  # Make all scripts executable
  chmod +x "$CHAIN_DIR"/*.sh 2>/dev/null || true
  
  log "✅ Cowlitz County deployment scripts created"
}

# Create scripts if they don't exist
if [[ ! -f "$CHAIN_DIR/00_bootstrap.sh" ]]; then
  create_cowlitz_scripts
fi

# Execute Cowlitz County championship deployment chain
log "🏆 Starting Cowlitz County Championship Demo"
log "🏛️  County: $COUNTY_NAME ($COUNTY_POPULATION residents, $COUNTY_PROPERTIES properties)"
log "🌐 Demo URL: http://localhost:${COWLITZ_DEMO_PORT:-3020}"
log "🔌 API URL: http://localhost:${COWLITZ_API_PORT:-8020}"

run_step "$CHAIN_DIR/00_bootstrap.sh"
run_step "$CHAIN_DIR/01_validate_prereqs.sh"
run_step "$CHAIN_DIR/02_prepare_env.sh"
run_step "$CHAIN_DIR/03_provision_infra.sh"
run_step "$CHAIN_DIR/04_seed_data.sh"
run_step "$CHAIN_DIR/05_start_services.sh"
run_step "$CHAIN_DIR/06_run_tests.sh"
run_step "$CHAIN_DIR/07_run_demo.sh"
run_step "$CHAIN_DIR/08_collect_artifacts.sh"

log "🎉 Cowlitz County championship demo complete!"
log "🏆 Government. Transcended. In Cowlitz County."
log "📁 Artifacts: $LOG_DIR"
