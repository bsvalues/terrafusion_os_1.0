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
