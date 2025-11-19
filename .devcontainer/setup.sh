#!/bin/bash

# TerraFusion OS 1.0 - Dev Container Setup Script
echo "🚀 Setting up TerraFusion OS 1.0 Development Environment..."

# Set proper file permissions for Windows/WSL compatibility
echo "🔧 Setting up file permissions..."
sudo chown -R $(whoami) /workspaces
find /workspaces -type f -name "*.sh" -exec chmod +x {} \;

# Install additional tools
echo "📦 Installing development tools..."
sudo apt-get update
sudo apt-get install -y postgresql-client redis-tools jq curl git

# Verify Docker access from container
echo "🐳 Verifying Docker access..."
docker --version || echo "⚠️ Docker not accessible from container"

# Setup .NET development
echo "⚙️ Setting up .NET environment..."
dotnet --version
if [ -f backend/TerraFusion.sln ]; then
    dotnet restore backend/TerraFusion.sln
else
    echo "⚠️ Backend solution not found, skipping .NET restore"
fi

# Setup Node.js development
echo "📦 Setting up Node.js environment..."
if [ -f package.json ]; then
    npm install --no-optional
else
    echo "⚠️ Root package.json not found"
fi

if [ -d frontend ]; then
    cd frontend
    if [ -f package.json ]; then
        npm install --no-optional
        echo "✅ Frontend dependencies installed"
    fi
    cd ..
fi

# Setup environment files
echo "📝 Setting up environment files..."
if [ ! -f .env.development ]; then
    if [ -f .env.benton.example ]; then
        cp .env.benton.example .env.development
        echo "📝 Created .env.development from template"
    else
        echo "NODE_ENV=development" > .env.development
        echo "ASPNETCORE_ENVIRONMENT=Development" >> .env.development
        echo "📝 Created basic .env.development"
    fi
fi

# Make scripts executable
echo "🔧 Making scripts executable..."
find . -name "*.sh" -type f -exec chmod +x {} \; 2>/dev/null || true
chmod +x ops/benton-demo.sh 2>/dev/null || true
chmod +x ops/benton/*.sh 2>/dev/null || true
chmod +x scripts/*.sh 2>/dev/null || true

# Setup Git configuration
echo "🔧 Setting up Git..."
git config --global --add safe.directory /workspaces/terrafusion_os_1.0
git config --global init.defaultBranch main
git config --global pull.rebase false

# Setup Git hooks
if [ -d .husky ]; then
    npx husky install 2>/dev/null && echo "🔧 Git hooks configured" || echo "⚠️ Husky setup skipped"
fi

# Create development directories
echo "📁 Creating development directories..."
mkdir -p logs/development
mkdir -p data/development
mkdir -p artifacts/development
mkdir -p temp

# Set proper ownership
sudo chown -R $(whoami):$(whoami) logs data artifacts temp 2>/dev/null || true

echo ""
echo "✅ TerraFusion OS 1.0 development environment ready!"
echo "🎯 Available commands:"
echo "  - make demo          # Run Benton County demo"
echo "  - dotnet run         # Start backend API"
echo "  - npm start          # Start frontend UI"
echo "  - docker-compose up  # Start full stack"
echo "  - code .             # Open workspace in VS Code"
echo ""
echo "🏛️ Government. Transcended."
