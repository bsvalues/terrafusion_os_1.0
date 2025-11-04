# TerraFusion API - Helm Chart

🏛️ **Government. Transcended.** - Production-ready Helm chart for TerraFusion OS Core API Service

## Overview

This Helm chart deploys the TerraFusion OS Core API Service to Kubernetes with:
- **FISMA-High compliance** - Federal government security standards
- **Multi-county support** - 39 Washington State counties
- **High availability** - 3-20 replicas with autoscaling
- **Comprehensive monitoring** - Prometheus, Jaeger, Loki integration
- **Zero-downtime deployments** - Rolling updates with health checks
- **Production-ready** - Security, observability, and reliability built-in

## Prerequisites

- Kubernetes 1.27+
- Helm 3.10+
- NGINX Ingress Controller
- cert-manager (for TLS certificates)
- Prometheus Operator (for ServiceMonitor)
- PostgreSQL database
- Redis cache

## Installation

### Development

```bash
helm install terrafusion-api ./terrafusion-api \
  --namespace terrafusion \
  --create-namespace \
  --values values-dev.yaml
```

### Staging

```bash
helm install terrafusion-api ./terrafusion-api \
  --namespace terrafusion-staging \
  --create-namespace \
  --values values-staging.yaml
```

### Production

```bash
helm install terrafusion-api ./terrafusion-api \
  --namespace terrafusion \
  --create-namespace \
  --values values-production.yaml \
  --set image.tag=1.0.0 \
  --set global.environment=production
```

## Configuration

### Key Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| `replicaCount` | Number of replicas | `3` |
| `image.repository` | Docker image repository | `ghcr.io/terrafusion/terrafusion-api` |
| `image.tag` | Docker image tag | `1.0.0` |
| `service.type` | Kubernetes service type | `ClusterIP` |
| `service.port` | Service port | `5000` |
| `ingress.enabled` | Enable ingress | `true` |
| `ingress.hosts[0].host` | Ingress hostname | `api.terrafusion.gov` |
| `autoscaling.enabled` | Enable HPA | `true` |
| `autoscaling.minReplicas` | Minimum replicas | `3` |
| `autoscaling.maxReplicas` | Maximum replicas | `20` |
| `resources.requests.cpu` | CPU request | `500m` |
| `resources.requests.memory` | Memory request | `1Gi` |
| `resources.limits.cpu` | CPU limit | `2000m` |
| `resources.limits.memory` | Memory limit | `4Gi` |

### Environment-Specific Values

Create environment-specific values files:

**values-dev.yaml:**
```yaml
replicaCount: 1
resources:
  requests:
    cpu: 100m
    memory: 256Mi
autoscaling:
  enabled: false
ingress:
  hosts:
    - host: api-dev.terrafusion.gov
```

**values-staging.yaml:**
```yaml
replicaCount: 2
resources:
  requests:
    cpu: 250m
    memory: 512Mi
autoscaling:
  minReplicas: 2
  maxReplicas: 10
ingress:
  hosts:
    - host: api-staging.terrafusion.gov
```

**values-production.yaml:**
```yaml
# Use defaults from values.yaml
# Override only what's necessary
global:
  environment: production
image:
  tag: "1.0.0"  # Set from CI/CD
```

### County Configuration

Configure county-specific settings in `values.yaml`:

```yaml
counties:
  benton:
    enabled: true
    harrisPacs:
      jurisdiction: "BENTON_WA"
      syncInterval: 15  # minutes
    sla:
      availability: 0.999
      responseTime: 150  # ms P95
```

## Upgrading

```bash
helm upgrade terrafusion-api ./terrafusion-api \
  --namespace terrafusion \
  --values values-production.yaml \
  --set image.tag=1.0.1
```

## Rollback

```bash
# List release history
helm history terrafusion-api -n terrafusion

# Rollback to previous version
helm rollback terrafusion-api -n terrafusion

# Rollback to specific revision
helm rollback terrafusion-api 5 -n terrafusion
```

## Uninstallation

```bash
helm uninstall terrafusion-api --namespace terrafusion
```

## Testing

### Helm Template Validation

```bash
# Render templates locally
helm template terrafusion-api ./terrafusion-api --values values-dev.yaml

# Validate with Kubernetes
helm template terrafusion-api ./terrafusion-api --values values-dev.yaml | kubectl apply --dry-run=client -f -
```

### Helm Lint

```bash
helm lint ./terrafusion-api --values values-dev.yaml
```

### Chart Testing

```bash
# Install chart-testing CLI
ct install --charts ./terrafusion-api
```

## Monitoring

### Prometheus Metrics

Access metrics endpoint:
```bash
kubectl port-forward svc/terrafusion-api 5000:5000 -n terrafusion
curl http://localhost:5000/metrics
```

### Grafana Dashboards

Pre-configured dashboards:
- TerraFusion API Performance
- TerraFusion System Overview
- Kubernetes Resources

### Jaeger Tracing

View distributed traces:
```bash
kubectl port-forward svc/jaeger-query 16686:16686 -n tracing
# Open http://localhost:16686
```

## Troubleshooting

### Check Pod Status

```bash
kubectl get pods -n terrafusion -l app.kubernetes.io/name=terrafusion-api
```

### View Logs

```bash
kubectl logs -n terrafusion -l app.kubernetes.io/name=terrafusion-api --follow
```

### Check Events

```bash
kubectl get events -n terrafusion --sort-by='.lastTimestamp'
```

### Debug Pod

```bash
kubectl debug -n terrafusion <pod-name> -it --image=busybox
```

## Security

### FISMA-High Compliance

This chart implements FISMA-High security controls:
- **AC-2, AC-3, AC-6** - Access control with RBAC
- **AU-2, AU-6** - Audit logging enabled
- **SC-7, SC-13** - Network security with NetworkPolicy
- **SC-28** - Data encryption at rest and in transit

### Secrets Management

**Production deployments should use External Secrets Operator:**

```yaml
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: terrafusion-api-external-secrets
spec:
  secretStoreRef:
    name: aws-secrets-manager
    kind: SecretStore
  target:
    name: terrafusion-api-secrets
  data:
    - secretKey: DATABASE_PASSWORD
      remoteRef:
        key: terrafusion/production/database
        property: password
```

### Pod Security

All pods run with:
- Non-root user (UID 10001)
- Read-only root filesystem
- Dropped capabilities (ALL)
- seccomp profile (RuntimeDefault)

## High Availability

### Pod Distribution

- **Anti-affinity rules** prevent pods on same node
- **PodDisruptionBudget** ensures minimum 2 pods always running
- **Multiple availability zones** for node distribution

### Health Checks

- **Startup probe**: 30 attempts × 5s = 150s max startup time
- **Liveness probe**: Restarts unhealthy pods
- **Readiness probe**: Removes unready pods from service

### Autoscaling

- **CPU-based**: Scales at 70% utilization
- **Memory-based**: Scales at 80% utilization
- **Custom metrics**: HTTP requests per second (optional)

## CI/CD Integration

### GitHub Actions

```yaml
- name: Deploy to Kubernetes
  run: |
    helm upgrade --install terrafusion-api ./backend/helm/terrafusion-api \
      --namespace terrafusion \
      --values ./backend/helm/terrafusion-api/values-production.yaml \
      --set image.tag=${{ github.sha }} \
      --wait --timeout 5m
```

### GitOps (ArgoCD)

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: terrafusion-api
spec:
  source:
    repoURL: https://github.com/terrafusion/terrafusion-os
    targetRevision: main
    path: backend/helm/terrafusion-api
    helm:
      valueFiles:
        - values-production.yaml
  destination:
    server: https://kubernetes.default.svc
    namespace: terrafusion
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

## County-Specific Deployments

Deploy for specific counties using value overrides:

```bash
helm install terrafusion-api-benton ./terrafusion-api \
  --namespace terrafusion \
  --set counties.benton.enabled=true \
  --set counties.king.enabled=false
```

## Performance Tuning

### Resource Optimization

Monitor resource usage and adjust:
```bash
kubectl top pods -n terrafusion -l app.kubernetes.io/name=terrafusion-api
```

### Database Connection Pool

Adjust pool size based on load:
```yaml
database:
  poolSize: 100  # Increase for high concurrency
```

### Caching

Enable Redis caching for performance:
```yaml
redis:
  enabled: true
  host: redis.terrafusion.svc.cluster.local
```

## Support

- **Documentation**: https://docs.terrafusion.gov
- **GitHub Issues**: https://github.com/terrafusion/terrafusion-os/issues
- **Email**: support@terrafusion.gov
- **Slack**: #terrafusion-support

## License

Proprietary - TerraFusion OS Platform

---

🏛️ **Government. Transcended.** - Built with championship excellence for 39 Washington State counties.
