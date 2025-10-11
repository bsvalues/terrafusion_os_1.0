# TerraFusion OS - Observability Stack

**Complete observability solution with Prometheus, Grafana, Loki, and Jaeger**

---

## 📊 Overview

This observability stack provides comprehensive monitoring, logging, and tracing for TerraFusion OS, enabling:

- **Metrics Collection** (Prometheus) - Time-series data from all services
- **Visualization** (Grafana) - Beautiful dashboards and alerts
- **Log Aggregation** (Loki) - Centralized logging with powerful queries
- **Distributed Tracing** (Jaeger) - Request flow across microservices

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    TerraFusion Services                      │
│  (Backend API, AI Agent, MCP Servers, PostgreSQL, Redis)    │
└───────────────┬─────────────┬──────────────┬────────────────┘
                │             │              │
        ┌───────▼──────┐ ┌───▼────┐   ┌────▼─────┐
        │  Prometheus  │ │  Loki  │   │  Jaeger  │
        │  (Metrics)   │ │ (Logs) │   │ (Traces) │
        └───────┬──────┘ └───┬────┘   └────┬─────┘
                │             │              │
                └─────────────┼──────────────┘
                              │
                        ┌─────▼──────┐
                        │  Grafana   │
                        │ (Visualize)│
                        └────────────┘
```

### Components

| Component | Purpose | Port | Storage |
|-----------|---------|------|---------|
| **Prometheus** | Metrics collection & alerting | 9090 | 50GB (30 days) |
| **Grafana** | Dashboard & visualization | 3000 | 10GB |
| **Loki** | Log aggregation | 3100 | 20GB (30 days) |
| **Promtail** | Log collection agent | - | - |
| **Jaeger** | Distributed tracing | 16686 | Memory |
| **AlertManager** | Alert routing | 9093 | 5GB |

---

## 🚀 Installation

### Prerequisites

- **Kubernetes cluster** (v1.23+)
- **kubectl** configured with cluster access
- **Helm 3** installed
- **Storage class** available for PersistentVolumes

### Quick Install

```powershell
# Run the automated installation script
.\install-observability.ps1

# This will:
# 1. Create observability namespace
# 2. Install kube-prometheus-stack (Prometheus + Grafana + AlertManager)
# 3. Install Loki stack (Loki + Promtail)
# 4. Install Jaeger (distributed tracing)
# 5. Apply ServiceMonitors (metric collection)
# 6. Import Grafana dashboards
# 7. Configure alerting rules
```

### Manual Installation

<details>
<summary>Click to expand manual installation steps</summary>

#### Step 1: Create Namespace

```bash
kubectl create namespace observability
kubectl label namespace observability istio-injection=enabled
```

#### Step 2: Add Helm Repositories

```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add grafana https://grafana.github.io/helm-charts
helm repo add jaegertracing https://jaegertracing.github.io/helm-charts
helm repo update
```

#### Step 3: Install Prometheus Stack

```bash
helm upgrade --install prometheus prometheus-community/kube-prometheus-stack \
  --namespace observability \
  --set prometheus.prometheusSpec.retention=30d \
  --set prometheus.prometheusSpec.storageSpec.volumeClaimTemplate.spec.resources.requests.storage=50Gi \
  --set prometheus.prometheusSpec.serviceMonitorSelectorNilUsesHelmValues=false \
  --set prometheus.prometheusSpec.podMonitorSelectorNilUsesHelmValues=false \
  --set grafana.enabled=true \
  --set grafana.adminPassword=admin \
  --set grafana.persistence.enabled=true \
  --set grafana.persistence.size=10Gi \
  --set alertmanager.enabled=true \
  --set alertmanager.persistence.size=5Gi
```

#### Step 4: Install Loki Stack

```bash
helm upgrade --install loki grafana/loki-stack \
  --namespace observability \
  --set loki.persistence.enabled=true \
  --set loki.persistence.size=20Gi \
  --set promtail.enabled=true \
  --set loki.config.chunk_store_config.max_look_back_period=720h
```

#### Step 5: Install Jaeger

```bash
helm upgrade --install jaeger jaegertracing/jaeger \
  --namespace observability \
  --set allInOne.enabled=true \
  --set storage.type=memory \
  --set allInOne.extraEnv[0].name=COLLECTOR_ZIPKIN_HOST_PORT \
  --set allInOne.extraEnv[0].value=:9411
```

#### Step 6: Apply Monitoring Configurations

```bash
# ServiceMonitors (tell Prometheus what to scrape)
kubectl apply -f prometheus/servicemonitors.yaml

# Alerting rules (define alert conditions)
kubectl apply -f prometheus/alerting-rules.yaml

# Grafana dashboards (import visualizations)
kubectl apply -f grafana/dashboards.yaml
```

</details>

---

## 📈 Accessing Dashboards

### Port Forwarding (Development)

```powershell
# Grafana (dashboards)
kubectl port-forward -n observability svc/prometheus-grafana 3000:80

# Prometheus (metrics query)
kubectl port-forward -n observability svc/prometheus-kube-prometheus-prometheus 9090:9090

# Jaeger (traces)
kubectl port-forward -n observability svc/jaeger-query 16686:16686

# AlertManager (alerts)
kubectl port-forward -n observability svc/prometheus-kube-prometheus-alertmanager 9093:9093
```

### URLs

- **Grafana**: http://localhost:3000 (admin/admin)
- **Prometheus**: http://localhost:9090
- **Jaeger**: http://localhost:16686
- **AlertManager**: http://localhost:9093

### Production Ingress

<details>
<summary>Click to expand production ingress configuration</summary>

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: observability-ingress
  namespace: observability
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
spec:
  ingressClassName: nginx
  tls:
    - hosts:
        - grafana.terrafusion.example.com
        - prometheus.terrafusion.example.com
        - jaeger.terrafusion.example.com
      secretName: observability-tls
  rules:
    - host: grafana.terrafusion.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: prometheus-grafana
                port:
                  number: 80
    - host: prometheus.terrafusion.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: prometheus-kube-prometheus-prometheus
                port:
                  number: 9090
    - host: jaeger.terrafusion.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: jaeger-query
                port:
                  number: 16686
```

</details>

---

## 📊 Grafana Dashboards

### Included Dashboards (10)

1. **TerraFusion System Overview** - High-level system health
   - Overall request rate
   - Error rate
   - P95 latency
   - Service health status

2. **Backend API Dashboard** - ASP.NET Core API metrics
   - Request rate by endpoint
   - Error rate by status code
   - Response time percentiles (P50, P95, P99)
   - Database connection pool

3. **AI Agent Dashboard** - AI service metrics
   - AI request rate
   - Processing time
   - Model inference count by model
   - Queue depth

4. **PostgreSQL Dashboard** - Database metrics
   - Active connections vs max
   - Query performance
   - Cache hit ratio
   - Database size

5. **Redis Dashboard** - Cache metrics
   - Operations per second
   - Cache hit ratio
   - Memory usage
   - Connected clients

6. **Kong API Gateway Dashboard** - API gateway metrics
   - Request rate by service
   - Status codes
   - Latency distribution (P50, P95)
   - Plugin activity

7. **Istio Service Mesh Dashboard** - Service mesh metrics
   - Request volume by service
   - Success rate by service
   - mTLS connection status
   - Circuit breaker status

8. **Kubernetes Cluster Dashboard** - Cluster metrics
   - Node CPU usage
   - Node memory usage
   - Pod count by namespace
   - Pod status

9. **Network Traffic Dashboard** - Network metrics
   - Network throughput (ingress/egress)
   - Packets per second
   - Network errors
   - Active connections

10. **MCP Servers Dashboard** - MCP protocol metrics
    - MCP request rate by server
    - Protocol errors
    - Active connections
    - Message queue depth

### Importing Additional Dashboards

```bash
# Import dashboard from Grafana.com
curl -X POST http://localhost:3000/api/dashboards/import \
  -H "Content-Type: application/json" \
  -u admin:admin \
  -d '{"dashboard": {...}, "overwrite": true}'
```

---

## 🔔 Alerting

### Alert Groups

1. **System Alerts**
   - `HighErrorRate` - Error rate >5% for 5 minutes
   - `HighLatency` - P95 latency >1s for 10 minutes
   - `ServiceDown` - Service unreachable for 2 minutes

2. **Resource Alerts**
   - `HighCPUUsage` - CPU >90% for 10 minutes
   - `HighMemoryUsage` - Memory >90% for 10 minutes
   - `PodRestartingFrequently` - Pod restarts >0/15min

3. **Database Alerts**
   - `PostgreSQLDown` - Database unreachable for 2 minutes
   - `HighDatabaseConnections` - Connections >80% for 5 minutes
   - `SlowDatabaseQueries` - Query time >1s for 10 minutes

4. **Cache Alerts**
   - `RedisDown` - Redis unreachable for 2 minutes
   - `HighRedisMemoryUsage` - Memory >90% for 5 minutes
   - `RedisRejectedConnections` - Connections rejected

5. **Gateway Alerts**
   - `KongHighErrorRate` - Kong error rate >5% for 5 minutes
   - `KongHighLatency` - Kong P95 latency >1000ms for 10 minutes

6. **Service Mesh Alerts**
   - `IstioHighErrorRate` - Service error rate >5% for 5 minutes
   - `IstioCertificateExpiringSoon` - Certificate expires in <7 days

7. **Storage Alerts**
   - `PersistentVolumeAlmostFull` - Volume >90% for 10 minutes
   - `PersistentVolumeFull` - Volume >95% for 5 minutes

### Alert Routing

Alerts are sent to AlertManager, which routes them based on severity:

- **Critical** → PagerDuty, Slack #alerts
- **Warning** → Slack #monitoring
- **Info** → Email

Configure routing in AlertManager:

```yaml
route:
  group_by: ['alertname', 'cluster', 'service']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 12h
  receiver: 'default'
  routes:
    - match:
        severity: critical
      receiver: pagerduty
    - match:
        severity: warning
      receiver: slack
```

---

## 🔍 Querying

### Prometheus Queries (PromQL)

#### Request Rate
```promql
# Total request rate
sum(rate(http_requests_total[5m]))

# Request rate by service
sum(rate(http_requests_total[5m])) by (service)

# Error rate
sum(rate(http_requests_total{status=~"5.."}[5m])) 
/ 
sum(rate(http_requests_total[5m])) * 100
```

#### Latency
```promql
# P95 latency
histogram_quantile(0.95, 
  sum(rate(http_request_duration_seconds_bucket[5m])) by (le)
)

# Average latency by endpoint
avg(http_request_duration_seconds) by (endpoint)
```

#### Resource Usage
```promql
# CPU usage by pod
sum(rate(container_cpu_usage_seconds_total[5m])) by (pod)

# Memory usage by pod
container_memory_working_set_bytes{namespace="terrafusion-prod"}
```

### Loki Queries (LogQL)

#### Log Search
```logql
# All logs from backend-api
{app="backend-api"}

# Error logs
{app="backend-api"} |= "ERROR"

# Logs with specific status code
{app="backend-api"} | json | status_code="500"

# Log rate
sum(rate({namespace="terrafusion-prod"}[5m])) by (app)
```

#### Aggregation
```logql
# Count errors per minute
sum by (app) (count_over_time({namespace="terrafusion-prod"} |= "ERROR" [1m]))

# Top 10 log producers
topk(10, sum by (app) (rate({namespace="terrafusion-prod"}[5m])))
```

---

## 🔬 Distributed Tracing

### Jaeger Integration

Istio automatically sends traces to Jaeger on port 9411 (Zipkin protocol).

#### Viewing Traces

1. Open Jaeger UI: http://localhost:16686
2. Select service (e.g., `backend-api.terrafusion-prod`)
3. Search traces by:
   - Time range
   - Duration (min/max)
   - Tags (e.g., `http.status_code=500`)
   - Limit (number of traces)

#### Trace Analysis

- **Service dependency graph** - Visualize service interactions
- **Trace timeline** - See request flow across services
- **Span details** - View individual operation metadata
- **Error traces** - Find failed requests

---

## 📦 Service Monitors

### Configured Monitors (8)

| Monitor | Target | Namespace | Interval | Port |
|---------|--------|-----------|----------|------|
| `backend-api-monitor` | Backend API | terrafusion-prod | 15s | http |
| `ai-agent-monitor` | AI Agent | terrafusion-prod | 15s | http |
| `mcp-servers-monitor` | MCP Servers | terrafusion-prod | 15s | http |
| `postgres-monitor` | PostgreSQL | terrafusion-prod | 30s | metrics |
| `redis-monitor` | Redis | terrafusion-prod | 30s | metrics |
| `kong-monitor` | Kong Gateway | kong | 15s | admin |
| `istio-envoy-monitor` | Envoy Sidecars | all | 15s | envoy-prom |
| `istio-control-plane-monitor` | istiod | istio-system | 15s | http-monitoring |

### Adding New ServiceMonitors

```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: my-service-monitor
  namespace: observability
spec:
  selector:
    matchLabels:
      app: my-app
  namespaceSelector:
    matchNames:
      - terrafusion-prod
  endpoints:
    - port: http
      path: /metrics
      interval: 15s
```

---

## 🛠️ Troubleshooting

### Prometheus Not Scraping

```bash
# Check ServiceMonitor status
kubectl get servicemonitors -n observability

# Check Prometheus targets
kubectl port-forward -n observability svc/prometheus-kube-prometheus-prometheus 9090:9090
# Visit: http://localhost:9090/targets

# Check service labels match ServiceMonitor selector
kubectl get svc -n terrafusion-prod --show-labels
```

### Grafana Dashboard Empty

```bash
# Verify Prometheus data source
# Grafana > Configuration > Data Sources > Prometheus

# Test query in Prometheus
# http://localhost:9090/graph
# Query: up

# Check metric names
# Prometheus > Status > Targets > Endpoint
```

### Loki Logs Not Showing

```bash
# Check Promtail is running
kubectl get pods -n observability -l app=promtail

# Check Promtail logs
kubectl logs -n observability -l app=promtail --tail=50

# Verify Loki data source in Grafana
# Grafana > Configuration > Data Sources > Loki
# Test with query: {namespace="terrafusion-prod"}
```

### Jaeger No Traces

```bash
# Check Istio tracing enabled
kubectl get cm istio -n istio-system -o yaml | grep -i tracing

# Verify Jaeger Zipkin port
kubectl get svc -n observability jaeger-collector
# Should show port 9411

# Check trace sampling rate (100% for testing)
kubectl get cm istio -n istio-system -o yaml | grep -i sampling
```

### High Resource Usage

```bash
# Check Prometheus storage
kubectl exec -n observability prometheus-prometheus-kube-prometheus-prometheus-0 -- df -h

# Reduce retention period (edit PrometheusSpec)
kubectl edit prometheus -n observability prometheus-kube-prometheus-prometheus

# Reduce scrape frequency (edit ServiceMonitors)
kubectl edit servicemonitor -n observability backend-api-monitor
```

---

## 📊 Metrics Reference

### Application Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `http_requests_total` | Counter | Total HTTP requests |
| `http_request_duration_seconds` | Histogram | Request latency |
| `http_requests_in_progress` | Gauge | Concurrent requests |
| `database_connections_active` | Gauge | Active DB connections |
| `cache_hit_ratio` | Gauge | Cache hit percentage |

### Infrastructure Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `container_cpu_usage_seconds_total` | Counter | CPU usage |
| `container_memory_working_set_bytes` | Gauge | Memory usage |
| `kube_pod_status_phase` | Gauge | Pod phase (Running, Pending, etc.) |
| `kube_pod_container_status_restarts_total` | Counter | Container restarts |

### Istio Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `istio_requests_total` | Counter | Total requests through mesh |
| `istio_request_duration_milliseconds` | Distribution | Request latency |
| `istio_tcp_connections_opened_total` | Counter | TCP connections |
| `envoy_cluster_circuit_breakers_default_cx_open` | Gauge | Open circuit breakers |

---

## 🔐 Security

### Authentication

- **Grafana**: admin/admin (change in production!)
- **Prometheus**: No auth (use NetworkPolicy/Ingress auth)
- **Jaeger**: No auth (use NetworkPolicy/Ingress auth)

### Production Recommendations

1. **Change default passwords**
   ```bash
   kubectl create secret generic grafana-admin \
     --from-literal=admin-user=admin \
     --from-literal=admin-password='StrongPassword123!' \
     -n observability
   ```

2. **Enable HTTPS** (use cert-manager + Let's Encrypt)

3. **Network policies** (restrict access to observability namespace)
   ```yaml
   apiVersion: networking.k8s.io/v1
   kind: NetworkPolicy
   metadata:
     name: observability-network-policy
     namespace: observability
   spec:
     podSelector: {}
     policyTypes:
       - Ingress
     ingress:
       - from:
           - namespaceSelector:
               matchLabels:
                 name: terrafusion-prod
   ```

4. **RBAC** (limit Prometheus ServiceAccount permissions)

---

## 📖 Best Practices

### Metrics

- ✅ Use **counters** for cumulative values (requests, errors)
- ✅ Use **gauges** for current values (temperature, queue depth)
- ✅ Use **histograms** for distributions (latency, size)
- ✅ Include **labels** for dimensions (service, endpoint, status)
- ❌ Don't use high-cardinality labels (user_id, request_id)

### Dashboards

- ✅ Start with **overview dashboard** (system health)
- ✅ Create **service-specific dashboards** (deep dive)
- ✅ Use **templating** for dynamic service selection
- ✅ Include **SLI/SLO panels** (availability, latency, errors)
- ❌ Don't overload dashboards (max 12 panels)

### Alerts

- ✅ Alert on **symptoms** (high error rate, slow response)
- ✅ Use **multi-window** alerts (5m + 1h for trends)
- ✅ Include **runbook links** in annotations
- ✅ Set appropriate **severity levels**
- ❌ Don't alert on everything (alert fatigue)

### Retention

- **Prometheus**: 30 days (configurable, balance cost vs history)
- **Loki**: 30 days (logs are bulkier, adjust as needed)
- **Jaeger**: Memory (ephemeral, use Elasticsearch for production)

---

## 📚 Resources

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Loki Documentation](https://grafana.com/docs/loki/)
- [Jaeger Documentation](https://www.jaegertracing.io/docs/)
- [kube-prometheus-stack](https://github.com/prometheus-community/helm-charts/tree/main/charts/kube-prometheus-stack)
- [PromQL Cheat Sheet](https://promlabs.com/promql-cheat-sheet/)
- [LogQL Cheat Sheet](https://megamorf.gitlab.io/cheat-sheets/loki/)

---

## 🎯 Success Metrics

After deployment, you should see:

✅ **All ServiceMonitors active** (8/8 targets up in Prometheus)  
✅ **Grafana dashboards populated** (10 dashboards with live data)  
✅ **Alerts configured** (7 alert groups, 20+ rules)  
✅ **Loki receiving logs** (all terrafusion-prod pods)  
✅ **Jaeger capturing traces** (request flows visible)  
✅ **Storage provisioned** (50GB Prometheus, 20GB Loki, 10GB Grafana)  

---

**TerraFusion OS Observability Stack - Complete visibility into your distributed system! 🚀**
