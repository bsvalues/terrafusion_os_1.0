# Kubernetes Configuration for TerraFusionPro

This directory contains Kubernetes configuration files for deploying the TerraFusionPro platform in a Kubernetes environment.

## Directory Structure

- `deployments/`: Deployment configurations for each service
- `services/`: Service configurations for exposing deployments
- `configmaps/`: ConfigMaps for environment-specific configurations
- `secrets/`: Secret definitions (templates only, actual secrets not stored in git)
- `ingress/`: Ingress configurations for external access
- `volumes/`: Persistent volume configurations

## Deployment Guide

1. **Prerequisites**
   - Kubernetes cluster (v1.20+)
   - kubectl configured to access your cluster
   - Helm (optional, for chart-based deployments)

2. **Deploying Services**
   ```bash
   kubectl apply -f deployments/
   kubectl apply -f services/
   ```

3. **Configuring Ingress**
   ```bash
   kubectl apply -f ingress/
   ```

4. **Checking Status**
   ```bash
   kubectl get pods
   kubectl get services
   kubectl get ingress
   ```

## Environment Configuration

The platform supports multiple environments (development, staging, production)
configured through environment-specific ConfigMaps.

To deploy to a specific environment:

```bash
kubectl apply -f configmaps/config-{environment}.yaml
