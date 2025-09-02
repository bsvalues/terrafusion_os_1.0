#!/bin/bash

# 🏈 SUPREME COMMANDER CLAUDE ACTIVATION SCRIPT
# Mission: Orchestrate TerraFusion OS Production Deployment
# AI Swarm: 1,008 agents ready for coordination
# Status: OPERATIONAL READY

set -e

echo "🏈 SUPREME COMMANDER CLAUDE TAKING CONTROL"
echo "=========================================="
echo "Mission: TerraFusion OS Production Deployment"
echo "AI Swarm Size: 1,008 agents"
echo "Execution Mode: Production Ready"
echo ""

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SUPREME_COMMANDER_JS="$PROJECT_ROOT/backend/ai-swarm-service/orchestrators/supreme-commander-claude.js"
AI_SWARM_COORDINATOR="$PROJECT_ROOT/backend/ai-swarm/orchestrators/ai-swarm-coordinator.ts"
LOG_DIR="$PROJECT_ROOT/logs/supreme-commander"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Create log directory
mkdir -p "$LOG_DIR"

# Function to log messages
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_DIR/supreme-commander-$TIMESTAMP.log"
}

# Function to check prerequisites
check_prerequisites() {
    log_message "🔍 Checking deployment prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        log_message "❌ Node.js not found. Please install Node.js 18+"
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        log_message "❌ npm not found. Please install npm"
        exit 1
    fi
    
    # Check if Supreme Commander script exists
    if [ ! -f "$SUPREME_COMMANDER_JS" ]; then
        log_message "❌ Supreme Commander script not found: $SUPREME_COMMANDER_JS"
        exit 1
    fi
    
    # Check if AI Swarm Coordinator exists
    if [ ! -f "$AI_SWARM_COORDINATOR" ]; then
        log_message "❌ AI Swarm Coordinator not found: $AI_SWARM_COORDINATOR"
        exit 1
    fi
    
    log_message "✅ All prerequisites satisfied"
}

# Function to initialize AI Swarm
initialize_ai_swarm() {
    log_message "🧬 Initializing 1,008 Agent Swarm System..."
    
    cd "$PROJECT_ROOT/backend/ai-swarm"
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        log_message "📦 Installing AI Swarm dependencies..."
        npm install
    fi
    
    # Initialize swarm
    log_message "🚀 Starting AI Swarm Coordinator..."
    npx ts-node orchestrators/ai-swarm-coordinator.ts --initialize &
    SWARM_PID=$!
    
    # Wait for initialization
    sleep 10
    
    # Check if swarm is running
    if kill -0 $SWARM_PID 2>/dev/null; then
        log_message "✅ AI Swarm initialized successfully (PID: $SWARM_PID)"
        echo $SWARM_PID > "$LOG_DIR/ai-swarm.pid"
    else
        log_message "❌ AI Swarm initialization failed"
        exit 1
    fi
}

# Function to activate Supreme Commander
activate_supreme_commander() {
    log_message "👑 Activating Supreme Commander Claude..."
    
    cd "$PROJECT_ROOT/backend/ai-swarm-service"
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        log_message "📦 Installing Supreme Commander dependencies..."
        npm install
    fi
    
    # Start Supreme Commander
    log_message "🎯 Supreme Commander Claude executing game plan..."
    node orchestrators/supreme-commander-claude.js &
    COMMANDER_PID=$!
    
    # Wait for startup
    sleep 5
    
    # Check if commander is running
    if kill -0 $COMMANDER_PID 2>/dev/null; then
        log_message "✅ Supreme Commander Claude activated (PID: $COMMANDER_PID)"
        echo $COMMANDER_PID > "$LOG_DIR/supreme-commander.pid"
    else
        log_message "❌ Supreme Commander activation failed"
        exit 1
    fi
}

# Function to deploy infrastructure
deploy_infrastructure() {
    log_message "🏗️ Deploying TerraFusion OS Infrastructure..."
    
    cd "$PROJECT_ROOT/devops/terraform"
    
    # Check if Terraform is available
    if ! command -v terraform &> /dev/null; then
        log_message "❌ Terraform not found. Please install Terraform"
        exit 1
    fi
    
    # Initialize Terraform
    log_message "🔧 Initializing Terraform..."
    terraform init
    
    # Plan deployment
    log_message "📋 Planning infrastructure deployment..."
    terraform plan -out=tfplan
    
    # Apply deployment
    log_message "🚀 Applying infrastructure deployment..."
    terraform apply tfplan
    
    log_message "✅ Infrastructure deployment completed"
}

# Function to deploy applications
deploy_applications() {
    log_message "📱 Deploying TerraFusion OS Applications..."
    
    cd "$PROJECT_ROOT"
    
    # Deploy to Kubernetes
    if command -v kubectl &> /dev/null; then
        log_message "☸️ Deploying to Kubernetes..."
        
        # Apply base configurations
        kubectl apply -f infrastructure/kubernetes/base/
        
        # Apply overlays
        kubectl apply -f infrastructure/kubernetes/overlays/production/
        
        # Wait for deployments
        log_message "⏳ Waiting for deployments to be ready..."
        kubectl wait --for=condition=available --timeout=300s deployment/terrafusion-frontend -n production
        kubectl wait --for=condition=available --timeout=300s deployment/terrafusion-backend -n production
        
        log_message "✅ Application deployment completed"
    else
        log_message "⚠️ kubectl not found, skipping Kubernetes deployment"
    fi
}

# Function to validate deployment
validate_deployment() {
    log_message "🔍 Validating deployment..."
    
    # Check AI Swarm health
    if [ -f "$LOG_DIR/ai-swarm.pid" ]; then
        SWARM_PID=$(cat "$LOG_DIR/ai-swarm.pid")
        if kill -0 $SWARM_PID 2>/dev/null; then
            log_message "✅ AI Swarm operational (PID: $SWARM_PID)"
        else
            log_message "❌ AI Swarm not running"
            return 1
        fi
    fi
    
    # Check Supreme Commander
    if [ -f "$LOG_DIR/supreme-commander.pid" ]; then
        COMMANDER_PID=$(cat "$LOG_DIR/supreme-commander.pid")
        if kill -0 $COMMANDER_PID 2>/dev/null; then
            log_message "✅ Supreme Commander operational (PID: $COMMANDER_PID)"
        else
            log_message "❌ Supreme Commander not running"
            return 1
        fi
    fi
    
    # Check Kubernetes deployments
    if command -v kubectl &> /dev/null; then
        log_message "☸️ Checking Kubernetes deployments..."
        
        # Check frontend
        if kubectl get deployment/terrafusion-frontend -n production &>/dev/null; then
            FRONTEND_READY=$(kubectl get deployment/terrafusion-frontend -n production -o jsonpath='{.status.readyReplicas}')
            FRONTEND_DESIRED=$(kubectl get deployment/terrafusion-frontend -n production -o jsonpath='{.spec.replicas}')
            if [ "$FRONTEND_READY" = "$FRONTEND_DESIRED" ]; then
                log_message "✅ Frontend deployment ready ($FRONTEND_READY/$FRONTEND_DESIRED)"
            else
                log_message "⚠️ Frontend deployment not ready ($FRONTEND_READY/$FRONTEND_DESIRED)"
                return 1
            fi
        fi
        
        # Check backend
        if kubectl get deployment/terrafusion-backend -n production &>/dev/null; then
            BACKEND_READY=$(kubectl get deployment/terrafusion-backend -n production -o jsonpath='{.status.readyReplicas}')
            BACKEND_DESIRED=$(kubectl get deployment/terrafusion-backend -n production -o jsonpath='{.spec.replicas}')
            if [ "$BACKEND_READY" = "$BACKEND_DESIRED" ]; then
                log_message "✅ Backend deployment ready ($BACKEND_READY/$BACKEND_DESIRED)"
            else
                log_message "⚠️ Backend deployment not ready ($BACKEND_READY/$BACKEND_DESIRED)"
                return 1
            fi
        fi
    fi
    
    log_message "✅ Deployment validation completed successfully"
    return 0
}

# Function to show status
show_status() {
    log_message "📊 TerraFusion OS Deployment Status"
    echo "=========================================="
    
    # AI Swarm Status
    if [ -f "$LOG_DIR/ai-swarm.pid" ]; then
        SWARM_PID=$(cat "$LOG_DIR/ai-swarm.pid")
        if kill -0 $SWARM_PID 2>/dev/null; then
            echo "🤖 AI Swarm: OPERATIONAL (PID: $SWARM_PID)"
        else
            echo "🤖 AI Swarm: OFFLINE"
        fi
    else
        echo "🤖 AI Swarm: NOT INITIALIZED"
    fi
    
    # Supreme Commander Status
    if [ -f "$LOG_DIR/supreme-commander.pid" ]; then
        COMMANDER_PID=$(cat "$LOG_DIR/supreme-commander.pid")
        if kill -0 $COMMANDER_PID 2>/dev/null; then
            echo "👑 Supreme Commander: ACTIVE (PID: $COMMANDER_PID)"
        else
            echo "👑 Supreme Commander: OFFLINE"
        fi
    else
        echo "👑 Supreme Commander: NOT ACTIVATED"
    fi
    
    # Kubernetes Status
    if command -v kubectl &> /dev/null; then
        echo "☸️ Kubernetes: AVAILABLE"
        
        # Check namespaces
        if kubectl get namespace production &>/dev/null; then
            echo "   Production Namespace: EXISTS"
        else
            echo "   Production Namespace: NOT FOUND"
        fi
    else
        echo "☸️ Kubernetes: NOT AVAILABLE"
    fi
    
    echo ""
}

# Function to cleanup
cleanup() {
    log_message "🧹 Cleaning up processes..."
    
    # Stop AI Swarm
    if [ -f "$LOG_DIR/ai-swarm.pid" ]; then
        SWARM_PID=$(cat "$LOG_DIR/ai-swarm.pid")
        if kill -0 $SWARM_PID 2>/dev/null; then
            kill $SWARM_PID
            log_message "🛑 AI Swarm stopped (PID: $SWARM_PID)"
        fi
        rm -f "$LOG_DIR/ai-swarm.pid"
    fi
    
    # Stop Supreme Commander
    if [ -f "$LOG_DIR/supreme-commander.pid" ]; then
        COMMANDER_PID=$(cat "$LOG_DIR/supreme-commander.pid")
        if kill -0 $COMMANDER_PID 2>/dev/null; then
            kill $COMMANDER_PID
            log_message "🛑 Supreme Commander stopped (PID: $COMMANDER_PID)"
        fi
        rm -f "$LOG_DIR/supreme-commander.pid"
    fi
}

# Trap cleanup on exit
trap cleanup EXIT

# Main execution
main() {
    case "${1:-deploy}" in
        "deploy")
            log_message "🚀 Starting TerraFusion OS Production Deployment..."
            check_prerequisites
            initialize_ai_swarm
            activate_supreme_commander
            deploy_infrastructure
            deploy_applications
            validate_deployment
            log_message "🎉 TerraFusion OS Production Deployment Completed!"
            ;;
        "status")
            show_status
            ;;
        "stop")
            log_message "🛑 Stopping TerraFusion OS..."
            cleanup
            log_message "✅ TerraFusion OS stopped"
            ;;
        "restart")
            log_message "🔄 Restarting TerraFusion OS..."
            cleanup
            sleep 2
            main deploy
            ;;
        *)
            echo "Usage: $0 {deploy|status|stop|restart}"
            echo ""
            echo "Commands:"
            echo "  deploy   - Deploy TerraFusion OS (default)"
            echo "  status   - Show deployment status"
            echo "  stop     - Stop all services"
            echo "  restart  - Restart all services"
            exit 1
            ;;
    esac
}

# Execute main function
main "$@"
