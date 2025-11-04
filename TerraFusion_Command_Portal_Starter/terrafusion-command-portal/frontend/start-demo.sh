#!/bin/bash

# TerraFusion Command Portal Demo Server
echo "🌍 Starting TerraFusion Command Portal Demo Server..."

# Check if backend is running
if curl -s http://localhost:8787/health > /dev/null 2>&1; then
    echo "✅ Backend API detected at http://localhost:8787"
else
    echo "⚠️  Backend API not detected. Make sure to run 'cargo run' in the backend directory."
fi

# Start simple HTTP server for frontend demo
echo "🚀 Starting frontend demo server..."
echo "📱 Frontend demo will be available at: http://localhost:3000"
echo "🔗 Backend API is at: http://localhost:8787"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Use Python's built-in HTTP server
cd "$(dirname "$0")"
python3 -m http.server 3000 2>/dev/null || python -m SimpleHTTPServer 3000