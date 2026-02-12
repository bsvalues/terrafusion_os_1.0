# Terrafusion Monitoring and Alerting Setup Guide

## Overview
This guide provides comprehensive instructions for setting up monitoring and alerting for the Terrafusion platform using Prometheus, Grafana, and various alerting channels.

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│ Application ├────►│  Prometheus  ├────►│   Grafana   │
│   Metrics   │     │   (Scraper)  │     │(Dashboards) │
└─────────────┘     └──────┬───────┘     └─────────────┘
                           │
                    ┌──────▼───────┐
                    │ Alert Manager│
                    └──────┬───────┘
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
    ┌────────┐       ┌─────────┐       ┌──────────┐
    │ Email  │       │  Slack  │       │ PagerDuty│
    └────────┘       └─────────┘       └──────────┘
```

## 1. Prometheus Setup

### 1.1 Configuration File

Create `/opt/terrafusion/monitoring/prometheus.yml`:

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s
  external_labels:
    monitor: 'terrafusion-prod'
    environment: 'production'

# Alerting configuration
alerting:
  alertmanagers:
    - static_configs:
        - targets: ['alertmanager:9093']

# Load rules
rule_files:
  - '/etc/prometheus/rules/*.yml'

# Scrape configurations
scrape_configs:
  # Backend API metrics
  - job_name: 'backend'
    static_configs:
      - targets: ['backend:8080']
    metrics_path: '/metrics'
    scrape_interval: 10s

  # AI Engine metrics
  - job_name: 'ai-engine'
    static_configs:
      - targets: ['ai-engine:8001']
    metrics_path: '/metrics'
    scrape_interval: 10s

  # PostgreSQL exporter
  - job_name: 'postgresql'
    static_configs:
      - targets: ['postgres-exporter:9187']

  # Redis exporter
  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']

  # Node exporter (system metrics)
  - job_name: 'node'
    static_configs:
      - targets: ['node-exporter:9100']

  # Nginx exporter
  - job_name: 'nginx'
    static_configs:
      - targets: ['nginx-exporter:9113']

  # Blackbox exporter (uptime monitoring)
  - job_name: 'blackbox'
    metrics_path: /probe
    params:
      module: [http_2xx]
    static_configs:
      - targets:
          - https://terrafusion.example.com
          - https://api.terrafusion.example.com
    relabel_configs:
      - source_labels: [__address__]
        target_label: __param_target
      - source_labels: [__param_target]
        target_label: instance
      - target_label: __address__
        replacement: blackbox-exporter:9115
```

### 1.2 Alert Rules

Create `/opt/terrafusion/monitoring/rules/alerts.yml`:

```yaml
groups:
  - name: application
    interval: 30s
    rules:
      # High Error Rate
      - alert: HighErrorRate
        expr: |
          (
            sum(rate(http_requests_total{status=~"5.."}[5m])) by (job)
            /
            sum(rate(http_requests_total[5m])) by (job)
          ) > 0.05
        for: 5m
        labels:
          severity: critical
          team: backend
        annotations:
          summary: "High error rate on {{ $labels.job }}"
          description: "Error rate is {{ $value | humanizePercentage }} for {{ $labels.job }}"

      # API Response Time
      - alert: SlowAPIResponse
        expr: |
          histogram_quantile(0.95,
            sum(rate(http_request_duration_seconds_bucket[5m])) by (le, job)
          ) > 2
        for: 10m
        labels:
          severity: warning
          team: backend
        annotations:
          summary: "Slow API responses on {{ $labels.job }}"
          description: "95th percentile response time is {{ $value }}s"

      # Service Down
      - alert: ServiceDown
        expr: up == 0
        for: 2m
        labels:
          severity: critical
          team: ops
        annotations:
          summary: "Service {{ $labels.job }} is down"
          description: "{{ $labels.job }} on {{ $labels.instance }} has been down for more than 2 minutes"

  - name: infrastructure
    interval: 30s
    rules:
      # High CPU Usage
      - alert: HighCPUUsage
        expr: |
          100 - (avg by (instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
        for: 10m
        labels:
          severity: warning
          team: ops
        annotations:
          summary: "High CPU usage on {{ $labels.instance }}"
          description: "CPU usage is {{ $value | humanize }}%"

      # High Memory Usage
      - alert: HighMemoryUsage
        expr: |
          (1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100 > 85
        for: 10m
        labels:
          severity: warning
          team: ops
        annotations:
          summary: "High memory usage on {{ $labels.instance }}"
          description: "Memory usage is {{ $value | humanize }}%"

      # Disk Space Low
      - alert: DiskSpaceLow
        expr: |
          (node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"}) * 100 < 20
        for: 5m
        labels:
          severity: warning
          team: ops
        annotations:
          summary: "Low disk space on {{ $labels.instance }}"
          description: "Only {{ $value | humanize }}% disk space left"

  - name: database
    interval: 30s
    rules:
      # Database Connection Pool Exhausted
      - alert: DatabaseConnectionPoolExhausted
        expr: |
          pg_stat_database_numbackends{datname="terrafusion_production"} 
          / 
          pg_settings_max_connections > 0.8
        for: 5m
        labels:
          severity: warning
          team: backend
        annotations:
          summary: "Database connection pool near limit"
          description: "{{ $value | humanizePercentage }} of connections used"

      # Slow Queries
      - alert: DatabaseSlowQueries
        expr: |
          rate(pg_stat_statements_total_time_seconds[5m]) > 1
        for: 10m
        labels:
          severity: warning
          team: backend
        annotations:
          summary: "Slow database queries detected"
          description: "Query time averaging {{ $value }}s"

      # Replication Lag
      - alert: DatabaseReplicationLag
        expr: |
          pg_replication_lag_seconds > 10
        for: 5m
        labels:
          severity: critical
          team: ops
        annotations:
          summary: "Database replication lag high"
          description: "Replication lag is {{ $value }}s"

  - name: business
    interval: 1m
    rules:
      # No Projects Created
      - alert: NoProjectsCreated
        expr: |
          increase(business_projects_created_total[1h]) == 0
        for: 2h
        labels:
          severity: info
          team: product
        annotations:
          summary: "No projects created in last hour"
          description: "No new projects have been created"

      # AI Engine Failures
      - alert: AIEnginePredictionFailures
        expr: |
          rate(ai_predictions_failed_total[5m]) > 0.1
        for: 10m
        labels:
          severity: critical
          team: ai
        annotations:
          summary: "High AI prediction failure rate"
          description: "AI prediction failure rate is {{ $value | humanize }} per second"
```

## 2. Grafana Setup

### 2.1 Data Source Configuration

1. Add Prometheus data source:
```json
{
  "name": "Prometheus",
  "type": "prometheus",
  "url": "http://prometheus:9090",
  "access": "proxy",
  "isDefault": true
}
```

### 2.2 Dashboard Provisioning

Create `/opt/terrafusion/monitoring/grafana/provisioning/dashboards/dashboards.yml`:

```yaml
apiVersion: 1

providers:
  - name: 'Terrafusion'
    orgId: 1
    folder: ''
    type: file
    disableDeletion: false
    updateIntervalSeconds: 10
    allowUiUpdates: true
    options:
      path: /etc/grafana/provisioning/dashboards
```

### 2.3 System Overview Dashboard

Create a comprehensive dashboard JSON (truncated for brevity):

```json
{
  "dashboard": {
    "title": "Terrafusion System Overview",
    "panels": [
      {
        "title": "Request Rate",
        "targets": [
          {
            "expr": "sum(rate(http_requests_total[5m])) by (job)",
            "legendFormat": "{{ job }}"
          }
        ],
        "type": "graph"
      },
      {
        "title": "Error Rate",
        "targets": [
          {
            "expr": "sum(rate(http_requests_total{status=~\"5..\"}[5m])) by (job) / sum(rate(http_requests_total[5m])) by (job)",
            "legendFormat": "{{ job }}"
          }
        ],
        "type": "graph"
      },
      {
        "title": "Response Time (p95)",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le, job))",
            "legendFormat": "{{ job }}"
          }
        ],
        "type": "graph"
      }
    ]
  }
}
```

## 3. AlertManager Configuration

Create `/opt/terrafusion/monitoring/alertmanager.yml`:

```yaml
global:
  resolve_timeout: 5m
  smtp_smarthost: 'smtp.gmail.com:587'
  smtp_from: 'alerts@terrafusion.com'
  smtp_auth_username: 'alerts@terrafusion.com'
  smtp_auth_password: 'your-smtp-password'

# Templates
templates:
  - '/etc/alertmanager/templates/*.tmpl'

# Route tree
route:
  receiver: 'default'
  group_by: ['alertname', 'cluster', 'service']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 12h

  routes:
    # Critical alerts
    - match:
        severity: critical
      receiver: 'pagerduty-critical'
      continue: true
      
    # Warning alerts
    - match:
        severity: warning
      receiver: 'slack-warnings'
      
    # Database alerts
    - match:
        team: database
      receiver: 'database-team'

# Receivers
receivers:
  - name: 'default'
    email_configs:
      - to: 'ops-team@terrafusion.com'
        headers:
          Subject: 'Terrafusion Alert: {{ .GroupLabels.alertname }}'

  - name: 'pagerduty-critical'
    pagerduty_configs:
      - service_key: 'your-pagerduty-service-key'
        severity: 'critical'

  - name: 'slack-warnings'
    slack_configs:
      - api_url: 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK'
        channel: '#terrafusion-alerts'
        title: 'Terrafusion Warning'
        text: '{{ range .Alerts }}{{ .Annotations.summary }}\n{{ end }}'

  - name: 'database-team'
    email_configs:
      - to: 'database-team@terrafusion.com'
```

## 4. Application Instrumentation

### 4.1 Python Backend Metrics

```python
# metrics.py
from prometheus_client import Counter, Histogram, Gauge, Info
import time

# Request metrics
request_count = Counter(
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status']
)

request_duration = Histogram(
    'http_request_duration_seconds',
    'HTTP request duration',
    ['method', 'endpoint']
)

# Business metrics
projects_created = Counter(
    'business_projects_created_total',
    'Total projects created'
)

active_users = Gauge(
    'business_active_users',
    'Currently active users'
)

# Database metrics
db_connections = Gauge(
    'database_connections_active',
    'Active database connections'
)

# AI metrics
ai_predictions = Counter(
    'ai_predictions_total',
    'Total AI predictions',
    ['model', 'status']
)

ai_prediction_duration = Histogram(
    'ai_prediction_duration_seconds',
    'AI prediction duration',
    ['model']
)

# Middleware example
from fastapi import Request
import time

async def metrics_middleware(request: Request, call_next):
    start_time = time.time()
    
    response = await call_next(request)
    
    duration = time.time() - start_time
    request_count.labels(
        method=request.method,
        endpoint=request.url.path,
        status=response.status_code
    ).inc()
    
    request_duration.labels(
        method=request.method,
        endpoint=request.url.path
    ).observe(duration)
    
    return response
```

### 4.2 Metrics Endpoint

```python
# main.py
from fastapi import FastAPI
from prometheus_client import generate_latest, CONTENT_TYPE_LATEST
from fastapi.responses import Response

app = FastAPI()

@app.get("/metrics")
async def metrics():
    return Response(
        generate_latest(),
        media_type=CONTENT_TYPE_LATEST
    )
```

## 5. Log Aggregation

### 5.1 Loki Configuration

```yaml
# loki-config.yml
auth_enabled: false

server:
  http_listen_port: 3100

ingester:
  lifecycler:
    address: 127.0.0.1
    ring:
      kvstore:
        store: inmemory
      replication_factor: 1

schema_config:
  configs:
    - from: 2020-10-24
      store: boltdb-shipper
      object_store: filesystem
      schema: v11
      index:
        prefix: index_
        period: 24h

storage_config:
  boltdb_shipper:
    active_index_directory: /loki/boltdb-shipper-active
    cache_location: /loki/boltdb-shipper-cache
    shared_store: filesystem
  filesystem:
    directory: /loki/chunks

limits_config:
  enforce_metric_name: false
  reject_old_samples: true
  reject_old_samples_max_age: 168h
```

### 5.2 Promtail Configuration

```yaml
# promtail-config.yml
server:
  http_listen_port: 9080
  grpc_listen_port: 0

positions:
  filename: /tmp/positions.yaml

clients:
  - url: http://loki:3100/loki/api/v1/push

scrape_configs:
  - job_name: backend
    static_configs:
      - targets:
          - localhost
        labels:
          job: backend
          __path__: /var/log/terrafusion/backend/*.log
    pipeline_stages:
      - json:
          expressions:
            level: level
            msg: msg
            time: time
      - labels:
          level:
      - timestamp:
          source: time
          format: RFC3339

  - job_name: nginx
    static_configs:
      - targets:
          - localhost
        labels:
          job: nginx
          __path__: /var/log/nginx/*.log
```

## 6. Custom Metrics

### 6.1 Business Metrics Examples

```python
# Track user activity
@app.post("/api/projects")
async def create_project(project_data: dict):
    # Business logic
    result = create_project_in_db(project_data)
    
    # Track metric
    projects_created.inc()
    active_users.set(get_active_user_count())
    
    return result

# Track AI performance
@app.post("/api/ai/predict")
async def predict_cost(data: dict):
    start_time = time.time()
    
    try:
        result = ai_engine.predict(data)
        ai_predictions.labels(model='cost_estimator', status='success').inc()
    except Exception as e:
        ai_predictions.labels(model='cost_estimator', status='failure').inc()
        raise
    finally:
        duration = time.time() - start_time
        ai_prediction_duration.labels(model='cost_estimator').observe(duration)
    
    return result
```

### 6.2 SLI/SLO Tracking

```yaml
# SLO definitions in Prometheus rules
groups:
  - name: slo
    interval: 30s
    rules:
      # Availability SLO
      - record: slo:availability
        expr: |
          1 - (
            sum(rate(http_requests_total{status=~"5.."}[5m]))
            /
            sum(rate(http_requests_total[5m]))
          )

      # Latency SLO
      - record: slo:latency_p95
        expr: |
          histogram_quantile(0.95,
            sum(rate(http_request_duration_seconds_bucket[5m])) by (le)
          )

      # Error Budget
      - alert: ErrorBudgetLow
        expr: |
          (1 - slo:availability) > 0.001  # 99.9% SLO
        for: 10m
        labels:
          severity: warning
          team: sre
        annotations:
          summary: "Error budget consumption high"
          description: "Current availability: {{ $value | humanizePercentage }}"
```

## 7. Monitoring Checklist

### 7.1 Initial Setup
- [ ] Prometheus installed and configured
- [ ] Grafana installed with dashboards
- [ ] AlertManager configured with receivers
- [ ] Node exporters on all servers
- [ ] Application metrics instrumented
- [ ] Log aggregation configured
- [ ] SSL certificates for monitoring endpoints

### 7.2 Dashboards Created
- [ ] System Overview Dashboard
- [ ] Application Performance Dashboard
- [ ] Database Performance Dashboard
- [ ] Business Metrics Dashboard
- [ ] SLO/SLI Dashboard
- [ ] Alert Overview Dashboard

### 7.3 Alerts Configured
- [ ] Service up/down alerts
- [ ] Performance degradation alerts
- [ ] Resource utilization alerts
- [ ] Business metric alerts
- [ ] Security alerts
- [ ] Certificate expiration alerts

### 7.4 Testing
- [ ] Test alert routing
- [ ] Verify metric collection
- [ ] Dashboard load testing
- [ ] Backup monitoring data
- [ ] Document runbooks

## 8. Maintenance

### 8.1 Regular Tasks
- Review and tune alert thresholds weekly
- Archive old metrics data monthly
- Update dashboards based on feedback
- Review SLO compliance monthly
- Test alert channels quarterly

### 8.2 Troubleshooting

**Metrics not appearing**:
```bash
# Check Prometheus targets
curl http://prometheus:9090/api/v1/targets

# Check metric endpoint
curl http://backend:8080/metrics

# Check Prometheus logs
docker logs prometheus
```

**Alerts not firing**:
```bash
# Check alert rules
curl http://prometheus:9090/api/v1/rules

# Check AlertManager
curl http://alertmanager:9093/api/v1/alerts

# Test alert
curl -H "Content-Type: application/json" -d '[
  {
    "labels": {
      "alertname": "TestAlert",
      "severity": "warning"
    }
  }
]' http://alertmanager:9093/api/v1/alerts
```

## 9. Best Practices

1. **Use labels wisely** - Don't create high cardinality metrics
2. **Set appropriate retention** - Balance storage vs history
3. **Create runbooks** - Link alerts to remediation steps
4. **Monitor the monitors** - Ensure monitoring stack is healthy
5. **Regular reviews** - Continuously improve alerts and dashboards
6. **Document everything** - Maintain monitoring documentation

## 10. Emergency Contacts

- **On-Call Schedule**: https://terrafusion.pagerduty.com
- **Escalation**: ops-escalation@terrafusion.com
- **Monitoring Team**: monitoring-team@terrafusion.com