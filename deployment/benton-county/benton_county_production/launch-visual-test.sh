#!/bin/bash
# 🏆 CHAMPIONSHIP VISUAL TEST LAUNCH SCRIPT
# Benton County Production Visual Testing

set -euo pipefail

# Colors for championship output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
BOLD='\033[1m'
NC='\033[0m'

echo -e "${BLUE}${BOLD}"
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║        🏆 TERRAFUSION CHAMPIONSHIP VISUAL TEST 🏆             ║"
echo "║              Benton County Production Launch                  ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check if services are running
echo -e "${YELLOW}[1/5] Checking existing services...${NC}"
DEMO_PORT=\${{TF_FRONTEND_3005_PORT:-3005}}
DASHBOARD_PORT=\${{TF_FRONTEND_3005_PORT:-3005}}
API_PORT=\${{TF_FRONTEND_3005_PORT:-3005}}

# Kill any existing processes on our ports
for PORT in $DEMO_PORT $DASHBOARD_PORT $API_PORT; do
    if lsof -i :$PORT > /dev/null 2>&1; then
        echo "Stopping existing service on port $PORT..."
        lsof -ti :$PORT | xargs kill -9 2>/dev/null || true
    fi
done

# Start Benton County Demo Server
echo -e "${GREEN}[2/5] Starting Benton County Demo Server...${NC}"
cd /mnt/e/TerraFusion_Master_Workspace/BENTON_COUNTY_CHAMPIONSHIP_DEMO
node demo-server.js &
DEMO_PID=$!
echo "Demo server started (PID: $DEMO_PID)"

# Start TerraFusion Dashboard
echo -e "${GREEN}[3/5] Starting TerraFusion Dashboard...${NC}"
cd /mnt/e/TerraFusion_Master_Workspace/apps/TerraFusionDashboard
npm start &
DASHBOARD_PID=$!
echo "Dashboard started (PID: $DASHBOARD_PID)"

# Wait for services to start
echo -e "${YELLOW}[4/5] Waiting for services to initialize...${NC}"
sleep 5

# Display access information
echo -e "${BLUE}${BOLD}"
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                 🌟 VISUAL TEST READY 🌟                       ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo -e "${GREEN}Access Points for Visual Testing:${NC}"
echo ""
echo -e "${BOLD}🏛️  Benton County Demo Portal:${NC}"
echo -e "   ${BLUE}http://localhost:\${{TF_FRONTEND_3005_PORT:-3005}}${NC}"
echo ""
echo -e "${BOLD}📊 TerraFusion Dashboard:${NC}"
echo -e "   ${BLUE}http://localhost:\${{TF_FRONTEND_3005_PORT:-3005}}${NC}"
echo ""
echo -e "${BOLD}🔧 API Documentation:${NC}"
echo -e "   ${BLUE}http://localhost:\${{TF_FRONTEND_3005_PORT:-3005}}/api-docs${NC}"
echo ""
echo -e "${BOLD}📈 Sample Property Lookup:${NC}"
echo -e "   ${BLUE}http://localhost:\${{TF_FRONTEND_3005_PORT:-3005}}/property/123456${NC}"
echo ""

echo -e "${YELLOW}Test Scenarios Available:${NC}"
echo "1. Property Assessment Workflow (15 min)"
echo "2. Tax Calculation Demo (10 min)"
echo "3. AI-Powered Analysis (12 min)"
echo "4. Full System Tour (8 min)"
echo ""

echo -e "${GREEN}Visual Elements to Test:${NC}"
echo "✅ Responsive design on different screen sizes"
echo "✅ Dark/light mode toggle"
echo "✅ Interactive GIS maps"
echo "✅ Real-time data updates"
echo "✅ Charts and visualizations"
echo "✅ Mobile responsiveness"
echo ""

echo -e "${BOLD}Press Ctrl+C to stop all services${NC}"

# Keep script running
tail -f /dev/null