#!/bin/bash

echo "🚀 TerraFusion Quick Start"
echo "========================="

echo "1. Starting services..."
docker-compose up -d

echo "2. Waiting for services to be ready..."
sleep 30

echo "3. Testing API endpoints..."
echo "GET /api/health:"
curl -s http://localhost:8080/api/health 2>/dev/null || echo "API starting up..."

echo -e "\n🎉 TerraFusion is starting up!"
echo "📊 Access monitoring at http://localhost:3000"
echo "🔗 API will be available at http://localhost:8080/api/"
