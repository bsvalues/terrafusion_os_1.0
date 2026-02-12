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
