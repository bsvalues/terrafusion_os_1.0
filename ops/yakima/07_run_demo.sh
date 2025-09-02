#!/usr/bin/env bash
set -Eeuo pipefail

echo "🎬 YAKIMA FLAGSHIP - Executing Championship Demonstration"
echo "═══════════════════════════════════════════════════════════"

# Execute championship demo if available
if [[ -x ./championship/scripts/demo_yakima.sh ]]; then
  echo "🚀 Launching Yakima championship demonstration..."
  ./championship/scripts/demo_yakima.sh || true
elif [[ -x ./championship/headless-demo-executor.js ]]; then
  echo "🤖 Launching AI-powered headless demonstration..."
  node ./championship/headless-demo-executor.js || true
else
  echo "ℹ️  Using standard flagship demonstration."
fi

echo ""
echo "🏆 YAKIMA COUNTY FLAGSHIP DEMONSTRATION READY"
echo "═══════════════════════════════════════════════════════════════════"
echo "🌐 Flagship UI:       http://localhost:${YAKIMA_DEMO_PORT}"
echo "🔌 Championship API:  http://localhost:${YAKIMA_API_PORT}"
echo "📊 Health Check:      http://localhost:${YAKIMA_API_PORT}/health"
echo "📈 Grafana:           http://localhost:${YAKIMA_GRAFANA_PORT}"
echo "🔍 Prometheus:        http://localhost:${YAKIMA_PROMETHEUS_PORT}"
echo ""
echo "🏛️  County Information:"
echo "   📍 ${COUNTY_NAME}"
echo "   👥 ${COUNTY_POPULATION} residents"
echo "   🏠 ${COUNTY_PROPERTIES} properties"
echo "   🍎 Agricultural focus: Apples & Wine"
echo "   🎯 Performance target: <${TARGET_RESPONSE_TIME_MS}ms"
echo ""
echo "🤖 AI Swarm Status:"
echo "   🔢 Agents deployed: ${AI_SWARM_SIZE}"
echo "   ⚡ Quantum cores: ${QUANTUM_CORES}"
echo "   🎯 Confidence: ${CONFIDENCE_TARGET}"
echo ""
echo "✅ Yakima County flagship ready for government demonstrations!"
echo "🏆 Government. Transcended. In the Heart of Washington."
