#!/bin/bash
# ============================================================================
# Deploy Auth Service Infrastructure to Staging
# ============================================================================
# Purpose: Deploy minimal auth service for RS256 migration rehearsal
# Environment: terrafusion-staging (Docker Desktop Kubernetes)
# ============================================================================

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
NAMESPACE="terrafusion-staging"
KEYS_DIR="$PROJECT_ROOT/auth/keys"

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
    esac
}

log INFO "========================================="
log INFO "Auth Service Infrastructure Deployment"
log INFO "========================================="
log INFO "Namespace: $NAMESPACE"
log INFO "Environment: Staging (Docker Desktop K8s)"
log INFO ""

# Step 1: Check kubectl connectivity
log INFO "Step 1: Checking Kubernetes connectivity..."
if ! kubectl cluster-info &>/dev/null; then
    log ERROR "Kubernetes cluster not accessible"
    log ERROR "Start Docker Desktop Kubernetes or run: minikube start"
    exit 1
fi
log SUCCESS "Kubernetes cluster accessible"

# Step 2: Verify namespace exists
log INFO "Step 2: Verifying namespace exists..."
if ! kubectl get namespace "$NAMESPACE" &>/dev/null; then
    log ERROR "Namespace '$NAMESPACE' not found"
    log ERROR "Create it: kubectl create namespace $NAMESPACE"
    exit 1
fi
log SUCCESS "Namespace exists: $NAMESPACE"

# Step 3: Generate JWT signing keys
log INFO "Step 3: Generating JWT signing keys..."
mkdir -p "$KEYS_DIR"

# Generate HS256 secret (for current state, pre-migration)
if [[ ! -f "$KEYS_DIR/hs256_secret.txt" ]]; then
    log INFO "Generating HS256 secret..."
    openssl rand -base64 64 > "$KEYS_DIR/hs256_secret.txt"
    log SUCCESS "HS256 secret generated"
else
    log WARNING "HS256 secret already exists, skipping"
fi

# Generate RS256 key pair (for migration target)
if [[ ! -f "$KEYS_DIR/tfos_2025_kid1_private.pem" ]]; then
    log INFO "Generating RS256 key pair..."
    openssl genrsa -out "$KEYS_DIR/tfos_2025_kid1_private.pem" 4096
    openssl rsa -in "$KEYS_DIR/tfos_2025_kid1_private.pem" \
                -pubout \
                -out "$KEYS_DIR/tfos_2025_kid1_public.pem"
    log SUCCESS "RS256 key pair generated"
else
    log WARNING "RS256 key pair already exists, skipping"
fi

log SUCCESS "JWT keys ready in: $KEYS_DIR"

# Step 4: Create Kubernetes secrets
log INFO "Step 4: Creating Kubernetes secrets..."

# Delete existing secret if present
if kubectl get secret jwt-signing-keys -n "$NAMESPACE" &>/dev/null; then
    log WARNING "Secret 'jwt-signing-keys' exists, deleting..."
    kubectl delete secret jwt-signing-keys -n "$NAMESPACE"
fi

# Create secret with all JWT keys
kubectl create secret generic jwt-signing-keys \
    --from-file=hs256_secret="$KEYS_DIR/hs256_secret.txt" \
    --from-file=rs256_private_key="$KEYS_DIR/tfos_2025_kid1_private.pem" \
    --from-file=rs256_public_key="$KEYS_DIR/tfos_2025_kid1_public.pem" \
    -n "$NAMESPACE"

log SUCCESS "Secret 'jwt-signing-keys' created"

# Step 5: Create JWKS ConfigMap
log INFO "Step 5: Creating JWKS ConfigMap..."

if kubectl get configmap jwks -n "$NAMESPACE" &>/dev/null; then
    log WARNING "ConfigMap 'jwks' exists, updating..."
    kubectl create configmap jwks \
        --from-file=jwks.json="$PROJECT_ROOT/auth/jwks/jwks.json" \
        -n "$NAMESPACE" \
        --dry-run=client -o yaml | kubectl apply -f -
else
    kubectl create configmap jwks \
        --from-file=jwks.json="$PROJECT_ROOT/auth/jwks/jwks.json" \
        -n "$NAMESPACE"
fi

log SUCCESS "ConfigMap 'jwks' created"

# Step 6: Deploy auth service
log INFO "Step 6: Deploying auth service..."

kubectl apply -f "$PROJECT_ROOT/ops/k8s/staging/auth-service-deployment.yaml"

log SUCCESS "Auth service deployment created"

# Step 7: Wait for deployment to be ready
log INFO "Step 7: Waiting for deployment to be ready..."
log INFO "This may take 1-2 minutes..."

if kubectl rollout status deployment/auth-service -n "$NAMESPACE" --timeout=5m; then
    log SUCCESS "Auth service deployment ready"
else
    log ERROR "Deployment failed to become ready"
    log ERROR "Check status: kubectl get pods -n $NAMESPACE"
    log ERROR "Check logs: kubectl logs -n $NAMESPACE -l app=auth-service"
    exit 1
fi

# Step 8: Verify deployment
log INFO "Step 8: Verifying deployment..."

PODS=$(kubectl get pods -n "$NAMESPACE" -l app=auth-service --no-headers | wc -l)
READY_PODS=$(kubectl get pods -n "$NAMESPACE" -l app=auth-service --no-headers | grep -c "Running" || true)

log INFO "Pods: $READY_PODS/$PODS running"

if [[ "$READY_PODS" -eq 0 ]]; then
    log ERROR "No pods running"
    kubectl get pods -n "$NAMESPACE" -l app=auth-service
    exit 1
fi

# Step 9: Display resources
log INFO "Step 9: Deployed resources:"
echo ""
kubectl get all,configmaps,secrets -n "$NAMESPACE" -l app=auth-service

log SUCCESS "========================================="
log SUCCESS "Auth Service Infrastructure Deployed!"
log SUCCESS "========================================="
echo ""
log INFO "Next Steps:"
log INFO "  1. Run Phase 0 pre-flight validation:"
log INFO "     bash ops/security/rs256/rs256-migrate.sh --phase 0 --env staging"
echo ""
log INFO "  2. If validation passes, start Phase 1:"
log INFO "     bash ops/security/rs256/rs256-migrate.sh --phase 1 --env staging"
echo ""
log INFO "Monitoring:"
log INFO "  - Watch pods: kubectl get pods -n $NAMESPACE -l app=auth-service -w"
log INFO "  - View logs: kubectl logs -n $NAMESPACE -l app=auth-service -f"
log INFO "  - Port forward: kubectl port-forward -n $NAMESPACE svc/auth-service 8080:8080"
echo ""
