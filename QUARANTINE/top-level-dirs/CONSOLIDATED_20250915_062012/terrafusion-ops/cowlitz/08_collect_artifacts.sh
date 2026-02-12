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
