#!/bin/bash
# File: ops/scripts/push_adoption_metric.sh
# Purpose: Push RS256 adoption rate to Prometheus Pushgateway
# Usage: Run hourly via cron: 0 * * * * bash /path/to/push_adoption_metric.sh
# Dependencies: PostgreSQL, Prometheus Pushgateway (port 9091)

set -euo pipefail

# Configuration
PUSHGATEWAY_URL="${PUSHGATEWAY_URL:-http://localhost:9091}"
DB_NAME="${DB_NAME:-terrafusion_db}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-postgres}"

# Query RS256 adoption rate (last 1 hour)
ADOPTION=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "
  SELECT 
    COALESCE(
      (COUNT(*) FILTER (WHERE auth_method = 'RS256')::float / NULLIF(COUNT(*), 0)::float) * 100,
      0
    ) as adoption_rate
  FROM auth_audit
  WHERE created_at > NOW() - INTERVAL '1 hour'
")

# Trim whitespace
ADOPTION=$(echo "$ADOPTION" | xargs)

# Validate result (0-100 range)
if ! [[ "$ADOPTION" =~ ^[0-9]+(\.[0-9]+)?$ ]] || (( $(echo "$ADOPTION < 0" | bc -l) )) || (( $(echo "$ADOPTION > 100" | bc -l) )); then
  echo "[ERROR] Invalid adoption rate: $ADOPTION (expected 0-100)"
  exit 1
fi

# Push to Prometheus Pushgateway
cat <<EOF | curl --data-binary @- "${PUSHGATEWAY_URL}/metrics/job/rs256_adoption"
# HELP rs256_adoption_rate Percentage of auth requests using RS256 (0-100)
# TYPE rs256_adoption_rate gauge
rs256_adoption_rate $ADOPTION
EOF

echo "[INFO] Pushed adoption rate: ${ADOPTION}%"
