#!/bin/bash
# Marketplace UI Launcher Script
# Migrated from TerraFusion_Remix_Clean

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "Starting Marketplace UI..."
echo "Project Root: $PROJECT_ROOT"

# Check if backend is running
if ! curl -s http://localhost:${TF_STATIC_PORT:-8080}/api/health > /dev/null 2>&1; then
    echo "Starting TerraFusion backend..."
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
            exit 1
        fi
    done
fi

# Start frontend with Marketplace focus
cd "$PROJECT_ROOT/frontend"
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

echo "Launching Marketplace UI..."
REACT_APP_MODULE_FOCUS=marketplace npm start

echo "Marketplace UI launched successfully!"
