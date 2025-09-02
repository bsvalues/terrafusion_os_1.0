#!/usr/bin/env bash
set -Eeuo pipefail

TS=$(date +%Y%m%d_%H%M%S)
OUT="${ARTIFACTS_DIR}/${TS}"
mkdir -p "$OUT"

# Compose logs
docker compose -f compose/docker-compose.demo.yml logs --no-color > "$OUT/stack.log" || true

# Export DB sample (schema only for speed)
docker exec terrafusion_benton-db-1 pg_dump -U "$POSTGRES_USER" -s "$POSTGRES_DB" > "$OUT/schema.sql" || true

# Generate reports (Python)
python3 scripts/generate_reports.py "$OUT" || true

# Save environment
cp .env.benton "$OUT/.env.snapshot" || true

echo "Artifacts collected at $OUT"
