#!/usr/bin/env bash
# ops/shims/safe-run-tf.sh
# TerraFusion-enhanced wrapper with AI monitoring and county-specific logic

set -o pipefail  # Catch pipeline failures
set -o nounset   # Catch unset variables
# NOT using errexit here - we handle errors explicitly

# Source the robust lib
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/lib.sh" || {
    echo "FATAL: Cannot source lib.sh" >&2
    exit 127
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
    
    # Send to Prometheus
    if command -v curl &>/dev/null; then
        curl -sf -X POST "${TF_METRICS_ENDPOINT}" \
            -H "Content-Type: application/json" \
            -d "{
                \"level\": \"${level}\",
                \"message\": \"${msg}\",
                \"timestamp\": \"$(date -Iseconds)\",
                \"county\": \"${TF_COUNTY}\",
                \"host\": \"$(hostname)\"
            }" 2>/dev/null || true
    fi
    
    # Trigger AI swarm for critical errors
    if [[ "${level}" == "FATAL" ]] && [[ -f "${SCRIPT_DIR}/../ai/trigger-swarm.sh" ]]; then
        "${SCRIPT_DIR}/../ai/trigger-swarm.sh" \
            --emergency \
            --message "${msg}" \
            --context "safe-run-wrapper" \
            2>/dev/null || true
    fi
}

# Pre-flight checks for TerraFusion scripts
tf_preflight_check() {
    local script_name="$1"
    
    tf_log "INFO" "Running pre-flight checks for ${script_name}"
    
    # Check if we're in a migration
    if [[ -d "BACKUP_"* ]] && [[ "${script_name}" != *"migration"* ]]; then
        tf_log "WARN" "Migration backup detected - some operations may be restricted"
    fi
    
    # County-specific checks
    if [[ -n "${TF_COUNTY}" ]]; then
        case "${TF_COUNTY}" in
            benton)
                # Benton requires special GIS service
                if ! curl -sf http://localhost:\${{TF_PROMETHEUS_PORT:-9090}}/health &>/dev/null; then
                    tf_log "WARN" "Benton GIS service not responding"
                fi
                ;;
            yakima)
                # Yakima needs procurement module
                if [[ ! -f "terrafusion-ai-arsenal/agents/procurement-agent/config.json" ]]; then
                    tf_log "ERROR" "Yakima procurement agent not configured"
                    return 1
                fi
                ;;
            franklin)
                # Franklin requires migration tools
                if [[ ! -d "terrafusion/services/migration" ]]; then
                    tf_log "ERROR" "Franklin migration service not found"
                    return 1
                fi
                ;;
        esac
    fi
    
    # AI Swarm checks
    if [[ "${script_name}" == *"swarm"* ]] || [[ "${script_name}" == *"ai"* ]]; then
        tf_log "INFO" "Checking AI infrastructure..."
        
        # Check Redis for swarm coordination
        if ! redis-cli ping &>/dev/null; then
            tf_log "ERROR" "Redis not available for AI swarm coordination"
            return 1
        fi
        
        # Check swarm size limits
        if [[ "${TF_SWARM_SIZE}" -gt 50000 ]]; then
            tf_log "ERROR" "Swarm size ${TF_SWARM_SIZE} exceeds maximum (50000)"
            return 1
        fi
        
        # Check GPU availability for training
        if [[ "${script_name}" == *"train"* ]]; then
            if ! nvidia-smi &>/dev/null; then
                tf_log "WARN" "No GPU detected - training will be slow"
            fi
        fi
    fi
    
    # Production deployment checks
    if [[ "${script_name}" == *"prod"* ]] || [[ "${script_name}" == *"production"* ]]; then
        tf_log "INFO" "Production deployment checks..."
        
        # Ensure tests have passed
        if [[ ! -f "test-results/latest-pass.marker" ]]; then
            tf_log "ERROR" "No recent test pass marker found"
            read -p "Deploy without test verification? (y/N): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                return 1
            fi
        fi
        
        # Check for approval file
        if [[ ! -f ".approvals/${script_name}.approved" ]]; then
            tf_log "WARN" "No approval file found for ${script_name}"
        fi
    fi
    
    return 0
}

# Enhanced script execution with TerraFusion features
tf_execute_script() {
    local script_path="$1"
    local timeout="${2:-600}"
    local retries="${3:-0}"
    
    tf_log "INFO" "Executing: ${script_path} (timeout=${timeout}s, retries=${retries})"
    
    local attempt=0
    local exit_code=0
    
    while [[ ${attempt} -le ${retries} ]]; do
        attempt=$((attempt + 1))
        
        if [[ ${attempt} -gt 1 ]]; then
            local backoff=$((2 ** (attempt - 1)))
            tf_log "INFO" "Retry ${attempt}/${retries} after ${backoff}s backoff"
            sleep "${backoff}"
        fi
        
        # Create execution context file
        local context_file="/tmp/tf-exec-context-$$"
        cat > "${context_file}" << EOF
{
    "execution_id": "exec-$(date +%s)-$$",
    "script": "${script_path}",
    "county": "${TF_COUNTY}",
    "swarm_size": "${TF_SWARM_SIZE}",
    "attempt": ${attempt},
    "max_retries": ${retries},
    "started_at": "$(date -Iseconds)"
}
EOF
        
        # Export context for child scripts
        export TF_EXECUTION_CONTEXT="${context_file}"
        
        # Execute with timeout and capture
        local output_file="/tmp/tf-output-$$"
        local error_file="/tmp/tf-error-$$"
        
        if timeout --preserve-status "${timeout}" bash "${script_path}" \
            > "${output_file}" 2> "${error_file}"; then
            
            exit_code=0
            tf_log "SUCCESS" "Script completed successfully"
            
            # Capture artifacts if specified
            capture_artifacts "${script_path}" "${output_file}"
            
        else
            exit_code=$?
            
            if [[ ${exit_code} -eq 124 ]]; then
                tf_log "ERROR" "Script timed out after ${timeout}s"
            else
                tf_log "ERROR" "Script failed with exit code ${exit_code}"
            fi
            
            # Log error output
            if [[ -s "${error_file}" ]]; then
                tf_log "ERROR" "Error output:"
                while IFS= read -r line; do
                    tf_log "ERROR" "  ${line}"
                done < "${error_file}"
            fi
        fi
        
        # Update context with completion
        if [[ -f "${context_file}" ]]; then
            jq --arg ec "${exit_code}" --arg end "$(date -Iseconds)" \
                '. + {exit_code: $ec, ended_at: $end}' \
                "${context_file}" > "${context_file}.tmp" && \
                mv "${context_file}.tmp" "${context_file}"
            
            # Archive context
            mkdir -p "./var/log/ops/contexts"
            cp "${context_file}" "./var/log/ops/contexts/"
        fi
        
        # Clean up temp files
        rm -f "${output_file}" "${error_file}" "${context_file}"
        
        # Success - break retry loop
        if [[ ${exit_code} -eq 0 ]]; then
            break
        fi
        
        # Check if we should retry
        if [[ ${attempt} -lt ${retries} ]]; then
            tf_log "WARN" "Will retry (${attempt}/${retries} attempts used)"
        fi
    done
    
    return ${exit_code}
}

# Capture and store artifacts
capture_artifacts() {
    local script_path="$1"
    local output_file="$2"
    
    local script_name="$(basename "${script_path}" .sh)"
    local artifact_dir="./var/artifacts/${script_name}/$(date +%Y%m%d-%H%M%S)"
    
    mkdir -p "${artifact_dir}"
    
    # Copy output
    if [[ -f "${output_file}" ]]; then
        cp "${output_file}" "${artifact_dir}/output.log"
    fi
    
    # Copy any generated artifacts based on patterns
    local patterns=(
        "coverage/*.html"
        "test-results/*.xml"
        "demo_output/*.pdf"
        "reports/*.md"
    )
    
    for pattern in "${patterns[@]}"; do
        if compgen -G "${pattern}" > /dev/null; then
            tf_log "INFO" "Capturing artifacts: ${pattern}"
            cp ${pattern} "${artifact_dir}/" 2>/dev/null || true
        fi
    done
    
    # Create manifest
    cat > "${artifact_dir}/manifest.json" << EOF
{
    "script": "${script_path}",
    "timestamp": "$(date -Iseconds)",
    "county": "${TF_COUNTY}",
    "files": $(find "${artifact_dir}" -type f -name "*" | jq -R . | jq -s .)
}
EOF
    
    tf_log "INFO" "Artifacts stored in ${artifact_dir}"
}

# Main execution
main() {
    local script_name="${1:-}"
    local mode="${2:-execute}"  # execute, dry-run, validate
    
    if [[ -z "${script_name}" ]]; then
        tf_log "ERROR" "Usage: $0 <script-name> [mode]"
        exit 1
    fi
    
    tf_log "INFO" "TerraFusion Safe-Run starting (mode=${mode})"
    
    # Load inventory
    local inventory_file="${SCRIPT_DIR}/../inventory-terrafusion.yaml"
    if [[ ! -f "${inventory_file}" ]]; then
        tf_log "ERROR" "Inventory file not found: ${inventory_file}"
        exit 1
    fi
    
    # Extract script config from inventory (using yq or python)
    local script_path timeout retries
    
    if command -v yq &>/dev/null; then
        script_path=$(yq eval ".scripts.${script_name}.path" "${inventory_file}")
        timeout=$(yq eval ".scripts.${script_name}.timeout // 600" "${inventory_file}")
        retries=$(yq eval ".scripts.${script_name}.retries // 0" "${inventory_file}")
    else
        # Fallback to Python
        script_path=$(python3 -c "
import yaml
with open('${inventory_file}') as f:
    data = yaml.safe_load(f)
    print(data.get('scripts', {}).get('${script_name}', {}).get('path', ''))
        ")
        timeout=600
        retries=0
    fi
    
    if [[ -z "${script_path}" ]] || [[ "${script_path}" == "null" ]]; then
        tf_log "ERROR" "Script '${script_name}' not found in inventory"
        exit 1
    fi
    
    if [[ ! -f "${script_path}" ]]; then
        tf_log "ERROR" "Script file not found: ${script_path}"
        exit 1
    fi
    
    # Run pre-flight checks
    if ! tf_preflight_check "${script_name}"; then
        tf_log "ERROR" "Pre-flight checks failed"
        exit 1
    fi
    
    # Execute based on mode
    case "${mode}" in
        dry-run)
            tf_log "INFO" "DRY-RUN: Would execute ${script_path}"
            tf_log "INFO" "  Timeout: ${timeout}s"
            tf_log "INFO" "  Retries: ${retries}"
            tf_log "INFO" "  County: ${TF_COUNTY:-none}"
            tf_log "INFO" "  AI Monitor: ${TF_AI_MONITOR}"
            exit 0
            ;;
            
        validate)
            tf_log "INFO" "Validating ${script_path}"
            bash -n "${script_path}"
            exit $?
            ;;
            
        execute|*)
            tf_execute_script "${script_path}" "${timeout}" "${retries}"
            exit $?
            ;;
    esac
}

# Trap signals for clean shutdown
trap 'tf_log "WARN" "Caught SIGINT - cleaning up..."; exit 130' INT
trap 'tf_log "WARN" "Caught SIGTERM - cleaning up..."; exit 143' TERM

# Run main if not sourced
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi