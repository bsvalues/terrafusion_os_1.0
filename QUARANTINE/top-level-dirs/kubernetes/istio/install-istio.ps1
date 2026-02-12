################################################################################
# TerraFusion OS - Istio Service Mesh Installation (PowerShell)
# THE TERRAFUSION WAY: Enterprise-grade security and traffic management
################################################################################

$ErrorActionPreference = "Stop"

Write-Host "════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  🚀 TerraFusion OS - Istio Service Mesh Installation" -ForegroundColor Cyan
Write-Host "  THE TERRAFUSION WAY: Secure, Observable, Reliable" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Check prerequisites
Write-Host "📋 Checking prerequisites..." -ForegroundColor Yellow

# Check if kubectl is installed
try {
    kubectl version --client --short | Out-Null
    Write-Host "✅ kubectl found" -ForegroundColor Green
} catch {
    Write-Host "❌ kubectl not found. Please install kubectl first." -ForegroundColor Red
    exit 1
}

# Check if connected to Kubernetes cluster
try {
    kubectl cluster-info | Out-Null
    Write-Host "✅ Connected to Kubernetes cluster" -ForegroundColor Green
} catch {
    Write-Host "❌ Not connected to Kubernetes cluster. Please configure kubectl." -ForegroundColor Red
    exit 1
}

# Check if Helm is installed
try {
    helm version --short | Out-Null
    Write-Host "✅ Helm found" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Helm not found. Please install Helm from https://helm.sh/docs/intro/install/" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  📦 Step 1: Installing Istio via Helm" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan

# Add Istio Helm repository
Write-Host "Adding Istio Helm repository..." -ForegroundColor Yellow
helm repo add istio https://istio-release.storage.googleapis.com/charts
helm repo update

# Create istio-system namespace
Write-Host "Creating istio-system namespace..." -ForegroundColor Yellow
kubectl create namespace istio-system --dry-run=client -o yaml | kubectl apply -f -

# Install Istio base chart (Custom Resource Definitions)
Write-Host "Installing Istio base (CRDs)..." -ForegroundColor Yellow
helm upgrade --install istio-base istio/base `
  -n istio-system `
  --wait

Write-Host "✅ Istio base installed" -ForegroundColor Green

# Install Istio discovery (istiod - control plane)
Write-Host "Installing Istio control plane (istiod)..." -ForegroundColor Yellow
helm upgrade --install istiod istio/istiod `
  -n istio-system `
  --set global.proxy.resources.requests.cpu=100m `
  --set global.proxy.resources.requests.memory=128Mi `
  --set global.proxy.resources.limits.cpu=2000m `
  --set global.proxy.resources.limits.memory=1024Mi `
  --set meshConfig.enableTracing=true `
  --set meshConfig.defaultConfig.tracing.zipkin.address=jaeger-collector.observability:9411 `
  --set meshConfig.accessLogFile=/dev/stdout `
  --wait

Write-Host "✅ Istio control plane installed" -ForegroundColor Green

# Install Istio ingress gateway
Write-Host "Installing Istio ingress gateway..." -ForegroundColor Yellow
helm upgrade --install istio-ingress istio/gateway `
  -n istio-system `
  --wait

Write-Host "✅ Istio ingress gateway installed" -ForegroundColor Green

Write-Host ""
Write-Host "════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  🔒 Step 2: Enabling Strict mTLS" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan

# Apply strict mTLS policy
$mtlsPolicy = @"
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: default
  namespace: istio-system
spec:
  mtls:
    mode: STRICT
"@

$mtlsPolicy | kubectl apply -f -

Write-Host "✅ Strict mTLS enabled globally" -ForegroundColor Green

Write-Host ""
Write-Host "════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  🏗️  Step 3: Creating TerraFusion Namespace" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan

# Apply namespace with Istio injection
kubectl apply -f ..\base\namespace.yaml

Write-Host "✅ terrafusion-prod namespace created with automatic sidecar injection" -ForegroundColor Green

Write-Host ""
Write-Host "════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  ✅ Istio Installation Complete!" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 Istio Status:" -ForegroundColor Yellow
kubectl get pods -n istio-system
Write-Host ""
Write-Host "🔍 Verify installation:" -ForegroundColor Yellow
Write-Host "  kubectl get svc -n istio-system"
Write-Host "  kubectl get pods -n istio-system"
Write-Host "  istioctl verify-install"
Write-Host ""
Write-Host "🚀 Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Deploy TerraFusion services to terrafusion-prod namespace"
Write-Host "  2. Apply VirtualServices and DestinationRules"
Write-Host "  3. Configure authorization policies"
Write-Host ""
Write-Host "THE TERRAFUSION WAY: Service mesh ready! 🎉" -ForegroundColor Green
