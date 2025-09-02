#!/bin/bash
# TerraFusion OS 1.0 - Docker Entrypoint Script

set -e

echo "🚀 Starting TerraFusion OS 1.0..."
echo "================================"

# Function to wait for a service
wait_for_service() {
    local host=$1
    local port=$2
    local service=$3
    
    echo "⏳ Waiting for $service on $host:$port..."
    
    for i in {1..30}; do
        if nc -z $host $port 2>/dev/null; then
            echo "✅ $service is ready!"
            return 0
        fi
        sleep 2
    done
    
    echo "⚠️  Warning: $service not responding, continuing anyway..."
    return 1
}

# Initialize database if needed
if [ ! -f "$DATABASE_PATH" ]; then
    echo "📦 Initializing database..."
    cd /app/backend
    dotnet ef database update
    echo "✅ Database initialized"
fi

# Start AI services in background
echo "🤖 Starting AI Services..."

# Start AI Command Brain
cd /app/ai-services
node ai-command-brain.js &
AI_BRAIN_PID=$!
echo "   AI Command Brain started (PID: $AI_BRAIN_PID)"

# Start AI Swarm
node ai-swarm.js &
AI_SWARM_PID=$!
echo "   AI Swarm started (PID: $AI_SWARM_PID)"

# Start AI Advanced
node ai-advanced.js &
AI_ADVANCED_PID=$!
echo "   AI Advanced started (PID: $AI_ADVANCED_PID)"

# Wait for AI services to be ready
wait_for_service localhost 3001 "AI Command Brain"
wait_for_service localhost 3002 "AI Swarm"
wait_for_service localhost 3003 "AI Advanced"

# Start the main API
echo "🚀 Starting TerraFusion API..."
cd /app/backend
exec dotnet TerraFusion.API.dll
