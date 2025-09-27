#!/bin/bash
#
# TerraFusion Health Check Script
# Comprehensive health checking for all services
#
# Usage: ./health-check.sh [options]
# Options:
#   -v    Verbose output
#   -j    JSON output
#   -w    Watch mode (continuous monitoring)
#   -t    Timeout in seconds (default: 5)

set -euo pipefail

# Configuration
TIMEOUT=${TIMEOUT:-5}
VERBOSE=false
JSON_OUTPUT=false
WATCH_MODE=false
WATCH_INTERVAL=10

# Service endpoints
declare -A SERVICES=(
    ["backend"]="http://localhost:\${{TF_ADMIN_PORT:-8080}}/health"
    ["ai-engine"]="http://localhost:\${{TF_ADMIN_PORT:-8080}}/health"
    ["frontend"]="http://localhost:\${{TF_ADMIN_PORT:-8080}}/health"
    ["prometheus"]="http://localhost:\${{TF_ADMIN_PORT:-8080}}/-/healthy"
    ["grafana"]="http://localhost:\${{TF_ADMIN_PORT:-8080}}/api/health"
)

# Database connection
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="terrafusion_production"
DB_USER="terrafusion_user"

# Redis connection
REDIS_HOST="localhost"
REDIS_PORT="6379"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Parse arguments
while getopts "vjwt:" opt; do
    case $opt in
        v) VERBOSE=true ;;
        j) JSON_OUTPUT=true ;;
        w) WATCH_MODE=true ;;
        t) TIMEOUT="$OPTARG" ;;
        *) echo "Usage: $0 [-v] [-j] [-w] [-t timeout]"; exit 1 ;;
    esac
done

# Output functions
print_status() {
    local service=$1
    local status=$2
    local message=$3
    local response_time=${4:-0}
    
    if [ "$JSON_OUTPUT" = true ]; then
        return
    fi
    
    local icon="✓"
    local color=$GREEN
    
    if [ "$status" = "unhealthy" ]; then
        icon="✗"
        color=$RED
    elif [ "$status" = "degraded" ]; then
        icon="⚠"
        color=$YELLOW
    fi
    
    printf "${color}${icon}${NC} %-15s %-10s %s\n" "$service" "$status" "$message"
    
    if [ "$VERBOSE" = true ] && [ "$response_time" -gt 0 ]; then
        printf "  Response time: ${response_time}ms\n"
    fi
}

# JSON output accumulator
declare -A health_results

# Check HTTP endpoint health
check_http_health() {
    local service=$1
    local url=$2
    local start_time=$(date +%s%N)
    
    if [ "$VERBOSE" = true ]; then
        echo "Checking $service at $url..."
    fi
    
    local response
    local http_code
    local response_time
    
    # Make request and capture response
    if response=$(curl -sf -w "\n%{http_code}" --max-time "$TIMEOUT" "$url" 2>&1); then
        http_code=$(echo "$response" | tail -n1)
        local end_time=$(date +%s%N)
        response_time=$(( (end_time - start_time) / 1000000 ))
        
        if [ "$http_code" = "200" ]; then
            print_status "$service" "healthy" "HTTP $http_code" "$response_time"
            health_results["$service"]='{"status":"healthy","code":'$http_code',"response_time":'$response_time'}'
            return 0
        else
            print_status "$service" "unhealthy" "HTTP $http_code" "$response_time"
            health_results["$service"]='{"status":"unhealthy","code":'$http_code',"response_time":'$response_time'}'
            return 1
        fi
    else
        print_status "$service" "unhealthy" "Connection failed"
        health_results["$service"]='{"status":"unhealthy","error":"connection_failed"}'
        return 1
    fi
}

# Check database health
check_database_health() {
    local start_time=$(date +%s%N)
    
    if [ "$VERBOSE" = true ]; then
        echo "Checking database connection..."
    fi
    
    if PGPASSWORD="${PGPASSWORD:-}" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1" &>/dev/null; then
        local end_time=$(date +%s%N)
        local response_time=$(( (end_time - start_time) / 1000000 ))
        
        # Check connection count
        local conn_count=$(PGPASSWORD="${PGPASSWORD:-}" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT count(*) FROM pg_stat_activity" 2>/dev/null | xargs)
        local max_conn=$(PGPASSWORD="${PGPASSWORD:-}" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT setting FROM pg_settings WHERE name = 'max_connections'" 2>/dev/null | xargs)
        
        local status="healthy"
        local message="Connections: $conn_count/$max_conn"
        
        # Check if connection pool is nearly exhausted
        if [ -n "$conn_count" ] && [ -n "$max_conn" ]; then
            local conn_percentage=$(( conn_count * 100 / max_conn ))
            if [ $conn_percentage -gt 80 ]; then
                status="degraded"
                message="High connection usage: $conn_count/$max_conn"
            fi
        fi
        
        print_status "database" "$status" "$message" "$response_time"
        health_results["database"]='{"status":"'$status'","connections":'$conn_count',"max_connections":'$max_conn',"response_time":'$response_time'}'
        return 0
    else
        print_status "database" "unhealthy" "Connection failed"
        health_results["database"]='{"status":"unhealthy","error":"connection_failed"}'
        return 1
    fi
}

# Check Redis health
check_redis_health() {
    local start_time=$(date +%s%N)
    
    if [ "$VERBOSE" = true ]; then
        echo "Checking Redis connection..."
    fi
    
    if redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" ping &>/dev/null; then
        local end_time=$(date +%s%N)
        local response_time=$(( (end_time - start_time) / 1000000 ))
        
        # Get Redis info
        local used_memory=$(redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" INFO memory | grep "used_memory_human" | cut -d: -f2 | tr -d '\r')
        local connected_clients=$(redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" INFO clients | grep "connected_clients" | cut -d: -f2 | tr -d '\r')
        
        print_status "redis" "healthy" "Memory: $used_memory, Clients: $connected_clients" "$response_time"
        health_results["redis"]='{"status":"healthy","memory":"'$used_memory'","clients":'$connected_clients',"response_time":'$response_time'}'
        return 0
    else
        print_status "redis" "unhealthy" "Connection failed"
        health_results["redis"]='{"status":"unhealthy","error":"connection_failed"}'
        return 1
    fi
}

# Check disk space
check_disk_space() {
    if [ "$VERBOSE" = true ]; then
        echo "Checking disk space..."
    fi
    
    local disk_usage=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
    local disk_available=$(df -h / | awk 'NR==2 {print $4}')
    
    local status="healthy"
    local message="Usage: ${disk_usage}%, Available: $disk_available"
    
    if [ "$disk_usage" -gt 90 ]; then
        status="unhealthy"
    elif [ "$disk_usage" -gt 80 ]; then
        status="degraded"
    fi
    
    print_status "disk" "$status" "$message"
    health_results["disk"]='{"status":"'$status'","usage":'$disk_usage',"available":"'$disk_available'"}'
}

# Check memory usage
check_memory() {
    if [ "$VERBOSE" = true ]; then
        echo "Checking memory usage..."
    fi
    
    local mem_total=$(free -m | awk 'NR==2{print $2}')
    local mem_used=$(free -m | awk 'NR==2{print $3}')
    local mem_usage=$(( mem_used * 100 / mem_total ))
    
    local status="healthy"
    local message="Usage: ${mem_usage}% (${mem_used}MB/${mem_total}MB)"
    
    if [ "$mem_usage" -gt 90 ]; then
        status="unhealthy"
    elif [ "$mem_usage" -gt 80 ]; then
        status="degraded"
    fi
    
    print_status "memory" "$status" "$message"
    health_results["memory"]='{"status":"'$status'","usage":'$mem_usage',"used":'$mem_used',"total":'$mem_total'}'
}

# Check system load
check_system_load() {
    if [ "$VERBOSE" = true ]; then
        echo "Checking system load..."
    fi
    
    local cpu_count=$(nproc)
    local load_1min=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
    local load_ratio=$(echo "scale=2; $load_1min / $cpu_count" | bc)
    
    local status="healthy"
    local message="Load: $load_1min (${cpu_count} CPUs)"
    
    if (( $(echo "$load_ratio > 2" | bc -l) )); then
        status="unhealthy"
    elif (( $(echo "$load_ratio > 1" | bc -l) )); then
        status="degraded"
    fi
    
    print_status "cpu_load" "$status" "$message"
    health_results["cpu_load"]='{"status":"'$status'","load":'$load_1min',"cpu_count":'$cpu_count'}'
}

# Output JSON results
output_json() {
    echo "{"
    echo '  "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'",'
    echo '  "overall_status": "'$1'",'
    echo '  "services": {'
    
    local first=true
    for service in "${!health_results[@]}"; do
        if [ "$first" = true ]; then
            first=false
        else
            echo ","
        fi
        echo -n '    "'$service'": '${health_results[$service]}
    done
    
    echo ""
    echo "  }"
    echo "}"
}

# Main health check function
run_health_checks() {
    local overall_status="healthy"
    local failed_services=0
    
    if [ "$JSON_OUTPUT" = false ]; then
        echo "=================================="
        echo "TerraFusion Health Check"
        echo "Time: $(date)"
        echo "=================================="
    fi
    
    # Check all HTTP services
    for service in "${!SERVICES[@]}"; do
        if ! check_http_health "$service" "${SERVICES[$service]}"; then
            ((failed_services++))
            overall_status="unhealthy"
        fi
    done
    
    # Check database
    if ! check_database_health; then
        ((failed_services++))
        overall_status="unhealthy"
    fi
    
    # Check Redis
    if ! check_redis_health; then
        ((failed_services++))
        overall_status="unhealthy"
    fi
    
    # Check system resources
    check_disk_space
    check_memory
    check_system_load
    
    if [ "$JSON_OUTPUT" = true ]; then
        output_json "$overall_status"
    else
        echo "=================================="
        if [ $failed_services -eq 0 ]; then
            echo -e "${GREEN}Overall Status: HEALTHY${NC}"
        else
            echo -e "${RED}Overall Status: UNHEALTHY${NC}"
            echo -e "${RED}Failed services: $failed_services${NC}"
        fi
        echo "=================================="
    fi
    
    # Return exit code based on health
    if [ $failed_services -eq 0 ]; then
        return 0
    else
        return 1
    fi
}

# Watch mode
if [ "$WATCH_MODE" = true ]; then
    if [ "$JSON_OUTPUT" = true ]; then
        echo "Error: Watch mode not supported with JSON output" >&2
        exit 1
    fi
    
    while true; do
        clear
        run_health_checks || true
        echo ""
        echo "Refreshing every ${WATCH_INTERVAL}s (Ctrl+C to exit)..."
        sleep $WATCH_INTERVAL
    done
else
    run_health_checks
fi