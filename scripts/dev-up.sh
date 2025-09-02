#!/bin/bash

# TerraFusion OS 1.0 - Development Environment Setup
# One-command development environment for Benton County

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_ROOT/.env.dev"
COMPOSE_FILE="$PROJECT_ROOT/compose.dev.yaml"

# Banner
echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                    TerraFusion OS 1.0                       ║"
echo "║              Benton County Development Environment           ║"
echo "║                                                              ║"
echo "║  🏛️  Government AI Operating System                          ║"
echo "║  🤖  1,008 AI Agents | Development Mode                      ║"
echo "║  📊  Hot-reload Development with Production Parity          ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo "🚀 Starting TerraFusion OS Development Environment..."

# Check if environment file exists
if [ ! -f "$ENV_FILE" ]; then
    echo "📝 Creating development environment file..."
    cat > "$ENV_FILE" << 'EOF'
# TerraFusion OS 1.0 - Benton County Development Environment
TERRAFUSION_ENV=development
TERRAFUSION_COUNTY=benton
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=terrafusion_benton_dev
DATABASE_USER=terrafusion_dev
DATABASE_PASSWORD=dev_password
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=dev_jwt_secret_key
HARRIS_PACS_CONNECTION=dev_connection_string
EOF
    echo "✅ Development environment file created: $ENV_FILE"
fi

# Start development stack
echo "🐳 Starting development Docker services..."
docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Seed development data
echo "🌱 Seeding development data..."
if [ -f "$PROJECT_ROOT/scripts/seed-dev-data.sh" ]; then
    "$PROJECT_ROOT/scripts/seed-dev-data.sh" --county=benton --sample-size=1000
else
    echo "⚠️  Seed script not found. Using default data."
fi

# Start development servers
echo "🔄 Starting development servers..."

# Start frontend development server
echo "🎨 Starting React development server..."
cd "$PROJECT_ROOT/frontend"
if [ -f "package.json" ]; then
    npm install
    npm run dev &
    FRONTEND_PID=$!
    echo "✅ Frontend development server started (PID: $FRONTEND_PID)"
else
    echo "⚠️  Frontend package.json not found"
fi

# Start backend development server
echo "⚙️  Starting .NET development server..."
cd "$PROJECT_ROOT/backend"
if [ -f "TerraFusion.API.csproj" ]; then
    dotnet restore
    dotnet run --watch &
    BACKEND_PID=$!
    echo "✅ Backend development server started (PID: $BACKEND_PID)"
else
    echo "⚠️  Backend project file not found"
fi

# Wait for servers to start
echo "⏳ Waiting for development servers to start..."
sleep 15

# Health checks
echo "🏥 Performing health checks..."

# Check frontend
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Frontend is running"
else
    echo "⚠️  Frontend health check failed"
fi

# Check backend
if curl -f http://localhost:5000/health > /dev/null 2>&1; then
    echo "✅ Backend API is running"
else
    echo "⚠️  Backend health check failed"
fi

# Check database
if docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec -T postgres-dev pg_isready -U terrafusion_dev > /dev/null 2>&1; then
    echo "✅ Database is running"
else
    echo "⚠️  Database health check failed"
fi

# Check Redis
if docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec -T redis-dev redis-cli ping > /dev/null 2>&1; then
    echo "✅ Redis is running"
else
    echo "⚠️  Redis health check failed"
fi

# Display service status
echo "📊 Service Status:"
docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps

# Display URLs
echo "🌐 Development URLs:"
echo "  Frontend: http://localhost:3000"
echo "  Backend API: http://localhost:5000"
echo "  Database: localhost:5432"
echo "  Redis: localhost:6379"

# Success message
echo -e "${GREEN}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                DEVELOPMENT ENVIRONMENT READY!                ║"
echo "║                                                              ║"
echo "║  🎉 TerraFusion OS 1.0 development environment is running     ║"
echo "║  🏛️  Benton County development setup complete                ║"
echo "║  🔄 Hot-reload enabled for frontend and backend              ║"
echo "║  📊 Production parity with development convenience           ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo "✅ Development environment ready!"
echo ""
echo "📋 Available commands:"
echo "  npm test                    # Run frontend tests"
echo "  npm run e2e                # Run end-to-end tests"
echo "  dotnet test                # Run backend tests"
echo "  docker-compose logs        # View service logs"
echo "  docker-compose down        # Stop development environment"
echo ""
echo "🔄 Hot-reload is active - changes will automatically reload!"

# Save PIDs for cleanup
echo "$FRONTEND_PID" > /tmp/terrafusion-frontend.pid
echo "$BACKEND_PID" > /tmp/terrafusion-backend.pid

echo ""
echo "💡 Tip: Use Ctrl+C to stop the development servers"
echo "💡 Tip: Run 'docker-compose down' to stop all services"

exit 0
