# Wave 1 Readiness Gate Checklist

> **Template Version:** 1.0.0  
> **Checklist ID:** `sha256:b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3`  
> **Purpose:** Deterministic pass/fail evaluation for Wave 1 nominations  
> **Effective:** 2026-02-21

---

## Instructions

Use this checklist to evaluate each Wave 1 nomination. **All gates must pass** for service approval. Any single FAIL results in DEFER or REJECT.

### Decision Matrix

| Gates Passing | Decision |
|---------------|----------|
| 12/12 | ✅ APPROVED |
| 10–11/12 | ⏸ DEFERRED (remediation required) |
| < 10/12 | ❌ REJECTED |

---

## Gate Evaluation Form

### Service Under Evaluation

| Field | Value |
|-------|-------|
| Service Name | ___________________________ |
| Service ID | `sha256:` ___________________________ |
| Nomination Form Ref | `sha256:` ___________________________ |
| Evaluator | ___________________________ |
| Evaluation Date | ___________________________ (YYYY-MM-DD) |

---

## Gate 1: Service Maturity

| Criterion | Requirement | Value | Result |
|-----------|-------------|-------|--------|
| Production age | ≥ 6 months | ___ months | ☐ PASS ☐ FAIL |

**Evidence Required:** Production deployment date from audit log

**Pass Condition:** Service has been in production for at least 6 months as of evaluation date

---

## Gate 2: Owner Certification

| Criterion | Requirement | Value | Result |
|-----------|-------------|-------|--------|
| Operator certification | Valid and current | Expiry: ________ | ☐ PASS ☐ FAIL |

**Evidence Required:** Certification ID + expiry date from cert registry

**Pass Condition:** Owner operator certification is valid and not expiring within 30 days

---

## Gate 3: MTTR Threshold

| Criterion | Requirement | Value | Result |
|-----------|-------------|-------|--------|
| MTTR | ≤ 30 min | ___ min | ☐ PASS ☐ FAIL |

**Evidence Required:** 30-day MTTR average from monitoring dashboard

**Pass Condition:** Mean Time to Recovery ≤ 30 minutes

---

## Gate 4: Rollback Success Rate

| Criterion | Requirement | Value | Result |
|-----------|-------------|-------|--------|
| Rollback success | ≥ 95% | ___% | ☐ PASS ☐ FAIL |

**Evidence Required:** Rollback success rate from deployment system

**Pass Condition:** Rollback success rate ≥ 95% over last 30 days

---

## Gate 5: Availability

| Criterion | Requirement | Value | Result |
|-----------|-------------|-------|--------|
| Availability | ≥ 99.5% | ___% | ☐ PASS ☐ FAIL |

**Evidence Required:** 30-day availability from monitoring dashboard

**Pass Condition:** Service availability ≥ 99.5%

---

## Gate 6: Incident Response Time

| Criterion | Requirement | Value | Result |
|-----------|-------------|-------|--------|
| Incident response | ≤ 60 min | ___ min | ☐ PASS ☐ FAIL |

**Evidence Required:** Average incident response time from incident tracking

**Pass Condition:** Mean incident response time ≤ 60 minutes

---

## Gate 7: Runbook Published

| Criterion | Requirement | Value | Result |
|-----------|-------------|-------|--------|
| Runbook exists | Published in docs/ops/RUNBOOKS/ | Path: ________ | ☐ PASS ☐ FAIL |
| Runbook current | Reviewed within 90 days | Review date: ________ | ☐ PASS ☐ FAIL |

**Evidence Required:** Runbook file path + last review date

**Pass Condition:** Runbook exists AND was reviewed within last 90 days

---

## Gate 8: DR Participation

| Criterion | Requirement | Value | Result |
|-----------|-------------|-------|--------|
| DR drill inclusion | Participated in drill ≤ 90 days | ___ days ago | ☐ PASS ☐ FAIL |
| DR drill result | Pass or Partial | Result: ________ | ☐ PASS ☐ FAIL |

**Evidence Required:** DR drill report with service participation

**Pass Condition:** Service was included in a DR drill within last 90 days AND result was Pass or Partial (not Fail)

---

## Gate 9: Security Posture

| Criterion | Requirement | Value | Result |
|-----------|-------------|-------|--------|
| Security scan | Completed within 30 days | Scan date: ________ | ☐ PASS ☐ FAIL |
| P1 vulnerabilities | 0 | Count: ___ | ☐ PASS ☐ FAIL |

**Evidence Required:** Security scan report with date and findings

**Pass Condition:** Security scan completed within 30 days AND zero P1 vulnerabilities

---

## Gate 10: Exception Posture

| Criterion | Requirement | Value | Result |
|-----------|-------------|-------|--------|
| Active exceptions | 0 or justified | Count: ___ | ☐ PASS ☐ FAIL |
| Expired exceptions | 0 | Count: ___ | ☐ PASS ☐ FAIL |

**Evidence Required:** Exception register for service

**Pass Condition:** No expired exceptions AND any active exceptions have valid justification

---

## Gate 11: Monitoring Instrumented

| Criterion | Requirement | Value | Result |
|-----------|-------------|-------|--------|
| MTTR metric exposed | Yes | ☐ Yes ☐ No | ☐ PASS ☐ FAIL |
| Rollback metric exposed | Yes | ☐ Yes ☐ No | ☐ PASS ☐ FAIL |
| Availability metric exposed | Yes | ☐ Yes ☐ No | ☐ PASS ☐ FAIL |
| Alert routing configured | Yes | Channel: ________ | ☐ PASS ☐ FAIL |

**Evidence Required:** Dashboard link + alert channel configuration

**Pass Condition:** All 4 instrumentation checks pass

---

## Gate 12: Exclusion Criteria Clear

| Criterion | Requirement | Value | Result |
|-----------|-------------|-------|--------|
| No active P1/P2 incidents | Clear | ☐ Clear ☐ Active | ☐ PASS ☐ FAIL |
| No major refactor in progress | Clear | ☐ Clear ☐ In progress | ☐ PASS ☐ FAIL |
| No external dependency blockers | Clear | ☐ Clear ☐ Present | ☐ PASS ☐ FAIL |

**Evidence Required:** Incident tracker + project status

**Pass Condition:** All 3 exclusion checks clear

---

## Gate Summary

| Gate | Description | Result |
|------|-------------|--------|
| G01 | Service Maturity (≥ 6 months) | ☐ PASS ☐ FAIL |
| G02 | Owner Certification (valid) | ☐ PASS ☐ FAIL |
| G03 | MTTR (≤ 30 min) | ☐ PASS ☐ FAIL |
| G04 | Rollback (≥ 95%) | ☐ PASS ☐ FAIL |
| G05 | Availability (≥ 99.5%) | ☐ PASS ☐ FAIL |
| G06 | Incident Response (≤ 60 min) | ☐ PASS ☐ FAIL |
| G07 | Runbook (published + current) | ☐ PASS ☐ FAIL |
| G08 | DR Participation (≤ 90 days, pass/partial) | ☐ PASS ☐ FAIL |
| G09 | Security (scan current, 0 P1) | ☐ PASS ☐ FAIL |
| G10 | Exception Posture (0 expired) | ☐ PASS ☐ FAIL |
| G11 | Monitoring Instrumented (4/4) | ☐ PASS ☐ FAIL |
| G12 | Exclusion Criteria Clear (3/3) | ☐ PASS ☐ FAIL |

**Total Passing:** ___ / 12

---

## Evaluation Decision

| Field | Value |
|-------|-------|
| Gates Passing | ___ / 12 |
| Decision | ☐ APPROVED ☐ DEFERRED ☐ REJECTED |
| Rationale | ___________________________ |

### Remediation Required (if DEFERRED)

| Failed Gate | Remediation Action | Due Date |
|-------------|-------------------|----------|
| G___ | ___________________________ | ___________________________ |
| G___ | ___________________________ | ___________________________ |

---

## Evaluator Sign-Off

| Field | Value |
|-------|-------|
| Evaluator Name | ___________________________ |
| Evaluator ID | `sha256:` ___________________________ |
| Evaluation Date | ___________________________ (YYYY-MM-DD) |
| Signature | ☐ Confirmed |

---

## Cohort Review Board Approval

| Approver | Role | Decision | Timestamp |
|----------|------|----------|-----------|
| ___________________________ | Ops Lead | ☐ Approve ☐ Reject | ___________________________ |
| ___________________________ | Governance Lead | ☐ Approve ☐ Reject | ___________________________ |

**Final Decision:** ☐ APPROVED (2/2) ☐ REJECTED

---

## Checklist Metadata

| Field | Value |
|-------|-------|
| Checklist ID | `sha256:b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3` |
| Template Version | 1.0.0 |
| Created | 2026-02-20 |
| References | `WAVE_1_NOMINATION_FORM.md`, `WAVE_1_EXPANSION_PLAN.md` |

---

*Government. Transcended.*
