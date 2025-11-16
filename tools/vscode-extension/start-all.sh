#!/bin/bash

# TerraFusion Extension - One-Command Startup Script
# Starts all required services and opens extension for testing

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                                                                ║"
echo "║   🚀 TerraFusion Extension - Full Stack Startup                ║"
echo "║                                                                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

EXTENSION_DIR="/workspaces/terrafusion_os_1.0/tools/vscode-extension"
TDC_DIR="/workspaces/terrafusion_os_1.0/tools/tdc"
PORTAL_DIR="/workspaces/terrafusion_os_1.0/TerraFusion_Command_Portal_Starter/terrafusion-command-portal/frontend"

# Check if services are already running
echo "🔍 Checking service status..."
echo ""

# Transparency Engine
if lsof -ti:8788 > /dev/null 2>&1; then
  echo "✅ Transparency Engine already running on port 8788"
else
  echo "🚀 Starting Transparency Engine (port 8788)..."
  cd "$TDC_DIR"
  node packages/transparency-engine/src/serve.js > /tmp/transparency-engine.log 2>&1 &
  TRANSPARENCY_PID=$!
  echo "   PID: $TRANSPARENCY_PID"
  sleep 2
fi

# Portal UI
if lsof -ti:5174 > /dev/null 2>&1; then
  echo "✅ Portal UI already running on port 5174"
else
  echo "🚀 Starting Portal UI (port 5174)..."
  cd "$PORTAL_DIR"
  npm run dev > /tmp/portal-ui.log 2>&1 &
  PORTAL_PID=$!
  echo "   PID: $PORTAL_PID"
  sleep 3
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Service Status:"
echo ""

lsof -ti:8788 > /dev/null 2>&1 && echo "   ✅ Transparency Engine: http://localhost:8788" || echo "   ❌ Transparency Engine: NOT RUNNING"
lsof -ti:5174 > /dev/null 2>&1 && echo "   ✅ Portal UI:           http://localhost:5174" || echo "   ❌ Portal UI:           NOT RUNNING"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🎯 Extension Testing Instructions:"
echo ""
echo "   1. Open VS Code in extension directory:"
echo "      code $EXTENSION_DIR"
echo ""
echo "   2. Press F5 to launch Extension Development Host"
echo ""
echo "   3. Look for TerraFusion icon (terra-cyan quantum logo) in activity bar"
echo ""
echo "   4. Click icon to open sidebar with 3 views:"
echo "      • Workspaces (62 workspace files)"
echo "      • Services (5 services monitored)"
echo "      • AI Agents (real-time feed)"
echo ""
echo "   5. Check status bar (bottom) for transparency layer indicator"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Quick Commands in Extension Development Host:"
echo ""
echo "   • Ctrl+Shift+P → 'TerraFusion: Open Portal UI'"
echo "   • Click status bar item to cycle transparency layers"
echo "   • Refresh workspaces with refresh button in sidebar"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 Logs available at:"
echo "   • Transparency Engine: /tmp/transparency-engine.log"
echo "   • Portal UI:           /tmp/portal-ui.log"
echo ""
echo "🛑 To stop services:"
echo "   pkill -f 'node.*transparency-engine'"
echo "   pkill -f 'npm.*vite'"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✨ Government. Transcended."
echo ""
