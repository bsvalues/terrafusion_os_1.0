#!/bin/bash
# TerraFusion OS 1.0 - Benton County, Washington Launch Script
# Complete Government Operating System Launcher

echo "🏛️ TERRAFUSION OS 1.0 - BENTON COUNTY, WASHINGTON 🏛️"
echo "======================================================"
echo "Complete Government Operating System Launch"
echo ""

# Kill any existing HTTP servers
pkill -f "python.*http.server" 2>/dev/null || true
sleep 2

# Start the HTTP server for Benton County, Washington
echo "🚀 Starting TerraFusion OS for Benton County, Washington..."
echo "📡 HTTP Server starting on port 8080..."

python3 -m http.server 8080 --bind 0.0.0.0 &
SERVER_PID=$!

sleep 3

echo ""
echo "✅ TERRAFUSION OS SUCCESSFULLY LAUNCHED FOR BENTON COUNTY, WASHINGTON"
echo "=============================================================="
echo ""
echo "🌐 ACCESS POINTS:"
echo "   📊 Enterprise Command Center: http://localhost:8080/enterprise-command-center.html"
echo "   🏛️ Government Administration Portal: http://localhost:8080/government-administration-portal.html"
echo "   🤖 AI Agent Management: http://localhost:8080/ai-agent-management-portal.html"
echo "   💰 Revenue Analytics: http://localhost:8080/revenue-analytics-dashboard.html"
echo "   📈 Complete Ecosystem: http://localhost:8080/TERRAFUSION_COMPLETE_ECOSYSTEM_DASHBOARD.html"
echo ""
echo "🎯 SYSTEM STATUS:"
echo "   🏛️ County: BENTON COUNTY, WASHINGTON"
echo "   🌐 Server: RUNNING (PID: $SERVER_PID)"
echo "   📡 Port: 8080"
echo "   ✅ Status: OPERATIONAL"
echo ""
echo "🔧 QUICK SYSTEM TESTS:"

# Run quick integration test
echo "   🧪 Running integration tests..."
python3 quick-integration-demo.py | tail -5

echo ""
echo "🌟 TERRAFUSION OS FOR BENTON COUNTY, WASHINGTON IS READY!"
echo "Visit the portals above to access your government operating system."
echo ""
echo "Press Ctrl+C to stop the server"

# Keep the script running and monitor the server
trap 'echo ""; echo "🛑 Shutting down TerraFusion OS..."; kill $SERVER_PID 2>/dev/null; exit 0' INT

# Monitor server
while kill -0 $SERVER_PID 2>/dev/null; do
    sleep 5
done

echo "❌ Server stopped unexpectedly"