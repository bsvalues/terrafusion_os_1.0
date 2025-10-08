# Phase 5 Grafana Snapshot Template (T+96h)

**Purpose:** Capture system state at key checkpoints during Phase 5 (HS256 deprecation)  
**Duration:** T+95h → T+144h (48 hours)  
**Snapshots:** 4 total (pre-gate, post-launch, mid-soak, completion)

---

## 📅 Snapshot Schedule

| Checkpoint | Time | Purpose | Filename | Status |
|------------|------|---------|----------|--------|
| **T+95h** | Oct 10, 05:42 UTC | Pre-gate validation | `grafana_T95h_*.json` | ☐ Captured |
| **T+96h** | Oct 10, 06:42 UTC | Post-launch verification | `grafana_T96h_post_*.json` | ☐ Captured |
| **T+120h** | Oct 11, 06:42 UTC | Mid-soak (24h after launch) | `grafana_T120h_*.json` | ☐ Captured |
| **T+144h** | Oct 12, 06:42 UTC | Phase 5 completion | `grafana_T144h_*.json` | ☐ Captured |

**Total Snapshots:** 4 checkpoints × 5 dashboards = **20 snapshot files**

---

## 📊 Required Dashboards (Per Checkpoint)

### 1. TerraFusion RI System View
**URL:** `http://localhost:3000/d/terrafusion-ri-system/`  
**Time Range:** Last 6 hours

**Key Panels:**
- System RI (gauge + line chart)
- F1 RI (Property Search reliability)
- F2 RI (Circuit Breaker reliability)
- F4 RI (Redis Cache reliability)
- Error rates by component
- Request latency distribution (p50, p95, p99)

**Why:** Monitor overall system reliability during HS256 deprecation

---

### 2. RS256 Migration Progress
**URL:** `http://localhost:3000/d/rs256-migration/`  
**Time Range:** Last 48 hours

**Key Panels:**
- RS256 adoption % (line chart)
- HS256 vs RS256 auth attempts (stacked bar chart)
- Auth errors by type (table)
- Token verification latency (p95)
- Migration timeline (annotations)
- Legacy client detection (table)

**Why:** Validate 100% RS256 adoption, detect legacy clients

---

### 3. Auth Service Health
**URL:** `http://localhost:3000/d/auth-service-health/`  
**Time Range:** Last 6 hours

**Key Panels:**
- Auth service pod status (gauge)
- Auth requests/sec (line chart)
- Auth errors/sec (line chart)
- Token generation latency (p95)
- JWKS endpoint response time (p95)
- Auth service CPU/memory usage

**Why:** Ensure auth service stability after HS256 deprecation

---

### 4. Alert Health Dashboard
**URL:** `http://localhost:3000/d/alert-health/`  
**Time Range:** Last 24 hours

**Key Panels:**
- Firing alerts (current state)
- Alert history (timeline)
- False positive rate (gauge)
- Alert detection latency (p95)
- MTTR (mean time to resolution)
- Alert fidelity score

**Why:** Confirm zero critical alerts during Phase 5

---

### 5. System Health Overview
**URL:** `http://localhost:3000/d/system-health-overview/`  
**Time Range:** Last 6 hours

**Key Panels:**
- Deployments (timeline)
- Pod restarts (count)
- CPU/memory by namespace
- Network throughput
- Disk I/O
- Database connections

**Why:** Detect any infrastructure issues during Phase 5

---

## 🔧 Manual Export (Grafana UI)

**For each dashboard:**

1. Open dashboard in Grafana (`http://localhost:3000`)
2. Click **Share** icon (top-right)
3. Click **Snapshot** tab
4. Set **Snapshot name:** `T95h_RI_System_View` (example)
5. Set **Expire:** `Never`
6. Click **Publish to snapshots.raintank.io** OR **Local Snapshot**
7. Click **Copy Link** (save URL)
8. Download JSON: Click **View snapshot** → **Dashboard JSON** → Save

**Save to:** `evidence/phase5/grafana_T95h/[dashboard_name].json`

**Repeat for all 5 dashboards at each checkpoint.**

---

## 🤖 Automated Export (PowerShell Script)

**Script:** `ops/scripts/capture_grafana_snapshots.ps1`

### Usage

```powershell
# Capture T+95h snapshots (pre-gate)
pwsh ops/scripts/capture_grafana_snapshots.ps1 -Checkpoint "T95h"

# Capture T+96h snapshots (post-launch)
pwsh ops/scripts/capture_grafana_snapshots.ps1 -Checkpoint "T96h_post"

# Capture T+120h snapshots (mid-soak)
pwsh ops/scripts/capture_grafana_snapshots.ps1 -Checkpoint "T120h"

# Capture T+144h snapshots (completion)
pwsh ops/scripts/capture_grafana_snapshots.ps1 -Checkpoint "T144h"
```

### Script Logic

```powershell
param(
    [Parameter(Mandatory=$true)]
    [string]$Checkpoint,
    
    [string]$GrafanaUrl = "http://localhost:3000",
    
    [string]$ApiKey = $env:GRAFANA_API_KEY
)

$dashboards = @(
    @{name="RI_System_View"; uid="terrafusion-ri-system"},
    @{name="RS256_Migration_Progress"; uid="rs256-migration"},
    @{name="Auth_Service_Health"; uid="auth-service-health"},
    @{name="Alert_Health"; uid="alert-health"},
    @{name="System_Health_Overview"; uid="system-health-overview"}
)

$outputDir = "evidence/phase5/grafana_$Checkpoint"
New-Item -ItemType Directory -Path $outputDir -Force | Out-Null

foreach ($dashboard in $dashboards) {
    Write-Host "Creating snapshot: $Checkpoint_$($dashboard.name)"
    
    $snapshotPayload = @{
        dashboard = (Invoke-RestMethod -Uri "$GrafanaUrl/api/dashboards/uid/$($dashboard.uid)" -Headers @{Authorization="Bearer $ApiKey"}).dashboard
        name = "$Checkpoint_$($dashboard.name)"
        expires = 0
    } | ConvertTo-Json -Depth 10
    
    $snapshot = Invoke-RestMethod -Uri "$GrafanaUrl/api/snapshots" -Method Post -Body $snapshotPayload -ContentType "application/json" -Headers @{Authorization="Bearer $ApiKey"}
    
    $snapshotUrl = $snapshot.url
    $snapshotId = $snapshot.id
    
    $snapshot | ConvertTo-Json -Depth 10 | Out-File "$outputDir/$($dashboard.name).json"
    
    Write-Host "✅ Saved: $outputDir/$($dashboard.name).json (ID: $snapshotId)"
}

Write-Host "`n📸 Snapshot capture complete: $Checkpoint"
Write-Host "📁 Location: $outputDir"
Write-Host "📊 Files: $(Get-ChildItem $outputDir | Measure-Object).Count"
```

---

## 🔍 Snapshot Validation

**After each snapshot capture:**

1. **Check File Count**
   ```powershell
   Get-ChildItem evidence/phase5/grafana_T95h | Measure-Object
   ```
   **Expected:** 5 files

2. **Validate JSON Structure**
   ```powershell
   foreach ($file in Get-ChildItem evidence/phase5/grafana_T95h/*.json) {
       $json = Get-Content $file | ConvertFrom-Json
       if ($json.dashboard.panels.Count -gt 0) {
           Write-Host "✅ $($file.Name): $($json.dashboard.panels.Count) panels"
       } else {
           Write-Host "❌ $($file.Name): No panels found"
       }
   }
   ```

3. **Check Time Range**
   ```powershell
   # Verify snapshots captured correct time range
   # (Panels should show data from T+95h ± 3h)
   ```

---

## 📈 Snapshot Comparison (Cross-Checkpoint Analysis)

**Compare key metrics across checkpoints:**

### System RI Trend

| Checkpoint | System RI | F1 RI | F2 RI | F4 RI |
|------------|-----------|-------|-------|-------|
| T+95h (pre) | ______ | ______ | ______ | ______ |
| T+96h (post) | ______ | ______ | ______ | ______ |
| T+120h (+24h) | ______ | ______ | ______ | ______ |
| T+144h (+48h) | ______ | ______ | ______ | ______ |

**Expected:** RI stable or increasing (±0.002 tolerance)

### RS256 Adoption Curve

| Checkpoint | RS256 % | HS256 Attempts | Auth Errors |
|------------|---------|----------------|-------------|
| T+95h (pre) | ____% | ______ | ______ |
| T+96h (post) | ____% | ______ | ______ |
| T+120h (+24h) | 100% | 0 | 0 |
| T+144h (+48h) | 100% | 0 | 0 |

**Expected:** 100% RS256 by T+100h, 0 HS256 attempts thereafter

### Auth Error Rate

| Checkpoint | Errors/h | Error Types | Impact |
|------------|----------|-------------|--------|
| T+95h (pre) | ______ | ______ | ______ |
| T+96h (post) | ______ | ______ | ______ |
| T+120h (+24h) | ≤1 | (none) | None |
| T+144h (+48h) | ≤1 | (none) | None |

**Expected:** Errors <1/h after T+100h (all clients migrated)

---

## ⏰ Automated Snapshot Schedule (Cron Jobs)

**Add to crontab (Linux) or Task Scheduler (Windows):**

```bash
# T+95h: Pre-gate snapshot (October 10, 2025 — 05:42 UTC)
42 5 10 10 * pwsh /path/to/ops/scripts/capture_grafana_snapshots.ps1 -Checkpoint "T95h"

# T+96h: Post-launch snapshot (October 10, 2025 — 06:42 UTC)
42 6 10 10 * pwsh /path/to/ops/scripts/capture_grafana_snapshots.ps1 -Checkpoint "T96h_post"

# T+120h: Mid-soak snapshot (October 11, 2025 — 06:42 UTC)
42 6 11 10 * pwsh /path/to/ops/scripts/capture_grafana_snapshots.ps1 -Checkpoint "T120h"

# T+144h: Completion snapshot (October 12, 2025 — 06:42 UTC)
42 6 12 10 * pwsh /path/to/ops/scripts/capture_grafana_snapshots.ps1 -Checkpoint "T144h"
```

**Note:** Adjust month (10) and paths to match your environment.

---

## 📦 Evidence Package Creation

**After all 4 checkpoints complete (T+144h):**

```powershell
# Navigate to evidence directory
cd evidence/phase5

# Create compressed archive
tar -czf phase5_grafana_snapshots_complete.tar.gz grafana_T95h/ grafana_T96h_post/ grafana_T120h/ grafana_T144h/

# Calculate checksum
Get-FileHash phase5_grafana_snapshots_complete.tar.gz -Algorithm SHA256

# Verify archive contents
tar -tzf phase5_grafana_snapshots_complete.tar.gz | Select-String ".json" | Measure-Object
```

**Expected:** 20 JSON files (4 checkpoints × 5 dashboards)

**Store archive:** `evidence/phase5/phase5_grafana_snapshots_complete.tar.gz`  
**Checksum:** `______________________________________`

---

## ✅ Completion Checklist

- [ ] **T+95h snapshot captured** (5 dashboards)
  - [ ] RI System View
  - [ ] RS256 Migration Progress
  - [ ] Auth Service Health
  - [ ] Alert Health
  - [ ] System Health Overview

- [ ] **T+96h snapshot captured** (5 dashboards)
  - [ ] RI System View
  - [ ] RS256 Migration Progress
  - [ ] Auth Service Health
  - [ ] Alert Health
  - [ ] System Health Overview

- [ ] **T+120h snapshot captured** (5 dashboards)
  - [ ] RI System View
  - [ ] RS256 Migration Progress
  - [ ] Auth Service Health
  - [ ] Alert Health
  - [ ] System Health Overview

- [ ] **T+144h snapshot captured** (5 dashboards)
  - [ ] RI System View
  - [ ] RS256 Migration Progress
  - [ ] Auth Service Health
  - [ ] Alert Health
  - [ ] System Health Overview

- [ ] **Snapshot comparison analysis complete**
  - [ ] System RI trend stable/increasing
  - [ ] RS256 adoption 100%
  - [ ] Auth errors <1/h sustained
  - [ ] Zero HS256 attempts after T+100h

- [ ] **Evidence package created**
  - [ ] Archive: `phase5_grafana_snapshots_complete.tar.gz`
  - [ ] Checksum calculated (SHA256)
  - [ ] 20 JSON files verified
  - [ ] Archive uploaded to evidence repository

---

## 📚 Supporting Documentation

- **Snapshot Script:** `ops/scripts/capture_grafana_snapshots.ps1`
- **Phase 5 Checklist:** `ops/launch/phase5_t96h/01_PRE_GATE_CHECKLIST.md`
- **GO/NO-GO Form:** `ops/launch/phase5_t96h/02_GO_NO_GO_FORM.md`
- **Grafana Dashboards:** `http://localhost:3000/dashboards`
- **Evidence Archive:** `evidence/phase5/`

---

**Snapshots Complete:** ☐ Yes ☐ No  
**Analysis Complete:** ☐ Yes ☐ No  
**Archive Created:** ☐ Yes ☐ No

**Phase 5 Evidence Trail: Complete ✅**
