# Production Cutover Runbook

**Version:** 1.0.0
**Last Updated:** 2026-02-02
**Policy Reference:** POLICY-OPS-ROLLOUT, POLICY-OPS-SLO

---

## Overview

This runbook defines the step-by-step process for promoting the TerraFusion ops-plane from staging to production. It covers:

- Pre-cutover verification
- Canary deployment
- Partial rollout
- Full production activation
- Post-deploy verification
- Rollback procedures

---

## Prerequisites

Before starting cutover:

| Requirement | Verification Command | Expected Result |
|------------|---------------------|-----------------|
| Staging SLOs met for 7+ days | Check SLO dashboard | All targets green |
| Observation window complete | `checkObservationWindow()` | ≥7 days, ≥100 samples |
| N-hour green requirement met | Check green-time dashboard | ≥72 hours sustained |
| Operator signoff artifact | Verify signoff exists | Approved, not expired |
| Secrets rotated (if needed) | Check rotation audit | Within policy window |
| Rollback tested in staging | Rollback drill log | Successful |

---

## Stop Conditions (HALT IMMEDIATELY IF)

🛑 **STOP the cutover and initiate rollback if ANY of the following occur:**

1. **Notification success rate < 99%** for > 5 minutes sustained
2. **Audit drain p95 > 5000ms** for > 3 minutes sustained
3. **Integrity alert triggered** at any time
4. **Circuit breaker open** for > 15 minutes
5. **Dedupe effectiveness drops > 5%** from baseline
6. **Publish failure rate > 1%** for > 5 minutes sustained
7. **Signoff artifact expired** during cutover

---

## Phase 1: Pre-Cutover Verification

### 1.1 Validate Staging Health

```bash
# Check all SLO targets
pnpm run check:slo-attainment --env staging

# Verify observation window
pnpm run check:observation-window --env staging --min-days 7

# Verify green hours
pnpm run check:green-hours --env staging --min-hours 72
```

**Expected Output:**
```
✓ notification_success: 99.5% (target: 99%)
✓ audit_drain_p95: 2000ms (target: 5000ms)
✓ dedupe_effectiveness: 85% (target: 80%)
✓ suppression_success: 99.8% (target: 99.5%)
✓ observation_window: 10 days (min: 7 days)
✓ green_hours: 96 hours (min: 72 hours)
```

### 1.2 Verify Signoff Artifact

```bash
# Check signoff validity
pnpm run verify:signoff --env production --target-stage canary
```

**Expected Output:**
```
✓ Signoff ID: signoff-2026-02-02-XXXX
✓ Decision: approved
✓ Operator: sha256:XXXX
✓ Expires: 2026-02-03T10:00:00Z
✓ Target Stage: canary
✓ Environment: production
```

### 1.3 Confirm Rollback Readiness

```bash
# Verify rollback procedure is ready
pnpm run verify:rollback-ready --env production
```

**Expected Output:**
```
✓ Rollback target stage: log_only
✓ Rollback signoff: not required (emergency)
✓ Audit preservation: enabled
✓ Correlation ID generator: ready
```

---

## Phase 2: Canary Deployment (10% Traffic)

### 2.1 Initiate Canary

```bash
# Start canary deployment
pnpm run deploy:canary --env production --percentage 10 \
  --signoff-id signoff-2026-02-02-XXXX \
  --correlation-id $(uuidgen)
```

**Expected Events:**
- `promotion_started` event emitted
- Canary pods receiving 10% traffic
- Dashboard shows canary metrics separately

### 2.2 Monitor Canary (30 minutes minimum)

```bash
# Watch canary metrics
pnpm run monitor:canary --env production --duration 30m
```

**Watch For:**
- [ ] Notification success rate stable at ≥99%
- [ ] Audit drain p95 stable at ≤5000ms
- [ ] No integrity alerts
- [ ] Error rate matches or improves baseline
- [ ] Latency within expected bounds

### 2.3 Canary Gate Decision

| Metric | Target | Observed | Pass? |
|--------|--------|----------|-------|
| notification_success | ≥99% | ___% | ☐ |
| audit_drain_p95 | ≤5000ms | ___ms | ☐ |
| dedupe_effectiveness | ≥80% | ___% | ☐ |
| error_rate | ≤baseline+0.5% | ___% | ☐ |

**Decision:**
- [ ] ✅ PROCEED to partial rollout
- [ ] ⏸️ EXTEND canary observation
- [ ] 🛑 ROLLBACK to log_only

---

## Phase 3: Partial Rollout (50% Traffic)

### 3.1 Promote to Partial

```bash
# Promote to 50% traffic
pnpm run deploy:promote --env production --percentage 50 \
  --signoff-id signoff-2026-02-02-XXXX \
  --correlation-id $(uuidgen)
```

### 3.2 Monitor Partial (60 minutes minimum)

```bash
# Extended monitoring
pnpm run monitor:partial --env production --duration 60m
```

**Watch For:**
- [ ] All canary success criteria still met
- [ ] No degradation from increased load
- [ ] Paging policy behaving correctly
- [ ] Suppression working as expected

### 3.3 Partial Gate Decision

**Decision:**
- [ ] ✅ PROCEED to full rollout
- [ ] ⏸️ EXTEND partial observation
- [ ] 🛑 ROLLBACK to canary or log_only

---

## Phase 4: Full Production Activation (100% Traffic)

### 4.1 Promote to Full

```bash
# Full production activation
pnpm run deploy:promote --env production --percentage 100 \
  --signoff-id signoff-2026-02-02-XXXX \
  --correlation-id $(uuidgen)
```

### 4.2 Post-Deploy Verification

```bash
# Run verification suite
pnpm run verify:post-deploy --env production
```

**Verification Checklist:**
- [ ] SLO dashboard showing production targets met
- [ ] Audit integrity job reporting clean
- [ ] Paging policy quiet-hours configured
- [ ] Severity routing rules applied
- [ ] Notification channels responding
- [ ] Correlation events flowing

### 4.3 Confirm Stable State

```bash
# Confirm stable for 2 hours
pnpm run monitor:stable --env production --duration 2h
```

---

## Phase 5: Post-Cutover Actions

### 5.1 Update Documentation

- [ ] Update runbook with actual timestamps and observations
- [ ] Archive signoff artifact
- [ ] Create post-mortem notes (even if successful)

### 5.2 Schedule Rollback Drill

- [ ] Schedule next rollback drill (within 30 days)
- [ ] Document drill plan with expected outcomes

### 5.3 Notify Stakeholders

```bash
# Send completion notification
pnpm run notify:cutover-complete --env production \
  --correlation-id $CORRELATION_ID
```

---

## Rollback Procedures

### Immediate Rollback (Emergency)

If any STOP condition is triggered:

```bash
# Emergency rollback to safe stage
pnpm run rollback:emergency --env production \
  --target-stage log_only \
  --reason "stop_condition_triggered" \
  --correlation-id $(uuidgen)
```

**This does NOT require signoff.** It preserves all audit records and emits correlation events.

### Planned Rollback

For controlled rollback:

```bash
# Planned rollback with signoff
pnpm run rollback:planned --env production \
  --target-stage ticket_on_high \
  --signoff-id signoff-rollback-XXXX \
  --correlation-id $(uuidgen)
```

### Post-Rollback Actions

1. **Verify safe state reached**
   ```bash
   pnpm run verify:stage --env production --expected log_only
   ```

2. **Check audit preservation**
   ```bash
   pnpm run verify:audit-preserved --env production
   ```

3. **Capture correlation chain**
   ```bash
   pnpm run audit:export --correlation-id $ROLLBACK_CORRELATION_ID
   ```

4. **Create incident report**
   - Document trigger condition
   - Capture timeline
   - Identify root cause
   - Define remediation

---

## Appendix A: Contact Information

| Role | Contact | Escalation |
|------|---------|------------|
| On-call Operator | ops-oncall@terrafusion.gov | PagerDuty |
| Platform Lead | platform-lead@terrafusion.gov | Direct |
| Security | security@terrafusion.gov | Direct |

---

## Appendix B: Dashboard Links

| Dashboard | Purpose |
|-----------|---------|
| SLO Overview | Real-time SLO attainment |
| Canary Metrics | Canary vs baseline comparison |
| Audit Trail | Event correlation and audit log |
| Paging Status | Current paging policy state |

---

## Appendix C: Correlation ID Format

All operations must use valid correlation IDs:

```
Format: XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX (UUID v4)
Example: 550e8400-e29b-41d4-a716-446655440000
```

Generate with: `uuidgen` or `uuidv4()`

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-02-02 | TerraFusion Ops | Initial release |
