#!/bin/bash
# TerraFusion OS 1.0 Linux Deployment Script
# Migrated from Enterprise Installer

set -e

echo "========================================"
echo "TerraFusion OS 1.0 Linux Deployment"
echo "========================================"

# Check for root privileges
if [[ $EUID -ne 0 ]]; then
   echo "ERROR: This script must be run as root (use sudo)"
   exit 1
fi

# Set deployment variables
INSTALL_DIR="/opt/terrafusion-os"
DATA_DIR="/var/lib/terrafusion"
SERVICE_NAME="terrafusion-os"
USER_NAME="terrafusion"

echo "Checking system requirements..."

# Check Linux distribution
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$NAME
    VER=$VERSION_ID
else
    echo "ERROR: Cannot determine Linux distribution"
    exit 1
fi

echo "Detected: $OS $VER"

# Check available disk space (minimum 10GB)
AVAILABLE_SPACE=$(df / | awk 'NR==2{printf "%.0f", $4/1024/1024}')
if [ "$AVAILABLE_SPACE" -lt 10 ]; then
    echo "ERROR: Insufficient disk space. 10GB required, ${AVAILABLE_SPACE}GB available"
    exit 1
fi

# Check memory (minimum 4GB)
TOTAL_MEM=$(free -g | awk 'NR==2{printf "%.0f", $2}')
if [ "$TOTAL_MEM" -lt 4 ]; then
    echo "WARNING: Less than 4GB RAM detected. Performance may be affected."
fi

echo "System requirements met. Proceeding with installation..."

# Update package manager
echo "Updating package manager..."
if command -v apt-get &> /dev/null; then
    apt-get update
    PACKAGE_MANAGER="apt-get"
elif command -v yum &> /dev/null; then
    yum update -y
    PACKAGE_MANAGER="yum"
elif command -v dnf &> /dev/null; then
    dnf update -y
    PACKAGE_MANAGER="dnf"
else
    echo "ERROR: No supported package manager found"
    exit 1
fi

# Install prerequisites
echo "Installing prerequisites..."
case $PACKAGE_MANAGER in
    "apt-get")
        apt-get install -y curl wget gnupg2 software-properties-common
        ;;
    "yum"|"dnf")
        $PACKAGE_MANAGER install -y curl wget gnupg2
        ;;
esac

# Install .NET 8.0 Runtime
echo "Installing .NET 8.0 Runtime..."
if ! command -v dotnet &> /dev/null; then
    case $PACKAGE_MANAGER in
        "apt-get")
            wget https://packages.microsoft.com/config/ubuntu/20.04/packages-microsoft-prod.deb -O packages-microsoft-prod.deb
            dpkg -i packages-microsoft-prod.deb
            apt-get update
            apt-get install -y dotnet-runtime-8.0
            rm packages-microsoft-prod.deb
            ;;
        "yum"|"dnf")
            rpm -Uvh https://packages.microsoft.com/config/rhel/8/packages-microsoft-prod.rpm
            $PACKAGE_MANAGER install -y dotnet-runtime-8.0
            ;;
    esac
fi

# Install Node.js
echo "Installing Node.js..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    case $PACKAGE_MANAGER in
        "apt-get")
            apt-get install -y nodejs
            ;;
        "yum"|"dnf")
            $PACKAGE_MANAGER install -y nodejs npm
            ;;
    esac
fi

# Create system user
echo "Creating system user..."
if ! id "$USER_NAME" &>/dev/null; then
    useradd -r -s /bin/false -d "$DATA_DIR" "$USER_NAME"
fi

# Create installation directories
echo "Creating installation directories..."
mkdir -p "$INSTALL_DIR"
mkdir -p "$DATA_DIR"/{logs,database,config}
chown -R "$USER_NAME:$USER_NAME" "$DATA_DIR"

# Copy application files
echo "Copying application files..."
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cp -r "$SCRIPT_DIR/../../../backend" "$INSTALL_DIR/"
cp -r "$SCRIPT_DIR/../../../frontend" "$INSTALL_DIR/"
cp -r "$SCRIPT_DIR/../../../scripts" "$INSTALL_DIR/"

# Set permissions
chown -R "$USER_NAME:$USER_NAME" "$INSTALL_DIR"
chmod +x "$INSTALL_DIR/scripts"/*.sh

# Create systemd service
echo "Creating systemd service..."
cat > "/etc/systemd/system/$SERVICE_NAME.service" << EOF
[Unit]
Description=TerraFusion OS Backend Service
After=network.target

[Service]
Type=simple
User=$USER_NAME
WorkingDirectory=$INSTALL_DIR/backend
ExecStart=/usr/bin/dotnet TerraFusion.API.dll
Restart=always
RestartSec=10
Environment=ASPNETCORE_ENVIRONMENT=Production
Environment=ASPNETCORE_URLS=http://localhost:5000

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
systemctl daemon-reload
systemctl enable "$SERVICE_NAME"
systemctl start "$SERVICE_NAME"

# Configure firewall (if firewalld is available)
if command -v firewall-cmd &> /dev/null; then
    echo "Configuring firewall..."
    firewall-cmd --permanent --add-port=5000/tcp
    firewall-cmd --permanent --add-port=3000/tcp
    firewall-cmd --reload
fi

# Create desktop entry
echo "Creating desktop entry..."
cat > "/usr/share/applications/terrafusion-os.desktop" << EOF
[Desktop Entry]
Type=Application
Name=TerraFusion OS
Comment=TerraFusion Operating System
Exec=bash $INSTALL_DIR/scripts/start-dev.sh
Icon=utilities-terminal
Terminal=true
Categories=Development;Office;
EOF

# Create configuration file
echo "Creating configuration..."
cat > "$DATA_DIR/config/appsettings.Production.json" << EOF
{
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=$DATA_DIR/database/terrafusion.db"
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information"
    },
    "File": {
      "Path": "$DATA_DIR/logs/terrafusion-.log",
      "RollingInterval": "Day"
    }
  },
  "AllowedHosts": "*"
}
EOF

chown "$USER_NAME:$USER_NAME" "$DATA_DIR/config/appsettings.Production.json"

echo "========================================"
echo "TerraFusion OS 1.0 Installation Complete"
echo "========================================"
echo ""
echo "Installation Directory: $INSTALL_DIR"
echo "Data Directory: $DATA_DIR"
echo "Service Name: $SERVICE_NAME"
echo "System User: $USER_NAME"
echo ""
echo "Service Status:"
systemctl status "$SERVICE_NAME" --no-pager -l
echo ""
echo "Access the application at: http://localhost:3000"
echo "Backend API at: http://localhost:5000"
echo ""
echo "To start/stop the service:"
echo "  sudo systemctl start $SERVICE_NAME"
echo "  sudo systemctl stop $SERVICE_NAME"
echo "  sudo systemctl status $SERVICE_NAME"
echo ""
echo "Logs are available at: $DATA_DIR/logs/"
echo ""
