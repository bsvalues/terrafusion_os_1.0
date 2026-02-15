# Day 1 Execution Plan — Network-Blocked Scenario
## TerraFusion OS SLO Burn Capture (Criterion #3: 1/7)

**Date:** 2026-02-15 (Saturday)
**Network Status:** TCP 80/443 blocked (offline-authorized execution)
**Protocol Status:** LOCKED — Window enforcement operational

---

## ⏰ TIMELINE (PST)

| Time | Activity | Duration | Gate |
|------|----------|----------|------|
| **09:00** | Morning prep | 15 min | Prestart verification |
| 09:00-14:55 | Standby | ~6 hours | Services running |
| **14:55** | Final prep | 5 min | Clock check, services health |
| **15:00-15:59** | **CAPTURE WINDOW** | **59 min** | **CONSTITUTIONAL** |
| 15:00 | Run capture script | 1 min | Creates placeholders |
| 15:01-15:50 | Fill evidence manually | ~50 min | Screenshot + Prometheus |
| 15:51-15:58 | Atomic commit (triad) | 7 min | Exactly 3 files |
| 15:59 | Immutability check | 1 min | Bundle backup created |
| **16:00** | Post-capture verification | 5 min | Evidence validation |

**Total window utilization:** 59 minutes (maximum allowed)

---

## 📋 MORNING PREP CHECKLIST (09:00 PST)

### 1. System Clock Verification
```powershell
Get-Date -Format "yyyy-MM-dd HH:mm:ss K"
```
**Expected:** `2026-02-15 09:00:xx -08:00` (PST timezone)  
**Critical:** Window timing depends on accurate clock

### 2. Service Status
```powershell
docker ps --filter "name=terrafusion-grafana" --filter "name=terrafusion-prometheus"
```
**Expected:**
- `terrafusion-grafana` - Up X hours (port 3000)
- `terrafusion-prometheus` - Up X hours (port 9090)

**If stopped:** Services have auto-restart enabled, but verify:
```powershell
docker start terrafusion-grafana terrafusion-prometheus
Start-Sleep -Seconds 15
```

### 3. Service Health
```powershell
# Grafana
curl http://localhost:3000/-/healthy
# Expected: HTTP 200 or "Ok"

# Prometheus
curl http://localhost:9090/-/healthy
# Expected: HTTP 200 or "Ok"
```

### 4. Prestart Verification
```powershell
.\scripts\verify-day1-prestart.ps1
```
**Expected:** 8/9 checks passing (API check fails - acceptable)

**Decision Point:**
- ✅ 8/9 passing → PROCEED to capture window
- ❌ <8 passing → STOP and fix (services down, script missing, etc.)

---

## ⏰ PRE-CAPTURE PREP (14:55 PST)

**5 minutes before window opens:**

### Final Sanity Checks
```powershell
# 1. Verify current time
Get-Date -Format "HH:mm:ss"
# Expected: ~14:55:xx

# 2. Confirm services still healthy
curl http://localhost:3000/-/healthy
curl http://localhost:9090/-/healthy

# 3. Verify working tree clean
git status --porcelain
# Expected: Empty (only untracked IDE files okay)

# 4. Open Grafana dashboard (ready for screenshot)
Start-Process "http://localhost:3000/d/slo-burn"
```

**Set timer:** 15:00:00 PST (capture window opens)

---

## 🎯 CAPTURE WINDOW (15:00-15:59 PST) — EXECUTE

### Phase 1: Run Capture Script (15:00-15:01)
```bash
node scripts/capture-daily-slo-burn.mjs --day=1
```

**Output:**
- Creates `slo-burn-day1.png` (placeholder)
- Creates `prometheus-day1.json` (template)
- Appends to `slo-tuning-log.md` (Day 1 row)

### Phase 2: Fill Evidence (15:01-15:50)

**Screenshot Capture:**
1. Navigate to: `http://localhost:3000/d/slo-burn`
2. Wait for dashboard to fully load
3. Screenshot entire dashboard view
4. Save as: `docs/deploy/rehearsals/evidence/week1/slo-burn-day1.png`
5. Replace placeholder file

**Prometheus Export:**
1. Navigate to: `http://localhost:9090`
2. Query SLO metrics (from capture script template)
3. Export results as JSON
4. **CRITICAL:** Verify no `null` values in JSON
5. Save as: `docs/deploy/rehearsals/evidence/week1/prometheus-day1.json`
6. Replace template file

**SLO Log Update:**
1. Open: `docs/ops/slo-tuning-log.md`
2. Find Day 1 row (2026-02-15)
3. Replace "Pending" with actual values from Prometheus
4. Add evidence file pointers
5. Save file

### Phase 3: Atomic Commit (15:51-15:58)

**Triad Verification:**
```bash
# Check working tree - must show ONLY these 3 files modified
git status --porcelain

# Expected output:
# M  docs/ops/slo-tuning-log.md
# M  docs/deploy/rehearsals/evidence/week1/slo-burn-day1.png
# M  docs/deploy/rehearsals/evidence/week1/prometheus-day1.json
```

**If extra files present:** STOP and clean working tree

**Commit (if triad valid):**
```bash
git add docs/ops/slo-tuning-log.md \
        docs/deploy/rehearsals/evidence/week1/slo-burn-day1.png \
        docs/deploy/rehearsals/evidence/week1/prometheus-day1.json

git commit -m "ops(telemetry): capture Day 1 SLO burn evidence (Criterion #3: 1/7)"
```

### Phase 4: Immutability Check (15:59)
```powershell
.\scripts\post-capture-immutability-check.ps1 -Day 1
```

**Expected:** Exit 0 (PASS)

**Output:**
- ✅ Triad atomicity verified
- ✅ Working tree clean
- ✅ Backup bundle created (`backups/day1.bundle`)
- ✅ Commit message validated

**If FAIL:** Fix violations immediately (within window if possible)

---

## ✅ POST-CAPTURE VERIFICATION (16:00 PST)

### Evidence Validation
```powershell
.\scripts\verify-day-capture.ps1 -Day 1
```

**Expected Results:**
- ✅ Dashboard screenshot exists (>0 bytes)
- ✅ Prometheus export exists (>0 bytes)
- ✅ Prometheus export has no nulls
- ✅ SLO log Day 1 row complete (no "Pending")
- ❌ Git commit not pushed (network blocked - expected)

### Network Push (If Available)
```bash
# Test connectivity first
curl -I https://github.com

# If successful (HTTP 200):
git push origin feature/phase4-sprint1-storage

# If failed (timeout/refused):
# Commit + bundle are safe locally
# Push when network restores
```

---

## 🔒 IMMUTABILITY GUARANTEES (Offline Mode)

**Active During Days 1-7:**

### Hard Rules (Zero Tolerance)
1. ❌ **NO REBASE** — Do not rebase Day 1-7 commits
2. ❌ **NO AMEND** — Do not amend commits after immutability check passes
3. ❌ **NO CHERRY-PICK** — Evidence commits remain in original sequence
4. ❌ **NO FORCE PUSH** — Push commits as-is when network restores
5. ✅ **BACKUP BUNDLE** — Created automatically, kept until push succeeds

### Chain-of-Custody Artifacts

**Bundle Location:** `backups/day1.bundle` (860MB)

**Restore Procedure (Disaster Recovery):**
```bash
# If local repo corrupted/lost before push
git clone backups/day1.bundle -b feature/phase4-sprint1-storage restored-repo
cd restored-repo
git push origin feature/phase4-sprint1-storage
```

**Bundle Verification:**
```bash
# Verify bundle integrity
git bundle verify backups/day1.bundle

# List bundle contents
git bundle list-heads backups/day1.bundle
```

---

## 📊 RISK MITIGATION

| Risk | Probability | Impact | Mitigation | Status |
|------|-------------|--------|------------|---------|
| Network still blocked | HIGH | LOW | Offline execution authorized | ✅ MITIGATED |
| Services crash during window | LOW | HIGH | Auto-restart enabled | ✅ MITIGATED |
| Disk failure before push | LOW | HIGH | Bundle backup created | ✅ MITIGATED |
| Evidence corruption | LOW | MEDIUM | Immutability check validates | ✅ MITIGATED |
| Missing capture window | MEDIUM | CRITICAL | Alarm set for 14:55 PST | ⏰ SCHEDULED |
| Null values in Prometheus | LOW | MEDIUM | Manual verification required | ⚠️ MANUAL |

---

## 🚨 FAILURE SCENARIOS & RECOVERY

### Scenario 1: Services Down at 15:00
**Symptom:** Grafana/Prometheus not responding  
**Action:**
```powershell
docker restart terrafusion-grafana terrafusion-prometheus
Start-Sleep -Seconds 30
curl http://localhost:3000/-/healthy
curl http://localhost:9090/-/healthy
```
**Timeline Impact:** ~2 minutes (still within window)

### Scenario 2: Null Values in Prometheus Export
**Symptom:** JSON contains `null` for SLO metrics  
**Action:**
- Wait 5 minutes for metrics to populate
- Re-query Prometheus
- Verify no nulls before saving
**Timeline Impact:** 5-10 minutes (acceptable within 59-minute window)

### Scenario 3: Triad Drift (Extra Files Staged)
**Symptom:** `git status` shows >3 modified files  
**Action:**
```bash
git reset
# Re-stage only the triad
git add docs/ops/slo-tuning-log.md \
        docs/deploy/rehearsals/evidence/week1/slo-burn-day1.png \
        docs/deploy/rehearsals/evidence/week1/prometheus-day1.json
git commit -m "ops(telemetry): capture Day 1 SLO burn evidence (Criterion #3: 1/7)"
```
**Timeline Impact:** ~1 minute

### Scenario 4: Window Missed Entirely
**Symptom:** Current time > 15:59:59 PST, no evidence captured  
**Action:**
- ❌ **DO NOT capture outside window**
- Document gap in evidence log
- Day 1 becomes Day 0 (restart 7-day sequence tomorrow)
- This is a **hard failure** — window is constitutional

---

## 📈 SUCCESS CRITERIA (Day 1 Complete)

**Required for Day 2 to proceed:**

1. ✅ Capture occurred inside window (15:00-15:59 PST)
2. ✅ Triad committed (exactly 3 files)
3. ✅ Immutability check passed (Exit 0)
4. ✅ Backup bundle created
5. ✅ No nulls in Prometheus export
6. ✅ SLO log Day 1 complete
7. ⏳ Git push (deferred until network restores)

**Criterion #3 Progress:** 1/7 days captured

---

## 🔄 DAY 2 CONTINUATION (2026-02-16)

**If network still blocked:**
- Repeat exact same procedure
- Capture window: 15:00-15:59 PST (same time daily)
- Creates `backups/day2.bundle`
- Push all commits when network restores (Day 1-7 as batch)

**If network restores:**
- Push all pending commits before Day 2 capture
- Continue normal (online) procedure

---

**Last Updated:** 2026-02-14 20:15 PST  
**Protocol Status:** LOCKED — Ready for Day 1 execution  
**Network Status:** Offline-authorized  
**Window Enforcement:** OPERATIONAL  
**Immutability Tools:** DEPLOYED
