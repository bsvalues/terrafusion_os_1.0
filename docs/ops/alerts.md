# TerraFusion OS — Alert Reference

> **Classification:** Government Operations  
> **Compliance:** FISMA-HIGH, NIST 800-53  
> **Source of Truth:** `backend/k8s/prometheus-rules.yaml`  
> **Last Updated:** Phase 7 — Production Cutover Safety

---

## 1. Alert Inventory

All alerts are defined in `backend/k8s/prometheus-rules.yaml` and routed via Alertmanager (see `alertmanager-config` ConfigMap in the same file).

### Service Health Alerts

| Alert | Expr | For | Severity | SLO | Runbook |
|-------|------|-----|----------|-----|---------|
| `TerraFusionAPIDown` | `up{job="terrafusion-api"} == 0` | 1 m | critical | SLO-001 | [api-down](runbooks/api-down.md) |
| `TerraFusionConsciousnessDown` | `up{job="terrafusion-consciousness"} == 0` | 1 m | critical | SLO-007 | [consciousness-down](runbooks/consciousness-down.md) |
| `TerraFusionGatewayDown` | `up{job="terrafusion-gateway"} == 0` | 1 m | critical | SLO-005 | [gateway-down](runbooks/gateway-down.md) |
| `TerraFusionOperationsDown` | `up{job="terrafusion-operations"} == 0` | 1 m | critical | — | operations-down |

### Performance Alerts

| Alert | Expr (simplified) | For | Severity | SLO | Runbook |
|-------|-------------------|-----|----------|-----|---------|
| `HighAPIResponseTime` | P95 > 100 ms | 5 m | warning | SLO-002 | high-latency |
| `VeryHighAPIResponseTime` | P95 > 500 ms | 2 m | critical | SLO-003 | [very-high-latency](runbooks/very-high-latency.md) |
| `HighAPIErrorRate` | 5xx rate > 1 % | 5 m | warning | SLO-004 | high-error-rate |
| `VeryHighAPIErrorRate` | 5xx rate > 5 % | 2 m | critical | SLO-004 | [very-high-error-rate](runbooks/very-high-error-rate.md) |

### AI Agent Alerts

| Alert | Expr (simplified) | For | Severity | SLO | Runbook |
|-------|-------------------|-----|----------|-----|---------|
| `LowAIAgentCount` | agent count < threshold | 5 m | warning | SLO-007 | low-agent-count |
| `CriticallyLowAIAgentCount` | agent count < 40 000 | 2 m | critical | SLO-007 | critically-low-agent-count |
| `QuantumFactorDegradation` | quantum factor < 900 | 5 m | warning | — | quantum-degradation |
| `HighAIAgentMemoryUsage` | memory > 90 % | 5 m | warning | — | high-memory-usage |

### Resource Alerts

| Alert | Expr (simplified) | For | Severity | Runbook |
|-------|-------------------|-----|----------|---------|
| `HighCPUUsage` | CPU > 80 % | 5 m | warning | high-cpu-usage |
| `VeryHighCPUUsage` | CPU > 95 % | 2 m | critical | very-high-cpu-usage |
| `HighMemoryUsage` | Memory > 85 % | 5 m | warning | high-memory-usage |
| `VeryHighMemoryUsage` | Memory > 95 % | 2 m | critical | very-high-memory-usage |
| `PodRestartLoop` | restart rate > 0 | 5 m | warning | pod-restart-loop |

### Database Alerts

| Alert | Expr (simplified) | For | Severity | SLO | Runbook |
|-------|-------------------|-----|----------|-----|---------|
| `DatabaseConnectionPoolExhaustion` | pool > 90 % | 5 m | warning | SLO-008 | db-connection-exhaustion |
| `SlowDatabaseQueries` | mean exec > 1 s | 5 m | warning | SLO-008 | slow-queries |

### Compliance Alerts (FISMA-HIGH)

| Alert | Expr (simplified) | For | Severity | SLO | Runbook |
|-------|-------------------|-----|----------|-----|---------|
| `AuditLogIngestionFailure` | error rate > 0 | 2 m | critical | SLO-009 | [audit-log-failure](runbooks/audit-log-failure.md) |
| `CountyDataIsolationBreachAttempt` | violation rate > 0 | 1 m | critical | SLO-010 | [isolation-breach](runbooks/isolation-breach.md) |

---

## 2. Routing Rules

Alertmanager routes (from `alertmanager-config` ConfigMap):

| Matcher | Receiver | Group Wait | Repeat |
|---------|----------|------------|--------|
| `severity: critical` | `critical-alerts` (PagerDuty + Slack) | 10 s | 12 h |
| `severity: warning` | `warning-alerts` (Slack) | 10 s | 12 h |
| `service: consciousness` | `ai-team` (Slack) | 10 s | 12 h |
| `component: compliance` | `compliance-team` (Email + Slack) | 0 s | 1 h |

---

## 3. Receiver Channels

| Receiver | Channels |
|----------|----------|
| `default` | `#terrafusion-alerts` |
| `critical-alerts` | PagerDuty + `#terrafusion-critical` |
| `warning-alerts` | `#terrafusion-warnings` |
| `ai-team` | `#terrafusion-ai-alerts` |
| `compliance-team` | `compliance@terrafusionmarket.com` + `#terrafusion-compliance` |

---

## 4. On-Call Response Times

| Severity | Acknowledge | Resolve |
|----------|-------------|---------|
| critical | ≤ 5 min | ≤ 30 min |
| warning | ≤ 15 min | ≤ 2 h |
| info | Next business day | Best effort |

---

*Government. Transcended. Alerted.*
