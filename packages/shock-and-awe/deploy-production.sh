#!/bin/bash

# TerraFusion Shock & Awe - Production Deployment Script
# Revolutionary AI Government Demonstrations Platform
# Version: 2.0.0

set -e  # Exit on any error

echo "🚀 TerraFusion Shock & Awe - Production Deployment"
echo "=================================================="
echo "50,247 AI Agents | 94.7% Quantum Coherence | Revolutionary Government AI"
echo ""

# Configuration
PROJECT_NAME="shock-and-awe"
VERSION="2.0.0"
BUILD_DIR="dist"
TAURI_TARGET_DIR="src-tauri/target"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${CYAN}[STATUS]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ and try again."
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2)
    if [[ $(echo "$NODE_VERSION 18.0.0" | tr ' ' '\n' | sort -V | head -n1) != "18.0.0" ]]; then
        print_error "Node.js version 18+ required. Current version: $NODE_VERSION"
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed."
        exit 1
    fi
    
    print_success "Prerequisites check passed"
}

# Clean previous builds
clean_build() {
    print_status "Cleaning previous builds..."
    
    if [ -d "$BUILD_DIR" ]; then
        rm -rf "$BUILD_DIR"
        print_info "Removed $BUILD_DIR directory"
    fi
    
    if [ -d "$TAURI_TARGET_DIR" ]; then
        rm -rf "$TAURI_TARGET_DIR"
        print_info "Removed $TAURI_TARGET_DIR directory"
    fi
    
    print_success "Build directories cleaned"
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    # Install with specific flags for production
    npm ci --only=production --no-audit --no-optional
    
    if [ $? -eq 0 ]; then
        print_success "Dependencies installed successfully"
    else
        print_error "Failed to install dependencies"
        exit 1
    fi
}

# Build web application
build_web() {
    print_status "Building web application..."
    
    # Set production environment
    export NODE_ENV=production
    export VITE_APP_VERSION="$VERSION"
    export VITE_BUILD_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    
    # Build the application
    npm run build
    
    if [ $? -eq 0 ]; then
        print_success "Web application built successfully"
    else
        print_error "Web application build failed"
        exit 1
    fi
}

# Build desktop application (Tauri)
build_desktop() {
    print_status "Building desktop application..."
    
    # Check if Tauri CLI is available
    if command -v tauri &> /dev/null; then
        print_info "Building Tauri desktop application..."
        npm run tauri:build
        
        if [ $? -eq 0 ]; then
            print_success "Desktop application built successfully"
        else
            print_warning "Desktop application build failed, continuing with web-only deployment"
        fi
    else
        print_warning "Tauri CLI not available, skipping desktop build"
    fi
}

# Run production tests
run_tests() {
    print_status "Running production validation..."
    
    # Quick validation tests
    if [ -f "$BUILD_DIR/index.html" ]; then
        print_success "Build artifacts validated"
    else
        print_error "Build validation failed - missing index.html"
        exit 1
    fi
    
    # Check build size
    BUILD_SIZE=$(du -sh "$BUILD_DIR" | cut -f1)
    print_info "Build size: $BUILD_SIZE"
    
    print_success "Production validation passed"
}

# Generate deployment manifest
generate_manifest() {
    print_status "Generating deployment manifest..."
    
    cat > "$BUILD_DIR/deployment-manifest.json" << EOF
{
  "name": "TerraFusion Shock & Awe",
  "version": "$VERSION",
  "buildTime": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "environment": "production",
  "features": {
    "aiAgents": 50247,
    "quantumCoherence": 94.7,
    "modules": [
      "ConsciousnessEvolutionVisualizer",
      "QuantumProcessingVisualization", 
      "MultiDimensionalVisualization",
      "HolographicGovernmentEcosystem",
      "TimeTravelVisualization",
      "CrisisManagementTheater",
      "ComplexitySimplificationDemo",
      "SelfAwareAIInteraction",
      "ParallelRealityVisualization",
      "NeuralNetworkTheater",
      "PredictiveFutureModeling",
      "ValidationDashboard"
    ],
    "capabilities": [
      "Revolutionary AI Demonstrations",
      "Quantum Processing Visualization",
      "Consciousness Evolution Tracking", 
      "Multi-dimensional Data Analysis",
      "Time-travel Simulation Engine",
      "Crisis Management Theater",
      "Real-time Performance Monitoring"
    ]
  },
  "deployment": {
    "type": "government-ai-showcase",
    "classification": "public-demonstration",
    "target": "desktop-native",
    "requirements": {
      "webgl": "required",
      "memory": "4GB recommended",
      "browser": "modern browsers with WebGL2 support"
    }
  }
}
EOF
    
    print_success "Deployment manifest generated"
}

# Create launch scripts
create_launch_scripts() {
    print_status "Creating launch scripts..."
    
    # Web server launch script
    cat > "$BUILD_DIR/launch-web.sh" << 'EOF'
#!/bin/bash
# Launch TerraFusion Shock & Awe Web Server

echo "🚀 Launching TerraFusion Shock & Awe..."
echo "Access at: http://localhost:\${{TF_ADMIN_PORT:-8080}}"
echo "Press Ctrl+C to stop"

# Try different HTTP servers
if command -v python3 &> /dev/null; then
    echo "Using Python 3 HTTP server..."
    python3 -m http.server 8080
elif command -v python &> /dev/null; then
    echo "Using Python HTTP server..."
    python -m SimpleHTTPServer 8080
elif command -v npx &> /dev/null; then
    echo "Using serve package..."
    npx serve . -p 8080
else
    echo "No HTTP server available. Please install Python or Node.js."
    exit 1
fi
EOF
    
    chmod +x "$BUILD_DIR/launch-web.sh"
    
    # Windows batch file
    cat > "$BUILD_DIR/launch-web.bat" << 'EOF'
@echo off
echo 🚀 Launching TerraFusion Shock & Awe...
echo Access at: http://localhost:\${{TF_ADMIN_PORT:-8080}}
echo Press Ctrl+C to stop

python -m http.server 8080
if errorlevel 1 (
    echo Python not found, trying alternative...
    npx serve . -p 8080
)
EOF
    
    print_success "Launch scripts created"
}

# Main deployment function
main() {
    echo ""
    print_status "Starting TerraFusion Shock & Awe Production Deployment"
    echo ""
    
    check_prerequisites
    clean_build
    install_dependencies
    build_web
    build_desktop
    run_tests
    generate_manifest
    create_launch_scripts
    
    echo ""
    print_success "🎉 DEPLOYMENT COMPLETE! 🎉"
    echo ""
    print_info "Build artifacts available in: $BUILD_DIR/"
    print_info "Desktop applications (if built): $TAURI_TARGET_DIR/release/"
    echo ""
    print_status "Next steps:"
    echo "  1. Test the application: cd $BUILD_DIR && ./launch-web.sh"
    echo "  2. Deploy to production server"
    echo "  3. Monitor system metrics via ValidationDashboard"
    echo ""
    print_success "TerraFusion Shock & Awe is ready for revolutionary AI demonstrations!"
    echo ""
}

# Run main function
main "$@"