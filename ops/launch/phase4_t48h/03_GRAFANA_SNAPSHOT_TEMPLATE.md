# Grafana Snapshot Template — Phase 4 Evidence

**Purpose:** Capture system state at key checkpoints for audit trail  
**Snapshots Required:** 6 total (T+47h, T+48h, T+60h, T+72h, T+84h, T+96h)

---

## 📸 SNAPSHOT SCHEDULE

| Time | Purpose | Filename | Status |
|------|---------|----------|--------|
| **T+47h** | Pre-gate validation | `grafana_snapshot_T47h_YYYY-MM-DD_HH-mm.json` | ⬜ |
| **T+48h** | GO decision evidence | `grafana_snapshot_T48h_YYYY-MM-DD_HH-mm.json` | ⬜ |
| **T+60h** | 12h checkpoint | `grafana_snapshot_T60h_YYYY-MM-DD_HH-mm.json` | ⬜ |
| **T+72h** | 24h checkpoint | `grafana_snapshot_T72h_YYYY-MM-DD_HH-mm.json` | ⬜ |
| **T+84h** | 36h checkpoint | `grafana_snapshot_T84h_YYYY-MM-DD_HH-mm.json` | ⬜ |
| **T+96h** | Phase 5 gate | `grafana_snapshot_T96h_YYYY-MM-DD_HH-mm.json` | ⬜ |

---

## 🎯 REQUIRED DASHBOARDS

**Each snapshot must capture these 5 dashboards:**

### 1. TerraFusion Resilience Index (RI) — System View

**URL:** `http://grafana:3000/d/ri-system`

**Key Panels:**
- System RI (weighted average)
- F1 RI (retry budget)
- F2 RI (circuit breaker)
- F4 RI (Redis pool)
- Error rate breakdown
- Latency distribution (p50, p95, p99)

**Export Time Range:** Last 48 hours

---

### 2. F2 Circuit Breaker Health

**URL:** `http://grafana:3000/d/f2-circuit-breaker`

**Key Panels:**
- Circuit breaker state (closed/open/half-open)
- Recovery time (p95)
- State transitions (flap rate)
- Error rate (5xx)
- Ejection events

**Export Time Range:** Last 48 hours

---

### 3. RS256 Migration Progress

**URL:** `http://grafana:3000/d/rs256-migration`

**Key Panels:**
- Adoption rate (%)
- Total clients (HS256 vs RS256)
- Auth errors (rate over time)
- Token verification latency
- JWKS fetch rate

**Export Time Range:** Last 48 hours

---

### 4. Alert Health Dashboard

**URL:** `http://grafana:3000/d/alert-health`

**Key Panels:**
- Firing alerts (count)
- Alert fidelity (false positive rate)
- Alert latency (detection time)
- Resolved alerts (MTTR)

**Export Time Range:** Last 48 hours

---

### 5. System Health Overview

**URL:** `http://grafana:3000/d/system-health`

**Key Panels:**
- Deployment status (ready replicas)
- Pod restarts (last 24h)
- Node resources (CPU, memory)
- Network I/O
- Disk usage

**Export Time Range:** Last 24 hours

---

## 🛠️ MANUAL EXPORT (Grafana UI)

**Steps for each dashboard:**

1. **Open Grafana Dashboard**
   - Navigate to dashboard URL
   - Set time range (last 48h or 24h)

2. **Create Snapshot**
   - Click "Share" icon (top-right)
   - Select "Snapshot" tab
   - Set "Snapshot name": `{Dashboard Name} - T+{Time}`
   - Set "Expire": `Never` (or 90 days)
   - Click "Publish to snapshots.raintank.io" (or local)

3. **Save Snapshot JSON**
   - Copy snapshot URL
   - Download snapshot JSON via API:
     ```powershell
     curl.exe -s "{snapshot_url}.json" > ops/evidence/T+48h_gate/grafana_snapshot_T48h_{dashboard_name}.json
     ```

4. **Verify Snapshot**
   - Open saved JSON file
   - Confirm panels rendered
   - Confirm time range correct

---

## 🤖 AUTOMATED EXPORT (API)

**Prerequisites:**
- Grafana API key with "Viewer" role
- `jq` installed for JSON parsing

**Script:** `ops/scripts/capture_grafana_snapshots.ps1`

```powershell
# capture_grafana_snapshots.ps1
param(
    [Parameter(Mandatory=$true)]
    [string]$Checkpoint,  # e.g., "T47h", "T48h", "T60h"
    
    [Parameter(Mandatory=$false)]
    [string]$GrafanaUrl = "http://grafana:3000",
    
    [Parameter(Mandatory=$false)]
    [string]$ApiKey = $env:GRAFANA_API_KEY
)

$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$evidenceDir = "ops/evidence/T+48h_gate"

# Ensure evidence directory exists
New-Item -ItemType Directory -Force -Path $evidenceDir | Out-Null

# Dashboard IDs to snapshot
$dashboards = @(
    @{ id = "ri-system"; name = "RI_System_View" },
    @{ id = "f2-circuit-breaker"; name = "F2_Circuit_Breaker" },
    @{ id = "rs256-migration"; name = "RS256_Migration" },
    @{ id = "alert-health"; name = "Alert_Health" },
    @{ id = "system-health"; name = "System_Health" }
)

foreach ($dashboard in $dashboards) {
    Write-Output "Capturing snapshot: $($dashboard.name) - $Checkpoint"
    
    # Get dashboard JSON
    $dashboardJson = curl.exe -s -H "Authorization: Bearer $ApiKey" `
        "$GrafanaUrl/api/dashboards/uid/$($dashboard.id)"
    
    # Create snapshot
    $snapshotPayload = @{
        dashboard = ($dashboardJson | ConvertFrom-Json).dashboard
        name = "$($dashboard.name) - $Checkpoint - $timestamp"
        expires = 0  # Never expire
    } | ConvertTo-Json -Depth 10
    
    $snapshotResponse = curl.exe -s -X POST `
        -H "Authorization: Bearer $ApiKey" `
        -H "Content-Type: application/json" `
        -d $snapshotPayload `
        "$GrafanaUrl/api/snapshots"
    
    # Save snapshot URL
    $snapshotUrl = ($snapshotResponse | ConvertFrom-Json).url
    $snapshotFile = "$evidenceDir/grafana_snapshot_${Checkpoint}_$($dashboard.name)_$timestamp.json"
    
    # Download snapshot JSON
    curl.exe -s "$snapshotUrl.json" > $snapshotFile
    
    Write-Output "✅ Saved: $snapshotFile"
    Write-Output "   URL: $snapshotUrl"
}

Write-Output ""
Write-Output "All snapshots captured for $Checkpoint"
```

**Usage:**

```powershell
# Set Grafana API key (do this once)
$env:GRAFANA_API_KEY = "your_api_key_here"

# Capture T+47h snapshots
pwsh ops/scripts/capture_grafana_snapshots.ps1 -Checkpoint "T47h"

# Capture T+48h snapshots
pwsh ops/scripts/capture_grafana_snapshots.ps1 -Checkpoint "T48h"
```

---

## ✅ SNAPSHOT VALIDATION

**After capturing each snapshot, verify:**

```powershell
# Check snapshot files exist
$checkpoint = "T47h"  # or T48h, T60h, etc.
$evidenceDir = "ops/evidence/T+48h_gate"

Get-ChildItem "$evidenceDir/grafana_snapshot_${checkpoint}_*.json" | ForEach-Object {
    $file = $_
    $json = Get-Content $file | ConvertFrom-Json
    
    $panelCount = $json.dashboard.panels.Count
    $timeRange = $json.dashboard.time
    
    Write-Output "File: $($file.Name)"
    Write-Output "  Panels: $panelCount"
    Write-Output "  Time Range: $($timeRange.from) → $($timeRange.to)"
    Write-Output "  Status: $(if ($panelCount -gt 0) { '✅ Valid' } else { '❌ Invalid' })"
    Write-Output ""
}
```

---

## 📊 SNAPSHOT COMPARISON

**Compare snapshots across checkpoints to track trends:**

```powershell
# Compare System RI across checkpoints
$checkpoints = @("T47h", "T48h", "T60h", "T72h", "T84h", "T96h")

foreach ($checkpoint in $checkpoints) {
    $snapshotFile = Get-ChildItem "ops/evidence/T+48h_gate/grafana_snapshot_${checkpoint}_RI_System_*.json" | Select-Object -First 1
    
    if ($snapshotFile) {
        $json = Get-Content $snapshotFile | ConvertFrom-Json
        
        # Extract System RI panel data (adjust panel ID as needed)
        $riPanel = $json.dashboard.panels | Where-Object { $_.title -match "System RI" }
        
        Write-Output "$checkpoint: System RI = {extract_value_from_panel}"
    } else {
        Write-Output "$checkpoint: Snapshot not found"
    }
}
```

---

## 🔄 AUTOMATED SCHEDULE (Cron)

**Add to crontab for automatic snapshot capture:**

```bash
# T+60h (12h after gate)
0 18 8 10 * cd /path/to/terrafusion_os_1.0 && pwsh ops/scripts/capture_grafana_snapshots.ps1 -Checkpoint "T60h"

# T+72h (24h after gate)
0 6 9 10 * cd /path/to/terrafusion_os_1.0 && pwsh ops/scripts/capture_grafana_snapshots.ps1 -Checkpoint "T72h"

# T+84h (36h after gate)
0 18 9 10 * cd /path/to/terrafusion_os_1.0 && pwsh ops/scripts/capture_grafana_snapshots.ps1 -Checkpoint "T84h"

# T+96h (48h after gate, Phase 5 gate)
0 6 10 10 * cd /path/to/terrafusion_os_1.0 && pwsh ops/scripts/capture_grafana_snapshots.ps1 -Checkpoint "T96h"
```

---

## 📚 REFERENCES

- **Grafana API Documentation:** https://grafana.com/docs/grafana/latest/http_api/
- **Snapshot API:** https://grafana.com/docs/grafana/latest/http_api/snapshot/
- **Dashboard Export:** https://grafana.com/docs/grafana/latest/dashboards/export-import/

---

## 📝 COMPLETION CHECKLIST

**After T+96h (Phase 5 gate):**

- ⬜ All 6 snapshots captured
- ⬜ All 5 dashboards per snapshot
- ⬜ Snapshot URLs recorded
- ⬜ Snapshot JSONs saved to `ops/evidence/T+48h_gate/`
- ⬜ Trend analysis completed (System RI, adoption rate, error rate)
- ⬜ Evidence package zipped: `ops/evidence/T+48h_gate.zip`
- ⬜ Evidence uploaded to audit storage (S3/Azure Blob)

**Total Expected Files:** 30 snapshots (6 checkpoints × 5 dashboards)

---

**Template Version:** 1.0  
**Last Updated:** October 7, 2025 — T+36h  
**Owner:** SRE Team
