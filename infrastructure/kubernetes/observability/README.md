# Terrafusion Cosmic Observability Stack

This directory contains the complete observability stack for the Terrafusion
Cosmic Platform, providing comprehensive monitoring, logging, tracing, and
alerting capabilities.

## Components

### 1. **Prometheus** (Metrics)

- Time-series metrics collection and storage
- Service discovery for Kubernetes resources
- Custom metrics for cosmic consciousness levels
- Alert rule evaluation
- High availability with StatefulSet (2 replicas)

### 2. **Grafana** (Visualization)

- Unified dashboard for all observability data
- Pre-configured datasources (Prometheus, Loki, Jaeger, Elasticsearch)
- Custom cosmic platform dashboards
- User authentication and RBAC
- High availability deployment (2 replicas)

### 3. **Loki** (Log Aggregation)

- Efficient log aggregation and querying
- Minimal resource usage compared to traditional solutions
- Integration with Grafana for unified experience
- Distributed deployment with memberlist clustering (3 replicas)

### 4. **Elasticsearch** (Log Storage & Analysis)

- Full-text search capabilities for logs
- Index lifecycle management for automatic log rotation
- Custom index templates for cosmic platform logs
- Secure cluster with TLS and authentication (3 replicas)

### 5. **Fluentd/Fluent Bit** (Log Collection)

- DaemonSet deployment for log collection from all nodes
- Kubernetes metadata enrichment
- Multi-destination output (Elasticsearch & Loki)
- Custom parsing for cosmic platform services

### 6. **Jaeger** (Distributed Tracing)

- End-to-end request tracing
- Service dependency analysis
- Performance bottleneck identification
- Integration with Istio service mesh
- Production deployment with Elasticsearch backend

### 7. **AlertManager** (Alert Routing)

- Alert grouping and deduplication
- Multi-channel notifications (Slack, PagerDuty, Email, Webhooks)
- Custom routing for cosmic emergency alerts
- High availability cluster mode (3 replicas)

## Quick Start

1. **Create namespace and install CRDs:**

```bash
kubectl create namespace monitoring
kubectl apply -f https://raw.githubusercontent.com/jaegertracing/jaeger-operator/main/deploy/crds/jaegertracing.io_jaegers_crd.yaml
```

2. **Configure secrets:**

```bash
# Edit secrets in kustomization.yaml with your actual values
vim kustomization.yaml

# Or create secrets manually
kubectl create secret generic monitoring-credentials \
  --from-literal=grafana-admin-password=<your-password> \
  --from-literal=elasticsearch-password=<your-password> \
  --from-literal=slack-webhook-url=<your-webhook> \
  --from-literal=pagerduty-service-key=<your-key> \
  --from-literal=smtp-password=<your-password> \
  -n monitoring
```

3. **Deploy the stack:**

```bash
# Using kustomize
kubectl apply -k .

# Or apply individual components
kubectl apply -f prometheus.yaml
kubectl apply -f grafana.yaml
kubectl apply -f loki.yaml
kubectl apply -f elasticsearch.yaml
kubectl apply -f fluentd.yaml
kubectl apply -f jaeger.yaml
kubectl apply -f alertmanager.yaml
```

4. **Access the services:**

```bash
# Port-forward to access locally
kubectl port-forward -n monitoring svc/grafana 3000:3000
kubectl port-forward -n monitoring svc/prometheus 9090:9090
kubectl port-forward -n monitoring svc/alertmanager 9093:9093

# Or use the Ingress endpoints (if configured)
# Grafana: https://monitor.terrafusion.cosmic
# Prometheus: https://prometheus.terrafusion.cosmic
# AlertManager: https://alerts.terrafusion.cosmic
```

## Configuration

### Prometheus Scraping

Add these annotations to your pods/services to enable Prometheus scraping:

```yaml
annotations:
  prometheus.io/scrape: 'true'
  prometheus.io/port: '8080'
  prometheus.io/path: '/metrics'
```

### Custom Dashboards

Place dashboard JSON files in `dashboards/` directory and they will be
automatically loaded into Grafana.

### Log Parsing

For custom log formats, add parser configurations to the Fluentd ConfigMap:

```yaml
<filter kubernetes.var.log.containers.your-service**> @type parser key_name log
<parse> @type json json_parser oj </parse> </filter>
```

### Alert Rules

Add custom alert rules to the `prometheus-rules` ConfigMap:

```yaml
groups:
  - name: your-alerts
    rules:
      - alert: YourAlert
        expr: your_metric > threshold
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: 'Alert summary'
```

## Cosmic Platform Integration

### Metrics

The stack collects these cosmic-specific metrics:

- `cosmic_consciousness_level`: Overall platform consciousness (0-100)
- `cosmic_neural_operations_total`: Neural network operations count
- `quantum_storage_dimensions`: Active quantum storage dimensions
- `interplanetary_latency_ms`: Network latency between cosmic nodes

### Logs

Logs are enriched with cosmic metadata:

- `cosmic_level`: Material, Ethereal, Astral, Celestial, Omniscient
- `neural_activity`: Neural network activity level
- `quantum_state`: Collapsed, Superposition, Entangled

### Traces

Distributed tracing includes:

- Cross-dimensional request flow
- Quantum entanglement correlation
- Neural pathway visualization

## Monitoring Best Practices

1. **Resource Allocation**: Ensure adequate resources for monitoring components:
   - Prometheus: 2-8GB RAM, 100GB+ storage
   - Elasticsearch: 8GB RAM per node, 100GB+ storage
   - Grafana: 1-2GB RAM
   - Loki: 2GB RAM, 50GB+ storage

2. **Data Retention**: Configure appropriate retention policies:
   - Metrics: 30 days (Prometheus)
   - Logs: 90 days with ILM (Elasticsearch)
   - Traces: 7 days (Jaeger)

3. **High Availability**: All components support HA deployment:
   - Use StatefulSets for stateful components
   - Configure anti-affinity rules
   - Set up cross-AZ deployments

4. **Security**: Implement security best practices:
   - Enable TLS for all components
   - Use strong authentication
   - Implement RBAC policies
   - Encrypt data at rest

## Troubleshooting

### Common Issues

1. **High Memory Usage**:
   - Check Prometheus retention settings
   - Verify Elasticsearch heap size
   - Review Fluentd buffer settings

2. **Missing Metrics**:
   - Verify ServiceMonitor/PodMonitor configuration
   - Check Prometheus scrape targets
   - Ensure network policies allow scraping

3. **Log Ingestion Delays**:
   - Check Fluentd buffer queue
   - Verify Elasticsearch cluster health
   - Review log parsing performance

4. **Alert Fatigue**:
   - Tune alert thresholds
   - Implement proper grouping
   - Use inhibition rules

### Debug Commands

```bash
# Check component status
kubectl get pods -n monitoring
kubectl top pods -n monitoring

# View logs
kubectl logs -n monitoring deployment/prometheus
kubectl logs -n monitoring daemonset/fluentd

# Check Prometheus targets
kubectl port-forward -n monitoring svc/prometheus 9090:9090
# Visit http://localhost:\${{TF_PROMETHEUS_PORT:-9090}}/targets

# Verify Elasticsearch cluster
kubectl exec -n monitoring elasticsearch-0 -- curl -k -u elastic:$PASSWORD https://localhost:\${{TF_PROMETHEUS_PORT:-9090}}/_cluster/health?pretty

# Test AlertManager
kubectl exec -n monitoring deployment/alertmanager -- amtool config routes
```

## Maintenance

### Regular Tasks

1. **Weekly**:
   - Review dashboard usage
   - Check alert effectiveness
   - Monitor resource usage

2. **Monthly**:
   - Update component versions
   - Review and optimize queries
   - Clean up unused dashboards/alerts

3. **Quarterly**:
   - Capacity planning review
   - Security audit
   - Performance optimization

## Support

For issues or questions:

- Check component logs
- Review Kubernetes events
- Consult official documentation
- Contact the Cosmic Ops team

🌌 Keep the cosmic consciousness observable! 🌌
