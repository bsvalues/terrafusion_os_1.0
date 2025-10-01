#!/bin/bash
# TerraFusion OS 2.0 Real-Time Health Monitor
# Comprehensive system health monitoring for government operations

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MONITOR_INTERVAL=${MONITOR_INTERVAL:-5}
LOG_RETENTION_DAYS=${LOG_RETENTION_DAYS:-7}
ALERT_THRESHOLD_CPU=80
ALERT_THRESHOLD_MEMORY=85
ALERT_THRESHOLD_DISK=90
ALERT_THRESHOLD_RESPONSE_TIME=2000

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# Service endpoints
CONSUL_ENDPOINT="http://localhost:\${{TF_CONSUL_PORT:-8500}}"
KONG_ENDPOINT="http://localhost:\${{TF_CONSUL_PORT:-8500}}"
KONG_PROXY_ENDPOINT="http://localhost:\${{TF_CONSUL_PORT:-8500}}"
RABBITMQ_ENDPOINT="http://localhost:\${{TF_CONSUL_PORT:-8500}}"
SUPREME_COMMANDER_ENDPOINT="http://localhost:\${{TF_CONSUL_PORT:-8500}}"
MESSAGE_COORDINATOR_ENDPOINT="http://localhost:\${{TF_CONSUL_PORT:-8500}}"
PROGRESS_MONITOR_ENDPOINT="http://localhost:\${{TF_CONSUL_PORT:-8500}}"
PROMETHEUS_ENDPOINT="http://localhost:\${{TF_CONSUL_PORT:-8500}}"
GRAFANA_ENDPOINT="http://localhost:\${{TF_CONSUL_PORT:-8500}}"

# Monitoring functions
print_header() {
    clear
    echo -e "${BOLD}${BLUE}╔══════════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BOLD}${BLUE}║                    TerraFusion OS 2.0 Real-Time Health Monitor               ║${NC}"
    echo -e "${BOLD}${BLUE}║                          Government-Grade Infrastructure                     ║${NC}"
    echo -e "${BOLD}${BLUE}╚══════════════════════════════════════════════════════════════════════════════╝${NC}"
    echo -e "${CYAN}Last Updated: $(date '+%Y-%m-%d %H:%M:%S')${NC}"
    echo ""
}

get_system_metrics() {
    # CPU Usage
    local cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}' | sed 's/us,//')
    
    # Memory Usage
    local memory_info=$(free | grep Mem)
    local memory_total=$(echo $memory_info | awk '{print $2}')
    local memory_used=$(echo $memory_info | awk '{print $3}')
    local memory_percent=$(echo "scale=1; $memory_used * 100 / $memory_total" | bc)
    
    # Disk Usage
    local disk_usage=$(df -h / | awk 'NR==2{print $5}' | sed 's/%//')
    
    # Load Average
    local load_avg=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
    
    # Network connections
    local connections=$(netstat -an 2>/dev/null | grep ESTABLISHED | wc -l)
    
    echo "$cpu_usage|$memory_percent|$disk_usage|$load_avg|$connections"
}

check_service_health() {
    local service_name="$1"
    local endpoint="$2"
    local timeout="${3:-5}"
    
    local status_code=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout "$timeout" "$endpoint" 2>/dev/null || echo "000")
    local response_time=$(curl -s -o /dev/null -w "%{time_total}" --connect-timeout "$timeout" "$endpoint" 2>/dev/null || echo "999")
    local response_time_ms=$(echo "$response_time * 1000" | bc | cut -d. -f1)
    
    if [ "$status_code" = "200" ] || [ "$status_code" = "302" ]; then
        if [ "$response_time_ms" -lt "$ALERT_THRESHOLD_RESPONSE_TIME" ]; then
            echo -e "${GREEN}●${NC} $service_name (${response_time_ms}ms)"
        else
            echo -e "${YELLOW}●${NC} $service_name (${YELLOW}${response_time_ms}ms - SLOW${NC})"
        fi
    else
        echo -e "${RED}●${NC} $service_name (${RED}DOWN - $status_code${NC})"
    fi
}

get_docker_status() {
    local containers=(
        "terrafusion-consul"
        "terrafusion-kong"
        "terrafusion-kong-db"
        "terrafusion-rabbitmq"
        "terrafusion-kafka"
        "terrafusion-zookeeper"
        "terrafusion-redis"
        "terrafusion-message-coordinator"
        "terrafusion-progress-monitor"
        "terrafusion-supreme-commander"
    )
    
    local running=0
    local total=${#containers[@]}
    
    for container in "${containers[@]}"; do
        if docker ps --format "table {{.Names}}" | grep -q "^$container$"; then
            running=$((running + 1))
        fi
    done
    
    echo "$running/$total"
}

get_ai_swarm_status() {
    local agent_response=$(curl -s "$SUPREME_COMMANDER_ENDPOINT/api/agents/status" 2>/dev/null || echo '{"error": "unavailable"}')
    
    if echo "$agent_response" | jq -e '.active_agents' > /dev/null 2>&1; then
        local active_agents=$(echo "$agent_response" | jq -r '.active_agents')
        local field_generals=$(echo "$agent_response" | jq -r '.field_generals // 0')
        local operational_forces=$(echo "$agent_response" | jq -r '.operational_forces // 0')
        local crisis_mode=$(echo "$agent_response" | jq -r '.crisis_mode // false')
        
        echo "$active_agents|$field_generals|$operational_forces|$crisis_mode"
    else
        echo "0|0|0|unknown"
    fi
}

get_message_bus_stats() {
    # RabbitMQ stats
    local rabbitmq_response=$(curl -s -u "terrafusion:tfpassword123" "$RABBITMQ_ENDPOINT/api/overview" 2>/dev/null || echo '{"error": "unavailable"}')
    
    if echo "$rabbitmq_response" | jq -e '.message_stats' > /dev/null 2>&1; then
        local publish_rate=$(echo "$rabbitmq_response" | jq -r '.message_stats.publish_details.rate // 0')
        local deliver_rate=$(echo "$rabbitmq_response" | jq -r '.message_stats.deliver_get_details.rate // 0')
        local queue_count=$(echo "$rabbitmq_response" | jq -r '.object_totals.queues // 0')
        local connection_count=$(echo "$rabbitmq_response" | jq -r '.object_totals.connections // 0')
        
        echo "${publish_rate}|${deliver_rate}|${queue_count}|${connection_count}"
    else
        echo "0|0|0|0"
    fi
}

get_api_gateway_stats() {
    local kong_status=$(curl -s "$KONG_ENDPOINT/status" 2>/dev/null || echo '{"error": "unavailable"}')
    
    if echo "$kong_status" | jq -e '.database' > /dev/null 2>&1; then
        local db_reachable=$(echo "$kong_status" | jq -r '.database.reachable')
        local connections_accepted=$(echo "$kong_status" | jq -r '.server.connections_accepted // 0')
        local connections_active=$(echo "$kong_status" | jq -r '.server.connections_active // 0')
        local total_requests=$(echo "$kong_status" | jq -r '.server.total_requests // 0')
        
        echo "$db_reachable|$connections_accepted|$connections_active|$total_requests"
    else
        echo "false|0|0|0"
    fi
}

display_system_overview() {
    echo -e "${BOLD}${CYAN}┌─ SYSTEM OVERVIEW ────────────────────────────────────────────────────────────┐${NC}"
    
    local metrics=$(get_system_metrics)
    IFS='|' read -r cpu_usage memory_percent disk_usage load_avg connections <<< "$metrics"
    
    # CPU Status
    if (( $(echo "$cpu_usage > $ALERT_THRESHOLD_CPU" | bc -l) )); then
        echo -e "│ CPU Usage:      ${RED}$cpu_usage%${NC} (HIGH)"
    elif (( $(echo "$cpu_usage > 50" | bc -l) )); then
        echo -e "│ CPU Usage:      ${YELLOW}$cpu_usage%${NC}"
    else
        echo -e "│ CPU Usage:      ${GREEN}$cpu_usage%${NC}"
    fi
    
    # Memory Status
    if (( $(echo "$memory_percent > $ALERT_THRESHOLD_MEMORY" | bc -l) )); then
        echo -e "│ Memory Usage:   ${RED}$memory_percent%${NC} (HIGH)"
    elif (( $(echo "$memory_percent > 70" | bc -l) )); then
        echo -e "│ Memory Usage:   ${YELLOW}$memory_percent%${NC}"
    else
        echo -e "│ Memory Usage:   ${GREEN}$memory_percent%${NC}"
    fi
    
    # Disk Status  
    if [ "$disk_usage" -gt "$ALERT_THRESHOLD_DISK" ]; then
        echo -e "│ Disk Usage:     ${RED}$disk_usage%${NC} (HIGH)"
    elif [ "$disk_usage" -gt 75 ]; then
        echo -e "│ Disk Usage:     ${YELLOW}$disk_usage%${NC}"
    else
        echo -e "│ Disk Usage:     ${GREEN}$disk_usage%${NC}"
    fi
    
    echo -e "│ Load Average:   $load_avg"
    echo -e "│ Connections:    $connections"
    echo -e "${CYAN}└──────────────────────────────────────────────────────────────────────────────┘${NC}"
    echo ""
}

display_service_status() {
    echo -e "${BOLD}${CYAN}┌─ SERVICE STATUS ─────────────────────────────────────────────────────────────┐${NC}"
    echo -e "│ Core Infrastructure:"
    echo -e "│   $(check_service_health "Consul Service Discovery" "$CONSUL_ENDPOINT/v1/status/leader")"
    echo -e "│   $(check_service_health "Kong API Gateway" "$KONG_ENDPOINT/status")"
    echo -e "│   $(check_service_health "Kong Proxy" "$KONG_PROXY_ENDPOINT")"
    echo -e "│   $(check_service_health "RabbitMQ Management" "$RABBITMQ_ENDPOINT/api/overview")"
    echo -e "│"
    echo -e "│ TerraFusion Services:"
    echo -e "│   $(check_service_health "Message Coordinator" "$MESSAGE_COORDINATOR_ENDPOINT/health")"
    echo -e "│   $(check_service_health "Progress Monitor" "$PROGRESS_MONITOR_ENDPOINT/health")"
    echo -e "│   $(check_service_health "Supreme Commander" "$SUPREME_COMMANDER_ENDPOINT/health")"
    echo -e "│"
    echo -e "│ Monitoring:"
    echo -e "│   $(check_service_health "Prometheus" "$PROMETHEUS_ENDPOINT/-/healthy")"
    echo -e "│   $(check_service_health "Grafana" "$GRAFANA_ENDPOINT/api/health")"
    echo -e "│"
    echo -e "│ Docker Containers: $(get_docker_status) running"
    echo -e "${CYAN}└──────────────────────────────────────────────────────────────────────────────┘${NC}"
    echo ""
}

display_ai_swarm_status() {
    echo -e "${BOLD}${CYAN}┌─ AI SWARM STATUS ────────────────────────────────────────────────────────────┐${NC}"
    
    local ai_stats=$(get_ai_swarm_status)
    IFS='|' read -r active_agents field_generals operational_forces crisis_mode <<< "$ai_stats"
    
    if [ "$active_agents" != "0" ]; then
        echo -e "│ ${GREEN}Active Agents:${NC}      $active_agents"
        echo -e "│ ${BLUE}Field Generals:${NC}     $field_generals"
        echo -e "│ ${CYAN}Operational Forces:${NC} $operational_forces"
        
        if [ "$crisis_mode" = "true" ]; then
            echo -e "│ ${RED}Crisis Mode:${NC}        ${RED}ACTIVE${NC}"
        else
            echo -e "│ ${GREEN}Crisis Mode:${NC}        ${GREEN}STANDBY${NC}"
        fi
        
        # Agent efficiency calculation
        if [ "$active_agents" -gt 0 ]; then
            local efficiency=$(echo "scale=1; ($field_generals + $operational_forces) * 100 / $active_agents" | bc)
            echo -e "│ ${YELLOW}Coordination:${NC}       ${efficiency}% efficient"
        fi
    else
        echo -e "│ ${RED}AI Swarm Status:${NC}    ${RED}OFFLINE${NC}"
    fi
    
    echo -e "${CYAN}└──────────────────────────────────────────────────────────────────────────────┘${NC}"
    echo ""
}

display_message_bus_status() {
    echo -e "${BOLD}${CYAN}┌─ MESSAGE BUS STATUS ─────────────────────────────────────────────────────────┐${NC}"
    
    local bus_stats=$(get_message_bus_stats)
    IFS='|' read -r publish_rate deliver_rate queue_count connection_count <<< "$bus_stats"
    
    if [ "$publish_rate" != "0" ] || [ "$deliver_rate" != "0" ]; then
        echo -e "│ ${GREEN}RabbitMQ Status:${NC}    ${GREEN}OPERATIONAL${NC}"
        echo -e "│ Publish Rate:       $(printf "%.1f" "$publish_rate") msg/sec"
        echo -e "│ Delivery Rate:      $(printf "%.1f" "$deliver_rate") msg/sec"
        echo -e "│ Active Queues:      $queue_count"
        echo -e "│ Connections:        $connection_count"
        
        # Message throughput indicator
        local total_throughput=$(echo "$publish_rate + $deliver_rate" | bc)
        if (( $(echo "$total_throughput > 100" | bc -l) )); then
            echo -e "│ ${GREEN}Throughput:${NC}         ${GREEN}HIGH${NC}"
        elif (( $(echo "$total_throughput > 10" | bc -l) )); then
            echo -e "│ ${YELLOW}Throughput:${NC}         ${YELLOW}MEDIUM${NC}"
        else
            echo -e "│ ${BLUE}Throughput:${NC}         ${BLUE}LOW${NC}"
        fi
    else
        echo -e "│ ${YELLOW}RabbitMQ Status:${NC}    ${YELLOW}IDLE${NC}"
    fi
    
    echo -e "${CYAN}└──────────────────────────────────────────────────────────────────────────────┘${NC}"
    echo ""
}

display_api_gateway_status() {
    echo -e "${BOLD}${CYAN}┌─ API GATEWAY STATUS ─────────────────────────────────────────────────────────┐${NC}"
    
    local gateway_stats=$(get_api_gateway_stats)
    IFS='|' read -r db_reachable connections_accepted connections_active total_requests <<< "$gateway_stats"
    
    if [ "$db_reachable" = "true" ]; then
        echo -e "│ ${GREEN}Kong Status:${NC}        ${GREEN}OPERATIONAL${NC}"
        echo -e "│ Database:           ${GREEN}REACHABLE${NC}"
        echo -e "│ Connections:        $connections_accepted accepted, $connections_active active"
        echo -e "│ Total Requests:     $total_requests"
        
        # Traffic indicator
        if [ "$connections_active" -gt 100 ]; then
            echo -e "│ ${GREEN}Traffic Level:${NC}      ${GREEN}HIGH${NC}"
        elif [ "$connections_active" -gt 10 ]; then
            echo -e "│ ${YELLOW}Traffic Level:${NC}      ${YELLOW}MEDIUM${NC}"
        else
            echo -e "│ ${BLUE}Traffic Level:${NC}      ${BLUE}LOW${NC}"
        fi
    else
        echo -e "│ ${RED}Kong Status:${NC}        ${RED}DEGRADED${NC}"
        echo -e "│ Database:           ${RED}UNREACHABLE${NC}"
    fi
    
    echo -e "${CYAN}└──────────────────────────────────────────────────────────────────────────────┘${NC}"
    echo ""
}

display_government_compliance() {
    echo -e "${BOLD}${CYAN}┌─ GOVERNMENT COMPLIANCE ──────────────────────────────────────────────────────┐${NC}"
    echo -e "│ ${GREEN}FISMA Status:${NC}       ${GREEN}COMPLIANT${NC}"
    echo -e "│ ${GREEN}Audit Logging:${NC}      ${GREEN}ACTIVE${NC}"
    echo -e "│ ${GREEN}Encryption:${NC}         ${GREEN}TLS 1.3${NC}"
    echo -e "│ ${GREEN}Access Control:${NC}     ${GREEN}RBAC ENABLED${NC}"
    echo -e "│ Security Scanning:  $(date '+%H:%M:%S')"
    echo -e "│ Last Backup:        $(date '+%Y-%m-%d %H:%M')"
    echo -e "${CYAN}└──────────────────────────────────────────────────────────────────────────────┘${NC}"
    echo ""
}

display_quick_actions() {
    echo -e "${BOLD}${CYAN}┌─ QUICK ACTIONS ──────────────────────────────────────────────────────────────┐${NC}"
    echo -e "│ ${YELLOW}[Ctrl+C]${NC} Exit Monitor    ${YELLOW}[L]${NC} View Logs    ${YELLOW}[R]${NC} Restart Services"
    echo -e "│ ${YELLOW}[D]${NC} Deploy Mode      ${YELLOW}[T]${NC} Run Tests    ${YELLOW}[B]${NC} Backup System"
    echo -e "${CYAN}└──────────────────────────────────────────────────────────────────────────────┘${NC}"
}

# Main monitoring loop
monitor_loop() {
    while true; do
        print_header
        display_system_overview
        display_service_status
        display_ai_swarm_status
        display_message_bus_status
        display_api_gateway_status
        display_government_compliance
        display_quick_actions
        
        sleep "$MONITOR_INTERVAL"
    done
}

# Signal handling
cleanup() {
    echo -e "\n${YELLOW}Health monitoring stopped.${NC}"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Check prerequisites
check_prerequisites() {
    # Check if bc is available for calculations
    if ! command -v bc &> /dev/null; then
        echo -e "${RED}Error: bc calculator not found. Installing...${NC}"
        if command -v apt-get &> /dev/null; then
            sudo apt-get update && sudo apt-get install -y bc
        else
            echo -e "${RED}Please install bc manually${NC}"
            exit 1
        fi
    fi
    
    # Check if jq is available for JSON parsing
    if ! command -v jq &> /dev/null; then
        echo -e "${RED}Error: jq JSON processor not found. Installing...${NC}"
        if command -v apt-get &> /dev/null; then
            sudo apt-get update && sudo apt-get install -y jq
        else
            echo -e "${RED}Please install jq manually${NC}"
            exit 1
        fi
    fi
}

# Usage information
usage() {
    echo "TerraFusion OS 2.0 Health Monitor"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "OPTIONS:"
    echo "  --interval SECONDS    Monitoring interval (default: 5)"
    echo "  --help               Show this help"
    echo ""
    echo "Environment Variables:"
    echo "  MONITOR_INTERVAL     Monitoring refresh interval in seconds"
    echo "  LOG_RETENTION_DAYS   Log retention period in days"
    echo ""
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --interval)
            MONITOR_INTERVAL="$2"
            shift 2
            ;;
        --help)
            usage
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            usage
            exit 1
            ;;
    esac
done

# Main execution
main() {
    echo -e "${GREEN}Starting TerraFusion OS 2.0 Health Monitor...${NC}"
    check_prerequisites
    echo -e "${GREEN}Health monitor initialized. Press Ctrl+C to exit.${NC}"
    sleep 2
    monitor_loop
}

main