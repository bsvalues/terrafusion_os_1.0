#!/bin/bash

set -e

echo "🚀 TerraFusionPlatform ICSF Deployment Script"
echo "============================================"

check_dependencies() {
    echo "Checking dependencies..."
    command -v docker >/dev/null 2>&1 || { echo "Docker is required but not installed. Aborting." >&2; exit 1; }
    command -v docker-compose >/dev/null 2>&1 || { echo "Docker Compose is required but not installed. Aborting." >&2; exit 1; }
    echo "✓ Dependencies verified"
}

check_ssl_certificates() {
    echo "Checking SSL certificates..."
    if [ ! -f "nginx/ssl/cert.pem" ] || [ ! -f "nginx/ssl/key.pem" ]; then
        echo "⚠️  SSL certificates not found. Please place cert.pem and key.pem in nginx/ssl/"
        echo "Continuing without SSL..."
    else
        echo "✓ SSL certificates found"
    fi
}

build_services() {
    echo "Building services..."
    cd deployment
    docker-compose build
    echo "✓ Services built successfully"
}

start_services() {
    echo "Starting services..."
    docker-compose up -d
    echo "✓ Services started"
}

verify_deployment() {
    echo "Verifying deployment..."
    sleep 10
    
    if curl -f http://localhost:5000 >/dev/null 2>&1; then
        echo "✓ TerraFlow application is running on port 5000"
    else
        echo "❌ TerraFlow application failed to start"
        docker-compose logs terraflow-app
        exit 1
    fi
    
    if curl -f http://localhost:5001 >/dev/null 2>&1; then
        echo "✓ API server is running on port 5001"
    else
        echo "❌ API server failed to start"
        docker-compose logs api-server
        exit 1
    fi
}

main() {
    check_dependencies
    check_ssl_certificates
    build_services
    start_services
    verify_deployment
    
    echo ""
    echo "🎉 Deployment completed successfully!"
    echo "TerraFusionPlatform ICSF is now running:"
    echo "  - Main Application: http://localhost:5000"
    echo "  - API Server: http://localhost:5001"
    echo ""
    echo "To view logs: docker-compose logs -f [service-name]"
    echo "To stop services: docker-compose down"
}

main "$@"