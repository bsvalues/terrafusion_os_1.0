# Rollback Drill Plan

**Version:** 1.0.0
**Last Updated:** 2026-02-02
**Policy Reference:** POLICY-OPS-ROLLBACK, POLICY-OPS-DRILL

---

## Purpose

This document defines the rollback drill procedure for the TerraFusion ops-plane. The drill validates:

1. Rollback mechanics work correctly under controlled conditions
2. Audit records are preserved during rollback
3. Correlation events maintain traceability
4. Safe stage is reached within SLA
5. Team familiarity with rollback procedures

---

## Drill Schedule

| Environment | Frequency | Window | Duration |
|-------------|-----------|--------|----------|
| Staging | Weekly | Any business day | 30 minutes |
| Production | Monthly | Low-traffic period | 45 minutes |

**Recommended Production Window:** Tuesday 02:00-04:00 UTC (off-peak)

---

## Pre-Drill Checklist

### 24 Hours Before

- [ ] Schedule drill in ops calendar
- [ ] Notify stakeholders (ops, platform, security)
- [ ] Verify staging passed most recent drill
- [ ] Confirm on-call coverage during drill window
- [ ] Prepare drill correlation ID: `drill-YYYY-MM-DD-XXXX`

### 1 Hour Before

- [ ] Verify current production stage
- [ ] Confirm all SLOs currently met
- [ ] Take baseline snapshot of metrics
- [ ] Prepare rollback commands
- [ ] Open monitoring dashboards

### Immediately Before

- [ ] Announce drill start in ops channel
- [ ] Start screen recording (for evidence)
- [ ] Note current timestamp: `__________`

---

## Drill Scenario: Simulated SLO Breach

### Scenario Description

**Trigger:** Simulated sustained notification failure (not real)
**Expected Action:** Rollback from current stage to safe stage
**Success Criteria:** Safe stage reached, audit preserved, correlation chain complete

### Step 1: Capture Pre-Drill State

```bash
# Record current state
pnpm run capture:state --env production --output pre-drill-state.json
```

**Expected Output (record actual):**
```json
{
  "currentStage": "ticket_on_high",
  "sloStatus": {
    "notification_success": 0.995,
    "audit_drain_p95": 2000,
    "dedupe_effectiveness": 0.85
  },
  "auditRecordCount": 12345,
  "timestamp": "2026-02-02T02:00:00Z"
}
```

**Actual Pre-Drill State:**
```
Stage: __________
Notification Success: __________%
Audit Record Count: __________
Timestamp: __________
```

### Step 2: Simulate Breach Detection

```bash
# Trigger drill rollback (simulated breach, not real)
pnpm run drill:rollback --env production \
  --simulated-breach slo_notification_failure \
  --correlation-id drill-2026-02-02-001 \
  --dry-run false
```

**Start Timer:** `__:__:__`

### Step 3: Monitor Rollback Execution

Watch for:
- [ ] `rollback_triggered` event emitted
- [ ] `rollback_executing` event emitted
- [ ] `rollback_completed` event emitted

```bash
# Watch rollback events
pnpm run watch:events --correlation-id drill-2026-02-02-001 --timeout 60s
```

### Step 4: Verify Safe Stage Reached

```bash
# Verify current stage
pnpm run verify:stage --env production --expected log_only
```

**End Timer:** `__:__:__`
**Rollback Duration:** `__:__` (target: < 5 minutes)

### Step 5: Verify Audit Preservation

```bash
# Count audit records (must not decrease)
pnpm run capture:state --env production --output post-drill-state.json
```

**Verification:**
- [ ] Pre-drill audit count: __________
- [ ] Post-drill audit count: __________
- [ ] Difference: __________ (must be ≥ 0)

### Step 6: Verify Correlation Chain

```bash
# Export correlation events
pnpm run audit:export --correlation-id drill-2026-02-02-001 \
  --output drill-correlation-chain.json
```

**Required Events:**
- [ ] `rollback_triggered` with correlation ID
- [ ] `rollback_executing` with correlation ID
- [ ] `rollback_completed` with correlation ID
- [ ] All events have timestamps
- [ ] All events have environment = production
- [ ] Breach type recorded

### Step 7: Restore Original Stage

```bash
# Promote back to original stage (requires signoff)
pnpm run deploy:promote --env production \
  --target-stage ticket_on_high \
  --signoff-id signoff-drill-restore-XXXX \
  --correlation-id drill-2026-02-02-002
```

### Step 8: Verify Restoration

```bash
# Confirm restoration
pnpm run verify:stage --env production --expected ticket_on_high
```

**Restoration Verified:** [ ] Yes [ ] No

---

## Success Criteria Checklist

| Criterion | Target | Actual | Pass? |
|-----------|--------|--------|-------|
| Rollback duration | < 5 min | _____ | ☐ |
| Safe stage reached | log_only | _____ | ☐ |
| Audit records preserved | ≥ pre-drill | _____ | ☐ |
| Correlation chain complete | 3 events | _____ | ☐ |
| No real alerts triggered | 0 | _____ | ☐ |
| Restoration successful | Yes | _____ | ☐ |

**Overall Drill Result:** [ ] ✅ PASS [ ] ❌ FAIL

---

## Post-Drill Actions

### Immediately After

- [ ] Announce drill completion in ops channel
- [ ] Stop screen recording
- [ ] Upload evidence to drill archive

### Within 24 Hours

- [ ] Complete drill report (below)
- [ ] File any issues discovered
- [ ] Update runbook if procedures need changes

### Within 7 Days

- [ ] Review drill in ops retrospective
- [ ] Schedule next drill
- [ ] Update drill plan if needed

---

## Drill Report Template

```markdown
# Rollback Drill Report

**Date:** YYYY-MM-DD
**Environment:** production
**Drill ID:** drill-YYYY-MM-DD-XXX
**Operator:** [Name]

## Summary
- **Result:** PASS / FAIL
- **Rollback Duration:** X min Y sec
- **Audit Preservation:** Confirmed / Issue

## Timeline
| Time | Event |
|------|-------|
| HH:MM | Drill started |
| HH:MM | Rollback triggered |
| HH:MM | Safe stage reached |
| HH:MM | Restoration complete |
| HH:MM | Drill ended |

## Observations
[Any notable observations during the drill]

## Issues Discovered
[Any issues that need follow-up]

## Recommendations
[Suggested improvements to procedures]

## Evidence
- Pre-drill state: [link]
- Post-drill state: [link]
- Correlation chain: [link]
- Screen recording: [link]
```

---

## Failure Scenarios

### Rollback Takes Too Long (> 10 min)

1. Escalate to platform lead
2. Continue monitoring for completion
3. Document in drill report
4. Create P2 issue for investigation

### Audit Records Decreased

1. **CRITICAL:** This is a policy violation
2. Immediately escalate to security
3. Halt all further rollout activities
4. Create P0 incident

### Correlation Chain Incomplete

1. Document missing events
2. Create P3 issue for investigation
3. Review event emission code

### Restoration Fails

1. Do not force promotion
2. Contact platform lead
3. May require manual intervention
4. Document incident

---

## Appendix: Drill Correlation ID Format

```
Format: drill-YYYY-MM-DD-XXX
Example: drill-2026-02-02-001
```

The drill prefix ensures these events are easily identifiable in audit logs.

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-02-02 | TerraFusion Ops | Initial release |
