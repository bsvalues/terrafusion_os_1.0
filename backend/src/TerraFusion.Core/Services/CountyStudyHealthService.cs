// backend/src/TerraFusion.Core/Services/CountyStudyHealthService.cs
//
// Task C — County-level health summary for the TerraForge County Studio.
//
// Semantics: given a study, compute overall IAAO metrics from parcel-level
// ratios across the active segment set (parcel-weighted), classify county
// compliance, count segments by severity, and return the 5 worst segments
// ranked by composite risk.
//
// Median/COD math mirrors EquityMetricService and CountyStudyService byte-for-
// byte — we can't reference TerraFusion.AI from Core (that would be a circular
// project reference, AI already depends on Core), so the identical primitives
// are inlined below. The composite-risk formula lives here — this is the
// SINGLE source of truth. Any client rendering must not re-implement it.
//
// Performance target: single pass per study, all aggregation in memory, under
// 300ms on Benton-sized inputs. The expensive step is the canonical PACS
// join; everything after that is O(segments) + O(ratios).

using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using TerraFusion.Core.DTOs;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Interfaces;

namespace TerraFusion.Core.Services;

public class CountyStudyHealthService : ICountyStudyHealthService
{
    // ── IAAO + Benton thresholds — referenced by ClassifyCompliance + risk formula.
    private const decimal MedianFairLow  = 0.90m;
    private const decimal MedianFairHigh = 1.10m;
    private const decimal CodIaaoCeiling = 20m;
    private const decimal PrdIaaoLow     = 0.98m;
    private const decimal PrdIaaoHigh    = 1.03m;

    // Marginal bands — one tier wider than fair; see ClassifyCompliance.
    private const decimal MedianMarginalLow  = 0.85m;
    private const decimal MedianMarginalHigh = 1.15m;
    private const decimal CodMarginalCeiling = 25m;
    private const decimal PrdMarginalLow     = 0.95m;
    private const decimal PrdMarginalHigh    = 1.05m;

    // Sample-size gates.
    private const int MinRatiosForCompliance = 30;
    private const int MinParcelsForRisk      = 30;  // composite-risk sample-size penalty threshold

    private readonly ITerraFusionDbContext _db;

    public CountyStudyHealthService(ITerraFusionDbContext db) => _db = db;

    public async Task<CountyHealthSummaryDto> GetHealthSummaryAsync(
        Guid studyId, CancellationToken ct = default)
    {
        var study = await _db.CountyStudySessions.FirstOrDefaultAsync(s => s.StudyId == studyId, ct)
            ?? throw new InvalidOperationException($"Study {studyId} not found");
        if (study.ActiveSegmentSetId is null)
            throw new InvalidOperationException(
                $"Study {studyId} has no active segment set. Derive segments first via LeftRail → Derive Segment Metrics.");

        var setId = study.ActiveSegmentSetId.Value;

        // Pull the set metadata for DerivedAt (UpdatedAt tracks the last derivation).
        var segmentSet = await _db.CountySegmentSets
            .AsNoTracking()
            .FirstOrDefaultAsync(ss => ss.SegmentSetId == setId, ct);
        var derivedAt = segmentSet?.UpdatedAt;

        var segments = await _db.CountySegments
            .AsNoTracking()
            .Where(s => s.SegmentSetId == setId)
            .ToListAsync(ct);

        // ── Re-resolve parcel-level ratios so overall metrics are parcel-weighted. ──
        var perParcel = await LoadParcelRatiosAsync(study, segments, ct);

        // ── Overall county metrics across all parcel-level ratios. ──
        var ratios = perParcel.Select(p => p.Ratio).ToList();
        decimal? medianRatio = ratios.Count > 0 ? Median(ratios) : null;
        decimal? cod = (ratios.Count >= 5 && medianRatio.HasValue && medianRatio.Value > 0)
            ? ComputeCod(ratios, medianRatio.Value)
            : null;
        decimal? prd = ComputePrd(perParcel);

        var parcelCount    = segments.Sum(s => s.ParcelCount);
        var exceptionCount = segments.Sum(s => s.ExceptionCount);
        var ratioCount     = perParcel.Count;

        // Stability + risk — parcel-weighted averages across segments that
        // actually have metrics. Surface nulls when no segment has any ratios.
        decimal? stabilityScore = null;
        decimal? riskScore      = null;
        var segmentsWithMetrics = segments.Where(s => s.MedianRatio.HasValue).ToList();
        if (segmentsWithMetrics.Count > 0)
        {
            decimal weight = segmentsWithMetrics.Sum(s => (decimal)s.ParcelCount);
            if (weight > 0)
            {
                stabilityScore = Math.Round(
                    segmentsWithMetrics.Sum(s => s.StabilityScore * s.ParcelCount) / weight, 2);
                riskScore = Math.Round(
                    segmentsWithMetrics.Sum(s => s.RiskScore * s.ParcelCount) / weight, 2);
            }
        }

        var compliance = ClassifyCompliance(medianRatio, cod, prd, ratioCount);

        // ── Composite risk + severity bucketing per segment. ──
        var segmentCityMap   = BuildSegmentCityMap(segments, perParcel);
        var alertsPerSegment = segments
            .Select(s => BuildSegmentAlert(s, segmentCityMap))
            .ToList();

        int criticalCount = alertsPerSegment.Count(a => a.CompositeRisk >= 67m);
        int warningCount  = alertsPerSegment.Count(a => a.CompositeRisk >= 34m && a.CompositeRisk < 67m);
        int healthyCount  = alertsPerSegment.Count(a => a.CompositeRisk < 34m);

        // Top 5 by composite-risk DESC; ties broken by parcel-count DESC so larger
        // problems surface ahead of small-sample volatility.
        var topAlerts = alertsPerSegment
            .OrderByDescending(a => a.CompositeRisk)
            .ThenByDescending(a => a.ParcelCount)
            .Take(5)
            .ToList();

        return new CountyHealthSummaryDto(
            StudyId: study.StudyId,
            CountyId: study.CountyId,
            TaxYear: study.TaxYear,
            ParcelCount: parcelCount,
            RatioCount: ratioCount,
            MedianRatio: medianRatio.HasValue ? Math.Round(medianRatio.Value, 4) : null,
            Cod: cod.HasValue ? Math.Round(cod.Value, 2) : null,
            Prd: prd.HasValue ? Math.Round(prd.Value, 4) : null,
            StabilityScore: stabilityScore,
            RiskScore: riskScore,
            ExceptionCount: exceptionCount,
            ComplianceStatus: compliance.ToString(),
            TopAlerts: topAlerts,
            CriticalCount: criticalCount,
            WarningCount: warningCount,
            HealthyCount: healthyCount,
            DerivedAt: derivedAt);
    }

    /// <summary>
    /// Composite risk formula — SINGLE source of truth for Task C.
    ///
    /// compositeRisk = clamp(
    ///     (cod == null                  ? 10                          : 0)  // insufficient data
    ///   + (cod > 20                     ? (cod - 20) * 2              : 0)  // IAAO ceiling breach
    ///   + (median outside [0.90, 1.10]  ? |median - 1.0| * 100        : 0)  // fairness breach
    ///   + (prd outside [0.98, 1.03]     ? |prd - 1.0| * 200           : 0)  // vertical equity breach
    ///   + (exceptionRate > 0.10         ? exceptionRate * 50          : 0)  // too many parcels outside fence
    ///   + (parcelCount &lt; 30            ? (30 - parcelCount) * 0.5    : 0)  // low confidence
    /// , 0, 100)
    ///
    /// Returns the clamped composite risk plus an ordered list of human-readable
    /// reason strings (largest contributor first). Both are surfaced in the DTO.
    /// </summary>
    public static (decimal Risk, List<string> Reasons) ComputeCompositeRisk(
        decimal? cod,
        decimal? median,
        decimal? prd,
        int parcelCount,
        int exceptionCount)
    {
        var contribs = new List<(decimal amount, string reason)>();

        if (!cod.HasValue)
        {
            contribs.Add((10m, "insufficient ratio data"));
        }
        else if (cod.Value > CodIaaoCeiling)
        {
            var c = (cod.Value - CodIaaoCeiling) * 2m;
            contribs.Add((c, $"COD {cod.Value:F1} exceeds IAAO ceiling (20)"));
        }

        if (median.HasValue && (median.Value < MedianFairLow || median.Value > MedianFairHigh))
        {
            var c = Math.Abs(median.Value - 1.0m) * 100m;
            contribs.Add((c, $"median {median.Value:F2} outside fair range (0.90–1.10)"));
        }

        if (prd.HasValue && (prd.Value < PrdIaaoLow || prd.Value > PrdIaaoHigh))
        {
            var c = Math.Abs(prd.Value - 1.0m) * 200m;
            contribs.Add((c, $"PRD {prd.Value:F2} outside vertical-equity band (0.98–1.03)"));
        }

        var exceptionRate = parcelCount > 0 ? (decimal)exceptionCount / parcelCount : 0m;
        if (exceptionRate > 0.10m)
        {
            var c = exceptionRate * 50m;
            contribs.Add((c, $"{exceptionCount} parcels ({exceptionRate * 100m:F1}%) outside IAAO fence"));
        }

        if (parcelCount < MinParcelsForRisk)
        {
            var c = (MinParcelsForRisk - parcelCount) * 0.5m;
            contribs.Add((c, $"low sample size ({parcelCount} parcels, {MinParcelsForRisk} recommended)"));
        }

        var total = contribs.Sum(x => x.amount);
        var clamped = Math.Min(100m, Math.Max(0m, total));

        var reasons = contribs
            .OrderByDescending(x => x.amount)
            .Select(x => x.reason)
            .ToList();

        return (Math.Round(clamped, 2), reasons);
    }

    private static HealthAlertDto BuildSegmentAlert(
        CountySegment seg, Dictionary<Guid, string> segmentCityMap)
    {
        var (risk, reasons) = ComputeCompositeRisk(
            cod: seg.CoefficientOfDispersion,
            median: seg.MedianRatio,
            prd: seg.PriceRelatedDifferential,
            parcelCount: seg.ParcelCount,
            exceptionCount: seg.ExceptionCount);

        segmentCityMap.TryGetValue(seg.SegmentId, out var city);

        return new HealthAlertDto(
            SegmentId: seg.SegmentId,
            SegmentName: seg.Name,
            NeighborhoodCode: seg.GeographyRef,
            City: city,
            ParcelCount: seg.ParcelCount,
            MedianRatio: seg.MedianRatio,
            Cod: seg.CoefficientOfDispersion,
            Prd: seg.PriceRelatedDifferential,
            ExceptionCount: seg.ExceptionCount,
            CompositeRisk: risk,
            Reasons: reasons);
    }

    /// <summary>
    /// IAAO compliance tiering for the county summary.
    ///   InsufficientData — ratioCount &lt; 30
    ///   IaaoCompliant    — median ∈ [0.90,1.10] AND cod ≤ 20 AND prd ∈ [0.98,1.03]
    ///   MarginalCompliance — median ∈ [0.85,1.15] AND cod ≤ 25 AND prd ∈ [0.95,1.05]
    ///                      (and not IaaoCompliant)
    ///   NonCompliant       — otherwise (metrics present but outside marginal bands)
    /// A null metric in the strict case is treated as non-compliance; in the
    /// marginal case null means "cannot affirm marginal", which falls through.
    /// </summary>
    public static CountyHealthComplianceStatus ClassifyCompliance(
        decimal? median, decimal? cod, decimal? prd, int ratioCount)
    {
        if (ratioCount < MinRatiosForCompliance)
            return CountyHealthComplianceStatus.InsufficientData;

        bool strictMedian = median.HasValue && median.Value >= MedianFairLow     && median.Value <= MedianFairHigh;
        bool strictCod    = cod.HasValue    && cod.Value    <= CodIaaoCeiling;
        bool strictPrd    = prd.HasValue    && prd.Value    >= PrdIaaoLow        && prd.Value    <= PrdIaaoHigh;
        if (strictMedian && strictCod && strictPrd)
            return CountyHealthComplianceStatus.IaaoCompliant;

        bool margMedian = median.HasValue && median.Value >= MedianMarginalLow && median.Value <= MedianMarginalHigh;
        bool margCod    = cod.HasValue    && cod.Value    <= CodMarginalCeiling;
        bool margPrd    = prd.HasValue    && prd.Value    >= PrdMarginalLow    && prd.Value    <= PrdMarginalHigh;
        if (margMedian && margCod && margPrd)
            return CountyHealthComplianceStatus.MarginalCompliance;

        return CountyHealthComplianceStatus.NonCompliant;
    }

    // ── Parcel-level loading + helpers ────────────────────────────────────

    private record RollupParcelRow(
        string ParcelId,
        string NeighborhoodCode,
        string BuildingType,
        string QualityGrade,
        decimal AssessedValue,
        decimal SalePrice,
        decimal Ratio,
        string City);

    /// <summary>
    /// Re-resolve parcel-level ratios for the active segment set by re-running
    /// derivation's grouping key against canonical Properties + CamaCharacteristics
    /// + qualified ComparableSales for the study's tax-year window. Mirrors the
    /// pattern in CountyStudyService.LoadRollupInputsAsync but returns only the
    /// parcel list since health summary consumes nothing else.
    /// </summary>
    private async Task<List<RollupParcelRow>> LoadParcelRatiosAsync(
        CountyStudySession study,
        List<CountySegment> segments,
        CancellationToken ct)
    {
        var groupKeys = new HashSet<(string Hood, string BldgType, string Quality)>();
        foreach (var seg in segments)
        {
            if (string.IsNullOrWhiteSpace(seg.RuleDefinition)) continue;
            try
            {
                var rule = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(seg.RuleDefinition);
                if (rule == null) continue;
                var hood = rule.TryGetValue("neighborhood", out var h) && h.ValueKind == JsonValueKind.String ? (h.GetString() ?? "UNKNOWN") : "UNKNOWN";
                var bldg = rule.TryGetValue("buildingType", out var b) && b.ValueKind == JsonValueKind.String ? (b.GetString() ?? "UNKNOWN") : "UNKNOWN";
                var qual = rule.TryGetValue("qualityGrade", out var q) && q.ValueKind == JsonValueKind.String ? (q.GetString() ?? "UNKNOWN") : "UNKNOWN";
                groupKeys.Add((hood, bldg, qual));
            }
            catch (JsonException) { /* skip malformed */ }
        }

        if (groupKeys.Count == 0) return new();

        var countyId = study.CountyId;
        var taxYear  = study.TaxYear;

        var parcels = await (
            from p in _db.Properties.AsNoTracking()
            where p.CountyId == countyId && p.TaxYear == taxYear
            join c in _db.CamaCharacteristics.AsNoTracking()
                on new { p.ParcelId, p.TaxYear } equals new { c.ParcelId, c.TaxYear } into cj
            from c in cj.DefaultIfEmpty()
            select new
            {
                p.ParcelId,
                p.AssessedValue,
                Neighborhood = p.Neighborhood,
                BuildingType = c != null ? c.BuildingType : null,
                QualityGrade = c != null ? c.QualityGrade : null,
                City         = c != null ? c.City         : null,
                SitusCity    = p.SitusCity,
            }).ToListAsync(ct);

        var inScope = new List<(string ParcelId, string Hood, string BldgType, string Quality, decimal Assessed, string City)>();
        foreach (var pc in parcels)
        {
            var key = (
                Hood:     string.IsNullOrWhiteSpace(pc.Neighborhood) ? "UNKNOWN" : pc.Neighborhood!,
                BldgType: string.IsNullOrWhiteSpace(pc.BuildingType) ? "UNKNOWN" : pc.BuildingType!,
                Quality:  string.IsNullOrWhiteSpace(pc.QualityGrade) ? "UNKNOWN" : pc.QualityGrade!
            );
            if (!groupKeys.Contains(key)) continue;

            var cityRaw = !string.IsNullOrWhiteSpace(pc.City) ? pc.City : pc.SitusCity;
            inScope.Add((pc.ParcelId, key.Hood, key.BldgType, key.Quality, pc.AssessedValue, NormalizeCity(cityRaw)));
        }
        if (inScope.Count == 0) return new();

        var lookbackStart = new DateTime(taxYear - 2, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        var lookbackEnd   = new DateTime(taxYear, 12, 31, 23, 59, 59, DateTimeKind.Utc);
        var matchedIds = inScope.Select(p => p.ParcelId).ToHashSet();
        var salesRows = await _db.ComparableSales.AsNoTracking()
            .Where(s => s.CountyId == countyId)
            .Where(s => s.SaleDate >= lookbackStart && s.SaleDate <= lookbackEnd)
            .Where(s => s.SalePrice > 0)
            .Where(s => (s.QualificationDecision ?? s.QualificationRecommendation ?? s.SaleQualification) == "qualified")
            .Where(s => matchedIds.Contains(s.ParcelId))
            .Select(s => new { s.ParcelId, Price = s.AdjustedSalePrice ?? s.SalePrice })
            .ToListAsync(ct);

        var priceByParcel = salesRows
            .GroupBy(s => s.ParcelId)
            .ToDictionary(g => g.Key, g => g.Select(x => x.Price).Average());

        var perParcel = new List<RollupParcelRow>(inScope.Count);
        foreach (var p in inScope)
        {
            if (!priceByParcel.TryGetValue(p.ParcelId, out var price) || price <= 0) continue;
            if (p.Assessed <= 0) continue;
            perParcel.Add(new RollupParcelRow(
                ParcelId: p.ParcelId,
                NeighborhoodCode: p.Hood,
                BuildingType: p.BldgType,
                QualityGrade: p.Quality,
                AssessedValue: p.Assessed,
                SalePrice: price,
                Ratio: p.Assessed / price,
                City: p.City));
        }

        return perParcel;
    }

    /// <summary>
    /// PRD on a per-parcel sample. Identical formula to CountyStudyService —
    /// arithmetic-mean / weighted-mean of ratios, minimum 5 parcels.
    /// </summary>
    private static decimal? ComputePrd(List<RollupParcelRow> rows)
    {
        if (rows.Count < 5) return null;
        var arithmetic = rows.Select(r => r.Ratio).Average();
        var sumAssessed = rows.Sum(r => r.AssessedValue);
        var sumPrice    = rows.Sum(r => r.SalePrice);
        if (sumPrice <= 0) return null;
        var weighted = sumAssessed / sumPrice;
        return weighted > 0 ? arithmetic / weighted : null;
    }

    /// <summary>
    /// Segment → modal-city map. Duplicates CountyStudyService logic so the
    /// health service doesn't depend on the rollup service; both converge on
    /// the same city for any given segment because the underlying data is
    /// identical.
    /// </summary>
    private static Dictionary<Guid, string> BuildSegmentCityMap(
        List<CountySegment> segments,
        List<RollupParcelRow> perParcel)
    {
        var keyBySegment = new Dictionary<Guid, (string Hood, string BldgType, string Quality)>();
        foreach (var seg in segments)
        {
            if (string.IsNullOrWhiteSpace(seg.RuleDefinition)) continue;
            try
            {
                var rule = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(seg.RuleDefinition);
                if (rule == null) continue;
                var hood = rule.TryGetValue("neighborhood", out var h) && h.ValueKind == JsonValueKind.String ? (h.GetString() ?? "UNKNOWN") : "UNKNOWN";
                var bldg = rule.TryGetValue("buildingType", out var b) && b.ValueKind == JsonValueKind.String ? (b.GetString() ?? "UNKNOWN") : "UNKNOWN";
                var qual = rule.TryGetValue("qualityGrade", out var q) && q.ValueKind == JsonValueKind.String ? (q.GetString() ?? "UNKNOWN") : "UNKNOWN";
                keyBySegment[seg.SegmentId] = (hood, bldg, qual);
            }
            catch (JsonException) { /* fall through to Unincorporated */ }
        }

        var parcelsByKey = perParcel
            .GroupBy(p => (p.NeighborhoodCode, p.BuildingType, p.QualityGrade))
            .ToDictionary(g => g.Key, g => g.ToList());

        var map = new Dictionary<Guid, string>();
        foreach (var seg in segments)
        {
            if (!keyBySegment.TryGetValue(seg.SegmentId, out var key))
            {
                map[seg.SegmentId] = "Unincorporated";
                continue;
            }
            if (!parcelsByKey.TryGetValue(key, out var parcels) || parcels.Count == 0)
            {
                map[seg.SegmentId] = "Unincorporated";
                continue;
            }
            var modalCity = parcels
                .GroupBy(p => p.City)
                .OrderByDescending(g => g.Count())
                .ThenBy(g => g.Key)
                .First().Key;
            map[seg.SegmentId] = modalCity;
        }
        return map;
    }

    // ── Stat primitives (mirror EquityMetricService / CountyStudyService). ──

    private static decimal Median(IList<decimal> values)
    {
        if (values.Count == 0) return 0m;
        var sorted = values.OrderBy(v => v).ToList();
        var mid = sorted.Count / 2;
        return sorted.Count % 2 == 0
            ? (sorted[mid - 1] + sorted[mid]) / 2m
            : sorted[mid];
    }

    private static decimal ComputeCod(IList<decimal> ratios, decimal median)
    {
        if (ratios.Count == 0 || median <= 0) return 0m;
        var absDev = ratios.Select(r => Math.Abs(r - median)).Average();
        return absDev / median * 100m;
    }

    /// <summary>Canonical city normalization (matches CountyStudyService).</summary>
    private static string NormalizeCity(string? rawCity)
    {
        if (string.IsNullOrWhiteSpace(rawCity)) return "Unincorporated";
        var normalized = rawCity.Trim().ToUpperInvariant();
        return normalized switch
        {
            "KENNEWICK"     => "Kennewick",
            "RICHLAND"      => "Richland",
            "PASCO"         => "Pasco",
            "PROSSER"       => "Prosser",
            "BENTON CITY"   => "Benton City",
            "WEST RICHLAND" => "West Richland",
            "FINLEY"        => "Finley",
            "BASIN CITY"    => "Basin City",
            "BURBANK"       => "Burbank",
            "PATERSON"      => "Paterson",
            _               => "Unincorporated",
        };
    }
}
