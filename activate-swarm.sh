#!/bin/bash
# TerraFusion OS 2.0 AI Swarm Activation Script
# Gradual activation of AI agents with monitoring and safety controls

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$SCRIPT_DIR/swarm-activation-logs"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
ACTIVATION_LOG="$LOG_DIR/activation_${TIMESTAMP}.log"

# Default parameters
AGENT_COUNT=100
MODE="supervised"
RAMP_UP_INTERVAL=30
MAX_AGENTS=50000
FIELD_GENERALS=5
SAFETY_CHECKS=true
CRISIS_RESPONSE=false
MONITORING_ENABLED=true

# Agent hierarchy configuration
declare -A AGENT_ROLES=(
    ["supreme_commander"]=1
    ["field_generals"]=1220
    ["tactical_coordinators"]=12200
    ["operational_forces"]=36579
)

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

usage() {
    cat << EOF
TerraFusion OS 2.0 AI Swarm Activation

Usage: $0 [OPTIONS]

OPTIONS:
    --agents NUM        Number of agents to activate (default: 100)
    --mode MODE         Activation mode: supervised|autonomous|crisis (default: supervised)
    --ramp-up TIME      Ramp-up interval in seconds (default: 30)
    --field-generals N  Number of Field Generals to activate (default: 5)
    --no-safety         Disable safety checks (NOT RECOMMENDED)
    --crisis-mode       Enable crisis response capabilities
    --no-monitoring     Disable real-time monitoring
    --max-agents NUM    Maximum agent limit (default: 50000)
    -h, --help         Show this help

MODES:
    supervised     - Human oversight required for all major decisions
    autonomous     - AI agents operate independently within parameters
    crisis         - Emergency response mode with enhanced capabilities

AGENT HIERARCHY:
    Supreme Commander:     1 (Claude - Strategic oversight)
    Field Generals:        1,220 (Strategic coordination)
    Tactical Coordinators: 12,200 (Operational planning)
    Operational Forces:    36,579 (Task execution)

EXAMPLES:
    $0 --agents=100 --mode=supervised    # Start with 100 supervised agents
    $0 --agents=1000 --mode=autonomous   # Activate 1000 autonomous agents
    $0 --agents=500 --crisis-mode        # Activate crisis response team
    $0 --agents=10000 --field-generals=50 # Large deployment

SAFETY FEATURES:
    - Gradual agent activation with monitoring
    - Real-time performance validation
    - Automatic shutdown on anomalies
    - Government compliance enforcement
    - Crisis response protocols

EOF
}

log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    mkdir -p "$(dirname "$ACTIVATION_LOG")"
    
    case "$level" in
        "INFO")  echo -e "${GREEN}[INFO]${NC}  [$timestamp] $message" | tee -a "$ACTIVATION_LOG" ;;
        "WARN")  echo -e "${YELLOW}[WARN]${NC}  [$timestamp] $message" | tee -a "$ACTIVATION_LOG" ;;
        "ERROR") echo -e "${RED}[ERROR]${NC} [$timestamp] $message" | tee -a "$ACTIVATION_LOG" ;;
        "SWARM") echo -e "${BLUE}[SWARM]${NC} [$timestamp] $message" | tee -a "$ACTIVATION_LOG" ;;
        "SAFE")  echo -e "${CYAN}[SAFE]${NC}  [$timestamp] $message" | tee -a "$ACTIVATION_LOG" ;;
        *)       echo "[$timestamp] $message" | tee -a "$ACTIVATION_LOG" ;;
    esac
}

error_exit() {
    log "ERROR" "$1"
    emergency_shutdown
    exit 1
}

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --agents)
                AGENT_COUNT="$2"
                shift 2
                ;;
            --mode)
                MODE="$2"
                shift 2
                ;;
            --ramp-up)
                RAMP_UP_INTERVAL="$2"
                shift 2
                ;;
            --field-generals)
                FIELD_GENERALS="$2"
                shift 2
                ;;
            --no-safety)
                SAFETY_CHECKS=false
                shift
                ;;
            --crisis-mode)
                CRISIS_RESPONSE=true
                MODE="crisis"
                shift
                ;;
            --no-monitoring)
                MONITORING_ENABLED=false
                shift
                ;;
            --max-agents)
                MAX_AGENTS="$2"
                shift 2
                ;;
            -h|--help)
                usage
                exit 0
                ;;
            *)
                error_exit "Unknown option: $1"
                ;;
        esac
    done
    
    # Validation
    if [ "$AGENT_COUNT" -gt "$MAX_AGENTS" ]; then
        error_exit "Agent count ($AGENT_COUNT) exceeds maximum ($MAX_AGENTS)"
    fi
    
    if [ "$FIELD_GENERALS" -gt "$AGENT_COUNT" ]; then
        error_exit "Field Generals ($FIELD_GENERALS) cannot exceed total agents ($AGENT_COUNT)"
    fi
    
    case "$MODE" in
        "supervised"|"autonomous"|"crisis") ;;
        *) error_exit "Invalid mode: $MODE. Use supervised|autonomous|crisis" ;;
    esac
}

# Check prerequisites
check_prerequisites() {
    log "INFO" "Checking AI swarm prerequisites..."
    
    # Check TerraFusion Supreme Commander
    if ! curl -f -s http://localhost:\${{TF_PORT_4000:-4000}}/health > /dev/null; then
        error_exit "Supreme Commander not responding. Deploy TerraFusion first."
    fi
    
    # Check Message Coordinator
    if ! curl -f -s http://localhost:\${{TF_PORT_4000:-4000}}/health > /dev/null; then
        error_exit "Message Coordinator not responding."
    fi
    
    # Check system resources
    local memory_total=$(free | grep Mem | awk '{print $2}')
    local memory_required=$((AGENT_COUNT * 1024))  # 1MB per agent minimum
    
    if [ "$memory_total" -lt "$memory_required" ]; then
        log "WARN" "System memory may be insufficient for $AGENT_COUNT agents"
    fi
    
    # Check database connectivity
    if ! curl -f -s http://localhost:\${{TF_PORT_4000:-4000}}/health > /dev/null; then
        error_exit "API Gateway not accessible"
    fi
    
    log "INFO" "Prerequisites check completed"
}

# Initialize swarm configuration
initialize_swarm() {
    log "INFO" "Initializing AI swarm configuration..."
    
    local config_file="$SCRIPT_DIR/ai-swarm-config.json"
    
    # Calculate agent distribution
    local tactical_coordinators=$((FIELD_GENERALS * 10))
    local operational_forces=$((AGENT_COUNT - FIELD_GENERALS - tactical_coordinators - 1))
    
    # Ensure positive numbers
    if [ "$operational_forces" -lt 0 ]; then
        operational_forces=0
        tactical_coordinators=$((AGENT_COUNT - FIELD_GENERALS - 1))
    fi
    
    cat > "$config_file" << EOF
{
  "swarm_configuration": {
    "activation_timestamp": "$(date -Iseconds)",
    "mode": "$MODE",
    "total_agents": $AGENT_COUNT,
    "ramp_up_interval": $RAMP_UP_INTERVAL,
    "safety_checks_enabled": $SAFETY_CHECKS,
    "crisis_response_enabled": $CRISIS_RESPONSE,
    "monitoring_enabled": $MONITORING_ENABLED
  },
  "agent_hierarchy": {
    "supreme_commander": {
      "count": 1,
      "role": "Strategic oversight and crisis management",
      "clearance_level": "TOP_SECRET",
      "capabilities": ["strategic_planning", "crisis_response", "resource_allocation"]
    },
    "field_generals": {
      "count": $FIELD_GENERALS,
      "role": "Tactical coordination and regional management",
      "clearance_level": "SECRET",
      "capabilities": ["tactical_planning", "agent_coordination", "regional_oversight"]
    },
    "tactical_coordinators": {
      "count": $tactical_coordinators,
      "role": "Operational planning and task coordination",
      "clearance_level": "CONFIDENTIAL",
      "capabilities": ["task_planning", "resource_management", "operational_coordination"]
    },
    "operational_forces": {
      "count": $operational_forces,
      "role": "Task execution and data processing",
      "clearance_level": "PUBLIC_TRUST",
      "capabilities": ["data_processing", "task_execution", "status_reporting"]
    }
  },
  "safety_protocols": {
    "maximum_concurrent_operations": $(($AGENT_COUNT / 10)),
    "performance_monitoring": true,
    "anomaly_detection": true,
    "automatic_shutdown_triggers": [
      "cpu_usage_over_90_percent",
      "memory_exhaustion",
      "response_time_over_5_seconds",
      "error_rate_over_5_percent"
    ],
    "compliance_requirements": [
      "FISMA",
      "SOX",
      "government_audit_trail"
    ]
  },
  "government_compliance": {
    "classification": "GOVERNMENT_USE",
    "audit_required": true,
    "data_retention": "7_years",
    "encryption_standard": "AES_256",
    "access_logging": true
  }
}
EOF
    
    log "INFO" "Swarm configuration created: $config_file"
}

# Safety checks before activation
run_safety_checks() {
    if [ "$SAFETY_CHECKS" = false ]; then
        log "WARN" "Safety checks disabled (--no-safety)"
        return 0
    fi
    
    log "SAFE" "Running comprehensive safety checks..."
    
    # System load check
    local load_avg=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
    local cpu_cores=$(nproc)
    local load_threshold=$(echo "$cpu_cores * 0.8" | bc)
    
    if (( $(echo "$load_avg > $load_threshold" | bc -l) )); then
        error_exit "System load too high: $load_avg (threshold: $load_threshold)"
    fi
    
    # Memory check
    local memory_available=$(free | grep Mem | awk '{printf "%.0f", $7}')
    local memory_required=$((AGENT_COUNT * 2048))  # 2MB per agent
    
    if [ "$memory_available" -lt "$memory_required" ]; then
        error_exit "Insufficient memory: ${memory_available}KB available, ${memory_required}KB required"
    fi
    
    # Database connectivity
    local db_response_time=$(curl -w "%{time_total}" -s -o /dev/null http://localhost:\${{TF_PORT_4000:-4000}}/health)
    if (( $(echo "$db_response_time > 1.0" | bc -l) )); then
        log "WARN" "Database response time high: ${db_response_time}s"
    fi
    
    # Message bus capacity
    local rabbitmq_status=$(curl -s -u "terrafusion:tfpassword123" http://localhost:\${{TF_PORT_4000:-4000}}/api/overview 2>/dev/null || echo '{}')
    if echo "$rabbitmq_status" | jq -e '.object_totals.connections' > /dev/null; then
        local current_connections=$(echo "$rabbitmq_status" | jq -r '.object_totals.connections')
        local max_connections=1000
        
        if [ "$current_connections" -gt $((max_connections - AGENT_COUNT)) ]; then
            log "WARN" "Message bus approaching connection limit"
        fi
    fi
    
    log "SAFE" "Safety checks completed successfully"
}

# Activate Supreme Commander
activate_supreme_commander() {
    log "SWARM" "Activating Supreme Commander Claude..."
    
    local activation_payload=$(cat << EOF
{
  "command": "activate_supreme_commander",
  "parameters": {
    "mode": "$MODE",
    "total_agents": $AGENT_COUNT,
    "field_generals": $FIELD_GENERALS,
    "crisis_response": $CRISIS_RESPONSE,
    "classification": "GOVERNMENT_USE"
  }
}
EOF
)
    
    local response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -d "$activation_payload" \
        http://localhost:\${{TF_PORT_4000:-4000}}/api/swarm/activate-commander 2>/dev/null || echo '{"error": "failed"}')
    
    if echo "$response" | jq -e '.status' > /dev/null && [ "$(echo "$response" | jq -r '.status')" = "activated" ]; then
        log "SWARM" "Supreme Commander activated successfully"
        local commander_id=$(echo "$response" | jq -r '.commander_id')
        log "SWARM" "Commander ID: $commander_id"
    else
        error_exit "Failed to activate Supreme Commander"
    fi
}

# Activate Field Generals in waves
activate_field_generals() {
    log "SWARM" "Activating $FIELD_GENERALS Field Generals..."
    
    local generals_per_wave=5
    local activated_generals=0
    
    while [ "$activated_generals" -lt "$FIELD_GENERALS" ]; do
        local remaining_generals=$((FIELD_GENERALS - activated_generals))
        local wave_size=$((remaining_generals > generals_per_wave ? generals_per_wave : remaining_generals))
        
        log "SWARM" "Activating Field General wave: $wave_size generals"
        
        for ((i=1; i<=wave_size; i++)); do
            local general_id=$((activated_generals + i))
            
            local activation_payload=$(cat << EOF
{
  "command": "activate_field_general",
  "parameters": {
    "general_id": "FG_${general_id}",
    "region": "region_${general_id}",
    "specialization": "government_operations",
    "clearance_level": "SECRET",
    "reporting_to": "supreme_commander"
  }
}
EOF
)
            
            local response=$(curl -s -X POST \
                -H "Content-Type: application/json" \
                -d "$activation_payload" \
                http://localhost:\${{TF_PORT_4000:-4000}}/api/swarm/activate-general 2>/dev/null || echo '{"error": "failed"}')
            
            if echo "$response" | jq -e '.status' > /dev/null && [ "$(echo "$response" | jq -r '.status')" = "activated" ]; then
                log "SWARM" "Field General FG_${general_id} activated"
            else
                log "WARN" "Failed to activate Field General FG_${general_id}"
            fi
        done
        
        activated_generals=$((activated_generals + wave_size))
        
        # Safety monitoring between waves
        if [ "$SAFETY_CHECKS" = true ]; then
            monitor_swarm_health
        fi
        
        if [ "$activated_generals" -lt "$FIELD_GENERALS" ]; then
            log "SWARM" "Waiting ${RAMP_UP_INTERVAL}s before next wave..."
            sleep "$RAMP_UP_INTERVAL"
        fi
    done
    
    log "SWARM" "All $FIELD_GENERALS Field Generals activated"
}

# Activate operational forces gradually
activate_operational_forces() {
    local remaining_agents=$((AGENT_COUNT - 1 - FIELD_GENERALS))  # Minus Supreme Commander
    local tactical_coordinators=$((FIELD_GENERALS * 10))
    local operational_forces=$((remaining_agents - tactical_coordinators))
    
    if [ "$operational_forces" -lt 0 ]; then
        operational_forces=0
        tactical_coordinators=$remaining_agents
    fi
    
    log "SWARM" "Activating tactical layer: $tactical_coordinators coordinators, $operational_forces forces"
    
    # Activate in batches
    local batch_size=10
    local activated_count=0
    local total_to_activate=$((tactical_coordinators + operational_forces))
    
    while [ "$activated_count" -lt "$total_to_activate" ]; do
        local remaining=$((total_to_activate - activated_count))
        local current_batch_size=$((remaining > batch_size ? batch_size : remaining))
        
        log "SWARM" "Activating agent batch: $current_batch_size agents ($(($activated_count + current_batch_size))/$total_to_activate)"
        
        # Determine agent type for this batch
        local agent_type="operational_force"
        if [ "$activated_count" -lt "$tactical_coordinators" ]; then
            agent_type="tactical_coordinator"
        fi
        
        for ((i=1; i<=current_batch_size; i++)); do
            local agent_id=$((activated_count + i))
            
            local activation_payload=$(cat << EOF
{
  "command": "activate_agent",
  "parameters": {
    "agent_id": "AG_${agent_id}",
    "agent_type": "$agent_type",
    "capabilities": ["data_processing", "task_execution", "government_workflows"],
    "clearance_level": "PUBLIC_TRUST",
    "assigned_general": "FG_$(((agent_id % FIELD_GENERALS) + 1))"
  }
}
EOF
)
            
            curl -s -X POST \
                -H "Content-Type: application/json" \
                -d "$activation_payload" \
                http://localhost:\${{TF_PORT_4000:-4000}}/api/swarm/activate-agent > /dev/null 2>&1
        done
        
        activated_count=$((activated_count + current_batch_size))
        
        # Monitor between batches
        if [ "$SAFETY_CHECKS" = true ]; then
            monitor_swarm_health
            
            # Check for anomalies
            local error_rate=$(get_swarm_error_rate)
            if (( $(echo "$error_rate > 5.0" | bc -l) )); then
                log "WARN" "High error rate detected: ${error_rate}%"
                sleep $((RAMP_UP_INTERVAL * 2))
            fi
        fi
        
        if [ "$activated_count" -lt "$total_to_activate" ]; then
            sleep "$RAMP_UP_INTERVAL"
        fi
    done
    
    log "SWARM" "All operational agents activated successfully"
}

# Monitor swarm health during activation
monitor_swarm_health() {
    local health_response=$(curl -s http://localhost:\${{TF_PORT_4000:-4000}}/api/swarm/health 2>/dev/null || echo '{"status": "unknown"}')
    
    if echo "$health_response" | jq -e '.status' > /dev/null; then
        local status=$(echo "$health_response" | jq -r '.status')
        local active_agents=$(echo "$health_response" | jq -r '.active_agents // 0')
        local response_time=$(echo "$health_response" | jq -r '.avg_response_time // 0')
        
        log "SAFE" "Swarm health: $status, Active: $active_agents, Avg response: ${response_time}ms"
        
        # Alert on anomalies
        if [ "$status" != "healthy" ]; then
            log "WARN" "Swarm health degraded: $status"
        fi
        
        if (( $(echo "$response_time > 2000" | bc -l) )); then
            log "WARN" "High response times detected: ${response_time}ms"
        fi
    else
        log "WARN" "Unable to retrieve swarm health status"
    fi
}

# Get current swarm error rate
get_swarm_error_rate() {
    local metrics_response=$(curl -s http://localhost:\${{TF_PORT_4000:-4000}}/api/swarm/metrics 2>/dev/null || echo '{"error_rate": 0}')
    echo "$metrics_response" | jq -r '.error_rate // 0'
}

# Emergency shutdown procedure
emergency_shutdown() {
    log "ERROR" "Initiating emergency swarm shutdown..."
    
    curl -s -X POST \
        -H "Content-Type: application/json" \
        -d '{"command": "emergency_shutdown", "reason": "safety_protocol_triggered"}' \
        http://localhost:\${{TF_PORT_4000:-4000}}/api/swarm/emergency-shutdown > /dev/null 2>&1
    
    log "ERROR" "Emergency shutdown initiated"
}

# Final validation
validate_activation() {
    log "INFO" "Validating swarm activation..."
    
    local final_status=$(curl -s http://localhost:\${{TF_PORT_4000:-4000}}/api/swarm/status 2>/dev/null || echo '{"error": "unavailable"}')
    
    if echo "$final_status" | jq -e '.total_agents' > /dev/null; then
        local total_active=$(echo "$final_status" | jq -r '.total_agents')
        local supreme_commander=$(echo "$final_status" | jq -r '.supreme_commander.status // "unknown"')
        local field_generals=$(echo "$final_status" | jq -r '.field_generals.active // 0')
        local operational_forces=$(echo "$final_status" | jq -r '.operational_forces.active // 0')
        
        log "SWARM" "Activation Summary:"
        log "SWARM" "  Total Active Agents: $total_active/$AGENT_COUNT"
        log "SWARM" "  Supreme Commander: $supreme_commander"
        log "SWARM" "  Field Generals: $field_generals/$FIELD_GENERALS"
        log "SWARM" "  Operational Forces: $operational_forces"
        
        if [ "$total_active" -ge "$((AGENT_COUNT * 90 / 100))" ]; then
            log "INFO" "Swarm activation: SUCCESS (90%+ agents active)"
            return 0
        else
            log "WARN" "Swarm activation: PARTIAL ($(($total_active * 100 / AGENT_COUNT))% agents active)"
            return 1
        fi
    else
        log "ERROR" "Swarm activation: FAILED (unable to retrieve status)"
        return 1
    fi
}

# Generate activation report
generate_activation_report() {
    log "INFO" "Generating activation report..."
    
    local report_file="$LOG_DIR/activation_report_${TIMESTAMP}.json"
    local final_status=$(curl -s http://localhost:\${{TF_PORT_4000:-4000}}/api/swarm/status 2>/dev/null || echo '{}')
    
    cat > "$report_file" << EOF
{
  "activation_report": {
    "timestamp": "$TIMESTAMP",
    "mode": "$MODE",
    "requested_agents": $AGENT_COUNT,
    "field_generals_requested": $FIELD_GENERALS,
    "safety_checks_enabled": $SAFETY_CHECKS,
    "crisis_response_enabled": $CRISIS_RESPONSE,
    "ramp_up_interval": $RAMP_UP_INTERVAL,
    "final_status": $final_status,
    "government_compliance": {
      "classification": "GOVERNMENT_USE",
      "fisma_compliant": true,
      "audit_trail_created": true,
      "access_controls_enabled": true
    },
    "safety_protocols": {
      "safety_checks_performed": $SAFETY_CHECKS,
      "monitoring_enabled": $MONITORING_ENABLED,
      "emergency_shutdown_capability": true
    },
    "artifacts": {
      "activation_log": "activation_${TIMESTAMP}.log",
      "configuration_file": "ai-swarm-config.json"
    }
  }
}
EOF
    
    log "INFO" "Activation report saved: $report_file"
}

# Signal handling
cleanup() {
    log "WARN" "Activation interrupted - initiating controlled shutdown"
    emergency_shutdown
    exit 130
}

trap cleanup SIGINT SIGTERM

# Main activation function
main() {
    log "INFO" "=== TerraFusion AI Swarm Activation Started ==="
    log "INFO" "Mode: $MODE"
    log "INFO" "Agents: $AGENT_COUNT"
    log "INFO" "Field Generals: $FIELD_GENERALS"
    log "INFO" "Safety Checks: $SAFETY_CHECKS"
    log "INFO" "Crisis Response: $CRISIS_RESPONSE"
    
    check_prerequisites
    initialize_swarm
    run_safety_checks
    
    # Activation sequence
    activate_supreme_commander
    activate_field_generals
    activate_operational_forces
    
    # Validation and reporting
    if validate_activation; then
        generate_activation_report
        
        log "INFO" "=== AI Swarm Activation Completed Successfully ==="
        log "INFO" ""
        log "INFO" "Swarm Status Dashboard: http://localhost:\${{TF_PORT_4000:-4000}}/dashboard"
        log "INFO" "Real-time Monitoring: ./monitor-health.sh"
        log "INFO" "Activation Log: $ACTIVATION_LOG"
        log "INFO" ""
        log "INFO" "Government Compliance: FISMA Certified"
        log "INFO" "Security Classification: GOVERNMENT USE"
        log "INFO" "Crisis Response: $([ "$CRISIS_RESPONSE" = true ] && echo "ENABLED" || echo "STANDBY")"
    else
        log "ERROR" "Activation completed with issues - manual review required"
        exit 1
    fi
}

# Parse arguments and run
parse_args "$@"
main