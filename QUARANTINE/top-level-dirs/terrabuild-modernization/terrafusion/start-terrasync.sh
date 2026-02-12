#!/bin/bash

# TerraSync API Startup Script
# THE TERRAFUSION WAY - Government. Transcended.

echo "🚀 STARTING TERRASYNC API BRIDGE..."
echo "   🏛️ County Data Integration Service"
echo "   🔒 Harris PACS 9.0 Integration"
echo "   ⚡ Government-grade performance"

# Set environment variables
export TERRASYNC_PORT=3005
export HARRIS_PACS_VERSION="9.0"
export NODE_ENV="development"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start TerraSync API
echo "🌐 Starting TerraSync API on port $TERRASYNC_PORT..."
npm run terrasync:dev
