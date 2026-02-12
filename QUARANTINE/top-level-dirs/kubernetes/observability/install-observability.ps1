################################################################################
# TerraFusion OS - Complete Observability Stack Installation
# THE TERRAFUSION WAY: See everything, know everything, fix everything
################################################################################

$ErrorActionPreference = "Stop"

Write-Host "════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  🔍 TerraFusion OS - Observability Stack Installation" -ForegroundColor Cyan
Write-Host "  Prometheus + Grafana + Loki + Jaeger" -ForegroundColor Cyan
Write-Host "  THE TERRAFUSION WAY: Complete System Visibility" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Check prerequisites
Write-Host "📋 Checking prerequisites..." -ForegroundColor Yellow

try {
    kubectl version --client --short | Out-Null
    Write-Host "✅ kubectl found" -ForegroundColor Green
} catch {
    Write-Host "❌ kubectl not found. Please install kubectl first." -ForegroundColor Red
    exit 1
}

try {
    kubectl cluster-info | Out-Null
    Write-Host "✅ Connected to Kubernetes cluster" -ForegroundColor Green
} catch {
    Write-Host "❌ Not connected to Kubernetes cluster." -ForegroundColor Red
    exit 1
}

try {
    helm version --short | Out-Null
    Write-Host "✅ Helm found" -ForegroundColor Green
} catch {
    Write-Host "❌ Helm not found. Please install Helm." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  📦 Step 1: Creating Observability Namespace" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan

kubectl create namespace observability --dry-run=client -o yaml | kubectl apply -f -
Write-Host "✅ observability namespace created" -ForegroundColor Green

Write-Host ""
Write-Host "════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  📊 Step 2: Installing Prometheus Stack (kube-prometheus-stack)" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan

Write-Host "Adding Prometheus Helm repository..." -ForegroundColor Yellow
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

Write-Host "Installing kube-prometheus-stack..." -ForegroundColor Yellow
helm upgrade --install prometheus prometheus-community/kube-prometheus-stack `
  --namespace observability `
  --set prometheus.prometheusSpec.retention=30d `
  --set prometheus.prometheusSpec.storageSpec.volumeClaimTemplate.spec.resources.requests.storage=50Gi `
  --set prometheus.prometheusSpec.serviceMonitorSelectorNilUsesHelmValues=false `
  --set prometheus.prometheusSpec.podMonitorSelectorNilUsesHelmValues=false `
  --set grafana.enabled=true `
  --set grafana.adminPassword=admin `
  --set grafana.persistence.enabled=true `
  --set grafana.persistence.size=10Gi `
  --set alertmanager.enabled=true `
  --set alertmanager.persistence.size=5Gi `
  --wait --timeout 10m

Write-Host "✅ Prometheus Stack installed" -ForegroundColor Green

Write-Host ""
Write-Host "════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  📝 Step 3: Installing Loki (Log Aggregation)" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan

Write-Host "Adding Grafana Helm repository..." -ForegroundColor Yellow
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update

Write-Host "Installing Loki stack..." -ForegroundColor Yellow
helm upgrade --install loki grafana/loki-stack `
  --namespace observability `
  --set loki.persistence.enabled=true `
  --set loki.persistence.size=20Gi `
  --set promtail.enabled=true `
  --set grafana.enabled=false `
  --set loki.config.chunk_store_config.max_look_back_period=720h `
  --wait --timeout 5m

Write-Host "✅ Loki installed" -ForegroundColor Green

Write-Host ""
Write-Host "════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  🔗 Step 4: Installing Jaeger (Distributed Tracing)" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan

Write-Host "Adding Jaegertracing Helm repository..." -ForegroundColor Yellow
helm repo add jaegertracing https://jaegertracing.github.io/helm-charts
helm repo update

Write-Host "Installing Jaeger..." -ForegroundColor Yellow
helm upgrade --install jaeger jaegertracing/jaeger `
  --namespace observability `
  --set provisionDataStore.cassandra=false `
  --set allInOne.enabled=true `
  --set storage.type=memory `
  --set allInOne.extraEnv[0].name=COLLECTOR_ZIPKIN_HOST_PORT `
  --set allInOne.extraEnv[0].value=:9411 `
  --wait --timeout 5m

Write-Host "✅ Jaeger installed" -ForegroundColor Green

Write-Host ""
Write-Host "════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  🔧 Step 5: Configuring ServiceMonitors" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan

Write-Host "Applying ServiceMonitors..." -ForegroundColor Yellow
kubectl apply -f prometheus/servicemonitors.yaml
Write-Host "✅ ServiceMonitors configured" -ForegroundColor Green

Write-Host ""
Write-Host "════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  📈 Step 6: Importing Grafana Dashboards" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan

Write-Host "Applying Grafana dashboard ConfigMaps..." -ForegroundColor Yellow
kubectl apply -f grafana/dashboards.yaml
Write-Host "✅ Dashboards imported" -ForegroundColor Green

Write-Host ""
Write-Host "════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  🚨 Step 7: Configuring Alerting Rules" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan

Write-Host "Applying PrometheusRules..." -ForegroundColor Yellow
kubectl apply -f prometheus/alerting-rules.yaml
Write-Host "✅ Alerting rules configured" -ForegroundColor Green

Write-Host ""
Write-Host "════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  ✅ Observability Stack Installation Complete!" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

Write-Host "📊 Observability Status:" -ForegroundColor Yellow
kubectl get pods -n observability
Write-Host ""

Write-Host "🔍 Access UIs:" -ForegroundColor Yellow
Write-Host "  Grafana:" -ForegroundColor Cyan
Write-Host "    kubectl port-forward -n observability svc/prometheus-grafana 3000:80"
Write-Host "    http://localhost:3000 (admin/admin)"
Write-Host ""
Write-Host "  Prometheus:" -ForegroundColor Cyan
Write-Host "    kubectl port-forward -n observability svc/prometheus-kube-prometheus-prometheus 9090:9090"
Write-Host "    http://localhost:9090"
Write-Host ""
Write-Host "  Jaeger:" -ForegroundColor Cyan
Write-Host "    kubectl port-forward -n observability svc/jaeger-query 16686:16686"
Write-Host "    http://localhost:16686"
Write-Host ""
Write-Host "  AlertManager:" -ForegroundColor Cyan
Write-Host "    kubectl port-forward -n observability svc/prometheus-kube-prometheus-alertmanager 9093:9093"
Write-Host "    http://localhost:9093"
Write-Host ""

Write-Host "📈 Quick Checks:" -ForegroundColor Yellow
Write-Host "  # View metrics"
Write-Host "  kubectl get servicemonitors -n observability"
Write-Host ""
Write-Host "  # View alerts"
Write-Host "  kubectl get prometheusrules -n observability"
Write-Host ""
Write-Host "  # Check Loki logs"
Write-Host "  kubectl logs -n observability -l app=loki"
Write-Host ""

Write-Host "THE TERRAFUSION WAY: Complete observability achieved! 🎉" -ForegroundColor Green
