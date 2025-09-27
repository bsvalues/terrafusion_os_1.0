#!/usr/bin/env bash
# TerraFusion Implementation Progress Monitor Launcher
# Government-grade infrastructure monitoring and progress tracking

set -euo pipefail

echo "🎯 TerraFusion Implementation Progress Monitor"
echo "════════════════════════════════════════════════════════"
echo "📊 Real-time infrastructure implementation tracking"
echo "🏛️ Government compliance monitoring"
echo "⚡ WebSocket updates on port \${{TF_SHELL_PORT:-3001}}"
echo ""

# Check dependencies
echo "🔍 Checking dependencies..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm not found. Please install npm"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install ws axios chokidar
fi

# Create monitoring directory if it doesn't exist
mkdir -p terrafusion-ops/monitoring

# Check if monitor exists
if [ ! -f "terrafusion-ops/monitoring/implementation-progress-monitor.cjs" ]; then
    echo "❌ Implementation Progress Monitor not found!"
    echo "Please ensure the monitor file exists at:"
    echo "terrafusion-ops/monitoring/implementation-progress-monitor.cjs"
    exit 1
fi

echo "✅ Dependencies verified"
echo ""

# Launch the monitor
echo "🚀 Starting Implementation Progress Monitor..."
echo "📱 Connect to WebSocket at ws://localhost:\${{TF_SHELL_PORT:-3001}} for real-time updates"
echo "📋 Progress reports will be generated in IMPLEMENTATION_PROGRESS_REPORT.md"
echo ""
echo "Press Ctrl+C to stop monitoring"
echo ""

# Start the monitor
node terrafusion-ops/monitoring/implementation-progress-monitor.cjs