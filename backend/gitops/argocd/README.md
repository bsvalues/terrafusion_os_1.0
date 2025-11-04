# TerraFusion Platform - GitOps with ArgoCD

🏛️ **Government. Transcended.** - Automated continuous deployment for 50,000 AI agents across 39 Washington State counties

## Overview

This directory contains ArgoCD GitOps configurations for automated deployment of the TerraFusion OS platform:

- **Projects**: AppProject definitions with RBAC and sync windows
- **Applications**: Application manifests for all TerraFusion services
- **Repositories**: Git and Helm repository configurations
- **Sync Waves**: Ordered deployment strategy (wave -1 to wave 6)
- **Notifications**: Slack, email, and webhook integrations

## Quick Start

### Install ArgoCD

```bash
# Create namespace
kubectl create namespace argocd

# Install ArgoCD
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Install ArgoCD CLI
brew install argocd  # macOS
# or
curl -sSL -o /usr/local/bin/argocd https://github.com/argoproj/argo-cd/releases/latest/download/argocd-linux-amd64

# Access ArgoCD UI
kubectl port-forward svc/argocd-server -n argocd 8080:443

# Get admin password
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d

# Login
argocd login localhost:8080
```

### Deploy TerraFusion Project

```bash
# Create TerraFusion project
kubectl apply -f projects/terrafusion.yaml

# Add repository
kubectl apply -f repositories/terrafusion-os.yaml

# Deploy complete platform
kubectl apply -f applications/terrafusion-platform-prod.yaml

# Or deploy individual services
kubectl apply -f applications/terrafusion-api-prod.yaml
kubectl apply -f applications/terrafusion-consciousness-prod.yaml
kubectl apply -f applications/terrafusion-gateway-prod.yaml
kubectl apply -f applications/terrafusion-operations-prod.yaml
```

## Directory Structure

```
gitops/argocd/
├── projects/
│   └── terrafusion.yaml                    # AppProject with RBAC
├── repositories/
│   └── terrafusion-os.yaml                 # Repository credentials
├── applications/
│   ├── terrafusion-platform-prod.yaml      # Umbrella chart
│   ├── terrafusion-api-prod.yaml           # API service
│   ├── terrafusion-consciousness-prod.yaml # AI agents (50,000)
│   ├── terrafusion-gateway-prod.yaml       # Ocelot gateway
│   └── terrafusion-operations-prod.yaml    # County operations
├── sync-waves/
│   └── sync-waves.yaml                     # Ordered deployment
├── notifications/
│   └── argocd-notifications.yaml           # Slack/email alerts
└── README.md                               # This file
```

## Sync Waves

TerraFusion uses sync waves for ordered deployment:

| Wave | Resources | Purpose |
|------|-----------|---------|
| -1 | Namespaces, CRDs, StorageClasses | Pre-installation |
| 0 | Database, Redis, Infrastructure | Foundation services |
| 1 | Gateway (Ocelot) | API Gateway for routing |
| 2 | TerraFusion API | Core government services |
| 3 | Consciousness Engine | 50,000 AI agents |
| 4 | Operations Service | County integrations |
| 5 | Monitoring | Prometheus, Grafana, Jaeger |
| 6 | Background Jobs | CronJobs, scheduled tasks |

## Application Hierarchy

```
terrafusion-platform-prod (wave 0)
├── terrafusion-gateway-prod (wave 1)
├── terrafusion-api-prod (wave 2)
├── terrafusion-consciousness-prod (wave 3)
└── terrafusion-operations-prod (wave 4)
```

## RBAC Configuration

The TerraFusion project defines four roles:

### Admin
- Full access to all applications
- Can sync production
- Groups: `terrafusion-admins`, `platform-admins`

### Developer
- Read access to all applications
- Can sync dev/staging environments
- Can override parameters in dev
- Groups: `terrafusion-developers`

### Operator
- Read access to all applications
- Can sync all environments including production
- Can view logs
- Groups: `terrafusion-operators`, `sre-team`

### Viewer
- Read-only access to all applications
- Can view logs
- Groups: `terrafusion-viewers`, `audit-team`

## Sync Policies

### Automated Sync

All applications use automated sync with:
- **Prune**: Remove resources deleted from Git
- **Self-Heal**: Automatically sync when cluster state drifts
- **Retry**: 5 attempts with exponential backoff

### Sync Windows

**Development/Staging**: Allow sync 2 AM - 4 AM daily
**Production**: Deny sync during business hours (9 AM - 5 PM, Mon-Fri)

## Notifications

### Slack Channels

- `#terrafusion-deployments` - All successful deployments
- `#terrafusion-alerts` - Health degraded, sync failed
- `#terrafusion-critical` - Production failures

### Email Alerts

- `platform-team@terrafusion.gov` - Production failures
- `sre-team@terrafusion.gov` - Production failures

### Notification Triggers

- **on-deployed**: Application synced and healthy
- **on-health-degraded**: Application health degraded
- **on-sync-failed**: Sync operation failed
- **on-sync-succeeded**: Sync operation succeeded

## Environment-Specific Deployments

### Development

```bash
kubectl apply -f - <<EOF
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: terrafusion-platform-dev
  namespace: argocd
spec:
  project: terrafusion
  source:
    repoURL: https://github.com/terrafusion/terrafusion-os
    targetRevision: develop
    path: backend/helm/terrafusion-platform
    helm:
      valueFiles:
        - values-dev.yaml
  destination:
    namespace: terrafusion-dev
EOF
```

### Staging

```bash
kubectl apply -f - <<EOF
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: terrafusion-platform-staging
  namespace: argocd
spec:
  project: terrafusion
  source:
    repoURL: https://github.com/terrafusion/terrafusion-os
    targetRevision: staging
    path: backend/helm/terrafusion-platform
    helm:
      valueFiles:
        - values-staging.yaml
  destination:
    namespace: terrafusion-staging
EOF
```

## Monitoring Deployments

### ArgoCD CLI

```bash
# List applications
argocd app list

# Get application details
argocd app get terrafusion-platform-prod

# Sync application
argocd app sync terrafusion-platform-prod

# View sync status
argocd app wait terrafusion-platform-prod

# View application logs
argocd app logs terrafusion-platform-prod

# Rollback to previous version
argocd app rollback terrafusion-platform-prod
```

### Kubernetes

```bash
# Check ArgoCD applications
kubectl get applications -n argocd

# View application status
kubectl describe application terrafusion-platform-prod -n argocd

# Check sync status
kubectl get application terrafusion-platform-prod -n argocd -o jsonpath='{.status.sync.status}'

# Check health status
kubectl get application terrafusion-platform-prod -n argocd -o jsonpath='{.status.health.status}'
```

## Troubleshooting

### Application Out of Sync

```bash
# View diff
argocd app diff terrafusion-platform-prod

# Force sync
argocd app sync terrafusion-platform-prod --force

# Sync with prune
argocd app sync terrafusion-platform-prod --prune
```

### Sync Failed

```bash
# View sync operation
argocd app get terrafusion-platform-prod --show-operation

# View sync logs
argocd app logs terrafusion-platform-prod --follow

# Delete failed operation
argocd app terminate-op terrafusion-platform-prod
```

### Health Check Failed

```bash
# View resource health
argocd app get terrafusion-platform-prod --show-params

# Describe unhealthy resource
kubectl describe pod <pod-name> -n terrafusion

# View events
kubectl get events -n terrafusion --sort-by='.lastTimestamp'
```

## Security

### Repository Credentials

Store credentials in Kubernetes secrets:

```bash
# Create secret for Git repository
kubectl create secret generic terrafusion-repo \
  --from-literal=username=terrafusion-bot \
  --from-literal=password=$GITHUB_TOKEN \
  -n argocd

# Create secret for Helm registry
kubectl create secret generic terrafusion-helm-repo \
  --from-literal=username=terrafusion-bot \
  --from-literal=password=$HELM_REGISTRY_PASSWORD \
  -n argocd
```

### Notification Credentials

```bash
# Create notification secrets
kubectl create secret generic argocd-notifications-secret \
  --from-literal=slack-token=$SLACK_TOKEN \
  --from-literal=email-username=$EMAIL_USERNAME \
  --from-literal=email-password=$EMAIL_PASSWORD \
  -n argocd
```

### RBAC Integration

Integrate with external identity providers:

```yaml
# SSO with Azure AD
apiVersion: v1
kind: ConfigMap
metadata:
  name: argocd-cm
  namespace: argocd
data:
  url: https://argocd.terrafusion.gov
  dex.config: |
    connectors:
    - type: microsoft
      id: microsoft
      name: Microsoft
      config:
        clientID: $AZURE_CLIENT_ID
        clientSecret: $AZURE_CLIENT_SECRET
        redirectURI: https://argocd.terrafusion.gov/api/dex/callback
        tenant: terrafusion.onmicrosoft.com
```

## Best Practices

### Git Repository Structure

```
terrafusion-os/
├── backend/
│   ├── helm/
│   │   ├── terrafusion-api/
│   │   ├── terrafusion-consciousness/
│   │   ├── terrafusion-gateway/
│   │   ├── terrafusion-operations/
│   │   └── terrafusion-platform/
│   └── gitops/
│       └── argocd/
└── config/
    ├── dev/
    ├── staging/
    └── prod/
```

### Helm Values Hierarchy

1. **Chart defaults**: `values.yaml` in chart
2. **Environment overrides**: `values-dev.yaml`, `values-staging.yaml`
3. **ArgoCD parameters**: Helm parameters in Application spec
4. **Runtime overrides**: Via ArgoCD UI or CLI

### Deployment Strategy

1. **Development**: Auto-sync from `develop` branch
2. **Staging**: Auto-sync from `staging` branch with manual approval
3. **Production**: Auto-sync from `main` branch during maintenance windows

## CI/CD Integration

### GitHub Actions

```yaml
name: Deploy to ArgoCD

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Update image tag
        run: |
          argocd app set terrafusion-platform-prod \
            --helm-set terrafusion-api.image.tag=${{ github.sha }} \
            --helm-set terrafusion-consciousness.image.tag=${{ github.sha }}
      
      - name: Sync application
        run: |
          argocd app sync terrafusion-platform-prod --timeout 600
      
      - name: Wait for rollout
        run: |
          argocd app wait terrafusion-platform-prod --health --timeout 600
```

## Support

- **Documentation**: https://docs.terrafusion.gov/gitops
- **ArgoCD Docs**: https://argo-cd.readthedocs.io
- **Slack**: #terrafusion-gitops
- **Email**: gitops-support@terrafusion.gov

---

🏛️ **Government. Transcended.** - Automated deployment excellence for 50,000 AI agents across 39 counties.
