#!/bin/bash

# TerraFusion Development Setup Script
# This script sets up the complete development environment

set -e

echo "🚀 Starting TerraFusion Development Environment Setup..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please update .env file with your actual configuration values before proceeding."
    echo "   Required: POSTGRES_PASSWORD, REDIS_PASSWORD, JWT_SECRET_KEY"
    read -p "Press Enter to continue after updating .env file..."
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p logs/nginx
mkdir -p data/postgres
mkdir -p data/redis
mkdir -p docker/nginx/ssl

# Generate self-signed SSL certificate for development
if [ ! -f docker/nginx/ssl/cert.pem ]; then
    echo "🔐 Generating self-signed SSL certificate for development..."
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout docker/nginx/ssl/private.key \
        -out docker/nginx/ssl/cert.pem \
        -subj "/C=US/ST=State/L=City/O=TerraFusion/CN=localhost"
fi

# Pull latest images
echo "📦 Pulling latest Docker images..."
docker-compose pull

# Build custom images
echo "🔨 Building application images..."
docker-compose build --parallel

# Start services
echo "🚀 Starting services..."
docker-compose up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be ready..."
sleep 30

# Check service health
echo "🔍 Checking service health..."
docker-compose ps

# Display useful information
echo ""
echo "✅ TerraFusion Development Environment is ready!"
echo ""
echo "🌐 Application URLs:"
echo "   Frontend:    http://localhost:\${{TF_FRONTEND_PORT:-3000}}"
echo "   Backend API: http://localhost:\${{TF_FRONTEND_PORT:-3000}}"
echo "   AI Agent:    http://localhost:\${{TF_FRONTEND_PORT:-3000}}"
echo "   Database:    localhost:\${{TF_FRONTEND_PORT:-3000}}"
echo "   Redis:       localhost:\${{TF_FRONTEND_PORT:-3000}}"
echo ""
echo "📊 Useful commands:"
echo "   View logs:       docker-compose logs -f [service_name]"
echo "   Stop services:   docker-compose down"
echo "   Restart:         docker-compose restart [service_name]"
echo "   Database shell:  docker-compose exec postgres psql -U terrafusion_user -d terrafusion"
echo "   Redis CLI:       docker-compose exec redis redis-cli"
echo ""
echo "🔧 Troubleshooting:"
echo "   Check status:    docker-compose ps"
echo "   View all logs:   docker-compose logs"
echo "   Rebuild images:  docker-compose build --no-cache"
echo ""

# Optional: Open browser
if command -v xdg-open &> /dev/null; then
    read -p "Open application in browser? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        xdg-open http://localhost:\${{TF_FRONTEND_PORT:-3000}}
    fi
elif command -v open &> /dev/null; then
    read -p "Open application in browser? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        open http://localhost:\${{TF_FRONTEND_PORT:-3000}}
    fi
fi

echo "🎉 Setup complete! Happy coding!"
