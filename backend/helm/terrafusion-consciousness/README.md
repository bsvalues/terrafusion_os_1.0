# TerraFusion Consciousness Engine - Helm Chart

🤖 **Government. Transcended.** - Production-ready Helm chart for 50,000+ AI Agent Swarm with Quantum Optimization

## Overview

This Helm chart deploys the TerraFusion OS Consciousness Engine to Kubernetes with:

- **50,000+ AI agents** - Distributed swarm intelligence coordination
- **Quantum optimization factor 949** - Advanced AI performance enhancement
- **ML model caching** - 50GB persistent storage for model artifacts
- **WebSocket support** - Real-time AI agent communication
- **FISMA-High compliance** - Federal government security standards
- **Autoscaling 5-50 replicas** - Dynamic scaling based on AI load
- **GPU node affinity** - Optimized for ML inference workloads
- **Comprehensive monitoring** - Prometheus, Jaeger, Loki integration

## Prerequisites

- Kubernetes 1.27+
- Helm 3.10+
- NGINX Ingress Controller (with WebSocket support)
- cert-manager (for TLS certificates)
- Prometheus Operator (for ServiceMonitor)
- PostgreSQL database
- Redis cache
- 50GB+ persistent storage (fast SSD recommended)
- Optional: GPU nodes (NVIDIA Tesla T4 or A100)

## Installation

### Development

```bash
helm install terrafusion-consciousness ./terrafusion-consciousness \
  --namespace terrafusion \
  --create-namespace \
  --values values-dev.yaml \
  --set aiAgent.totalAgents=1000 \
  --set replicaCount=1
```

### Staging

```bash
helm install terrafusion-consciousness ./terrafusion-consciousness \
  --namespace terrafusion-staging \
  --create-namespace \
  --values values-staging.yaml \
  --set aiAgent.totalAgents=10000 \
  --set replicaCount=2
```

### Production

```bash
helm install terrafusion-consciousness ./terrafusion-consciousness \
  --namespace terrafusion \
  --create-namespace \
  --values values-production.yaml \
  --set image.tag=1.0.0 \
  --set aiAgent.totalAgents=50000 \
  --set replicaCount=5
```

## Configuration

### Key Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| `replicaCount` | Number of replicas | `5` |
| `image.repository` | Docker image repository | `ghcr.io/terrafusion/terrafusion-consciousness` |
| `image.tag` | Docker image tag | `1.0.0` |
| `service.port` | Service port | `3004` |
| `aiAgent.totalAgents` | Total AI agents | `50000` |
| `aiAgent.agentsPerPod` | Agents per pod | `10000` |
| `aiAgent.quantumOptimizationFactor` | Quantum factor | `949` |
| `autoscaling.minReplicas` | Minimum replicas | `5` |
| `autoscaling.maxReplicas` | Maximum replicas | `50` |
| `resources.requests.cpu` | CPU request | `4000m` |
| `resources.requests.memory` | Memory request | `16Gi` |
| `resources.limits.cpu` | CPU limit | `16000m` |
| `resources.limits.memory` | Memory limit | `64Gi` |
| `persistence.enabled` | Enable ML model cache | `true` |
| `persistence.size` | Cache storage size | `50Gi` |

### AI Agent Configuration

Configure AI agent types and counts:

```yaml
aiAgent:
  totalAgents: 50000
  agentsPerPod: 10000
  quantumOptimizationFactor: 949
  
  agentTypes:
    propertyValuation: 15000
    dataAnalysis: 10000
    complianceValidation: 8000
    performanceMonitoring: 5000
    securityAudit: 4000
    userExperience: 3000
    dataSync: 2500
    healthCheck: 2500
  
  swarmIntelligence:
    enabled: true
    coordinationInterval: 1000  # ms
    consensusThreshold: 0.75
```

### ML Model Configuration

Configure ML model caching and AutoML:

```yaml
mlModels:
  cache:
    enabled: true
    sizeMB: 2048
    persistenceEnabled: true
  
  registry:
    enabled: true
    url: "https://models.terrafusion.gov"
  
  automl:
    enabled: true
    algorithms:
      - FastTreeRegression
      - LightGbm
      - SdcaRegression
    experimentTime: 300  # seconds
```

### GPU Node Affinity

For ML inference optimization:

```yaml
affinity:
  nodeAffinity:
    preferredDuringSchedulingIgnoredDuringExecution:
      - weight: 100
        preference:
          matchExpressions:
            - key: gpu.terrafusion.io/type
              operator: In
              values:
                - nvidia-tesla-t4
                - nvidia-a100

tolerations:
  - key: "gpu"
    operator: "Equal"
    value: "true"
    effect: "NoSchedule"
```

## Upgrading

```bash
helm upgrade terrafusion-consciousness ./terrafusion-consciousness \
  --namespace terrafusion \
  --values values-production.yaml \
  --set image.tag=1.0.1 \
  --set aiAgent.totalAgents=60000
```

## Rollback

```bash
# List release history
helm history terrafusion-consciousness -n terrafusion

# Rollback to previous version
helm rollback terrafusion-consciousness -n terrafusion

# Rollback to specific revision
helm rollback terrafusion-consciousness 3 -n terrafusion
```

## Monitoring

### Prometheus Metrics

Access consciousness metrics:

```bash
kubectl port-forward svc/terrafusion-consciousness 3004:3004 -n terrafusion
curl http://localhost:3004/metrics
```

Custom AI metrics available:
- `ai_agent_count` - Total active AI agents
- `ai_agent_queue_depth` - Agent task queue depth
- `quantum_optimization_score` - Quantum factor effectiveness
- `ml_model_inference_latency` - ML model response time
- `swarm_coordination_latency` - Swarm communication latency

### Grafana Dashboards

Pre-configured dashboards:

- TerraFusion Consciousness Dashboard
- AI Agent Performance Dashboard  
- Quantum Optimization Dashboard
- ML Model Inference Dashboard

### Jaeger Tracing

View distributed AI agent traces:

```bash
kubectl port-forward svc/jaeger-query 16686:16686 -n tracing
# Open http://localhost:16686
```

## Troubleshooting

### Check AI Agent Status

```bash
kubectl get pods -n terrafusion -l app.kubernetes.io/name=terrafusion-consciousness
```

### View AI Agent Logs

```bash
kubectl logs -n terrafusion -l app.kubernetes.io/name=terrafusion-consciousness --follow
```

### Check ML Model Cache

```bash
kubectl get pvc terrafusion-consciousness-ml-cache -n terrafusion
kubectl describe pvc terrafusion-consciousness-ml-cache -n terrafusion
```

### Debug AI Agent Communication

```bash
kubectl debug -n terrafusion <pod-name> -it --image=nicolaka/netshoot
# Test WebSocket connection
wscat -c ws://terrafusion-consciousness:8080
```

### Monitor AI Agent Metrics

```bash
kubectl port-forward svc/terrafusion-consciousness 3004:3004 -n terrafusion
watch -n 5 'curl -s http://localhost:3004/metrics | grep ai_agent'
```

## Security

### FISMA-High Compliance

This chart implements FISMA-High security controls:

- **AC-2, AC-3, AC-6** - Access control with RBAC
- **AU-2, AU-6** - Audit logging for AI operations
- **SC-7, SC-13** - Network security with NetworkPolicy
- **SC-28** - Data encryption (ML models at rest)

### AI Governance

AI ethics and compliance features:

```yaml
compliance:
  aiGovernance:
    enabled: true
    biasDetection: true      # ML model bias detection
    explainability: true      # AI decision explainability
    auditTrail: true          # Full AI operation audit trail
```

### Secrets Management

**Production deployments should use External Secrets Operator:**

```yaml
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: terrafusion-consciousness-external-secrets
spec:
  secretStoreRef:
    name: aws-secrets-manager
    kind: SecretStore
  target:
    name: terrafusion-consciousness-secrets
  data:
    - secretKey: OPENAI_API_KEY
      remoteRef:
        key: terrafusion/production/ai
        property: openai_key
```

## High Availability

### Pod Distribution

- **Anti-affinity rules** prevent pods on same node
- **PodDisruptionBudget** ensures minimum 3 pods for 50,000 agents
- **GPU node affinity** for ML inference optimization

### Health Checks

- **Startup probe**: 60 attempts × 10s = 600s for ML model loading
- **Liveness probe**: Restarts unhealthy AI coordinator pods
- **Readiness probe**: Removes unready pods from swarm

### Autoscaling

```yaml
autoscaling:
  enabled: true
  minReplicas: 5
  maxReplicas: 50
  
  # CPU-based scaling
  targetCPUUtilizationPercentage: 60
  
  # Memory-based scaling
  targetMemoryUtilizationPercentage: 70
  
  # Custom AI metrics scaling
  metrics:
    - ai_agent_queue_depth (target: 1000)
    - ml_model_inference_latency (target: 100ms)
```

## Performance Tuning

### Resource Optimization

For 50,000 AI agents:

```yaml
resources:
  requests:
    cpu: 4000m      # 4 cores baseline
    memory: 16Gi    # 16GB for agent coordination
  limits:
    cpu: 16000m     # 16 cores burst capacity
    memory: 64Gi    # 64GB for heavy AI workloads
```

### ML Model Cache Tuning

Adjust cache size based on model count:

```yaml
mlModels:
  cache:
    sizeMB: 2048  # 2GB in-memory cache
    
persistence:
  size: 50Gi      # 50GB persistent storage
```

### Swarm Coordination Tuning

Optimize for AI agent communication:

```yaml
aiAgent:
  swarmIntelligence:
    coordinationInterval: 1000  # Lower for faster coordination
    consensusThreshold: 0.75     # Adjust for coordination strictness
  
  communication:
    heartbeatInterval: 5000  # 5s agent health checks
    timeout: 30000           # 30s communication timeout
```

## County-Specific Deployments

Deploy with county-specific AI agent allocation:

```bash
helm install terrafusion-consciousness ./terrafusion-consciousness \
  --namespace terrafusion \
  --set counties.benton.enabled=true \
  --set counties.benton.aiAgents=1500 \
  --set counties.king.enabled=true \
  --set counties.king.aiAgents=3000
```

## CI/CD Integration

### GitHub Actions

```yaml
- name: Deploy Consciousness Engine
  run: |
    helm upgrade --install terrafusion-consciousness \
      ./backend/helm/terrafusion-consciousness \
      --namespace terrafusion \
      --values ./backend/helm/terrafusion-consciousness/values-production.yaml \
      --set image.tag=${{ github.sha }} \
      --set aiAgent.totalAgents=50000 \
      --wait --timeout 10m
```

### GitOps (ArgoCD)

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: terrafusion-consciousness
spec:
  source:
    repoURL: https://github.com/terrafusion/terrafusion-os
    targetRevision: main
    path: backend/helm/terrafusion-consciousness
    helm:
      valueFiles:
        - values-production.yaml
      parameters:
        - name: aiAgent.totalAgents
          value: "50000"
  destination:
    server: https://kubernetes.default.svc
    namespace: terrafusion
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

## Support

- **Documentation**: https://docs.terrafusion.gov/consciousness
- **GitHub Issues**: https://github.com/terrafusion/terrafusion-os/issues
- **Email**: ai-support@terrafusion.gov
- **Slack**: #terrafusion-ai-support

## License

Proprietary - TerraFusion OS Platform

---

🤖 **Government. Transcended.** - 50,000 AI agents coordinated with quantum excellence for 39 Washington State counties.
