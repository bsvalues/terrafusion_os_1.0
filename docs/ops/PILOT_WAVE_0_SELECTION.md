# Pilot Wave 0 — Agency Selection & Scope

> **Phase:** XXIV-A — Live Go-Live Execution  
> **Status:** Draft | Pending Approval  
> **Contract Tests:** `pilot.readiness.contract.test.ts`

---

## 1. Pilot Scope

### 1.1 Selected Agency

| Field | Value |
|-------|-------|
| Agency ID | `sha256:agency_________________` |
| Agency Name (Display) | ________________________ |
| Environment | ☐ Sandbox ☐ Staging ☐ Production |
| Region | ________________________ |
| Timezone | ________________________ |

### 1.2 Selected Services

| # | Service ID | Service Name | Risk Tier | Go-Live Order |
|---|------------|--------------|-----------|---------------|
| 1 | `sha256:svc_________________` | ______________ | ☐ Low ☐ Medium ☐ High | 1 |
| 2 | `sha256:svc_________________` | ______________ | ☐ Low ☐ Medium ☐ High | 2 |
| 3 | `sha256:svc_________________` | ______________ | ☐ Low ☐ Medium ☐ High | 3 |

### 1.3 Scope Constraints

| Constraint | Value |
|------------|-------|
| Max concurrent users | ______ |
| Data retention scope | ______ days |
| Feature flags enabled | ______________________ |
| Feature flags disabled | ______________________ |

---

## 2. Operator Roster

### 2.1 Certified Operators

| # | Operator ID | Role | Certification ID | Cert Expiry | Status |
|---|-------------|------|------------------|-------------|--------|
| 1 | `sha256:op_________________` | Primary Operator | `sha256:cert_________________` | YYYY-MM-DD | ☐ Active ☐ Expired |
| 2 | `sha256:op_________________` | Backup Operator | `sha256:cert_________________` | YYYY-MM-DD | ☐ Active ☐ Expired |
| 3 | `sha256:op_________________` | On-Call Operator | `sha256:cert_________________` | YYYY-MM-DD | ☐ Active ☐ Expired |

### 2.2 Certification Requirements

| Certification | Required For | Minimum Score | Validity Period |
|---------------|--------------|---------------|-----------------|
| TerraFusion Operator Level 1 | All operators | 80% | 12 months |
| Stop-Condition Rehearsal | Primary + Backup | 100% | 6 months |
| DR Drill Participation | At least 1 operator | Pass | 90 days |

---

## 3. Approvers (Dual-Approval)

> **REQUIRED_APPROVALS = 2** (from contract tests)

### 3.1 Designated Approvers

| # | Approver ID | Role | Authority Scope | Availability |
|---|-------------|------|-----------------|--------------|
| 1 | `sha256:appr_________________` | Incident Commander | Pause/Resume, Exception Approval | ____________ |
| 2 | `sha256:appr_________________` | Security Lead | Pause/Resume, Audit Signoff | ____________ |
| 3 | `sha256:appr_________________` | Compliance Officer (Backup) | Exception Approval | ____________ |

### 3.2 Approval Matrix

| Action | Required Approvers | Approval Window |
|--------|-------------------|-----------------|
| Resume after pause | 2 distinct approvers | < 4 hours |
| Exception renewal | 1 approver | < 24 hours |
| Pilot exit decision | 2 distinct approvers | N/A |
| Emergency rollback | 1 approver (Incident Commander) | Immediate |

---

## 4. Escalation Bridge

### 4.1 Escalation Contacts

| Tier | Role | Contact ID | Response SLA |
|------|------|------------|--------------|
| L1 | On-Call Operator | `sha256:op_________________` | 15 min |
| L2 | Incident Commander | `sha256:appr_________________` | 30 min |
| L3 | Platform Engineering | `sha256:team_________________` | 1 hour |
| L4 | Executive Sponsor | `sha256:exec_________________` | 4 hours |

### 4.2 Escalation Triggers

| Condition | Escalate To | Auto-Escalate After |
|-----------|-------------|---------------------|
| Stop condition triggered | L2 | Immediate |
| MTTR > 2x SLA | L2 → L3 | 30 min |
| Dual-approval blocked | L3 | 2 hours |
| Audit integrity alert | L2 + L3 | Immediate |

---

## 5. Blackout Windows

### 5.1 Business Hours

| Day | Start (Local) | End (Local) | Operations Allowed |
|-----|---------------|-------------|-------------------|
| Monday–Friday | 08:00 | 18:00 | Full operations |
| Saturday | 10:00 | 14:00 | Read-only monitoring |
| Sunday | — | — | Emergency only |

### 5.2 Scheduled Blackouts

| Date Range | Reason | Operations Allowed |
|------------|--------|-------------------|
| YYYY-MM-DD to YYYY-MM-DD | ________________ | Emergency only |

### 5.3 No-Deploy Windows

| Window | Duration | Reason |
|--------|----------|--------|
| End of fiscal quarter | Last 3 business days | Financial close |
| Major holidays | As scheduled | Reduced staffing |

---

## 6. Preconditions Checklist

All items must be ✅ before pilot go-live.

### 6.1 Attestation & Compliance

- [ ] Agency attestation signed and current (< 365 days)
- [ ] All framework mappings present (FISMA, SOC2, FedRAMP as applicable)
- [ ] MOU coverage verified for all selected services
- [ ] No critical gaps in control→evidence narrative

### 6.2 DR & Resilience

- [ ] DR drill completed within last 90 days
- [ ] RPO/RTO thresholds documented and achievable
- [ ] Rollback tested successfully within last 30 days
- [ ] Failover tested (if applicable)

### 6.3 Training & Certification

- [ ] All operators certified (per §2.2 requirements)
- [ ] Stop-condition rehearsal completed (Phase XXIV-C)
- [ ] At least one pause/resume rehearsal executed in non-prod
- [ ] Training attendance records captured (`sha256:` refs)

### 6.4 Technical Readiness

- [ ] Portal readiness score ≥ 95%
- [ ] Zero blocking exceptions
- [ ] Zero expired exceptions
- [ ] Audit packet generated and hash-verified
- [ ] Monitoring and alerting configured

### 6.5 Operational Readiness

- [ ] War room cadence scheduled (see `WAR_ROOM_CADENCE.md`)
- [ ] Escalation bridge contacts confirmed available
- [ ] Approvers confirmed available for pilot duration
- [ ] Blackout windows communicated to all stakeholders

---

## 7. Go-Live Authorization

### 7.1 Approval Block

| Field | Value |
|-------|-------|
| Pilot Start Date | YYYY-MM-DD |
| Pilot End Date (Planned) | YYYY-MM-DD |
| KPI Window Duration | ____ days |

### 7.2 Dual-Approval Signatures

| Approver | Approver ID | Role | Date | Signature Ref |
|----------|-------------|------|------|---------------|
| Approver 1 | `sha256:appr_________________` | ____________ | YYYY-MM-DD | `sha256:sig_________________` |
| Approver 2 | `sha256:appr_________________` | ____________ | YYYY-MM-DD | `sha256:sig_________________` |

---

## 8. Document Metadata

| Field | Value |
|-------|-------|
| Document ID | `sha256:doc_pilot_sel_________________` |
| Version | 1.0.0 |
| Created | YYYY-MM-DD |
| Last Updated | YYYY-MM-DD |
| Author | ________________________ |

---

## References

- Contract Tests: [pilot.readiness.contract.test.ts](../../tools/registry/autonomy-viewer/test/pilot.readiness.contract.test.ts)
- War Room Cadence: [WAR_ROOM_CADENCE.md](WAR_ROOM_CADENCE.md)
- Exit Criteria: [PILOT_EXIT_CRITERIA.md](PILOT_EXIT_CRITERIA.md)
- Stop-Condition Runbook: [STOP_CONDITION_REHEARSAL_RUNBOOK.md](STOP_CONDITION_REHEARSAL_RUNBOOK.md)

---

*Government. Transcended.*
