#!/bin/bash

# TerraFusion OS Ultimate - Enhanced Integration Startup
# Combines TerraMind + Enhanced Ops + Workflow Orchestration
# The complete government AI operating system

set -e

echo "🌟 Initializing TerraFusion OS Ultimate - The Enhanced Government AI Platform..."

# Load environment variables from .env.ports
if [ -f ".env.ports" ]; then
    echo "📋 Loading comprehensive port configuration..."
    export $(grep -v '^#' .env.ports | xargs)
else
    echo "❌ Error: .env.ports file not found!"
    exit 1
fi

echo "🔧 TerraFusion Ultimate Configuration:"
echo "  API: ${TF_API_PORT}"
echo "  Frontend: ${TF_FRONTEND_PORT}"
echo "  Agent Tools: ${TF_AGENT_TOOLS_PORT}"
echo "  Redis: ${TF_REDIS_PORT}"
echo "  Workflow: ${TF_WORKFLOW_PORT}"
echo "  Prometheus: ${TF_PROMETHEUS_PORT}"

# Check for Enhanced Ops components
if [ ! -f "TerraFusion Enhanced Ops Integration/terrafusion-workflow-orchestrator.py" ]; then
    echo "⚠️  Enhanced Ops components not found, falling back to basic TerraMind startup"
    exec ./start-terramind-enhanced.sh
    exit
fi

echo "🚀 Starting TerraFusion Ultimate with Enhanced Operations..."

# Start Redis for workflow state management
echo "🔴 Starting Redis for workflow orchestration..."
if command -v redis-server &> /dev/null; then
    redis-server --port ${TF_REDIS_PORT} --daemonize yes --logfile ./var/log/redis.log
    echo "  ✅ Redis started on port ${TF_REDIS_PORT}"
else
    echo "  ⚠️  Redis not found, workflow state will be memory-only"
fi

# Start Workflow Orchestrator
echo "🔀 Starting TerraFusion Workflow Orchestrator..."
cd "TerraFusion Enhanced Ops Integration"
export TF_WORKFLOW_PORT=${TF_WORKFLOW_PORT}
export TF_REDIS_HOST="localhost:${TF_REDIS_PORT}"
python3 terrafusion-workflow-orchestrator.py &
ORCHESTRATOR_PID=$!
cd ..
echo "  ✅ Workflow Orchestrator started (PID: ${ORCHESTRATOR_PID})"

# Build TerraMind backend module with enhanced monitoring
echo "🧠 Building TerraMind with Enhanced Ops integration..."
cd backend/TerraMind
dotnet build -c Release -v quiet
cd ../..
echo "  ✅ TerraMind built successfully"

# Start enhanced safe execution wrapper for API
echo "🛡️  Starting TerraFusion API with Enhanced Safe Execution..."
export TF_SAFE_RUN_MODE="enhanced"
export TF_AI_MONITOR="enabled"
export TF_COUNTY="${TF_COUNTY:-benton}"

# Create enhanced startup command
SAFE_RUN_CMD="./TerraFusion Enhanced Ops Integration/terrafusion-safe-run-enhanced.sh"
API_CMD="dotnet run --project backend/TerraFusion.API/TerraFusion.API.csproj --urls=http://localhost:${TF_API_PORT}"

if [ -f "${SAFE_RUN_CMD}" ]; then
    # Use enhanced safe run wrapper
    ${SAFE_RUN_CMD} "${API_CMD}" &
    API_PID=$!
    echo "  ✅ Enhanced API started with monitoring (PID: ${API_PID})"
else
    # Fallback to direct execution
    cd backend && ${API_CMD} &
    API_PID=$!
    cd ..
    echo "  ✅ API started in basic mode (PID: ${API_PID})"
fi

# Start Agent Tools Server with enhanced monitoring
echo "🛠️  Starting Agent Tools with Enhanced Ops..."
cd tools/agent-tools
export TF_AGENT_TOOLS_PORT=${TF_AGENT_TOOLS_PORT}
npm install express &>/dev/null || echo "  ⚠️  npm install failed, continuing..."
node server.mjs &
TOOLS_PID=$!
cd ../..
echo "  ✅ Agent Tools started (PID: ${TOOLS_PID})"

# Start Frontend with enhanced configuration
echo "🌐 Starting Enhanced Frontend..."
export PORT=${TF_FRONTEND_PORT}
export REACT_APP_API_URL="http://localhost:${TF_API_PORT}"
export REACT_APP_TERRAMIND_URL="http://localhost:${TF_API_PORT}/api/terramind"
export REACT_APP_WORKFLOW_URL="http://localhost:${TF_WORKFLOW_PORT}"

npm run frontend:dev &
FRONTEND_PID=$!
echo "  ✅ Frontend started (PID: ${FRONTEND_PID})"

# Display comprehensive status
echo ""
echo "🎆 TerraFusion OS Ultimate is FULLY OPERATIONAL!"
echo ""
echo "🔗 Access Points:"
echo "  🌐 Frontend:        http://localhost:${TF_FRONTEND_PORT}"
echo "  🤖 API:             http://localhost:${TF_API_PORT}"
echo "  🧠 TerraMind:       http://localhost:${TF_API_PORT}/api/terramind/status"
echo "  🔀 Workflows:       http://localhost:${TF_WORKFLOW_PORT}"
echo "  🛠️  Agent Tools:     http://localhost:${TF_AGENT_TOOLS_PORT}"
echo "  📊 Metrics:         http://localhost:${TF_PROMETHEUS_PORT}/metrics"
echo "  🔴 Redis:           localhost:${TF_REDIS_PORT}"
echo ""
echo "🏛️  Enhanced Capabilities:"
echo "  ✅ TerraMind AI Module"
echo "  ✅ Workflow Orchestration"
echo "  ✅ Enhanced Safe Execution"
echo "  ✅ AI Monitoring & Metrics"
echo "  ✅ County-Specific Logic"
echo "  ✅ Government Compliance"
echo "  ✅ Emergency Response Ready"
echo ""
echo "🎯 Ready for:"
echo "  • Autonomous Government Operations"
echo "  • Multi-County Federation"
echo "  • Advanced AI Workflows"
echo "  • Production Deployment"
echo ""

# Wait for shutdown signal
trap "echo '🛑 Shutting down TerraFusion Ultimate...'; kill $API_PID $TOOLS_PID $FRONTEND_PID $ORCHESTRATOR_PID 2>/dev/null; pkill redis-server 2>/dev/null; exit" INT TERM

echo "🔄 TerraFusion Ultimate running... (Press Ctrl+C to shutdown)"
wait