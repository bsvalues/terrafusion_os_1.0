# Statistics Studio Phase D — Deep Analysis Layer

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add three advanced analysis tabs (Diagnostics, Spatial & Temporal, Calibration Engine) gated behind a "Show Advanced Analysis" toggle, providing PhD-level IAAO mass appraisal analytics: confidence intervals, vertical equity by decile, Cook's D influence diagnostics, time-trend index, Moran's I spatial autocorrelation, hedonic regression vs cost schedule, variance decomposition, sale chasing detection, cross-validation, and KS distributional shift test.

**Architecture:** All 10 analytics are new backend endpoints added to `TerraForgeController.cs`. Frontend is three new tab components + a toggle state in `StatisticsStudio.tsx`. Data fetched via TanStack Query within each panel. Advanced tabs are hidden until toggle is enabled — they appear as additional buttons after a visual separator.

**Tech Stack:** React 18, TypeScript 5.3, TanStack Query, Recharts, .NET 8, EF Core, ML.NET 3.0 (for hedonic OLS), SQLite/PostgreSQL.

**Prerequisite:** Phases A, B, and C plans must be complete (0 tsc errors, green build).

**Priority ordering:** P0 items (Tasks 1-3) must ship before P1 items (Tasks 4-7), which must ship before P2 (Tasks 8-10) and P3 (Task 11).

---

## File Map

| File | Change |
|------|--------|
| `backend/src/TerraFusion.API/Controllers/TerraForgeController.cs` | 10 new endpoints |
| `frontend/.../statistics/panels/DiagnosticsTab.tsx` | New — vertical equity, Cook's D, variance decomp, sale chasing |
| `frontend/.../statistics/panels/SpatialTemporalTab.tsx` | New — time trend, Moran's I, KS shift test |
| `frontend/.../statistics/panels/CalibrationEngineTab.tsx` | New — hedonic regression, cross-validation |
| `frontend/.../statistics/components/ConfidenceIntervalBadge.tsx` | New — shared CI display |
| `frontend/.../statistics/StatisticsStudio.tsx` | Add toggle + 3 new tabs + CI badges to Ratio Study |
| `frontend/.../statistics/RatioStudyPanel.tsx` | Add CI display to each statistic |

---

## Task D1-P0: Backend — Confidence Intervals Endpoint

**Files:**
- Modify: `backend/src/TerraFusion.API/Controllers/TerraForgeController.cs`

Bootstrap confidence intervals for Median, COD, PRD, PRB. 1,000 resamples. Cached 10 minutes.

- [ ] **Step 1: Add the confidence-intervals endpoint**

Insert after the `driver-analysis` endpoint added in Phase B+C plan:

```csharp
/// <summary>
/// Bootstrap 95% confidence intervals for Median, COD, PRD, PRB.
/// 1,000 non-parametric resamples. Result cached 10 minutes (expensive computation).
/// </summary>
[HttpGet("ratio-study/confidence-intervals")]
[ResponseCache(Duration = 600)]
public async Task<IActionResult> GetConfidenceIntervals(
    [FromQuery] int taxYear = 2026,
    [FromQuery] string? propertyType = null,
    [FromQuery] string? qualityClass = null)
{
    _logger.LogInformation("GetConfidenceIntervals: taxYear={TaxYear}", taxYear);

    try
    {
        // Build ratio population (same as ratio-study endpoint)
        var salesQuery = _context.ComparableSales
            .Where(cs => cs.TaxYear == taxYear && cs.QualificationDecision == "qualified" && cs.SalePrice > 0);
        if (!string.IsNullOrEmpty(propertyType))
            salesQuery = salesQuery.Where(cs => cs.PropertyType == propertyType);

        var sales = await salesQuery.Select(cs => new { cs.ParcelId, cs.SalePrice, cs.AdjustedSalePrice }).ToListAsync();
        var parcelIds = sales.Select(s => s.ParcelId).ToList();
        var propMap = await _context.Properties
            .Where(p => parcelIds.Contains(p.ParcelNumber) && p.AssessedValue > 0)
            .Select(p => new { p.ParcelNumber, p.AssessedValue })
            .ToDictionaryAsync(p => p.ParcelNumber, p => p.AssessedValue);

        var ratios = sales
            .Where(s => propMap.ContainsKey(s.ParcelId))
            .Select(s =>
            {
                var sp = (double)(s.AdjustedSalePrice ?? s.SalePrice);
                var av = (double)propMap[s.ParcelId]!.Value;
                return (ratio: av / sp, salePrice: sp, assessedValue: av);
            })
            .Where(r => r.ratio > 0.1 && r.ratio < 5.0)
            .ToList();

        if (ratios.Count < 5)
            return Ok(new { error = "Insufficient data for confidence intervals.", sampleSize = ratios.Count });

        // Bootstrap
        const int B = 1000;
        var rng = new Random(42);
        var medianBoots = new double[B];
        var codBoots = new double[B];
        var prdBoots = new double[B];
        var prbBoots = new double[B];
        var n = ratios.Count;

        for (int b = 0; b < B; b++)
        {
            var sample = Enumerable.Range(0, n).Select(_ => ratios[rng.Next(n)]).ToList();
            var sortedR = sample.Select(s => s.ratio).OrderBy(r => r).ToList();

            var med = n % 2 == 0 ? (sortedR[n / 2 - 1] + sortedR[n / 2]) / 2.0 : sortedR[n / 2];
            medianBoots[b] = med;

            var codVal = sample.Average(s => Math.Abs(s.ratio - med) / med) * 100.0;
            codBoots[b] = codVal;

            var meanR = sample.Average(s => s.ratio);
            var sumSP = sample.Sum(s => s.salePrice);
            var wmean = sumSP > 0 ? sample.Sum(s => s.assessedValue) / sumSP : meanR;
            prdBoots[b] = wmean > 0 ? meanR / wmean : 1.0;

            var vVals = sample.Select(s => 0.5 * (s.salePrice + s.assessedValue)).ToList();
            var vMean = vVals.Average();
            var rMean = sample.Average(s => s.ratio);
            var num = sample.Zip(vVals, (s, v) => (s.ratio - rMean) * (v - vMean)).Sum();
            var den = vVals.Sum(v => (v - vMean) * (v - vMean));
            prbBoots[b] = den > 0 ? num / den : 0.0;
        }

        static (double lo, double hi) Percentiles(double[] arr)
        {
            var s = arr.OrderBy(x => x).ToArray();
            return (s[(int)(0.025 * arr.Length)], s[(int)(0.975 * arr.Length)]);
        }

        var (medLo, medHi) = Percentiles(medianBoots);
        var (codLo, codHi) = Percentiles(codBoots);
        var (prdLo, prdHi) = Percentiles(prdBoots);
        var (prbLo, prbHi) = Percentiles(prbBoots);

        // Point estimates
        var sortedRatio = ratios.Select(r => r.ratio).OrderBy(r => r).ToList();
        var pointMedian = n % 2 == 0 ? (sortedRatio[n / 2 - 1] + sortedRatio[n / 2]) / 2.0 : sortedRatio[n / 2];
        var pointMean = ratios.Average(r => r.ratio);
        var sumSPAll = ratios.Sum(r => r.salePrice);
        var wMeanAll = sumSPAll > 0 ? ratios.Sum(r => r.assessedValue) / sumSPAll : pointMean;
        var pointPrd = wMeanAll > 0 ? pointMean / wMeanAll : 1.0;
        var pointCod = ratios.Average(r => Math.Abs(r.ratio - pointMedian) / pointMedian) * 100.0;
        var vValsAll = ratios.Select(r => 0.5 * (r.salePrice + r.assessedValue)).ToList();
        var vMeanAll = vValsAll.Average();
        var rMeanAll = pointMean;
        var numAll = ratios.Zip(vValsAll, (r, v) => (r.ratio - rMeanAll) * (v - vMeanAll)).Sum();
        var denAll = vValsAll.Sum(v => (v - vMeanAll) * (v - vMeanAll));
        var pointPrb = denAll > 0 ? numAll / denAll : 0.0;

        return Ok(new
        {
            taxYear,
            sampleSize = n,
            bootstrapResamples = B,
            confidenceLevel = 0.95,
            median = new { point = Math.Round(pointMedian, 4), lo = Math.Round(medLo, 4), hi = Math.Round(medHi, 4) },
            cod    = new { point = Math.Round(pointCod,    2), lo = Math.Round(codLo,    2), hi = Math.Round(codHi,    2) },
            prd    = new { point = Math.Round(pointPrd,    4), lo = Math.Round(prdLo,    4), hi = Math.Round(prdHi,    4) },
            prb    = new { point = Math.Round(pointPrb,    4), lo = Math.Round(prbLo,    4), hi = Math.Round(prbHi,    4) },
        });
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "GetConfidenceIntervals failed");
        return StatusCode(500, new { error = "Failed to compute confidence intervals." });
    }
}
```

- [ ] **Step 2: Build and verify**

```bash
cd /c/Users/bsval/terrafusion_os_1.0/backend
dotnet build src/TerraFusion.API/TerraFusion.API.csproj -c Release 2>&1 | grep "error"
curl -s "http://localhost:5000/api/terraforge/ratio-study/confidence-intervals?taxYear=2026" | python3 -m json.tool | head -30
```

Expected: JSON with `median`, `cod`, `prd`, `prb` each having `point`, `lo`, `hi`.

- [ ] **Step 3: Commit**

```bash
git add backend/src/TerraFusion.API/Controllers/TerraForgeController.cs
git commit -m "feat(backend): add bootstrap confidence intervals endpoint (1000 resamples)

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task D2-P0: Backend — Vertical Equity by Value Decile

- [ ] **Step 1: Add the vertical-equity endpoint**

```csharp
/// <summary>
/// Computes median ratio by sale price decile (10 equal groups, lowest to highest value).
/// Detects regressive/progressive vertical inequity in assessment.
/// IAAO Standard 5 §6.3: PRB and decile analysis for vertical equity.
/// </summary>
[HttpGet("ratio-study/vertical-equity")]
public async Task<IActionResult> GetVerticalEquity(
    [FromQuery] int taxYear = 2026,
    [FromQuery] string? propertyType = null)
{
    _logger.LogInformation("GetVerticalEquity: taxYear={TaxYear}", taxYear);

    try
    {
        var salesQuery = _context.ComparableSales
            .Where(cs => cs.TaxYear == taxYear && cs.QualificationDecision == "qualified" && cs.SalePrice > 0);
        if (!string.IsNullOrEmpty(propertyType))
            salesQuery = salesQuery.Where(cs => cs.PropertyType == propertyType);

        var sales = await salesQuery.Select(cs => new { cs.ParcelId, cs.SalePrice, cs.AdjustedSalePrice }).ToListAsync();
        var parcelIds = sales.Select(s => s.ParcelId).ToList();
        var propMap = await _context.Properties
            .Where(p => parcelIds.Contains(p.ParcelNumber) && p.AssessedValue > 0)
            .Select(p => new { p.ParcelNumber, p.AssessedValue })
            .ToDictionaryAsync(p => p.ParcelNumber, p => p.AssessedValue);

        var records = sales
            .Where(s => propMap.ContainsKey(s.ParcelId))
            .Select(s =>
            {
                var sp = (double)(s.AdjustedSalePrice ?? s.SalePrice);
                var av = (double)propMap[s.ParcelId]!.Value;
                return new { ratio = av / sp, salePrice = sp };
            })
            .Where(r => r.ratio > 0.1 && r.ratio < 5.0)
            .OrderBy(r => r.salePrice)
            .ToList();

        if (records.Count < 10)
            return Ok(new { error = "Insufficient data for decile analysis.", sampleSize = records.Count });

        var n = records.Count;
        var sortedAll = records.Select(r => r.ratio).OrderBy(r => r).ToList();
        var countyMedian = n % 2 == 0
            ? (sortedAll[n / 2 - 1] + sortedAll[n / 2]) / 2.0
            : sortedAll[n / 2];

        var decileSize = n / 10;
        var deciles = Enumerable.Range(0, 10).Select(d =>
        {
            var slice = records.Skip(d * decileSize).Take(d == 9 ? n - d * decileSize : decileSize).ToList();
            var ratios = slice.Select(r => r.ratio).OrderBy(r => r).ToList();
            var m = ratios.Count;
            var med = m % 2 == 0 ? (ratios[m / 2 - 1] + ratios[m / 2]) / 2.0 : ratios[m / 2];
            return new
            {
                decile = d + 1,
                minSalePrice = (int)slice.Min(r => r.salePrice),
                maxSalePrice = (int)slice.Max(r => r.salePrice),
                saleCount = m,
                medianRatio = Math.Round(med, 4),
                deviationFromCountyMedian = Math.Round(med - countyMedian, 4),
            };
        }).ToList();

        return Ok(new
        {
            taxYear,
            sampleSize = n,
            countyMedianRatio = Math.Round(countyMedian, 4),
            deciles,
            interpretation = countyMedian > 0
                ? (deciles[8].deviationFromCountyMedian < -0.04 && deciles[1].deviationFromCountyMedian > 0.04
                    ? "Regressive: high-value properties under-assessed relative to low-value"
                    : deciles[8].deviationFromCountyMedian > 0.04 && deciles[1].deviationFromCountyMedian < -0.04
                    ? "Progressive: high-value properties over-assessed relative to low-value"
                    : "No significant vertical equity pattern detected")
                : "Unable to determine",
        });
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "GetVerticalEquity failed");
        return StatusCode(500, new { error = "Failed to compute vertical equity." });
    }
}
```

- [ ] **Step 2: Build and test**

```bash
dotnet build src/TerraFusion.API/TerraFusion.API.csproj -c Release 2>&1 | grep "error"
curl -s "http://localhost:5000/api/terraforge/ratio-study/vertical-equity?taxYear=2026" | python3 -m json.tool | head -40
```

Expected: 10 decile objects, each with `decile`, `minSalePrice`, `maxSalePrice`, `medianRatio`, `deviationFromCountyMedian`.

- [ ] **Step 3: Commit**

```bash
git add backend/src/TerraFusion.API/Controllers/TerraForgeController.cs
git commit -m "feat(backend): add vertical-equity endpoint (10 sale price deciles)

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task D3-P1: Remaining Backend Endpoints (stub implementations)

For P1-P3 endpoints, the following can be added as functional stubs that return real data where possible and return a structured `{ status: "not-yet-implemented" }` where complex computation (ML.NET, spatial weights) is not yet wired. This allows the frontend panels to be built and tested against real shapes.

- [ ] **Step 1: Add influence-diagnostics endpoint**

```csharp
[HttpGet("ratio-study/influence-diagnostics")]
public async Task<IActionResult> GetInfluenceDiagnostics(
    [FromQuery] int taxYear = 2026,
    [FromQuery] string? propertyType = null)
{
    try
    {
        var salesQuery = _context.ComparableSales
            .Where(cs => cs.TaxYear == taxYear && cs.QualificationDecision == "qualified" && cs.SalePrice > 0);
        if (!string.IsNullOrEmpty(propertyType))
            salesQuery = salesQuery.Where(cs => cs.PropertyType == propertyType);

        var sales = await salesQuery
            .Select(cs => new { cs.Id, cs.ParcelId, cs.SalePrice, cs.AdjustedSalePrice, cs.SaleDate })
            .ToListAsync();

        var parcelIds = sales.Select(s => s.ParcelId).ToList();
        var propMap = await _context.Properties
            .Where(p => parcelIds.Contains(p.ParcelNumber) && p.AssessedValue > 0)
            .Select(p => new { p.ParcelNumber, p.AssessedValue, p.Address })
            .ToDictionaryAsync(p => p.ParcelNumber);

        var records = sales
            .Where(s => propMap.ContainsKey(s.ParcelId))
            .Select(s =>
            {
                var sp = (double)(s.AdjustedSalePrice ?? s.SalePrice);
                var av = (double)propMap[s.ParcelId].AssessedValue!.Value;
                return new { s.Id, s.ParcelId, SalePrice = sp, Ratio = av / sp, Address = propMap[s.ParcelId].Address };
            })
            .Where(r => r.Ratio > 0.1 && r.Ratio < 5.0)
            .ToList();

        var n = records.Count;
        if (n < 5) return Ok(new { error = "Insufficient data.", sampleSize = n });

        var meanRatio = records.Average(r => r.Ratio);
        var variance = records.Average(r => Math.Pow(r.Ratio - meanRatio, 2));
        // Cook's D simplified: (ratio - mean)^2 / (p * MSE) where p=1 (intercept only model)
        var threshold = 4.0 / n;

        var items = records.Select(r =>
        {
            var cookD = Math.Pow(r.Ratio - meanRatio, 2) / Math.Max(variance, 1e-10);
            return new
            {
                saleId = r.Id.ToString(),
                parcelId = r.ParcelId,
                address = r.Address,
                salePrice = (long)r.SalePrice,
                ratio = Math.Round(r.Ratio, 4),
                cookD = Math.Round(cookD, 4),
                isInfluential = cookD > threshold,
            };
        })
        .OrderByDescending(r => r.cookD)
        .Take(100) // Return top 100 most influential
        .ToList();

        return Ok(new
        {
            taxYear,
            sampleSize = n,
            threshold = Math.Round(threshold, 4),
            influentialCount = items.Count(i => i.isInfluential),
            items,
        });
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "GetInfluenceDiagnostics failed");
        return StatusCode(500, new { error = "Failed to compute influence diagnostics." });
    }
}
```

- [ ] **Step 2: Add time-trend endpoint (functional stub)**

```csharp
[HttpGet("ratio-study/time-trend")]
public async Task<IActionResult> GetTimeTrend(
    [FromQuery] int taxYear = 2026,
    [FromQuery] string? propertyType = null)
{
    // Time trend requires repeat-sales pairs (same parcel sold 2+ times).
    // Returns monthly sale counts + ratio by month as a leading indicator.
    try
    {
        var salesQuery = _context.ComparableSales
            .Where(cs => cs.TaxYear == taxYear && cs.SaleDate != null && cs.SalePrice > 0);
        if (!string.IsNullOrEmpty(propertyType))
            salesQuery = salesQuery.Where(cs => cs.PropertyType == propertyType);

        var sales = await salesQuery
            .Select(cs => new { cs.ParcelId, cs.SalePrice, cs.AdjustedSalePrice, cs.SaleDate, cs.QualificationDecision })
            .ToListAsync();

        var parcelIds = sales.Select(s => s.ParcelId).ToList();
        var propMap = await _context.Properties
            .Where(p => parcelIds.Contains(p.ParcelNumber) && p.AssessedValue > 0)
            .Select(p => new { p.ParcelNumber, p.AssessedValue })
            .ToDictionaryAsync(p => p.ParcelNumber, p => p.AssessedValue);

        var byMonth = sales
            .Where(s => propMap.ContainsKey(s.ParcelId) && s.SaleDate.HasValue)
            .Select(s =>
            {
                var sp = (double)(s.AdjustedSalePrice ?? s.SalePrice);
                var av = (double)propMap[s.ParcelId]!.Value;
                return new { Month = s.SaleDate!.Value.ToString("yyyy-MM"), Ratio = av / sp, s.QualificationDecision };
            })
            .Where(r => r.Ratio > 0.1 && r.Ratio < 5.0)
            .GroupBy(r => r.Month)
            .Select(g =>
            {
                var ratios = g.Select(r => r.Ratio).OrderBy(r => r).ToList();
                var m = ratios.Count;
                var med = m % 2 == 0 ? (ratios[m / 2 - 1] + ratios[m / 2]) / 2.0 : ratios[m / 2];
                return new { month = g.Key, saleCount = m, medianRatio = Math.Round(med, 4) };
            })
            .OrderBy(r => r.month)
            .ToList();

        return Ok(new
        {
            taxYear,
            method = "monthly-median-ratio",
            note = "Full repeat-sales index (Case-Shiller) requires parcel-level multi-sale pairs — planned for P1 full implementation.",
            monthlyTrend = byMonth,
        });
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "GetTimeTrend failed");
        return StatusCode(500, new { error = "Failed to compute time trend." });
    }
}
```

- [ ] **Step 3: Add spatial-autocorrelation, hedonic-regression, variance-decomposition, sale-chasing, cross-validation, ks-shift-test stubs**

Add these to return structured responses with `status: "planned"` and a `note` field indicating what data/computation is needed. This allows frontend panels to render gracefully before full implementation:

```csharp
[HttpGet("ratio-study/spatial-autocorrelation")]
public IActionResult GetSpatialAutocorrelation([FromQuery] int taxYear = 2026)
{
    return Ok(new
    {
        taxYear,
        status = "planned",
        note = "Requires parcel centroid lat/lon data. Source: ArcGIS parcel layer or PACS geocoded addresses. Moran's I will be computed once coordinates are seeded.",
        moransI = (double?)null,
        pValue = (double?)null,
    });
}

[HttpGet("ratio-study/hedonic-regression")]
public IActionResult GetHedonicRegression([FromQuery] int taxYear = 2026, [FromQuery] string? propertyType = null)
{
    return Ok(new
    {
        taxYear, propertyType,
        status = "planned",
        note = "ML.NET OLS regression on CamaCharacteristics + ComparableSales. Requires GrossLivingArea, YearBuilt, ImprovementDetail feature sqft to be fully populated in PACS seeding.",
        coefficients = Array.Empty<object>(),
    });
}

[HttpGet("ratio-study/variance-decomposition")]
public IActionResult GetVarianceDecomposition([FromQuery] int taxYear = 2026)
{
    return Ok(new { taxYear, status = "planned", note = "Hierarchical mixed-effects model. Requires neighborhood grouping variable. Planned P2." });
}

[HttpGet("ratio-study/sale-chasing")]
public IActionResult GetSaleChasing([FromQuery] int taxYear = 2026)
{
    return Ok(new { taxYear, status = "planned", note = "ΔR² test requires pre-sale and post-sale assessed values for the same parcel. Planned P2." });
}

[HttpGet("ratio-study/cross-validation")]
public IActionResult GetCrossValidation([FromQuery] int taxYear = 2026)
{
    return Ok(new { taxYear, status = "planned", note = "5-fold cross-validation on hedonic model. Depends on hedonic-regression endpoint. Planned P2." });
}

[HttpGet("ratio-study/ks-shift-test")]
public async Task<IActionResult> GetKsShiftTest([FromQuery] int taxYear = 2026, [FromQuery] string? propertyType = null)
{
    // KS test can be implemented now — compare ratio distributions between taxYear-1 and taxYear
    try
    {
        var getYear = async (int year) =>
        {
            var q = _context.ComparableSales
                .Where(cs => cs.TaxYear == year && cs.QualificationDecision == "qualified" && cs.SalePrice > 0);
            if (!string.IsNullOrEmpty(propertyType)) q = q.Where(cs => cs.PropertyType == propertyType);
            var sales = await q.Select(cs => new { cs.ParcelId, cs.SalePrice, cs.AdjustedSalePrice }).ToListAsync();
            var pids = sales.Select(s => s.ParcelId).ToList();
            var props = await _context.Properties.Where(p => pids.Contains(p.ParcelNumber) && p.AssessedValue > 0)
                .Select(p => new { p.ParcelNumber, p.AssessedValue }).ToDictionaryAsync(p => p.ParcelNumber, p => p.AssessedValue);
            return sales.Where(s => props.ContainsKey(s.ParcelId))
                .Select(s => (double)props[s.ParcelId]!.Value / (double)(s.AdjustedSalePrice ?? s.SalePrice))
                .Where(r => r > 0.1 && r < 5.0).OrderBy(r => r).ToList();
        };

        var r1 = await getYear(taxYear);
        var r2 = await getYear(taxYear - 1);

        if (r1.Count < 5 || r2.Count < 5)
            return Ok(new { error = "Insufficient data for KS test.", currentYearCount = r1.Count, priorYearCount = r2.Count });

        // Two-sample KS statistic: max |F1(x) - F2(x)|
        var allValues = r1.Concat(r2).Distinct().OrderBy(v => v).ToList();
        double ksD = 0;
        foreach (var x in allValues)
        {
            var f1 = r1.Count(v => v <= x) / (double)r1.Count;
            var f2 = r2.Count(v => v <= x) / (double)r2.Count;
            ksD = Math.Max(ksD, Math.Abs(f1 - f2));
        }

        // Approximate p-value via Kolmogorov distribution
        var n1 = r1.Count; var n2 = r2.Count;
        var ksStat = ksD * Math.Sqrt((double)(n1 * n2) / (n1 + n2));
        // Use Marsaglia approximation for p-value
        var pValue = 2.0 * Math.Exp(-2.0 * ksStat * ksStat);
        pValue = Math.Min(1.0, Math.Max(0.0, pValue));

        return Ok(new
        {
            currentYear = taxYear,
            priorYear = taxYear - 1,
            currentYearCount = n1,
            priorYearCount = n2,
            ksStatistic = Math.Round(ksD, 4),
            pValue = Math.Round(pValue, 4),
            significantShift = pValue < 0.05,
            interpretation = pValue < 0.05
                ? $"Significant distributional shift detected between {taxYear - 1} and {taxYear} ratio distributions (p={pValue:F4}). Review reappraisal cycle or market conditions."
                : $"No significant distributional shift between {taxYear - 1} and {taxYear} (p={pValue:F4}).",
        });
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "GetKsShiftTest failed");
        return StatusCode(500, new { error = "Failed to compute KS shift test." });
    }
}
```

- [ ] **Step 4: Build all endpoints**

```bash
cd /c/Users/bsval/terrafusion_os_1.0/backend
dotnet build src/TerraFusion.API/TerraFusion.API.csproj -c Release 2>&1 | grep "^.*error"
```

Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add backend/src/TerraFusion.API/Controllers/TerraForgeController.cs
git commit -m "feat(backend): add P1-P3 deep analysis endpoints (influence, time-trend, spatial, hedonic, KS)

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task D4-P0: Frontend — ConfidenceIntervalBadge Component

**Files:**
- Create: `frontend/apps/os-shell/src/pages/forge/statistics/components/ConfidenceIntervalBadge.tsx`

- [ ] **Step 1: Create the directory and file**

```bash
mkdir -p /c/Users/bsval/terrafusion_os_1.0/frontend/apps/os-shell/src/pages/forge/statistics/components
touch /c/Users/bsval/terrafusion_os_1.0/frontend/apps/os-shell/src/pages/forge/statistics/components/ConfidenceIntervalBadge.tsx
```

- [ ] **Step 2: Write the component**

```typescript
/**
 * ConfidenceIntervalBadge.tsx
 *
 * Renders a statistic with its 95% bootstrap CI in bracket notation.
 * e.g. 0.974 [0.961 – 0.987]
 */

import React from 'react';

interface CIValue {
  point: number;
  lo: number;
  hi: number;
}

interface ConfidenceIntervalBadgeProps {
  value: CIValue | null | undefined;
  decimals?: number;
  suffix?: string;
  loading?: boolean;
}

export function ConfidenceIntervalBadge({
  value,
  decimals = 4,
  suffix = '',
  loading = false,
}: ConfidenceIntervalBadgeProps) {
  if (loading) return <span className="text-muted-foreground">…</span>;
  if (!value) return <span className="text-muted-foreground">—</span>;

  return (
    <span className="font-mono text-sm">
      <span className="font-semibold">{value.point.toFixed(decimals)}{suffix}</span>
      <span className="text-muted-foreground text-xs ml-1">
        [{value.lo.toFixed(decimals)} – {value.hi.toFixed(decimals)}]
      </span>
    </span>
  );
}
```

- [ ] **Step 3: TypeScript check**

```bash
cd /c/Users/bsval/terrafusion_os_1.0/frontend && npx tsc --noEmit 2>&1 | grep "error" | grep -i "confidence"
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/apps/os-shell/src/pages/forge/statistics/components/ConfidenceIntervalBadge.tsx
git commit -m "feat: add ConfidenceIntervalBadge shared component

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task D5-P0: Frontend — DiagnosticsTab.tsx

**Files:**
- Create: `frontend/apps/os-shell/src/pages/forge/statistics/panels/DiagnosticsTab.tsx`

- [ ] **Step 1: Create the directory and file**

```bash
mkdir -p /c/Users/bsval/terrafusion_os_1.0/frontend/apps/os-shell/src/pages/forge/statistics/panels
touch /c/Users/bsval/terrafusion_os_1.0/frontend/apps/os-shell/src/pages/forge/statistics/panels/DiagnosticsTab.tsx
```

- [ ] **Step 2: Write the component**

```typescript
/**
 * DiagnosticsTab.tsx
 *
 * Advanced diagnostics for credentialed mass appraisal staff.
 * Surfaces: Vertical Equity by Decile, Cook's D Influence Diagnostics,
 * Variance Decomposition (planned), Sale Chasing Detection (planned).
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiFetch } from '@/lib/apiBase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { ConfidenceIntervalBadge } from '../components/ConfidenceIntervalBadge';
import { activateModule } from '../../../../orchestration/moduleActivation';

interface DecileRow {
  decile: number;
  minSalePrice: number;
  maxSalePrice: number;
  saleCount: number;
  medianRatio: number;
  deviationFromCountyMedian: number;
}

interface VerticalEquityResponse {
  taxYear: number;
  sampleSize: number;
  countyMedianRatio: number;
  deciles: DecileRow[];
  interpretation: string;
  error?: string;
}

interface InfluenceItem {
  saleId: string;
  parcelId: string;
  address: string | null;
  salePrice: number;
  ratio: number;
  cookD: number;
  isInfluential: boolean;
}

interface InfluenceResponse {
  taxYear: number;
  sampleSize: number;
  threshold: number;
  influentialCount: number;
  items: InfluenceItem[];
  error?: string;
}

interface CIResponse {
  median: { point: number; lo: number; hi: number };
  cod: { point: number; lo: number; hi: number };
  prd: { point: number; lo: number; hi: number };
  prb: { point: number; lo: number; hi: number };
  sampleSize: number;
  error?: string;
}

function deviationColor(dev: number): string {
  const abs = Math.abs(dev);
  if (abs <= 0.04) return '#22c55e'; // green
  if (abs <= 0.08) return '#f59e0b'; // amber
  return '#ef4444'; // red
}

export function DiagnosticsTab() {
  const taxYear = 2026;

  const { data: vei, isLoading: veiLoading } = useQuery<VerticalEquityResponse>({
    queryKey: ['vertical-equity', taxYear],
    queryFn: () => apiFetch(`/terraforge/ratio-study/vertical-equity?taxYear=${taxYear}`).then((r) => r.json()),
    staleTime: 10 * 60_000,
  });

  const { data: influence, isLoading: infLoading } = useQuery<InfluenceResponse>({
    queryKey: ['influence-diagnostics', taxYear],
    queryFn: () => apiFetch(`/terraforge/ratio-study/influence-diagnostics?taxYear=${taxYear}`).then((r) => r.json()),
    staleTime: 10 * 60_000,
  });

  const { data: ci, isLoading: ciLoading } = useQuery<CIResponse>({
    queryKey: ['confidence-intervals', taxYear],
    queryFn: () => apiFetch(`/terraforge/ratio-study/confidence-intervals?taxYear=${taxYear}`).then((r) => r.json()),
    staleTime: 10 * 60_000,
  });

  const chartData = (vei?.deciles ?? []).map((d) => ({
    name: `D${d.decile}`,
    deviation: d.deviationFromCountyMedian,
    fill: deviationColor(d.deviationFromCountyMedian),
    tooltip: `$${d.minSalePrice.toLocaleString()} – $${d.maxSalePrice.toLocaleString()} · N=${d.saleCount} · Median=${d.medianRatio.toFixed(4)}`,
  }));

  return (
    <div className="space-y-4" data-testid="diagnostics-tab">
      {/* 95% CI Summary */}
      <Card data-material="bento">
        <CardHeader>
          <CardTitle>95% Bootstrap Confidence Intervals</CardTitle>
        </CardHeader>
        <CardContent>
          {ciLoading && <p className="text-muted-foreground">Computing 1,000 resamples…</p>}
          {ci && !ci.error && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Median Ratio</div>
                <ConfidenceIntervalBadge value={ci.median} decimals={4} />
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">COD</div>
                <ConfidenceIntervalBadge value={ci.cod} decimals={2} />
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">PRD</div>
                <ConfidenceIntervalBadge value={ci.prd} decimals={4} />
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">PRB</div>
                <ConfidenceIntervalBadge value={ci.prb} decimals={4} />
              </div>
            </div>
          )}
          {ci?.error && <p className="text-muted-foreground text-sm">{ci.error}</p>}
        </CardContent>
      </Card>

      {/* Vertical Equity by Decile */}
      <Card data-material="bento">
        <CardHeader>
          <CardTitle>Vertical Equity — Ratio Deviation by Value Decile</CardTitle>
        </CardHeader>
        <CardContent>
          {veiLoading && <p className="text-muted-foreground">Loading…</p>}
          {vei?.error && <p className="text-muted-foreground text-sm">{vei.error}</p>}
          {vei && !vei.error && (
            <>
              <p className="text-sm text-muted-foreground mb-3">
                {vei.interpretation} · County median: {vei.countyMedianRatio.toFixed(4)} · N={vei.sampleSize}
              </p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData} margin={{ left: 10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis
                    tickFormatter={(v) => v.toFixed(2)}
                    domain={[-0.20, 0.20]}
                    label={{ value: 'Deviation', angle: -90, position: 'insideLeft', offset: 10 }}
                  />
                  <Tooltip formatter={(v: number, _: string, p: { payload: { tooltip: string } }) => [p.payload.tooltip, 'Decile']} />
                  <ReferenceLine y={0} stroke="#64748b" strokeDasharray="4 4" />
                  <ReferenceLine y={0.04}  stroke="#f59e0b" strokeDasharray="2 2" strokeOpacity={0.6} />
                  <ReferenceLine y={-0.04} stroke="#f59e0b" strokeDasharray="2 2" strokeOpacity={0.6} />
                  <Bar dataKey="deviation" radius={[2, 2, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <rect key={index} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <p className="text-xs text-muted-foreground mt-2">
                D1 = lowest 10% of sales by price · D10 = highest 10% ·
                Amber lines at ±0.04 threshold · Green = OK · Amber = moderate · Red = equity concern
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Cook's D Influence Diagnostics */}
      <Card data-material="bento">
        <CardHeader>
          <CardTitle>Influence Diagnostics — Cook's Distance</CardTitle>
        </CardHeader>
        <CardContent>
          {infLoading && <p className="text-muted-foreground">Loading…</p>}
          {influence?.error && <p className="text-muted-foreground text-sm">{influence.error}</p>}
          {influence && !influence.error && (
            <>
              <p className="text-sm text-muted-foreground mb-3">
                Threshold: 4/N = {influence.threshold.toFixed(4)} ·{' '}
                <span className={influence.influentialCount > 10 ? 'text-amber-500' : 'text-green-500'}>
                  {influence.influentialCount} influential sales
                </span>{' '}
                of {influence.sampleSize} total
              </p>
              <div className="overflow-x-auto max-h-64 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-background">
                    <tr className="border-b">
                      <th className="py-1 pr-3 text-left">Parcel / Address</th>
                      <th className="py-1 pr-3 text-right">Sale Price</th>
                      <th className="py-1 pr-3 text-right">Ratio</th>
                      <th className="py-1 pr-3 text-right">Cook's D</th>
                      <th className="py-1 text-center">Flag</th>
                    </tr>
                  </thead>
                  <tbody>
                    {influence.items.map((item) => (
                      <tr
                        key={item.saleId}
                        className={`border-b hover:bg-white/5 cursor-pointer ${item.isInfluential ? 'bg-amber-500/5' : ''}`}
                        onClick={() => void activateModule('sales-forge', { source: 'system', metadata: { saleId: item.saleId } })}
                      >
                        <td className="py-1 pr-3">
                          <div className="font-mono text-xs">{item.parcelId}</div>
                          {item.address && <div className="text-muted-foreground">{item.address}</div>}
                        </td>
                        <td className="py-1 pr-3 text-right font-mono">${item.salePrice.toLocaleString()}</td>
                        <td className="py-1 pr-3 text-right font-mono">{item.ratio.toFixed(4)}</td>
                        <td className="py-1 pr-3 text-right font-mono">{item.cookD.toFixed(4)}</td>
                        <td className="py-1 text-center">
                          {item.isInfluential ? <span className="text-amber-500">⚠</span> : <span className="text-green-500">✓</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Click any row to review the sale in SalesForge. Influential sales (Cook's D &gt; threshold) disproportionately affect ratio statistics.
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Planned: Variance Decomp + Sale Chasing */}
      <Card data-material="bento" className="opacity-60">
        <CardHeader>
          <CardTitle>Variance Decomposition &amp; Sale Chasing Detection</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Planned (P2): Hierarchical ICC decomposition (between vs. within neighborhood) and ΔR² sale-chasing test.
            These require neighborhood grouping and pre/post-sale assessed value pairs from the PACS working roll.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 3: Fix Bar chart Cell rendering**

The Recharts `Bar` with per-bar color requires using `Cell`. Replace the `<Bar>` block in the component above with:

```tsx
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
```

And inside the `<Bar>`:
```tsx
<Bar dataKey="deviation" radius={[2, 2, 0, 0]}>
  {chartData.map((entry, index) => (
    <Cell key={`cell-${index}`} fill={entry.fill} />
  ))}
</Bar>
```

- [ ] **Step 4: TypeScript check**

```bash
cd /c/Users/bsval/terrafusion_os_1.0/frontend && npx tsc --noEmit 2>&1 | grep "error" | grep -i "diagnostic"
```

- [ ] **Step 5: Commit**

```bash
git add frontend/apps/os-shell/src/pages/forge/statistics/panels/DiagnosticsTab.tsx
git commit -m "feat: add DiagnosticsTab with CI badges, vertical equity chart, Cook's D table

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task D6-P1: Frontend — SpatialTemporalTab.tsx

**Files:**
- Create: `frontend/apps/os-shell/src/pages/forge/statistics/panels/SpatialTemporalTab.tsx`

- [ ] **Step 1: Create and write the file**

```typescript
/**
 * SpatialTemporalTab.tsx
 *
 * Spatial and temporal analytics for advanced assessment staff.
 * Surfaces: Monthly Ratio Trend, Moran's I spatial autocorrelation (planned),
 * KS Distributional Shift Test.
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiFetch } from '@/lib/apiBase';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface MonthlyRow {
  month: string;
  saleCount: number;
  medianRatio: number;
}

interface TimeTrendResponse {
  taxYear: number;
  method: string;
  note: string;
  monthlyTrend: MonthlyRow[];
}

interface KsResponse {
  currentYear: number;
  priorYear: number;
  currentYearCount: number;
  priorYearCount: number;
  ksStatistic: number;
  pValue: number;
  significantShift: boolean;
  interpretation: string;
  error?: string;
}

export function SpatialTemporalTab() {
  const taxYear = 2026;

  const { data: timeTrend, isLoading: trendLoading } = useQuery<TimeTrendResponse>({
    queryKey: ['time-trend', taxYear],
    queryFn: () => apiFetch(`/terraforge/ratio-study/time-trend?taxYear=${taxYear}`).then((r) => r.json()),
    staleTime: 10 * 60_000,
  });

  const { data: ks, isLoading: ksLoading } = useQuery<KsResponse>({
    queryKey: ['ks-shift-test', taxYear],
    queryFn: () => apiFetch(`/terraforge/ratio-study/ks-shift-test?taxYear=${taxYear}`).then((r) => r.json()),
    staleTime: 10 * 60_000,
  });

  return (
    <div className="space-y-4" data-testid="spatial-temporal-tab">
      {/* Monthly Ratio Trend */}
      <Card data-material="bento">
        <CardHeader>
          <CardTitle>Monthly Median Ratio Trend — {taxYear}</CardTitle>
        </CardHeader>
        <CardContent>
          {trendLoading && <p className="text-muted-foreground">Loading…</p>}
          {timeTrend && (
            <>
              {timeTrend.note && (
                <p className="text-xs text-amber-500 mb-3">ℹ {timeTrend.note}</p>
              )}
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={timeTrend.monthlyTrend} margin={{ left: 10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0.80, 1.20]} tickFormatter={(v) => v.toFixed(3)} />
                  <Tooltip formatter={(v: number) => v.toFixed(4)} />
                  <ReferenceLine y={1.0} stroke="#64748b" strokeDasharray="4 4" label={{ value: '1.000', position: 'right', fontSize: 10 }} />
                  <ReferenceLine y={0.90} stroke="#ef4444" strokeDasharray="2 2" strokeOpacity={0.5} />
                  <ReferenceLine y={1.10} stroke="#ef4444" strokeDasharray="2 2" strokeOpacity={0.5} />
                  <Line
                    type="monotone"
                    dataKey="medianRatio"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    name="Median Ratio"
                  />
                </LineChart>
              </ResponsiveContainer>
              <p className="text-xs text-muted-foreground mt-2">
                Red dashed lines at IAAO bounds (0.90–1.10) · Hover for monthly detail
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Moran's I — Planned */}
      <Card data-material="bento" className="opacity-60">
        <CardHeader>
          <CardTitle>Spatial Autocorrelation — Moran's I</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Planned (P1): Requires parcel centroid coordinates (lat/lon) from ArcGIS parcel layer.
            Will compute Moran's I statistic with permutation p-value and render a spatial quartile map.
            Once coordinate data is seeded, implement via k-nearest-neighbor spatial weight matrix (k=8).
          </p>
        </CardContent>
      </Card>

      {/* KS Distributional Shift Test */}
      <Card data-material="bento">
        <CardHeader>
          <CardTitle>Distributional Shift Test — {taxYear - 1} vs {taxYear}</CardTitle>
        </CardHeader>
        <CardContent>
          {ksLoading && <p className="text-muted-foreground">Loading…</p>}
          {ks?.error && <p className="text-muted-foreground text-sm">{ks.error}</p>}
          {ks && !ks.error && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-xs text-muted-foreground">{taxYear} sales</div>
                  <div className="font-semibold">{ks.currentYearCount.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">{taxYear - 1} sales</div>
                  <div className="font-semibold">{ks.priorYearCount.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">KS Statistic (D)</div>
                  <div className="font-mono font-semibold">{ks.ksStatistic.toFixed(4)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">p-value</div>
                  <div className={`font-mono font-semibold ${ks.significantShift ? 'text-amber-500' : 'text-green-500'}`}>
                    {ks.pValue.toFixed(4)}
                  </div>
                </div>
              </div>
              <div className={`rounded p-3 text-sm ${ks.significantShift ? 'bg-amber-500/10 text-amber-400' : 'bg-green-500/10 text-green-400'}`}>
                {ks.significantShift ? '⚠ ' : '✓ '}{ks.interpretation}
              </div>
              <p className="text-xs text-muted-foreground">
                Kolmogorov-Smirnov two-sample test on qualified sale ratio distributions.
                p &lt; 0.05 indicates significant distributional shift between study years.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: TypeScript check + commit**

```bash
cd /c/Users/bsval/terrafusion_os_1.0/frontend && npx tsc --noEmit 2>&1 | grep "error" | grep -i "spatial"
git add frontend/apps/os-shell/src/pages/forge/statistics/panels/SpatialTemporalTab.tsx
git commit -m "feat: add SpatialTemporalTab with monthly trend chart and KS shift test

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task D7-P1: Frontend — CalibrationEngineTab.tsx

**Files:**
- Create: `frontend/apps/os-shell/src/pages/forge/statistics/panels/CalibrationEngineTab.tsx`

- [ ] **Step 1: Create and write the file**

```typescript
/**
 * CalibrationEngineTab.tsx
 *
 * Hedonic regression vs cost schedule comparison + cross-validation.
 * Shows where the cost schedule diverges from market-derived feature values.
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiFetch } from '@/lib/apiBase';

interface HedonicResponse {
  taxYear: number;
  status: string;
  note?: string;
  coefficients: Array<{
    feature: string;
    beta: number;
    impliedDollar: number | null;
    scheduleAmount: number | null;
    gap: number | null;
    signal: string;
  }>;
}

export function CalibrationEngineTab() {
  const taxYear = 2026;

  const { data: hedonic, isLoading } = useQuery<HedonicResponse>({
    queryKey: ['hedonic-regression', taxYear],
    queryFn: () => apiFetch(`/terraforge/ratio-study/hedonic-regression?taxYear=${taxYear}&propertyType=Residential`).then((r) => r.json()),
    staleTime: 15 * 60_000,
  });

  return (
    <div className="space-y-4" data-testid="calibration-engine-tab">
      <Card data-material="bento">
        <CardHeader>
          <CardTitle>Hedonic Regression vs Cost Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && <p className="text-muted-foreground">Loading…</p>}
          {hedonic?.status === 'planned' && (
            <div className="space-y-3">
              <p className="text-sm text-amber-500">⚠ Planned implementation</p>
              <p className="text-sm text-muted-foreground">{hedonic.note}</p>
              <div className="rounded border p-4 text-sm space-y-2">
                <p className="font-semibold">When implemented, this surface will show:</p>
                <table className="w-full text-xs mt-2">
                  <thead>
                    <tr className="border-b">
                      <th className="py-1 text-left">Feature</th>
                      <th className="py-1 text-right">Hedonic β</th>
                      <th className="py-1 text-right">Implied $/sqft</th>
                      <th className="py-1 text-right">Cost Schedule $</th>
                      <th className="py-1 text-right">Gap</th>
                      <th className="py-1 text-left">Signal</th>
                    </tr>
                  </thead>
                  <tbody className="text-muted-foreground">
                    <tr className="border-b"><td className="py-1">GLA (per sqft)</td><td className="py-1 text-right">0.00212</td><td className="py-1 text-right">$148</td><td className="py-1 text-right">$148</td><td className="py-1 text-right">$0</td><td className="py-1">OK</td></tr>
                    <tr className="border-b"><td className="py-1">Basement (sqft)</td><td className="py-1 text-right">0.00089</td><td className="py-1 text-right">$62</td><td className="py-1 text-right">$45</td><td className="py-1 text-right text-amber-500">+$17</td><td className="py-1 text-amber-500">Schedule low</td></tr>
                    <tr><td className="py-1">Pool</td><td className="py-1 text-right">0.031</td><td className="py-1 text-right">$14,200</td><td className="py-1 text-right">$18,000</td><td className="py-1 text-right text-red-500">–$3,800</td><td className="py-1 text-red-500">Schedule high</td></tr>
                  </tbody>
                </table>
                <p className="text-xs text-muted-foreground mt-2">
                  Model: ln(SalePrice) = β₀ + β₁·GLA + β₂·Age + β₃·BSMT_sqft + β₄·POOL + β₅·ATTGAR + ε
                </p>
              </div>
            </div>
          )}
          {hedonic?.coefficients && hedonic.coefficients.length > 0 && (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="py-2 text-left">Feature</th>
                  <th className="py-2 text-right">Hedonic β</th>
                  <th className="py-2 text-right">Implied $</th>
                  <th className="py-2 text-right">Schedule $</th>
                  <th className="py-2 text-right">Gap</th>
                  <th className="py-2 text-left">Signal</th>
                </tr>
              </thead>
              <tbody>
                {hedonic.coefficients.map((c) => (
                  <tr key={c.feature} className="border-b">
                    <td className="py-2 font-medium">{c.feature}</td>
                    <td className="py-2 text-right font-mono">{c.beta.toFixed(5)}</td>
                    <td className="py-2 text-right">{c.impliedDollar != null ? `$${Math.round(c.impliedDollar).toLocaleString()}` : '—'}</td>
                    <td className="py-2 text-right">{c.scheduleAmount != null ? `$${Math.round(c.scheduleAmount).toLocaleString()}` : '—'}</td>
                    <td className={`py-2 text-right font-mono ${c.gap != null && c.gap > 0 ? 'text-amber-500' : c.gap != null && c.gap < 0 ? 'text-red-500' : ''}`}>
                      {c.gap != null ? `${c.gap > 0 ? '+' : ''}$${Math.round(c.gap).toLocaleString()}` : '—'}
                    </td>
                    <td className="py-2 text-muted-foreground text-xs">{c.signal}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Card data-material="bento" className="opacity-60">
        <CardHeader>
          <CardTitle>Cross-Validation (5-Fold)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Planned (P2): 5-fold cross-validation on hedonic model to validate generalizability.
            Reports RMSE, MAE, MAPE per fold and aggregate. Depends on hedonic regression implementation.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: TypeScript check + commit**

```bash
cd /c/Users/bsval/terrafusion_os_1.0/frontend && npx tsc --noEmit 2>&1 | grep "error" | grep -i "calibration"
git add frontend/apps/os-shell/src/pages/forge/statistics/panels/CalibrationEngineTab.tsx
git commit -m "feat: add CalibrationEngineTab with hedonic vs schedule comparison

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task D8-P0: Wire Advanced Tabs into StatisticsStudio

**Files:**
- Modify: `frontend/apps/os-shell/src/pages/forge/statistics/StatisticsStudio.tsx`

- [ ] **Step 1: Add imports**

After the existing import block, add:

```typescript
import { DiagnosticsTab } from './panels/DiagnosticsTab';
import { SpatialTemporalTab } from './panels/SpatialTemporalTab';
import { CalibrationEngineTab } from './panels/CalibrationEngineTab';
```

- [ ] **Step 2: Extend Tab type**

Find the current `Tab` type (which now includes `'stratified'` from Phase B+C) and add the three new tabs:

```typescript
type Tab = 'ratio-study' | 'stratified' | 'trends' | 'equity' | 'outliers' | 'comparison' | 'calibration' | 'cost-analytics' | 'diagnostics' | 'spatial-temporal' | 'calibration-engine';
```

- [ ] **Step 3: Add advancedMode state**

Inside the `StatisticsStudio` component function, after the existing `useState` calls:

```typescript
const [advancedMode, setAdvancedMode] = useState(false);
```

- [ ] **Step 4: Add advanced tabs to the tabs array**

The existing `tabs` array drives the buttons. After the current last entry, add a conditional spread:

```typescript
const tabs: { key: Tab; label: string }[] = [
  { key: 'ratio-study',   label: 'Ratio Study' },
  { key: 'stratified',    label: 'Stratified Study' },
  { key: 'calibration',   label: 'Calibration Matrix' },
  { key: 'trends',        label: 'Trends' },
  { key: 'equity',        label: 'Equity (VEI)' },
  { key: 'outliers',      label: 'Outliers' },
  { key: 'comparison',    label: 'Comparison' },
  { key: 'cost-analytics',label: 'Cost Analytics' },
  ...(advancedMode
    ? [
        { key: 'diagnostics' as Tab,        label: 'Diagnostics' },
        { key: 'spatial-temporal' as Tab,   label: 'Spatial & Temporal' },
        { key: 'calibration-engine' as Tab, label: 'Calibration Engine' },
      ]
    : []),
];
```

- [ ] **Step 5: Add the Advanced Analysis toggle to the header**

Find the header `<div className="flex items-center justify-between">` block. Add the toggle after the badge:

```tsx
<div className="flex items-center gap-3">
  <h1 className="text-2xl font-bold">Statistics Studio</h1>
  <Badge variant="secondary">IAAO Compliant</Badge>
  <button
    type="button"
    onClick={() => {
      setAdvancedMode((prev) => !prev);
      if (advancedMode) setActiveTab('ratio-study');
    }}
    className={`text-xs px-2 py-1 rounded border transition-colors ${
      advancedMode
        ? 'border-blue-500 text-blue-400 bg-blue-500/10'
        : 'border-muted text-muted-foreground hover:text-foreground'
    }`}
    data-testid="advanced-mode-toggle"
  >
    {advancedMode ? 'Advanced Analysis ✓' : 'Show Advanced Analysis'}
  </button>
</div>
```

- [ ] **Step 6: Add tab content render blocks**

After the existing `{activeTab === 'cost-analytics' && ...}` block, add:

```tsx
{/* Advanced tabs — gated by advancedMode toggle */}
{activeTab === 'diagnostics' && advancedMode && <DiagnosticsTab />}
{activeTab === 'spatial-temporal' && advancedMode && <SpatialTemporalTab />}
{activeTab === 'calibration-engine' && advancedMode && <CalibrationEngineTab />}
```

- [ ] **Step 7: TypeScript check**

```bash
cd /c/Users/bsval/terrafusion_os_1.0/frontend && npx tsc --noEmit 2>&1 | grep error | head -20
```

Expected: 0 errors.

- [ ] **Step 8: Verify in browser**

- Statistics Studio header shows "Show Advanced Analysis" button.
- Clicking it reveals 3 new tab buttons: Diagnostics, Spatial & Temporal, Calibration Engine.
- Diagnostics tab shows CI badges, vertical equity chart, Cook's D table.
- Spatial & Temporal shows monthly ratio trend line chart and KS test results.
- Calibration Engine shows hedonic comparison (with "planned" notice until ML.NET endpoint is implemented).
- Clicking "Show Advanced Analysis" again hides the advanced tabs and resets to Ratio Study.

- [ ] **Step 9: Commit**

```bash
git add frontend/apps/os-shell/src/pages/forge/statistics/StatisticsStudio.tsx
git commit -m "feat: wire advanced analysis tabs (Diagnostics, Spatial, Calibration Engine) with toggle gate

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Phase D Complete

Final validation:

```bash
# Frontend
cd /c/Users/bsval/terrafusion_os_1.0/frontend && npx tsc --noEmit 2>&1 | grep error | head -20

# Backend
cd /c/Users/bsval/terrafusion_os_1.0/backend && dotnet build src/TerraFusion.API/TerraFusion.API.csproj -c Release 2>&1 | grep "error"
```

Both expected: 0 errors.

Final checklist:
- [ ] "Show Advanced Analysis" toggle visible in Statistics Studio header
- [ ] Toggle reveals Diagnostics / Spatial & Temporal / Calibration Engine tabs
- [ ] Toggle off hides advanced tabs and resets to Ratio Study
- [ ] Diagnostics: CI badges show `[lo – hi]` bracket notation for all 4 stats
- [ ] Diagnostics: Vertical equity decile chart shows 10 bars, green/amber/red coloring
- [ ] Diagnostics: Cook's D table shows top 100 influential sales, click opens SalesForge
- [ ] Spatial & Temporal: Monthly ratio trend chart renders with IAAO bound lines
- [ ] Spatial & Temporal: KS test shows statistic + p-value + interpretation text
- [ ] Calibration Engine: Hedonic panel shows "planned" notice with example table structure
- [ ] Moran's I and remaining P2/P3 items show "planned" notices — not blank screens

## P2/P3 Completion Path

When coordinate data becomes available:
- Implement Moran's I in `TerraForgeController.cs` `GetSpatialAutocorrelation` — replace stub with k-NN weight matrix computation and permutation test.

When ML.NET integration is ready:
- Implement `GetHedonicRegression` with `MLContext` OLS on `CamaCharacteristics` + `ComparableSales` join.
- Implement `GetCrossValidation` as 5-fold wrapper around the hedonic model.

When pre/post-sale assessed values are seeded:
- Implement `GetVarianceDecomposition` with one-way ANOVA ICC.
- Implement `GetSaleChasing` with ΔR² test comparing sale vs. non-sale parcel regression R².
