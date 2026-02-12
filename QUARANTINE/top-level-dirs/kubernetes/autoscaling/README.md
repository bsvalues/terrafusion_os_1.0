# TerraFusion OS - Auto-Scaling & Load Balancing

**Enable dynamic scaling to handle traffic spikes automatically**

---

## 📊 Overview

This auto-scaling solution provides horizontal and vertical pod autoscaling for TerraFusion OS, enabling:

- **Horizontal Pod Autoscaling (HPA)** - Scale pod replicas based on CPU/memory/custom metrics
- **Vertical Pod Autoscaling (VPA)** - Optimize resource requests/limits automatically
- **Pod Disruption Budgets (PDB)** - Ensure high availability during disruptions
- **Load Testing** - Validate scaling behavior under various load patterns

### Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Traffic Load                                  │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                    ┌───────────▼──────────┐
                    │   Kong API Gateway   │
                    │   (2-6 pods, HPA)    │
                    └───────────┬──────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
┌───────▼────────┐   ┌──────────▼──────────┐   ┌──────▼────────┐
│  Backend API   │   │     AI Agent        │   │  MCP Servers  │
│ (2-10 pods)    │   │   (2-5 pods)        │   │  (2-8 pods)   │
│  HPA @ 70% CPU │   │ HPA @ 70% CPU       │   │ HPA @ 70% CPU │
│  VPA (Auto)    │   │ HPA @ queue >10     │   │ VPA (Auto)    │
└───────┬────────┘   │ VPA (Auto)          │   └──────┬────────┘
        │            └──────────┬──────────┘           │
        │                       │                      │
        └───────────────┬───────┴──────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │                               │
┌───────▼─────────┐           ┌─────────▼────────┐
│   PostgreSQL    │           │      Redis       │
│  (StatefulSet)  │           │  (StatefulSet)   │
│  VPA (Off)      │           │  VPA (Off)       │
│  PDB: No evict  │           │  PDB: No evict   │
└─────────────────┘           └──────────────────┘
```

### Components

| Component | Type | Min | Max | Scale Trigger | VPA Mode |
|-----------|------|-----|-----|---------------|----------|
| **Backend API** | HPA | 2 | 10 | CPU 70%, Memory 80% | Auto |
| **AI Agent** | HPA | 2 | 5 | CPU 70%, Memory 80%, Queue >10 | Auto |
| **MCP Servers** | HPA | 2 | 8 | CPU 70%, Memory 80% | Auto |
| **Kong Gateway** | HPA | 2 | 6 | CPU 70%, Memory 80%, >1000 RPS | - |
| **PostgreSQL** | StatefulSet | 1 | 1 | Manual | Off (recommend only) |
| **Redis** | StatefulSet | 1 | 1 | Manual | Off (recommend only) |

---

## 🚀 Installation

### Prerequisites

- **Kubernetes cluster** (v1.23+)
- **kubectl** configured with cluster access
- **metrics-server** (auto-installed if missing)
- **Prometheus** (for custom metrics, optional)

### Quick Install

```powershell
# Run the automated installation script
cd kubernetes/autoscaling
.\install-autoscaling.ps1

# This will:
# 1. Check prerequisites (kubectl, cluster, metrics-server)
# 2. Apply resource requests/limits
# 3. Create HorizontalPodAutoscalers (HPA)
# 4. Create PodDisruptionBudgets (PDB)
# 5. Install VerticalPodAutoscaler (VPA) [optional]
# 6. Verify setup
```

### Manual Installation

<details>
<summary>Click to expand manual installation steps</summary>

#### Step 1: Install metrics-server

```bash
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

# Wait for metrics-server to be ready
kubectl wait --for=condition=available --timeout=300s deployment/metrics-server -n kube-system
```

#### Step 2: Apply Resource Limits

```bash
kubectl apply -f resource-limits.yaml
```

#### Step 3: Create HorizontalPodAutoscalers

```bash
kubectl apply -f hpa.yaml
```

#### Step 4: Create PodDisruptionBudgets

```bash
kubectl apply -f pdb.yaml
```

#### Step 5: Install VPA (Optional)

```bash
git clone https://github.com/kubernetes/autoscaler.git
cd autoscaler/vertical-pod-autoscaler
./hack/vpa-up.sh

# Apply VPA configurations
kubectl apply -f ../../vpa.yaml
```

</details>

---

## 📈 How It Works

### Horizontal Pod Autoscaling (HPA)

HPA automatically scales the number of pods based on observed metrics:

**Backend API Example**:
- **Min replicas**: 2 (high availability)
- **Max replicas**: 10 (cost control)
- **Scale up**: When CPU > 70% OR Memory > 80%
- **Scale down**: When CPU < 70% AND Memory < 80%
- **Behavior**:
  - Scale up: Add 50% or 2 pods (whichever is more) every 60 seconds
  - Scale down: Remove 25% or 1 pod (whichever is less) every 60 seconds
  - Stabilization: Wait 60s before scale-up, 300s before scale-down

**Metrics**:
1. **Resource Metrics** (CPU, Memory) - From metrics-server
2. **Custom Metrics** (Queue depth, RPS) - From Prometheus Adapter

### Vertical Pod Autoscaling (VPA)

VPA automatically adjusts resource requests/limits based on usage:

**Modes**:
- **Auto**: Automatically update resource requests (used for stateless services)
- **Off**: Recommendation only (used for stateful services like PostgreSQL/Redis)

**Example**: Backend API running at 300m CPU (requested 500m)
- VPA recommendation: Lower request to 350m (save resources)
- VPA automatically updates deployment (pod restart required)

### Pod Disruption Budgets (PDB)

PDB ensures minimum availability during voluntary disruptions:

**Stateless Services** (Backend API, AI Agent, MCP Servers, Kong):
- **minAvailable**: 1 pod (at least 1 pod must be available)
- **Use case**: Node drains, cluster upgrades, maintenance

**Stateful Services** (PostgreSQL, Redis):
- **maxUnavailable**: 0 (never evict pods automatically)
- **Use case**: Require manual intervention for disruptions

---

## 🔍 Monitoring

### View HPA Status

```powershell
# List all HPAs
kubectl get hpa -A

# Watch HPA in real-time
kubectl get hpa -A --watch

# Describe specific HPA
kubectl describe hpa backend-api-hpa -n terrafusion-prod

# Output example:
# Name:                                                  backend-api-hpa
# Namespace:                                             terrafusion-prod
# Reference:                                             Deployment/backend-api
# Metrics:                                               ( current / target )
#   resource cpu on pods  (as a percentage of request):  45% (225m) / 70%
#   resource memory on pods (as a percentage of request): 60% (307Mi) / 80%
# Min replicas:                                          2
# Max replicas:                                          10
# Deployment pods:                                       3 current / 3 desired
```

### View VPA Recommendations

```powershell
# List all VPAs
kubectl get vpa -A

# Describe specific VPA
kubectl describe vpa backend-api-vpa -n terrafusion-prod

# Output example (shows recommendations):
# Container Recommendations:
#   Container Name:  backend-api
#   Lower Bound:
#     Cpu:     250m
#     Memory:  262144k
#   Target:
#     Cpu:     350m      ← Recommended CPU
#     Memory:  524288k   ← Recommended Memory
#   Uncapped Target:
#     Cpu:     350m
#     Memory:  524288k
#   Upper Bound:
#     Cpu:     4
#     Memory:  4Gi
```

### View Current Resource Usage

```powershell
# View pod resource usage
kubectl top pods -n terrafusion-prod

# View node resource usage
kubectl top nodes

# Output example:
# NAME                          CPU(cores)   CPU%   MEMORY(bytes)   MEMORY%
# backend-api-74d9c8b5f8-abc123 225m         45%    307Mi           60%
# backend-api-74d9c8b5f8-def456 230m         46%    310Mi           61%
# ai-agent-5b8f9d6c7e-ghi789    890m         89%    1200Mi          75%
```

### Grafana Dashboards

Navigate to Grafana and open these dashboards:

1. **TerraFusion System Overview**
   - Current pod counts per service
   - Scaling events timeline
   - Resource utilization trends

2. **Kubernetes Cluster Dashboard**
   - Node CPU/memory utilization
   - Pod count by namespace
   - HPA current/desired replicas

3. **Service-Specific Dashboards** (Backend API, AI Agent, MCP Servers)
   - Request rate vs pod count
   - CPU/memory usage vs HPA thresholds
   - Scaling latency (time to scale)

---

## 🧪 Load Testing

### Using k6

#### Install k6

```powershell
# Windows (Chocolatey)
choco install k6

# macOS
brew install k6

# Linux
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

#### Run Load Test

```powershell
# Run complete load test (46 minutes)
k6 run load-test.js

# Run with custom duration
k6 run --duration 10m --vus 50 load-test.js

# Run with custom BASE_URL
k6 run -e BASE_URL=http://localhost:8080 load-test.js

# Run in cloud (for remote testing)
k6 cloud load-test.js
```

#### Load Test Scenarios

**Scenario 1: Ramp-up (0-18 minutes)**
- Gradual load increase: 0 → 50 → 100 users
- Purpose: Test HPA scale-up behavior
- Expected: Backend API scales from 2 to 4-6 pods

**Scenario 2: Spike (18-23 minutes)**
- Sudden spike: 0 → 200 users in 30 seconds
- Purpose: Test rapid scaling and resilience
- Expected: HPA triggers immediately, pods scale quickly

**Scenario 3: Stress (23-46 minutes)**
- Progressive overload: 100 → 200 → 300 users
- Purpose: Find breaking point and max capacity
- Expected: Services reach max replicas, latency increases

### Using Apache Bench (Simple Test)

```powershell
# Simple load test (quick validation)
kubectl run load-generator --image=httpd:alpine --rm -it -- \
  ab -n 10000 -c 100 http://backend-api.terrafusion-prod:8080/api/health

# Explanation:
#   -n 10000 = 10,000 total requests
#   -c 100   = 100 concurrent requests
```

### Watching Scaling in Real-Time

```powershell
# Terminal 1: Watch HPA
kubectl get hpa -A --watch

# Terminal 2: Watch pods
kubectl get pods -n terrafusion-prod --watch

# Terminal 3: Monitor resource usage
watch kubectl top pods -n terrafusion-prod

# Terminal 4: Grafana
# Open http://localhost:3000 and view "TerraFusion System Overview"
```

---

## ⚙️ Configuration

### Adjusting HPA Thresholds

Edit `hpa.yaml` to adjust scaling behavior:

```yaml
# Example: Make Backend API scale more aggressively
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: backend-api-hpa
spec:
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 60  # Scale up at 60% instead of 70%
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 30   # Scale up faster (30s instead of 60s)
      policies:
        - type: Percent
          value: 100                    # Double the pods (100% instead of 50%)
```

Apply changes:
```powershell
kubectl apply -f hpa.yaml
```

### Adjusting Resource Requests/Limits

Edit `resource-limits.yaml`:

```yaml
# Example: Give Backend API more resources
resources:
  requests:
    cpu: 1000m      # 1 CPU core (was 500m)
    memory: 1Gi     # 1 GB (was 512Mi)
  limits:
    cpu: 4000m      # 4 CPU cores (was 2000m)
    memory: 4Gi     # 4 GB (was 2Gi)
```

Apply changes:
```powershell
kubectl apply -f resource-limits.yaml
kubectl rollout restart deployment/backend-api -n terrafusion-prod
```

### Custom Metrics (Advanced)

To use custom metrics (queue depth, RPS), install Prometheus Adapter:

```bash
helm install prometheus-adapter prometheus-community/prometheus-adapter \
  --namespace observability \
  --set prometheus.url=http://prometheus-kube-prometheus-prometheus.observability.svc.cluster.local:9090
```

Configure custom metrics in HPA:
```yaml
metrics:
  - type: Pods
    pods:
      metric:
        name: ai_queue_depth
      target:
        type: AverageValue
        averageValue: "10"
```

---

## 🛠️ Troubleshooting

### HPA Shows "unknown" for Metrics

**Problem**: HPA shows `<unknown> / 70%` for CPU/memory

**Solution**:
```powershell
# Check metrics-server is running
kubectl get deployment metrics-server -n kube-system

# Check pods have resource requests
kubectl describe pod <pod-name> -n terrafusion-prod | grep -A 5 "Requests"

# Wait 2-3 minutes for metrics to populate
kubectl get hpa -A --watch
```

### Pods Not Scaling

**Problem**: Load increases but pods don't scale

**Solution**:
```powershell
# Check HPA status
kubectl describe hpa <hpa-name> -n terrafusion-prod

# Look for:
#   • "unable to get metric" = metrics-server issue
#   • "unable to compute replica count" = resource requests missing
#   • "current replicas = desired replicas" = already at target

# Check HPA events
kubectl get events -n terrafusion-prod --field-selector involvedObject.kind=HorizontalPodAutoscaler
```

### VPA Not Updating Resources

**Problem**: VPA shows recommendations but doesn't update pods

**Solution**:
```powershell
# Check VPA mode
kubectl describe vpa <vpa-name> -n terrafusion-prod

# If updateMode: "Off", VPA only recommends (no auto-update)
# Change to "Auto" for automatic updates:
kubectl edit vpa <vpa-name> -n terrafusion-prod
# Change: updateMode: "Off" → updateMode: "Auto"

# Note: Changing resource requests requires pod restart
```

### High Scaling Latency

**Problem**: Pods take >2 minutes to scale

**Solution**:
```powershell
# Check stabilization window
kubectl describe hpa <hpa-name> -n terrafusion-prod

# Reduce stabilization window for faster scaling:
kubectl edit hpa <hpa-name> -n terrafusion-prod
# Change: stabilizationWindowSeconds: 60 → stabilizationWindowSeconds: 30

# Check pod startup time
kubectl describe pod <pod-name> -n terrafusion-prod
# Look for "Started" event timestamp
```

### Pods Evicted During Disruptions

**Problem**: Pods evicted during node drains despite PDB

**Solution**:
```powershell
# Check PDB status
kubectl get pdb -A

# Describe PDB
kubectl describe pdb <pdb-name> -n terrafusion-prod

# Ensure minAvailable is set correctly:
kubectl edit pdb <pdb-name> -n terrafusion-prod
# Change: minAvailable: 1 (at least 1 pod must be available)
```

---

## 📊 Metrics Reference

### HPA Metrics

| Metric | Type | Source | Description |
|--------|------|--------|-------------|
| `cpu` | Resource | metrics-server | CPU utilization (% of request) |
| `memory` | Resource | metrics-server | Memory utilization (% of request) |
| `ai_queue_depth` | Custom | Prometheus | AI request queue depth |
| `kong_http_requests_per_second` | Custom | Prometheus | Kong RPS per pod |

### Scaling Events

View scaling events in Grafana or via kubectl:

```powershell
# View HPA scaling events
kubectl get events -n terrafusion-prod --field-selector reason=ScalingReplicaSet

# Example output:
# 2m ago   Normal   ScalingReplicaSet   HPA   New size: 4; reason: cpu resource utilization (percentage of request) above target
# 5m ago   Normal   ScalingReplicaSet   HPA   New size: 3; reason: All metrics below target
```

---

## 📖 Best Practices

### Resource Requests/Limits

✅ **Set requests based on average usage** (not peak)
- Example: If average CPU is 300m, set request to 400m (buffer)

✅ **Set limits 2-4x higher than requests**
- Allows bursting without throttling
- Example: Request 500m, Limit 2000m (4x)

❌ **Don't set requests = limits** (QoS Guaranteed)
- Prevents CPU bursting
- Wastes resources

### HPA Configuration

✅ **Scale up aggressively, scale down conservatively**
- Scale up: 50-100% increase, 30-60s stabilization
- Scale down: 25% decrease, 300s stabilization

✅ **Use multiple metrics** (CPU AND memory)
- Catches different bottlenecks
- More accurate scaling decisions

❌ **Don't set thresholds too low** (<50%)
- Causes excessive scaling
- Increases costs

### VPA Configuration

✅ **Use "Auto" mode for stateless services**
- Backend API, AI Agent, MCP Servers
- Allows automatic optimization

✅ **Use "Off" mode for stateful services**
- PostgreSQL, Redis
- Requires manual review (restarts are disruptive)

❌ **Don't use VPA and HPA on the same metric**
- Use VPA for requests/limits optimization
- Use HPA for replica scaling

### Load Testing

✅ **Test regularly** (weekly, after changes)
- Validates scaling behavior
- Catches regressions early

✅ **Test different patterns** (ramp, spike, stress)
- Each reveals different issues
- Comprehensive validation

✅ **Monitor during tests**
- Watch Grafana dashboards
- Check pod logs
- Verify error rates

---

## 🎯 Success Metrics

After deployment, you should see:

✅ **All HPAs active** (4 HPAs showing current/target metrics)  
✅ **Scaling works** (pods increase under load, decrease when idle)  
✅ **Scaling latency <2 minutes** (99th percentile)  
✅ **Error rate <1%** (during scaling events)  
✅ **P95 latency <500ms** (under 100 concurrent users)  
✅ **PDBs enforced** (min availability maintained during disruptions)  

---

## 📚 Resources

- [Kubernetes HPA Documentation](https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/)
- [Kubernetes VPA Documentation](https://github.com/kubernetes/autoscaler/tree/master/vertical-pod-autoscaler)
- [k6 Load Testing Guide](https://k6.io/docs/)
- [Prometheus Adapter](https://github.com/kubernetes-sigs/prometheus-adapter)
- [Pod Disruption Budgets](https://kubernetes.io/docs/concepts/workloads/pods/disruptions/)

---

**TerraFusion OS Auto-Scaling - Handle 10x traffic spikes automatically! 🚀**
