#!/bin/bash
set -e

# TerraFusionPro Deployment Script
# This script deploys the TerraFusionPro platform to the specified environment

# Display usage information
function show_usage {
  echo "Usage: $0 [options]"
  echo ""
  echo "Options:"
  echo "  -e, --environment <env>  Target environment (dev, staging, prod)"
  echo "  -n, --namespace <ns>     Kubernetes namespace (default: terrafusionpro-<env>)"
  echo "  -r, --registry <url>     Container registry URL"
  echo "  -t, --tag <tag>          Image tag to deploy (default: latest for prod, main for staging, develop for dev)"
  echo "  -h, --help               Show this help message"
  echo ""
  echo "Example:"
  echo "  $0 --environment dev --registry registry.terrafusionpro.com --tag dev-123"
}

# Default values
ENVIRONMENT=""
NAMESPACE=""
REGISTRY=""
TAG=""

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    -e|--environment)
      ENVIRONMENT="$2"
      shift 2
      ;;
    -n|--namespace)
      NAMESPACE="$2"
      shift 2
      ;;
    -r|--registry)
      REGISTRY="$2"
      shift 2
      ;;
    -t|--tag)
      TAG="$2"
      shift 2
      ;;
    -h|--help)
      show_usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      show_usage
      exit 1
      ;;
  esac
done

# Validate environment
if [[ -z "$ENVIRONMENT" ]]; then
  echo "Error: Environment is required"
  show_usage
  exit 1
fi

# Check if environment is valid
if [[ "$ENVIRONMENT" != "dev" && "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "prod" ]]; then
  echo "Error: Invalid environment. Valid values are dev, staging, or prod"
  exit 1
fi

# Set default namespace if not specified
if [[ -z "$NAMESPACE" ]]; then
  if [[ "$ENVIRONMENT" == "prod" ]]; then
    NAMESPACE="terrafusionpro"
  else
    NAMESPACE="terrafusionpro-$ENVIRONMENT"
  fi
fi

# Set default tag if not specified
if [[ -z "$TAG" ]]; then
  if [[ "$ENVIRONMENT" == "prod" ]]; then
    TAG="latest"
  elif [[ "$ENVIRONMENT" == "staging" ]]; then
    TAG="main"
  else
    TAG="develop"
  fi
fi

# Validate registry
if [[ -z "$REGISTRY" ]]; then
  echo "Error: Container registry URL is required"
  show_usage
  exit 1
fi

echo "Deploying TerraFusionPro to $ENVIRONMENT environment"
echo "Namespace: $NAMESPACE"
echo "Registry: $REGISTRY"
echo "Image Tag: $TAG"

# Create namespace if it doesn't exist
kubectl create namespace "$NAMESPACE" --dry-run=client -o yaml | kubectl apply -f -

# Generate values file with environment-specific and image registry/tag configurations
VALUES_FILE="values-$ENVIRONMENT.yaml"
EXTRA_ARGS="--set global.imageRegistry=$REGISTRY/ --set global.imageTag=$TAG"

# Check if the secrets are already deployed
if kubectl get secret -n "$NAMESPACE" "terrafusionpro-db-credentials" &> /dev/null; then
  echo "Database credentials secret already exists"
else
  echo "Please enter the database credentials for $ENVIRONMENT environment:"
  read -p "Database Username: " DB_USER
  read -s -p "Database Password: " DB_PASSWORD
  echo ""
  
  # Create database credentials secret
  kubectl create secret generic "terrafusionpro-db-credentials" \
    --from-literal=username="$DB_USER" \
    --from-literal=password="$DB_PASSWORD" \
    --from-literal=database-url="postgresql://$DB_USER:$DB_PASSWORD@terrafusionpro-postgres:5432/terrafusionpro" \
    -n "$NAMESPACE"
fi

if kubectl get secret -n "$NAMESPACE" "terrafusionpro-jwt-secret" &> /dev/null; then
  echo "JWT secret already exists"
else
  echo "Please enter the JWT secret for $ENVIRONMENT environment:"
  read -s -p "JWT Secret: " JWT_SECRET
  echo ""
  
  # Create JWT secret
  kubectl create secret generic "terrafusionpro-jwt-secret" \
    --from-literal=jwt-secret="$JWT_SECRET" \
    -n "$NAMESPACE"
fi

# Deploy the Helm chart
helm upgrade --install "terrafusionpro-$ENVIRONMENT" . \
  --namespace "$NAMESPACE" \
  -f "$VALUES_FILE" \
  $EXTRA_ARGS

echo ""
echo "Deployment completed successfully"
echo "Checking deployment status..."

# Wait for deployments to become ready
kubectl rollout status deployment/api-gateway -n "$NAMESPACE"
kubectl rollout status deployment/web-client -n "$NAMESPACE"
kubectl rollout status deployment/property-service -n "$NAMESPACE"
kubectl rollout status deployment/user-service -n "$NAMESPACE"
kubectl rollout status deployment/form-service -n "$NAMESPACE"
kubectl rollout status deployment/report-service -n "$NAMESPACE"
kubectl rollout status deployment/analysis-service -n "$NAMESPACE"

echo ""
echo "All services deployed successfully!"
echo ""

# Get the Ingress URLs
if kubectl get ingress -n "$NAMESPACE" &> /dev/null; then
  echo "Access the application at:"
  kubectl get ingress -n "$NAMESPACE" -o jsonpath='{.items[0].spec.rules[*].host}' | tr ' ' '\n' | sed 's/^/https:\/\//'
fi

echo ""
echo "For detailed status, run: kubectl get pods -n $NAMESPACE"