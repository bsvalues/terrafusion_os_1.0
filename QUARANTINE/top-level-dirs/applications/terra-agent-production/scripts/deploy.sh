#!/bin/bash

set -e

echo "🚀 TerraFusion AI - Civil Infrastructure Brain Deployment"
echo "=============================================="

check_ssl_certificates() {
    if [[ ! -f "nginx/ssl/cert.pem" || ! -f "nginx/ssl/key.pem" ]]; then
        echo "❌ SSL certificates not found!"
        echo "Please place your SSL certificates in nginx/ssl/ as cert.pem and key.pem"
        exit 1
    fi
    echo "✅ SSL certificates found"
}

check_environment() {
    if [[ ! -f ".env" ]]; then
        echo "❌ .env file not found!"
        echo "Creating template .env file..."
        cat > .env << 'EOF'
DATABASE_URL=postgresql://terra_admin:your_password@postgres:5432/terra_fusion
OPENAI_API_KEY=your_openai_key_here
SESSION_SECRET=your_session_secret_here
POSTGRES_PASSWORD=your_secure_password_here
EOF
        echo "📝 Please update .env with your actual values and run again"
        exit 1
    fi
    echo "✅ Environment configuration found"
}

check_dependencies() {
    if ! command -v docker &> /dev/null; then
        echo "❌ Docker not found! Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        echo "❌ Docker Compose not found! Please install Docker Compose first."
        exit 1
    fi
    echo "✅ Docker and Docker Compose available"
}

deploy() {
    echo "🔧 Building and deploying TerraFusion AI..."
    
    docker-compose down --remove-orphans
    docker-compose build --no-cache
    docker-compose up -d
    
    echo "⏳ Waiting for services to start..."
    sleep 30
    
    if docker-compose ps | grep -q "Up"; then
        echo "✅ TerraFusion AI deployed successfully!"
        echo ""
        echo "🌐 Application URLs:"
        echo "   Main App: https://localhost"
        echo "   Metrics:  https://localhost/metrics"
        echo ""
        echo "📊 Service Status:"
        docker-compose ps
    else
        echo "❌ Deployment failed! Check logs:"
        docker-compose logs
        exit 1
    fi
}

main() {
    check_dependencies
    check_ssl_certificates
    check_environment
    deploy
}

main "$@"