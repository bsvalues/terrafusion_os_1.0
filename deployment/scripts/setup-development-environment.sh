#!/bin/bash

# TerraFusion Ultimate IDE - Development Environment Setup
# Automated development environment initialization and configuration
# Classification: OFFICIAL USE ONLY

set -euo pipefail

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
LOG_FILE="${PROJECT_ROOT}/logs/setup-$(date +%Y%m%d-%H%M%S).log"

# Create logs directory
mkdir -p "$(dirname "$LOG_FILE")"

# Logging functions
log() { echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a "$LOG_FILE"; }
log_info() { echo -e "${BLUE}[INFO] $1${NC}" | tee -a "$LOG_FILE"; }
log_warn() { echo -e "${YELLOW}[WARN] $1${NC}" | tee -a "$LOG_FILE"; }
log_error() { echo -e "${RED}[ERROR] $1${NC}" | tee -a "$LOG_FILE"; }
log_success() { echo -e "${GREEN}[SUCCESS] $1${NC}" | tee -a "$LOG_FILE"; }

# Display setup banner
echo -e "${CYAN}"
cat << "EOF"
╔══════════════════════════════════════════════════════════════════════════════╗
║                TerraFusion Ultimate IDE Development Setup                    ║
║                   Government-Grade Development Environment                   ║
╚══════════════════════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Check and install Node.js
setup_nodejs() {
    log "Setting up Node.js environment..."
    
    if command -v node &> /dev/null; then
        local node_version=$(node --version | sed 's/v//' | cut -d. -f1)
        if [ "$node_version" -ge 18 ]; then
            log_success "Node.js $(node --version) is already installed"
            return 0
        else
            log_warn "Node.js version $(node --version) is too old. Upgrading..."
        fi
    else
        log_info "Node.js not found. Installing..."
    fi
    
    # Install Node.js via NodeSource repository
    if command -v curl &> /dev/null; then
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
        log_success "Node.js 18.x installed successfully"
    else
        log_error "curl not available. Please install Node.js 18.x manually"
        exit 1
    fi
}

# Check and install .NET SDK
setup_dotnet() {
    log "Setting up .NET development environment..."
    
    if command -v dotnet &> /dev/null; then
        if dotnet --version | grep -E "^8\." &> /dev/null; then
            log_success ".NET $(dotnet --version) is already installed"
            return 0
        else
            log_warn ".NET version $(dotnet --version) is not 8.x. Installing .NET 8..."
        fi
    else
        log_info ".NET not found. Installing .NET 8 SDK..."
    fi
    
    # Install .NET 8 SDK
    wget https://packages.microsoft.com/config/ubuntu/22.04/packages-microsoft-prod.deb -O packages-microsoft-prod.deb
    sudo dpkg -i packages-microsoft-prod.deb
    rm packages-microsoft-prod.deb
    
    sudo apt-get update
    sudo apt-get install -y dotnet-sdk-8.0
    log_success ".NET 8 SDK installed successfully"
}

# Setup Docker and Docker Compose
setup_docker() {
    log "Setting up Docker environment..."
    
    if command -v docker &> /dev/null && command -v docker-compose &> /dev/null; then
        if docker info &> /dev/null; then
            log_success "Docker is already installed and running"
            return 0
        fi
    fi
    
    # Install Docker
    sudo apt-get update
    sudo apt-get install -y ca-certificates curl gnupg lsb-release
    
    sudo mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    
    # Add current user to docker group
    sudo usermod -aG docker $USER
    
    # Start Docker service
    sudo systemctl start docker
    sudo systemctl enable docker
    
    log_success "Docker installed and configured"
    log_info "Please log out and back in for Docker group permissions to take effect"
}

# Setup Python environment
setup_python() {
    log "Setting up Python environment..."
    
    if python3 --version | grep -E "3\.(9|10|11|12)" &> /dev/null; then
        log_success "Python $(python3 --version) is already installed"
    else
        sudo apt-get update
        sudo apt-get install -y python3 python3-pip python3-venv
        log_success "Python 3 installed"
    fi
    
    # Install Python dependencies for AI components
    pip3 install --user numpy pandas scikit-learn tensorflow pytorch
}

# Initialize project dependencies
setup_project_dependencies() {
    log "Installing project dependencies..."
    
    # Frontend dependencies
    log_info "Installing frontend dependencies..."
    cd "${PROJECT_ROOT}/frontend"
    npm ci
    
    # Backend dependencies
    log_info "Restoring backend dependencies..."
    cd "${PROJECT_ROOT}/backend"
    dotnet restore
    
    # AI Swarm dependencies
    if [ -d "${PROJECT_ROOT}/ai-swarm-supreme-commander" ]; then
        log_info "Installing AI Swarm dependencies..."
        cd "${PROJECT_ROOT}/ai-swarm-supreme-commander"
        npm ci
    fi
    
    cd "$PROJECT_ROOT"
    log_success "All project dependencies installed"
}

# Setup development database
setup_development_database() {
    log "Setting up development database..."
    
    # Create development database if it doesn't exist
    if ! docker ps | grep -q postgres; then
        log_info "Starting PostgreSQL development container..."
        docker run -d \
            --name terrafusion-dev-db \
            -e POSTGRES_DB=terrafusion_dev \
            -e POSTGRES_USER=terrafusion_dev \
            -e POSTGRES_PASSWORD=dev_password \
            -p 5433:5432 \
            postgres:15-alpine
        
        # Wait for database to be ready
        sleep 10
        log_success "Development database started on port 5433"
    else
        log_info "PostgreSQL container already running"
    fi
}

# Setup IDE configurations
setup_ide_configurations() {
    log "Setting up IDE configurations..."
    
    # Create VS Code workspace settings
    mkdir -p "${PROJECT_ROOT}/.vscode"
    cat > "${PROJECT_ROOT}/.vscode/settings.json" << 'EOF'
{
    "typescript.preferences.includePackageJsonAutoImports": "auto",
    "editor.formatOnSave": true,
    "editor.codeActionsOnSave": {
        "source.fixAll.eslint": true
    },
    "files.exclude": {
        "**/node_modules": true,
        "**/bin": true,
        "**/obj": true,
        "**/.git": true
    },
    "dotnet.completion.showCompletionItemsFromUnimportedNamespaces": true,
    "omnisharp.enableRoslynAnalyzers": true,
    "python.defaultInterpreterPath": "/usr/bin/python3"
}
EOF

    # Create launch configurations
    cat > "${PROJECT_ROOT}/.vscode/launch.json" << 'EOF'
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Launch TerraFusion API",
            "type": "coreclr",
            "request": "launch",
            "program": "${workspaceFolder}/backend/TerraFusion.IDE.Gateway/bin/Debug/net8.0/TerraFusion.IDE.Gateway.dll",
            "args": [],
            "cwd": "${workspaceFolder}/backend/TerraFusion.IDE.Gateway",
            "env": {
                "ASPNETCORE_ENVIRONMENT": "Development"
            }
        },
        {
            "name": "Launch Frontend",
            "type": "node",
            "request": "launch",
            "program": "${workspaceFolder}/frontend/node_modules/.bin/react-scripts",
            "args": ["start"],
            "cwd": "${workspaceFolder}/frontend",
            "env": {
                "NODE_ENV": "development"
            }
        }
    ]
}
EOF

    log_success "IDE configurations created"
}

# Setup Git hooks
setup_git_hooks() {
    log "Setting up Git hooks..."
    
    if [ -d "${PROJECT_ROOT}/.git" ]; then
        # Install husky for Git hooks
        cd "$PROJECT_ROOT"
        if [ -f package.json ]; then
            npm install --save-dev husky lint-staged
            npx husky init
            
            # Create pre-commit hook
            echo '#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run linting and tests before commit
npm run lint
dotnet test backend/
echo "Pre-commit checks passed ✅"
' > .husky/pre-commit
            
            chmod +x .husky/pre-commit
            log_success "Git hooks configured"
        fi
    else
        log_warn "Not a Git repository. Skipping Git hooks setup"
    fi
}

# Create development scripts
create_development_scripts() {
    log "Creating development scripts..."
    
    mkdir -p "${PROJECT_ROOT}/scripts"
    
    # Create development start script
    cat > "${PROJECT_ROOT}/scripts/dev-start.sh" << 'EOF'
#!/bin/bash
# TerraFusion Development Startup Script

echo "🚀 Starting TerraFusion Ultimate IDE Development Environment"

# Start backend
echo "Starting backend API..."
cd backend/TerraFusion.IDE.Gateway
dotnet run --urls=http://localhost:5000 &
BACKEND_PID=$!

# Start frontend
echo "Starting frontend..."
cd ../../frontend
npm start &
FRONTEND_PID=$!

# Start AI Swarm (if available)
if [ -d "../ai-swarm-supreme-commander" ]; then
    echo "Starting AI Swarm Supreme Commander..."
    cd ../ai-swarm-supreme-commander
    npm start &
    AI_PID=$!
fi

echo "✅ Development environment started!"
echo "  • Frontend: http://localhost:3000"
echo "  • Backend API: http://localhost:5000"
echo "  • AI Swarm: http://localhost:8080"

# Cleanup function
cleanup() {
    echo "Stopping development servers..."
    kill $BACKEND_PID $FRONTEND_PID $AI_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

# Wait for processes
wait
EOF
    
    chmod +x "${PROJECT_ROOT}/scripts/dev-start.sh"
    
    # Create testing script
    cat > "${PROJECT_ROOT}/scripts/run-tests.sh" << 'EOF'
#!/bin/bash
# TerraFusion Testing Script

echo "🧪 Running TerraFusion Ultimate IDE Test Suite"

# Backend tests
echo "Running backend tests..."
cd backend
dotnet test --configuration Release --logger trx --results-directory TestResults

# Frontend tests
echo "Running frontend tests..."
cd ../frontend
npm test -- --coverage --watchAll=false

echo "✅ All tests completed!"
EOF
    
    chmod +x "${PROJECT_ROOT}/scripts/run-tests.sh"
    
    log_success "Development scripts created"
}

# Validate installation
validate_installation() {
    log "Validating installation..."
    
    local validation_errors=0
    
    # Check Node.js
    if node --version | grep -E "^v(18|19|20|21)" &> /dev/null; then
        log_success "Node.js: $(node --version)"
    else
        log_error "Node.js version validation failed"
        validation_errors=1
    fi
    
    # Check .NET
    if dotnet --version | grep -E "^8\." &> /dev/null; then
        log_success ".NET: $(dotnet --version)"
    else
        log_error ".NET version validation failed"
        validation_errors=1
    fi
    
    # Check Docker
    if docker --version &> /dev/null; then
        log_success "Docker: $(docker --version)"
    else
        log_error "Docker validation failed"
        validation_errors=1
    fi
    
    # Check Python
    if python3 --version &> /dev/null; then
        log_success "Python: $(python3 --version)"
    else
        log_error "Python validation failed"
        validation_errors=1
    fi
    
    if [ $validation_errors -eq 0 ]; then
        log_success "All components validated successfully!"
        return 0
    else
        log_error "Validation failed. Please check the errors above."
        return 1
    fi
}

# Main setup function
main() {
    log "Starting TerraFusion Ultimate IDE development environment setup..."
    
    # Update system packages
    log "Updating system packages..."
    sudo apt-get update
    sudo apt-get install -y curl wget git build-essential
    
    # Setup components
    setup_nodejs
    setup_dotnet
    setup_docker
    setup_python
    setup_project_dependencies
    setup_development_database
    setup_ide_configurations
    setup_git_hooks
    create_development_scripts
    
    # Validate installation
    if validate_installation; then
        echo -e "\n${CYAN}╔══════════════════════════════════════════════════════════════════╗"
        echo "║              DEVELOPMENT ENVIRONMENT READY! ✅                    ║"
        echo "╚══════════════════════════════════════════════════════════════════╝${NC}"
        echo
        echo -e "${GREEN}🎉 TerraFusion Ultimate IDE Development Environment Setup Complete!${NC}"
        echo
        echo "📋 What's been configured:"
        echo "   • Node.js 18+ with npm"
        echo "   • .NET 8 SDK"
        echo "   • Docker and Docker Compose"
        echo "   • Python 3 with AI libraries"
        echo "   • Development database (PostgreSQL)"
        echo "   • IDE configurations (VS Code)"
        echo "   • Git hooks for code quality"
        echo "   • Development scripts"
        echo
        echo "🚀 Quick Start:"
        echo "   • Run development servers: ./scripts/dev-start.sh"
        echo "   • Run tests: ./scripts/run-tests.sh"
        echo "   • Deploy full stack: ./deployment/scripts/deploy-terrafusion-ultimate-ide.sh"
        echo
        echo "📖 Next Steps:"
        echo "   1. Log out and back in (for Docker group permissions)"
        echo "   2. Run './scripts/dev-start.sh' to start development"
        echo "   3. Open http://localhost:3000 for the IDE"
        echo "   4. Check API at http://localhost:5000"
        echo
        log_success "Setup completed successfully!"
    else
        log_error "Setup completed with errors. Please review the log file: $LOG_FILE"
        exit 1
    fi
}

# Execute main function
main "$@"