# Wave 1 Nomination Form

> **Template Version:** 1.0.0  
> **Effective Date:** 2026-02-21  
> **Purpose:** Service nomination for Wave 1 cohort expansion

---

## Instructions

Complete this form to nominate a service for Wave 1 governance expansion. All fields are required unless marked optional. Submit to the Cohort Review Board for eligibility verification.

**Submission Deadline:** 2026-02-25  
**Review Board:** Ops Lead + Governance Lead (2/2 approval required)

---

## 1. Service Identification

| Field | Value |
|-------|-------|
| Service Name | ___________________________ |
| Service ID | `sha256:` ___________________________ |
| Service Domain | ☐ Core Infrastructure ☐ Application Layer ☐ Data Services ☐ Integration ☐ Other: _____ |
| Production Since | ___________________________ (YYYY-MM-DD) |
| Current Environment | ☐ Production ☐ Staging ☐ Development |

---

## 2. Ownership & Certification

| Field | Value |
|-------|-------|
| Service Owner Name | ___________________________ |
| Owner ID | `sha256:` ___________________________ |
| Owner Certification | ☐ Certified ☐ Certification in progress ☐ Not certified |
| Certification Expiry | ___________________________ (YYYY-MM-DD) |
| Backup Owner ID | `sha256:` ___________________________ |

---

## 3. Baseline Metrics (Current)

| Metric | Current Value | Measurement Date |
|--------|--------------|------------------|
| MTTR | ___ min | ___________________________ |
| Rollback Success Rate | ___% | ___________________________ |
| Availability (30-day) | ___% | ___________________________ |
| Incident Response Time | ___ min | ___________________________ |

### Threshold Compliance

| Metric | Current | Threshold | Status |
|--------|---------|-----------|--------|
| MTTR | ___ min | ≤ 30 min | ☐ Pass ☐ Fail |
| Rollback | ___% | ≥ 95% | ☐ Pass ☐ Fail |
| Availability | ___% | ≥ 99.5% | ☐ Pass ☐ Fail |
| Incident Response | ___ min | ≤ 60 min | ☐ Pass ☐ Fail |

---

## 4. Monitoring & Observability

| Check | Status | Evidence |
|-------|--------|----------|
| MTTR metric exposed | ☐ Yes ☐ No | Dashboard: ___________________________ |
| Rollback metric exposed | ☐ Yes ☐ No | Dashboard: ___________________________ |
| Availability metric exposed | ☐ Yes ☐ No | Dashboard: ___________________________ |
| Incident response tracked | ☐ Yes ☐ No | System: ___________________________ |
| Alert routing configured | ☐ Yes ☐ No | Channel: ___________________________ |

---

## 5. Runbook & Documentation

| Check | Status | Location |
|-------|--------|----------|
| Runbook published | ☐ Yes ☐ No | Path: `docs/ops/RUNBOOKS/` ___________________________ |
| Runbook reviewed (last 90 days) | ☐ Yes ☐ No | Review date: ___________________________ |
| Escalation procedures documented | ☐ Yes ☐ No | — |
| Recovery procedures documented | ☐ Yes ☐ No | — |

---

## 6. DR Participation

| Field | Value |
|-------|-------|
| Included in last DR drill | ☐ Yes ☐ No |
| Last drill date | ___________________________ (YYYY-MM-DD) |
| Last drill result | ☐ Pass ☐ Fail ☐ Partial |
| DR drill reference ID | `sha256:` ___________________________ |

---

## 7. Security Posture

| Check | Status | Evidence |
|-------|--------|----------|
| Security scan completed (last 30 days) | ☐ Yes ☐ No | Scan date: ___________________________ |
| P1 vulnerabilities | ___ (must be 0) | — |
| P2 vulnerabilities | ___ | — |
| Remediation plan (if P2 > 0) | ☐ Yes ☐ N/A | — |

---

## 8. Dependencies

### Upstream Dependencies (services this service calls)

| Service Name | Service ID | Criticality |
|--------------|-----------|-------------|
| ___________________________ | `sha256:` ___________________________ | ☐ Critical ☐ High ☐ Medium ☐ Low |
| ___________________________ | `sha256:` ___________________________ | ☐ Critical ☐ High ☐ Medium ☐ Low |
| ___________________________ | `sha256:` ___________________________ | ☐ Critical ☐ High ☐ Medium ☐ Low |

### Downstream Dependencies (services that call this service)

| Service Name | Service ID | Criticality |
|--------------|-----------|-------------|
| ___________________________ | `sha256:` ___________________________ | ☐ Critical ☐ High ☐ Medium ☐ Low |
| ___________________________ | `sha256:` ___________________________ | ☐ Critical ☐ High ☐ Medium ☐ Low |
| ___________________________ | `sha256:` ___________________________ | ☐ Critical ☐ High ☐ Medium ☐ Low |

---

## 9. Exclusion Criteria Check

| Criterion | Status |
|-----------|--------|
| Active P1/P2 incidents | ☐ None ☐ Active (EXCLUDE) |
| Major refactor in progress | ☐ No ☐ Yes (EXCLUDE) |
| Missing owner certification | ☐ Certified ☐ Missing (EXCLUDE) |
| External dependency blockers | ☐ None ☐ Present (EXCLUDE) |

---

## 10. Nominator Attestation

I attest that:

- [ ] All information provided is accurate as of the submission date
- [ ] The service meets all eligibility requirements or exclusion criteria have been disclosed
- [ ] The service owner is aware of and supports this nomination
- [ ] Baseline metrics are current (measured within last 7 days)

| Field | Value |
|-------|-------|
| Nominator Name | ___________________________ |
| Nominator ID | `sha256:` ___________________________ |
| Submission Date | ___________________________ (YYYY-MM-DD) |
| Signature | ☐ Confirmed |

---

## Review Board Use Only

### Eligibility Verification

| Check | Result | Verified By |
|-------|--------|-------------|
| Service maturity ≥ 6 months | ☐ Pass ☐ Fail | ___________________________ |
| Owner certification valid | ☐ Pass ☐ Fail | ___________________________ |
| Metrics within threshold | ☐ Pass ☐ Fail | ___________________________ |
| Runbook published | ☐ Pass ☐ Fail | ___________________________ |
| No critical vulnerabilities | ☐ Pass ☐ Fail | ___________________________ |
| DR participation confirmed | ☐ Pass ☐ Fail | ___________________________ |
| No exclusion criteria | ☐ Pass ☐ Fail | ___________________________ |

### Decision

| Field | Value |
|-------|-------|
| Decision | ☐ APPROVED ☐ DEFERRED ☐ REJECTED |
| Rationale | ___________________________ |
| Decision Date | ___________________________ (YYYY-MM-DD) |

### Approval Signatures

| Approver | Role | Decision | Timestamp |
|----------|------|----------|-----------|
| ___________________________ | Ops Lead | ☐ Approve ☐ Reject | ___________________________ |
| ___________________________ | Governance Lead | ☐ Approve ☐ Reject | ___________________________ |

---

## Form Metadata

| Field | Value |
|-------|-------|
| Form ID | `WAVE1_NOM_FORM_v1.0.0` |
| Template Hash | `sha256:f1e2d3c4b5a6f7e8d9c0b1a2f3e4d5c6b7a8f9e0d1c2b3a4f5e6d7c8b9a0f1e2` |
| Created | 2026-02-18 |
| Valid Until | 2026-02-25 (Wave 1 nomination close) |

---

*Government. Transcended.*
