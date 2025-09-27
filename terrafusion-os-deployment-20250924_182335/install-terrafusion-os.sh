#!/bin/bash

echo "🏛️ TerraFusion OS - Laptop Installation"
echo "====================================="

# Check system requirements
echo "🔍 Checking system requirements..."

# Check Python 3
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required. Please install Python 3.8+ first."
    exit 1
fi

# Check .NET 8
if ! command -v dotnet &> /dev/null; then
    echo "❌ .NET 8 is required. Please install .NET 8.0 SDK first."
    echo "Download from: https://dotnet.microsoft.com/download/dotnet/8.0"
    exit 1
fi

# Check Node.js (for additional tools)
if ! command -v node &> /dev/null; then
    echo "⚠️ Node.js recommended for additional tooling."
fi

echo "✅ System requirements satisfied"

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip3 install flask requests psutil

# Install .NET dependencies
echo "🚀 Restoring .NET dependencies..."
cd backend/TerraFusion.API/
dotnet restore
cd ../../

# Set executable permissions
chmod +x scripts/*.sh

# Create desktop shortcuts (Linux)
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "🖥️ Creating desktop shortcuts..."
    mkdir -p ~/.local/share/applications/
    
    cat > ~/.local/share/applications/terrafusion-os.desktop << DESKTOP
[Desktop Entry]
Version=1.0
Type=Application
Name=TerraFusion OS
Comment=Government Operating System
Exec=$(pwd)/scripts/boot-terrafusion-os.sh
Icon=applications-system
Terminal=true
Categories=System;Government;
DESKTOP
    
    chmod +x ~/.local/share/applications/terrafusion-os.desktop
    echo "✅ Desktop shortcut created"
fi

echo ""
echo "🎉 TerraFusion OS Installation Complete!"
echo ""
echo "To start TerraFusion OS:"
echo "  ./scripts/boot-terrafusion-os.sh"
echo ""
echo "To stop TerraFusion OS:"
echo "  ./scripts/shutdown-terrafusion-os.sh"
echo ""
echo "Access interfaces at:"
echo "  • Main OS Interface: http://localhost:8080/"
echo "  • AI Command Center: http://localhost:8080/ai-command-center.html"
echo "  • County Operations: http://localhost:8080/county-operations.html"
echo "  • System Status: http://localhost:8080/system-integration-status.html"
echo ""
echo "🏛️ Government. Transcended. 🏛️"
