# TerraFusion OS Platform - Umbrella Helm Chart

🏛️ **Government. Transcended.** - Complete government AI platform deployment with a single command

## Overview

This umbrella Helm chart deploys the entire TerraFusion OS platform, including:

- **TerraFusion API** - Core government services (port 5000)
- **TerraFusion Consciousness Engine** - 50,000+ AI agents with quantum optimization
- **TerraFusion Gateway** - Ocelot API Gateway with rate limiting (port 3002)
- **TerraFusion Operations** - County integration services (port 5003)

## Quick Start

### Single Command Deployment

```bash
# Production deployment
helm install terrafusion-platform ./terrafusion-platform \
  --namespace terrafusion \
  --create-namespace \
  --values values.yaml

# Development deployment
helm install terrafusion-dev ./terrafusion-platform \
  --namespace terrafusion-dev \
  --create-namespace \
  --values values-dev.yaml

# Staging deployment
helm install terrafusion-staging ./terrafusion-platform \
  --namespace terrafusion-staging \
  --create-namespace \
  --values values-staging.yaml
```

## Prerequisites

- Kubernetes 1.27+
- Helm 3.10+
- PostgreSQL database
- Redis cache
- NGINX Ingress Controller
- cert-manager (for TLS)
- Prometheus Operator (optional, for monitoring)
- 200GB+ persistent storage
- GPU nodes (optional, for ML inference)

## Environment Configurations

### Development

- **Purpose**: Local development and testing
- **AI Agents**: 1,000
- **Replicas**: 1 per service
- **Autoscaling**: Disabled
- **TLS**: Disabled
- **Domain**: terrafusion.local

```bash
helm install terrafusion-dev ./terrafusion-platform \
  --namespace terrafusion-dev \
  --values values-dev.yaml
```

### Staging

- **Purpose**: Pre-production validation
- **AI Agents**: 10,000
- **Replicas**: 2-20 (autoscaled)
- **TLS**: Let's Encrypt Staging
- **Domain**: staging.terrafusion.gov

```bash
helm install terrafusion-staging ./terrafusion-platform \
  --namespace terrafusion-staging \
  --values values-staging.yaml
```

### Production

- **Purpose**: 39 Washington State counties
- **AI Agents**: 50,000
- **Replicas**: 3-50 (autoscaled)
- **TLS**: Let's Encrypt Production
- **Domain**: terrafusion.gov

```bash
helm install terrafusion-platform ./terrafusion-platform \
  --namespace terrafusion \
  --values values.yaml \
  --set global.environment=production
```

## Configuration

### Global Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| `global.environment` | Environment name | `production` |
| `global.domain` | Base domain | `terrafusion.gov` |
| `global.imageRegistry` | Container registry | `ghcr.io/terrafusion` |
| `global.database.host` | PostgreSQL host | `postgres.terrafusion.svc.cluster.local` |
| `global.redis.host` | Redis host | `redis.terrafusion.svc.cluster.local` |
| `global.monitoring.enabled` | Enable monitoring | `true` |
| `global.compliance.fisma.enabled` | Enable FISMA-High | `true` |

### Component Enablement

Enable/disable individual services:

```yaml
api:
  enabled: true

consciousness:
  enabled: true

gateway:
  enabled: true

operations:
  enabled: true
```

### Service-Specific Overrides

Override individual service configurations:

```yaml
terrafusion-api:
  replicaCount: 5
  resources:
    requests:
      cpu: 4000m
      memory: 16Gi

terrafusion-consciousness:
  aiAgent:
    totalAgents: 60000
  autoscaling:
    maxReplicas: 60
```

## Upgrading

```bash
# Update chart dependencies
helm dependency update ./terrafusion-platform

# Upgrade deployment
helm upgrade terrafusion-platform ./terrafusion-platform \
  --namespace terrafusion \
  --values values.yaml \
  --set terrafusion-api.image.tag=1.0.1
```

## Rollback

```bash
# List release history
helm history terrafusion-platform -n terrafusion

# Rollback to previous version
helm rollback terrafusion-platform -n terrafusion

# Rollback to specific revision
helm rollback terrafusion-platform 3 -n terrafusion
```

## Monitoring

### Prometheus Metrics

Access platform-wide metrics:

```bash
kubectl port-forward -n monitoring svc/prometheus 9090:9090
# Query: terrafusion_* metrics
```

### Grafana Dashboards

Pre-configured dashboards:

```bash
kubectl port-forward -n monitoring svc/grafana 3000:3000
# Open: http://localhost:3000
```

Dashboards:
- TerraFusion Platform Overview
- AI Agent Performance
- Gateway Traffic
- County Operations

### Jaeger Tracing

View distributed traces:

```bash
kubectl port-forward -n tracing svc/jaeger-query 16686:16686
# Open: http://localhost:16686
```

## Troubleshooting

### Check Platform Status

```bash
helm status terrafusion-platform -n terrafusion
kubectl get all -n terrafusion -l app.kubernetes.io/instance=terrafusion-platform
```

### View Component Logs

```bash
# All services
kubectl logs -n terrafusion -l terrafusion.io/platform=complete --tail=100

# Specific service
kubectl logs -n terrafusion -l app.kubernetes.io/name=terrafusion-api --tail=50
```

### Test Platform Health

```bash
helm test terrafusion-platform -n terrafusion
```

### Debug Deployment Issues

```bash
# Check pending pods
kubectl get pods -n terrafusion --field-selector=status.phase=Pending

# Describe problematic pod
kubectl describe pod <pod-name> -n terrafusion

# Check events
kubectl get events -n terrafusion --sort-by='.lastTimestamp'
```

## Security

### FISMA-High Compliance

The platform implements:

- **AC-2, AC-3, AC-6**: Access control with RBAC
- **AU-2, AU-6**: Comprehensive audit logging
- **SC-7, SC-13**: Network security and encryption

### Network Policies

Network isolation between services:

```yaml
global:
  security:
    networkPolicy: true
```

### Secrets Management

**Production deployments should use External Secrets Operator:**

```bash
# Install External Secrets Operator
helm repo add external-secrets https://charts.external-secrets.io
helm install external-secrets external-secrets/external-secrets \
  --namespace external-secrets-system \
  --create-namespace

# Create SecretStore for AWS Secrets Manager
kubectl apply -f - <<EOF
apiVersion: external-secrets.io/v1beta1
kind: SecretStore
metadata:
  name: aws-secrets-manager
  namespace: terrafusion
spec:
  provider:
    aws:
      service: SecretsManager
      region: us-west-2
EOF
```

## High Availability

### Multi-Region Deployment

Deploy to multiple regions:

```bash
# West region
helm install terrafusion-west ./terrafusion-platform \
  --namespace terrafusion \
  --values values.yaml \
  --set global.clusterName=terrafusion-west

# East region
helm install terrafusion-east ./terrafusion-platform \
  --namespace terrafusion \
  --values values.yaml \
  --set global.clusterName=terrafusion-east
```

### Database Replication

Configure PostgreSQL replication:

```yaml
global:
  database:
    replication:
      enabled: true
      replicas: 3
```

## County-Specific Deployments

Deploy for specific counties:

```yaml
terrafusion-operations:
  counties:
    king:
      enabled: true
      aiAgents: 5000
      harrisVersion: "12.4.7"
    pierce:
      enabled: true
      aiAgents: 3000
```

## CI/CD Integration

### GitHub Actions

```yaml
name: Deploy TerraFusion Platform

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Kubernetes
        run: |
          helm upgrade --install terrafusion-platform \
            ./backend/helm/terrafusion-platform \
            --namespace terrafusion \
            --values ./backend/helm/terrafusion-platform/values.yaml \
            --set global.imageRegistry=${{ secrets.REGISTRY }} \
            --set terrafusion-api.image.tag=${{ github.sha }} \
            --wait --timeout 15m
```

### GitOps (ArgoCD)

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: terrafusion-platform
  namespace: argocd
spec:
  project: terrafusion
  source:
    repoURL: https://github.com/terrafusion/terrafusion-os
    targetRevision: main
    path: backend/helm/terrafusion-platform
    helm:
      valueFiles:
        - values.yaml
  destination:
    server: https://kubernetes.default.svc
    namespace: terrafusion
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true
```

## Performance Tuning

### Resource Optimization

Adjust resources based on load:

```yaml
terrafusion-api:
  resources:
    requests:
      cpu: 4000m
      memory: 16Gi
    limits:
      cpu: 16000m
      memory: 64Gi

terrafusion-consciousness:
  resources:
    requests:
      cpu: 8000m
      memory: 32Gi
    limits:
      cpu: 32000m
      memory: 128Gi
```

### Autoscaling Configuration

Tune autoscaling thresholds:

```yaml
terrafusion-consciousness:
  autoscaling:
    minReplicas: 5
    maxReplicas: 50
    targetCPUUtilizationPercentage: 60
    targetMemoryUtilizationPercentage: 70
```

## Backup and Restore

### Database Backup

```bash
# Backup PostgreSQL
kubectl exec -n terrafusion postgres-0 -- \
  pg_dump -U postgres terrafusion > backup.sql

# Restore
kubectl exec -i -n terrafusion postgres-0 -- \
  psql -U postgres terrafusion < backup.sql
```

### Velero Backup

```bash
# Install Velero
velero install --provider aws --bucket terrafusion-backups

# Backup namespace
velero backup create terrafusion-backup --include-namespaces terrafusion

# Restore
velero restore create --from-backup terrafusion-backup
```

## Support

- **Documentation**: https://docs.terrafusion.gov
- **GitHub Issues**: https://github.com/terrafusion/terrafusion-os/issues
- **Email**: platform-support@terrafusion.gov
- **Slack**: #terrafusion-platform

## License

Proprietary - TerraFusion OS Platform

---

🏛️ **Government. Transcended.** - Complete AI platform with 50,000 agents for 39 Washington State counties.
