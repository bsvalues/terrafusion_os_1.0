# Daily SLO Burn Capture — Operational Runbook

> **Classification:** Government Operations — On-Call Procedures  
> **Audience:** On-call engineers, SRE team  
> **Frequency:** Daily (end of each UTC day)  
> **Validation Period:** 2026-02-14 to 2026-03-15

---

## Overview

This runbook describes the daily procedure for capturing SLO burn telemetry evidence during the 30-day validation period (Validation Criterion #3).

**Goal:** Capture 7 consecutive days of SLO burn data with <25% average budget consumption.

---

## When to Execute

**Daily schedule:**
- Execute at **23:00-23:59 UTC** each day (end of day)
- Days 1-7: 2026-02-15 through 2026-02-21

**Do NOT skip days** — Validation requires 7 **consecutive** days.

---

## Prerequisites

**Access required:**
- Grafana dashboard access (read-only sufficient)
- Prometheus API access
- Git commit access to TerraFusion repo

**Tools required:**
- Node.js v24.6.0+ (for automation script)
- Screenshot tool (Snipping Tool, Firefox screenshot, etc.)
- Git CLI

---

## Procedure

### Step 1: Run Automation Script

```bash
# Navigate to repo root
cd /path/to/terrafusion_os_1.0

# Run daily capture for Day N
node scripts/capture-daily-slo-burn.mjs --day N
```

**Example (Day 2):**
```bash
node scripts/capture-daily-slo-burn.mjs --day 2
```

**Output:**
- Creates `docs/deploy/rehearsals/evidence/week1/slo-burn-day2.png` (placeholder)
- Creates `docs/deploy/rehearsals/evidence/week1/prometheus-day2.json` (template)
- Appends entry to `docs/ops/slo-tuning-log.md`

---

### Step 2: Capture Dashboard Screenshot

**Dashboard URL:**
```
http://grafana.terrafusion.local:3000/d/slo-burn
```

**Screenshot requirements:**
1. Navigate to SLO burn dashboard
2. Set time window to **last 24h**
3. Ensure all 4 SLO panels visible:
   - API Availability (SLO-001)
   - P95 Latency (SLO-002)
   - P99 Latency (SLO-003)
   - Error Rate (SLO-004)
4. Screenshot entire dashboard (minimum 1280x720 resolution)
5. Save as: `docs/deploy/rehearsals/evidence/week1/slo-burn-dayN.png`

**Manual screenshot commands:**

**Windows:**
```powershell
# Use Snipping Tool or Firefox built-in screenshot
# Firefox: Right-click page → "Take Screenshot" → "Save full page"
```

**Linux:**
```bash
# Using Firefox headless
firefox --headless --screenshot=docs/deploy/rehearsals/evidence/week1/slo-burn-day2.png \
  http://grafana.terrafusion.local:3000/d/slo-burn
```

---

### Step 3: Export Prometheus Metrics

**Query Prometheus API for SLO burn rates:**

```bash
# API Availability SLO (uptime)
curl -G "http://prometheus.terrafusion.local:9090/api/v1/query" \
  --data-urlencode 'query=1 - (sum(rate(http_requests_total{job="api",status=~"5.."}[24h])) / sum(rate(http_requests_total{job="api"}[24h])))' \
  | jq '.data.result[0].value[1]'

# P95 Latency (ms)
curl -G "http://prometheus.terrafusion.local:9090/api/v1/query" \
  --data-urlencode 'query=histogram_quantile(0.95, rate(http_request_duration_seconds_bucket{job="api"}[24h])) * 1000' \
  | jq '.data.result[0].value[1]'

# P99 Latency (ms)
curl -G "http://prometheus.terrafusion.local:9090/api/v1/query" \
  --data-urlencode 'query=histogram_quantile(0.99, rate(http_request_duration_seconds_bucket{job="api"}[24h])) * 1000' \
  | jq '.data.result[0].value[1]'

# Error Rate (%)
curl -G "http://prometheus.terrafusion.local:9090/api/v1/query" \
  --data-urlencode 'query=sum(rate(http_requests_total{job="api",status=~"5.."}[24h])) / sum(rate(http_requests_total{job="api"}[24h])) * 100' \
  | jq '.data.result[0].value[1]'
```

**Fill template:**
1. Open `docs/deploy/rehearsals/evidence/week1/prometheus-dayN.json`
2. Replace `null` values with actual query results
3. Fill `incidents` array if any SLO violations occurred

**Example filled export:**
```json
{
  "timestamp": "2026-02-16T23:59:00Z",
  "window": "24h",
  "slos": {
    "api_availability": {
      "target": 0.995,
      "actual": 0.9978,
      "burn_rate": 8.5
    },
    "p95_latency": {
      "target_ms": 200,
      "actual_ms": 145,
      "burn_rate": 5.2
    },
    "p99_latency": {
      "target_ms": 500,
      "actual_ms": 387,
      "burn_rate": 6.1
    },
    "error_rate": {
      "target": 0.01,
      "actual": 0.0022,
      "burn_rate": 3.8
    }
  },
  "incidents": []
}
```

---

### Step 4: Update SLO Tuning Log

**Edit `docs/ops/slo-tuning-log.md`:**

Find your Day N row and fill burn rates:

**Before:**
```markdown
| 2026-02-16 | Pending | Pending | Pending | Pending | Day 2 — FILL BURN RATES | evidence/week1/slo-burn-day2.png, prometheus-day2.json |
```

**After:**
```markdown
| 2026-02-16 | 8.5% | 5.2% | 6.1% | 3.8% | Day 2 — No incidents | evidence/week1/slo-burn-day2.png, prometheus-day2.json |
```

---

### Step 5: Commit Evidence

```bash
# Stage evidence files
git add docs/deploy/rehearsals/evidence/week1/slo-burn-dayN.png
git add docs/deploy/rehearsals/evidence/week1/prometheus-dayN.json
git add docs/ops/slo-tuning-log.md

# Commit (immediate, same day)
git commit -m "ops(telemetry): capture Day N SLO burn evidence"

# Push (optional, depends on workflow)
git push origin feature/phase4-sprint1-storage
```

**Why immediate commit?**
- Preserves timestamp in git history (tamper-evident)
- Prevents retroactive modification (append-only enforcement)
- Creates audit trail for FISMA compliance

---

## Verification

**After Day 7, verify completeness:**

```bash
# Run verification script
node scripts/verify-slo-burn-completeness.mjs
```

**Expected output (PASS):**
```
✅ VALIDATION CRITERION #3: PASS

All evidence complete, 7-day burn <25%
```

**If PASS:**
```bash
# Update tracker
# Edit docs/ops/validation-period-tracker.md
# Set Criterion #3: ⏳ → ✅

# Run gates
node tools/gates/validation-week12-gate.mjs

# Mint receipts
node scripts/phase4-evidence-pack.mjs
node tools/gates/release-evidence-gate.mjs

# Commit state transition
git commit -m "ops(telemetry): complete Criterion #3 (7-day burn <25%)"
```

---

## Troubleshooting

### Dashboard Not Accessible

**Symptom:** Grafana dashboard returns 404 or connection refused

**Resolution:**
1. Check port forwarding:
   ```bash
   kubectl port-forward -n monitoring svc/grafana 3000:3000
   ```
2. Verify service is running:
   ```bash
   kubectl get pods -n monitoring | grep grafana
   ```
3. Fallback: Use Prometheus directly (skip dashboard screenshot)

---

### Prometheus Query Returns Empty

**Symptom:** Curl returns `{"data":{"result":[]}}`

**Resolution:**
1. Verify Prometheus is scraping targets:
   ```bash
   curl http://prometheus.terrafusion.local:9090/api/v1/targets
   ```
2. Check metric name exists:
   ```bash
   curl -G "http://prometheus.terrafusion.local:9090/api/v1/label/__name__/values" | grep http_requests_total
   ```
3. Adjust time window (use `[1h]` instead of `[24h]` for testing)

---

### Burn Rate >25% (SLO Violation)

**Symptom:** One or more SLOs showing burn rate ≥25%

**Resolution:**
1. **Document incident** in `prometheus-dayN.json` incidents array
2. **Investigate root cause** (check incident postmortem)
3. **Tune thresholds** if baseline assumptions were wrong (document in `slo-tuning-log.md`)
4. **Continue tracking** (do not reset counter)
5. After Day 7, if average >25%, validation requires tuning sprint + rationale

---

### Missed a Day

**Symptom:** Forgot to capture Day N evidence

**Resolution:**
- **DO NOT fabricate timestamps** (FISMA violation)
- Capture next day's evidence as scheduled
- Document gap in validation tracker:
  ```markdown
  | 2026-02-17 | N/A | N/A | N/A | N/A | Day 3 — Missed capture (documented) | N/A |
  ```
- **Restart 7-day counter** from next valid day (governance requirement)

---

## Related Documentation

- **Evidence Capture Protocol:** [docs/ops/evidence-capture-protocol.md](../evidence-capture-protocol.md)
- **SLO Tuning Log:** [docs/ops/slo-tuning-log.md](../slo-tuning-log.md)
- **Validation Period Tracker:** [docs/ops/validation-period-tracker.md](../validation-period-tracker.md)

---

*Government. Transcended. Daily discipline enforced.*
