#!/bin/bash

# TerraFusion Tauri Dependencies Installation Script
# SWARM ALPHA - Foundation Builder Mission

set -e

echo "========================================"
echo "🚀 TAURI DEPENDENCIES INSTALLATION"
echo "========================================"
echo "Environment: Ubuntu 24.04.2 LTS (WSL2)"
echo "Target: Install ALL Tauri system dependencies"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

# Check if running with sudo
if [ "$EUID" -ne 0 ]; then
    log_error "This script must be run with sudo privileges"
    echo "Usage: sudo ./install_tauri_dependencies.sh"
    exit 1
fi

log_info "Starting Tauri dependencies installation..."

# Update package lists
log_info "Updating package lists..."
apt update -y

echo ""
echo "========================================"
echo "📦 INSTALLING CORE DEPENDENCIES"
echo "========================================"

# Core build tools (already installed but ensure latest)
log_info "Installing build-essential and pkg-config..."
apt install -y build-essential pkg-config

# SSL development libraries
log_info "Installing SSL development libraries..."
apt install -y libssl-dev

# GTK development libraries
log_info "Installing GTK development libraries..."
apt install -y libgtk-3-dev

# AppIndicator libraries
log_info "Installing AppIndicator libraries..."
apt install -y libayatana-appindicator3-dev

# SVG rendering libraries (already installed but ensure)
log_info "Installing SVG libraries..."
apt install -y librsvg2-dev

echo ""
echo "========================================"
echo "🔧 INSTALLING WEBKIT & SOUP LIBRARIES"
echo "========================================"

# The critical missing packages for Tauri
log_info "Installing WebKit2GTK development libraries..."
# Note: Ubuntu 24.04 uses webkit2gtk-4.1, but we'll try to install both versions
apt install -y libwebkit2gtk-4.1-dev || log_warning "libwebkit2gtk-4.1-dev already installed or not available"

# Try to install webkit2gtk-4.0-dev if available (might be transitional)
if apt-cache show libwebkit2gtk-4.0-dev >/dev/null 2>&1; then
    log_info "Installing WebKit2GTK 4.0 development libraries..."
    apt install -y libwebkit2gtk-4.0-dev
else
    log_warning "libwebkit2gtk-4.0-dev not available, using 4.1 version"
    # Create symlink for compatibility if needed
    if [ -f /usr/lib/x86_64-linux-gnu/pkgconfig/webkit2gtk-4.1.pc ] && [ ! -f /usr/lib/x86_64-linux-gnu/pkgconfig/webkit2gtk-4.0.pc ]; then
        log_info "Creating webkit2gtk-4.0.pc compatibility symlink..."
        ln -sf webkit2gtk-4.1.pc /usr/lib/x86_64-linux-gnu/pkgconfig/webkit2gtk-4.0.pc
    fi
fi

log_info "Installing libsoup 2.4 development libraries..."
apt install -y libsoup2.4-dev

# Additional WebKit and JavaScript core libraries
log_info "Installing JavaScript core libraries..."
apt install -y libjavascriptcoregtk-4.1-dev || log_warning "libjavascriptcoregtk-4.1-dev already installed or not available"

# Try to install javascriptcore 4.0 if available
if apt-cache show libjavascriptcoregtk-4.0-dev >/dev/null 2>&1; then
    apt install -y libjavascriptcoregtk-4.0-dev
else
    log_warning "libjavascriptcoregtk-4.0-dev not available, using 4.1 version"
    # Create symlink for compatibility if needed
    if [ -f /usr/lib/x86_64-linux-gnu/pkgconfig/javascriptcoregtk-4.1.pc ] && [ ! -f /usr/lib/x86_64-linux-gnu/pkgconfig/javascriptcoregtk-4.0.pc ]; then
        log_info "Creating javascriptcoregtk-4.0.pc compatibility symlink..."
        ln -sf javascriptcoregtk-4.1.pc /usr/lib/x86_64-linux-gnu/pkgconfig/javascriptcoregtk-4.0.pc
    fi
fi

echo ""
echo "========================================"
echo "VERIFICATION PHASE"
echo "========================================"

# Function to check package availability
check_pkg_config() {
    local package=$1
    if pkg-config --exists "$package" 2>/dev/null; then
        local version=$(pkg-config --modversion "$package" 2>/dev/null)
        log_success "$package: FOUND (version $version)"
        return 0
    else
        log_error "$package: NOT FOUND"
        return 1
    fi
}

# Verify all critical packages
log_info "Verifying installed packages..."

echo ""
echo "Core GTK packages:"
check_pkg_config "gtk+-3.0"

echo ""
echo "WebKit packages:"
check_pkg_config "webkit2gtk-4.0"
check_pkg_config "javascriptcoregtk-4.0"

echo ""
echo "Soup packages:"
check_pkg_config "libsoup-2.4"

echo ""
echo "Other required packages:"
check_pkg_config "ayatana-appindicator3-0.1"
check_pkg_config "librsvg-2.0"

echo ""
echo "========================================"
echo "📋 INSTALLATION SUMMARY"
echo "========================================"

# List all installed packages
log_info "Installed Tauri-related packages:"
dpkg -l | grep -E "(webkit2gtk|libsoup|libgtk|libssl|librsvg|build-essential|pkg-config|ayatana)" | while read line; do
    echo "  ✓ $line"
done

echo ""
echo "========================================"
echo "✅ INSTALLATION COMPLETE"
echo "========================================"
log_success "All Tauri dependencies have been installed!"
log_info "You can now proceed to build your Tauri applications."
log_info "Next step: Run 'cargo check' in your Tauri project directory."

exit 0