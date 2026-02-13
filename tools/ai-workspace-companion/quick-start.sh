#!/bin/bash

# TerraFusion OS 1.0 AI Workspace Companion Agent - Quick Start Script
# This script automatically installs dependencies and launches your AI companion

set -e

echo "🚀 TERRAFUSION OS 1.0 AI WORKSPACE COMPANION AGENT"
echo "=================================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: This script must be run from the ai-workspace-companion directory"
    echo "   Please run: cd ai-workspace-companion && ./quick-start.sh"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed"
    echo "   Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Error: Node.js version 18+ is required"
    echo "   Current version: $(node --version)"
    echo "   Please upgrade Node.js from https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo ""

# Check if ts-node is available
if ! npx ts-node --version &> /dev/null; then
    echo "❌ Error: ts-node is not available"
    echo "   Please install ts-node: npm install -g ts-node"
    exit 1
fi

echo "✅ ts-node is available"
echo ""

# Launch the companion agent
echo "🤖 Launching AI Workspace Companion Agent..."
echo "   Press Ctrl+C to stop the agent"
echo ""

# Launch with development mode for better debugging
npm run companion:dev
