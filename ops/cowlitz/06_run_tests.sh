#!/usr/bin/env bash
set -Eeuo pipefail

echo "🧪 Running Cowlitz County quality gates..."

# Cowlitz API health check
curl -fsS "http://localhost:${COWLITZ_API_PORT}/health" || { echo "❌ Cowlitz API health failed"; exit 1; }

# Cowlitz DB connectivity
psql "postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:5432/${POSTGRES_DB}" -c "SELECT COUNT(*) FROM cowlitz_parcels;" >/dev/null

echo "✅ Cowlitz County quality gates passed."
