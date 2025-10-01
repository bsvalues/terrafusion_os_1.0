#!/bin/bash

# 🚀 BENTON COUNTY AI - ONE CLICK DEPLOY
# Deploy the world's most advanced government AI system
# 
# "Do Your Job" - Bill Belichick
# "Let's Go!" - Tom Brady
#
# Version: 2.0 LEGENDARY EDITION
# Target: 4-Hour Championship Deployment

set -e  # Exit on any error

# Colors for championship output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Championship banner
echo -e "${BLUE}"
echo "🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆"
echo "🏆                                                                            🏆"
echo "🏆                   BENTON COUNTY AI CHAMPIONSHIP                           🏆"
echo "🏆                        ONE-CLICK DEPLOY                                   🏆"
echo "🏆                                                                            🏆"
echo "🏆                    \"Excellence is not a skill,                            🏆"
echo "🏆                     it's an attitude.\" - Tom Brady                        🏆"
echo "🏆                                                                            🏆"
echo "🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆"
echo -e "${NC}"

# Deployment configuration
DEPLOYMENT_START=$(date)
DEPLOYMENT_DIR="/opt/benton-county-ai"
DATA_DIR="/var/lib/benton-county-ai"
LOG_DIR="/var/log/benton-county-ai"
SERVICE_USER="benton-ai"

# Championship functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_success() {
    echo -e "${CYAN}[SUCCESS]${NC} $1"
}

check_championship_requirements() {
    log_info "🔍 Checking championship system requirements..."
    
    # Check OS
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        log_success "✅ Linux detected"
    else
        log_error "❌ This deployment requires Linux (Ubuntu 22.04+ recommended)"
        exit 1
    fi
    
    # Check RAM
    TOTAL_RAM=$(free -g | awk '/^Mem:/{print $2}')
    if [ "$TOTAL_RAM" -lt 16 ]; then
        log_warn "⚠️  Minimum 16GB RAM recommended (found ${TOTAL_RAM}GB)"
    else
        log_success "✅ RAM: ${TOTAL_RAM}GB"
    fi
    
    # Check disk space
    AVAILABLE_SPACE=$(df / | awk 'NR==2 {print int($4/1024/1024)}')
    if [ "$AVAILABLE_SPACE" -lt 500 ]; then
        log_error "❌ Minimum 500GB free space required (found ${AVAILABLE_SPACE}GB)"
        exit 1
    else
        log_success "✅ Disk Space: ${AVAILABLE_SPACE}GB available"
    fi
    
    # Check network
    if ping -c 1 google.com &> /dev/null; then
        log_success "✅ Network connectivity"
    else
        log_error "❌ Network connectivity required"
        exit 1
    fi
    
    log_success "🏆 All championship requirements met!"
}

install_docker() {
    log_info "🐳 Installing Docker (Championship Container Platform)..."
    
    if command -v docker &> /dev/null; then
        log_success "✅ Docker already installed"
        return
    fi
    
    # Install Docker
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    
    # Add current user to docker group
    sudo usermod -aG docker $USER
    
    # Install docker-compose
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    
    # Start Docker service
    sudo systemctl enable docker
    sudo systemctl start docker
    
    log_success "🏆 Docker installed successfully"
}

setup_ollama() {
    log_info "🤖 Setting up Ollama (Championship LLM Foundation)..."
    
    # Install Ollama
    curl -fsSL https://ollama.ai/install.sh | sh
    
    # Start Ollama service
    sudo systemctl enable ollama
    sudo systemctl start ollama
    
    # Pull championship models
    log_info "📥 Downloading championship models..."
    ollama pull llama3.1:8b
    ollama pull codellama:13b
    ollama pull mistral:7b
    
    log_success "🏆 Ollama championship models ready"
}

create_championship_user() {
    log_info "👤 Creating championship service user..."
    
    if id "$SERVICE_USER" &>/dev/null; then
        log_success "✅ Service user already exists"
        return
    fi
    
    sudo useradd -r -s /bin/false -d "$DEPLOYMENT_DIR" "$SERVICE_USER"
    log_success "🏆 Championship service user created"
}

setup_directories() {
    log_info "📁 Setting up championship directories..."
    
    sudo mkdir -p "$DEPLOYMENT_DIR"
    sudo mkdir -p "$DATA_DIR"
    sudo mkdir -p "$LOG_DIR"
    
    sudo chown -R "$SERVICE_USER:$SERVICE_USER" "$DEPLOYMENT_DIR"
    sudo chown -R "$SERVICE_USER:$SERVICE_USER" "$DATA_DIR"
    sudo chown -R "$SERVICE_USER:$SERVICE_USER" "$LOG_DIR"
    
    log_success "🏆 Championship directories ready"
}

deploy_championship_stack() {
    log_info "🚀 Deploying championship Docker stack..."
    
    # Create docker-compose.yml
    sudo tee "$DEPLOYMENT_DIR/docker-compose.yml" > /dev/null <<EOF
version: '3.8'

services:
  # Championship Database
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: benton_county_ai
      POSTGRES_USER: champion
      POSTGRES_PASSWORD: \${POSTGRES_PASSWORD:-championship2024}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U champion"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Championship Cache
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Championship Vector Database
  chromadb:
    image: chromadb/chroma:latest
    ports:
      - "8000:8000"
    volumes:
      - chroma_data:/chroma/chroma
    restart: unless-stopped
    environment:
      - CHROMA_SERVER_HOST=0.0.0.0
      - CHROMA_SERVER_HTTP_PORT=\${{TF_DOCS_PORT:-8000}}

  # GENIUS Agent (The Mastermind)
  genius-agent:
    image: benton-county/genius-agent:latest
    ports:
      - "8001:8000"
    environment:
      - OLLAMA_BASE_URL=http://host.docker.internal:11434
      - POSTGRES_URL=postgresql://champion:\${POSTGRES_PASSWORD:-championship2024}@postgres:5432/benton_county_ai
      - REDIS_URL=redis://redis:6379
      - CHROMA_URL=http://chromadb:8000
    depends_on:
      - postgres
      - redis
      - chromadb
    restart: unless-stopped
    volumes:
      - \${DATA_DIR}/genius:/app/data

  # HELPER Agent (The Operational Excellence)
  helper-agent:
    image: benton-county/helper-agent:latest
    ports:
      - "8002:8000"
    environment:
      - OLLAMA_BASE_URL=http://host.docker.internal:11434
      - POSTGRES_URL=postgresql://champion:\${POSTGRES_PASSWORD:-championship2024}@postgres:5432/benton_county_ai
      - REDIS_URL=redis://redis:6379
      - CHROMA_URL=http://chromadb:8000
    depends_on:
      - postgres
      - redis
      - chromadb
    restart: unless-stopped
    volumes:
      - \${DATA_DIR}/helper:/app/data

  # GUARDIAN Agent (The Security Champion)
  guardian-agent:
    image: benton-county/guardian-agent:latest
    ports:
      - "8003:8000"
    environment:
      - OLLAMA_BASE_URL=http://host.docker.internal:11434
      - POSTGRES_URL=postgresql://champion:\${POSTGRES_PASSWORD:-championship2024}@postgres:5432/benton_county_ai
      - REDIS_URL=redis://redis:6379
      - CHROMA_URL=http://chromadb:8000
    depends_on:
      - postgres
      - redis
      - chromadb
    restart: unless-stopped
    volumes:
      - \${DATA_DIR}/guardian:/app/data

  # Championship Frontend
  frontend:
    image: benton-county/championship-frontend:latest
    ports:
      - "80:80"
      - "443:443"
    environment:
      - GENIUS_API_URL=http://genius-agent:8000
      - HELPER_API_URL=http://helper-agent:8000
      - GUARDIAN_API_URL=http://guardian-agent:8000
    depends_on:
      - genius-agent
      - helper-agent
      - guardian-agent
    restart: unless-stopped
    volumes:
      - \${DATA_DIR}/frontend:/app/data

volumes:
  postgres_data:
  redis_data:
  chroma_data:

networks:
  default:
    name: championship-network
EOF

    # Set environment variables
    sudo tee "$DEPLOYMENT_DIR/.env" > /dev/null <<EOF
POSTGRES_PASSWORD=championship2024
DATA_DIR=$DATA_DIR
LOG_DIR=$LOG_DIR
DEPLOYMENT_DIR=$DEPLOYMENT_DIR
EOF

    # Deploy the stack
    cd "$DEPLOYMENT_DIR"
    sudo -u "$SERVICE_USER" docker-compose up -d
    
    log_success "🏆 Championship stack deployed!"
}

setup_monitoring() {
    log_info "📊 Setting up championship monitoring..."
    
    # Create monitoring script
    sudo tee "$DEPLOYMENT_DIR/monitor.sh" > /dev/null <<'EOF'
#!/bin/bash
# Championship Health Monitor

check_service() {
    local service=$1
    local url=$2
    
    if curl -s "$url" > /dev/null; then
        echo "✅ $service: HEALTHY"
    else
        echo "❌ $service: UNHEALTHY"
    fi
}

echo "🏆 BENTON COUNTY AI CHAMPIONSHIP - Health Check"
echo "=============================================="
check_service "GENIUS Agent" "http://localhost:\${{TF_SERVICE_8001_PORT:-8001}}/health"
check_service "HELPER Agent" "http://localhost:\${{TF_SERVICE_8001_PORT:-8001}}/health"
check_service "GUARDIAN Agent" "http://localhost:\${{TF_SERVICE_8001_PORT:-8001}}/health"
check_service "ChromaDB" "http://localhost:\${{TF_SERVICE_8001_PORT:-8001}}/api/v1/heartbeat"
check_service "Frontend" "http://localhost/"
echo "=============================================="
EOF

    sudo chmod +x "$DEPLOYMENT_DIR/monitor.sh"
    
    # Setup cron job for monitoring
    echo "*/5 * * * * $DEPLOYMENT_DIR/monitor.sh >> $LOG_DIR/health.log" | sudo crontab -u "$SERVICE_USER" -
    
    log_success "🏆 Championship monitoring active"
}

run_championship_tests() {
    log_info "🧪 Running championship validation tests..."
    
    # Wait for services to be ready
    sleep 30
    
    # Test database connectivity
    if sudo -u "$SERVICE_USER" docker-compose exec -T postgres pg_isready -U champion; then
        log_success "✅ Database: READY"
    else
        log_error "❌ Database: NOT READY"
    fi
    
    # Test Redis
    if sudo -u "$SERVICE_USER" docker-compose exec -T redis redis-cli ping | grep -q PONG; then
        log_success "✅ Redis: READY"
    else
        log_error "❌ Redis: NOT READY"
    fi
    
    # Test ChromaDB
    if curl -s http://localhost:\${{TF_SERVICE_8001_PORT:-8001}}/api/v1/heartbeat > /dev/null; then
        log_success "✅ ChromaDB: READY"
    else
        log_error "❌ ChromaDB: NOT READY"
    fi
    
    log_success "🏆 Championship system validation complete!"
}

championship_summary() {
    DEPLOYMENT_END=$(date)
    
    echo -e "${GREEN}"
    echo "🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆"
    echo "🏆                                                                            🏆"
    echo "🏆                   CHAMPIONSHIP DEPLOYMENT COMPLETE!                       🏆"
    echo "🏆                                                                            🏆"
    echo "🏆                        🏆 WE'RE READY TO WIN! 🏆                          🏆"
    echo "🏆                                                                            🏆"
    echo "🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆"
    echo -e "${NC}"
    
    echo -e "${CYAN}Championship Services:${NC}"
    echo "  🧠 GENIUS Agent:    http://localhost:\${{TF_SERVICE_8001_PORT:-8001}}"
    echo "  🤝 HELPER Agent:    http://localhost:\${{TF_SERVICE_8001_PORT:-8001}}"
    echo "  🛡️  GUARDIAN Agent:  http://localhost:\${{TF_SERVICE_8001_PORT:-8001}}"
    echo "  🌐 Frontend:        http://localhost"
    echo "  🔍 ChromaDB:        http://localhost:\${{TF_SERVICE_8001_PORT:-8001}}"
    
    echo -e "${CYAN}Championship Management:${NC}"
    echo "  📊 Monitor:         $DEPLOYMENT_DIR/monitor.sh"
    echo "  📁 Data:            $DATA_DIR"
    echo "  📋 Logs:            $LOG_DIR"
    echo "  🔧 Config:          $DEPLOYMENT_DIR"
    
    echo -e "${CYAN}Championship Timeline:${NC}"
    echo "  🚀 Started:         $DEPLOYMENT_START"
    echo "  🏆 Completed:       $DEPLOYMENT_END"
    
    echo -e "${GREEN}"
    echo "🎉 CONGRATULATIONS! 🎉"
    echo "Benton County AI Championship System is now LIVE and ready to serve citizens!"
    echo "\"Do your job!\" - Bill Belichick"
    echo "\"Let's go!\" - Tom Brady"
    echo -e "${NC}"
}

# CHAMPIONSHIP DEPLOYMENT SEQUENCE
main() {
    log_info "🏆 Starting Benton County AI Championship deployment..."
    
    check_championship_requirements
    create_championship_user
    setup_directories
    install_docker
    setup_ollama
    deploy_championship_stack
    setup_monitoring
    run_championship_tests
    championship_summary
    
    log_success "🏆 CHAMPIONSHIP DEPLOYED! EXCELLENCE DELIVERED!"
}

# Execute championship deployment
main "$@"