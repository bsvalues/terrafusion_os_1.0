# Alert Audit Capture — Operational Runbook

> **Classification:** Government Operations — On-Call Procedures  
> **Audience:** On-call engineers, incident responders  
> **Trigger:** Paging alert fires  
> **Validation Period:** 2026-02-14 to 2026-03-15

---

## Overview

This runbook describes the real-time procedure for capturing paging alert evidence during the 30-day validation period (Validation Criterion #4).

**Goal:** Audit first 100 paging alerts with <25% false positive rate.

---

## When to Execute

**Trigger:**
- **Any paging alert fires** (PagerDuty notification, Alertmanager webhook, Slack alert)

**Capture immediately:**
- Do NOT wait until end of day
- Evidence must be captured while alert is firing or shortly after resolution

---

## Prerequisites

**Access required:**
- Alertmanager API access
- Jaeger/Zipkin trace access
- Incident ticket system (PagerDuty/Jira/Linear)
- Git commit access to TerraFusion repo

**Tools required:**
- Node.js v24.6.0+ (for automation script)
- `curl` or API client
- Git CLI

---

## Procedure

### Step 1: Determine Alert ID

Alert IDs must be **sequential** (#001 → #100, no skipping).

**Check next ID:**
```bash
# Count existing entries
grep -E "^\| [0-9]{3} \|" docs/ops/alerts-noise-audit.md | wc -l

# Next ID = (count + 1), zero-padded to 3 digits
# Example: If count = 5, next ID = 006
```

**CRITICAL:** Do not cherry-pick or skip alerts. If alert #006 is next, you MUST audit it even if uninteresting.

---

### Step 2: Run Automation Script

```bash
# Navigate to repo root
cd /path/to/terrafusion_os_1.0

# Run alert capture
node scripts/capture-alert-audit-entry.mjs \
  --id 006 \
  --classification TP \
  --reason "API pod crashed (OOM)" \
  --action "Increased memory limit"
```

**Classification options:**
- `TP` — True Positive (legitimate incident)
- `FP` — False Positive (alert fired but no actionable incident)
- `Flapping` — Alert firing/resolving repeatedly
- `Out-of-SLA` — Acknowledged outside target SLA

**Output:**
- Creates `alert-006-payload.json` (template)
- Creates `alert-006-trace.json` (template)
- Creates `alert-006-ticket.md` (template)
- Appends entry to `docs/ops/alerts-noise-audit.md`

---

### Step 3: Capture Alert Payload

**From Alertmanager API:**

```bash
# Get currently firing alerts
curl "http://alertmanager.terrafusion.local:9093/api/v2/alerts" | jq .

# Find your alert by name
curl "http://alertmanager.terrafusion.local:9093/api/v2/alerts" | \
  jq '.[] | select(.labels.alertname=="TerraFusionAPIDown")'
```

**Save to evidence file:**
```bash
curl "http://alertmanager.terrafusion.local:9093/api/v2/alerts" | \
  jq '.[] | select(.labels.alertname=="TerraFusionAPIDown")' > \
  docs/deploy/rehearsals/evidence/alerts/alert-006-payload.json
```

**Fill template manually:**
```json
{
  "alert_id": "006",
  "timestamp": "2026-02-18T14:23:45Z",
  "alert_name": "TerraFusionAPIDown",
  "severity": "critical",
  "labels": {
    "alertname": "TerraFusionAPIDown",
    "service": "terrafusion-api",
    "environment": "production",
    "namespace": "terrafusion"
  },
  "annotations": {
    "summary": "TerraFusion API is down",
    "description": "The API has been unreachable for >2 minutes",
    "runbook_url": "https://docs.terrafusion.local/runbooks/api-down"
  },
  "state": "firing",
  "acknowledged_at": "2026-02-18T14:24:12Z",
  "resolved_at": "2026-02-18T14:27:33Z"
}
```

---

### Step 4: Capture Distributed Trace

**If alert is latency/error related, export trace:**

```bash
# Get trace ID from logs or Jaeger UI
TRACE_ID="abc123def456..."

# Export trace
curl "http://jaeger.terrafusion.local:16686/api/traces/${TRACE_ID}" > \
  docs/deploy/rehearsals/evidence/alerts/alert-006-trace.json
```

**If trace too large, store link instead:**
```bash
cat > docs/deploy/rehearsals/evidence/alerts/alert-006-trace.json <<EOF
{
  "trace_id": "abc123def456...",
  "trace_url": "http://jaeger.terrafusion.local:16686/trace/abc123def456",
  "note": "Trace viewable in Jaeger UI (too large to export)"
}
EOF
```

**If alert not trace-related (e.g., pod down), document:**
```json
{
  "trace_id": null,
  "_note": "Alert not trace-related (pod crash, not latency/error)"
}
```

---

### Step 5: Create Incident Ticket Summary

**Fill ticket template:**

```markdown
# Alert #006: TerraFusionAPIDown

**Classification:** TP (True Positive)

**Incident Ticket:** https://pagerduty.com/incidents/INC-1234

**Summary:**
API pod `terrafusion-api-5d7c8f9b-xyz` crashed due to OOM (out of memory).
Pod was consuming 2.1GB RAM (limit: 2GB). Killed by k8s OOMKiller.

**Impact:**
- Duration: 5 minutes (14:23 - 14:28 UTC)
- User impact: API unavailable, ~50 requests failed
- Automatic recovery: k8s restarted pod

**Root Cause:**
Memory leak in property search endpoint. Large result sets not paginated properly.

**Resolution:**
1. Increased memory limit to 4GB (temporary mitigation)
2. Created ticket to fix pagination: JIRA-5678
3. Added memory usage alert threshold

**Tuning Action:**
None required (alert was correct, real incident).
```

---

### Step 6: Classify Alert (TP/FP)

**Classification guidelines:**

| Classification | Criteria | Example |
|----------------|----------|---------|
| **TP** (True Positive) | Real incident requiring action | API pod crashed, database down, high error rate |
| **FP** (False Positive) | Alert fired but no incident | Batch job caused latency spike (expected), deployment blip resolved instantly |
| **Flapping** | Alert firing/resolving repeatedly | Threshold too sensitive, metric oscillating near boundary |
| **Out-of-SLA** | Acknowledged outside SLA | Critical alert not ack'd within 5min target |

**When in doubt:** Classify as TP. FP requires clear evidence that no action was needed.

---

### Step 7: Commit Evidence

```bash
# Stage evidence files
git add docs/deploy/rehearsals/evidence/alerts/alert-006-*
git add docs/ops/alerts-noise-audit.md

# Commit (immediate, same day)
git commit -m "ops(telemetry): capture Alert #006 evidence (TP)"

# Push (optional)
git push origin feature/phase4-sprint1-storage
```

---

## Verification

**After Alert #100, verify completeness:**

```bash
# Run verification script
node scripts/verify-alert-audit-completeness.mjs
```

**Expected output (PASS):**
```
✅ VALIDATION CRITERION #4: PASS

All 100 alerts audited, FP rate <25%
```

**If PASS (PHASE 8 UNLOCK):**
```bash
# Update tracker
# Edit docs/ops/validation-period-tracker.md
# Set Criterion #4: ⏳ → ✅

# Run gates
node tools/gates/validation-week12-gate.mjs  # Should show 5/5 PASS

# Mint receipts
node scripts/phase4-evidence-pack.mjs
node tools/gates/release-evidence-gate.mjs

# Commit state transition (PHASE 8 AUTHORIZED)
git commit -m "ops(telemetry): complete Criterion #4 (Alert FP <25%)" \
  -m "PHASE 8 KICKOFF: AUTHORIZED (5/5 validation complete)"
```

---

## Troubleshooting

### Alert Missed (Didn't Capture in Real-Time)

**Symptom:** Alert fired overnight, evidence not captured immediately

**Resolution:**
1. Retrieve from Alertmanager history:
   ```bash
   curl "http://alertmanager.terrafusion.local:9093/api/v2/alerts?filter=alertname=TerraFusionAPIDown&silenced=false&inhibited=false&active=false" | jq .
   ```
2. Document delay in ticket notes:
   ```markdown
   **Note:** Evidence captured retrospectively (alert fired 2026-02-18 02:15 UTC, captured 2026-02-18 09:00 UTC).
   ```
3. Commit with explanation:
   ```bash
   git commit -m "ops(telemetry): capture Alert #NNN (delayed capture, fired YYYY-MM-DD HH:MM)"
   ```

---

### Sequential Gap Detected

**Symptom:** Alert audit has gaps (e.g., #001, #003, missing #002)

**Resolution:**
- **DO NOT renumber alerts** (preserves audit trail)
- Investigate missing alert:
  - Check Alertmanager logs for #002
  - Query alert history API
- If alert never fired, add placeholder entry:
  ```markdown
  | 002 | N/A | N/A | N/A | N/A | N/A | GAP | Alert never fired (verified in logs) | None |
  ```

---

### FP Rate Trending >25%

**Symptom:** After 50 alerts, FP rate is 30%

**Resolution:**
1. **Do NOT reset counter** (governance violation)
2. **Tune immediately:**
   - Review FP reasons in audit log
   - Adjust alert thresholds (document in `slo-tuning-log.md`)
   - Demote noisy alerts from paging to warning
3. **Continue auditing #051-100** (tuning should reduce FP rate)
4. If final rate still >25%, document tuning actions + rationale

---

### Alert Classification Unclear

**Symptom:** Unsure if alert is TP or FP

**Resolution:**
1. **Default to TP** unless clear evidence of no incident
2. Consult runbook:
   - If runbook led to action → TP
   - If runbook says "ignore during batch jobs" → FP (threshold needs tuning)
3. Discuss with team in postmortem
4. Can reclassify later (separate commit):
   ```bash
   # Edit audit log entry
   git commit -m "ops(telemetry): reclassify Alert #NNN (TP → FP, batch job confirmed)"
   ```

---

## Related Documentation

- **Evidence Capture Protocol:** [docs/ops/evidence-capture-protocol.md](../evidence-capture-protocol.md)
- **Alert Noise Audit Log:** [docs/ops/alerts-noise-audit.md](../alerts-noise-audit.md)
- **Validation Period Tracker:** [docs/ops/validation-period-tracker.md](../validation-period-tracker.md)

---

*Government. Transcended. Real-time capture enforced.*
