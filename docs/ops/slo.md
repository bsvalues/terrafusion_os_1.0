# TerraFusion OS — Service Level Objectives (SLO)

> **Classification:** Government Operations  
> **Compliance:** FISMA-HIGH, NIST 800-53  
> **Owner:** Platform Engineering  
> **Last Updated:** Phase 7 — Production Cutover Safety

---

## 1. SLO Summary Table

| SLO ID | Service | Indicator | Objective | Window | Burn-Rate Alert |
|--------|---------|-----------|-----------|--------|----------------|
| SLO-001 | API (Kernel) | Availability | ≥ 99.9 % | 30 d rolling | 14.4× (1 h), 6× (6 h) |
| SLO-002 | API (Kernel) | Latency P95 | ≤ 100 ms | 30 d rolling | P95 > 100 ms for 5 m |
| SLO-003 | API (Kernel) | Latency P99 | ≤ 500 ms | 30 d rolling | P99 > 500 ms for 2 m |
| SLO-004 | API (Kernel) | Error Rate (5xx) | ≤ 1 % | 30 d rolling | > 1 % for 5 m |
| SLO-005 | Gateway | Availability | ≥ 99.9 % | 30 d rolling | 14.4× (1 h) |
| SLO-006 | Gateway | Latency P95 | ≤ 150 ms | 30 d rolling | P95 > 150 ms for 5 m |
| SLO-007 | Consciousness | Availability | ≥ 99.5 % | 30 d rolling | 14.4× (1 h) |
| SLO-008 | Database | Query Duration P95 | ≤ 50 ms | 30 d rolling | P95 > 50 ms for 5 m |
| SLO-009 | Audit Pipeline | Ingestion Success | 100 % (zero loss) | Continuous | Any failure for 2 m |
| SLO-010 | County Isolation | Violation Rate | 0 (zero tolerance) | Continuous | Any violation for 1 m |

---

## 2. Definitions

### 2.1 Availability

Availability = `(successful requests) / (total requests)` over the SLO window, where a "successful request" returns HTTP 2xx or 4xx (client errors are not service failures).

**Error budget (30 d):**

| Objective | Monthly Error Budget |
|-----------|---------------------|
| 99.9 % | 43.2 minutes downtime |
| 99.5 % | 3.6 hours downtime |

### 2.2 Latency

Measured via Prometheus histogram: `http_request_duration_seconds_bucket`.

- **P95:** 95th percentile over a 5-minute window.
- **P99:** 99th percentile over a 5-minute window.

### 2.3 Error Rate

`rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m])`

### 2.4 Audit Pipeline Integrity

Any non-zero `audit_log_errors_total` rate constitutes a compliance incident (FISMA-HIGH).

### 2.5 County Data Isolation

Any non-zero `county_isolation_violations_total` rate is a critical security event.

---

## 3. Prometheus Recording Rules

All SLO recording rules are defined in `backend/k8s/prometheus-rules.yaml` under the `terrafusion_recording_rules` group:

| Recording Rule | SLO Reference |
|----------------|---------------|
| `terrafusion_api:http_requests:rate5m` | SLO-001, SLO-004 |
| `terrafusion_api:http_errors:rate5m` | SLO-004 |
| `terrafusion_api:http_request_duration:p95` | SLO-002 |
| `terrafusion_api:http_request_duration:p99` | SLO-003 |
| `terrafusion_gateway:http_requests:rate5m` | SLO-005 |
| `terrafusion_gateway:http_errors:rate5m` | SLO-005 |

---

## 4. Alert Mapping

Each SLO has at least one alert rule in `backend/k8s/prometheus-rules.yaml`:

| SLO ID | Alert Name | Severity |
|--------|-----------|----------|
| SLO-001 | `TerraFusionAPIDown` | critical |
| SLO-002 | `HighAPIResponseTime` | warning |
| SLO-003 | `VeryHighAPIResponseTime` | critical |
| SLO-004 | `HighAPIErrorRate` / `VeryHighAPIErrorRate` | warning / critical |
| SLO-005 | `TerraFusionGatewayDown` | critical |
| SLO-007 | `TerraFusionConsciousnessDown` | critical |
| SLO-008 | `SlowDatabaseQueries` | warning |
| SLO-009 | `AuditLogIngestionFailure` | critical |
| SLO-010 | `CountyDataIsolationBreachAttempt` | critical |

See [alerts.md](alerts.md) for full alert reference.

---

## 5. Dashboard Reference

All SLO indicators are visualised in Grafana dashboards provisioned via `backend/k8s/grafana-dashboards-configmap.yaml`:

| Dashboard | Key SLO Panels |
|-----------|---------------|
| TerraFusion OS — System Overview | Service health, request rate, error rate, P95 latency |
| TerraFusion API — Service Metrics | Success rate, latency percentiles, error breakdown |
| TerraFusion Consciousness — AI Agent Monitoring | Agent count, utilisation, processing latency |
| TerraFusion Gateway — Routing & Traffic | Gateway request rate, rate limiting, latency |
| TerraFusion Operations — County Data Processing | County processing rate, Harris PACS sync |
| Kubernetes Cluster | Node CPU/memory, pod restarts, PV usage |

See [dashboards.md](dashboards.md) for full dashboard reference.

---

## 6. Error Budget Policy

1. **Budget consumed < 25 %** — Normal operations; deploy at will.
2. **Budget consumed 25–75 %** — Increased caution; peer review required for risky changes.
3. **Budget consumed 75–100 %** — Change freeze except reliability fixes.
4. **Budget exhausted** — Full change freeze; incident review required before resuming.

---

## 7. Review Cadence

- **Weekly:** SLO dashboard review in ops standup.
- **Monthly:** Error budget report to stakeholders.
- **Quarterly:** SLO target review and adjustment.

---

*Government. Transcended. Measured.*
