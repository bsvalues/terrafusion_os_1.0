#!/bin/bash
#
# Stop TerraFusion Operations Dashboard
#

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo "Stopping TerraFusion Operations Dashboard..."

# Check if PID file exists
if [ -f dashboard.pid ]; then
    PID=$(cat dashboard.pid)
    
    # Check if process is running
    if ps -p $PID > /dev/null 2>&1; then
        kill $PID
        echo -e "${GREEN}✓ Dashboard stopped (PID: $PID)${NC}"
        rm -f dashboard.pid
    else
        echo -e "${RED}Dashboard process not found (PID: $PID)${NC}"
        rm -f dashboard.pid
    fi
else
    echo -e "${RED}No dashboard PID file found${NC}"
    
    # Try to find and kill by port
    if lsof -i:9999 > /dev/null 2>&1; then
        PID=$(lsof -t -i:9999)
        kill $PID
        echo -e "${GREEN}✓ Dashboard stopped by port lookup${NC}"
    else
        echo "Dashboard is not running"
    fi
fi

# Clean up log file if it's too large
if [ -f dashboard.log ] && [ $(stat -f%z dashboard.log 2>/dev/null || stat -c%s dashboard.log 2>/dev/null) -gt 10485760 ]; then
    echo "Rotating large log file..."
    mv dashboard.log dashboard.log.$(date +%Y%m%d_%H%M%S)
fi