#!/bin/bash
# TerraFusion OS - Workspace Launcher

echo "🏛️ TerraFusion OS - Workspace Launcher"
echo "Government. Transcended."
echo ""

WORKSPACES_DIR="/workspaces/terrafusion_os_1.0/workspaces"

echo "📁 Available Workspaces:"
echo ""
echo "🏛️  CORE WORKSPACES:"
echo "   master          - Complete TerraFusion OS"
echo "   backend         - .NET 8 microservices"
echo "   frontend        - React 18 + Quantum UI" 
echo "   sdk             - Developer kit"
echo ""
echo "🚀  MODULE WORKSPACES:"
echo "   costforge-ai    - AI cost estimation"
echo "   terra-levy      - Tax levy management"
echo "   terra-agent     - AI agent coordination"
echo "   portal          - Government portal"
echo ""
echo "⚙️  SPECIALIZED WORKSPACES:"
echo "   consciousness   - AI swarm coordination"
echo "   monitoring      - System monitoring"
echo "   security        - Security & compliance"
echo ""

if [ "$1" == "" ]; then
    echo "Usage: ./launch-workspace.sh <workspace-name>"
    echo ""
    echo "Example: ./launch-workspace.sh master"
    exit 1
fi

WORKSPACE_NAME=$1
WORKSPACE_FILE="${WORKSPACES_DIR}/${WORKSPACE_NAME}.code-workspace"

if [ -f "$WORKSPACE_FILE" ]; then
    echo "🎯 Launching: $WORKSPACE_NAME"
    code "$WORKSPACE_FILE"
else
    echo "❌ Workspace not found: $WORKSPACE_FILE"
    echo ""
    echo "💡 Available workspace files:"
    ls -1 "$WORKSPACES_DIR"/*.code-workspace | sed 's/.*\//  /' | sed 's/\.code-workspace//'
fi
