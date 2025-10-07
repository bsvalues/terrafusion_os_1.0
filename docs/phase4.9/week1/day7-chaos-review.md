# Day 7 — Brown-Out Chaos Test Review

**Phase 4.9 Week 1 • Day 7 • October 7, 2025**

## Executive Summary

### Overall Resilience Index

**Score:** `[X.XX]` / 1.00

**Decision:** `[GO | CONDITIONAL GO | NO-GO]`

**Production Readiness:** `[✅ Ready | ⚠️ Ready with conditions | ❌ Not ready]`

### Key Findings

- **Test Duration:** `[X]` hours (7 fault scenarios, `[X]` total experiments)
- **Faults Passed:** `[X]` / 7 (`[XX]`%)
- **Critical Issues:** `[X]` (circuit breaker, failover, recovery)
- **Week 2 Remediations:** `[X]` hours (`[HIGH/MEDIUM/LOW]` priority)

### Fault Matrix Summary

| ID | Fault | Duration | P95 (ms) | Error Rate | Recovery (s) | RI Score | Status |
|----|-------|----------|----------|------------|--------------|----------|--------|
| F1 | API Latency +150ms | 15min | `[XXX]` | `[X.X]`% | `[XX]` | `[X.XX]` | `[✅/❌]` |
| F2 | Packet Loss 30% | 10min | `[XXX]` | `[XX]`% | `[XX]` | `[X.XX]` | `[✅/❌]` |
| F3 | Redis Brownout +200ms | 10min | `[XXX]` | `[X.X]`% | `[XX]` | `[X.XX]` | `[✅/❌]` |
| F4 | Redis Pod Kill | one-shot | `[XXX]` | `[X.X]`% | `[XX]` | `[X.XX]` | `[✅/❌]` |
| F5 | Kafka Throttle 50% | 15min | `[XXX]` | `[X.X]`% | `[XXX]` | `[X.XX]` | `[✅/❌]` |
| F6 | DB Read-Replica Stall | 10min | `[XXX]` | `[X.X]`% | `[XX]` | `[X.XX]` | `[✅/❌]` |
| F7 | API Pod Kill | one-shot | `[XXX]` | `[X.X]`% | `[XX]` | `[X.XX]` | `[✅/❌]` |

---

## Part 1: Fault F1 — API Latency Injection (+150ms)

### Setup

**Objective:** Validate API resilience under sustained latency degradation (brown-out simulation).

**Fault Configuration:**
- **Mechanism:** Istio VirtualService fault injection
- **Latency:** +150ms fixed delay (100% of requests)
- **Duration:** 15 minutes
- **Target:** `GET /v1/properties` endpoint
- **Load:** 100 VUs (virtual users), k6 load test

**Expected Behavior:**
- P95 latency ≤500ms (baseline 350ms + fault 150ms)
- Error rate <1%
- Backlog drains <2min post-fault
- Circuit breaker remains CLOSED (no sustained failures)

### Execution

```bash
# Apply Istio fault injection
kubectl apply -f ops/tests/chaos/istio/fault-injection-150ms.yaml

# Run k6 load test
API_BASE=https://api.terrafusion.local k6 run ops/tests/chaos/k6/brownout-read-api.js

# Observe Prometheus metrics
job:http_request_duration_seconds:p95{job="api",route="/v1/properties"}
api:error_rate{job="api"}

# Cleanup
kubectl delete virtualservice api-brownout-150ms
```

### Results

**Metrics:**

```
[PASTE k6 OUTPUT HERE]

P95 Latency: [XXX]ms [✅ PASS | ❌ FAIL] (target: <500ms)
P99 Latency: [XXX]ms
Error Rate: [X.X]% [✅ PASS | ❌ FAIL] (target: <1%)
Total Requests: [XXXXX]
Total Errors: [XXX]
Cache Hit Rate: [XX]%
Recovery Time: [XX]s (backlog drain)
```

**Prometheus Charts:**

```
[INSERT SCREENSHOT: prometheus_p95_f1.png]
[INSERT SCREENSHOT: prometheus_error_rate_f1.png]
```

**Jaeger Traces:**

Trace ID: `[XXXXXXXXXXXXXXXX]`

```
[INSERT SCREENSHOT: jaeger_trace_f1_before.png]
[INSERT SCREENSHOT: jaeger_trace_f1_during.png]
[INSERT SCREENSHOT: jaeger_trace_f1_after.png]
```

**Trace Analysis:**

- **Before Fault:** Baseline latency ~350ms (DB query 120ms + cache 45ms + serialization 20ms + network 15ms)
- **During Fault:** Latency ~[XXX]ms (baseline + 150ms fault injection)
- **After Fault:** Recovery to baseline within `[XX]`s

### Observations

**✅ PASS Criteria:**

- `[List passed criteria]`
- Example: P95 latency stayed at 485ms (3% under threshold)
- Example: Error rate 0.8% (20% under threshold)

**❌ FAIL Criteria:**

- `[List failed criteria]`
- Example: P95 latency spiked to 620ms (24% over threshold)
- Example: Backlog took 3min to drain (50% over target)

**🔍 Additional Findings:**

- Circuit breaker state: `[CLOSED/OPEN/HALF_OPEN]` during fault
- Retry attempts: Average `[X.X]` retries per request
- Cache behavior: Hit rate dropped from 90% to `[XX]`%
- Database fallback: `[X]` additional queries due to cache misses

### Resilience Index Calculation

```
P95_score        = min(1.0, 500 / [XXX]) = [X.XX]
ErrorRate_score  = 1.0 - min(1.0, [X.XX] / 0.01) = [X.XX]
Recovery_score   = min(1.0, 120 / [XX]) = [X.XX]
DataIntegrity_score = [1.0 | 0.0]

F1_RI = 0.35×[X.XX] + 0.25×[X.XX] + 0.25×[X.XX] + 0.15×[X.XX] = [X.XX]
```

**Fault F1 Resilience Index:** `[X.XX]` / 1.00 `[✅ PASS ≥0.90 | ❌ FAIL <0.90]`

### Remediation Actions (if failed)

**Priority:** `[HIGH/MEDIUM/LOW]`

**Effort:** `[X]` hours

**Actions:**

1. `[Action item 1]` — `[X]`h
2. `[Action item 2]` — `[X]`h

**Expected Improvement:** RI `[X.XX]` → `[X.XX]`

---

## Part 2: Fault F2 — Network Packet Loss (30%)

### Setup

**Objective:** Validate circuit breaker and retry logic under network degradation.

**Fault Configuration:**
- **Mechanism:** Istio VirtualService abort injection (simulates packet loss)
- **Abort Rate:** 30% (HTTP 503)
- **Duration:** 10 minutes
- **Target:** All API endpoints
- **Load:** Spike test (0→500 VUs ramp, 10min hold)

**Expected Behavior:**
- Retries cap at ≤2 per request
- Circuit breaker opens ≤2s after 5 consecutive failures
- P95 recovers ≤60s post-fault
- Error rate <30% (some failures expected)

### Execution

```bash
# Apply Istio fault injection
kubectl apply -f ops/tests/chaos/istio/fault-injection-30pct-loss.yaml

# Run k6 spike test
API_BASE=https://api.terrafusion.local k6 run ops/tests/chaos/k6/spike-retry-grid.js

# Observe circuit breaker state
circuit_breaker_state{service="api"}

# Cleanup
kubectl delete virtualservice api-packet-loss-30pct
```

### Results

**Metrics:**

```
[PASTE k6 OUTPUT HERE]

P95 Latency: [XXXX]ms [✅ PASS | ❌ FAIL] (target: <2000ms during fault)
Error Rate: [XX]% [✅ PASS | ❌ FAIL] (target: <30%)
Circuit Breaker OPEN events: [XX]
Circuit Breaker HALF_OPEN events: [XX]
Total Retries: [XXXXX]
Avg Retries/Request: [X.XX] [✅ PASS ≤2 | ❌ FAIL >2]
Recovery Time: [XX]s
```

**Circuit Breaker Timeline:**

```
[INSERT SCREENSHOT: circuit_breaker_timeline_f2.png]

Time   | State      | Event
-------|------------|--------------------------------------
T+0s   | CLOSED     | Fault injection starts
T+[X]s | OPEN       | 5 consecutive failures detected
T+[X]s | HALF_OPEN  | Timeout expired, testing recovery
T+[X]s | CLOSED     | Recovery confirmed, circuit closed
```

### Observations

**✅ PASS Criteria:**

- `[List passed criteria]`
- Example: Circuit breaker opened after 5 failures (2.1s)
- Example: Retries averaged 1.8 per request (10% under limit)

**❌ FAIL Criteria:**

- `[List failed criteria]`
- Example: Circuit breaker never opened (stayed CLOSED throughout)
- Example: Retries averaged 3.5 per request (75% over limit)

**🔍 Additional Findings:**

- Graceful degradation: `[Yes/No]` — Fallback path activated
- Cascading failures: `[Yes/No]` — Did failures spread to other services?
- Alert firing: BrownoutP95Exceeded `[fired/not fired]`

### Resilience Index Calculation

```
P95_score        = min(1.0, 2000 / [XXXX]) = [X.XX]
ErrorRate_score  = 1.0 - min(1.0, [X.XX] / 0.30) = [X.XX]
Recovery_score   = min(1.0, 60 / [XX]) = [X.XX]
DataIntegrity_score = [1.0 | 0.0]

F2_RI = 0.35×[X.XX] + 0.25×[X.XX] + 0.25×[X.XX] + 0.15×[X.XX] = [X.XX]
```

**Fault F2 Resilience Index:** `[X.XX]` / 1.00 `[✅ PASS ≥0.90 | ❌ FAIL <0.90]`

### Remediation Actions (if failed)

**Priority:** `[CRITICAL/HIGH/MEDIUM]`

**Effort:** `[X]` hours

**Actions:**

1. `[Action item 1]` — `[X]`h
2. `[Action item 2]` — `[X]`h

---

## Part 3: Fault F3 — Redis Brownout (+200ms)

### Setup

**Objective:** Validate cache layer resilience and database fallback under Redis degradation.

**Fault Configuration:**
- **Mechanism:** Chaos Mesh NetworkChaos (network latency injection)
- **Latency:** +200ms (jitter ±50ms)
- **Duration:** 10 minutes
- **Target:** Redis pod (labelSelector: app=redis)
- **Load:** 100 VUs read path

**Expected Behavior:**
- Cache hit rate falls but 0 data errors (no stale reads)
- Database fallback activates for cache misses
- P95 endpoint latency ≤800ms (degraded but acceptable)
- Recovery within 60s post-fault

### Execution

```bash
# Apply Chaos Mesh network latency
kubectl apply -f ops/tests/chaos/chaos-mesh/network-latency.yaml

# Run k6 load test
API_BASE=https://api.terrafusion.local k6 run ops/tests/chaos/k6/brownout-read-api.js

# Observe Redis metrics
redis:cache_hit_rate
redis_connected_clients

# Cleanup
kubectl delete networkchaos rediscache-latency
```

### Results

**Metrics:**

```
[PASTE k6 OUTPUT HERE]

P95 Latency: [XXX]ms [✅ PASS | ❌ FAIL] (target: <800ms)
Error Rate: [X.X]% [✅ PASS | ❌ FAIL] (target: <1%)
Cache Hit Rate (Before): 90%
Cache Hit Rate (During): [XX]%
Cache Hit Rate (After): [XX]%
Data Integrity Errors: [X] [✅ PASS = 0 | ❌ FAIL > 0]
Database Queries (fallback): +[XXX] queries
Recovery Time: [XX]s
```

### Observations

**✅ PASS Criteria:**

- `[List passed criteria]`
- Example: P95 stayed at 780ms (3% under threshold)
- Example: Zero stale reads detected (cache invalidation worked)

**❌ FAIL Criteria:**

- `[List failed criteria]`
- Example: P95 spiked to 950ms (19% over threshold)
- Example: 3 stale reads detected (cache invalidation failed)

**🔍 Additional Findings:**

- Database load: Queries increased by `[XX]`% (cache misses → DB fallback)
- Redis connection pool: `[Stable/Unstable]` during latency injection
- Pub/sub cache invalidation: `[Working/Not working]`

### Resilience Index Calculation

```
P95_score        = min(1.0, 800 / [XXX]) = [X.XX]
ErrorRate_score  = 1.0 - min(1.0, [X.XX] / 0.01) = [X.XX]
Recovery_score   = min(1.0, 60 / [XX]) = [X.XX]
DataIntegrity_score = ([X] == 0 ? 1.0 : 0.0)

F3_RI = 0.35×[X.XX] + 0.25×[X.XX] + 0.25×[X.XX] + 0.15×[X.XX] = [X.XX]
```

**Fault F3 Resilience Index:** `[X.XX]` / 1.00 `[✅ PASS ≥0.90 | ❌ FAIL <0.90]`

---

## Part 4: Fault F4 — Redis Pod Kill

### Setup

**Objective:** Validate Redis failover and connection pool resilience.

**Fault Configuration:**
- **Mechanism:** Chaos Mesh PodChaos (pod-kill)
- **Mode:** one (kill 1 pod)
- **Target:** Redis pod (labelSelector: app=redis)
- **Load:** 100 VUs read path (start immediately after kill)

**Expected Behavior:**
- Kubernetes replaces pod <10s
- 5xx error spike <1% (5min window)
- Connection pool recovers gracefully (no connection exhaustion)
- Cache state restored (no data loss)

### Execution

```bash
# Kill Redis pod
kubectl apply -f ops/tests/chaos/chaos-mesh/pod-kill-redis.yaml

# Run k6 load test immediately
API_BASE=https://api.terrafusion.local k6 run ops/tests/chaos/k6/brownout-read-api.js

# Observe pod replacement
kubectl get pods -n terrafusion -l app=redis --watch
```

### Results

**Metrics:**

```
Pod Replacement Time: [XX]s [✅ PASS <10s | ❌ FAIL ≥10s]
P95 Latency (spike window): [XXXX]ms
Error Rate (5min window): [X.X]% [✅ PASS <1% | ❌ FAIL ≥1%]
Connection Pool Recovery: [XX]s
Data Loss: [Yes/No] — [X] keys lost
```

**Pod Timeline:**

```
Time    | Event
--------|-----------------------------------------------
T+0s    | Redis pod killed (pod-kill-redis applied)
T+[X]s  | Kubernetes detects pod failure
T+[X]s  | New Redis pod scheduled
T+[X]s  | Pod running, connections accepted
T+[X]s  | Application connection pool restored
```

### Observations

**✅ PASS Criteria:**

- `[List passed criteria]`

**❌ FAIL Criteria:**

- `[List failed criteria]`

### Resilience Index Calculation

```
P95_score        = min(1.0, 1000 / [XXXX]) = [X.XX]
ErrorRate_score  = 1.0 - min(1.0, [X.XX] / 0.01) = [X.XX]
Recovery_score   = min(1.0, 10 / [XX]) = [X.XX]
DataIntegrity_score = ([cache_data_loss] == 0 ? 1.0 : 0.0)

F4_RI = 0.35×[X.XX] + 0.25×[X.XX] + 0.25×[X.XX] + 0.15×[X.XX] = [X.XX]
```

**Fault F4 Resilience Index:** `[X.XX]` / 1.00

---

## Part 5: Fault F5 — Kafka Bandwidth Throttle (50%)

### Setup

**Objective:** Validate Kafka producer backpressure and consumer lag recovery.

**Fault Configuration:**
- **Mechanism:** Kafka broker quota or tc bandwidth limit
- **Throttle:** 50% bandwidth reduction
- **Duration:** 15 minutes
- **Load:** Spike test (property creation events → Kafka)

**Expected Behavior:**
- Producer backpressure activates (buffering)
- Consumer lag grows but stabilizes
- Lag clears <5min post-fault
- No message loss (at-least-once delivery)

### Execution

```bash
# Apply Kafka broker quota
kafka-configs.sh --alter \
  --add-config 'producer_byte_rate=52428800' \
  --entity-type clients --entity-name terrafusion-producer \
  --bootstrap-server kafka:9092

# Run spike test
API_BASE=https://api.terrafusion.local k6 run ops/tests/chaos/k6/spike-retry-grid.js

# Observe consumer lag
kafka:consumer_lag{topic="property-events"}
```

### Results

**Metrics:**

```
Producer Backpressure: [Yes/No] — Buffering activated
Consumer Lag (before): [XXXX] messages
Consumer Lag (peak): [XXXX] messages
Consumer Lag (after): [XXXX] messages
Lag Clear Time: [XXX]s [✅ PASS <300s | ❌ FAIL ≥300s]
Message Loss: [X] messages [✅ PASS = 0 | ❌ FAIL > 0]
```

### Observations

**✅ PASS Criteria:**

- `[List passed criteria]`

**❌ FAIL Criteria:**

- `[List failed criteria]`

### Resilience Index Calculation

```
F5_RI = [X.XX]
```

**Fault F5 Resilience Index:** `[X.XX]` / 1.00

---

## Part 6: Fault F6 — Database Read-Replica Stall (+250ms)

### Setup

**Objective:** Validate read-replica routing and database fallback.

**Fault Configuration:**
- **Mechanism:** Chaos Mesh NetworkChaos on read-replica pod
- **Latency:** +250ms
- **Duration:** 10 minutes
- **Load:** 100 VUs read path

**Expected Behavior:**
- Read queries degrade (+250ms)
- Write queries unaffected (primary not touched)
- Graceful degradation (fallback to primary or cached data)

### Execution

```bash
# [Environment-specific setup]
```

### Results

**Metrics:**

```
[PASTE RESULTS HERE]
```

### Resilience Index Calculation

```
F6_RI = [X.XX]
```

**Fault F6 Resilience Index:** `[X.XX]` / 1.00

---

## Part 7: Fault F7 — API Pod Kill (1 of 3)

### Setup

**Objective:** Validate HPA (Horizontal Pod Autoscaler) and load balancer resilience.

**Fault Configuration:**
- **Mechanism:** Chaos Mesh PodChaos (pod-kill)
- **Mode:** one (kill 1 of 3 API pods)
- **Load:** 100 VUs read path (start immediately)

**Expected Behavior:**
- HPA replaces pod <60s
- SLOs preserved (P95, error rate)
- Load balancer routes around failed pod

### Execution

```bash
# Kill API pod
kubectl apply -f ops/tests/chaos/chaos-mesh/pod-kill-api.yaml

# Run k6 load test immediately
API_BASE=https://api.terrafusion.local k6 run ops/tests/chaos/k6/brownout-read-api.js
```

### Results

**Metrics:**

```
Pod Replacement Time: [XX]s [✅ PASS <60s | ❌ FAIL ≥60s]
P95 Latency (spike window): [XXX]ms
Error Rate (5min window): [X.X]% [✅ PASS <1% | ❌ FAIL ≥1%]
Load Balancer Routing: [Immediate/Delayed] — [XX]s to detect failure
```

### Resilience Index Calculation

```
F7_RI = [X.XX]
```

**Fault F7 Resilience Index:** `[X.XX]` / 1.00

---

## Part 8: Overall Resilience Index & Decision

### Individual Fault Scores

| Fault | Weight | RI Score | Weighted Score |
|-------|--------|----------|----------------|
| F1 (API Latency) | 0.20 | `[X.XX]` | `[X.XXX]` |
| F2 (Packet Loss) | 0.20 | `[X.XX]` | `[X.XXX]` |
| F3 (Redis Brownout) | 0.15 | `[X.XX]` | `[X.XXX]` |
| F4 (Redis Kill) | 0.10 | `[X.XX]` | `[X.XXX]` |
| F5 (Kafka Throttle) | 0.10 | `[X.XX]` | `[X.XXX]` |
| F6 (DB Read Stall) | 0.15 | `[X.XX]` | `[X.XXX]` |
| F7 (API Pod Kill) | 0.10 | `[X.XX]` | `[X.XXX]` |
| **TOTAL** | **1.00** | — | **`[X.XX]`** |

### Overall Resilience Index

```
Overall_RI = Σ (fault_weight_i × fault_RI_i)
           = [X.XXX] + [X.XXX] + [X.XXX] + [X.XXX] + [X.XXX] + [X.XXX] + [X.XXX]
           = [X.XX]
```

**Overall Resilience Index:** `[X.XX]` / 1.00

### Decision Matrix Application

**Condition:** `[Overall_RI ≥ 0.95 | 0.90 ≤ Overall_RI < 0.95 | Overall_RI < 0.90]`

**Decision:** `[GO | CONDITIONAL GO | NO-GO]`

**Justification:**

`[Explain decision based on RI score, fault failures, and risk assessment]`

---

## Part 9: Week 2 Remediation Plan

### Critical Priority (Must-Fix Before PROD-0)

**Total Effort:** `[X]` hours

1. **`[Action Item 1]`** — `[X]`h
   - **Fault:** F`[X]`
   - **Root Cause:** `[Description]`
   - **Fix:** `[Implementation steps]`
   - **Expected Improvement:** RI `[X.XX]` → `[X.XX]`
   - **Owner:** `[Team/Person]`
   - **Deadline:** `[Date]`

2. **`[Action Item 2]`** — `[X]`h
   - (Same structure)

### High Priority (Should Fix Week 2)

**Total Effort:** `[X]` hours

(List items)

### Medium Priority (Nice-to-Have)

**Total Effort:** `[X]` hours

(List items)

---

## Part 10: Production Readiness Assessment

### PROD-0 Simulation Readiness

**Overall Assessment:** `[✅ READY | ⚠️ READY WITH CONDITIONS | ❌ NOT READY]`

**Conditions (if applicable):**

1. `[Condition 1]` — Must complete before PROD-0
2. `[Condition 2]` — Must complete before PROD-0

**Risk Level:** `[LOW | MEDIUM | HIGH | CRITICAL]`

**Target PROD-0 Date:** `[October 14 | October 16 | October 21, 2025]`

### Sign-Off

```
Chaos Test Review: Phase 4.9 Week 1 Day 7
Date: October 7, 2025
Engineer: [Name]

Overall Resilience Index: [X.XX]
Decision: [GO | CONDITIONAL GO | NO-GO]

Production Readiness: [✅ Ready | ⚠️ Ready with conditions | ❌ Not ready]

Next Steps:
1. [Action item 1]
2. [Action item 2]
3. Target PROD-0: [Date]

Signed: ___________________
Date: ___________________
```

---

## Appendices

### Appendix A: Test Artifacts

**Directory:** `ops/tests/chaos/results/`

**Files:**
- `prometheus_p95_f1.png` — P95 chart during F1
- `prometheus_error_rate_f2.png` — Error rate spike during F2
- `jaeger_trace_f1_during.json` — Trace export (F1)
- `circuit_breaker_timeline_f2.png` — CB state transitions
- `alert_timeline.png` — Alert Manager screenshot
- `k6-brownout-read-summary.json` — k6 test results
- `k6-spike-retry-summary.json` — k6 spike test results
- `resilience_scorecard.json` — Final RI calculation

### Appendix B: Infrastructure Configuration

**Chaos Mesh Version:** `[X.X.X]`

**Istio Version:** `[X.X.X]`

**k6 Version:** `[X.X.X]`

**Kubernetes Cluster:**
- Nodes: `[X]`
- API Pods: `[X]` replicas (HPA min=3, max=10)
- Redis Pods: `[X]` replicas
- Database: PostgreSQL `[X.X]` (primary + read-replica)
- Kafka: `[X]` brokers, `[X]` partitions

### Appendix C: Prometheus Queries

```promql
# P95 latency
job:http_request_duration_seconds:p95{job="api",route="/v1/properties"}

# Error rate
api:error_rate{job="api"}

# Circuit breaker state
circuit_breaker_state{service="api"}

# Kafka consumer lag
kafka:consumer_lag{topic="property-events"}

# Redis cache hit rate
redis:cache_hit_rate
```

### Appendix D: References

- **Chaos Test README:** `ops/tests/chaos/README.md`
- **Scoring Rubric:** `ops/tests/chaos/scorecard/rubric.yaml`
- **Decision Matrix:** `ops/tests/chaos/scorecard/decision-matrix.md`
- **Day 6 Integration Review:** `docs/phase4.9/week1/day6-integration-review.md`
- **Week 7 Circuit Breaker POC:** `WEEK_7_PART_1_CIRCUIT_BREAKERS.md`

---

**Phase 4.9 Week 1 • Day 7 • Brown-Out Chaos Test Review**

**Document Status:** `[DRAFT | READY FOR REVIEW | FINAL]`

**Last Updated:** `[Date/Time]`
