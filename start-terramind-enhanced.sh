#!/bin/bash

# TerraFusion OS - TerraMind Enhanced Startup Script
# Uses environment variables from .env.ports - NO HARDCODED PORTS!

set -e

echo "🚀 Starting TerraFusion OS with TerraMind AI Enhancement..."

# Load environment variables from .env.ports
if [ -f ".env.ports" ]; then
    echo "📋 Loading port configuration from .env.ports..."
    export $(grep -v '^#' .env.ports | xargs)
else
    echo "❌ Error: .env.ports file not found!"
    exit 1
fi

echo "🔧 Configuration:"
echo "  TF_API_PORT: ${TF_API_PORT}"
echo "  TF_FRONTEND_PORT: ${TF_FRONTEND_PORT}"
echo "  TF_AGENT_TOOLS_PORT: ${TF_AGENT_TOOLS_PORT}"

# Build TerraMind backend module
echo "🏗️  Building TerraMind backend module..."
cd backend/TerraMind
dotnet build -c Release
cd ../..

# Start backend API on configured port
echo "🚀 Starting TerraFusion API on port ${TF_API_PORT}..."
cd backend
dotnet run --project TerraFusion.API/TerraFusion.API.csproj --urls=http://localhost:${TF_API_PORT} &
API_PID=$!
cd ..

# Start agent tools server on configured port
echo "🛠️  Starting Agent Tools Server on port ${TF_AGENT_TOOLS_PORT}..."
cd tools/agent-tools
npm install
node server.mjs &
TOOLS_PID=$!
cd ../..

# Start frontend on configured port
echo "🌐 Starting Frontend on port ${TF_FRONTEND_PORT}..."
export PORT=${TF_FRONTEND_PORT}
npm run frontend:dev &
FRONTEND_PID=$!

echo "✅ TerraFusion OS with TerraMind Enhancement is running!"
echo "📊 Access points:"
echo "  - API: http://localhost:${TF_API_PORT}"
echo "  - Frontend: http://localhost:${TF_FRONTEND_PORT}" 
echo "  - Agent Tools: http://localhost:${TF_AGENT_TOOLS_PORT}"
echo "  - TerraMind API: http://localhost:${TF_API_PORT}/api/terramind/status"

# Wait for interrupt
trap "echo '🛑 Shutting down...'; kill $API_PID $TOOLS_PID $FRONTEND_PID; exit" INT TERM

wait