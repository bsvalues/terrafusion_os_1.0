# Confidence Dashboard — Quick Start Guide

**Goal:** Import Confidence Gradient Dashboard into Grafana (2-minute setup)

---

## 🚀 Option 1: Grafana Already Running

**If you already have Grafana running** (check: http://localhost:3000):

### Step 1: Set API Key

```powershell
# Get API key from Grafana UI:
# Grafana UI → Administration → API Keys → New API Key
# Name: "dashboard-import", Role: Editor

$env:GRAFANA_API_KEY = "your_api_key_here"
```

### Step 2: Import Dashboard

```powershell
pwsh ops/scripts/import_grafana_dashboard.ps1
```

**Output:** Dashboard URL → Click to open

---

## 🔧 Option 2: Start Monitoring Stack First

**If Grafana is NOT running:**

### Step 1: Start Monitoring Stack

```powershell
# Start Prometheus + Grafana
pwsh scripts/start-monitoring.ps1
```

**Wait 30 seconds for services to start.**

### Step 2: Verify Running

```powershell
# Check Grafana health
curl http://localhost:3000/api/health
```

**Expected:** `{"commit":"...", "database":"ok", "version":"..."}`

### Step 3: Get Default Credentials

**From documentation, default credentials are:**

- **URL:** http://localhost:3000
- **Username:** `admin`
- **Password:** `terrafusion2025` (or `admin` for first login, then change)

### Step 4: Manual Import (Easiest)

1. Open browser: http://localhost:3000
2. Login: `admin` / `terrafusion2025`
3. Click **+ (Create)** → **Import**
4. Click **Upload JSON file**
5. Select: `ops/observability/grafana-dashboards/confidence-gradient.json`
6. Select datasource: **Prometheus** (should auto-detect)
7. Click **Import**

**Done!** Dashboard is now available.

---

## 📊 Option 3: Simulated Dashboard (No Grafana Required)

**If you want to see what the dashboard WOULD show** (without Grafana):

### Generate Preview

```powershell
# Query current adoption rate
$adoption = psql -d terrafusion_db -t -c "
  SELECT 
    COALESCE(
      (COUNT(*) FILTER (WHERE auth_method = 'RS256')::float / NULLIF(COUNT(*), 0)::float) * 100,
      0
    )
  FROM auth_audit
  WHERE created_at > NOW() - INTERVAL '1 hour'
"

Write-Host "Current RS256 Adoption: $($adoption.Trim())%"

# Calculate slope (adoption rate change over last 6 hours)
psql -d terrafusion_db -t -c "
  WITH hourly_adoption AS (
    SELECT 
      date_trunc('hour', created_at) as hour,
      (COUNT(*) FILTER (WHERE auth_method = 'RS256')::float / NULLIF(COUNT(*), 0)::float) * 100 as rate
    FROM auth_audit
    WHERE created_at > NOW() - INTERVAL '6 hours'
    GROUP BY date_trunc('hour', created_at)
    ORDER BY hour
  )
  SELECT 
    'Slope: ' || ROUND((MAX(rate) - MIN(rate)) / 6.0, 2) || '%/hour' as adoption_slope
  FROM hourly_adoption
"

# Project T+12h
psql -d terrafusion_db -t -c "
  WITH current_adoption AS (
    SELECT 
      (COUNT(*) FILTER (WHERE auth_method = 'RS256')::float / NULLIF(COUNT(*), 0)::float) * 100 as rate
    FROM auth_audit
    WHERE created_at > NOW() - INTERVAL '1 hour'
  ),
  slope AS (
    SELECT 
      (MAX(rate) - MIN(rate)) / 6.0 as slope_per_hour
    FROM (
      SELECT 
        date_trunc('hour', created_at) as hour,
        (COUNT(*) FILTER (WHERE auth_method = 'RS256')::float / NULLIF(COUNT(*), 0)::float) * 100 as rate
      FROM auth_audit
      WHERE created_at > NOW() - INTERVAL '6 hours'
      GROUP BY date_trunc('hour', created_at)
    ) hourly
  )
  SELECT 
    'Projected T+12h: ' || ROUND(c.rate + (s.slope_per_hour * 12), 2) || '%'
  FROM current_adoption c, slope s
"
```

**This gives you the same information the dashboard would show**, just in terminal output.

---

## ✅ Verification

**After dashboard import, verify it's working:**

### Check Metric Exists

```powershell
# Query Prometheus
curl "http://localhost:9090/api/v1/query?query=rs256_adoption_rate"
```

**Expected:** JSON response with metric value

**If metric missing:**

```bash
# Set up hourly metric push
bash ops/scripts/push_adoption_metric.sh

# Add to cron (Linux/WSL) or Task Scheduler (Windows)
```

### View Dashboard

1. Open: http://localhost:3000
2. Navigate to: **Dashboards** → **Confidence Gradient — RS256 Migration**
3. Verify panels populate with data

**If panels empty:**
- **Panel 1 (Adoption Curve):** Needs `rs256_adoption_rate` metric in Prometheus
- **Panel 2 (Slope):** Calculated from Panel 1 (needs 6h history)
- **Panel 3 (Countdown):** Works immediately (uses current time)
- **Panel 4 (Current %):** Needs `rs256_adoption_rate` metric

---

## 🎯 Decision Logic

**Dashboard shows GO/NO-GO automatically:**

| Current Adoption | Slope | Projected T+12h | Decision |
|------------------|-------|-----------------|----------|
| ≥95% | ≥1.5%/h | ≥97% | ✅ GO (high confidence) |
| 90-95% | ≥1.5%/h | ≥95% | ✅ GO (medium confidence) |
| 90-95% | 1.0-1.5%/h | 92-95% | ⚠️ MONITOR (extend soak) |
| <90% | <1.0%/h | <95% | ❌ NO-GO (investigate) |

**Panel 5 (GO/NO-GO Matrix)** shows ✅/❌ automatically based on these thresholds.

---

## 🔧 Troubleshooting

### Issue: Grafana not starting

```powershell
# Check Docker
docker ps | Select-String "grafana"

# Start manually
docker run -d -p 3000:3000 --name grafana grafana/grafana-oss:latest

# Check logs
docker logs grafana
```

### Issue: Dashboard import fails

**Error:** "Invalid JSON"

**Fix:** Validate JSON syntax:

```powershell
Get-Content ops/observability/grafana-dashboards/confidence-gradient.json | ConvertFrom-Json
```

**Error:** "Datasource not found"

**Fix:** Add Prometheus datasource first:
1. Grafana UI → **Configuration** → **Data Sources** → **Add data source**
2. Select **Prometheus**
3. URL: `http://localhost:9090` (or `http://prometheus:9090` if in Docker network)
4. Click **Save & test**

### Issue: Panels show "No data"

**Fix:** Check if metric exists in Prometheus:

```powershell
curl "http://localhost:9090/api/v1/query?query=rs256_adoption_rate"
```

**If missing:** Run `bash ops/scripts/push_adoption_metric.sh` to push initial metric.

---

## 📝 Summary

**Three paths to success:**

1. **Full Import (Recommended):** Start monitoring stack → Manual JSON import (2 minutes)
2. **API Import:** Use PowerShell script (requires API key)
3. **Manual Queries:** Get same info via SQL (no Grafana needed)

**Observation Mode Philosophy:**

- This is **optional telemetry** during T+36h → T+48h
- Zero risk (read-only, no production changes)
- Provides **visual confidence proof** before T+48h gate
- If Grafana doesn't work → use SQL queries (Option 3)

**The gate will succeed regardless** — dashboard just makes confidence visible. 🎯
