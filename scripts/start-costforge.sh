#!/bin/bash
# CostForge AI Launcher Script
# Migrated from TerraFusion_Remix_Clean

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "Starting CostForge AI..."
echo "Project Root: $PROJECT_ROOT"

# Check if backend is running
if ! curl -s http://localhost:5000/api/health > /dev/null 2>&1; then
    echo "Starting TerraFusion backend..."
    cd "$PROJECT_ROOT/backend"
    dotnet run --project TerraFusion.API &
    BACKEND_PID=$!
    
    # Wait for backend to start
    echo "Waiting for backend to initialize..."
    for i in {1..30}; do
        if curl -s http://localhost:5000/api/health > /dev/null 2>&1; then
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

# Start frontend with CostForge focus
cd "$PROJECT_ROOT/frontend"
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

echo "Launching CostForge AI interface..."
REACT_APP_MODULE_FOCUS=costforge npm start

echo "CostForge AI launched successfully!"
