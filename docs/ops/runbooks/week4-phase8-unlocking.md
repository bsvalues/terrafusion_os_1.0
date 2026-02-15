# Week 4 Phase 8 Unlocking — Operational Runbook

> **Classification:** Government Operations — Phase Gate Protocol  
> **Audience:** Release managers, governance authority  
> **Trigger:** Validation Criteria #3 and #4 complete  
> **Expected Timeline:** Week 4 (earliest 2026-02-21)

---

## Overview

This runbook describes the mechanical procedure for unlocking Phase 8 (Multi-County Hardening) after all 5 validation criteria are satisfied.

**Constitutional Requirement:** Phase 8 remains **BLOCKED** until 5/5 criteria mechanically verified by gates.

---

## Preconditions

**Before executing this runbook, verify:**

```bash
# Check current validation status
node tools/gates/validation-week12-gate.mjs
```

**Required output:**
```
✅ Passed: 5
   - Trace Coverage Gate
   - Runbook Freshness Gate  
   - Ops Validation Artifacts Gate
   - SLO Burn Completeness Gate          # NEW (Criterion #3)
   - Alert Audit Completeness Gate       # NEW (Criterion #4)

✅ VALIDATION WEEK 1-4 GATE RUNNER: PASSED
   All 5 validation criteria satisfied.
```

**If not 5/5, DO NOT PROCEED.** Return to telemetry discipline:
- Criterion #3: [Daily SLO Capture Runbook](daily-slo-capture.md)
- Criterion #4: [Alert Audit Capture Runbook](alert-audit-capture.md)

---

## Procedure

### Step 1: Verify Criterion #3 (SLO Burn) Complete

```bash
# Run SLO burn verification
node scripts/verify-slo-burn-completeness.mjs
```

**Required output:**
```
✅ VALIDATION CRITERION #3: PASS

All evidence complete, 7-day burn <25%
```

**If FAIL:** Return to [Daily SLO Capture Runbook](daily-slo-capture.md)

---

### Step 2: Verify Criterion #4 (Alert FP) Complete

```bash
# Run alert audit verification
node scripts/verify-alert-audit-completeness.mjs
```

**Required output:**
```
✅ VALIDATION CRITERION #4: PASS

All 100 alerts audited, FP rate <25%
```

**If FAIL:** Return to [Alert Audit Capture Runbook](alert-audit-capture.md)

---

### Step 3: Update Validation Period Tracker

**Edit:** `docs/ops/validation-period-tracker.md`

**Update Criterion #3 (if just completed):**

```diff
-| 3 | **SLO burn validated (7+ days)** | 🟡 **In Progress** | Day 1/7 tracking started 2026-02-15 | Week 3 |
+| 3 | **SLO burn validated (7+ days)** | ✅ **COMPLETE** | 7-day burn <25% verified 2026-02-21 | Week 3 |
```

**Update Criterion #4 (if just completed):**

```diff
-| 4 | **Alert noise tuned** | ⏳ Pending | Awaiting 100 paging alerts | Week 3-4 |
+| 4 | **Alert noise tuned** | ✅ **COMPLETE** | 100 alerts audited, FP <25% | Week 4 |
```

**Update Phase 8 Kickoff Gate table:**

```diff
 | Criterion | Status | Notes |
 |-----------|--------|-------|
 | Cutover artifact exists | ✅ **ACHIEVED** | ... |
-| ≥7 days burn data, <25% burn | 🟡 **In Progress** | ... |
+| ≥7 days burn data, <25% burn | ✅ **ACHIEVED** | 7-day average: X.X% (2026-02-21) |
-| Alert noise stable | ⏳ Pending | ... |
+| Alert noise stable | ✅ **ACHIEVED** | FP rate: X.X% (100 alerts audited) |
 | Rollback tested | ✅ **ACHIEVED** | ... |
 | Trace exemptions ≤3 | ✅ **ACHIEVED** | ... |
```

---

### Step 4: Run Full Gate Verification Chain

```bash
# Run all critical gates
node tools/gates/validation-week12-gate.mjs
node tools/gates/ops-validation-artifacts-gate.mjs
node tools/gates/trace-coverage-gate.mjs
node tools/gates/runbook-freshness-gate.mjs
```

**All gates must show PASSED.**

---

### Step 5: Mint Receipts (State Transition 4/5 → 5/5)

```bash
# Generate evidence pack
node scripts/phase4-evidence-pack.mjs

# Generate release evidence
node tools/gates/release-evidence-gate.mjs
```

**Verify receipts:**
```bash
# Check evidence pack status
jq '.status' evidence-pack-latest.json  # Should be "PASS"

# Check release evidence gates
jq '.gates_passed' release-evidence-latest.json  # Should be 12
```

---

### Step 6: Atomic Commit Protocol (Phase 8 Authorization)

**Commit 1: Validation Complete**

```bash
git add docs/ops/validation-period-tracker.md

git commit -m "ops(telemetry): complete Criteria #3 and #4 (5/5 COMPLETE)" \
  -m "Criterion #3: 7-day SLO burn <25% (average: X.X%)" \
  -m "Criterion #4: 100 paging alerts audited, FP <25% (rate: X.X%)" \
  -m "" \
  -m "Evidence:" \
  -m "- docs/ops/slo-tuning-log.md (Days 1-7 complete)" \
  -m "- docs/ops/alerts-noise-audit.md (Alerts #001-100 complete)" \
  -m "- docs/deploy/rehearsals/evidence/week1/ (14 artifacts)" \
  -m "- docs/deploy/rehearsals/evidence/alerts/ (300 artifacts)" \
  -m "" \
  -m "Validation Status: 5/5 COMPLETE" \
  -m "Phase 8: BLOCKED → AUTHORIZED"
```

**Commit 2: Receipts (State Transition)**

```bash
git add evidence-pack-latest.json release-evidence-latest.json

git commit -m "test(release): mint week1-4 receipts (5/5 validation COMPLETE)" \
  -m "Receipts:" \
  -m "- evidence-pack-latest.json (59/59 tests, 50+ artifacts)" \
  -m "- release-evidence-latest.json (12/12 gates)" \
  -m "" \
  -m "Gates:" \
  -m "- validation-week12-gate: 5/5 PASSED" \
  -m "- slo-burn-completeness: PASSED" \
  -m "- alert-audit-completeness: PASSED" \
  -m "" \
  -m "Phase 8: AUTHORIZED"
```

---

### Step 7: Phase 8 Kickoff Declaration

**Create Phase 8 authorization flag:**

```bash
# Create Phase 8 kickoff marker
cat > .terrafusion/phase8-authorized.json <<EOF
{
  "phase": 8,
  "authorized_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "validation_period": {
    "start": "2026-02-14",
    "end": "$(date -u +%Y-%m-%d)",
    "duration_days": $(( ($(date -u +%s) - $(date -u -d 2026-02-14 +%s)) / 86400 ))
  },
  "criteria": {
    "1_cutover": "COMPLETE",
    "2_rollback": "COMPLETE",
    "3_slo_burn": "COMPLETE",
    "4_alert_fp": "COMPLETE",
    "5_trace_exemptions": "COMPLETE"
  },
  "evidence": {
    "evidence_pack": "evidence-pack-latest.json",
    "release_evidence": "release-evidence-latest.json",
    "validation_tracker": "docs/ops/validation-period-tracker.md"
  },
  "phase_8_objectives": [
    "Multi-county deployment hardening",
    "County data isolation verification",
    "Cross-county rollout procedures",
    "Production scale testing (39 counties)"
  ]
}
EOF

git add .terrafusion/phase8-authorized.json

git commit -m "governance(phase8): authorize Phase 8 kickoff (5/5 validation complete)" \
  -m "🎉 PHASE 8 KICKOFF: AUTHORIZED" \
  -m "" \
  -m "30-day validation period: COMPLETE" \
  -m "Validation criteria: 5/5 satisfied" \
  -m "Gates: ALL PASSING" \
  -m "" \
  -m "Phase 8 Objectives:" \
  -m "- Multi-county deployment hardening" \
  -m "- County data isolation verification" \
  -m "- Cross-county rollout procedures" \
  -m "- Production scale testing (39 counties)" \
  -m "" \
  -m "Government. Transcended. Phase 8 begins."
```

---

### Step 8: Push and Notify

```bash
# Push all commits
git push origin feature/phase4-sprint1-storage

# Notify team (Slack, email, etc.)
# Subject: 🎉 Phase 8 Authorized - 30-Day Validation Complete
```

---

## Verification

**Confirm Phase 8 authorization flag exists:**

```bash
# Check Phase 8 marker
test -f .terrafusion/phase8-authorized.json && echo "✅ Phase 8 AUTHORIZED" || echo "❌ Not authorized"

# Verify criteria
jq '.criteria' .terrafusion/phase8-authorized.json
```

**Expected output:**
```json
{
  "1_cutover": "COMPLETE",
  "2_rollback": "COMPLETE",
  "3_slo_burn": "COMPLETE",
  "4_alert_fp": "COMPLETE",
  "5_trace_exemptions": "COMPLETE"
}
```

---

## Rollback Procedure

**If Phase 8 authorization incorrect (e.g., gates were bypassed):**

```bash
# Remove authorization marker
git rm .terrafusion/phase8-authorized.json

# Revert tracker changes
git checkout HEAD~3 -- docs/ops/validation-period-tracker.md

# Commit rollback
git commit -m "governance(phase8): revoke authorization (validation incomplete)"

# Push
git push origin feature/phase4-sprint1-storage --force-with-lease
```

**CRITICAL:** Only roll back if constitutional violation detected (e.g., criteria not actually satisfied).

---

## Post-Authorization Actions

**Immediate next steps:**

1. **Phase 8 Planning:**
   - Schedule multi-county deployment planning session
   - Review Phase 8 objectives and success criteria
   - Identify county deployment order

2. **Documentation:**
   - Create Phase 8 executive summary
   - Update [docs/roadmap/](../../roadmap/) with Phase 8 timeline
   - Notify stakeholders of Phase 8 kickoff

3. **Infrastructure:**
   - Provision multi-county test environments
   - Configure county-specific configuration overrides
   - Deploy county data isolation tests

---

## Related Documentation

- **Daily SLO Capture:** [daily-slo-capture.md](daily-slo-capture.md)
- **Alert Audit Capture:** [alert-audit-capture.md](alert-audit-capture.md)
- **Validation Period Tracker:** [docs/ops/validation-period-tracker.md](../validation-period-tracker.md)
- **Evidence Capture Protocol:** [docs/ops/evidence-capture-protocol.md](../evidence-capture-protocol.md)

---

*Government. Transcended. Phase 8 unlocked.*
