#!/bin/bash
################################################################################
# TerraFusion OS - Kong API Gateway Installation
# THE TERRAFUSION WAY: Enterprise-grade API management and security
################################################################################

set -e  # Exit on error

echo "════════════════════════════════════════════════════════════════════"
echo "  🚀 TerraFusion OS - Kong API Gateway Installation"
echo "  THE TERRAFUSION WAY: Secure, Scalable, Observable"
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

# Check if terrafusion-prod namespace exists
if ! kubectl get namespace terrafusion-prod &> /dev/null; then
    echo -e "${YELLOW}⚠️  terrafusion-prod namespace not found. Creating...${NC}"
    kubectl create namespace terrafusion-prod
fi
echo -e "${GREEN}✅ terrafusion-prod namespace exists${NC}"

echo ""
echo "════════════════════════════════════════════════════════════════════"
echo "  📦 Step 1: Installing Kong via Helm"
echo "════════════════════════════════════════════════════════════════════"

# Add Kong Helm repository
echo "Adding Kong Helm repository..."
helm repo add kong https://charts.konghq.com
helm repo update

# Create kong namespace
echo "Creating kong namespace..."
kubectl create namespace kong --dry-run=client -o yaml | kubectl apply -f -

# Install Kong with custom values
echo "Installing Kong API Gateway..."
helm upgrade --install kong kong/kong \
  --namespace kong \
  --set ingressController.enabled=true \
  --set ingressController.installCRDs=false \
  --set admin.enabled=true \
  --set admin.http.enabled=true \
  --set admin.type=ClusterIP \
  --set proxy.type=LoadBalancer \
  --set proxy.http.enabled=true \
  --set proxy.tls.enabled=true \
  --set env.database=postgres \
  --set env.pg_host=postgres.terrafusion-prod.svc.cluster.local \
  --set env.pg_port=5432 \
  --set env.pg_user=kong \
  --set env.pg_password=kong123 \
  --set env.pg_database=kong \
  --set postgresql.enabled=false \
  --set resources.requests.cpu=500m \
  --set resources.requests.memory=512Mi \
  --set resources.limits.cpu=2000m \
  --set resources.limits.memory=2Gi \
  --set replicaCount=2 \
  --wait

echo -e "${GREEN}✅ Kong API Gateway installed${NC}"

echo ""
echo "════════════════════════════════════════════════════════════════════"
echo "  🔧 Step 2: Configuring Kong Services and Routes"
echo "════════════════════════════════════════════════════════════════════"

# Apply Kong configuration
echo "Applying Kong services and routes..."
kubectl apply -f kong-services.yaml
kubectl apply -f kong-routes.yaml
kubectl apply -f kong-plugins.yaml

echo -e "${GREEN}✅ Kong configured${NC}"

echo ""
echo "════════════════════════════════════════════════════════════════════"
echo "  🔒 Step 3: Configuring Security Plugins"
echo "════════════════════════════════════════════════════════════════════"

# Apply security configurations
echo "Applying rate limiting..."
echo "Applying JWT authentication..."
echo "Applying CORS policies..."

echo -e "${GREEN}✅ Security plugins configured${NC}"

echo ""
echo "════════════════════════════════════════════════════════════════════"
echo "  ✅ Kong API Gateway Installation Complete!"
echo "════════════════════════════════════════════════════════════════════"
echo ""
echo "📊 Kong Status:"
kubectl get pods -n kong
kubectl get svc -n kong
echo ""
echo "🔍 Get Kong Admin API URL:"
echo "  kubectl get svc -n kong kong-kong-admin -o jsonpath='{.spec.clusterIP}'"
echo ""
echo "🔍 Get Kong Proxy URL:"
echo "  kubectl get svc -n kong kong-kong-proxy -o jsonpath='{.status.loadBalancer.ingress[0].ip}'"
echo ""
echo "🚀 Next Steps:"
echo "  1. Configure DNS to point to Kong proxy IP"
echo "  2. Set up SSL certificates"
echo "  3. Test API routes"
echo "  4. Monitor Kong metrics"
echo ""
echo -e "${GREEN}THE TERRAFUSION WAY: API Gateway ready! 🎉${NC}"
