#!/bin/bash
# ============================================================================
# TerraFusion Platform - Blue-Green Deployment Script
# Government. Transcended. - Zero-Downtime Deployment Strategy
# ============================================================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE="${NAMESPACE:-terrafusion}"
SERVICE="${SERVICE:-terrafusion-api}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
REGISTRY="${REGISTRY:-ghcr.io/terrafusion}"
HEALTH_CHECK_RETRIES="${HEALTH_CHECK_RETRIES:-30}"
HEALTH_CHECK_INTERVAL="${HEALTH_CHECK_INTERVAL:-10}"
TRAFFIC_SWITCH_DELAY="${TRAFFIC_SWITCH_DELAY:-30}"

# Logging functions
log_info() {
    echo -e "${CYAN}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

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
    echo "║         🏛️  TERRAFUSION BLUE-GREEN DEPLOYMENT                        ║"
    echo "║              Government. Transcended. - Zero Downtime                  ║"
    echo "║                                                                        ║"
    echo "╚════════════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Check prerequisites
check_prerequisites() {
    log_step "Checking Prerequisites"
    
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl not found. Please install kubectl."
        exit 1
    fi
    
    if ! command -v helm &> /dev/null; then
        log_error "helm not found. Please install helm."
        exit 1
    fi
    
    # Check cluster connectivity
    if ! kubectl cluster-info &> /dev/null; then
        log_error "Cannot connect to Kubernetes cluster"
        exit 1
    fi
    
    log_success "All prerequisites met"
}

# Determine current active environment (blue or green)
get_active_environment() {
    log_step "Determining Active Environment"
    
    local service_selector=$(kubectl get service "${SERVICE}" -n "${NAMESPACE}" \
        -o jsonpath='{.spec.selector.version}' 2>/dev/null || echo "blue")
    
    if [[ "$service_selector" == "green" ]]; then
        echo "green"
    else
        echo "blue"
    fi
}

# Get inactive environment
get_inactive_environment() {
    local active=$1
    if [[ "$active" == "blue" ]]; then
        echo "green"
    else
        echo "blue"
    fi
}

# Deploy to inactive environment
deploy_inactive_environment() {
    local inactive=$1
    log_step "Deploying to $inactive Environment"
    
    local deployment_name="${SERVICE}-${inactive}"
    
    # Check if deployment exists
    if kubectl get deployment "${deployment_name}" -n "${NAMESPACE}" &> /dev/null; then
        log_info "Updating existing ${inactive} deployment"
        kubectl set image deployment/"${deployment_name}" \
            "${SERVICE}=${REGISTRY}/${SERVICE}:${IMAGE_TAG}" \
            -n "${NAMESPACE}"
    else
        log_info "Creating new ${inactive} deployment"
        
        # Create deployment manifest
        cat <<EOF | kubectl apply -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${deployment_name}
  namespace: ${NAMESPACE}
  labels:
    app: ${SERVICE}
    version: ${inactive}
    terrafusion.io/deployment-strategy: blue-green
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ${SERVICE}
      version: ${inactive}
  template:
    metadata:
      labels:
        app: ${SERVICE}
        version: ${inactive}
    spec:
      containers:
      - name: ${SERVICE}
        image: ${REGISTRY}/${SERVICE}:${IMAGE_TAG}
        ports:
        - containerPort: 5000
          name: http
        - containerPort: 8080
          name: metrics
        env:
        - name: ENVIRONMENT
          value: "${inactive}"
        - name: VERSION
          value: "${IMAGE_TAG}"
        livenessProbe:
          httpGet:
            path: /health
            port: 5000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 5000
          initialDelaySeconds: 10
          periodSeconds: 5
        resources:
          requests:
            cpu: 2000m
            memory: 8Gi
          limits:
            cpu: 8000m
            memory: 32Gi
EOF
    fi
    
    log_success "Deployment to ${inactive} environment initiated"
}

# Wait for deployment rollout
wait_for_rollout() {
    local environment=$1
    log_step "Waiting for $environment Deployment Rollout"
    
    local deployment_name="${SERVICE}-${environment}"
    
    if kubectl rollout status deployment/"${deployment_name}" -n "${NAMESPACE}" --timeout=600s; then
        log_success "${environment} deployment rolled out successfully"
        return 0
    else
        log_error "${environment} deployment rollout failed"
        return 1
    fi
}

# Health check on inactive environment
health_check() {
    local environment=$1
    log_step "Running Health Checks on $environment Environment"
    
    local deployment_name="${SERVICE}-${environment}"
    local pod_name=$(kubectl get pods -n "${NAMESPACE}" \
        -l "app=${SERVICE},version=${environment}" \
        -o jsonpath='{.items[0].metadata.name}')
    
    if [[ -z "$pod_name" ]]; then
        log_error "No pods found for ${environment} environment"
        return 1
    fi
    
    log_info "Testing pod: $pod_name"
    
    # Retry health check
    for i in $(seq 1 "${HEALTH_CHECK_RETRIES}"); do
        log_info "Health check attempt $i/${HEALTH_CHECK_RETRIES}"
        
        if kubectl exec -n "${NAMESPACE}" "${pod_name}" -- \
            curl -f -s http://localhost:5000/health > /dev/null 2>&1; then
            log_success "Health check passed on ${environment} environment"
            return 0
        fi
        
        sleep "${HEALTH_CHECK_INTERVAL}"
    done
    
    log_error "Health checks failed after ${HEALTH_CHECK_RETRIES} attempts"
    return 1
}

# Run smoke tests
run_smoke_tests() {
    local environment=$1
    log_step "Running Smoke Tests on $environment Environment"
    
    local pod_name=$(kubectl get pods -n "${NAMESPACE}" \
        -l "app=${SERVICE},version=${environment}" \
        -o jsonpath='{.items[0].metadata.name}')
    
    # Test API endpoints
    log_info "Testing critical API endpoints"
    
    # Health endpoint
    if ! kubectl exec -n "${NAMESPACE}" "${pod_name}" -- \
        curl -f -s http://localhost:5000/health > /dev/null; then
        log_error "Health endpoint test failed"
        return 1
    fi
    log_success "✓ Health endpoint"
    
    # Metrics endpoint
    if ! kubectl exec -n "${NAMESPACE}" "${pod_name}" -- \
        curl -f -s http://localhost:8080/metrics > /dev/null; then
        log_error "Metrics endpoint test failed"
        return 1
    fi
    log_success "✓ Metrics endpoint"
    
    # API version endpoint
    if ! kubectl exec -n "${NAMESPACE}" "${pod_name}" -- \
        curl -f -s http://localhost:5000/api/version > /dev/null; then
        log_error "API version endpoint test failed"
        return 1
    fi
    log_success "✓ API version endpoint"
    
    log_success "All smoke tests passed"
    return 0
}

# Switch traffic to inactive environment
switch_traffic() {
    local target_environment=$1
    log_step "Switching Traffic to $target_environment Environment"
    
    log_warning "Traffic will be switched in ${TRAFFIC_SWITCH_DELAY} seconds"
    log_info "Press Ctrl+C to abort..."
    sleep "${TRAFFIC_SWITCH_DELAY}"
    
    # Update service selector
    kubectl patch service "${SERVICE}" -n "${NAMESPACE}" -p \
        "{\"spec\":{\"selector\":{\"app\":\"${SERVICE}\",\"version\":\"${target_environment}\"}}}"
    
    log_success "Traffic switched to ${target_environment} environment"
    
    # Wait for service to update
    sleep 5
    
    # Verify traffic routing
    local current_version=$(kubectl get service "${SERVICE}" -n "${NAMESPACE}" \
        -o jsonpath='{.spec.selector.version}')
    
    if [[ "$current_version" == "$target_environment" ]]; then
        log_success "Service routing verified: ${target_environment}"
    else
        log_error "Service routing verification failed"
        return 1
    fi
}

# Monitor new environment
monitor_environment() {
    local environment=$1
    log_step "Monitoring $environment Environment"
    
    log_info "Monitoring for 60 seconds..."
    
    local start_time=$(date +%s)
    local error_count=0
    
    while [[ $(($(date +%s) - start_time)) -lt 60 ]]; do
        # Check pod status
        local pod_status=$(kubectl get pods -n "${NAMESPACE}" \
            -l "app=${SERVICE},version=${environment}" \
            -o jsonpath='{.items[*].status.phase}')
        
        if [[ "$pod_status" != *"Running"* ]]; then
            ((error_count++))
            log_warning "Pod status issue detected (${error_count}/3)"
            
            if [[ $error_count -ge 3 ]]; then
                log_error "Multiple pod failures detected"
                return 1
            fi
        else
            error_count=0
        fi
        
        sleep 5
    done
    
    log_success "Monitoring completed successfully"
    return 0
}

# Scale down old environment
scale_down_old_environment() {
    local old_environment=$1
    log_step "Scaling Down $old_environment Environment"
    
    local deployment_name="${SERVICE}-${old_environment}"
    
    log_info "Scaling ${old_environment} deployment to 0 replicas"
    kubectl scale deployment/"${deployment_name}" \
        --replicas=0 -n "${NAMESPACE}"
    
    log_success "${old_environment} environment scaled down"
}

# Cleanup old environment (optional)
cleanup_old_environment() {
    local old_environment=$1
    log_step "Cleanup $old_environment Environment (Optional)"
    
    read -p "Do you want to delete the ${old_environment} deployment? (y/N): " -r
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        local deployment_name="${SERVICE}-${old_environment}"
        kubectl delete deployment "${deployment_name}" -n "${NAMESPACE}"
        log_success "${old_environment} deployment deleted"
    else
        log_info "Keeping ${old_environment} deployment for potential rollback"
    fi
}

# Rollback to previous environment
rollback() {
    local previous_environment=$1
    log_step "Rolling Back to $previous_environment Environment"
    
    log_error "Deployment issues detected. Initiating rollback..."
    
    # Switch traffic back
    kubectl patch service "${SERVICE}" -n "${NAMESPACE}" -p \
        "{\"spec\":{\"selector\":{\"app\":\"${SERVICE}\",\"version\":\"${previous_environment}\"}}}"
    
    log_success "Traffic switched back to ${previous_environment}"
    
    # Scale up previous environment if needed
    local deployment_name="${SERVICE}-${previous_environment}"
    local replicas=$(kubectl get deployment "${deployment_name}" -n "${NAMESPACE}" \
        -o jsonpath='{.spec.replicas}')
    
    if [[ "$replicas" -eq 0 ]]; then
        kubectl scale deployment/"${deployment_name}" --replicas=3 -n "${NAMESPACE}"
        kubectl rollout status deployment/"${deployment_name}" -n "${NAMESPACE}"
    fi
    
    log_success "Rollback completed"
    exit 1
}

# Main deployment flow
main() {
    display_banner
    
    log_info "Service: ${SERVICE}"
    log_info "Namespace: ${NAMESPACE}"
    log_info "Image: ${REGISTRY}/${SERVICE}:${IMAGE_TAG}"
    echo ""
    
    # Check prerequisites
    check_prerequisites
    
    # Determine environments
    local active_env=$(get_active_environment)
    local inactive_env=$(get_inactive_environment "$active_env")
    
    log_info "Active environment: ${active_env}"
    log_info "Target environment: ${inactive_env}"
    echo ""
    
    # Deploy to inactive environment
    deploy_inactive_environment "$inactive_env"
    
    # Wait for rollout
    if ! wait_for_rollout "$inactive_env"; then
        log_error "Deployment rollout failed"
        exit 1
    fi
    
    # Health checks
    if ! health_check "$inactive_env"; then
        log_error "Health checks failed"
        rollback "$active_env"
    fi
    
    # Smoke tests
    if ! run_smoke_tests "$inactive_env"; then
        log_error "Smoke tests failed"
        rollback "$active_env"
    fi
    
    # Switch traffic
    if ! switch_traffic "$inactive_env"; then
        log_error "Traffic switch failed"
        rollback "$active_env"
    fi
    
    # Monitor new environment
    if ! monitor_environment "$inactive_env"; then
        log_error "Monitoring detected issues"
        rollback "$active_env"
    fi
    
    # Scale down old environment
    scale_down_old_environment "$active_env"
    
    # Optional cleanup
    cleanup_old_environment "$active_env"
    
    # Success
    echo ""
    log_step "🎉 Blue-Green Deployment Complete"
    log_success "Service: ${SERVICE}"
    log_success "Active environment: ${inactive_env}"
    log_success "Image: ${REGISTRY}/${SERVICE}:${IMAGE_TAG}"
    echo ""
    log_info "Government. Transcended. - Deployment excellence achieved! 🏛️"
}

# Run main function
main "$@"
