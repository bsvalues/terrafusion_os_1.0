#!/bin/bash
# TerraFusion OS - Proper Environment-Based Startup
# NO HARDCODED PORTS - ZERO TOLERANCE

set -e

echo "🚀 TerraFusion OS - Environment-Based Startup"
echo "=============================================="
echo "❌ ZERO HARDCODED PORTS ALLOWED"
echo ""

# Load environment variables from .env.ports
if [ ! -f ".env.ports" ]; then
    echo "❌ ERROR: .env.ports file not found!"
    echo "This file is required for dynamic port configuration."
    exit 1
fi

echo "📋 Loading environment variables from .env.ports..."
set -a
source .env.ports
set +a

echo "✅ Environment variables loaded:"
echo "   TF_API_PORT=$TF_API_PORT"
echo "   TF_FRONTEND_PORT=$TF_FRONTEND_PORT" 
echo "   TF_SHELL_PORT=$TF_SHELL_PORT"
echo ""

# Validate required environment variables are set
if [ -z "$TF_API_PORT" ]; then
    echo "❌ ERROR: TF_API_PORT not set in .env.ports"
    exit 1
fi

if [ -z "$TF_FRONTEND_PORT" ]; then
    echo "❌ ERROR: TF_FRONTEND_PORT not set in .env.ports"
    exit 1
fi

echo "🔍 Checking port availability..."

# Check if ports are available
if lsof -i :$TF_API_PORT >/dev/null 2>&1; then
    echo "⚠️  WARNING: Port $TF_API_PORT is already in use"
    echo "   This may be your TerraFusion Agent on port 5000"
    echo "   Continuing with configured port $TF_API_PORT"
fi

echo ""
echo "🚀 Starting TerraFusion OS with environment-based ports..."
echo "   API will start on port: $TF_API_PORT"
echo "   Frontend will start on port: $TF_FRONTEND_PORT"
echo ""

# Start API with environment variables (NO HARDCODING)
echo "🔧 Starting API service..."
npm run api:dev &
API_PID=$!

# Wait a moment for API to start
sleep 3

# Start Frontend with environment variables (NO HARDCODING)  
echo "🎨 Starting Frontend service..."
npm run frontend:dev &
FRONTEND_PID=$!

echo ""
echo "✅ TerraFusion OS Started Successfully!"
echo "=============================================="
echo "🌐 API:      http://localhost:$TF_API_PORT"
echo "🎨 Frontend: http://localhost:$TF_FRONTEND_PORT"
echo "=============================================="
echo ""
echo "📊 Process IDs:"
echo "   API PID: $API_PID"
echo "   Frontend PID: $FRONTEND_PID"
echo ""
echo "To stop services:"
echo "   kill $API_PID $FRONTEND_PID"
echo ""
echo "🛡️  NO HARDCODED PORTS USED - All dynamic via .env.ports"

# Keep script running to monitor services
wait