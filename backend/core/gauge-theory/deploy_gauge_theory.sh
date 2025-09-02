#!/bin/bash

# TERRAFUSION GAUGE FIELD THEORY: PRODUCTION DEPLOYMENT SCRIPT
# Deploys the revolutionary physics-based governance optimization system

set -e

echo "🚀 TERRAFUSION GAUGE FIELD THEORY - PRODUCTION DEPLOYMENT"
echo "🔬 Revolutionary physics-based governance optimization"
echo "=================================================="

# Configuration
GAUGE_THEORY_PORT=8000
GAUGE_THEORY_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="$GAUGE_THEORY_DIR/deployment.log"
PID_FILE="$GAUGE_THEORY_DIR/gauge_theory.pid"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$LOG_FILE"
}

# Check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        error "This script should not be run as root"
        exit 1
    fi
}

# Check system requirements
check_requirements() {
    log "Checking system requirements..."
    
    # Check Python version
    if ! command -v python3 &> /dev/null; then
        error "Python 3 is required but not installed"
        exit 1
    fi
    
    PYTHON_VERSION=$(python3 --version | cut -d' ' -f2 | cut -d'.' -f1,2)
    if [[ $(echo "$PYTHON_VERSION >= 3.8" | bc -l) -eq 0 ]]; then
        error "Python 3.8+ is required, found $PYTHON_VERSION"
        exit 1
    fi
    
    # Check pip
    if ! command -v pip3 &> /dev/null; then
        error "pip3 is required but not installed"
        exit 1
    fi
    
    # Check if port is available
    if netstat -tuln | grep ":$GAUGE_THEORY_PORT " > /dev/null; then
        error "Port $GAUGE_THEORY_PORT is already in use"
        exit 1
    fi
    
    log "System requirements check passed"
}

# Install dependencies
install_dependencies() {
    log "Installing Python dependencies..."
    
    # Create virtual environment if it doesn't exist
    if [[ ! -d "$GAUGE_THEORY_DIR/venv" ]]; then
        log "Creating virtual environment..."
        python3 -m venv "$GAUGE_THEORY_DIR/venv"
    fi
    
    # Activate virtual environment
    source "$GAUGE_THEORY_DIR/venv/bin/activate"
    
    # Upgrade pip
    pip install --upgrade pip
    
    # Install required packages
    pip install fastapi uvicorn pydantic numpy asyncio
    
    log "Dependencies installed successfully"
}

# Validate system
validate_system() {
    log "Validating gauge theory system..."
    
    cd "$GAUGE_THEORY_DIR"
    
    # Check if all required files exist
    required_files=(
        "terra_fusion_gauge_theory.py"
        "cama_instanton.py"
        "county_lattice_gauge.py"
        "terra_fusion_gauge_integration.py"
        "gauge_theory_api.py"
    )
    
    for file in "${required_files[@]}"; do
        if [[ ! -f "$file" ]]; then
            error "Required file not found: $file"
            exit 1
        fi
    done
    
    # Test Python imports
    log "Testing Python imports..."
    if ! python3 -c "
import terra_fusion_gauge_theory
import cama_instanton
import county_lattice_gauge
import terra_fusion_gauge_integration
import gauge_theory_api
print('All imports successful')
"; then
        error "Python import test failed"
        exit 1
    fi
    
    log "System validation passed"
}

# Start the service
start_service() {
    log "Starting TerraFusion Gauge Field Theory service..."
    
    cd "$GAUGE_THEORY_DIR"
    source "$GAUGE_THEORY_DIR/venv/bin/activate"
    
    # Start the service in background
    nohup python3 gauge_theory_api.py > "$GAUGE_THEORY_DIR/gauge_theory.log" 2>&1 &
    
    # Save PID
    echo $! > "$PID_FILE"
    
    # Wait for service to start
    sleep 5
    
    # Check if service is running
    if [[ -f "$PID_FILE" ]] && ps -p $(cat "$PID_FILE") > /dev/null; then
        log "Service started successfully (PID: $(cat $PID_FILE))"
        log "Service available at: http://localhost:$GAUGE_THEORY_PORT"
        log "API documentation at: http://localhost:$GAUGE_THEORY_PORT/docs"
    else
        error "Failed to start service"
        exit 1
    fi
}

# Stop the service
stop_service() {
    log "Stopping TerraFusion Gauge Field Theory service..."
    
    if [[ -f "$PID_FILE" ]]; then
        PID=$(cat "$PID_FILE")
        if ps -p "$PID" > /dev/null; then
            kill "$PID"
            log "Service stopped (PID: $PID)"
        else
            warn "Service not running"
        fi
        rm -f "$PID_FILE"
    else
        warn "PID file not found"
    fi
}

# Restart the service
restart_service() {
    log "Restarting TerraFusion Gauge Field Theory service..."
    stop_service
    sleep 2
    start_service
}

# Check service status
check_status() {
    if [[ -f "$PID_FILE" ]]; then
        PID=$(cat "$PID_FILE")
        if ps -p "$PID" > /dev/null; then
            log "Service is running (PID: $PID)"
            log "Service available at: http://localhost:$GAUGE_THEORY_PORT"
            
            # Test health endpoint
            if command -v curl &> /dev/null; then
                if curl -s "http://localhost:$GAUGE_THEORY_PORT/health" > /dev/null; then
                    log "Health check passed"
                else
                    warn "Health check failed"
                fi
            fi
        else
            warn "Service is not running (stale PID file)"
            rm -f "$PID_FILE"
        fi
    else
        warn "Service is not running (no PID file)"
    fi
}

# Show logs
show_logs() {
    if [[ -f "$GAUGE_THEORY_DIR/gauge_theory.log" ]]; then
        log "Showing recent logs:"
        tail -n 50 "$GAUGE_THEORY_DIR/gauge_theory.log"
    else
        warn "No log file found"
    fi
}

# Clean up
cleanup() {
    log "Cleaning up..."
    stop_service
    rm -f "$PID_FILE"
    log "Cleanup complete"
}

# Main deployment function
deploy() {
    log "Starting deployment process..."
    
    check_root
    check_requirements
    install_dependencies
    validate_system
    start_service
    
    log "Deployment completed successfully!"
    log "TerraFusion Gauge Field Theory is now operational"
    log "Access the system at: http://localhost:$GAUGE_THEORY_PORT"
}

# Handle script arguments
case "${1:-deploy}" in
    "deploy")
        deploy
        ;;
    "start")
        start_service
        ;;
    "stop")
        stop_service
        ;;
    "restart")
        restart_service
        ;;
    "status")
        check_status
        ;;
    "logs")
        show_logs
        ;;
    "cleanup")
        cleanup
        ;;
    "help"|"-h"|"--help")
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  deploy   - Full deployment (default)"
        echo "  start    - Start the service"
        echo "  stop     - Stop the service"
        echo "  restart  - Restart the service"
        echo "  status   - Check service status"
        echo "  logs     - Show service logs"
        echo "  cleanup  - Clean up and stop service"
        echo "  help     - Show this help message"
        ;;
    *)
        error "Unknown command: $1"
        echo "Use '$0 help' for usage information"
        exit 1
        ;;
esac

# Trap cleanup on exit
trap cleanup EXIT

log "Script execution completed"
