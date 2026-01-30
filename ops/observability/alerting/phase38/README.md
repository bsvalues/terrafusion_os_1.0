# Phase 38: AI-Aware Prometheus Alert Rules

This directory contains Prometheus alert rules for TerraFusion OS Atlas and SystemGPT Swarm subsystems.

## Alert Files

| File | Purpose | Alert Count |
|------|---------|-------------|
| `atlas-alerts.yml` | Forecast Engine, Orchestrator, Anomaly Detection | 9 |
| `swarm-alerts.yml` | Swarm Predictive Actions, Policy Evaluation, Safety | 7 |

**Total Alerts**: 16

## Alert Categories

### Atlas Alerts (`atlas-alerts.yml`)

| Alert Name | Severity | Trigger Condition |
|------------|----------|-------------------|
| `AtlasForecastStale` | critical | No orchestrator run in 5+ minutes |
| `AtlasForecastErrorRateHigh` | warning | Error rate > 5% |
| `AtlasForecastDurationSpike` | warning | P95 duration > 2s |
| `AtlasOrchestratorStall` | critical | No runs in 10+ minutes |
| `AtlasOrchestratorDurationHigh` | warning | Cycle > 60s |
| `AtlasAnomalySpike` | warning | > 10 anomalies in 5 min |
| `AtlasAnomalyCritical` | critical | Critical anomaly type detected |
| `AtlasTelemetryDropRate` | warning | No telemetry ingest |
| `AtlasCleanupStale` | warning | No cleanup in 1 hour |

### Swarm Alerts (`swarm-alerts.yml`)

| Alert Name | Severity | Trigger Condition |
|------------|----------|-------------------|
| `SwarmActionSpike` | warning | > 50 actions in 5 min |
| `SwarmActionsByCountyImbalance` | warning | High variance across counties |
| `SwarmCooldownActivation` | info | Cooldown triggered |
| `SwarmSafeModeTriggered` | critical | > 5 cooldowns in 1 min |
| `SwarmPolicyLoadHigh` | warning | > 100 evals/min |
| `SwarmPolicyEvaluationStall` | warning | No evals in 10 min |
| `SwarmActionEffectivenessLow` | warning | Action ratio < 1% |

## Installation

### Prometheus Configuration

Add to your `prometheus.yml`:

```yaml
rule_files:
  - "/etc/prometheus/rules/phase38/*.yml"
```

### Kubernetes (PrometheusOperator)

Apply as PrometheusRule:

```bash
kubectl apply -f atlas-alerts.yml -n observability
kubectl apply -f swarm-alerts.yml -n observability
```

### Validation

Test rules with `promtool`:

```bash
promtool check rules atlas-alerts.yml
promtool check rules swarm-alerts.yml
```

## Labels & Annotations

### Standard Labels (All Alerts)

| Label | Description |
|-------|-------------|
| `severity` | `critical`, `warning`, or `info` |
| `government` | Always `"true"` for compliance |
| `component` | `forecast`, `orchestrator`, `anomaly`, `swarm`, `telemetry` |
| `citizen_impact` | Critical alerts only: `high`, `medium`, `low` |

### Standard Annotations (All Alerts)

| Annotation | Description |
|------------|-------------|
| `summary` | One-line description |
| `description` | Detailed explanation with `{{ $value }}` |
| `action` | Operator guidance |
| `dashboard` | Link to Phase 37 Grafana dashboard |
| `runbook` | Link to runbook (critical alerts) |

## Related Resources

- **Phase 35**: Metrics SPEC LOCK (`backend/src/TerraFusion.AI/Metrics/`)
- **Phase 37**: Grafana Dashboards (`ops/observability/grafana-dashboards/phase37/`)
- **Alertmanager**: Configure notification routing separately

## SPEC LOCK

These alerts are frozen per Phase 38 ALERT SPEC LOCK v1.0.0.
Changes require RFC approval and full test suite update.
