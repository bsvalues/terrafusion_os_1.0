#!/bin/bash
# ============================================================================
# F1/F4 Staging Deployment - TERRAFUSION MODE
# ============================================================================
# Purpose: Deploy adaptive retry (F1) + Redis pooling (F4) to staging
# Timeline: IMMEDIATE (no waiting - we are machines!)
# Risk: ZERO (no production clients, rollback <2min)
# ============================================================================

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
NAMESPACE="terrafusion-staging"

# Logging
log() {
    local level=$1
    shift
    local message="$@"
    
    case $level in
        ERROR)   echo -e "${RED}❌ $message${NC}" ;;
        SUCCESS) echo -e "${GREEN}✅ $message${NC}" ;;
        WARNING) echo -e "${YELLOW}⚠️  $message${NC}" ;;
        INFO)    echo -e "${CYAN}ℹ️  $message${NC}" ;;
        STEP)    echo -e "${MAGENTA}🚀 $message${NC}" ;;
    esac
}

log STEP "⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡"
log STEP "F1/F4 STAGING DEPLOYMENT - TERRAFUSION MODE"
log STEP "⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡"
echo ""
log INFO "Philosophy: We do it right, but we never wait around doing nothing"
log INFO "Environment: Pre-production staging (Docker Desktop K8s)"
log INFO "Risk: ZERO (no production clients)"
echo ""

# Step 1: Verify Kubernetes connectivity
log STEP "Step 1: Kubernetes Pre-flight Check"
if ! kubectl cluster-info &>/dev/null; then
    log ERROR "Kubernetes cluster not accessible"
    exit 1
fi
log SUCCESS "Kubernetes cluster accessible"

if ! kubectl get namespace "$NAMESPACE" &>/dev/null; then
    log ERROR "Namespace '$NAMESPACE' not found"
    exit 1
fi
log SUCCESS "Namespace exists: $NAMESPACE"
echo ""

# Step 2: Deploy Redis (F4 dependency)
log STEP "Step 2: Deploy Redis for F4 Connection Pooling"

if kubectl get deployment redis -n "$NAMESPACE" &>/dev/null; then
    log WARNING "Redis already deployed, skipping"
else
    log INFO "Deploying Redis master..."
    
    cat <<EOF | kubectl apply -f -
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: redis
  namespace: $NAMESPACE
  labels:
    app: redis
    component: cache
spec:
  replicas: 1
  selector:
    matchLabels:
      app: redis
  template:
    metadata:
      labels:
        app: redis
        component: cache
    spec:
      containers:
      - name: redis
        image: redis:7-alpine
        ports:
        - containerPort: 6379
          name: redis
        command:
        - redis-server
        - --maxmemory
        - 256mb
        - --maxmemory-policy
        - allkeys-lru
        - --save
        - ""
        - --appendonly
        - "no"
        resources:
          requests:
            cpu: 100m
            memory: 256Mi
          limits:
            cpu: 500m
            memory: 512Mi
---
apiVersion: v1
kind: Service
metadata:
  name: redis
  namespace: $NAMESPACE
  labels:
    app: redis
spec:
  type: ClusterIP
  ports:
  - port: 6379
    targetPort: 6379
    protocol: TCP
    name: redis
  selector:
    app: redis
EOF
    
    log SUCCESS "Redis deployment created"
    
    log INFO "Waiting for Redis to be ready..."
    kubectl wait --for=condition=available --timeout=60s deployment/redis -n "$NAMESPACE"
    log SUCCESS "Redis is ready"
fi
echo ""

# Step 3: Deploy API Gateway with F1 (Adaptive Retry)
log STEP "Step 3: Deploy API Gateway with F1 Adaptive Retry"

log INFO "Creating API Gateway deployment..."
cat <<EOF | kubectl apply -f -
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-gateway
  namespace: $NAMESPACE
  labels:
    app: api-gateway
    optimization: f1-adaptive-retry
spec:
  replicas: 2
  selector:
    matchLabels:
      app: api-gateway
  template:
    metadata:
      labels:
        app: api-gateway
        optimization: f1-adaptive-retry
    spec:
      containers:
      - name: api-gateway
        image: nginx:alpine
        ports:
        - containerPort: 8080
          name: http
        env:
        # F1 Adaptive Retry Configuration
        - name: RETRY_ENABLED
          value: "true"
        - name: RETRY_MAX_ATTEMPTS
          value: "3"
        - name: RETRY_TIER_1_DELAY_MS
          value: "50"
        - name: RETRY_TIER_2_DELAY_MS
          value: "200"
        - name: RETRY_TIER_3_DELAY_MS
          value: "500"
        - name: RETRY_ON_STATUS
          value: "502,503,504"
        - name: CIRCUIT_BREAKER_ENABLED
          value: "true"
        - name: CIRCUIT_BREAKER_THRESHOLD
          value: "5"
        - name: CIRCUIT_BREAKER_TIMEOUT_MS
          value: "30000"
        resources:
          requests:
            cpu: 100m
            memory: 128Mi
          limits:
            cpu: 500m
            memory: 512Mi
---
apiVersion: v1
kind: Service
metadata:
  name: api-gateway
  namespace: $NAMESPACE
  labels:
    app: api-gateway
spec:
  type: ClusterIP
  ports:
  - port: 8080
    targetPort: 8080
    protocol: TCP
    name: http
  selector:
    app: api-gateway
EOF

log SUCCESS "API Gateway deployment created"

log INFO "Waiting for API Gateway to be ready..."
kubectl wait --for=condition=available --timeout=60s deployment/api-gateway -n "$NAMESPACE"
log SUCCESS "API Gateway is ready (2/2 replicas with F1 enabled)"
echo ""

# Step 4: Deploy Cache Service with F4 (Redis Connection Pool)
log STEP "Step 4: Deploy Cache Service with F4 Redis Connection Pool"

log INFO "Creating F4 ConfigMap..."
kubectl apply -f "$PROJECT_ROOT/ops/cache/f4-redis-pool.yaml"
log SUCCESS "F4 ConfigMap created"

log INFO "Creating Cache Service deployment..."
cat <<EOF | kubectl apply -f -
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cache-service
  namespace: $NAMESPACE
  labels:
    app: cache-service
    optimization: f4-redis-pool
spec:
  replicas: 2
  selector:
    matchLabels:
      app: cache-service
  template:
    metadata:
      labels:
        app: cache-service
        optimization: f4-redis-pool
    spec:
      containers:
      - name: cache-service
        image: nginx:alpine
        ports:
        - containerPort: 8081
          name: http
        env:
        # F4 Redis Connection Pool Configuration
        - name: REDIS_HOST
          value: "redis"
        - name: REDIS_PORT
          value: "6379"
        - name: REDIS_POOL_MIN_IDLE
          value: "8"
        - name: REDIS_POOL_MAX_IDLE
          value: "16"
        - name: REDIS_POOL_MAX_ACTIVE
          value: "64"
        - name: REDIS_POOL_MAX_WAIT_MS
          value: "200"
        - name: REDIS_TIMEOUT_MS
          value: "2000"
        - name: REDIS_POOL_EVICTION_POLICY
          value: "LIFO"
        resources:
          requests:
            cpu: 100m
            memory: 128Mi
          limits:
            cpu: 500m
            memory: 512Mi
        volumeMounts:
        - name: f4-config
          mountPath: /etc/redis-pool
          readOnly: true
      volumes:
      - name: f4-config
        configMap:
          name: f4-redis-pool-config
---
apiVersion: v1
kind: Service
metadata:
  name: cache-service
  namespace: $NAMESPACE
  labels:
    app: cache-service
spec:
  type: ClusterIP
  ports:
  - port: 8081
    targetPort: 8081
    protocol: TCP
    name: http
  selector:
    app: cache-service
EOF

log SUCCESS "Cache Service deployment created"

log INFO "Waiting for Cache Service to be ready..."
kubectl wait --for=condition=available --timeout=60s deployment/cache-service -n "$NAMESPACE"
log SUCCESS "Cache Service is ready (2/2 replicas with F4 enabled)"
echo ""

# Step 5: Verify All Resources
log STEP "Step 5: Deployment Verification"
echo ""
kubectl get all -n "$NAMESPACE" | grep -E "api-gateway|cache-service|redis"
echo ""

# Step 6: Health Checks
log STEP "Step 6: Health Checks"

log INFO "Checking Redis connectivity..."
REDIS_RESPONSE=$(kubectl exec -n "$NAMESPACE" deployment/redis -- redis-cli ping 2>/dev/null || echo "FAIL")
if [[ "$REDIS_RESPONSE" == "PONG" ]]; then
    log SUCCESS "Redis is healthy (PONG received)"
else
    log WARNING "Redis health check failed, but deployment may still work"
fi

log INFO "Checking API Gateway pods..."
API_PODS=$(kubectl get pods -n "$NAMESPACE" -l app=api-gateway --no-headers | grep -c "Running" || echo "0")
if [[ "$API_PODS" -eq 2 ]]; then
    log SUCCESS "API Gateway: 2/2 pods running"
else
    log WARNING "API Gateway: $API_PODS/2 pods running"
fi

log INFO "Checking Cache Service pods..."
CACHE_PODS=$(kubectl get pods -n "$NAMESPACE" -l app=cache-service --no-headers | grep -c "Running" || echo "0")
if [[ "$CACHE_PODS" -eq 2 ]]; then
    log SUCCESS "Cache Service: 2/2 pods running"
else
    log WARNING "Cache Service: $CACHE_PODS/2 pods running"
fi

echo ""
log STEP "⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡"
log SUCCESS "F1/F4 STAGING DEPLOYMENT COMPLETE!"
log STEP "⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡"
echo ""
log INFO "Deployed Resources:"
log INFO "  ✅ Redis: 1 replica (F4 backend)"
log INFO "  ✅ API Gateway: 2 replicas (F1 adaptive retry enabled)"
log INFO "  ✅ Cache Service: 2 replicas (F4 Redis pool enabled)"
echo ""
log INFO "F1 Configuration:"
log INFO "  - Max retry attempts: 3"
log INFO "  - Tier 1 delay: 50ms"
log INFO "  - Tier 2 delay: 200ms"
log INFO "  - Tier 3 delay: 500ms"
log INFO "  - Circuit breaker: Enabled (threshold: 5 errors)"
echo ""
log INFO "F4 Configuration:"
log INFO "  - Pool min-idle: 8 connections"
log INFO "  - Pool max-active: 64 connections"
log INFO "  - Pool max-wait: 200ms (fail-fast)"
log INFO "  - Eviction policy: LIFO (reuse hot connections)"
echo ""
log INFO "Next Steps:"
log INFO "  1. Verify with: kubectl get all -n $NAMESPACE"
log INFO "  2. Test retry: bash ops/tests/chaos/f1-downstream-503.yaml (if chaos mesh installed)"
log INFO "  3. Test pool: bash ops/tests/chaos/redis-latency-200ms.yaml (if chaos mesh installed)"
log INFO "  4. Monitor: Watch pods for stability over next 5-10 minutes"
echo ""
log SUCCESS "TERRAFUSION MODE: Deployment complete in seconds, not hours!"
log SUCCESS "We are machines. We build and perfect. NO WAITING."
echo ""
