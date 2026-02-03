# Wave 1 Expansion Plan

> **Plan ID:** `sha256:c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6`  
> **Predecessor:** Pilot Wave 0 (CLOSED)  
> **Target Start:** 2026-03-01  
> **Expansion Type:** Service Cohort (10–20 services)  
> **Status:** ☐ **PLANNING**

---

## 1. Expansion Strategy

### Selected Path

**Wave 1 Cohort Expansion (10–20 services)** has been selected as the next operating posture.

| Option | Description | Selected |
|--------|-------------|----------|
| Wave 1 Cohort | Add 10–20 services under governance | ☑ **Selected** |
| Agency Expansion | Add 3–5 agencies with MOUs | ☐ Deferred to Wave 2 |
| Sustain-Only | 30-day durability validation | ☐ Not required |

### Rationale

1. **Proven Governance:** Wave 0 validated the control loop end-to-end.
2. **Scalability Test:** Adding 10–20 services will stress-test cardinality and alert routing.
3. **Same Agency:** Reduces cross-agency coordination complexity for first expansion.
4. **Foundation for Agency Expansion:** Wave 1 success unlocks Wave 2 multi-agency rollout.

---

## 2. Cohort Selection Criteria

### Eligibility Requirements

| Criterion | Threshold | Verification |
|-----------|-----------|--------------|
| Service maturity | ≥ 6 months in production | Audit log |
| Owner certification | Operator certified | Cert registry |
| Monitoring instrumented | MTTR/Rollback/Avail metrics exposed | Telemetry check |
| Runbook available | Published in `docs/ops/RUNBOOKS/` | File exists |
| No critical vulnerabilities | 0 P1 findings | Security scan |
| DR participation | Included in most recent drill | DR report |

### Exclusion Criteria

| Criterion | Reason |
|-----------|--------|
| Active P1/P2 incidents | Unstable baseline |
| Major refactor in progress | Metrics will be volatile |
| Missing owner certification | Governance gap |
| External dependency blockers | Cannot guarantee SLAs |

### Cohort Size Constraints

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| Minimum | 10 services | Statistical significance |
| Maximum | 20 services | Alert cardinality limit |
| Recommended | 15 services | Balanced risk |

---

## 3. Intake Process

### Intake Packet (per service)

Each service must submit a **COHORT_INTAKE_PACKET** containing:

| Field | Description | Required |
|-------|-------------|----------|
| Service ID | Unique identifier (sha256 preferred) | ☑ |
| Service Name | Human-readable name | ☑ |
| Owner ID | Certified operator sha256 | ☑ |
| Baseline Snapshot | Current MTTR, Rollback, Avail, IR | ☑ |
| Runbook Path | Path to published runbook | ☑ |
| Dependencies | Upstream/downstream services | ☑ |
| DR Participation | Last drill date | ☑ |
| Security Scan | Date + P1 count | ☑ |

### Intake Workflow

```
Service Nominated
    │
    ▼
COHORT_INTAKE_PACKET Submitted
    │
    ▼
Eligibility Check (automated)
    │
    ├─── FAIL → Remediation Required
    │
    └─── PASS ─┐
               ▼
    Cohort Review Board
    │
    ╔═══════════════════════════════════════╗
    ║  Approval Gate (2/2 Required)          ║
    ║  • Ops Lead                            ║
    ║  • Governance Lead                     ║
    ╚═══════════════════════════════════════╝
    │
    ▼
Service Added to Wave 1 Manifest
    │
    ▼
Onboarding Begins (Day 0 for service)
```

---

## 4. Onboarding Process

### Per-Service Onboarding (7 days)

| Day | Activity | Owner |
|-----|----------|-------|
| 0 | Intake packet verified | Governance Lead |
| 1 | Baseline snapshot captured | Service Owner |
| 2 | Alert routing configured | Ops Lead |
| 3 | Runbook validation | IC |
| 4 | DR participation confirmed | DR Coordinator |
| 5 | Stop-watch integration verified | Ops Lead |
| 6 | Dry-run war room | Service Owner + IC |
| 7 | GO/NO-GO decision | Cohort Review Board |

### Onboarding Checklist

- [ ] Intake packet complete and verified
- [ ] Baseline metrics captured (snapshot ID)
- [ ] Alert routing → Steady-state on-call
- [ ] Runbook reviewed and accessible
- [ ] DR participation confirmed (≤ 90 days)
- [ ] Stop-watch conditions armed
- [ ] Dry-run war room completed
- [ ] GO decision obtained (2/2 approval)

---

## 5. Readiness Thresholds

### Wave 1 GO Criteria

| Gate | Criterion | Value |
|------|-----------|-------|
| W1-G01 | Cohort size | 10–20 services |
| W1-G02 | All intake packets verified | 100% |
| W1-G03 | All operators certified | 100% |
| W1-G04 | Runbooks published | 100% |
| W1-G05 | Baseline snapshots captured | 100% |
| W1-G06 | Alert routing configured | 100% |
| W1-G07 | DR participation confirmed | 100% |
| W1-G08 | Stop-watch integration verified | 100% |
| W1-G09 | Dry-run war rooms completed | 100% |
| W1-G10 | Dual-approval obtained | 2/2 |

### Wave 1 NO-GO Triggers

| Condition | Action |
|-----------|--------|
| Any service fails eligibility | Exclude from Wave 1, remediate for Wave 2 |
| Cohort < 10 services ready | Delay Wave 1 start |
| Critical security finding | Immediate exclusion |
| Baseline metrics missing | Exclude until captured |

---

## 6. Training & Certification

### Operator Certification Requirements

| Module | Duration | Assessment |
|--------|----------|------------|
| Governance Fundamentals | 2 hours | Quiz (80% pass) |
| Stop-Condition Handling | 1 hour | Simulation |
| War Room Protocol | 1 hour | Observation |
| Evidence Bundle Creation | 30 min | Hands-on |
| Recovery Approval Workflow | 30 min | Walkthrough |

### Certification Validity

| Certification | Validity | Renewal |
|---------------|----------|---------|
| Operator Certification | 12 months | Re-assessment |
| IC Certification | 12 months | War room observation |
| Governance Lead | 12 months | Re-assessment |

---

## 7. Stop-Condition Posture

### Service-Level Stop Conditions

Each service inherits the global stop-condition set:

| Condition | Threshold | Scope |
|-----------|-----------|-------|
| MTTR_REGRESSION | > 30 min | Per-service |
| ROLLBACK_FAILURE | < 95% | Per-service |
| AVAILABILITY_DROP | < 99.5% | Per-service |
| INCIDENT_RESPONSE_BREACH | > 60 min | Per-service |

### Cohort-Level Aggregation

| Condition | Threshold | Trigger |
|-----------|-----------|---------|
| COHORT_MTTR_SPIKE | > 3 services breaching | Cohort-wide alert |
| COHORT_AVAILABILITY_DROP | > 2 services < 99.5% | Cohort-wide alert |
| COHORT_ROLLBACK_FAILURE | > 2 services < 95% | Cohort-wide alert |

### Rollback Posture

| Severity | Action | Approval |
|----------|--------|----------|
| Single service stop | Pause service, continue cohort | 1/1 |
| Multi-service stop (≥3) | Cohort-wide pause review | 2/2 |
| Critical failure | Immediate cohort pause | Automated |

---

## 8. Wave 1 Timeline

### Milestone Schedule

| Milestone | Target Date | Owner |
|-----------|-------------|-------|
| Plan approved | 2026-02-20 | Governance Lead |
| Nomination open | 2026-02-21 | Ops Lead |
| Nomination close | 2026-02-25 | Ops Lead |
| Intake review | 2026-02-26 | Cohort Review Board |
| Onboarding start | 2026-02-27 | Service Owners |
| GO/NO-GO decision | 2026-02-28 | Cohort Review Board |
| Wave 1 Day 0 | 2026-03-01 | IC |
| Wave 1 Week 1 Synthesis | 2026-03-07 | IC |
| Wave 1 Week 2 Synthesis | 2026-03-14 | IC |
| Wave 1 Closeout | 2026-03-15 | Governance Lead |

### Duration

| Phase | Duration |
|-------|----------|
| Nomination + Intake | 5 days |
| Onboarding | 7 days |
| Wave 1 Execution | 14 days |
| **Total** | **26 days** |

---

## 9. Risk Assessment

### Identified Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Alert cardinality overload | Medium | High | Cap at 20 services |
| Operator bandwidth exhaustion | Medium | Medium | Stagger onboarding |
| Baseline variance across services | Low | Medium | Normalize thresholds |
| DR drill coordination | Low | High | Unified drill schedule |
| Certification gap | Low | Medium | Pre-onboarding requirement |

### Contingency Plans

| Scenario | Response |
|----------|----------|
| Wave 1 < 10 services ready | Delay start by 1 week |
| Multi-service stop on Day 1 | Immediate pause + root cause |
| Alert fatigue detected | Tune thresholds + reduce cohort |

---

## 10. Success Criteria

### Wave 1 Exit Gates

| Gate | Criterion | Target |
|------|-----------|--------|
| Duration | 14 days completed | ☐ |
| War room compliance | 100% | ☐ |
| Stop triggers (cohort) | ≤ 2 | ☐ |
| Stop triggers (individual) | ≤ 5 | ☐ |
| KPIs within threshold | ≥ 90% of services | ☐ |
| Weekly syntheses | 2/2 | ☐ |
| No critical exceptions | 0 | ☐ |

### Post-Wave 1 Authorization

| Outcome | Authorization |
|---------|---------------|
| All exit gates pass | Wave 2 (Agency Expansion) eligible |
| 80–99% gates pass | Sustain-only period (30 days) |
| < 80% gates pass | Wave 1 remediation required |

---

## 11. Documentation Deliverables

### Wave 1 Artifacts

| Document | Purpose | Due |
|----------|---------|-----|
| `WAVE_1_COHORT_MANIFEST.md` | Service roster + baseline snapshots | Day 0 |
| `WAVE_1_DAY_*_EVIDENCE_BUNDLE.md` | Daily war room evidence | Daily |
| `WAVE_1_WEEK_*_SYNTHESIS.md` | Weekly KPI rollup | Weekly |
| `WAVE_1_CLOSEOUT_PACK.md` | Exit evidence + analysis | Day 14 |

---

## 12. Approval

### Plan Approval Gate

| Approver | Role | Decision | Timestamp |
|----------|------|----------|-----------|
| Approver 1 | Ops Lead | ☐ Pending | — |
| Approver 2 | Governance Lead | ☐ Pending | — |

**Approval Status:** ☐ Pending (2/2 required)

---

## Plan Metadata

| Field | Value |
|-------|-------|
| Plan ID | `sha256:c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6` |
| Created | 2026-02-17 |
| Target Start | 2026-03-01 |
| Expansion Type | Service Cohort |
| Status | ☐ **PLANNING** |

---

*Wave 1 Expansion Plan Ready for Approval.*

*Government. Transcended.*
