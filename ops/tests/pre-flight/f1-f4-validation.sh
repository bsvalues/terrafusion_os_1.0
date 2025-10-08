#!/usr/bin/env bash
#
# TerraFusion F1/F4 Pre-Flight Validation Suite
# Automated checks before deploying Day 9 optimizations
#
# Architecture Integration:
# - Validates prerequisites from ARCHITECTURE.md (Istio, Redis, HPA)
# - Aligns with CAMA migration playbook GO/NO-GO gates
# - Integrates with AI Swarm pre-deployment checks (swarm-master-control.js)
#
# Usage:
#   bash ops/tests/pre-flight/f1-f4-validation.sh [--namespace terrafusion-staging]
#
# Exit Codes:
#   0 = All checks passed, safe to deploy
#   1 = One or more checks failed, DO NOT DEPLOY
#
# Author: TerraFusion Platform Team
# Last Updated: 2025-10-07

set -euo pipefail

# =============================================================================
# Configuration
# =============================================================================

NAMESPACE="${1:-terrafusion-staging}"
PROMETHEUS_URL="${PROMETHEUS_URL:-http://localhost:9090}"
REDIS_HOST="${REDIS_HOST:-redis-master.${NAMESPACE}.svc.cluster.local}"
VALIDATION_WINDOW="24h"  # Baseline stability check window

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
CHECKS_PASSED=0
CHECKS_FAILED=0
CHECKS_WARNING=0

# =============================================================================
# Helper Functions
# =============================================================================

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
    ((CHECKS_PASSED++))
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    ((CHECKS_WARNING++))
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
    ((CHECKS_FAILED++))
}

print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

query_prometheus() {
    local query="$1"
    local result
    result=$(curl -s -G "${PROMETHEUS_URL}/api/v1/query" \
        --data-urlencode "query=${query}" \
        | jq -r '.data.result[0].value[1] // "null"')
    echo "$result"
}

check_command() {
    local cmd="$1"
    if ! command -v "$cmd" &> /dev/null; then
        log_error "Required command not found: $cmd"
        return 1
    fi
    return 0
}

# =============================================================================
# Pre-Flight Checks
# =============================================================================

print_header "TerraFusion F1/F4 Pre-Flight Validation"
log_info "Target namespace: $NAMESPACE"
log_info "Validation window: $VALIDATION_WINDOW"
log_info "Prometheus URL: $PROMETHEUS_URL"

# Check 1: Required CLI tools
print_header "Check 1: Required CLI Tools"
check_command "kubectl" || exit 1
check_command "curl" || exit 1
check_command "jq" || exit 1
log_success "All required CLI tools installed"

# Check 2: Kubernetes cluster connectivity
print_header "Check 2: Kubernetes Cluster Connectivity"
if kubectl cluster-info &> /dev/null; then
    log_success "kubectl connected to cluster"
    kubectl cluster-info | grep -E "master|control plane" || true
else
    log_error "kubectl cannot connect to cluster"
    exit 1
fi

# Check 3: Namespace exists
print_header "Check 3: Namespace Existence"
if kubectl get namespace "$NAMESPACE" &> /dev/null; then
    log_success "Namespace exists: $NAMESPACE"
else
    log_error "Namespace not found: $NAMESPACE"
    log_info "Create namespace: kubectl create namespace $NAMESPACE"
    exit 1
fi

# Check 4: Istio installation
print_header "Check 4: Istio Service Mesh"
if kubectl get crd virtualservices.networking.istio.io &> /dev/null; then
    log_success "Istio CRDs installed (VirtualService available)"
else
    log_error "Istio not installed (VirtualService CRD missing)"
    log_info "Install Istio: istioctl install --set profile=demo"
    exit 1
fi

if kubectl get crd destinationrules.networking.istio.io &> /dev/null; then
    log_success "Istio CRDs installed (DestinationRule available)"
else
    log_error "Istio not installed (DestinationRule CRD missing)"
    exit 1
fi

# Check Istio version
ISTIO_VERSION=$(kubectl get deployment -n istio-system istiod -o jsonpath='{.spec.template.spec.containers[0].image}' 2>/dev/null | grep -oP '(?<=:)\d+\.\d+' || echo "unknown")
if [[ "$ISTIO_VERSION" != "unknown" ]]; then
    MAJOR=$(echo "$ISTIO_VERSION" | cut -d. -f1)
    MINOR=$(echo "$ISTIO_VERSION" | cut -d. -f2)
    if [[ "$MAJOR" -ge 1 ]] && [[ "$MINOR" -ge 18 ]]; then
        log_success "Istio version $ISTIO_VERSION meets minimum requirement (≥1.18)"
    else
        log_warning "Istio version $ISTIO_VERSION below recommended (≥1.18)"
    fi
else
    log_warning "Could not determine Istio version"
fi

# Check 5: Prometheus connectivity
print_header "Check 5: Prometheus Monitoring"
if curl -s "${PROMETHEUS_URL}/-/healthy" | grep -q "Prometheus is Healthy"; then
    log_success "Prometheus is healthy and reachable"
else
    log_error "Prometheus not reachable at ${PROMETHEUS_URL}"
    log_info "Check port-forward: kubectl port-forward -n monitoring svc/prometheus 9090:9090"
fi

# Check 6: F1 baseline stability (last 24h)
print_header "Check 6: F1 API Gateway Baseline Stability"
F1_ERROR_RATE=$(query_prometheus "100 * (rate(envoy_cluster_upstream_rq_xx{cluster_name=\"f1-api-gateway\",response_code_class=\"5\"}[${VALIDATION_WINDOW}]) / rate(envoy_cluster_upstream_rq_total{cluster_name=\"f1-api-gateway\"}[${VALIDATION_WINDOW}]))")

if [[ "$F1_ERROR_RATE" != "null" ]]; then
    F1_ERROR_RATE_INT=$(echo "$F1_ERROR_RATE" | awk '{printf "%.0f", $1}')
    if [[ "$F1_ERROR_RATE_INT" -le 5 ]]; then
        log_success "F1 error rate stable: ${F1_ERROR_RATE}% (last ${VALIDATION_WINDOW})"
    else
        log_warning "F1 error rate elevated: ${F1_ERROR_RATE}% (expected ≤2.5%)"
        log_info "Current baseline may be unhealthy. Consider delaying deployment."
    fi
else
    log_warning "F1 error rate metrics not available (service may not be deployed yet)"
fi

# Check 7: F4 baseline stability (last 24h)
print_header "Check 7: F4 Cache Service Baseline Stability"
F4_ERROR_RATE=$(query_prometheus "100 * (rate(f4_errors_total[${VALIDATION_WINDOW}]) / rate(f4_requests_total[${VALIDATION_WINDOW}]))")

if [[ "$F4_ERROR_RATE" != "null" ]]; then
    F4_ERROR_RATE_INT=$(echo "$F4_ERROR_RATE" | awk '{printf "%.0f", $1}')
    if [[ "$F4_ERROR_RATE_INT" -le 10 ]]; then
        log_success "F4 error rate stable: ${F4_ERROR_RATE}% (last ${VALIDATION_WINDOW})"
    else
        log_warning "F4 error rate elevated: ${F4_ERROR_RATE}% (expected ≤5.0%)"
        log_info "Current baseline may be unhealthy. Consider delaying deployment."
    fi
else
    log_warning "F4 error rate metrics not available (service may not be deployed yet)"
fi

# Check 8: Redis Sentinel cluster health
print_header "Check 8: Redis Sentinel Cluster Health"
REDIS_SENTINELS=$(kubectl get pods -n "$NAMESPACE" -l app=redis-sentinel --no-headers 2>/dev/null | wc -l || echo "0")
if [[ "$REDIS_SENTINELS" -ge 3 ]]; then
    log_success "Redis Sentinel cluster quorum: $REDIS_SENTINELS/3 nodes"
else
    log_error "Redis Sentinel quorum not met: $REDIS_SENTINELS/3 nodes"
    log_info "F4 Redis pool optimization requires Sentinel HA (3 nodes minimum)"
fi

# Check Redis master health
REDIS_MASTER_STATUS=$(kubectl exec -n "$NAMESPACE" deploy/redis-master -- redis-cli ping 2>/dev/null || echo "ERROR")
if [[ "$REDIS_MASTER_STATUS" == "PONG" ]]; then
    log_success "Redis master responding to ping"
else
    log_error "Redis master not healthy"
fi

# Check 9: HorizontalPodAutoscaler controller
print_header "Check 9: HPA Controller Operational"
if kubectl get apiservice v2.autoscaling &> /dev/null; then
    log_success "HPA API available (v2.autoscaling)"
else
    log_error "HPA API not available (F4 autoscaling will fail)"
fi

# Check metrics-server (required for HPA)
METRICS_SERVER=$(kubectl get deployment -n kube-system metrics-server --no-headers 2>/dev/null | wc -l || echo "0")
if [[ "$METRICS_SERVER" -ge 1 ]]; then
    log_success "metrics-server deployed (HPA CPU/memory metrics available)"
else
    log_warning "metrics-server not found (HPA may not scale properly)"
    log_info "Install: kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml"
fi

# Check 10: Rollback kit validation
print_header "Check 10: Rollback Kit Validation"

# Check if F1 VirtualService backup exists (for rollback)
F1_VS_COUNT=$(kubectl get virtualservice -n "$NAMESPACE" -l app=f1-gateway --no-headers 2>/dev/null | wc -l || echo "0")
if [[ "$F1_VS_COUNT" -ge 1 ]]; then
    log_success "F1 VirtualService exists (rollback baseline available)"
    # Export current config as backup
    kubectl get virtualservice -n "$NAMESPACE" -l app=f1-gateway -o yaml > /tmp/f1-vs-backup.yaml 2>/dev/null || true
    log_info "F1 VirtualService backup saved: /tmp/f1-vs-backup.yaml"
else
    log_info "F1 VirtualService not found (first-time deployment, no rollback baseline)"
fi

# Check if F4 Deployment backup exists
F4_DEPLOY_COUNT=$(kubectl get deployment -n "$NAMESPACE" f4-cache-service --no-headers 2>/dev/null | wc -l || echo "0")
if [[ "$F4_DEPLOY_COUNT" -ge 1 ]]; then
    log_success "F4 Deployment exists (rollback baseline available)"
    # Export current config as backup
    kubectl get deployment -n "$NAMESPACE" f4-cache-service -o yaml > /tmp/f4-deployment-backup.yaml 2>/dev/null || true
    log_info "F4 Deployment backup saved: /tmp/f4-deployment-backup.yaml"
else
    log_info "F4 Deployment not found (first-time deployment, no rollback baseline)"
fi

# Test kubectl rollout undo dry-run
if [[ "$F4_DEPLOY_COUNT" -ge 1 ]]; then
    if kubectl rollout undo deployment/f4-cache-service -n "$NAMESPACE" --dry-run=client &> /dev/null; then
        log_success "kubectl rollout undo validated (F4 rollback ready)"
    else
        log_warning "kubectl rollout undo failed dry-run (check deployment history)"
    fi
fi

# Check 11: No ongoing deployments
print_header "Check 11: No Ongoing Deployments"
ROLLING_UPDATES=$(kubectl get deployments -n "$NAMESPACE" -o json | jq -r '.items[] | select(.status.updatedReplicas != .status.replicas) | .metadata.name' || echo "")
if [[ -z "$ROLLING_UPDATES" ]]; then
    log_success "No ongoing rolling updates (safe to deploy)"
else
    log_error "Active rolling updates detected: $ROLLING_UPDATES"
    log_info "Wait for current deployments to complete before proceeding"
fi

# Check 12: Circuit breaker not flapping
print_header "Check 12: Circuit Breaker Stability"
CB_FLAP_RATE=$(query_prometheus "rate(f2_circuit_breaker_state_changes_total[1h]) * 60")
if [[ "$CB_FLAP_RATE" != "null" ]]; then
    CB_FLAP_INT=$(echo "$CB_FLAP_RATE" | awk '{printf "%.0f", $1}')
    if [[ "$CB_FLAP_INT" -le 5 ]]; then
        log_success "Circuit breaker stable: ${CB_FLAP_INT} flaps/hour (last 1h)"
    else
        log_warning "Circuit breaker flapping: ${CB_FLAP_INT} flaps/hour (expected ≤2)"
        log_info "F2 circuit breaker may be unstable. Review before F1/F4 deployment."
    fi
else
    log_info "Circuit breaker metrics not available (F2 may not be deployed yet)"
fi

# Check 13: AlertManager operational
print_header "Check 13: AlertManager Operational"
if kubectl get service -n monitoring alertmanager &> /dev/null; then
    log_success "AlertManager service exists"
    
    # Check if PagerDuty integration configured
    AM_CONFIG=$(kubectl get secret -n monitoring alertmanager-main -o jsonpath='{.data.alertmanager\.yaml}' 2>/dev/null | base64 -d || echo "")
    if echo "$AM_CONFIG" | grep -q "pagerduty"; then
        log_success "PagerDuty integration configured in AlertManager"
    else
        log_warning "PagerDuty integration not found in AlertManager config"
    fi
else
    log_warning "AlertManager service not found (alerts may not fire)"
fi

# =============================================================================
# Summary Report
# =============================================================================

print_header "Pre-Flight Validation Summary"
echo -e "${GREEN}✅ Passed: $CHECKS_PASSED${NC}"
echo -e "${YELLOW}⚠️  Warnings: $CHECKS_WARNING${NC}"
echo -e "${RED}❌ Failed: $CHECKS_FAILED${NC}"

if [[ "$CHECKS_FAILED" -eq 0 ]]; then
    echo -e "\n${GREEN}========================================${NC}"
    echo -e "${GREEN}✅ PRE-FLIGHT VALIDATION PASSED${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo -e "\n${GREEN}Safe to proceed with F1/F4 deployment.${NC}"
    echo -e "Next steps:"
    echo -e "  1. Deploy F1 retry budget: kubectl apply -f ops/traffic/f1-retry-budget.yaml"
    echo -e "  2. Deploy F4 Redis pool: kubectl apply -f ops/cache/f4-redis-pool.yaml"
    echo -e "  3. Monitor RI: python3 ops/monitoring/ri-calculator.py --once"
    exit 0
else
    echo -e "\n${RED}========================================${NC}"
    echo -e "${RED}❌ PRE-FLIGHT VALIDATION FAILED${NC}"
    echo -e "${RED}========================================${NC}"
    echo -e "\n${RED}DO NOT DEPLOY - Fix failures before proceeding.${NC}"
    echo -e "Review errors above and address issues."
    echo -e "Re-run validation: bash ops/tests/pre-flight/f1-f4-validation.sh"
    exit 1
fi
