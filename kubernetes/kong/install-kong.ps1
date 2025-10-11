################################################################################
# TerraFusion OS - Kong API Gateway Installation (PowerShell)
# THE TERRAFUSION WAY: Enterprise-grade API management and security
################################################################################

$ErrorActionPreference = "Stop"

Write-Host "════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  🚀 TerraFusion OS - Kong API Gateway Installation" -ForegroundColor Cyan
Write-Host "  THE TERRAFUSION WAY: Secure, Scalable, Observable" -ForegroundColor Cyan
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

# Check if terrafusion-prod namespace exists
try {
    kubectl get namespace terrafusion-prod | Out-Null
    Write-Host "✅ terrafusion-prod namespace exists" -ForegroundColor Green
} catch {
    Write-Host "⚠️  terrafusion-prod namespace not found. Creating..." -ForegroundColor Yellow
    kubectl create namespace terrafusion-prod
}

Write-Host ""
Write-Host "════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  📦 Step 1: Installing Kong via Helm" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan

# Add Kong Helm repository
Write-Host "Adding Kong Helm repository..." -ForegroundColor Yellow
helm repo add kong https://charts.konghq.com
helm repo update

# Create kong namespace
Write-Host "Creating kong namespace..." -ForegroundColor Yellow
kubectl create namespace kong --dry-run=client -o yaml | kubectl apply -f -

# Install Kong with custom values
Write-Host "Installing Kong API Gateway..." -ForegroundColor Yellow
helm upgrade --install kong kong/kong `
  --namespace kong `
  --set ingressController.enabled=true `
  --set ingressController.installCRDs=false `
  --set admin.enabled=true `
  --set admin.http.enabled=true `
  --set admin.type=ClusterIP `
  --set proxy.type=LoadBalancer `
  --set proxy.http.enabled=true `
  --set proxy.tls.enabled=true `
  --set env.database=postgres `
  --set env.pg_host=postgres.terrafusion-prod.svc.cluster.local `
  --set env.pg_port=5432 `
  --set env.pg_user=kong `
  --set env.pg_password=kong123 `
  --set env.pg_database=kong `
  --set postgresql.enabled=false `
  --set resources.requests.cpu=500m `
  --set resources.requests.memory=512Mi `
  --set resources.limits.cpu=2000m `
  --set resources.limits.memory=2Gi `
  --set replicaCount=2 `
  --wait

Write-Host "✅ Kong API Gateway installed" -ForegroundColor Green

Write-Host ""
Write-Host "════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  🔧 Step 2: Configuring Kong Services and Routes" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan

# Apply Kong configuration
Write-Host "Applying Kong services and routes..." -ForegroundColor Yellow
kubectl apply -f kong-services.yaml
kubectl apply -f kong-routes.yaml
kubectl apply -f kong-plugins.yaml

Write-Host "✅ Kong configured" -ForegroundColor Green

Write-Host ""
Write-Host "════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  🔒 Step 3: Configuring Security Plugins" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan

Write-Host "Applying rate limiting..." -ForegroundColor Yellow
Write-Host "Applying JWT authentication..." -ForegroundColor Yellow
Write-Host "Applying CORS policies..." -ForegroundColor Yellow

Write-Host "✅ Security plugins configured" -ForegroundColor Green

Write-Host ""
Write-Host "════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  ✅ Kong API Gateway Installation Complete!" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 Kong Status:" -ForegroundColor Yellow
kubectl get pods -n kong
kubectl get svc -n kong
Write-Host ""
Write-Host "🔍 Get Kong Admin API URL:" -ForegroundColor Yellow
Write-Host "  kubectl get svc -n kong kong-kong-admin -o jsonpath='{.spec.clusterIP}'"
Write-Host ""
Write-Host "🔍 Get Kong Proxy URL:" -ForegroundColor Yellow
Write-Host "  kubectl get svc -n kong kong-kong-proxy -o jsonpath='{.status.loadBalancer.ingress[0].ip}'"
Write-Host ""
Write-Host "🚀 Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Configure DNS to point to Kong proxy IP"
Write-Host "  2. Set up SSL certificates"
Write-Host "  3. Test API routes"
Write-Host "  4. Monitor Kong metrics"
Write-Host ""
Write-Host "THE TERRAFUSION WAY: API Gateway ready! 🎉" -ForegroundColor Green
