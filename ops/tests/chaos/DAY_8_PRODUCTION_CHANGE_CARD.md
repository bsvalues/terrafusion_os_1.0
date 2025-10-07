# Production Change Card: Day 8 F2 Circuit Breaker Optimization

**Change ID**: TFOS-2025-1008-F2  
**Date**: October 8-9, 2025  
**Owner**: _______________ (Platform Team)  
**Approvers**: _______________ (2 required: Platform Lead + SRE Lead)

---

## Executive Summary

**What**: Optimize Istio circuit breaker for F2 fault recovery (baseEjectionTime 30s→15s, interval 30s→10s, consecutiveGatewayErrors 5→3)  
**Why**: Reduce F2 recovery time from 75s → <60s, improve F2 RI from 0.9317 → 0.9500, achieve overall RI target 0.9320+  
**Risk**: LOW (staged deployment, <5min rollback, proven in staging 24h+ soak)  
**Impact**: F2 fault recovery improvement, no user-facing changes, zero downtime deployment

---

## Acceptance Criteria (MUST MEET ALL)

- [ ] **Recovery Time**: F2 recovery ≤60s (baseline 75s, target 45-55s)
- [ ] **Reliability Index**: F2 RI ≥0.9500 (baseline 0.9317)
- [ ] **Error Rate**: Error rate during fault <1.0% (baseline 2.2%)
- [ ] **Data Integrity**: Integrity errors = 0 (no data loss)
- [ ] **Post-Recovery Latency**: P95 ≤500ms within 60s of recovery
- [ ] **Zero Downtime**: No 503 errors during deployment
- [ ] **Rollback Time**: <5min rollback capability verified

---

## Staging Validation Results

**Environment**: Staging  
**Date**: _______________ (October 7-8, 2025)  
**Duration**: 24h soak + 10min chaos test

### F2 Chaos Test Results

| Metric | Baseline | Target | Staging Measured | Status |
|--------|----------|--------|------------------|--------|
| Recovery Time | 75s | ≤60s | **____s** | ⬜ PASS / ⬜ FAIL |
| F2 RI | 0.9317 | ≥0.9500 | **____** | ⬜ PASS / ⬜ FAIL |
| Error Rate | 2.2% | <1.0% | **____%** | ⬜ PASS / ⬜ FAIL |
| Integrity Errors | 0 | 0 | **____** | ⬜ PASS / ⬜ FAIL |
| Post-Recovery P95 | 650ms | ≤500ms | **____ms** | ⬜ PASS / ⬜ FAIL |

**Staging Artifacts**:
- [ ] Report: `out/day8-f2-staging/ri_report.md` attached
- [ ] Grafana snapshots: `out/day8/soak/*.png` attached
- [ ] Alert test results: Slack/PagerDuty screenshots attached
- [ ] Rollback test verified: Yes / No

**Staging Sign-Off**: _______________ (SRE Lead) Date: _______________

---

## Production Deployment Plan

### Timeline

| Phase | Duration | Window | Description |
|-------|----------|--------|-------------|
| **Phase 0: Pre-Flight** | 15min | Oct 8, 10:00 PM UTC | Change control, backup verification, traffic freeze |
| **Phase 1: Deploy** | 30min | Oct 8, 10:15 PM UTC | Apply DestinationRule, verify propagation |
| **Phase 2: Validation** | 45min | Oct 8, 10:45 PM UTC | Run F2 chaos test, validate acceptance criteria |
| **Phase 3: Monitoring** | 40min | Oct 8, 11:30 PM UTC | Deploy alerts, test Slack/PagerDuty |
| **Phase 4: Observation** | 60min | Oct 9, 12:10 AM UTC | Watch for anomalies, confirm stability |
| **Change Close** | 10min | Oct 9, 01:10 AM UTC | Update docs, close change ticket |

**Total Duration**: ~3 hours  
**Rollback Window**: Available at every phase (<5min)

### Pre-Flight Checklist (Phase 0)

- [ ] **Change Control Approved** (Ticket: TFOS-2025-1008-F2)
- [ ] **On-Call SRE Notified** (2 engineers on standby)
- [ ] **Backup Created**: `ops/tests/chaos/backups/2025-10-08/destinationrules.yaml`
- [ ] **Production Traffic Stable** (<5% variance last 30min)
- [ ] **Monitoring Dashboards Open** (Grafana, Prometheus, Jaeger)
- [ ] **Rollback Plan Reviewed** (all engineers briefed)
- [ ] **Customer Success Notified** (no user-facing impact expected)

### Deployment Commands (Phase 1)

```bash
# Set production context
export KUBE_CONTEXT="production"
export NAMESPACE="terrafusion"

# Deploy circuit breaker optimization
cd ops/tests/chaos/scripts
bash day8-deploy-circuit-breaker.sh --env production --apply

# Wait for Istio propagation (30s)
sleep 30

# Verify deployment
kubectl get destinationrule terrafusion-api-dr-optimized -n $NAMESPACE -o yaml | grep -A5 outlierDetection
```

**Expected Output**:
```yaml
outlierDetection:
  baseEjectionTime: 15s
  consecutiveGatewayErrors: 3
  interval: 10s
```

**Pass Gate**:
- [ ] DestinationRule applied successfully (no errors)
- [ ] `baseEjectionTime: 15s` (was 30s)
- [ ] `consecutiveGatewayErrors: 3` (was 5)
- [ ] `interval: 10s` (was 30s)
- [ ] No pod restarts in last 5 minutes
- [ ] Istio pilot logs show no errors

### Validation Commands (Phase 2)

```bash
# Run F2 chaos test (10min duration)
bash day8-validate-f2-recovery.sh --env production --fault F2 --duration 10m --report out/day8-f2-production

# Check report
cat out/day8-f2-production/ri_report.md

# Verify metrics
jq '.f2_recovery_time_seconds, .f2_ri, .f2_error_rate_pct' out/day8-f2-production/metrics.json
```

**Acceptance Criteria** (MUST MEET ALL):
- [ ] F2 recovery time ≤60s (measured: **____s**)
- [ ] F2 RI ≥0.9500 (measured: **____**)
- [ ] Error rate <1.0% (measured: **____%**)
- [ ] Integrity errors = 0 (measured: **____**)
- [ ] Post-recovery P95 ≤500ms (measured: **____ms**)

**If ANY criterion fails**: Execute rollback immediately (see Rollback Procedure below)

### Monitoring Deployment (Phase 3)

```bash
# Deploy F2 alert pack
kubectl apply -f ops/tests/chaos/monitoring/f2-recovery.alerts.yaml

# Verify alerts loaded
kubectl get prometheusrule f2-recovery-alerts -n terrafusion-monitoring

# Test alert firing (optional - synthetic spike)
curl -X POST http://prometheus.terrafusion.ai/api/v1/alerts/test \
  -d '{"alertname":"F2_Recovery_Slow","severity":"warning"}'

# Check Slack notification received
# Check PagerDuty notification received (if configured)
```

**Pass Gate**:
- [ ] PrometheusRule created successfully
- [ ] 6 alerts loaded (F2_Recovery_Slow, CB_Flap, F2_Error_Rate_High, CB_Stuck_Open, F2_Data_Integrity_Error, F2_Recovery_Latency_Spike)
- [ ] Slack channel configured (#chaos-alerts)
- [ ] Alert test successful (notification received)

### Observation Period (Phase 4 - 60min)

**Watch for RED FLAGS** (rollback immediately if any occur):

- ⚠️ Circuit breaker flapping (>3 open/close cycles in 10min)
- ⚠️ Error rate spike >1% sustained for 5min
- ⚠️ P99 latency >1s sustained for 5min
- ⚠️ Customer escalations >5 tickets/hour
- ⚠️ 429/503 errors increasing
- ⚠️ Memory/CPU usage anomalies

**Monitoring Queries** (run every 15min):

```promql
# Circuit breaker state
sum(envoy_cluster_outlier_detection_ejections_active{cluster_name=~".*terrafusion.*"})

# Error rate
sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))

# P95 latency
histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))

# Pod health
kubectl get pods -n terrafusion -o wide | grep -v Running
```

**Observation Checklist** (check every 15min):
- [ ] **T+15min**: Metrics stable, no alerts fired
- [ ] **T+30min**: Error rate <0.5%, P95 <200ms
- [ ] **T+45min**: No circuit breaker flapping
- [ ] **T+60min**: All metrics within normal range

---

## Rollback Procedure (<5 minutes)

### Rollback Trigger Conditions

Execute rollback immediately if:
- Any acceptance criterion fails
- Any RED FLAG detected during observation
- Customer escalations >10 tickets/hour
- On-call SRE judgment call

### Rollback Commands

```bash
# Step 1: Apply backup DestinationRule (30 seconds)
kubectl apply -f ops/tests/chaos/backups/2025-10-08/terrafusion-api-dr-backup.yaml

# Step 2: Restart affected pods (2 minutes)
kubectl rollout restart deployment/terrafusion-api -n terrafusion
kubectl rollout status deployment/terrafusion-api -n terrafusion --timeout=120s

# Step 3: Verify rollback (1 minute)
kubectl get destinationrule terrafusion-api-dr-optimized -n terrafusion -o yaml | grep -A5 outlierDetection
# Expected: baseEjectionTime: 30s, consecutiveGatewayErrors: 5, interval: 30s

# Step 4: Notify stakeholders (1 minute)
curl -X POST $SLACK_WEBHOOK_URL \
  -H 'Content-Type: application/json' \
  -d '{"text":"🔄 ROLLBACK COMPLETE: F2 circuit breaker reverted to baseline config"}'
```

**Verify Rollback**:
- [ ] `baseEjectionTime: 30s` (was 15s)
- [ ] `consecutiveGatewayErrors: 5` (was 3)
- [ ] `interval: 30s` (was 10s)
- [ ] Pods restarted successfully (all Running)
- [ ] Error rate returned to baseline (<0.5%)
- [ ] Stakeholders notified (Slack + ticket update)

**Rollback Complete**: _______________ (SRE Engineer) Time: _______________

---

## Success Metrics

| Metric | Baseline | Target | Production Measured | Status |
|--------|----------|--------|---------------------|--------|
| F2 Recovery Time | 75s | ≤60s | **____s** | ⬜ PASS / ⬜ FAIL |
| F2 RI | 0.9317 | ≥0.9500 | **____** | ⬜ PASS / ⬜ FAIL |
| Overall RI | 0.9276 | ~0.9320 | **____** | ⬜ PASS / ⬜ FAIL |
| Error Rate | 0.5% | <0.5% | **____%** | ⬜ PASS / ⬜ FAIL |
| Zero Downtime | N/A | No 503s | **____** | ⬜ PASS / ⬜ FAIL |

---

## Post-Deployment Actions

- [ ] Update `day7_metrics_actual.json` with new F2 values
- [ ] Recalculate Overall RI (python calculate_ri.py)
- [ ] Generate Week 2 progress report (Day 8 complete)
- [ ] Update `DAY_8_TASK1_COMPLETE.md` with production results
- [ ] Archive artifacts: `out/day8-f2-production/*.{md,json,png}`
- [ ] Close change ticket (TFOS-2025-1008-F2)
- [ ] Conduct post-mortem if any issues encountered

---

## Approvals

| Role | Name | Signature | Date |
|------|------|-----------|------|
| **Change Owner** (Platform Engineer) | _______________ | _______________ | _______ |
| **Approver 1** (Platform Lead) | _______________ | _______________ | _______ |
| **Approver 2** (SRE Lead) | _______________ | _______________ | _______ |
| **On-Call SRE** (Deployment Executor) | _______________ | _______________ | _______ |

---

## Contacts (24/7 Availability)

| Role | Name | Phone | Slack |
|------|------|-------|-------|
| Change Owner | _______________ | _______________ | @_________ |
| On-Call SRE (Primary) | _______________ | _______________ | @_________ |
| On-Call SRE (Backup) | _______________ | _______________ | @_________ |
| Platform Lead | _______________ | _______________ | @_________ |
| Product Manager | _______________ | _______________ | @_________ |

---

## Reference Documents

- **Deployment Runbook**: `ops/tests/chaos/DAY_8_MEASURED_DEPLOYMENT_RUNBOOK.md`
- **Production Checklist**: `ops/tests/chaos/DAY_8_PRODUCTION_CHECKLIST.md`
- **Quick Start Guide**: `ops/tests/chaos/DAY_8_TASK1_QUICK_START.md`
- **Circuit Breaker Config**: `ops/tests/chaos/configs/circuit-breaker-config.yaml`
- **Alert Pack**: `ops/tests/chaos/monitoring/f2-recovery.alerts.yaml`
- **Grafana Dashboard**: https://grafana.terrafusion.ai/d/chaos-f2-recovery
- **Prometheus**: https://prometheus.terrafusion.ai

---

## Notes

**Staging Results Summary**: _______________ (attach staging ri_report.md)

**Risk Assessment**: LOW  
- Staged deployment (staging → 24h soak → production)
- <5min rollback at every phase
- Proven behavior in staging (24h+ soak)
- Zero user-facing changes
- Comprehensive monitoring

**Business Impact**: NONE  
- Internal circuit breaker optimization
- No API changes, no schema changes
- Improves resilience during fault scenarios

**Compliance**: N/A (internal infrastructure change)

---

**Change Card Version**: 1.0  
**Created**: 2025-10-07  
**Last Updated**: 2025-10-07  
**Status**: READY FOR APPROVAL
