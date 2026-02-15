# TerraFusion OS — Daily SLO Checklist

> **Classification:** Government Operations — Quick Reference  
> **Purpose:** Daily SLO burn capture checklist (Days 2-7)  
> **Validation Period:** 2026-02-15 to 2026-02-21

---

## Daily Checklist (Execute at 23:00-23:59 UTC)

### Pre-Flight Check

- [ ] Node.js v24.6.0+ installed
- [ ] Grafana dashboard accessible
- [ ] Prometheus API accessible
- [ ] Git repo up-to-date (`git pull`)

---

### Step 1: Run Automation Script

```bash
cd /path/to/terrafusion_os_1.0
node scripts/capture-daily-slo-burn.mjs --day N
```

**Replace `N` with:**
- Day 2: 2026-02-16
- Day 3: 2026-02-17
- Day 4: 2026-02-18
- Day 5: 2026-02-19
- Day 6: 2026-02-20
- Day 7: 2026-02-21

---

### Step 2: Capture Dashboard Screenshot

- [ ] Open Grafana: `http://grafana.terrafusion.local:3000/d/slo-burn`
- [ ] Set time window: **Last 24h**
- [ ] Verify all 4 SLO panels visible
- [ ] Screenshot entire dashboard (minimum 1280x720)
- [ ] Save as: `docs/deploy/rehearsals/evidence/week1/slo-burn-dayN.png`

---

### Step 3: Export Prometheus Metrics

- [ ] Query API Availability: `curl -G "http://prometheus:9090/api/v1/query" --data-urlencode 'query=...'`
- [ ] Query P95 Latency
- [ ] Query P99 Latency
- [ ] Query Error Rate
- [ ] Fill template: `docs/deploy/rehearsals/evidence/week1/prometheus-dayN.json`
- [ ] Replace all `null` values with actual metrics

---

### Step 4: Update SLO Tuning Log

- [ ] Open: `docs/ops/slo-tuning-log.md`
- [ ] Find Day N row in Week 1 table
- [ ] Fill burn rates (replace "Pending" with actual %)
- [ ] Fill notes (incidents, deploys, anomalies)
- [ ] Add evidence pointers (already populated by script)

---

### Step 5: Commit Evidence

```bash
git add docs/deploy/rehearsals/evidence/week1/slo-burn-dayN.png
git add docs/deploy/rehearsals/evidence/week1/prometheus-dayN.json
git add docs/ops/slo-tuning-log.md
git commit -m "ops(telemetry): capture Day N SLO burn evidence"
git push origin feature/phase4-sprint1-storage
```

- [ ] Files staged
- [ ] Commit created
- [ ] Pushed to remote

---

### Post-Day 7: Verification

**After Day 7 complete, verify:**

```bash
node scripts/verify-slo-burn-completeness.mjs
```

**Expected:** ✅ PASS (all 7 days complete, burn <25%)

**If PASS:**
```bash
# Update tracker (Criterion #3: ⏳ → ✅)
# Edit docs/ops/validation-period-tracker.md

# Run gates
node tools/gates/validation-week12-gate.mjs

# Mint receipts
node scripts/phase4-evidence-pack.mjs
node tools/gates/release-evidence-gate.mjs

# Commit state transition
git commit -m "ops(telemetry): complete Criterion #3 (7-day burn <25%)"
```

---

## Troubleshooting Quick Links

| Issue | Runbook Link |
|-------|--------------|
| Dashboard not accessible | [daily-slo-capture.md#dashboard-not-accessible](runbooks/daily-slo-capture.md#dashboard-not-accessible) |
| Prometheus query empty | [daily-slo-capture.md#prometheus-query-returns-empty](runbooks/daily-slo-capture.md#prometheus-query-returns-empty) |
| Burn rate >25% | [daily-slo-capture.md#burn-rate-25-slo-violation](runbooks/daily-slo-capture.md#burn-rate-25-slo-violation) |
| Missed a day | [daily-slo-capture.md#missed-a-day](runbooks/daily-slo-capture.md#missed-a-day) |

---

## Quick Commands

```bash
# Check current progress
grep -E "^\| 2026-" docs/ops/slo-tuning-log.md | wc -l  # Days logged

# Verify evidence files exist
ls docs/deploy/rehearsals/evidence/week1/

# Check git status
git status
```

---

*Government. Transcended. Daily discipline enforced.*
