# TerraFusion OS — Dashboard Reference

> **Classification:** Government Operations  
> **Compliance:** FISMA-HIGH  
> **Source of Truth:** `backend/k8s/grafana-dashboards-configmap.yaml`  
> **Last Updated:** Phase 7 — Production Cutover Safety

---

## 1. Dashboard Inventory

All dashboards are provisioned as JSON via the `grafana-dashboards` ConfigMap in the `monitoring` namespace. Grafana auto-imports them on startup.

| # | Dashboard | File Key | Tags |
|---|-----------|----------|------|
| 1 | TerraFusion OS — System Overview | `terrafusion-overview.json` | `terrafusion`, `overview`, `government` |
| 2 | TerraFusion API — Service Metrics | `terrafusion-api.json` | `terrafusion`, `api`, `backend` |
| 3 | TerraFusion Consciousness — AI Agent Monitoring | `terrafusion-consciousness.json` | `terrafusion`, `ai`, `consciousness`, `agents` |
| 4 | TerraFusion Gateway — Routing & Traffic | `terrafusion-gateway.json` | `terrafusion`, `gateway`, `routing` |
| 5 | TerraFusion Operations — County Data Processing | `terrafusion-operations.json` | `terrafusion`, `operations`, `county-data` |
| 6 | Kubernetes Cluster — TerraFusion Infrastructure | `kubernetes-cluster.json` | `kubernetes`, `infrastructure`, `cluster` |

---

## 2. Dashboard → SLO Mapping

| Dashboard | SLO Coverage |
|-----------|-------------|
| System Overview | SLO-001 (availability), SLO-002/003 (latency), SLO-004 (error rate) |
| API Service Metrics | SLO-001, SLO-002, SLO-003, SLO-004 — deep drill-down |
| Consciousness | SLO-007 (AI availability), agent count, quantum factor |
| Gateway | SLO-005 (gateway availability), SLO-006 (gateway latency) |
| Operations | County data processing rate, Harris PACS sync status |
| Kubernetes Cluster | Infrastructure resource utilisation, pod restarts, PV usage |

---

## 3. Panel Highlights

### 3.1 System Overview

| Panel | Type | Metric |
|-------|------|--------|
| System Health | stat | `count(up{namespace="terrafusion"} == 1)` |
| AI Agent Count | stat | `terrafusion_ai_agent_count` |
| Quantum Factor | gauge | `terrafusion_ai_quantum_factor` (target: 949) |
| Request Rate (All Services) | graph | `rate(http_requests_total[5m]) by (job)` |
| Error Rate (All Services) | graph | `rate(http_requests_total{status=~"5.."}[5m]) by (job)` |
| Response Time P95 | graph | `histogram_quantile(0.95, ...)` by job |

### 3.2 API Service Metrics

| Panel | Type | Metric |
|-------|------|--------|
| Request Rate by Endpoint | graph | `rate(http_requests_total{job="terrafusion-api"}[5m]) by (endpoint)` |
| Success Rate | stat | `(2xx rate / total rate) * 100` |
| Response Time Distribution | heatmap | `http_request_duration_seconds_bucket` |
| Response Time Percentiles | graph | P50, P95, P99 |
| Error Breakdown by Status | piechart | `status=~"[45].."` by status |

### 3.3 Consciousness (AI)

| Panel | Type | Metric |
|-------|------|--------|
| AI Agent Count | graph | Target: 50 000 |
| Quantum Optimization Factor | graph | Target: 949 |
| Agent Utilization % | gauge | active / total × 100 |
| ML Model Cache Hit Rate | stat | hits / requests × 100 |
| AI Processing Latency P95 | graph | `ai_processing_duration_seconds` |
| IAAO Compliance Score | gauge | `iaao_compliance_score × 100` |

### 3.4 Gateway

| Panel | Type | Metric |
|-------|------|--------|
| Gateway Request Rate by Route | graph | by route |
| Rate Limiting | stat | `rate_limit_exceeded_total` |
| Backend Service Distribution | piechart | by backend |
| Gateway Latency (P50/P95/P99) | graph | `gateway_request_duration_seconds` |

### 3.5 Operations

| Panel | Type | Metric |
|-------|------|--------|
| County Data Processing Rate | graph | by county |
| Active Counties | stat | distinct county labels |
| Harris PACS Sync Status | stat | `harris_pacs_sync_success` |
| Property Assessment Volume | graph | by assessment type |

### 3.6 Kubernetes Cluster

| Panel | Type | Metric |
|-------|------|--------|
| Node CPU Usage | graph | `node_cpu_seconds_total` |
| Node Memory Usage | graph | `node_memory_*` |
| Pod Count by Namespace | graph | `kube_pod_info` |
| Pod Restarts (1 h) | stat | `kube_pod_container_status_restarts_total` |
| Persistent Volume Usage | graph | `kubelet_volume_stats_*` |

---

## 4. Access

```
Grafana URL:  http://grafana.monitoring.svc:3000
Namespace:    monitoring
Credentials:  See sealed secret grafana-admin in monitoring namespace
```

---

*Government. Transcended. Visualised.*
