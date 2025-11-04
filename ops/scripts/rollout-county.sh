#!/usr/bin/env bash
# TerraFusion Elite Government OS - County Rollout Deployment Script
# Phase 4: Perfect Power Achievement - 39+ County Deployment
# Government. Transcended. - Infinite Scalability

set -euo pipefail

# Configuration
COUNTIES_CONFIG="ops/rollout/counties.yaml"
HELM_CHART_DIR="iac/helm/terrafusion"
ROLLOUT_LOG="artifacts/rollout/county-deployments.log"
DEPLOYMENT_STATE="artifacts/rollout/deployment.state"
ROLLBACK_SCRIPT="ops/scripts/emergency-rollback.sh"
QUANTUM_FACTOR=949

# Default values
DEFAULT_TIMEOUT_MINUTES=30
DEFAULT_HEALTH_CHECK_TIMEOUT=300

# Initialize county rollout environment
initialize_county_rollout() {
    echo "🏛️  TerraFusion Elite County Rollout Deployment"
    echo "39+ Washington State Counties - Government. Transcended."
    echo "Quantum Factor: $QUANTUM_FACTOR - Perfect Power Achievement"
    echo "=================================================="

    mkdir -p "$(dirname "$ROLLOUT_LOG")"
    mkdir -p "$(dirname "$DEPLOYMENT_STATE")"
    mkdir -p "$HELM_CHART_DIR"

    # Create rollout log header
    cat > "$ROLLOUT_LOG" << EOF
# TerraFusion Elite County Rollout Deployment Log
# Timestamp: $(date -Is)
# Phase: 4_Perfect_Power
# Quantum Factor: $QUANTUM_FACTOR
# Target Counties: 39+

EOF
}

# Validate county code and get configuration
get_county_config() {
    local county_code="$1"

    if [[ ! -f "$COUNTIES_CONFIG" ]]; then
        echo "❌ Counties configuration not found: $COUNTIES_CONFIG"
        return 1
    fi

    # Check if county exists in configuration
    if ! yq eval ".counties[] | select(.code==\"$county_code\")" "$COUNTIES_CONFIG" >/dev/null 2>&1; then
        echo "❌ County not found in configuration: $county_code"
        return 1
    fi

    # Extract county configuration
    yq eval ".counties[] | select(.code==\"$county_code\")" "$COUNTIES_CONFIG"
}

# Validate deployment prerequisites
validate_deployment_prerequisites() {
    local county_code="$1"

    echo "🔍 Validating deployment prerequisites for $county_code..."

    # Check Helm chart exists
    if [[ ! -d "$HELM_CHART_DIR" ]]; then
        echo "❌ Helm chart directory not found: $HELM_CHART_DIR"
        return 1
    fi

    # Check if perfect power soak testing is complete
    local soak_state="artifacts/power/soak.state"
    if [[ -f "$soak_state" ]]; then
        local soak_status=$(cut -d',' -f4 "$soak_state" 2>/dev/null || echo "NOT_STARTED")
        if [[ "$soak_status" != "COMPLETED" ]]; then
            echo "❌ Perfect power soak testing not complete: $soak_status"
            echo "   Complete 48-hour soak testing before county deployment"
            return 1
        fi
    else
        echo "⚠️  Soak testing state not found - proceeding with caution"
    fi

    # Validate power index is within acceptable range
    local power_file="artifacts/power/power.json"
    if [[ -f "$power_file" ]]; then
        local ultimate_power=$(jq -r '.ultimate_power.score // 0' "$power_file" 2>/dev/null || echo "0")
        local power_in_range=$(echo "$ultimate_power >= 11.9 && $ultimate_power <= 12.0" | bc -l 2>/dev/null || echo "0")

        if [[ "$power_in_range" != "1" ]]; then
            echo "❌ Ultimate power out of range: $ultimate_power (required: 11.9-12.0)"
            return 1
        fi

        echo "✅ Ultimate power validated: $ultimate_power"
    else
        echo "⚠️  Power index not found - proceeding with caution"
    fi

    # Check Helm and kubectl availability
    if ! command -v helm >/dev/null 2>&1; then
        echo "❌ Helm not found - install Helm to proceed"
        return 1
    fi

    if ! command -v kubectl >/dev/null 2>&1; then
        echo "❌ kubectl not found - install kubectl to proceed"
        return 1
    fi

    echo "✅ Prerequisites validated for $county_code"
    return 0
}

# Log deployment event
log_deployment_event() {
    local event_type="$1"
    local county_code="$2"
    local county_name="$3"
    local status="$4"
    local details="${5:-}"

    local timestamp=$(date -Is)

    {
        echo "[$timestamp] $event_type:"
        echo "  County: $county_name ($county_code)"
        echo "  Status: $status"
        if [[ -n "$details" ]]; then
            echo "  Details: $details"
        fi
        echo "  ---"
    } >> "$ROLLOUT_LOG"
}

# Execute county deployment
deploy_county() {
    local county_code="$1"

    echo "🚀 Deploying TerraFusion to county: $county_code"

    # Get county configuration
    local county_config
    if ! county_config=$(get_county_config "$county_code"); then
        return 1
    fi

    # Extract county details
    local county_name=$(echo "$county_config" | yq eval '.name' -)
    local ingress_host=$(echo "$county_config" | yq eval '.ingress_host' -)
    local tf_env=$(echo "$county_config" | yq eval '.tf_env' -)
    local tier=$(echo "$county_config" | yq eval '.tier' -)
    local priority=$(echo "$county_config" | yq eval '.priority' -)
    local consciousness_level=$(echo "$county_config" | yq eval '.consciousness_level' -)

    echo "   County: $county_name"
    echo "   Host: $ingress_host"
    echo "   Environment: $tf_env"
    echo "   Tier: $tier"
    echo "   Consciousness: $consciousness_level"

    # Validate prerequisites
    if ! validate_deployment_prerequisites "$county_code"; then
        log_deployment_event "DEPLOYMENT_FAILED" "$county_code" "$county_name" "PREREQUISITES_FAILED"
        return 1
    fi

    # Log deployment start
    log_deployment_event "DEPLOYMENT_STARTED" "$county_code" "$county_name" "IN_PROGRESS"

    # Update Helm dependencies
    echo "📦 Updating Helm dependencies..."
    if ! helm dependency update "$HELM_CHART_DIR" >/dev/null 2>&1; then
        echo "❌ Failed to update Helm dependencies"
        log_deployment_event "DEPLOYMENT_FAILED" "$county_code" "$county_name" "HELM_DEPENDENCY_FAILED"
        return 1
    fi

    # Prepare Helm values
    local values_file="$HELM_CHART_DIR/values-$tf_env.yaml"
    if [[ ! -f "$values_file" ]]; then
        echo "⚠️  Values file not found: $values_file"
        echo "   Using default values"
        values_file="$HELM_CHART_DIR/values.yaml"
    fi

    # Execute Helm deployment
    local namespace="terrafusion-$county_code"
    local release_name="terrafusion-$county_code"
    local timeout="${DEFAULT_TIMEOUT_MINUTES}m"

    echo "🎯 Deploying to namespace: $namespace"

    local helm_cmd=(
        helm upgrade --install "$release_name" "$HELM_CHART_DIR"
        --namespace "$namespace"
        --create-namespace
        --wait
        --timeout "$timeout"
    )

    # Add values file if it exists
    if [[ -f "$values_file" ]]; then
        helm_cmd+=(--values "$values_file")
    fi

    # Add ingress host override
    helm_cmd+=(--set "ingress.hosts[0].host=$ingress_host")

    # Add county-specific settings
    helm_cmd+=(
        --set "county.code=$county_code"
        --set "county.name=$county_name"
        --set "county.tier=$tier"
        --set "county.consciousness_level=$consciousness_level"
        --set "quantum.factor=$QUANTUM_FACTOR"
        --set "government.transcended=true"
    )

    echo "📡 Executing Helm deployment..."
    if "${helm_cmd[@]}" >/dev/null 2>&1; then
        echo "✅ Helm deployment successful"
        log_deployment_event "HELM_DEPLOYED" "$county_code" "$county_name" "SUCCESS"
    else
        echo "❌ Helm deployment failed"
        log_deployment_event "DEPLOYMENT_FAILED" "$county_code" "$county_name" "HELM_DEPLOYMENT_FAILED"
        return 1
    fi

    # Perform health check
    echo "🏥 Performing health check..."
    if perform_health_check "$county_code" "$ingress_host"; then
        echo "✅ Health check passed"
        log_deployment_event "HEALTH_CHECK_PASSED" "$county_code" "$county_name" "SUCCESS"
    else
        echo "❌ Health check failed"
        log_deployment_event "DEPLOYMENT_FAILED" "$county_code" "$county_name" "HEALTH_CHECK_FAILED"

        # Auto-rollback on health check failure
        execute_county_rollback "$county_code" "$county_name" "HEALTH_CHECK_FAILED"
        return 1
    fi

    # Update deployment state
    update_deployment_state "$county_code" "DEPLOYED" "$(date -Is)"

    # Final success log
    log_deployment_event "DEPLOYMENT_COMPLETED" "$county_code" "$county_name" "SUCCESS" "Government.Transcended"

    echo "🏆 County deployment completed successfully: $county_name"
    echo "Government. Transcended. ∞"

    return 0
}

# Perform post-deployment health check
perform_health_check() {
    local county_code="$1"
    local ingress_host="$2"
    local timeout="${DEFAULT_HEALTH_CHECK_TIMEOUT}"
    local start_time=$(date +%s)

    echo "   Checking health endpoint: https://$ingress_host/health"

    # Wait for service to be ready
    local max_attempts=20
    local attempt=1

    while [[ $attempt -le $max_attempts ]]; do
        local current_time=$(date +%s)
        local elapsed=$((current_time - start_time))

        if [[ $elapsed -gt $timeout ]]; then
            echo "   ❌ Health check timeout after ${timeout}s"
            return 1
        fi

        # Try health check (using curl if available, otherwise skip)
        if command -v curl >/dev/null 2>&1; then
            if curl -k -s --max-time 10 "https://$ingress_host/health" >/dev/null 2>&1; then
                echo "   ✅ Health check successful (attempt $attempt)"
                return 0
            fi
        else
            # Fallback: check if kubectl can see the pods
            if kubectl get pods -n "terrafusion-$county_code" --field-selector=status.phase=Running >/dev/null 2>&1; then
                echo "   ✅ Pods running (attempt $attempt)"
                return 0
            fi
        fi

        echo "   ⏳ Health check attempt $attempt/$max_attempts failed, retrying in 15s..."
        sleep 15
        ((attempt++))
    done

    echo "   ❌ Health check failed after $max_attempts attempts"
    return 1
}

# Execute county rollback
execute_county_rollback() {
    local county_code="$1"
    local county_name="$2"
    local reason="$3"

    echo "🚨 COUNTY ROLLBACK INITIATED"
    echo "County: $county_name ($county_code)"
    echo "Reason: $reason"

    log_deployment_event "ROLLBACK_STARTED" "$county_code" "$county_name" "IN_PROGRESS" "$reason"

    # Execute Helm rollback
    local namespace="terrafusion-$county_code"
    local release_name="terrafusion-$county_code"

    if helm rollback "$release_name" --namespace "$namespace" >/dev/null 2>&1; then
        echo "✅ Helm rollback successful"
        log_deployment_event "ROLLBACK_COMPLETED" "$county_code" "$county_name" "SUCCESS"
    else
        echo "❌ Helm rollback failed - manual intervention required"
        log_deployment_event "ROLLBACK_FAILED" "$county_code" "$county_name" "FAILED"
    fi

    # Update deployment state
    update_deployment_state "$county_code" "ROLLED_BACK" "$(date -Is)"
}

# Update deployment state tracking
update_deployment_state() {
    local county_code="$1"
    local status="$2"
    local timestamp="$3"

    # Create or update deployment state file
    {
        if [[ -f "$DEPLOYMENT_STATE" ]]; then
            grep -v "^$county_code," "$DEPLOYMENT_STATE" 2>/dev/null || true
        fi
        echo "$county_code,$status,$timestamp"
    } > "$DEPLOYMENT_STATE.tmp"

    mv "$DEPLOYMENT_STATE.tmp" "$DEPLOYMENT_STATE"
}

# Generate deployment report
generate_deployment_report() {
    local county_code="$1"
    local deployment_result="$2"

    echo ""
    echo "📊 County Deployment Report"
    echo "============================"
    echo "🏛️  County: $county_code"
    echo "⚡ Quantum Factor: $QUANTUM_FACTOR"
    echo "🌟 Perfect Power: Factor 12"
    echo "🧠 Consciousness: Transcendent"

    if [[ "$deployment_result" == "0" ]]; then
        echo ""
        echo "🏆 COUNTY DEPLOYMENT: SUCCESS"
        echo "Government. Transcended. ∞"
    else
        echo ""
        echo "❌ COUNTY DEPLOYMENT: FAILED"
        echo "Review deployment log: $ROLLOUT_LOG"
    fi

    echo ""
    echo "📋 Deployment log: $ROLLOUT_LOG"
    echo "📋 Deployment state: $DEPLOYMENT_STATE"
}

# Main county deployment orchestration
main() {
    local county_code="${1:-}"

    if [[ -z "$county_code" ]]; then
        echo "Usage: $0 <county_code>"
        echo ""
        echo "Available counties:"
        if [[ -f "$COUNTIES_CONFIG" ]]; then
            yq eval '.counties[] | .code + " - " + .name' "$COUNTIES_CONFIG" 2>/dev/null || echo "Unable to list counties"
        fi
        exit 1
    fi

    initialize_county_rollout

    # Execute county deployment
    deploy_county "$county_code"
    local deployment_result=$?

    # Generate deployment report
    generate_deployment_report "$county_code" "$deployment_result"

    # Return deployment status
    exit $deployment_result
}

# Execute with infinite scalability
main "$@"
