# Steady-State Operating Mode

> **Effective Date:** 2026-02-18  
> **Mode ID:** `sha256:b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5`  
> **Preceded By:** Pilot Wave 0 (2026-02-03 to 2026-02-17)  
> **Status:** ☑ **ACTIVE**

---

## 1. Operating Mode Declaration

TerraFusion OS has transitioned from **Pilot Wave 0** to **Steady-State Operations** effective 2026-02-18.

### Mode Characteristics

| Attribute | Pilot Wave 0 | Steady-State | Change |
|-----------|--------------|--------------|--------|
| Governance | Active | Active | → Unchanged |
| Stop-watch | Armed | Armed | → Unchanged |
| Dual-approval recovery | Required | Required | → Unchanged |
| War room frequency | Daily (7/7) | Weekday (M–F) | ↓ Reduced |
| Synthesis frequency | Weekly | Weekly | → Unchanged |
| Evidence retention | 90 days | 365 days | ↑ Extended |

### Invariants (Unchanged from Pilot)

| Invariant | Value | Enforcement |
|-----------|-------|-------------|
| REQUIRED_APPROVALS | 2 | Pause recovery, high-impact rollback |
| MAX_PAUSE_LATENCY_MS | 5000 | Stop-condition pause |
| DR_FRESHNESS_DAYS | 90 | DR drill cadence |
| MTTR_THRESHOLD | ≤ 30 min | Stop-condition trigger |
| ROLLBACK_THRESHOLD | ≥ 95% | Stop-condition trigger |
| AVAILABILITY_THRESHOLD | ≥ 99.5% | Stop-condition trigger |
| INCIDENT_RESPONSE_THRESHOLD | ≤ 60 min | Stop-condition trigger |

---

## 2. Operating Cadence

### Daily Cadence (Weekdays: Monday–Friday)

| Time (UTC) | Activity | Duration | Owner |
|------------|----------|----------|-------|
| 09:00 | War Room Check-in | 15 min | IC (rotating) |
| 09:15 | Baseline drift check | 5 min | IC |
| 09:20 | Exception sweep | 5 min | IC |
| 09:25 | Stop-watch verification | 5 min | IC |
| 09:30 | Evidence bundle capture | — | Automated |

### War Room Checklist (Daily)

- [ ] Baseline metrics unchanged (5/5)
- [ ] Exceptions swept (target: 0 active)
- [ ] Stop-watch armed and 2/2 recovery confirmed
- [ ] KPIs within threshold (4/4)
- [ ] DR freshness confirmed (≤ 90 days)
- [ ] Evidence bundle generated and hashed

### Weekend Handling

| Day | War Room | Monitoring | Escalation |
|-----|----------|------------|------------|
| Saturday | ☐ Suspended | ☑ Automated | ☑ On-call pager |
| Sunday | ☐ Suspended | ☑ Automated | ☑ On-call pager |

**Weekend Invariants:**
- Stop-watch remains armed (automated)
- Stop-condition triggers page on-call immediately
- Monday war room reviews weekend telemetry

---

### Weekly Cadence

| Day | Activity | Owner |
|-----|----------|-------|
| Monday | Weekly kickoff + weekend review | IC |
| Wednesday | Mid-week synthesis preflight | IC |
| Friday | Weekly synthesis + rollup | IC |

### Weekly Synthesis Contents

1. **KPI Rollup:** Min/Avg/Max for week
2. **Exception Burn-Down:** Active, expired, expiring
3. **Stop-Watch Summary:** Triggers, clears, near-misses
4. **DR Freshness:** Days since drill, next due
5. **Action Register:** Open, closed, overdue

---

### Monthly Cadence

| Activity | Frequency | Owner | Deliverable |
|----------|-----------|-------|-------------|
| Monthly Control Review | 1st Monday | Governance Lead | `MONTHLY_CONTROL_REVIEW.md` |
| DR Drill (if due) | As needed | DR Coordinator | `DR_DRILL_REPORT.md` |
| Evidence Archive Rotation | Monthly | Ops Lead | Archive hash manifest |

### Monthly Control Review Contents

1. **4-Week KPI Trends:** Week-over-week comparison
2. **Exception Policy Review:** Any renewals, escalations
3. **Stop-Condition Analysis:** Aggregate trigger analysis
4. **Certification Expiry Check:** Attestations, MOUs, operator certs
5. **Expansion Readiness:** Wave 1 intake status

---

## 3. Governance Enforcement

### Stop-Condition Handling

| Condition | Detection | Pause Latency | Recovery |
|-----------|-----------|---------------|----------|
| MTTR_REGRESSION | Automated | ≤ 5000ms | 2/2 approval |
| ROLLBACK_FAILURE | Automated | ≤ 5000ms | 2/2 approval |
| DR_DRILL_FAILURE | Automated | ≤ 5000ms | 2/2 approval |
| AUDIT_INTEGRITY_ALERT | Automated | ≤ 5000ms | 2/2 approval |

### Recovery Workflow

```
Stop Triggered
    │
    ▼
[PAUSE] ← MAX_PAUSE_LATENCY_MS = 5000
    │
    ▼
Notify On-Call (pager)
    │
    ▼
Root Cause Analysis
    │
    ▼
Remediation Implemented
    │
    ▼
Recovery Request Submitted
    │
    ▼
╔═══════════════════════════════════════╗
║  Dual-Approval Gate (2/2 Required)    ║
║  • Approver 1: Ops Lead               ║
║  • Approver 2: Governance Lead        ║
╚═══════════════════════════════════════╝
    │
    ▼
[RESUME] → Evidence bundle captured
```

### Exception Management

| Attribute | Policy |
|-----------|--------|
| Default state | Zero exceptions |
| Time-bound | Maximum 30 days |
| Renewal | Requires re-justification + approval |
| Expiry handling | Auto-escalate 7 days before expiry |
| Audit trail | All exceptions logged with sha256 ID |

### Exception Approval Workflow

```
Exception Requested
    │
    ▼
Justification Required (written)
    │
    ▼
Risk Assessment (Low/Medium/High)
    │
    ▼
╔═══════════════════════════════════════╗
║  Approval Gate                        ║
║  • Low Risk: 1/1 approval             ║
║  • Medium/High Risk: 2/2 approval     ║
╚═══════════════════════════════════════╝
    │
    ▼
Expiry Set (≤ 30 days)
    │
    ▼
Logged in Exception Register
    │
    ▼
Auto-reminder @ expiry - 7 days
```

---

## 4. On-Call Expectations

### Rotation

| Week | Primary | Secondary |
|------|---------|-----------|
| 1 | Operator A | Operator B |
| 2 | Operator B | Operator C |
| 3 | Operator C | Operator A |
| 4 | Operator A | Operator B |

### Response SLAs

| Severity | Response Time | Escalation |
|----------|--------------|------------|
| P1 (Stop triggered) | ≤ 15 min | Immediate |
| P2 (KPI near-threshold) | ≤ 60 min | 2 hours |
| P3 (Operational friction) | ≤ 4 hours | Next business day |

### On-Call Toolkit

| Tool | Purpose |
|------|---------|
| Pager | Stop-condition alerts |
| Runbook | `docs/ops/RUNBOOKS/` |
| Evidence dashboard | Real-time KPI monitoring |
| Recovery portal | Dual-approval submission |

---

## 5. Evidence Retention & Discovery

### Retention Policy

| Artifact Type | Retention | Location |
|---------------|-----------|----------|
| Daily bundles | 365 days | `docs/ops/DAY_*_EVIDENCE_BUNDLE_REAL.md` |
| Weekly syntheses | 365 days | `docs/ops/WEEK_*_SYNTHESIS_REAL.md` |
| Monthly reviews | 3 years | `docs/ops/MONTHLY_*_REVIEW.md` |
| Decision log | Indefinite | `docs/ops/PILOT_DECISION_LOG_REAL.md` → `STEADY_STATE_DECISION_LOG.md` |
| Stop-condition events | 7 years | Audit archive |
| Exception approvals | 7 years | Audit archive |

### Evidence Discovery

| Query | Location |
|-------|----------|
| "What happened on Day X?" | `docs/ops/DAY_X_EVIDENCE_BUNDLE_REAL.md` |
| "Weekly KPI trends?" | `docs/ops/WEEK_*_SYNTHESIS_REAL.md` |
| "Who approved what?" | `docs/ops/STEADY_STATE_DECISION_LOG.md` |
| "Any exceptions active?" | `STEADY_STATE_DECISION_LOG.md` § Exception Register |
| "When was last DR drill?" | Evidence bundle → DR Freshness section |

### Audit Readiness

| Requirement | Solution |
|-------------|----------|
| Evidence immutability | sha256 hashing on all bundles |
| Chain of custody | Git commit history + signed commits |
| Reproducibility | Deterministic ID generation |
| Accessibility | Markdown + Git (no proprietary formats) |

---

## 6. Transition Checklist

### From Pilot to Steady-State

- [x] Pilot Wave 0 completed (15/15 war rooms)
- [x] Closeout pack generated (`PILOT_WAVE_0_CLOSEOUT_PACK.md`)
- [x] All exit gates passing (14/14)
- [x] All pilot actions closed (3/3)
- [x] Steady-state mode declared (this document)
- [x] Cadence updated (daily → weekday)
- [x] On-call rotation assigned
- [ ] First steady-state war room (2026-02-18)

### First Week Objectives

1. Validate weekday-only cadence sustainability
2. Confirm weekend automated monitoring
3. Produce first steady-state weekly synthesis
4. Wave 1 intake planning initiated

---

## 7. Escalation Matrix

| Level | Trigger | Escalate To | Timeline |
|-------|---------|-------------|----------|
| L1 | Operational friction | IC | Immediate |
| L2 | KPI near-threshold | Ops Lead | 1 hour |
| L3 | Stop condition | Ops Lead + Governance Lead | 15 min |
| L4 | Dual-approval deadlock | Executive Sponsor | 4 hours |

---

## 8. Document Governance

### Change Control

| Change Type | Approval | Documentation |
|-------------|----------|---------------|
| Cadence adjustment | Governance Lead | Amendment log |
| Threshold modification | 2/2 approval | AGENTS.md update |
| Exception policy change | 2/2 approval | Amendment log |
| On-call rotation | Ops Lead | Rotation schedule |

### Amendment Log

| Date | Amendment | Approved By |
|------|-----------|-------------|
| 2026-02-18 | Initial steady-state declaration | Pilot Lead |

---

## Mode Metadata

| Field | Value |
|-------|-------|
| Mode ID | `sha256:b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5` |
| Effective | 2026-02-18 |
| Preceded By | Pilot Wave 0 (`sha256:e7a3c8f1...`) |
| Status | ☑ **ACTIVE** |

---

*Steady-State Operating Mode Active. Governance Plane Online.*

*Government. Transcended.*
