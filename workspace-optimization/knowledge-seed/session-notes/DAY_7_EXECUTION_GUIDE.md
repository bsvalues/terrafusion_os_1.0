# 🎯 Day 7 Chaos Test Execution Pack — READY TO RUN

**Phase 4.9 Week 1 • Day 7 • October 7, 2025**  
**Commit:** `4f23fe0a` (pushed to GitHub master)  
**Status:** ✅ Infrastructure COMPLETE — Ready for test execution

---

## 📦 What Was Delivered

### Infrastructure Components (15 files)

#### 1. k6 Load Test Scripts (2 files)
- ✅ `ops/tests/chaos/k6/brownout-read-api.js` (171 lines)
  - 100 VUs, 15min duration, targets `/v1/properties` endpoint
  - Thresholds: P95 <500ms, error rate <1%
  - Custom metrics: cache hit rate, retry counter, error rate
- ✅ `ops/tests/chaos/k6/spike-retry-grid.js` (140 lines)
  - 0→500 VUs ramp (90s), 10min hold, circuit breaker validation
  - Tracks: CB open/half-open events, retry attempts (≤2 target)

#### 2. Istio Fault Injection (2 files)
- ✅ `ops/tests/chaos/istio/fault-injection-150ms.yaml`
  - F1: API latency +150ms fixed delay, 100% traffic
  - Retries: 2 attempts, 300ms per-try timeout
- ✅ `ops/tests/chaos/istio/fault-injection-30pct-loss.yaml`
  - F2: Packet loss 30% (HTTP 503 abort simulation)
  - Retries: 2 attempts, 500ms per-try timeout

#### 3. Chaos Mesh Experiments (4 files)
- ✅ `ops/tests/chaos/chaos-mesh/network-latency.yaml`
  - F3: Redis brownout +200ms latency, jitter ±50ms, 10min
- ✅ `ops/tests/chaos/chaos-mesh/network-loss.yaml`
  - Alternative: Network packet loss 30%
- ✅ `ops/tests/chaos/chaos-mesh/pod-kill-redis.yaml`
  - F4: Redis pod kill (one-shot)
- ✅ `ops/tests/chaos/chaos-mesh/pod-kill-api.yaml`
  - F7: API pod kill (one-shot)

#### 4. ToxiProxy Config (1 file)
- ✅ `ops/tests/chaos/toxiproxy/redis_latency.json`
  - Local/dev alternative: Redis latency 200ms ±50ms jitter

#### 5. Prometheus Observability (2 files)
- ✅ `ops/tests/chaos/prometheus/recording-rules.yaml`
  - 7 rules: p95, p99, error_rate, consumer_lag, cache_hit_rate, circuit_breaker, retry_rate
- ✅ `ops/tests/chaos/prometheus/chaos-alerts.yaml`
  - 5 alerts: BrownoutP95Exceeded (>500ms), ErrorRateSpike (>1%), CircuitBreakerStuck (>5min), KafkaConsumerLagGrowing, RedisCacheHitRateDrop

#### 6. Scoring & Decision (2 files)
- ✅ `ops/tests/chaos/scorecard/rubric.yaml`
  - Resilience Index formula: `RI = 0.35×P95 + 0.25×ErrorRate + 0.25×Recovery + 0.15×DataIntegrity`
  - Fault-specific thresholds (F1-F7)
  - Aggregation: weighted average by fault criticality
- ✅ `ops/tests/chaos/scorecard/decision-matrix.md`
  - GO: RI ≥0.95 (proceed to PROD-0)
  - CONDITIONAL GO: 0.90 ≤ RI < 0.95 (Week 2 fixes)
  - NO-GO: RI <0.90 (defer PROD-0)

#### 7. Make Targets (1 file)
- ✅ `ops/tests/chaos/make.targets.mk`
  - 12 targets: prep, fault injection, load tests, reporting, cleanup

#### 8. README & Results Directory (1 file + 1 dir)
- ✅ `ops/tests/chaos/README.md` (comprehensive execution guide)
- ✅ `ops/tests/chaos/results/` (empty, ready for test artifacts)

### Documentation Templates (2 files)

#### 1. Technical Report (~800 lines)
- ✅ `docs/phase4.9/week1/day7-chaos-review.md`
  - 7 fault sections (F1-F7): setup, execution, results, observations, RI calculation
  - Placeholder fields: `[XXX]`ms P95, `[X.X]`% error rate, `[XX]`s recovery
  - Sections for Prometheus charts, Jaeger traces, CB timelines
  - Overall RI calculation + decision matrix
  - Week 2 remediation plan (CRITICAL/HIGH/MEDIUM)

#### 2. Executive Summary (~350 lines)
- ✅ `DAY_7_CHAOS_COMPLETE.md`
  - Overall Resilience Index + GO/NO-GO decision
  - Fault matrix results table
  - Gap analysis + post-remediation projection
  - PROD-0 readiness assessment + conditions
  - Week 1 progress tracker (7/7 days)
  - Week 2 action plan

---

## 🚀 Execution Workflow (Copy-Paste Ready)

### Prerequisites

1. **Kubernetes cluster running:**
   ```bash
   kubectl get nodes
   kubectl get pods -n terrafusion
   ```

2. **Monitoring stack operational:**
   ```bash
   kubectl get prometheus -n observability
   kubectl get jaeger -n observability
   ```

3. **k6 installed:**
   ```bash
   k6 version
   ```

4. **API endpoint accessible:**
   ```bash
   curl https://api.terrafusion.local/v1/health
   ```

### Step-by-Step Execution

#### Phase 1: Preparation (5 min)

```bash
# Deploy Prometheus recording rules & alerts
make chaos:prep

# Verify rules loaded
kubectl exec -n observability prometheus-0 -- promtool check rules /etc/prometheus/rules/chaos-*.yaml
```

#### Phase 2: Fault F1 — API Latency +150ms (20 min)

```bash
# Apply Istio fault injection
make chaos:fault:150ms

# Run k6 load test (100 VUs, 15min)
API_BASE=https://api.terrafusion.local make chaos:k6:read

# Capture Prometheus metrics
# - Open http://prometheus:9090
# - Query: job:http_request_duration_seconds:p95{job="api",route="/v1/properties"}
# - Export graph as PNG → ops/tests/chaos/results/prometheus_p95_f1.png

# Capture Jaeger trace
# - Open http://jaeger:16686
# - Search: service=api, operation=/v1/properties, during fault window
# - Export trace JSON → ops/tests/chaos/results/jaeger_trace_f1_during.json

# Cleanup
kubectl delete virtualservice api-brownout-150ms
```

**Fill in day7-chaos-review.md Part 1:**
- P95 latency: `[XXX]`ms → (actual value from k6 output)
- Error rate: `[X.X]`% → (from k6 output)
- Recovery time: `[XX]`s → (observe backlog drain in Prometheus)
- Calculate F1_RI: `[X.XX]`

#### Phase 3: Fault F2 — Packet Loss 30% (15 min)

```bash
# Apply Istio fault injection
make chaos:fault:loss30

# Run k6 spike test (0→500 VUs)
API_BASE=https://api.terrafusion.local make chaos:k6:spike

# Capture circuit breaker timeline
# - Prometheus query: circuit_breaker_state{service="api"}
# - Export graph → ops/tests/chaos/results/circuit_breaker_timeline_f2.png

# Cleanup
kubectl delete virtualservice api-packet-loss-30pct
```

**Fill in day7-chaos-review.md Part 2:**
- P95 latency: `[XXXX]`ms
- Error rate: `[XX]`%
- CB open events: `[XX]`
- Avg retries/request: `[X.XX]`
- Calculate F2_RI: `[X.XX]`

#### Phase 4: Fault F3 — Redis Brownout +200ms (15 min)

```bash
# Apply Chaos Mesh network latency
make chaos:redis:latency

# Run k6 load test
API_BASE=https://api.terrafusion.local make chaos:k6:read

# Capture Redis metrics
# - Prometheus query: redis:cache_hit_rate
# - Export graph → ops/tests/chaos/results/redis_hit_rate_f3.png

# Cleanup
kubectl delete networkchaos rediscache-latency
```

**Fill in day7-chaos-review.md Part 3:**
- P95 latency: `[XXX]`ms
- Cache hit rate (before/during/after): `[XX]`% / `[XX]`% / `[XX]`%
- Data integrity errors: `[X]`
- Calculate F3_RI: `[X.XX]`

#### Phase 5: Fault F4 — Redis Pod Kill (10 min)

```bash
# Kill Redis pod
make chaos:redis:kill

# Run k6 load test immediately
API_BASE=https://api.terrafusion.local make chaos:k6:read

# Observe pod replacement
kubectl get pods -n terrafusion -l app=redis --watch
```

**Fill in day7-chaos-review.md Part 4:**
- Pod replacement time: `[XX]`s
- Error rate (5min window): `[X.X]`%
- Calculate F4_RI: `[X.XX]`

#### Phase 6: Fault F5 — Kafka Throttle 50% (20 min)

**Manual setup required:**

```bash
# Option A: Kafka broker quota
kafka-configs.sh --alter \
  --add-config 'producer_byte_rate=52428800' \
  --entity-type clients --entity-name terrafusion-producer \
  --bootstrap-server kafka:9092

# Run spike test
API_BASE=https://api.terrafusion.local make chaos:k6:spike

# Observe consumer lag
# - Prometheus query: kafka:consumer_lag{topic="property-events"}

# Cleanup
kafka-configs.sh --alter \
  --delete-config 'producer_byte_rate' \
  --entity-type clients --entity-name terrafusion-producer \
  --bootstrap-server kafka:9092
```

**Fill in day7-chaos-review.md Part 5:**
- Consumer lag (before/peak/after): `[XXXX]` / `[XXXX]` / `[XXXX]`
- Lag clear time: `[XXX]`s
- Calculate F5_RI: `[X.XX]`

#### Phase 7: Fault F6 — DB Read-Replica Stall +250ms (15 min)

**Manual setup required** (environment-specific)

**Fill in day7-chaos-review.md Part 6:**
- Read P95: `[XXX]`ms
- Write P95: `[XXX]`ms (should be stable)
- Calculate F6_RI: `[X.XX]`

#### Phase 8: Fault F7 — API Pod Kill (10 min)

```bash
# Kill API pod
make chaos:api:kill

# Run k6 load test immediately
API_BASE=https://api.terrafusion.local make chaos:k6:read

# Observe HPA replacement
kubectl get pods -n terrafusion -l app=api --watch
```

**Fill in day7-chaos-review.md Part 7:**
- Pod replacement time: `[XX]`s
- Error rate (5min window): `[X.X]`%
- Calculate F7_RI: `[X.XX]`

#### Phase 9: Export Artifacts (10 min)

```bash
# Export all Prometheus graphs
# Export all Jaeger traces
# Export k6 JSON outputs
# Take screenshots of Alert Manager

# Run report target (lists manual steps)
make chaos:report
```

---

## 📊 Calculate Overall Resilience Index

### Step 1: Fill in Individual Fault RIs

```
F1 (API Latency):        [X.XX] × 0.20 weight = [X.XXX]
F2 (Packet Loss):        [X.XX] × 0.20 weight = [X.XXX]
F3 (Redis Brownout):     [X.XX] × 0.15 weight = [X.XXX]
F4 (Redis Kill):         [X.XX] × 0.10 weight = [X.XXX]
F5 (Kafka Throttle):     [X.XX] × 0.10 weight = [X.XXX]
F6 (DB Read Stall):      [X.XX] × 0.15 weight = [X.XXX]
F7 (API Pod Kill):       [X.XX] × 0.10 weight = [X.XXX]
                                        ──────
Overall Resilience Index:                [X.XX]
```

### Step 2: Apply Decision Matrix

**If RI ≥0.95:** ✅ **GO** — Proceed to PROD-0 (October 14)

**If 0.90 ≤ RI < 0.95:** ⚠️ **CONDITIONAL GO** — Fix items in Week 2, re-test, PROD-0 (October 14-16)

**If RI <0.90:** ❌ **NO-GO** — Week 2 remediations, defer PROD-0 to Week 3 (October 21)

### Step 3: Create Remediation Plan (if RI <0.95)

For each failed fault (RI <0.90):
1. Identify root cause
2. Estimate fix effort (hours)
3. Calculate expected RI improvement
4. Prioritize: CRITICAL (before PROD-0) vs. HIGH (Week 2) vs. MEDIUM (Week 3)

---

## 📝 Documentation Checklist

### After Test Execution

- [ ] Fill in all `[XXX]` placeholders in day7-chaos-review.md (P95, error rate, recovery time)
- [ ] Paste k6 outputs into Results sections
- [ ] Insert Prometheus chart screenshots (`[INSERT SCREENSHOT: ...]`)
- [ ] Insert Jaeger trace screenshots/JSON
- [ ] Calculate individual fault RIs (F1-F7)
- [ ] Calculate Overall Resilience Index
- [ ] Apply decision matrix (GO/CONDITIONAL GO/NO-GO)
- [ ] Write justification for decision
- [ ] Create Week 2 remediation plan (if RI <0.95)
- [ ] Update DAY_7_CHAOS_COMPLETE.md with summary
- [ ] Commit both documents to GitHub

### Final Deliverables

1. ✅ `day7-chaos-review.md` (completed, ~800+ lines with real data)
2. ✅ `DAY_7_CHAOS_COMPLETE.md` (completed, ~350+ lines with decision)
3. ✅ `ops/tests/chaos/results/` (exported artifacts: PNG, JSON)
4. ✅ Git commit + push to GitHub

---

## 🎯 Next Steps

### Immediate (Today, October 7)

1. ✅ **COMPLETE:** Chaos test infrastructure deployed (commit `4f23fe0a`)
2. ⏳ **TODO:** Execute chaos tests (estimated 4-6 hours for full suite)
3. ⏳ **TODO:** Fill in documentation templates with real metrics
4. ⏳ **TODO:** Calculate Overall Resilience Index
5. ⏳ **TODO:** Make GO/NO-GO decision for PROD-0

### Week 2 (October 8-14)

**If GO (RI ≥0.95):**
- October 14: Launch PROD-0 simulation

**If CONDITIONAL GO (0.90 ≤ RI <0.95):**
- October 8-10: Fix CRITICAL items from chaos test
- October 11-12: Fix HIGH priority items (OpenAPI specs, Pact tests, security mesh)
- October 13: Re-run failed chaos tests, validate fixes
- October 14-16: Launch PROD-0 simulation

**If NO-GO (RI <0.90):**
- October 8-14: Week 2 comprehensive remediations
- October 15-18: Re-run full chaos test suite
- October 21: PROD-0 simulation (deferred to Week 3)

---

## 📚 References

- **Chaos Test README:** `ops/tests/chaos/README.md` (comprehensive execution guide)
- **Technical Report Template:** `docs/phase4.9/week1/day7-chaos-review.md`
- **Executive Summary Template:** `DAY_7_CHAOS_COMPLETE.md`
- **Scoring Rubric:** `ops/tests/chaos/scorecard/rubric.yaml`
- **Decision Matrix:** `ops/tests/chaos/scorecard/decision-matrix.md`
- **Day 6 Integration Review:** `docs/phase4.9/week1/day6-integration-review.md`
- **Week 7 Circuit Breaker POC:** `WEEK_7_PART_1_CIRCUIT_BREAKERS.md`

---

## ✅ Week 1 Status

**Phase 4.9 Week 1: Systematic Validation**

- **Day 1:** AI Platform ✅ (0.89, 1,427 lines)
- **Day 2:** Infrastructure ✅ (0.88, 1,000 lines)
- **Day 3:** UI/UX ✅ (0.91, 1,427 lines)
- **Day 4:** Database ✅ (0.91, 1,076 lines)
- **Day 5:** Security ✅ (0.78, 1,690 lines)
- **Day 6:** Integration ✅ (0.85, 1,556 lines)
- **Day 7:** Chaos Test ✅ (Infrastructure ready, tests pending)

**Progress:** 7/7 days infrastructure complete (100%)

**Total Documentation:** ~9,000+ lines (Days 1-6)

**Next:** Execute chaos tests → Calculate RI → GO/NO-GO → PROD-0

---

**🎉 Day 7 Chaos Test Execution Pack: READY TO RUN 🎉**

**Commit:** `4f23fe0a` • **GitHub:** `https://github.com/bsvalues/terrafusion_os_1.0`

**Status:** ✅ All infrastructure deployed, templates ready, workflows documented

**Action Required:** Execute tests (4-6 hours) → Fill in metrics → Make decision
