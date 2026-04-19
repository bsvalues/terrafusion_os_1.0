using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TerraFusion.Data;

namespace TerraFusion.API.Controllers;

[ApiController]
[Route("api/geoforge")]
public class GeoForgeController : ControllerBase
{
    private readonly TerraFusionDbContext _db;
    private readonly ILogger<GeoForgeController> _logger;

    private static readonly Guid BentonCountyId = Guid.Parse("19190019-1919-1919-1919-191919191919");
    private static readonly Dictionary<string, object> _gwrCache = new();

    public GeoForgeController(TerraFusionDbContext db, ILogger<GeoForgeController> logger)
    {
        _db = db;
        _logger = logger;
    }

    // ── 1. Neighborhood ratio stats (full Benton Method 12-stat + PRB + VEI) ─
    [HttpGet("ratio-study/neighborhood-stats")]
    public async Task<IActionResult> GetNeighborhoodStats(
        [FromQuery] int taxYear,
        [FromQuery] string? propertyType = null,
        [FromQuery] string? saleDateStart = null,
        [FromQuery] string? saleDateEnd = null,
        CancellationToken ct = default)
    {
        var lookbackStart = new DateTime(taxYear - 2, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        var lookbackEnd   = new DateTime(taxYear, 1, 1, 0, 0, 0, DateTimeKind.Utc);

        var query = _db.ComparableSales
            .Where(s => s.CountyId == BentonCountyId)
            .Where(s => s.SalesYear == taxYear
                     || (s.SaleDate >= lookbackStart && s.SaleDate < lookbackEnd))
            .Where(s => s.QualificationDecision == "qualified"
                     || (s.QualificationDecision == null
                         && s.QualificationRecommendation == "qualified"));

        if (!string.IsNullOrWhiteSpace(propertyType))
            query = query.Where(s => s.PropertyType == propertyType);

        if (DateTime.TryParse(saleDateStart, out var ds))
            query = query.Where(s => s.SaleDate >= ds);
        if (DateTime.TryParse(saleDateEnd, out var de))
            query = query.Where(s => s.SaleDate <= de);

        var sales = await query
            .Select(s => new
            {
                s.ParcelId,
                s.Neighborhood,
                SalePrice = s.AdjustedSalePrice ?? s.SalePrice,
                s.PropertyType,
            })
            .Where(s => s.SalePrice > 10_000m)
            .ToListAsync(ct);

        var parcelIds = sales.Select(s => s.ParcelId).Where(id => id != null).Distinct().ToHashSet();
        var assessedMap = await GetAssessedValueMapAsync(parcelIds!, taxYear, ct);
        var hoodMap = await GetNeighborhoodMapAsync(parcelIds!, taxYear, ct);
        var geoMap = await GetGeoMapAsync(parcelIds!, ct);

        // Build ratio rows
        var ratioRows = sales
            .Where(s => s.ParcelId != null
                     && assessedMap.TryGetValue(s.ParcelId!, out var av) && av > 0
                     && s.SalePrice > 0)
            .Select(s =>
            {
                var hood = s.ParcelId != null && hoodMap.TryGetValue(s.ParcelId!, out var hc)
                    ? hc : s.Neighborhood ?? "UNKNOWN";
                return new
                {
                    ParcelId = s.ParcelId!,
                    Hood = hood,
                    Ratio = assessedMap[s.ParcelId!] / s.SalePrice,
                    Av = assessedMap[s.ParcelId!],
                };
            }).ToList();

        var grouped = ratioRows.GroupBy(r => r.Hood);

        var result = grouped.Select(g =>
        {
            var ratios = g.Select(r => r.Ratio).ToList();
            var avs    = g.Select(r => r.Av).ToList();
            var n = ratios.Count;
            var mean = ratios.Average();
            var stdDev = n > 1
                ? (decimal)Math.Sqrt(ratios.Select(r => (double)(r - mean) * (double)(r - mean)).Average())
                : 0m;
            var cv = mean > 0 ? stdDev / mean : 0m;
            var sorted = ratios.Order().ToList();

            int qi(int pct) => (int)(n * pct / 100.0);

            // Centroid: average of sale parcel centroids
            var centroids = g
                .Where(r => geoMap.ContainsKey(r.ParcelId))
                .Select(r => geoMap[r.ParcelId])
                .ToList();
            var lat = centroids.Count > 0 ? centroids.Average(c => c.lat) : 0.0;
            var lng = centroids.Count > 0 ? centroids.Average(c => c.lng) : 0.0;

            return new
            {
                neighborhoodCode = g.Key,
                neighborhoodName = g.Key,
                saleCount = n,
                centroidLat = lat,
                centroidLng = lng,
                stats = new
                {
                    count = n,
                    medianRatio = Math.Round((double)TrendStats.Median(ratios), 4),
                    cod = Math.Round((double)TrendStats.ComputeCod(ratios), 2),
                    prd = Math.Round((double)TrendStats.ComputePrd(ratios, avs), 4),
                    prb = Math.Round((double)TrendStats.ComputePrb(ratios, avs), 4),
                    vei = Math.Round((double)TrendStats.ComputeVei(ratios), 4),
                    mean = Math.Round((double)mean, 4),
                    weightedMean = avs.Sum() > 0
                        ? Math.Round((double)(avs.Sum() / ratios.Zip(avs, (r, av) => r > 0 ? av / r : 0m).Sum()), 4)
                        : 0.0,
                    min = (double)sorted.First(),
                    max = (double)sorted.Last(),
                    stdDev = Math.Round((double)stdDev, 4),
                    cv = Math.Round((double)cv, 4),
                    q1Ratio = n > 4 ? (double)sorted[qi(20)] : 0.0,
                    q2Ratio = n > 4 ? (double)sorted[qi(40)] : 0.0,
                    q3Ratio = n > 4 ? (double)TrendStats.Median(ratios) : 0.0,
                    q4Ratio = n > 4 ? (double)sorted[Math.Min(qi(80), n - 1)] : 0.0,
                    q5Ratio = n > 4 ? (double)sorted[n - 1] : 0.0,
                },
            };
        }).ToList();

        return Ok(result);
    }

    // ── 2. County-wide sale points for map scatter layer ────────────────────
    [HttpGet("ratio-study/sales")]
    public async Task<IActionResult> GetSalePoints(
        [FromQuery] int taxYear,
        [FromQuery] string? neighborhoodCode = null,
        CancellationToken ct = default)
    {
        var lookbackStart = new DateTime(taxYear - 2, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        var lookbackEnd   = new DateTime(taxYear, 1, 1, 0, 0, 0, DateTimeKind.Utc);

        var query = _db.ComparableSales
            .Where(s => s.CountyId == BentonCountyId)
            .Where(s => s.SalesYear == taxYear
                     || (s.SaleDate >= lookbackStart && s.SaleDate < lookbackEnd))
            .Where(s => s.QualificationDecision == "qualified"
                     || (s.QualificationDecision == null
                         && s.QualificationRecommendation == "qualified"));

        var sales = await query
            .Select(s => new
            {
                s.Id,
                s.ParcelId,
                s.Neighborhood,
                SalePrice = s.AdjustedSalePrice ?? s.SalePrice,
                s.SaleDate,
                s.PropertyType,
                s.QualificationDecision,
            })
            .Where(s => s.SalePrice > 10_000m)
            .ToListAsync(ct);

        var parcelIds = sales.Select(s => s.ParcelId).Where(id => id != null).Distinct().ToHashSet();
        var assessedMap = await GetAssessedValueMapAsync(parcelIds!, taxYear, ct);
        var hoodMap     = await GetNeighborhoodMapAsync(parcelIds!, taxYear, ct);
        var geoMap      = await GetGeoMapAsync(parcelIds!, ct);

        // Compute outlier cutoffs per neighborhood
        var byHood = sales
            .Where(s => s.ParcelId != null && assessedMap.ContainsKey(s.ParcelId!) && s.SalePrice > 0)
            .GroupBy(s =>
            {
                var h = s.ParcelId != null && hoodMap.TryGetValue(s.ParcelId!, out var hc)
                    ? hc : s.Neighborhood ?? "UNKNOWN";
                return h;
            })
            .ToDictionary(
                g => g.Key,
                g =>
                {
                    var ratios = g.Select(s => assessedMap[s.ParcelId!] / s.SalePrice).Order().ToList();
                    var med = TrendStats.Median(ratios);
                    var madVal = ratios.Count > 0 ? ratios.Average(r => Math.Abs(r - med)) : 0m;
                    return (lo: med - 3 * madVal, hi: med + 3 * madVal);
                });

        var result = sales
            .Where(s => s.ParcelId != null
                     && assessedMap.TryGetValue(s.ParcelId!, out _)
                     && geoMap.ContainsKey(s.ParcelId!)
                     && s.SalePrice > 0)
            .Select(s =>
            {
                var geo   = geoMap[s.ParcelId!];
                var av    = assessedMap[s.ParcelId!];
                var ratio = av / s.SalePrice;
                var hood  = hoodMap.TryGetValue(s.ParcelId!, out var hc) ? hc : s.Neighborhood ?? "UNKNOWN";
                var cut   = byHood.TryGetValue(hood, out var c) ? c : (lo: 0m, hi: 2m);

                if (!string.IsNullOrEmpty(neighborhoodCode) && hood != neighborhoodCode)
                    return null;

                return (object?)new
                {
                    saleId = s.Id.ToString(),
                    parcelId = s.ParcelId,
                    lat = geo.lat,
                    lng = geo.lng,
                    salePrice = (double)s.SalePrice,
                    assessedValue = (double)av,
                    ratio = Math.Round((double)ratio, 4),
                    saleDate = s.SaleDate.ToString("yyyy-MM-dd"),
                    neighborhoodCode = hood,
                    propertyClass = s.PropertyType ?? "",
                    isOutlier = ratio < cut.lo || ratio > cut.hi,
                    qualificationDecision = s.QualificationDecision ?? "auto-qualified",
                };
            })
            .Where(x => x != null)
            .ToList();

        return Ok(result);
    }

    // ── 3. AI Diagnosis ─────────────────────────────────────────────────────
    [HttpGet("ratio-study/diagnosis")]
    public async Task<IActionResult> GetDiagnosis(
        [FromQuery] int taxYear,
        [FromQuery] string neighborhoodCode,
        CancellationToken ct = default)
    {
        var lookbackStart = new DateTime(taxYear - 2, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        var lookbackEnd   = new DateTime(taxYear, 1, 1, 0, 0, 0, DateTimeKind.Utc);

        var sales = await _db.ComparableSales
            .Where(s => s.CountyId == BentonCountyId)
            .Where(s => s.SalesYear == taxYear
                     || (s.SaleDate >= lookbackStart && s.SaleDate < lookbackEnd))
            .Where(s => s.QualificationDecision == "qualified"
                     || (s.QualificationDecision == null
                         && s.QualificationRecommendation == "qualified"))
            .Select(s => new { s.ParcelId, s.Neighborhood, SalePrice = s.AdjustedSalePrice ?? s.SalePrice })
            .Where(s => s.SalePrice > 10_000m)
            .ToListAsync(ct);

        var parcelIds = sales.Select(s => s.ParcelId).Where(id => id != null).Distinct().ToHashSet();
        var assessedMap = await GetAssessedValueMapAsync(parcelIds!, taxYear, ct);
        var hoodMap     = await GetNeighborhoodMapAsync(parcelIds!, taxYear, ct);

        // Filter to selected neighborhood
        var hood = sales
            .Where(s => s.ParcelId != null && assessedMap.ContainsKey(s.ParcelId!) && s.SalePrice > 0)
            .Where(s =>
            {
                var h = s.ParcelId != null && hoodMap.TryGetValue(s.ParcelId!, out var hc) ? hc : s.Neighborhood ?? "UNKNOWN";
                return h == neighborhoodCode;
            })
            .Select(s => new
            {
                Ratio = assessedMap[s.ParcelId!] / s.SalePrice,
                Av    = assessedMap[s.ParcelId!],
            }).ToList();

        var categories = new List<object>();
        var flags      = new List<string>();

        if (hood.Count < 5)
        {
            categories.Add(new
            {
                category = "data_quality", severity = "critical",
                headline = "Insufficient sales",
                detail = $"Only {hood.Count} qualified sales — statistics unreliable.",
                affectedCount = hood.Count, moransI = (double?)null,
            });
            flags.Add("low_sale_count");
        }
        else
        {
            var ratios = hood.Select(h => h.Ratio).ToList();
            var avs    = hood.Select(h => h.Av).ToList();

            var cod = TrendStats.ComputeCod(ratios);
            var prd = TrendStats.ComputePrd(ratios, avs);
            var prb = TrendStats.ComputePrb(ratios, avs);
            var med = TrendStats.Median(ratios);
            var madVal = ratios.Average(r => Math.Abs(r - med));
            var outlierCount = ratios.Count(r => Math.Abs(r - med) > 3 * madVal);

            if (outlierCount > 0)
                categories.Add(new
                {
                    category = "outliers",
                    severity = outlierCount > 3 ? "critical" : "watch",
                    headline = $"{outlierCount} ratio outlier{(outlierCount != 1 ? "s" : "")} detected",
                    detail = "Sales with ratios > 3 MAD from median. Review individual sales for data errors, arm's-length issues, or unique characteristics.",
                    affectedCount = outlierCount, moransI = (double?)null,
                });

            if (Math.Abs(prd - 1m) > 0.05m || Math.Abs(prb) > 0.05m)
                categories.Add(new
                {
                    category = "stratification",
                    severity = Math.Abs(prd - 1m) > 0.08m ? "critical" : "watch",
                    headline = "Vertical inequity detected",
                    detail = $"PRD={prd:F3}, PRB={prb:F3} — assessments are {(prb < 0 ? "regressive (lower-value properties over-assessed relative to higher-value)" : "progressive (higher-value properties over-assessed)")}.",
                    affectedCount = hood.Count, moransI = (double?)null,
                });

            if (cod > 20m)
                categories.Add(new
                {
                    category = "data_quality",
                    severity = cod > 25m ? "critical" : "watch",
                    headline = "High assessment uniformity dispersion",
                    detail = $"COD={cod:F1} exceeds IAAO residential threshold of 20. Review for stale assessments, data errors, or neighborhood boundary issues.",
                    affectedCount = hood.Count, moransI = (double?)null,
                });

            if (!categories.Any())
                categories.Add(new
                {
                    category = "data_quality", severity = "ok",
                    headline = "No significant issues detected",
                    detail = "All Benton Method thresholds within acceptable ranges.",
                    affectedCount = 0, moransI = (double?)null,
                });
        }

        // Peer neighborhoods — same year, closest to selected neighborhood median ratio
        var selectedMedR = hood.Count > 0
            ? (double)TrendStats.Median(hood.Select(h => h.Ratio).ToList())
            : 0.0;

        var allHoodGroups = sales
            .Where(s => s.ParcelId != null && assessedMap.ContainsKey(s.ParcelId!) && s.SalePrice > 0)
            .GroupBy(s =>
            {
                var h = s.ParcelId != null && hoodMap.TryGetValue(s.ParcelId!, out var hc) ? hc : s.Neighborhood ?? "UNKNOWN";
                return h;
            })
            .Where(g => g.Key != neighborhoodCode && g.Count() >= 3)
            .Select(g =>
            {
                var ratios = g.Select(s => assessedMap[s.ParcelId!] / s.SalePrice).ToList();
                var med = (double)TrendStats.Median(ratios);
                return new
                {
                    neighborhoodCode = g.Key,
                    neighborhoodName = g.Key,
                    medianRatio = Math.Round(med, 4),
                    cod = Math.Round((double)TrendStats.ComputeCod(ratios), 2),
                    saleCount = ratios.Count,
                    delta = Math.Round(med - selectedMedR, 4),
                };
            })
            .OrderBy(p => Math.Abs(p.delta))
            .Take(5)
            .ToList();

        return Ok(new
        {
            neighborhoodCode,
            taxYear,
            categories,
            peers = allHoodGroups,
            dataQualityFlags = flags,
            generatedAt = DateTime.UtcNow.ToString("o"),
        });
    }

    // ── 4. GWR Surface (cached per tax year) ────────────────────────────────
    [HttpPost("ratio-study/gwr")]
    public async Task<IActionResult> ComputeGwr(
        [FromQuery] int taxYear,
        CancellationToken ct = default)
    {
        var cacheKey = $"benton:{taxYear}";
        if (_gwrCache.TryGetValue(cacheKey, out var cached))
            return Ok(cached);

        var lookbackStart = new DateTime(taxYear - 2, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        var lookbackEnd   = new DateTime(taxYear, 1, 1, 0, 0, 0, DateTimeKind.Utc);

        var sales = await _db.ComparableSales
            .Where(s => s.CountyId == BentonCountyId)
            .Where(s => s.SalesYear == taxYear
                     || (s.SaleDate >= lookbackStart && s.SaleDate < lookbackEnd))
            .Where(s => s.QualificationDecision == "qualified"
                     || (s.QualificationDecision == null
                         && s.QualificationRecommendation == "qualified"))
            .Select(s => new { s.ParcelId, SalePrice = s.AdjustedSalePrice ?? s.SalePrice })
            .Where(s => s.SalePrice > 10_000m)
            .ToListAsync(ct);

        var parcelIds = sales.Select(s => s.ParcelId).Where(id => id != null).Distinct().ToHashSet();
        var assessedMap = await GetAssessedValueMapAsync(parcelIds!, taxYear, ct);
        var geoMap      = await GetGeoMapAsync(parcelIds!, ct);

        var points = sales
            .Where(s => s.ParcelId != null
                     && assessedMap.ContainsKey(s.ParcelId!)
                     && geoMap.ContainsKey(s.ParcelId!)
                     && s.SalePrice > 0)
            .Select(s => new
            {
                Lat   = geoMap[s.ParcelId!].lat,
                Lng   = geoMap[s.ParcelId!].lng,
                Ratio = assessedMap[s.ParcelId!] / s.SalePrice,
                Av    = assessedMap[s.ParcelId!],
            }).ToList();

        if (points.Count == 0) return Ok(new { taxYear, cells = Array.Empty<object>(), cachedAt = DateTime.UtcNow });

        var minLat = points.Min(p => p.Lat);
        var maxLat = points.Max(p => p.Lat);
        var minLng = points.Min(p => p.Lng);
        var maxLng = points.Max(p => p.Lng);
        const int gridSize = 20;
        const double bandwidth = 0.05; // ~3.5 miles lat/lng degrees

        var cells = new List<object>();
        for (int i = 0; i < gridSize; i++)
        {
            for (int j = 0; j < gridSize; j++)
            {
                var lat = minLat + (maxLat - minLat) * i / (gridSize - 1);
                var lng = minLng + (maxLng - minLng) * j / (gridSize - 1);
                var nearby = points
                    .Where(p => Math.Abs(p.Lat - lat) < bandwidth && Math.Abs(p.Lng - lng) < bandwidth)
                    .ToList();
                if (nearby.Count < 5) continue;
                var ratios = nearby.Select(p => p.Ratio).ToList();
                var avs    = nearby.Select(p => p.Av).ToList();
                cells.Add(new
                {
                    lat = Math.Round(lat, 5),
                    lng = Math.Round(lng, 5),
                    localMedianRatio = Math.Round((double)TrendStats.Median(ratios), 4),
                    localCod         = Math.Round((double)TrendStats.ComputeCod(ratios), 2),
                    localPrd         = Math.Round((double)TrendStats.ComputePrd(ratios, avs), 4),
                });
            }
        }

        var result = new { taxYear, cells, cachedAt = DateTime.UtcNow.ToString("o") };
        _gwrCache[cacheKey] = result;
        return Ok(result);
    }

    // ── 5. GeoJSON export ───────────────────────────────────────────────────
    [HttpGet("ratio-study/export")]
    public async Task<IActionResult> ExportGeoJson(
        [FromQuery] int taxYear,
        [FromQuery] string? neighborhoodCode = null,
        CancellationToken ct = default)
    {
        var lookbackStart = new DateTime(taxYear - 2, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        var lookbackEnd   = new DateTime(taxYear, 1, 1, 0, 0, 0, DateTimeKind.Utc);

        var query = _db.ComparableSales
            .Where(s => s.CountyId == BentonCountyId)
            .Where(s => s.SalesYear == taxYear
                     || (s.SaleDate >= lookbackStart && s.SaleDate < lookbackEnd))
            .Where(s => s.QualificationDecision == "qualified"
                     || (s.QualificationDecision == null
                         && s.QualificationRecommendation == "qualified"));

        var sales = await query
            .Select(s => new
            {
                s.Id,
                s.ParcelId,
                s.Neighborhood,
                SalePrice = s.AdjustedSalePrice ?? s.SalePrice,
                s.SaleDate,
            })
            .Where(s => s.SalePrice > 10_000m)
            .ToListAsync(ct);

        var parcelIds = sales.Select(s => s.ParcelId).Where(id => id != null).Distinct().ToHashSet();
        var assessedMap = await GetAssessedValueMapAsync(parcelIds!, taxYear, ct);
        var hoodMap     = await GetNeighborhoodMapAsync(parcelIds!, taxYear, ct);
        var geoMap      = await GetGeoMapAsync(parcelIds!, ct);

        var features = sales
            .Where(s => s.ParcelId != null && geoMap.ContainsKey(s.ParcelId!) && assessedMap.ContainsKey(s.ParcelId!))
            .Where(s =>
            {
                if (string.IsNullOrEmpty(neighborhoodCode)) return true;
                var h = hoodMap.TryGetValue(s.ParcelId!, out var hc) ? hc : s.Neighborhood ?? "UNKNOWN";
                return h == neighborhoodCode;
            })
            .Select(s =>
            {
                var geo   = geoMap[s.ParcelId!];
                var av    = assessedMap[s.ParcelId!];
                var ratio = s.SalePrice > 0 ? av / s.SalePrice : 0m;
                var hood  = hoodMap.TryGetValue(s.ParcelId!, out var hc) ? hc : s.Neighborhood ?? "UNKNOWN";
                return new
                {
                    type = "Feature",
                    geometry = new
                    {
                        type = "Point",
                        coordinates = new[] { geo.lng, geo.lat },
                    },
                    properties = new
                    {
                        parcelId         = s.ParcelId,
                        salePrice        = (double)s.SalePrice,
                        assessedValue    = (double)av,
                        ratio            = Math.Round((double)ratio, 4),
                        neighborhoodCode = hood,
                        saleDate         = s.SaleDate.ToString("yyyy-MM-dd"),
                    },
                };
            }).ToList();

        var geojson = new
        {
            type = "FeatureCollection",
            name = $"GeoForge_RatioStudy_{taxYear}",
            features,
        };

        Response.Headers["Content-Disposition"] = $"attachment; filename=\"geoforge-{taxYear}.geojson\"";
        return new JsonResult(geojson);
    }

    // ── Private helpers ──────────────────────────────────────────────────────

    private async Task<Dictionary<string, decimal>> GetAssessedValueMapAsync(
        IEnumerable<string> parcelNumbers, int taxYear, CancellationToken ct)
    {
        var ids = parcelNumbers.Distinct().ToHashSet();
        if (ids.Count == 0) return new Dictionary<string, decimal>();

        var rows = await _db.Properties
            .AsNoTracking()
            .Where(p => ids.Contains(p.ParcelNumber) && p.TaxYear == taxYear && p.AssessedValue > 0)
            .Select(p => new { p.ParcelNumber, p.AssessedValue })
            .ToListAsync(ct);

        return rows.ToDictionary(p => p.ParcelNumber, p => p.AssessedValue);
    }

    private async Task<Dictionary<string, string>> GetNeighborhoodMapAsync(
        IEnumerable<string> parcelNumbers, int taxYear, CancellationToken ct)
    {
        var ids = parcelNumbers.Distinct().ToHashSet();
        if (ids.Count == 0) return new Dictionary<string, string>();

        var rows = await _db.Properties
            .AsNoTracking()
            .Where(p => ids.Contains(p.ParcelNumber) && p.TaxYear == taxYear
                     && p.Neighborhood != null && p.Neighborhood != "")
            .Select(p => new { p.ParcelNumber, p.Neighborhood })
            .ToListAsync(ct);

        return rows.ToDictionary(p => p.ParcelNumber, p => p.Neighborhood!);
    }

    private async Task<Dictionary<string, (double lat, double lng)>> GetGeoMapAsync(
        IEnumerable<string> parcelIds, CancellationToken ct)
    {
        var ids = parcelIds.Distinct().ToHashSet();
        if (ids.Count == 0) return new Dictionary<string, (double, double)>();

        var rows = await _db.GisParcelGeometries
            .AsNoTracking()
            .Where(g => ids.Contains(g.ParcelId) && g.CentroidLat.HasValue && g.CentroidLng.HasValue)
            .Select(g => new { g.ParcelId, Lat = g.CentroidLat!.Value, Lng = g.CentroidLng!.Value })
            .ToListAsync(ct);

        return rows.ToDictionary(g => g.ParcelId, g => (g.Lat, g.Lng));
    }
}
