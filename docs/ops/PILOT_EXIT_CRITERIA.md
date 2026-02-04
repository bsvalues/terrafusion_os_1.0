# Pilot Exit Criteria — Wave 0 Completion Gates

> **Phase:** XXIV-A — Live Go-Live Execution  
> **Status:** Draft | Pending Measurement  
> **Contract Tests:** `pilot.readiness.contract.test.ts`

---

## 1. Overview

This document defines the measurable exit criteria for Pilot Wave 0. All criteria must be satisfied before the pilot can be declared complete and the agency can proceed to full production.

### 1.1 Exit Decision

| Field | Value |
|-------|-------|
| Pilot Agency | `sha256:agency_________________` |
| Pilot Start Date | YYYY-MM-DD |
| Pilot End Date (Actual) | YYYY-MM-DD |
| KPI Window Duration | ____ days |
| Exit Decision | ☐ Pass ☐ Fail ☐ Extend |

---

## 2. KPI Window Definition

### 2.1 Measurement Window

| Parameter | Value | Notes |
|-----------|-------|-------|
| Duration | **14 days** | Minimum continuous observation period |
| Start Trigger | First production service activation | T+0 |
| Extension Trigger | Any stop condition pause | +7 days from resume |

### 2.2 KPI Thresholds

| Metric | Threshold | Operator | Measurement |
|--------|-----------|----------|-------------|
| MTTR (Mean Time to Recovery) | ≤ **30 minutes** | Max | Rolling 7-day average |
| Rollback Success Rate | ≥ **95%** | Min | Pilot duration |
| Service Availability | ≥ **99.5%** | Min | Pilot duration |
| Portal Readiness Score | ≥ **95%** | Min sustained | Daily minimum |
| Incident Response SLA | ≤ **15 minutes** | 95th percentile | All incidents |

### 2.3 KPI Evidence

| Metric | Current Value | Status | Evidence Ref |
|--------|---------------|--------|--------------|
| MTTR | ____ min | ☐ Pass ☐ Fail | `sha256:mttr_...` |
| Rollback Success | ____% | ☐ Pass ☐ Fail | `sha256:rb_...` |
| Availability | ____% | ☐ Pass ☐ Fail | `sha256:avail_...` |
| Readiness Score | ____% | ☐ Pass ☐ Fail | `sha256:ready_...` |
| Incident Response | ____ min | ☐ Pass ☐ Fail | `sha256:ir_...` |

---

## 3. Exception Policy

### 3.1 Zero Expired Exceptions (Mandatory)

| Requirement | Status |
|-------------|--------|
| Expired exceptions at exit | **0** (mandatory) |
| Current count | ____ |
| Gate status | ☐ Pass ☐ Fail |

### 3.2 Active Exception Limits

| Severity | Maximum Active | Current | Status |
|----------|----------------|---------|--------|
| Critical | 0 | ____ | ☐ Pass ☐ Fail |
| High | 2 | ____ | ☐ Pass ☐ Fail |
| Medium | 5 | ____ | ☐ Pass ☐ Fail |
| Low | 10 | ____ | ☐ Pass ☐ Fail |

### 3.3 Exception Age Limits

| Metric | Threshold | Current Max | Status |
|--------|-----------|-------------|--------|
| Oldest active exception | ≤ 60 days | ____ days | ☐ Pass ☐ Fail |
| Average exception age | ≤ 30 days | ____ days | ☐ Pass ☐ Fail |

### 3.4 Renewal Compliance

| Requirement | Status |
|-------------|--------|
| All renewals within policy | ☐ Yes ☐ No |
| No more than 2 renewals per exception | ☐ Yes ☐ No |
| Evidence ref | `sha256:exc_summary_...` |

---

## 4. DR & Game-Day Freshness

### 4.1 DR Drill Requirements

| Requirement | Threshold | Actual | Status |
|-------------|-----------|--------|--------|
| Last DR drill | ≤ **90 days** from exit date | ____ days | ☐ Pass ☐ Fail |
| DR drill result | **Pass** | ☐ Pass ☐ Fail | ☐ Pass ☐ Fail |
| RPO achieved | ≤ documented RPO | ____ | ☐ Pass ☐ Fail |
| RTO achieved | ≤ documented RTO | ____ | ☐ Pass ☐ Fail |

### 4.2 DR Evidence

| Artifact | Date | Result | Evidence Ref |
|----------|------|--------|--------------|
| DR Drill Report | YYYY-MM-DD | ☐ Pass ☐ Fail | `sha256:dr_drill_...` |
| Failover Test | YYYY-MM-DD | ☐ Pass ☐ Fail ☐ N/A | `sha256:failover_...` |
| Restore Validation | YYYY-MM-DD | ☐ Pass ☐ Fail | `sha256:restore_...` |

### 4.3 Game-Day Exercises

| Requirement | Status |
|-------------|--------|
| At least 1 game-day during pilot | ☐ Yes ☐ No |
| Game-day included stop-condition rehearsal | ☐ Yes ☐ No |
| All participants documented | ☐ Yes ☐ No |
| Evidence ref | `sha256:gameday_...` |

---

## 5. Audit Packet & Narrative

### 5.1 Audit Packet Presence

| Requirement | Status |
|-------------|--------|
| Audit packet generated for pilot agency | ☐ Yes ☐ No |
| Packet hash verified | ☐ Yes ☐ No |
| All required sections present | ☐ Yes ☐ No |

### 5.2 Audit Packet Contents

| Section | Present | Evidence Ref |
|---------|---------|--------------|
| Agency attestation | ☐ Yes ☐ No | `sha256:attest_...` |
| MOU coverage | ☐ Yes ☐ No | `sha256:mou_...` |
| Framework mappings | ☐ Yes ☐ No | `sha256:fwk_...` |
| Control inventory | ☐ Yes ☐ No | `sha256:ctrl_...` |
| Evidence linkage | ☐ Yes ☐ No | `sha256:evid_...` |

### 5.3 Control→Evidence Narrative

| Requirement | Status |
|-------------|--------|
| Narrative document present | ☐ Yes ☐ No |
| Narrative hash captured | ☐ Yes ☐ No |
| No gaps in control coverage | ☐ Yes ☐ No |
| Evidence ref | `sha256:narrative_...` |

---

## 6. Training & Certification

### 6.1 Operator Certification Status

| Operator ID | Required Certs | Current Status | Expiry Check |
|-------------|----------------|----------------|--------------|
| `sha256:op_...` | ____________ | ☐ Valid ☐ Expired | ☐ Pass ☐ Fail |
| `sha256:op_...` | ____________ | ☐ Valid ☐ Expired | ☐ Pass ☐ Fail |
| `sha256:op_...` | ____________ | ☐ Valid ☐ Expired | ☐ Pass ☐ Fail |

### 6.2 Training Completion Proof

| Training | Required | Completed | Evidence Ref |
|----------|----------|-----------|--------------|
| Operator Level 1 | ☐ Yes | ☐ Yes ☐ No | `sha256:trn_...` |
| Stop-Condition Rehearsal | ☐ Yes | ☐ Yes ☐ No | `sha256:trn_...` |
| DR Drill Participation | ☐ Yes | ☐ Yes ☐ No | `sha256:trn_...` |

### 6.3 Drill Cadence

| Requirement | Threshold | Actual | Status |
|-------------|-----------|--------|--------|
| Drills during pilot | ≥ 1 | ____ | ☐ Pass ☐ Fail |
| All drills passed | 100% | ____% | ☐ Pass ☐ Fail |
| Drill evidence captured | All | ☐ Yes ☐ No | ☐ Pass ☐ Fail |

---

## 7. Stop-Condition Resolution

### 7.1 Pause Events During Pilot

| Metric | Value | Notes |
|--------|-------|-------|
| Total pause events | ____ | |
| All pauses resolved | ☐ Yes ☐ No | **Must be Yes** |
| Unresolved pauses at exit | **0** (mandatory) | |

### 7.2 Pause Resolution Summary

| Pause ID | Trigger Code | Duration | Resolution | Evidence Ref |
|----------|--------------|----------|------------|--------------|
| `sha256:pause_...` | ________ | ____ min | ☐ Resumed ☐ Rolled back | `sha256:...` |

### 7.3 Stop-Condition Health at Exit

| Condition | Status | Evidence |
|-----------|--------|----------|
| MTTR within threshold | ☐ Yes ☐ No | `sha256:...` |
| No pending rollback failures | ☐ Yes ☐ No | `sha256:...` |
| DR drill fresh | ☐ Yes ☐ No | `sha256:...` |
| Audit integrity valid | ☐ Yes ☐ No | `sha256:...` |

---

## 8. Exit Gate Summary

### 8.1 Gate Checklist

| # | Gate | Requirement | Status |
|---|------|-------------|--------|
| 1 | KPI Window | 14 days sustained | ☐ Pass ☐ Fail |
| 2 | MTTR | ≤ 30 min | ☐ Pass ☐ Fail |
| 3 | Rollback Success | ≥ 95% | ☐ Pass ☐ Fail |
| 4 | Availability | ≥ 99.5% | ☐ Pass ☐ Fail |
| 5 | Expired Exceptions | = 0 | ☐ Pass ☐ Fail |
| 6 | Critical Exceptions | = 0 | ☐ Pass ☐ Fail |
| 7 | DR Freshness | ≤ 90 days | ☐ Pass ☐ Fail |
| 8 | DR Result | Pass | ☐ Pass ☐ Fail |
| 9 | Audit Packet | Present + verified | ☐ Pass ☐ Fail |
| 10 | Narrative Hash | Captured | ☐ Pass ☐ Fail |
| 11 | Operator Certs | All valid | ☐ Pass ☐ Fail |
| 12 | Training Complete | All required | ☐ Pass ☐ Fail |
| 13 | Unresolved Pauses | = 0 | ☐ Pass ☐ Fail |
| 14 | Audit Integrity | Valid | ☐ Pass ☐ Fail |

### 8.2 Overall Gate Status

| Status | Count |
|--------|-------|
| ☐ Pass | ____ / 14 |
| ☐ Fail | ____ / 14 |

**Exit Decision Requirement:** All 14 gates must pass (14/14).

---

## 9. Pilot Exit Decision

### 9.1 Decision

| Field | Value |
|-------|-------|
| Decision Date | YYYY-MM-DD |
| Decision | ☐ **PASS — Proceed to Production** |
|          | ☐ **EXTEND — Additional ____ days required** |
|          | ☐ **FAIL — Remediation required, re-pilot** |

### 9.2 Dual-Approval Block (Required)

> **REQUIRED_APPROVALS = 2** (from contract tests)

| Approver | Approver ID | Role | Decision | Date | Signature Ref |
|----------|-------------|------|----------|------|---------------|
| Approver 1 | `sha256:appr_________________` | ____________ | ☐ Approve ☐ Reject | YYYY-MM-DD | `sha256:sig_...` |
| Approver 2 | `sha256:appr_________________` | ____________ | ☐ Approve ☐ Reject | YYYY-MM-DD | `sha256:sig_...` |

**Approval Requirements:**
- Both approvers must be from the designated approver list (see `PILOT_WAVE_0_SELECTION.md`)
- Approvers must be distinct individuals
- Both must approve for PASS decision
- Any rejection requires documented rationale

### 9.3 Extension Justification (if applicable)

| Field | Value |
|-------|-------|
| Extension Duration | ____ days |
| Reason | ________________________ |
| Remediation Plan | ________________________ |
| New Target Exit Date | YYYY-MM-DD |

### 9.4 Failure Remediation (if applicable)

| Failed Gate | Root Cause | Remediation | Owner | ETA |
|-------------|------------|-------------|-------|-----|
| __________ | __________ | __________ | `sha256:...` | YYYY-MM-DD |

---

## 10. Post-Exit Actions

### 10.1 On PASS

- [ ] Update agency status to "Production Active"
- [ ] Archive pilot evidence bundle
- [ ] Schedule Wave 1 planning
- [ ] Update governance metrics
- [ ] Communicate success to stakeholders

### 10.2 On EXTEND

- [ ] Document extension rationale
- [ ] Update war room cadence for extension period
- [ ] Assign remediation owners for failing gates
- [ ] Schedule follow-up exit review

### 10.3 On FAIL

- [ ] Halt all production traffic to pilot services
- [ ] Initiate rollback if necessary
- [ ] Document failure postmortem
- [ ] Schedule remediation sprint
- [ ] Plan re-pilot timeline

---

## 11. Document Metadata

| Field | Value |
|-------|-------|
| Document ID | `sha256:doc_exit_crit_________________` |
| Version | 1.0.0 |
| Created | YYYY-MM-DD |
| Last Updated | YYYY-MM-DD |
| Author | ________________________ |

---

## References

- Pilot Selection: [PILOT_WAVE_0_SELECTION.md](PILOT_WAVE_0_SELECTION.md)
- War Room Cadence: [WAR_ROOM_CADENCE.md](WAR_ROOM_CADENCE.md)
- Stop-Condition Runbook: [STOP_CONDITION_REHEARSAL_RUNBOOK.md](STOP_CONDITION_REHEARSAL_RUNBOOK.md)
- Contract Tests: [pilot.readiness.contract.test.ts](../../tools/registry/autonomy-viewer/test/pilot.readiness.contract.test.ts)

---

*Government. Transcended.*
