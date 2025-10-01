#!/bin/bash
#
# Start TerraFusion Operations Dashboard
#

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo "Starting TerraFusion Operations Dashboard..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}Python 3 is required but not installed${NC}"
    exit 1
fi

# Install required packages if not present
echo "Checking dependencies..."
pip3 install flask flask-cors psycopg2-binary redis requests > /dev/null 2>&1

# Check if API server is already running
if lsof -i:9999 > /dev/null 2>&1; then
    echo -e "${RED}Dashboard API is already running on port \${{TF_DEBUG_PORT:-9999}}${NC}"
    echo "Stop it first with: ./stop_dashboard.sh"
    exit 1
fi

# Start the API server in background
cd "$(dirname "$0")"
nohup python3 api_server.py > dashboard.log 2>&1 &
API_PID=$!

echo "API Server started with PID: $API_PID"
echo $API_PID > dashboard.pid

# Wait for server to start
sleep 3

# Check if server started successfully
if curl -s http://localhost:\${{TF_DEBUG_PORT:-9999}}/api/metrics/current > /dev/null; then
    echo -e "${GREEN}✓ Operations Dashboard started successfully!${NC}"
    echo ""
    echo "Access the dashboard at:"
    echo "  http://localhost:\${{TF_DEBUG_PORT:-9999}}"
    echo ""
    echo "API Endpoints:"
    echo "  http://localhost:\${{TF_DEBUG_PORT:-9999}}/api/metrics/current"
    echo "  http://localhost:\${{TF_DEBUG_PORT:-9999}}/api/services/health"
    echo "  http://localhost:\${{TF_DEBUG_PORT:-9999}}/api/activities/recent"
    echo ""
    echo "To stop the dashboard, run: ./stop_dashboard.sh"
else
    echo -e "${RED}✗ Failed to start dashboard${NC}"
    kill $API_PID 2>/dev/null
    rm -f dashboard.pid
    exit 1
fi