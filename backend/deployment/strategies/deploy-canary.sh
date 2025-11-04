#!/bin/bash
# ============================================================================
# TerraFusion Platform - Canary Deployment Script (Flagger Integration)
# Government. Transcended. - Progressive Traffic Shifting with Automated Rollback
# ============================================================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
NAMESPACE="${NAMESPACE:-terrafusion}"
SERVICE="${SERVICE:-terrafusion-api}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
REGISTRY="${REGISTRY:-ghcr.io/terrafusion}"
CANARY_WEIGHT_START="${CANARY_WEIGHT_START:-10}"
CANARY_WEIGHT_INCREMENT="${CANARY_WEIGHT_INCREMENT:-10}"
CANARY_WEIGHT_MAX="${CANARY_WEIGHT_MAX:-50}"
ANALYSIS_INTERVAL="${ANALYSIS_INTERVAL:-60}"
SUCCESS_THRESHOLD="${SUCCESS_THRESHOLD:-3}"
ERROR_THRESHOLD="${ERROR_THRESHOLD:-5}"

# Logging functions
log_info() { echo -e "${CYAN}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() {
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Display banner
display_banner() {
    echo -e "${CYAN}"
    echo "╔════════════════════════════════════════════════════════════════════════╗"
    echo "║                                                                        ║"
    echo "║         🏛️  TERRAFUSION CANARY DEPLOYMENT                            ║"
    echo "║         Progressive Traffic Shifting with Automated Analysis          ║"
    echo "║                                                                        ║"
    echo "╚════════════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Check prerequisites
check_prerequisites() {
    log_step "Checking Prerequisites"
    
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl not found"
        exit 1
    fi
    
    if ! command -v flagger &> /dev/null; then
        log_warning "flagger CLI not found (optional)"
    fi
    
    # Check Flagger installation
    if ! kubectl get crd canaries.flagger.app &> /dev/null; then
        log_error "Flagger CRD not found. Install Flagger first:"
        echo "  kubectl apply -k github.com/fluxcd/flagger//kustomize/linkerd"
        exit 1
    fi
    
    log_success "All prerequisites met"
}

# Create or update Flagger canary
deploy_canary() {
    log_step "Deploying Canary Configuration"
    
    cat <<EOF | kubectl apply -f -
apiVersion: flagger.app/v1beta1
kind: Canary
metadata:
  name: ${SERVICE}
  namespace: ${NAMESPACE}
spec:
  # Deployment reference
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ${SERVICE}
  
  # Progressive delivery
  progressDeadlineSeconds: 600
  
  # Service configuration
  service:
    port: 5000
    targetPort: 5000
    name: ${SERVICE}
    portDiscovery: true
  
  # Canary analysis
  analysis:
    # Schedule interval (default 60s)
    interval: ${ANALYSIS_INTERVAL}s
    
    # Max number of failed metric checks before rollback
    threshold: ${ERROR_THRESHOLD}
    
    # Max traffic percentage routed to canary
    maxWeight: ${CANARY_WEIGHT_MAX}
    
    # Canary increment step
    stepWeight: ${CANARY_WEIGHT_INCREMENT}
    
    # Prometheus metrics
    metrics:
    - name: request-success-rate
      thresholdRange:
        min: 99
      interval: 1m
      
    - name: request-duration
      thresholdRange:
        max: 500
      interval: 1m
    
    - name: error-rate
      thresholdRange:
        max: 1
      interval: 1m
    
    # Webhook tests (optional)
    webhooks:
    - name: smoke-test
      type: pre-rollout
      url: http://flagger-loadtester.${NAMESPACE}/
      timeout: 5s
      metadata:
        type: bash
        cmd: "curl -sd 'test' http://${SERVICE}-canary.${NAMESPACE}:5000/health | grep -q healthy"
    
    - name: load-test
      type: rollout
      url: http://flagger-loadtester.${NAMESPACE}/
      metadata:
        cmd: "hey -z 1m -q 10 -c 2 http://${SERVICE}-canary.${NAMESPACE}:5000/"
    
    - name: alert
      type: post-rollout
      url: https://hooks.terrafusion.gov/canary
      timeout: 5s
      metadata:
        message: "Canary deployment of ${SERVICE}:${IMAGE_TAG}"
EOF
    
    log_success "Canary configuration deployed"
}

# Update deployment image
update_deployment_image() {
    log_step "Updating Deployment Image"
    
    kubectl set image deployment/${SERVICE} \
        ${SERVICE}=${REGISTRY}/${SERVICE}:${IMAGE_TAG} \
        -n ${NAMESPACE}
    
    log_success "Deployment image updated to ${IMAGE_TAG}"
}

# Monitor canary analysis
monitor_canary() {
    log_step "Monitoring Canary Analysis"
    
    log_info "Watching canary progress..."
    log_info "Press Ctrl+C to stop monitoring (deployment will continue)"
    echo ""
    
    local last_phase=""
    local last_weight=0
    local success_count=0
    
    while true; do
        # Get canary status
        local canary_info=$(kubectl get canary ${SERVICE} -n ${NAMESPACE} \
            -o jsonpath='{.status.phase},{.status.canaryWeight},{.status.iterations},{.status.failedChecks}')
        
        IFS=',' read -r phase weight iterations failed_checks <<< "$canary_info"
        
        # Check if canary exists
        if [[ -z "$phase" ]]; then
            log_error "Canary not found"
            return 1
        fi
        
        # Display status if changed
        if [[ "$phase" != "$last_phase" ]] || [[ "$weight" != "$last_weight" ]]; then
            case "$phase" in
                "Initializing")
                    log_info "Phase: Initializing canary deployment"
                    ;;
                "Progressing")
                    log_info "Phase: Progressing - Traffic: ${weight}% to canary"
                    ;;
                "WaitingPromotion")
                    log_success "Phase: Waiting promotion - All metrics passed!"
                    ;;
                "Promoting")
                    log_success "Phase: Promoting canary to primary"
                    ;;
                "Finalising")
                    log_success "Phase: Finalizing deployment"
                    ;;
                "Succeeded")
                    log_success "Phase: Deployment succeeded! 🎉"
                    success_count=$((success_count + 1))
                    if [[ $success_count -ge ${SUCCESS_THRESHOLD} ]]; then
                        return 0
                    fi
                    ;;
                "Failed")
                    log_error "Phase: Deployment failed - Automatic rollback initiated"
                    return 1
                    ;;
                *)
                    log_warning "Phase: $phase"
                    ;;
            esac
            
            if [[ "$failed_checks" -gt 0 ]]; then
                log_warning "Failed metric checks: ${failed_checks}/${ERROR_THRESHOLD}"
            fi
            
            last_phase="$phase"
            last_weight="$weight"
        fi
        
        # Exit if succeeded
        if [[ "$phase" == "Succeeded" ]] && [[ $success_count -ge ${SUCCESS_THRESHOLD} ]]; then
            break
        fi
        
        # Exit if failed
        if [[ "$phase" == "Failed" ]]; then
            break
        fi
        
        sleep 10
    done
}

# Get canary metrics
get_canary_metrics() {
    log_step "Canary Deployment Metrics"
    
    local canary_status=$(kubectl get canary ${SERVICE} -n ${NAMESPACE} -o json)
    
    echo "$canary_status" | jq -r '
        "Status: \(.status.phase)",
        "Canary Weight: \(.status.canaryWeight)%",
        "Iterations: \(.status.iterations)",
        "Failed Checks: \(.status.failedChecks)",
        "Last Transition: \(.status.lastTransitionTime)"
    '
    
    echo ""
    log_info "Metric Results:"
    echo "$canary_status" | jq -r '.status.conditions[] | 
        "  \(.type): \(.status) - \(.message)"'
}

# Promote canary manually
promote_canary() {
    log_step "Manual Canary Promotion"
    
    log_warning "Manually promoting canary to 100% traffic"
    
    kubectl patch canary ${SERVICE} -n ${NAMESPACE} --type=json \
        -p='[{"op": "replace", "path": "/spec/analysis/maxWeight", "value": 100}]'
    
    log_success "Canary promotion initiated"
}

# Rollback canary
rollback_canary() {
    log_step "Rolling Back Canary"
    
    log_error "Initiating canary rollback..."
    
    # Trigger rollback by updating deployment with previous image
    log_info "Reverting to previous image..."
    kubectl rollout undo deployment/${SERVICE} -n ${NAMESPACE}
    
    # Wait for rollback
    kubectl rollout status deployment/${SERVICE} -n ${NAMESPACE}
    
    log_success "Canary rolled back successfully"
}

# Main deployment flow
main() {
    display_banner
    
    log_info "Service: ${SERVICE}"
    log_info "Namespace: ${NAMESPACE}"
    log_info "Image: ${REGISTRY}/${SERVICE}:${IMAGE_TAG}"
    log_info "Canary Start Weight: ${CANARY_WEIGHT_START}%"
    log_info "Canary Max Weight: ${CANARY_WEIGHT_MAX}%"
    log_info "Analysis Interval: ${ANALYSIS_INTERVAL}s"
    echo ""
    
    # Check prerequisites
    check_prerequisites
    
    # Deploy canary configuration
    deploy_canary
    
    # Update deployment image (triggers canary analysis)
    update_deployment_image
    
    # Monitor canary progress
    if monitor_canary; then
        log_success "Canary deployment completed successfully!"
        
        # Get final metrics
        get_canary_metrics
        
        echo ""
        log_step "🎉 Canary Deployment Complete"
        log_success "Service: ${SERVICE}"
        log_success "Image: ${REGISTRY}/${SERVICE}:${IMAGE_TAG}"
        log_success "Status: All traffic routed to new version"
        echo ""
        log_info "Government. Transcended. - Progressive delivery excellence! 🏛️"
    else
        log_error "Canary deployment failed"
        
        # Get failure metrics
        get_canary_metrics
        
        # Rollback
        rollback_canary
        
        exit 1
    fi
}

# Run main function
main "$@"
