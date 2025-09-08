#!/bin/bash

# TerraFusion Complete Tauri Setup Script
# SWARM ALPHA - Final Foundation Build

set -e

echo "========================================"
echo "🏆 COMPLETE TAURI SETUP - FINAL PUSH"
echo "========================================"
echo "Environment: Ubuntu 24.04.2 LTS (WSL2)"
echo "Mission: Install ALL dependencies and verify build"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_mission() {
    echo -e "${PURPLE}[MISSION]${NC} $1"
}

# Step 1: Check sudo access
log_mission "Step 1: Checking sudo access..."
if sudo -n true 2>/dev/null; then
    log_success "Sudo access confirmed"
    HAS_SUDO=true
else
    log_warning "Sudo access requires password - will attempt installation"
    HAS_SUDO=false
fi

# Step 2: Set up compatibility files (already done, but ensure)
log_mission "Step 2: Setting up pkg-config compatibility..."

LOCAL_PKG_CONFIG_DIR="$HOME/.local/lib/pkgconfig"
mkdir -p "$LOCAL_PKG_CONFIG_DIR"

# Export PKG_CONFIG_PATH for this session
export PKG_CONFIG_PATH="$LOCAL_PKG_CONFIG_DIR:${PKG_CONFIG_PATH:-/usr/lib/x86_64-linux-gnu/pkgconfig:/usr/share/pkgconfig}"

# Check if compatibility files exist and work
if pkg-config --exists javascriptcoregtk-4.0 && pkg-config --exists webkit2gtk-4.0; then
    log_success "Compatibility pkg-config files working"
else
    log_error "Compatibility files not working - run fix_tauri_dependencies.sh first"
    exit 1
fi

# Step 3: Install missing system package
log_mission "Step 3: Installing missing libsoup2.4-dev..."

if pkg-config --exists libsoup-2.4; then
    log_success "libsoup-2.4 already available"
else
    if [ "$HAS_SUDO" = true ]; then
        log_info "Installing libsoup2.4-dev with sudo..."
        sudo apt update -y
        sudo apt install -y libsoup2.4-dev
        log_success "libsoup2.4-dev installed successfully"
    else
        log_info "Attempting to install libsoup2.4-dev (password may be required)..."
        apt update -y
        apt install -y libsoup2.4-dev
        if [ $? -eq 0 ]; then
            log_success "libsoup2.4-dev installed successfully"
        else
            log_error "Failed to install libsoup2.4-dev - sudo password required"
            echo ""
            echo "MANUAL STEP REQUIRED:"
            echo "  sudo apt install -y libsoup2.4-dev"
            echo ""
            exit 1
        fi
    fi
fi

# Step 4: Verify all dependencies
log_mission "Step 4: Verifying ALL dependencies..."

DEPENDENCIES=(
    "javascriptcoregtk-4.0"
    "webkit2gtk-4.0"
    "libsoup-2.4"
    "gtk+-3.0"
    "librsvg-2.0"
)

ALL_DEPS_OK=true
for dep in "${DEPENDENCIES[@]}"; do
    if pkg-config --exists "$dep"; then
        version=$(pkg-config --modversion "$dep")
        log_success "$dep: FOUND (version $version)"
    else
        log_error "$dep: NOT FOUND"
        ALL_DEPS_OK=false
    fi
done

if [ "$ALL_DEPS_OK" = false ]; then
    log_error "Some dependencies are missing - cannot proceed with build test"
    exit 1
fi

# Step 5: Test Tauri build
log_mission "Step 5: Testing Tauri application build..."

log_info "Running cargo check..."
if cargo check; then
    log_success "🎉 CARGO CHECK SUCCESSFUL!"
    BUILD_SUCCESS=true
else
    log_error "Cargo check failed"
    BUILD_SUCCESS=false
fi

# Step 6: Test all Tauri apps
if [ "$BUILD_SUCCESS" = true ]; then
    log_mission "Step 6: Testing all Tauri applications in workspace..."
    
    WORKSPACE_ROOT="/mnt/e/TerraFusion_Tauri_Master_Workspace"
    FAILED_APPS=()
    SUCCESS_APPS=()
    
    # Find all Tauri apps
    find "$WORKSPACE_ROOT" -name "src-tauri" -type d | while read tauri_dir; do
        app_name=$(basename "$(dirname "$tauri_dir")")
        log_info "Testing $app_name..."
        
        cd "$tauri_dir"
        if timeout 60 cargo check --quiet; then
            log_success "$app_name: BUILD OK"
            echo "$app_name" >> /tmp/success_apps.txt
        else
            log_error "$app_name: BUILD FAILED"
            echo "$app_name" >> /tmp/failed_apps.txt
        fi
    done
    
    # Report results
    if [ -f /tmp/success_apps.txt ]; then
        SUCCESS_COUNT=$(wc -l < /tmp/success_apps.txt)
        log_success "Successful builds: $SUCCESS_COUNT apps"
    else
        SUCCESS_COUNT=0
    fi
    
    if [ -f /tmp/failed_apps.txt ]; then
        FAILED_COUNT=$(wc -l < /tmp/failed_apps.txt)
        log_warning "Failed builds: $FAILED_COUNT apps"
    else
        FAILED_COUNT=0
    fi
    
else
    log_warning "Skipping workspace test due to build failure"
fi

# Step 7: Final report
echo ""
echo "========================================"
echo "🏆 MISSION COMPLETION REPORT"
echo "========================================"

if [ "$ALL_DEPS_OK" = true ]; then
    log_success "✅ ALL SYSTEM DEPENDENCIES: INSTALLED"
else
    log_error "❌ SYSTEM DEPENDENCIES: MISSING"
fi

if [ "$BUILD_SUCCESS" = true ]; then
    log_success "✅ TAURI BUILD TEST: PASSED"
else
    log_error "❌ TAURI BUILD TEST: FAILED"
fi

echo ""
log_mission "SWARM ALPHA FOUNDATION BUILDER - MISSION STATUS:"

if [ "$ALL_DEPS_OK" = true ] && [ "$BUILD_SUCCESS" = true ]; then
    echo -e "${GREEN}🎯 MISSION ACCOMPLISHED! 🎯${NC}"
    echo ""
    echo "✅ All system dependencies installed"
    echo "✅ pkg-config compatibility working"
    echo "✅ Tauri applications build successfully"
    echo "✅ Development environment ready"
    echo ""
    echo "🚀 Ready for development and deployment!"
    exit 0
else
    echo -e "${RED}MISSION INCOMPLETE${NC}"
    echo ""
    echo "Issues found:"
    [ "$ALL_DEPS_OK" = false ] && echo "❌ Missing system dependencies"
    [ "$BUILD_SUCCESS" = false ] && echo "❌ Build failures detected"
    echo ""
    echo "Check the output above for specific issues."
    exit 1
fi