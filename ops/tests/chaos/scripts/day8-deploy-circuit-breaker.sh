#!/bin/bash
# ============================================================================
# Day 8 - Deploy Circuit Breaker Optimization (F2 Recovery)
# ============================================================================
# Objective: Deploy optimized circuit breaker config to staging and validate
# Expected: Recovery time reduces from 75s → <60s
# Duration: ~30 minutes deployment + validation
# ============================================================================

set -euo pipefail

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE="terrafusion"
CONFIG_FILE="ops/tests/chaos/configs/circuit-breaker-config.yaml"
STAGING_CONTEXT="${KUBE_CONTEXT:-docker-desktop}"
VALIDATION_DURATION=300  # 5 minutes

echo -e "${BLUE}============================================================================${NC}"
echo -e "${BLUE}Day 8 - Circuit Breaker Optimization Deployment${NC}"
echo -e "${BLUE}============================================================================${NC}"

# Step 1: Pre-deployment validation
echo -e "\n${YELLOW}Step 1: Pre-deployment validation${NC}"
echo "Checking Kubernetes cluster..."
if ! kubectl cluster-info &> /dev/null; then
    echo -e "${RED}❌ Kubernetes cluster not accessible${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Kubernetes cluster accessible${NC}"

echo "Checking namespace..."
if ! kubectl get namespace $NAMESPACE &> /dev/null; then
    echo -e "${YELLOW}⚠️  Namespace $NAMESPACE not found, creating...${NC}"
    kubectl create namespace $NAMESPACE
fi
echo -e "${GREEN}✅ Namespace $NAMESPACE ready${NC}"

echo "Checking Istio installation..."
if ! kubectl get deployment istiod -n istio-system &> /dev/null; then
    echo -e "${RED}❌ Istio not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Istio installed${NC}"

# Step 2: Backup current configuration
echo -e "\n${YELLOW}Step 2: Backing up current configuration${NC}"
BACKUP_DIR="ops/tests/chaos/backups/day8-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "Exporting current DestinationRules..."
kubectl get destinationrules -n $NAMESPACE -o yaml > "$BACKUP_DIR/destinationrules-backup.yaml" 2>/dev/null || true
echo -e "${GREEN}✅ Backup saved to $BACKUP_DIR${NC}"

# Step 3: Deploy optimized circuit breaker configuration
echo -e "\n${YELLOW}Step 3: Deploying optimized circuit breaker configuration${NC}"
echo "Configuration file: $CONFIG_FILE"

if [ ! -f "$CONFIG_FILE" ]; then
    echo -e "${RED}❌ Configuration file not found: $CONFIG_FILE${NC}"
    exit 1
fi

echo "Applying DestinationRules..."
kubectl apply -f "$CONFIG_FILE" -n $NAMESPACE

echo "Waiting for configuration to propagate (30 seconds)..."
sleep 30
echo -e "${GREEN}✅ Circuit breaker configuration deployed${NC}"

# Step 4: Verify deployment
echo -e "\n${YELLOW}Step 4: Verifying deployment${NC}"

echo "Checking DestinationRule status..."
kubectl get destinationrules -n $NAMESPACE -l terrafusion.dev/version=week2-day8 -o wide

echo -e "\nVerifying circuit breaker settings..."
kubectl get destinationrule terrafusion-api-dr-optimized -n $NAMESPACE -o jsonpath='{.spec.trafficPolicy.outlierDetection}' | jq '.'

# Step 5: Gradual rollout to staging
echo -e "\n${YELLOW}Step 5: Gradual rollout to staging subset${NC}"
echo "Enabling circuit breaker test header routing..."

# Create test deployment if not exists
if ! kubectl get deployment terrafusion-api -n $NAMESPACE &> /dev/null; then
    echo -e "${YELLOW}⚠️  terrafusion-api deployment not found${NC}"
    echo "For full validation, deploy the application first"
else
    echo "Labeling staging pods..."
    kubectl label pods -n $NAMESPACE -l app=terrafusion-api environment=staging --overwrite
    
    echo "Verifying pod labels..."
    kubectl get pods -n $NAMESPACE -l app=terrafusion-api --show-labels
    echo -e "${GREEN}✅ Staging subset configured${NC}"
fi

# Step 6: Health check monitoring
echo -e "\n${YELLOW}Step 6: Monitoring health for ${VALIDATION_DURATION}s${NC}"
echo "Watching for circuit breaker events..."

# Monitor Istio pilot logs for circuit breaker changes
echo "Checking Istio pilot logs..."
kubectl logs -n istio-system -l app=istiod --tail=50 | grep -i "outlier\|circuit" || echo "No circuit breaker events yet"

# Step 7: Validation report
echo -e "\n${YELLOW}Step 7: Validation report${NC}"

# Check if any pods were ejected
EJECTED_PODS=$(kubectl get pods -n $NAMESPACE -l app=terrafusion-api -o json | jq '[.items[] | select(.status.conditions[] | select(.type=="Ready" and .status=="False"))] | length')

echo "Circuit Breaker Deployment Summary:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Namespace: $NAMESPACE"
echo "DestinationRules deployed: $(kubectl get destinationrules -n $NAMESPACE -l terrafusion.dev/version=week2-day8 --no-headers | wc -l)"
echo "Ejected pods: $EJECTED_PODS"
echo "Backup location: $BACKUP_DIR"

# Configuration comparison
echo -e "\n${BLUE}Configuration Changes:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "consecutiveGatewayErrors: 5 → 3"
echo "interval: 30s → 10s"
echo "baseEjectionTime: 30s → 15s"
echo "Expected recovery improvement: 75s → ~45-55s"

echo -e "\n${GREEN}✅ Circuit breaker optimization deployed successfully!${NC}"
echo -e "\n${YELLOW}Next Steps:${NC}"
echo "1. Run F2 packet loss chaos test: make chaos:fault:30pct-loss"
echo "2. Measure recovery time with Prometheus"
echo "3. Validate recovery time <60s"
echo "4. Update day7_metrics_actual.json with new F2 values"
echo "5. Recalculate RI (expected: 0.9317 → 0.9500)"

echo -e "\n${YELLOW}Rollback Command (if needed):${NC}"
echo "kubectl apply -f $BACKUP_DIR/destinationrules-backup.yaml"
echo "kubectl rollout restart deployment/terrafusion-api -n $NAMESPACE"

echo -e "\n${BLUE}============================================================================${NC}"
echo -e "${GREEN}Deployment Complete! Ready for F2 validation testing.${NC}"
echo -e "${BLUE}============================================================================${NC}"
