#!/bin/bash

# TerraFusion Government OS - Enterprise Installation Script
# Professional deployment installer for government installations
# Compatible with: Ubuntu, Debian, CentOS, RHEL, SUSE

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INSTALL_DIR="/opt/terrafusion-government-os"
USER_HOME="$HOME"
DESKTOP_FILE="TerraFusion-Government-OS.desktop"

echo "=== TerraFusion Government OS - Enterprise Installation ==="
echo "Version: 1.0.0"
echo "Target: Government Deployment"
echo "Installation Directory: $INSTALL_DIR"
echo ""

# Check if running as root for system installation
check_permissions() {
    if [[ $EUID -eq 0 ]]; then
        echo "✓ Installing system-wide (requires root)"
        SYSTEM_INSTALL=true
        DESKTOP_DIR="/usr/share/applications"
        AUTOSTART_DIR="/etc/xdg/autostart"
    else
        echo "✓ Installing for current user"
        SYSTEM_INSTALL=false
        DESKTOP_DIR="$USER_HOME/.local/share/applications"
        AUTOSTART_DIR="$USER_HOME/.config/autostart"
    fi
}

# Install system dependencies
install_dependencies() {
    echo "Installing system dependencies..."
    
    if command -v apt-get &> /dev/null; then
        # Ubuntu/Debian
        apt-get update
        apt-get install -y curl wget nodejs npm dotnet-sdk-8.0 unzip
    elif command -v yum &> /dev/null; then
        # CentOS/RHEL
        yum install -y curl wget nodejs npm dotnet-sdk-8.0 unzip
    elif command -v zypper &> /dev/null; then
        # SUSE
        zypper install -y curl wget nodejs npm dotnet-sdk-8.0 unzip
    else
        echo "Warning: Package manager not detected. Please install manually:"
        echo "- Node.js 18+ and npm"
        echo "- .NET 8.0 SDK"
        echo "- curl, wget, unzip"
    fi
}

# Create installation directory
create_install_directory() {
    echo "Creating installation directory..."
    
    if [ "$SYSTEM_INSTALL" = true ]; then
        mkdir -p "$INSTALL_DIR"
        cp -r . "$INSTALL_DIR/"
        chown -R root:root "$INSTALL_DIR"
        chmod -R 755 "$INSTALL_DIR"
    else
        INSTALL_DIR="$USER_HOME/.local/share/terrafusion-government-os"
        mkdir -p "$INSTALL_DIR"
        cp -r . "$INSTALL_DIR/"
        chmod -R 755 "$INSTALL_DIR"
    fi
}

# Install desktop integration
install_desktop_integration() {
    echo "Installing desktop integration..."
    
    mkdir -p "$DESKTOP_DIR"
    mkdir -p "$AUTOSTART_DIR"
    
    # Update desktop file with correct paths
    sed "s|/workspaces/terrafusion_os_1.0|$INSTALL_DIR|g" "$DESKTOP_FILE" > "$DESKTOP_DIR/$DESKTOP_FILE"
    chmod +x "$DESKTOP_DIR/$DESKTOP_FILE"
    
    # Install autostart
    sed "s|/workspaces/terrafusion_os_1.0|$INSTALL_DIR|g" "TerraFusion-Government-OS-autostart.desktop" > "$AUTOSTART_DIR/TerraFusion-Government-OS-autostart.desktop"
    chmod +x "$AUTOSTART_DIR/TerraFusion-Government-OS-autostart.desktop"
    
    # Update launch script
    sed -i "s|/workspaces/terrafusion_os_1.0|$INSTALL_DIR|g" "$INSTALL_DIR/scripts/launch-terrafusion-os.sh"
    chmod +x "$INSTALL_DIR/scripts/launch-terrafusion-os.sh"
}

# Install system service (for enterprise deployments)
install_system_service() {
    if [ "$SYSTEM_INSTALL" = true ]; then
        echo "Installing system service..."
        
        cat > /etc/systemd/system/terrafusion-government-os.service << EOF
[Unit]
Description=TerraFusion Government Operating System
After=network.target
Wants=network.target

[Service]
Type=forking
User=terrafusion
Group=terrafusion
WorkingDirectory=$INSTALL_DIR
ExecStart=$INSTALL_DIR/scripts/launch-terrafusion-os.sh
ExecStop=/bin/kill -TERM \$MAINPID
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=terrafusion-government-os

[Install]
WantedBy=multi-user.target
EOF

        # Create service user
        useradd -r -s /bin/false -d "$INSTALL_DIR" terrafusion || true
        chown -R terrafusion:terrafusion "$INSTALL_DIR"
        
        systemctl daemon-reload
        systemctl enable terrafusion-government-os.service
        
        echo "✓ System service installed and enabled"
    fi
}

# Build and prepare application
build_application() {
    echo "Building TerraFusion Government OS..."
    
    cd "$INSTALL_DIR"
    
    # Install backend dependencies
    cd backend && dotnet restore && dotnet build -c Release
    cd ..
    
    # Install frontend dependencies
    cd experience-suite/temp-extract/experience-suite-v5/ui && npm install
    cd ../../../..
    
    # Install Electron dependencies
    cd frontend/electron && npm install
    cd ../..
    
    echo "✓ Application built successfully"
}

# Create uninstaller
create_uninstaller() {
    cat > "$INSTALL_DIR/uninstall.sh" << 'EOF'
#!/bin/bash
echo "Uninstalling TerraFusion Government OS..."

# Stop service if running
if systemctl is-active --quiet terrafusion-government-os; then
    systemctl stop terrafusion-government-os
    systemctl disable terrafusion-government-os
    rm -f /etc/systemd/system/terrafusion-government-os.service
    systemctl daemon-reload
fi

# Remove desktop integration
rm -f ~/.local/share/applications/TerraFusion-Government-OS.desktop
rm -f ~/.config/autostart/TerraFusion-Government-OS-autostart.desktop
rm -f /usr/share/applications/TerraFusion-Government-OS.desktop
rm -f /etc/xdg/autostart/TerraFusion-Government-OS-autostart.desktop

# Remove application
rm -rf /opt/terrafusion-government-os
rm -rf ~/.local/share/terrafusion-government-os

echo "TerraFusion Government OS uninstalled successfully"
EOF
    
    chmod +x "$INSTALL_DIR/uninstall.sh"
}

# Main installation process
main() {
    check_permissions
    
    echo "Proceeding with installation..."
    read -p "Continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Installation cancelled"
        exit 0
    fi
    
    install_dependencies
    create_install_directory
    build_application
    install_desktop_integration
    install_system_service
    create_uninstaller
    
    echo ""
    echo "=== Installation Complete ==="
    echo "✓ TerraFusion Government OS installed successfully"
    echo "✓ Desktop launcher created"
    echo "✓ Auto-start configured"
    
    if [ "$SYSTEM_INSTALL" = true ]; then
        echo "✓ System service installed"
        echo ""
        echo "Start service: sudo systemctl start terrafusion-government-os"
        echo "Check status: sudo systemctl status terrafusion-government-os"
    fi
    
    echo ""
    echo "Launch from:"
    echo "- Applications menu: 'TerraFusion Government OS'"
    echo "- Command line: $INSTALL_DIR/scripts/launch-terrafusion-os.sh"
    echo ""
    echo "Uninstall: $INSTALL_DIR/uninstall.sh"
    echo ""
    echo "🎉 TerraFusion Government OS is ready for enterprise deployment!"
}

# Execute installation
main "$@"