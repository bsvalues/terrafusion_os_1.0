// GeoForge v2 — Audit Command Center backend surfaces.
//   - Real parcel polygon tiles (from GisParcelGeometries.RingJson)
//   - Concave-hull neighborhood boundaries (replaces convex-hull blobs)
//   - AI audit engine with root-cause taxonomy
//
// This file is a partial-class extension of GeoForgeController. No routes are
// renamed; v2 adds NEW routes under /api/geoforge/v2/*. Old v1 routes remain
// untouched so the existing map keeps working during rollout.

using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace TerraFusion.API.Controllers;

public partial class GeoForgeController
{
    // ──────────────────────────────────────────────────────────────────────
    //  v2/parcels/tiles   —  real parcel polygons with stats, bbox-filtered.
    // ──────────────────────────────────────────────────────────────────────
    [HttpGet("v2/parcels/tiles")]
    public async Task<IActionResult> GetParcelTilesV2(
        [FromQuery] string? bbox = null,       // "w,s,e,n"
        [FromQuery] int taxYear = 0,
        [FromQuery] string? neighborhoodCode = null,
        [FromQuery] string? propertyClass = null,
        [FromQuery] int limit = 4000,
        CancellationToken ct = default)
    {
        if (taxYear == 0) taxYear = DateTime.UtcNow.Year;

        // Parse bbox
        double? west = null, south = null, east = null, north = null;
        if (!string.IsNullOrWhiteSpace(bbox))
        {
            var parts = bbox.Split(',');
            if (parts.Length == 4
                && double.TryParse(parts[0], out var w)
                && double.TryParse(parts[1], out var s)
                && double.TryParse(parts[2], out var e)
                && double.TryParse(parts[3], out var n))
            {
                west = w; south = s; east = e; north = n;
            }
        }

        // ── Geometries in bbox ───────────────────────────────────────────
        var geoQuery = _db.GisParcelGeometries
            .AsNoTracking()
            .Where(g => g.RingJson != null
                     && g.CentroidLat.HasValue
                     && g.CentroidLng.HasValue);

        if (west.HasValue)
            geoQuery = geoQuery.Where(g =>
                g.CentroidLng >= west && g.CentroidLng <= east
                && g.CentroidLat >= south && g.CentroidLat <= north);

        if (!string.IsNullOrWhiteSpace(neighborhoodCode))
            geoQuery = geoQuery.Where(g => g.NeighborhoodCode == neighborhoodCode);

        var geos = await geoQuery
            .Select(g => new
            {
                g.ParcelId,
                g.RingJson,
                g.CentroidLat,
                g.CentroidLng,
                g.NeighborhoodCode,
                g.AreaAcres,
                g.YearBuilt,
                g.OwnerName,
                g.SitusAddress,
                g.PrimaryUse,
            })
            .Take(limit)
            .ToListAsync(ct);

        if (geos.Count == 0)
            return Ok(new { type = "FeatureCollection", features = Array.Empty<object>() });

        var parcelIds = geos.Select(g => g.ParcelId).ToHashSet();

        // ── Properties (AV, class, taxYear) ──────────────────────────────
        var propQuery = _db.Properties
            .AsNoTracking()
            .Where(p => p.CountyId == BentonCountyId
                     && p.TaxYear == taxYear
                     && parcelIds.Contains(p.ParcelNumber));

        if (!string.IsNullOrWhiteSpace(propertyClass))
            propQuery = propQuery.Where(p => p.PropertyType == propertyClass);

        var props = await propQuery
            .Select(p => new
            {
                p.ParcelNumber,
                p.AssessedValue,
                p.PropertyType,
                p.Neighborhood,
            })
            .ToDictionaryAsync(p => p.ParcelNumber, ct);

        // ── Sales + ratios ───────────────────────────────────────────────
        var sales = await _db.ComparableSales
            .AsNoTracking()
            .Where(s => s.CountyId == BentonCountyId
                     && s.SalesYear == taxYear
                     && s.ParcelId != null
                     && parcelIds.Contains(s.ParcelId!))
            .Select(s => new
            {
                ParcelId = s.ParcelId!,
                s.SaleDate,
                SalePrice = s.AdjustedSalePrice ?? s.SalePrice,
                s.QualificationDecision,
                s.QualificationRecommendation,
            })
            .ToListAsync(ct);

        var saleMap = sales
            .GroupBy(s => s.ParcelId)
            .ToDictionary(g => g.Key, g => g.OrderByDescending(s => s.SaleDate).First());

        // ── Neighborhood median ratios for deviation coloring ────────────
        var nbhdMedianMap = new Dictionary<string, double>();
        {
            var ratioBuckets = new Dictionary<string, List<double>>();
            foreach (var s in sales.Where(s => s.SalePrice > 10_000m))
            {
                if (!props.TryGetValue(s.ParcelId, out var p) || p.Neighborhood is null)
                    continue;
                if (p.AssessedValue <= 0) continue;
                var ratio = (double)(p.AssessedValue / s.SalePrice);
                if (!ratioBuckets.ContainsKey(p.Neighborhood))
                    ratioBuckets[p.Neighborhood] = new();
                ratioBuckets[p.Neighborhood].Add(ratio);
            }
            foreach (var (nbhd, ratios) in ratioBuckets)
            {
                ratios.Sort();
                nbhdMedianMap[nbhd] = ratios[ratios.Count / 2];
            }
        }

        // ── Build GeoJSON features ───────────────────────────────────────
        var features = new List<object>(geos.Count);
        foreach (var g in geos)
        {
            if (string.IsNullOrEmpty(g.RingJson)) continue;

            // RingJson is [[x,y,...], ...] in ArcGIS Web-Mercator or WGS-84.
            // ArcGisSyncService stores outer ring vertices. Parse defensively.
            List<List<double>>? ring;
            try
            {
                ring = JsonSerializer.Deserialize<List<List<double>>>(g.RingJson);
            }
            catch { continue; }
            if (ring is null || ring.Count < 3) continue;

            // Close ring if not closed.
            if (ring[0].Count >= 2 && ring[^1].Count >= 2
                && (ring[0][0] != ring[^1][0] || ring[0][1] != ring[^1][1]))
            {
                ring.Add(new List<double> { ring[0][0], ring[0][1] });
            }

            var prop = props.TryGetValue(g.ParcelId, out var p2) ? p2 : null;
            var sale = saleMap.TryGetValue(g.ParcelId, out var s2) ? s2 : null;

            double? ratio = null;
            if (prop is not null && sale is not null
                && sale.SalePrice > 10_000m && prop.AssessedValue > 0)
            {
                ratio = (double)(prop.AssessedValue / sale.SalePrice);
            }

            var nbhdCode = prop?.Neighborhood ?? g.NeighborhoodCode;
            double? nbhdMedian = nbhdCode != null && nbhdMedianMap.TryGetValue(nbhdCode, out var m)
                ? m : null;

            var deviation = ratio.HasValue && nbhdMedian.HasValue
                ? ratio.Value - nbhdMedian.Value
                : (double?)null;

            bool isOutlier = deviation.HasValue && Math.Abs(deviation.Value) >= 0.20;

            var qual = sale?.QualificationDecision ?? sale?.QualificationRecommendation;

            features.Add(new
            {
                type = "Feature",
                geometry = new
                {
                    type = "Polygon",
                    coordinates = new[] { ring.Select(p => p.Count >= 2 ? new[] { p[0], p[1] } : Array.Empty<double>()).ToArray() },
                },
                properties = new
                {
                    parcelId         = g.ParcelId,
                    neighborhoodCode = nbhdCode,
                    assessedValue    = prop?.AssessedValue ?? 0,
                    propertyClass    = prop?.PropertyType,
                    areaAcres        = g.AreaAcres,
                    yearBuilt        = g.YearBuilt,
                    situsAddress     = g.SitusAddress,
                    primaryUse       = g.PrimaryUse,
                    saleDate         = sale?.SaleDate.ToString("o"),
                    salePrice        = sale?.SalePrice ?? 0m,
                    qualDecision     = qual,
                    ratio            = ratio.HasValue ? Math.Round(ratio.Value, 4) : (double?)null,
                    nbhdMedianRatio  = nbhdMedian.HasValue ? Math.Round(nbhdMedian.Value, 4) : (double?)null,
                    ratioDeviation   = deviation.HasValue ? Math.Round(deviation.Value, 4) : (double?)null,
                    isOutlier        = isOutlier,
                },
            });
        }

        Response.ContentType = "application/geo+json";
        return Ok(new { type = "FeatureCollection", features });
    }

    // ──────────────────────────────────────────────────────────────────────
    //  v2/neighborhoods/outline — tight concave-hull (alpha-shape) boundaries
    //  from real parcel ring VERTICES (actual property corners), not centroids.
    // ──────────────────────────────────────────────────────────────────────
    [HttpGet("v2/neighborhoods/outline")]
    public async Task<IActionResult> GetNeighborhoodOutlineV2(
        [FromQuery] int taxYear = 0,
        [FromQuery] int kNearest = 8,
        CancellationToken ct = default)
    {
        if (taxYear == 0) taxYear = DateTime.UtcNow.Year;

        // Load RingJson per parcel joined to neighborhood from Properties.
        // We use ring VERTICES (actual parcel corners) — not centroids.
        var parcelRings = await (
            from geo in _db.GisParcelGeometries.AsNoTracking()
            join prop in _db.Properties
                .AsNoTracking()
                .Where(p => p.CountyId == BentonCountyId
                         && p.TaxYear == taxYear
                         && p.Neighborhood != null && p.Neighborhood != "")
                on geo.ParcelId equals prop.ParcelNumber
            where geo.RingJson != null
            select new { Neighborhood = prop.Neighborhood!, geo.RingJson }
        ).ToListAsync(ct);

        // Extract all ring vertices per neighborhood.
        // RingJson format: [[lng, lat], [lng, lat], ...]
        // Round to 4 decimal places (~11 m) to deduplicate shared edge vertices.
        var nbhdVertices = new Dictionary<string, HashSet<(double Lat, double Lng)>>();
        foreach (var row in parcelRings)
        {
            if (string.IsNullOrEmpty(row.RingJson)) continue;
            List<List<double>>? ring;
            try { ring = JsonSerializer.Deserialize<List<List<double>>>(row.RingJson); }
            catch { continue; }
            if (ring is null || ring.Count < 3) continue;

            if (!nbhdVertices.ContainsKey(row.Neighborhood))
                nbhdVertices[row.Neighborhood] = new();

            foreach (var pt in ring)
            {
                if (pt.Count >= 2)
                {
                    nbhdVertices[row.Neighborhood].Add((
                        Lat: Math.Round(pt[1], 4),
                        Lng: Math.Round(pt[0], 4)));
                }
            }
        }

        // Qualified sales stats for coloring (unchanged logic).
        var salePtIds = await _db.ComparableSales
            .AsNoTracking()
            .Where(s => s.CountyId == BentonCountyId
                     && s.SalesYear == taxYear
                     && s.QualificationDecision != "disqualified"
                     && s.Neighborhood != null)
            .Select(s => new { Nbhd = s.Neighborhood!, s.ParcelId, SalePrice = s.AdjustedSalePrice ?? s.SalePrice })
            .Where(s => s.ParcelId != null && s.SalePrice > 10_000m)
            .ToListAsync(ct);

        var avMap = await GetAssessedValueMapAsync(salePtIds.Select(s => s.ParcelId!), taxYear, ct);

        var hoodStats = salePtIds
            .Where(s => s.ParcelId != null && avMap.ContainsKey(s.ParcelId!))
            .Select(s => (Nbhd: s.Nbhd, Ratio: (double)(avMap[s.ParcelId!] / s.SalePrice)))
            .GroupBy(r => r.Nbhd)
            .ToDictionary(g => g.Key, g =>
            {
                var ratios = g.Select(r => r.Ratio).OrderBy(r => r).ToList();
                return (median: ratios[ratios.Count / 2], n: ratios.Count);
            });

        // Build GeoJSON features — one per neighborhood.
        var features = nbhdVertices
            .Select(kvp =>
            {
                var nbhd = kvp.Key;
                var pts = kvp.Value.ToList();
                if (pts.Count < 3) return (object?)null;

                var hull = GeoConcaveHull.Compute(pts, kNearest);
                if (hull.Count < 3) return (object?)null;
                if (hull[0] != hull[^1]) hull.Add(hull[0]);

                var coords = hull.Select(p => new[] { p.lng, p.lat }).ToArray();
                var stats = hoodStats.TryGetValue(nbhd, out var st) ? st : (median: 1.0, n: 0);
                var grade = GradeFromStats(stats.median, n: stats.n);

                return (object?)new
                {
                    type = "Feature",
                    geometry = new { type = "Polygon", coordinates = new[] { coords } },
                    properties = new
                    {
                        neighborhoodCode = nbhd,
                        medianRatio  = Math.Round(stats.median, 3),
                        saleCount    = stats.n,
                        grade        = grade,
                        fillHsl      = GradeFillHsl(grade),
                        strokeHsl    = GradeStrokeHsl(grade),
                    },
                };
            })
            .Where(f => f != null)
            .ToList();

        Response.ContentType = "application/geo+json";
        return Ok(new { type = "FeatureCollection", features });
    }

    // ──────────────────────────────────────────────────────────────────────
    //  v2/audit/ranked — AI audit engine: root-cause hypothesis per nbhd.
    // ──────────────────────────────────────────────────────────────────────
    [HttpGet("v2/audit/ranked")]
    public async Task<IActionResult> GetAuditRankedV2(
        [FromQuery] int taxYear = 0,
        [FromQuery] int limit = 500,
        CancellationToken ct = default)
    {
        if (taxYear == 0) taxYear = DateTime.UtcNow.Year;

        // Reuse ratio-study stats via /neighborhood-stats semantics, but keep it local.
        var lookbackStart = new DateTime(taxYear - 2, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        var lookbackEnd   = new DateTime(taxYear, 1, 1, 0, 0, 0, DateTimeKind.Utc);

        var sales = await _db.ComparableSales
            .AsNoTracking()
            .Where(s => s.CountyId == BentonCountyId)
            .Where(s => s.SalesYear == taxYear
                     || (s.SaleDate >= lookbackStart && s.SaleDate < lookbackEnd))
            .Where(s => s.QualificationDecision == "qualified"
                     || (s.QualificationDecision == null
                         && s.QualificationRecommendation == "qualified"))
            .Where(s => s.Neighborhood != null && s.ParcelId != null)
            .Select(s => new
            {
                s.ParcelId,
                s.Neighborhood,
                SalePrice = s.AdjustedSalePrice ?? s.SalePrice,
                s.SaleDate,
                s.PropertyType,
            })
            .ToListAsync(ct);

        var parcelIds = sales.Select(s => s.ParcelId!).Distinct().ToHashSet();
        var avMap = await GetAssessedValueMapAsync(parcelIds, taxYear, ct);

        var byNbhd = sales
            .Where(s => s.SalePrice > 10_000m
                     && avMap.ContainsKey(s.ParcelId!))
            .GroupBy(s => s.Neighborhood!);

        var now = DateTime.UtcNow;
        var ranked = new List<object>();
        foreach (var group in byNbhd)
        {
            var records = group
                .Select(s => (
                    Ratio: (double)(avMap[s.ParcelId!] / s.SalePrice),
                    AgeMonths: (now - s.SaleDate).TotalDays / 30.0
                ))
                .ToList();
            var n = records.Count;

            // Neighborhoods with <3 sales: grade N, no statistical hypothesis
            if (n < 3)
            {
                ranked.Add(new
                {
                    neighborhoodCode = group.Key,
                    medianRatio      = n > 0 ? Math.Round(records.Select(r => r.Ratio).OrderBy(r => r).ElementAt(n / 2), 4) : 1.0,
                    cod              = 0.0,
                    saleCount        = n,
                    deviation        = 0.0,
                    impact           = 0.0,
                    grade            = "N",
                    hypotheses       = new List<RootCauseHypothesis>(),
                    primaryCause     = "insufficient_sales",
                    actionLine       = $"Only {n} qualified sale{(n == 1 ? "" : "s")} — expand study window or pool adjacent neighborhoods.",
                });
                continue;
            }

            var ratios = records.Select(r => r.Ratio).OrderBy(r => r).ToList();
            var median = ratios[n / 2];
            // COD
            var absDev = ratios.Select(r => Math.Abs(r - median)).Sum() / n;
            var cod = median > 0 ? absDev / median * 100.0 : 0;

            var deviation = median - 1.0;
            var magnitude = Math.Abs(deviation);
            var impact = magnitude * n;

            var hypotheses = ClassifyRootCauses(records, median, cod, n, now);

            ranked.Add(new
            {
                neighborhoodCode = group.Key,
                medianRatio      = Math.Round(median, 4),
                cod              = Math.Round(cod, 2),
                saleCount        = n,
                deviation        = Math.Round(deviation, 4),
                impact           = Math.Round(impact, 4),
                grade            = GradeFromStats(median, n),
                hypotheses       = hypotheses,
                primaryCause     = hypotheses.Count > 0 ? hypotheses[0].cause : "none",
                actionLine       = hypotheses.Count > 0 ? hypotheses[0].action : "Within IAAO bounds.",
            });
        }

        // Actionable (impact > 0) first, insufficient-sales last, both sorted by impact desc
        var sorted = ranked
            .OrderByDescending(r => (double)r.GetType().GetProperty("impact")!.GetValue(r)! > 0 ? 1 : 0)
            .ThenByDescending(r => (double)r.GetType().GetProperty("impact")!.GetValue(r)!)
            .Take(limit)
            .ToList();

        return Ok(sorted);
    }

    // ──────────────────────────────────────────────────────────────────────
    //  Helpers
    // ──────────────────────────────────────────────────────────────────────
    private static string GradeFromStats(double medianRatio, int n)
    {
        if (n < 3) return "N"; // not enough sales
        var dev = Math.Abs(medianRatio - 1.0);
        if (dev <= 0.03) return "A";
        if (dev <= 0.05) return "B";
        if (dev <= 0.10) return "C";
        if (dev <= 0.15) return "D";
        return "F";
    }

    // Lumin Bridge palette HSL (H S L) — sage = under 1.0, terracotta = over 1.0
    private static string GradeFillHsl(string grade) => grade switch
    {
        "A" => "140 22% 56% / 0.22",  // sage — parity
        "B" => "140 28% 60% / 0.18",
        "C" => "32 58% 55% / 0.20",   // warm amber
        "D" => "16 55% 56% / 0.24",   // terracotta
        "F" => "16 62% 48% / 0.30",   // deep terracotta
        _   => "38 18% 78% / 0.12",   // parchment — no data
    };

    private static string GradeStrokeHsl(string grade) => grade switch
    {
        "A" => "140 22% 44% / 0.80",
        "B" => "140 28% 48% / 0.70",
        "C" => "32 58% 45% / 0.75",
        "D" => "16 55% 45% / 0.80",
        "F" => "16 62% 38% / 0.90",
        _   => "38 18% 60% / 0.50",
    };

    // Root-cause classifier — explicit taxonomy, evidence-based.
    private static List<RootCauseHypothesis> ClassifyRootCauses(
        List<(double Ratio, double AgeMonths)> records, double median, double cod, int n, DateTime now)
    {
        var list = new List<RootCauseHypothesis>();

        var avgAge = records.Select(r => r.AgeMonths).Average();

        // 1. Sample too small
        if (n < 6)
            list.Add(new("sample_too_small",
                $"n={n} sales — too few to assert ratio uniformity.",
                "Expand sample window or pool adjacent neighborhoods."));

        // 2. Market drift hypothesis: median deviates AND sales are stale
        if (Math.Abs(median - 1.0) > 0.07 && avgAge > 14)
            list.Add(new("stale_cost_schedule",
                $"median {median:F3}, avg sale age {avgAge:F1} mo — cost/market drift likely.",
                "Recalibrate base rate from recent sales, apply time adjustment."));

        // 3. Time adjustment needed: strong age gradient in ratios
        if (n >= 8)
        {
            var ordered = records.OrderBy(r => r.AgeMonths).Select(r => r.Ratio).ToList();
            var firstHalf = ordered.Take(ordered.Count / 2).Average();
            var lastHalf = ordered.Skip(ordered.Count / 2).Average();
            if (Math.Abs(firstHalf - lastHalf) > 0.04)
                list.Add(new("bad_time_adj",
                    $"recent ratio {firstHalf:F3} vs older {lastHalf:F3} — delta {firstHalf - lastHalf:+0.000;-0.000}.",
                    "Apply time adjustment before ratio study finalization."));
        }

        // 4. High COD — sales chasing or mixed class
        if (cod > 20)
            list.Add(new("high_cod_dispersion",
                $"COD {cod:F1} exceeds IAAO threshold — uniformity compromised.",
                "Review individual parcels — possible sales chasing or class mix."));

        // 5. Underassessment (deep)
        if (median < 0.85)
        {
            var target = Math.Round((1.0 - median) / median * 100, 1);
            list.Add(new("deep_underassessment",
                $"median {median:F3} — parcels reval below threshold.",
                $"Priority reval — target +{target}%."));
        }

        // 6. Overassessment (deep)
        if (median > 1.15)
            list.Add(new("deep_overassessment",
                $"median {median:F3} — AVs exceed market.",
                "Downward adjustment required — review cost tables and depreciation."));

        if (list.Count == 0)
            list.Add(new("within_bounds",
                $"median {median:F3}, COD {cod:F1} — IAAO compliant.",
                "No action required."));

        return list;
    }

    // ──────────────────────────────────────────────────────────────────────
    //  v2/mass-adjust/simulate — project stats after hypothetical AV change.
    //  Reads current AVs and qualified sale prices, applies pct in memory,
    //  returns before/after stats. Does NOT write anything to the database.
    // ──────────────────────────────────────────────────────────────────────
    [HttpPost("v2/mass-adjust/simulate")]
    public async Task<IActionResult> SimulateMassAdjustment(
        [FromBody] MassAdjustSimulateRequest req,
        CancellationToken ct = default)
    {
        var taxYear = req.TaxYear == 0 ? DateTime.UtcNow.Year : req.TaxYear;
        if (Math.Abs(req.AdjustmentPct) > 50)
            return BadRequest(new { error = "Adjustment must be between −50% and +50%." });

        var salesQ = _db.ComparableSales
            .AsNoTracking()
            .Where(s => s.CountyId == BentonCountyId
                     && s.SalesYear == taxYear
                     && (s.QualificationDecision == "qualified"
                         || (s.QualificationDecision == null
                             && s.QualificationRecommendation == "qualified"))
                     && s.ParcelId != null);

        if (req.Scope == "neighborhood" && !string.IsNullOrWhiteSpace(req.NeighborhoodCode))
            salesQ = salesQ.Where(s => s.Neighborhood == req.NeighborhoodCode);

        if (!string.IsNullOrWhiteSpace(req.PropertyClass))
            salesQ = salesQ.Where(s => s.PropertyType == req.PropertyClass);

        var sales = await salesQ
            .Select(s => new
            {
                ParcelId = s.ParcelId!,
                SalePrice = s.AdjustedSalePrice ?? s.SalePrice,
            })
            .ToListAsync(ct);

        var parcelIds = sales.Select(s => s.ParcelId).Distinct().ToHashSet();
        var avMap = await GetAssessedValueMapAsync(parcelIds, taxYear, ct);

        var multiplier = (decimal)(1.0 + req.AdjustmentPct / 100.0);

        var records = sales
            .Where(s => s.SalePrice > 10_000m && avMap.ContainsKey(s.ParcelId))
            .Select(s =>
            {
                var av = avMap[s.ParcelId];
                var price = s.SalePrice;
                return (
                    Current:    (double)(av / price),
                    Projected:  (double)(av * multiplier / price)
                );
            })
            .ToList();

        if (records.Count == 0)
            return BadRequest(new { error = "No qualified sales found for the specified scope." });

        static (double median, double cod, double mean) CalcStats(IEnumerable<double> ratios)
        {
            var sorted = ratios.OrderBy(r => r).ToList();
            var n = sorted.Count;
            var med = sorted[n / 2];
            var cod = med > 0 ? sorted.Select(r => Math.Abs(r - med)).Average() / med * 100 : 0;
            var mean = sorted.Average();
            return (Math.Round(med, 4), Math.Round(cod, 2), Math.Round(mean, 4));
        }

        var (curMed, curCod, curMean) = CalcStats(records.Select(r => r.Current));
        var (prjMed, prjCod, prjMean) = CalcStats(records.Select(r => r.Projected));

        var neededPct = curMed > 0
            ? Math.Round((1.0 - curMed) / curMed * 100.0, 1)
            : 0.0;

        return Ok(new
        {
            scope            = req.Scope,
            neighborhoodCode = req.NeighborhoodCode,
            propertyClass    = req.PropertyClass,
            parcelCount      = records.Count,
            adjustmentPct    = req.AdjustmentPct,
            neededPct        = neededPct,
            current          = new { medianRatio = curMed, cod = curCod, mean = curMean },
            projected        = new { medianRatio = prjMed, cod = prjCod, mean = prjMean },
            deltaMedianRatio = Math.Round(prjMed - curMed, 4),
            iaaoPass         = prjMed >= 0.90 && prjMed <= 1.10 && prjCod <= 20,
        });
    }
}

public record RootCauseHypothesis(string cause, string evidence, string action);

public record MassAdjustSimulateRequest(
    int TaxYear,
    string Scope,               // "neighborhood" | "class" | "county"
    string? NeighborhoodCode,
    string? PropertyClass,
    double AdjustmentPct);      // e.g. -5.2 means reduce AVs by 5.2%

// ──────────────────────────────────────────────────────────────────────────
//  Concave-hull (alpha-shape) via k-nearest-neighbors method
//  Moreira & Santos 2007 — O(n k log n). Pure C#, no NTS dependency.
// ──────────────────────────────────────────────────────────────────────────
internal static class GeoConcaveHull
{
    public static List<(double lat, double lng)> Compute(
        List<(double lat, double lng)> pts, int k = 6)
    {
        var n = pts.Count;
        if (n < 3) return new(pts);
        if (n == 3) return new(pts);

        // Dedup
        var unique = pts.Distinct().ToList();
        n = unique.Count;
        if (n < 3) return unique;

        k = Math.Clamp(k, 3, n - 1);

        // Start from point with lowest lat (southernmost; break ties with lng)
        var firstIdx = 0;
        for (int i = 1; i < n; i++)
        {
            if (unique[i].lat < unique[firstIdx].lat
                || (unique[i].lat == unique[firstIdx].lat
                    && unique[i].lng < unique[firstIdx].lng))
                firstIdx = i;
        }

        var first = unique[firstIdx];
        var hull = new List<(double lat, double lng)> { first };
        var remaining = new List<(double lat, double lng)>(unique);
        remaining.RemoveAt(firstIdx);
        var current = first;
        var prevAngle = 0.0;  // initial angle heading east-ish

        // Safety: bounded iteration
        int maxSteps = n * 4;
        int step = 0;

        while ((current != first || hull.Count == 1) && remaining.Count > 0 && step++ < maxSteps)
        {
            if (hull.Count > 1 && current == first) break;

            // Find k nearest neighbors
            var knn = remaining
                .Concat(hull.Count >= 3 ? new[] { first } : Array.Empty<(double, double)>())
                .OrderBy(p => Dist2(current, p))
                .Take(k)
                .ToList();

            // Sort by right-hand-turn angle relative to prevAngle
            var candidates = knn
                .Select(p => new { Point = p, Angle = Angle(current, p) })
                .OrderByDescending(c => AngleDiff(prevAngle, c.Angle))  // rightmost turn
                .ToList();

            (double lat, double lng)? pick = null;
            foreach (var c in candidates)
            {
                // Check no self-intersection (skip for speed; k-nn usually safe for convex-ish shapes)
                if (hull.Count >= 2 && IntersectsHull(hull, current, c.Point)) continue;
                pick = c.Point;
                break;
            }

            if (pick is null)
            {
                // Increase k and retry once; if still nothing, give up
                if (k < n - 1) { k = Math.Min(k + 2, n - 1); continue; }
                break;
            }

            if (pick.Value == first && hull.Count >= 3) break;

            hull.Add(pick.Value);
            prevAngle = Angle(current, pick.Value);
            current = pick.Value;
            remaining.Remove(pick.Value);
        }

        // Fallback: if concave hull got too small (algorithm stuck), use convex hull
        if (hull.Count < 3) return GeoHull.Compute(unique);

        return hull;
    }

    private static double Dist2((double lat, double lng) a, (double lat, double lng) b)
    {
        var dx = a.lng - b.lng;
        var dy = a.lat - b.lat;
        return dx * dx + dy * dy;
    }

    private static double Angle((double lat, double lng) a, (double lat, double lng) b)
        => Math.Atan2(b.lat - a.lat, b.lng - a.lng);

    private static double AngleDiff(double prev, double next)
    {
        var d = next - prev;
        while (d <= -Math.PI) d += 2 * Math.PI;
        while (d > Math.PI) d -= 2 * Math.PI;
        // Rightmost turn = most negative angle diff. Return negated so OrderByDescending picks rightmost.
        return -d;
    }

    // Cheap segment intersection against hull edges (excluding last segment)
    private static bool IntersectsHull(
        List<(double lat, double lng)> hull,
        (double lat, double lng) c,
        (double lat, double lng) p)
    {
        // Skip the check if hull too small to matter
        if (hull.Count < 3) return false;
        for (int i = 0; i < hull.Count - 2; i++)
        {
            if (SegmentsIntersect(hull[i], hull[i + 1], c, p)) return true;
        }
        return false;
    }

    private static bool SegmentsIntersect(
        (double lat, double lng) p1, (double lat, double lng) p2,
        (double lat, double lng) p3, (double lat, double lng) p4)
    {
        double d1 = Direction(p3, p4, p1);
        double d2 = Direction(p3, p4, p2);
        double d3 = Direction(p1, p2, p3);
        double d4 = Direction(p1, p2, p4);

        if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0))
            && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0)))
            return true;
        return false;
    }

    private static double Direction((double lat, double lng) pi, (double lat, double lng) pj, (double lat, double lng) pk)
        => (pk.lng - pi.lng) * (pj.lat - pi.lat) - (pj.lng - pi.lng) * (pk.lat - pi.lat);
}
