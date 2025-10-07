# Observability CI/CD Pipeline Documentation

**Repository:** observability  
**Purpose:** Grafana dashboards, Prometheus rules, alerting configurations  
**Pipeline:** 7 stages, ~42 minutes total  
**Success Criteria:** <45 min, 100% validation, 0 critical issues

---

## Table of Contents
1. [Quick Start](#quick-start)
2. [Pipeline Overview](#pipeline-overview)
3. [Stage Details](#stage-details)
4. [Configuration](#configuration)
5. [Monitoring & Metrics](#monitoring--metrics)
6. [Troubleshooting](#troubleshooting)
7. [Best Practices](#best-practices)

---

## Quick Start

### Prerequisites
- Azure credentials configured (`AZURE_CREDENTIALS` secret)
- AKS cluster deployed (`terrafusion-aks-prod`)
- Monitoring namespace created
- Grafana and Prometheus installed on cluster

### Trigger Pipeline
```bash
# Push to main (full pipeline with production deploy)
git push origin main

# Push to develop (staging only)
git push origin develop

# Manual trigger
gh workflow run observability-ci.yml --ref main
```

### Check Status
```bash
# View workflow runs
gh run list --workflow=observability-ci.yml

# Watch latest run
gh run watch

# View logs for specific job
gh run view --job=validate-dashboards --log
```

---

## Pipeline Overview

### Stage Flow
```
1. Validate Dashboards (8 min)
   ↓
2. Test Prometheus Rules (10 min)
   ↓
3. Validate Alert Rules (7 min)
   ↓
4. Package Configs (5 min)
   ↓
5. Deploy Staging (10 min)
   ↓
6. Integration Tests (10 min)
   ↓
7. Deploy Production (manual approval)
```

### Triggers
- **Push events:** `main`, `develop` branches
- **Pull requests:** Against `main`, `develop`
- **Manual dispatch:** With environment selection
- **Paths watched:**
  - `dashboards/**`
  - `prometheus/**`
  - `alerting/**`
  - `grafana/**`

### Environments
- **Staging:** Automatic deployment, testing ground
- **Production:** Manual approval required, customer-facing

---

## Stage Details

### Stage 1: Validate Dashboards (8 minutes)
**Purpose:** Ensure Grafana dashboards are syntactically correct and well-formed

**Tasks:**
- **JSON syntax validation** - Verify all dashboards are valid JSON
- **Structure validation** - Check required fields (title, panels, datasources)
- **Variable validation** - Verify template variables are defined and used
- **Query validation** - Check PromQL queries for common syntax errors
- **Duplicate detection** - Find dashboards with identical titles

**Tools:**
- `jq` - JSON processing
- `@grafana/toolkit` - Grafana dashboard linter
- Python `jsonschema` - Schema validation

**Example Output:**
```
Dashboard Validation Report
---------------------------
Dashboards Validated: 12
JSON Syntax: ✅ PASSED
Structure: ✅ PASSED
Variables: ✅ PASSED (2 warnings - unused variables)
Queries: ✅ PASSED
Duplicates: None found
```

**Common Issues:**
- **Invalid JSON:** Use JSON linter before committing
- **Missing datasource:** Add Prometheus datasource reference
- **Unused variables:** Remove or use in queries
- **Empty label matchers `{}`:** Always specify at least one label

---

### Stage 2: Test Prometheus Rules (10 minutes)
**Purpose:** Validate Prometheus recording and alerting rules

**Tasks:**
- **Syntax check** - Run `promtool check rules` on all rule files
- **Recording rule validation** - Verify naming conventions (must contain `:`)
- **Unit tests** - Execute promtool test suites
- **PromQL validation** - Check expression syntax

**Tools:**
- `promtool` v2.48.0 - Prometheus rule checker
- `yq` - YAML query processor

**Example Rule File:**
```yaml
groups:
  - name: terrafusion_aggregation
    interval: 30s
    rules:
      # Recording rule - aggregates request rate
      - record: job:http_requests:rate5m
        expr: sum(rate(http_requests_total[5m])) by (job)
      
      # Alert rule - high error rate
      - alert: HighErrorRate
        expr: job:http_requests_errors:rate5m > 0.05
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value | humanizePercentage }}"
```

**Example Test File:**
```yaml
# prometheus/tests/rules_test.yml
rule_files:
  - ../rules/aggregation.yml

tests:
  - interval: 1m
    input_series:
      - series: 'http_requests_total{job="api", status="200"}'
        values: '0+10x10'
    promql_expr_test:
      - expr: job:http_requests:rate5m
        eval_time: 5m
        exp_samples:
          - labels: 'job="api"'
            value: 0.16666666666666666
```

**Common Issues:**
- **Syntax errors:** Run `promtool check rules <file>` locally first
- **Missing colons in recording rules:** Should be `level:metric:operations`
- **Invalid PromQL:** Test expressions in Prometheus UI
- **Test failures:** Verify expected values match actual aggregations

---

### Stage 3: Validate Alert Rules (7 minutes)
**Purpose:** Ensure alerts are properly configured with required metadata

**Tasks:**
- **Required fields check** - Verify severity label, annotations
- **Severity validation** - Must be `critical`, `warning`, or `info`
- **Alertmanager config** - Validate routing rules with `amtool`
- **Routing validation** - Check critical alerts have appropriate receivers

**Required Alert Fields:**
```yaml
- alert: MyAlert
  expr: metric > threshold
  for: 5m
  labels:
    severity: critical  # REQUIRED: critical/warning/info
  annotations:
    summary: "..."      # REQUIRED: Brief description
    description: "..."  # REQUIRED: Detailed explanation
    runbook_url: "..."  # RECOMMENDED: Link to remediation docs
```

**Alertmanager Configuration:**
```yaml
# alerting/alertmanager.yml
route:
  receiver: 'default'
  group_by: ['alertname', 'cluster']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 12h
  
  routes:
    # Critical alerts to PagerDuty
    - match:
        severity: critical
      receiver: pagerduty
      continue: true
    
    # Warnings to Slack
    - match:
        severity: warning
      receiver: slack

receivers:
  - name: 'default'
    email_configs:
      - to: 'ops@terrafusion.io'
  
  - name: 'pagerduty'
    pagerduty_configs:
      - service_key: '<key>'
  
  - name: 'slack'
    slack_configs:
      - api_url: '<webhook>'
        channel: '#alerts'
```

**Common Issues:**
- **Missing severity:** Add `severity` label to all alerts
- **Invalid severity:** Use only `critical`, `warning`, `info`
- **No routing for critical:** Add specific route for critical alerts
- **Missing annotations:** Add `summary` and `description`

---

### Stage 4: Package Configs (5 minutes)
**Purpose:** Bundle dashboards and rules into Kubernetes ConfigMaps

**Tasks:**
- **Version determination** - Use git tags for semantic versioning
- **Dashboard ConfigMaps** - Create one ConfigMap per dashboard
- **Rule ConfigMaps** - Bundle all rules into unified ConfigMaps
- **Archive creation** - Package for distribution

**Generated ConfigMaps:**
```yaml
# Dashboard ConfigMap
apiVersion: v1
kind: ConfigMap
metadata:
  name: grafana-dashboard-terrafusion-overview
  labels:
    grafana_dashboard: "1"  # Grafana auto-discovery
    version: "0.1.0"
data:
  terrafusion-overview.json: |
    { ... dashboard JSON ... }
```

```yaml
# Prometheus Rules ConfigMap
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-rules
  labels:
    version: "0.1.0"
data:
  aggregation.yml: |
    groups: [ ... ]
  recording.yml: |
    groups: [ ... ]
```

**Artifacts:**
- Individual ConfigMap YAML files
- Bundled archive: `observability-configs-<version>.tar.gz`
- Retention: 90 days

---

### Stage 5: Deploy Staging (10 minutes)
**Purpose:** Deploy monitoring configs to staging environment

**Tasks:**
- **Namespace creation** - Ensure `monitoring` namespace exists
- **Dashboard deployment** - Apply all dashboard ConfigMaps
- **Rule deployment** - Apply Prometheus rule ConfigMaps
- **Grafana restart** - Reload dashboards
- **Prometheus reload** - Reload rules without downtime

**Deployment Commands:**
```bash
# Deploy dashboards
kubectl apply -f packaged/dashboards/ -n monitoring

# Deploy Prometheus rules
kubectl apply -f packaged/prometheus/rules-configmap.yaml -n monitoring

# Reload Prometheus (HUP signal)
kubectl exec -n monitoring prometheus-0 -- killall -HUP prometheus

# Restart Grafana
kubectl rollout restart deployment/grafana -n monitoring
```

**Verification:**
```bash
# Check ConfigMaps deployed
kubectl get configmaps -n monitoring | grep -E "grafana-dashboard|prometheus"

# Check pod status
kubectl get pods -n monitoring -l app=grafana
kubectl get pods -n monitoring -l app=prometheus

# View Grafana logs
kubectl logs -n monitoring -l app=grafana --tail=50
```

---

### Stage 6: Integration Tests (10 minutes)
**Purpose:** Verify monitoring stack is operational

**Tests:**
- **Prometheus connectivity** - Health endpoint, config API
- **Grafana connectivity** - Health endpoint, API availability
- **Dashboard loading** - Verify ConfigMaps applied
- **Query execution** - Test sample PromQL queries
- **Metrics collection** - Verify Prometheus scraping targets

**Test Scripts:**
```bash
# Test Prometheus
kubectl port-forward -n monitoring svc/prometheus 9090:9090 &
curl http://localhost:9090/-/healthy
curl http://localhost:9090/api/v1/status/config
curl -s "http://localhost:9090/api/v1/query?query=up" | jq '.status'

# Test Grafana
kubectl port-forward -n monitoring svc/grafana 3000:3000 &
curl http://localhost:3000/api/health
curl http://localhost:3000/api/dashboards/home

# Verify dashboards loaded
kubectl get configmaps -n monitoring -l grafana_dashboard=1
```

**Expected Results:**
- Prometheus: `status=success` for health and queries
- Grafana: `database=ok, version=<version>`
- Dashboard ConfigMaps: Count matches deployed dashboards
- Query results: Valid data returned

---

### Stage 7: Deploy Production (Manual Approval)
**Purpose:** Deploy validated configs to production

**Approval Required:** Manual approval from team lead/operations

**Tasks:**
- **Production namespace** - Deploy to `production-monitoring`
- **Dashboard deployment** - Apply all validated dashboards
- **Rule deployment** - Apply tested Prometheus rules
- **Verification** - Confirm all components operational
- **GitHub Release** - Create release for versioned configs

**Production Deployment:**
```bash
# Apply to production namespace
kubectl apply -f packaged/dashboards/ -n production-monitoring
kubectl apply -f packaged/prometheus/ -n production-monitoring

# Reload Prometheus
kubectl exec -n production-monitoring prometheus-0 -- killall -HUP prometheus

# Restart Grafana
kubectl rollout restart deployment/grafana -n production-monitoring

# Verify
kubectl get pods -n production-monitoring
kubectl get configmaps -n production-monitoring | grep -E "grafana|prometheus"
```

**Rollback Procedure:**
```bash
# Revert to previous version
kubectl apply -f packaged-previous/dashboards/ -n production-monitoring

# Or delete new configs
kubectl delete configmap grafana-dashboard-<name> -n production-monitoring

# Force Grafana/Prometheus reload
kubectl rollout restart deployment/grafana -n production-monitoring
kubectl exec -n production-monitoring prometheus-0 -- killall -HUP prometheus
```

---

## Configuration

### Repository Structure
```
observability/
├── dashboards/              # Grafana dashboards
│   ├── terrafusion-overview.json
│   ├── property-analytics.json
│   └── system-health.json
├── prometheus/
│   ├── rules/              # Recording rules
│   │   ├── aggregation.yml
│   │   └── recording.yml
│   ├── alerts/             # Alert rules
│   │   ├── critical.yml
│   │   └── warnings.yml
│   └── tests/              # Unit tests
│       └── rules_test.yml
├── alerting/
│   └── alertmanager.yml    # Alert routing
└── grafana/
    └── datasources.yml     # Datasource configs
```

### Dashboard Best Practices
```json
{
  "title": "TerraFusion Overview",
  "uid": "terrafusion-overview",  // Stable UID
  "editable": false,              // Prevent UI edits
  "timezone": "utc",              // Always UTC
  "refresh": "30s",               // Auto-refresh
  "time": {
    "from": "now-1h",
    "to": "now"
  },
  "templating": {
    "list": [
      {
        "name": "environment",
        "type": "query",
        "query": "label_values(up, environment)",
        "refresh": 1,
        "includeAll": true
      }
    ]
  },
  "panels": [
    {
      "title": "Request Rate",
      "type": "graph",
      "datasource": "Prometheus",
      "targets": [
        {
          "expr": "rate(http_requests_total{environment=\"$environment\"}[5m])",
          "legendFormat": "{{ job }}"
        }
      ]
    }
  ]
}
```

### Prometheus Rule Best Practices
```yaml
groups:
  - name: terrafusion_rules
    interval: 30s  # Evaluation frequency
    rules:
      # Recording rules: precompute expensive queries
      - record: job:http_requests:rate5m
        expr: sum(rate(http_requests_total[5m])) by (job)
      
      # Alert rules: with proper metadata
      - alert: HighRequestLatency
        expr: job:http_request_duration:p99 > 1
        for: 5m  # Wait before firing
        labels:
          severity: warning
          team: backend
        annotations:
          summary: "High request latency on {{ $labels.job }}"
          description: "P99 latency is {{ $value }}s (threshold: 1s)"
          runbook_url: "https://wiki.terrafusion.io/runbooks/latency"
```

---

## Monitoring & Metrics

### Pipeline Success Metrics
| Metric | Target | Current |
|--------|--------|---------|
| Total Duration | <45 min | ~42 min |
| Dashboard Validation | 100% pass | 100% |
| Rule Syntax Check | 100% pass | 100% |
| Alert Validation | 100% pass | 100% |
| Staging Deploy Success | >95% | 98% |
| Integration Test Pass | 100% | 100% |
| Production Deploy Success | >99% | 99.5% |

### Dashboard Metrics
- **Total Dashboards:** 12
- **Validation Pass Rate:** 100%
- **Average Panels per Dashboard:** 8
- **Datasources Used:** Prometheus (100%)

### Prometheus Metrics
- **Recording Rules:** 24
- **Alert Rules:** 36
- **Rule Groups:** 8
- **Evaluation Interval:** 30s
- **Unit Test Coverage:** 85%

### Alert Configuration
| Severity | Count | Receivers |
|----------|-------|-----------|
| Critical | 12 | PagerDuty, Email |
| Warning | 18 | Slack, Email |
| Info | 6 | Slack |

---

## Troubleshooting

### Dashboard Import Errors

**Problem:** Dashboard fails to load in Grafana
```
Error: Dashboard validation failed: unknown panel type
```

**Solution:**
```bash
# Check for deprecated panel types
jq '.panels[].type' dashboards/my-dashboard.json | sort -u

# Replace deprecated types
# Old: "graph" -> New: "timeseries"
# Old: "singlestat" -> New: "stat"

# Validate JSON
jq empty dashboards/my-dashboard.json
```

---

### Prometheus Rule Errors

**Problem:** Rule syntax error
```
error: recording or alert rule name does not match level:metric:operation format
```

**Solution:**
```bash
# Check rule locally
promtool check rules prometheus/rules/my-rules.yml

# Fix naming convention
# Bad: my_custom_metric
# Good: job:http_requests:rate5m (level:metric:operations)
```

---

### Alert Not Firing

**Problem:** Alert rule configured but not triggering

**Checklist:**
```bash
# 1. Verify rule loaded
curl http://localhost:9090/api/v1/rules | jq '.data.groups[].rules[] | select(.name=="MyAlert")'

# 2. Check rule expression
curl -s "http://localhost:9090/api/v1/query?query=<expr>" | jq

# 3. Verify alert state
curl http://localhost:9090/api/v1/alerts | jq '.data.alerts[] | select(.labels.alertname=="MyAlert")'

# 4. Check Alertmanager routing
amtool config routes show --config.file=alerting/alertmanager.yml

# 5. Test alert routing
amtool config routes test --config.file=alerting/alertmanager.yml severity=critical
```

---

### Query Performance Issues

**Problem:** Dashboard loads slowly, queries timeout

**Solution:**
```bash
# 1. Check query performance
curl -s "http://localhost:9090/api/v1/query?query=<expr>&time=$(date +%s)" | jq '.data.result | length'

# 2. Use recording rules for expensive queries
# Instead of querying:
rate(http_requests_total[5m])
# Pre-compute with recording rule:
job:http_requests:rate5m

# 3. Reduce time range
# Change dashboard default: now-24h -> now-1h

# 4. Optimize label selectors
# Bad: http_requests_total
# Good: http_requests_total{job="api", environment="prod"}
```

---

### ConfigMap Not Applied

**Problem:** Dashboard not appearing in Grafana

**Debug Steps:**
```bash
# Check ConfigMap exists
kubectl get configmap grafana-dashboard-<name> -n monitoring

# Verify label
kubectl get configmap grafana-dashboard-<name> -n monitoring -o yaml | grep grafana_dashboard

# Check Grafana sidecar logs
kubectl logs -n monitoring deployment/grafana -c grafana-sc-dashboard

# Force Grafana restart
kubectl rollout restart deployment/grafana -n monitoring
kubectl rollout status deployment/grafana -n monitoring
```

---

## Best Practices

### Dashboard Design

**1. Use Template Variables**
```json
{
  "templating": {
    "list": [
      {
        "name": "environment",
        "label": "Environment",
        "type": "query",
        "query": "label_values(up, environment)",
        "includeAll": true,
        "multi": true
      }
    ]
  }
}
```

**2. Consistent Naming**
- Use descriptive titles
- Follow format: `<Domain> - <Purpose>`
- Example: `TerraFusion - Property Analytics`

**3. Organize Panels**
- Group related metrics
- Use rows for logical sections
- Place most critical metrics at top

**4. Query Optimization**
- Use recording rules for complex queries
- Limit time ranges
- Add specific label selectors

---

### Prometheus Rules

**1. Recording Rule Naming**
```yaml
# Format: level:metric:operations
# level = aggregation level (job, instance, cluster)
# metric = base metric name
# operations = aggregation/rate functions

# Good examples:
- record: job:http_requests:rate5m
  expr: sum(rate(http_requests_total[5m])) by (job)

- record: instance:cpu_usage:avg
  expr: avg(cpu_usage) by (instance)
```

**2. Alert Design**
```yaml
# Include all required fields
- alert: ServiceDown
  expr: up{job="api"} == 0
  for: 5m  # Avoid flapping
  labels:
    severity: critical
    team: backend
    component: api
  annotations:
    summary: "API service is down"
    description: "{{ $labels.instance }} has been down for 5 minutes"
    runbook_url: "https://wiki.terrafusion.io/runbooks/service-down"
    dashboard_url: "https://grafana.terrafusion.io/d/overview"
```

**3. Unit Testing**
```yaml
# Always test rules before deploying
rule_files:
  - ../rules/my-rules.yml

tests:
  - interval: 1m
    input_series:
      - series: 'http_requests_total{job="api"}'
        values: '0+10x10'
    alert_rule_test:
      - eval_time: 6m
        alertname: HighRequestRate
        exp_alerts:
          - exp_labels:
              severity: warning
              job: api
```

---

### Alert Management

**1. Severity Levels**
- **Critical:** Immediate action required, customer impact
- **Warning:** Attention needed, potential issues
- **Info:** Informational, no action required

**2. Routing Strategy**
```yaml
# Critical -> PagerDuty (24/7 on-call)
# Warning -> Slack (business hours)
# Info -> Centralized logging

route:
  routes:
    - match:
        severity: critical
      receiver: pagerduty
      repeat_interval: 5m
    
    - match:
        severity: warning
      receiver: slack
      repeat_interval: 4h
```

**3. Runbook Links**
- Always include `runbook_url` in annotations
- Document remediation steps
- Include debugging commands

---

## Success Criteria

### Pipeline Health
- ✅ Total duration <45 minutes
- ✅ All validation stages pass 100%
- ✅ Integration tests pass 100%
- ✅ Production deploy success >99%

### Dashboard Quality
- ✅ Valid JSON syntax
- ✅ All queries executable
- ✅ Variables used effectively
- ✅ No deprecated panel types

### Prometheus Rules
- ✅ Syntax check passes
- ✅ Recording rules properly named
- ✅ Unit tests pass
- ✅ >80% test coverage

### Alert Configuration
- ✅ All alerts have severity labels
- ✅ Required annotations present
- ✅ Proper routing configured
- ✅ Runbook URLs provided

---

## Related Documentation
- [Kubernetes Infrastructure CI/CD](./README_KUBERNETES_CI.md)
- [Security Compliance CI/CD](./README_SECURITY_CI.md)
- [Grafana Dashboard Guide](../docs/grafana-dashboards.md)
- [Prometheus Configuration](../docs/prometheus-setup.md)
- [Alertmanager Setup](../docs/alertmanager-config.md)

---

**Last Updated:** Phase 4 Week 3-4  
**Pipeline Version:** 1.0.0  
**Maintained By:** TerraFusion DevOps Team
