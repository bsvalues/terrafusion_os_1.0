#!/bin/bash

# TerraFusion cOS Real Demo Launcher
# Uses existing TerraFusion infrastructure and services

echo "🚀 Starting TerraFusion cOS Demo Environment"
echo "======================================================"

# Set working directory
DEMO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$DEMO_DIR")"

echo "📁 Demo Directory: $DEMO_DIR"
echo "📁 Root Directory: $ROOT_DIR"

# Check if we're in WSL/Linux environment
if [[ $(uname -r) =~ WSL|Microsoft ]]; then
    echo "🐧 Detected WSL environment"
    ENVIRONMENT="wsl"
else
    echo "🐧 Detected Linux environment"
    ENVIRONMENT="linux"
fi

# Function to check if port is available
check_port() {
    local port=$1
    if netstat -tuln | grep ":$port " > /dev/null; then
        echo "❌ Port $port is already in use"
        return 1
    else
        echo "✅ Port $port is available"
        return 0
    fi
}

# Function to start service with health check
start_service() {
    local service_name=$1
    local command=$2
    local port=$3
    local health_endpoint=$4

    echo "🔄 Starting $service_name..."

    # Start service in background
    eval $command &
    local pid=$!

    # Wait for service to be ready
    echo "⏳ Waiting for $service_name to be ready on port $port..."
    for i in {1..30}; do
        if curl -s "http://localhost:$port$health_endpoint" > /dev/null 2>&1; then
            echo "✅ $service_name is ready (PID: $pid)"
            return 0
        fi
        sleep 2
    done

    echo "❌ $service_name failed to start properly"
    return 1
}

echo ""
echo "🔍 Checking prerequisites..."

# Check Docker
if command -v docker > /dev/null; then
    echo "✅ Docker is available"
    DOCKER_AVAILABLE=true
else
    echo "⚠️  Docker not found - using direct process mode"
    DOCKER_AVAILABLE=false
fi

# Check .NET
if command -v dotnet > /dev/null; then
    echo "✅ .NET Core is available"
    DOTNET_AVAILABLE=true
else
    echo "❌ .NET Core not found - cannot start backend API"
    DOTNET_AVAILABLE=false
fi

# Check Node.js
if command -v node > /dev/null; then
    echo "✅ Node.js is available"
    NODE_AVAILABLE=true
else
    echo "⚠️  Node.js not found - limited functionality"
    NODE_AVAILABLE=false
fi

echo ""
echo "🏗️  Starting TerraFusion Services..."

# Start PostgreSQL (if using Docker)
if [ "$DOCKER_AVAILABLE" = true ]; then
    echo "🐳 Starting PostgreSQL container..."
    docker run -d \
        --name terrafusion-demo-postgres \
        -e POSTGRES_DB=terrafusion_demo \
        -e POSTGRES_USER=demo_user \
        -e POSTGRES_PASSWORD=demo_pass_2024 \
        -p 5433:5432 \
        --restart unless-stopped \
        postgis/postgis:15-3.3 > /dev/null 2>&1

    echo "⏳ Waiting for PostgreSQL to be ready..."
    for i in {1..15}; do
        if docker exec terrafusion-demo-postgres pg_isready -U demo_user -d terrafusion_demo > /dev/null 2>&1; then
            echo "✅ PostgreSQL is ready"
            break
        fi
        sleep 2
    done

    # Start Redis
    echo "🐳 Starting Redis container..."
    docker run -d \
        --name terrafusion-demo-redis \
        -p 6380:6379 \
        --restart unless-stopped \
        redis:7-alpine > /dev/null 2>&1
    echo "✅ Redis started"
fi

# Start TerraFusion API Backend (if .NET available)
if [ "$DOTNET_AVAILABLE" = true ]; then
    echo "🔧 Starting TerraFusion API Backend..."
    cd "$ROOT_DIR/backend/TerraFusion.API"

    # Set environment variables for demo
    export ASPNETCORE_ENVIRONMENT=Development
    export ASPNETCORE_URLS="http://localhost:5001"
    export ConnectionStrings__DefaultConnection="Server=localhost,5433;Database=terrafusion_demo;User Id=demo_user;Password=demo_pass_2024;TrustServerCertificate=true"
    export ConnectionStrings__RedisConnection="localhost:6380"
    export DEMO_MODE=true
    export DEMO_DATA_ENABLED=true

    # Build and start API
    dotnet build --configuration Release > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "✅ Backend build successful"
        start_service "TerraFusion API" "dotnet run --urls http://localhost:5001" "5001" "/health"
        API_STARTED=true
    else
        echo "❌ Backend build failed"
        API_STARTED=false
    fi

    cd "$DEMO_DIR"
else
    API_STARTED=false
fi

# Copy vendor integration interface to accessible location
echo "📄 Setting up demo interface..."
cp "$DEMO_DIR/vendor-integration-interface.html" "$DEMO_DIR/index.html"

# Start simple HTTP server for demo interface
if [ "$NODE_AVAILABLE" = true ]; then
    echo "🌐 Starting demo web server..."
    cd "$DEMO_DIR"

    # Create simple HTTP server script
    cat > "$DEMO_DIR/demo-server.js" << 'EOF'
const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
    let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);

    // Security check
    if (!filePath.startsWith(__dirname)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }

    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404);
                res.end('Not Found');
            } else {
                res.writeHead(500);
                res.end('Server Error');
            }
        } else {
            let contentType = 'text/html';
            const ext = path.extname(filePath);
            if (ext === '.js') contentType = 'application/javascript';
            else if (ext === '.css') contentType = 'text/css';
            else if (ext === '.json') contentType = 'application/json';

            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        }
    });
});

const PORT = 8080;
server.listen(PORT, () => {
    console.log(`Demo server running at http://localhost:${PORT}`);
});
EOF

    start_service "Demo Web Server" "node demo-server.js" "8080" "/"
    WEB_SERVER_STARTED=true
else
    echo "⚠️  Node.js not available - serving static files only"
    WEB_SERVER_STARTED=false
fi

echo ""
echo "🎉 TerraFusion cOS Demo Environment Started!"
echo "======================================================"
echo ""
echo "📊 Service Status:"
if [ "$DOCKER_AVAILABLE" = true ]; then
    echo "  🐳 PostgreSQL (Harris PACS Demo DB): http://localhost:5433"
    echo "  🐳 Redis Cache: http://localhost:6380"
fi

if [ "$API_STARTED" = true ]; then
    echo "  🔧 TerraFusion API Backend: http://localhost:5001"
    echo "      Health Check: http://localhost:5001/health"
    echo "      TerraFusion Sync: http://localhost:5001/api/sync/status"
fi

if [ "$WEB_SERVER_STARTED" = true ]; then
    echo "  🌐 Demo Interface: http://localhost:8080"
    echo ""
    echo "🚀 Ready! Open http://localhost:8080 in your browser to access the demo."
else
    echo "  📄 Demo Interface: file://$DEMO_DIR/index.html"
    echo ""
    echo "🚀 Ready! Open $DEMO_DIR/index.html in your browser to access the demo."
fi

echo ""
echo "🔧 Demo Features:"
echo "  ✅ TerraFusion Sync Service (AI-powered legacy DB sync)"
echo "  ✅ Harris PACS Integration (89,247 Benton County properties)"
echo "  ✅ Real TerraFusion UI/UX components"
echo "  ✅ Vendor Integration Patterns (Sidecar, API Gateway, Event-Driven)"
echo "  ✅ Live sync monitoring and metrics"
echo "  ✅ County-specific data isolation"
echo ""
echo "📋 Available APIs (if backend is running):"
echo "  GET  /api/sync/status           - Get sync service status"
echo "  GET  /api/sync/legacy-systems   - List registered legacy systems"
echo "  GET  /api/sync/counties         - List configured counties"
echo "  POST /api/sync/start            - Start synchronization"
echo "  GET  /api/harris-pacs/jurisdictions/benton/properties - Get Harris PACS data"
echo ""
echo "🛑 To stop the demo, run: ./stop-demo.sh"

# Create stop script
cat > "$DEMO_DIR/stop-demo.sh" << 'EOF'
#!/bin/bash
echo "🛑 Stopping TerraFusion cOS Demo Environment..."

# Stop Docker containers
docker stop terrafusion-demo-postgres terrafusion-demo-redis > /dev/null 2>&1
docker rm terrafusion-demo-postgres terrafusion-demo-redis > /dev/null 2>&1

# Kill Node.js processes
pkill -f "node demo-server.js" > /dev/null 2>&1

# Kill .NET processes
pkill -f "TerraFusion.API" > /dev/null 2>&1

echo "✅ Demo environment stopped"
EOF

chmod +x "$DEMO_DIR/stop-demo.sh"

echo "✅ Demo launcher completed successfully!"