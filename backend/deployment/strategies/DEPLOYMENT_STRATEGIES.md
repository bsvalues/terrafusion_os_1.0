# TerraFusion Platform - Deployment Strategies

🏛️ **Government. Transcended.** - Zero-downtime deployment strategies for 50,000 AI agents across 39 Washington State counties

## Overview

TerraFusion OS supports three production deployment strategies:

1. **Blue-Green Deployment** - Complete environment switch with instant rollback capability
2. **Canary Deployment** - Progressive traffic shifting with automated analysis and rollback
3. **Rolling Update** - Incremental pod replacement (Kubernetes default)

## Strategy Comparison

| Feature | Blue-Green | Canary | Rolling Update |
|---------|-----------|--------|----------------|
| **Downtime** | Zero | Zero | Zero |
| **Rollback Speed** | Instant | Automatic | Manual (30s-2m) |
| **Resource Usage** | 2x (temporary) | 1.1-1.5x | 1x |
| **Risk Level** | Low | Very Low | Medium |
| **Complexity** | Medium | High | Low |
| **Testing Capability** | Full environment | Progressive | Limited |
| **Best For** | Major releases | High-risk changes | Minor updates |

## Blue-Green Deployment

### Concept — Blue-Green

Blue-green deployment maintains two identical production environments (blue and green). At any time, only one environment serves live traffic. When deploying:

1. Deploy new version to inactive environment (e.g., green)
2. Test green environment thoroughly
3. Switch traffic from blue to green
4. Keep blue as instant rollback option

### Prerequisites — Blue-Green

```bash
# Ensure kubectl and helm are installed
kubectl version --client
helm version

# Verify cluster access
kubectl cluster-info
```

### Usage — Blue-Green

```bash
# Basic deployment
export NAMESPACE=terrafusion
export SERVICE=terrafusion-api
export IMAGE_TAG=1.2.0
./backend/deployment/strategies/deploy-blue-green.sh

# With custom configuration
export NAMESPACE=terrafusion-staging
export SERVICE=terrafusion-consciousness
export IMAGE_TAG=v2.0.0-beta
export HEALTH_CHECK_RETRIES=50
export TRAFFIC_SWITCH_DELAY=60
./backend/deployment/strategies/deploy-blue-green.sh
```

### Configuration Variables — Blue-Green

| Variable | Default | Description |
|----------|---------|-------------|
| `NAMESPACE` | `terrafusion` | Kubernetes namespace |
| `SERVICE` | `terrafusion-api` | Service name |
| `IMAGE_TAG` | `latest` | Docker image tag |
| `REGISTRY` | `ghcr.io/terrafusion` | Container registry |
| `HEALTH_CHECK_RETRIES` | `30` | Max health check attempts |
| `HEALTH_CHECK_INTERVAL` | `10` | Seconds between health checks |
| `TRAFFIC_SWITCH_DELAY` | `30` | Delay before switching traffic |

### Deployment Flow — Blue-Green

```text
┌─────────────────────────────────────────────────────────────┐
│ 1. Check Prerequisites                                      │
│    ✓ kubectl, helm installed                               │
│    ✓ Cluster connectivity                                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Determine Active Environment                             │
│    Current: Blue (100% traffic)                             │
│    Target: Green (0% traffic)                               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Deploy to Green Environment                              │
│    - Create/update deployment                               │
│    - New image: v1.2.0                                      │
│    - Replicas: 3                                            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. Wait for Rollout (max 10 minutes)                        │
│    ✓ All pods running                                       │
│    ✓ Readiness probes passing                               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. Health Checks (30 retries × 10s)                         │
│    ✓ /health endpoint responding                            │
│    ✓ Pod-level checks passing                               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. Smoke Tests                                              │
│    ✓ Health endpoint                                        │
│    ✓ Metrics endpoint                                       │
│    ✓ API version endpoint                                   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. Switch Traffic (30s delay)                               │
│    Blue: 100% → 0%                                          │
│    Green: 0% → 100%                                         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 8. Monitor New Environment (60s)                            │
│    ✓ Pod health                                             │
│    ✓ Error rates                                            │
│    ✓ Response times                                         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 9. Scale Down Blue                                          │
│    Blue: 3 replicas → 0 replicas                            │
│    (Keep for potential rollback)                            │
└─────────────────────────────────────────────────────────────┘
                            ↓
                      ✅ Complete
```

### Rollback Procedure — Blue-Green

If any step fails, automatic rollback occurs:

```bash
# Automatic rollback triggers on:
# - Deployment rollout failure
# - Health check failures (30 attempts)
# - Smoke test failures
# - Monitoring issues (60s window)

# Manual rollback (if needed)
./backend/deployment/strategies/rollback.sh
```

### Best Practices — Blue-Green

1. **Pre-deployment Validation**
   - Run integration tests in staging environment
   - Verify database migrations are backward compatible
   - Ensure feature flags are configured correctly

2. **Health Check Design**
   - Health endpoint should check critical dependencies
   - Include database connectivity
   - Verify AI agent initialization (for Consciousness service)
   - Check county system integrations (for Operations service)

3. **Monitoring During Deployment**
   - Watch Prometheus metrics dashboard
   - Monitor Slack `#terrafusion-deployments` channel
   - Check Grafana dashboards for anomalies

4. **Post-Deployment**
   - Keep old environment for at least 1 hour
   - Monitor error rates and response times
   - Review logs for unexpected warnings

## Canary Deployment

### Concept — Canary

Canary deployment gradually shifts traffic from the stable version to the new version while monitoring metrics. If metrics degrade, automatic rollback occurs.

### Prerequisites — Canary

```bash
# Install Flagger (if not already installed)
kubectl apply -k github.com/fluxcd/flagger//kustomize/linkerd

# Verify Flagger installation
kubectl get crd canaries.flagger.app

# Optional: Install Flagger CLI
brew install flagger  # macOS
```

### Usage — Canary

```bash
# Basic canary deployment
export NAMESPACE=terrafusion
export SERVICE=terrafusion-api
export IMAGE_TAG=1.3.0
./backend/deployment/strategies/deploy-canary.sh

# Custom canary configuration
export CANARY_WEIGHT_START=5
export CANARY_WEIGHT_INCREMENT=5
export CANARY_WEIGHT_MAX=50
export ANALYSIS_INTERVAL=120
./backend/deployment/strategies/deploy-canary.sh
```

### Configuration Variables — Canary

| Variable | Default | Description |
|----------|---------|-------------|
| `CANARY_WEIGHT_START` | `10` | Initial canary traffic % |
| `CANARY_WEIGHT_INCREMENT` | `10` | Traffic increment per step |
| `CANARY_WEIGHT_MAX` | `50` | Maximum canary traffic % |
| `ANALYSIS_INTERVAL` | `60` | Seconds between analyses |
| `SUCCESS_THRESHOLD` | `3` | Successful checks before promotion |
| `ERROR_THRESHOLD` | `5` | Failed checks before rollback |

### Progressive Traffic Shift — Canary

```
Time    Primary    Canary    Status
────────────────────────────────────────────────────
0:00    100%       0%        Deploy canary
1:00    90%        10%       Analysis (iteration 1)
2:00    80%        20%       Analysis (iteration 2)
3:00    70%        30%       Analysis (iteration 3)
4:00    60%        40%       Analysis (iteration 4)
5:00    50%        50%       Max weight reached
6:00    50%        50%       Waiting promotion
7:00    0%         100%      Promoted to primary
```

### Monitored Metrics — Canary

Flagger analyzes these Prometheus metrics:

1. **Request Success Rate** (min 99%)
   ```promql
   sum(rate(http_requests_total{status!~"5.."}[1m])) /
   sum(rate(http_requests_total[1m])) * 100
   ```

2. **Request Duration** (max 500ms)
   ```promql
   histogram_quantile(0.99,
     sum(rate(http_request_duration_seconds_bucket[1m])) by (le)
   ) * 1000
   ```

3. **Error Rate** (max 1%)
   ```promql
   sum(rate(http_requests_total{status=~"5.."}[1m])) /
   sum(rate(http_requests_total[1m])) * 100
   ```

### Automatic Rollback — Canary

Rollback is triggered automatically when:

- Error rate exceeds 1%
- Request success rate drops below 99%
- Request duration exceeds 500ms (P99)
- 5 consecutive failed metric checks

### Manual Control — Canary

```bash
# Check canary status
kubectl describe canary terrafusion-api -n terrafusion

# Manually promote canary
kubectl patch canary terrafusion-api -n terrafusion --type=json \
  -p='[{"op": "replace", "path": "/spec/analysis/maxWeight", "value": 100}]'

# Abort canary (rollback)
kubectl patch canary terrafusion-api -n terrafusion --type=json \
  -p='[{"op": "replace", "path": "/spec/analysis/maxWeight", "value": 0}]'
```

### Best Practices — Canary

1. **Metric Selection**
   - Choose metrics that indicate user-facing issues
   - Use percentiles (P95, P99) not averages
   - Include business metrics (e.g., AI agent accuracy for Consciousness)

2. **Analysis Intervals**
   - Start with longer intervals (120s) for stability
   - Shorter intervals (60s) for faster feedback in staging
   - Balance speed vs. confidence in metrics

3. **Traffic Weights**
   - Conservative: 5% increments, max 25% (high-risk changes)
   - Standard: 10% increments, max 50% (normal releases)
   - Aggressive: 20% increments, max 100% (low-risk hotfixes)

4. **Smoke Tests**
   - Use pre-rollout webhooks for critical validations
   - Test county-specific endpoints (for Operations service)
   - Verify AI agent initialization (for Consciousness service)

## Rolling Update

### Concept — Rolling Update

Kubernetes default strategy that gradually replaces old pods with new pods. Simpler than blue-green or canary but offers less control.

### Usage — Rolling Update

```bash
# Update deployment image
kubectl set image deployment/terrafusion-api \
  terrafusion-api=ghcr.io/terrafusion/terrafusion-api:1.4.0 \
  -n terrafusion

# Monitor rollout
kubectl rollout status deployment/terrafusion-api -n terrafusion

# Pause rollout if issues detected
kubectl rollout pause deployment/terrafusion-api -n terrafusion

# Resume rollout
kubectl rollout resume deployment/terrafusion-api -n terrafusion

# Rollback
./backend/deployment/strategies/rollback.sh
```

### Configuration — Rolling Update

Configured in Helm chart `deployment.yaml`:

```yaml
spec:
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 25%        # Max additional pods during update
      maxUnavailable: 25%  # Max unavailable pods during update
  minReadySeconds: 30      # Wait before considering pod ready
```

### Recommended Settings by Service

| Service | maxSurge | maxUnavailable | minReadySeconds |
|---------|----------|----------------|-----------------|
| API | 25% | 25% | 30 |
| Consciousness | 1 pod | 0 | 60 |
| Gateway | 50% | 25% | 15 |
| Operations | 25% | 25% | 30 |

### When to Use Rolling Update

✅ **Good for:**
- Minor version updates
- Configuration changes
- Resource limit adjustments
- Low-risk bug fixes

❌ **Avoid for:**
- Major version updates (use blue-green)
- Breaking API changes (use canary)
- Database schema changes (coordinate carefully)
- High-risk features (use canary)

## Rollback Procedures

### Script Usage

```bash
# Rollback to previous revision
export SERVICE=terrafusion-api
export NAMESPACE=terrafusion
./backend/deployment/strategies/rollback.sh

# Rollback to specific revision
export REVISION=5
./backend/deployment/strategies/rollback.sh

# Auto-confirm (for scripts)
export AUTO_CONFIRM=true
./backend/deployment/strategies/rollback.sh
```

### View Deployment History

```bash
# List all revisions
kubectl rollout history deployment/terrafusion-api -n terrafusion

# View specific revision details
kubectl rollout history deployment/terrafusion-api -n terrafusion --revision=5
```

### Emergency Rollback

For critical production issues:

```bash
# 1. Immediate rollback (bypasses health checks)
kubectl rollout undo deployment/terrafusion-api -n terrafusion

# 2. Monitor rollback
kubectl rollout status deployment/terrafusion-api -n terrafusion --watch

# 3. Verify pods are healthy
kubectl get pods -n terrafusion -l app=terrafusion-api

# 4. Check service status
kubectl exec -n terrafusion deployment/terrafusion-api -- \
  curl -f http://localhost:5000/health
```

## Service-Specific Considerations

### TerraFusion API

- **Strategy**: Blue-green or canary
- **Critical**: Database connectivity, county configurations
- **Health Check**: `/health`, `/health/ready`
- **Startup Time**: 15-30 seconds
- **Rollout Timeout**: 10 minutes

```bash
export SERVICE=terrafusion-api
export IMAGE_TAG=1.5.0
./backend/deployment/strategies/deploy-blue-green.sh
```

### Consciousness Engine (50,000 AI Agents)

- **Strategy**: Blue-green (safer for AI agent initialization)
- **Critical**: ML model loading, GPU availability, agent synchronization
- **Health Check**: `/health`, `/health/agents`
- **Startup Time**: 2-5 minutes (agent initialization)
- **Rollout Timeout**: 15 minutes

```bash
export SERVICE=terrafusion-consciousness
export IMAGE_TAG=2.0.0
export HEALTH_CHECK_INTERVAL=20
export HEALTH_CHECK_RETRIES=60
./backend/deployment/strategies/deploy-blue-green.sh
```

### Gateway (Ocelot)

- **Strategy**: Canary (test routing changes progressively)
- **Critical**: Backend routing, rate limiting, CORS
- **Health Check**: `/health`, `/routes`
- **Startup Time**: 10-15 seconds
- **Rollout Timeout**: 5 minutes

```bash
export SERVICE=terrafusion-gateway
export IMAGE_TAG=1.1.0
export CANARY_WEIGHT_INCREMENT=20
./backend/deployment/strategies/deploy-canary.sh
```

### Operations Service (39 Counties)

- **Strategy**: Blue-green or canary
- **Critical**: Harris PACS, Tyler, Aumentum integrations
- **Health Check**: `/health`, `/health/counties`
- **Startup Time**: 30-60 seconds (county connections)
- **Rollout Timeout**: 10 minutes

```bash
export SERVICE=terrafusion-operations
export IMAGE_TAG=1.3.0
./backend/deployment/strategies/deploy-blue-green.sh
```

## CI/CD Integration

### GitHub Actions

```yaml
name: Deploy to Production

on:
  push:
    tags:
      - 'v*'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure kubectl
        uses: azure/k8s-set-context@v3
        with:
          kubeconfig: ${{ secrets.KUBECONFIG }}
      
      - name: Blue-Green Deployment
        env:
          NAMESPACE: terrafusion
          SERVICE: terrafusion-api
          IMAGE_TAG: ${{ github.ref_name }}
          REGISTRY: ghcr.io/terrafusion
        run: |
          chmod +x ./backend/deployment/strategies/deploy-blue-green.sh
          ./backend/deployment/strategies/deploy-blue-green.sh
      
      - name: Notify Slack
        if: always()
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          channel: '#terrafusion-deployments'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### ArgoCD Sync Hooks

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: terrafusion-api-prod
spec:
  syncPolicy:
    automated:
      prune: false  # Disable for manual blue-green
      selfHeal: false
  
  # Use sync hooks for blue-green
  source:
    helm:
      parameters:
        - name: deployment.strategy
          value: blue-green
```

## Monitoring During Deployment

### Key Metrics to Watch

1. **HTTP Request Rate**
   ```promql
   rate(http_requests_total[5m])
   ```

2. **Error Rate**
   ```promql
   rate(http_requests_total{status=~"5.."}[5m]) /
   rate(http_requests_total[5m]) * 100
   ```

3. **Response Time (P99)**
   ```promql
   histogram_quantile(0.99,
     rate(http_request_duration_seconds_bucket[5m])
   )
   ```

4. **Pod Restarts**
   ```promql
   rate(kube_pod_container_status_restarts_total[5m])
   ```

5. **AI Agent Health** (Consciousness)
   ```promql
   terrafusion_ai_agents_healthy / terrafusion_ai_agents_total * 100
   ```

### Grafana Dashboards

Access real-time deployment metrics:

- **Deployment Overview**: [Grafana Deployment Overview](http://grafana.terrafusion.gov/d/deployment)
- **Service Health**: [Grafana Service Health](http://grafana.terrafusion.gov/d/service-health)
- **AI Agent Monitoring**: [Grafana AI Agent Monitoring](http://grafana.terrafusion.gov/d/ai-agents)

### Alert Channels

- **Slack**: `#terrafusion-deployments` (all deployments)
- **Slack**: `#terrafusion-critical` (production issues)
- **PagerDuty**: Critical production failures
- **Email**: `sre-team@terrafusion.gov`

## Troubleshooting

### Common Issues

#### Deployment Stuck in Progressing

```bash
# Check pod events
kubectl describe deployment terrafusion-api -n terrafusion
kubectl get events -n terrafusion --sort-by='.lastTimestamp'

# Check pod logs
kubectl logs -n terrafusion deployment/terrafusion-api --tail=100

# Force rollback
./backend/deployment/strategies/rollback.sh
```

#### Health Checks Failing

```bash
# Test health endpoint directly
POD=$(kubectl get pod -n terrafusion -l app=terrafusion-api -o name | head -1)
kubectl exec -n terrafusion $POD -- curl -v http://localhost:5000/health

# Check readiness probe
kubectl get pod -n terrafusion -l app=terrafusion-api -o yaml | grep -A 10 readinessProbe
```

#### Traffic Not Switching (Blue-Green)

```bash
# Verify service selector
kubectl get service terrafusion-api -n terrafusion -o yaml | grep -A 5 selector

# Manually update selector
kubectl patch service terrafusion-api -n terrafusion -p \
  '{"spec":{"selector":{"version":"green"}}}'
```

#### Canary Stuck or Failing

```bash
# Check canary status
kubectl describe canary terrafusion-api -n terrafusion

# View Flagger logs
kubectl logs -n flagger-system deployment/flagger -f

# Force promotion or rollback
kubectl patch canary terrafusion-api -n terrafusion --type=json \
  -p='[{"op": "replace", "path": "/spec/analysis/maxWeight", "value": 100}]'
```

## Best Practices Summary

### Pre-Deployment

- [ ] Test in staging environment first
- [ ] Verify database migrations are backward compatible
- [ ] Check feature flags configuration
- [ ] Review deployment strategy selection
- [ ] Notify team in `#terrafusion-deployments`

### During Deployment

- [ ] Monitor Grafana dashboards
- [ ] Watch Prometheus alerts
- [ ] Check pod logs for errors
- [ ] Verify health endpoints responding
- [ ] Monitor county integrations (Operations service)

### Post-Deployment

- [ ] Keep old environment for 1+ hours (blue-green)
- [ ] Monitor error rates and latency
- [ ] Verify AI agent health (Consciousness)
- [ ] Check county sync status (Operations)
- [ ] Update deployment notes in Slack

### Rollback Decision Matrix

| Symptom | Severity | Action |
|---------|----------|--------|
| Error rate > 5% | Critical | Immediate rollback |
| P99 latency > 2x baseline | High | Rollback within 5 minutes |
| AI agent failures > 1% | High | Rollback (Consciousness) |
| County sync failures | High | Rollback (Operations) |
| Minor log warnings | Low | Monitor, decide in 15 minutes |

## Support

- **Documentation**: [Deployment Docs](https://docs.terrafusion.gov/deployment)
- **Runbooks**: [Runbooks](https://docs.terrafusion.gov/runbooks)
- **Slack**: `#terrafusion-sre`
- **On-Call**: PagerDuty rotation
- **Email**: sre-team@terrafusion.gov

---

🏛️ **Government. Transcended.** - Deployment excellence for 50,000 AI agents across 39 counties.
