#!/usr/bin/env bash
set -Eeuo pipefail

echo "🔍 YAKIMA FLAGSHIP - Validating Championship Prerequisites"
echo "═══════════════════════════════════════════════════════════════"

# Core requirements
reqs=(docker docker-compose psql curl jq)
for bin in "${reqs[@]}"; do
  command -v "$bin" >/dev/null 2>&1 || { echo "❌ Missing critical dependency: $bin"; exit 1; }
done

# Championship-specific validations
if [[ -z "${YAKIMA_DEMO_PORT:-}" ]]; then
  echo "❌ YAKIMA_DEMO_PORT not configured for flagship"
  exit 1
fi

if [[ "${CHAMPIONSHIP_MODE:-false}" != "true" ]]; then
  echo "❌ Championship mode not enabled for Yakima flagship"
  exit 1
fi

# Validate championship performance targets
if [[ "${TARGET_RESPONSE_TIME_MS:-0}" -gt 3000 ]]; then
  echo "⚠️  Response time target exceeds championship standards (>3000ms)"
fi

# Optional championship tools
optional=(trivy snyk lighthouse)
for bin in "${optional[@]}"; do
  command -v "$bin" >/dev/null 2>&1 || echo "ℹ️  Optional championship tool not found: $bin"
done

echo "✅ Yakima County flagship prerequisites validated for championship deployment!"
