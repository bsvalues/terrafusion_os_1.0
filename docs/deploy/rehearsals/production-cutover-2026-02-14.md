# Production Cutover — 2026-02-14

> **Classification:** Government Operations — FISMA-HIGH  
> **Type:** Production Cutover (First Deployment)  
> **ExecutionStatus:** `PLANNED` *(PLANNED | EXECUTING | COMPLETE)*  
> **Completed:** `false`  
> **Created:** 2026-02-14  
> **StartTimeUTC:** TBD  
> **EndTimeUTC:** TBD  
> **ExecutionDuration:** TBD min
>
> **⚠️ TEMPLATE LOCKED:** Do not change structure during validation period. Append-only sections permitted.

---

## Closeout Summary

**ExecutionStatus:** `PLANNED` *(TO BE UPDATED: PLANNED → EXECUTING → COMPLETE)*

**Verdict:** ⏳ *(TO BE DETERMINED: GO | NO-GO | ROLLED_BACK)*

**Key Outcomes:** *(Populate after execution)*
- [ ] Cutover completed within planned timing (±15%)
- [ ] All smoke tests passed
- [ ] RTO/RPO validated through rollback simulation

**Quick Reference:**
- **Total Duration:** ___ min (planned: 48 min)
- **Traffic Shift:** ___% at each checkpoint (10% → 50% → 100%)
- **Incidents:** ___ (list if any)
- **Rollback Triggered:** ✅ / ❌

---

## Cutover Overview

**Objective:** Execute first production cutover for TerraFusion OS 1.0 to validate deployment procedures, rollback capability, and operational readiness.

**Scope:**
- Deploy TerraFusion OS services to production Kubernetes cluster
- Validate traffic routing and service mesh configuration
- Execute smoke tests against production endpoints
- Validate rollback procedure (RTO <15 min)
- Confirm SLO telemetry collection operational

**Target Execution Window:** Week 1-2 of validation period (2026-02-14 to 2026-02-21)

---

## Pre-Cutover Checklist Results

Status tracking for rehearsal completion and prerequisites:

- [ ] Tabletop exercise completed (see [latest.md](./latest.md))
- [ ] Rollback drill completed with RTO validation
- [ ] Database migrations tested in staging
- [ ] Configuration verification complete (ConfigMaps, Secrets)
- [ ] Observability stack confirmed operational (Prometheus, Grafana)
- [ ] PagerDuty rotation confirmed + runbooks fresh
- [ ] Communication plan activated (status page, stakeholder notifications)
- [ ] Change freeze window scheduled (if required)

---

## Planned Timing vs Actual

| Phase | Planned Duration | Planned Start | Actual Start | Actual Duration | Deviation | Notes |
|-------|------------------|---------------|--------------|-----------------|-----------|-------|
| Pre-flight checks | 15 min | TBD | - | - | - | - |
| Database migrations | 5 min | TBD | - | - | - | - |
| Deploy API (Kernel) | 3 min | TBD | - | - | - | - |
| Deploy Consciousness (AI) | 3 min | TBD | - | - | - | - |
| Deploy Gateway (Shell) | 2 min | TBD | - | - | - | - |
| Traffic shift (0→100%) | 10 min | TBD | - | - | - | - |
| Smoke tests | 5 min | TBD | - | - | - | - |
| Monitoring validation | 5 min | TBD | - | - | - | - |
| **Total** | **48 min** | TBD | - | - | - | - |

**RPO Target:** 0 min (zero data loss with blue-green deployment)  
**RTO Target:** <15 min (validated via rollback drill)

---

## Cutover Steps Executed

Sequential record of all deployment steps executed during cutover:

### Phase 1: Pre-Flight Checks
- [ ] Pre-flight checks completed
- [ ] Database backup verified
- [ ] Configuration validated
- [ ] Observability confirmed operational

### Phase 2: Database Migrations
- [ ] Migrations applied
- [ ] Schema validation passed
- [ ] Data integrity checks passed

### Phase 3: Service Deployment
- [ ] API (Kernel) deployed
- [ ] Consciousness (AI) deployed
- [ ] Gateway (Shell) deployed
- [ ] All pods healthy and ready

### Phase 4: Traffic Routing
- [ ] Canary traffic shift (10%) completed
- [ ] Progressive shift (50%) completed
- [ ] Full cutover (100%) completed
- [ ] Old version scaled to 0

### Phase 5: Validation
- [ ] Smoke tests passed
- [ ] Monitoring validation completed
- [ ] SLO telemetry confirmed operational

---

## Traffic Shift Checkpoints

Record traffic routing progression and validation at each checkpoint:

### Checkpoint 1: Pre-Cutover Baseline
- [ ] Current production traffic: 100% old version
- [ ] Baseline metrics captured (latency, error rate, throughput)
- [ ] SLO burn rate: ____%
- [ ] Active incidents: ___

### Checkpoint 2: Canary (10% traffic)
- [ ] Traffic shifted: 10% new version
- [ ] Error rate delta: ___% (threshold: <1% increase)
- [ ] Latency P95 delta: ___ms (threshold: <50ms increase)
- [ ] Duration: ___ min
- [ ] Decision: [PROCEED / ROLLBACK]

### Checkpoint 3: Progressive Shift (50% traffic)
- [ ] Traffic shifted: 50% new version
- [ ] Error rate delta: ___%
- [ ] Latency P95 delta: ___ms
- [ ] Duration: ___ min
- [ ] Decision: [PROCEED / ROLLBACK]

### Checkpoint 4: Full Cutover (100% traffic)
- [ ] Traffic shifted: 100% new version
- [ ] Old version pods scaled to 0
- [ ] Final smoke tests: [PASS / FAIL]
- [ ] Duration: ___ min
- [ ] SLO burn rate post-cutover: ____%

---

## Smoke Test Results

### Critical Path Smoke Tests

| Test | Expected Result | Actual Result | Status | Evidence |
|------|----------------|---------------|--------|----------|
| API health endpoint | 200 OK | - | ⏳ | - |
| Authentication flow | Token issued | - | ⏳ | - |
| Property search (Benton County) | Results returned | - | ⏳ | - |
| Assessment calculation | Calculation completed | - | ⏳ | - |
| AI Swarm status | 1008 agents online | - | ⏳ | - |
| Audit log ingestion | Events persisted | - | ⏳ | - |
| County isolation check | Benton-only data visible | - | ⏳ | - |

### Observability Validation

- [ ] Prometheus scraping all targets (API, Consciousness, Gateway)
- [ ] Grafana dashboards rendering (TerraFusion API, AI Swarm, SLOs)
- [ ] Alert routing operational (PagerDuty, Slack, Email)
- [ ] Trace collection active (Jaeger receiving spans)
- [ ] Logs aggregated (Loki ingesting from all services)

---

## Rollback Simulation

**Trigger Condition Tested:** Elevated error rate >5% sustained for 2 minutes

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Time to detect | <1 min | - | ⏳ |
| Time to decision | <2 min | - | ⏳ |
| Time to rollback execution | <5 min | - | ⏳ |
| Time to recovery | <15 min (RTO) | - | ⏳ |
| Data loss | 0 (RPO) | - | ⏳ |

**Rollback Method:** [Blue-Green / Canary Revert / ArgoCD Sync to Previous]

**Rollback Command Log:**
```bash
# Commands executed during rollback (to be captured)
# Example:
# argocd app rollback terrafusion-api --revision <previous-sha>
# kubectl rollout status deployment/terrafusion-api -n terrafusion
```

**Recovery Verification:**
- [ ] All services returned to healthy state
- [ ] Traffic routing confirmed 100% to previous version
- [ ] Smoke tests pass on rolled-back version
- [ ] SLO burn rate returned to baseline

---

## Recovery Time Validation

**RTO Compliance Check:**

| Service | Target RTO | Actual Recovery Time | Status | Evidence |
|---------|------------|---------------------|--------|----------|
| API (Kernel) | <15 min | - | ⏳ | - |
| Consciousness (AI) | <15 min | - | ⏳ | - |
| Gateway (Shell) | <15 min | - | ⏳ | - |
| Database | <15 min | - | ⏳ | - |

**RPO Compliance Check:**

| Service | Target RPO | Data Loss Measured | Status | Evidence |
|---------|------------|-------------------|--------|----------|
| Transaction logs | 0 min | - | ⏳ | - |
| Audit logs | 0 min | - | ⏳ | - |
| Property data | 0 min | - | ⏳ | - |

**Recovery Process Validation:**
- [ ] Rollback triggered within detection window (<1 min)
- [ ] Decision process followed runbook guidelines (<2 min)
- [ ] Rollback execution completed within target (<5 min)
- [ ] Full service recovery achieved (RTO <15 min)
- [ ] Zero data loss confirmed (RPO = 0)
- [ ] Post-rollback smoke tests passed

---

## Rollback Simulation Results

**Trigger Condition Tested:** Elevated error rate >5% sustained for 2 minutes

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Time to detect | <1 min | - | ⏳ |
| Time to decision | <2 min | - | ⏳ |
| Time to rollback execution | <5 min | - | ⏳ |
| Time to recovery | <15 min (RTO) | - | ⏳ |
| Data loss | 0 (RPO) | - | ⏳ |

**Rollback Method:** [Blue-Green / Canary Revert / ArgoCD Sync to Previous]

**Rollback Command Log:**
```bash
# Commands executed during rollback (to be captured)
# Example:
# argocd app rollback terrafusion-api --revision <previous-sha>
# kubectl rollout status deployment/terrafusion-api -n terrafusion
```

**Recovery Verification:**
- [ ] All services returned to healthy state
- [ ] Traffic routing confirmed 100% to previous version
- [ ] Smoke tests pass on rolled-back version
- [ ] SLO burn rate returned to baseline

---

## Deviations & Incidents

Record any deviations from planned procedure or incidents during cutover:

| Time | Severity | Description | Impact | Resolution | Duration |
|------|----------|-------------|--------|------------|----------|
| - | - | - | - | - | - |

**Unplanned Actions:**
- None (populate if deviations occur)

**Lessons Learned:**
- TBD (complete after execution)

---

## SLO Impact Assessment

Track error budget consumption during cutover window:

| SLO | Pre-Cutover Burn | Post-Cutover Burn | Delta | Budget Remaining |
|-----|------------------|-------------------|-------|------------------|
| SLO-001 (API Availability) | ___% | ___% | ___% | ___% |
| SLO-002 (API Latency P95) | ___% | ___% | ___% | ___% |
| SLO-003 (AI Swarm Uptime) | ___% | ___% | ___% | ___% |
| SLO-004 (Gateway Availability) | ___% | ___% | ___% | ___% |
| SLO-005 (Data Integrity) | ___% | ___% | ___% | ___% |

**Error Budget Policy Action:** [NORMAL / RESTRICTED / FROZEN / EMERGENCY]

---

## Post-Cutover Actions

- [ ] File cutover completion report
- [ ] Update `docs/ops/slo-tuning-log.md` with burn data
- [ ] Update `docs/ops/validation-period-tracker.md` (mark criterion 1 complete)
- [ ] Schedule post-cutover review (within 24 hours)
- [ ] Archive cutover logs + metrics snapshots
- [ ] Update runbooks with any procedural improvements identified
- [ ] Notify stakeholders of cutover completion

---

## Evidence Links

**Canonical Attachments:** (Attach after execution, stable filenames required)

- [ ] Grafana dashboard export: `evidence/cutover-2026-02-14/grafana-slo-dashboard.json`
- [ ] PagerDuty incident log: `evidence/cutover-2026-02-14/pagerduty-incidents.json`
- [ ] ArgoCD deployment history: `evidence/cutover-2026-02-14/argocd-sync-log.json`
- [ ] kubectl events log: `evidence/cutover-2026-02-14/kubectl-events.log`
- [ ] Smoke test results: `evidence/cutover-2026-02-14/smoke-tests-output.html`
- [ ] Database migration log: `evidence/cutover-2026-02-14/db-migrations.log`
- [ ] Traffic shift metrics: `evidence/cutover-2026-02-14/traffic-shift-metrics.json`

**Evidence Directory:** `docs/deploy/rehearsals/evidence/cutover-2026-02-14/`

---

## Evidence Pack Integration

**Artifact Type:** `production-cutover`  
**Hash Algorithm:** SHA-256  
**Immutable Fields:** Created, Target Execution Window, Planned Timing  
**Mutable Fields:** ExecutionStatus, StartTimeUTC, EndTimeUTC, Actual Start, Actual Duration, Completed

This artifact will be ingested by:
- Phase 7 Gates (cutover-gate.mjs, dr-gate.mjs)
- Validation Period Gates (ops-validation-artifacts-gate.mjs)
- Release Evidence System (release-evidence-gate.mjs)

**Completion Criteria:**
- All checkboxes marked
- All "Actual" timing fields populated
- Rollback simulation completed with RTO proof
- Smoke tests passed
- `Completed: true` flag set

---

## Sign-Off

**Status:** ⏳ Pending Execution

**Cutover Lead:** ___________________ Date: ______ Status: ⏳

**Platform Engineer:** ___________________ Date: ______ Status: ⏳

**County Coordinator (Benton):** ___________________ Date: ______ Status: ⏳

---

*Government. Transcended. Production-Ready.*
