# Performance & Reliability Claims Ledger

**Version:** 0.1 (Wave 0 — Schema + Catalog)  
**Status:** DRAFT — no enforcement gates  
**Last Updated:** 2026-02-13

---

## Purpose

This ledger catalogs every quantitative performance, reliability, and accuracy claim
found in TerraFusion OS architecture documentation. Each claim is assigned a stable
**CR-ID** and tracked through a lifecycle from DRAFT → EVIDENCED or RETIRED.

**Wave 0 (this document):** Schema definition + claim catalog. All claims start as
`NO-EVIDENCE`. No CI gates. No merge blocking.

**Wave 1 (deferred):** After Tier-1 UI/UX flows are fully implemented, attach
evidence artifacts (traces, metrics, benchmark receipts) and optionally wire
claims verification into the SEAL gate.

---

## Schema

Every claim is a row with these fields:

| Field | Type | Description |
|-------|------|-------------|
| **CR-ID** | `CR-XXXX` | Stable claim record identifier (never reused) |
| **Metric** | string | What is being measured (e.g., "API response time P95") |
| **Assertion** | string | The quantitative claim (e.g., "< 200ms") |
| **Scope** | string | User journey or component this applies to (never "platform-wide" without justification) |
| **Method** | string | How the claim would be verified (e.g., "k6 load test", "Prometheus query", "benchmark script") |
| **Environment** | string | Where measurement is valid (e.g., "CI runner", "staging AKS", "production") |
| **Workload** | string | Load profile assumed (e.g., "500 concurrent users", "100 req/s sustained") |
| **Evidence** | string | Pointer to artifact (URL, file path, CI job link) — empty until Wave 1 |
| **Validity** | string | Time window evidence covers (e.g., "2026-Q1", "Phase 15 benchmark run") |
| **Owner** | string | Person or team responsible for maintaining this claim |
| **Status** | enum | `DRAFT` · `NO-EVIDENCE` · `EVIDENCED` · `CONTESTED` · `RETIRED` |
| **Source** | string | File path(s) where the claim originates |

### Status Lifecycle

```
DRAFT → NO-EVIDENCE → EVIDENCED
                   ↘ CONTESTED → RETIRED
                                ↗
              EVIDENCED → RETIRED (if evidence expires)
```

- **DRAFT**: Claim discovered but not yet reviewed for accuracy.
- **NO-EVIDENCE**: Claim reviewed, assertion is clear, but no evidence artifact exists.
- **EVIDENCED**: Evidence artifact attached and verified.
- **CONTESTED**: Multiple conflicting claims exist (see Contradictions section).
- **RETIRED**: Claim withdrawn, superseded, or evidence expired.

---

## Contradictions Register

These claim conflicts must be resolved before any claim in the group can reach `EVIDENCED`.

### C1: Performance Multiplier — 379x vs 3.9x

| CR-ID | Assertion | Source |
|-------|-----------|--------|
| CR-0001 | 379x improvement via quantum-inspired algorithms | `docs/architecture/MASTER_ARCHITECTURE.md` L12 |
| CR-0002 | 3.9x realistic improvement (explicitly contradicts 379x) | `.ai/AI_SUITE_ARCHITECTURE.md` L48 |

**Resolution needed:** Define which operation, under what workload, shows what multiplier.
The `.ai/` docs call 379x "quantum claims" and propose 3.9x as realistic.

### C2: API Latency P95 Target — Six Different Numbers

| CR-ID | Assertion | Source |
|-------|-----------|--------|
| CR-0008 | P95 < 200ms | `docs/architecture/MASTER_ARCHITECTURE.md` L338 |
| CR-0009 | P95 < 150ms (citizen operations) | `.github/copilot-instructions-full.md` L308 |
| CR-0010 | P95 < 50ms, currently 6-7ms | `docs/architecture/MASTER_OPERATIONS.md` L1030 |
| CR-0011 | P95 < 6ms (government SLA) | `docs/architecture/MASTER_DEVELOPMENT.md` L654 |
| CR-0012 | P95 < 10ms (brand quality bar) | `.github/copilot-instructions-full.md` L331 |
| CR-0022 | P95 < 100ms (achievable SLO) | `docs/architecture/IMPLEMENTATION_REALITY_CHECK.md` L45 |

**Resolution needed:** Scope each target to a specific user journey + environment.

### C3: Uptime Target — 99.9% vs 99.99%

| CR-ID | Assertion | Source |
|-------|-----------|--------|
| CR-0034 | 99.9% uptime | `docs/architecture/MASTER_ARCHITECTURE.md` L340 |
| CR-0035 | 99.99% uptime | `.github/copilot-instructions-full.md` L331 |

**Resolution needed:** 99.9% = 8.7h/year downtime; 99.99% = 52min/year. Different operational commitments.

### C4: Throughput — 10,000 rps Achieved vs 1,247 rps Measured

| CR-ID | Assertion | Source |
|-------|-----------|--------|
| CR-0028 | 10,000+ req/s (marked "Achieved ✅") | `docs/architecture/MASTER_ARCHITECTURE.md` L339 |
| CR-0030 | 1,247 req/s (Phase 15 benchmark results) | `docs/phases/PHASE_15_...COMPLETE.md` L248 |
| CR-0033 | 1,000 req/s (achievable SLO) | `docs/architecture/IMPLEMENTATION_REALITY_CHECK.md` L281 |

**Resolution needed:** Phase 15 actually measured 1,247 req/s. The 10k claim has no evidence artifact.

### C5: Agent Count — 1,008 vs 1,269

| CR-ID | Assertion | Source |
|-------|-----------|--------|
| CR-0052a | 1,008 AI agents | `CLAUDE.md` L487 |
| CR-0052b | 1,269 AI agents | `docs/architecture/MASTER_ARCHITECTURE.md` L33 |

**Resolution needed:** Clarify which count reflects current production configuration.

---

## Claim Catalog

### Category A: Performance Multiplier / Speedup

| CR-ID | Metric | Assertion | Scope | Status | Source |
|-------|--------|-----------|-------|--------|--------|
| CR-0001 | Speedup vs baseline | 379x via quantum-inspired algorithms | Platform-wide | CONTESTED | `docs/architecture/MASTER_ARCHITECTURE.md` L12 |
| CR-0002 | Speedup vs baseline | 3.9x realistic improvement | Analytics/ROI | CONTESTED | `.ai/AI_SUITE_ARCHITECTURE.md` L48 |
| CR-0003 | Quantum advantage | 5.1x average across 5 AI operations (p < 0.05) | AI valuation, search, market, reco, route | NO-EVIDENCE | `docs/phases/PHASE_15_...COMPLETE.md` L235 |
| CR-0004 | Scale evolution | 379x current → 10,000x target | Future roadmap | DRAFT | `docs/ADVANCED_AI_CAPABILITIES_FRAMEWORK.md` L10 |
| CR-0005 | Architecture | 60% reduction in deployment complexity | Polyrepo → monorepo | NO-EVIDENCE | `docs/architecture/MASTER_ARCHITECTURE.md` L380 |
| CR-0006 | Architecture | 95% reduction in service coupling | Event-driven migration | NO-EVIDENCE | `docs/architecture/MASTER_ARCHITECTURE.md` L394 |

### Category B: Latency / Response Time

| CR-ID | Metric | Assertion | Scope | Status | Source |
|-------|--------|-----------|-------|--------|--------|
| CR-0008 | API P95 | < 200ms (target 500ms) | Platform-wide API | CONTESTED | `docs/architecture/MASTER_ARCHITECTURE.md` L338 |
| CR-0009 | API P95 | < 150ms | Citizen operations (county SLA) | CONTESTED | `.github/copilot-instructions-full.md` L308 |
| CR-0010 | API P95 | < 50ms (claimed 6-7ms achieved) | Operational KPIs | CONTESTED | `docs/architecture/MASTER_OPERATIONS.md` L1030 |
| CR-0011 | API P95 | < 6ms | Government SLA — dev standards | CONTESTED | `docs/architecture/MASTER_DEVELOPMENT.md` L654 |
| CR-0012 | API response | < 10ms | Brand quality bar | CONTESTED | `.github/copilot-instructions-full.md` L331 |
| CR-0013 | API P95 | < 50ms for 95% of requests | Platform-wide | NO-EVIDENCE | `docs/architecture/ARCHITECTURE_OVERVIEW.md` L132 |
| CR-0014 | DB query P95 | < 100ms, P99 < 500ms | Database SLO | NO-EVIDENCE | `docs/architecture/MASTER_OPERATIONS.md` L1126 |
| CR-0015 | DB query avg | < 10ms | Dev runtime | NO-EVIDENCE | `docs/architecture/MASTER_DEVELOPMENT.md` L658 |
| CR-0016 | AI swarm coordination P95 | < 50ms (1,269 agents) | AI coordination | NO-EVIDENCE | `docs/architecture/MASTER_DEVELOPMENT.md` L449 |
| CR-0017 | Module load | < 2 seconds | Module loading | NO-EVIDENCE | `docs/architecture/MASTER_OPERATIONS.md` L1128 |
| CR-0018 | AI agent query | < 1 second (simple queries) | AI agent SLO | NO-EVIDENCE | `docs/architecture/MASTER_OPERATIONS.md` L1129 |
| CR-0019 | Frontend load | < 2 seconds (production bundle) | Frontend LCP | NO-EVIDENCE | `docs/architecture/MASTER_DEVELOPMENT.md` L656 |
| CR-0020 | Benton County P95 | ≤ 150ms | County deployment | NO-EVIDENCE | `docs/delivery-package/BENTON_COUNTY_PRODUCTION_RUNBOOK.md` L230 |
| CR-0021 | LCP | < 2500ms | Frontend quality gate | NO-EVIDENCE | `CLAUDE.md` L173 |
| CR-0022 | API P50/P95/P99 | < 50ms / < 100ms / < 200ms | Achievable SLOs | NO-EVIDENCE | `docs/architecture/IMPLEMENTATION_REALITY_CHECK.md` L45 |
| CR-0023 | Property valuation P50/P95/P99 | < 1s / < 3s / < 5s | Valuation journey | NO-EVIDENCE | `docs/architecture/IMPLEMENTATION_REALITY_CHECK.md` L277 |
| CR-0024 | Auth success / authz check | < 2s / < 50ms | Security operations | NO-EVIDENCE | `docs/architecture/IMPLEMENTATION_REALITY_CHECK.md` L290 |
| CR-0025 | Phase 15 benchmark | Mean 87ms, P95 245ms, P99 487ms | Benchmark run | NO-EVIDENCE | `docs/phases/PHASE_15_...COMPLETE.md` L243 |
| CR-0026 | LCP improvement | 3.2s → 2.4s (↓25%) after code splitting | Frontend web vitals | NO-EVIDENCE | `docs/CODE_SPLITTING_GUIDE.md` L249 |

### Category C: Throughput

| CR-ID | Metric | Assertion | Scope | Status | Source |
|-------|--------|-----------|-------|--------|--------|
| CR-0028 | Platform req/s | 10,000+ req/s (marked "Achieved") | Platform-wide | CONTESTED | `docs/architecture/MASTER_ARCHITECTURE.md` L339 |
| CR-0029 | Platform req/s | 15,000 req/s (target: 10,000) | Production launch | DRAFT | `docs/deployment/PRODUCTION_LAUNCH_CHECKLIST.md` L247 |
| CR-0030 | Benchmark req/s | 1,247 req/s (target: 100) | Phase 15 results | NO-EVIDENCE | `docs/phases/PHASE_15_...COMPLETE.md` L248 |
| CR-0031 | Coordination ops/s | > 10,000 ops/s | AI coordination | NO-EVIDENCE | `docs/architecture/MASTER_DEVELOPMENT.md` L451 |
| CR-0032 | Property throughput | 12,500 properties/minute | Property processing | NO-EVIDENCE | `docs/architecture/ARCHITECTURE_OVERVIEW.md` L130 |
| CR-0033 | Achievable req/s | 1,000 req/s | Reality-check target | NO-EVIDENCE | `docs/architecture/IMPLEMENTATION_REALITY_CHECK.md` L281 |

### Category D: Availability / Uptime

| CR-ID | Metric | Assertion | Scope | Status | Source |
|-------|--------|-----------|-------|--------|--------|
| CR-0034 | Platform uptime | 99.9% (marked "Achieved") | Platform-wide | CONTESTED | `docs/architecture/MASTER_ARCHITECTURE.md` L340 |
| CR-0035 | Platform uptime | 99.99% | Brand quality bar | CONTESTED | `.github/copilot-instructions-full.md` L331 |
| CR-0036 | AI swarm SLA | 99.99% | AI coordination | NO-EVIDENCE | `docs/architecture/MASTER_DEVELOPMENT.md` L452 |
| CR-0037a | API gateway SLO | 99.9% | Component-level | NO-EVIDENCE | `docs/architecture/MASTER_OPERATIONS.md` L1119 |
| CR-0037b | Database SLO | 99.95% | Component-level | NO-EVIDENCE | `docs/architecture/MASTER_OPERATIONS.md` L1120 |
| CR-0037c | AI swarm SLO | 99.5% | Component-level | NO-EVIDENCE | `docs/architecture/MASTER_OPERATIONS.md` L1121 |
| CR-0037d | Monitoring SLO | 99.9% | Component-level | NO-EVIDENCE | `docs/architecture/MASTER_OPERATIONS.md` L1122 |
| CR-0038 | County SLA | 99.9% (4.3h/year budget) | County availability | NO-EVIDENCE | `.github/copilot-instructions-full.md` L306 |

### Category E: Accuracy

| CR-ID | Metric | Assertion | Scope | Status | Source |
|-------|--------|-----------|-------|--------|--------|
| CR-0040 | Assessment AI | 99.9% accuracy | Property assessment (county SLA) | NO-EVIDENCE | `.github/copilot-instructions-full.md` L309 |
| CR-0041 | Brand quality | 99.5% accuracy | General quality bar | NO-EVIDENCE | `.github/copilot-instructions-full.md` L331 |
| CR-0042 | Valuation precision | 99.7% | Property valuation AI | NO-EVIDENCE | `docs/architecture/MASTER_DEVELOPMENT.md` L486 |
| CR-0043 | Data quality | 99.5% (matches county records) | Data quality SLO | NO-EVIDENCE | `docs/architecture/IMPLEMENTATION_REALITY_CHECK.md` L284 |
| CR-0044 | IAAO compliance | > 99.5% | IAAO compliance score | NO-EVIDENCE | `backend/docs/MONITORING_GUIDE.md` L185 |

### Category F: Error Rate

| CR-ID | Metric | Assertion | Scope | Status | Source |
|-------|--------|-----------|-------|--------|--------|
| CR-0048 | Request error rate | < 0.1% (target < 1%) | Platform SLO | NO-EVIDENCE | `docs/architecture/MASTER_OPERATIONS.md` L1034 |
| CR-0049 | Benchmark error rate | 0.12% (target < 1%) | Phase 15 results | NO-EVIDENCE | `docs/phases/PHASE_15_...COMPLETE.md` L247 |
| CR-0050 | Peak load error rate | 0.5% (2,000 users) | Peak load | NO-EVIDENCE | `docs/architecture/ARCHITECTURE_OVERVIEW.md` L131 |
| CR-0051 | Deployment failure rate | < 1% | Deployment SLO | NO-EVIDENCE | `docs/architecture/MASTER_OPERATIONS.md` L1132 |

### Category G: Scale / Capacity

| CR-ID | Metric | Assertion | Scope | Status | Source |
|-------|--------|-----------|-------|--------|--------|
| CR-0052 | AI agent count | 1,008 — 1,269 (varies by doc) | Production swarm | CONTESTED | `CLAUDE.md` / `MASTER_ARCHITECTURE.md` |
| CR-0053 | Concurrent users | 2,000 (peak load) | Platform capacity | NO-EVIDENCE | `docs/architecture/ARCHITECTURE_OVERVIEW.md` L129 |
| CR-0054 | Concurrent users | 500 county employees | Achievable target | NO-EVIDENCE | `docs/architecture/IMPLEMENTATION_REALITY_CHECK.md` L48 |
| CR-0055 | Phase 15 concurrent | 500+ users validated | Benchmark result | NO-EVIDENCE | `docs/phases/PHASE_15_...COMPLETE.md` L255 |
| CR-0056 | Parcel count | 89,247 Benton County parcels | Data scale | NO-EVIDENCE | `CLAUDE.md` L8 |

### Category H: Data Freshness

| CR-ID | Metric | Assertion | Scope | Status | Source |
|-------|--------|-----------|-------|--------|--------|
| CR-0059 | Harris PACS sync | 15-minute intervals | County SLA — data sync | NO-EVIDENCE | `.github/copilot-instructions-full.md` L310 |
| CR-0060 | Source system lag | < 15 minutes from source | Data quality SLO | NO-EVIDENCE | `docs/architecture/IMPLEMENTATION_REALITY_CHECK.md` L286 |

### Category I: Phase 15 Benchmark Results (Specific Numbers)

| CR-ID | Metric | Assertion | Scope | Status | Source |
|-------|--------|-----------|-------|--------|--------|
| CR-0061 | Load test 100 users | P95 1.85s, 48 RPS, 2.1% error | Load test | NO-EVIDENCE | `docs/PERFORMANCE_TESTING_PHASE_5_COMPLETE.md` L51 |
| CR-0062 | Load test 500 users | P95 2.70s, 165 RPS, 4.8% error | Load test | NO-EVIDENCE | `docs/PERFORMANCE_TESTING_PHASE_5_COMPLETE.md` L52 |
| CR-0063 | Load test 1,000 users | P95 4.50s, 220 RPS, 7.2% error | Load test | NO-EVIDENCE | `docs/PERFORMANCE_TESTING_PHASE_5_COMPLETE.md` L53 |
| CR-0064 | Load test 5,000 users | P95 9.20s, 450 RPS, 12.5% error | Load test | NO-EVIDENCE | `docs/PERFORMANCE_TESTING_PHASE_5_COMPLETE.md` L54 |
| CR-0065 | Recovery time | 32 seconds (target < 1 min) | Resilience | NO-EVIDENCE | `docs/phases/PHASE_15_...COMPLETE.md` L257 |
| CR-0066 | Resource utilization | CPU 52%, Mem 63%, DB 47%, Cache 94% | Phase 15 benchmark | NO-EVIDENCE | `docs/phases/PHASE_15_...COMPLETE.md` L261 |

---

## Wave 1 Transition Criteria

Wave 1 begins when **all** of these are true:

1. **Tier-1 UI/UX flows are shipped** — every "done" feature emits correlation IDs,
   structured traces/logs, and latency + error metrics.
2. **A benchmark harness exists** — reproducible, scriptable, produces machine-readable
   receipts (not prose assertions).
3. **CONTESTED claims are resolved** — each contradiction group (C1–C5) has a single
   canonical assertion with scope, or retired entries.

### Wave 1 Actions

- Attach evidence artifacts to each claim (CI job URL, Prometheus query, benchmark receipt).
- Move claims from `NO-EVIDENCE` → `EVIDENCED`.
- Optionally: add a `claims-check` gate to SEAL that verifies evidence freshness.
- Retire claims that cannot be verified or are superseded.

### Definition of Done (per Tier-1 feature)

When a Tier-1 UI/UX flow is declared "done", it must produce:

1. **Correlation ID** — every request carries a traceable `correlationId`.
2. **Structured traces** — OpenTelemetry spans or equivalent, queryable via trace tooling.
3. **Latency metrics** — P50, P95, P99 response times recorded in metrics store.
4. **Error metrics** — error rate by operation, error classification by code.
5. **Receipt artifact** — machine-readable output (JSON) from a benchmark or integration test.

---

## Claim ID Allocation

| Range | Category |
|-------|----------|
| CR-0001 – CR-0007 | Performance Multiplier / Speedup |
| CR-0008 – CR-0027 | Latency / Response Time |
| CR-0028 – CR-0033 | Throughput |
| CR-0034 – CR-0039 | Availability / Uptime |
| CR-0040 – CR-0047 | Accuracy |
| CR-0048 – CR-0051 | Error Rate |
| CR-0052 – CR-0058 | Scale / Capacity |
| CR-0059 – CR-0060 | Data Freshness |
| CR-0061 – CR-0070 | Benchmark Results |
| CR-0071+ | Reserved for new claims |

---

## Related Documents

| Document | Purpose |
|----------|---------|
| [QUARANTINE_SOP.md](QUARANTINE_SOP.md) | Governance SOP |
| [CI_WORKFLOW_LIFECYCLE_POLICY.md](CI_WORKFLOW_LIFECYCLE_POLICY.md) | Workflow lifecycle |
| [IMPLEMENTATION_REALITY_CHECK.md](../architecture/IMPLEMENTATION_REALITY_CHECK.md) | Achievable vs aspirational targets |
| [MASTER_ARCHITECTURE.md](../architecture/MASTER_ARCHITECTURE.md) | Primary architecture claims source |
| [MASTER_OPERATIONS.md](../architecture/MASTER_OPERATIONS.md) | Operational SLO definitions |

---

**Government. Transcended. Measured.**
