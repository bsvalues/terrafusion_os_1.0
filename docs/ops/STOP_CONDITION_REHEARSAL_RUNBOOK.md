# Stop-Condition Rehearsal Runbook

> **Contract Tests**: `tools/registry/autonomy-viewer/test/rehearsal.stop-condition.contract.test.ts`  
> **Purpose**: Prove the brakes work before putting a real agency on the road.

---

## Overview

This runbook provides step-by-step procedures for executing stop-condition rehearsals. Each rehearsal validates that:

1. Stop conditions trigger auto-pause within **bounded time (< 5 seconds)**
2. Pause events are audited with `sha256:` event chains
3. Recovery requires explicit **dual-approval**
4. Resumption preserves audit chain integrity
5. Evidence is complete and PII-clean

---

## Constants (From Contract Tests)

| Constant | Value | Description |
|----------|-------|-------------|
| `MAX_PAUSE_LATENCY_MS` | 5000 | Maximum allowed time from trigger to pause |
| `REQUIRED_APPROVALS` | 2 | Minimum approvals required for recovery |

### Stop Condition Codes

| Code | Description |
|------|-------------|
| `MTTR_REGRESSION` | Mean Time to Recovery exceeds threshold |
| `ROLLBACK_FAILURE` | Rollback operation failed |
| `DR_DRILL_FAILURE` | Disaster recovery drill failed |
| `AUDIT_INTEGRITY_ALERT` | Audit chain integrity violation detected |

---

## Pre-Rehearsal Checklist

- [ ] Identify rehearsal scope (single or compound failure)
- [ ] Confirm rollout environment is non-production
- [ ] Notify all stakeholders of scheduled rehearsal window
- [ ] Verify incident commander and security lead availability
- [ ] Prepare evidence capture tools (portal snapshot, logs)
- [ ] Create rehearsal record with `sha256:` ID

---

## Scenario 1: MTTR Regression Gate

**Trigger**: Mean Time to Recovery exceeds acceptable threshold.

### Procedure

1. **Inject Trigger**
   ```
   Condition Code: MTTR_REGRESSION
   Triggered By: [Operator ID]
   Payload: { mttrMs: [observed], thresholdMs: [limit] }
   ```

2. **Verify Auto-Pause**
   - [ ] Pause occurred within 5 seconds of trigger
   - [ ] Portal shows rollout state: `paused`
   - [ ] Pause event ID: `sha256:pause_[...]`
   - [ ] Trigger event ID linked in pause record

3. **Capture Evidence**
   - [ ] Screenshot portal pause banner
   - [ ] Record pause latency: `____` ms
   - [ ] Document MTTR values

4. **Initiate Recovery**
   - Request Approval 1 (Incident Commander)
     - Approver Role: `incident_commander`
     - Rationale: "_______________________"
   - Request Approval 2 (Security Lead)
     - Approver Role: `security_lead`
     - Rationale: "_______________________"

5. **Resume Rollout**
   - [ ] Dual-approval satisfied (2/2)
   - [ ] Execute resume with operator ID
   - [ ] Verify rollout state: `active`
   - [ ] Verify audit chain valid: `true`

6. **Complete Rehearsal**
   - [ ] Portal snapshot captured: `sha256:[...]`
   - [ ] Postmortem documented: `sha256:[...]`
   - [ ] Evidence checklist complete

---

## Scenario 2: Rollback Failure Gate

**Trigger**: Automated rollback operation failed.

### Procedure

1. **Inject Trigger**
   ```
   Condition Code: ROLLBACK_FAILURE
   Triggered By: [Operator ID]
   Payload: { rollbackAttempt: [count], errorCode: [code] }
   ```

2. **Verify Auto-Pause**
   - [ ] Pause occurred within 5 seconds
   - [ ] Rollout state: `paused`
   - [ ] Pause event ID: `sha256:pause_[...]`

3. **Capture Evidence**
   - [ ] Screenshot portal
   - [ ] Record rollback error details
   - [ ] Document affected deployments

4. **Initiate Recovery**
   - Request Approval 1 (Incident Commander)
   - Request Approval 2 (Security Lead or Platform Lead)

5. **Resume Rollout**
   - [ ] Dual-approval satisfied
   - [ ] Resume executed
   - [ ] Audit chain verified

6. **Complete Rehearsal**
   - [ ] All evidence captured with `sha256:` refs

---

## Scenario 3: DR Drill Failure Gate

**Trigger**: Disaster recovery drill did not complete successfully.

### Procedure

1. **Inject Trigger**
   ```
   Condition Code: DR_DRILL_FAILURE
   Triggered By: [Operator ID]
   Payload: { drillId: [id], failurePhase: [phase] }
   ```

2. **Verify Auto-Pause**
   - [ ] Pause within bounded time
   - [ ] State: `paused`
   - [ ] Event chain intact

3. **Capture Evidence**
   - [ ] DR drill failure report
   - [ ] Affected recovery objectives
   - [ ] Portal snapshot

4. **Initiate Recovery**
   - Approval 1: ________________________
   - Approval 2: ________________________

5. **Resume Rollout**
   - [ ] Dual-approval verified
   - [ ] Resume completed
   - [ ] Chain integrity validated

6. **Complete Rehearsal**
   - [ ] Drill remediation plan documented

---

## Scenario 4: Audit Integrity Alert Gate

**Trigger**: System detected potential audit chain integrity violation.

### Procedure

1. **Inject Trigger**
   ```
   Condition Code: AUDIT_INTEGRITY_ALERT
   Triggered By: [Operator ID]
   Payload: { chainId: [id], expectedHash: [hash], observedHash: [hash] }
   ```

2. **Verify Auto-Pause**
   - [ ] Immediate pause (< 5 seconds)
   - [ ] Critical: This is a security-sensitive condition
   - [ ] Pause event ID: `sha256:pause_[...]`

3. **Capture Evidence**
   - [ ] Full audit chain export
   - [ ] Hash mismatch details
   - [ ] Timestamp analysis

4. **Initiate Recovery**
   - Approval 1 (Security Lead - REQUIRED): ________________________
   - Approval 2 (Compliance Officer): ________________________

5. **Resume Decision**

   > ⚠️ **CRITICAL**: Audit integrity alerts require root cause analysis before resume.

   - [ ] Root cause identified
   - [ ] No data integrity compromise confirmed
   - [ ] Remediation applied

6. **Resume Rollout**
   - [ ] Dual-approval from security-qualified approvers
   - [ ] Resume with enhanced monitoring

7. **Complete Rehearsal**
   - [ ] Security incident report filed if applicable

---

## Scenario 5: Compound Failure (Multiple Conditions)

**Trigger**: Multiple stop conditions occur simultaneously.

### Semantics

- Multiple triggers → **Single pause** (first trigger wins)
- All triggers recorded with ordered `previousEventId` chain
- Primary condition code: First trigger's code
- Recovery still requires dual-approval

### Procedure

1. **Inject Compound Trigger**
   ```
   Condition Codes: [MTTR_REGRESSION, AUDIT_INTEGRITY_ALERT]
   Order: 1. MTTR_REGRESSION, 2. AUDIT_INTEGRITY_ALERT
   ```

2. **Verify Single Pause**
   - [ ] Only ONE pause event created
   - [ ] Primary condition: First trigger code
   - [ ] All triggers linked via `previousEventId`

3. **Capture Evidence**
   - [ ] Document trigger order
   - [ ] Record all condition payloads
   - [ ] Note inter-trigger timing

4. **Initiate Recovery**
   - Consider ALL conditions when requesting approvals
   - Security-sensitive conditions (AUDIT_INTEGRITY_ALERT) elevate approval requirements

5. **Resume Rollout**
   - [ ] Dual-approval for primary condition
   - [ ] Secondary conditions acknowledged in rationale

6. **Complete Rehearsal**
   - [ ] Compound failure analysis documented

---

## Evidence Capture Template

Complete for each rehearsal:

| Field | Value | Requirement |
|-------|-------|-------------|
| Rehearsal ID | `sha256:rehearsal_[...]` | Required |
| Trigger Event ID | `sha256:trigger_[...]` | Required |
| Pause Event ID | `sha256:pause_[...]` | Required |
| Pause Latency | `____` ms (< 5000) | Required |
| Approval 1 ID | `sha256:approval_[...]` | Required |
| Approval 2 ID | `sha256:approval_[...]` | Required |
| Resume Event ID | `sha256:resume_[...]` | Required |
| Portal Snapshot | `sha256:[...]` | Required |
| Postmortem Ref | `sha256:[...]` | Required |
| Audit Chain Valid | `true` / `false` | Required |

---

## Decision Tree: Abort / Rollback / Resume

```
┌─────────────────────────────────────────────────────┐
│              Stop Condition Triggered               │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│           Auto-Pause Within 5 Seconds?              │
├──────────────────┬──────────────────────────────────┤
│       NO         │              YES                 │
│                  │                                  │
▼                  ▼                                  │
ESCALATE:          Continue ──────────────────────────┘
Pause latency                    │
exceeded SLA.                    │
Consider manual                  ▼
intervention.     ┌─────────────────────────────────────────────────────┐
                  │         Root Cause Identifiable?                    │
                  ├──────────────────┬──────────────────────────────────┤
                  │       NO         │              YES                 │
                  │                  │                                  │
                  ▼                  ▼                                  │
                  │                  │                                  │
┌─────────────────┴───────┐  ┌──────┴────────────────────────────────┐ │
│ ABORT REHEARSAL         │  │ Remediation Possible During Window?   │ │
│ - Record abort reason   │  ├──────────────────┬────────────────────┤ │
│ - Capture evidence      │  │       NO         │        YES         │ │
│ - Schedule retry        │  │                  │                    │ │
└─────────────────────────┘  ▼                  ▼                    │ │
                             │                  │                    │ │
              ┌──────────────┴───────┐  ┌───────┴──────────────────┐ │ │
              │ ROLLBACK             │  │ REQUEST DUAL-APPROVAL    │ │ │
              │ - Revert deployment  │  │ - Incident Commander     │ │ │
              │ - Document scope     │  │ - Security Lead          │ │ │
              │ - Abort rehearsal    │  └───────────┬──────────────┘ │ │
              └──────────────────────┘              │                │ │
                                                    ▼                │ │
                                   ┌────────────────────────────────┐│ │
                                   │    Dual-Approval Satisfied?    ││ │
                                   ├────────────┬───────────────────┤│ │
                                   │     NO     │        YES        ││ │
                                   │            │                   ││ │
                                   ▼            ▼                   ││ │
                           Wait for       ┌─────────────────────────┴┼─┘
                           approvals      │ RESUME ROLLOUT           │
                                          │ - Verify audit chain     │
                                          │ - Capture portal state   │
                                          │ - Complete rehearsal     │
                                          └──────────────────────────┘
```

---

## Approval Checklist

Required for each recovery approval:

| Item | Approver 1 | Approver 2 |
|------|------------|------------|
| Approver Role | `____________` | `____________` |
| Approver ID | `____________` | `____________` |
| Approval Status | ☐ Pending ☐ Approved ☐ Rejected | ☐ Pending ☐ Approved ☐ Rejected |
| Rationale | `________________________` | `________________________` |
| Timestamp | `____-__-__ __:__:__` | `____-__-__ __:__:__` |
| Approval ID | `sha256:approval_[...]` | `sha256:approval_[...]` |

---

## Expected Portal States

| Rehearsal Status | Portal Indicator | Rollout State |
|------------------|------------------|---------------|
| `pending` | Rehearsal scheduled | N/A |
| `triggered` | Trigger received | Transitioning |
| `paused` | 🔴 PAUSED | `paused` |
| `recovering` | 🟡 Recovery In Progress | `paused` |
| `resumed` | 🟢 Rollout Active | `active` |
| `completed` | ✅ Rehearsal Complete | `active` |
| `aborted` | ⛔ Rehearsal Aborted | Varies |

---

## Post-Rehearsal Checklist

- [ ] All evidence captured with `sha256:` references
- [ ] No PII in any evidence artifacts
- [ ] Audit chain integrity verified (`auditChainValid: true`)
- [ ] Postmortem documented
- [ ] Lessons learned recorded
- [ ] If failed: remediation tickets created
- [ ] If passed: sign-off from incident commander

---

## Troubleshooting

### Pause Latency Exceeded 5 Seconds

1. Check system load during trigger injection
2. Verify network connectivity to pause service
3. Review pause handler logs
4. Document incident and escalate

### Dual-Approval Not Obtainable

1. Verify approver availability
2. Check for role conflicts (same person cannot approve twice)
3. Consider rehearsal abort if window expires
4. Document blocking factor

### Audit Chain Validation Failed

1. Review event sequence
2. Check `previousEventId` linkage
3. Verify no events were skipped
4. CRITICAL: Do not resume until resolved

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2025-01-09 | TerraFusion OS | Initial runbook aligned with contract tests |

---

## References

- Contract Tests: [rehearsal.stop-condition.contract.test.ts](../../tools/registry/autonomy-viewer/test/rehearsal.stop-condition.contract.test.ts)
- Governance: [AGENTS.md](../../AGENTS.md)
- Phase XXIII: Go-Live Playbook contracts

---

*Government. Transcended.*
