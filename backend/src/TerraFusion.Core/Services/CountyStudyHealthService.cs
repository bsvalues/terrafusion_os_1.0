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
    public const string StatisticsCompatContractId = "statistics_ratio_study_compat_v1";

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

    public async Task<CountyStatisticsCompatDto> GetStatisticsCompatAsync(
        Guid studyId, CancellationToken ct = default)
    {
        var study = await _db.CountyStudySessions.AsNoTracking().FirstOrDefaultAsync(s => s.StudyId == studyId, ct)
            ?? throw new InvalidOperationException($"Study {studyId} not found");

        var taxYear = study.TaxYear;
        var lookbackStart = new DateTime(taxYear - 2, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        var lookbackEnd = new DateTime(taxYear, 1, 1, 0, 0, 0, DateTimeKind.Utc);

        var windowRows = await _db.ComparableSales.AsNoTracking()
            .Where(s => s.CountyId == study.CountyId)
            .Where(s => s.SalesYear == taxYear
                     || (s.SalesYear == null
                         && s.SaleDate >= lookbackStart
                         && s.SaleDate < lookbackEnd))
            .Select(s => new CompatSaleRow(
                s.Id,
                s.ParcelId,
                s.SaleDate,
                s.SalesYear,
                s.AdjustedSalePrice ?? s.SalePrice,
                s.QualificationDecision,
                s.QualificationRecommendation,
                s.SaleQualification,
                s.SuppressOnRatioRptCd,
                s.IncludeNoCalc))
            .ToListAsync(ct);

        var qualifiedRows = windowRows
            .Where(s => IsStatisticsCompatQualified(s.QualificationDecision, s.QualificationRecommendation))
            .ToList();

        var baseRows = qualifiedRows
            .Where(s => s.SuppressOnRatioRptCd != "T")
            .Where(s => s.IncludeNoCalc != true)
            .ToList();

        var parcelIds = baseRows
            .Select(s => s.ParcelId)
            .Where(id => !string.IsNullOrWhiteSpace(id))
            .Distinct()
            .ToHashSet();

        var assessedByParcelNumber = await _db.Properties.AsNoTracking()
            .Where(p => p.CountyId == study.CountyId)
            .Where(p => p.TaxYear == taxYear)
            .Where(p => p.AssessedValue > 0)
            .Where(p => parcelIds.Contains(p.ParcelNumber))
            .Select(p => new { p.ParcelNumber, p.AssessedValue })
            .ToListAsync(ct);

        var assessedMap = assessedByParcelNumber
            .GroupBy(p => p.ParcelNumber)
            .ToDictionary(g => g.Key, g => g.First().AssessedValue);

        var ratioRows = baseRows
            .Select(s =>
            {
                var matched = assessedMap.TryGetValue(s.ParcelId, out var assessed);
                var ratio = matched && s.SalePrice > 0 ? assessed / s.SalePrice : (decimal?)null;
                return new CompatRatioRow(s.Id, s.ParcelId, s.SalePrice, matched ? assessed : 0m, ratio);
            })
            .Where(r => r.Ratio.HasValue && r.Ratio.Value > 0)
            .Select(r => r with { Ratio = r.Ratio!.Value })
            .ToList();

        var trimmedRows = TrimIqr(ratioRows, out var outliersExcluded);
        var ratios = trimmedRows.Select(r => r.Ratio!.Value).OrderBy(r => r).ToList();

        decimal? medianRatio = ratios.Count > 0 ? Median(ratios) : null;
        decimal? meanRatio = ratios.Count > 0 ? ratios.Average() : null;
        decimal? cod = ratios.Count >= 5 && medianRatio.HasValue && medianRatio.Value > 0
            ? ComputeCod(ratios, medianRatio.Value)
            : null;
        decimal? weightedMean = null;
        decimal? prd = null;
        decimal? cov = null;
        decimal? prb = null;
        decimal? tierSlope = null;
        StatisticsCompatTierMediansDto? tierMedians = null;

        if (trimmedRows.Count > 0)
        {
            var sumAssessed = trimmedRows.Sum(r => r.AssessedValue);
            var sumSalePrice = trimmedRows.Sum(r => r.SalePrice);
            if (sumSalePrice > 0)
                weightedMean = sumAssessed / sumSalePrice;

            if (weightedMean.HasValue && meanRatio.HasValue && weightedMean.Value > 0)
                prd = meanRatio.Value / weightedMean.Value;

            if (meanRatio.HasValue && meanRatio.Value > 0 && trimmedRows.Count > 1)
            {
                var mean = (double)meanRatio.Value;
                var variance = ratios.Sum(r => Math.Pow((double)r - mean, 2)) / (trimmedRows.Count - 1);
                cov = (decimal)(Math.Sqrt(variance) / mean * 100.0);
            }

            if (trimmedRows.Count >= 5 && meanRatio.HasValue)
            {
                prb = ComputePrb(trimmedRows, meanRatio.Value);
                tierSlope = prb;
            }

            if (trimmedRows.Count >= 8)
            {
                var priceSorted = trimmedRows
                    .OrderBy(r => r.SalePrice)
                    .Select(r => r.Ratio!.Value)
                    .ToArray();
                var n = priceSorted.Length;
                tierMedians = new StatisticsCompatTierMediansDto(
                    Q1: MedianOfSlice(priceSorted, 0, n / 4),
                    Q2: MedianOfSlice(priceSorted, n / 4, n / 2),
                    Q3: MedianOfSlice(priceSorted, n / 2, n * 3 / 4),
                    Q4: MedianOfSlice(priceSorted, n * 3 / 4, n));
            }
        }

        var conversionCounts = new StatisticsCompatConversionSensitiveCountsDto(
            CandidateRows: windowRows.Count,
            DecisionQualifiedRows: windowRows.Count(s => s.QualificationDecision == "qualified"),
            RecommendationQualifiedRows: windowRows.Count(s => s.QualificationDecision == null && s.QualificationRecommendation == "qualified"),
            RecommendationNullDefaultQualifiedRows: windowRows.Count(s => s.QualificationDecision == null && s.QualificationRecommendation == null),
            SaleQualificationOnlyQualifiedRows: windowRows.Count(s =>
                s.QualificationDecision == null
                && s.QualificationRecommendation == null
                && s.SaleQualification == "qualified"),
            SuppressedExcludedRows: qualifiedRows.Count(s => s.SuppressOnRatioRptCd == "T"),
            IncludeNoCalcExcludedRows: qualifiedRows.Count(s => s.IncludeNoCalc == true),
            SalesYearAssignedRows: windowRows.Count(s => s.SalesYear == taxYear),
            NullSalesYearWindowRows: windowRows.Count(s => s.SalesYear == null));

        var identity = new StatisticsCompatParcelIdentityReconciliationDto(
            JoinMode: "ComparableSales.ParcelId -> Properties.ParcelNumber",
            SaleRows: baseRows.Count,
            DistinctSaleParcelIds: parcelIds.Count,
            MatchedPropertyRows: baseRows.Count(s => assessedMap.ContainsKey(s.ParcelId)),
            CountWithRatio: ratioRows.Count,
            UnmatchedSaleRows: baseRows.Count - ratioRows.Count);

        return new CountyStatisticsCompatDto(
            StudyId: study.StudyId,
            CountyId: study.CountyId,
            TaxYear: study.TaxYear,
            Mode: "StatisticsCompat",
            ContractId: StatisticsCompatContractId,
            Population: "qualified sale ratio rows",
            IdentityJoin: identity.JoinMode,
            SaleWindow: new StatisticsCompatSaleWindowDto(
                TaxYear: taxYear,
                LookbackStart: lookbackStart,
                LookbackEndExclusive: lookbackEnd,
                Rule: $"SalesYear={taxYear}, or null SalesYear with SaleDate >= {lookbackStart:yyyy-MM-dd} and < {lookbackEnd:yyyy-MM-dd}"),
            QualificationPolicy: "QualificationDecision == qualified, or null decision with QualificationRecommendation == qualified/null.",
            SuppressionPolicy: "Exclude SuppressOnRatioRptCd=T and IncludeNoCalc=true.",
            OutlierPolicy: "Report countWithRatio before trimming; compute stats on Tukey/IQR-trimmed rows.",
            TrustPosture: new List<string> { "Production Provisional", "Sync-Derived", "Converted Legacy Sensitive" },
            TotalSales: baseRows.Count,
            CountWithRatio: ratioRows.Count,
            OutliersExcluded: outliersExcluded,
            TrimmedCount: trimmedRows.Count,
            MedianRatio: Round(medianRatio, 4),
            MeanRatio: Round(meanRatio, 4),
            WeightedMeanRatio: Round(weightedMean, 4),
            Cod: Round(cod, 2),
            Prd: Round(prd, 4),
            Prb: Round(prb, 4),
            Cov: Round(cov, 2),
            TierSlope: Round(tierSlope, 4),
            TierMedians: tierMedians is null
                ? null
                : new StatisticsCompatTierMediansDto(
                    Round(tierMedians.Q1, 4) ?? 0m,
                    Round(tierMedians.Q2, 4) ?? 0m,
                    Round(tierMedians.Q3, 4) ?? 0m,
                    Round(tierMedians.Q4, 4) ?? 0m),
            ConversionSensitiveCounts: conversionCounts,
            ParcelIdentityReconciliation: identity,
            ComputedAt: DateTime.UtcNow);
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
        var metadata = CountySegmentMetadataSupport.Parse(seg.RuleDefinition, seg.GeographyRef);
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
            NeighborhoodCode: metadata.NeighborhoodCode,
            RevalArea: metadata.RevalArea,
            BuildingType: metadata.BuildingType,
            QualityGrade: metadata.QualityGrade,
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

    private record CompatSaleRow(
        Guid Id,
        string ParcelId,
        DateTime SaleDate,
        int? SalesYear,
        decimal SalePrice,
        string? QualificationDecision,
        string? QualificationRecommendation,
        string? SaleQualification,
        string? SuppressOnRatioRptCd,
        bool? IncludeNoCalc);

    private record CompatRatioRow(
        Guid Id,
        string ParcelId,
        decimal SalePrice,
        decimal AssessedValue,
        decimal? Ratio);

    private static bool IsStatisticsCompatQualified(string? decision, string? recommendation) =>
        decision == "qualified"
        || (decision == null && (recommendation == "qualified" || recommendation == null));

    private static List<CompatRatioRow> TrimIqr(List<CompatRatioRow> ratioRows, out int outliersExcluded)
    {
        outliersExcluded = 0;
        if (ratioRows.Count == 0) return new List<CompatRatioRow>();

        var ordered = ratioRows
            .Select(r => r.Ratio!.Value)
            .OrderBy(r => r)
            .ToArray();
        var n = ordered.Length;
        var q1 = ordered[(int)Math.Floor(n * 0.25m)];
        var q3 = ordered[(int)Math.Floor(n * 0.75m)];
        var iqr = q3 - q1;
        var lo = q1 - 1.5m * iqr;
        var hi = q3 + 1.5m * iqr;

        var trimmed = ratioRows
            .Where(r => r.Ratio!.Value >= lo && r.Ratio.Value <= hi)
            .ToList();
        outliersExcluded = ratioRows.Count - trimmed.Count;
        return trimmed;
    }

    private static decimal? ComputePrb(List<CompatRatioRow> rows, decimal meanRatio)
    {
        if (rows.Count < 5) return null;

        var logPrices = rows.Select(r => Math.Log((double)r.SalePrice)).ToArray();
        var meanLogPrice = logPrices.Average();
        var numerator = 0.0;
        var denominator = 0.0;

        for (var i = 0; i < rows.Count; i++)
        {
            var dLog = logPrices[i] - meanLogPrice;
            var dRatio = (double)rows[i].Ratio!.Value - (double)meanRatio;
            numerator += dRatio * dLog;
            denominator += dLog * dLog;
        }

        return denominator > 0 ? (decimal)(numerator / denominator) : null;
    }

    private static decimal MedianOfSlice(decimal[] values, int start, int end)
    {
        if (end <= start) return 0m;
        var slice = values[start..end].OrderBy(v => v).ToList();
        return Median(slice);
    }

    private static decimal? Round(decimal? value, int digits) =>
        value.HasValue ? Math.Round(value.Value, digits) : null;

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
