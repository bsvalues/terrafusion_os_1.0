#!/bin/bash
# TerraFusion Development Environment Launcher
# Migrated from TerraFusion_Remix_Clean

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "Starting TerraFusion Development Environment..."
echo "Project Root: $PROJECT_ROOT"

# Start backend
echo "Starting .NET backend..."
cd "$PROJECT_ROOT/backend"
dotnet run --project TerraFusion.API &
BACKEND_PID=$!

# Wait for backend to start
echo "Waiting for backend to initialize..."
for i in {1..30}; do
    if curl -s http://localhost:${TF_STATIC_PORT:-8080}/api/health > /dev/null 2>&1; then
        echo "Backend is ready!"
        break
    fi
    sleep 2
    if [ $i -eq 30 ]; then
        echo "Backend failed to start within timeout"
        kill $BACKEND_PID 2>/dev/null || true
        exit 1
    fi
done

# Start frontend
cd "$PROJECT_ROOT/frontend"
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

echo "Starting React frontend..."
npm start &
FRONTEND_PID=$!

# Start Electron desktop shell
echo "Starting Electron desktop shell..."
cd "$PROJECT_ROOT/frontend/electron"
if [ ! -d "node_modules" ]; then
    echo "Installing Electron dependencies..."
    npm install
fi

npm start &
ELECTRON_PID=$!

echo "TerraFusion Development Environment launched successfully!"
echo "Backend: http://localhost:${TF_STATIC_PORT:-8080}"
echo "Frontend: http://localhost:${TF_STATIC_PORT:-8080}"
echo "Electron: Desktop application"
echo ""
echo "Press Ctrl+C to stop all services"

# Trap to cleanup processes
trap 'kill $BACKEND_PID $FRONTEND_PID $ELECTRON_PID 2>/dev/null || true' EXIT

# Wait for user interrupt
wait
