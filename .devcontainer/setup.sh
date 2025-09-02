#!/bin/bash

# TerraFusion OS 1.0 - Codespace Setup Script
echo "🚀 Setting up TerraFusion OS 1.0 Development Environment..."

# Install additional tools
sudo apt-get update
sudo apt-get install -y postgresql-client redis-tools jq curl

# Setup .NET development
dotnet --version
dotnet restore backend/TerraFusion.sln

# Setup Node.js development
cd frontend
npm install
cd ..

# Setup environment files
if [ ! -f .env.development ]; then
    cp .env.benton.example .env.development
    echo "📝 Created .env.development from template"
fi

# Make scripts executable
chmod +x ops/benton-demo.sh
chmod +x ops/benton/*.sh
chmod +x scripts/*.sh

# Setup Git hooks
if [ -d .husky ]; then
    npx husky install
    echo "🔧 Git hooks configured"
fi

# Create development directories
mkdir -p logs/development
mkdir -p data/development
mkdir -p artifacts/development

echo "✅ TerraFusion OS 1.0 development environment ready!"
echo "🎯 Available commands:"
echo "  - make demo          # Run Benton County demo"
echo "  - dotnet run         # Start backend API"
echo "  - npm start          # Start frontend UI"
echo "  - docker-compose up  # Start full stack"
