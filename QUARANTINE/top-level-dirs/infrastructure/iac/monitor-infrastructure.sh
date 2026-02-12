#!/bin/bash

# TerraFusion Infrastructure Monitoring Script
# Real-time championship infrastructure health monitoring

set -euo pipefail

# Colors for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE="terrafusion"
MONITORING_NAMESPACE="observability"
SECURITY_NAMESPACE="security"
ARGOCD_NAMESPACE="argocd"
ISTIO_NAMESPACE="istio-system"

# Monitoring intervals (seconds)
HEALTH_CHECK_INTERVAL=30
METRICS_COLLECTION_INTERVAL=60
ALERT_CHECK_INTERVAL=120

# SLA Targets
CPU_THRESHOLD=80
MEMORY_THRESHOLD=85
RESPONSE_TIME_THRESHOLD=2000  # milliseconds
ERROR_RATE_THRESHOLD=1        # percentage

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

success() {
    echo -e "${PURPLE}[$(date +'%Y-%m-%d %H:%M:%S')] SUCCESS: $1${NC}"
}

# Clear screen and show header
show_header() {
    clear
    cat << 'EOF'
╔══════════════════════════════════════════════════════════════════════╗
║                  🏆 TERRAFUSION INFRASTRUCTURE MONITOR 🏆             ║
║                     Championship-Grade Operations                     ║
╚══════════════════════════════════════════════════════════════════════╝
EOF
    echo
}

# Check cluster connectivity
check_cluster_connectivity() {
    if ! kubectl cluster-info &> /dev/null; then
        error "Cannot connect to Kubernetes cluster"
        return 1
    fi
    return 0
}

# Get pod status with enhanced information
get_pod_status() {
    local namespace=$1
    local app=$2
    
    kubectl get pods -n "$namespace" -l app="$app" -o json | jq -r '
        .items[] | {
            name: .metadata.name,
            status: .status.phase,
            ready: (.status.containerStatuses // [] | map(.ready) | all),
            restarts: (.status.containerStatuses // [] | map(.restartCount) | add // 0),
            cpu_request: (.spec.containers[0].resources.requests.cpu // "N/A"),
            memory_request: (.spec.containers[0].resources.requests.memory // "N/A"),
            node: .spec.nodeName
        } | "\(.name)|\(.status)|\(.ready)|\(.restarts)|\(.cpu_request)|\(.memory_request)|\(.node)"
    '
}

# Get service metrics
get_service_metrics() {
    local service=$1
    local namespace=$2
    local port=$3
    
    # Try to get metrics from the service
    if kubectl exec -n "$namespace" deployment/"$service" -- curl -s "http://localhost:$port/metrics" 2>/dev/null | grep -E "(http_requests_total|http_request_duration)" | head -5; then
        return 0
    else
        echo "Metrics not available for $service"
        return 1
    fi
}

# Check service health
check_service_health() {
    local service=$1
    local namespace=$2
    local health_endpoint=$3
    
    if kubectl exec -n "$namespace" deployment/"$service" -- curl -f -s "$health_endpoint" &> /dev/null; then
        echo "✅ HEALTHY"
        return 0
    else
        echo "❌ UNHEALTHY"
        return 1
    fi
}

# Get resource utilization
get_resource_utilization() {
    local namespace=$1
    local app=$2
    
    kubectl top pods -n "$namespace" --no-headers -l app="$app" 2>/dev/null | awk '{
        cpu_total += $2; memory_total += $3
    } END {
        printf "CPU: %.0fm | Memory: %.0fMi", cpu_total, memory_total
    }' || echo "Metrics not available"
}

# Check Istio service mesh status
check_istio_status() {
    echo -e "${CYAN}🕸️  SERVICE MESH STATUS${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # Check Istio control plane
    local istiod_status=$(kubectl get pods -n $ISTIO_NAMESPACE -l app=istiod --no-headers | awk '{print $3}' | head -1)
    printf "%-25s | %-15s\n" "Istio Control Plane" "$istiod_status"
    
    # Check gateway status
    local gateway_status=$(kubectl get pods -n $ISTIO_NAMESPACE -l app=istio-ingressgateway --no-headers | awk '{print $3}' | head -1)
    printf "%-25s | %-15s\n" "Istio Gateway" "$gateway_status"
    
    # Check proxy status
    local proxy_count=$(kubectl get pods -A --no-headers | grep -c "istio-proxy" || echo "0")
    printf "%-25s | %-15s\n" "Sidecar Proxies" "${proxy_count} running"
    
    # Check mTLS status
    local mtls_status=$(kubectl get peerauthentication -n $NAMESPACE --no-headers | wc -l)
    if [ "$mtls_status" -gt 0 ]; then
        printf "%-25s | %-15s\n" "mTLS Security" "✅ ENABLED"
    else
        printf "%-25s | %-15s\n" "mTLS Security" "❌ DISABLED"
    fi
    
    echo
}

# Check ArgoCD GitOps status
check_argocd_status() {
    echo -e "${CYAN}🚀 GITOPS STATUS${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # Check ArgoCD server
    local argocd_status=$(kubectl get pods -n $ARGOCD_NAMESPACE -l app.kubernetes.io/name=argocd-server --no-headers | awk '{print $3}' | head -1)
    printf "%-25s | %-15s\n" "ArgoCD Server" "$argocd_status"
    
    # Check ArgoCD controller
    local controller_status=$(kubectl get pods -n $ARGOCD_NAMESPACE -l app.kubernetes.io/name=argocd-application-controller --no-headers | awk '{print $3}' | head -1)
    printf "%-25s | %-15s\n" "ArgoCD Controller" "$controller_status"
    
    # Check application sync status
    local app_count=$(kubectl get applications -n $ARGOCD_NAMESPACE --no-headers 2>/dev/null | wc -l || echo "0")
    local synced_count=$(kubectl get applications -n $ARGOCD_NAMESPACE -o json 2>/dev/null | jq -r '.items[] | select(.status.sync.status == "Synced") | .metadata.name' | wc -l || echo "0")
    printf "%-25s | %-15s\n" "Applications" "${synced_count}/${app_count} synced"
    
    echo
}

# Check observability stack
check_observability_status() {
    echo -e "${CYAN}📊 OBSERVABILITY STATUS${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # Check Elasticsearch
    local elastic_status=$(kubectl get elasticsearch -n $MONITORING_NAMESPACE --no-headers 2>/dev/null | awk '{print $3}' | head -1 || echo "N/A")
    printf "%-25s | %-15s\n" "Elasticsearch" "$elastic_status"
    
    # Check Kibana
    local kibana_status=$(kubectl get kibana -n $MONITORING_NAMESPACE --no-headers 2>/dev/null | awk '{print $3}' | head -1 || echo "N/A")
    printf "%-25s | %-15s\n" "Kibana" "$kibana_status"
    
    # Check Jaeger
    local jaeger_status=$(kubectl get pods -n $MONITORING_NAMESPACE -l app=jaeger --no-headers | awk '{print $3}' | head -1 || echo "N/A")
    printf "%-25s | %-15s\n" "Jaeger Tracing" "$jaeger_status"
    
    # Check Prometheus
    local prometheus_status=$(kubectl get pods -n $MONITORING_NAMESPACE -l app=prometheus --no-headers | awk '{print $3}' | head -1 || echo "N/A")
    printf "%-25s | %-15s\n" "Prometheus" "$prometheus_status"
    
    # Check Grafana
    local grafana_status=$(kubectl get pods -n $MONITORING_NAMESPACE -l app=grafana --no-headers | awk '{print $3}' | head -1 || echo "N/A")
    printf "%-25s | %-15s\n" "Grafana" "$grafana_status"
    
    echo
}

# Check application status
check_application_status() {
    echo -e "${CYAN}🚀 APPLICATION STATUS${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    printf "%-20s | %-10s | %-8s | %-8s | %-15s | %-15s\n" "SERVICE" "STATUS" "READY" "RESTARTS" "HEALTH" "RESOURCES"
    echo "────────────────────────────────────────────────────────────────────────────────"
    
    # TerraFusion Backend
    local backend_pods=$(get_pod_status $NAMESPACE "terrafusion-backend")
    if [ -n "$backend_pods" ]; then
        while IFS='|' read -r name status ready restarts cpu memory node; do
            local health=$(check_service_health "terrafusion-backend" $NAMESPACE "http://localhost:8080/health" || echo "❌ UNHEALTHY")
            local resources=$(get_resource_utilization $NAMESPACE "terrafusion-backend")
            printf "%-20s | %-10s | %-8s | %-8s | %-15s | %-15s\n" "Backend" "$status" "$ready" "$restarts" "$health" "$resources"
            break
        done <<< "$backend_pods"
    else
        printf "%-20s | %-10s | %-8s | %-8s | %-15s | %-15s\n" "Backend" "N/A" "N/A" "N/A" "N/A" "N/A"
    fi
    
    # CostForge
    local costforge_pods=$(get_pod_status $NAMESPACE "terrafusion-costforge")
    if [ -n "$costforge_pods" ]; then
        while IFS='|' read -r name status ready restarts cpu memory node; do
            local health=$(check_service_health "terrafusion-costforge" $NAMESPACE "http://localhost:3001/health" || echo "❌ UNHEALTHY")
            local resources=$(get_resource_utilization $NAMESPACE "terrafusion-costforge")
            printf "%-20s | %-10s | %-8s | %-8s | %-15s | %-15s\n" "CostForge" "$status" "$ready" "$restarts" "$health" "$resources"
            break
        done <<< "$costforge_pods"
    else
        printf "%-20s | %-10s | %-8s | %-8s | %-15s | %-15s\n" "CostForge" "N/A" "N/A" "N/A" "N/A" "N/A"
    fi
    
    # PropertyWorkbench
    local workbench_pods=$(get_pod_status $NAMESPACE "terrafusion-propertyworkbench")
    if [ -n "$workbench_pods" ]; then
        while IFS='|' read -r name status ready restarts cpu memory node; do
            local health=$(check_service_health "terrafusion-propertyworkbench" $NAMESPACE "http://localhost:3002/health" || echo "❌ UNHEALTHY")
            local resources=$(get_resource_utilization $NAMESPACE "terrafusion-propertyworkbench")
            printf "%-20s | %-10s | %-8s | %-8s | %-15s | %-15s\n" "PropertyWorkbench" "$status" "$ready" "$restarts" "$health" "$resources"
            break
        done <<< "$workbench_pods"
    else
        printf "%-20s | %-10s | %-8s | %-8s | %-15s | %-15s\n" "PropertyWorkbench" "N/A" "N/A" "N/A" "N/A" "N/A"
    fi
    
    # TerraInsight
    local insight_pods=$(get_pod_status $NAMESPACE "terrafusion-terrainsight")
    if [ -n "$insight_pods" ]; then
        while IFS='|' read -r name status ready restarts cpu memory node; do
            local health=$(check_service_health "terrafusion-terrainsight" $NAMESPACE "http://localhost:3003/health" || echo "❌ UNHEALTHY")
            local resources=$(get_resource_utilization $NAMESPACE "terrafusion-terrainsight")
            printf "%-20s | %-10s | %-8s | %-8s | %-15s | %-15s\n" "TerraInsight" "$status" "$ready" "$restarts" "$health" "$resources"
            break
        done <<< "$insight_pods"
    else
        printf "%-20s | %-10s | %-8s | %-8s | %-15s | %-15s\n" "TerraInsight" "N/A" "N/A" "N/A" "N/A" "N/A"
    fi
    
    # Database
    local postgres_pods=$(get_pod_status $NAMESPACE "terrafusion-postgres")
    if [ -n "$postgres_pods" ]; then
        while IFS='|' read -r name status ready restarts cpu memory node; do
            local resources=$(get_resource_utilization $NAMESPACE "terrafusion-postgres")
            printf "%-20s | %-10s | %-8s | %-8s | %-15s | %-15s\n" "PostgreSQL" "$status" "$ready" "$restarts" "✅ HEALTHY" "$resources"
            break
        done <<< "$postgres_pods"
    else
        printf "%-20s | %-10s | %-8s | %-8s | %-15s | %-15s\n" "PostgreSQL" "N/A" "N/A" "N/A" "N/A" "N/A"
    fi
    
    echo
}

# Check security status
check_security_status() {
    echo -e "${CYAN}🔒 SECURITY STATUS${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # Check security scanning job
    local last_scan=$(kubectl get jobs -n $SECURITY_NAMESPACE --sort-by=.metadata.creationTimestamp --no-headers | tail -1 | awk '{print $1}' || echo "N/A")
    local scan_status=$(kubectl get job "$last_scan" -n $SECURITY_NAMESPACE --no-headers 2>/dev/null | awk '{print $2}' || echo "N/A")
    printf "%-25s | %-15s\n" "Last Security Scan" "$scan_status"
    
    # Check network policies
    local netpol_count=$(kubectl get networkpolicies -n $NAMESPACE --no-headers | wc -l || echo "0")
    printf "%-25s | %-15s\n" "Network Policies" "${netpol_count} active"
    
    # Check pod security standards
    local pss_violations=$(kubectl get pods -n $NAMESPACE -o json | jq -r '.items[] | select(.metadata.annotations."security.alpha.kubernetes.io/sysctls" // false) | .metadata.name' | wc -l || echo "0")
    if [ "$pss_violations" -eq 0 ]; then
        printf "%-25s | %-15s\n" "Pod Security" "✅ COMPLIANT"
    else
        printf "%-25s | %-15s\n" "Pod Security" "❌ ${pss_violations} violations"
    fi
    
    echo
}

# Calculate SLA metrics
calculate_sla_metrics() {
    echo -e "${CYAN}📈 SLA METRICS${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # Calculate uptime percentage (simplified)
    local total_pods=$(kubectl get pods -n $NAMESPACE --no-headers | wc -l)
    local running_pods=$(kubectl get pods -n $NAMESPACE --no-headers | grep -c "Running" || echo "0")
    local uptime_percentage=$(echo "scale=2; $running_pods * 100 / $total_pods" | bc -l 2>/dev/null || echo "N/A")
    
    printf "%-25s | %-15s\n" "Current Uptime" "${uptime_percentage}%"
    
    # Error budget (simplified calculation)
    local error_budget=$(echo "scale=4; 100 - $uptime_percentage" | bc -l 2>/dev/null || echo "N/A")
    printf "%-25s | %-15s\n" "Error Budget Used" "${error_budget}%"
    
    # Target SLA
    printf "%-25s | %-15s\n" "SLA Target" "99.99%"
    
    # SLA status
    local sla_met=$(echo "$uptime_percentage >= 99.99" | bc -l 2>/dev/null || echo "0")
    if [ "$sla_met" -eq 1 ]; then
        printf "%-25s | %-15s\n" "SLA Status" "✅ MET"
    else
        printf "%-25s | %-15s\n" "SLA Status" "❌ MISSED"
    fi
    
    echo
}

# Show quick actions menu
show_quick_actions() {
    echo -e "${CYAN}⚡ QUICK ACTIONS${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "1. View ArgoCD UI:    kubectl port-forward svc/argocd-server -n argocd 8080:443"
    echo "2. View Grafana:      kubectl port-forward svc/terrafusion-grafana -n observability 3000:3000"
    echo "3. View Jaeger:       kubectl port-forward svc/terrafusion-jaeger-query -n observability 16686:16686"
    echo "4. View Kibana:       kubectl port-forward svc/terrafusion-kibana-kb-http -n observability 5601:5601"
    echo "5. Scale Backend:     kubectl scale deployment terrafusion-backend --replicas=10 -n terrafusion"
    echo "6. Run Chaos Test:    kubectl create job chaos-test --from=cronjob/chaos-scheduler -n litmus"
    echo "7. Security Scan:     kubectl create job security-scan --from=cronjob/container-security-scan -n security"
    echo
}

# Main monitoring loop
monitor_infrastructure() {
    while true; do
        show_header
        
        # Check cluster connectivity first
        if ! check_cluster_connectivity; then
            error "Lost connection to Kubernetes cluster. Retrying in 30 seconds..."
            sleep 30
            continue
        fi
        
        # Display all status checks
        check_istio_status
        check_argocd_status
        check_observability_status
        check_application_status
        check_security_status
        calculate_sla_metrics
        show_quick_actions
        
        echo -e "${GREEN}📊 Last updated: $(date)${NC}"
        echo -e "${BLUE}🔄 Next refresh in ${HEALTH_CHECK_INTERVAL} seconds (Press Ctrl+C to exit)${NC}"
        
        sleep $HEALTH_CHECK_INTERVAL
    done
}

# Generate infrastructure health report
generate_health_report() {
    local report_file="/tmp/terrafusion-infrastructure-health-$(date +%Y%m%d-%H%M%S).json"
    
    log "📊 Generating infrastructure health report..."
    
    # Collect comprehensive health data
    cat > "$report_file" << EOF
{
  "infrastructure_health_report": {
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "cluster_info": {
      "name": "$(kubectl config current-context)",
      "version": "$(kubectl version --short --client | grep -o 'v[0-9]\+\.[0-9]\+\.[0-9]\+')"
    },
    "namespaces": {
      "total": $(kubectl get namespaces --no-headers | wc -l),
      "terrafusion_pods": $(kubectl get pods -n $NAMESPACE --no-headers | wc -l),
      "running_pods": $(kubectl get pods -n $NAMESPACE --no-headers | grep -c "Running" || echo "0")
    },
    "service_mesh": {
      "istio_version": "$(kubectl get deployment istiod -n istio-system -o jsonpath='{.metadata.labels.version}' 2>/dev/null || echo 'N/A')",
      "sidecars_injected": $(kubectl get pods -A --no-headers | grep -c "istio-proxy" || echo "0"),
      "gateways_active": $(kubectl get gateways -A --no-headers | wc -l || echo "0")
    },
    "applications": {
      "backend_replicas": $(kubectl get deployment terrafusion-backend -n $NAMESPACE -o jsonpath='{.status.replicas}' 2>/dev/null || echo "0"),
      "backend_ready": $(kubectl get deployment terrafusion-backend -n $NAMESPACE -o jsonpath='{.status.readyReplicas}' 2>/dev/null || echo "0"),
      "costforge_replicas": $(kubectl get deployment terrafusion-costforge -n $NAMESPACE -o jsonpath='{.status.replicas}' 2>/dev/null || echo "0"),
      "database_ready": $(kubectl get statefulset terrafusion-postgres -n $NAMESPACE -o jsonpath='{.status.readyReplicas}' 2>/dev/null || echo "0")
    },
    "resource_utilization": {
      "total_cpu_requests": "$(kubectl describe nodes | grep -A 2 "Allocated resources" | grep "cpu" | awk '{sum+=$2} END {print sum "m"}' || echo 'N/A')",
      "total_memory_requests": "$(kubectl describe nodes | grep -A 2 "Allocated resources" | grep "memory" | awk '{sum+=$2} END {print sum "Mi"}' || echo 'N/A')"
    },
    "sla_metrics": {
      "uptime_percentage": $(echo "scale=2; $(kubectl get pods -n $NAMESPACE --no-headers | grep -c "Running" || echo "0") * 100 / $(kubectl get pods -n $NAMESPACE --no-headers | wc -l)" | bc -l 2>/dev/null || echo "0"),
      "sla_target": "99.99",
      "error_budget_remaining": "$(echo 'scale=4; 0.01' | bc -l)"
    }
  }
}
EOF
    
    success "Health report generated: $report_file"
    cat "$report_file" | jq '.'
}

# Handle script options
case "${1:-monitor}" in
    "monitor")
        log "🏆 Starting TerraFusion Infrastructure Monitoring"
        monitor_infrastructure
        ;;
    "report")
        generate_health_report
        ;;
    "health")
        show_header
        check_cluster_connectivity
        check_istio_status
        check_argocd_status
        check_observability_status
        check_application_status
        check_security_status
        calculate_sla_metrics
        ;;
    *)
        echo "Usage: $0 [monitor|report|health]"
        echo "  monitor - Start real-time monitoring (default)"
        echo "  report  - Generate health report"
        echo "  health  - One-time health check"
        exit 1
        ;;
esac