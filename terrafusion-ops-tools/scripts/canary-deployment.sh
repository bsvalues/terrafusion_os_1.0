#!/bin/bash
#
# TerraFusion Advanced Deployment Validation and Canary Release System
# Manages progressive deployments with automated validation and rollback capabilities
#
# Usage: ./canary-deployment.sh [options]
# Options:
#   -a    Action (deploy|validate|promote|rollback|status|cleanup)
#   -e    Environment (staging|production)
#   -v    Application version to deploy
#   -p    Canary percentage (1-100, default: 10)
#   -t    Traffic shift strategy (immediate|gradual|manual)
#   -d    Deployment strategy (blue-green|canary|rolling)
#   -c    Config file path
#   -w    Wait time between validation checks (seconds, default: 60)
#   -r    Rollback on failure (true|false, default: true)
#   -s    Skip validation tests (true|false, default: false)

set -euo pipefail

# Configuration
ACTION="deploy"
ENVIRONMENT="staging"
APP_VERSION=""
CANARY_PERCENTAGE=10
TRAFFIC_STRATEGY="gradual"
DEPLOYMENT_STRATEGY="canary"
CONFIG_FILE=""
WAIT_TIME=60
ROLLBACK_ON_FAILURE=true
SKIP_VALIDATION=false

# Directories and Files
DEPLOYMENT_BASE_DIR="/opt/terrafusion/deployments"
CANARY_CONFIG_DIR="$DEPLOYMENT_BASE_DIR/canary-configs"
METRICS_DIR="$DEPLOYMENT_BASE_DIR/metrics"
LOGS_DIR="/var/log/terrafusion/deployments"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="$LOGS_DIR/canary_deployment_$TIMESTAMP.log"

# Kubernetes Configuration
K8S_NAMESPACE="terrafusion-${ENVIRONMENT}"
K8S_DEPLOYMENT_NAME="terrafusion-app"
K8S_SERVICE_NAME="terrafusion-service"
K8S_INGRESS_NAME="terrafusion-ingress"

# Application Configuration
APP_NAME="terrafusion"
APP_PORT=\${{TF_ADMIN_PORT:-8080}}
HEALTH_CHECK_PATH="/health"
READINESS_PATH="/ready"
METRICS_PATH="/metrics"

# Monitoring Configuration
PROMETHEUS_URL="${PROMETHEUS_URL:-http://prometheus:9090}"
GRAFANA_URL="${GRAFANA_URL:-http://grafana:${TF_FRONTEND_PORT:-3102}}"
ALERT_MANAGER_URL="${ALERT_MANAGER_URL:-http://alertmanager:9093}"

# Validation Thresholds
ERROR_RATE_THRESHOLD=5.0
RESPONSE_TIME_THRESHOLD=2000
SUCCESS_RATE_THRESHOLD=95.0
CPU_THRESHOLD=80.0
MEMORY_THRESHOLD=85.0

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Create directories
mkdir -p "$DEPLOYMENT_BASE_DIR"
mkdir -p "$CANARY_CONFIG_DIR"
mkdir -p "$METRICS_DIR"
mkdir -p "$LOGS_DIR"

# Parse arguments
while getopts "a:e:v:p:t:d:c:w:r:s:" opt; do
    case $opt in
        a) ACTION="$OPTARG" ;;
        e) ENVIRONMENT="$OPTARG" ;;
        v) APP_VERSION="$OPTARG" ;;
        p) CANARY_PERCENTAGE="$OPTARG" ;;
        t) TRAFFIC_STRATEGY="$OPTARG" ;;
        d) DEPLOYMENT_STRATEGY="$OPTARG" ;;
        c) CONFIG_FILE="$OPTARG" ;;
        w) WAIT_TIME="$OPTARG" ;;
        r) ROLLBACK_ON_FAILURE="$OPTARG" ;;
        s) SKIP_VALIDATION="$OPTARG" ;;
        *) echo "Usage: $0 [-a action] [-e env] [-v version] [-p percentage] [-t strategy] [-d deployment] [-c config] [-w wait] [-r rollback] [-s skip]"; exit 1 ;;
    esac
done

# Global state variables
declare -A DEPLOYMENT_STATE
declare -A VALIDATION_RESULTS
declare -A TRAFFIC_DISTRIBUTION
declare -A ROLLBACK_DATA

# Logging functions
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[ERROR] $1${NC}" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}" | tee -a "$LOG_FILE"
}

log_info() {
    echo -e "${BLUE}[INFO] $1${NC}" | tee -a "$LOG_FILE"
}

# Load deployment configuration
load_deployment_config() {
    if [ -n "$CONFIG_FILE" ] && [ -f "$CONFIG_FILE" ]; then
        log "Loading deployment configuration from $CONFIG_FILE"
        source "$CONFIG_FILE"
    else
        log "Using default deployment configuration"
    fi
    
    # Validate required parameters
    if [ -z "$APP_VERSION" ]; then
        log_error "Application version is required"
        exit 1
    fi
    
    # Set deployment state
    DEPLOYMENT_STATE["app_version"]="$APP_VERSION"
    DEPLOYMENT_STATE["environment"]="$ENVIRONMENT"
    DEPLOYMENT_STATE["canary_percentage"]="$CANARY_PERCENTAGE"
    DEPLOYMENT_STATE["deployment_strategy"]="$DEPLOYMENT_STRATEGY"
    DEPLOYMENT_STATE["status"]="initializing"
    DEPLOYMENT_STATE["start_time"]=$(date +%s)
}

# Check prerequisites
check_prerequisites() {
    log "Checking deployment prerequisites"
    
    local prerequisites_met=true
    
    # Check kubectl
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl is not available"
        prerequisites_met=false
    fi
    
    # Check cluster connectivity
    if ! kubectl cluster-info &>/dev/null; then
        log_error "Cannot connect to Kubernetes cluster"
        prerequisites_met=false
    fi
    
    # Check namespace exists
    if ! kubectl get namespace "$K8S_NAMESPACE" &>/dev/null; then
        log_warning "Namespace $K8S_NAMESPACE does not exist, creating..."
        kubectl create namespace "$K8S_NAMESPACE" || {
            log_error "Failed to create namespace $K8S_NAMESPACE"
            prerequisites_met=false
        }
    fi
    
    # Check if current deployment exists
    if kubectl get deployment "$K8S_DEPLOYMENT_NAME" -n "$K8S_NAMESPACE" &>/dev/null; then
        local current_version=$(kubectl get deployment "$K8S_DEPLOYMENT_NAME" -n "$K8S_NAMESPACE" -o jsonpath='{.metadata.labels.version}')
        DEPLOYMENT_STATE["current_version"]="$current_version"
        log_info "Current deployment version: $current_version"
    else
        log_info "No existing deployment found"
        DEPLOYMENT_STATE["current_version"]=""
    fi
    
    # Check monitoring tools
    if ! curl -s "$PROMETHEUS_URL/api/v1/query?query=up" &>/dev/null; then
        log_warning "Prometheus is not accessible at $PROMETHEUS_URL"
    fi
    
    if [ "$prerequisites_met" = false ]; then
        log_error "Prerequisites check failed"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Create deployment manifests
create_deployment_manifests() {
    log "Creating deployment manifests for version $APP_VERSION"
    
    local manifest_dir="$CANARY_CONFIG_DIR/v$APP_VERSION"
    mkdir -p "$manifest_dir"
    
    # Create canary deployment manifest
    cat > "$manifest_dir/canary-deployment.yaml" << EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${K8S_DEPLOYMENT_NAME}-canary
  namespace: $K8S_NAMESPACE
  labels:
    app: $APP_NAME
    version: "$APP_VERSION"
    deployment-type: canary
spec:
  replicas: 1
  selector:
    matchLabels:
      app: $APP_NAME
      version: "$APP_VERSION"
      deployment-type: canary
  template:
    metadata:
      labels:
        app: $APP_NAME
        version: "$APP_VERSION"
        deployment-type: canary
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "$APP_PORT"
        prometheus.io/path: "$METRICS_PATH"
    spec:
      containers:
      - name: $APP_NAME
        image: "$APP_NAME:$APP_VERSION"
        ports:
        - containerPort: $APP_PORT
          name: http
        env:
        - name: ENVIRONMENT
          value: "$ENVIRONMENT"
        - name: VERSION
          value: "$APP_VERSION"
        - name: DEPLOYMENT_TYPE
          value: "canary"
        livenessProbe:
          httpGet:
            path: $HEALTH_CHECK_PATH
            port: http
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: $READINESS_PATH
            port: http
          initialDelaySeconds: 5
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 3
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        securityContext:
          allowPrivilegeEscalation: false
          runAsNonRoot: true
          runAsUser: 1000
          capabilities:
            drop:
            - ALL
      securityContext:
        fsGroup: 1000
        runAsGroup: 1000
        runAsUser: 1000
---
apiVersion: v1
kind: Service
metadata:
  name: ${K8S_SERVICE_NAME}-canary
  namespace: $K8S_NAMESPACE
  labels:
    app: $APP_NAME
    version: "$APP_VERSION"
    deployment-type: canary
spec:
  selector:
    app: $APP_NAME
    version: "$APP_VERSION"
    deployment-type: canary
  ports:
  - port: 80
    targetPort: http
    protocol: TCP
    name: http
  type: ClusterIP
EOF

    # Create production deployment manifest
    cat > "$manifest_dir/production-deployment.yaml" << EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: $K8S_DEPLOYMENT_NAME
  namespace: $K8S_NAMESPACE
  labels:
    app: $APP_NAME
    version: "$APP_VERSION"
    deployment-type: production
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: $APP_NAME
      deployment-type: production
  template:
    metadata:
      labels:
        app: $APP_NAME
        version: "$APP_VERSION"
        deployment-type: production
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "$APP_PORT"
        prometheus.io/path: "$METRICS_PATH"
    spec:
      containers:
      - name: $APP_NAME
        image: "$APP_NAME:$APP_VERSION"
        ports:
        - containerPort: $APP_PORT
          name: http
        env:
        - name: ENVIRONMENT
          value: "$ENVIRONMENT"
        - name: VERSION
          value: "$APP_VERSION"
        - name: DEPLOYMENT_TYPE
          value: "production"
        livenessProbe:
          httpGet:
            path: $HEALTH_CHECK_PATH
            port: http
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: $READINESS_PATH
            port: http
          initialDelaySeconds: 5
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 3
        resources:
          requests:
            memory: "1Gi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
        securityContext:
          allowPrivilegeEscalation: false
          runAsNonRoot: true
          runAsUser: 1000
          capabilities:
            drop:
            - ALL
      securityContext:
        fsGroup: 1000
        runAsGroup: 1000
        runAsUser: 1000
EOF

    # Create traffic splitting ingress
    cat > "$manifest_dir/canary-ingress.yaml" << EOF
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ${K8S_INGRESS_NAME}-canary
  namespace: $K8S_NAMESPACE
  annotations:
    kubernetes.io/ingress.class: "nginx"
    nginx.ingress.kubernetes.io/canary: "true"
    nginx.ingress.kubernetes.io/canary-weight: "$CANARY_PERCENTAGE"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/use-regex: "true"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  tls:
  - hosts:
    - $APP_NAME-$ENVIRONMENT.terrafusion.com
    secretName: ${APP_NAME}-tls
  rules:
  - host: $APP_NAME-$ENVIRONMENT.terrafusion.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: ${K8S_SERVICE_NAME}-canary
            port:
              number: 80
EOF

    # Create monitoring ServiceMonitor
    cat > "$manifest_dir/service-monitor.yaml" << EOF
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: ${APP_NAME}-canary-monitor
  namespace: $K8S_NAMESPACE
  labels:
    app: $APP_NAME
    deployment-type: canary
spec:
  selector:
    matchLabels:
      app: $APP_NAME
      deployment-type: canary
  endpoints:
  - port: http
    path: $METRICS_PATH
    interval: 15s
    scrapeTimeout: 10s
EOF

    log_success "Deployment manifests created in $manifest_dir"
}

# Deploy canary version
deploy_canary() {
    log "Deploying canary version $APP_VERSION with $CANARY_PERCENTAGE% traffic"
    
    local manifest_dir="$CANARY_CONFIG_DIR/v$APP_VERSION"
    
    # Store rollback information
    if kubectl get deployment "$K8S_DEPLOYMENT_NAME" -n "$K8S_NAMESPACE" &>/dev/null; then
        local current_image=$(kubectl get deployment "$K8S_DEPLOYMENT_NAME" -n "$K8S_NAMESPACE" -o jsonpath='{.spec.template.spec.containers[0].image}')
        local current_replicas=$(kubectl get deployment "$K8S_DEPLOYMENT_NAME" -n "$K8S_NAMESPACE" -o jsonpath='{.spec.replicas}')
        
        ROLLBACK_DATA["previous_image"]="$current_image"
        ROLLBACK_DATA["previous_replicas"]="$current_replicas"
        
        log_info "Stored rollback data - Image: $current_image, Replicas: $current_replicas"
    fi
    
    # Deploy canary
    log_info "Applying canary deployment manifest..."
    if kubectl apply -f "$manifest_dir/canary-deployment.yaml"; then
        log_success "Canary deployment created"
    else
        log_error "Failed to create canary deployment"
        return 1
    fi
    
    # Wait for canary to be ready
    log_info "Waiting for canary deployment to be ready..."
    if kubectl wait --for=condition=available --timeout=300s deployment/${K8S_DEPLOYMENT_NAME}-canary -n "$K8S_NAMESPACE"; then
        log_success "Canary deployment is ready"
    else
        log_error "Canary deployment failed to become ready"
        return 1
    fi
    
    # Apply canary ingress for traffic splitting
    log_info "Configuring traffic splitting..."
    if kubectl apply -f "$manifest_dir/canary-ingress.yaml"; then
        log_success "Traffic splitting configured"
    else
        log_error "Failed to configure traffic splitting"
        return 1
    fi
    
    # Apply monitoring
    if kubectl apply -f "$manifest_dir/service-monitor.yaml" 2>/dev/null; then
        log_info "Monitoring configured for canary"
    else
        log_warning "Could not configure monitoring (ServiceMonitor CRD may not be available)"
    fi
    
    DEPLOYMENT_STATE["status"]="canary_deployed"
    DEPLOYMENT_STATE["canary_deployed_at"]=$(date +%s)
    
    log_success "Canary deployment completed successfully"
}

# Validate canary deployment
validate_canary() {
    log "Validating canary deployment for version $APP_VERSION"
    
    if [ "$SKIP_VALIDATION" = "true" ]; then
        log_warning "Validation skipped as requested"
        VALIDATION_RESULTS["overall"]="skipped"
        return 0
    fi
    
    local validation_passed=true
    local validation_start_time=$(date +%s)
    
    # Wait for metrics to be available
    log_info "Waiting for metrics to be available..."
    sleep 30
    
    # Health check validation
    log_info "Performing health check validation..."
    if validate_health_checks; then
        VALIDATION_RESULTS["health_checks"]="passed"
        log_success "Health checks validation passed"
    else
        VALIDATION_RESULTS["health_checks"]="failed"
        log_error "Health checks validation failed"
        validation_passed=false
    fi
    
    # Performance validation
    log_info "Performing performance validation..."
    if validate_performance_metrics; then
        VALIDATION_RESULTS["performance"]="passed"
        log_success "Performance validation passed"
    else
        VALIDATION_RESULTS["performance"]="failed"
        log_error "Performance validation failed"
        validation_passed=false
    fi
    
    # Error rate validation
    log_info "Performing error rate validation..."
    if validate_error_rates; then
        VALIDATION_RESULTS["error_rates"]="passed"
        log_success "Error rate validation passed"
    else
        VALIDATION_RESULTS["error_rates"]="failed"
        log_error "Error rate validation failed"
        validation_passed=false
    fi
    
    # Resource utilization validation
    log_info "Performing resource utilization validation..."
    if validate_resource_utilization; then
        VALIDATION_RESULTS["resources"]="passed"
        log_success "Resource utilization validation passed"
    else
        VALIDATION_RESULTS["resources"]="failed"
        log_error "Resource utilization validation failed"
        validation_passed=false
    fi
    
    # Business metrics validation
    log_info "Performing business metrics validation..."
    if validate_business_metrics; then
        VALIDATION_RESULTS["business_metrics"]="passed"
        log_success "Business metrics validation passed"
    else
        VALIDATION_RESULTS["business_metrics"]="failed"
        log_error "Business metrics validation failed"
        validation_passed=false
    fi
    
    # Overall validation result
    if [ "$validation_passed" = true ]; then
        VALIDATION_RESULTS["overall"]="passed"
        DEPLOYMENT_STATE["status"]="validation_passed"
        log_success "Canary validation completed successfully"
        return 0
    else
        VALIDATION_RESULTS["overall"]="failed"
        DEPLOYMENT_STATE["status"]="validation_failed"
        log_error "Canary validation failed"
        
        # Auto-rollback if enabled
        if [ "$ROLLBACK_ON_FAILURE" = "true" ]; then
            log_warning "Auto-rollback is enabled, initiating rollback..."
            rollback_deployment
        fi
        
        return 1
    fi
}

# Validate health checks
validate_health_checks() {
    local canary_pods=$(kubectl get pods -n "$K8S_NAMESPACE" -l "app=$APP_NAME,deployment-type=canary" -o jsonpath='{.items[*].metadata.name}')
    
    for pod in $canary_pods; do
        log_info "Checking health of pod: $pod"
        
        # Check pod is running
        local pod_phase=$(kubectl get pod "$pod" -n "$K8S_NAMESPACE" -o jsonpath='{.status.phase}')
        if [ "$pod_phase" != "Running" ]; then
            log_error "Pod $pod is not running (phase: $pod_phase)"
            return 1
        fi
        
        # Check readiness
        local ready=$(kubectl get pod "$pod" -n "$K8S_NAMESPACE" -o jsonpath='{.status.conditions[?(@.type=="Ready")].status}')
        if [ "$ready" != "True" ]; then
            log_error "Pod $pod is not ready"
            return 1
        fi
        
        # Test health endpoint
        if kubectl exec "$pod" -n "$K8S_NAMESPACE" -- curl -f "http://localhost:$APP_PORT$HEALTH_CHECK_PATH" &>/dev/null; then
            log_info "Health check passed for pod: $pod"
        else
            log_error "Health check failed for pod: $pod"
            return 1
        fi
    done
    
    return 0
}

# Validate performance metrics
validate_performance_metrics() {
    log_info "Validating performance metrics against thresholds"
    
    # Query Prometheus for response time metrics
    local response_time_query="histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket{job=\"$APP_NAME\", version=\"$APP_VERSION\"}[5m])) by (le))"
    local response_time=$(query_prometheus "$response_time_query")
    
    if [ -n "$response_time" ]; then
        local response_time_ms=$(echo "$response_time * 1000" | bc -l)
        log_info "95th percentile response time: ${response_time_ms}ms"
        
        if (( $(echo "$response_time_ms > $RESPONSE_TIME_THRESHOLD" | bc -l) )); then
            log_error "Response time ${response_time_ms}ms exceeds threshold ${RESPONSE_TIME_THRESHOLD}ms"
            return 1
        fi
    else
        log_warning "Could not retrieve response time metrics"
    fi
    
    # Query for throughput
    local throughput_query="sum(rate(http_requests_total{job=\"$APP_NAME\", version=\"$APP_VERSION\"}[5m]))"
    local throughput=$(query_prometheus "$throughput_query")
    
    if [ -n "$throughput" ]; then
        log_info "Current throughput: ${throughput} requests/second"
    else
        log_warning "Could not retrieve throughput metrics"
    fi
    
    return 0
}

# Validate error rates
validate_error_rates() {
    log_info "Validating error rates against thresholds"
    
    # Query for error rate
    local error_rate_query="(sum(rate(http_requests_total{job=\"$APP_NAME\", version=\"$APP_VERSION\", code=~\"5.*\"}[5m])) / sum(rate(http_requests_total{job=\"$APP_NAME\", version=\"$APP_VERSION\"}[5m]))) * 100"
    local error_rate=$(query_prometheus "$error_rate_query")
    
    if [ -n "$error_rate" ]; then
        log_info "Current error rate: ${error_rate}%"
        
        if (( $(echo "$error_rate > $ERROR_RATE_THRESHOLD" | bc -l) )); then
            log_error "Error rate ${error_rate}% exceeds threshold ${ERROR_RATE_THRESHOLD}%"
            return 1
        fi
    else
        log_warning "Could not retrieve error rate metrics"
    fi
    
    # Query for success rate
    local success_rate_query="(sum(rate(http_requests_total{job=\"$APP_NAME\", version=\"$APP_VERSION\", code=~\"2.*|3.*\"}[5m])) / sum(rate(http_requests_total{job=\"$APP_NAME\", version=\"$APP_VERSION\"}[5m]))) * 100"
    local success_rate=$(query_prometheus "$success_rate_query")
    
    if [ -n "$success_rate" ]; then
        log_info "Current success rate: ${success_rate}%"
        
        if (( $(echo "$success_rate < $SUCCESS_RATE_THRESHOLD" | bc -l) )); then
            log_error "Success rate ${success_rate}% below threshold ${SUCCESS_RATE_THRESHOLD}%"
            return 1
        fi
    else
        log_warning "Could not retrieve success rate metrics"
    fi
    
    return 0
}

# Validate resource utilization
validate_resource_utilization() {
    log_info "Validating resource utilization against thresholds"
    
    # Query for CPU utilization
    local cpu_query="avg(rate(container_cpu_usage_seconds_total{pod=~\"${K8S_DEPLOYMENT_NAME}-canary-.*\", namespace=\"$K8S_NAMESPACE\"}[5m])) * 100"
    local cpu_usage=$(query_prometheus "$cpu_query")
    
    if [ -n "$cpu_usage" ]; then
        log_info "Current CPU usage: ${cpu_usage}%"
        
        if (( $(echo "$cpu_usage > $CPU_THRESHOLD" | bc -l) )); then
            log_error "CPU usage ${cpu_usage}% exceeds threshold ${CPU_THRESHOLD}%"
            return 1
        fi
    else
        log_warning "Could not retrieve CPU usage metrics"
    fi
    
    # Query for memory utilization
    local memory_query="avg(container_memory_usage_bytes{pod=~\"${K8S_DEPLOYMENT_NAME}-canary-.*\", namespace=\"$K8S_NAMESPACE\"} / container_spec_memory_limit_bytes{pod=~\"${K8S_DEPLOYMENT_NAME}-canary-.*\", namespace=\"$K8S_NAMESPACE\"}) * 100"
    local memory_usage=$(query_prometheus "$memory_query")
    
    if [ -n "$memory_usage" ]; then
        log_info "Current memory usage: ${memory_usage}%"
        
        if (( $(echo "$memory_usage > $MEMORY_THRESHOLD" | bc -l) )); then
            log_error "Memory usage ${memory_usage}% exceeds threshold ${MEMORY_THRESHOLD}%"
            return 1
        fi
    else
        log_warning "Could not retrieve memory usage metrics"
    fi
    
    return 0
}

# Validate business metrics
validate_business_metrics() {
    log_info "Validating business metrics"
    
    # This is a placeholder for business-specific metrics validation
    # In a real implementation, you would query metrics like:
    # - Conversion rates
    # - User engagement metrics
    # - Revenue impact
    # - Feature adoption rates
    
    # Example: Check if any business-critical alerts are firing
    local critical_alerts=$(query_prometheus "ALERTS{alertname=~\".*Critical.*\", version=\"$APP_VERSION\"}")
    
    if [ -n "$critical_alerts" ] && [ "$critical_alerts" != "0" ]; then
        log_error "Critical business alerts are firing for canary version"
        return 1
    fi
    
    log_info "Business metrics validation passed"
    return 0
}

# Query Prometheus for metrics
query_prometheus() {
    local query=$1
    local endpoint="$PROMETHEUS_URL/api/v1/query"
    
    local result=$(curl -s --max-time 10 -G "$endpoint" --data-urlencode "query=$query" | jq -r '.data.result[0].value[1]' 2>/dev/null)
    
    if [ "$result" != "null" ] && [ -n "$result" ]; then
        echo "$result"
    fi
}

# Promote canary to production
promote_canary() {
    log "Promoting canary version $APP_VERSION to production"
    
    # Check if validation passed
    if [ "${VALIDATION_RESULTS[overall]:-}" != "passed" ]; then
        log_error "Cannot promote canary - validation did not pass"
        return 1
    fi
    
    local manifest_dir="$CANARY_CONFIG_DIR/v$APP_VERSION"
    
    # Update production deployment with new version
    log_info "Updating production deployment..."
    if kubectl apply -f "$manifest_dir/production-deployment.yaml"; then
        log_success "Production deployment updated"
    else
        log_error "Failed to update production deployment"
        return 1
    fi
    
    # Wait for rollout to complete
    log_info "Waiting for production rollout to complete..."
    if kubectl rollout status deployment/$K8S_DEPLOYMENT_NAME -n "$K8S_NAMESPACE" --timeout=600s; then
        log_success "Production rollout completed"
    else
        log_error "Production rollout failed or timed out"
        return 1
    fi
    
    # Remove canary resources
    log_info "Cleaning up canary resources..."
    kubectl delete deployment "${K8S_DEPLOYMENT_NAME}-canary" -n "$K8S_NAMESPACE" 2>/dev/null || true
    kubectl delete service "${K8S_SERVICE_NAME}-canary" -n "$K8S_NAMESPACE" 2>/dev/null || true
    kubectl delete ingress "${K8S_INGRESS_NAME}-canary" -n "$K8S_NAMESPACE" 2>/dev/null || true
    kubectl delete servicemonitor "${APP_NAME}-canary-monitor" -n "$K8S_NAMESPACE" 2>/dev/null || true
    
    DEPLOYMENT_STATE["status"]="promoted"
    DEPLOYMENT_STATE["promoted_at"]=$(date +%s)
    
    log_success "Canary promotion completed successfully"
}

# Rollback deployment
rollback_deployment() {
    log "Rolling back deployment due to validation failure"
    
    # Remove canary deployment
    log_info "Removing canary deployment..."
    kubectl delete deployment "${K8S_DEPLOYMENT_NAME}-canary" -n "$K8S_NAMESPACE" 2>/dev/null || true
    kubectl delete service "${K8S_SERVICE_NAME}-canary" -n "$K8S_NAMESPACE" 2>/dev/null || true
    kubectl delete ingress "${K8S_INGRESS_NAME}-canary" -n "$K8S_NAMESPACE" 2>/dev/null || true
    kubectl delete servicemonitor "${APP_NAME}-canary-monitor" -n "$K8S_NAMESPACE" 2>/dev/null || true
    
    # Restore previous version if available
    if [ -n "${ROLLBACK_DATA[previous_image]:-}" ]; then
        log_info "Restoring previous deployment..."
        kubectl set image deployment/$K8S_DEPLOYMENT_NAME "$APP_NAME=${ROLLBACK_DATA[previous_image]}" -n "$K8S_NAMESPACE"
        kubectl scale deployment/$K8S_DEPLOYMENT_NAME --replicas="${ROLLBACK_DATA[previous_replicas]}" -n "$K8S_NAMESPACE"
        
        # Wait for rollback to complete
        kubectl rollout status deployment/$K8S_DEPLOYMENT_NAME -n "$K8S_NAMESPACE" --timeout=300s
    fi
    
    DEPLOYMENT_STATE["status"]="rolled_back"
    DEPLOYMENT_STATE["rolled_back_at"]=$(date +%s)
    
    log_success "Rollback completed"
}

# Get deployment status
get_deployment_status() {
    log "Getting deployment status for version $APP_VERSION"
    
    echo "========================================="
    echo "TerraFusion Deployment Status"
    echo "========================================="
    echo "Environment: $ENVIRONMENT"
    echo "Application Version: $APP_VERSION"
    echo "Deployment Strategy: $DEPLOYMENT_STRATEGY"
    echo "Canary Percentage: $CANARY_PERCENTAGE%"
    echo "Status: ${DEPLOYMENT_STATE[status]:-unknown}"
    echo ""
    
    # Show current deployments
    echo "Current Deployments:"
    kubectl get deployments -n "$K8S_NAMESPACE" -l "app=$APP_NAME" -o wide 2>/dev/null || echo "No deployments found"
    echo ""
    
    # Show services
    echo "Services:"
    kubectl get services -n "$K8S_NAMESPACE" -l "app=$APP_NAME" 2>/dev/null || echo "No services found"
    echo ""
    
    # Show ingress
    echo "Ingress:"
    kubectl get ingress -n "$K8S_NAMESPACE" -l "app=$APP_NAME" 2>/dev/null || echo "No ingress found"
    echo ""
    
    # Show validation results if available
    if [ ${#VALIDATION_RESULTS[@]} -gt 0 ]; then
        echo "Validation Results:"
        for key in "${!VALIDATION_RESULTS[@]}"; do
            echo "  $key: ${VALIDATION_RESULTS[$key]}"
        done
        echo ""
    fi
    
    # Show traffic distribution
    echo "Traffic Distribution:"
    if kubectl get ingress "${K8S_INGRESS_NAME}-canary" -n "$K8S_NAMESPACE" &>/dev/null; then
        local canary_weight=$(kubectl get ingress "${K8S_INGRESS_NAME}-canary" -n "$K8S_NAMESPACE" -o jsonpath='{.metadata.annotations.nginx\.ingress\.kubernetes\.io/canary-weight}')
        echo "  Canary: ${canary_weight:-0}%"
        echo "  Production: $((100 - ${canary_weight:-0}))%"
    else
        echo "  Production: 100%"
        echo "  Canary: 0%"
    fi
    echo ""
    
    echo "========================================="
}

# Cleanup deployment resources
cleanup_deployment() {
    log "Cleaning up deployment resources for version $APP_VERSION"
    
    local cleanup_canary=true
    local cleanup_manifests=false
    
    # Parse cleanup options
    if [ "$1" = "all" ]; then
        cleanup_manifests=true
    fi
    
    if [ "$cleanup_canary" = true ]; then
        log_info "Removing canary resources..."
        kubectl delete deployment "${K8S_DEPLOYMENT_NAME}-canary" -n "$K8S_NAMESPACE" 2>/dev/null || true
        kubectl delete service "${K8S_SERVICE_NAME}-canary" -n "$K8S_NAMESPACE" 2>/dev/null || true
        kubectl delete ingress "${K8S_INGRESS_NAME}-canary" -n "$K8S_NAMESPACE" 2>/dev/null || true
        kubectl delete servicemonitor "${APP_NAME}-canary-monitor" -n "$K8S_NAMESPACE" 2>/dev/null || true
    fi
    
    if [ "$cleanup_manifests" = true ]; then
        log_info "Removing deployment manifests..."
        local manifest_dir="$CANARY_CONFIG_DIR/v$APP_VERSION"
        rm -rf "$manifest_dir"
    fi
    
    log_success "Cleanup completed"
}

# Generate deployment report
generate_deployment_report() {
    local report_file="$LOGS_DIR/deployment_report_${ENVIRONMENT}_${APP_VERSION}_$TIMESTAMP.html"
    
    log "Generating deployment report: $report_file"
    
    cat > "$report_file" << EOF
<!DOCTYPE html>
<html>
<head>
    <title>TerraFusion Deployment Report - $APP_VERSION</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background-color: #f0f0f0; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
        .section { margin: 20px 0; }
        .success { color: green; font-weight: bold; }
        .warning { color: orange; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        table { border-collapse: collapse; width: 100%; margin: 10px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .status-card { display: inline-block; margin: 10px; padding: 15px; border: 1px solid #ddd; border-radius: 5px; min-width: 150px; text-align: center; }
        .passed { background-color: #e8f5e8; }
        .failed { background-color: #ffebee; }
        .skipped { background-color: #fff3e0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚀 TerraFusion Deployment Report</h1>
        <p><strong>Application Version:</strong> $APP_VERSION</p>
        <p><strong>Environment:</strong> $ENVIRONMENT</p>
        <p><strong>Deployment Strategy:</strong> $DEPLOYMENT_STRATEGY</p>
        <p><strong>Status:</strong> <span class="${DEPLOYMENT_STATE[status]:-unknown}">${DEPLOYMENT_STATE[status]:-unknown}</span></p>
        <p><strong>Generated:</strong> $(date)</p>
    </div>
    
    <div class="section">
        <h2>Deployment Summary</h2>
        <table>
            <tr><th>Parameter</th><th>Value</th></tr>
            <tr><td>Application Version</td><td>$APP_VERSION</td></tr>
            <tr><td>Environment</td><td>$ENVIRONMENT</td></tr>
            <tr><td>Canary Percentage</td><td>$CANARY_PERCENTAGE%</td></tr>
            <tr><td>Traffic Strategy</td><td>$TRAFFIC_STRATEGY</td></tr>
            <tr><td>Rollback on Failure</td><td>$ROLLBACK_ON_FAILURE</td></tr>
            <tr><td>Skip Validation</td><td>$SKIP_VALIDATION</td></tr>
        </table>
    </div>
    
    <div class="section">
        <h2>Validation Results</h2>
EOF

    # Add validation results
    for validation_type in "health_checks" "performance" "error_rates" "resources" "business_metrics" "overall"; do
        local status="${VALIDATION_RESULTS[$validation_type]:-not_run}"
        local status_class="skipped"
        
        case "$status" in
            passed) status_class="passed" ;;
            failed) status_class="failed" ;;
            skipped) status_class="skipped" ;;
        esac
        
        cat >> "$report_file" << EOF
        <div class="status-card $status_class">
            <h3>$(echo "$validation_type" | tr '_' ' ' | sed 's/\b\w/\U&/g')</h3>
            <p class="$status_class">$status</p>
        </div>
EOF
    done

    cat >> "$report_file" << EOF
    </div>
    
    <div class="section">
        <h2>Timeline</h2>
        <table>
            <tr><th>Event</th><th>Timestamp</th><th>Duration</th></tr>
EOF

    # Add timeline events
    local start_time="${DEPLOYMENT_STATE[start_time]:-0}"
    local canary_deployed_at="${DEPLOYMENT_STATE[canary_deployed_at]:-0}"
    local promoted_at="${DEPLOYMENT_STATE[promoted_at]:-0}"
    local rolled_back_at="${DEPLOYMENT_STATE[rolled_back_at]:-0}"
    
    if [ "$start_time" -gt 0 ]; then
        cat >> "$report_file" << EOF
            <tr><td>Deployment Started</td><td>$(date -d "@$start_time")</td><td>-</td></tr>
EOF
    fi
    
    if [ "$canary_deployed_at" -gt 0 ]; then
        local deploy_duration=$((canary_deployed_at - start_time))
        cat >> "$report_file" << EOF
            <tr><td>Canary Deployed</td><td>$(date -d "@$canary_deployed_at")</td><td>${deploy_duration}s</td></tr>
EOF
    fi
    
    if [ "$promoted_at" -gt 0 ]; then
        local promote_duration=$((promoted_at - canary_deployed_at))
        cat >> "$report_file" << EOF
            <tr><td>Promoted to Production</td><td>$(date -d "@$promoted_at")</td><td>${promote_duration}s</td></tr>
EOF
    fi
    
    if [ "$rolled_back_at" -gt 0 ]; then
        local rollback_duration=$((rolled_back_at - canary_deployed_at))
        cat >> "$report_file" << EOF
            <tr><td>Rolled Back</td><td>$(date -d "@$rolled_back_at")</td><td>${rollback_duration}s</td></tr>
EOF
    fi

    cat >> "$report_file" << EOF
        </table>
    </div>
    
    <div class="section">
        <h2>Resources</h2>
        <ul>
            <li><strong>Log File:</strong> $LOG_FILE</li>
            <li><strong>Manifest Directory:</strong> $CANARY_CONFIG_DIR/v$APP_VERSION</li>
            <li><strong>Kubernetes Namespace:</strong> $K8S_NAMESPACE</li>
            <li><strong>Prometheus:</strong> <a href="$PROMETHEUS_URL">$PROMETHEUS_URL</a></li>
            <li><strong>Grafana:</strong> <a href="$GRAFANA_URL">$GRAFANA_URL</a></li>
        </ul>
    </div>
    
    <p><small>Report generated by TerraFusion Canary Deployment System</small></p>
</body>
</html>
EOF

    log_success "Deployment report generated: $report_file"
}

# Main execution
main() {
    log "========================================="
    log "TerraFusion Canary Deployment System"
    log "Action: $ACTION"
    log "Environment: $ENVIRONMENT"
    log "Version: $APP_VERSION"
    log "Strategy: $DEPLOYMENT_STRATEGY"
    log "========================================="
    
    # Load configuration
    load_deployment_config
    
    case $ACTION in
        deploy)
            check_prerequisites
            create_deployment_manifests
            deploy_canary
            if [ "$SKIP_VALIDATION" != "true" ]; then
                sleep "$WAIT_TIME"
                validate_canary
            fi
            ;;
        validate)
            validate_canary
            ;;
        promote)
            promote_canary
            cleanup_deployment
            ;;
        rollback)
            rollback_deployment
            ;;
        status)
            get_deployment_status
            ;;
        cleanup)
            cleanup_deployment "${2:-canary}"
            ;;
        *)
            log_error "Invalid action: $ACTION"
            echo "Valid actions: deploy, validate, promote, rollback, status, cleanup"
            exit 1
            ;;
    esac
    
    # Generate report
    generate_deployment_report
    
    log ""
    log "========================================="
    log "Canary Deployment Operation Complete"
    log "Action: $ACTION"
    log "Status: ${DEPLOYMENT_STATE[status]:-unknown}"
    log "Version: $APP_VERSION"
    log "Environment: $ENVIRONMENT"
    log "Log file: $LOG_FILE"
    log "========================================="
}

# Handle interrupts
trap 'log_error "Deployment interrupted!"; cleanup_deployment; exit 1' INT TERM

# Run main function
main "$@"