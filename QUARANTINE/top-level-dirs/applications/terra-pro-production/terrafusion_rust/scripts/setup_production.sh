#!/bin/bash

# TerraFusion Production Setup - Complete automation

echo "🎯 TerraFusion Production Setup"
echo "==============================="

# Create production Docker Compose
cat > docker-compose.prod.yml << EOF
version: '3.8'

services:
  terrafusion-rust:
    build: .
    container_name: terrafusion-production
    ports:
      - "8080:8080"
      - "8081:8081"
    environment:
      - RUST_LOG=info
      - DATABASE_URL=postgresql://terrafusion:terrafusion_prod@postgres:5432/terrafusion
    volumes:
      - ./data:/app/data
      - ./logs:/app/logs
      - ./uploads:/app/uploads
      - ./exports:/app/exports
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  postgres:
    image: postgres:15-alpine
    container_name: terrafusion-postgres
    environment:
      - POSTGRES_DB=terrafusion
      - POSTGRES_USER=terrafusion
      - POSTGRES_PASSWORD=terrafusion_prod
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    container_name: terrafusion-redis
    ports:
      - "6379:6379"
    restart: unless-stopped

volumes:
  postgres_data:
EOF

echo "✅ Production Docker Compose created"

# Create API test script
cat > scripts/test_api.sh << 'EOF'
#!/bin/bash

echo "🧪 Testing TerraFusion API..."

# Test health endpoint
echo "Testing health endpoint..."
curl -s http://localhost:8080/api/health | jq . 2>/dev/null || echo "Health endpoint not responding"

# Test agents endpoint
echo "Testing agents endpoint..."
curl -s http://localhost:8080/api/agents | jq . 2>/dev/null || echo "Agents endpoint not responding"

# Test valuation endpoint
echo "Testing valuation endpoint..."
curl -X POST http://localhost:8080/api/valuation \
  -H "Content-Type: application/json" \
  -d '{
    "address": "123 Test Street",
    "square_feet": 2000,
    "bedrooms": 3,
    "bathrooms": 2.0
  }' 2>/dev/null || echo "Valuation endpoint not responding"

echo "✅ API tests complete"
EOF

chmod +x scripts/test_api.sh

echo "✅ API test script created"
echo ""
echo "🚀 Production setup complete!"
echo "Run: docker-compose -f docker-compose.prod.yml up -d"