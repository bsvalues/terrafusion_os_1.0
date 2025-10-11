#!/bin/bash

###############################################################################
# TerraFusion OS 1.0 - Blue-Green Deployment Script
# MIT/PhD-Level Zero-Downtime Deployment Strategy
#
# This script implements a sophisticated blue-green deployment strategy:
# 1. Deploy new version (green) alongside current (blue)
# 2. Run comprehensive smoke tests on green
# 3. Gradually shift traffic to green (canary: 10% → 25% → 50% → 100%)
# 4. Monitor metrics at each stage (error rate, latency, throughput)
# 5. Automatic rollback on failure
# 6. Keep blue online for 24 hours as safety net
#
# Usage: ./blue-green-deploy.sh <version> <environment>
# Example: ./blue-green-deploy.sh v1.2.0 production
###############################################################################

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
VERSION=${1:-}
ENVIRONMENT=${2:-production}
NAMESPACE="terrafusion-${ENVIRONMENT}"
DEPLOYMENT_NAME="terrafusion-api"
SERVICE_NAME="terrafusion-api-service"
HEALTH_CHECK_RETRIES=30
HEALTH_CHECK_INTERVAL=10
SMOKE_TEST_TIMEOUT=300

# Prometheus/Grafana for metrics
PROMETHEUS_URL="http://prometheus-operated:9090"
GRAFANA_URL="https://grafana.terrafusion.ai"

# PagerDuty for notifications
PAGERDUTY_INTEGRATION_KEY="${PAGERDUTY_KEY:-}"

# Slack webhook for notifications
SLACK_WEBHOOK="${SLACK_WEBHOOK_URL:-}"

###############################################################################
# Helper Functions
###############################################################################

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✅ $1${NC}"
}

log_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ❌ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠️  $1${NC}"
}

send_slack_notification() {
    local message=$1
    local color=${2:-"good"}
    
    if [[ -n "$SLACK_WEBHOOK" ]]; then
        curl -X POST "$SLACK_WEBHOOK" \
            -H 'Content-Type: application/json' \
            -d "{
                \"attachments\": [{
                    \"color\": \"$color\",
                    \"text\": \"$message\",
                    \"footer\": \"TerraFusion Deployment Bot\",
                    \"ts\": $(date +%s)
                }]
            }" || true
    fi
}

trigger_pagerduty() {
    local severity=$1
    local summary=$2
    local details=$3
    
    if [[ -n "$PAGERDUTY_INTEGRATION_KEY" ]]; then
        curl -X POST 'https://events.pagerduty.com/v2/enqueue' \
            -H 'Content-Type: application/json' \
            -d "{
                \"routing_key\": \"$PAGERDUTY_INTEGRATION_KEY\",
                \"event_action\": \"trigger\",
                \"payload\": {
                    \"summary\": \"$summary\",
                    \"severity\": \"$severity\",
                    \"source\": \"deployment-script\",
                    \"custom_details\": {
                        \"details\": \"$details\",
                        \"version\": \"$VERSION\",
                        \"environment\": \"$ENVIRONMENT\"
                    }
                }
            }" || true
    fi
}

###############################################################################
# Pre-flight Checks
###############################################################################

preflight_checks() {
    log "Running pre-flight checks..."
    
    # Check if version is provided
    if [[ -z "$VERSION" ]]; then
        log_error "Version not provided. Usage: ./blue-green-deploy.sh <version> <environment>"
        exit 1
    fi
    
    # Check if kubectl is installed
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl is not installed"
        exit 1
    fi
    
    # Check if we can connect to cluster
    if ! kubectl cluster-info &> /dev/null; then
        log_error "Cannot connect to Kubernetes cluster"
        exit 1
    fi
    
    # Check if namespace exists
    if ! kubectl get namespace "$NAMESPACE" &> /dev/null; then
        log_error "Namespace $NAMESPACE does not exist"
        exit 1
    fi
    
    # Check if Docker image exists
    if ! docker manifest inspect "terrafusion/api:$VERSION" &> /dev/null; then
        log_error "Docker image terrafusion/api:$VERSION does not exist"
        exit 1
    fi
    
    # Check error budget
    local error_budget=$(curl -s "$PROMETHEUS_URL/api/v1/query?query=slo_error_budget_remaining" | jq -r '.data.result[0].value[1]')
    if (( $(echo "$error_budget < 0.1" | bc -l) )); then
        log_error "Error budget depleted ($error_budget remaining). Deployment blocked."
        send_slack_notification "🚫 Deployment blocked: Error budget depleted" "danger"
        exit 1
    fi
    
    log_success "Pre-flight checks passed"
}

###############################################################################
# Determine Current Color
###############################################################################

get_current_color() {
    # Check which color is currently active
    local blue_pods=$(kubectl get pods -n "$NAMESPACE" -l "app=$DEPLOYMENT_NAME,color=blue" --field-selector=status.phase=Running -o json | jq '.items | length')
    local green_pods=$(kubectl get pods -n "$NAMESPACE" -l "app=$DEPLOYMENT_NAME,color=green" --field-selector=status.phase=Running -o json | jq '.items | length')
    
    if [[ $blue_pods -gt 0 && $green_pods -eq 0 ]]; then
        echo "blue"
    elif [[ $green_pods -gt 0 && $blue_pods -eq 0 ]]; then
        echo "green"
    else
        # Both or neither running, default to blue
        echo "blue"
    fi
}

###############################################################################
# Deploy New Version
###############################################################################

deploy_new_version() {
    local current_color=$1
    local new_color=$2
    
    log "Deploying version $VERSION as $new_color environment..."
    send_slack_notification "🚀 Starting deployment of version $VERSION to $ENVIRONMENT ($new_color environment)"
    
    # Create deployment manifest
    cat <<EOF | kubectl apply -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${DEPLOYMENT_NAME}-${new_color}
  namespace: ${NAMESPACE}
  labels:
    app: ${DEPLOYMENT_NAME}
    color: ${new_color}
    version: ${VERSION}
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: ${DEPLOYMENT_NAME}
      color: ${new_color}
  template:
    metadata:
      labels:
        app: ${DEPLOYMENT_NAME}
        color: ${new_color}
        version: ${VERSION}
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "3000"
        prometheus.io/path: "/metrics"
    spec:
      containers:
      - name: api
        image: terrafusion/api:${VERSION}
        ports:
        - containerPort: 3000
          name: http
        - containerPort: 9090
          name: metrics
        env:
        - name: NODE_ENV
          value: "${ENVIRONMENT}"
        - name: VERSION
          value: "${VERSION}"
        - name: COLOR
          value: "${new_color}"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: terrafusion-secrets
              key: database-url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: terrafusion-secrets
              key: redis-url
        resources:
          requests:
            cpu: 500m
            memory: 1Gi
          limits:
            cpu: 2000m
            memory: 4Gi
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 3
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              labelSelector:
                matchExpressions:
                - key: app
                  operator: In
                  values:
                  - ${DEPLOYMENT_NAME}
              topologyKey: kubernetes.io/hostname
---
apiVersion: v1
kind: Service
metadata:
  name: ${SERVICE_NAME}-${new_color}
  namespace: ${NAMESPACE}
  labels:
    app: ${DEPLOYMENT_NAME}
    color: ${new_color}
spec:
  type: ClusterIP
  ports:
  - port: 80
    targetPort: 3000
    protocol: TCP
    name: http
  selector:
    app: ${DEPLOYMENT_NAME}
    color: ${new_color}
EOF
    
    log_success "Deployment manifest applied"
}

###############################################################################
# Wait for Deployment
###############################################################################

wait_for_deployment() {
    local color=$1
    
    log "Waiting for $color deployment to be ready..."
    
    if kubectl rollout status deployment/${DEPLOYMENT_NAME}-${color} -n "$NAMESPACE" --timeout=5m; then
        log_success "$color deployment is ready"
        return 0
    else
        log_error "$color deployment failed to become ready"
        return 1
    fi
}

###############################################################################
# Health Checks
###############################################################################

run_health_checks() {
    local color=$1
    local service_url="http://${SERVICE_NAME}-${color}.${NAMESPACE}.svc.cluster.local"
    
    log "Running health checks on $color environment..."
    
    local retries=0
    while [[ $retries -lt $HEALTH_CHECK_RETRIES ]]; do
        if kubectl run health-check-${color} --rm -i --restart=Never --image=curlimages/curl:latest -- \
            curl -f -s "$service_url/health" > /dev/null 2>&1; then
            log_success "Health check passed for $color environment"
            return 0
        fi
        
        retries=$((retries + 1))
        log "Health check attempt $retries/$HEALTH_CHECK_RETRIES failed, retrying in ${HEALTH_CHECK_INTERVAL}s..."
        sleep $HEALTH_CHECK_INTERVAL
    done
    
    log_error "Health checks failed for $color environment after $HEALTH_CHECK_RETRIES attempts"
    return 1
}

###############################################################################
# Smoke Tests
###############################################################################

run_smoke_tests() {
    local color=$1
    local service_url="http://${SERVICE_NAME}-${color}.${NAMESPACE}.svc.cluster.local"
    
    log "Running smoke tests on $color environment..."
    send_slack_notification "🧪 Running smoke tests on $color environment"
    
    # Run smoke test suite
    kubectl run smoke-test-${color} --rm -i --restart=Never --image=terrafusion/smoke-tests:latest \
        --env="TARGET_URL=$service_url" \
        --env="TIMEOUT=$SMOKE_TEST_TIMEOUT" || {
        log_error "Smoke tests failed for $color environment"
        send_slack_notification "❌ Smoke tests failed on $color environment" "danger"
        return 1
    }
    
    log_success "Smoke tests passed for $color environment"
    send_slack_notification "✅ Smoke tests passed on $color environment" "good"
    return 0
}

###############################################################################
# Traffic Shifting (Canary)
###############################################################################

shift_traffic() {
    local new_color=$1
    local percentage=$2
    local old_color
    
    if [[ "$new_color" == "blue" ]]; then
        old_color="green"
    else
        old_color="blue"
    fi
    
    log "Shifting ${percentage}% of traffic to $new_color environment..."
    send_slack_notification "🔀 Shifting ${percentage}% traffic to $new_color ($VERSION)"
    
    # Update Ingress with weighted routing
    cat <<EOF | kubectl apply -f -
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ${DEPLOYMENT_NAME}-ingress
  namespace: ${NAMESPACE}
  annotations:
    kubernetes.io/ingress.class: nginx
    nginx.ingress.kubernetes.io/canary: "true"
    nginx.ingress.kubernetes.io/canary-weight: "${percentage}"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  tls:
  - hosts:
    - api.terrafusion.ai
    secretName: terrafusion-tls
  rules:
  - host: api.terrafusion.ai
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: ${SERVICE_NAME}-${new_color}
            port:
              number: 80
EOF
    
    # Wait for traffic to stabilize
    sleep 30
    
    log_success "Traffic shifted to ${percentage}% $new_color"
}

###############################################################################
# Monitor Metrics
###############################################################################

monitor_metrics() {
    local color=$1
    local duration=$2
    
    log "Monitoring metrics for $color environment for ${duration} seconds..."
    
    local start_time=$(date +%s)
    local end_time=$((start_time + duration))
    
    while [[ $(date +%s) -lt $end_time ]]; do
        # Query Prometheus for key metrics
        local error_rate=$(curl -s "${PROMETHEUS_URL}/api/v1/query?query=sum(rate(http_requests_total{color=\"${color}\",status=~\"5..\"}[1m]))/sum(rate(http_requests_total{color=\"${color}\"}[1m]))" | jq -r '.data.result[0].value[1] // 0')
        
        local p95_latency=$(curl -s "${PROMETHEUS_URL}/api/v1/query?query=histogram_quantile(0.95,sum(rate(http_request_duration_seconds_bucket{color=\"${color}\"}[1m]))by(le))" | jq -r '.data.result[0].value[1] // 0')
        
        local request_rate=$(curl -s "${PROMETHEUS_URL}/api/v1/query?query=sum(rate(http_requests_total{color=\"${color}\"}[1m]))" | jq -r '.data.result[0].value[1] // 0')
        
        log "Metrics - Error Rate: ${error_rate}, P95 Latency: ${p95_latency}s, Request Rate: ${request_rate}/s"
        
        # Check if metrics are within acceptable thresholds
        if (( $(echo "$error_rate > 0.05" | bc -l) )); then
            log_error "Error rate too high: $error_rate (>5%)"
            return 1
        fi
        
        if (( $(echo "$p95_latency > 2" | bc -l) )); then
            log_error "P95 latency too high: ${p95_latency}s (>2s)"
            return 1
        fi
        
        sleep 30
    done
    
    log_success "Metrics are healthy for $color environment"
    return 0
}

###############################################################################
# Rollback
###############################################################################

rollback() {
    local old_color=$1
    local new_color=$2
    
    log_error "ROLLBACK INITIATED - Reverting to $old_color environment"
    send_slack_notification "🔴 ROLLBACK: Deployment failed, reverting to $old_color" "danger"
    trigger_pagerduty "error" "Deployment Rollback" "Automatic rollback to $old_color due to failed health/smoke tests or metrics"
    
    # Shift 100% traffic back to old color
    shift_traffic "$old_color" 100
    
    # Delete new color deployment
    kubectl delete deployment ${DEPLOYMENT_NAME}-${new_color} -n "$NAMESPACE" || true
    kubectl delete service ${SERVICE_NAME}-${new_color} -n "$NAMESPACE" || true
    
    log_success "Rollback complete - $old_color is serving 100% traffic"
    
    exit 1
}

###############################################################################
# Complete Deployment
###############################################################################

complete_deployment() {
    local old_color=$1
    local new_color=$2
    
    log "Deployment successful! Cleaning up $old_color environment..."
    send_slack_notification "🎉 Deployment of $VERSION to $ENVIRONMENT SUCCESSFUL! $new_color is now serving 100% traffic" "good"
    
    # Keep old color online for 24 hours as safety net
    log "Keeping $old_color environment online for 24 hours as safety net"
    log "To manually remove: kubectl delete deployment ${DEPLOYMENT_NAME}-${old_color} -n $NAMESPACE"
    
    # Schedule cleanup (you could use a Kubernetes CronJob for this)
    echo "kubectl delete deployment ${DEPLOYMENT_NAME}-${old_color} -n $NAMESPACE" | at now + 24 hours 2>/dev/null || true
    
    log_success "Deployment complete! Version $VERSION is live in $ENVIRONMENT"
}

###############################################################################
# Main Deployment Flow
###############################################################################

main() {
    log "======================================================================"
    log "TerraFusion OS 1.0 - Blue-Green Deployment"
    log "Version: $VERSION"
    log "Environment: $ENVIRONMENT"
    log "======================================================================"
    
    # Pre-flight checks
    preflight_checks
    
    # Determine current and new colors
    CURRENT_COLOR=$(get_current_color)
    if [[ "$CURRENT_COLOR" == "blue" ]]; then
        NEW_COLOR="green"
    else
        NEW_COLOR="blue"
    fi
    
    log "Current active: $CURRENT_COLOR | Deploying to: $NEW_COLOR"
    
    # Deploy new version
    deploy_new_version "$CURRENT_COLOR" "$NEW_COLOR"
    
    # Wait for deployment to be ready
    if ! wait_for_deployment "$NEW_COLOR"; then
        rollback "$CURRENT_COLOR" "$NEW_COLOR"
    fi
    
    # Run health checks
    if ! run_health_checks "$NEW_COLOR"; then
        rollback "$CURRENT_COLOR" "$NEW_COLOR"
    fi
    
    # Run smoke tests
    if ! run_smoke_tests "$NEW_COLOR"; then
        rollback "$CURRENT_COLOR" "$NEW_COLOR"
    fi
    
    # Canary rollout with monitoring
    # Phase 1: 10% traffic for 15 minutes
    shift_traffic "$NEW_COLOR" 10
    if ! monitor_metrics "$NEW_COLOR" 900; then
        rollback "$CURRENT_COLOR" "$NEW_COLOR"
    fi
    
    # Phase 2: 25% traffic for 15 minutes
    shift_traffic "$NEW_COLOR" 25
    if ! monitor_metrics "$NEW_COLOR" 900; then
        rollback "$CURRENT_COLOR" "$NEW_COLOR"
    fi
    
    # Phase 3: 50% traffic for 30 minutes
    shift_traffic "$NEW_COLOR" 50
    if ! monitor_metrics "$NEW_COLOR" 1800; then
        rollback "$CURRENT_COLOR" "$NEW_COLOR"
    fi
    
    # Phase 4: 100% traffic
    shift_traffic "$NEW_COLOR" 100
    if ! monitor_metrics "$NEW_COLOR" 1800; then
        rollback "$CURRENT_COLOR" "$NEW_COLOR"
    fi
    
    # Deployment complete
    complete_deployment "$CURRENT_COLOR" "$NEW_COLOR"
    
    log "======================================================================"
    log_success "DEPLOYMENT SUCCESSFUL!"
    log "======================================================================"
}

# Run main function
main "$@"
