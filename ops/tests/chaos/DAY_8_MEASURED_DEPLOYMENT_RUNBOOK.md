# Day 8 F2 Circuit Breaker - Measured Deployment Runbook

**"Measure twice, cut once" - Staged rollout for production excellence**

---

## 🎯 Quick Nav

| Phase | Duration | Page |
|-------|----------|------|
| [0. Pre-Flight](#phase-0-pre-flight) | 15 min | Quick start below |
| [1. Staging Deploy](#phase-1-staging-deployment) | 30 min | Copy-paste commands |
| [2. F2 Validation](#phase-2-f2-validation) | 45 min | Automated test |
| [3. Monitoring](#phase-3-enhanced-monitoring) | 40 min | Alert deployment |
| [4. 24h Soak](#phase-4-24-hour-soak) | 24 hours | Observation only |
| [5. Production](#phase-5-production-deployment) | 2 hours | Final deployment |

**Total Timeline:** 2 days (today: staging + monitoring, tomorrow: production after soak)

---

## 📋 Today's Runbook (Copy/Paste Order)

### Phase 0: Pre-Flight (15 min)

```bash
# Navigate to project root
cd C:\Users\bsval\terrafusion_os_1.0

# Verify prerequisites
kubectl cluster-info --context staging
python --version  # Should be 3.12+
git status  # Should be clean, on main branch

# Check backups directory exists
mkdir -p ops/tests/chaos/backups

# Confirm rollback ConfigMap present
kubectl get configmap circuit-breaker-rollback-config -n terrafusion --context staging || echo "Will be created on deployment"

# Freeze traffic gen seed for repeatability
export K6_SEED=42
export CHAOS_TEST_DATE="2025-10-07"
```

**Change window booking (manual):**
- [ ] Book change window in PagerDuty (owner: `________`)
- [ ] Notify on-call engineer (name: `________`)
- [ ] Capture baseline metrics from Grafana

---

### Phase 1: Staging Deployment (30 min)

```bash
# Set staging environment
export KUBE_CONTEXT="staging"
export NAMESPACE="terrafusion"

# Run pre-flight checks
bash ops/tests/chaos/scripts/day8-deploy-circuit-breaker.sh

# Expected output:
# ✅ Kubernetes cluster accessible
# ✅ Namespace terrafusion ready
# ✅ Istio installed
# ✅ Backup saved to ops/tests/chaos/backups/day8-YYYYMMDD-HHMMSS

# Verify deployment
kubectl get destinationrule terrafusion-api-dr-optimized -n terrafusion -o yaml

# Check circuit breaker settings
kubectl get destinationrule terrafusion-api-dr-optimized -n terrafusion \
  -o jsonpath='{.spec.trafficPolicy.outlierDetection}' | jq '.'

# Should show:
# {
#   "baseEjectionTime": "15s",
#   "consecutiveGatewayErrors": 3,
#   "interval": "10s",
#   "maxEjectionPercent": 50,
#   ...
# }

# Wait for propagation (30 seconds)
sleep 30

# Verify no errors in Istio pilot
kubectl logs -n istio-system -l app=istiod --tail=50 | grep -i "error" || echo "No errors found"
```

**Pass Gate:**
- [ ] DestinationRule applied successfully
- [ ] `baseEjectionTime: "15s"` confirmed
- [ ] `consecutiveGatewayErrors: 3` confirmed
- [ ] No pod restarts or errors

**If deployment fails:**
```bash
# Rollback immediately
kubectl apply -f ops/tests/chaos/backups/day8-*/destinationrules-backup.yaml
kubectl rollout restart deployment/terrafusion-api -n terrafusion
```

---

### Phase 2: F2 Validation (45 min)

```bash
# Set environment variables
export PROMETHEUS_URL="http://localhost:9090"
export API_BASE="http://localhost:8080"
export KUBE_CONTEXT="staging"

# Make validation script executable
chmod +x ops/tests/chaos/scripts/day8-validate-f2-recovery.sh

# Run F2 validation test (10 minutes duration)
bash ops/tests/chaos/scripts/day8-validate-f2-recovery.sh

# Expected output:
# ✅ API is healthy
# 🔥 Chaos test started at 2025-10-07 14:30:00
# [52s] Current error rate: 0.0065
# ✅ Service recovered in 52s
# ✅ Recovery time target met: 52s ≤ 60s
# ✅ F2 RI: 0.9500
# 🎉 F2 Circuit Breaker Tuning: SUCCESS

# Review validation report
cat ops/tests/chaos/results/DAY_8_F2_VALIDATION_REPORT.md

# Check F2 metrics
jq '.faults.F2.measured' ops/tests/chaos/results/day7_metrics_actual.json
```

**Acceptance Criteria (MUST MEET ALL):**
- [ ] Recovery time ≤ 60s (target: 45-55s) - Measured: `______s`
- [ ] F2 RI ≥ 0.9500 - Measured: `______`
- [ ] Error rate < 1.0% - Measured: `______%`
- [ ] Data integrity errors = 0 - Measured: `______`
- [ ] P95 after recovery ≤ 500ms within 60s

**If ANY fail:**
```bash
# Rollback and capture artifacts
bash ops/tests/chaos/scripts/day8-deploy-circuit-breaker.sh --rollback
kubectl logs -n terrafusion -l app=terrafusion-api --tail=500 > ops/tests/chaos/results/staging-failure-logs.txt

# Investigate before proceeding
echo "VALIDATION FAILED - Review logs and re-tune circuit breaker config"
```

---

### Phase 3: Enhanced Monitoring (40 min)

```bash
# Apply F2 recovery alert rules
kubectl apply -f ops/tests/chaos/monitoring/f2-recovery.alerts.yaml

# Verify PrometheusRule created
kubectl get prometheusrule f2-recovery-alerts -n terrafusion-monitoring

# Check alerts loaded in Prometheus
curl -s http://localhost:9090/api/v1/rules | \
  jq '.data.groups[] | select(.name=="f2_recovery_monitoring")'

# Create Slack webhook secret (replace with your webhook)
kubectl create secret generic slack-webhook \
  --from-literal=url='https://hooks.slack.com/services/YOUR_WEBHOOK' \
  -n terrafusion-monitoring \
  --dry-run=client -o yaml | kubectl apply -f -

# Test Slack notification
curl -X POST $(kubectl get secret slack-webhook -n terrafusion-monitoring -o jsonpath='{.data.url}' | base64 -d) \
  -H 'Content-Type: application/json' \
  -d '{"text":"Day 8 F2 Alert Test - Circuit breaker monitoring active"}'

# Verify message received in Slack channel
```

**Alerts Deployed:**
- [ ] `F2_Recovery_Slow` - Recovery >60s for 2min
- [ ] `CB_Flap` - Circuit opens/closes >3 times/10min
- [ ] `F2_Error_Rate_High` - 5xx >1% for 2min
- [ ] `CB_Stuck_Open` - Circuit open >5min (CRITICAL)
- [ ] `F2_Data_Integrity_Error` - Any data errors (GO/NO-GO blocker)

**Optional: PagerDuty Integration**
```bash
# Create PagerDuty integration key secret
kubectl create secret generic pagerduty-key \
  --from-literal=routing_key='YOUR_PAGERDUTY_INTEGRATION_KEY' \
  -n terrafusion-monitoring \
  --dry-run=client -o yaml | kubectl apply -f -

# Test PagerDuty integration
curl -X POST https://events.pagerduty.com/v2/enqueue \
  -H 'Content-Type: application/json' \
  -d "{
    \"routing_key\": \"$(kubectl get secret pagerduty-key -n terrafusion-monitoring -o jsonpath='{.data.routing_key}' | base64 -d)\",
    \"event_action\": \"trigger\",
    \"payload\": {
      \"summary\": \"Day 8 F2 Test Alert\",
      \"severity\": \"warning\",
      \"source\": \"terrafusion-staging\"
    }
  }"
```

---

### Phase 4: 24-Hour Staging Soak (No Rush)

**Start background load test (Oct 7 evening):**
```bash
# Low-intensity background traffic (NO chaos tests)
k6 run ops/tests/chaos/k6/read-steady.js \
  --duration 24h \
  --vus 10 \
  --env API_BASE="http://localhost:8080" \
  --out json=ops/tests/chaos/results/day8-soak-k6.json &

echo $! > ops/tests/chaos/results/day8-soak-k6.pid
echo "Background load test started (PID: $(cat ops/tests/chaos/results/day8-soak-k6.pid))"
```

**Observation checklist (check every 4 hours):**
```bash
# Circuit breaker state (should remain CLOSED)
kubectl get destinationrule terrafusion-api-dr-optimized -n terrafusion \
  -o jsonpath='{.spec.trafficPolicy.outlierDetection}' | jq '.'

# Error rate (should be <0.1%)
curl -s "http://localhost:9090/api/v1/query?query=sum(rate(http_requests_total{status=~\"5..\"}[5m]))/sum(rate(http_requests_total[5m]))" | \
  jq -r '.data.result[0].value[1] // "0"'

# P95 latency (should be <500ms)
curl -s "http://localhost:9090/api/v1/query?query=histogram_quantile(0.95,sum(rate(http_request_duration_seconds_bucket[5m]))by(le))" | \
  jq -r '.data.result[0].value[1] // "0"'

# Pod health
kubectl get pods -n terrafusion -l app=terrafusion-api

# Resource usage
kubectl top pods -n terrafusion -l app=terrafusion-api
```

**Watch for (RED FLAGS):**
- ❌ Circuit breaker flapping (opens/closes repeatedly)
- ❌ P99 latency >1s sustained
- ❌ Increase in 429 or 503 errors
- ❌ Memory leaks in Istio sidecar
- ❌ Connection pool exhaustion

**Oct 8 morning: Soak analysis:**
```bash
# Stop background load test
kill $(cat ops/tests/chaos/results/day8-soak-k6.pid)

# Export Grafana dashboard
curl -H "Authorization: Bearer $GRAFANA_API_KEY" \
  "https://grafana.staging/api/dashboards/uid/chaos-f2" \
  > ops/tests/chaos/results/day8-soak-grafana.json

# Generate soak summary
python ops/tests/chaos/tools/day7_ri_calculator.py \
  --input ops/tests/chaos/results/day7_metrics_actual.json \
  --out ops/tests/chaos/results/day8-soak-ri

cat ops/tests/chaos/results/day8-soak-ri_report.md
```

**Decision Point: Approve Production?**
- [ ] ✅ 0 circuit breaker flapping incidents
- [ ] ✅ P95 recovery time consistently ≤55s
- [ ] ✅ F2 RI stable at ≥0.9500
- [ ] ✅ No memory/CPU drift
- [ ] ✅ Error rate <0.1% sustained

If ALL ✅ → **Proceed to Phase 5 (Production)**  
If ANY ❌ → **Further tuning required, extend soak or adjust config**

---

### Phase 5: Production Deployment (Oct 8 or 9)

**Pre-production checklist:**
```bash
# Book production change window
# Owner: ________ Date: ________ Time: ________

# Verify staging soak approved
cat ops/tests/chaos/results/day8-soak-ri_report.md | grep "Overall RI"

# Backup production DestinationRule
kubectl get destinationrule terrafusion-api-dr-optimized -n terrafusion \
  --context production -o yaml > ops/tests/chaos/backups/production-dr-backup-$(date +%Y%m%d).yaml
```

**Deploy to production:**
```bash
# Set production context
export KUBE_CONTEXT="production"
export PROMETHEUS_URL="http://prod-prometheus:9090"
export API_BASE="https://api.terrafusion.com"

# Deploy circuit breaker configuration
bash ops/tests/chaos/scripts/day8-deploy-circuit-breaker.sh

# Wait for propagation
sleep 30

# Quick health check
kubectl get pods -n terrafusion -l app=terrafusion-api --context production
kubectl get destinationrule terrafusion-api-dr-optimized -n terrafusion --context production -o yaml
```

**Quick F2 validation in production (5-10 min):**
```bash
# Run abbreviated F2 test
bash ops/tests/chaos/scripts/day8-validate-f2-recovery.sh

# Check results immediately
cat ops/tests/chaos/results/DAY_8_F2_VALIDATION_REPORT.md
```

**If validation fails:**
```bash
# IMMEDIATE ROLLBACK
kubectl apply -f ops/tests/chaos/backups/production-dr-backup-$(date +%Y%m%d).yaml --context production
kubectl rollout restart deployment/terrafusion-api -n terrafusion --context production

# Notify incident bridge
echo "ROLLBACK INITIATED - Circuit breaker change failed production validation" | \
  slack-cli post --channel="#terrafusion-incidents"
```

**60-minute production observation:**
```bash
# Monitor every 15 minutes
watch -n 900 '
  echo "=== T+$(date +%M)min Production Health ==="
  kubectl get pods -n terrafusion -l app=terrafusion-api --context production
  kubectl top pods -n terrafusion -l app=terrafusion-api --context production
  curl -s "$PROMETHEUS_URL/api/v1/query?query=f2:recovery_time_seconds" | jq -r ".data.result[0].value[1] // \"N/A\""
'

# Dashboards to monitor:
# - Grafana: https://grafana.terrafusion.com/d/chaos-f2/
# - Prometheus: http://prometheus:9090/alerts
# - Jaeger: http://jaeger:16686/search?service=terrafusion-api
```

**Pass Gate (T+60min):**
- [ ] All metrics within expected ranges
- [ ] No alerts fired
- [ ] No user-reported issues
- [ ] Support queue normal

**Change window close:**
```bash
# Final health check
kubectl get pods -n terrafusion -l app=terrafusion-api --context production

# Update change ticket
echo "Production deployment complete and validated at $(date)" > \
  ops/tests/chaos/results/production-deployment-complete.txt

# Team notification
slack-cli post --channel="#terrafusion-sre-alerts" \
  --text="✅ Day 8 F2 Circuit Breaker: Production deployment successful. Recovery time: [MEASURED]s, F2 RI: [MEASURED]"
```

---

## 🚨 Emergency Procedures

### Rollback (<5 minutes)

**Staging:**
```bash
kubectl apply -f ops/tests/chaos/backups/day8-*/destinationrules-backup.yaml
kubectl rollout restart deployment/terrafusion-api -n terrafusion
```

**Production:**
```bash
kubectl apply -f ops/tests/chaos/backups/production-dr-backup-$(date +%Y%m%d).yaml --context production
kubectl rollout restart deployment/terrafusion-api -n terrafusion --context production

# Notify team
slack-cli post --channel="#terrafusion-incidents" \
  --text="🚨 PRODUCTION ROLLBACK COMPLETE - Circuit breaker reverted to original config"
```

**Verify rollback:**
```bash
kubectl get destinationrule terrafusion-api-dr-optimized -n terrafusion \
  -o jsonpath='{.spec.trafficPolicy.outlierDetection}' | jq '.'

# Expected (original values):
# - baseEjectionTime: "30s"
# - consecutiveGatewayErrors: 5
# - interval: "30s"
```

---

## 📊 Success Metrics

| Metric | Day 7 Baseline | Day 8 Target | Measured | Status |
|--------|----------------|--------------|----------|--------|
| **F2 Recovery Time** | 75s | ≤60s | `______s` | ⬜ |
| **F2 RI** | 0.9317 | ≥0.9500 | `______` | ⬜ |
| **Overall RI** | 0.9276 | ~0.9320 | `______` | ⬜ |
| **Error Rate** | 0.022 | <0.01 | `______` | ⬜ |
| **Data Integrity** | 0 | 0 | `______` | ⬜ |

---

## 📞 Contacts

| Role | Name | Slack | Escalation |
|------|------|-------|------------|
| Change Owner | `________` | @________ | - |
| On-Call SRE | `________` | @________ | PagerDuty |
| Rollback Owner | `________` | @________ | - |
| Engineering Lead | `________` | @________ | GO/NO-GO decisions |

---

## 📚 Reference Files

- **Circuit Breaker Config:** `ops/tests/chaos/configs/circuit-breaker-config.yaml`
- **Deployment Script:** `ops/tests/chaos/scripts/day8-deploy-circuit-breaker.sh`
- **Validation Script:** `ops/tests/chaos/scripts/day8-validate-f2-recovery.sh`
- **Alert Rules:** `ops/tests/chaos/monitoring/f2-recovery.alerts.yaml`
- **Production Checklist:** `ops/tests/chaos/DAY_8_PRODUCTION_CHECKLIST.md`
- **Quick Start Guide:** `ops/tests/chaos/DAY_8_TASK1_QUICK_START.md`
- **Complete Summary:** `DAY_8_TASK1_COMPLETE.md`

---

## ✅ Next Steps After Success

1. **Update documentation:**
   ```bash
   # Add staging screenshots to summary
   cp ops/tests/chaos/results/day8-*.png DAY_8_TASK1_COMPLETE.md
   
   # Add production results
   cat ops/tests/chaos/results/DAY_8_F2_VALIDATION_REPORT.md >> DAY_8_TASK1_COMPLETE.md
   
   # Commit and push
   git add DAY_8_TASK1_COMPLETE.md ops/tests/chaos/results/
   git commit -m "Day 8 Complete: F2 circuit breaker optimization validated in production"
   git push origin main
   ```

2. **Calculate overall RI improvement:**
   ```bash
   python ops/tests/chaos/tools/day7_ri_calculator.py \
     --input ops/tests/chaos/results/day7_metrics_actual.json \
     --out ops/tests/chaos/results/day8_final_ri
   
   cat ops/tests/chaos/results/day8_final_ri_report.md
   ```

3. **Proceed to Day 9 tasks:**
   - F1 API gateway retry budget optimization
   - F4 Redis connection pool optimization

---

**Generated:** October 7, 2025  
**Owner:** Week 2 Day 8 Team  
**Status:** Ready for staged deployment  
**Risk Level:** LOW (staged deployment, 24h soak, <5min rollback)

**Why this order works:**
- ✅ Honors "measure twice, cut once" philosophy
- ✅ Proves behavior in staging before production
- ✅ Attaches alerts after baseline behavior is known
- ✅ 24h soak catches edge cases and drift
- ✅ Risk envelope stays tiny at every step
- ✅ Rollback <5min at every phase
- ✅ Still hits Week 2 target (RI ≥0.9461) without jeopardizing P0 items

**Remember:** *Boring is beautiful in production deployments.* 🎯
