# TerraFusion Playground Monitoring Guide

## Monitoring Architecture

### 1. Metrics Collection

#### Prometheus Configuration
```yaml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'terrafusion'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/metrics'
    scheme: 'http'

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['localhost:9100']

  - job_name: 'redis-exporter'
    static_configs:
      - targets: ['localhost:9121']
```

#### Custom Metrics
```javascript
// Application Metrics
const metrics = {
  // Request metrics
  httpRequestDuration: new prometheus.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code']
  }),

  // Model metrics
  modelInferenceDuration: new prometheus.Histogram({
    name: 'model_inference_duration_seconds',
    help: 'Duration of model inference in seconds',
    labelNames: ['model_name']
  }),

  // Cache metrics
  cacheHitRatio: new prometheus.Gauge({
    name: 'cache_hit_ratio',
    help: 'Cache hit ratio'
  })
};

// Metric Collection
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    metrics.httpRequestDuration
      .labels(req.method, req.route.path, res.statusCode)
      .observe(duration / 1000);
  });
  next();
});
```

### 2. Logging

#### Winston Configuration
```javascript
// Logger Setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Log Rotation
const rotateTransport = new winston.transports.File({
  filename: 'app-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d'
});

// Structured Logging
const logEvent = (level, message, metadata) => {
  logger.log(level, message, {
    timestamp: new Date().toISOString(),
    ...metadata
  });
};
```

### 3. Alerting

#### Alert Rules
```yaml
# alert.rules
groups:
- name: terrafusion
  rules:
  - alert: HighErrorRate
    expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
    for: 5m
    labels:
      severity: critical
    annotations:
      summary: High error rate detected
      description: Error rate is {{ $value }} for the last 5 minutes

  - alert: HighLatency
    expr: http_request_duration_seconds{quantile="0.9"} > 1
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: High latency detected
      description: 90th percentile latency is {{ $value }}s
```

#### Alert Manager
```yaml
# alertmanager.yml
global:
  resolve_timeout: 5m
  slack_api_url: 'https://hooks.slack.com/services/...'

route:
  group_by: ['alertname', 'cluster']
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 4h
  receiver: 'slack-notifications'

receivers:
- name: 'slack-notifications'
  slack_configs:
  - channel: '#alerts'
    send_resolved: true
```

### 4. Dashboards

#### Grafana Configuration
```json
{
  "dashboard": {
    "id": null,
    "title": "TerraFusion Overview",
    "tags": ["terrafusion", "overview"],
    "timezone": "browser",
    "panels": [
      {
        "title": "Request Rate",
        "type": "graph",
        "datasource": "Prometheus",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{method}} {{route}}"
          }
        ]
      },
      {
        "title": "Error Rate",
        "type": "graph",
        "datasource": "Prometheus",
        "targets": [
          {
            "expr": "rate(http_requests_total{status=~\"5..\"}[5m])",
            "legendFormat": "errors"
          }
        ]
      }
    ]
  }
}
```

## Monitoring Best Practices

### 1. Metrics Collection

- Use appropriate metric types
- Label metrics effectively
- Set reasonable scrape intervals
- Implement metric aggregation
- Monitor resource usage

### 2. Logging

- Use structured logging
- Implement log rotation
- Set appropriate log levels
- Include context in logs
- Secure sensitive information

### 3. Alerting

- Set meaningful thresholds
- Use appropriate severity levels
- Implement alert grouping
- Include actionable information
- Test alert delivery

### 4. Visualization

- Create meaningful dashboards
- Use appropriate visualizations
- Include relevant time ranges
- Add context to metrics
- Regular dashboard review

## Monitoring Checklist

### Daily Tasks
- Review critical alerts
- Check system health
- Monitor error rates
- Review resource usage
- Check log patterns

### Weekly Tasks
- Review alert thresholds
- Analyze trends
- Check dashboard relevance
- Review log retention
- Update documentation

### Monthly Tasks
- Capacity planning
- Performance analysis
- Alert rule review
- Dashboard optimization
- Log analysis

## Troubleshooting

### 1. High Error Rates
```bash
# Check error logs
tail -f error.log

# Analyze error patterns
grep "ERROR" error.log | sort | uniq -c | sort -nr

# Check application metrics
curl localhost:3000/metrics | grep error
```

### 2. High Latency
```bash
# Check slow queries
SELECT * FROM pg_stat_activity WHERE state = 'active';

# Monitor system resources
top -b -n 1

# Check network latency
ping -c 10 localhost
```

### 3. Resource Issues
```bash
# Check memory usage
free -m

# Check disk usage
df -h

# Check CPU usage
mpstat 1 5
```

## Performance Monitoring

### 1. Application Metrics
- Request rate
- Error rate
- Response time
- Cache hit ratio
- Queue length

### 2. System Metrics
- CPU usage
- Memory usage
- Disk I/O
- Network traffic
- Process count

### 3. Business Metrics
- User activity
- Feature usage
- Conversion rates
- Error patterns
- User feedback

## Monitoring Tools

### 1. Prometheus
- Time series database
- Query language
- Alert rules
- Service discovery
- Exporters

### 2. Grafana
- Dashboard creation
- Visualization
- Alert management
- Data source integration
- User management

### 3. ELK Stack
- Log aggregation
- Search capabilities
- Visualization
- Alerting
- Machine learning

## Monitoring Integration

### 1. CI/CD Pipeline
```yaml
# GitHub Actions
name: Monitoring
on: [push, pull_request]
jobs:
  monitor:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run tests
        run: npm test
      - name: Check coverage
        run: npm run coverage
      - name: Upload metrics
        run: |
          curl -X POST http://localhost:9090/metrics/job/github_actions
```

### 2. Cloud Integration
```javascript
// AWS CloudWatch
const cloudwatch = new AWS.CloudWatch();
const putMetric = (name, value) => {
  cloudwatch.putMetricData({
    MetricData: [{
      MetricName: name,
      Value: value,
      Unit: 'Count',
      Timestamp: new Date()
    }],
    Namespace: 'TerraFusion'
  }).promise();
};
```

### 3. External Services
```javascript
// New Relic Integration
const newrelic = require('newrelic');
app.use(newrelic.expressMiddleware());

// Datadog Integration
const tracer = require('dd-trace').init();
app.use(tracer.expressMiddleware());
``` 