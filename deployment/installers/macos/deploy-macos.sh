#!/bin/bash
# TerraFusion OS 1.0 macOS Deployment Script
# Migrated from Enterprise Installer

set -e

echo "========================================"
echo "TerraFusion OS 1.0 macOS Deployment"
echo "========================================"

# Check for root privileges
if [[ $EUID -ne 0 ]]; then
   echo "ERROR: This script must be run as root (use sudo)"
   exit 1
fi

# Set deployment variables
INSTALL_DIR="/Applications/TerraFusion OS"
DATA_DIR="/Library/Application Support/TerraFusion"
SERVICE_NAME="com.terrafusion.os"
USER_NAME="_terrafusion"

echo "Checking system requirements..."

# Check macOS version
MACOS_VERSION=$(sw_vers -productVersion)
MACOS_MAJOR=$(echo $MACOS_VERSION | cut -d. -f1)
MACOS_MINOR=$(echo $MACOS_VERSION | cut -d. -f2)

if [[ $MACOS_MAJOR -lt 11 ]]; then
    echo "ERROR: macOS 11.0 or higher required. Current version: $MACOS_VERSION"
    exit 1
fi

echo "Detected: macOS $MACOS_VERSION"

# Check available disk space (minimum 10GB)
AVAILABLE_SPACE=$(df -g / | awk 'NR==2{print $4}')
if [ "$AVAILABLE_SPACE" -lt 10 ]; then
    echo "ERROR: Insufficient disk space. 10GB required, ${AVAILABLE_SPACE}GB available"
    exit 1
fi

# Check memory (minimum 4GB)
TOTAL_MEM=$(sysctl -n hw.memsize | awk '{print int($1/1024/1024/1024)}')
if [ "$TOTAL_MEM" -lt 4 ]; then
    echo "WARNING: Less than 4GB RAM detected. Performance may be affected."
fi

echo "System requirements met. Proceeding with installation..."

# Install Homebrew if not present
if ! command -v brew &> /dev/null; then
    echo "Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
fi

# Install .NET 8.0 Runtime
echo "Installing .NET 8.0 Runtime..."
if ! command -v dotnet &> /dev/null; then
    brew install --cask dotnet
fi

# Install Node.js
echo "Installing Node.js..."
if ! command -v node &> /dev/null; then
    brew install node
fi

# Create system user
echo "Creating system user..."
if ! dscl . -read /Users/$USER_NAME &>/dev/null; then
    # Find next available UID
    NEXT_UID=$(dscl . -list /Users UniqueID | awk '{print $2}' | sort -n | tail -1)
    NEXT_UID=$((NEXT_UID + 1))
    
    dscl . -create /Users/$USER_NAME
    dscl . -create /Users/$USER_NAME UserShell /usr/bin/false
    dscl . -create /Users/$USER_NAME RealName "TerraFusion OS Service"
    dscl . -create /Users/$USER_NAME UniqueID $NEXT_UID
    dscl . -create /Users/$USER_NAME PrimaryGroupID 20
    dscl . -create /Users/$USER_NAME NFSHomeDirectory /var/empty
fi

# Create installation directories
echo "Creating installation directories..."
mkdir -p "$INSTALL_DIR"
mkdir -p "$DATA_DIR"/{logs,database,config}
chown -R "$USER_NAME:staff" "$DATA_DIR"

# Copy application files
echo "Copying application files..."
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cp -r "$SCRIPT_DIR/../../../backend" "$INSTALL_DIR/"
cp -r "$SCRIPT_DIR/../../../frontend" "$INSTALL_DIR/"
cp -r "$SCRIPT_DIR/../../../scripts" "$INSTALL_DIR/"

# Set permissions
chown -R "$USER_NAME:staff" "$INSTALL_DIR"
chmod +x "$INSTALL_DIR/scripts"/*.sh

# Create LaunchDaemon
echo "Creating LaunchDaemon..."
cat > "/Library/LaunchDaemons/$SERVICE_NAME.plist" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>$SERVICE_NAME</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/share/dotnet/dotnet</string>
        <string>$INSTALL_DIR/backend/TerraFusion.API.dll</string>
    </array>
    <key>WorkingDirectory</key>
    <string>$INSTALL_DIR/backend</string>
    <key>UserName</key>
    <string>$USER_NAME</string>
    <key>GroupName</key>
    <string>staff</string>
    <key>KeepAlive</key>
    <true/>
    <key>RunAtLoad</key>
    <true/>
    <key>EnvironmentVariables</key>
    <dict>
        <key>ASPNETCORE_ENVIRONMENT</key>
        <string>Production</string>
        <key>ASPNETCORE_URLS</key>
        <string>http://localhost:5000</string>
    </dict>
    <key>StandardOutPath</key>
    <string>$DATA_DIR/logs/terrafusion-out.log</string>
    <key>StandardErrorPath</key>
    <string>$DATA_DIR/logs/terrafusion-error.log</string>
</dict>
</plist>
EOF

# Set LaunchDaemon permissions
chmod 644 "/Library/LaunchDaemons/$SERVICE_NAME.plist"
chown root:wheel "/Library/LaunchDaemons/$SERVICE_NAME.plist"

# Load and start service
launchctl load "/Library/LaunchDaemons/$SERVICE_NAME.plist"
launchctl start "$SERVICE_NAME"

# Create application bundle
echo "Creating application bundle..."
mkdir -p "$INSTALL_DIR.app/Contents/MacOS"
mkdir -p "$INSTALL_DIR.app/Contents/Resources"

cat > "$INSTALL_DIR.app/Contents/Info.plist" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>TerraFusion OS</string>
    <key>CFBundleIdentifier</key>
    <string>com.terrafusion.os</string>
    <key>CFBundleName</key>
    <string>TerraFusion OS</string>
    <key>CFBundleVersion</key>
    <string>1.0.0</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0.0</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
</dict>
</plist>
EOF

cat > "$INSTALL_DIR.app/Contents/MacOS/TerraFusion OS" << EOF
#!/bin/bash
cd "$INSTALL_DIR"
bash scripts/start-dev.sh
EOF

chmod +x "$INSTALL_DIR.app/Contents/MacOS/TerraFusion OS"

# Configure firewall (if enabled)
if /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate | grep -q "enabled"; then
    echo "Configuring application firewall..."
    /usr/libexec/ApplicationFirewall/socketfilterfw --add "$INSTALL_DIR/backend/TerraFusion.API"
    /usr/libexec/ApplicationFirewall/socketfilterfw --unblockapp "$INSTALL_DIR/backend/TerraFusion.API"
fi

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

chown "$USER_NAME:staff" "$DATA_DIR/config/appsettings.Production.json"

echo "========================================"
echo "TerraFusion OS 1.0 Installation Complete"
echo "========================================"
echo ""
echo "Installation Directory: $INSTALL_DIR"
echo "Application Bundle: $INSTALL_DIR.app"
echo "Data Directory: $DATA_DIR"
echo "Service Name: $SERVICE_NAME"
echo "System User: $USER_NAME"
echo ""
echo "Service Status:"
launchctl list | grep "$SERVICE_NAME" || echo "Service not found in launchctl list"
echo ""
echo "Access the application at: http://localhost:3000"
echo "Backend API at: http://localhost:5000"
echo ""
echo "To start/stop the service:"
echo "  sudo launchctl start $SERVICE_NAME"
echo "  sudo launchctl stop $SERVICE_NAME"
echo "  sudo launchctl unload /Library/LaunchDaemons/$SERVICE_NAME.plist"
echo "  sudo launchctl load /Library/LaunchDaemons/$SERVICE_NAME.plist"
echo ""
echo "Logs are available at: $DATA_DIR/logs/"
echo "Application available in Applications folder"
echo ""
