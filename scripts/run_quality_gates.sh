#!/usr/bin/env bash
set -Eeuo pipefail

# Lightweight smoke: API health, DB connectivity, key routes
curl -fsS http://localhost:\${{TF_ADMIN_PORT:-8080}}/health || { echo "API health failed"; exit 1; }

# Basic DB query
psql "postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:\${{TF_ADMIN_PORT:-8080}}/${POSTGRES_DB}" -c "SELECT 1;" >/dev/null

# Harris PACS integration test
if [[ "${HARRIS_PACS_ENABLED:-false}" == "true" ]]; then
  curl -fsS http://localhost:\${{TF_ADMIN_PORT:-8080}}/api/harris-pacs/status || { echo "Harris PACS integration test failed"; exit 1; }
fi

# Test key Benton County endpoints
curl -fsS http://localhost:\${{TF_ADMIN_PORT:-8080}}/api/counties/benton/parcels?limit=1 || { echo "Parcels API failed"; exit 1; }
curl -fsS http://localhost:\${{TF_ADMIN_PORT:-8080}}/api/counties/benton/assessments?limit=1 || { echo "Assessments API failed"; exit 1; }

# Optional: Container vuln scan (if trivy installed)
if command -v trivy >/dev/null 2>&1; then
  trivy image --quiet --severity CRITICAL,HIGH terrafusion_benton-core || true
fi

echo "Quality gates OK."
