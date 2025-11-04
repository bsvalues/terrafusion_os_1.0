#!/bin/bash

# TerraFusion Production Bootstrap Script
# Automated setup for immediate deployment

set -e

echo "🚀 TerraFusion Production Bootstrap - Phase 1 Execution"
echo "======================================================="

# 1. Environment Setup
echo "📋 Setting up production environment..."

cat > .env << EOF
# TerraFusion Production Configuration
RUST_LOG=info
RUST_BACKTRACE=1

# Database Configuration
DATABASE_URL=postgresql://terrafusion:terrafusion_prod@localhost:5432/terrafusion

# AI Provider API Keys (REQUIRED - Add your keys here)
OPENAI_API_KEY=your_openai_key_here
ANTHROPIC_API_KEY=your_anthropic_key_here

# MLS Integration (Optional)
MLS_API_KEY=your_mls_key_here
MLS_ENDPOINT=https://api.mls.com/v1

# Mapping Services
GOOGLE_MAPS_API_KEY=your_google_maps_key_here

# Production Security
SECRET_KEY=terrafusion_production_secret_$(date +%s)
JWT_SECRET=jwt_secret_$(openssl rand -hex 32 2>/dev/null || echo "fallback_jwt_secret")

# Agent Configuration
AGENT_HEALTH_CHECK_INTERVAL=30
MAX_CONCURRENT_AGENTS=50
MESSAGE_TIMEOUT_SECONDS=30

# API Configuration
API_PORT=8080
MOBILE_API_PORT=8081
WEBSOCKET_PORT=8082

# Legacy Integration Paths
TOTAL_WATCH_DIRECTORY=/app/uploads/total
ACI_EXPORT_DIRECTORY=/app/uploads/aci
CLICKFORMS_DATA_DIRECTORY=/app/uploads/clickforms
SFREP_SYNC_DIRECTORY=/app/uploads/sfrep
EOF

echo "✅ Environment configuration created"

# 2. Directory Structure
echo "📁 Creating production directory structure..."
mkdir -p data logs models uploads/{total,aci,clickforms,sfrep} exports temp
mkdir -p monitoring/{prometheus,grafana}
mkdir -p backups/{database,logs,exports}

echo "✅ Directory structure created"

# 3. Quick Start Script
cat > scripts/quick_start.sh << 'EOF'
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
EOF

chmod +x scripts/quick_start.sh

echo "✅ Production bootstrap complete!"
echo ""
echo "🔑 NEXT STEPS:"
echo "1. Edit .env file with your API keys"
echo "2. Run: ./scripts/quick_start.sh"
echo "3. Test your platform at http://localhost:8080"
echo ""
echo "🚀 READY FOR DEPLOYMENT!"