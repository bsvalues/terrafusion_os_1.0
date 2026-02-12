# TerraFusionPro Helm Deployment

This directory contains Helm charts for deploying the TerraFusionPro platform to Kubernetes clusters.

## Prerequisites

- Kubernetes cluster 1.20+
- Helm 3.0+
- kubectl configured to communicate with your Kubernetes cluster
- Container registry access for storing Docker images

## Chart Overview

This Helm chart deploys the complete TerraFusionPro microservices platform, including:

- Web client frontend
- API Gateway
- Core microservices (User, Property, Form, Report, Analysis)
- PostgreSQL database
- Ingress configuration

## Installation

### 1. Configure Environment-Specific Values

The chart includes default configurations for different environments:

- `values-dev.yaml` - Development environment
- `values-staging.yaml` - Staging environment
- `values-production.yaml` - Production environment

### 2. Deploy Using the Script

The included `deploy.sh` script simplifies the deployment process:

```bash
# Make the script executable
chmod +x deploy.sh

# Deploy to development
./deploy.sh --environment dev --registry your-registry.com

# Deploy to staging
./deploy.sh --environment staging --registry your-registry.com

# Deploy to production
./deploy.sh --environment prod --registry your-registry.com --tag v1.0.0
```

### 3. Manual Deployment

Alternatively, you can deploy manually using Helm:

```bash
# Deploy to development
helm upgrade --install terrafusionpro-dev . \
  --namespace terrafusionpro-dev \
  --create-namespace \
  -f values-dev.yaml \
  --set global.imageRegistry=your-registry.com/ \
  --set global.imageTag=develop

# Deploy to staging
helm upgrade --install terrafusionpro-staging . \
  --namespace terrafusionpro-staging \
  --create-namespace \
  -f values-staging.yaml \
  --set global.imageRegistry=your-registry.com/ \
  --set global.imageTag=main

# Deploy to production
helm upgrade --install terrafusionpro . \
  --namespace terrafusionpro \
  --create-namespace \
  -f values-production.yaml \
  --set global.imageRegistry=your-registry.com/ \
  --set global.imageTag=v1.0.0
```

## Configuration

### Required Secrets

Before deployment, you need to create the following Kubernetes secrets:

1. Database credentials:
```bash
kubectl create secret generic terrafusionpro-db-credentials \
  --namespace terrafusionpro \
  --from-literal=username=postgres \
  --from-literal=password=your-secure-password \
  --from-literal=database-url=postgresql://postgres:your-secure-password@terrafusionpro-postgres:5432/terrafusionpro
```

2. JWT authentication secret:
```bash
kubectl create secret generic terrafusionpro-jwt-secret \
  --namespace terrafusionpro \
  --from-literal=jwt-secret=your-jwt-secret-key
```

These secrets are automatically created when using the `deploy.sh` script.

## Scaling

The Helm chart includes horizontal pod autoscaling configuration, which automatically scales services based on CPU utilization. You can adjust the autoscaling parameters in the values files.

## Monitoring and Logging

The production and staging configurations include:

- Prometheus metrics endpoints
- ServiceMonitor resources for Prometheus Operator
- ELK stack integration for centralized logging

## Upgrading

To upgrade an existing deployment:

```bash
# For production
./deploy.sh --environment prod --registry your-registry.com --tag v1.1.0
```

## Rollback

To rollback to a previous release:

```bash
# List releases
helm list -n terrafusionpro

# Rollback to previous release
helm rollback terrafusionpro 1 -n terrafusionpro
```

## Uninstallation

To remove the deployment:

```bash
# For production
helm uninstall terrafusionpro -n terrafusionpro
```

## Customization

To customize the deployment beyond the provided values, you can:

1. Edit the environment-specific values files
2. Provide additional parameters using `--set key=value` syntax
3. Create your own values file and use `-f your-values.yaml`