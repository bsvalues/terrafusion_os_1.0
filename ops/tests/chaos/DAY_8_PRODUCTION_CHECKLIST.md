# ============================================================================
# Day 8 F2 Circuit Breaker - Production Change Checklist
# ============================================================================
# Purpose: Staged rollout checklist (staging → 24h soak → production)
# Owner: SRE Team + Chaos Engineering
# Risk Level: LOW (staged deployment, <5min rollback)
# ============================================================================

## Overview

**Objective:** Deploy circuit breaker optimization to reduce F2 recovery time from 75s → <60s  
**Change Type:** Configuration change (Istio DestinationRule)  
**Blast Radius:** Single service (terrafusion-api), staged rollout  
**Rollback Time:** <5 minutes (automated ConfigMap + kubectl apply)

---

## Phase 0: Pre-Flight Checks (15 minutes)

### Change Control
- [ ] Change window booked in PagerDuty (owner: `________`)
- [ ] On-call engineer notified and available (name: `________`)
- [ ] Stakeholders notified (leadership, product, support)
- [ ] Rollback owner identified (name: `________`)

### Backup Verification
- [ ] Rollback ConfigMap present: `kubectl get configmap circuit-breaker-rollback-config -n terrafusion`
- [ ] Backup script tested: `bash ops/tests/chaos/scripts/day8-deploy-circuit-breaker.sh --preflight`
- [ ] Original DestinationRule exported: `ops/tests/chaos/backups/day8-YYYYMMDD-HHMMSS/`

### Traffic Generation Freeze
- [ ] k6 load test seed frozen for repeatability
- [ ] Baseline metrics captured (P95, error rate, recovery time)
- [ ] Grafana dashboard prepared: https://grafana.terrafusion.local/d/chaos-f2/

### Monitoring Readiness
- [ ] Prometheus scraping enabled for circuit breaker metrics
- [ ] Alert rules loaded (dry-run): `kubectl apply --dry-run=client -f monitoring/f2-recovery.alerts.yaml`
- [ ] Slack webhook tested: `curl -X POST <WEBHOOK_URL> -d '{"text":"Day 8 test"}'`
- [ ] PagerDuty integration key configured (optional)

**Pass Gate:** All checkboxes above must be ✅ before proceeding

---

## Phase 1: Deploy to Staging (30 minutes)

### Step 1.1: Pre-Deployment Health Check (5 min)
```bash
# Verify staging cluster accessible
kubectl cluster-info --context staging

# Check current DestinationRule status
kubectl get destinationrule terrafusion-api-dr -n terrafusion -o yaml

# Verify no existing alerts firing
kubectl get prometheusrules -n terrafusion-monitoring
```

**Pass Gate:**
- [ ] Staging cluster reachable
- [ ] Current DestinationRule exists and is healthy
- [ ] No critical alerts firing

### Step 1.2: Deploy Circuit Breaker Configuration (10 min)
```bash
# Run deployment with preflight checks
bash ops/tests/chaos/scripts/day8-deploy-circuit-breaker.sh \
  --env staging \
  --preflight \
  --backup

# Apply configuration
bash ops/tests/chaos/scripts/day8-deploy-circuit-breaker.sh \
  --env staging \
  --apply
```

**Expected Output:**
```
✅ Kubernetes cluster accessible
✅ Namespace terrafusion ready
✅ Istio installed
✅ Backup saved to ops/tests/chaos/backups/day8-YYYYMMDD-HHMMSS
✅ Circuit breaker configuration deployed
```

**Pass Gate:**
- [ ] DestinationRule applied successfully
- [ ] New subsets (staging/production) visible: `kubectl get destinationrule terrafusion-api-dr-optimized -n terrafusion -o yaml`
- [ ] Health probes green (no 5xx spike >0.5% during rollout)
- [ ] Rollback artifact written to `ops/tests/chaos/backups/`

**Rollback Command (if needed):**
```bash
bash ops/tests/chaos/scripts/day8-deploy-circuit-breaker.sh --env staging --rollback
```

### Step 1.3: Verify Configuration Propagation (5 min)
```bash
# Check circuit breaker settings
kubectl get destinationrule terrafusion-api-dr-optimized -n terrafusion \
  -o jsonpath='{.spec.trafficPolicy.outlierDetection}' | jq '.'

# Verify Istio pilot recognized changes
kubectl logs -n istio-system -l app=istiod --tail=50 | grep -i "outlier\|circuit"

# Check pod status (no restarts from config change)
kubectl get pods -n terrafusion -l app=terrafusion-api
```

**Pass Gate:**
- [ ] `baseEjectionTime: "15s"` confirmed
- [ ] `consecutiveGatewayErrors: 3` confirmed
- [ ] `interval: "10s"` confirmed
- [ ] No pod restarts or CrashLoopBackOff
- [ ] Istio pilot logs show no errors

**Observation Period:** Wait 10 minutes, monitor for anomalies

---

## Phase 2: Validate F2 in Staging (45 minutes)

### Step 2.1: Run Automated F2 Chaos Test (30 min)
```bash
# Set environment variables
export PROMETHEUS_URL="http://staging-prometheus:9090"
export API_BASE="http://staging-api:8080"
export KUBE_CONTEXT="staging"

# Execute F2 validation test
bash ops/tests/chaos/scripts/day8-validate-f2-recovery.sh \
  --env staging \
  --fault F2 \
  --duration 10m \
  --report out/day8-f2-staging
```

**Test Parameters:**
- Fault: 30% packet loss (Istio abort)
- Duration: 10 minutes
- Load: 50 virtual users (k6)
- Metrics collection: Real-time Prometheus queries

**Expected Output:**
```
✅ API is healthy
🔥 Chaos test started at 2025-10-07 14:30:00
[10s] Current error rate: 0.0234
[25s] Current error rate: 0.0198
[40s] Current error rate: 0.0087
[52s] Current error rate: 0.0065
✅ Service recovered in 52s
✅ Recovery time target met: 52s ≤ 60s
✅ F2 RI: 0.9500
🎉 F2 Circuit Breaker Tuning: SUCCESS
```

### Step 2.2: Acceptance Criteria Validation (10 min)

**MUST MEET ALL** (GO/NO-GO decision):

- [ ] **Recovery time ≤ 60s** (target: 45-55s)
  - Measured: `______s`
  - Status: ✅ PASS / ❌ FAIL
  
- [ ] **F2 RI ≥ 0.9500**
  - Measured: `______`
  - Status: ✅ PASS / ❌ FAIL
  
- [ ] **Error rate under fault < 1.0%**
  - Measured: `______%`
  - Status: ✅ PASS / ❌ FAIL
  
- [ ] **Data integrity errors = 0**
  - Measured: `______` errors
  - Status: ✅ PASS / ❌ FAIL
  
- [ ] **P95 after recovery ≤ 500ms within 60s**
  - Measured: `______ms` at `______s`
  - Status: ✅ PASS / ❌ FAIL

**IF ANY FAIL:**
```bash
# Immediate rollback
bash ops/tests/chaos/scripts/day8-deploy-circuit-breaker.sh --env staging --rollback

# Capture artifacts for investigation
kubectl logs -n terrafusion -l app=terrafusion-api --tail=500 > out/day8/staging-failure-logs.txt
kubectl get events -n terrafusion --sort-by='.lastTimestamp' > out/day8/staging-events.txt
```

### Step 2.3: Review Validation Report (5 min)
```bash
# Open generated report
cat out/day8-f2-staging/ri_report.md

# Check individual fault scores
cat out/day8-f2-staging/ri_per_fault.csv | grep F2

# Verify metrics JSON updated
jq '.faults.F2.measured' out/day8-f2-staging/metrics_actual.json
```

**Pass Gate:**
- [ ] Validation report shows all ✅ PASS
- [ ] F2 RI ≥ 0.9500 confirmed in CSV
- [ ] No anomalies in Istio/k8s logs
- [ ] Screenshots captured for documentation

---

## Phase 3: Enable Enhanced Monitoring (40 minutes)

### Step 3.1: Deploy F2-Specific Alert Rules (10 min)
```bash
# Apply F2 recovery alert rules
kubectl apply -f ops/tests/chaos/monitoring/f2-recovery.alerts.yaml

# Verify PrometheusRule created
kubectl get prometheusrule f2-recovery-alerts -n terrafusion-monitoring

# Check alert rules loaded in Prometheus
curl -s http://staging-prometheus:9090/api/v1/rules | jq '.data.groups[] | select(.name=="f2_recovery_monitoring")'
```

**Alerts Deployed:**
- [ ] `F2_Recovery_Slow` (recovery >60s for 2min)
- [ ] `CB_Flap` (circuit opens/closes >3 times/10min)
- [ ] `F2_Error_Rate_High` (5xx >1% for 2min)
- [ ] `CB_Stuck_Open` (circuit open >5min)
- [ ] `F2_Data_Integrity_Error` (any data errors)
- [ ] `F2_Recovery_Latency_Spike` (P95 >500ms during recovery)

### Step 3.2: Configure Notification Channels (15 min)

**Slack Integration:**
```bash
# Create Slack webhook secret
kubectl create secret generic slack-webhook \
  --from-literal=url='https://hooks.slack.com/services/YOUR_WEBHOOK' \
  -n terrafusion-monitoring \
  --dry-run=client -o yaml | kubectl apply -f -

# Apply Slack config
kubectl apply -f ops/tests/chaos/monitoring/f2-recovery.alerts.yaml
```

**Test Slack notification:**
```bash
# Trigger test alert (manual Prometheus API call)
curl -X POST http://staging-prometheus:9090/api/v1/alerts \
  -d 'alert=F2_Recovery_Slow&value=65&severity=warning'

# Verify message received in #terrafusion-chaos-alerts
```

**PagerDuty Integration (Optional):**
```bash
# Create PagerDuty integration key secret
kubectl create secret generic pagerduty-key \
  --from-literal=routing_key='YOUR_PAGERDUTY_INTEGRATION_KEY' \
  -n terrafusion-monitoring \
  --dry-run=client -o yaml | kubectl apply -f -

# Test PagerDuty integration
curl -X POST https://events.pagerduty.com/v2/enqueue \
  -H 'Content-Type: application/json' \
  -d '{
    "routing_key": "YOUR_KEY",
    "event_action": "trigger",
    "payload": {
      "summary": "Day 8 F2 Test Alert",
      "severity": "warning",
      "source": "terrafusion-staging"
    }
  }'
```

### Step 3.3: Verify Alert Fidelity (15 min)

**Test alert firing with simulated error spike:**
```bash
# Temporarily increase error rate threshold to force alert
kubectl patch prometheusrule f2-recovery-alerts -n terrafusion-monitoring --type=json \
  -p='[{"op": "replace", "path": "/spec/groups/0/rules/2/expr", "value": "0.001"}]'

# Wait 2-3 minutes for alert to fire
# Verify alert appears in:
# 1. Prometheus UI: http://staging-prometheus:9090/alerts
# 2. Slack: #terrafusion-chaos-alerts
# 3. PagerDuty (if configured)

# Restore original threshold
kubectl patch prometheusrule f2-recovery-alerts -n terrafusion-monitoring --type=json \
  -p='[{"op": "replace", "path": "/spec/groups/0/rules/2/expr", "value": "0.01"}]'
```

**Pass Gate:**
- [ ] Alert fired within 3 minutes
- [ ] Slack notification received with correct severity
- [ ] PagerDuty incident created (if configured)
- [ ] Alert auto-resolved after threshold restored
- [ ] No false positives observed

---

## Phase 4: 24-Hour Staging Soak (no rush)

### Day 1: Light Background Traffic (Oct 7 evening)
```bash
# Start low-intensity background load test
k6 run ops/tests/chaos/k6/read-steady.js \
  --duration 24h \
  --vus 10 \
  --env API_BASE="http://staging-api:8080" \
  --out json=out/day8/soak/k6-background.json &

# Monitor for anomalies (keep chaos tests OFF)
watch kubectl get pods -n terrafusion -l app=terrafusion-api
```

**Observation Checklist (check every 4 hours):**
- [ ] 4h: Circuit breaker state (should remain CLOSED)
- [ ] 8h: Error rate stable (should be <0.1%)
- [ ] 12h: P95 latency stable (should be <500ms)
- [ ] 16h: No pod restarts or resource exhaustion
- [ ] 20h: CPU/memory usage within normal ranges
- [ ] 24h: Final health check before production decision

**Watch for:**
- ❌ Circuit breaker flapping (opens/closes repeatedly)
- ❌ Tail latency increase (P99 >1s sustained)
- ❌ Any increase in 429 (rate limit) or 503 (service unavailable)
- ❌ Memory leaks in Istio sidecar
- ❌ Connection pool exhaustion

### Day 2 Morning: Soak Analysis (Oct 8 morning)
```bash
# Export Grafana panels
curl -H "Authorization: Bearer $GRAFANA_API_KEY" \
  "https://grafana.staging/api/dashboards/uid/chaos-f2" \
  > out/day8/soak/grafana-f2-dashboard.json

# Export Jaeger traces (sample 100 requests)
curl "http://staging-jaeger:16686/api/traces?service=terrafusion-api&limit=100" \
  > out/day8/soak/jaeger-traces.json

# Generate soak summary report
python ops/tests/chaos/tools/soak-analysis.py \
  --input out/day8/soak/ \
  --output out/day8/soak/SOAK_SUMMARY.md
```

**Soak Summary Must Show:**
- [ ] 0 circuit breaker flapping incidents
- [ ] P95 recovery time consistently ≤55s
- [ ] F2 RI stable at ≥0.9500
- [ ] No memory/CPU drift
- [ ] Error rate <0.1% sustained

**Decision Point: Approve Production?**
- ✅ **YES** - All metrics stable, proceed to Phase 5
- ❌ **NO** - Further tuning required, extend soak or adjust config

---

## Phase 5: Production Change Window (Oct 8 or 9)

### Step 5.1: Pre-Production Checklist (15 min)

**Change Control:**
- [ ] Production change window booked (date: `________`, time: `________`)
- [ ] On-call engineer confirmed for change window (name: `________`)
- [ ] Rollback owner on standby (name: `________`)
- [ ] Incident bridge dial-in ready (link: `________`)

**Configuration Validation:**
- [ ] Staging soak summary approved by SRE lead
- [ ] Production DestinationRule backup taken
- [ ] Production rollback procedure tested in staging
- [ ] Production monitoring alerts configured (same as staging)

**Communication:**
- [ ] Leadership notified of change window
- [ ] Support team briefed on expected behavior
- [ ] Customer success team notified (if user-facing)
- [ ] Status page prepared (if public change)

### Step 5.2: Deploy to Production (20 min)
```bash
# Set production context
export KUBE_CONTEXT="production"
export PROMETHEUS_URL="http://prod-prometheus:9090"
export API_BASE="https://api.terrafusion.com"

# Pre-flight checks
bash ops/tests/chaos/scripts/day8-deploy-circuit-breaker.sh \
  --env production \
  --preflight \
  --backup

# Apply configuration
bash ops/tests/chaos/scripts/day8-deploy-circuit-breaker.sh \
  --env production \
  --apply

# Wait for propagation
sleep 30

# Quick health check
kubectl get pods -n terrafusion -l app=terrafusion-api
kubectl get destinationrule terrafusion-api-dr-optimized -n terrafusion -o yaml
```

**Pass Gate:**
- [ ] DestinationRule applied without errors
- [ ] No pod restarts during deployment
- [ ] Health endpoints returning 200
- [ ] Error rate <0.1% during rollout

### Step 5.3: Quick F2 Validation in Production (10 min)
```bash
# Run abbreviated F2 test (5-10 min duration)
bash ops/tests/chaos/scripts/day8-validate-f2-recovery.sh \
  --env production \
  --fault F2 \
  --duration 5m \
  --report out/day8-f2-production
```

**Acceptance Criteria (same as staging):**
- [ ] Recovery time ≤ 60s
- [ ] F2 RI ≥ 0.9500
- [ ] Error rate < 1.0%
- [ ] Data integrity errors = 0

**If ANY fail:**
```bash
# Immediate rollback (<5min)
bash ops/tests/chaos/scripts/day8-deploy-circuit-breaker.sh --env production --rollback

# Notify incident bridge
echo "ROLLBACK INITIATED - Circuit breaker change failed validation" | \
  slack-cli post --channel="#terrafusion-incidents"
```

### Step 5.4: 60-Minute Production Observation (1 hour)

**Real-time monitoring checklist (every 15 min):**
- [ ] T+15min: Circuit breaker state healthy (CLOSED or half-open expected behavior)
- [ ] T+30min: Error rate stable (<0.1%)
- [ ] T+45min: P95 latency stable (<500ms)
- [ ] T+60min: No user-reported issues, no alerts firing

**Monitoring dashboards:**
- Grafana: https://grafana.terrafusion.com/d/chaos-f2/
- Prometheus alerts: http://prometheus:9090/alerts
- Jaeger traces: http://jaeger:16686/search?service=terrafusion-api

**Pass Gate (T+60min):**
- [ ] All metrics within expected ranges
- [ ] No alerts fired
- [ ] No user-reported issues
- [ ] Support queue normal
- [ ] On-call engineer confirms stable

### Step 5.5: Change Window Close (5 min)
```bash
# Final health check
kubectl get pods -n terrafusion -l app=terrafusion-api
kubectl top pods -n terrafusion -l app=terrafusion-api

# Capture final metrics
curl -s "$PROMETHEUS_URL/api/v1/query?query=f2:recovery_time_seconds" | jq '.'

# Update change ticket
echo "Production deployment complete and validated" > out/day8/production-deployment-complete.txt
```

**Change Control:**
- [ ] Change ticket updated with successful deployment
- [ ] Rollback owner released
- [ ] On-call engineer monitoring continues for 24h
- [ ] Team notified of successful change

---

## Phase 6: Post-Deployment Documentation (30 min)

### Update DAY_8_TASK1_COMPLETE.md
```bash
# Add staging screenshots
cp out/day8-f2-staging/*.png docs/day8/screenshots/

# Add 24h soak summary
cat out/day8/soak/SOAK_SUMMARY.md >> DAY_8_TASK1_COMPLETE.md

# Document production deployment
cat >> DAY_8_TASK1_COMPLETE.md << EOF

## Production Deployment Summary

**Date:** $(date)
**Environment:** Production
**Change Window:** [START_TIME] - [END_TIME]

### Validation Results
- Recovery Time: [ACTUAL]s (target: ≤60s) ✅
- F2 RI: [ACTUAL] (target: ≥0.9500) ✅
- Error Rate: [ACTUAL]% (target: <1.0%) ✅
- Data Integrity: 0 errors ✅

### 24h Soak Results (Staging)
- Circuit Breaker Flapping: 0 incidents
- P95 Recovery Time: [AVERAGE]s (min: [MIN]s, max: [MAX]s)
- F2 RI: [AVERAGE] (stable ±0.01)
- No anomalies detected

### Production Observation (60min)
- Error Rate: Stable at [ACTUAL]%
- P95 Latency: Stable at [ACTUAL]ms
- Circuit Breaker State: Healthy (CLOSED)
- User Impact: None
- Alerts Fired: 0

**Status:** ✅ PRODUCTION DEPLOYMENT SUCCESSFUL
EOF
```

### Generate Week 2 Progress Update
```bash
# Recalculate overall RI with new F2 metrics
python ops/tests/chaos/tools/day7_ri_calculator.py \
  --input out/day8-f2-production/metrics_actual.json \
  --out out/day8/overall_ri

# Create progress summary
cat > out/day8/WEEK_2_PROGRESS.md << EOF
# Week 2 Day 8 - Progress Update

## Tasks Completed
- ✅ Task 1: F2 Circuit Breaker Tuning
- ✅ Task 2: Enhanced Monitoring Alerts
- ✅ Task 3: F2 Validation (Staging + Production)

## RI Improvement
- Day 7 Overall RI: 0.9276
- Day 8 Overall RI: [CALCULATED]
- Improvement: +[DELTA]

## Next Steps
- Day 9: F1, F4 Error Rate Optimization
- Day 10: F6, F7 Error Rate Optimization + Final Validation
- Days 11-13: PROD-0 Preparation

**Week 2 Target:** Overall RI ≥0.9461 by Day 10
**Current Status:** [ON_TRACK / AT_RISK / AHEAD]
EOF
```

---

## Rollback Procedures

### Emergency Rollback (<5 minutes)

**Staging:**
```bash
bash ops/tests/chaos/scripts/day8-deploy-circuit-breaker.sh --env staging --rollback
kubectl rollout restart deployment/terrafusion-api -n terrafusion
```

**Production:**
```bash
bash ops/tests/chaos/scripts/day8-deploy-circuit-breaker.sh --env production --rollback
kubectl rollout restart deployment/terrafusion-api -n terrafusion

# Notify incident bridge
slack-cli post --channel="#terrafusion-incidents" \
  --text="PRODUCTION ROLLBACK COMPLETE - Circuit breaker reverted to original config"
```

**Verify Rollback:**
```bash
# Check DestinationRule values reverted
kubectl get destinationrule terrafusion-api-dr-optimized -n terrafusion \
  -o jsonpath='{.spec.trafficPolicy.outlierDetection}' | jq '.'

# Expected values:
# - baseEjectionTime: "30s" (reverted from 15s)
# - consecutiveGatewayErrors: 5 (reverted from 3)
# - interval: "30s" (reverted from 10s)
```

---

## Success Criteria Summary

| Phase | Criteria | Status | Notes |
|-------|----------|--------|-------|
| **0. Pre-Flight** | All checks ✅ | ⬜ | Must complete before Phase 1 |
| **1. Staging Deploy** | Config applied, health green | ⬜ | <30 min |
| **2. F2 Validation** | Recovery ≤60s, RI ≥0.9500 | ⬜ | <45 min |
| **3. Monitoring** | Alerts firing correctly | ⬜ | <40 min |
| **4. Soak Test** | 24h stable, no anomalies | ⬜ | 24 hours |
| **5. Production** | Same as staging, 60min observe | ⬜ | <2 hours |
| **6. Documentation** | Complete, screenshots attached | ⬜ | <30 min |

**Overall Timeline:** 2 days (Day 1: staging + soak start, Day 2: soak analysis + production)

---

## Contacts

| Role | Name | Slack | Phone | Escalation |
|------|------|-------|-------|------------|
| Change Owner | `________` | @________ | `________` | - |
| On-Call SRE | `________` | @________ | `________` | PagerDuty |
| Rollback Owner | `________` | @________ | `________` | - |
| Engineering Lead | `________` | @________ | `________` | If GO/NO-GO needed |
| Product Manager | `________` | @________ | `________` | For user impact |

---

**Generated:** October 7, 2025  
**Owner:** Week 2 Day 8 Team  
**Status:** Ready for execution  
**Risk Level:** LOW (staged deployment, <5min rollback)
