#!/bin/bash
# ============================================================================
# TerraFusion Platform - Rollback Script
# Government. Transcended. - Safe Rollback to Previous Deployment
# ============================================================================

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
NAMESPACE="${NAMESPACE:-terrafusion}"
SERVICE="${SERVICE:-terrafusion-api}"
REVISION="${REVISION:-}"
AUTO_CONFIRM="${AUTO_CONFIRM:-false}"

# Logging
log_info() { echo -e "${CYAN}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() {
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

display_banner() {
    echo -e "${CYAN}"
    echo "╔════════════════════════════════════════════════════════════════════════╗"
    echo "║                                                                        ║"
    echo "║         🏛️  TERRAFUSION DEPLOYMENT ROLLBACK                          ║"
    echo "║              Government. Transcended. - Safe Recovery                  ║"
    echo "║                                                                        ║"
    echo "╚════════════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

check_prerequisites() {
    log_step "Checking Prerequisites"
    
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl not found"
        exit 1
    fi
    
    if ! kubectl cluster-info &> /dev/null; then
        log_error "Cannot connect to Kubernetes cluster"
        exit 1
    fi
    
    log_success "Prerequisites met"
}

show_rollout_history() {
    log_step "Deployment History"
    
    kubectl rollout history deployment/${SERVICE} -n ${NAMESPACE}
    echo ""
}

get_current_revision() {
    kubectl get deployment ${SERVICE} -n ${NAMESPACE} \
        -o jsonpath='{.metadata.annotations.deployment\.kubernetes\.io/revision}'
}

get_revision_details() {
    local revision=$1
    
    log_info "Revision ${revision} details:"
    kubectl rollout history deployment/${SERVICE} -n ${NAMESPACE} --revision=${revision}
    echo ""
}

confirm_rollback() {
    local target_revision=$1
    
    if [[ "${AUTO_CONFIRM}" == "true" ]]; then
        return 0
    fi
    
    echo -e "${YELLOW}"
    echo "⚠️  WARNING: This will rollback the deployment!"
    echo "   Service: ${SERVICE}"
    echo "   Namespace: ${NAMESPACE}"
    echo "   Target Revision: ${target_revision}"
    echo -e "${NC}"
    
    read -p "Are you sure you want to proceed? (yes/no): " -r
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        log_info "Rollback cancelled"
        exit 0
    fi
}

perform_rollback() {
    local revision=$1
    log_step "Rolling Back Deployment"
    
    if [[ -n "$revision" ]]; then
        log_info "Rolling back to revision ${revision}"
        kubectl rollout undo deployment/${SERVICE} -n ${NAMESPACE} --to-revision=${revision}
    else
        log_info "Rolling back to previous revision"
        kubectl rollout undo deployment/${SERVICE} -n ${NAMESPACE}
    fi
}

wait_for_rollback() {
    log_step "Waiting for Rollback Completion"
    
    if kubectl rollout status deployment/${SERVICE} -n ${NAMESPACE} --timeout=600s; then
        log_success "Rollback completed successfully"
        return 0
    else
        log_error "Rollback timed out or failed"
        return 1
    fi
}

verify_rollback() {
    log_step "Verifying Rollback"
    
    local current_revision=$(get_current_revision)
    log_info "Current revision: ${current_revision}"
    
    # Check pod status
    local ready_pods=$(kubectl get deployment ${SERVICE} -n ${NAMESPACE} \
        -o jsonpath='{.status.readyReplicas}')
    local desired_pods=$(kubectl get deployment ${SERVICE} -n ${NAMESPACE} \
        -o jsonpath='{.spec.replicas}')
    
    log_info "Ready pods: ${ready_pods}/${desired_pods}"
    
    if [[ "$ready_pods" == "$desired_pods" ]]; then
        log_success "All pods are ready"
    else
        log_warning "Not all pods are ready yet"
    fi
    
    # Run health check
    log_info "Running health check..."
    local pod_name=$(kubectl get pods -n ${NAMESPACE} -l app=${SERVICE} \
        -o jsonpath='{.items[0].metadata.name}')
    
    if kubectl exec -n ${NAMESPACE} ${pod_name} -- \
        curl -f -s http://localhost:5000/health > /dev/null 2>&1; then
        log_success "Health check passed"
    else
        log_warning "Health check failed"
    fi
}

get_pod_events() {
    log_step "Recent Pod Events"
    
    kubectl get events -n ${NAMESPACE} \
        --field-selector involvedObject.kind=Pod \
        --sort-by='.lastTimestamp' \
        | tail -20
}

main() {
    display_banner
    
    log_info "Service: ${SERVICE}"
    log_info "Namespace: ${NAMESPACE}"
    echo ""
    
    check_prerequisites
    show_rollout_history
    
    local current_rev=$(get_current_revision)
    log_info "Current revision: ${current_rev}"
    echo ""
    
    # Determine target revision
    local target_revision=""
    if [[ -n "${REVISION}" ]]; then
        target_revision="${REVISION}"
        log_info "Target revision: ${target_revision} (specified)"
    else
        target_revision=$((current_rev - 1))
        log_info "Target revision: ${target_revision} (previous)"
    fi
    
    # Show target revision details
    get_revision_details ${target_revision}
    
    # Confirm
    confirm_rollback ${target_revision}
    
    # Perform rollback
    perform_rollback ${target_revision}
    
    # Wait for completion
    if ! wait_for_rollback; then
        log_error "Rollback failed"
        get_pod_events
        exit 1
    fi
    
    # Verify
    verify_rollback
    
    echo ""
    log_step "🎉 Rollback Complete"
    log_success "Service: ${SERVICE}"
    log_success "Revision: ${target_revision}"
    echo ""
    log_info "Government. Transcended. - Safe recovery achieved! 🏛️"
}

main "$@"
