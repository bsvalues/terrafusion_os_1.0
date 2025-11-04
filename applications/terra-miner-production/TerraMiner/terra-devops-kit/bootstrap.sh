#!/bin/bash
# TerraMiner DevOps Kit Bootstrap Script
# This script initializes the TerraMiner infrastructure and application components

set -e

echo "===== TerraMiner DevOps Kit Bootstrap ====="
echo "This script will set up the complete TerraMiner platform"

# Check prerequisites
echo "Checking prerequisites..."
command -v aws >/dev/null 2>&1 || { echo "AWS CLI is required but not installed. Aborting."; exit 1; }
command -v terraform >/dev/null 2>&1 || { echo "Terraform is required but not installed. Aborting."; exit 1; }
command -v kubectl >/dev/null 2>&1 || { echo "kubectl is required but not installed. Aborting."; exit 1; }
command -v helm >/dev/null 2>&1 || { echo "Helm is required but not installed. Aborting."; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "Docker is required but not installed. Aborting."; exit 1; }

# Load configuration
echo "Loading configuration from bootstrap-config.json..."
if [ ! -f bootstrap-config.json ]; then
  echo "Error: bootstrap-config.json not found!"
  exit 1
fi

# Create directories if they don't exist
mkdir -p terraform/environments/dev
mkdir -p terraform/environments/staging
mkdir -p terraform/environments/prod

# Set up infrastructure
echo "Setting up AWS infrastructure with Terraform..."
cd terraform/environments/dev
terraform init
terraform apply -auto-approve

# Configure kubectl
echo "Configuring kubectl to connect to EKS cluster..."
aws eks update-kubeconfig --name terraminer-dev-eks --region us-west-2

# Set up Kubernetes namespaces
echo "Setting up Kubernetes namespaces..."
kubectl create namespace terraminer --dry-run=client -o yaml | kubectl apply -f -
kubectl create namespace monitoring --dry-run=client -o yaml | kubectl apply -f -
kubectl create namespace argocd --dry-run=client -o yaml | kubectl apply -f -

# Deploy ArgoCD
echo "Deploying ArgoCD..."
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Apply ArgoCD configurations
echo "Applying ArgoCD configurations..."
kubectl apply -f ../../kubernetes/argocd/projects/
kubectl apply -f ../../kubernetes/argocd/applications/

# Set up monitoring
echo "Setting up monitoring stack..."
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update
helm install monitoring prometheus-community/kube-prometheus-stack -f ../../kubernetes/monitoring/prometheus-values.yaml -n monitoring

# Deploy secrets management
echo "Setting up HashiCorp Vault for secrets management..."
helm repo add hashicorp https://helm.releases.hashicorp.com
helm repo update
helm install vault hashicorp/vault -n terraminer

# Initialize the database
echo "Initializing database schemas..."
kubectl apply -f ../../kubernetes/jobs/db-init-job.yaml

echo "===== Bootstrap Complete ====="
echo "TerraMiner infrastructure has been successfully deployed!"
echo "Access your services:"
echo "  - ArgoCD UI: https://argocd.yourdomain.com"
echo "  - Grafana: https://grafana.yourdomain.com"
echo "  - TerraMiner API: https://api.terraminer.yourdomain.com"
