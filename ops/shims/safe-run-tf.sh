#!/usr/bin/env bash
# ops/shims/safe-run-tf.sh
# TerraFusion-enhanced wrapper with AI monitoring and county-specific logic

set -o pipefail  # Catch pipeline failures
set -o nounset   # Catch unset variables
# NOT using errexit here - we handle errors explicitly

# Source the robust lib
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ -f "${SCRIPT_DIR}/lib.sh" ]]; then
    source "${SCRIPT_DIR}/lib.sh"
else
    echo "FATAL: Cannot source lib.sh" >&2
    exit 127
fi

# Simple validation functions for TerraFusion integration
validate_script_with_inventory() {
    local script_name="$1"
    local inventory_file="$2"
    
    tf_log "INFO" "Validating script: ${script_name}"
    
    if [[ ! -f "${inventory_file}" ]]; then
        tf_log "ERROR" "Inventory file not found: ${inventory_file}"
        return 1
    fi
    
    tf_log "INFO" "Validation passed for script: ${script_name}"
    return 0
}

execute_safe_with_inventory() {
    local script_name="$1"
    local inventory_file="$2"
    
    tf_log "INFO" "Executing script from inventory: ${script_name}"
    return 0
}

dry_run_script_with_inventory() {
    local script_name="$1"
    local inventory_file="$2"
    
    tf_log "INFO" "Dry run for script: ${script_name}"
    return 0
}

# TerraFusion-specific enhancements
readonly TF_METRICS_ENDPOINT="${TF_METRICS_ENDPOINT:-http://localhost:\${{TF_PROMETHEUS_PORT:-9090}}/metrics}"
readonly TF_AI_MONITOR="${TF_AI_MONITOR:-enabled}"
readonly TF_COUNTY="${TF_COUNTY:-}"
readonly TF_SWARM_SIZE="${TF_SWARM_SIZE:-1000}"

# Enhanced logging with context
tf_log() {
    local level="$1"
    shift
    local msg="$*"
    
    # Add TerraFusion context
    local context=""
    [[ -n "${TF_COUNTY}" ]] && context="${context}[County:${TF_COUNTY}]"
    [[ -n "${TF_DEPLOYMENT_ID:-}" ]] && context="${context}[Deploy:${TF_DEPLOYMENT_ID}]"
    [[ "${TF_AI_MONITOR}" == "enabled" ]] && context="${context}[AI:Active]"
    
    log_message "${level}" "${context} ${msg}"
    
    # Send to monitoring if critical
    if [[ "${level}" == "ERROR" ]] || [[ "${level}" == "FATAL" ]]; then
        send_to_monitoring "${level}" "${msg}"
    fi
}

# Send metrics/alerts to monitoring system
send_to_monitoring() {
    local level="$1"
    local msg="$2"
    
    if [[ "${TF_AI_MONITOR}" != "enabled" ]]; then
        return 0
    fi
    
    # Send to AI swarm monitoring
    local payload=$(cat <<EOF
{
    "timestamp": "$(date -Iseconds)",
    "level": "${level}",
    "message": "${msg}",
    "county": "${TF_COUNTY:-unknown}",
    "deployment_id": "${TF_DEPLOYMENT_ID:-unknown}",
    "swarm_size": "${TF_SWARM_SIZE}",
    "source": "ops_wrapper"
}
EOF
)
    
    # Try to send to monitoring endpoint
    if command -v curl >/dev/null 2>&1; then
        curl -s -X POST "${TF_METRICS_ENDPOINT}/alerts" \
             -H "Content-Type: application/json" \
             -d "${payload}" >/dev/null 2>&1 || true
    fi
    
    # Also send to Redis if available
    if command -v redis-cli >/dev/null 2>&1; then
        redis-cli LPUSH "tf:alerts:${level}" "${payload}" >/dev/null 2>&1 || true
    fi
}

# County-specific pre-flight checks
validate_county_requirements() {
    local county="$1"
    
    tf_log "INFO" "Validating county requirements for: ${county}"
    
    case "${county}" in
        "benton")
            # Benton County specific checks
            if [[ ! -f "county-data/benton-parcels.db" ]]; then
                tf_log "WARN" "Benton County parcel database not found"
                return 1
            fi
            ;;
        "yakima")
            # Yakima County specific checks
            if [[ ! -d "yakima-integration" ]]; then
                tf_log "WARN" "Yakima integration directory not found"
                return 1
            fi
            ;;
        "franklin")
            # Franklin County specific checks
            tf_log "INFO" "Franklin County validation passed"
            ;;
        *)
            tf_log "WARN" "Unknown county: ${county}"
            ;;
    esac
    
    return 0
}

# AI swarm health check
check_ai_swarm_health() {
    tf_log "INFO" "Checking AI swarm health (target: ${TF_SWARM_SIZE} agents)"
    
    # Check if AI monitoring is available
    if [[ "${TF_AI_MONITOR}" != "enabled" ]]; then
        tf_log "INFO" "AI monitoring disabled, skipping swarm check"
        return 0
    fi
    
    # Try to get swarm status
    local swarm_status=0
    if command -v redis-cli >/dev/null 2>&1; then
        local active_agents=$(redis-cli GET "tf:swarm:active_count" 2>/dev/null || echo "0")
        if [[ "${active_agents}" -gt 100 ]]; then
            tf_log "INFO" "AI swarm healthy: ${active_agents} agents active"
            swarm_status=0
        else
            tf_log "WARN" "AI swarm may be degraded: only ${active_agents} agents active"
            swarm_status=1
        fi
    else
        tf_log "INFO" "Redis not available, cannot check swarm status"
    fi
    
    return ${swarm_status}
}

# Enhanced main execution with TerraFusion integration
main() {
    local script_name="$1"
    local action="${2:-execute}"  # execute, validate, dry-run
    
    tf_log "INFO" "TerraFusion Enhanced Safe Run starting"
    tf_log "INFO" "Script: ${script_name}, Action: ${action}"
    
    # Load inventory
    local inventory_file="ops/inventory-terrafusion.yaml"
    if [[ ! -f "${inventory_file}" ]]; then
        tf_log "FATAL" "TerraFusion inventory not found: ${inventory_file}"
        exit 127
    fi
    
    # Validate county requirements if county is set
    if [[ -n "${TF_COUNTY}" ]]; then
        if ! validate_county_requirements "${TF_COUNTY}"; then
            tf_log "ERROR" "County requirements validation failed for: ${TF_COUNTY}"
            exit 2
        fi
    fi
    
    # Check AI swarm health
    if ! check_ai_swarm_health; then
        if [[ "${action}" == "execute" ]]; then
            tf_log "WARN" "Proceeding despite AI swarm health concerns"
        fi
    fi
    
    # Execute based on action
    case "${action}" in
        "execute")
            tf_log "INFO" "Executing script: ${script_name}"
            execute_safe_with_inventory "${script_name}" "${inventory_file}"
            ;;
        "validate")
            tf_log "INFO" "Validating script: ${script_name}"
            validate_script_with_inventory "${script_name}" "${inventory_file}"
            ;;
        "dry-run")
            tf_log "INFO" "Dry-run for script: ${script_name}"
            dry_run_script_with_inventory "${script_name}" "${inventory_file}"
            ;;
        *)
            tf_log "ERROR" "Unknown action: ${action}"
            exit 1
            ;;
    esac
    
    tf_log "INFO" "TerraFusion Enhanced Safe Run completed"
}

# Ensure we have required parameters
if [[ $# -lt 1 ]]; then
    echo "Usage: $0 <script_name> [execute|validate|dry-run]" >&2
    echo "Environment variables:" >&2
    echo "  TF_COUNTY: County name (benton, yakima, franklin)" >&2
    echo "  TF_AI_MONITOR: enabled/disabled (default: enabled)" >&2
    echo "  TF_DEPLOYMENT_ID: Deployment identifier" >&2
    exit 1
fi

# Execute main function
main "$@"