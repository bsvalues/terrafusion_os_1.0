# TerraFusion OS — Day 1 Morning Checklist

> **Date:** 2026-02-15 (Day 1)  
> **Window:** 15:00-15:59 PST (23:00-23:59 UTC)  
> **Purpose:** Final pre-flight before Day 1 SLO burn capture  
> **Classification:** Government Operations — FISMA-HIGH

---

## ⏰ **TIMELINE (Morning of 2026-02-15)**

| Time (PST) | Action | Status |
|------------|--------|--------|
| **09:00-10:00** | Morning prep: Start services + verify | ⬜ |
| **14:00-14:55** | Final pre-flight check | ⬜ |
| **15:00-15:59** | **DAY 1 CAPTURE WINDOW** | ⬜ |
| **16:00-16:30** | Evidence fill + commit | ⬜ |

---

## 🚀 **MORNING PREP (09:00-10:00 PST)**

### Step 1: Start Services

```powershell
# One command to start all dependencies
.\scripts\start-day1-services.ps1

# Expected: All services healthy in ~30s
```

**If services fail:**
- Check Docker Desktop is running
- Review logs: `docker-compose logs grafana prometheus terrafusion-api`
- Force restart: `.\scripts\start-day1-services.ps1 -Force`

---

### Step 2: Verify Pre-Start

```powershell
# Automated verification (all checks must pass)
.\scripts\verify-day1-prestart.ps1

# Expected: "✅ VERDICT: READY FOR DAY 1 EXECUTION"
```

**If verification fails:**
- ❌ **STOP AND FIX** — Do NOT proceed to capture
- Review failure messages
- Execute suggested fixes
- Re-run verification until PASS

---

## 🔍 **FINAL PRE-FLIGHT (14:00-14:55 PST)**

### Quick Sanity Check (5 minutes before window)

```powershell
# 1. Verify services still healthy
curl http://localhost:3000/-/healthy  # Grafana
curl http://localhost:9090/-/healthy  # Prometheus
curl http://localhost:5000/health     # TerraFusion API

# 2. Verify Git clean
git status  # Expected: "nothing to commit, working tree clean"

# 3. Verify evidence directory empty (no premature Day 1 files)
Get-ChildItem docs\deploy\rehearsals\evidence\week1\
# Expected: Only .gitkeep and prometheus-day1.schema.json
```

**All checks green? → Proceed to capture window ✅**  
**Any check red? → STOP AND FIX ❌**

---

## ⚡ **DAY 1 CAPTURE WINDOW (15:00-15:59 PST)**

### Step 1: Run Capture Script (1 minute)

```powershell
node scripts/capture-daily-slo-burn.mjs --day=1
```

**Expected output:**
```
✅ Day 1 evidence capture complete

Next steps:
  1. Replace screenshot placeholder with actual dashboard image
  2. Fill Prometheus metrics template with actual query results
  3. Commit evidence: git add ... ; git commit -m "..."
```

---

### Step 2: Capture Dashboard Screenshot (3 minutes)

```powershell
# Open Grafana SLO Burn Dashboard
Start-Process "http://localhost:3000/d/slo-burn"
```

**Manual capture:**
1. Set time window: **Last 24h**
2. Verify all 4 SLO panels visible (API Avail, P95, P99, Error Rate)
3. Screenshot entire dashboard (**Win+Shift+S** or Snipping Tool)
4. Save as: `docs\deploy\rehearsals\evidence\week1\slo-burn-day1.png`
   - Minimum resolution: **1280x720**
   - Include timestamp (UTC)
   - Include burn rate for all SLOs

---

### Step 3: Export Prometheus Metrics (3 minutes)

```powershell
# Open template for editing
code docs\deploy\rehearsals\evidence\week1\prometheus-day1.json

# Query Prometheus for each metric (examples below)
```

**Required metrics (replace ALL nulls with real values):**

```powershell
# API Availability
curl "http://localhost:9090/api/v1/query?query=sum(rate(http_requests_total%7Bjob%3D%27terrafusion-api%27%2Cstatus%3D~%272..%27%7D%5B24h%5D))%2Fsum(rate(http_requests_total%7Bjob%3D%27terrafusion-api%27%7D%5B24h%5D))"

# P95 Latency
curl "http://localhost:9090/api/v1/query?query=histogram_quantile(0.95%2C%20sum(rate(http_request_duration_seconds_bucket%7Bjob%3D%27terrafusion-api%27%7D%5B24h%5D))%20by%20(le))"

# P99 Latency  
curl "http://localhost:9090/api/v1/query?query=histogram_quantile(0.99%2C%20sum(rate(http_request_duration_seconds_bucket%7Bjob%3D%27terrafusion-api%27%7D%5B24h%5D))%20by%20(le))"

# Error Rate
curl "http://localhost:9090/api/v1/query?query=sum(rate(http_requests_total%7Bjob%3D%27terrafusion-api%27%2Cstatus%3D~%275..%27%7D%5B24h%5D))%2Fsum(rate(http_requests_total%7Bjob%3D%27terrafusion-api%27%7D%5B24h%5D))"
```

**Fill template:**
- Replace all `"actual": null` with query results
- Replace all `"burn_rate": null` with calculated burn %
- Add incidents array if any occurred during 24h window

**⚠️ NO NULLS IN FINAL COMMIT** — Re-query if empty results

---

### Step 4: Update SLO Log (2 minutes)

```powershell
# Open SLO tuning log
code docs\ops\slo-tuning-log.md
```

**Fill Day 1 row in Week 1 table:**

| Column | Value |
|--------|-------|
| Date | `2026-02-15` (already filled) |
| SLO-001 (API Avail) | Actual burn % from Prometheus |
| SLO-002 (P95 Lat) | Actual burn % from Prometheus |
| SLO-003 (P99 Lat) | Actual burn % from Prometheus |
| SLO-004 (Error Rate) | Actual burn % from Prometheus |
| Notes | "Day 1 post-cutover — 24h observation. [Any incidents/deploys]" |
| Evidence | `evidence/week1/slo-burn-day1.png, prometheus-day1.json` (already filled) |

**Replace "Pending" with actual burn rates**

---

### Step 5: Atomic Commit (1 minute)

```powershell
# Verify exactly 3 files changed
git status
# Expected:
#   modified:   docs/ops/slo-tuning-log.md
#   new file:   docs/deploy/rehearsals/evidence/week1/slo-burn-day1.png
#   new file:   docs/deploy/rehearsals/evidence/week1/prometheus-day1.json

# Stage all evidence
git add docs\ops\slo-tuning-log.md `
        docs\deploy\rehearsals\evidence\week1\slo-burn-day1.png `
        docs\deploy\rehearsals\evidence\week1\prometheus-day1.json

# Atomic commit
git commit -m "ops(telemetry): capture Day 1 SLO burn evidence (Criterion #3: 1/7)"

# Push to remote
git push origin feature/phase4-sprint1-storage
```

---

## ✅ **POST-CAPTURE VERIFICATION**

### Sanity Check (immediately after commit)

```powershell
# 1. Verify commit in history
git log --oneline -1
# Expected: "ops(telemetry): capture Day 1 SLO burn evidence..."

# 2. Verify evidence files exist
Test-Path docs\deploy\rehearsals\evidence\week1\slo-burn-day1.png
Test-Path docs\deploy\rehearsals\evidence\week1\prometheus-day1.json
# Expected: Both True

# 3. Verify log entry complete (no "Pending")
Select-String "2026-02-15.*Pending" docs\ops\slo-tuning-log.md
# Expected: No matches

# 4. Verify working tree clean
git status
# Expected: "nothing to commit, working tree clean"
```

**All verifications pass? → Day 1 COMPLETE ✅**

---

## 🚨 **FAILURE HANDLING (Constitutional)**

### If Day 1 Window Missed

**DO NOT backfill.** Sequential integrity is constitutional.

1. **Document the gap immediately:**
   ```powershell
   # Add note to slo-tuning-log.md Day 1 row
   # Notes column: "MISSED — Window expired, no capture"
   ```

2. **Understand implications:**
   - Criterion #3 **FAILS** (7-day sequential coverage required)
   - Phase 8 remains **BLOCKED**
   - Options:
     - Accept failure (Phase 8 delayed until next validation cycle)
     - Request validation period extension (requires eng manager approval)

3. **Commit gap documentation:**
   ```powershell
   git commit -m "ops(telemetry): Day 1 capture MISSED (Criterion #3 gap documented)"
   ```

---

## 📋 **CONSTITUTIONAL REMINDERS**

- ✅ **Append-only:** No retroactive edits to previous days
- ✅ **Sequential:** Day 1 → Day 2 → ... → Day 7 (no gaps)
- ✅ **Same-day commit:** Evidence captured and committed same day
- ✅ **No nulls:** Prometheus export must have real values
- ✅ **Stop and fix:** Pre-flight failures must be resolved before capture

---

## 📞 **QUICK HELP**

| Issue | Solution |
|-------|----------|
| Services won't start | `.\scripts\start-day1-services.ps1 -Force` |
| Pre-flight fails | Review error messages, fix, re-run verification |
| Prometheus queries empty | Verify Prometheus scraping targets, wait for data |
| Dashboard not loading | Check Grafana logs: `docker-compose logs grafana` |
| Missed window | Document gap in log, commit documentation |

---

## ✅ **DAY 1 COMPLETION CHECKLIST**

- [ ] Morning prep complete (services started + verified)
- [ ] Final pre-flight PASS (14:55 PST check)
- [ ] Capture script executed (15:00-15:59 PST)
- [ ] Dashboard screenshot captured (no placeholder)
- [ ] Prometheus export filled (no nulls)
- [ ] SLO log updated (no "Pending")
- [ ] Atomic commit created (3 files)
- [ ] Pushed to remote
- [ ] Post-capture verification PASS

**All checkboxes ✅ → Day 1 COMPLETE → Proceed to Day 2 tomorrow**

---

*Government. Transcended. Day 1 execution zero friction.*
