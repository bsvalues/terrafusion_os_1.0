#!/bin/bash
# TerraFusion OS Development Environment Setup
# Comprehensive development environment configuration

set -euo pipefail

echo "🚀 TerraFusion OS Development Environment Setup"
echo "================================================"

# Check Node.js version
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "✅ Node.js: $NODE_VERSION"
else
    echo "❌ Node.js not found. Please install Node.js 18+"
    exit 1
fi

# Check npm version
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo "✅ npm: $NPM_VERSION"
else
    echo "❌ npm not found"
    exit 1
fi

# Check Docker
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    echo "✅ Docker: $DOCKER_VERSION"
else
    echo "⚠️  Docker not found - containerized development unavailable"
fi

# Check .NET Core
if command -v dotnet &> /dev/null; then
    DOTNET_VERSION=$(dotnet --version)
    echo "✅ .NET Core: $DOTNET_VERSION"
else
    echo "❌ .NET Core not found. Please install .NET 8+"
    exit 1
fi

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend && npm install && cd ..

# Install backend dependencies
echo "📦 Restoring backend packages..."
dotnet restore backend/TerraFusion.sln

# Setup environment files
if [ ! -f ".env" ]; then
    if [ -f ".env.template" ]; then
        cp .env.template .env
        echo "✅ Created .env from template"
    else
        echo "⚠️  No .env.template found"
    fi
fi

echo "🎯 Development environment setup complete!"
echo "Run 'npm start' in frontend/ to start development server"
echo "Run 'dotnet run' in backend/TerraFusion.API/ to start API server"
