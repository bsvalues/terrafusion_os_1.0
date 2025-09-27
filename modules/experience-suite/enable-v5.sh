#!/usr/bin/env bash
# enable-v5.sh — deploy cert-manager, create issuers/cert, helmfile apply, build county tokens
set -euo pipefail

echo ">>> Installing cert-manager (CRDs)..."
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.15.3/cert-manager.crds.yaml
helm repo add jetstack https://charts.jetstack.io
helm upgrade --install cert-manager jetstack/cert-manager -n cert-manager --create-namespace

echo ">>> Applying ClusterIssuers..."
kubectl apply -f cert-manager/cluster-issuer-staging.yaml
kubectl apply -f cert-manager/cluster-issuer-prod.yaml

echo ">>> Deploying Helmfile stack (Kong, Prometheus, Grafana, TF umbrella)..."
helmfile apply

echo ">>> Creating app TLS Certificate (letsencrypt-prod by default)..."
kubectl apply -f cert-manager/certificate-app.yaml

echo ">>> Building county brand tokens (Style Dictionary)..."
npx style-dictionary build --config tools/style-dictionary/v5.config.json

echo "Done. Verify Ingress with: kubectl describe ingress tf-app"
