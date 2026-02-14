# TerraFusion OS — Evidence Capture Protocol

> **Classification:** Government Operations — FISMA-HIGH  
> **Purpose:** Standardized procedures for capturing validation period telemetry evidence  
> **Status:** Active — 30-day validation period (2026-02-14 to 2026-03-15)

---

## Overview

This protocol defines **how** to capture telemetry evidence for Validation Criteria #3 (SLO burn) and #4 (Alert FP audit) in a manner that is:

1. **Mechanically verifiable** — Evidence can be validated by automated gates
2. **Tamper-evident** — Chain of custody preserved via git commits + timestamps
3. **Audit-grade** — FISMA-HIGH compliance for government operations
4. **Append-only** — No retroactive modifications permitted

---

## Evidence Storage Structure

```
docs/deploy/rehearsals/evidence/
├── week1/                          # SLO burn evidence (Days 1-7)
│   ├── slo-burn-day1.png          # Dashboard screenshot
│   ├── prometheus-day1.json       # Metrics export
│   ├── slo-burn-day2.png
│   ├── prometheus-day2.json
│   └── [day3-7...]
└── alerts/                         # Alert FP audit evidence (#001-100)
    ├── alert-001-payload.json     # Alert manager payload
    ├── alert-001-trace.json       # Distributed trace
    ├── alert-001-ticket.md        # Incident ticket link
    └── [002-100...]
```

---

## Criterion #3: SLO Burn Evidence Capture

### Daily Capture (Days 1-7)

**When:** End of each UTC day (23:00-23:59 UTC recommended)

**Required Artifacts (2 per day):**

1. **Dashboard Screenshot** (`slo-burn-dayN.png`)
   - Source: Grafana/Prometheus dashboard showing 24h SLO burn
   - Must include: timestamp, burn %, SLO targets, actual values
   - Format: PNG, minimum 1280x720 resolution
   - Filename: `slo-burn-day{N}.png` (N = 1-7)

2. **Prometheus Export** (`prometheus-dayN.json`)
   - Source: Prometheus API query results
   - Must conform to: `prometheus-day1.schema.json`
   - Required fields: timestamp, window, burn rates for all 4 SLOs
   - Format: JSON, pretty-printed
   - Filename: `prometheus-day{N}.json` (N = 1-7)

**Automation:**
```bash
# Run daily capture script
node scripts/capture-daily-slo-burn.mjs --day N
```

**Manual Capture (fallback):**
```bash
# Screenshot dashboard
# Save as docs/deploy/rehearsals/evidence/week1/slo-burn-dayN.png

# Export Prometheus metrics
curl "http://prometheus:9090/api/v1/query?query=..." > \
  docs/deploy/rehearsals/evidence/week1/prometheus-dayN.json

# Append entry to log
# Edit docs/ops/slo-tuning-log.md (follow template)

# Commit immediately
git add docs/deploy/rehearsals/evidence/week1/slo-burn-dayN.png \
        docs/deploy/rehearsals/evidence/week1/prometheus-dayN.json \
        docs/ops/slo-tuning-log.md
git commit -m "ops(telemetry): capture Day N SLO burn evidence"
```

**Verification:**
```bash
# Verify completeness (after Day 7)
node scripts/verify-slo-burn-completeness.mjs
```

---

## Criterion #4: Alert FP Audit Evidence Capture

### Per-Alert Capture (Alerts #001-100)

**When:** Immediately upon paging alert firing (real-time capture)

**Required Artifacts (3 per alert):**

1. **Alert Payload** (`alert-NNN-payload.json`)
   - Source: Alertmanager API or alert webhook
   - Must conform to: `alert-payload.schema.json`
   - Required fields: alert_id, timestamp, alert_name, severity, labels, annotations
   - Format: JSON, pretty-printed
   - Filename: `alert-{NNN}-payload.json` (NNN = 001-100)

2. **Distributed Trace** (`alert-NNN-trace.json`)
   - Source: Jaeger/Zipkin trace export (if alert is latency/error related)
   - Must include: trace ID, span details, timing breakdown
   - Format: JSON or Jaeger trace link (if too large)
   - Filename: `alert-{NNN}-trace.json` or `alert-{NNN}-trace-link.txt`

3. **Incident Ticket** (`alert-NNN-ticket.md`)
   - Source: PagerDuty/Jira/Linear incident ticket
   - Must include: ticket link, classification (TP/FP), resolution notes
   - Format: Markdown with ticket URL + summary
   - Filename: `alert-{NNN}-ticket.md`

**Automation:**
```bash
# Run alert capture script
node scripts/capture-alert-audit-entry.mjs \
  --id 001 \
  --classification TP \
  --payload /path/to/payload.json \
  --trace /path/to/trace.json \
  --ticket https://tickets.terrafusion/INC-1234
```

**Manual Capture (fallback):**
```bash
# Save alert payload
curl "http://alertmanager:9093/api/v2/alerts" | \
  jq '.[] | select(.labels.alertname=="TerraFusionAPIDown")' > \
  docs/deploy/rehearsals/evidence/alerts/alert-001-payload.json

# Save trace (if applicable)
curl "http://jaeger:16686/api/traces/{trace_id}" > \
  docs/deploy/rehearsals/evidence/alerts/alert-001-trace.json

# Create ticket summary
cat > docs/deploy/rehearsals/evidence/alerts/alert-001-ticket.md <<EOF
# Alert #001: TerraFusionAPIDown

**Classification:** TP (True Positive)

**Incident Ticket:** https://tickets.terrafusion/INC-1234

**Summary:** API pod crashed due to OOM. Restarted automatically by k8s. No user impact.

**Resolution:** Increased memory limit in deployment.
EOF

# Append entry to audit log
# Edit docs/ops/alerts-noise-audit.md (follow sequential template)

# Commit immediately
git add docs/deploy/rehearsals/evidence/alerts/alert-001-* \
        docs/ops/alerts-noise-audit.md
git commit -m "ops(telemetry): capture Alert #001 evidence (TP)"
```

**Sequential Enforcement:**
- Alerts MUST be captured in order: #001 → #002 → ... → #100
- No skipping permitted (cherry-picking forbidden)
- Gaps detected by verification script will fail gate

**Verification:**
```bash
# Verify completeness + FP rate (after Alert #100)
node scripts/verify-alert-audit-completeness.mjs
```

---

## Evidence Chain of Custody

### Git Commit Protocol

**Per evidence capture:**
```bash
# Immediate commit after capture (same day)
git add docs/deploy/rehearsals/evidence/<path>
git commit -m "ops(telemetry): capture [Day N|Alert #NNN] evidence"
```

**Why immediate commits:**
- Preserves timestamp in git history (tamper-evident)
- Prevents retroactive modification (append-only enforcement)
- Creates audit trail for compliance review

### Evidence Integrity

**Prohibited actions:**
- ❌ Modifying captured evidence files after commit
- ❌ Retroactive timestamp changes
- ❌ Skipping sequential alert IDs
- ❌ Fabricating evidence (FISMA violation)

**Permitted actions:**
- ✅ Appending new evidence files
- ✅ Adding supplementary notes (separate commit)
- ✅ Correcting classification (separate commit with rationale)

---

## Schema Validation

### SLO Burn Prometheus Export

**Schema:** `docs/deploy/rehearsals/evidence/week1/prometheus-day1.schema.json`

**Validation:**
```bash
# Install AJV validator (if not present)
npm install -g ajv-cli

# Validate against schema
ajv validate \
  -s docs/deploy/rehearsals/evidence/week1/prometheus-day1.schema.json \
  -d docs/deploy/rehearsals/evidence/week1/prometheus-dayN.json
```

### Alert Payload

**Schema:** `docs/deploy/rehearsals/evidence/alerts/alert-payload.schema.json`

**Validation:**
```bash
ajv validate \
  -s docs/deploy/rehearsals/evidence/alerts/alert-payload.schema.json \
  -d docs/deploy/rehearsals/evidence/alerts/alert-NNN-payload.json
```

---

## Troubleshooting

### Dashboard Not Accessible

**Issue:** Grafana dashboard unreachable during capture window

**Resolution:**
1. Check network connectivity to monitoring stack
2. Verify port forwarding: `kubectl port-forward svc/grafana 3000:3000`
3. Use Prometheus API directly as fallback:
   ```bash
   curl "http://prometheus:9090/api/v1/query_range?query=..."
   ```

### Alert Missed During Off-Hours

**Issue:** Paging alert fired but evidence not captured immediately

**Resolution:**
1. Retrieve from Alertmanager history:
   ```bash
   curl "http://alertmanager:9093/api/v2/alerts?filter=alertname=TerraFusionAPIDown"
   ```
2. Document delay in ticket notes
3. Commit with timestamp explanation:
   ```bash
   git commit -m "ops(telemetry): capture Alert #NNN (delayed capture, fired YYYY-MM-DD HH:MM)"
   ```

### Sequential Gap Detected

**Issue:** Alert audit has gaps (e.g., #001, #003, missing #002)

**Resolution:**
- **DO NOT** renumber alerts (preserves audit trail)
- Investigate missing alert:
  - Check Alertmanager logs for #002
  - If alert never fired, add placeholder entry:
    ```markdown
    | 002 | N/A | N/A | N/A | N/A | N/A | GAP | Alert never fired (verified in logs) | None |
    ```

---

## Compliance Attestation

**FISMA-HIGH Requirements:**
- ✅ All evidence files timestamped via git commits
- ✅ Append-only enforcement (no retroactive edits)
- ✅ Schema validation for structured evidence
- ✅ Chain of custody preserved in git history
- ✅ No fabrication (real-world telemetry only)

**Audit Trail:**
```bash
# Show evidence capture history
git log --oneline --grep="ops(telemetry)"

# Show file creation timestamps
git log --follow -- docs/deploy/rehearsals/evidence/week1/slo-burn-day1.png
```

---

## Related Documentation

- **Daily SLO Capture Runbook:** [docs/ops/runbooks/daily-slo-capture.md](runbooks/daily-slo-capture.md)
- **Alert Audit Capture Runbook:** [docs/ops/runbooks/alert-audit-capture.md](runbooks/alert-audit-capture.md)
- **SLO Tuning Log:** [docs/ops/slo-tuning-log.md](slo-tuning-log.md)
- **Alert Noise Audit:** [docs/ops/alerts-noise-audit.md](alerts-noise-audit.md)

---

*Government. Transcended. Evidence captured.*
