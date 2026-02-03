# Wave 1 Nominations Open

> **Announcement ID:** `sha256:c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4`  
> **Effective Date:** 2026-02-21  
> **Status:** ☑ **OPEN**

---

## Decision ID Map

> **Canonical reference — use these IDs in decision log entries.**

| Milestone | Decision ID | Date |
|-----------|-------------|------|
| Nominations Opened | `dec_ss_002` (pre-recorded) | 2026-02-21 |
| Nominations Closed | `dec_ss_003` | 2026-02-25 |
| Gate Evaluation Complete | `dec_ss_004` | 2026-02-26 |
| Cohort Finalized | `dec_ss_005` | 2026-02-27 |
| Wave 1 Day 0 Authorized | `dec_ss_006` | 2026-03-01 |

---

## Announcement

**Wave 1 cohort nominations are now open.**

TerraFusion OS is expanding governance coverage from the initial Wave 0 baseline to a broader service cohort. Services meeting eligibility criteria may be nominated for inclusion in Wave 1.

---

## Key Dates

| Milestone | Date | Status |
|-----------|------|--------|
| Nominations Open | **2026-02-21** | ☑ Active |
| Nominations Close | **2026-02-25** | ☐ Pending |
| Gate Evaluation | 2026-02-26 | ☐ Pending |
| Cohort Decision | 2026-02-27 | ☐ Pending |
| Wave 1 Day 0 | **2026-03-01** | ☐ Pending |

**Deadline:** All nominations must be submitted by **2026-02-25 23:59 UTC**. Late submissions will be deferred to Wave 2.

---

## Cohort Target

| Parameter | Value |
|-----------|-------|
| Minimum Services | 10 |
| Maximum Services | 20 |
| Recommended | 15 |

**Selection Priority:** First-qualified basis within cohort limits.

---

## Nomination Process

### Step 1: Complete Nomination Form

Use the official nomination form template:

📄 **[WAVE_1_NOMINATION_FORM.md](templates/WAVE_1_NOMINATION_FORM.md)**

**Required Information:**
- Service identification (sha256 ID required)
- Owner certification status
- Current baseline metrics (MTTR, Rollback, Availability, IR)
- Runbook location
- DR participation status
- Security scan results

### Step 2: Submit for Evaluation

Submit completed nomination forms via pull request to `docs/ops/wave1/nominations/`.

**Naming Convention:** `NOMINATION_[SERVICE_NAME].md`

### Step 3: Gate Evaluation

Each nomination will be evaluated against the 12-gate readiness checklist:

📄 **[WAVE_1_READINESS_GATE_CHECKLIST.md](templates/WAVE_1_READINESS_GATE_CHECKLIST.md)**

**Decision Matrix:**

| Gates Passing | Decision |
|---------------|----------|
| 12/12 | ✅ APPROVED |
| 10–11/12 | ⏸ DEFERRED (remediation required) |
| < 10/12 | ❌ REJECTED |

### Step 4: Cohort Aggregation

Approved services will be added to the cohort intake packet:

📄 **[WAVE_1_COHORT_INTAKE_PACKET.md](templates/WAVE_1_COHORT_INTAKE_PACKET.md)**

---

## Eligibility Criteria

### Required (All Must Pass)

| Criterion | Requirement |
|-----------|-------------|
| Production Age | ≥ 6 months |
| Owner Certification | Valid and current |
| MTTR | ≤ 30 min (30-day average) |
| Rollback Success | ≥ 95% |
| Availability | ≥ 99.5% |
| Incident Response | ≤ 60 min |
| Runbook | Published and current (≤90 days) |
| DR Participation | Drill within 90 days |
| Security Scan | Current (≤30 days), 0 P1 vulns |
| Monitoring | All 4 metrics instrumented |

### Exclusion Criteria (Any Fails Nomination)

| Criterion | Effect |
|-----------|--------|
| Active P1/P2 incident | EXCLUDED |
| Major refactor in progress | EXCLUDED |
| Missing owner certification | EXCLUDED |
| External dependency blockers | EXCLUDED |

---

## Evidence Rules

### Permitted

- `sha256:` hashed identifiers for all entities
- Metric values from approved monitoring systems
- Runbook file paths (relative to workspace)
- DR drill report references (sha256)
- Security scan dates and counts

### Prohibited

- Personal names (use sha256 IDs)
- Email addresses
- Phone numbers
- Any PII

**Violation:** Nominations containing PII will be rejected without evaluation.

---

## Evaluation Cadence

| Date | Activity |
|------|----------|
| 2026-02-21 | Nominations open; daily triage begins |
| 2026-02-22 | Daily triage (15 min) |
| 2026-02-23 | Weekend (no triage) |
| 2026-02-24 | Weekend (no triage) |
| 2026-02-25 | Final submissions; nominations close |
| 2026-02-26 | Batch gate evaluation |
| 2026-02-27 | Cohort decision published |

---

## Decision Authority

| Role | Responsibility |
|------|----------------|
| Ops Lead | Primary evaluator, gate checklist execution |
| Governance Lead | Compliance verification, final approval |
| Cohort Review Board | 2/2 approval for cohort acceptance |

---

## Governance References

| Document | Purpose |
|----------|---------|
| [WAVE_1_EXPANSION_PLAN.md](WAVE_1_EXPANSION_PLAN.md) | Full expansion plan and success criteria |
| [STEADY_STATE_OPERATING_MODE.md](STEADY_STATE_OPERATING_MODE.md) | Governance cadence and invariants |
| [PILOT_WAVE_0_CLOSEOUT_PACK.md](PILOT_WAVE_0_CLOSEOUT_PACK.md) | Wave 0 evidence and lessons learned |

---

## Questions & Support

For nomination questions:
- Review the nomination form and gate checklist templates
- Consult the Wave 1 expansion plan for detailed criteria
- Contact the Cohort Review Board via governance channels

---

## Announcement Metadata

| Field | Value |
|-------|-------|
| Announcement ID | `sha256:c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4` |
| Published | 2026-02-21 |
| Valid Until | 2026-02-25 23:59 UTC |
| Decision Record | `dec_ss_002` |

---

*Wave 1 Nominations Open. Governed Expansion Begins.*

*Government. Transcended.*
