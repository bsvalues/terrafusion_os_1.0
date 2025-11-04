#!/bin/bash

set -e

NAMESPACE="terrafusion-pro"
ENVIRONMENT=${1:-staging}

echo "🚀 Deploying TerraFusionPro-1 to Kubernetes ($ENVIRONMENT)"

if [ "$ENVIRONMENT" = "production" ]; then
    echo "⚠️  Production deployment requires manual approval"
    read -p "Are you sure you want to deploy to production? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        echo "Deployment cancelled"
        exit 1
    fi
fi

kubectl create namespace $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -

kubectl apply -f kubernetes/namespace.yaml
kubectl apply -f kubernetes/deployment.yaml
kubectl apply -f kubernetes/service.yaml
kubectl apply -f kubernetes/hpa.yaml
kubectl apply -f kubernetes/ingress.yaml

echo "⏳ Waiting for deployment to be ready..."
kubectl rollout status deployment/terrafusion-app -n $NAMESPACE --timeout=300s

echo "🔍 Verifying deployment health..."
kubectl get pods -n $NAMESPACE
kubectl get services -n $NAMESPACE
kubectl get ingress -n $NAMESPACE

echo "✅ Deployment completed successfully!"

if [ "$ENVIRONMENT" = "production" ]; then
    echo "🌍 Production deployment live at: https://terrafusion.com"
else
    echo "🧪 Staging deployment ready for testing"
fi
