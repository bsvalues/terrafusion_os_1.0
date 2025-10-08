# Day 9 Production Change Card - F1/F4 Performance Optimization

**Change ID:** TFOS-DAY9-F1F4-PERF-OPT  
**Submitted By:** TerraFusion Platform Team  
**Date:** 2025-10-07  
**Status:** STAGED (awaiting RS256 soak completion)

---

## Change Summary

**Services Affected:**
- F1 API Gateway (retry budget optimization)
- F4 Cache Service (Redis pool tuning)

**Change Type:** Performance Optimization + Configuration Update  
**Risk Level:** LOW  
**Deployment Window:** 90 minutes (2 × 45min phases)  
**Rollback Time:** <2 minutes per service  
**Required Approvals:** 2 (Platform Lead + SRE Lead)

---

## Business Justification

### Current Pain Points
- **F1:** 2.5% error rate causes customer-facing API timeouts (50% due to transient network glitches)
- **F4:** 5.0% error rate causes cache misses, degrading to slow database queries (40% due to connection timeouts)
- **System RI:** 0.9125 (target >0.9500 for production readiness)

### Expected Improvements
- **F1 Error Rate:** 2.5% → 0.8% (68% reduction)
- **F4 Error Rate:** 5.0% → 1.2% (76% reduction)
- **System RI:** 0.9125 → 0.9390 (+27 points, 74% of target gap closed)
- **Customer Impact:** Reduced API timeouts, faster cache response times
- **Cost Savings:** F4 HPA prevents over-provisioning (auto-scale 3-10 pods vs static 8)

---

## Technical Details

### F1 - Retry Budget Implementation

**Current State:**
- VirtualService: No retry policy (fail immediately on any error)
- Error rate: 2.5% (50% transient, 50% persistent)
- p95 latency: 650ms under burst (200 req/s)
- F1 RI: 0.9250

**Proposed Changes:**
1. Add Istio VirtualService retry policy:
   - Max 2 retries (3 total attempts)
   - Per-try timeout: 300ms (fail fast per attempt)
   - Retry on: 5xx, connect-failure, refused-stream
   - No retry on: 4xx, timeout (fail fast)
2. Add DestinationRule with outlier detection:
   - Eject after 3 consecutive errors
   - 15s base ejection time
   - Max 50% of instances ejectable
3. Deploy PrometheusRule alerts:
   - Retry rate >15% (potential retry storm)
   - Retry budget exhausted (connection pool saturation)
   - p95 latency >500ms (retry overhead too high)

**Expected State:**
- Error rate: <1% (transient errors absorbed by retries)
- p95 latency: ≤500ms under burst (parallel retries)
- F1 RI: ≥0.9500 (+26 points)
- Retry rate: 5-15% (healthy, absorbing transient failures)

**Files Modified:**
- `ops/traffic/f1-retry-budget.yaml` (new, 6.8 KB)
- Istio config: VirtualService, DestinationRule, ServiceMonitor, PrometheusRule

---

### F4 - Redis Pool Tuning

**Current State:**
- Default Lettuce pool: max-active=8, no min-idle (cold start latency)
- Error rate: 5.0% (40% connection timeouts, 60% Redis latency)
- p95 latency: 1200ms under burst (500 req/s + 200ms Redis RTT)
- Pool saturation: 95% (frequent exhaustion)
- F4 RI: 0.9000

**Proposed Changes:**
1. Update Lettuce connection pool ConfigMap:
   - min-idle: 8 (warm connections, reduce cold start)
   - max-active: 64 (8x increase, prevent exhaustion)
   - max-wait: 200ms (fail fast on saturation)
   - Jittered backoff: 50ms-500ms (prevent thundering herd)
   - Eviction policy: LIFO (reuse hot connections)
2. Add HorizontalPodAutoscaler:
   - Scale on pool saturation (target 70%)
   - Min 3, max 10 pods
   - Scale up: 2 pods per 30s
   - Scale down: 1 pod per 60s (stabilization 5min)
3. Deploy PrometheusRule alerts:
   - Pool saturation >85% (approaching max-active)
   - Wait duration p95 >50ms (connection exhaustion)
   - Cache hit rate <80% (degraded performance)
   - Data integrity errors (cache corruption)

**Expected State:**
- Error rate: <1.5% (connection timeouts eliminated)
- p95 latency: ≤800ms under burst (35% reduction)
- Pool saturation: <85% (headroom maintained)
- F4 RI: ≥0.9300 (+32 points)
- HPA: Auto-scale 3-10 pods based on load

**Files Modified:**
- `ops/cache/f4-redis-pool.yaml` (new, 10.2 KB)
- ConfigMap, Deployment, ServiceMonitor, PrometheusRule, HPA

---

## Deployment Plan

### Prerequisites (Before Deployment)
- [ ] RS256 dual-sign 48h soak complete (>95% adoption verified)
- [ ] F2 circuit breaker deployed and stable (recovery <60s validated)
- [ ] Staging cluster with Istio 1.18+ installed
- [ ] Prometheus + Grafana monitoring stack operational
- [ ] PagerDuty / Slack alerting configured
- [ ] 2 approvals obtained (Platform Lead + SRE Lead)

### Phase 1: F1 Retry Budget (45 min)
1. **Deploy** (5min): `kubectl apply -f ops/traffic/f1-retry-budget.yaml`
2. **Verify Envoy** (5min): Check retry policy in Envoy config dump
3. **Baseline** (10min): Capture pre-deployment metrics (error rate, latency, RI)
4. **Load Test** (15min): Generate 200 req/s burst, verify retry behavior
5. **Alert Test** (10min): Inject synthetic error, verify alert fires + Slack/PagerDuty

**Pass Gates:**
- ✅ Retry rate 5-15% (absorbing transient errors)
- ✅ Error rate <1% sustained 5min
- ✅ p95 latency ≤500ms under burst
- ✅ No retry_overflow (budget not exhausted)
- ✅ Alerts fire correctly (F1_Retry_Rate_High tested)

### Phase 2: F4 Redis Pool (45 min)
1. **Deploy** (5min): `kubectl apply -f ops/cache/f4-redis-pool.yaml`
2. **Rolling Update** (10min): Watch pods restart with new pool config
3. **Pool Metrics** (10min): Verify min-idle=8 active connections, saturation <50%
4. **Burst Test** (15min): Generate 500 req/s burst, verify pool scales, saturation <85%
5. **Integrity Check** (5min): Run cache consistency verification, zero errors

**Pass Gates:**
- ✅ Pool saturation <85% during burst
- ✅ Wait duration p95 <50ms under load
- ✅ Error rate <1.5% sustained 5min
- ✅ Cache hit rate >80%
- ✅ Zero data integrity errors
- ✅ HPA scales up appropriately (3 → 5 pods if saturated)

### Phase 3: 30-Minute Soak (Both Services)
- Monitor error rates, latency p95s, alert silence
- Verify F1 RI ≥0.9500, F4 RI ≥0.9300
- Capture Grafana snapshots to `out/day9/soak/`
- **GO/NO-GO Decision:** Proceed to 24h soak or rollback

---

## Acceptance Criteria

### F1 Acceptance Gates (6 criteria)

| # | Metric | Target | Pass Criteria | Measurement |
|---|--------|--------|---------------|-------------|
| 1 | Error Rate | <1% | ✅ <1.0% sustained 5min | Prometheus: `rate(envoy_cluster_upstream_rq_xx{response_code_class="5"}[5m])` |
| 2 | p95 Latency (burst) | ≤500ms | ✅ ≤500ms under 200 req/s | Prometheus: `histogram_quantile(0.95, rate(envoy_cluster_upstream_rq_time_bucket[5m]))` |
| 3 | Retry Rate | 5-15% | ✅ Transient errors absorbed | Prometheus: `rate(envoy_cluster_upstream_rq_retry[5m])` |
| 4 | Retry Overflow | 0 | ✅ No budget exhaustion | Prometheus: `rate(envoy_cluster_upstream_rq_retry_overflow[5m]) == 0` |
| 5 | Circuit Breaker | CLOSED | ✅ Remains CLOSED | Istio: Circuit breaker state check |
| 6 | F1 RI | ≥0.9500 | ✅ ≥0.9500 after 30min soak | Calculated: `(1 - error_rate) * (p95_latency <= 0.5)` |

**Result:** [ ] PASS (6/6) [ ] FAIL (explain in rollback section)

---

### F4 Acceptance Gates (7 criteria)

| # | Metric | Target | Pass Criteria | Measurement |
|---|--------|--------|---------------|-------------|
| 1 | Error Rate | <1.5% | ✅ <1.5% sustained 5min | Prometheus: `rate(f4_errors_total[5m]) / rate(f4_requests_total[5m])` |
| 2 | p95 Latency (burst) | ≤800ms | ✅ ≤800ms under 500 req/s | Prometheus: `histogram_quantile(0.95, rate(f4_latency_bucket[5m]))` |
| 3 | Pool Saturation | <85% | ✅ <85% during burst | Prometheus: `lettuce_pool_active / 64` |
| 4 | Wait Duration p95 | <50ms | ✅ <50ms under load | Prometheus: `histogram_quantile(0.95, rate(lettuce_pool_wait_duration_bucket[5m]))` |
| 5 | Cache Hit Rate | >80% | ✅ >80% sustained | Prometheus: `rate(cache_gets_total{result="hit"}[5m]) / rate(cache_gets_total[5m])` |
| 6 | Data Integrity | 0 errors | ✅ Zero integrity errors | Actuator: `/actuator/cache/verify` + Prometheus alert silence |
| 7 | F4 RI | ≥0.9300 | ✅ ≥0.9300 after 30min soak | Calculated: `(1 - error_rate) * (p95_latency <= 0.8)` |

**Result:** [ ] PASS (7/7) [ ] FAIL (explain in rollback section)

---

## Rollback Procedures

### F1 Rollback (<2 min)

**Trigger Conditions:**
- [ ] Error rate >1.5% sustained 5min
- [ ] p95 latency >700ms sustained 5min
- [ ] Retry overflow detected (budget exhausted)
- [ ] Circuit breaker stuck OPEN (retry loops)
- [ ] Critical alert fires: `F1_Retry_Budget_Exhausted`

**Rollback Command:**
```bash
# Delete retry config (reverts to no-retry default)
kubectl delete virtualservice,destinationrule \
  -n terrafusion-staging -l optimization=day9-retry-budget

# Verify revert
kubectl exec -n terrafusion-staging deploy/f1-api-gateway -c istio-proxy -- \
  pilot-agent request GET config_dump | jq '.configs[].dynamic_route_configs[].route_config.virtual_hosts[].routes[].route.retry_policy'
# Expected: null (no retry policy)
```

**Validation:**
- [ ] Error rate returns to baseline 2.5%
- [ ] p95 latency drops to baseline 650ms
- [ ] Retry metrics go to zero

**Rollback Time:** <2 minutes  
**Rollback Risk:** NONE (revert to stable baseline)

---

### F4 Rollback (<2 min)

**Trigger Conditions:**
- [ ] Error rate >3% sustained 5min
- [ ] Pool saturation >95% sustained 3min
- [ ] Wait duration p95 >100ms sustained 3min
- [ ] Data integrity errors detected
- [ ] Critical alert fires: `F4_Redis_Pool_Saturation` or `F4_Data_Integrity_Error`

**Rollback Command:**
```bash
# Revert to previous deployment (default pool settings)
kubectl rollout undo deployment/f4-cache-service -n terrafusion-staging

# Monitor rollout
kubectl rollout status deployment/f4-cache-service -n terrafusion-staging

# Verify revert
kubectl exec -n terrafusion-staging deploy/f4-cache-service -- \
  env | grep LETTUCE_POOL
```

**Optional: Flush cache (if integrity errors)**
```bash
kubectl exec -n terrafusion-staging deploy/redis-master -- redis-cli FLUSHDB
```

**Validation:**
- [ ] Pool saturation drops below 70%
- [ ] Wait duration p95 <10ms
- [ ] Error rate returns to baseline 5%
- [ ] Zero data integrity errors after flush

**Rollback Time:** <2 minutes  
**Rollback Risk:** LOW (cache flush causes temporary performance degradation, no data loss)

---

## Monitoring & Alerting

### Grafana Dashboards

**F1 Retry Budget Dashboard:**
- Request rate & error rate (timeseries)
- Retry metrics (retry rate, retry overflow)
- Latency histogram (p50, p95, p99)
- F1 Resilience Index (gauge)
- Alert status panel (firing alerts)

**F4 Redis Pool Dashboard:**
- Pool utilization (active, idle, saturation %)
- Wait duration (p95, p99)
- Redis command latency (heatmap)
- Cache performance (hit rate, evictions)
- F4 Resilience Index (gauge)
- Alert status panel (firing alerts)

**Dashboard URLs:**
- F1: https://grafana.terrafusion.staging/d/f1-retry-budget
- F4: https://grafana.terrafusion.staging/d/f4-redis-pool

---

### Alert Configuration

**F1 Alerts (3 rules):**
1. **F1_Retry_Rate_High** (warning, 3min)
   - Condition: Retry rate >15%
   - Action: Slack notification to #platform-ops
   
2. **F1_Retry_Budget_Exhausted** (critical, 2min)
   - Condition: Retry overflow detected
   - Action: PagerDuty incident + Slack alert
   
3. **F1_P95_Latency_High** (warning, 5min)
   - Condition: p95 latency >500ms
   - Action: Slack notification

**F4 Alerts (4 rules):**
1. **F4_Redis_Pool_Saturation** (warning, 3min)
   - Condition: Pool saturation >85%
   - Action: Slack notification
   
2. **F4_Redis_Connection_Wait_High** (critical, 2min)
   - Condition: Wait duration p95 >50ms
   - Action: PagerDuty incident + Slack alert
   
3. **F4_Cache_Hit_Rate_Low** (warning, 10min)
   - Condition: Cache hit rate <80%
   - Action: Slack notification
   
4. **F4_Data_Integrity_Error** (critical, 1min)
   - Condition: Any integrity error detected
   - Action: PagerDuty incident + Slack alert + auto-rollback trigger

---

## Risk Assessment

### F1 Risk Analysis

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Retry storms (cascading failures) | LOW | HIGH | Retry budget limits max retry rate, fail-fast on exhaustion |
| Increased latency (retry overhead) | LOW | MEDIUM | Per-try timeout 300ms, overall timeout 1s, p95 target ≤500ms |
| Circuit breaker flapping | LOW | MEDIUM | Outlier detection (3 errors, 15s ejection), max 50% ejectable |
| Alert fatigue (false positives) | LOW | LOW | Alert thresholds tuned (>15% retry rate, >500ms latency) |

**Overall F1 Risk:** LOW  
**Rationale:** Retry strategy is conservative (max 2 retries), fail-fast on exhaustion, rollback <2min

---

### F4 Risk Analysis

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Pool exhaustion (connection saturation) | LOW | HIGH | Max-active 64 (8x increase), max-wait 200ms fail-fast, HPA scales up |
| Memory pressure (more connections) | LOW | MEDIUM | Resource limits (1Gi), HPA max 10 pods, jittered backoff prevents thundering herd |
| Cache corruption (data integrity) | VERY LOW | CRITICAL | Integrity checks + alert, rollback + flush cache if detected |
| Redis master overload | LOW | MEDIUM | Min-idle 8 (vs cold start), LIFO eviction (reuse hot connections), Sentinel HA |

**Overall F4 Risk:** LOW  
**Rationale:** Pool limits prevent exhaustion, HPA auto-scales, integrity monitoring, rollback <2min

---

## Dependencies & Coordination

### Dependencies

**F1 requires:**
- Istio 1.18+ (VirtualService, DestinationRule)
- Prometheus + AlertManager
- PagerDuty integration
- F1 API gateway deployment with Envoy sidecar

**F4 requires:**
- Redis Sentinel cluster (3 nodes)
- Lettuce client (Spring Boot)
- Spring Boot Actuator (metrics)
- Prometheus + AlertManager
- HPA controller

### Coordination with Other Changes

**Prerequisite (must be complete):**
- Day 8: F2 circuit breaker deployed (✅ complete)
- Day 8: RS256 dual-sign 48h soak (⏳ in progress, T+36h, 92% adoption)

**Sequencing:**
1. **Wait for RS256 soak completion** (T+48h, >95% adoption)
2. **Deploy F1/F4 to staging** (this change, 90min)
3. **24h soak in staging** (GO/NO-GO decision)
4. **Day 10: Production deployment** (F2 + RS256 + F1 + F4 together)

**Rationale:**
- Decouple security (RS256) from performance (F1/F4) changes
- Each change reversible independently (<2min rollback)
- Staging soak validates combined system behavior before production

---

## Success Metrics

### Immediate Outcomes (After 30min Soak)

| Metric | Before | Target | Actual | Status |
|--------|--------|--------|--------|--------|
| F1 Error Rate | 2.5% | <1% | _________ | [ ] PASS [ ] FAIL |
| F1 p95 Latency | 650ms | ≤500ms | _________ | [ ] PASS [ ] FAIL |
| F1 RI | 0.9250 | ≥0.9500 | _________ | [ ] PASS [ ] FAIL |
| F4 Error Rate | 5.0% | <1.5% | _________ | [ ] PASS [ ] FAIL |
| F4 p95 Latency | 1200ms | ≤800ms | _________ | [ ] PASS [ ] FAIL |
| F4 Pool Saturation | 95% | <85% | _________ | [ ] PASS [ ] FAIL |
| F4 RI | 0.9000 | ≥0.9300 | _________ | [ ] PASS [ ] FAIL |
| **System RI** | **0.9125** | **≥0.9390** | _________ | [ ] **PASS** [ ] **FAIL** |

**GO/NO-GO Decision:** [ ] GO (proceed to 24h soak) [ ] NO-GO (rollback)

---

### 24-Hour Outcomes (Production Ready)

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| F1 RI sustained 24h | ≥0.9500 | _________ | [ ] PASS [ ] FAIL |
| F4 RI sustained 24h | ≥0.9300 | _________ | [ ] PASS [ ] FAIL |
| System RI sustained 24h | ≥0.9390 | _________ | [ ] PASS [ ] FAIL |
| Zero critical alerts | 0 alerts | _________ | [ ] PASS [ ] FAIL |
| Zero rollbacks | 0 rollbacks | _________ | [ ] PASS [ ] FAIL |
| HPA stable (F4) | 3-5 pods | _________ | [ ] PASS [ ] FAIL |

**Production Deployment Approval:** [ ] APPROVED [ ] REJECTED

---

## Sign-Off

### Approvals Required

**Platform Lead:** _________________________________ Date: _________  
**SRE Lead:** _________________________________ Date: _________

### Post-Deployment Sign-Off

**Deployed By:** _________________________________ Date: _________  
**Verified By:** _________________________________ Date: _________

### Notes & Observations

**Deployment Notes:**
_____________________________________________________________________
_____________________________________________________________________
_____________________________________________________________________

**Anomalies Detected:**
_____________________________________________________________________
_____________________________________________________________________
_____________________________________________________________________

**Tuning Adjustments Made:**
_____________________________________________________________________
_____________________________________________________________________
_____________________________________________________________________

---

## Appendix: Local Testing Results

### F1 Retry Budget (Local Validation)

**Test Date:** _________  
**Tester:** _________

**Test Results:**
- [ ] Istio VirtualService applied successfully
- [ ] Envoy config dump shows retry policy (numRetries: 2, perTryTimeout: 0.300s)
- [ ] Mock service deployed (20% error rate)
- [ ] 100 test requests sent
- [ ] Error rate with retries: _________ (target <5%)
- [ ] Error rate without retries: _________ (baseline ~20%)

**Conclusion:** [ ] PASS (retries working) [ ] FAIL (explain)

---

### F4 Redis Pool (Local Validation)

**Test Date:** _________  
**Tester:** _________

**Test Results:**
- [ ] Redis deployed locally
- [ ] Pool stress test executed (60s, 100 req/s, 64 connections)
- [ ] Total requests: _________ (target ~6000)
- [ ] Error rate: _________ (target <1.5%)
- [ ] p95 latency: _________ (target <50ms under 200ms synthetic RTT)
- [ ] Max pool utilization: _________ (target <85%)

**Conclusion:** [ ] PASS (pool tuning effective) [ ] FAIL (explain)

---

**Change Card Version:** 1.0  
**Last Updated:** 2025-10-07  
**Review Cycle:** After each deployment (update with measured values)
