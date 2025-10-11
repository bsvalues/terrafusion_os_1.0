#!/bin/bash
################################################################################
# TerraFusion OS - Istio Service Mesh Installation
# THE TERRAFUSION WAY: Enterprise-grade security and traffic management
################################################################################

set -e  # Exit on error

echo "════════════════════════════════════════════════════════════════════"
echo "  🚀 TerraFusion OS - Istio Service Mesh Installation"
echo "  THE TERRAFUSION WAY: Secure, Observable, Reliable"
echo "════════════════════════════════════════════════════════════════════"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check prerequisites
echo "📋 Checking prerequisites..."

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}❌ kubectl not found. Please install kubectl first.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ kubectl found${NC}"

# Check if connected to Kubernetes cluster
if ! kubectl cluster-info &> /dev/null; then
    echo -e "${RED}❌ Not connected to Kubernetes cluster. Please configure kubectl.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Connected to Kubernetes cluster${NC}"

# Check if Helm is installed
if ! command -v helm &> /dev/null; then
    echo -e "${YELLOW}⚠️  Helm not found. Installing Helm...${NC}"
    curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
fi
echo -e "${GREEN}✅ Helm found${NC}"

echo ""
echo "════════════════════════════════════════════════════════════════════"
echo "  📦 Step 1: Installing Istio via Helm"
echo "════════════════════════════════════════════════════════════════════"

# Add Istio Helm repository
echo "Adding Istio Helm repository..."
helm repo add istio https://istio-release.storage.googleapis.com/charts
helm repo update

# Create istio-system namespace
echo "Creating istio-system namespace..."
kubectl create namespace istio-system --dry-run=client -o yaml | kubectl apply -f -

# Install Istio base chart (Custom Resource Definitions)
echo "Installing Istio base (CRDs)..."
helm upgrade --install istio-base istio/base \
  -n istio-system \
  --wait

echo -e "${GREEN}✅ Istio base installed${NC}"

# Install Istio discovery (istiod - control plane)
echo "Installing Istio control plane (istiod)..."
helm upgrade --install istiod istio/istiod \
  -n istio-system \
  --set global.proxy.resources.requests.cpu=100m \
  --set global.proxy.resources.requests.memory=128Mi \
  --set global.proxy.resources.limits.cpu=2000m \
  --set global.proxy.resources.limits.memory=1024Mi \
  --set meshConfig.enableTracing=true \
  --set meshConfig.defaultConfig.tracing.zipkin.address=jaeger-collector.observability:9411 \
  --set meshConfig.accessLogFile=/dev/stdout \
  --wait

echo -e "${GREEN}✅ Istio control plane installed${NC}"

# Install Istio ingress gateway
echo "Installing Istio ingress gateway..."
helm upgrade --install istio-ingress istio/gateway \
  -n istio-system \
  --wait

echo -e "${GREEN}✅ Istio ingress gateway installed${NC}"

echo ""
echo "════════════════════════════════════════════════════════════════════"
echo "  🔒 Step 2: Enabling Strict mTLS"
echo "════════════════════════════════════════════════════════════════════"

# Apply strict mTLS policy
kubectl apply -f - <<EOF
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: default
  namespace: istio-system
spec:
  mtls:
    mode: STRICT
EOF

echo -e "${GREEN}✅ Strict mTLS enabled globally${NC}"

echo ""
echo "════════════════════════════════════════════════════════════════════"
echo "  🏗️  Step 3: Creating TerraFusion Namespace"
echo "════════════════════════════════════════════════════════════════════"

# Apply namespace with Istio injection
kubectl apply -f ../base/namespace.yaml

echo -e "${GREEN}✅ terrafusion-prod namespace created with automatic sidecar injection${NC}"

echo ""
echo "════════════════════════════════════════════════════════════════════"
echo "  ✅ Istio Installation Complete!"
echo "════════════════════════════════════════════════════════════════════"
echo ""
echo "📊 Istio Status:"
kubectl get pods -n istio-system
echo ""
echo "🔍 Verify installation:"
echo "  kubectl get svc -n istio-system"
echo "  kubectl get pods -n istio-system"
echo "  istioctl verify-install"
echo ""
echo "🚀 Next Steps:"
echo "  1. Deploy TerraFusion services to terrafusion-prod namespace"
echo "  2. Apply VirtualServices and DestinationRules"
echo "  3. Configure authorization policies"
echo ""
echo -e "${GREEN}THE TERRAFUSION WAY: Service mesh ready! 🎉${NC}"
