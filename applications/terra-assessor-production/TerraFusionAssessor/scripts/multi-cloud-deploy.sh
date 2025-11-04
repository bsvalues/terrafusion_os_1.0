#!/bin/bash

set -e

ENVIRONMENT=${1:-staging}
REGIONS=("us-west-2" "us-east-1" "eu-west-1" "ap-southeast-1")

echo "🌍 Deploying TerraFusionPro-1 to Multi-Cloud Infrastructure ($ENVIRONMENT)"

echo "📋 Pre-deployment checks..."
terraform --version
kubectl version --client
helm version

echo "🏗️  Provisioning infrastructure with Terraform..."
cd terraform
terraform init
terraform plan -var="environment=$ENVIRONMENT"
terraform apply -var="environment=$ENVIRONMENT" -auto-approve

echo "⚙️  Configuring Kubernetes contexts..."
aws eks update-kubeconfig --region us-west-2 --name terrafusion-$ENVIRONMENT-aws
gcloud container clusters get-credentials terrafusion-$ENVIRONMENT-gcp --region us-central1
az aks get-credentials --resource-group terrafusion-$ENVIRONMENT --name terrafusion-$ENVIRONMENT-azure

echo "📦 Installing Helm charts..."
for region in "${REGIONS[@]}"; do
    echo "Deploying to region: $region"
    
    kubectl config use-context terrafusion-$ENVIRONMENT-$region
    
    helm upgrade --install terrafusion-pro ./helm/terrafusion \
        --namespace terrafusion-pro \
        --create-namespace \
        --set environment=$ENVIRONMENT \
        --set image.tag=$GITHUB_SHA \
        --wait --timeout=600s
    
    echo "✅ Deployment to $region completed"
done

echo "🔍 Verifying deployments..."
for region in "${REGIONS[@]}"; do
    kubectl config use-context terrafusion-$ENVIRONMENT-$region
    kubectl get pods -n terrafusion-pro
    kubectl get services -n terrafusion-pro
done

echo "🌐 Setting up global load balancer..."
kubectl apply -f kubernetes/global-load-balancer.yaml

echo "📊 Deployment summary:"
echo "Environment: $ENVIRONMENT"
echo "Regions deployed: ${REGIONS[*]}"
echo "Total pods: $(kubectl get pods --all-namespaces | grep terrafusion | wc -l)"
echo "Global endpoint: https://terrafusion.com"

echo "✅ Multi-cloud deployment completed successfully!"
