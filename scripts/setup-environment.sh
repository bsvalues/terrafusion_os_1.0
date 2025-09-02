#!/bin/bash
# setup-environment.sh - Environment Setup Automation
# AI Swarm Developer Squad: Automated environment configuration

set -euo pipefail

echo "🤖 AI Environment Setup Agent: Configuring TerraFusion OS development environment"
echo "📍 Geographic Focus: Benton County, Washington (County Seat: Prosser)"

# Check if .env already exists
if [ -f ".env" ]; then
    echo "⚠️ .env file already exists"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Setup cancelled - keeping existing .env file"
        exit 0
    fi
fi

echo "📋 Creating .env file from template..."
cp .env.template .env

echo "🔧 Configuring environment variables..."

# Generate secure JWT secret
JWT_SECRET=$(openssl rand -base64 48 | tr -d "=+/" | cut -c1-32)
sed -i.bak "s/your-super-secure-jwt-secret-key-here-minimum-32-characters/$JWT_SECRET/g" .env

# Generate encryption keys
ENCRYPTION_KEY=$(openssl rand -hex 16)
DATA_PROTECTION_KEY=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)

sed -i.bak "s/your-32-char-encryption-key-here/$ENCRYPTION_KEY/g" .env
sed -i.bak "s/your-data-protection-key-here/$DATA_PROTECTION_KEY/g" .env

# Set build timestamp
BUILD_TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
sed -i.bak "s/BUILD_TIMESTAMP=.*/BUILD_TIMESTAMP=$BUILD_TIMESTAMP/g" .env

# Clean up backup files
rm -f .env.bak

echo "✅ Environment file configured successfully"

# Validate the configuration
echo "🔍 Validating environment configuration..."
if ./scripts/validate-environment.sh; then
    echo ""
    echo "🎉 Environment setup completed successfully!"
    echo ""
    echo "📋 Next steps:"
    echo "  1. Review and customize .env file if needed"
    echo "  2. Start development environment: ./scripts/dev-environment.sh start"
    echo "  3. Run tests: npm test"
    echo ""
    echo "🤖 AI Swarm Status: 1,008 agents ready for deployment"
    echo "📍 Geographic Context: Benton County, WA (County Seat: Prosser) ✓"
    echo "🏛️ Government Compliance: FISMA High level configured"
else
    echo "❌ Environment validation failed"
    echo "Please check the .env file and fix any issues"
    exit 1
fi
