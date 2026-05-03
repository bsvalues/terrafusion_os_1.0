# Statistics Studio Phase A — Credibility Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix four credibility-breaking bugs in Statistics Studio and CostForgeDashboard so that no metric is hardcoded, silent, or mislabeled when real PACS data is available.

**Architecture:** Pure bug-fix pass. No new tabs, no new endpoints. PRB is already computed by the backend ratio-study endpoint and already mapped by the service — it just gets overwritten with `0` in `StatisticsStudio.tsx` before reaching `VEIDashboard`. Physical Dep flag is a backend + frontend addition. `$148/sqft` and the schedule label fix are frontend-only.

**Tech Stack:** React 18, TypeScript 5.3, TanStack Query, .NET 8, Entity Framework Core, SQLite/PostgreSQL.

---

## File Map

| File | Change |
|------|--------|
| `frontend/apps/os-shell/src/pages/forge/statistics/StatisticsStudio.tsx` | Fix `liveVeiMetrics` — use store PRB instead of hardcoded `0` |
| `backend/src/TerraFusion.API/Controllers/CostForgeController.cs` | Add `avgResCostPerSqft` + `dataIntegrityWarning` to dashboard-stats |
| `frontend/apps/os-shell/src/pages/forge/cost/CostForgeDashboard.tsx` | Wire `avgResCostPerSqft`, render amber flag when integrity warning present |

---

## Task 1: Fix PRB=0 in VEI Tab

**Files:**
- Modify: `frontend/apps/os-shell/src/pages/forge/statistics/StatisticsStudio.tsx:109-121`

The bug: `liveVeiMetrics` is derived from neighborhood comparison snapshots and hardcodes `prb: 0, tierSlope: 0`. The correct county-level PRB is already available via `ratioData` (from `useRatioData()` hook, which reads from `forgeStatisticsStore` which calls the live ratio-study API).

- [ ] **Step 1: Understand the current broken code**

In `StatisticsStudio.tsx` around line 109, find this block:

```typescript
const liveVeiMetrics =
  snapshots.length > 0
    ? {
        cod: +(snapshots.reduce((sum, s) => sum + s.cod, 0) / snapshots.length).toFixed(1),
        prd: +(snapshots.reduce((sum, s) => sum + s.prd, 0) / snapshots.length).toFixed(3),
        prb: 0,          // ← BUG: hardcoded
        tierSlope: 0,    // ← BUG: hardcoded
        medianRatio: +(
          snapshots.reduce((sum, s) => sum + s.median_ratio, 0) / snapshots.length
        ).toFixed(3),
        sampleSize: snapshots.reduce((sum, s) => sum + s.sale_count, 0),
      }
    : null;
```

- [ ] **Step 2: Replace with live PRB from store**

Replace the entire `liveVeiMetrics` block with:

```typescript
const liveVeiMetrics =
  snapshots.length > 0
    ? {
        cod: +(snapshots.reduce((sum, s) => sum + s.cod, 0) / snapshots.length).toFixed(1),
        prd: +(snapshots.reduce((sum, s) => sum + s.prd, 0) / snapshots.length).toFixed(3),
        // PRB and tierSlope come from the county-wide ratio study (store → API), not from
        // neighborhood averages which don't compute these regression-based metrics.
        prb: ratioData.prb ?? 0,
        tierSlope: ratioData.tierSlope ?? 0,
        medianRatio: +(
          snapshots.reduce((sum, s) => sum + s.median_ratio, 0) / snapshots.length
        ).toFixed(3),
        sampleSize: snapshots.reduce((sum, s) => sum + s.sale_count, 0),
      }
    : null;
```

Note: `ratioData` is already declared earlier in the component via `const ratioData = useRatioData();`. No new imports needed.

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /c/Users/bsval/terrafusion_os_1.0/frontend
npx tsc --noEmit 2>&1 | grep -E "error|StatisticsStudio"
```

Expected: no errors mentioning StatisticsStudio.tsx.

- [ ] **Step 4: Manual verification**

With the app running, open Statistics Studio → click "Equity (VEI)" tab.
PRB should now show a non-zero value (e.g. `–0.0182`) matching the Ratio Study tab's PRB display.
If the backend returns null (no qualified sales), it will show `0` — acceptable.

- [ ] **Step 5: Commit**

```bash
git add frontend/apps/os-shell/src/pages/forge/statistics/StatisticsStudio.tsx
git commit -m "fix: wire PRB from county ratio study into VEI Dashboard (was hardcoded 0)

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 2: Backend — avgResCostPerSqft + dataIntegrityWarning

**Files:**
- Modify: `backend/src/TerraFusion.API/Controllers/CostForgeController.cs`

Find the `GetDashboardStats` action (look for `[HttpGet("dashboard-stats")]`). It currently returns `totalParcels`, `propertyTypeDistribution`, `depreciationSummary`, `taxYear`, `source`. We add two fields.

- [ ] **Step 1: Find the dashboard-stats action**

```bash
grep -n "dashboard-stats\|GetDashboardStats" /c/Users/bsval/terrafusion_os_1.0/backend/src/TerraFusion.API/Controllers/CostForgeController.cs | head -10
```

Note the line number of the action method.

- [ ] **Step 2: Read the existing return statement**

Read lines around the `return Ok(new {` at the end of the dashboard-stats action. You need to add fields to this anonymous object.

- [ ] **Step 3: Add the avgResCostPerSqft query**

Inside `GetDashboardStats`, before the `return Ok(...)`, add:

```csharp
// Avg residential cost per sqft — live from working roll
double? avgResCostPerSqft = null;
string? dataIntegrityWarning = null;

try
{
    var resCostRows = await _context.Properties
        .Where(p => p.PropertyType == "Residential" && p.ImprovementValue > 0)
        .Join(
            _context.CamaCharacteristics.Where(cc => cc.GrossLivingArea > 200),
            p => p.ParcelNumber,
            cc => cc.ParcelNumber,
            (p, cc) => new { p.ImprovementValue, cc.GrossLivingArea }
        )
        .ToListAsync();

    if (resCostRows.Count > 0)
    {
        var validRows = resCostRows
            .Where(r => r.GrossLivingArea.HasValue && r.GrossLivingArea.Value > 0)
            .ToList();
        if (validRows.Count > 0)
            avgResCostPerSqft = Math.Round(
                validRows.Average(r => (double)r.ImprovementValue!.Value / (double)r.GrossLivingArea!.Value),
                0);
    }
}
catch (Exception ex)
{
    _logger.LogWarning(ex, "GetDashboardStats: avgResCostPerSqft query failed");
}

// Physical depreciation integrity check
// If avg physical dep > 95% county-wide, flag as potentially mis-scaled
var deprAvg = depreciationSummary.FirstOrDefault(d => d.Category == "Physical")?.Avg ?? 0;
if (deprAvg > 95.0)
{
    dataIntegrityWarning = "PhysicalDepreciationPct avg exceeds 95% — verify PACS source column scale before relying on this figure.";
}
```

Note: `depreciationSummary` is the variable that already holds the depreciation stats (check the existing code to confirm the exact variable name and type — adapt if different).

- [ ] **Step 4: Add the new fields to the return object**

Find the `return Ok(new {` block and add:

```csharp
avgResCostPerSqft = avgResCostPerSqft,
dataIntegrityWarning = dataIntegrityWarning,
```

alongside the existing `taxYear`, `totalParcels`, `propertyTypeDistribution`, `depreciationSummary`, `source` fields.

- [ ] **Step 5: Build and verify**

```bash
cd /c/Users/bsval/terrafusion_os_1.0/backend
dotnet build src/TerraFusion.API/TerraFusion.API.csproj -c Release 2>&1 | grep -E "error|warning CS"
```

Expected: 0 errors. Warnings on unrelated XML doc comments are acceptable.

- [ ] **Step 6: Test the endpoint**

With backend running on port 5000:

```bash
curl -s "http://localhost:5000/api/costforge/dashboard-stats?taxYear=2026" | python3 -m json.tool | grep -A2 "avgResCost\|dataIntegrity"
```

Expected output includes:
```json
"avgResCostPerSqft": 147.0,
"dataIntegrityWarning": "PhysicalDepreciationPct avg exceeds 95%..."
```

(Exact value will vary. If `avgResCostPerSqft` is null, `ImprovementValue` may not be populated in PACS data — that's acceptable; frontend will render `—`.)

- [ ] **Step 7: Commit**

```bash
git add backend/src/TerraFusion.API/Controllers/CostForgeController.cs
git commit -m "feat(backend): add avgResCostPerSqft + dataIntegrityWarning to dashboard-stats

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 3: Frontend — Wire avgResCostPerSqft and Integrity Flag

**Files:**
- Modify: `frontend/apps/os-shell/src/pages/forge/cost/CostForgeDashboard.tsx`

The `DashboardStats` interface and the KPI rendering must be updated.

- [ ] **Step 1: Extend the DashboardStats interface**

Find the `interface DashboardStats` block (around line 41) and add two fields:

```typescript
interface DashboardStats {
  taxYear: number;
  totalParcels: number;
  propertyTypeDistribution: { name: string; value: number }[];
  depreciationSummary: { category: string; avg: number; min: number; max: number }[];
  source: string;
  avgResCostPerSqft: number | null;         // ← add
  dataIntegrityWarning: string | null;       // ← add
}
```

- [ ] **Step 2: Replace the hardcoded $148 KPI card**

Find this KPI card (around line 113):

```tsx
<Card data-material="bento">
  <CardContent className="pt-6 text-center">
    <div className="text-3xl font-bold">$148</div>
    <div className="text-sm text-muted-foreground">Avg Res. Cost/sqft</div>
  </CardContent>
</Card>
```

Replace with:

```tsx
<Card data-material="bento">
  <CardContent className="pt-6 text-center">
    <div className="text-3xl font-bold">
      {stats?.avgResCostPerSqft != null
        ? `$${Math.round(stats.avgResCostPerSqft).toLocaleString()}`
        : '—'}
    </div>
    <div className="text-sm text-muted-foreground">
      Avg Res. Cost/sqft
      {stats?.source === 'live' && stats?.avgResCostPerSqft != null && (
        <span className="ml-1 text-xs text-green-500">(Live)</span>
      )}
    </div>
  </CardContent>
</Card>
```

- [ ] **Step 3: Add dataIntegrityWarning to the Physical Dep KPI**

Find the Physical Dep KPI card. It currently reads:

```tsx
<div className="text-3xl font-bold">{avgPhysicalDep.toFixed(1)}%</div>
<div className="text-sm text-muted-foreground">Avg Physical Dep.</div>
```

Replace with:

```tsx
<div className="flex items-center justify-center gap-1">
  <div className="text-3xl font-bold">{avgPhysicalDep.toFixed(1)}%</div>
  {stats?.dataIntegrityWarning && (
    <span
      title={stats.dataIntegrityWarning}
      className="text-amber-500 text-lg cursor-help"
    >
      ⚠
    </span>
  )}
</div>
<div className="text-sm text-muted-foreground">Avg Physical Dep.</div>
{stats?.dataIntegrityWarning && (
  <div className="text-xs text-amber-500 mt-1 leading-tight">
    Data flag — hover ⚠ for details
  </div>
)}
```

- [ ] **Step 4: Fix the Cost Schedule Status section label (A4)**

Find `<CardTitle>Cost Schedule Status</CardTitle>` and replace with:

```tsx
<CardTitle>Cost Schedule Coverage by Property Type</CardTitle>
```

Then find the `<table>` inside that Card and add a header note before the `<thead>`:

```tsx
<p className="text-xs text-muted-foreground mb-3">
  Schedules are organized by use category (Property Type). Quality class (A–D)
  differentials are applied within each type via the depreciation matrix.
</p>
```

- [ ] **Step 5: TypeScript check**

```bash
cd /c/Users/bsval/terrafusion_os_1.0/frontend
npx tsc --noEmit 2>&1 | grep -E "error|CostForgeDashboard"
```

Expected: no errors.

- [ ] **Step 6: Verify in browser**

Open CostForge → Dashboard tab.
- "Avg Res. Cost/sqft" should show a live value (or `—` if data unavailable) — never `$148`.
- Physical Dep KPI should show `100.0% ⚠` with amber warning if the data integrity issue exists.
- Cost Schedule table header reads "Cost Schedule Coverage by Property Type" with the clarifying note.

- [ ] **Step 7: Commit**

```bash
git add frontend/apps/os-shell/src/pages/forge/cost/CostForgeDashboard.tsx
git commit -m "fix: replace \$148 hardcode, add integrity flag, fix schedule label in CostForgeDashboard

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Phase A Complete

After Task 3 commits:
- PRB in VEI tab shows real computed value from PACS sales data
- Physical Dep shows amber flag when > 95% (signals data quality issue to staff)
- Avg Res. Cost/sqft shows live PACS-derived figure or `—` — never a stub
- Cost Schedule table correctly labels rows as Property Types, not quality classes

Run full TypeScript check before marking complete:

```bash
cd /c/Users/bsval/terrafusion_os_1.0/frontend && npx tsc --noEmit 2>&1 | grep error | head -20
```

Expected: 0 errors.
