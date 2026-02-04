# War Room Cadence — Daily Operations During Pilot

> **Phase:** XXIV-A — Live Go-Live Execution  
> **Frequency:** Daily (15–30 minutes)  
> **Contract Tests:** `pilot.readiness.contract.test.ts`

---

## 1. Meeting Structure

### 1.1 Schedule

| Field | Value |
|-------|-------|
| Cadence | Daily |
| Duration | 15–30 minutes |
| Time | ____:____ (local timezone) |
| Location | ________________________ |
| Bridge | ________________________ |

### 1.2 Required Attendees

| Role | Required | Notes |
|------|----------|-------|
| On-Call Operator | ✅ | Primary facilitator |
| Incident Commander | ✅ | Decision authority |
| Backup Operator | ☐ | On standby |
| Security Lead | ☐ | Join if audit/security items |
| Platform Engineering | ☐ | Join if technical escalation |

---

## 2. Daily Agenda

> **Time-boxed steps.** Do not exceed allocated time per section.

### 2.1 Opening (2 min)

- [ ] Confirm attendees and roles
- [ ] State current pilot day (Day N of M)
- [ ] Note any critical context from previous shift

### 2.2 Readiness Dashboard Review (5 min)

| Dashboard | Location | Check |
|-----------|----------|-------|
| Portal Readiness Score | `/portal/readiness` | ☐ Score ≥ 95% |
| Block Reasons | `/portal/readiness/blocked` | ☐ List any blockers |
| Service Health | `/portal/services` | ☐ All services green |

**Actions:**
- [ ] If readiness < 95%: identify root cause, assign owner
- [ ] If blockers exist: prioritize resolution, set ETA

### 2.3 Exception Ledger Review (5 min)

| Status | Query | Action Required |
|--------|-------|-----------------|
| New | Exceptions created since last review | Assess and assign owner |
| Expiring (< 48h) | Exceptions expiring within 48 hours | Renew or remediate |
| Expired | Exceptions past expiry | **BLOCKER** — resolve immediately |

**Burn-Down Template:**

| Exception ID | Type | Age (days) | Expiry | Owner | Status | Action |
|--------------|------|------------|--------|-------|--------|--------|
| `sha256:exc_...` | _____ | ___ | YYYY-MM-DD | `sha256:op_...` | ☐ Open ☐ Renewing ☐ Closed | __________ |

**Exit gate:** Zero expired exceptions allowed during pilot.

### 2.4 Stop-Condition Watch (5 min)

> Constants: `MAX_PAUSE_LATENCY_MS=5000`, `REQUIRED_APPROVALS=2`

| Metric | Threshold | Current | Status |
|--------|-----------|---------|--------|
| MTTR (Mean Time to Recovery) | ≤ ____ min | ____ min | ☐ OK ☐ Warning ☐ Critical |
| Rollback Success Rate | ≥ 95% | ____% | ☐ OK ☐ Warning ☐ Critical |
| DR Drill Freshness | ≤ 90 days | ____ days | ☐ OK ☐ Warning ☐ Critical |
| Last DR Drill Pass | ☐ Pass ☐ Fail | — | ☐ OK ☐ Critical |
| Audit Integrity | ☐ Valid ☐ Alert | — | ☐ OK ☐ Critical |

**Stop Condition Codes (from `STOP_CONDITION_REHEARSAL_RUNBOOK.md`):**

| Code | Trigger Condition | Auto-Pause? |
|------|-------------------|-------------|
| `MTTR_REGRESSION` | MTTR exceeds threshold | ✅ |
| `ROLLBACK_FAILURE` | Rollback operation failed | ✅ |
| `DR_DRILL_FAILURE` | DR drill did not complete | ✅ |
| `AUDIT_INTEGRITY_ALERT` | Audit chain integrity violation | ✅ |

**Actions:**
- [ ] If any metric at Warning: document trend, assign monitoring owner
- [ ] If any metric at Critical: evaluate stop condition trigger
- [ ] If pause triggered: initiate dual-approval recovery per runbook

### 2.5 Evidence Bundle Update (3 min)

| Artifact | Last Updated | Current Hash | Status |
|----------|--------------|--------------|--------|
| Audit Packet | YYYY-MM-DD | `sha256:pkt_...` | ☐ Current ☐ Stale |
| Control→Evidence Narrative | YYYY-MM-DD | `sha256:nar_...` | ☐ Current ☐ Stale |
| Training Completion Proof | YYYY-MM-DD | `sha256:trn_...` | ☐ Current ☐ Stale |
| Drill Cadence Proof | YYYY-MM-DD | `sha256:drl_...` | ☐ Current ☐ Stale |

**Actions:**
- [ ] If any artifact stale (> 24h without update during active pilot): regenerate
- [ ] Verify all refs are `sha256:` (PII-clean)

### 2.6 Decision Log (5 min)

Record all decisions made during the war room session.

| Time | Decision | Rationale | Approver(s) | Evidence Ref |
|------|----------|-----------|-------------|--------------|
| __:__ | ________________ | ________________ | `sha256:appr_...` | `sha256:...` |

**Decision Types:**

| Type | Required Approvers | Notes |
|------|-------------------|-------|
| Pause triggered | N/A (auto) | Log trigger event ID |
| Resume after pause | 2 | Dual-approval required |
| Exception approved | 1 | Document justification |
| Exception renewed | 1 | Must not be expired |
| Remediation assigned | 1 | Set owner + ETA |
| Escalation initiated | 1 | Document tier + reason |

### 2.7 Closing (2 min)

- [ ] Confirm next war room time and attendees
- [ ] State any overnight/off-hours monitoring requirements
- [ ] Capture session summary hash: `sha256:session_YYYYMMDD_...`

---

## 3. Dashboard Reference

### 3.1 Primary Dashboards

| Dashboard | URL Pattern | Refresh |
|-----------|-------------|---------|
| Readiness Overview | `/portal/readiness` | Real-time |
| Exception Ledger | `/portal/exceptions` | Real-time |
| Service Health | `/portal/services` | 1 min |
| MTTR Metrics | `/portal/metrics/mttr` | 5 min |
| Rollback History | `/portal/metrics/rollback` | 5 min |
| DR Drill Status | `/portal/dr/drills` | Daily |
| Audit Integrity | `/portal/audit/integrity` | Real-time |

### 3.2 Alert Channels

| Channel | Purpose | Subscribers |
|---------|---------|-------------|
| `#pilot-war-room` | Daily sync | All operators + approvers |
| `#pilot-alerts` | Auto-alerts | On-call + IC |
| `#pilot-escalation` | L2+ escalations | IC + Platform Eng + Exec |

---

## 4. Stop-Condition Response Procedure

> Reference: `STOP_CONDITION_REHEARSAL_RUNBOOK.md`

### 4.1 When Pause is Triggered

1. **Acknowledge** (< 5 min)
   - [ ] On-call operator acknowledges pause event
   - [ ] Capture pause event ID: `sha256:pause_...`
   - [ ] Document trigger event ID: `sha256:trigger_...`

2. **Assess** (< 15 min)
   - [ ] Identify root cause
   - [ ] Determine if resume is safe
   - [ ] Document assessment rationale

3. **Recover** (dual-approval)
   - [ ] Request Approval 1: `sha256:appr_...` from `____________`
   - [ ] Request Approval 2: `sha256:appr_...` from `____________`
   - [ ] Both approvals must be from distinct approvers

4. **Resume**
   - [ ] Execute resume with operator ID
   - [ ] Verify audit chain integrity: `auditChainValid: true`
   - [ ] Capture resume event ID: `sha256:resume_...`

5. **Document**
   - [ ] Record full sequence in decision log
   - [ ] Update evidence bundle with pause/resume proof
   - [ ] Schedule postmortem if applicable

---

## 5. Exception Management

### 5.1 New Exception Workflow

```
New Exception Request
         │
         ▼
┌─────────────────────────────────────┐
│ Is exception within allowed scope?  │
├──────────────────┬──────────────────┤
│       NO         │        YES       │
│                  │                  │
▼                  ▼
REJECT             ASSESS IMPACT
                        │
                        ▼
              ┌─────────────────────────────────────┐
              │ Impact severity                     │
              ├──────────────────┬──────────────────┤
              │ Low/Medium       │      High        │
              │                  │                  │
              ▼                  ▼
         APPROVE (1)        ESCALATE (2 approvers)
              │                  │
              └────────┬─────────┘
                       ▼
              SET EXPIRY DATE
              (max 90 days)
                       │
                       ▼
              ASSIGN REMEDIATION OWNER
```

### 5.2 Renewal Rules

- Renewal must occur **before** expiry
- Cannot renew expired exceptions (must create new + explain gap)
- Maximum 2 renewals per exception (then remediate or escalate)
- Each renewal requires re-justification

---

## 6. Evidence Capture Checklist

All evidence must be PII-clean with `sha256:` refs only.

### 6.1 Daily Capture

| Artifact | Capture Method | Storage Ref |
|----------|---------------|-------------|
| Session summary | Auto-generated | `sha256:session_...` |
| Decision log | Manual entry | `sha256:log_...` |
| Exception changes | Auto-tracked | `sha256:exc_...` |
| Metric snapshots | Auto-captured | `sha256:metrics_...` |

### 6.2 Event-Driven Capture

| Event | Artifacts to Capture |
|-------|---------------------|
| Pause triggered | Trigger ID, Pause ID, Portal snapshot |
| Resume executed | Approval IDs, Resume ID, Chain validation |
| Exception approved | Exception ID, Approver ID, Rationale |
| Escalation initiated | Escalation ref, Tier, Reason |

---

## 7. Session Log Template

```markdown
## War Room Session — YYYY-MM-DD

**Pilot Day:** N of M
**Attendees:** [opaque IDs + roles]
**Session ID:** sha256:session_YYYYMMDD_...

### Readiness
- Score: ___% 
- Blockers: [none | list]

### Exceptions
- New: ___
- Expiring: ___
- Expired: ___

### Stop-Condition Watch
- MTTR: ___ min (threshold: ___)
- Rollback: ___% (threshold: 95%)
- DR Freshness: ___ days (threshold: 90)
- Audit Integrity: [Valid | Alert]

### Decisions
| Decision | Approver | Ref |
|----------|----------|-----|
| ... | ... | ... |

### Evidence Updated
- [ ] Audit packet
- [ ] Narrative hash
- [ ] Training proof
- [ ] Drill proof

### Next Session
- Time: ____:____
- On-call: sha256:op_...
```

---

## 8. Document Metadata

| Field | Value |
|-------|-------|
| Document ID | `sha256:doc_war_room_________________` |
| Version | 1.0.0 |
| Created | YYYY-MM-DD |
| Last Updated | YYYY-MM-DD |
| Author | ________________________ |

---

## References

- Pilot Selection: [PILOT_WAVE_0_SELECTION.md](PILOT_WAVE_0_SELECTION.md)
- Exit Criteria: [PILOT_EXIT_CRITERIA.md](PILOT_EXIT_CRITERIA.md)
- Stop-Condition Runbook: [STOP_CONDITION_REHEARSAL_RUNBOOK.md](STOP_CONDITION_REHEARSAL_RUNBOOK.md)
- Contract Tests: [pilot.readiness.contract.test.ts](../../tools/registry/autonomy-viewer/test/pilot.readiness.contract.test.ts)

---

*Government. Transcended.*
