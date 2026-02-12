#!/bin/bash

# TerraFusion Enterprise Unix/Linux/macOS Installer
# Microsoft/Apple Level Deployment System

set -euo pipefail

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Installation variables
INSTALL_DIR="/opt/terrafusion"
DATA_DIR="/var/lib/terrafusion"
SERVICE_USER="terrafusion"
LOG_FILE="/tmp/terrafusion-install.log"

# macOS specific paths
if [[ "$OSTYPE" == "darwin"* ]]; then
    INSTALL_DIR="/Applications/TerraFusion.app/Contents/Resources"
    DATA_DIR="$HOME/Library/Application Support/TerraFusion"
fi

# Progress tracking
declare -a STEPS=(
    "System Requirements Check"
    "Database Setup"
    "Dependencies Installation"
    "Application Build"
    "Desktop App Creation"
    "Service Registration"
    "Final Configuration"
    "Deployment Complete"
)
CURRENT_STEP=0

# Function to display progress
display_progress() {
    local message="$1"
    local progress="${2:-$((($CURRENT_STEP + 1) * 100 / ${#STEPS[@]}))}"
    
    clear
    echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║                    TERRAFUSION INSTALLER                     ║${NC}"
    echo -e "${CYAN}║                Enterprise Deployment System                  ║${NC}"
    echo -e "${CYAN}╠══════════════════════════════════════════════════════════════╣${NC}"
    printf "${NC}║ Step %d/%d: %-48s ║${NC}\n" $((CURRENT_STEP + 1)) ${#STEPS[@]} "${STEPS[$CURRENT_STEP]}"
    echo -e "${NC}║                                                              ║${NC}"
    
    # Create progress bar
    local width=40
    local filled=$((width * progress / 100))
    local empty=$((width - filled))
    local bar=$(printf "█%.0s" $(seq 1 $filled))$(printf "░%.0s" $(seq 1 $empty))
    
    printf "${NC}║ ${GREEN}%s${NC} %3d%% ║${NC}\n" "$bar" "$progress"
    echo -e "${NC}║                                                              ║${NC}"
    printf "${NC}║ ${YELLOW}%-60s${NC} ║${NC}\n" "$message"
    echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
}

# Function to check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        echo -e "${RED}This script should not be run as root for security reasons.${NC}"
        echo -e "${YELLOW}Please run as a regular user with sudo privileges.${NC}"
        exit 1
    fi
}

# Function to check system requirements
check_system_requirements() {
    display_progress "Checking system requirements..."
    
    # Check OS
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        OS="linux"
        display_progress "Operating System: Linux ✓"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
        display_progress "Operating System: macOS ✓"
    else
        echo -e "${RED}Unsupported operating system: $OSTYPE${NC}"
        exit 1
    fi
    sleep 0.5
    
    # Check memory
    if [[ "$OS" == "macos" ]]; then
        TOTAL_MEM=$(sysctl -n hw.memsize)
        TOTAL_MEM_GB=$((TOTAL_MEM / 1024 / 1024 / 1024))
    else
        TOTAL_MEM_GB=$(free -g | awk '/^Mem:/{print $2}')
    fi
    
    if [[ $TOTAL_MEM_GB -lt 4 ]]; then
        echo -e "${RED}Minimum 4GB RAM required, found ${TOTAL_MEM_GB}GB${NC}"
        exit 1
    fi
    display_progress "Memory: ${TOTAL_MEM_GB}GB ✓"
    sleep 0.5
    
    # Check disk space
    AVAILABLE_SPACE=$(df / | awk 'NR==2{print int($4/1024/1024)}')
    if [[ $AVAILABLE_SPACE -lt 10 ]]; then
        echo -e "${RED}Minimum 10GB free space required, found ${AVAILABLE_SPACE}GB${NC}"
        exit 1
    fi
    display_progress "Disk space: ${AVAILABLE_SPACE}GB available ✓"
    sleep 0.5
    
    CURRENT_STEP=$((CURRENT_STEP + 1))
}

# Function to install Node.js
install_nodejs() {
    display_progress "Checking Node.js installation..."
    
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        display_progress "Node.js found: $NODE_VERSION ✓"
        return 0
    fi
    
    display_progress "Installing Node.js LTS..."
    
    if [[ "$OS" == "macos" ]]; then
        # Install using Homebrew on macOS
        if ! command -v brew &> /dev/null; then
            display_progress "Installing Homebrew..."
            /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
        fi
        display_progress "Installing Node.js via Homebrew..."
        brew install node
    else
        # Install using NodeSource repository on Linux
        display_progress "Adding NodeSource repository..."
        curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
        display_progress "Installing Node.js..."
        sudo apt-get install -y nodejs
    fi
    
    # Verify installation
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        display_progress "Node.js installed successfully: $NODE_VERSION ✓"
    else
        echo -e "${RED}Node.js installation failed${NC}"
        exit 1
    fi
}

# Function to setup PostgreSQL
setup_database() {
    display_progress "Setting up PostgreSQL database..."
    
    # Check if PostgreSQL is already running
    if systemctl is-active --quiet postgresql 2>/dev/null || brew services list | grep -q "postgresql.*started" 2>/dev/null; then
        display_progress "PostgreSQL service found ✓"
    else
        display_progress "Installing PostgreSQL..."
        
        if [[ "$OS" == "macos" ]]; then
            brew install postgresql
            brew services start postgresql
            display_progress "PostgreSQL installed and started via Homebrew ✓"
        else
            sudo apt-get update
            sudo apt-get install -y postgresql postgresql-contrib
            sudo systemctl start postgresql
            sudo systemctl enable postgresql
            display_progress "PostgreSQL installed and started via apt ✓"
        fi
    fi
    
    display_progress "Configuring database connection..."
    sleep 1
    
    # Create database user and database if needed
    if [[ "$OS" == "macos" ]]; then
        createdb terrafusion 2>/dev/null || true
    else
        sudo -u postgres createdb terrafusion 2>/dev/null || true
        sudo -u postgres createuser terrafusion 2>/dev/null || true
    fi
    
    display_progress "Database setup completed ✓"
    CURRENT_STEP=$((CURRENT_STEP + 1))
}

# Function to install dependencies
install_dependencies() {
    display_progress "Installing application dependencies..."
    
    # Create directories
    if [[ "$OS" == "macos" ]]; then
        mkdir -p "$INSTALL_DIR"
        mkdir -p "$DATA_DIR"
        mkdir -p "$DATA_DIR/logs"
        mkdir -p "$DATA_DIR/backups"
    else
        sudo mkdir -p "$INSTALL_DIR"
        sudo mkdir -p "$DATA_DIR"
        sudo mkdir -p "$DATA_DIR/logs"
        sudo mkdir -p "$DATA_DIR/backups"
        
        # Create service user
        if ! id "$SERVICE_USER" &>/dev/null; then
            sudo useradd --system --shell /bin/false --home "$DATA_DIR" --create-home "$SERVICE_USER"
        fi
        
        sudo chown -R "$SERVICE_USER:$SERVICE_USER" "$DATA_DIR"
    fi
    
    display_progress "Installation directories created ✓"
    sleep 0.5
    
    # Copy application files
    SOURCE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
    
    if [[ "$OS" == "macos" ]]; then
        cp -R "$SOURCE_DIR"/* "$INSTALL_DIR/"
    else
        sudo cp -R "$SOURCE_DIR"/* "$INSTALL_DIR/"
        sudo chown -R "$SERVICE_USER:$SERVICE_USER" "$INSTALL_DIR"
    fi
    
    display_progress "Application files copied ✓"
    sleep 0.5
    
    # Install npm dependencies
    cd "$INSTALL_DIR"
    display_progress "Installing npm packages..."
    
    if [[ "$OS" == "macos" ]]; then
        npm install --production --silent
    else
        sudo -u "$SERVICE_USER" npm install --production --silent
    fi
    
    display_progress "Dependencies installed successfully ✓"
    CURRENT_STEP=$((CURRENT_STEP + 1))
}

# Function to build application
build_application() {
    display_progress "Building TerraFusion application..."
    
    cd "$INSTALL_DIR"
    
    display_progress "Compiling frontend assets..."
    if [[ "$OS" == "macos" ]]; then
        npm run build
    else
        sudo -u "$SERVICE_USER" npm run build
    fi
    
    display_progress "Application built successfully ✓"
    CURRENT_STEP=$((CURRENT_STEP + 1))
}

# Function to create desktop app
create_desktop_app() {
    display_progress "Creating desktop application..."
    
    if [[ "$OS" == "macos" ]]; then
        # Create macOS app bundle
        APP_BUNDLE="/Applications/TerraFusion.app"
        
        mkdir -p "$APP_BUNDLE/Contents/MacOS"
        mkdir -p "$APP_BUNDLE/Contents/Resources"
        
        # Create Info.plist
        cat > "$APP_BUNDLE/Contents/Info.plist" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>TerraFusion</string>
    <key>CFBundleIdentifier</key>
    <string>com.terrafusion.civil-infrastructure</string>
    <key>CFBundleName</key>
    <string>TerraFusion</string>
    <key>CFBundleDisplayName</key>
    <string>TerraFusion Civil Infrastructure</string>
    <key>CFBundleVersion</key>
    <string>1.0.0</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0.0</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleSignature</key>
    <string>????</string>
    <key>LSMinimumSystemVersion</key>
    <string>10.15</string>
</dict>
</plist>
EOF

        # Create launcher script
        cat > "$APP_BUNDLE/Contents/MacOS/TerraFusion" << EOF
#!/bin/bash
cd "$INSTALL_DIR"
node server/index.js &
sleep 3
open http://localhost:5000
EOF
        chmod +x "$APP_BUNDLE/Contents/MacOS/TerraFusion"
        
        display_progress "macOS app bundle created ✓"
    else
        # Create Linux desktop entry
        DESKTOP_FILE="$HOME/.local/share/applications/terrafusion.desktop"
        mkdir -p "$(dirname "$DESKTOP_FILE")"
        
        cat > "$DESKTOP_FILE" << EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=TerraFusion Civil Infrastructure
Comment=Enterprise GIS Platform for County Operations
Exec=xdg-open http://localhost:5000
Icon=$INSTALL_DIR/assets/icon.png
Terminal=false
Categories=Office;Engineering;
StartupWMClass=TerraFusion
EOF
        
        display_progress "Linux desktop entry created ✓"
    fi
    
    CURRENT_STEP=$((CURRENT_STEP + 1))
}

# Function to register service
register_service() {
    display_progress "Registering system service..."
    
    if [[ "$OS" == "macos" ]]; then
        # Create macOS LaunchAgent
        PLIST_FILE="$HOME/Library/LaunchAgents/com.terrafusion.civil-infrastructure.plist"
        mkdir -p "$(dirname "$PLIST_FILE")"
        
        cat > "$PLIST_FILE" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.terrafusion.civil-infrastructure</string>
    <key>ProgramArguments</key>
    <array>
        <string>node</string>
        <string>$INSTALL_DIR/server/index.js</string>
    </array>
    <key>WorkingDirectory</key>
    <string>$INSTALL_DIR</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>$DATA_DIR/logs/terrafusion.log</string>
    <key>StandardErrorPath</key>
    <string>$DATA_DIR/logs/terrafusion-error.log</string>
</dict>
</plist>
EOF
        
        launchctl load "$PLIST_FILE"
        display_progress "macOS LaunchAgent configured and started ✓"
    else
        # Create systemd service
        SERVICE_FILE="/etc/systemd/system/terrafusion.service"
        
        sudo tee "$SERVICE_FILE" > /dev/null << EOF
[Unit]
Description=TerraFusion Civil Infrastructure
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
User=$SERVICE_USER
WorkingDirectory=$INSTALL_DIR
ExecStart=/usr/bin/node server/index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=5000

[Install]
WantedBy=multi-user.target
EOF
        
        sudo systemctl daemon-reload
        sudo systemctl enable terrafusion
        sudo systemctl start terrafusion
        
        display_progress "systemd service configured and started ✓"
    fi
    
    CURRENT_STEP=$((CURRENT_STEP + 1))
}

# Function to apply final configuration
final_configuration() {
    display_progress "Applying final configuration..."
    
    # Set up environment variables
    if [[ "$OS" == "macos" ]]; then
        echo 'export TERRAFUSION_DATA_DIR="'$DATA_DIR'"' >> "$HOME/.zshrc"
        echo 'export TERRAFUSION_INSTALL_DIR="'$INSTALL_DIR'"' >> "$HOME/.zshrc"
    else
        echo 'export TERRAFUSION_DATA_DIR="'$DATA_DIR'"' | sudo tee -a /etc/environment
        echo 'export TERRAFUSION_INSTALL_DIR="'$INSTALL_DIR'"' | sudo tee -a /etc/environment
    fi
    
    display_progress "Environment variables configured ✓"
    sleep 0.5
    
    # Create uninstaller
    UNINSTALL_SCRIPT="$INSTALL_DIR/uninstall.sh"
    
    if [[ "$OS" == "macos" ]]; then
        cat > "$UNINSTALL_SCRIPT" << EOF
#!/bin/bash
echo "Removing TerraFusion Civil Infrastructure..."
launchctl unload "$HOME/Library/LaunchAgents/com.terrafusion.civil-infrastructure.plist"
rm -f "$HOME/Library/LaunchAgents/com.terrafusion.civil-infrastructure.plist"
rm -rf "/Applications/TerraFusion.app"
rm -rf "$INSTALL_DIR"
rm -rf "$DATA_DIR"
echo "TerraFusion has been successfully removed."
EOF
    else
        sudo tee "$UNINSTALL_SCRIPT" > /dev/null << EOF
#!/bin/bash
echo "Removing TerraFusion Civil Infrastructure..."
sudo systemctl stop terrafusion
sudo systemctl disable terrafusion
sudo rm -f /etc/systemd/system/terrafusion.service
sudo systemctl daemon-reload
sudo userdel $SERVICE_USER
sudo rm -rf $INSTALL_DIR
sudo rm -rf $DATA_DIR
rm -f "$HOME/.local/share/applications/terrafusion.desktop"
echo "TerraFusion has been successfully removed."
EOF
    fi
    
    chmod +x "$UNINSTALL_SCRIPT"
    display_progress "Uninstaller created ✓"
    sleep 0.5
    
    display_progress "Configuration completed successfully ✓"
    CURRENT_STEP=$((CURRENT_STEP + 1))
}

# Function to show completion
show_completion() {
    clear
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                    DEPLOYMENT COMPLETE                      ║${NC}"
    echo -e "${GREEN}╠══════════════════════════════════════════════════════════════╣${NC}"
    echo -e "${NC}║                                                              ║${NC}"
    echo -e "${YELLOW}║  🎉 TerraFusion Civil Infrastructure is ready!             ║${NC}"
    echo -e "${NC}║                                                              ║${NC}"
    
    if [[ "$OS" == "macos" ]]; then
        echo -e "${CYAN}║  Desktop App: /Applications/TerraFusion.app                  ║${NC}"
        echo -e "${CYAN}║  Web Access:  http://localhost:5000                         ║${NC}"
        echo -e "${CYAN}║  Service:     LaunchAgent (auto-start)                      ║${NC}"
    else
        echo -e "${CYAN}║  Desktop App: TerraFusion (in applications menu)            ║${NC}"
        echo -e "${CYAN}║  Web Access:  http://localhost:5000                         ║${NC}"
        echo -e "${CYAN}║  Service:     systemd (auto-start)                          ║${NC}"
    fi
    
    echo -e "${NC}║                                                              ║${NC}"
    echo -e "${NC}║  Installation Path: $(printf "%-32s" "$INSTALL_DIR") ║${NC}"
    echo -e "${NC}║                                                              ║${NC}"
    echo -e "${YELLOW}║  Next Steps:                                                 ║${NC}"
    echo -e "${NC}║  1. Launch TerraFusion from applications menu               ║${NC}"
    echo -e "${NC}║  2. Configure your county data sources                      ║${NC}"
    echo -e "${NC}║  3. Set up user accounts and permissions                    ║${NC}"
    echo -e "${NC}║  4. Import GIS layers and parcel data                       ║${NC}"
    echo -e "${NC}║                                                              ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
    
    echo -e "\n${YELLOW}Launching TerraFusion Civil Infrastructure...${NC}"
    sleep 3
    
    if [[ "$OS" == "macos" ]]; then
        open http://localhost:5000
    else
        xdg-open http://localhost:5000 2>/dev/null || echo "Please open http://localhost:5000 in your browser"
    fi
}

# Main installation function
main() {
    echo -e "${CYAN}TerraFusion Civil Infrastructure - Enterprise Installer${NC}"
    echo -e "${YELLOW}Preparing installation...${NC}\n"
    
    sleep 2
    
    check_root
    check_system_requirements
    install_nodejs
    setup_database
    install_dependencies
    build_application
    create_desktop_app
    register_service
    final_configuration
    show_completion
    
    echo -e "\n${GREEN}TerraFusion installation completed successfully!${NC}"
    echo -e "${YELLOW}Installation log saved to: $LOG_FILE${NC}"
}

# Execute main function
main "$@" 2>&1 | tee "$LOG_FILE"