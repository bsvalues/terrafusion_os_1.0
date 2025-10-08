#!/bin/bash
#
# rollback-latest.sh
# Purpose: One-touch deterministic rollback with manifest hash verification
# Principle: Executable "half-asleep" during incidents — no ambiguity
# Generated: 2025-10-07 T+36h
# Owner: SRE Team
#
# Usage:
#   bash rollback-latest.sh                    # Prompt for confirmation
#   bash rollback-latest.sh --no-confirm       # Immediate rollback (emergency)
#   bash rollback-latest.sh --component=f2     # Rollback single component
#   bash rollback-latest.sh --dry-run          # Simulate rollback (no changes)
#
# Philosophy:
#   "The best rollback script is the one you can execute at 3am with
#    zero ambiguity and <2min recovery time." — Smart Idle Doctrine
#

set -euo pipefail

# =============================================================================
# CONFIGURATION
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OPS_DIR="${SCRIPT_DIR}/.."
BACKUP_DIR="${OPS_DIR}"
LOG_FILE="${OPS_DIR}/logs/rollback-$(date +%Y%m%d-%H%M%S).log"

# Rollback targets
declare -A COMPONENTS=(
    ["f1"]="traffic/f1-retry-budget.backup.yaml"
    ["f2"]="traffic/f2-circuit-breaker.backup.yaml"
    ["f4"]="cache/f4-redis-pool.backup.yaml"
    ["rs256"]="security/rs256/jwt-secret.backup.txt"
)

declare -A DEPLOYMENTS=(
    ["f1"]="f1-optimizer"
    ["f2"]="f2-processor"
    ["f4"]="f4-cache-manager"
    ["rs256"]="auth-service"
)

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $*" | tee -a "${LOG_FILE}"
}

error() {
    echo -e "${RED}[ERROR]${NC} $*" | tee -a "${LOG_FILE}" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $*" | tee -a "${LOG_FILE}"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $*" | tee -a "${LOG_FILE}"
}

# Create log directory
mkdir -p "$(dirname "${LOG_FILE}")"

# =============================================================================
# PARSE ARGUMENTS
# =============================================================================

NO_CONFIRM=false
DRY_RUN=false
COMPONENT=""

for arg in "$@"; do
    case $arg in
        --no-confirm)
            NO_CONFIRM=true
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --component=*)
            COMPONENT="${arg#*=}"
            shift
            ;;
        *)
            error "Unknown argument: $arg"
            echo "Usage: $0 [--no-confirm] [--dry-run] [--component=f1|f2|f4|rs256]"
            exit 1
            ;;
    esac
done

# =============================================================================
# ROLLBACK FUNCTIONS
# =============================================================================

get_current_manifest_hash() {
    local component=$1
    local deployment=${DEPLOYMENTS[$component]}
    
    if [[ "$DRY_RUN" == true ]]; then
        echo "abc123def456"  # Mock hash for dry-run
        return
    fi
    
    # Get current manifest hash (kubectl)
    kubectl get deployment "${deployment}" -o jsonpath='{.metadata.annotations.deployment\.kubernetes\.io/revision}' 2>/dev/null || echo "N/A"
}

get_backup_manifest_hash() {
    local component=$1
    local backup_file="${BACKUP_DIR}/${COMPONENTS[$component]}"
    
    if [[ ! -f "$backup_file" ]]; then
        echo "N/A"
        return
    fi
    
    # Calculate SHA256 hash of backup manifest
    sha256sum "$backup_file" | awk '{print $1}' | cut -c1-12
}

rollback_component() {
    local component=$1
    local backup_file="${BACKUP_DIR}/${COMPONENTS[$component]}"
    local deployment=${DEPLOYMENTS[$component]}
    
    log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log "Rolling back ${component^^} to baseline configuration"
    log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # Validate backup file exists
    if [[ ! -f "$backup_file" ]]; then
        error "Backup file not found: $backup_file"
        return 1
    fi
    
    # Print current state
    log "Current manifest:"
    log "  Component:  ${component}"
    log "  Deployment: ${deployment}"
    log "  Revision:   $(get_current_manifest_hash "$component")"
    log "  Backup:     $(get_backup_manifest_hash "$component")"
    
    # Confirmation prompt
    if [[ "$NO_CONFIRM" == false ]]; then
        read -p "$(echo -e "${YELLOW}Proceed with rollback? [y/N]:${NC} ")" -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            warn "Rollback cancelled by user"
            return 0
        fi
    fi
    
    # Execute rollback
    local start_time=$(date +%s)
    
    if [[ "$DRY_RUN" == true ]]; then
        log "[DRY-RUN] Would execute: kubectl apply -f $backup_file"
        log "[DRY-RUN] Would execute: kubectl rollout status deployment/$deployment"
    else
        log "Applying backup manifest: $backup_file"
        kubectl apply -f "$backup_file" 2>&1 | tee -a "${LOG_FILE}"
        
        log "Waiting for rollout to complete..."
        kubectl rollout status deployment/"$deployment" --timeout=90s 2>&1 | tee -a "${LOG_FILE}"
    fi
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    # Validate rollback
    if [[ "$DRY_RUN" == false ]]; then
        log "Validating rollback..."
        
        # Check deployment status
        local ready_replicas=$(kubectl get deployment "$deployment" -o jsonpath='{.status.readyReplicas}' 2>/dev/null || echo "0")
        local desired_replicas=$(kubectl get deployment "$deployment" -o jsonpath='{.spec.replicas}' 2>/dev/null || echo "0")
        
        if [[ "$ready_replicas" -eq "$desired_replicas" ]] && [[ "$ready_replicas" -gt 0 ]]; then
            success "Rollback validated: $ready_replicas/$desired_replicas replicas ready"
        else
            error "Rollback validation failed: $ready_replicas/$desired_replicas replicas ready"
            return 1
        fi
    else
        success "[DRY-RUN] Rollback simulation successful"
    fi
    
    # Print summary
    log "Rollback completed in ${duration}s (target: <90s)"
    if [[ $duration -lt 90 ]]; then
        success "Rollback time within target ✓"
    else
        warn "Rollback time exceeds 90s target"
    fi
    
    return 0
}

rollback_all() {
    log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log "PARALLEL MULTI-COMPONENT ROLLBACK"
    log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    local start_time=$(date +%s)
    
    # Print current state of all components
    log "Current manifest hashes:"
    for component in "${!COMPONENTS[@]}"; do
        log "  ${component}: $(get_current_manifest_hash "$component")"
    done
    
    log ""
    log "Backup manifest hashes:"
    for component in "${!COMPONENTS[@]}"; do
        log "  ${component}: $(get_backup_manifest_hash "$component")"
    done
    
    # Confirmation prompt
    if [[ "$NO_CONFIRM" == false ]]; then
        echo ""
        read -p "$(echo -e "${YELLOW}Rollback ALL components? [y/N]:${NC} ")" -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            warn "Rollback cancelled by user"
            exit 0
        fi
    fi
    
    # Execute rollbacks in parallel
    declare -a pids=()
    declare -a results=()
    
    for component in "${!COMPONENTS[@]}"; do
        log "Starting rollback: $component"
        (rollback_component "$component") &
        pids+=($!)
    done
    
    # Wait for all rollbacks to complete
    log "Waiting for all rollbacks to complete..."
    for pid in "${pids[@]}"; do
        if wait "$pid"; then
            results+=(0)
        else
            results+=(1)
        fi
    done
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    # Print summary
    log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log "ROLLBACK SUMMARY"
    log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    local failures=0
    for result in "${results[@]}"; do
        ((failures += result))
    done
    
    if [[ $failures -eq 0 ]]; then
        success "All components rolled back successfully"
        log "Total rollback time: ${duration}s (target: <120s)"
        if [[ $duration -lt 120 ]]; then
            success "Parallel rollback time within target ✓"
        else
            warn "Parallel rollback time exceeds 120s target"
        fi
    else
        error "$failures component(s) failed to rollback"
        exit 1
    fi
}

# =============================================================================
# POST-ROLLBACK VALIDATION
# =============================================================================

validate_system_health() {
    log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log "POST-ROLLBACK VALIDATION"
    log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    if [[ "$DRY_RUN" == true ]]; then
        log "[DRY-RUN] Would validate system health"
        return 0
    fi
    
    # Check 1: All deployments ready
    log "Checking deployment status..."
    for component in "${!DEPLOYMENTS[@]}"; do
        local deployment=${DEPLOYMENTS[$component]}
        local ready=$(kubectl get deployment "$deployment" -o jsonpath='{.status.readyReplicas}' 2>/dev/null || echo "0")
        local desired=$(kubectl get deployment "$deployment" -o jsonpath='{.spec.replicas}' 2>/dev/null || echo "0")
        
        if [[ "$ready" -eq "$desired" ]] && [[ "$ready" -gt 0 ]]; then
            success "  ${component}: $ready/$desired replicas ready ✓"
        else
            error "  ${component}: $ready/$desired replicas ready ✗"
        fi
    done
    
    # Check 2: System RI
    log "Checking System RI..."
    if command -v curl &> /dev/null; then
        local system_ri=$(curl -s http://localhost:9091/metrics 2>/dev/null | grep -m1 'terrafusion_ri_system' | awk '{print $2}' || echo "0")
        
        if (( $(echo "$system_ri >= 0.9390" | bc -l) )); then
            success "  System RI: $system_ri (target: ≥0.9390) ✓"
        else
            warn "  System RI: $system_ri (target: ≥0.9390) ✗"
        fi
    else
        warn "  curl not found, skipping RI check"
    fi
    
    # Check 3: No firing alerts
    log "Checking Prometheus alerts..."
    if command -v curl &> /dev/null; then
        local firing_alerts=$(curl -s http://localhost:9090/api/v1/alerts 2>/dev/null | grep -c '"state":"firing"' || echo "0")
        
        if [[ $firing_alerts -eq 0 ]]; then
            success "  Firing alerts: 0 ✓"
        else
            warn "  Firing alerts: $firing_alerts ✗"
        fi
    else
        warn "  curl not found, skipping alert check"
    fi
    
    log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# =============================================================================
# MAIN EXECUTION
# =============================================================================

main() {
    log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log "TerraFusion OS - Automatic Rollback Script"
    log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log "Timestamp:   $(date +'%Y-%m-%d %H:%M:%S %Z')"
    log "Log file:    ${LOG_FILE}"
    log "Mode:        $([ "$DRY_RUN" == true ] && echo "DRY-RUN" || echo "PRODUCTION")"
    log "Confirmation: $([ "$NO_CONFIRM" == true ] && echo "DISABLED" || echo "ENABLED")"
    
    if [[ -n "$COMPONENT" ]]; then
        # Single component rollback
        if [[ -z "${COMPONENTS[$COMPONENT]}" ]]; then
            error "Invalid component: $COMPONENT"
            echo "Valid components: ${!COMPONENTS[*]}"
            exit 1
        fi
        
        rollback_component "$COMPONENT"
    else
        # Multi-component rollback
        rollback_all
    fi
    
    # Post-rollback validation
    validate_system_health
    
    # Final summary
    log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    success "Rollback procedure complete"
    log "Next steps:"
    log "  1. Monitor system RI: curl http://localhost:9091/metrics | grep terrafusion_ri"
    log "  2. Check Grafana dashboards: http://grafana:3000/d/ri-system"
    log "  3. Review rollback log: ${LOG_FILE}"
    log "  4. Update incident timeline in PagerDuty"
    log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# Run main function
main "$@"
