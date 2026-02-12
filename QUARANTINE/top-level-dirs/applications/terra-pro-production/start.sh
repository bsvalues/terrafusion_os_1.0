#!/bin/bash

# TerraFusion Core AI Valuator Launcher
# This script starts both the API and frontend servers

# Color definitions
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Display banner
echo -e "${BOLD}${CYAN}"
echo " _______                   _____           _             "
echo "|__   __|                 |  __ \\         (_)            "
echo "   | | ___ _ __ _ __ __ _ | |__) |   _ ___ _  ___  _ __  "
echo "   | |/ _ \\ '__| '__/ _\` ||  ___/ | | / __| |/ _ \\| '_ \\ "
echo "   | |  __/ |  | | | (_| || |   | |_| \\__ \\ | (_) | | | |"
echo "   |_|\\___|_|  |_|  \\__,_||_|    \\__,_|___/_|\\___/|_| |_|"
echo "                                                         "
echo -e " Core AI Valuator - Starting Services...${NC}"
echo ""

# Function to clean up on exit
cleanup() {
    echo -e "\n${MAGENTA}Shutting down TerraFusion services...${NC}"
    # Kill all background processes
    kill $(jobs -p) 2>/dev/null
    exit
}

# Trap SIGINT (Ctrl+C)
trap cleanup SIGINT

# Start the Python API server in the background
echo -e "${YELLOW}[Backend]${NC} Starting Python FastAPI server..."
python3 run_api.py > api_logs.txt 2>&1 &
API_PID=$!

# Wait a moment to let the API server start
sleep 3

# Check if API server is running
if kill -0 $API_PID 2>/dev/null; then
    echo -e "${GREEN}[Backend]${NC} API server started successfully (PID: $API_PID)"
else
    echo -e "${RED}[Backend]${NC} Failed to start API server"
    cat api_logs.txt
    cleanup
fi

# Start the frontend server
echo -e "${BLUE}[Frontend]${NC} Starting frontend server..."
python3 serve_frontend.py > frontend_logs.txt 2>&1 &
FRONTEND_PID=$!

# Wait a moment to let the frontend server start
sleep 2

# Check if frontend server is running
if kill -0 $FRONTEND_PID 2>/dev/null; then
    echo -e "${GREEN}[Frontend]${NC} Frontend server started successfully (PID: $FRONTEND_PID)"
else
    echo -e "${RED}[Frontend]${NC} Failed to start frontend server"
    cat frontend_logs.txt
    cleanup
fi

echo -e "${BOLD}${CYAN}TerraFusion Core AI Valuator - All services started${NC}"
echo -e "${GREEN}API Server:${NC} http://localhost:8000"
echo -e "${GREEN}Frontend:${NC} http://localhost:3000"
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"

# Keep the script running until Ctrl+C
while true; do
    # Check if processes are still running
    if ! kill -0 $API_PID 2>/dev/null; then
        echo -e "${RED}[Backend]${NC} API server has stopped unexpectedly"
        cat api_logs.txt
        cleanup
    fi
    
    if ! kill -0 $FRONTEND_PID 2>/dev/null; then
        echo -e "${RED}[Frontend]${NC} Frontend server has stopped unexpectedly"
        cat frontend_logs.txt
        cleanup
    fi
    
    sleep 5
done