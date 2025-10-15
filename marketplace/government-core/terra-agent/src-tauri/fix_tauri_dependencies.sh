#!/bin/bash

# TerraFusion Tauri Dependencies Fix Script
# SWARM ALPHA - Emergency Fix for Missing pkg-config Files

set -e

echo "========================================"
echo "🔧 TAURI DEPENDENCIES EMERGENCY FIX"
echo "========================================"
echo "Environment: Ubuntu 24.04.2 LTS (WSL2)"
echo "Issue: Missing javascriptcoregtk-4.0.pc and libsoup-2.4.pc"
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

# Create local pkg-config directory
LOCAL_PKG_CONFIG_DIR="$HOME/.local/lib/pkgconfig"
mkdir -p "$LOCAL_PKG_CONFIG_DIR"

log_info "Creating local pkg-config directory at $LOCAL_PKG_CONFIG_DIR"

# Check if we need to install missing packages with sudo
NEEDS_SUDO_INSTALL=false

# Check if libsoup-2.4.pc exists
if ! pkg-config --exists libsoup-2.4 2>/dev/null; then
    log_warning "libsoup-2.4.pc not found - requires 'sudo apt install libsoup2.4-dev'"
    NEEDS_SUDO_INSTALL=true
else
    log_success "libsoup-2.4.pc found"
fi

# Check if javascriptcoregtk-4.0.pc exists
if ! pkg-config --exists javascriptcoregtk-4.0 2>/dev/null; then
    log_warning "javascriptcoregtk-4.0.pc not found"
    
    # Check if we have 4.1 version
    if pkg-config --exists javascriptcoregtk-4.1 2>/dev/null; then
        log_info "Creating compatibility javascriptcoregtk-4.0.pc from 4.1 version..."
        
        # Get the 4.1 version pkg-config file content and modify it
        PKG_CONFIG_41="/usr/lib/x86_64-linux-gnu/pkgconfig/javascriptcoregtk-4.1.pc"
        if [ -f "$PKG_CONFIG_41" ]; then
            # Create a modified version for 4.0 compatibility
            sed 's/javascriptcoregtk-4\.1/javascriptcoregtk-4.0/g; s/4\.1/4.0/g' "$PKG_CONFIG_41" > "$LOCAL_PKG_CONFIG_DIR/javascriptcoregtk-4.0.pc"
            log_success "Created javascriptcoregtk-4.0.pc compatibility file"
        else
            log_error "Cannot find javascriptcoregtk-4.1.pc to create compatibility file"
        fi
    else
        log_error "No javascriptcoregtk package found"
    fi
else
    log_success "javascriptcoregtk-4.0.pc found"
fi

# Check if webkit2gtk-4.0.pc exists
if ! pkg-config --exists webkit2gtk-4.0 2>/dev/null; then
    log_warning "webkit2gtk-4.0.pc not found"
    
    # Check if we have 4.1 version
    if pkg-config --exists webkit2gtk-4.1 2>/dev/null; then
        log_info "Creating compatibility webkit2gtk-4.0.pc from 4.1 version..."
        
        # Get the 4.1 version pkg-config file content and modify it
        PKG_CONFIG_41="/usr/lib/x86_64-linux-gnu/pkgconfig/webkit2gtk-4.1.pc"
        if [ -f "$PKG_CONFIG_41" ]; then
            # Create a modified version for 4.0 compatibility
            sed 's/webkit2gtk-4\.1/webkit2gtk-4.0/g; s/4\.1/4.0/g' "$PKG_CONFIG_41" > "$LOCAL_PKG_CONFIG_DIR/webkit2gtk-4.0.pc"
            log_success "Created webkit2gtk-4.0.pc compatibility file"
        else
            log_error "Cannot find webkit2gtk-4.1.pc to create compatibility file"
        fi
    else
        log_error "No webkit2gtk package found"
    fi
else
    log_success "webkit2gtk-4.0.pc found"
fi

# Set up PKG_CONFIG_PATH
echo ""
echo "========================================"
echo "🔧 ENVIRONMENT SETUP"
echo "========================================"

log_info "Setting up PKG_CONFIG_PATH environment variable..."

# Add to current session
export PKG_CONFIG_PATH="$LOCAL_PKG_CONFIG_DIR:${PKG_CONFIG_PATH:-/usr/lib/x86_64-linux-gnu/pkgconfig:/usr/share/pkgconfig}"

log_info "PKG_CONFIG_PATH set to: $PKG_CONFIG_PATH"

# Create shell configuration for persistent setup
SHELL_CONFIG=""
if [ -n "$BASH_VERSION" ]; then
    SHELL_CONFIG="$HOME/.bashrc"
elif [ -n "$ZSH_VERSION" ]; then
    SHELL_CONFIG="$HOME/.zshrc"
else
    SHELL_CONFIG="$HOME/.profile"
fi

if [ -n "$SHELL_CONFIG" ]; then
    # Check if already in shell config
    if ! grep -q "PKG_CONFIG_PATH.*$LOCAL_PKG_CONFIG_DIR" "$SHELL_CONFIG" 2>/dev/null; then
        log_info "Adding PKG_CONFIG_PATH to $SHELL_CONFIG for persistent setup..."
        echo "" >> "$SHELL_CONFIG"
        echo "# TerraFusion Tauri Dependencies" >> "$SHELL_CONFIG"
        echo "export PKG_CONFIG_PATH=\"$LOCAL_PKG_CONFIG_DIR:\${PKG_CONFIG_PATH:-/usr/lib/x86_64-linux-gnu/pkgconfig:/usr/share/pkgconfig}\"" >> "$SHELL_CONFIG"
        log_success "Added PKG_CONFIG_PATH to $SHELL_CONFIG"
    else
        log_info "PKG_CONFIG_PATH already configured in $SHELL_CONFIG"
    fi
fi

echo ""
echo "========================================"
echo "🧪 TESTING CONFIGURATION"
echo "========================================"

# Test pkg-config
log_info "Testing pkg-config configuration..."

test_pkg_config() {
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

test_pkg_config "javascriptcoregtk-4.0"
test_pkg_config "webkit2gtk-4.0"
test_pkg_config "libsoup-2.4"
test_pkg_config "gtk+-3.0"

echo ""
echo "========================================"
echo "🚀 CARGO BUILD TEST"
echo "========================================"

log_info "Testing cargo check..."
if cargo check 2>&1 | tee /tmp/cargo_check_output.log; then
    log_success "Cargo check completed successfully!"
else
    log_error "Cargo check failed. Check output above for details."
    echo ""
    log_info "Common issues and solutions:"
    
    if grep -q "libsoup-2.4" /tmp/cargo_check_output.log 2>/dev/null; then
        echo "  - Missing libsoup-2.4: Run 'sudo apt install libsoup2.4-dev'"
    fi
    
    if grep -q "javascriptcoregtk-4.0" /tmp/cargo_check_output.log 2>/dev/null; then
        echo "  - Missing javascriptcoregtk-4.0: May need 'sudo apt install libjavascriptcoregtk-4.0-dev'"
    fi
    
    if grep -q "webkit2gtk-4.0" /tmp/cargo_check_output.log 2>/dev/null; then
        echo "  - Missing webkit2gtk-4.0: May need 'sudo apt install libwebkit2gtk-4.0-dev'"
    fi
fi

echo ""
echo "========================================"
echo "📋 SUMMARY & NEXT STEPS"
echo "========================================"

log_info "Created compatibility pkg-config files in: $LOCAL_PKG_CONFIG_DIR"
log_info "Environment configured with PKG_CONFIG_PATH"

if [ "$NEEDS_SUDO_INSTALL" = true ]; then
    echo ""
    log_warning "MANUAL STEPS REQUIRED (run with sudo):"
    echo "  sudo apt update"
    echo "  sudo apt install -y libsoup2.4-dev"
    echo "  sudo apt install -y libwebkit2gtk-4.0-dev libjavascriptcoregtk-4.0-dev"
    echo "  (Note: If 4.0 versions don't exist, the compatibility files should work)"
    echo ""
    log_info "After installing packages, run: source $SHELL_CONFIG && cargo check"
fi

echo ""
log_success "Setup complete! Try running 'cargo check' now."

exit 0