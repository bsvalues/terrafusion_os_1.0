#!/bin/bash
# start-hub.sh - Launch TerraFusion Hub with Championship Branding
# This script starts the TerraFusion Hub Launcher for DevOps operations

set -e

# TerraFusion Brand Colors for terminal output
BLUE='\033[0;34m'
GREEN='\033[0;32m'
GOLD='\033[0;33m'
NC='\033[0m' # No Color

# Display TerraFusion banner
echo -e "${BLUE}"
cat << "EOF"
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║  ████████╗███████╗██████╗ ██████╗  █████╗                    ║
║  ╚══██╔══╝██╔════╝██╔══██╗██╔══██╗██╔══██╗                   ║
║     ██║   █████╗  ██████╔╝██████╔╝███████║                   ║
║     ██║   ██╔══╝  ██╔══██╗██╔══██╗██╔══██║                   ║
║     ██║   ███████╗██║  ██║██║  ██║██║  ██║                   ║
║     ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝                   ║
║                                                                ║
║  ███████╗██╗   ██╗███████╗██╗ ██████╗ ███╗   ██╗             ║
║  ██╔════╝██║   ██║██╔════╝██║██╔═══██╗████╗  ██║             ║
║  █████╗  ██║   ██║███████╗██║██║   ██║██╔██╗ ██║             ║
║  ██╔══╝  ██║   ██║╚════██║██║██║   ██║██║╚██╗██║             ║
║  ██║     ╚██████╔╝███████║██║╚██████╔╝██║ ╚████║             ║
║  ╚═╝      ╚═════╝ ╚══════╝╚═╝ ╚═════╝ ╚═╝  ╚═══╝             ║
║                                                                ║
║            🏆 Championship DevOps Hub Launcher 🏆              ║
╚════════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Configuration
LAUNCHER_HOME="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CONFIG_FILE="$LAUNCHER_HOME/configs/hub-launcher-config.json"
LOG_FILE="$LAUNCHER_HOME/logs/hub-launcher.log"
PID_FILE="$LAUNCHER_HOME/hub-launcher.pid"

# Create logs directory if it doesn't exist
mkdir -p "$LAUNCHER_HOME/logs"

# Function to check if launcher is already running
check_running() {
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p "$PID" > /dev/null 2>&1; then
            echo -e "${GOLD}⚠️  TerraFusion Hub is already running (PID: $PID)${NC}"
            return 0
        else
            rm -f "$PID_FILE"
        fi
    fi
    return 1
}

# Function to start services
start_services() {
    echo -e "${GREEN}🚀 Starting TerraFusion services...${NC}"
    
    # Check Docker
    if ! docker info > /dev/null 2>&1; then
        echo -e "${GOLD}⚠️  Docker is not running. Starting Docker...${NC}"
        if [[ "$OSTYPE" == "darwin"* ]]; then
            open -a Docker
            sleep 10
        else
            sudo systemctl start docker
        fi
    fi
    
    # Check Kubernetes (if using local k8s)
    if command -v kubectl &> /dev/null; then
        echo -e "${BLUE}🔧 Checking Kubernetes cluster...${NC}"
        if ! kubectl cluster-info &> /dev/null; then
            echo -e "${GOLD}⚠️  Local Kubernetes not available${NC}"
        else
            echo -e "${GREEN}✅ Kubernetes cluster is ready${NC}"
        fi
    fi
}

# Function to launch the hub
launch_hub() {
    echo -e "${BLUE}🎯 Launching TerraFusion Hub...${NC}"
    
    # Check which launcher to use
    if [ -f "$LAUNCHER_HOME/desktop/terrafusion-launcher" ]; then
        # Tauri desktop launcher
        echo -e "${GREEN}🖥️  Starting desktop launcher...${NC}"
        nohup "$LAUNCHER_HOME/desktop/terrafusion-launcher" \
            --config "$CONFIG_FILE" \
            >> "$LOG_FILE" 2>&1 &
        PID=$!
    elif [ -f "$LAUNCHER_HOME/web/index.html" ]; then
        # Web-based launcher
        echo -e "${GREEN}🌐 Starting web launcher...${NC}"
        cd "$LAUNCHER_HOME/web"
        python3 -m http.server 8888 >> "$LOG_FILE" 2>&1 &
        PID=$!
        sleep 2
        
        # Open in default browser
        if [[ "$OSTYPE" == "darwin"* ]]; then
            open "http://localhost:\${{TF_PORT_8888:-8888}}"
        elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
            xdg-open "http://localhost:\${{TF_PORT_8888:-8888}}"
        elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
            start "http://localhost:\${{TF_PORT_8888:-8888}}"
        fi
    else
        echo -e "${RED}❌ No launcher found! Please run setup first.${NC}"
        exit 1
    fi
    
    # Save PID
    echo $PID > "$PID_FILE"
    
    echo -e "${GREEN}✅ TerraFusion Hub launched successfully!${NC}"
    echo -e "${BLUE}📊 Process ID: $PID${NC}"
    echo -e "${BLUE}📝 Logs: $LOG_FILE${NC}"
}

# Function to show status
show_status() {
    echo -e "\n${BLUE}📊 TerraFusion Application Status:${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    # Check each application
    apps=(
        "CostForgeAI:${TF_STATIC_PORT:-8080}"
        "PropertyWorkbench:8082"
        "GISPRO:8081"
        "TerraInsight:8083"
        "TerraFlow:8084"
        "TerraMiner:8085"
        "TerraFusionSync:8086"
        "TerraLevy:8087"
        "TerraAgent:8088"
        "TerraFusionAssessor:8089"
        "PILT System:8090"
        "TerraFusionPermit:8091"
        "TerraFusion Dashboard:8092"
        "Marketplace:8093"
    )
    
    for app in "${apps[@]}"; do
        IFS=':' read -r name port <<< "$app"
        if curl -s -o /dev/null -w "%{http_code}" "http://localhost:$port/health" | grep -q "200"; then
            echo -e "✅ $name (port $port): ${GREEN}RUNNING${NC}"
        else
            echo -e "❌ $name (port $port): ${RED}NOT RUNNING${NC}"
        fi
    done
    
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Main execution
main() {
    case "${1:-start}" in
        start)
            if check_running; then
                exit 0
            fi
            start_services
            launch_hub
            sleep 3
            show_status
            echo -e "\n${GREEN}🏆 TerraFusion Hub is ready for championship operations!${NC}"
            echo -e "${BLUE}🌐 Access the hub at: http://localhost:\${{TF_PORT_8888:-8888}}${NC}"
            ;;
        stop)
            if [ -f "$PID_FILE" ]; then
                PID=$(cat "$PID_FILE")
                echo -e "${BLUE}🛑 Stopping TerraFusion Hub (PID: $PID)...${NC}"
                kill "$PID" 2>/dev/null || true
                rm -f "$PID_FILE"
                echo -e "${GREEN}✅ TerraFusion Hub stopped${NC}"
            else
                echo -e "${GOLD}⚠️  TerraFusion Hub is not running${NC}"
            fi
            ;;
        restart)
            $0 stop
            sleep 2
            $0 start
            ;;
        status)
            if check_running; then
                show_status
            else
                echo -e "${GOLD}⚠️  TerraFusion Hub is not running${NC}"
            fi
            ;;
        logs)
            if [ -f "$LOG_FILE" ]; then
                tail -f "$LOG_FILE"
            else
                echo -e "${GOLD}⚠️  No logs found${NC}"
            fi
            ;;
        *)
            echo "Usage: $0 {start|stop|restart|status|logs}"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"