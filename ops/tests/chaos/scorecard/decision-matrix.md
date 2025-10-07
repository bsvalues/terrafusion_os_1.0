# TerraFusion OS — Chaos Test Decision Matrix

**Phase 4.9 Week 1 • Day 7 • October 7, 2025**

## Purpose

This decision matrix translates the **Resilience Index (RI)** from chaos test results into an actionable **GO/NO-GO decision** for PROD-0 simulation readiness.

---

## Decision Rules

### Rule 1: GO (Unconditional)

**Condition:**
```
Overall Resilience Index ≥ 0.95
```

**Decision:** **GO** — Proceed to PROD-0 simulation immediately

**Rationale:**
- All fault scenarios passed with >95% resilience score
- System demonstrates production-grade fault tolerance
- Circuit breakers, retries, and graceful degradation validated
- No critical remediations required

**Next Steps:**
1. Document chaos test results (day7-chaos-review.md)
2. Update Week 1 progress tracker (7/7 days complete)
3. Proceed to PROD-0 simulation (Phase 4.10)
4. Target PROD-0 launch: October 14, 2025

**Example Scenario:**
```
F1 (API Latency): RI = 0.96 (P95 480ms, error rate 0.5%)
F2 (Packet Loss): RI = 0.98 (retries ≤2, recovery 45s)
F3 (Redis Brownout): RI = 0.94 (P95 750ms, 0 data errors)
F4 (Redis Kill): RI = 0.97 (failover 8s, 0.3% spike)
F5 (Kafka Throttle): RI = 0.95 (lag cleared 240s)
F6 (DB Read Stall): RI = 0.93 (graceful degradation)
F7 (API Pod Kill): RI = 0.98 (HPA replaced 45s)

Overall RI = 0.96 → GO ✅
```

---

### Rule 2: CONDITIONAL GO

**Condition:**
```
0.90 ≤ Overall Resilience Index < 0.95
```

**Decision:** **CONDITIONAL GO** — Proceed with Week 2 fixes, re-test before PROD-0

**Rationale:**
- System demonstrates good fault tolerance (≥90%)
- Minor gaps identified in specific fault scenarios
- Remediations are low-effort (<40 hours total)
- Risk is manageable with targeted fixes

**Next Steps:**
1. Document chaos test results with failure analysis
2. Create Week 2 remediation plan (prioritize MUST-FIX items)
3. Re-run failed fault scenarios after fixes
4. Proceed to PROD-0 only after re-test passes
5. Target PROD-0 launch: October 14-16, 2025 (2-day buffer)

**Remediation Categories:**

| Priority | Effort | Example Remediations |
|----------|--------|----------------------|
| MUST-FIX | <16h   | Circuit breaker timeout tuning, retry backoff optimization, cache pre-warming |
| SHOULD-FIX | 16-24h | HPA scaling threshold adjustment, Kafka consumer parallelism, read-replica routing |
| NICE-TO-HAVE | >24h | Advanced observability, chaos automation, load shedding policies |

**Example Scenario:**
```
F1 (API Latency): RI = 0.92 (P95 520ms, FAILED threshold)
F2 (Packet Loss): RI = 0.94 (retries ≤2, recovery 55s)
F3 (Redis Brownout): RI = 0.88 (P95 850ms, FAILED threshold)
F4 (Redis Kill): RI = 0.95 (failover 9s)
F5 (Kafka Throttle): RI = 0.90 (lag cleared 280s)
F6 (DB Read Stall): RI = 0.91 (graceful degradation)
F7 (API Pod Kill): RI = 0.96 (HPA replaced 50s)

Overall RI = 0.92 → CONDITIONAL GO ⚠️

Remediation Plan (12 hours):
- F1 Fix: Optimize API endpoint caching (+25ms reduction) — 4h
- F3 Fix: Implement cache pre-warming strategy (hit rate 60%→85%) — 6h
- F5 Fix: Increase Kafka consumer parallelism (lag clear 280s→240s) — 2h

Expected Post-Remediation RI: 0.94 → CONDITIONAL GO (acceptable)
```

---

### Rule 3: NO-GO

**Condition:**
```
Overall Resilience Index < 0.90
```

**Decision:** **NO-GO** — Defer PROD-0, run Week 2 remediations first

**Rationale:**
- System demonstrates insufficient fault tolerance (<90%)
- Critical gaps in multiple fault scenarios
- Remediations require substantial effort (>40 hours)
- Risk of cascading failures or data integrity issues

**Next Steps:**
1. Document chaos test results with root cause analysis
2. Create comprehensive Week 2 remediation plan
3. Prioritize CRITICAL fixes (circuit breakers, retries, failover)
4. Re-run full chaos test suite after remediations
5. Defer PROD-0 to Week 3 (October 21, 2025)

**Remediation Categories:**

| Priority | Effort | Example Remediations |
|----------|--------|----------------------|
| CRITICAL | <24h   | Circuit breaker not opening, retry exhaustion, no graceful degradation |
| HIGH | 24-40h | Failover timeout >60s, cascading failures, data integrity errors |
| MEDIUM | 40-80h | Observability gaps, recovery time >5min, manual intervention required |

**Example Scenario:**
```
F1 (API Latency): RI = 0.75 (P95 680ms, FAILED badly)
F2 (Packet Loss): RI = 0.65 (retries >5, circuit breaker never opened)
F3 (Redis Brownout): RI = 0.88 (P95 850ms, 2 stale reads)
F4 (Redis Kill): RI = 0.70 (failover 18s, 5% error spike)
F5 (Kafka Throttle): RI = 0.60 (lag never cleared, manual restart)
F6 (DB Read Stall): RI = 0.82 (no fallback, writes affected)
F7 (API Pod Kill): RI = 0.90 (HPA replaced 58s)

Overall RI = 0.76 → NO-GO ❌

Remediation Plan (60 hours):
- F2 CRITICAL: Implement circuit breaker (currently missing) — 12h
- F4 CRITICAL: Fix Redis failover timeout (18s→10s) — 8h
- F5 CRITICAL: Fix Kafka consumer lag (manual intervention required) — 16h
- F1 HIGH: API endpoint optimization (P95 680ms→500ms) — 16h
- F6 HIGH: Implement DB read-replica fallback — 8h

Expected Post-Remediation RI: 0.91 → CONDITIONAL GO (re-test required)
```

---

## Decision Matrix Table

| Resilience Index | Decision | Action | Timeline | Risk Level |
|------------------|----------|--------|----------|------------|
| ≥0.95 | GO | Proceed to PROD-0 immediately | Oct 14 | LOW |
| 0.90–0.94 | CONDITIONAL GO | Fix items in Week 2, re-test | Oct 14-16 | MEDIUM |
| 0.80–0.89 | NO-GO | Week 2 remediations, defer PROD-0 | Oct 21 | HIGH |
| <0.80 | NO-GO (CRITICAL) | Comprehensive fixes, Week 3 defer | Oct 28+ | CRITICAL |

---

## Scoring Calculation

### Individual Fault Resilience Index

```
Fault_RI = 0.35 × P95_score + 0.25 × ErrorRate_score + 0.25 × Recovery_score + 0.15 × DataIntegrity_score

Where:
  P95_score        = min(1.0, threshold_p95 / actual_p95)
  ErrorRate_score  = 1.0 - min(1.0, actual_error_rate / threshold_error_rate)
  Recovery_score   = min(1.0, threshold_recovery / actual_recovery)
  DataIntegrity_score = (data_errors == 0 ? 1.0 : 0.0)
```

### Overall Resilience Index

```
Overall_RI = Σ (fault_weight_i × fault_RI_i)

Fault Weights:
  F1 (API Latency):        0.20
  F2 (Packet Loss):        0.20
  F3 (Redis Brownout):     0.15
  F4 (Redis Kill):         0.10
  F5 (Kafka Throttle):     0.10
  F6 (DB Read Stall):      0.15
  F7 (API Pod Kill):       0.10
```

---

## Validation Checklist

Before making GO/NO-GO decision, validate:

- [ ] All 7 fault scenarios executed (F1-F7)
- [ ] k6 load tests captured metrics (P95, error rate)
- [ ] Prometheus recording rules active (job:http_request_duration_seconds:p95)
- [ ] Jaeger traces captured (before, during, after faults)
- [ ] Circuit breaker state transitions documented
- [ ] Data integrity verified (0 stale reads, 0 message loss)
- [ ] Recovery time measured (post-fault baseline restoration)
- [ ] Alert Manager timelines captured (2 alerts: BrownoutP95Exceeded, ErrorRateSpike)
- [ ] Resilience Index calculated per rubric.yaml
- [ ] Remediation plan created (if RI < 0.95)

---

## Sign-Off Template

```
Chaos Test Results: Phase 4.9 Week 1 Day 7
Date: October 7, 2025
Engineer: [Name]

Overall Resilience Index: [X.XX]
Decision: [GO | CONDITIONAL GO | NO-GO]

Justification:
- [Summary of fault results]
- [Key findings]
- [Remediation plan (if applicable)]

Production Readiness:
[✅ Ready for PROD-0 | ⚠️ Ready with conditions | ❌ Not ready]

Next Steps:
1. [Action item 1]
2. [Action item 2]
3. [Target date for PROD-0]

Signed: ___________________
Date: ___________________
```

---

## References

- **Resilience Scoring Rubric:** `ops/tests/chaos/scorecard/rubric.yaml`
- **Chaos Test README:** `ops/tests/chaos/README.md`
- **Day 6 Integration Review:** `docs/phase4.9/week1/day6-integration-review.md` (circuit breaker POC, distributed tracing)
- **Week 7 Circuit Breaker POC:** `WEEK_7_PART_1_CIRCUIT_BREAKERS.md` (84.6% error reduction)

---

**Phase 4.9 Week 1 • Day 7 • Brown-Out Chaos Test Decision Matrix**
