# ============================================================================
# Day 8 - F2 Circuit Breaker Tuning - Quick Start Guide
# ============================================================================
# Objective: Reduce F2 recovery time from 75s → <60s
# Duration: ~6 hours (2h config + 3h testing + 1h validation)
# Expected F2 RI: 0.9317 → 0.9500
# ============================================================================

## Quick Summary

**Problem:** F2 packet loss test shows 75s recovery time (target: <60s)  
**Root Cause:** Circuit breaker half-open timeout too long (30s)  
**Solution:** Tune circuit breaker for faster recovery (baseEjectionTime: 30s → 15s)

---

## Circuit Breaker Configuration Changes

### Current (Day 7)
```yaml
outlierDetection:
  consecutiveGatewayErrors: 5
  interval: 30s
  baseEjectionTime: 30s
  maxEjectionPercent: 50
```

### Optimized (Day 8)
```yaml
outlierDetection:
  consecutiveGatewayErrors: 3      # Fail faster
  interval: 10s                     # Detect failures sooner
  baseEjectionTime: 15s             # Attempt recovery faster
  maxEjectionPercent: 50            # Maintain capacity
  splitExternalLocalOriginErrors: true
```

### Expected Impact
- Failure detection: 30s → 10s (**20s improvement**)
- Recovery retry: 30s → 15s (**15s improvement**)
- Total recovery: 75s → ~45-55s (**20-30s improvement**)

---

## Step-by-Step Execution

### Step 1: Deploy Circuit Breaker Configuration (30 minutes)

```bash
# Navigate to project root
cd /path/to/terrafusion_os_1.0

# Make deployment script executable
chmod +x ops/tests/chaos/scripts/day8-deploy-circuit-breaker.sh

# Deploy optimized circuit breaker to staging
bash ops/tests/chaos/scripts/day8-deploy-circuit-breaker.sh

# Expected output:
# ✅ Kubernetes cluster accessible
# ✅ Namespace terrafusion ready
# ✅ Istio installed
# ✅ Backup saved to ops/tests/chaos/backups/day8-YYYYMMDD-HHMMSS
# ✅ Circuit breaker configuration deployed
# ✅ Staging subset configured
```

### Step 2: Validate Configuration (5 minutes)

```bash
# Verify DestinationRule deployed
kubectl get destinationrule terrafusion-api-dr-optimized -n terrafusion -o yaml

# Check circuit breaker settings
kubectl get destinationrule terrafusion-api-dr-optimized -n terrafusion \
  -o jsonpath='{.spec.trafficPolicy.outlierDetection}' | jq '.'

# Expected output:
# {
#   "baseEjectionTime": "15s",
#   "consecutiveGatewayErrors": 3,
#   "interval": "10s",
#   "maxEjectionPercent": 50,
#   ...
# }
```

### Step 3: Run F2 Chaos Test (45 minutes)

```bash
# Make validation script executable
chmod +x ops/tests/chaos/scripts/day8-validate-f2-recovery.sh

# Set environment variables (adjust for your environment)
export PROMETHEUS_URL="http://localhost:9090"
export API_BASE="http://localhost:8080"

# Run F2 packet loss test with recovery measurement
bash ops/tests/chaos/scripts/day8-validate-f2-recovery.sh

# Expected output:
# ✅ API is healthy
# 🔥 Chaos test started
# [15s] Current error rate: 0.0234
# [30s] Current error rate: 0.0198
# [45s] Current error rate: 0.0087
# [52s] Current error rate: 0.0065
# ✅ Service recovered in 52s
# ✅ Recovery time target met: 52s ≤ 60s
# ✅ F2 RI: 0.9500
# 🎉 F2 Circuit Breaker Tuning: SUCCESS
```

### Step 4: Review Validation Report (5 minutes)

```bash
# Open validation report
cat ops/tests/chaos/results/DAY_8_F2_VALIDATION_REPORT.md

# Key metrics to verify:
# - Recovery time: ≤60s ✅
# - F2 RI: ≥0.9500 ✅
# - P95 latency: <2000ms ✅
# - Error rate: <0.30 ✅
```

### Step 5: Update Overall RI Calculation (10 minutes)

```bash
# Recalculate overall RI with new F2 metrics
python ops/tests/chaos/tools/day7_ri_calculator.py \
  --input ops/tests/chaos/results/day7_metrics_actual.json \
  --out ops/tests/chaos/results/day8_ri

# Check new overall RI
cat ops/tests/chaos/results/day8_ri_report.md

# Expected Overall RI improvement:
# Day 7: 0.9276 (CONDITIONAL GO)
# Day 8: 0.9320+ (still CONDITIONAL GO, closer to GO threshold)
```

---

## Manual Testing (Alternative to Automated Script)

If you prefer manual step-by-step testing:

### 1. Apply Circuit Breaker Config
```bash
kubectl apply -f ops/tests/chaos/configs/circuit-breaker-config.yaml -n terrafusion
kubectl rollout restart deployment/terrafusion-api -n terrafusion
sleep 30  # Wait for pods to restart
```

### 2. Apply Istio Fault Injection (30% packet loss)
```bash
kubectl apply -f ops/tests/chaos/istio/fault-injection-30pct-loss.yaml -n terrafusion
```

### 3. Run k6 Load Test
```bash
k6 run ops/tests/chaos/k6/read-spike.js \
  --duration 30m \
  --vus 50 \
  --env API_BASE="http://localhost:8080"
```

### 4. Monitor Circuit Breaker State
```bash
# In separate terminal, monitor Istio logs
kubectl logs -n istio-system -l app=istiod -f | grep -i "outlier\|circuit"

# Watch pod health
watch kubectl get pods -n terrafusion -l app=terrafusion-api
```

### 5. Remove Fault and Measure Recovery
```bash
# Record timestamp
RECOVERY_START=$(date +%s)

# Remove fault
kubectl delete -f ops/tests/chaos/istio/fault-injection-30pct-loss.yaml -n terrafusion

# Monitor error rate until <1%
# Query Prometheus every 5 seconds
while true; do
  ERROR_RATE=$(curl -s "http://localhost:9090/api/v1/query?query=sum(rate(http_requests_total{status=~\"5..\"}[1m]))/sum(rate(http_requests_total[1m]))" | jq -r '.data.result[0].value[1]')
  ELAPSED=$(($(date +%s) - RECOVERY_START))
  echo "[${ELAPSED}s] Error rate: $ERROR_RATE"
  [ $(echo "$ERROR_RATE < 0.01" | bc -l) -eq 1 ] && break
  sleep 5
done

echo "Recovery time: ${ELAPSED}s"
```

### 6. Collect Metrics from Prometheus

```bash
# P95 latency during chaos (last 30 minutes)
curl -s "http://localhost:9090/api/v1/query?query=histogram_quantile(0.95,sum(rate(http_request_duration_seconds_bucket[30m]))by(le))" | jq -r '.data.result[0].value[1]'

# Error rate during chaos
curl -s "http://localhost:9090/api/v1/query?query=sum(rate(http_requests_total{status=~\"5..\"}[30m]))/sum(rate(http_requests_total[30m]))" | jq -r '.data.result[0].value[1]'
```

---

## Success Criteria

✅ **Recovery Time:** ≤60s (improved from 75s)  
✅ **F2 RI:** ≥0.9500 (improved from 0.9317)  
✅ **P95 Latency:** <2000ms during chaos  
✅ **Error Rate:** <30% during chaos  
✅ **Data Integrity:** 0 errors  
✅ **No Production Impact:** All changes tested in staging first

---

## Rollback Procedure

If circuit breaker causes issues:

```bash
# Rollback to original configuration
kubectl apply -f ops/tests/chaos/backups/day8-YYYYMMDD-HHMMSS/destinationrules-backup.yaml

# Restart pods
kubectl rollout restart deployment/terrafusion-api -n terrafusion

# Verify rollback (should show original values)
kubectl get destinationrule terrafusion-api-dr-optimized -n terrafusion \
  -o jsonpath='{.spec.trafficPolicy.outlierDetection}' | jq '.'
```

Rollback time: **<5 minutes**

---

## Expected Timeline

| Phase | Duration | Status |
|-------|----------|--------|
| Configuration deployment | 30 min | ⏳ In Progress |
| Configuration validation | 5 min | ⏳ Pending |
| F2 chaos test execution | 45 min | ⏳ Pending |
| Recovery measurement | 5 min | ⏳ Pending |
| Report generation | 10 min | ⏳ Pending |
| RI recalculation | 10 min | ⏳ Pending |
| **Total** | **~2 hours** | |

---

## Troubleshooting

### Issue: DestinationRule not applying
```bash
# Check for conflicts
kubectl get destinationrules -n terrafusion

# Verify Istio pilot logs
kubectl logs -n istio-system -l app=istiod --tail=100 | grep -i error

# Force reconciliation
kubectl delete destinationrule terrafusion-api-dr-optimized -n terrafusion
kubectl apply -f ops/tests/chaos/configs/circuit-breaker-config.yaml -n terrafusion
```

### Issue: Recovery time still >60s
```bash
# Further tuning options:
# - Reduce baseEjectionTime to 10s
# - Reduce interval to 5s
# - Reduce consecutiveGatewayErrors to 2

# Edit configuration
kubectl edit destinationrule terrafusion-api-dr-optimized -n terrafusion

# Update outlierDetection section, then save
```

### Issue: Prometheus metrics not available
```bash
# Check Prometheus is running
kubectl get pods -n istio-system -l app=prometheus

# Port-forward if needed
kubectl port-forward -n istio-system svc/prometheus 9090:9090

# Verify metrics collection
curl http://localhost:9090/api/v1/query?query=up
```

---

## Next Steps After Success

1. ✅ Mark Task 1 complete
2. ➡️ Begin Task 2: Enhanced Monitoring Alerts
3. Prepare for Day 9 error rate optimizations (F1, F4, F6, F7)
4. Document lessons learned for production rollout

---

## Reference Files

- **Circuit Breaker Config:** `ops/tests/chaos/configs/circuit-breaker-config.yaml`
- **Deployment Script:** `ops/tests/chaos/scripts/day8-deploy-circuit-breaker.sh`
- **Validation Script:** `ops/tests/chaos/scripts/day8-validate-f2-recovery.sh`
- **Fault Injection:** `ops/tests/chaos/istio/fault-injection-30pct-loss.yaml`
- **k6 Test:** `ops/tests/chaos/k6/read-spike.js`
- **Metrics File:** `ops/tests/chaos/results/day7_metrics_actual.json`
- **RI Calculator:** `ops/tests/chaos/tools/day7_ri_calculator.py`

---

## Day 7 → Day 8 Comparison

| Metric | Day 7 | Day 8 Target | Improvement |
|--------|-------|--------------|-------------|
| F2 Recovery Time | 75s | ≤60s | ≥15s faster |
| F2 RI | 0.9317 | ≥0.9500 | +0.0183 |
| Overall RI | 0.9276 | ~0.9320 | +0.0044 |
| Circuit Breaker Half-Open | 30s | 15s | 50% faster |
| Failure Detection Interval | 30s | 10s | 67% faster |

**Projected Overall RI after all Day 8-10 work: 0.9461** (approaching GO threshold 0.95)

---

Generated: $(date)  
Task: Day 8 Task 1 - F2 Circuit Breaker Tuning  
Owner: Week 2 Remediation Team
