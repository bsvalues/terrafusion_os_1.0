#!/bin/bash
echo "🏪 Starting TerraFusion Marketplace..."
echo "🔌 Government App Store with 70/30 revenue sharing"

cd "$(dirname "$0")"

# Start marketplace API server
echo "🚀 Starting marketplace API on port \${{TF_CONSCIOUSNESS_PORT:-3002}}..."
node api/marketplace-server.js &

echo "✅ Marketplace running at: http://localhost:\${{TF_CONSCIOUSNESS_PORT:-3002}}"
echo "🔌 Plugin store: http://localhost:\${{TF_CONSCIOUSNESS_PORT:-3002}}/store"
echo "📊 Analytics: http://localhost:\${{TF_CONSCIOUSNESS_PORT:-3002}}/api/analytics"
echo "💰 Revenue: http://localhost:\${{TF_CONSCIOUSNESS_PORT:-3002}}/api/revenue"
echo ""
echo "🛑 Press Ctrl+C to stop"
wait
