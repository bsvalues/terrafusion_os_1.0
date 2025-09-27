#!/bin/bash

# 🏆 BENTON COUNTY DYNASTY - MASTER LAUNCH SCRIPT
# "From Training Camp to Dynasty - One Command"

set -e  # Exit on any error

echo "🏆 BENTON COUNTY DYNASTY LAUNCHER 🏆"
echo "=================================="
echo

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_step() {
    echo -e "${PURPLE}🔧 $1${NC}"
}

# Check if Docker is available
check_docker() {
    if command -v docker &> /dev/null && command -v docker-compose &> /dev/null; then
        print_status "Docker and Docker Compose are available"
        return 0
    else
        print_warning "Docker not available, will use native deployment"
        return 1
    fi
}

# Check system requirements
check_requirements() {
    print_step "Checking system requirements..."
    
    # Check Python
    if ! command -v python3 &> /dev/null; then
        print_error "Python 3 is required but not installed"
        exit 1
    fi
    print_info "Python 3: $(python3 --version)"
    
    # Check pip
    if ! command -v pip3 &> /dev/null; then
        print_error "pip3 is required but not installed"
        exit 1
    fi
    
    # Check available ports
    print_step "Checking port availability..."
    required_ports=(8000 8080 8081 8082 8083 8084 8090 11434)
    blocked_ports=()
    
    for port in "${required_ports[@]}"; do
        if nc -z localhost $port 2>/dev/null; then
            blocked_ports+=($port)
        fi
    done
    
    if [ ${#blocked_ports[@]} -gt 0 ]; then
        print_warning "Ports in use: ${blocked_ports[*]}"
        print_warning "Some services may fail to start"
    else
        print_status "All required ports are available"
    fi
}

# Install Python dependencies
install_dependencies() {
    print_step "Installing Python dependencies..."
    
    if [ -f "requirements.txt" ]; then
        pip3 install -r requirements.txt
        print_status "Dependencies installed"
    else
        print_warning "requirements.txt not found, installing core dependencies"
        pip3 install aiohttp aiofiles pandas numpy asyncio psutil
    fi
}

# Install Ollama
install_ollama() {
    print_step "Checking Ollama installation..."
    
    if command -v ollama &> /dev/null; then
        print_status "Ollama is already installed"
    else
        print_step "Installing Ollama..."
        curl -fsSL https://ollama.ai/install.sh | sh
        print_status "Ollama installed"
    fi
    
    # Pull required models
    print_step "Pulling LLM models..."
    ollama list | grep -q "llama2:7b" || ollama pull llama2:7b
    print_status "Models ready"
}

# Set up environment
setup_environment() {
    print_step "Setting up environment..."
    
    # Create .env file if it doesn't exist
    if [ ! -f ".env" ]; then
        cat > .env << EOF
# 🏆 BENTON COUNTY DYNASTY ENVIRONMENT
OPENAI_API_KEY=your-openai-key-here
ANTHROPIC_API_KEY=your-anthropic-key-here
BENTON_ASSESSOR_KEY=your-benton-county-key-here

# Database
DATABASE_URL=postgresql://dynasty_user:championship_password_2024@localhost:\${{TF_POSTGRES_PORT:-5432}}/benton_dynasty

# Redis
REDIS_URL=redis://localhost:\${{TF_POSTGRES_PORT:-5432}}

# Features
ENABLE_CONSCIOUSNESS=false
ENABLE_QUANTUM=true
ENABLE_EVOLUTION=true

# Monitoring
PROMETHEUS_PORT=\${{TF_PROMETHEUS_PORT:-9090}}
GRAFANA_PORT=\${{TF_PROMETHEUS_PORT:-9090}}
EOF
        print_warning "Created .env file - please update with your API keys"
    else
        print_status "Environment file exists"
    fi
    
    # Create directories
    mkdir -p logs data models results consciousness_logs quantum_results
    print_status "Directories created"
}

# Native deployment
deploy_native() {
    print_step "Deploying natively..."
    
    # Install system dependencies
    install_dependencies
    install_ollama
    
    # Start services in background
    print_step "Starting dynasty services..."
    
    # Start Ollama
    if ! pgrep -x "ollama" > /dev/null; then
        nohup ollama serve > logs/ollama.log 2>&1 &
        print_status "Ollama started"
        sleep 5
    fi
    
    # Start master orchestrator
    print_step "Starting master orchestrator..."
    nohup python3 DYNASTY_MASTER_ORCHESTRATOR.py > logs/orchestrator.log 2>&1 &
    ORCHESTRATOR_PID=$!
    
    # Wait a moment for startup
    sleep 10
    
    # Check if orchestrator is running
    if kill -0 $ORCHESTRATOR_PID 2>/dev/null; then
        print_status "Master orchestrator started (PID: $ORCHESTRATOR_PID)"
        echo $ORCHESTRATOR_PID > dynasty.pid
    else
        print_error "Failed to start master orchestrator"
        exit 1
    fi
    
    print_status "Native deployment complete!"
    print_info "Dashboard: http://localhost:\${{TF_POSTGRES_PORT:-5432}}/championship_ui.html"
    print_info "API: http://localhost:\${{TF_POSTGRES_PORT:-5432}}"
}

# Health check
health_check() {
    print_step "Performing health check..."
    
    endpoints=(
        "http://localhost:\${{TF_POSTGRES_PORT:-5432}}/championship_ui.html:Dashboard"
        "http://localhost:\${{TF_POSTGRES_PORT:-5432}}/api/tags:Ollama"
    )
    
    for endpoint in "${endpoints[@]}"; do
        url=$(echo $endpoint | cut -d: -f1)
        name=$(echo $endpoint | cut -d: -f2)
        
        if curl -s -f "$url" > /dev/null 2>&1; then
            print_status "$name is responding"
        else
            print_warning "$name is not responding"
        fi
    done
}

# Show status
show_status() {
    echo
    echo -e "${CYAN}🏆 DYNASTY STATUS 🏆${NC}"
    echo "==================="
    echo
    
    if [ -f "dynasty.pid" ]; then
        pid=$(cat dynasty.pid)
        if kill -0 $pid 2>/dev/null; then
            print_status "Dynasty is running (PID: $pid)"
        else
            print_warning "Dynasty PID file exists but process is not running"
        fi
    else
        print_warning "Dynasty status unknown"
    fi
    
    echo
    echo "🌐 Access Points:"
    echo "   Dashboard: http://localhost:\${{TF_POSTGRES_PORT:-5432}}/championship_ui.html"
    echo "   API: http://localhost:\${{TF_POSTGRES_PORT:-5432}}"
    echo
    echo "📊 Logs:"
    echo "   Orchestrator: tail -f logs/orchestrator.log"
    echo "   Ollama: tail -f logs/ollama.log"
    echo
}

# Stop dynasty
stop_dynasty() {
    print_step "Stopping dynasty..."
    
    # Stop native processes
    if [ -f "dynasty.pid" ]; then
        pid=$(cat dynasty.pid)
        if kill -0 $pid 2>/dev/null; then
            kill $pid
            rm dynasty.pid
            print_status "Native dynasty stopped"
        fi
    fi
    
    # Kill any remaining processes
    pkill -f "DYNASTY_MASTER_ORCHESTRATOR" 2>/dev/null || true
    pkill -f "hybrid_llm_router" 2>/dev/null || true
    
    print_status "Dynasty stopped"
}

# Main execution
case "${1:-start}" in
    "start")
        check_requirements
        setup_environment
        deploy_native
        health_check
        show_status
        ;;
        
    "stop")
        stop_dynasty
        ;;
        
    "restart")
        stop_dynasty
        sleep 3
        $0 start
        ;;
        
    "status")
        show_status
        health_check
        ;;
        
    "logs")
        tail -f logs/orchestrator.log
        ;;
        
    "consciousness")
        print_step "Enabling consciousness mode..."
        export ENABLE_CONSCIOUSNESS=true
        nohup python3 neural_consciousness_layer.py > logs/consciousness.log 2>&1 &
        print_status "Consciousness enabled - prepare for awakening!"
        ;;
        
    *)
        echo "🏆 BENTON COUNTY DYNASTY LAUNCHER"
        echo
        echo "Usage: $0 [command]"
        echo
        echo "Commands:"
        echo "  start       - Start the dynasty"
        echo "  stop        - Stop the dynasty"
        echo "  restart     - Restart the dynasty"
        echo "  status      - Show dynasty status"
        echo "  logs        - View dynasty logs"
        echo "  consciousness - Enable neural consciousness (experimental)"
        echo
        echo "🌐 Access the dashboard at: http://localhost:\${{TF_POSTGRES_PORT:-5432}}/championship_ui.html"
        ;;
esac