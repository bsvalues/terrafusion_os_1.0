# TerraFusion OS - DevOps Implementation Guide

**Government. Transcended. - Championship-Level Infrastructure Excellence**

## 📋 Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Architecture](#architecture)
- [Docker Infrastructure](#docker-infrastructure)
- [Kubernetes Deployment](#kubernetes-deployment)
- [Local Development](#local-development)
- [Production Deployment](#production-deployment)
- [Monitoring & Observability](#monitoring--observability)
- [Security & Compliance](#security--compliance)
- [Troubleshooting](#troubleshooting)
- [CI/CD Integration](#cicd-integration)

---

## Overview

This guide covers the complete DevOps infrastructure for TerraFusion OS, including containerization, orchestration, deployment automation, and monitoring strategies.

### System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    TerraFusion OS Platform                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │   API    │  │ Gateway  │  │Conscious.│  │Operations│      │
│  │ (5000)   │  │ (3002)   │  │  (3004)  │  │  (5003)  │      │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘      │
│       │             │              │              │             │
│  ┌────▼─────────────▼──────────────▼──────────────▼─────┐     │
│  │          NGINX Ingress Controller (HTTPS)            │     │
│  └───────────────────────────────────────────────────────┘     │
│                            │                                    │
│  ┌─────────────────────────▼──────────────────────────┐       │
│  │     PostgreSQL (Primary + Replica) + Redis Cache   │       │
│  └─────────────────────────────────────────────────────┘       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Key Features

- **Containerization**: Multi-stage Docker builds with Alpine Linux
- **Orchestration**: Kubernetes with HPA, PDB, and zero-downtime deployments
- **High Availability**: Multiple replicas, database replication, session affinity
- **Security**: FISMA-High compliance, TLS 1.3, non-root containers, network policies
- **Monitoring**: Prometheus metrics, Grafana dashboards, health checks
- **Performance**: <10ms response times, auto-scaling, resource optimization

---

## Prerequisites

### Required Tools

```bash
# Docker Desktop or Docker Engine
docker --version  # Minimum: 24.0.0

# Kubernetes CLI
kubectl version --client  # Minimum: 1.28.0

# Docker Compose
docker-compose --version  # Minimum: 2.20.0

# Helm (optional, for package management)
helm version  # Minimum: 3.12.0

# cert-manager (for TLS certificates)
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.14.0/cert-manager.yaml
```

### Environment Setup

```bash
# Clone repository
git clone https://github.com/terrafusion/terrafusion-os.git
cd terrafusion-os/backend

# Set environment variables
export TERRAFUSION_ENV=production
export DATABASE_PASSWORD="<secure-password>"
export JWT_SECRET_KEY="<secure-jwt-key>"
export REDIS_PASSWORD="<secure-redis-password>"
```

---

## Architecture

### Microservices Breakdown

| Service | Port | Purpose | Replicas | Resources |
|---------|------|---------|----------|-----------|
| **API** | 5000 | Core government services | 2-10 | 500m-2000m CPU, 512Mi-4Gi RAM |
| **Gateway** | 3002 | Ocelot API gateway, routing | 2-8 | 500m-1500m CPU, 512Mi-2Gi RAM |
| **Consciousness** | 3004 | 50,000 AI agents, quantum optimization | 2-5 | 2000m-4000m CPU, 4Gi-8Gi RAM |
| **Operations** | 5003 | County operations, IAAO compliance | 2-6 | 500m-1500m CPU, 512Mi-3Gi RAM |

### Database Infrastructure

- **PostgreSQL Primary**: Read/write operations (port 5432)
- **PostgreSQL Replica**: Read-only queries (port 5433)
- **Redis**: Caching and session storage (port 6379)

---

## Docker Infrastructure

### Multi-Stage Build Pattern

All Dockerfiles follow a consistent multi-stage pattern:

```dockerfile
# Build Stage: Compile application
FROM mcr.microsoft.com/dotnet/sdk:8.0-alpine AS build
WORKDIR /src
COPY *.csproj .
RUN dotnet restore
COPY . .
RUN dotnet publish -c Release -o /app/publish

# Runtime Stage: Minimal production image
FROM mcr.microsoft.com/dotnet/aspnet:8.0-alpine AS runtime
WORKDIR /app
RUN addgroup -g 1000 app && adduser -u 1000 -G app -s /bin/sh -D app
USER app
COPY --from=build /app/publish .
EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=3s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1
ENTRYPOINT ["dotnet", "TerraFusion.API.dll"]
```

### Security Hardening

- **Non-root user**: All containers run as `uid:1000` (user `app`)
- **Read-only filesystem**: Root filesystem mounted read-only
- **Minimal base images**: Alpine Linux (5-10 MB smaller than Debian)
- **No shell access**: `/bin/false` or `/bin/sh -D` for service accounts
- **Health checks**: Every container has liveness/readiness probes

### Building Images

```bash
# Build individual service
docker build -f Dockerfile.API -t terrafusion-api:latest .
docker build -f Dockerfile.Gateway -t terrafusion-gateway:latest .
docker build -f Dockerfile.Consciousness -t terrafusion-consciousness:latest .
docker build -f Dockerfile.Operations -t terrafusion-operations:latest .

# Build all services
docker-compose build

# Tag for registry
docker tag terrafusion-api:latest ghcr.io/terrafusion/api:v1.0.0
docker tag terrafusion-consciousness:latest ghcr.io/terrafusion/consciousness:v1.0.0

# Push to registry
docker push ghcr.io/terrafusion/api:v1.0.0
docker push ghcr.io/terrafusion/consciousness:v1.0.0
```

---

## Kubernetes Deployment

### Namespace Isolation

```bash
# Apply namespace with resource quotas and network policies
kubectl apply -f k8s/namespace.yaml

# Verify namespace
kubectl get namespace terrafusion
kubectl describe resourcequota -n terrafusion
kubectl describe networkpolicy -n terrafusion
```

### Configuration Management

```bash
# Create ConfigMap and Secrets
kubectl apply -f k8s/configmap.yaml

# Update secrets (base64-encoded)
echo -n "my-secure-password" | base64
kubectl edit secret terrafusion-secrets -n terrafusion

# Verify configuration
kubectl get configmap terrafusion-config -n terrafusion -o yaml
kubectl get secret terrafusion-secrets -n terrafusion -o yaml
```

### Deploy Services

```bash
# Deploy all services in order
kubectl apply -f k8s/api-deployment.yaml
kubectl apply -f k8s/consciousness-deployment.yaml
kubectl apply -f k8s/gateway-deployment.yaml
kubectl apply -f k8s/operations-deployment.yaml

# Verify deployments
kubectl get deployments -n terrafusion
kubectl get pods -n terrafusion
kubectl get services -n terrafusion
kubectl get hpa -n terrafusion

# Check pod status
kubectl describe pod <pod-name> -n terrafusion
kubectl logs <pod-name> -n terrafusion
```

### Ingress & TLS

```bash
# Install NGINX Ingress Controller
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.10.0/deploy/static/provider/cloud/deploy.yaml

# Install cert-manager (for automated TLS)
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.14.0/cert-manager.yaml

# Apply Ingress configuration
kubectl apply -f k8s/ingress.yaml

# Verify Ingress and TLS certificate
kubectl get ingress -n terrafusion
kubectl describe ingress terrafusion-ingress -n terrafusion
kubectl get certificate -n terrafusion
```

### Rolling Updates

```bash
# Update deployment image
kubectl set image deployment/terrafusion-api \
  terrafusion-api=ghcr.io/terrafusion/api:v1.1.0 \
  -n terrafusion

# Monitor rollout status
kubectl rollout status deployment/terrafusion-api -n terrafusion

# Rollback if needed
kubectl rollout undo deployment/terrafusion-api -n terrafusion

# View rollout history
kubectl rollout history deployment/terrafusion-api -n terrafusion
```

---

## Local Development

### Docker Compose (Development Environment)

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f api
docker-compose logs -f consciousness

# Stop all services
docker-compose down

# Rebuild after code changes
docker-compose up -d --build

# Clean up volumes (database reset)
docker-compose down -v
```

### Development Workflow

```bash
# 1. Start infrastructure (database, redis)
docker-compose up -d postgres redis

# 2. Run API locally for debugging
cd TerraFusion.API
dotnet run

# 3. Run frontend separately
cd ../../frontend
npm run dev

# 4. Test changes
curl http://localhost:5000/health
curl http://localhost:5002  # Frontend
```

### Hot Reload Configuration

Docker Compose development setup includes volume mounts for hot reload:

```yaml
volumes:
  - ./TerraFusion.API:/app  # Mount source code
  - /app/obj                 # Exclude build artifacts
  - /app/bin                 # Exclude build artifacts
```

---

## Production Deployment

### Production Docker Compose (High Availability)

```bash
# Start production stack
docker-compose -f docker-compose.prod.yml up -d

# Verify services
docker-compose -f docker-compose.prod.yml ps

# View monitoring dashboards
# Prometheus: http://localhost:9090
# Grafana: http://localhost:3000 (admin/admin)

# Stop production stack
docker-compose -f docker-compose.prod.yml down
```

### Kubernetes Production Deployment

```bash
# Production deployment checklist
kubectl apply -f k8s/namespace.yaml          # Namespace with quotas
kubectl apply -f k8s/configmap.yaml          # Configuration
kubectl apply -f k8s/api-deployment.yaml     # API service
kubectl apply -f k8s/consciousness-deployment.yaml  # AI engine
kubectl apply -f k8s/gateway-deployment.yaml  # Gateway
kubectl apply -f k8s/operations-deployment.yaml  # Operations
kubectl apply -f k8s/ingress.yaml            # Ingress + TLS

# Verify production readiness
kubectl get all -n terrafusion
kubectl get hpa -n terrafusion
kubectl get pdb -n terrafusion
kubectl get ingress -n terrafusion
kubectl get certificate -n terrafusion

# Test production endpoints
curl -v https://api.terrafusion.gov/health
curl -v https://api.terrafusion.gov/api/health
curl -v https://api.terrafusion.gov/consciousness/health
```

### Database Migration

```bash
# Run migrations in Kubernetes
kubectl exec -it <api-pod-name> -n terrafusion -- \
  dotnet ef database update --project TerraFusion.Data

# Or via temporary job
kubectl apply -f k8s/migration-job.yaml
kubectl logs -f job/terrafusion-migration -n terrafusion
```

---

## Monitoring & Observability

### Prometheus Metrics

All services expose metrics at `/metrics` endpoint:

```bash
# API metrics
curl http://localhost:5000/metrics

# Consciousness metrics
curl http://localhost:3004/metrics

# View metrics in Prometheus
# http://localhost:9090/graph
# Query: rate(http_requests_total[5m])
# Query: terrafusion_ai_agent_count
# Query: terrafusion_quantum_factor
```

### Grafana Dashboards

```bash
# Access Grafana
# URL: http://localhost:3000
# Credentials: admin / admin

# Import TerraFusion dashboard
# Dashboard ID: 12345 (if published to Grafana.com)
# Or upload k8s/grafana-dashboards.json
```

### Health Checks

```bash
# Health check endpoints
curl http://localhost:5000/health        # API health
curl http://localhost:3002/health        # Gateway health
curl http://localhost:3004/health        # Consciousness health
curl http://localhost:5003/health        # Operations health

# Kubernetes health checks
kubectl get pods -n terrafusion
# Look for READY column: 1/1 means healthy

# View pod events
kubectl describe pod <pod-name> -n terrafusion | grep -A 10 Events
```

### Logging

```bash
# View container logs
kubectl logs <pod-name> -n terrafusion
kubectl logs <pod-name> -n terrafusion --previous  # Previous container instance

# Follow logs
kubectl logs -f <pod-name> -n terrafusion

# Logs from all replicas
kubectl logs -l app=terrafusion-api -n terrafusion --all-containers=true

# Stern (multi-pod log tailing)
stern terrafusion-api -n terrafusion
```

---

## Security & Compliance

### FISMA-High Compliance

TerraFusion OS implements FISMA-High controls:

| Control | Implementation |
|---------|----------------|
| **AC-2** (Account Management) | RBAC, service accounts |
| **AC-3** (Access Enforcement) | Network policies, RBAC roles |
| **AU-2** (Audit Events) | Comprehensive logging, audit trails |
| **SC-7** (Boundary Protection) | Network segmentation, Ingress controller |
| **SC-13** (Cryptographic Protection) | TLS 1.3, encrypted secrets |

### Network Policies

```bash
# Verify network policies
kubectl get networkpolicy -n terrafusion

# Test network isolation
kubectl run test-pod --image=busybox -n terrafusion -- sleep 3600
kubectl exec -it test-pod -n terrafusion -- wget -O- http://terrafusion-api:5000/health
```

### RBAC Configuration

```bash
# Verify RBAC roles
kubectl get role -n terrafusion
kubectl describe role terrafusion-deployer -n terrafusion

# Create service account
kubectl create serviceaccount terrafusion-deployer -n terrafusion

# Bind role to service account
kubectl create rolebinding terrafusion-deployer-binding \
  --role=terrafusion-deployer \
  --serviceaccount=terrafusion:terrafusion-deployer \
  -n terrafusion
```

### Secrets Management

```bash
# Encode secrets (base64)
echo -n "my-secure-password" | base64

# Create secret from file
kubectl create secret generic terrafusion-db-credentials \
  --from-file=username=./db-username.txt \
  --from-file=password=./db-password.txt \
  -n terrafusion

# Rotate secrets
kubectl delete secret terrafusion-secrets -n terrafusion
kubectl apply -f k8s/configmap.yaml

# Restart deployments to pick up new secrets
kubectl rollout restart deployment/terrafusion-api -n terrafusion
```

---

## Troubleshooting

### Common Issues

#### 1. Pod Stuck in Pending State

```bash
# Check pod status
kubectl describe pod <pod-name> -n terrafusion

# Common causes:
# - Insufficient resources (CPU/memory)
# - Node selector/affinity mismatch
# - PersistentVolumeClaim not bound

# Solution: Scale down replicas or add nodes
kubectl scale deployment terrafusion-api --replicas=1 -n terrafusion
```

#### 2. CrashLoopBackOff

```bash
# View logs
kubectl logs <pod-name> -n terrafusion --previous

# Common causes:
# - Application startup failure
# - Database connection issues
# - Missing environment variables

# Solution: Check logs and fix configuration
kubectl edit configmap terrafusion-config -n terrafusion
kubectl rollout restart deployment/<deployment-name> -n terrafusion
```

#### 3. ImagePullBackOff

```bash
# Check image pull status
kubectl describe pod <pod-name> -n terrafusion | grep -A 5 "Events"

# Common causes:
# - Image doesn't exist in registry
# - Authentication failure
# - Network issues

# Solution: Verify image tag and registry credentials
docker pull ghcr.io/terrafusion/api:latest
kubectl create secret docker-registry terrafusion-registry \
  --docker-server=ghcr.io \
  --docker-username=<username> \
  --docker-password=<token> \
  -n terrafusion
```

#### 4. Database Connection Errors

```bash
# Test database connectivity
kubectl run psql-test --image=postgres:15-alpine -n terrafusion -- \
  psql -h postgres-primary -U terrafusion -d terrafusion

# Check database pod status
kubectl get pod -l app=postgres -n terrafusion
kubectl logs <postgres-pod> -n terrafusion

# Solution: Verify connection string and credentials
kubectl get configmap terrafusion-config -n terrafusion -o yaml
kubectl get secret terrafusion-secrets -n terrafusion -o yaml
```

#### 5. High Memory Usage (Consciousness Engine)

```bash
# Check memory usage
kubectl top pod -l app=terrafusion-consciousness -n terrafusion

# Scale up resources
kubectl edit deployment terrafusion-consciousness -n terrafusion
# Increase memory limits: 4Gi -> 8Gi

# Or scale horizontally
kubectl scale deployment terrafusion-consciousness --replicas=3 -n terrafusion
```

### Debugging Commands

```bash
# Shell into running container
kubectl exec -it <pod-name> -n terrafusion -- /bin/sh

# Port forward for local debugging
kubectl port-forward svc/terrafusion-api 5000:5000 -n terrafusion

# View pod resource usage
kubectl top pod -n terrafusion
kubectl top node

# Describe all resources
kubectl describe all -n terrafusion

# Events (cluster-wide)
kubectl get events --sort-by='.metadata.creationTimestamp' -n terrafusion
```

---

## CI/CD Integration

### GitHub Actions Workflow

Create `.github/workflows/deploy-prod.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
      
      - name: Login to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Build and push Docker images
        run: |
          docker build -f backend/Dockerfile.API -t ghcr.io/terrafusion/api:${{ github.sha }} .
          docker build -f backend/Dockerfile.Consciousness -t ghcr.io/terrafusion/consciousness:${{ github.sha }} .
          docker push ghcr.io/terrafusion/api:${{ github.sha }}
          docker push ghcr.io/terrafusion/consciousness:${{ github.sha }}
      
      - name: Set up kubectl
        uses: azure/setup-kubectl@v3
        with:
          version: 'v1.28.0'
      
      - name: Deploy to Kubernetes
        run: |
          kubectl set image deployment/terrafusion-api \
            terrafusion-api=ghcr.io/terrafusion/api:${{ github.sha }} \
            -n terrafusion
          kubectl set image deployment/terrafusion-consciousness \
            terrafusion-consciousness=ghcr.io/terrafusion/consciousness:${{ github.sha }} \
            -n terrafusion
      
      - name: Verify deployment
        run: |
          kubectl rollout status deployment/terrafusion-api -n terrafusion
          kubectl rollout status deployment/terrafusion-consciousness -n terrafusion
```

### Azure DevOps Pipeline

Create `azure-pipelines.yml`:

```yaml
trigger:
  branches:
    include:
      - main

pool:
  vmImage: 'ubuntu-latest'

stages:
  - stage: Build
    jobs:
      - job: BuildDockerImages
        steps:
          - task: Docker@2
            inputs:
              command: buildAndPush
              repository: terrafusion/api
              dockerfile: backend/Dockerfile.API
              tags: |
                $(Build.BuildId)
                latest
          
          - task: Docker@2
            inputs:
              command: buildAndPush
              repository: terrafusion/consciousness
              dockerfile: backend/Dockerfile.Consciousness
              tags: |
                $(Build.BuildId)
                latest
  
  - stage: Deploy
    dependsOn: Build
    jobs:
      - deployment: DeployToKubernetes
        environment: production
        strategy:
          runOnce:
            deploy:
              steps:
                - task: Kubernetes@1
                  inputs:
                    command: set
                    arguments: image deployment/terrafusion-api terrafusion-api=terrafusion/api:$(Build.BuildId)
                    namespace: terrafusion
                
                - task: Kubernetes@1
                  inputs:
                    command: rollout
                    arguments: status deployment/terrafusion-api
                    namespace: terrafusion
```

### Manual Deployment Script

Create `deploy.sh`:

```bash
#!/bin/bash
set -e

# Configuration
REGISTRY="ghcr.io/terrafusion"
VERSION=${1:-latest}
NAMESPACE="terrafusion"

echo "🏛️ TerraFusion OS - Production Deployment"
echo "Version: $VERSION"
echo "Registry: $REGISTRY"
echo "Namespace: $NAMESPACE"

# Build Docker images
echo "📦 Building Docker images..."
docker build -f backend/Dockerfile.API -t $REGISTRY/api:$VERSION .
docker build -f backend/Dockerfile.Consciousness -t $REGISTRY/consciousness:$VERSION .
docker build -f backend/Dockerfile.Gateway -t $REGISTRY/gateway:$VERSION .
docker build -f backend/Dockerfile.Operations -t $REGISTRY/operations:$VERSION .

# Push to registry
echo "🚀 Pushing to registry..."
docker push $REGISTRY/api:$VERSION
docker push $REGISTRY/consciousness:$VERSION
docker push $REGISTRY/gateway:$VERSION
docker push $REGISTRY/operations:$VERSION

# Deploy to Kubernetes
echo "☸️ Deploying to Kubernetes..."
kubectl set image deployment/terrafusion-api terrafusion-api=$REGISTRY/api:$VERSION -n $NAMESPACE
kubectl set image deployment/terrafusion-consciousness terrafusion-consciousness=$REGISTRY/consciousness:$VERSION -n $NAMESPACE
kubectl set image deployment/terrafusion-gateway terrafusion-gateway=$REGISTRY/gateway:$VERSION -n $NAMESPACE
kubectl set image deployment/terrafusion-operations terrafusion-operations=$REGISTRY/operations:$VERSION -n $NAMESPACE

# Wait for rollout
echo "⏳ Waiting for rollout to complete..."
kubectl rollout status deployment/terrafusion-api -n $NAMESPACE
kubectl rollout status deployment/terrafusion-consciousness -n $NAMESPACE
kubectl rollout status deployment/terrafusion-gateway -n $NAMESPACE
kubectl rollout status deployment/terrafusion-operations -n $NAMESPACE

echo "✅ Deployment complete!"
echo "🔍 Verify: kubectl get pods -n $NAMESPACE"
```

---

## Performance Optimization

### Horizontal Pod Autoscaling (HPA)

```bash
# View HPA status
kubectl get hpa -n terrafusion

# Manually scale
kubectl scale deployment terrafusion-api --replicas=5 -n terrafusion

# Update HPA thresholds
kubectl edit hpa terrafusion-api-hpa -n terrafusion
```

### Resource Tuning

```bash
# Monitor resource usage
kubectl top pod -n terrafusion
kubectl top node

# Adjust resource requests/limits
kubectl edit deployment terrafusion-consciousness -n terrafusion
# Update resources:
#   requests: { cpu: 3000m, memory: 6Gi }
#   limits: { cpu: 5000m, memory: 10Gi }

# Restart deployment
kubectl rollout restart deployment/terrafusion-consciousness -n terrafusion
```

### Database Optimization

```sql
-- Index optimization
CREATE INDEX CONCURRENTLY idx_properties_county_id ON properties(county_id);
CREATE INDEX CONCURRENTLY idx_assessments_date ON assessments(assessment_date DESC);

-- Connection pooling
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET shared_buffers = '4GB';
ALTER SYSTEM SET effective_cache_size = '12GB';
SELECT pg_reload_conf();

-- Vacuum and analyze
VACUUM ANALYZE properties;
VACUUM ANALYZE assessments;
```

---

## Disaster Recovery

### Backup Strategy

```bash
# Database backup (PostgreSQL)
kubectl exec <postgres-pod> -n terrafusion -- \
  pg_dump -U terrafusion terrafusion > backup-$(date +%Y%m%d).sql

# Kubernetes resource backup
kubectl get all,configmap,secret,ingress -n terrafusion -o yaml > k8s-backup-$(date +%Y%m%d).yaml

# Automated backup script
#!/bin/bash
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
kubectl exec postgres-primary-0 -n terrafusion -- \
  pg_dump -U terrafusion -Fc terrafusion > $BACKUP_DIR/db-$DATE.dump
```

### Restore Procedure

```bash
# Restore database
kubectl exec -i <postgres-pod> -n terrafusion -- \
  psql -U terrafusion terrafusion < backup-20240101.sql

# Restore Kubernetes resources
kubectl apply -f k8s-backup-20240101.yaml

# Verify restoration
kubectl get all -n terrafusion
kubectl exec <postgres-pod> -n terrafusion -- \
  psql -U terrafusion -d terrafusion -c "SELECT COUNT(*) FROM properties;"
```

---

## Conclusion

This guide provides comprehensive coverage of TerraFusion OS DevOps infrastructure. For additional support:

- **Documentation**: https://docs.terrafusion.gov
- **GitHub**: https://github.com/terrafusion/terrafusion-os
- **Support**: support@terrafusion.gov

**Government. Transcended. - Execute with championship excellence.** 🏛️⚡✨
