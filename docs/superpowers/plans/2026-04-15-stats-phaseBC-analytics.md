# Statistics Studio Phases B+C — Stratified Study Tab & Value Driver Panel

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an 8th "Stratified Study" tab to Statistics Studio showing per-stratum (Property Type × Quality Class) IAAO compliance metrics with DOR CSV export, plus a Value Driver Attribution panel inside the Calibration Matrix tab showing which physical features (basement, pool, garage, etc.) are pulling ratios above or below county median.

**Architecture:** Both are new query-heavy panels backed by new backend endpoints added to `TerraForgeController.cs`. Frontend is two new React components imported into the existing `StatisticsStudio.tsx` tab switcher. No new windows, no new stores — data fetched via TanStack Query within each panel.

**Tech Stack:** React 18, TypeScript 5.3, TanStack Query, .NET 8, Entity Framework Core, SQLite/PostgreSQL, Recharts (for value driver bar chart).

**Prerequisite:** Phase A plan must be complete (0 tsc errors, green build).

---

## File Map

| File | Change |
|------|--------|
| `backend/src/TerraFusion.API/Controllers/TerraForgeController.cs` | Add `GET ratio-study/stratified` and `GET ratio-study/driver-analysis` endpoints |
| `frontend/apps/os-shell/src/pages/forge/statistics/StratifiedStudyPanel.tsx` | New — strata table, IAAO status dots, DOR export |
| `frontend/apps/os-shell/src/pages/forge/statistics/ValueDriverPanel.tsx` | New — feature attribution table with signal indicators |
| `frontend/apps/os-shell/src/pages/forge/statistics/StatisticsStudio.tsx` | Add 'stratified' and import new panels; add `stratified` to Tab type |

---

## Task 1: Backend — GET ratio-study/stratified

**Files:**
- Modify: `backend/src/TerraFusion.API/Controllers/TerraForgeController.cs`

Add the stratified endpoint after the existing `ratio-study/trends` action (around line 1360+).

- [ ] **Step 1: Locate the insertion point**

```bash
grep -n "ratio-study/trends\|GetRatioStudyTrends\|^\s*\[HttpGet" /c/Users/bsval/terrafusion_os_1.0/backend/src/TerraFusion.API/Controllers/TerraForgeController.cs | tail -20
```

Find the line number after the closing `}` of the `GetRatioStudyTrends` action. Insert the new action after it.

- [ ] **Step 2: Add the stratified endpoint**

Insert this complete action into `TerraForgeController.cs`:

```csharp
/// <summary>
/// Returns per-stratum IAAO ratio study statistics (Property Type × Quality Class).
/// Strata with fewer than <paramref name="minSales"/> qualified sales are flagged as
/// insufficient and statistics are omitted (IAAO Standard 5 §9: min 5 per stratum).
/// </summary>
[HttpGet("ratio-study/stratified")]
public async Task<IActionResult> GetStratifiedRatioStudy(
    [FromQuery] int taxYear = 2026,
    [FromQuery] int minSales = 5,
    [FromQuery] string? propertyType = null,
    [FromQuery] string? qualityClass = null)
{
    _logger.LogInformation("GetStratifiedRatioStudy: taxYear={TaxYear} minSales={MinSales}", taxYear, minSales);

    try
    {
        // Build qualified sale population (same population rule as ratio-study endpoint)
        var salesQuery = _context.ComparableSales
            .Where(cs => cs.TaxYear == taxYear
                && cs.QualificationDecision == "qualified"
                && cs.SalePrice > 0);

        if (!string.IsNullOrEmpty(propertyType))
            salesQuery = salesQuery.Where(cs => cs.PropertyType == propertyType);

        var sales = await salesQuery
            .Select(cs => new
            {
                cs.ParcelId,
                cs.SalePrice,
                cs.AdjustedSalePrice,
                cs.PropertyType,
            })
            .ToListAsync();

        // Join to CamaCharacteristics to get QualityClass
        var parcelIds = sales.Select(s => s.ParcelId).Distinct().ToList();
        var camaMap = await _context.CamaCharacteristics
            .Where(cc => parcelIds.Contains(cc.ParcelNumber))
            .Select(cc => new { cc.ParcelNumber, cc.QualityClass })
            .ToListAsync();
        var camaLookup = camaMap.ToDictionary(cc => cc.ParcelNumber, cc => cc.QualityClass);

        // Join to Properties to get AssessedValue
        var propMap = await _context.Properties
            .Where(p => parcelIds.Contains(p.ParcelNumber))
            .Select(p => new { p.ParcelNumber, p.AssessedValue })
            .ToListAsync();
        var propLookup = propMap.ToDictionary(p => p.ParcelNumber, p => p.AssessedValue);

        // Build ratio records
        var ratioRows = sales
            .Select(s =>
            {
                var effectiveSalePrice = s.AdjustedSalePrice ?? s.SalePrice;
                if (!propLookup.TryGetValue(s.ParcelId, out var assessedValue) || assessedValue == null || assessedValue <= 0 || effectiveSalePrice <= 0)
                    return null;
                camaLookup.TryGetValue(s.ParcelId, out var qc);
                return new
                {
                    PropertyType = s.PropertyType ?? "Unknown",
                    QualityClass = qc ?? "Unknown",
                    Ratio = (double)assessedValue.Value / (double)effectiveSalePrice,
                    SalePrice = (double)effectiveSalePrice,
                    AssessedValue = (double)assessedValue.Value,
                };
            })
            .Where(r => r != null && r.Ratio > 0.1 && r.Ratio < 5.0)
            .ToList();

        // Apply qualityClass filter after join
        if (!string.IsNullOrEmpty(qualityClass))
            ratioRows = ratioRows.Where(r => r!.QualityClass == qualityClass).ToList();

        // Group by PropertyType × QualityClass and compute stats
        var groups = ratioRows
            .GroupBy(r => (r!.PropertyType, r.QualityClass))
            .Select(g =>
            {
                var rows = g.OrderBy(r => r!.Ratio).ToList();
                var n = rows.Count;
                var insufficient = n < minSales;

                double? medianRatio = null, cod = null, prd = null, prb = null;

                if (!insufficient)
                {
                    // Median
                    medianRatio = n % 2 == 0
                        ? (rows[n / 2 - 1]!.Ratio + rows[n / 2]!.Ratio) / 2.0
                        : rows[n / 2]!.Ratio;

                    // COD
                    cod = rows.Average(r => Math.Abs(r!.Ratio - medianRatio.Value) / medianRatio.Value) * 100.0;

                    // PRD
                    var meanRatio = rows.Average(r => r!.Ratio);
                    var sumSalePrice = rows.Sum(r => r!.SalePrice);
                    var weightedMean = sumSalePrice > 0
                        ? rows.Sum(r => r!.AssessedValue) / sumSalePrice
                        : meanRatio;
                    prd = weightedMean > 0 ? meanRatio / weightedMean : (double?)null;

                    // PRB — OLS β of ratio on ½(SP+AV)
                    if (n >= 5)
                    {
                        var vVals = rows.Select(r => 0.5 * (r!.SalePrice + r.AssessedValue)).ToList();
                        var vMean = vVals.Average();
                        var rMean = rows.Average(r => r!.Ratio);
                        var num = rows.Zip(vVals, (r, v) => (r!.Ratio - rMean) * (v - vMean)).Sum();
                        var den = vVals.Sum(v => (v - vMean) * (v - vMean));
                        if (den > 0) prb = num / den;
                    }
                }

                // IAAO thresholds
                bool medPass = medianRatio.HasValue && medianRatio >= 0.90 && medianRatio <= 1.10;
                bool codPass = cod.HasValue && cod <= 20.0;  // 20% for mixed strata; residential-only use 15%
                bool prdPass = prd.HasValue && prd >= 0.98 && prd <= 1.03;
                bool prbPass = prb.HasValue && Math.Abs(prb.Value) <= 0.05;

                return new
                {
                    propertyType = g.Key.PropertyType,
                    qualityClass = g.Key.QualityClass,
                    saleCount = n,
                    insufficientSample = insufficient,
                    medianRatio = medianRatio.HasValue ? Math.Round(medianRatio.Value, 4) : (double?)null,
                    cod = cod.HasValue ? Math.Round(cod.Value, 2) : (double?)null,
                    prd = prd.HasValue ? Math.Round(prd.Value, 4) : (double?)null,
                    prb = prb.HasValue ? Math.Round(prb.Value, 4) : (double?)null,
                    iaaoMedianPass = medPass,
                    iaaoCodPass = codPass,
                    iaaoPrdPass = prdPass,
                    iaaoPrbPass = prbPass,
                };
            })
            .OrderBy(g => g.propertyType)
            .ThenBy(g => g.qualityClass)
            .ToList();

        return Ok(new
        {
            taxYear,
            minSales,
            totalStrata = groups.Count,
            sufficientStrata = groups.Count(g => !g.insufficientSample),
            strata = groups,
        });
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "GetStratifiedRatioStudy failed: taxYear={TaxYear}", taxYear);
        return StatusCode(500, new { error = "Failed to compute stratified ratio study." });
    }
}
```

- [ ] **Step 3: Build**

```bash
cd /c/Users/bsval/terrafusion_os_1.0/backend
dotnet build src/TerraFusion.API/TerraFusion.API.csproj -c Release 2>&1 | grep -E "^.*error"
```

Expected: 0 errors.

- [ ] **Step 4: Test endpoint**

```bash
curl -s "http://localhost:5000/api/terraforge/ratio-study/stratified?taxYear=2026" | python3 -m json.tool | head -40
```

Expected: JSON with `strata` array. Each stratum has `propertyType`, `qualityClass`, `saleCount`, `medianRatio`, `cod`, `prd`, `prb`, `iaaoMedianPass`, etc.

- [ ] **Step 5: Commit**

```bash
git add backend/src/TerraFusion.API/Controllers/TerraForgeController.cs
git commit -m "feat(backend): add GET ratio-study/stratified endpoint with IAAO per-stratum stats

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 2: Backend — GET ratio-study/driver-analysis

**Files:**
- Modify: `backend/src/TerraFusion.API/Controllers/TerraForgeController.cs`

Add this endpoint immediately after the stratified endpoint added in Task 1.

- [ ] **Step 1: Add the driver-analysis endpoint**

```csharp
/// <summary>
/// Returns median ratio deviation by physical improvement feature type.
/// Identifies which features (basement, pool, garage, etc.) are pulling
/// county ratios above or below the county median — calibration signals.
/// </summary>
[HttpGet("ratio-study/driver-analysis")]
public async Task<IActionResult> GetDriverAnalysis(
    [FromQuery] int taxYear = 2026,
    [FromQuery] string? propertyType = null)
{
    _logger.LogInformation("GetDriverAnalysis: taxYear={TaxYear}", taxYear);

    // Feature codes from PACS ImprvDetTypeCd — Benton County real codes
    var featureMap = new Dictionary<string, string>
    {
        { "BSMT",     "Basement" },
        { "POOL",     "Pool" },
        { "ATTGAR",   "Attached Garage" },
        { "CovPatio", "Covered Patio" },
        { "POLEBLDG", "Pole Building" },
        { "DETGAR",   "Detached Garage" },
        { "MA",       "Manufactured Addition" },
    };

    try
    {
        // Get county-wide median ratio from qualified sales (same population as ratio-study)
        var allSalesQuery = _context.ComparableSales
            .Where(cs => cs.TaxYear == taxYear && cs.QualificationDecision == "qualified" && cs.SalePrice > 0);
        if (!string.IsNullOrEmpty(propertyType))
            allSalesQuery = allSalesQuery.Where(cs => cs.PropertyType == propertyType);

        var allSales = await allSalesQuery
            .Select(cs => new { cs.ParcelId, cs.SalePrice, cs.AdjustedSalePrice })
            .ToListAsync();

        var allParcelIds = allSales.Select(s => s.ParcelId).ToList();
        var allPropMap = await _context.Properties
            .Where(p => allParcelIds.Contains(p.ParcelNumber) && p.AssessedValue > 0)
            .Select(p => new { p.ParcelNumber, p.AssessedValue })
            .ToDictionaryAsync(p => p.ParcelNumber, p => p.AssessedValue);

        var countyRatios = allSales
            .Where(s => allPropMap.ContainsKey(s.ParcelId))
            .Select(s =>
            {
                var sp = (double)(s.AdjustedSalePrice ?? s.SalePrice);
                var av = (double)allPropMap[s.ParcelId]!.Value;
                return av / sp;
            })
            .Where(r => r > 0.1 && r < 5.0)
            .OrderBy(r => r)
            .ToList();

        double countyMedian = countyRatios.Count == 0 ? 1.0
            : countyRatios.Count % 2 == 0
                ? (countyRatios[countyRatios.Count / 2 - 1] + countyRatios[countyRatios.Count / 2]) / 2.0
                : countyRatios[countyRatios.Count / 2];

        // Per-feature analysis
        var results = new List<object>();
        foreach (var (featureCode, featureLabel) in featureMap)
        {
            // Find parcels that have this improvement detail type
            var featureParcelIds = await _context.ImprovementDetails
                .Where(id => id.ImprvDetTypeCd == featureCode && allParcelIds.Contains(id.ParcelNumber))
                .Select(id => id.ParcelNumber)
                .Distinct()
                .ToListAsync();

            var featureSales = allSales
                .Where(s => featureParcelIds.Contains(s.ParcelId) && allPropMap.ContainsKey(s.ParcelId))
                .Select(s =>
                {
                    var sp = (double)(s.AdjustedSalePrice ?? s.SalePrice);
                    var av = (double)allPropMap[s.ParcelId]!.Value;
                    return av / sp;
                })
                .Where(r => r > 0.1 && r < 5.0)
                .OrderBy(r => r)
                .ToList();

            double? featureMedian = null;
            double? deviation = null;
            string signal = "insufficient";

            if (featureSales.Count >= 5)
            {
                featureMedian = featureSales.Count % 2 == 0
                    ? (featureSales[featureSales.Count / 2 - 1] + featureSales[featureSales.Count / 2]) / 2.0
                    : featureSales[featureSales.Count / 2];
                deviation = featureMedian.Value - countyMedian;
                signal = Math.Abs(deviation.Value) <= 0.04 ? "ok"
                    : deviation.Value > 0 ? "under"
                    : "over";
            }

            results.Add(new
            {
                featureCode,
                featureLabel,
                saleCount = featureSales.Count,
                medianRatio = featureMedian.HasValue ? Math.Round(featureMedian.Value, 4) : (double?)null,
                deviationFromCountyMedian = deviation.HasValue ? Math.Round(deviation.Value, 4) : (double?)null,
                signal,
            });
        }

        return Ok(new
        {
            taxYear,
            countyMedianRatio = Math.Round(countyMedian, 4),
            countyQualifiedSaleCount = countyRatios.Count,
            features = results,
        });
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "GetDriverAnalysis failed: taxYear={TaxYear}", taxYear);
        return StatusCode(500, new { error = "Failed to compute driver analysis." });
    }
}
```

**Note on `ImprovementDetails`:** This assumes a `DbSet<ImprovementDetail>` exists in `TerraFusionDbContext` with properties `ImprvDetTypeCd` and `ParcelNumber`. If the entity or DbSet is named differently, check:

```bash
grep -rn "ImprovementDetail\|ImprvDet" /c/Users/bsval/terrafusion_os_1.0/backend/src/TerraFusion.Data/ | head -10
grep -rn "ImprovementDetail" /c/Users/bsval/terrafusion_os_1.0/backend/src/TerraFusion.Data/TerraFusionDbContext.cs | head -5
```

Adapt entity name and property names to match what exists.

- [ ] **Step 2: Build**

```bash
dotnet build src/TerraFusion.API/TerraFusion.API.csproj -c Release 2>&1 | grep "error"
```

- [ ] **Step 3: Test endpoint**

```bash
curl -s "http://localhost:5000/api/terraforge/ratio-study/driver-analysis?taxYear=2026" | python3 -m json.tool | head -50
```

Expected: JSON with `countyMedianRatio` and `features` array. Each feature has `featureCode`, `featureLabel`, `saleCount`, `medianRatio`, `deviationFromCountyMedian`, `signal`.

- [ ] **Step 4: Commit**

```bash
git add backend/src/TerraFusion.API/Controllers/TerraForgeController.cs
git commit -m "feat(backend): add GET ratio-study/driver-analysis for feature attribution

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 3: Frontend — StratifiedStudyPanel.tsx

**Files:**
- Create: `frontend/apps/os-shell/src/pages/forge/statistics/StratifiedStudyPanel.tsx`

- [ ] **Step 1: Create the file**

```bash
touch /c/Users/bsval/terrafusion_os_1.0/frontend/apps/os-shell/src/pages/forge/statistics/StratifiedStudyPanel.tsx
```

- [ ] **Step 2: Write the component**

```typescript
/**
 * StratifiedStudyPanel.tsx
 *
 * IAAO-standard stratified ratio study by Property Type × Quality Class.
 * DOR-ready table with per-stratum Median/COD/PRD/PRB and compliance dots.
 * Click stratum row → SalesForge filtered to that stratum.
 */

import React, { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/apiBase';
import { activateModule } from '../../../orchestration/moduleActivation';

interface StratumRow {
  propertyType: string;
  qualityClass: string;
  saleCount: number;
  insufficientSample: boolean;
  medianRatio: number | null;
  cod: number | null;
  prd: number | null;
  prb: number | null;
  iaaoMedianPass: boolean;
  iaaoCodPass: boolean;
  iaaoPrdPass: boolean;
  iaaoPrbPass: boolean;
}

interface StratifiedResponse {
  taxYear: number;
  minSales: number;
  totalStrata: number;
  sufficientStrata: number;
  strata: StratumRow[];
}

const fmt4 = (n: number | null) => (n == null ? '—' : n.toFixed(4));
const fmt2 = (n: number | null) => (n == null ? '—' : n.toFixed(2));

function IAAODot({ pass, insufficient }: { pass: boolean; insufficient: boolean }) {
  if (insufficient) return <span className="text-muted-foreground text-xs">—</span>;
  return <span className={pass ? 'text-green-500' : 'text-red-500'}>{pass ? '✓' : '✗'}</span>;
}

function generateDorCsv(data: StratifiedResponse): void {
  const header = 'PropertyType,QualityClass,SaleCount,MedianRatio,COD,PRD,PRB,IAAOMedianPass,IAAOCodPass,IAAOPrdPass,IAAOPrbPass,TaxYear';
  const rows = data.strata.map((s) =>
    [
      s.propertyType,
      s.qualityClass,
      s.saleCount,
      s.medianRatio ?? '',
      s.cod ?? '',
      s.prd ?? '',
      s.prb ?? '',
      s.insufficientSample ? 'INSUFFICIENT' : s.iaaoMedianPass ? 'PASS' : 'FAIL',
      s.insufficientSample ? 'INSUFFICIENT' : s.iaaoCodPass ? 'PASS' : 'FAIL',
      s.insufficientSample ? 'INSUFFICIENT' : s.iaaoPrdPass ? 'PASS' : 'FAIL',
      s.insufficientSample ? 'INSUFFICIENT' : s.iaaoPrbPass ? 'PASS' : 'FAIL',
      data.taxYear,
    ].join(',')
  );
  const csv = [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `BentonCounty_DOR_StratifiedStudy_${data.taxYear}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function StratifiedStudyPanel() {
  const [taxYear] = useState(2026);

  const { data, isLoading, error } = useQuery<StratifiedResponse>({
    queryKey: ['ratio-study-stratified', taxYear],
    queryFn: () =>
      apiFetch(`/terraforge/ratio-study/stratified?taxYear=${taxYear}&minSales=5`).then((r) => r.json()),
    staleTime: 10 * 60_000,
  });

  const handleStratumClick = useCallback((stratum: StratumRow) => {
    void activateModule('sales-forge', {
      source: 'system',
      metadata: {
        filterPropertyType: stratum.propertyType,
        filterQualityClass: stratum.qualityClass,
      },
    });
  }, []);

  return (
    <Card data-material="bento" data-testid="stratified-study-panel">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Stratified Ratio Study — {taxYear} Tax Year</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Property Type × Quality Class · IAAO Standard 5 §9 · Min 5 sales per stratum
            </p>
          </div>
          {data && (
            <Button variant="outline" size="sm" onClick={() => generateDorCsv(data)}>
              Export DOR CSV
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="py-8 text-center text-muted-foreground">Loading stratified study…</div>
        )}
        {error && (
          <div className="py-8 text-center text-red-500">
            Failed to load stratified study data.
          </div>
        )}
        {data && (
          <>
            <div className="flex gap-4 mb-3 text-sm text-muted-foreground">
              <span>{data.totalStrata} strata total</span>
              <span>·</span>
              <span>{data.sufficientStrata} with ≥5 sales</span>
              <span>·</span>
              <span>{data.totalStrata - data.sufficientStrata} insufficient</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" role="grid">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-2 pr-4 font-semibold">Stratum</th>
                    <th className="py-2 pr-4 text-right font-semibold">N</th>
                    <th className="py-2 pr-4 text-right font-semibold">Median</th>
                    <th className="py-2 pr-4 text-right font-semibold">COD</th>
                    <th className="py-2 pr-4 text-right font-semibold">PRD</th>
                    <th className="py-2 pr-4 text-right font-semibold">PRB</th>
                    <th className="py-2 text-center font-semibold">
                      IAAO <span className="text-xs font-normal">(Med/COD/PRD/PRB)</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.strata.map((stratum) => (
                    <tr
                      key={`${stratum.propertyType}-${stratum.qualityClass}`}
                      className="border-b hover:bg-white/5 cursor-pointer"
                      onClick={() => handleStratumClick(stratum)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && handleStratumClick(stratum)}
                    >
                      <td className="py-2 pr-4 font-medium">
                        {stratum.propertyType}
                        {stratum.qualityClass !== 'Unknown' && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            {stratum.qualityClass}
                          </Badge>
                        )}
                      </td>
                      <td className="py-2 pr-4 text-right">{stratum.saleCount}</td>
                      {stratum.insufficientSample ? (
                        <td colSpan={4} className="py-2 pr-4 text-center text-muted-foreground text-xs">
                          Insufficient sample (N &lt; 5)
                        </td>
                      ) : (
                        <>
                          <td className="py-2 pr-4 text-right font-mono">{fmt4(stratum.medianRatio)}</td>
                          <td className="py-2 pr-4 text-right font-mono">{fmt2(stratum.cod)}</td>
                          <td className="py-2 pr-4 text-right font-mono">{fmt4(stratum.prd)}</td>
                          <td className="py-2 pr-4 text-right font-mono">{fmt4(stratum.prb)}</td>
                        </>
                      )}
                      <td className="py-2 text-center">
                        <span className="flex gap-1 justify-center">
                          <IAAODot pass={stratum.iaaoMedianPass} insufficient={stratum.insufficientSample} />
                          <IAAODot pass={stratum.iaaoCodPass} insufficient={stratum.insufficientSample} />
                          <IAAODot pass={stratum.iaaoPrdPass} insufficient={stratum.insufficientSample} />
                          <IAAODot pass={stratum.iaaoPrbPass} insufficient={stratum.insufficientSample} />
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Click any stratum row to open SalesForge filtered to that stratum.
              IAAO thresholds: Median 0.90–1.10 · COD ≤20 · PRD 0.98–1.03 · |PRB| ≤0.05
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 3: TypeScript check**

```bash
cd /c/Users/bsval/terrafusion_os_1.0/frontend
npx tsc --noEmit 2>&1 | grep -E "error|StratifiedStudy"
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/apps/os-shell/src/pages/forge/statistics/StratifiedStudyPanel.tsx
git commit -m "feat: add StratifiedStudyPanel with DOR export and SalesForge click-through

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 4: Frontend — ValueDriverPanel.tsx

**Files:**
- Create: `frontend/apps/os-shell/src/pages/forge/statistics/ValueDriverPanel.tsx`

- [ ] **Step 1: Create the file**

```bash
touch /c/Users/bsval/terrafusion_os_1.0/frontend/apps/os-shell/src/pages/forge/statistics/ValueDriverPanel.tsx
```

- [ ] **Step 2: Write the component**

```typescript
/**
 * ValueDriverPanel.tsx
 *
 * Feature-level ratio attribution — shows which physical improvement features
 * (basement, pool, garage, etc.) are pulling Benton County ratios above or below
 * the county median. Calibration signal for cost schedule adjustments.
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiFetch } from '@/lib/apiBase';

interface DriverFeature {
  featureCode: string;
  featureLabel: string;
  saleCount: number;
  medianRatio: number | null;
  deviationFromCountyMedian: number | null;
  signal: 'under' | 'over' | 'ok' | 'insufficient';
}

interface DriverResponse {
  taxYear: number;
  countyMedianRatio: number;
  countyQualifiedSaleCount: number;
  features: DriverFeature[];
}

function SignalBadge({ signal }: { signal: DriverFeature['signal'] }) {
  const map: Record<DriverFeature['signal'], { label: string; className: string }> = {
    under: { label: '↑ Under-scheduled', className: 'text-amber-500 font-semibold' },
    over:  { label: '↓ Over-scheduled',  className: 'text-red-500 font-semibold' },
    ok:    { label: 'OK',                 className: 'text-green-500' },
    insufficient: { label: 'Insuff.', className: 'text-muted-foreground text-xs' },
  };
  const { label, className } = map[signal];
  return <span className={className}>{label}</span>;
}

export function ValueDriverPanel() {
  const [threshold, setThreshold] = useState(0.04);
  const [taxYear] = useState(2026);

  const { data, isLoading, error } = useQuery<DriverResponse>({
    queryKey: ['ratio-study-driver-analysis', taxYear],
    queryFn: () =>
      apiFetch(`/terraforge/ratio-study/driver-analysis?taxYear=${taxYear}`).then((r) => r.json()),
    staleTime: 10 * 60_000,
  });

  // Re-apply signal logic client-side based on user threshold
  const features = (data?.features ?? []).map((f) => ({
    ...f,
    signal:
      f.saleCount < 5 || f.deviationFromCountyMedian == null
        ? ('insufficient' as const)
        : Math.abs(f.deviationFromCountyMedian) <= threshold
        ? ('ok' as const)
        : f.deviationFromCountyMedian > 0
        ? ('under' as const)
        : ('over' as const),
  }));

  return (
    <Card data-material="bento" data-testid="value-driver-panel">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle>Value Driver Attribution</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Ratio deviation by physical feature — calibration signals for cost schedule
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <label htmlFor="driver-threshold" className="text-muted-foreground">
              Signal threshold:
            </label>
            <input
              id="driver-threshold"
              type="number"
              min={0.01}
              max={0.15}
              step={0.01}
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value) || 0.04)}
              className="w-20 rounded border border-input bg-background px-2 py-1 text-sm"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="py-8 text-center text-muted-foreground">Loading driver analysis…</div>
        )}
        {error && (
          <div className="py-8 text-center text-red-500">
            Failed to load driver analysis.
          </div>
        )}
        {data && (
          <>
            <p className="text-xs text-muted-foreground mb-3">
              County median ratio: <strong>{data.countyMedianRatio.toFixed(4)}</strong> ·{' '}
              {data.countyQualifiedSaleCount.toLocaleString()} qualified sales ·
              Signal triggers at |deviation| &gt; {threshold.toFixed(2)}
            </p>
            <table className="w-full text-sm" role="grid">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2 pr-4 font-semibold">Feature</th>
                  <th className="py-2 pr-4 text-right font-semibold">N (sales)</th>
                  <th className="py-2 pr-4 text-right font-semibold">Median Ratio</th>
                  <th className="py-2 pr-4 text-right font-semibold">Deviation</th>
                  <th className="py-2 font-semibold">Signal</th>
                </tr>
              </thead>
              <tbody>
                {features.map((f) => (
                  <tr key={f.featureCode} className="border-b hover:bg-white/5">
                    <td className="py-2 pr-4 font-medium">{f.featureLabel}</td>
                    <td className="py-2 pr-4 text-right">{f.saleCount}</td>
                    <td className="py-2 pr-4 text-right font-mono">
                      {f.medianRatio != null ? f.medianRatio.toFixed(4) : '—'}
                    </td>
                    <td className="py-2 pr-4 text-right font-mono">
                      {f.deviationFromCountyMedian != null
                        ? (f.deviationFromCountyMedian >= 0 ? '+' : '') +
                          f.deviationFromCountyMedian.toFixed(4)
                        : '—'}
                    </td>
                    <td className="py-2">
                      <SignalBadge signal={f.signal} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-3 text-xs text-muted-foreground space-y-1">
              <p>
                <strong>↑ Under-scheduled:</strong> Feature-present parcels assessed below market —
                cost schedule for this feature may be set too low. Consider raising adjustment.
              </p>
              <p>
                <strong>↓ Over-scheduled:</strong> Feature-present parcels assessed above market —
                cost schedule may be set too high. Consider lowering adjustment.
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 3: TypeScript check**

```bash
cd /c/Users/bsval/terrafusion_os_1.0/frontend
npx tsc --noEmit 2>&1 | grep -E "error|ValueDriver"
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/apps/os-shell/src/pages/forge/statistics/ValueDriverPanel.tsx
git commit -m "feat: add ValueDriverPanel with configurable signal threshold

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 5: Wire Both Panels into StatisticsStudio

**Files:**
- Modify: `frontend/apps/os-shell/src/pages/forge/statistics/StatisticsStudio.tsx`

- [ ] **Step 1: Add imports**

At the top of `StatisticsStudio.tsx`, after the existing import block, add:

```typescript
import { StratifiedStudyPanel } from './StratifiedStudyPanel';
import { ValueDriverPanel } from './ValueDriverPanel';
```

- [ ] **Step 2: Extend the Tab type**

Find:
```typescript
type Tab = 'ratio-study' | 'trends' | 'equity' | 'outliers' | 'comparison' | 'calibration' | 'cost-analytics';
```

Replace with:
```typescript
type Tab = 'ratio-study' | 'stratified' | 'trends' | 'equity' | 'outliers' | 'comparison' | 'calibration' | 'cost-analytics';
```

- [ ] **Step 3: Add the Stratified Study tab button**

Find the `tabs` array:
```typescript
const tabs: { key: Tab; label: string }[] = [
  { key: 'ratio-study', label: 'Ratio Study' },
  { key: 'calibration', label: 'Calibration Matrix' },
  ...
```

Add after the `ratio-study` entry:
```typescript
  { key: 'stratified', label: 'Stratified Study' },
```

- [ ] **Step 4: Add the Stratified Study tab content**

Find the block:
```tsx
{/* Tab: Ratio Study */}
{activeTab === 'ratio-study' && (
  ...
)}
```

After its closing `)}`, add:

```tsx
{/* Tab: Stratified Study — IAAO DOR strata table */}
{activeTab === 'stratified' && <StratifiedStudyPanel />}
```

- [ ] **Step 5: Add Value Driver to Calibration tab**

Find:
```tsx
{/* Tab: Calibration Matrix — live neighborhood ratio study + mass adjust */}
{activeTab === 'calibration' && <CostRatioAnalysis />}
```

Replace with:
```tsx
{/* Tab: Calibration Matrix — live neighborhood ratio study + mass adjust + value driver attribution */}
{activeTab === 'calibration' && (
  <div className="space-y-4">
    <CostRatioAnalysis />
    <ValueDriverPanel />
  </div>
)}
```

- [ ] **Step 6: TypeScript and lint**

```bash
cd /c/Users/bsval/terrafusion_os_1.0/frontend
npx tsc --noEmit 2>&1 | grep error
```

Expected: 0 errors.

- [ ] **Step 7: Verify in browser**

- Statistics Studio should now show 8 tabs in the header buttons.
- Clicking "Stratified Study" shows the strata table (or loading state if backend starting).
- Clicking any stratum row should attempt to launch SalesForge.
- Clicking "Calibration Matrix" shows the existing `CostRatioAnalysis` component followed by the new `ValueDriverPanel`.

- [ ] **Step 8: Commit**

```bash
git add frontend/apps/os-shell/src/pages/forge/statistics/StatisticsStudio.tsx
git commit -m "feat: wire StratifiedStudyPanel and ValueDriverPanel into Statistics Studio

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Phases B+C Complete

Final validation:

```bash
cd /c/Users/bsval/terrafusion_os_1.0/frontend && npx tsc --noEmit 2>&1 | grep error | head -20
cd /c/Users/bsval/terrafusion_os_1.0/backend && dotnet build src/TerraFusion.API/TerraFusion.API.csproj -c Release 2>&1 | grep "error"
```

Both expected: 0 errors.

Checklist:
- [ ] Stratified Study tab visible in Statistics Studio
- [ ] Each stratum row shows N / Median / COD / PRD / PRB / 4 IAAO dots
- [ ] Strata with N < 5 show "Insufficient sample" — no stats
- [ ] "Export DOR CSV" downloads `BentonCounty_DOR_StratifiedStudy_2026.csv`
- [ ] Clicking a stratum row activates SalesForge
- [ ] Calibration Matrix tab shows Value Driver table below CostRatioAnalysis
- [ ] Value driver signal threshold is adjustable (0.01–0.15)
- [ ] Features with N < 5 show "Insuff." signal, not fabricated deviation
