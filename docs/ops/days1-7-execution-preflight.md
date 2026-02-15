# TerraFusion OS — Days 1-7 Execution Pre-Flight Checklist

> **Classification:** Government Operations — FISMA-HIGH  
> **Purpose:** Pre-flight verification before daily SLO burn capture  
> **Validation Period:** Days 1-7 (2026-02-15 to 2026-02-21)

---

## 📋 **PRE-FLIGHT CHECKLIST (Run before EACH day)**

### System Prerequisites

- [ ] **Node.js v24.6.0+** installed (`node --version`)
- [ ] **Git** configured and authenticated
- [ ] **Workspace** up-to-date (`git pull origin feature/phase4-sprint1-storage`)
- [ ] **Working directory** clean (no uncommitted changes from previous days)

### Service Availability

- [ ] **Grafana dashboard** accessible:
  ```bash
  curl -s http://localhost:3000/d/slo-burn | Select-String "SLO Burn Dashboard"
  ```
  
- [ ] **Prometheus API** responding:
  ```bash
  curl -s http://localhost:9090/-/healthy
  # Expected: "Prometheus is Healthy."
  ```

- [ ] **TerraFusion API** operational:
  ```bash
  curl -s http://localhost:5000/health | ConvertFrom-Json | Select-Object status
  # Expected: status = "Healthy"
  ```

### Evidence Infrastructure

- [ ] **Evidence directory** exists and writable:
  ```bash
  Test-Path docs/deploy/rehearsals/evidence/week1/
  ```

- [ ] **SLO log** exists and unmodified from previous commit:
  ```bash
  git status docs/ops/slo-tuning-log.md
  # Expected: no changes
  ```

- [ ] **Previous day** evidence committed (if Day > 1):
  ```bash
  git log --oneline -1 -- docs/deploy/rehearsals/evidence/week1/
  ```

---

## 🚀 **DAY 1 SPECIFIC PRE-FLIGHT (2026-02-15 15:00-15:59 PST)**

### Day 1 Context

- **Cutover completed:** 2026-02-14 (yesterday)
- **24h stabilization period:** Complete
- **Expected burn:** Low (baseline observation)
- **Window:** 2026-02-15 23:00-23:59 UTC (15:00-15:59 PST)

### Day 1 Pre-Flight

- [ ] **Production cutover** evidence committed:
  ```bash
  git log --oneline | Select-String "cutover"
  ```

- [ ] **Rollback tested** and documented (Criterion #1, #2 complete)

- [ ] **No open P0 incidents** (check incident tracker)

- [ ] **Deployment freeze** in effect (no production changes during Day 1-7)

### Day 1 Special Notes

- **First data point** - Expect higher variability
- **Baseline establishment** - All 4 SLOs should have actuals > 0
- **Incident markers** - Tag any incidents that occurred during 24h window

---

## 🚀 **DAY 2 SPECIFIC PRE-FLIGHT (2026-02-16 15:00-15:59 PST)**

### Day 2 Context

- **Day 1 complete:** ✅ Evidence committed
- **Trend emerging:** Compare Day 2 vs Day 1 burn rates
- **Expected burn:** Stabilizing (should be < Day 1)
- **Window:** 2026-02-16 23:00-23:59 UTC (15:00-15:59 PST)

### Day 2 Pre-Flight

- [ ] **Day 1 evidence** exists and committed:
  ```bash
  Test-Path docs/deploy/rehearsals/evidence/week1/slo-burn-day1.png
  Test-Path docs/deploy/rehearsals/evidence/week1/prometheus-day1.json
  git log --oneline -1 -- docs/deploy/rehearsals/evidence/week1/slo-burn-day1.png
  ```

- [ ] **Day 1 log entry** filled with actual burn rates (not "Pending"):
  ```bash
  Select-String "2026-02-15.*Pending" docs/ops/slo-tuning-log.md
  # Expected: no matches (Day 1 should be filled)
  ```

- [ ] **No SLO violations** from Day 1 (or documented if occurred)

- [ ] **Alert volume** within expected range (check alert history)

### Day 2 Special Notes

- **Trend analysis** - Day 2 burn should be ≤ Day 1 (stabilization)
- **If burn increasing** - Investigate before Day 3 (may indicate systemic issue)
- **Sequential integrity** - Day 2 must reference Day 1 comparison in notes

---

## ⚡ **EXECUTION PROCEDURE (Same for all days)**

### Step 1: Run Capture Script

```bash
cd C:\Users\bsval\terrafusion_os_1.0
node scripts/capture-daily-slo-burn.mjs --day=N
```

**Expected output:**
```
✅ Day N evidence capture complete

Next steps:
  1. Replace screenshot placeholder with actual dashboard image
  2. Fill Prometheus metrics template with actual query results
  3. Commit evidence: git add ... ; git commit -m "..."
```

### Step 2: Capture Dashboard Screenshot

```bash
# Open Grafana
Start-Process "http://localhost:3000/d/slo-burn"

# Manual steps:
# 1. Set time window: Last 24h
# 2. Verify all 4 SLO panels visible
# 3. Screenshot entire dashboard (Win+Shift+S or Snipping Tool)
# 4. Save as: docs/deploy/rehearsals/evidence/week1/slo-burn-dayN.png
```

**Validation:**
- [ ] Screenshot includes timestamp (UTC)
- [ ] All 4 SLO panels visible (API Avail, P95, P99, Error Rate)
- [ ] Burn rate visible for each SLO
- [ ] Incident markers (if any) visible
- [ ] Minimum resolution: 1280x720

### Step 3: Export Prometheus Metrics

```bash
# Query Prometheus API for each SLO metric
# (Example for API Availability)

$PROM_URL = "http://localhost:9090"
$QUERY = "sum(rate(http_requests_total{job='terrafusion-api',status=~'2..'}[24h])) / sum(rate(http_requests_total{job='terrafusion-api'}[24h]))"

curl -G "$PROM_URL/api/v1/query" --data-urlencode "query=$QUERY" | ConvertFrom-Json
```

**Fill template:**
```bash
# Edit: docs/deploy/rehearsals/evidence/week1/prometheus-dayN.json
# Replace all "null" values with actual metrics from Prometheus queries
```

**Validation:**
- [ ] No "null" values in JSON (all fields populated)
- [ ] JSON valid (test with: `Get-Content prometheus-dayN.json | ConvertFrom-Json`)
- [ ] Timestamp matches Day N date
- [ ] Burn rates calculated (% from target)

### Step 4: Update SLO Log

```bash
# Script already appended row for Day N
# Manual: Open docs/ops/slo-tuning-log.md
# Fill Day N row with:
# - Actual burn % for each SLO (from Prometheus export)
# - Notes: incidents, deploys, anomalies
# - Evidence pointer already populated by script
```

**Validation:**
- [ ] Day N row has actual burn % (not "Pending")
- [ ] Notes column explains any anomalies
- [ ] Evidence pointer correctly references dayN files

### Step 5: Commit Evidence

```bash
git status
# Expected: 2 untracked files + 1 modified file

git add docs/deploy/rehearsals/evidence/week1/slo-burn-dayN.png
git add docs/deploy/rehearsals/evidence/week1/prometheus-dayN.json
git add docs/ops/slo-tuning-log.md

git commit -m "ops(telemetry): capture Day N SLO burn evidence (Criterion #3 in progress)"

git push origin feature/phase4-sprint1-storage
```

**Validation:**
- [ ] Commit created successfully
- [ ] Commit includes exactly 3 files (2 evidence + 1 log)
- [ ] Pushed to remote without errors

---

## 🔍 **POST-EXECUTION VERIFICATION**

### Immediate Verification (After each day)

```bash
# Verify evidence files exist
Test-Path docs/deploy/rehearsals/evidence/week1/slo-burn-dayN.png
Test-Path docs/deploy/rehearsals/evidence/week1/prometheus-dayN.json

# Verify log entry complete
Select-String "Day N — FILL" docs/ops/slo-tuning-log.md
# Expected: no matches (Day N should be filled, not placeholder)

# Verify commit in history
git log --oneline -1 -- docs/deploy/rehearsals/evidence/week1/
```

### Day 7 Completeness Verification

**After Day 7 captured (2026-02-21):**

```bash
# Run automated verifier
node scripts/verify-slo-burn-completeness.mjs
```

**Expected output:**
```
✅ Days 1-7 evidence complete
✅ 7-day average burn: XX.X% (< 25% threshold)
✅ PASS: Criterion #3 complete
```

**If PASS:**
```bash
# Update validation tracker
# Edit: docs/ops/validation-period-tracker.md
# Change Criterion #3 status: ⏳ In Progress → ✅ Complete

# Mint receipts
node scripts/phase4-evidence-pack.mjs
node tools/gates/release-evidence-gate.mjs

# Commit state transition
git commit -m "ops(telemetry): complete Criterion #3 (7-day SLO burn <25%)"
```

---

## 🚨 **TROUBLESHOOTING**

### Dashboard Not Accessible

```bash
# Check Grafana service
docker ps | Select-String grafana

# Restart if needed
docker restart terrafusion-grafana

# Wait 30s, retry
Start-Sleep 30
curl http://localhost:3000/-/healthy
```

### Prometheus Query Empty

```bash
# Verify Prometheus scraping
curl http://localhost:9090/api/v1/targets | ConvertFrom-Json | Select-Object -ExpandProperty data | Select-Object -ExpandProperty activeTargets

# Check for terrafusion-api target
# If missing, check service discovery
```

### Burn Rate > 25% (SLO Violation)

**If Day 1-7 average > 25%:**

1. **Document in log:** Add detailed notes explaining cause
2. **Investigate root cause:** Check incident history, deployments
3. **DO NOT tune thresholds** during validation period
4. **Criterion #3 FAILS** - Phase 8 remains blocked
5. **Escalate:** Engineering manager review required
6. **Plan remediation sprint** (post-validation)

### Missed a Day

**If Day N capture missed:**

1. **DO NOT backfill** - Sequential integrity required
2. **Document gap** in slo-tuning-log.md notes column
3. **Criterion #3 FAILS** - Restart 7-day window if critical
4. **Check remediation options:**
   - Accept failure (Phase 8 delayed)
   - Request validation period extension (requires approval)

---

## 📅 **DAILY EXECUTION CALENDAR**

| Day | Date | Window (PST) | Window (UTC) | Status |
|-----|------|--------------|--------------|--------|
| Day 1 | 2026-02-15 | 15:00-15:59 | 23:00-23:59 | ⏳ Pending |
| Day 2 | 2026-02-16 | 15:00-15:59 | 23:00-23:59 | ⏳ Pending |
| Day 3 | 2026-02-17 | 15:00-15:59 | 23:00-23:59 | ⏳ Pending |
| Day 4 | 2026-02-18 | 15:00-15:59 | 23:00-23:59 | ⏳ Pending |
| Day 5 | 2026-02-19 | 15:00-15:59 | 23:00-23:59 | ⏳ Pending |
| Day 6 | 2026-02-20 | 15:00-15:59 | 23:00-23:59 | ⏳ Pending |
| Day 7 | 2026-02-21 | 15:00-15:59 | 23:00-23:59 | ⏳ Pending |

**Next verification:** Day 7 complete (2026-02-21)

---

## 📞 **CONTACTS & ESCALATION**

### On-Call

- **Primary:** PagerDuty rotation
- **Secondary:** Slack #terrafusion-oncall
- **Escalation:** Engineering manager

### SLO Questions

- **Technical:** Observability team lead
- **Policy:** Platform SRE

### Validation Period Exceptions

- **Authority:** Engineering manager + release engineering
- **Process:** Submit validation period exception request via JIRA

---

## ✅ **FINAL CHECKLIST (Every Day)**

Before considering Day N complete:

- [ ] Script executed (`node scripts/capture-daily-slo-burn.mjs --day=N`)
- [ ] Dashboard screenshot captured and saved
- [ ] Prometheus metrics exported and filled (no nulls)
- [ ] SLO log updated with actual burn rates
- [ ] Evidence committed to Git
- [ ] Pushed to remote
- [ ] Verified in Git history
- [ ] No working directory changes remain

**Day N Complete ✅**

---

*Government. Transcended. Daily discipline enforced.*
