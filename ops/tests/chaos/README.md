# Day 7 — Brown-Out Chaos Test (Execution Pack)

**Phase 4.9 Week 1 • Day 7 • October 7, 2025**

## Executive Summary

Complete fault-injection test suite to validate TerraFusion OS resilience under production-like degradation scenarios. Seven fault types target API, network, cache, message queue, and database layers with quantifiable success criteria.

**Target Resilience Index:** ≥0.90 (GO decision threshold)

---

## Quick Start

```bash
# 1. Prepare monitoring capture
make chaos:prep

# 2. Run fault scenarios (F1-F7)
make chaos:fault:150ms        # F1: API latency injection
make chaos:fault:loss30       # F2: Packet loss 30%
make chaos:redis:latency      # F3: Redis brownout
make chaos:redis:kill         # F4: Redis pod kill
make chaos:api:kill           # F7: API pod kill

# 3. Run load tests during faults
API_BASE=https://api.terrafusion.local make chaos:k6:read
API_BASE=https://api.terrafusion.local make chaos:k6:spike

# 4. Generate report
make chaos:report
```

---

## Fault-Injection Matrix

| ID | Layer | Fault              | Magnitude   | Duration | Success Criteria                                                  |
|----|-------|--------------------|-------------|----------|------------------------------------------------------------------|
| F1 | API   | Latency inject     | +150 ms     | 15 min   | P95 endpoint ≤500ms; error rate <1%; backlog drains <2min        |
| F2 | Net   | Packet loss        | 30%         | 10 min   | Retries cap ≤2; CB opens ≤2s; P95 recovers ≤60s post-fault       |
| F3 | Cache | Redis brownout     | +200 ms RTT | 10 min   | Hit rate falls but 0 data errors; fallback path keeps P95 ≤800ms |
| F4 | Cache | Redis pod kill     | n/a         | one-shot | Failover <10s; app no 5xx spikes >1% window                       |
| F5 | MQ    | Kafka throttle     | 50% bw      | 15 min   | Producer backpressure OK; consumer lag clears <5min               |
| F6 | DB    | Read-replica stall | +250 ms     | 10 min   | Read routing degrades gracefully; write P95 steady                |
| F7 | App   | API pod kill (1/3) | n/a         | one-shot | HPA replaces <60s; SLOs preserved                                 |

---

## Directory Structure

```
ops/tests/chaos/
├─ README.md                       # This file
├─ make.targets.mk                 # Makefile targets
├─ k6/                             # Load test scripts
│  ├─ brownout-read-api.js         # Standard read path (100 VUs, 15min)
│  └─ spike-retry-grid.js          # Spike test for circuit breaker (0→500 VUs)
├─ istio/                          # Istio VirtualService fault injection
│  ├─ fault-injection-150ms.yaml   # F1: API latency +150ms
│  └─ fault-injection-30pct-loss.yaml # F2: Packet loss 30%
├─ chaos-mesh/                     # Chaos Mesh experiments
│  ├─ network-latency.yaml         # F3: Redis network latency +200ms
│  ├─ network-loss.yaml            # (Optional) Network packet loss
│  ├─ pod-kill-redis.yaml          # F4: Redis pod kill
│  └─ pod-kill-api.yaml            # F7: API pod kill
├─ toxiproxy/                      # ToxiProxy configs (local/dev alternative)
│  └─ redis_latency.json           # Redis latency simulation
├─ prometheus/                     # Prometheus recording rules & alerts
│  ├─ chaos-alerts.yaml            # 2 alerts: BrownoutP95Exceeded, ErrorRateSpike
│  └─ recording-rules.yaml         # 3 rules: p95, error_rate, consumer_lag
├─ scorecard/                      # Resilience scoring
│  ├─ rubric.yaml                  # Weighted scoring formula
│  └─ decision-matrix.md           # GO/NO-GO decision matrix
└─ results/                        # Test outputs (Prometheus exports, Jaeger traces, screenshots)
```

---

## Execution Sequence (Full Test Run)

### Phase 1: Preparation (5 min)

```bash
# Deploy Prometheus recording rules & alerts
make chaos:prep

# Verify monitoring stack ready
kubectl get prometheus -n observability
kubectl get alertmanager -n observability
```

### Phase 2: API Fault Injection (F1, ~20 min)

```bash
# Apply Istio fault injection: +150ms latency
make chaos:fault:150ms

# Run read path load test (100 VUs, 15min)
API_BASE=https://api.terrafusion.local make chaos:k6:read

# Observe:
# - Prometheus: job:http_request_duration_seconds:p95{job="api"}
# - Jaeger: Trace timeline for /v1/properties
# - Expected: P95 stays <500ms (budget: 350ms baseline + 150ms fault)
```

**Cleanup:**
```bash
kubectl delete virtualservice api-brownout-150ms
```

### Phase 3: Network Packet Loss (F2, ~15 min)

```bash
# Apply Istio fault: 30% abort (simulates packet loss)
make chaos:fault:loss30

# Run spike test (0→500 VUs ramp)
API_BASE=https://api.terrafusion.local make chaos:k6:spike

# Observe:
# - Circuit breaker state transitions (CLOSED → OPEN → HALF_OPEN)
# - Retry attempts (should cap at 2 per request)
# - Recovery time post-fault (<60s to P95 baseline)
```

**Cleanup:**
```bash
kubectl delete virtualservice api-packet-loss-30pct
```

### Phase 4: Redis Brownout (F3, ~15 min)

```bash
# Apply Chaos Mesh network latency: Redis +200ms
make chaos:redis:latency

# Run read path load test
API_BASE=https://api.terrafusion.local make chaos:k6:read

# Observe:
# - Redis hit rate drop (90% → ~60-70% expected)
# - Database fallback activates (cache misses → DB queries)
# - P95 endpoint latency degrades but stays <800ms
# - Zero data integrity errors (stale reads)
```

**Cleanup:**
```bash
kubectl delete networkchaos rediscache-latency
```

### Phase 5: Redis Pod Kill (F4, ~10 min)

```bash
# Kill one Redis pod (simulates node failure)
make chaos:redis:kill

# Run read path load test immediately
API_BASE=https://api.terrafusion.local make chaos:k6:read

# Observe:
# - Pod replacement <10s (Kubernetes)
# - 5xx spike window <1% (measure over 5min window)
# - Connection pool recovers gracefully
```

**Cleanup:** (auto-recovered by Kubernetes)

### Phase 6: Kafka Throttle (F5, ~20 min)

**Manual setup required** (environment-specific):

```bash
# Option A: Apply broker quota (Kafka cluster)
kafka-configs.sh --alter \
  --add-config 'producer_byte_rate=52428800' \
  --entity-type clients --entity-name terrafusion-producer \
  --bootstrap-server kafka:9092

# Option B: tc bandwidth limit (Linux node)
tc qdisc add dev eth0 root tbf rate 50mbit burst 32kbit latency 400ms

# Run spike test to generate backpressure
API_BASE=https://api.terrafusion.local make chaos:k6:spike

# Observe:
# - Producer backpressure activates (buffering)
# - Consumer lag grows but stabilizes
# - Lag clears <5min post-fault
# - No message loss (at-least-once delivery)
```

**Cleanup:**
```bash
kafka-configs.sh --alter \
  --delete-config 'producer_byte_rate' \
  --entity-type clients --entity-name terrafusion-producer \
  --bootstrap-server kafka:9092
```

### Phase 7: Database Read-Replica Stall (F6, ~15 min)

**Manual setup required** (use Chaos Mesh or pg_sleep injection):

```bash
# Option A: Chaos Mesh network latency on read replica pod
kubectl apply -f ops/tests/chaos/chaos-mesh/db-read-replica-latency.yaml

# Option B: PostgreSQL pg_sleep injection (dev only)
# UPDATE properties SET data = pg_sleep(0.25) WHERE ...  # NOT RECOMMENDED

# Run read path load test
API_BASE=https://api.terrafusion.local make chaos:k6:read

# Observe:
# - Read queries degrade (+250ms)
# - Write queries unaffected (primary not touched)
# - Application graceful degradation (fallback to primary or cached data)
```

**Cleanup:**
```bash
kubectl delete networkchaos db-read-replica-latency
```

### Phase 8: API Pod Kill (F7, ~10 min)

```bash
# Kill 1 of 3 API pods
make chaos:api:kill

# Run read path load test immediately
API_BASE=https://api.terrafusion.local make chaos:k6:read

# Observe:
# - HPA replaces pod <60s
# - SLOs preserved (P95, error rate)
# - Load balancer routes around failed pod
```

**Cleanup:** (auto-recovered by Kubernetes HPA)

---

## Monitoring & Capture

### Prometheus Queries (run during/after faults)

```promql
# P95 latency (target: <500ms under F1)
job:http_request_duration_seconds:p95{job="api",route="/v1/properties"}

# Error rate (target: <1%)
api:error_rate{job="api"}

# Kafka consumer lag (target: clears <5min)
kafka:consumer_lag{topic="property-events"}

# Circuit breaker state
circuit_breaker_state{service="api"}
```

### Jaeger Traces

Capture 3 key routes **before, during, after** each fault:

1. `GET /v1/properties` (read path with cache)
2. `POST /v1/properties` (write path with Kafka event)
3. `GET /v1/properties/{id}` (single-item cache hit)

Export trace JSON for analysis:
```bash
curl "http://jaeger:16686/api/traces/{trace_id}" > results/trace_f1_during.json
```

### Alert Manager

Monitor for:
- `BrownoutP95Exceeded` (fires if P95 >500ms for 2min)
- `ErrorRateSpike` (fires if 5xx rate >1% for 2min)

---

## Scoring Rubric

**Resilience Index Formula** (from `scorecard/rubric.yaml`):

```
RI = 0.35 × P95_score + 0.25 × ErrorRate_score + 0.25 × Recovery_score + 0.15 × DataIntegrity_score

Where:
  P95_score        = min(1, 500ms / actual_p95)
  ErrorRate_score  = 1 - min(1, actual_error_rate / 0.01)
  Recovery_score   = min(1, 60s / actual_recovery_time)
  DataIntegrity_score = (data_errors == 0 ? 1 : 0)
```

**Decision Matrix:**

| Resilience Index | Decision          | Action Required                                         |
|------------------|-------------------|---------------------------------------------------------|
| ≥0.95            | GO                | Resilient, vendor-demo ready, proceed to PROD-0         |
| 0.90–0.94        | CONDITIONAL GO    | Fix listed items in Week 2, re-test before PROD-0       |
| <0.90            | NO-GO             | Run Week 2 remediations first, defer PROD-0 to Week 3   |

---

## Expected Outputs

### 1. Technical Report

**File:** `docs/phase4.9/week1/day7-chaos-review.md` (~800 lines)

**Sections:**
- Executive Summary (Resilience Index, GO/NO-GO)
- Fault Matrix Results (7 rows: setup, observed metrics, pass/fail)
- Infrastructure Observations (circuit breaker timelines, HPA behavior)
- Prometheus Metrics (charts: p95, error_rate, consumer_lag)
- Jaeger Trace Analysis (3 routes × 7 faults = 21 traces)
- Week 2 Remediation Actions (if RI <0.90)
- Appendices (alert timelines, configuration snapshots)

### 2. Executive Summary

**File:** `DAY_7_CHAOS_COMPLETE.md` (~300 lines)

**Sections:**
- Executive Summary (Resilience Index, key findings)
- Fault Results Summary Table (7 faults: PASS/FAIL)
- Week 1 Completion Status (7/7 days, total documentation lines)
- PROD-0 Readiness Decision (GO/NO-GO with conditions)
- Week 2 Action Plan (if needed)
- Next Steps (PROD-0 simulation or Week 2 fixes)

### 3. Test Artifacts

**Directory:** `ops/tests/chaos/results/`

**Files:**
- `prometheus_p95_f1.png` (P95 chart during F1)
- `prometheus_error_rate_f2.png` (Error rate spike during F2)
- `jaeger_trace_f1_during.json` (Trace export)
- `circuit_breaker_timeline_f2.png` (CB state transitions)
- `alert_timeline.png` (Alert Manager screenshot)
- `resilience_scorecard.json` (Final RI calculation)

---

## Troubleshooting

### Issue: k6 load test fails with connection errors

**Cause:** API endpoint not reachable or incorrect `API_BASE`

**Fix:**
```bash
# Verify API endpoint
kubectl get svc -n terrafusion | grep api
kubectl port-forward -n terrafusion svc/api 8080:80

# Test with curl
curl http://localhost:8080/v1/health

# Update API_BASE
export API_BASE=http://localhost:8080
make chaos:k6:read
```

### Issue: Chaos Mesh experiments not applying

**Cause:** Chaos Mesh not installed or incorrect namespace

**Fix:**
```bash
# Install Chaos Mesh
kubectl apply -f https://mirrors.chaos-mesh.org/latest/crd.yaml
kubectl apply -f https://mirrors.chaos-mesh.org/latest/chaos-mesh.yaml

# Verify installation
kubectl get pods -n chaos-testing
```

### Issue: Prometheus alerts not firing

**Cause:** Recording rules not loaded or alert manager not configured

**Fix:**
```bash
# Reload Prometheus config
kubectl exec -n observability prometheus-0 -- kill -HUP 1

# Verify rules loaded
kubectl exec -n observability prometheus-0 -- promtool check rules /etc/prometheus/rules/chaos-alerts.yaml
```

### Issue: Jaeger traces incomplete

**Cause:** Sampling rate too low or trace context not propagated

**Fix:**
```bash
# Increase sampling (config/opentelemetry/otel-collector.yml)
sampling:
  default_sampling_probability: 1.0  # 100% during chaos tests

# Restart OTel collector
kubectl rollout restart -n observability deployment/otel-collector
```

---

## References

- **Day 6 Integration Review:** `docs/phase4.9/week1/day6-integration-review.md` (circuit breaker POC, distributed tracing infrastructure)
- **Week 7 Circuit Breaker POC:** `WEEK_7_PART_1_CIRCUIT_BREAKERS.md` (84.6% error reduction validation)
- **Prometheus Best Practices:** https://prometheus.io/docs/practices/rules/
- **Chaos Mesh Documentation:** https://chaos-mesh.org/docs/
- **k6 Load Testing:** https://k6.io/docs/

---

## Changelog

- **2025-10-07:** Initial chaos test pack created (Day 7, Phase 4.9 Week 1)

---

**Phase 4.9 Week 1 • Day 7 • Brown-Out Chaos Test**
