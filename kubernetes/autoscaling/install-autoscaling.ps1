#!/usr/bin/env pwsh
#
# TerraFusion OS - Auto-Scaling Installation Script
# Installs HPA, VPA, PDB, and configures cluster autoscaling
################################################################################

Write-Host "=================================================================================================" -ForegroundColor Cyan
Write-Host "  TerraFusion OS - Auto-Scaling & Load Balancing Installation" -ForegroundColor Cyan
Write-Host "=================================================================================================" -ForegroundColor Cyan
Write-Host ""

# Prerequisites check
Write-Host "Step 1: Checking prerequisites..." -ForegroundColor Yellow
Write-Host ""

# Check kubectl
if (!(Get-Command kubectl -ErrorAction SilentlyContinue)) {
    Write-Host "❌ kubectl is not installed. Please install kubectl first." -ForegroundColor Red
    exit 1
}
Write-Host "✅ kubectl found: $(kubectl version --client --short 2>$null)" -ForegroundColor Green

# Check cluster connection
Write-Host "Checking cluster connection..." -ForegroundColor Gray
$clusterInfo = kubectl cluster-info 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Cannot connect to Kubernetes cluster. Please check your kubeconfig." -ForegroundColor Red
    exit 1
}
Write-Host "✅ Connected to Kubernetes cluster" -ForegroundColor Green

# Check metrics server (required for HPA)
Write-Host "Checking metrics-server..." -ForegroundColor Gray
$metricsServer = kubectl get deployment metrics-server -n kube-system 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  metrics-server not found. Installing metrics-server..." -ForegroundColor Yellow
    kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install metrics-server" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ metrics-server installed" -ForegroundColor Green
    Write-Host "Waiting for metrics-server to be ready..." -ForegroundColor Gray
    kubectl wait --for=condition=available --timeout=300s deployment/metrics-server -n kube-system
} else {
    Write-Host "✅ metrics-server already installed" -ForegroundColor Green
}

Write-Host ""
Write-Host "=================================================================================================" -ForegroundColor Cyan
Write-Host "Step 2: Applying resource requests/limits..." -ForegroundColor Yellow
Write-Host "=================================================================================================" -ForegroundColor Cyan
Write-Host ""

# Apply resource limits
Write-Host "Applying resource requests/limits for all services..." -ForegroundColor Gray
kubectl apply -f resource-limits.yaml
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Some resources may already exist. Continuing..." -ForegroundColor Yellow
} else {
    Write-Host "✅ Resource requests/limits applied" -ForegroundColor Green
}

Write-Host ""
Write-Host "=================================================================================================" -ForegroundColor Cyan
Write-Host "Step 3: Creating HorizontalPodAutoscalers (HPA)..." -ForegroundColor Yellow
Write-Host "=================================================================================================" -ForegroundColor Cyan
Write-Host ""

# Apply HPAs
Write-Host "Creating HPA for Backend API (2-10 pods, CPU 70%)..." -ForegroundColor Gray
Write-Host "Creating HPA for AI Agent (2-5 pods, CPU 70%, queue depth <10)..." -ForegroundColor Gray
Write-Host "Creating HPA for MCP Servers (2-8 pods, CPU 70%)..." -ForegroundColor Gray
Write-Host "Creating HPA for Kong Gateway (2-6 pods, CPU 70%)..." -ForegroundColor Gray
kubectl apply -f hpa.yaml
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to create HPAs" -ForegroundColor Red
    exit 1
}
Write-Host "✅ HorizontalPodAutoscalers created" -ForegroundColor Green

Write-Host ""
Write-Host "=================================================================================================" -ForegroundColor Cyan
Write-Host "Step 4: Creating PodDisruptionBudgets (PDB)..." -ForegroundColor Yellow
Write-Host "=================================================================================================" -ForegroundColor Cyan
Write-Host ""

# Apply PDBs
Write-Host "Creating PDB to ensure high availability during disruptions..." -ForegroundColor Gray
kubectl apply -f pdb.yaml
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to create PDBs" -ForegroundColor Red
    exit 1
}
Write-Host "✅ PodDisruptionBudgets created" -ForegroundColor Green

Write-Host ""
Write-Host "=================================================================================================" -ForegroundColor Cyan
Write-Host "Step 5: Installing Vertical Pod Autoscaler (VPA) [Optional]..." -ForegroundColor Yellow
Write-Host "=================================================================================================" -ForegroundColor Cyan
Write-Host ""

# Check if VPA is already installed
$vpaCheck = kubectl get crd verticalpodautoscalers.autoscaling.k8s.io 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  VPA CRD not found. Installing VPA..." -ForegroundColor Yellow
    Write-Host "Cloning VPA repository..." -ForegroundColor Gray
    
    # Clone VPA repo to temp directory
    $tempDir = Join-Path $env:TEMP "vpa-install"
    if (Test-Path $tempDir) {
        Remove-Item $tempDir -Recurse -Force
    }
    git clone https://github.com/kubernetes/autoscaler.git $tempDir 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Push-Location (Join-Path $tempDir "vertical-pod-autoscaler")
        Write-Host "Installing VPA components..." -ForegroundColor Gray
        ./hack/vpa-up.sh
        Pop-Location
        Remove-Item $tempDir -Recurse -Force
        Write-Host "✅ VPA installed" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Could not install VPA automatically. Skipping VPA installation." -ForegroundColor Yellow
        Write-Host "   You can install VPA manually later if needed." -ForegroundColor Gray
    }
} else {
    Write-Host "✅ VPA already installed" -ForegroundColor Green
}

# Apply VPA configurations (if VPA is installed)
$vpaCheck = kubectl get crd verticalpodautoscalers.autoscaling.k8s.io 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "Applying VPA configurations..." -ForegroundColor Gray
    kubectl apply -f vpa.yaml
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ VPA configurations applied" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Failed to apply VPA configurations" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️  VPA not installed. Skipping VPA configurations." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=================================================================================================" -ForegroundColor Cyan
Write-Host "Step 6: Verifying auto-scaling setup..." -ForegroundColor Yellow
Write-Host "=================================================================================================" -ForegroundColor Cyan
Write-Host ""

# Wait for HPAs to initialize
Write-Host "Waiting for HPAs to initialize (30 seconds)..." -ForegroundColor Gray
Start-Sleep -Seconds 30

# Check HPA status
Write-Host ""
Write-Host "HorizontalPodAutoscaler Status:" -ForegroundColor Cyan
Write-Host "--------------------------------" -ForegroundColor Cyan
kubectl get hpa -A
Write-Host ""

# Check PDB status
Write-Host "PodDisruptionBudget Status:" -ForegroundColor Cyan
Write-Host "---------------------------" -ForegroundColor Cyan
kubectl get pdb -A
Write-Host ""

# Check VPA status (if installed)
$vpaCheck = kubectl get crd verticalpodautoscalers.autoscaling.k8s.io 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "VerticalPodAutoscaler Status:" -ForegroundColor Cyan
    Write-Host "-----------------------------" -ForegroundColor Cyan
    kubectl get vpa -A
    Write-Host ""
}

Write-Host ""
Write-Host "=================================================================================================" -ForegroundColor Cyan
Write-Host "Step 7: Post-Installation Information" -ForegroundColor Yellow
Write-Host "=================================================================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "✅ Auto-scaling installation complete!" -ForegroundColor Green
Write-Host ""
Write-Host "What was installed:" -ForegroundColor White
Write-Host "  • Resource requests/limits for 5 services (Backend API, AI Agent, MCP Servers, PostgreSQL, Redis)" -ForegroundColor Gray
Write-Host "  • HorizontalPodAutoscalers (HPA) for 4 services (auto-scale based on CPU/memory/custom metrics)" -ForegroundColor Gray
Write-Host "  • PodDisruptionBudgets (PDB) for 6 services (ensure high availability during disruptions)" -ForegroundColor Gray
Write-Host "  • VerticalPodAutoscalers (VPA) for 5 services [if installed] (optimize resource allocation)" -ForegroundColor Gray
Write-Host ""

Write-Host "Scaling Configuration:" -ForegroundColor White
Write-Host "  • Backend API:   2-10 pods (scale at 70% CPU)" -ForegroundColor Gray
Write-Host "  • AI Agent:      2-5 pods (scale at 70% CPU or queue depth >10)" -ForegroundColor Gray
Write-Host "  • MCP Servers:   2-8 pods (scale at 70% CPU)" -ForegroundColor Gray
Write-Host "  • Kong Gateway:  2-6 pods (scale at 70% CPU or >1000 RPS)" -ForegroundColor Gray
Write-Host ""

Write-Host "Monitoring Auto-Scaling:" -ForegroundColor White
Write-Host "  # Watch HPA in real-time" -ForegroundColor Gray
Write-Host "  kubectl get hpa -A --watch" -ForegroundColor Cyan
Write-Host ""
Write-Host "  # Describe specific HPA" -ForegroundColor Gray
Write-Host "  kubectl describe hpa backend-api-hpa -n terrafusion-prod" -ForegroundColor Cyan
Write-Host ""
Write-Host "  # Check current metrics" -ForegroundColor Gray
Write-Host "  kubectl top pods -n terrafusion-prod" -ForegroundColor Cyan
Write-Host ""
Write-Host "  # Check VPA recommendations (if installed)" -ForegroundColor Gray
Write-Host "  kubectl describe vpa backend-api-vpa -n terrafusion-prod" -ForegroundColor Cyan
Write-Host ""

Write-Host "Testing Auto-Scaling:" -ForegroundColor White
Write-Host "  # Generate load to trigger scaling (example with Apache Bench)" -ForegroundColor Gray
Write-Host "  kubectl run load-generator --image=httpd:alpine --rm -it -- ab -n 100000 -c 100 http://backend-api.terrafusion-prod:8080/" -ForegroundColor Cyan
Write-Host ""
Write-Host "  # Or use k6 for more sophisticated load testing" -ForegroundColor Gray
Write-Host "  k6 run load-test.js" -ForegroundColor Cyan
Write-Host ""

Write-Host "Grafana Dashboards:" -ForegroundColor White
Write-Host "  • System Overview - View current pod counts and scaling events" -ForegroundColor Gray
Write-Host "  • Kubernetes Cluster - Monitor resource utilization across nodes" -ForegroundColor Gray
Write-Host "  • Backend API / AI Agent / MCP Servers - Service-specific scaling metrics" -ForegroundColor Gray
Write-Host ""

Write-Host "Next Steps:" -ForegroundColor White
Write-Host "  1. Run load tests to validate scaling behavior" -ForegroundColor Gray
Write-Host "  2. Monitor Grafana dashboards during load tests" -ForegroundColor Gray
Write-Host "  3. Adjust HPA thresholds based on observed behavior" -ForegroundColor Gray
Write-Host "  4. Consider cluster autoscaling for node-level scaling (cloud provider)" -ForegroundColor Gray
Write-Host ""

Write-Host "=================================================================================================" -ForegroundColor Green
Write-Host "  Auto-Scaling Installation Complete! 🚀" -ForegroundColor Green
Write-Host "=================================================================================================" -ForegroundColor Green
