#!/bin/bash

set -e

CYAN='\033[0;36m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${CYAN}========================================"
echo -e "   TerraFusion OS 1.0 - Starting Up    "
echo -e "========================================${NC}"
echo ""

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

start_backend() {
    echo -e "${YELLOW}[BACKEND] Starting API server on port 5000...${NC}"
    
    BACKEND_PATH="$SCRIPT_DIR/backend/TerraFusion.API"
    
    if [ ! -d "$BACKEND_PATH" ]; then
        echo -e "${RED}[ERROR] Backend directory not found at: $BACKEND_PATH${NC}"
        return 1
    fi
    
    cd "$BACKEND_PATH"
    dotnet run --urls "http://localhost:5000" &
    BACKEND_PID=$!
    
    sleep 3
    
    MAX_ATTEMPTS=30
    for i in $(seq 1 $MAX_ATTEMPTS); do
        if curl -s http://localhost:5000/health > /dev/null 2>&1; then
            RESPONSE=$(curl -s http://localhost:5000/health)
            echo -e "${GREEN}[BACKEND] ✅ API server is running!${NC}"
            echo -e "[BACKEND] Response: $RESPONSE"
            return 0
        fi
        echo -e "[BACKEND] Waiting for API to start... ($i/$MAX_ATTEMPTS)"
        sleep 1
    done
    
    echo -e "${YELLOW}[WARNING] Backend API didn't respond in time, but may still be starting...${NC}"
    return 0
}

start_frontend() {
    echo ""
    echo -e "${YELLOW}[FRONTEND] Starting React application on port 3000...${NC}"
    
    FRONTEND_PATH="$SCRIPT_DIR/frontend"
    
    if [ ! -d "$FRONTEND_PATH" ]; then
        echo -e "${RED}[ERROR] Frontend directory not found at: $FRONTEND_PATH${NC}"
        return 1
    fi
    
    cd "$FRONTEND_PATH"
    
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}[FRONTEND] Installing dependencies...${NC}"
        npm install
    fi
    
    npm start &
    FRONTEND_PID=$!
    
    sleep 5
    
    echo -e "${GREEN}[FRONTEND] ✅ React application starting...${NC}"
    echo -e "${CYAN}[FRONTEND] Opening browser at http://localhost:3000${NC}"
    
    sleep 3
    
    if command -v xdg-open > /dev/null; then
        xdg-open http://localhost:3000
    elif command -v open > /dev/null; then
        open http://localhost:3000
    fi
    
    return 0
}

show_status() {
    echo ""
    echo -e "${GREEN}========================================"
    echo -e "   TerraFusion OS 1.0 - Running!       "
    echo -e "========================================${NC}"
    echo ""
    echo -e "${CYAN}🌐 Frontend: http://localhost:3000${NC}"
    echo -e "${CYAN}🚀 Backend API: http://localhost:5000${NC}"
    echo -e "${CYAN}📊 Health Check: http://localhost:5000/health${NC}"
    echo -e "${CYAN}📡 API Test: http://localhost:5000/api/test${NC}"
    echo ""
    echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
    echo ""
}

stop_services() {
    echo ""
    echo -e "${YELLOW}Stopping TerraFusion services...${NC}"
    
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
    fi
    
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    
    pkill -f "dotnet.*TerraFusion" 2>/dev/null || true
    pkill -f "node.*react-scripts" 2>/dev/null || true
    
    echo -e "${GREEN}Services stopped.${NC}"
}

trap stop_services EXIT INT TERM

start_backend

if [ $? -eq 0 ]; then
    start_frontend
    
    if [ $? -eq 0 ]; then
        show_status
        
        echo "Services are running. Press Ctrl+C to stop."
        while true; do
            sleep 60
        done
    else
        echo -e "${RED}[ERROR] Failed to start frontend${NC}"
        stop_services
        exit 1
    fi
else
    echo -e "${RED}[ERROR] Failed to start backend${NC}"
    exit 1
fi

