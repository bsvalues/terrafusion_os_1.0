#!/bin/bash

# 🏆 Benton County Championship Demo Launcher
# Starts the complete TerraFusion ecosystem

echo "🏆 Starting Benton County Championship Demo..."

# Navigate to demo directory
cd "$(dirname "$0")"

# Check if demo server is already running
if curl -s http://localhost:3000/api/demo/health > /dev/null 2>&1; then
    echo "✅ Demo server already running on port 3000"
else
    echo "🚀 Starting demo server..."
    node demo-server.js &
    DEMO_PID=$!
    
    # Wait for server to be ready
    echo "⏳ Waiting for demo server to start..."
    for i in {1..30}; do
        if curl -s http://localhost:3000/api/demo/health > /dev/null 2>&1; then
            echo "✅ Demo server ready on port 3000"
            break
        fi
        sleep 1
    done
    
    if [ $i -eq 30 ]; then
        echo "❌ Demo server failed to start"
        exit 1
    fi
fi

# Launch TerraFusion Launcher
echo "🚀 Launching TerraFusion Launcher..."
if [ -f "../launcher-v3/terrafusion-launcher-linux" ]; then
    ../launcher-v3/terrafusion-launcher-linux
elif [ -f "../launcher-v3/dist/terrafusion-launcher" ]; then
    ../launcher-v3/dist/terrafusion-launcher
else
    echo "⚠️  TerraFusion Launcher not found, building..."
    cd ../launcher-v3
    npm run tauri build
    if [ $? -eq 0 ]; then
        echo "✅ Launcher built successfully"
        ./src-tauri/target/release/terrafusion-launcher
    else
        echo "❌ Failed to build launcher"
        echo "📖 Opening demo in browser instead..."
        if command -v xdg-open > /dev/null; then
            xdg-open http://localhost:3000
        elif command -v open > /dev/null; then
            open http://localhost:3000
        else
            echo "🌐 Open http://localhost:3000 in your browser"
        fi
    fi
fi

echo "🏆 Championship Demo Ready!"
echo "📊 Demo URL: http://localhost:3000"
echo "📈 API Endpoints:"
echo "   - Overview: http://localhost:3000/api/demo/overview"
echo "   - Properties: http://localhost:3000/api/demo/properties"  
echo "   - Scenarios: http://localhost:3000/api/demo/scenarios"
echo "   - Marketplace: http://localhost:3000/api/demo/marketplace"
echo "   - Monitoring: http://localhost:3000/api/monitoring/performance"