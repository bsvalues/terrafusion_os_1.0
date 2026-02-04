# Day 0 Baseline Snapshot

> **Pilot:** Wave 0  
> **Date:** YYYY-MM-DD  
> **Snapshot ID:** `sha256:day0_baseline_XXXXXX`  
> **Captured By:** `sha256:operator_XXXXXX`

---

## 1. Pilot Selection (Finalized)

### Agency

| Field | Value |
|-------|-------|
| Agency ID | `sha256:agency_XXXXXX` |
| Agency Name | [REDACTED — see agency record] |
| Attestation Status | ☐ Valid / ☐ Expired / ☐ Pending |
| Attestation Expiry | YYYY-MM-DD |

### Service Scope

| Service | Status | MOU ID |
|---------|--------|--------|
| [Service 1] | ☐ Active | `sha256:mou_XXXXXX` |
| [Service 2] | ☐ Active | `sha256:mou_XXXXXX` |

### Operators (Certified)

| Role | Operator ID | Certification Status | Cert Expiry |
|------|-------------|---------------------|-------------|
| Primary | `sha256:op_XXXXXX` | ☐ Valid | YYYY-MM-DD |
| Backup | `sha256:op_XXXXXX` | ☐ Valid | YYYY-MM-DD |
| On-Call | `sha256:op_XXXXXX` | ☐ Valid | YYYY-MM-DD |

### Approvers (Designated)

| Role | Approver ID | Authority Level |
|------|-------------|-----------------|
| Approver 1 | `sha256:approver_XXXXXX` | ☐ Resume / ☐ Exit |
| Approver 2 | `sha256:approver_XXXXXX` | ☐ Resume / ☐ Exit |
| Backup | `sha256:approver_XXXXXX` | ☐ Resume / ☐ Exit |

---

## 2. Readiness Score

| Metric | Value | Threshold | Status |
|--------|-------|-----------|--------|
| Overall Readiness | __% | ≥ 95% | ☐ Pass / ☐ Blocked |

### Blocked Reasons (if any)

| Blocker ID | Description | Owner | ETA |
|------------|-------------|-------|-----|
| — | (none) | — | — |

**Readiness Confirmation:** ☐ No blockers — ready for Day 1

---

## 3. Exception Ledger

| Category | Count | Target |
|----------|-------|--------|
| Total Active | __ | — |
| Expired | __ | = 0 |
| Expiring (≤7 days) | __ | — |
| New (this window) | __ | — |

### Exception Detail (if any)

| Exception ID | Severity | Expiry | Owner | Renewal Justified |
|--------------|----------|--------|-------|-------------------|
| — | — | — | — | — |

**Exception Confirmation:** ☐ Zero expired exceptions

---

## 4. Attestation & MOU State

### Attestation

| Field | Value |
|-------|-------|
| Attestation ID | `sha256:attest_XXXXXX` |
| Status | ☐ Valid |
| Valid From | YYYY-MM-DD |
| Valid Until | YYYY-MM-DD |
| Days Until Expiry | __ days |

### Active MOUs

| MOU ID | Service | Version | Signed Date | Status |
|--------|---------|---------|-------------|--------|
| `sha256:mou_XXXXXX` | [Service] | v1.0.0 | YYYY-MM-DD | ☐ Active |

---

## 5. DR Freshness & Drill Compliance

| Metric | Value | Threshold | Status |
|--------|-------|-----------|--------|
| Last DR Drill | YYYY-MM-DD | ≤ 90 days ago | ☐ Pass |
| Days Since Drill | __ days | ≤ 90 | ☐ Pass |
| Next Drill Due | YYYY-MM-DD | — | — |
| RPO Validated | ☐ Yes / ☐ No | — | — |
| RTO Validated | ☐ Yes / ☐ No | — | — |

**DR Confirmation:** ☐ DR drill within 90-day freshness window

---

## 6. Portal Status Snapshot

| Dashboard Section | Status | Notes |
|-------------------|--------|-------|
| Readiness Panel | ☐ Green / ☐ Yellow / ☐ Red | |
| Exception Panel | ☐ Green / ☐ Yellow / ☐ Red | |
| Stop-Condition Watch | ☐ All clear | |
| KPI Panel | ☐ Thresholds met | |
| DR Freshness | ☐ Current | |

**Portal Snapshot Reference:** `sha256:portal_snapshot_XXXXXX`

---

## 7. KPI Baseline (Day 0)

| KPI | Current Value | Threshold | Status |
|-----|---------------|-----------|--------|
| MTTR (14d rolling) | __ min | ≤ 30 min | ☐ Pass |
| Rollback Success | __% | ≥ 95% | ☐ Pass |
| Availability | __% | ≥ 99.5% | ☐ Pass |
| Incident Response | __ min | ≤ 60 min | ☐ Pass |

---

## 8. Stop-Condition Watch (Day 0)

| Condition | Current Status | Trend |
|-----------|----------------|-------|
| MTTR_REGRESSION | ☐ Clear | — |
| ROLLBACK_FAILURE | ☐ Clear | — |
| DR_DRILL_FAILURE | ☐ Clear | — |
| AUDIT_INTEGRITY_ALERT | ☐ Clear | — |

**Stop-Condition Readiness:**

- ☐ Runbook accessible: `STOP_CONDITION_REHEARSAL_RUNBOOK.md`
- ☐ Escalation bridge contacts verified
- ☐ Dual-approval mechanism tested (via rehearsal)

---

## 9. Day 0 Confirmation

### Checklist

- [ ] Pilot selection finalized (agency, operators, approvers)
- [ ] Readiness score ≥ 95% (or blockers documented with ETA)
- [ ] Zero expired exceptions
- [ ] Attestation valid
- [ ] All MOUs active
- [ ] DR drill within 90-day window
- [ ] KPI baseline captured
- [ ] Stop-condition watch active
- [ ] Portal dashboards accessible

### Signatures

| Role | ID | Timestamp | Confirmation |
|------|-----|-----------|--------------|
| Primary Operator | `sha256:op_XXXXXX` | YYYY-MM-DD HH:MM UTC | ☐ Confirmed |
| Incident Commander | `sha256:ic_XXXXXX` | YYYY-MM-DD HH:MM UTC | ☐ Confirmed |

---

## 10. Day 1 War Room Scheduled

| Field | Value |
|-------|-------|
| Date | YYYY-MM-DD |
| Time | HH:MM UTC |
| Duration | 15–30 min |
| Bridge | [Conference link or room] |

---

*Baseline captured. Pilot Day 1 authorized to proceed.*

---

*Government. Transcended.*
