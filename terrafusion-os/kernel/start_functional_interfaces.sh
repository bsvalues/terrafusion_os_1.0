#!/bin/bash

# TerraFusion cOS Functional Interface Launcher
# Starts all vendor integration APIs and interfaces

echo "🚀 Starting TerraFusion cOS Functional Interfaces"
echo "=================================================="

# Check Python dependencies
echo "📦 Checking Python dependencies..."
python3 -c "import fastapi, uvicorn, sqlite3, requests" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "⚠️  Installing required Python packages..."
    pip install fastapi uvicorn requests sqlite3
fi

# Set working directory
cd "$(dirname "$0")"

echo ""
echo "🏗️ Starting TerraFusion cOS Vendor Substrate API (Port 8000)..."
python3 terrafusion_cos_api.py &
SUBSTRATE_PID=$!

sleep 2

echo "🏛️ Starting Harris PACS Integration API (Port 8001)..."
python3 harris_pacs_api.py &
HARRIS_PID=$!

sleep 2

echo "🌊 Starting Terra Flow Workflow API (Port 8002)..."
python3 terra_flow_api.py &
TERRA_FLOW_PID=$!

sleep 3

echo "🌐 Starting Unified API Gateway (Port 8003)..."
python3 api_gateway.py &
GATEWAY_PID=$!

sleep 3

echo ""
echo "✅ All TerraFusion cOS interfaces are now running!"
echo "=================================================="
echo ""
echo "🌟 FUNCTIONAL INTERFACES FOR VENDOR ACCESS:"
echo ""
echo "📊 TerraFusion cOS API Gateway (Main Portal)"
echo "   🔗 http://localhost:8003"
echo "   📚 Interactive Docs: http://localhost:8003/docs"
echo "   📖 API Documentation: http://localhost:8003/redoc"
echo ""
echo "🏗️ Vendor Substrate API"
echo "   🔗 http://localhost:8000"
echo "   • Vendor registration and module wrapping"
echo "   • Compliance auditing and performance testing"
echo "   • Data synchronization with TerraFusion substrate"
echo ""
echo "🏛️ Harris PACS Integration API"
echo "   🔗 http://localhost:8001"
echo "   • Real property assessment data access"
echo "   • Parcel search and detailed property information"
echo "   • Tax calculations and assessment analytics"
echo ""
echo "🌊 Terra Flow Workflow API"
echo "   🔗 http://localhost:8002"
echo "   • Automated workflow execution"
echo "   • Real-time event streaming"
echo "   • Property valuation and data sync workflows"
echo ""
echo "🧪 QUICK FUNCTIONAL TESTS:"
echo ""
echo "1️⃣ Test Vendor Registration:"
echo 'curl -X POST "http://localhost:8003/api/vendor/register" -H "Content-Type: application/json" -d'"'"'{"vendor_name":"Test Vendor","contact_email":"test@vendor.com","product_suite":"Testing","integration_type":"Strategic","contract_value":100000,"modules":["test"]}'"'"
echo ""
echo "2️⃣ Test Harris PACS Data Access:"
echo 'curl "http://localhost:8003/api/harris/parcels?limit=3"'
echo ""
echo "3️⃣ Test Workflow Execution:"
echo 'curl -X POST "http://localhost:8003/api/workflow/harris_pacs_sync/execute"'
echo ""
echo "4️⃣ Test System Health:"
echo 'curl "http://localhost:8003/api/system/health"'
echo ""
echo "📊 System Status Dashboard:"
echo 'curl "http://localhost:8003/api/system/metrics"'
echo ""
echo "🛑 To stop all services:"
echo "   kill $SUBSTRATE_PID $HARRIS_PID $TERRA_FLOW_PID $GATEWAY_PID"
echo ""
echo "💡 TIP: Visit http://localhost:8003 for the complete developer portal"
echo "   with interactive documentation and testing interfaces!"
echo ""

# Save PIDs for cleanup
echo "SUBSTRATE_PID=$SUBSTRATE_PID" > .terrafusion_pids
echo "HARRIS_PID=$HARRIS_PID" >> .terrafusion_pids  
echo "TERRA_FLOW_PID=$TERRA_FLOW_PID" >> .terrafusion_pids
echo "GATEWAY_PID=$GATEWAY_PID" >> .terrafusion_pids

# Keep script running and show real-time status
echo "⏰ Services Status Monitor (Press Ctrl+C to stop all services):"
echo ""

while true; do
    # Check if all services are still running
    services_running=0
    
    if kill -0 $SUBSTRATE_PID 2>/dev/null; then
        substrate_status="🟢 RUNNING"
        ((services_running++))
    else
        substrate_status="🔴 STOPPED"
    fi
    
    if kill -0 $HARRIS_PID 2>/dev/null; then
        harris_status="🟢 RUNNING"
        ((services_running++))
    else
        harris_status="🔴 STOPPED"
    fi
    
    if kill -0 $TERRA_FLOW_PID 2>/dev/null; then
        terra_flow_status="🟢 RUNNING"
        ((services_running++))
    else
        terra_flow_status="🔴 STOPPED"
    fi
    
    if kill -0 $GATEWAY_PID 2>/dev/null; then
        gateway_status="🟢 RUNNING"
        ((services_running++))
    else
        gateway_status="🔴 STOPPED"
    fi
    
    # Clear screen and show status
    clear
    echo "🚀 TerraFusion cOS Functional Interfaces - Live Status"
    echo "======================================================"
    echo "$(date)"
    echo ""
    echo "📊 Service Status:"
    echo "   🏗️  Vendor Substrate API (8000): $substrate_status"
    echo "   🏛️  Harris PACS API (8001):      $harris_status"  
    echo "   🌊 Terra Flow API (8002):        $terra_flow_status"
    echo "   🌐 API Gateway (8003):           $gateway_status"
    echo ""
    echo "📈 Services Running: $services_running/4"
    echo ""
    if [ $services_running -eq 4 ]; then
        echo "✅ All interfaces operational and ready for vendor access!"
        echo ""
        echo "🌟 Main Portal: http://localhost:8003"
        echo "📚 API Docs: http://localhost:8003/docs"
    else
        echo "⚠️  Some services are not running. Check logs above."
    fi
    echo ""
    echo "Press Ctrl+C to stop all services..."
    
    sleep 5
done

# Cleanup function
cleanup() {
    echo ""
    echo "🛑 Stopping all TerraFusion cOS services..."
    
    if [ -f .terrafusion_pids ]; then
        source .terrafusion_pids
        kill $SUBSTRATE_PID $HARRIS_PID $TERRA_FLOW_PID $GATEWAY_PID 2>/dev/null
        rm .terrafusion_pids
        echo "✅ All services stopped"
    fi
    
    exit 0
}

# Set trap for cleanup
trap cleanup SIGINT SIGTERM