# TerraFusion OS - Monitoring & Observability Guide
**Government. Transcended. - Championship-Level Observability Excellence**

> *Complete guide to TerraFusion OS monitoring infrastructure covering metrics, logs, traces, dashboards, and alerting.*

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Prometheus Metrics](#prometheus-metrics)
4. [Grafana Dashboards](#grafana-dashboards)
5. [Distributed Tracing (Jaeger)](#distributed-tracing-jaeger)
6. [Log Aggregation (Loki)](#log-aggregation-loki)
7. [Alerting & Notifications](#alerting--notifications)
8. [Query Reference](#query-reference)
9. [Troubleshooting](#troubleshooting)
10. [Best Practices](#best-practices)

---

## Overview

### Monitoring Stack Components

TerraFusion OS implements a **world-class observability stack** meeting FISMA-High compliance requirements:

| Component | Purpose | Version | Port | Storage |
|-----------|---------|---------|------|---------|
| **Prometheus** | Metrics collection & alerting | 2.48.0 | 9090 | 50GB, 15-day retention |
| **Grafana** | Visualization & dashboards | 10.2.0 | 3000 | 10GB |
| **Jaeger** | Distributed tracing | 1.51.0 | 16686 | 30GB, 7-day retention |
| **Loki** | Log aggregation | 2.9.0 | 3100 | 20GB, 7-day retention |
| **Promtail** | Log collection (DaemonSet) | 2.9.0 | 9080 | N/A |
| **Alertmanager** | Alert routing & notifications | 0.26.0 | 9093 | N/A |

### Key Features

- **🎯 99.99% Uptime Monitoring**: Real-time health checks across all services
- **🤖 50,000 AI Agent Tracking**: Consciousness Engine performance metrics
- **⚡ Quantum Factor Optimization**: Track quantum optimization factor (target: 949)
- **🏛️ FISMA-High Compliance**: Government-grade audit logging and data isolation
- **🔍 Request Flow Analysis**: End-to-end distributed tracing
- **📊 Pre-configured Dashboards**: 6 championship-level dashboards
- **🚨 23 Alerting Rules**: Proactive issue detection and notification

---

## Architecture

### Monitoring Infrastructure Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     TerraFusion OS Services                      │
│  ┌──────────┐  ┌──────────────┐  ┌─────────┐  ┌─────────────┐ │
│  │   API    │  │ Consciousness│  │ Gateway │  │ Operations  │ │
│  │ (port    │  │   (50,000    │  │ (port   │  │   (port     │ │
│  │  5000)   │  │   AI agents) │  │  3002)  │  │   5003)     │ │
│  └────┬─────┘  └──────┬───────┘  └────┬────┘  └──────┬──────┘ │
│       │ Metrics       │ Metrics        │ Metrics      │ Metrics│
│       │ Traces        │ Traces         │ Traces       │ Traces │
│       │ Logs          │ Logs           │ Logs         │ Logs   │
└───────┼───────────────┼────────────────┼──────────────┼────────┘
        │               │                │              │
        ▼               ▼                ▼              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Observability Stack (Namespace: monitoring)    │
│                                                                   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────────┐│
│  │   Prometheus    │  │     Jaeger      │  │  Loki + Promtail ││
│  │  (Metrics DB)   │  │  (Trace Store)  │  │    (Log Store)   ││
│  │                 │  │                 │  │                  ││
│  │ • 15s scrape    │  │ • Sampling      │  │ • JSON parsing   ││
│  │ • 15d retention │  │ • 7d retention  │  │ • 7d retention   ││
│  │ • 23 alerts     │  │ • Trace-to-log  │  │ • Label extract  ││
│  └────────┬────────┘  └────────┬────────┘  └────────┬─────────┘│
│           │                    │                     │          │
│           └────────────────────┼─────────────────────┘          │
│                                │                                │
│                       ┌────────▼────────┐                       │
│                       │     Grafana     │                       │
│                       │  (Visualization)│                       │
│                       │                 │                       │
│                       │ • 6 dashboards  │                       │
│                       │ • 3 datasources │                       │
│                       │ • Azure AD SSO  │                       │
│                       └─────────────────┘                       │
│                                                                   │
│                       ┌─────────────────┐                       │
│                       │  Alertmanager   │                       │
│                       │  (Notifications)│                       │
│                       │                 │                       │
│                       │ • Slack         │                       │
│                       │ • PagerDuty     │                       │
│                       │ • Email         │                       │
│                       └─────────────────┘                       │
└───────────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Metrics**: Services expose `/metrics` endpoint → Prometheus scrapes → Grafana visualizes
2. **Traces**: OpenTelemetry SDK → Jaeger Collector → Elasticsearch → Jaeger Query UI
3. **Logs**: Services write JSON logs → Promtail collects → Loki stores → Grafana queries
4. **Alerts**: Prometheus evaluates rules → Alertmanager routes → Slack/PagerDuty/Email

---

## Prometheus Metrics

### Deployment Details

**Configuration File**: `backend/k8s/prometheus-config.yaml`

```yaml
# Key settings
scrape_interval: 15s      # Global scrape frequency
scrape_timeout: 10s
evaluation_interval: 15s  # Alert rule evaluation
retention: 15d            # Data retention period
storage: 50GB             # TSDB storage capacity
```

### Scrape Jobs (8 total)

| Job Name | Target | Interval | Description |
|----------|--------|----------|-------------|
| `prometheus` | localhost:9090 | 15s | Prometheus self-monitoring |
| `terrafusion-api` | API pods | 10s | API service metrics |
| `terrafusion-consciousness` | Consciousness pods | 10s | AI agent metrics (50,000 agents) |
| `terrafusion-gateway` | Gateway pods | 10s | Routing & rate limiting metrics |
| `terrafusion-operations` | Operations pods | 10s | County data processing metrics |
| `kubernetes-apiservers` | K8s API | 15s | Kubernetes API server metrics |
| `kubernetes-nodes` | K8s nodes | 15s | Node-level cAdvisor metrics |
| `kubernetes-pods` | Annotated pods | 15s | Pod discovery via annotations |

### Core Metrics Catalog

#### API Service Metrics

```promql
# Request rate (requests per second)
rate(http_requests_total{job="terrafusion-api"}[5m])

# Error rate (errors per second)
rate(http_requests_total{job="terrafusion-api",status=~"5.."}[5m])

# Response time P50/P95/P99
histogram_quantile(0.50, rate(http_request_duration_seconds_bucket{job="terrafusion-api"}[5m]))
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket{job="terrafusion-api"}[5m]))
histogram_quantile(0.99, rate(http_request_duration_seconds_bucket{job="terrafusion-api"}[5m]))

# Success rate percentage
(sum(rate(http_requests_total{job="terrafusion-api",status=~"2.."}[5m])) 
 / sum(rate(http_requests_total{job="terrafusion-api"}[5m]))) * 100
```

#### Consciousness (AI Engine) Metrics

```promql
# AI agent count (target: 50,000)
terrafusion_ai_agent_count{job="terrafusion-consciousness"}

# Active agents (currently processing)
terrafusion_ai_active_agents{job="terrafusion-consciousness"}

# Agent utilization percentage
(terrafusion_ai_active_agents / terrafusion_ai_agent_count) * 100

# Quantum optimization factor (target: 949)
terrafusion_ai_quantum_factor{job="terrafusion-consciousness"}

# ML model cache hit rate
(sum(rate(ml_cache_hits_total{job="terrafusion-consciousness"}[5m])) 
 / sum(rate(ml_cache_requests_total{job="terrafusion-consciousness"}[5m]))) * 100

# AI processing latency P95
histogram_quantile(0.95, rate(ai_processing_duration_seconds_bucket{job="terrafusion-consciousness"}[5m]))

# AI task rate by type
sum(rate(ai_tasks_total{job="terrafusion-consciousness"}[5m])) by (task_type)

# IAAO compliance score (target: >99.5%)
iaao_compliance_score{job="terrafusion-consciousness"} * 100
```

#### Gateway Metrics

```promql
# Gateway request rate
sum(rate(http_requests_total{job="terrafusion-gateway"}[5m])) by (route)

# Rate limiting (exceeded requests)
sum(rate(rate_limit_exceeded_total{job="terrafusion-gateway"}[5m]))

# Backend service distribution
sum(rate(gateway_backend_requests_total{job="terrafusion-gateway"}[5m])) by (backend)

# Gateway latency percentiles
histogram_quantile(0.95, rate(gateway_request_duration_seconds_bucket{job="terrafusion-gateway"}[5m]))
```

#### Operations Service Metrics

```promql
# County data processing rate
sum(rate(county_data_processed_total{job="terrafusion-operations"}[5m])) by (county)

# Harris PACS sync status (1 = success, 0 = failure)
harris_pacs_sync_success{job="terrafusion-operations"}

# Property assessment volume
sum(rate(property_assessments_total{job="terrafusion-operations"}[5m])) by (assessment_type)

# Active counties
count(count(county_data_processed_total{job="terrafusion-operations"}) by (county))
```

#### Kubernetes Infrastructure Metrics

```promql
# Node CPU usage
sum(rate(node_cpu_seconds_total{mode!="idle"}[5m])) by (instance)

# Node memory usage
(node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes

# Pod count by namespace
sum(kube_pod_info) by (namespace)

# Pod restarts (last 1 hour)
sum(increase(kube_pod_container_status_restarts_total{namespace="terrafusion"}[1h]))

# Persistent volume usage
(kubelet_volume_stats_used_bytes / kubelet_volume_stats_capacity_bytes) * 100
```

### Recording Rules (Pre-aggregated Metrics)

**Configuration File**: `backend/k8s/prometheus-rules.yaml`

Recording rules pre-compute expensive queries for faster dashboard loading:

```yaml
# API request rate (5m average)
- record: terrafusion_api:http_requests:rate5m
  expr: rate(http_requests_total{job="terrafusion-api"}[5m])

# API error rate (5m average)
- record: terrafusion_api:http_errors:rate5m
  expr: rate(http_requests_total{job="terrafusion-api",status=~"5.."}[5m])

# API response time percentiles
- record: terrafusion_api:http_request_duration:p50
  expr: histogram_quantile(0.50, rate(http_request_duration_seconds_bucket{job="terrafusion-api"}[5m]))

- record: terrafusion_api:http_request_duration:p95
  expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket{job="terrafusion-api"}[5m]))

# AI agent utilization
- record: terrafusion_consciousness:ai_agents:utilization
  expr: (terrafusion_ai_active_agents / terrafusion_ai_agent_count) * 100
```

---

## Grafana Dashboards

### Access Grafana

**URL**: https://grafana.terrafusion.gov (or `http://localhost:3000` via port-forward)

**Port-forward command**:
```bash
kubectl port-forward -n monitoring svc/grafana 3000:3000
```

**Default credentials**:
- Username: `admin`
- Password: (from secret `grafana-secrets`)

**Azure AD SSO**: Configured for production authentication

### Pre-configured Dashboards (6 total)

#### Dashboard 1: TerraFusion OS - System Overview

**Location**: Dashboards → Browse → TerraFusion OS → System Overview

**Panels**:
- 🏛️ **System Health**: Count of healthy services
- 🤖 **AI Agent Count**: Real-time agent count (target: 50,000)
- ⚡ **Quantum Factor**: Gauge showing quantum optimization (target: 949)
- 📊 **Request Rate**: Time-series graph of all service requests
- 🔥 **Error Rate**: Time-series graph of service errors
- ⏱️ **Response Time P95**: Latency across all services

**Use Case**: Executive-level health check, system-wide performance overview

#### Dashboard 2: TerraFusion API - Service Metrics

**Panels**:
- 📈 **Request Rate by Endpoint**: Which API endpoints are most used?
- 🎯 **Success Rate**: Percentage of successful requests (target: >99%)
- ⚡ **Response Time Distribution**: Heatmap of latency distribution
- 📊 **Response Time Percentiles**: P50/P95/P99 time-series
- 🔥 **Error Breakdown**: Pie chart of error types (4xx vs 5xx)

**Use Case**: API performance tuning, endpoint optimization, SLA validation

**Key Queries**:
```promql
# Request rate by endpoint
sum(rate(http_requests_total{job="terrafusion-api"}[5m])) by (endpoint)

# Success rate percentage
(sum(rate(http_requests_total{job="terrafusion-api",status=~"2.."}[5m])) 
 / sum(rate(http_requests_total{job="terrafusion-api"}[5m]))) * 100

# P95 latency
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket{job="terrafusion-api"}[5m]))
```

#### Dashboard 3: TerraFusion Consciousness - AI Agent Monitoring

**Panels**:
- 🤖 **AI Agent Count**: Time-series graph (target: 50,000)
- ⚡ **Quantum Optimization Factor**: Time-series graph (target: 949)
- 🎯 **AI Agent Utilization**: Gauge showing percentage of active agents
- 🧠 **ML Model Cache Hit Rate**: Stat panel (target: >95%)
- 📊 **AI Processing Latency**: P95 latency for AI tasks
- 🔬 **AI Agent Tasks by Type**: Graph showing task distribution
- 🏆 **IAAO Compliance Score**: Gauge (target: >99.5%)

**Use Case**: AI performance monitoring, quantum optimization tracking, IAAO validation

**Key Queries**:
```promql
# AI agent count
terrafusion_ai_agent_count{job="terrafusion-consciousness"}

# Quantum factor
terrafusion_ai_quantum_factor{job="terrafusion-consciousness"}

# Agent utilization
(terrafusion_ai_active_agents / terrafusion_ai_agent_count) * 100

# ML cache hit rate
(sum(rate(ml_cache_hits_total[5m])) / sum(rate(ml_cache_requests_total[5m]))) * 100

# IAAO compliance
iaao_compliance_score{job="terrafusion-consciousness"} * 100
```

#### Dashboard 4: TerraFusion Gateway - Routing & Traffic

**Panels**:
- 🌐 **Gateway Request Rate**: Requests by route
- 🚦 **Rate Limiting**: Count of rate-limited requests
- 🔀 **Backend Service Distribution**: Pie chart of backend traffic
- ⏱️ **Gateway Latency**: P50/P95/P99 percentiles

**Use Case**: Load balancing, rate limiting effectiveness, routing optimization

#### Dashboard 5: TerraFusion Operations - County Data Processing

**Panels**:
- 📊 **County Data Processing Rate**: Processing rate by county
- 🏛️ **Active Counties**: Count of active counties
- 🔄 **Harris PACS Sync Status**: Success/failure indicator
- 📈 **Property Assessment Volume**: Assessments by type

**Use Case**: County operations monitoring, Harris PACS integration health, assessment tracking

#### Dashboard 6: Kubernetes Cluster - TerraFusion Infrastructure

**Panels**:
- 🖥️ **Node CPU Usage**: CPU utilization by node
- 💾 **Node Memory Usage**: Memory utilization by node
- 📦 **Pod Count by Namespace**: Pod distribution
- 🔄 **Pod Restarts**: Recent pod restart count
- 💿 **Persistent Volume Usage**: Storage utilization by PVC

**Use Case**: Infrastructure capacity planning, resource optimization, cluster health

### Dashboard Variables

Grafana dashboards support variables for filtering:

- `$namespace`: Filter by Kubernetes namespace (default: `terrafusion`)
- `$service`: Filter by service name (API, Consciousness, Gateway, Operations)
- `$county`: Filter by county (for Operations dashboard)
- `$interval`: Time range for queries (5m, 15m, 1h, 6h, 24h)

### Creating Custom Dashboards

1. **Navigate to**: Dashboards → New Dashboard
2. **Add Panel** → Select visualization type
3. **Configure Query**: Use PromQL, LogQL, or Jaeger query
4. **Set Thresholds**: Define warning/critical thresholds
5. **Save Dashboard**: Assign to "TerraFusion OS" folder

**Example Panel Configuration**:
```json
{
  "targets": [
    {
      "expr": "rate(http_requests_total{job=\"terrafusion-api\"}[5m])",
      "legendFormat": "{{endpoint}}"
    }
  ],
  "type": "graph",
  "yaxes": [{"format": "reqps"}]
}
```

---

## Distributed Tracing (Jaeger)

### Access Jaeger UI

**URL**: https://jaeger.terrafusion.gov (or `http://localhost:16686` via port-forward)

**Port-forward command**:
```bash
kubectl port-forward -n tracing svc/jaeger-query 16686:16686
```

### Trace Architecture

**Components**:
- **Jaeger Agent** (sidecar): Receives spans from services, batches and forwards to Collector
- **Jaeger Collector**: Validates, indexes, and stores spans in Elasticsearch
- **Jaeger Query**: Provides UI and API for trace retrieval
- **Elasticsearch**: Trace storage backend (7-day retention, 30GB)

### Instrumentation (.NET Services)

TerraFusion services use **OpenTelemetry .NET SDK** for automatic instrumentation:

**NuGet Packages**:
```xml
<PackageReference Include="OpenTelemetry" Version="1.6.0" />
<PackageReference Include="OpenTelemetry.Exporter.Jaeger" Version="1.5.1" />
<PackageReference Include="OpenTelemetry.Instrumentation.AspNetCore" Version="1.5.1" />
<PackageReference Include="OpenTelemetry.Instrumentation.Http" Version="1.5.1" />
<PackageReference Include="OpenTelemetry.Instrumentation.EntityFrameworkCore" Version="1.0.0-beta.7" />
```

**Program.cs Configuration**:
```csharp
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;

var builder = WebApplication.CreateBuilder(args);

// Add OpenTelemetry tracing
builder.Services.AddOpenTelemetry()
    .WithTracing(tracerProviderBuilder =>
    {
        tracerProviderBuilder
            .SetResourceBuilder(ResourceBuilder.CreateDefault()
                .AddService("terrafusion-api")
                .AddAttributes(new Dictionary<string, object>
                {
                    ["deployment.environment"] = "production",
                    ["service.namespace"] = "terrafusion"
                }))
            .AddAspNetCoreInstrumentation(options =>
            {
                options.RecordException = true;
                options.EnrichWithHttpRequest = (activity, request) =>
                {
                    activity.SetTag("county", request.Headers["X-County-ID"]);
                };
            })
            .AddHttpClientInstrumentation()
            .AddEntityFrameworkCoreInstrumentation(options =>
            {
                options.SetDbStatementForText = true;
            })
            .AddJaegerExporter(options =>
            {
                options.AgentHost = "jaeger-agent.tracing.svc.cluster.local";
                options.AgentPort = 6831;
            });
    });

var app = builder.Build();
app.Run();
```

### Custom Span Instrumentation

**Manual span creation**:
```csharp
using System.Diagnostics;
using OpenTelemetry.Trace;

public class PropertyAssessmentService
{
    private static readonly ActivitySource ActivitySource = new("TerraFusion.Consciousness");

    public async Task<AssessmentResult> AssessPropertyAsync(string parcelId, string countyId)
    {
        using var activity = ActivitySource.StartActivity("AssessProperty");
        activity?.SetTag("parcel.id", parcelId);
        activity?.SetTag("county.id", countyId);

        try
        {
            // AI agent coordination (creates child spans)
            var aiResult = await _aiOrchestrator.CoordinateSwarmAnalysisAsync(parcelId);
            activity?.SetTag("ai.agents.used", aiResult.AgentCount);
            
            // Quantum-enhanced valuation (creates child spans)
            var valuation = await _quantumService.ApplyQuantumFactorAsync(aiResult);
            activity?.SetTag("quantum.factor", valuation.QuantumFactor);
            
            // IAAO compliance validation
            var compliance = await _iaaOService.ValidateAssessmentAsync(valuation);
            activity?.SetTag("iaao.compliant", compliance.IsCompliant);
            
            return new AssessmentResult { /* ... */ };
        }
        catch (Exception ex)
        {
            activity?.SetStatus(ActivityStatusCode.Error, ex.Message);
            activity?.RecordException(ex);
            throw;
        }
    }
}
```

### Searching Traces in Jaeger UI

**Service Filter**: Select `terrafusion-api`, `terrafusion-consciousness`, `terrafusion-gateway`, or `terrafusion-operations`

**Common Searches**:
- **Slow requests**: Set min duration to `500ms`, search for high-latency traces
- **Errors**: Search for traces with `error=true` tag
- **Specific county**: Filter by tag `county.id=benton`
- **AI agent traces**: Service = `terrafusion-consciousness`, operation = `AssessProperty`
- **Database queries**: Search for spans with `db.statement` tag

**Example Search**:
```
Service: terrafusion-consciousness
Operation: AssessProperty
Tags: county.id=benton iaao.compliant=true
Min Duration: 100ms
Limit: 20 traces
Lookback: 1h
```

### Trace-to-Logs Correlation

Jaeger traces include `trace_id` and `span_id` tags. When viewing a trace:

1. Click on any span in the trace
2. Click "Logs" tab in span details
3. Grafana automatically queries Loki for logs with matching `trace_id`
4. View complete request flow: Trace (performance) + Logs (debugging)

**Example**: API request trace shows:
- Span 1: HTTP request received (5ms)
- Span 2: AI agent coordination (200ms) → Click "Logs" → See AI agent logs
- Span 3: Database query (10ms) → Click "Logs" → See SQL query logs
- Span 4: Response sent (2ms)

---

## Log Aggregation (Loki)

### Access Logs via Grafana

**Navigate to**: Explore → Select "Loki" datasource

### LogQL Query Language

**Basic Syntax**:
```logql
{label="value"} |= "search text" | filter | parser
```

**Label Matchers**:
- `{app="terrafusion-api"}` - Exact match
- `{namespace=~"terra.*"}` - Regex match
- `{level="error"}` - Logs with error level
- `{county="benton"}` - County-specific logs

**Filter Operations**:
- `|= "search"` - Line contains "search"
- `!= "exclude"` - Line does not contain "exclude"
- `|~ "regex"` - Line matches regex
- `!~ "regex"` - Line does not match regex

### Common Log Queries

#### API Service Logs

```logql
# All API logs
{app="terrafusion-api"}

# API errors only
{app="terrafusion-api",level="error"}

# API logs with specific endpoint
{app="terrafusion-api"} |= "/api/property/assess"

# API logs for specific county
{app="terrafusion-api",county="benton"}

# API logs with trace_id (for correlation)
{app="terrafusion-api"} | json | trace_id="abc123xyz"
```

#### Consciousness (AI Engine) Logs

```logql
# All AI agent logs
{app="terrafusion-consciousness"}

# AI agent errors
{app="terrafusion-consciousness",level="error"}

# AI agent logs with quantum factor
{app="terrafusion-consciousness"} | json | quantum_factor > 940

# AI agent logs for specific task
{app="terrafusion-consciousness"} |= "PropertyValuation"

# IAAO compliance logs
{app="terrafusion-consciousness"} |= "IAAO" |= "compliance"
```

#### Gateway Logs

```logql
# All gateway logs
{app="terrafusion-gateway"}

# Rate limiting events
{app="terrafusion-gateway"} |= "rate limit exceeded"

# Specific route logs
{app="terrafusion-gateway"} |= "route=/api/property"
```

#### Operations Service Logs

```logql
# All operations logs
{app="terrafusion-operations"}

# Harris PACS sync logs
{app="terrafusion-operations"} |= "Harris PACS" |= "sync"

# County data processing logs by county
{app="terrafusion-operations",county="king"}

# Property assessment logs
{app="terrafusion-operations"} |= "property assessment"
```

#### Multi-Service Log Aggregation

```logql
# Errors across all services
{namespace="terrafusion",level="error"}

# Logs for specific trace_id (distributed request flow)
{namespace="terrafusion"} | json | trace_id="xyz789"

# High-latency requests (response_time > 1000ms)
{namespace="terrafusion"} | json | response_time > 1000
```

### Log Parsing & Label Extraction

Promtail automatically parses JSON logs and extracts labels:

**JSON Log Format** (TerraFusion standard):
```json
{
  "timestamp": "2025-11-03T10:30:45.123Z",
  "level": "info",
  "message": "Property assessment completed",
  "logger": "PropertyAssessmentService",
  "traceId": "abc123xyz",
  "spanId": "def456",
  "service": "terrafusion-consciousness",
  "county": "benton",
  "parcelId": "123-456-789",
  "assessmentResult": {
    "estimatedValue": 450000,
    "confidence": 0.997,
    "quantumFactor": 949,
    "iaaoCompliant": true
  }
}
```

**Extracted Labels**:
- `level=info`
- `logger=PropertyAssessmentService`
- `service=terrafusion-consciousness`
- `county=benton`
- `trace_id=abc123xyz`

**Query with Extracted Labels**:
```logql
{service="terrafusion-consciousness",county="benton",level="info"} 
| json 
| assessmentResult_confidence > 0.99
```

### Log Retention & Storage

**Configuration**:
- **Retention Period**: 7 days
- **Storage Capacity**: 20GB
- **Compression**: gzip (3:1 ratio typical)
- **Estimated Log Volume**: ~10,000 log lines/minute = ~100MB/day compressed

**Cleanup**:
Loki automatically deletes logs older than 7 days (configured in `loki.yaml`).

---

## Alerting & Notifications

### Alerting Rules (23 total)

**Configuration File**: `backend/k8s/prometheus-rules.yaml`

#### Service Health Alerts (4 rules)

| Alert Name | Condition | Severity | Duration |
|------------|-----------|----------|----------|
| TerraFusionAPIDown | `up{job="terrafusion-api"} == 0` | critical | 1m |
| TerraFusionConsciousnessDown | `up{job="terrafusion-consciousness"} == 0` | critical | 1m |
| TerraFusionGatewayDown | `up{job="terrafusion-gateway"} == 0` | critical | 1m |
| TerraFusionOperationsDown | `up{job="terrafusion-operations"} == 0` | critical | 1m |

**Example Alert**:
```yaml
- alert: TerraFusionAPIDown
  expr: up{job="terrafusion-api"} == 0
  for: 1m
  labels:
    severity: critical
    service: api
  annotations:
    summary: "TerraFusion API is down"
    description: "API service has been down for more than 1 minute. Pod: {{ $labels.pod }}"
    runbook_url: "https://docs.terrafusion.gov/runbooks/api-down"
```

#### Performance Alerts (4 rules)

| Alert Name | Condition | Severity | Duration |
|------------|-----------|----------|----------|
| HighAPIResponseTime | P95 > 100ms | warning | 5m |
| VeryHighAPIResponseTime | P95 > 500ms | critical | 2m |
| HighAPIErrorRate | Error rate > 1% | warning | 5m |
| VeryHighAPIErrorRate | Error rate > 5% | critical | 2m |

#### AI Agent Alerts (4 rules)

| Alert Name | Condition | Severity | Duration |
|------------|-----------|----------|----------|
| LowAIAgentCount | Agents < 45,000 | warning | 5m |
| CriticallyLowAIAgentCount | Agents < 40,000 | critical | 2m |
| QuantumFactorDegradation | Factor < 900 | warning | 5m |
| HighAIAgentMemoryUsage | Memory > 90% | warning | 5m |

#### Resource Alerts (4 rules)

| Alert Name | Condition | Severity | Duration |
|------------|-----------|----------|----------|
| HighCPUUsage | CPU > 80% | warning | 5m |
| VeryHighCPUUsage | CPU > 95% | critical | 2m |
| HighMemoryUsage | Memory > 85% | warning | 5m |
| VeryHighMemoryUsage | Memory > 95% | critical | 2m |

#### Database Alerts (2 rules)

| Alert Name | Condition | Severity | Duration |
|------------|-----------|----------|----------|
| DatabaseConnectionPoolExhaustion | Connections > 90% | warning | 5m |
| SlowDatabaseQueries | Avg query > 1000ms | warning | 5m |

#### Compliance Alerts (2 rules)

| Alert Name | Condition | Severity | Duration |
|------------|-----------|----------|----------|
| AuditLogIngestionFailure | Audit errors > 0 | critical | 2m |
| CountyDataIsolationBreachAttempt | Isolation violations > 0 | critical | 1m |

### Alertmanager Routing

**Configuration File**: `backend/k8s/prometheus-rules.yaml` (Alertmanager ConfigMap)

**Alert Receivers**:
- **default**: Slack `#terrafusion-alerts`
- **critical-alerts**: PagerDuty + Slack `#terrafusion-critical`
- **warning-alerts**: Slack `#terrafusion-warnings`
- **ai-team**: Slack `#terrafusion-ai-alerts` (AI-specific alerts)
- **compliance-team**: Email + Slack `#terrafusion-compliance` (FISMA alerts)

**Routing Rules**:
```yaml
route:
  receiver: 'default'
  group_by: ['alertname', 'cluster', 'service']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 12h
  routes:
    # Critical alerts → PagerDuty + Slack
    - match:
        severity: critical
      receiver: 'critical-alerts'
    
    # AI alerts → AI team
    - match:
        service: consciousness
      receiver: 'ai-team'
    
    # Compliance alerts → Compliance team (highest priority)
    - match:
        component: compliance
      receiver: 'compliance-team'
      group_wait: 0s
      repeat_interval: 1h
```

### Configuring Notifications

**Slack Webhook**:
```yaml
slack_configs:
  - api_url: 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK'
    channel: '#terrafusion-alerts'
    title: '🚨 TerraFusion Alert'
    text: '{{ range .Alerts }}{{ .Annotations.summary }}\n{{ .Annotations.description }}{{ end }}'
```

**PagerDuty Integration**:
```yaml
pagerduty_configs:
  - service_key: 'YOUR_PAGERDUTY_SERVICE_KEY'
    description: '{{ .GroupLabels.alertname }}: {{ .CommonAnnotations.summary }}'
```

**Email Notifications**:
```yaml
email_configs:
  - to: 'compliance@terrafusion.gov'
    from: 'alerts@terrafusion.gov'
    smarthost: 'smtp.office365.com:587'
    auth_username: 'alerts@terrafusion.gov'
    auth_password: 'YOUR_SMTP_PASSWORD'
```

### Silencing Alerts

**Via Alertmanager UI**:
1. Access: `kubectl port-forward -n monitoring svc/alertmanager 9093:9093`
2. Navigate to: http://localhost:9093
3. Click "Silences" → "New Silence"
4. Configure matchers (e.g., `alertname="HighCPUUsage" pod="api-pod-123"`)
5. Set duration (e.g., 2 hours)
6. Add comment (e.g., "Planned maintenance window")

**Via API**:
```bash
curl -X POST http://alertmanager:9093/api/v1/silences \
  -H 'Content-Type: application/json' \
  -d '{
    "matchers": [
      {"name": "alertname", "value": "HighCPUUsage", "isRegex": false}
    ],
    "startsAt": "2025-11-03T10:00:00Z",
    "endsAt": "2025-11-03T12:00:00Z",
    "createdBy": "ops-team",
    "comment": "Planned maintenance"
  }'
```

---

## Query Reference

### Top 20 Essential Queries

#### 1. Service Uptime

```promql
# Service availability percentage (last 24h)
avg_over_time(up{namespace="terrafusion"}[24h]) * 100
```

#### 2. Request Rate (All Services)

```promql
# Total requests per second
sum(rate(http_requests_total{namespace="terrafusion"}[5m]))
```

#### 3. Error Rate Percentage

```promql
# Error percentage by service
(sum(rate(http_requests_total{namespace="terrafusion",status=~"5.."}[5m])) by (job)
 / sum(rate(http_requests_total{namespace="terrafusion"}[5m])) by (job)) * 100
```

#### 4. P95 Latency (All Services)

```promql
# P95 response time by service
histogram_quantile(0.95, 
  sum(rate(http_request_duration_seconds_bucket{namespace="terrafusion"}[5m])) by (job, le))
```

#### 5. AI Agent Health

```promql
# AI agent availability percentage
(terrafusion_ai_agent_count / 50000) * 100
```

#### 6. Quantum Factor Tracking

```promql
# Current quantum optimization factor (target: 949)
terrafusion_ai_quantum_factor{job="terrafusion-consciousness"}
```

#### 7. ML Cache Efficiency

```promql
# ML model cache hit rate percentage
(sum(rate(ml_cache_hits_total{job="terrafusion-consciousness"}[5m]))
 / sum(rate(ml_cache_requests_total{job="terrafusion-consciousness"}[5m]))) * 100
```

#### 8. Top 5 Slowest Endpoints

```promql
# P99 latency by endpoint (top 5)
topk(5, 
  histogram_quantile(0.99, 
    sum(rate(http_request_duration_seconds_bucket{job="terrafusion-api"}[5m])) by (endpoint, le)))
```

#### 9. County Data Processing Rate

```promql
# Processing rate by county (operations per second)
sum(rate(county_data_processed_total{job="terrafusion-operations"}[5m])) by (county)
```

#### 10. Harris PACS Sync Success Rate

```promql
# PACS sync success percentage (last 1h)
avg_over_time(harris_pacs_sync_success{job="terrafusion-operations"}[1h]) * 100
```

#### 11. Pod CPU Utilization

```promql
# CPU usage by pod (percentage of limit)
(sum(rate(container_cpu_usage_seconds_total{namespace="terrafusion"}[5m])) by (pod)
 / sum(container_spec_cpu_quota{namespace="terrafusion"} / container_spec_cpu_period{namespace="terrafusion"}) by (pod)) * 100
```

#### 12. Pod Memory Utilization

```promql
# Memory usage by pod (percentage of limit)
(container_memory_usage_bytes{namespace="terrafusion"}
 / container_spec_memory_limit_bytes{namespace="terrafusion"}) * 100
```

#### 13. Network Traffic Rate

```promql
# Network receive rate (bytes per second)
rate(container_network_receive_bytes_total{namespace="terrafusion"}[5m])
```

#### 14. Disk I/O Operations

```promql
# Disk read/write operations per second
rate(container_fs_reads_total{namespace="terrafusion"}[5m]) +
rate(container_fs_writes_total{namespace="terrafusion"}[5m])
```

#### 15. Gateway Rate Limiting

```promql
# Rate limit exceeded count (last 5m)
sum(increase(rate_limit_exceeded_total{job="terrafusion-gateway"}[5m]))
```

#### 16. Database Connection Pool

```promql
# Active database connections
pg_stat_database_numbackends{datname="terrafusion"}
```

#### 17. Property Assessment Volume

```promql
# Property assessments per minute
rate(property_assessments_total{job="terrafusion-operations"}[1m]) * 60
```

#### 18. IAAO Compliance Score

```promql
# Current IAAO compliance percentage
iaao_compliance_score{job="terrafusion-consciousness"} * 100
```

#### 19. Pod Restart Rate

```promql
# Pod restarts in last hour
sum(increase(kube_pod_container_status_restarts_total{namespace="terrafusion"}[1h])) by (pod)
```

#### 20. Persistent Volume Usage

```promql
# PV usage percentage
(kubelet_volume_stats_used_bytes{namespace="terrafusion"}
 / kubelet_volume_stats_capacity_bytes{namespace="terrafusion"}) * 100
```

---

## Troubleshooting

### Common Issues & Solutions

#### Issue: Prometheus Not Scraping Targets

**Symptoms**:
- Missing metrics in Grafana
- "No data" errors in dashboards
- Empty graphs

**Diagnosis**:
```bash
# Check Prometheus targets
kubectl port-forward -n monitoring svc/prometheus 9090:9090
# Open http://localhost:9090/targets
# Look for targets in "down" state
```

**Solutions**:
1. **Verify service annotations**:
   ```yaml
   annotations:
     prometheus.io/scrape: "true"
     prometheus.io/port: "3000"
     prometheus.io/path: "/metrics"
   ```

2. **Check ServiceMonitor CRD** (if using Prometheus Operator):
   ```bash
   kubectl get servicemonitor -n monitoring
   kubectl describe servicemonitor terrafusion-api -n monitoring
   ```

3. **Verify RBAC permissions**:
   ```bash
   kubectl get clusterrole prometheus -o yaml
   kubectl get clusterrolebinding prometheus -o yaml
   ```

4. **Test metrics endpoint directly**:
   ```bash
   kubectl exec -it -n terrafusion <api-pod-name> -- curl localhost:5000/metrics
   ```

#### Issue: High Alert Noise (Too Many Alerts)

**Symptoms**:
- Constant alert notifications
- Alert fatigue
- Difficulty identifying critical issues

**Solutions**:
1. **Adjust alert thresholds**:
   - Edit `prometheus-rules.yaml`
   - Increase warning thresholds (e.g., CPU > 80% → CPU > 85%)
   - Increase alert duration (e.g., `for: 5m` → `for: 10m`)

2. **Implement alert grouping**:
   ```yaml
   # In alertmanager-config.yaml
   route:
     group_by: ['alertname', 'cluster']
     group_wait: 30s      # Wait 30s to group similar alerts
     group_interval: 5m   # Send grouped alerts every 5m
   ```

3. **Create maintenance silences**:
   ```bash
   # Silence all alerts for a service during maintenance
   amtool silence add alertname=~".* " service="terrafusion-api" --duration=2h
   ```

#### Issue: Missing Logs in Loki

**Symptoms**:
- No logs appearing in Grafana Explore
- Empty log results for known active services

**Diagnosis**:
```bash
# Check Promtail DaemonSet status
kubectl get daemonset -n logging promtail

# Check Promtail logs
kubectl logs -n logging -l app=promtail --tail=100

# Verify Loki is receiving logs
kubectl logs -n logging -l app=loki --tail=100 | grep "ingester"
```

**Solutions**:
1. **Verify Promtail is running on all nodes**:
   ```bash
   kubectl get pods -n logging -l app=promtail -o wide
   # Should show one pod per node
   ```

2. **Check log file paths**:
   - Promtail reads from `/var/log/pods/`
   - Verify pod logs exist: `ls /var/log/pods/terrafusion_*`

3. **Verify Loki client configuration**:
   ```yaml
   # In promtail-config.yaml
   clients:
     - url: http://loki.logging.svc.cluster.local:3100/loki/api/v1/push
   ```

4. **Test Loki API directly**:
   ```bash
   kubectl port-forward -n logging svc/loki 3100:3100
   curl http://localhost:3100/ready  # Should return "ready"
   ```

#### Issue: Jaeger Traces Not Appearing

**Symptoms**:
- No traces in Jaeger UI
- Empty trace search results

**Diagnosis**:
```bash
# Check Jaeger components
kubectl get pods -n tracing

# Check Jaeger Collector logs
kubectl logs -n tracing -l app=jaeger-collector --tail=100

# Verify OpenTelemetry configuration in services
kubectl logs -n terrafusion <api-pod-name> | grep "OpenTelemetry"
```

**Solutions**:
1. **Verify Jaeger Agent endpoint**:
   ```csharp
   // In Program.cs
   .AddJaegerExporter(options =>
   {
       options.AgentHost = "jaeger-agent.tracing.svc.cluster.local";
       options.AgentPort = 6831;
   })
   ```

2. **Check sampling configuration**:
   - Default sampling rate: 0.1 (10% of traces)
   - Increase for testing: `options.SamplingRate = 1.0` (100%)

3. **Verify Elasticsearch backend** (production):
   ```bash
   kubectl port-forward -n tracing svc/elasticsearch 9200:9200
   curl http://localhost:9200/_cluster/health
   ```

4. **Test trace creation manually**:
   ```bash
   # Send test span to Jaeger Collector
   curl -X POST http://jaeger-collector:14268/api/traces \
     -H 'Content-Type: application/json' \
     -d '{"data":[{"traceID":"test123","spans":[...]}]}'
   ```

#### Issue: Grafana Dashboard Not Loading

**Symptoms**:
- Dashboard shows "No data" or loading spinner
- Panel errors: "Query error" or "Timeout"

**Solutions**:
1. **Verify datasource configuration**:
   - Navigate to: Configuration → Data sources
   - Test each datasource (Prometheus, Loki, Jaeger)
   - Ensure URLs are correct (e.g., `http://prometheus:9090`)

2. **Check query syntax**:
   - Open panel edit mode
   - Run query manually in Explore
   - Verify label names and values exist

3. **Increase query timeout**:
   ```yaml
   # In grafana-datasources.yaml
   jsonData:
     queryTimeout: 120s  # Default: 60s
   ```

4. **Check Grafana logs**:
   ```bash
   kubectl logs -n monitoring -l app=grafana --tail=100
   ```

---

## Best Practices

### Metrics Best Practices

#### 1. Use Recording Rules for Expensive Queries

**Problem**: Complex PromQL queries slow down dashboards.

**Solution**: Pre-compute with recording rules.

```yaml
# Instead of computing P95 every time:
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# Create recording rule:
- record: terrafusion_api:http_request_duration:p95
  expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket{job="terrafusion-api"}[5m]))

# Use in dashboards:
terrafusion_api:http_request_duration:p95
```

#### 2. Label Cardinality Management

**Problem**: Too many unique label values cause high memory usage.

**Bad Practice**:
```promql
# Don't use high-cardinality labels like user_id, trace_id, timestamp
http_requests_total{user_id="12345", trace_id="abc123"}
```

**Good Practice**:
```promql
# Use low-cardinality labels: service, endpoint, status
http_requests_total{job="terrafusion-api", endpoint="/api/property", status="200"}
```

#### 3. Metric Naming Conventions

**Follow Prometheus naming standards**:
- Base unit (seconds, bytes, ratio): `http_request_duration_seconds`
- Total suffix for counters: `http_requests_total`
- Avoid redundant labels in name: Use `job` label, not `terrafusion_api_requests`

#### 4. Alert Threshold Tuning

**Initial thresholds** (conservative):
- CPU: Warning at 80%, Critical at 95%
- Memory: Warning at 85%, Critical at 95%
- Error rate: Warning at 1%, Critical at 5%
- Latency P95: Warning at 100ms, Critical at 500ms

**Tune based on baseline**:
1. Collect 1 week of metrics
2. Calculate P95/P99 of normal behavior
3. Set warning at P95 + 20%
4. Set critical at P99 + 50%

### Logging Best Practices

#### 1. Structured Logging (JSON Format)

**Use consistent JSON structure**:
```csharp
// ASP.NET Core structured logging
_logger.LogInformation("Property assessment completed for {ParcelId} in {County}. Result: {EstimatedValue}, Confidence: {Confidence}, Quantum: {QuantumFactor}, IAAO: {IAAOCompliant}",
    parcelId, countyId, result.EstimatedValue, result.Confidence, result.QuantumFactor, result.IAAOCompliant);

// Produces JSON log:
{
  "timestamp": "2025-11-03T10:30:45.123Z",
  "level": "Information",
  "message": "Property assessment completed for 123-456-789 in benton. Result: 450000, Confidence: 0.997, Quantum: 949, IAAO: True",
  "parcelId": "123-456-789",
  "county": "benton",
  "estimatedValue": 450000,
  "confidence": 0.997,
  "quantumFactor": 949,
  "iAAOCompliant": true
}
```

#### 2. Log Level Guidelines

| Level | Use Case | Example |
|-------|----------|---------|
| **Trace** | Detailed debug info | "Entering method PropertyAssessmentService.AssessAsync" |
| **Debug** | Development diagnostics | "AI agent coordination started with 100 agents" |
| **Information** | General informational | "Property assessment completed successfully" |
| **Warning** | Unexpected but handled | "Quantum factor degraded to 920, retrying with fallback" |
| **Error** | Errors requiring attention | "Harris PACS sync failed: Connection timeout" |
| **Critical** | System failures | "Database connection pool exhausted, service unavailable" |

#### 3. Include Correlation IDs

**Always log trace_id and span_id**:
```csharp
using System.Diagnostics;

var activity = Activity.Current;
_logger.LogInformation("Processing request. TraceId: {TraceId}, SpanId: {SpanId}",
    activity?.TraceId.ToString(), activity?.SpanId.ToString());
```

**Benefits**:
- Correlate logs with Jaeger traces
- Follow requests across services
- Debug distributed workflows

#### 4. Avoid Sensitive Data in Logs

**Never log**:
- Passwords, API keys, tokens
- Social Security Numbers, credit cards
- Personally Identifiable Information (PII)

**Use masking**:
```csharp
// Bad
_logger.LogInformation("User login: username={Username}, password={Password}", username, password);

// Good
_logger.LogInformation("User login: username={Username}", username);

// Good (masked)
_logger.LogInformation("Processing SSN: {SSN}", MaskSSN(ssn));  // "***-**-1234"
```

### Tracing Best Practices

#### 1. Meaningful Span Names

**Use descriptive operation names**:
```csharp
// Bad
using var activity = ActivitySource.StartActivity("Process");

// Good
using var activity = ActivitySource.StartActivity("AssessPropertyValue");
```

#### 2. Add Relevant Tags

**Include business context**:
```csharp
activity?.SetTag("county.id", countyId);
activity?.SetTag("parcel.id", parcelId);
activity?.SetTag("assessment.type", "residential");
activity?.SetTag("ai.agents.used", 100);
activity?.SetTag("quantum.factor", 949);
activity?.SetTag("iaao.compliant", true);
```

#### 3. Record Exceptions

**Always record exceptions in spans**:
```csharp
try
{
    // ... code ...
}
catch (Exception ex)
{
    activity?.SetStatus(ActivityStatusCode.Error, ex.Message);
    activity?.RecordException(ex);
    throw;
}
```

#### 4. Sampling Strategy

**Production sampling**:
- **Default**: 10% sampling (balance cost vs visibility)
- **High-priority**: 100% sampling for critical operations (property assessment)
- **Low-priority**: 1% sampling for health checks

```csharp
.AddJaegerExporter(options =>
{
    options.AgentHost = "jaeger-agent.tracing.svc.cluster.local";
    options.AgentPort = 6831;
    
    // Custom sampler
    options.Sampler = new RateLimitingSampler(100);  // Max 100 traces/second
})
```

### Dashboard Best Practices

#### 1. Dashboard Organization

**Folder structure**:
- **TerraFusion OS**: Executive overview dashboards
- **Services**: Service-specific dashboards (API, Consciousness, Gateway, Operations)
- **Infrastructure**: Kubernetes, databases, networking
- **Compliance**: FISMA, IAAO, audit dashboards

#### 2. Panel Design

**Good panel title**: Clear and actionable
- ✅ "API P95 Response Time (target: <100ms)"
- ✅ "AI Agent Count (target: 50,000)"
- ❌ "Graph 1"
- ❌ "Metrics"

**Use appropriate visualization**:
- **Time-series graph**: Trends over time (request rate, latency)
- **Gauge**: Current value with thresholds (CPU usage, agent count)
- **Stat**: Single number summary (success rate, uptime)
- **Heatmap**: Distribution (response time distribution)
- **Pie chart**: Proportions (error types, backend distribution)

#### 3. Color Coding & Thresholds

**Use consistent colors**:
- 🟢 **Green**: Healthy (>99% success rate, <100ms latency)
- 🟡 **Yellow**: Warning (95-99% success rate, 100-500ms latency)
- 🔴 **Red**: Critical (<95% success rate, >500ms latency)

#### 4. Dashboard Variables

**Use template variables for filtering**:
```
$namespace: terrafusion
$service: terrafusion-api | terrafusion-consciousness | terrafusion-gateway | terrafusion-operations
$county: benton | king | pierce | spokane
$interval: 5m | 15m | 1h | 6h | 24h
```

**Query with variables**:
```promql
rate(http_requests_total{namespace="$namespace", job="$service"}[$interval])
```

---

## Performance Optimization

### Prometheus Query Optimization

**Use recording rules** for frequently queried metrics (see [Metrics Best Practices](#1-use-recording-rules-for-expensive-queries)).

**Limit time range** in queries:
```promql
# Bad: Unbounded range
rate(http_requests_total[])

# Good: Bounded range
rate(http_requests_total[5m])
```

**Use aggregation** to reduce data points:
```promql
# Instead of querying all pods:
http_requests_total{namespace="terrafusion"}

# Aggregate by job:
sum(rate(http_requests_total{namespace="terrafusion"}[5m])) by (job)
```

### Grafana Performance

**Dashboard query limits**:
- Max panels per dashboard: 20
- Max queries per panel: 5
- Query timeout: 60s (increase to 120s for complex queries)

**Use caching**:
```yaml
# In grafana.ini
[query_range]
cache_results: true
cache_max_age: 5m
```

### Loki Query Performance

**Use indexed labels** for filtering:
```logql
# Fast: Uses label index
{app="terrafusion-api",level="error"}

# Slow: Full text search
{app="terrafusion-api"} |= "error"
```

**Limit log lines**:
```logql
# Limit to 1000 lines
{app="terrafusion-api"} | limit 1000
```

---

## Security & Compliance

### FISMA-High Compliance

**Audit logging**:
- All monitoring queries logged
- Alert changes tracked
- Dashboard modifications audited

**Access control**:
- Azure AD SSO for Grafana
- RBAC for Kubernetes resources
- ServiceAccount-based permissions

**Data retention**:
- Metrics: 15 days (compliance requirement)
- Logs: 7 days (compliance requirement)
- Traces: 7 days (compliance requirement)

### County Data Isolation

**Label-based isolation**:
```promql
# County-specific queries
county_data_processed_total{county="benton"}
```

**Alert routing by county**:
```yaml
# Send county-specific alerts to county ops team
- match:
    county: benton
  receiver: 'benton-county-ops'
```

---

## Maintenance Tasks

### Daily Tasks

- [ ] Review critical alerts in Slack/PagerDuty
- [ ] Check service uptime (target: >99.99%)
- [ ] Verify AI agent count (target: 50,000)
- [ ] Monitor quantum factor (target: 949)
- [ ] Review error logs for anomalies

### Weekly Tasks

- [ ] Analyze slow queries (P95 > 100ms)
- [ ] Review alert noise (false positives)
- [ ] Check storage capacity (metrics, logs, traces)
- [ ] Validate IAAO compliance scores (>99.5%)
- [ ] Review county-specific metrics

### Monthly Tasks

- [ ] Tune alert thresholds based on baseline
- [ ] Optimize expensive PromQL queries
- [ ] Review and update dashboards
- [ ] Audit access logs (FISMA requirement)
- [ ] Capacity planning (storage, compute)

### Quarterly Tasks

- [ ] Review monitoring architecture
- [ ] Evaluate new observability features
- [ ] Conduct FISMA compliance audit
- [ ] Update documentation
- [ ] Training for new team members

---

## Additional Resources

### Official Documentation

- **Prometheus**: https://prometheus.io/docs/
- **Grafana**: https://grafana.com/docs/
- **Jaeger**: https://www.jaegertracing.io/docs/
- **Loki**: https://grafana.com/docs/loki/
- **OpenTelemetry**: https://opentelemetry.io/docs/

### Internal Resources

- **TerraFusion API Docs**: `backend/docs/API_DOCUMENTATION.md`
- **Deployment Guide**: `backend/docs/DEVOPS_GUIDE.md`
- **Architecture Overview**: `docs/ARCHITECTURE.md`
- **Runbooks**: `docs/runbooks/` (service-specific troubleshooting)

### Support Channels

- **Slack**: `#terrafusion-monitoring` (general monitoring questions)
- **Slack**: `#terrafusion-alerts` (alert notifications)
- **Slack**: `#terrafusion-compliance` (FISMA/IAAO compliance)
- **Email**: `monitoring-team@terrafusion.gov`
- **On-call**: PagerDuty rotation (critical issues only)

---

## Appendix

### Complete Metric List

See full metric catalog at: `backend/docs/METRICS_REFERENCE.md`

### PromQL Cheat Sheet

See quick reference at: `backend/docs/PROMQL_CHEATSHEET.md`

### LogQL Cheat Sheet

See quick reference at: `backend/docs/LOGQL_CHEATSHEET.md`

### Alert Runbooks

See service-specific runbooks at: `docs/runbooks/`

---

**Document Version**: 1.0.0  
**Last Updated**: November 3, 2025  
**Authors**: TerraFusion Monitoring Team  
**Classification**: FISMA-High, Internal Use Only  

**Government. Transcended. - Championship-Level Observability Excellence** 🏛️⚡📊
