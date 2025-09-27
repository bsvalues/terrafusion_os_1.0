#!/bin/bash
# TerraFusion OS Complete Desktop Environment Launcher
# Launches the native desktop shell with all applications integrated

echo "🌍 TerraFusion OS - Complete Desktop Environment"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   Government. Transcended."
echo "   Native Desktop Shell - NOT browser based!"
echo ""

# Set environment variables
export TF_DESKTOP_MODE="native"
export TF_BRAND_CONFIG="/workspaces/terrafusion_os_1.0/Brand_Assets/tf-brand-config.json"
export DISPLAY=:0.0

cd /workspaces/terrafusion_os_1.0

echo "🔋 Starting TerraFusion OS Core Services..."

# Start core APIs if not running
if ! pgrep -f "terrafusion_cos_api.py" > /dev/null; then
    echo "   🚀 Starting TerraFusion cOS API..."
    cd terrafusion-os/kernel && python3 terrafusion_cos_api.py &
    sleep 2
fi

if ! pgrep -f "harris_pacs_api.py" > /dev/null; then
    echo "   🔗 Starting Harris PACS Integration..."
    cd terrafusion-os/kernel && python3 harris_pacs_api.py &
    sleep 2
fi

if ! pgrep -f "terra_flow_api.py" > /dev/null; then
    echo "   🌊 Starting Terra Flow Engine..."
    cd terrafusion-os/kernel && python3 terra_flow_api.py &
    sleep 2
fi

echo ""
echo "🖥️  Launching Native TerraFusion Desktop Shell..."
echo "   📱 Applications: AI Swarm, TerraFusion Sync, Terra Flow, Security Mesh, AI Assistant"
echo "   🎨 Using Official TerraFusion Brand Assets"
echo "   ⚡ Real native desktop environment with window management"
echo ""

# Launch the native desktop shell
cd /workspaces/terrafusion_os_1.0/terrafusion-os/desktop
python3 terrafusion_desktop.py

echo ""
echo "🌍 TerraFusion OS Desktop Shell Closed"