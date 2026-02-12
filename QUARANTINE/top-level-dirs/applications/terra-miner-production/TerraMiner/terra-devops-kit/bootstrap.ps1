# TerraMiner DevOps Kit Bootstrap Script for Windows
# This script initializes the TerraMiner infrastructure and application components

Write-Host "===== TerraMiner DevOps Kit Bootstrap ====="
Write-Host "This script will set up the complete TerraMiner platform"

# Check prerequisites
Write-Host "Checking prerequisites..."
function Check-Command($cmdname) {
    return [bool](Get-Command -Name $cmdname -ErrorAction SilentlyContinue)
}

$prerequisites = @{
    "aws" = "AWS CLI"
    "terraform" = "Terraform"
    "kubectl" = "kubectl"
    "helm" = "Helm"
    "docker" = "Docker"
}

$allInstalled = $true
foreach ($cmd in $prerequisites.Keys) {
    if (-not (Check-Command $cmd)) {
        Write-Host "$($prerequisites[$cmd]) is required but not installed. Please install it before continuing." -ForegroundColor Red
        $allInstalled = $false
    }
}

if (-not $allInstalled) {
    Write-Host "Please install all required prerequisites and run this script again." -ForegroundColor Red
    exit 1
}

# Load configuration
Write-Host "Loading configuration from bootstrap-config.json..."
if (-not (Test-Path -Path "bootstrap-config.json")) {
    Write-Host "Error: bootstrap-config.json not found!" -ForegroundColor Red
    exit 1
}

$config = Get-Content -Raw -Path "bootstrap-config.json" | ConvertFrom-Json

# Create directories if they don't exist
New-Item -ItemType Directory -Force -Path "terraform\environments\dev" | Out-Null
New-Item -ItemType Directory -Force -Path "terraform\environments\staging" | Out-Null
New-Item -ItemType Directory -Force -Path "terraform\environments\prod" | Out-Null

# Set up infrastructure
Write-Host "Setting up AWS infrastructure with Terraform..."
Set-Location -Path "terraform\environments\dev"
& terraform init
& terraform apply -auto-approve

# Configure kubectl
Write-Host "Configuring kubectl to connect to EKS cluster..."
& aws eks update-kubeconfig --name "$($config.environments.dev.eks_cluster_name)" --region "$($config.environments.dev.aws_region)"

# Set up Kubernetes namespaces
Write-Host "Setting up Kubernetes namespaces..."
"terraminer", "monitoring", "argocd" | ForEach-Object {
    $namespace = $_
    & kubectl create namespace $namespace --dry-run=client -o yaml | kubectl apply -f -
}

# Deploy ArgoCD
Write-Host "Deploying ArgoCD..."
& kubectl apply -n argocd -f "https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml"

# Apply ArgoCD configurations
Write-Host "Applying ArgoCD configurations..."
& kubectl apply -f "..\..\kubernetes\argocd\projects\"
& kubectl apply -f "..\..\kubernetes\argocd\applications\"

# Set up monitoring
Write-Host "Setting up monitoring stack..."
& helm repo add prometheus-community "https://prometheus-community.github.io/helm-charts"
& helm repo update
& helm install monitoring prometheus-community/kube-prometheus-stack -f "..\..\kubernetes\monitoring\prometheus-values.yaml" -n monitoring

# Deploy secrets management
Write-Host "Setting up HashiCorp Vault for secrets management..."
& helm repo add hashicorp "https://helm.releases.hashicorp.com"
& helm repo update
& helm install vault hashicorp/vault -n terraminer

# Initialize the database
Write-Host "Initializing database schemas..."
& kubectl apply -f "..\..\kubernetes\jobs\db-init-job.yaml"

Write-Host "===== Bootstrap Complete ====="
Write-Host "TerraMiner infrastructure has been successfully deployed!"
Write-Host "Access your services:"
Write-Host "  - ArgoCD UI: https://argocd.yourdomain.com"
Write-Host "  - Grafana: https://grafana.yourdomain.com"
Write-Host "  - TerraMiner API: https://api.terraminer.yourdomain.com"

# Return to original directory
Set-Location -Path $PSScriptRoot
