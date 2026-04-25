// backend/src/TerraFusion.Core/Services/CountyStudySegmentDerivationService.cs
//
// Reads canonical TerraFusion tables (Properties, CamaCharacteristics, ComparableSales)
// and writes a CountySegmentSet + CountySegment rows grouped by neighborhood × building
// type × quality grade. First-pass algorithm: deterministic, testable, idempotent per
// study — each invocation creates a new segment set with incremented Version.

using Microsoft.EntityFrameworkCore;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Interfaces;

namespace TerraFusion.Core.Services;

public class CountyStudySegmentDerivationService : ICountyStudySegmentDerivationService
{
    // IAAO Standard on Ratio Studies thresholds (residential).
    private const decimal CodWarnThreshold = 15.0m;   // COD > 15 = non-uniform
    private const decimal PrdLowThreshold  = 0.98m;
    private const decimal PrdHighThreshold = 1.03m;
    // Per-parcel ratio bounds — parcels outside are flagged as exceptions.
    private const decimal RatioLowFence  = 0.70m;
    private const decimal RatioHighFence = 1.30m;
    // Minimum sample size before we compute COD/PRD for a segment.
    private const int MinRatiosForStats = 5;

    private readonly ITerraFusionDbContext _db;

    public CountyStudySegmentDerivationService(ITerraFusionDbContext db) => _db = db;

    public async Task<SegmentDerivationResult> DeriveAsync(
        Guid studyId,
        string userId,
        CancellationToken ct = default)
    {
        var study = await _db.CountyStudySessions.FirstOrDefaultAsync(s => s.StudyId == studyId, ct)
            ?? throw new InvalidOperationException($"Study {studyId} not found");

        var countyId = study.CountyId;
        var taxYear  = study.TaxYear;

        // ── Step 1: Load parcel-level data for the study's county + tax year ──
        // Left-join CamaCharacteristics so parcels without CAMA still group under UNKNOWN.
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
            }).ToListAsync(ct);

        // ── Step 2: Load qualified sales for ratio stats ──
        // Use the two-year window common to the ratio-study endpoint. Ratio is
        // canonical TF-computed: AssessedValue / AdjustedSalePrice.
        var lookbackStart = new DateTime(taxYear - 2, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        var lookbackEnd   = new DateTime(taxYear, 12, 31, 23, 59, 59, DateTimeKind.Utc);

        var salesByParcel = await _db.ComparableSales.AsNoTracking()
            .Where(s => s.CountyId == countyId)
            .Where(s => s.SaleDate >= lookbackStart && s.SaleDate <= lookbackEnd)
            .Where(s => s.SalePrice > 0)
            .Where(s => (s.QualificationDecision ?? s.QualificationRecommendation ?? s.SaleQualification) == "qualified")
            .Select(s => new { s.ParcelId, Price = s.AdjustedSalePrice ?? s.SalePrice })
            .ToListAsync(ct);

        var pricesByParcel = salesByParcel
            .GroupBy(s => s.ParcelId)
            .ToDictionary(g => g.Key, g => g.Select(x => x.Price).Average());

        // ── Step 3: Group + compute per-segment metrics ──
        var groups = parcels
            .GroupBy(p => new
            {
                Neighborhood = string.IsNullOrWhiteSpace(p.Neighborhood) ? "UNKNOWN" : p.Neighborhood!,
                BuildingType = string.IsNullOrWhiteSpace(p.BuildingType) ? "UNKNOWN" : p.BuildingType!,
                QualityGrade = string.IsNullOrWhiteSpace(p.QualityGrade) ? "UNKNOWN" : p.QualityGrade!,
            })
            .ToList();

        var now = DateTime.UtcNow;
        var segmentSet = new CountySegmentSet
        {
            SegmentSetId = Guid.NewGuid(),
            StudyId      = study.StudyId,
            CountyId     = countyId,
            Name         = $"Derived {taxYear} — {now:yyyy-MM-dd HH:mm} UTC",
            SourceType   = SegmentSetSourceType.Hybrid,  // neighborhood × bldg × quality
            Version      = await NextVersionAsync(study.StudyId, ct),
            IsBaseline   = true,
            CreatedBy    = userId,
            UpdatedBy    = userId,
        };

        var segments = new List<CountySegment>();
        var segmentsWithRatios      = 0;
        var segmentsWithExceptions  = 0;
        var totalParcels            = 0;

        foreach (var group in groups)
        {
            var members = group.ToList();
            totalParcels += members.Count;

            // Build per-parcel ratios (canonical: AssessedValue / AdjustedSalePrice).
            var ratios = new List<decimal>();
            foreach (var m in members)
            {
                if (m.AssessedValue > 0
                    && pricesByParcel.TryGetValue(m.ParcelId, out var price)
                    && price > 0)
                {
                    ratios.Add(m.AssessedValue / price);
                }
            }

            decimal? medianRatio = null;
            decimal? cod = null;
            decimal? prd = null;
            int exceptionCount = 0;

            if (ratios.Count > 0)
            {
                segmentsWithRatios++;

                // Per-parcel exceptions: ratios outside the IAAO coarse fence.
                exceptionCount = ratios.Count(r => r < RatioLowFence || r > RatioHighFence);
                if (exceptionCount > 0) segmentsWithExceptions++;

                var sorted = ratios.OrderBy(r => r).ToArray();
                medianRatio = sorted.Length % 2 == 0
                    ? (sorted[sorted.Length / 2 - 1] + sorted[sorted.Length / 2]) / 2m
                    : sorted[sorted.Length / 2];

                if (ratios.Count >= MinRatiosForStats && medianRatio > 0)
                {
                    // COD = (mean |ratio − median|) / median × 100   (IAAO §7)
                    var meanAbsDev = ratios.Select(r => Math.Abs(r - medianRatio.Value)).Average();
                    cod = meanAbsDev / medianRatio.Value * 100m;

                    // PRD = arithmetic mean ratio / weighted mean ratio    (IAAO §6)
                    // Weighted mean = Σassessed / Σprice. Reconstruct Σassessed from
                    // the ratios (we already have AssessedValue in members).
                    var joinedPrices = members
                        .Where(m => pricesByParcel.ContainsKey(m.ParcelId))
                        .Select(m => new { m.AssessedValue, Price = pricesByParcel[m.ParcelId] })
                        .ToList();
                    if (joinedPrices.Count >= MinRatiosForStats)
                    {
                        var arithmeticMean = ratios.Average();
                        var sumAssessed = joinedPrices.Sum(x => x.AssessedValue);
                        var sumPrice    = joinedPrices.Sum(x => x.Price);
                        if (sumPrice > 0)
                        {
                            var weightedMean = sumAssessed / sumPrice;
                            if (weightedMean > 0)
                                prd = arithmeticMean / weightedMean;
                        }
                    }
                }
            }

            // Stability: inverse of COD, capped 0–100. Default 50 when no stats.
            decimal stability = cod.HasValue
                ? Math.Max(0m, 100m - Math.Min(cod.Value, 100m))
                : 50m;

            // Risk: bumps when COD > threshold, when PRD out of range, and with
            // exception fraction. Bounded 0–100.
            var exceptionFrac = members.Count > 0
                ? (decimal)exceptionCount / members.Count
                : 0m;
            decimal risk = 20m; // baseline risk
            if (cod.HasValue && cod.Value > CodWarnThreshold) risk += 30m;
            if (prd.HasValue && (prd.Value < PrdLowThreshold || prd.Value > PrdHighThreshold)) risk += 20m;
            risk += exceptionFrac * 40m;
            risk = Math.Min(risk, 100m);

            var segment = new CountySegment
            {
                SegmentId               = Guid.NewGuid(),
                SegmentSetId            = segmentSet.SegmentSetId,
                CountyId                = countyId,
                Name                    = $"{group.Key.Neighborhood} · {group.Key.BuildingType} · {group.Key.QualityGrade}",
                SegmentType             = MapSegmentType(group.Key.BuildingType),
                GeographyRef            = group.Key.Neighborhood,
                RuleDefinition = System.Text.Json.JsonSerializer.Serialize(new
                {
                    neighborhood = group.Key.Neighborhood,
                    buildingType = group.Key.BuildingType,
                    qualityGrade = group.Key.QualityGrade,
                }),
                ParcelCount             = members.Count,
                MedianRatio             = medianRatio.HasValue ? Math.Round(medianRatio.Value, 4) : null,
                CoefficientOfDispersion = cod.HasValue         ? Math.Round(cod.Value,         2) : null,
                PriceRelatedDifferential= prd.HasValue         ? Math.Round(prd.Value,         4) : null,
                StabilityScore          = Math.Round(stability, 2),
                RiskScore               = Math.Round(risk,       2),
                ExceptionCount          = exceptionCount,
                CreatedBy               = userId,
                UpdatedBy               = userId,
            };

            segments.Add(segment);
        }

        _db.CountySegmentSets.Add(segmentSet);
        _db.CountySegments.AddRange(segments);

        // Point the study at the new baseline so UI loads it without an extra round-trip.
        study.ActiveSegmentSetId = segmentSet.SegmentSetId;
        study.UpdatedAt = now;
        study.UpdatedBy = userId;

        await _db.SaveChangesAsync();

        return new SegmentDerivationResult(
            SegmentSetId:              segmentSet.SegmentSetId,
            SegmentCount:              segments.Count,
            TotalParcels:              totalParcels,
            SegmentsWithRatios:        segmentsWithRatios,
            SegmentsWithIaaoExceptions:segmentsWithExceptions);
    }

    private async Task<int> NextVersionAsync(Guid studyId, CancellationToken ct)
    {
        var existing = await _db.CountySegmentSets
            .AsNoTracking()
            .Where(s => s.StudyId == studyId)
            .Select(s => (int?)s.Version)
            .MaxAsync(ct);
        return (existing ?? 0) + 1;
    }

    private static SegmentType MapSegmentType(string buildingType)
    {
        if (string.IsNullOrWhiteSpace(buildingType)) return SegmentType.Residential;
        var c = char.ToUpperInvariant(buildingType[0]);
        return c switch
        {
            'R' => SegmentType.Residential,
            'C' => SegmentType.Commercial,
            'A' or 'T' => SegmentType.Agricultural,
            'I' => SegmentType.Industrial,
            'S' or 'M' => SegmentType.MixedUse,
            _   => SegmentType.Residential,
        };
    }
}
