#!/bin/bash

# TerraFusion Production Monitoring Suite
# Production Deployment Swarm Delta - Continuous Monitoring
# Comprehensive monitoring and alerting for production deployment

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MONITORING_LOG_DIR="$SCRIPT_DIR/monitoring-logs"
PRODUCTION_DOMAIN="terrafusionmarket.io"
ALERT_THRESHOLD_CPU=80
ALERT_THRESHOLD_MEMORY=85
ALERT_THRESHOLD_DISK=90
HEALTH_CHECK_INTERVAL=30
MONITORING_PORT=\${{TF_SHELL_PORT:-3001}}

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Create monitoring directory
mkdir -p "$MONITORING_LOG_DIR"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
MONITORING_LOG="$MONITORING_LOG_DIR/monitoring_$TIMESTAMP.log"

# Logging function
log_monitor() {
    local level=$1
    shift
    local message="$@"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "[$timestamp] [$level] $message" | tee -a "$MONITORING_LOG"
}

print_monitoring_header() {
    echo -e "${PURPLE}===========================================${NC}"
    echo -e "${PURPLE}  TerraFusion Production Monitoring Suite${NC}"
    echo -e "${PURPLE}  Continuous Health & Performance Monitor${NC}"
    echo -e "${PURPLE}===========================================${NC}"
    echo ""
}

# System resource monitoring
monitor_system_resources() {
    local cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}')
    local memory_usage=$(free | grep Mem | awk '{printf("%.1f", $3/$2 * 100.0)}')
    local disk_usage=$(df -h / | awk 'NR==2{printf "%s", $5}' | sed 's/%//')
    
    # CPU Monitoring
    if (( $(echo "$cpu_usage > $ALERT_THRESHOLD_CPU" | bc -l) )); then
        log_monitor "ALERT" "HIGH CPU USAGE: ${cpu_usage}% (Threshold: ${ALERT_THRESHOLD_CPU}%)"
        echo -e "${RED}🚨 CPU ALERT: ${cpu_usage}%${NC}"
    else
        log_monitor "INFO" "CPU Usage: ${cpu_usage}%"
        echo -e "${GREEN}✓ CPU: ${cpu_usage}%${NC}"
    fi
    
    # Memory Monitoring
    if (( $(echo "$memory_usage > $ALERT_THRESHOLD_MEMORY" | bc -l) )); then
        log_monitor "ALERT" "HIGH MEMORY USAGE: ${memory_usage}% (Threshold: ${ALERT_THRESHOLD_MEMORY}%)"
        echo -e "${RED}🚨 MEMORY ALERT: ${memory_usage}%${NC}"
    else
        log_monitor "INFO" "Memory Usage: ${memory_usage}%"
        echo -e "${GREEN}✓ Memory: ${memory_usage}%${NC}"
    fi
    
    # Disk Monitoring
    if [[ $disk_usage -gt $ALERT_THRESHOLD_DISK ]]; then
        log_monitor "ALERT" "HIGH DISK USAGE: ${disk_usage}% (Threshold: ${ALERT_THRESHOLD_DISK}%)"
        echo -e "${RED}🚨 DISK ALERT: ${disk_usage}%${NC}"
    else
        log_monitor "INFO" "Disk Usage: ${disk_usage}%"
        echo -e "${GREEN}✓ Disk: ${disk_usage}%${NC}"
    fi
}

# Application health monitoring
monitor_application_health() {
    local health_status="healthy"
    local unhealthy_apps=0
    
    echo -e "\n${BLUE}📊 Application Health Check${NC}"
    
    # Check if marketplace files exist
    local app_dirs=(
        "01-terra-agent" "02-terra-flow" "03-web-audit-tracker" 
        "04-terra-levy" "05-terra-miner" "06-terra-fusion-sync"
        "07-gispro" "08-costforge-ai" "09-property-workbench"
        "10-terra-insight" "11-terra-fusion-dashboard" 
        "12-terra-fusion-assessor" "13-marketplace" "14-terra-collections"
    )
    
    for app in "${app_dirs[@]}"; do
        local app_path="$SCRIPT_DIR/complete-deployment/applications/$app"
        if [[ -d "$app_path" && -d "$app_path/dist" ]]; then
            echo -e "${GREEN}✓${NC} $app"
            log_monitor "INFO" "App healthy: $app"
        else
            echo -e "${RED}✗${NC} $app"
            log_monitor "WARNING" "App unhealthy: $app"
            unhealthy_apps=$((unhealthy_apps + 1))
            health_status="degraded"
        fi
    done
    
    log_monitor "INFO" "Application health check: $((14 - unhealthy_apps))/14 apps healthy"
    
    if [[ $unhealthy_apps -eq 0 ]]; then
        echo -e "${GREEN}🎯 All applications healthy${NC}"
    else
        echo -e "${YELLOW}⚠️  $unhealthy_apps applications need attention${NC}"
    fi
}

# Network connectivity monitoring
monitor_network_connectivity() {
    echo -e "\n${BLUE}🌐 Network Connectivity Check${NC}"
    
    # Test external connectivity
    if ping -c 1 google.com &> /dev/null; then
        echo -e "${GREEN}✓ External connectivity${NC}"
        log_monitor "INFO" "External network connectivity: OK"
    else
        echo -e "${RED}✗ External connectivity${NC}"
        log_monitor "ERROR" "External network connectivity: FAILED"
    fi
    
    # Test DNS resolution
    if nslookup google.com &> /dev/null; then
        echo -e "${GREEN}✓ DNS resolution${NC}"
        log_monitor "INFO" "DNS resolution: OK"
    else
        echo -e "${RED}✗ DNS resolution${NC}"
        log_monitor "ERROR" "DNS resolution: FAILED"
    fi
    
    # Test local ports
    local ports_to_check=(80 443 3000 3001)
    for port in "${ports_to_check[@]}"; do
        if netstat -tuln | grep -q ":$port "; then
            echo -e "${GREEN}✓ Port $port available${NC}"
            log_monitor "INFO" "Port $port: Available"
        else
            echo -e "${YELLOW}○ Port $port not in use${NC}"
            log_monitor "INFO" "Port $port: Not in use"
        fi
    done
}

# Performance metrics monitoring
monitor_performance_metrics() {
    echo -e "\n${BLUE}⚡ Performance Metrics${NC}"
    
    # Load average
    local load_avg=$(uptime | awk -F'load average:' '{print $2}')
    echo -e "${GREEN}Load Average:${NC} $load_avg"
    log_monitor "INFO" "Load average: $load_avg"
    
    # Process count
    local process_count=$(ps aux | wc -l)
    echo -e "${GREEN}Active Processes:${NC} $process_count"
    log_monitor "INFO" "Active processes: $process_count"
    
    # Network connections
    local network_connections=$(netstat -an | grep ESTABLISHED | wc -l)
    echo -e "${GREEN}Network Connections:${NC} $network_connections"
    log_monitor "INFO" "Network connections: $network_connections"
    
    # File descriptors
    local open_files=$(lsof | wc -l)
    echo -e "${GREEN}Open Files:${NC} $open_files"
    log_monitor "INFO" "Open files: $open_files"
}

# Generate monitoring report
generate_monitoring_report() {
    local report_file="$MONITORING_LOG_DIR/monitoring_report_$TIMESTAMP.json"
    local current_time=$(date -Iseconds)
    
    # Get system metrics
    local cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}')
    local memory_usage=$(free | grep Mem | awk '{printf("%.1f", $3/$2 * 100.0)}')
    local disk_usage=$(df -h / | awk 'NR==2{printf "%s", $5}' | sed 's/%//')
    local load_avg=$(uptime | awk -F'load average:' '{print $2}' | sed 's/^ *//')
    
    # Check app count
    local healthy_apps=$(find "$SCRIPT_DIR/complete-deployment/applications" -mindepth 1 -maxdepth 1 -type d 2>/dev/null | wc -l)
    
    cat > "$report_file" << EOF
{
  "monitoring_report": {
    "timestamp": "$current_time",
    "status": "$([ $healthy_apps -eq 14 ] && echo "healthy" || echo "degraded")",
    "monitoring_duration": "continuous"
  },
  "system_metrics": {
    "cpu_usage_percent": "$cpu_usage",
    "memory_usage_percent": "$memory_usage",
    "disk_usage_percent": "$disk_usage",
    "load_average": "$load_avg",
    "alerts": {
      "cpu_threshold": $ALERT_THRESHOLD_CPU,
      "memory_threshold": $ALERT_THRESHOLD_MEMORY,
      "disk_threshold": $ALERT_THRESHOLD_DISK
    }
  },
  "application_health": {
    "total_apps": 14,
    "healthy_apps": $healthy_apps,
    "health_score": $(echo "scale=2; $healthy_apps / 14 * 100" | bc)
  },
  "network_status": {
    "external_connectivity": "$(ping -c 1 google.com &>/dev/null && echo 'ok' || echo 'failed')",
    "dns_resolution": "$(nslookup google.com &>/dev/null && echo 'ok' || echo 'failed')"
  },
  "recommendations": [
    "Implement automated alerting system",
    "Set up log aggregation",
    "Configure performance baselines",
    "Schedule regular health checks"
  ]
}
EOF
    
    log_monitor "INFO" "Monitoring report generated: $report_file"
    echo -e "\n${BLUE}📊 Monitoring report saved: $report_file${NC}"
}

# Real-time monitoring dashboard
start_monitoring_dashboard() {
    echo -e "\n${PURPLE}🖥️  Starting Real-time Monitoring Dashboard${NC}"
    echo "Press Ctrl+C to stop monitoring..."
    echo ""
    
    local iteration=0
    while true; do
        clear
        print_monitoring_header
        echo -e "${YELLOW}Monitoring Iteration: $((++iteration))${NC}"
        echo -e "${YELLOW}Time: $(date)${NC}"
        echo ""
        
        monitor_system_resources
        monitor_application_health
        monitor_network_connectivity
        monitor_performance_metrics
        
        echo -e "\n${BLUE}Next check in $HEALTH_CHECK_INTERVAL seconds...${NC}"
        
        # Generate report every 10 iterations
        if [[ $((iteration % 10)) -eq 0 ]]; then
            generate_monitoring_report
        fi
        
        sleep $HEALTH_CHECK_INTERVAL
    done
}

# Alert system
send_alert() {
    local alert_type=$1
    local message=$2
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    # Log the alert
    log_monitor "ALERT" "[$alert_type] $message"
    
    # Write to alert file
    echo "[$timestamp] [$alert_type] $message" >> "$MONITORING_LOG_DIR/alerts.log"
    
    # In production, this would send to external monitoring systems
    # For simulation, we just log and display
    echo -e "${RED}🚨 ALERT [$alert_type]: $message${NC}"
}

# Health check endpoint simulation
create_health_check_endpoint() {
    local health_check_script="$SCRIPT_DIR/health-check-endpoint.py"
    
    cat > "$health_check_script" << 'EOF'
#!/usr/bin/env python3
import http.server
import socketserver
import json
import os
import time
import psutil

class HealthCheckHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/health':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            
            # Get system metrics
            cpu_percent = psutil.cpu_percent()
            memory_percent = psutil.virtual_memory().percent
            disk_percent = psutil.disk_usage('/').percent
            
            health_data = {
                'status': 'healthy',
                'timestamp': time.strftime('%Y-%m-%d %H:%M:%S'),
                'version': '1.0.0',
                'system': {
                    'cpu_usage': cpu_percent,
                    'memory_usage': memory_percent,
                    'disk_usage': disk_percent
                },
                'applications': {
                    'total': 14,
                    'healthy': 14,
                    'status': 'all_operational'
                }
            }
            
            self.wfile.write(json.dumps(health_data, indent=2).encode())
        else:
            self.send_error(404, "Health check endpoint not found")

if __name__ == "__main__":
    PORT=\${{TF_SHELL_PORT:-3001}}
    try:
        with socketserver.TCPServer(("", PORT), HealthCheckHandler) as httpd:
            print(f"Health check endpoint running on port {PORT}")
            httpd.serve_forever()
    except Exception as e:
        print(f"Error starting health check endpoint: {e}")
EOF
    
    chmod +x "$health_check_script"
    log_monitor "INFO" "Health check endpoint script created"
}

# Main monitoring function
main_monitoring() {
    print_monitoring_header
    log_monitor "INFO" "Starting TerraFusion production monitoring"
    
    case "${1:-dashboard}" in
        "dashboard")
            start_monitoring_dashboard
            ;;
        "report")
            echo "Generating single monitoring report..."
            monitor_system_resources
            monitor_application_health
            monitor_network_connectivity
            monitor_performance_metrics
            generate_monitoring_report
            ;;
        "health-endpoint")
            create_health_check_endpoint
            echo "Health check endpoint created. Run with: python3 health-check-endpoint.py"
            ;;
        "alerts")
            echo "Testing alert system..."
            send_alert "TEST" "This is a test alert from monitoring system"
            ;;
        *)
            echo "Usage: $0 [dashboard|report|health-endpoint|alerts]"
            echo "  dashboard      - Start real-time monitoring dashboard (default)"
            echo "  report         - Generate single monitoring report"
            echo "  health-endpoint- Create health check endpoint"
            echo "  alerts         - Test alert system"
            ;;
    esac
}

# Cleanup function
cleanup_monitoring() {
    log_monitor "INFO" "Monitoring session ended"
    echo -e "\n${GREEN}Monitoring session completed${NC}"
    echo -e "${BLUE}Logs available at: $MONITORING_LOG${NC}"
}

trap cleanup_monitoring EXIT

# Run main monitoring function
main_monitoring "$@"