# TerraFusion OS 1.0 - macOS Package Script
# Creates professional macOS .dmg installer

#!/bin/bash

# Configuration
APP_NAME="TerraFusion OS 1.0"
APP_VERSION="1.0.0"
APP_BUNDLE_ID="com.terrafusion.os"
DMG_NAME="TerraFusion-OS-1.0-Benton-County"
BUILD_DIR="build/macos"
DIST_DIR="dist/macos"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🏆 TerraFusion OS 1.0 - macOS Package Builder${NC}"
echo "Building professional macOS .dmg installer..."

# Create build directory
mkdir -p "$BUILD_DIR"
mkdir -p "$DIST_DIR"

# Create macOS application bundle structure
echo -e "${GREEN}📦 Creating macOS application bundle...${NC}"

# TerraFusion Dashboard.app
mkdir -p "$BUILD_DIR/TerraFusion Dashboard.app/Contents/MacOS"
mkdir -p "$BUILD_DIR/TerraFusion Dashboard.app/Contents/Resources"
mkdir -p "$BUILD_DIR/TerraFusion Dashboard.app/Contents/Frameworks"

cat > "$BUILD_DIR/TerraFusion Dashboard.app/Contents/Info.plist" << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>TerraFusionDashboard</string>
    <key>CFBundleIdentifier</key>
    <string>com.terrafusion.os.dashboard</string>
    <key>CFBundleName</key>
    <string>TerraFusion Dashboard</string>
    <key>CFBundleDisplayName</key>
    <string>TerraFusion Dashboard</string>
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
    <key>NSHighResolutionCapable</key>
    <true/>
    <key>LSUIElement</key>
    <false/>
    <key>NSPrincipalClass</key>
    <string>NSApplication</string>
    <key>NSAppTransportSecurity</key>
    <dict>
        <key>NSAllowsArbitraryLoads</key>
        <true/>
    </dict>
</dict>
</plist>
EOF

# TerraFusion Admin.app
mkdir -p "$BUILD_DIR/TerraFusion Admin.app/Contents/MacOS"
mkdir -p "$BUILD_DIR/TerraFusion Admin.app/Contents/Resources"
mkdir -p "$BUILD_DIR/TerraFusion Admin.app/Contents/Frameworks"

cat > "$BUILD_DIR/TerraFusion Admin.app/Contents/Info.plist" << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>TerraFusionAdmin</string>
    <key>CFBundleIdentifier</key>
    <string>com.terrafusion.os.admin</string>
    <key>CFBundleName</key>
    <string>TerraFusion Admin</string>
    <key>CFBundleDisplayName</key>
    <string>TerraFusion Admin</string>
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
    <key>NSHighResolutionCapable</key>
    <true/>
    <key>LSUIElement</key>
    <false/>
    <key>NSPrincipalClass</key>
    <string>NSApplication</string>
</dict>
</plist>
EOF

# TerraFusion Monitor.app
mkdir -p "$BUILD_DIR/TerraFusion Monitor.app/Contents/MacOS"
mkdir -p "$BUILD_DIR/TerraFusion Monitor.app/Contents/Resources"
mkdir -p "$BUILD_DIR/TerraFusion Monitor.app/Contents/Frameworks"

cat > "$BUILD_DIR/TerraFusion Monitor.app/Contents/Info.plist" << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>TerraFusionMonitor</string>
    <key>CFBundleIdentifier</key>
    <string>com.terrafusion.os.monitor</string>
    <key>CFBundleName</key>
    <string>TerraFusion Monitor</string>
    <key>CFBundleDisplayName</key>
    <string>TerraFusion Monitor</string>
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
    <key>NSHighResolutionCapable</key>
    <true/>
    <key>LSUIElement</key>
    <true/>
    <key>NSPrincipalClass</key>
    <string>NSApplication</string>
</dict>
</plist>
EOF

# TerraFusion Backup.app
mkdir -p "$BUILD_DIR/TerraFusion Backup.app/Contents/MacOS"
mkdir -p "$BUILD_DIR/TerraFusion Backup.app/Contents/Resources"
mkdir -p "$BUILD_DIR/TerraFusion Backup.app/Contents/Frameworks"

cat > "$BUILD_DIR/TerraFusion Backup.app/Contents/Info.plist" << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>TerraFusionBackup</string>
    <key>CFBundleIdentifier</key>
    <string>com.terrafusion.os.backup</string>
    <key>CFBundleName</key>
    <string>TerraFusion Backup</string>
    <key>CFBundleDisplayName</key>
    <string>TerraFusion Backup</string>
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
    <key>NSHighResolutionCapable</key>
    <true/>
    <key>LSUIElement</key>
    <false/>
    <key>NSPrincipalClass</key>
    <string>NSApplication</string>
</dict>
</plist>
EOF

# TerraFusion Settings.app
mkdir -p "$BUILD_DIR/TerraFusion Settings.app/Contents/MacOS"
mkdir -p "$BUILD_DIR/TerraFusion Settings.app/Contents/Resources"
mkdir -p "$BUILD_DIR/TerraFusion Settings.app/Contents/Frameworks"

cat > "$BUILD_DIR/TerraFusion Settings.app/Contents/Info.plist" << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>TerraFusionSettings</string>
    <key>CFBundleIdentifier</key>
    <string>com.terrafusion.os.settings</string>
    <key>CFBundleName</key>
    <string>TerraFusion Settings</string>
    <key>CFBundleDisplayName</key>
    <string>TerraFusion Settings</string>
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
    <key>NSHighResolutionCapable</key>
    <true/>
    <key>LSUIElement</key>
    <false/>
    <key>NSPrincipalClass</key>
    <string>NSApplication</string>
</dict>
</plist>
EOF

# Create executable scripts for each app
echo -e "${GREEN}🔧 Creating executable scripts...${NC}"

cat > "$BUILD_DIR/TerraFusion Dashboard.app/Contents/MacOS/TerraFusionDashboard" << 'EOF'
#!/bin/bash
cd "$(dirname "$0")/../../../"
./TerraFusionDashboard "$@"
EOF

cat > "$BUILD_DIR/TerraFusion Admin.app/Contents/MacOS/TerraFusionAdmin" << 'EOF'
#!/bin/bash
cd "$(dirname "$0")/../../../"
./TerraFusionAdmin "$@"
EOF

cat > "$BUILD_DIR/TerraFusion Monitor.app/Contents/MacOS/TerraFusionMonitor" << 'EOF'
#!/bin/bash
cd "$(dirname "$0")/../../../"
./TerraFusionMonitor "$@"
EOF

cat > "$BUILD_DIR/TerraFusion Backup.app/Contents/MacOS/TerraFusionBackup" << 'EOF'
#!/bin/bash
cd "$(dirname "$0")/../../../"
./TerraFusionBackup "$@"
EOF

cat > "$BUILD_DIR/TerraFusion Settings.app/Contents/MacOS/TerraFusionSettings" << 'EOF'
#!/bin/bash
cd "$(dirname "$0")/../../../"
./TerraFusionSettings "$@"
EOF

# Make scripts executable
chmod +x "$BUILD_DIR/TerraFusion Dashboard.app/Contents/MacOS/TerraFusionDashboard"
chmod +x "$BUILD_DIR/TerraFusion Admin.app/Contents/MacOS/TerraFusionAdmin"
chmod +x "$BUILD_DIR/TerraFusion Monitor.app/Contents/MacOS/TerraFusionMonitor"
chmod +x "$BUILD_DIR/TerraFusion Backup.app/Contents/MacOS/TerraFusionBackup"
chmod +x "$BUILD_DIR/TerraFusion Settings.app/Contents/MacOS/TerraFusionSettings"

# Create Applications folder structure
echo -e "${GREEN}📁 Creating Applications folder structure...${NC}"
mkdir -p "$BUILD_DIR/Applications"

# Copy apps to Applications folder
cp -R "$BUILD_DIR/TerraFusion Dashboard.app" "$BUILD_DIR/Applications/"
cp -R "$BUILD_DIR/TerraFusion Admin.app" "$BUILD_DIR/Applications/"
cp -R "$BUILD_DIR/TerraFusion Monitor.app" "$BUILD_DIR/Applications/"
cp -R "$BUILD_DIR/TerraFusion Backup.app" "$BUILD_DIR/Applications/"
cp -R "$BUILD_DIR/TerraFusion Settings.app" "$BUILD_DIR/Applications/"

# Create background image for DMG
echo -e "${GREEN}🎨 Creating DMG background...${NC}"
mkdir -p "$BUILD_DIR/.background"

# Create background image (placeholder)
cat > "$BUILD_DIR/.background/background.svg" << 'EOF'
<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0891b2;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#00d2ff;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="800" height="600" fill="url(#grad1)"/>
  <text x="400" y="250" font-family="Arial" font-size="48" fill="white" text-anchor="middle">TerraFusion OS 1.0</text>
  <text x="400" y="300" font-family="Arial" font-size="24" fill="white" text-anchor="middle">Government AI Operating System</text>
  <text x="400" y="350" font-family="Arial" font-size="18" fill="white" text-anchor="middle">Drag TerraFusion to Applications to install</text>
</svg>
EOF

# Create DMG
echo -e "${GREEN}📦 Creating DMG package...${NC}"

# Create temporary DMG
hdiutil create -volname "TerraFusion OS 1.0" -srcfolder "$BUILD_DIR" -ov -format UDZO "$DIST_DIR/$DMG_NAME.dmg"

# Clean up build directory
rm -rf "$BUILD_DIR"

echo -e "${GREEN}✅ macOS package created successfully!${NC}"
echo -e "${BLUE}📦 Package: $DIST_DIR/$DMG_NAME.dmg${NC}"
echo -e "${BLUE}🎯 Ready for distribution!${NC}"
