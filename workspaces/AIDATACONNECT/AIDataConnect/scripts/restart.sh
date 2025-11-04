#!/bin/bash

# RAG Drive FTP Hub Restart Script
# This script restarts the application

set -e  # Exit immediately if a command exits with a non-zero status

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print section header
print_header() {
    echo -e "\n${BLUE}=====================================================================${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}=====================================================================${NC}\n"
}

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ $2${NC}"
    else
        echo -e "${RED}✗ $2${NC}"
        if [ -n "$3" ]; then
            echo -e "${RED}  Error: $3${NC}"
        fi
    fi
}

# Restart with Docker Compose
restart_docker() {
    print_header "Restarting with Docker Compose"
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        print_status 1 "Docker is not installed or not in PATH"
        exit 1
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null; then
        print_status 1 "Docker Compose is not installed or not in PATH"
        exit 1
    fi
    
    # Check if docker-compose.yml exists
    if [ ! -f "docker-compose.yml" ]; then
        print_status 1 "docker-compose.yml not found"
        exit 1
    fi
    
    # Create database backup if the application is already running
    if docker-compose ps | grep -q "rag-drive-db"; then
        echo -e "${YELLOW}Existing database detected. Creating backup...${NC}"
        ./scripts/db-backup.sh || true
    fi
    
    # Restart containers
    echo "Restarting containers..."
    docker-compose down
    docker-compose up -d
    
    print_status $? "Containers restarted"
    
    # Verify restart
    echo "Verifying restart..."
    sleep 5
    
    if docker-compose ps | grep -q "Up"; then
        print_status 0 "Containers are running"
    else
        print_status 1 "Containers failed to start"
        echo "Logs:"
        docker-compose logs
        exit 1
    fi
}

# Restart with PM2
restart_pm2() {
    print_header "Restarting with PM2"
    
    # Check if PM2 is installed
    if ! command -v pm2 &> /dev/null; then
        print_status 1 "PM2 is not installed or not in PATH"
        echo -e "${YELLOW}Run 'npm install -g pm2' to install PM2${NC}"
        exit 1
    fi
    
    # Check if process.json exists
    if [ -f "process.json" ]; then
        echo "Restarting using process.json configuration..."
        pm2 reload process.json
        print_status $? "Application restarted with PM2"
    else
        echo "No process.json found. Restarting using direct command..."
        
        # Check if the app is running
        if pm2 list | grep -q "rag-drive"; then
            pm2 reload rag-drive
            print_status $? "Application restarted with PM2"
        else
            echo "Starting application with PM2..."
            pm2 start server/index.js --name rag-drive
            print_status $? "Application started with PM2"
        fi
    fi
    
    # Display status
    echo
    echo "Current PM2 processes:"
    pm2 list
}

# Restart with Node.js
restart_node() {
    print_header "Restarting with Node.js"
    
    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        print_status 1 "Node.js is not installed or not in PATH"
        exit 1
    fi
    
    # Find and kill existing Node.js process
    echo "Looking for existing Node.js process..."
    pid=$(ps aux | grep '[n]ode.*server/index' | awk '{print $2}')
    
    if [ -n "$pid" ]; then
        echo "Killing process $pid..."
        kill $pid
        sleep 2
        
        # Check if process is still running
        if ps -p $pid > /dev/null; then
            echo "Process still running. Sending SIGKILL..."
            kill -9 $pid
            sleep 1
        fi
        
        print_status 0 "Previous process terminated"
    else
        echo "No existing process found."
    fi
    
    # Start new process
    echo "Starting new Node.js process..."
    NODE_ENV=production nohup node server/index.js > logs/app.log 2>&1 &
    new_pid=$!
    
    echo "Started new process with PID: $new_pid"
    
    # Check if process is running
    sleep 2
    if ps -p $new_pid > /dev/null; then
        print_status 0 "Application restarted successfully"
    else
        print_status 1 "Failed to start application"
        echo "Check logs/app.log for details"
        exit 1
    fi
}

# Main function
main() {
    print_header "RAG Drive FTP Hub Application Restart"
    echo "This script will restart the RAG Drive FTP Hub application."
    echo
    
    # Ensure logs directory exists
    mkdir -p logs
    
    # Choose restart method
    echo "Restart methods:"
    echo "1) Docker Compose (recommended for production)"
    echo "2) PM2 Process Manager"
    echo "3) Direct Node.js"
    echo
    read -p "Select restart method (1/2/3): " restart_method
    
    case $restart_method in
        1)
            restart_docker
            ;;
        2)
            restart_pm2
            ;;
        3)
            restart_node
            ;;
        *)
            echo -e "${RED}Invalid selection. Restart canceled.${NC}"
            exit 1
            ;;
    esac
    
    print_header "Restart Complete"
    echo -e "${GREEN}RAG Drive FTP Hub has been restarted successfully!${NC}"
    
    # Display current date and time
    echo "Restart completed at: $(date)"
}

# Run the main function
main