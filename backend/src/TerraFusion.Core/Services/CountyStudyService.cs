// backend/src/TerraFusion.Core/Services/CountyStudyService.cs
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using TerraFusion.Core.DTOs;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Entities.Pacs;
using TerraFusion.Core.Interfaces;

namespace TerraFusion.Core.Services;

public class CountyStudyService : ICountyStudyService
{
    private readonly ITerraFusionDbContext _db;
    private readonly ICountyResolver _countyResolver;

    public CountyStudyService(ITerraFusionDbContext db, ICountyResolver countyResolver)
    {
        _db = db;
        _countyResolver = countyResolver;
    }

    // ── Study ──────────────────────────────────────────────────────────────

    public async Task<CountyStudySessionDto> CreateStudyAsync(CreateStudyRequest req, string userId)
    {
        var countyId = await _countyResolver.ResolveAsync(req.CountyId);
        var county = await _db.Counties.FindAsync(countyId);
        var study = new CountyStudySession
        {
            CountyId = countyId,
            CountyName = county?.Name ?? "Unknown County",
            TaxYear = req.TaxYear,
            StudyType = req.StudyType,
            BaselineVersion = req.BaselineVersion,
            Status = StudyStatus.Draft,
            CreatedBy = userId,
            UpdatedBy = userId
        };
        _db.CountyStudySessions.Add(study);
        await _db.SaveChangesAsync();
        return MapStudy(study);
    }

    public async Task<CountyStudySessionDto?> GetStudyAsync(Guid studyId)
    {
        var study = await _db.CountyStudySessions.FindAsync(studyId);
        return study == null ? null : MapStudy(study);
    }

    public async Task<List<CountyStudySessionDto>> GetStudiesAsync(Guid countyId)
    {
        return await _db.CountyStudySessions
            .Where(s => s.CountyId == countyId)
            .OrderByDescending(s => s.CreatedAt)
            .Select(s => MapStudy(s))
            .ToListAsync();
    }

    public async Task<CountyStudySessionDto?> UpdateStudyStatusAsync(Guid studyId, string status, string userId)
    {
        var study = await _db.CountyStudySessions.FindAsync(studyId);
        if (study == null) return null;
        if (!Enum.TryParse<StudyStatus>(status, out var parsedStatus)) return null;
        study.Status = parsedStatus;
        study.UpdatedAt = DateTime.UtcNow;
        study.UpdatedBy = userId;
        await _db.SaveChangesAsync();
        return MapStudy(study);
    }

    // ── Segment Sets ──────────────────────────────────────────────────────

    public async Task<CountySegmentSetDto> CreateSegmentSetAsync(
        Guid studyId, string name, string sourceType, bool isBaseline, string userId)
    {
        var study = await _db.CountyStudySessions.FindAsync(studyId)
            ?? throw new InvalidOperationException($"Study {studyId} not found");
        if (!Enum.TryParse<SegmentSetSourceType>(sourceType, out var parsedSource))
            throw new ArgumentException($"Invalid source type: {sourceType}");

        var segSet = new CountySegmentSet
        {
            StudyId = studyId,
            CountyId = study.CountyId,
            Name = name,
            SourceType = parsedSource,
            IsBaseline = isBaseline,
            CreatedBy = userId,
            UpdatedBy = userId
        };
        _db.CountySegmentSets.Add(segSet);
        await _db.SaveChangesAsync();
        return MapSegmentSet(segSet, 0);
    }

    public async Task<List<CountySegmentSetDto>> GetSegmentSetsAsync(Guid studyId)
    {
        return await _db.CountySegmentSets
            .Where(ss => ss.StudyId == studyId)
            .Select(ss => MapSegmentSet(ss, _db.CountySegments.Count(s => s.SegmentSetId == ss.SegmentSetId)))
            .ToListAsync();
    }

    public async Task<List<CountySegmentDto>> GetSegmentsAsync(Guid segmentSetId)
    {
        var segmentSet = await _db.CountySegmentSets
            .AsNoTracking()
            .FirstOrDefaultAsync(ss => ss.SegmentSetId == segmentSetId);
        if (segmentSet is null)
            return new List<CountySegmentDto>();

        var study = await _db.CountyStudySessions
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.StudyId == segmentSet.StudyId);

        var segments = await _db.CountySegments
            .AsNoTracking()
            .Where(s => s.SegmentSetId == segmentSetId)
            .OrderBy(s => s.Name)
            .ToListAsync();

        var depthMetrics = study is null
            ? new Dictionary<SegmentMetricKey, SegmentListDepthMetrics>()
            : await BuildSegmentListDepthMetricsAsync(study, segments);

        return segments
            .Select(s =>
            {
                var key = SegmentMetricKey.FromSegment(s);
                depthMetrics.TryGetValue(key, out var metrics);
                return MapSegment(s, metrics);
            })
            .ToList();
    }

    // ── Cohorts ──────────────────────────────────────────────────────────

    public async Task<CountyCohortDto> CreateCohortAsync(CreateCohortRequest req, string userId)
    {
        var study = await _db.CountyStudySessions.FindAsync(req.StudyId)
            ?? throw new InvalidOperationException($"Study {req.StudyId} not found");
        var cohort = new CountyCohort
        {
            StudyId = req.StudyId,
            CountyId = study.CountyId,
            Name = req.Name,
            SelectionType = req.SelectionType,
            Definition = req.Definition,
            ParcelCount = req.ParcelCount,
            IsHybrid = req.IsHybrid,
            CreatedBy = userId,
            UpdatedBy = userId
        };
        _db.CountyCohorts.Add(cohort);
        await _db.SaveChangesAsync();
        return MapCohort(cohort);
    }

    public async Task<List<CountyCohortDto>> GetCohortsAsync(Guid studyId)
    {
        return await _db.CountyCohorts
            .Where(c => c.StudyId == studyId)
            .OrderByDescending(c => c.CreatedAt)
            .Select(c => MapCohort(c))
            .ToListAsync();
    }

    public async Task<CountyCohortDto?> GetCohortAsync(Guid cohortId)
    {
        var cohort = await _db.CountyCohorts.FindAsync(cohortId);
        return cohort == null ? null : MapCohort(cohort);
    }

    // ── Scenarios ────────────────────────────────────────────────────────

    public async Task<CountyScenarioDto> CreateScenarioAsync(CreateScenarioRequest req, string userId)
    {
        var study = await _db.CountyStudySessions.FindAsync(req.StudyId)
            ?? throw new InvalidOperationException($"Study {req.StudyId} not found");
        var scenario = new CountyScenario
        {
            StudyId = req.StudyId,
            CohortId = req.CohortId,
            CountyId = study.CountyId,
            AdjustmentType = req.AdjustmentType,
            Parameters = req.Parameters,
            Rationale = req.Rationale,
            Status = ScenarioStatus.Draft,
            CreatedBy = userId,
            UpdatedBy = userId
        };
        _db.CountyScenarios.Add(scenario);
        await _db.SaveChangesAsync();
        return MapScenario(scenario);
    }

    public async Task<List<CountyScenarioDto>> GetScenariosAsync(Guid studyId)
    {
        return await _db.CountyScenarios
            .Where(s => s.StudyId == studyId)
            .OrderByDescending(s => s.CreatedAt)
            .Select(s => MapScenario(s))
            .ToListAsync();
    }

    public async Task<CountyScenarioDto?> GetScenarioAsync(Guid scenarioId)
    {
        var s = await _db.CountyScenarios.FindAsync(scenarioId);
        return s == null ? null : MapScenario(s);
    }

    public async Task<CountyScenarioDto?> SaveScenarioAsync(Guid scenarioId, string userId)
    {
        var s = await _db.CountyScenarios.FindAsync(scenarioId);
        if (s == null) return null;
        s.Status = ScenarioStatus.Saved;
        s.UpdatedAt = DateTime.UtcNow;
        s.UpdatedBy = userId;
        await _db.SaveChangesAsync();
        return MapScenario(s);
    }

    public async Task<ScenarioImpactPreviewDto> PreviewScenarioImpactAsync(Guid scenarioId)
    {
        var scenario = await _db.CountyScenarios
            .Include(s => s.Cohort)
            .FirstOrDefaultAsync(s => s.ScenarioId == scenarioId)
            ?? throw new InvalidOperationException($"Scenario {scenarioId} not found");

        if (scenario.Cohort is null)
            throw new InvalidOperationException($"Cohort for scenario {scenarioId} could not be loaded.");

        var parameters = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(scenario.Parameters)
            ?? new Dictionary<string, JsonElement>();
        var magnitude = parameters.TryGetValue("magnitude", out var mag) && mag.ValueKind == JsonValueKind.Number
            ? mag.GetDecimal()
            : 0m;

        var segmentSetId = await _db.CountyStudySessions
            .Where(s => s.StudyId == scenario.StudyId)
            .Select(s => s.ActiveSegmentSetId)
            .FirstOrDefaultAsync();

        // Resolve cohort's segments. Cohort.Definition JSON carries `segmentIds` for
        // Segment/Hybrid selection types. Fall back to ALL segments in the study's
        // baseline set for cohorts without an explicit segment list (rule/lasso/neighborhood
        // cohorts — projection approximation until per-parcel resolution is wired).
        var targetSegmentIds = ExtractSegmentIds(scenario.Cohort!.Definition);
        List<CountySegment> segments;
        if (targetSegmentIds.Count > 0)
        {
            segments = await _db.CountySegments
                .Where(s => targetSegmentIds.Contains(s.SegmentId))
                .ToListAsync();
        }
        else
        {
            segments = segmentSetId.HasValue
                ? await _db.CountySegments.Where(s => s.SegmentSetId == segmentSetId).ToListAsync()
                : new List<CountySegment>();
        }

        // ── Aggregate before-state ─────────────────────────────────────────
        // Average across segments weighted by parcel count where it matters
        // (exception count is a true sum, not an average).
        var totalParcels = segments.Sum(s => s.ParcelCount);
        var segmentsWithRatios = segments.Where(s => s.MedianRatio.HasValue).ToList();

        var medianRatioBefore = segmentsWithRatios.Count > 0
            ? segmentsWithRatios.Average(s => s.MedianRatio!.Value)
            : 0m;
        var codBefore = segmentsWithRatios.Where(s => s.CoefficientOfDispersion.HasValue)
                                           .DefaultIfEmpty()
                                           .Average(s => s?.CoefficientOfDispersion ?? 0m);
        var prdBefore = segmentsWithRatios.Where(s => s.PriceRelatedDifferential.HasValue)
                                           .DefaultIfEmpty()
                                           .Average(s => s?.PriceRelatedDifferential ?? 1m);
        var excBefore = segments.Sum(s => s.ExceptionCount);

        // ── Apply scenario mathematically ──────────────────────────────────
        // Principle: a uniform-percent adjustment is a scalar multiplication on every
        // ratio. The median shifts by the same factor. COD and PRD are both
        // scale-invariant under uniform multiplication (see IAAO Standard on Ratio
        // Studies §6-§7: COD = mean|r-med|/med × 100, and med scales with r; ratio
        // stays constant. Similarly PRD = arithmeticMean/weightedMean, both of
        // which multiply by the same factor, so the ratio is unchanged).
        //
        // Flat-dollar adjustments DO change COD/PRD because the shift is not
        // proportional to value. That branch carries an ApproximatesFlag and uses
        // a conservative estimate until per-parcel kernel recomputation lands.
        var adj = scenario.AdjustmentType;
        var isPercent = adj == ScenarioAdjustmentType.LandValuePercent
                     || adj == ScenarioAdjustmentType.ImprovementValuePercent
                     || adj == ScenarioAdjustmentType.TotalValuePercent
                     || adj == ScenarioAdjustmentType.NeighborhoodFactor;
        var isFlat    = adj == ScenarioAdjustmentType.LandValueFlat
                     || adj == ScenarioAdjustmentType.ImprovementValueFlat;

        decimal medianRatioAfter, codAfter, prdAfter;
        int excAfter;

        if (isPercent)
        {
            var factor = 1m + magnitude / 100m;
            medianRatioAfter = medianRatioBefore * factor;
            codAfter         = codBefore;   // scale-invariant
            prdAfter         = prdBefore;   // scale-invariant

            // Exception projection: a ratio that was just inside the fence before may
            // cross it under the shift. Approximate via segment-level medians scaled by
            // factor — segments whose projected median falls outside IAAO fences
            // contribute all their parcels as exceptions; inside-fence segments inherit
            // their pre-existing exception count.
            excAfter = 0;
            foreach (var seg in segments)
            {
                if (!seg.MedianRatio.HasValue)
                {
                    excAfter += seg.ExceptionCount;
                    continue;
                }
                var projected = seg.MedianRatio.Value * factor;
                if (projected < 0.70m || projected > 1.30m)
                    excAfter += seg.ParcelCount;  // whole segment fails IAAO fence
                else
                    excAfter += seg.ExceptionCount;
            }
        }
        else if (isFlat)
        {
            // Flat-dollar: dispersion is not scale-invariant — smaller parcels
            // move more in relative terms. Compute exact projected metrics by
            // walking the underlying parcels for the segments in scope.
            //
            // Strategy: for each segment, parse the stored RuleDefinition JSON
            // (neighborhood × buildingType × qualityGrade) to re-resolve the
            // parcel set from canonical Properties + CamaCharacteristics, then
            // join qualified ComparableSales for the two-year window. Shift each
            // parcel's AssessedValue by `magnitude` (signed for Flat vs FlatDown
            // per adjustment type) and recompute median/COD/PRD/exception count
            // from the shifted ratios. Pure C# math against already-computed
            // data — no kernel round-trip needed here (the kernel is for cost
            // computation from first principles, not ratio projection).
            var signedMag = adj == ScenarioAdjustmentType.LandValueFlat
                              || adj == ScenarioAdjustmentType.ImprovementValueFlat
                ? magnitude    // user sent a signed magnitude; negatives decrease
                : magnitude;

            var perParcel = await ResolveCohortParcelsAsync(scenario.CountyId, scenario.StudyId, segments);
            if (perParcel.Count >= MinRatiosForFlat)
            {
                var shiftedRatios = new List<(decimal ratio, decimal price, decimal assessed)>(perParcel.Count);
                foreach (var (assessed, price) in perParcel)
                {
                    if (price <= 0) continue;
                    var shiftedAssessed = Math.Max(0m, assessed + signedMag);
                    shiftedRatios.Add((shiftedAssessed / price, price, shiftedAssessed));
                }

                if (shiftedRatios.Count > 0)
                {
                    var ratios = shiftedRatios.Select(r => r.ratio).OrderBy(r => r).ToList();
                    medianRatioAfter = ratios.Count % 2 == 0
                        ? (ratios[ratios.Count / 2 - 1] + ratios[ratios.Count / 2]) / 2m
                        : ratios[ratios.Count / 2];

                    if (medianRatioAfter > 0m)
                    {
                        var meanAbsDev = ratios.Average(r => Math.Abs(r - medianRatioAfter));
                        codAfter = meanAbsDev / medianRatioAfter * 100m;
                    }
                    else
                    {
                        codAfter = codBefore;
                    }

                    if (shiftedRatios.Count >= 2)
                    {
                        var arithmetic = ratios.Average();
                        var sumAssessed = shiftedRatios.Sum(r => r.assessed);
                        var sumPrice    = shiftedRatios.Sum(r => r.price);
                        if (sumPrice > 0m)
                        {
                            var weightedMean = sumAssessed / sumPrice;
                            prdAfter = weightedMean > 0m ? arithmetic / weightedMean : prdBefore;
                        }
                        else
                        {
                            prdAfter = prdBefore;
                        }
                    }
                    else
                    {
                        prdAfter = prdBefore;
                    }

                    excAfter = ratios.Count(r => r < 0.70m || r > 1.30m);
                }
                else
                {
                    // No parcels had a usable sale price — fall back to unchanged.
                    medianRatioAfter = medianRatioBefore;
                    codAfter         = codBefore;
                    prdAfter         = prdBefore;
                    excAfter         = excBefore;
                }
            }
            else
            {
                // Sample too small for meaningful recomputation — preserve
                // current metrics rather than fabricate a shift.
                medianRatioAfter = medianRatioBefore;
                codAfter         = codBefore;
                prdAfter         = prdBefore;
                excAfter         = excBefore;
            }
        }
        else
        {
            // FeatureUnitRate or unknown — no projection, report unchanged.
            medianRatioAfter = medianRatioBefore;
            codAfter         = codBefore;
            prdAfter         = prdBefore;
            excAfter         = excBefore;
        }

        return new ScenarioImpactPreviewDto(
            scenarioId,
            medianRatioBefore, medianRatioAfter,
            codBefore,         codAfter,
            prdBefore,         prdAfter,
            excBefore,         excAfter,
            scenario.Cohort!.ParcelCount,
            new List<ScenarioDeltaItem>()
        );
    }

    // ── Compare Scenario Impact ───────────────────────────────────────────────

    public async Task<ScenarioCompareDto> CompareScenarioImpactAsync(Guid scenarioIdA, Guid scenarioIdB)
    {
        var scenA = await _db.CountyScenarios.FindAsync(scenarioIdA)
            ?? throw new InvalidOperationException($"Scenario {scenarioIdA} not found");
        var scenB = await _db.CountyScenarios.FindAsync(scenarioIdB)
            ?? throw new InvalidOperationException($"Scenario {scenarioIdB} not found");
        if (scenA.StudyId != scenB.StudyId)
            throw new InvalidOperationException("Cannot compare scenarios from different studies.");

        var previewA = await PreviewScenarioImpactAsync(scenarioIdA);
        var previewB = await PreviewScenarioImpactAsync(scenarioIdB);

        // For MEDIAN RATIO, closer to 1.0 wins. For COD and PRD, lower wins.
        static string WinnerCloserToOne(decimal a, decimal b)
        {
            var dA = Math.Abs(a - 1m);
            var dB = Math.Abs(b - 1m);
            return dA < dB ? "A" : dB < dA ? "B" : "Tie";
        }
        static string WinnerLower(decimal a, decimal b) =>
            a < b ? "A" : b < a ? "B" : "Tie";

        var rows = new List<ScenarioCompareRowDto>
        {
            new("Median Ratio",
                previewA.MedianRatioBefore,
                previewA.MedianRatioAfter,
                previewB.MedianRatioAfter,
                previewA.MedianRatioAfter - previewB.MedianRatioAfter,
                WinnerCloserToOne(previewA.MedianRatioAfter, previewB.MedianRatioAfter)),
            new("COD",
                previewA.CodBefore,
                previewA.CodAfter,
                previewB.CodAfter,
                previewA.CodAfter - previewB.CodAfter,
                WinnerLower(previewA.CodAfter, previewB.CodAfter)),
            new("PRD",
                previewA.PrdBefore,
                previewA.PrdAfter,
                previewB.PrdAfter,
                previewA.PrdAfter - previewB.PrdAfter,
                WinnerCloserToOne(previewA.PrdAfter, previewB.PrdAfter)),
            new("Exceptions",
                previewA.ExceptionsBefore,
                previewA.ExceptionsAfter,
                previewB.ExceptionsAfter,
                previewA.ExceptionsAfter - previewB.ExceptionsAfter,
                WinnerLower(previewA.ExceptionsAfter, previewB.ExceptionsAfter)),
        };

        return new ScenarioCompareDto(MapScenario(scenA), MapScenario(scenB), rows);
    }

    /// <summary>
    /// Minimum sample size before per-parcel flat-dollar recomputation is attempted.
    /// Below this, the preview preserves before-state metrics rather than fabricate
    /// a projection from insufficient data.
    /// </summary>
    private const int MinRatiosForFlat = 5;

    /// <summary>
    /// Resolve the parcel set for a collection of CountySegments by re-running
    /// the derivation grouping key (Neighborhood × BuildingType × QualityGrade)
    /// against canonical Properties + CamaCharacteristics, then joining qualified
    /// ComparableSales for the study's tax-year window to attach a representative
    /// sale price per parcel (averaged if multiple qualifying sales exist).
    ///
    /// Returns tuples of (AssessedValue, SalePrice) for every parcel that has a
    /// qualifying sale — parcels without a sale are omitted (they contribute no
    /// ratio data and therefore don't influence the projection).
    /// </summary>
    private async Task<List<(decimal Assessed, decimal Price)>> ResolveCohortParcelsAsync(
        Guid countyId,
        Guid studyId,
        List<CountySegment> segmentsInCohort)
    {
        if (segmentsInCohort.Count == 0) return new();

        // Parse each segment's RuleDefinition JSON to recover (hood, type, quality).
        var groupKeys = new HashSet<(string Hood, string BldgType, string Quality)>();
        foreach (var seg in segmentsInCohort)
        {
            if (string.IsNullOrWhiteSpace(seg.RuleDefinition)) continue;
            try
            {
                var rule = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(seg.RuleDefinition);
                if (rule == null) continue;
                var hood    = rule.TryGetValue("neighborhood", out var h) && h.ValueKind == JsonValueKind.String ? (h.GetString() ?? "UNKNOWN") : "UNKNOWN";
                var bldg    = rule.TryGetValue("buildingType", out var b) && b.ValueKind == JsonValueKind.String ? (b.GetString() ?? "UNKNOWN") : "UNKNOWN";
                var quality = rule.TryGetValue("qualityGrade", out var q) && q.ValueKind == JsonValueKind.String ? (q.GetString() ?? "UNKNOWN") : "UNKNOWN";
                groupKeys.Add((hood, bldg, quality));
            }
            catch (JsonException) { /* skip malformed — segment will contribute no parcels */ }
        }
        if (groupKeys.Count == 0) return new();

        // Determine the study's tax year once so sales-window math is deterministic.
        var taxYear = await _db.CountyStudySessions
            .Where(s => s.StudyId == studyId)
            .Select(s => s.TaxYear)
            .FirstOrDefaultAsync();
        if (taxYear == 0) return new();

        // Load parcels + CAMA + sales for the county/year — in-memory filter by
        // the reconstructed grouping keys afterwards. Simpler than a generated
        // IN-clause on a 3-tuple composite key.
        var parcelsWithCama = await (
            from p in _db.Properties.AsNoTracking()
            where p.CountyId == countyId && p.TaxYear == taxYear && p.AssessedValue > 0
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
            }).ToListAsync();

        var matched = parcelsWithCama.Where(pc =>
        {
            var key = (
                Hood: string.IsNullOrWhiteSpace(pc.Neighborhood) ? "UNKNOWN" : pc.Neighborhood!,
                BldgType: string.IsNullOrWhiteSpace(pc.BuildingType) ? "UNKNOWN" : pc.BuildingType!,
                Quality: string.IsNullOrWhiteSpace(pc.QualityGrade) ? "UNKNOWN" : pc.QualityGrade!
            );
            return groupKeys.Contains(key);
        }).ToList();

        if (matched.Count == 0) return new();

        var matchedIds = matched.Select(m => m.ParcelId).ToHashSet();

        var lookbackStart = new DateTime(taxYear - 2, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        var lookbackEnd   = new DateTime(taxYear, 12, 31, 23, 59, 59, DateTimeKind.Utc);
        var salesRows = await _db.ComparableSales.AsNoTracking()
            .Where(s => s.CountyId == countyId)
            .Where(s => s.SaleDate >= lookbackStart && s.SaleDate <= lookbackEnd)
            .Where(s => s.SalePrice > 0)
            .Where(s => (s.QualificationDecision ?? s.QualificationRecommendation ?? s.SaleQualification) == "qualified")
            .Where(s => matchedIds.Contains(s.ParcelId))
            .Select(s => new { s.ParcelId, Price = s.AdjustedSalePrice ?? s.SalePrice })
            .ToListAsync();

        var priceByParcel = salesRows
            .GroupBy(s => s.ParcelId)
            .ToDictionary(g => g.Key, g => g.Select(x => x.Price).Average());

        return matched
            .Where(m => priceByParcel.ContainsKey(m.ParcelId))
            .Select(m => (Assessed: m.AssessedValue, Price: priceByParcel[m.ParcelId]))
            .ToList();
    }

    /// <summary>
    /// Extract segmentIds array from a cohort's Definition JSON. Returns empty
    /// list for cohorts that don't carry an explicit segment list (rule/lasso/
    /// neighborhood-geometry selections) — caller falls back to the study's
    /// active segment set in that case.
    /// </summary>
    private static List<Guid> ExtractSegmentIds(string definitionJson)
    {
        try
        {
            var doc = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(definitionJson);
            if (doc == null || !doc.TryGetValue("segmentIds", out var segEl)) return new();
            if (segEl.ValueKind != JsonValueKind.Array) return new();
            var ids = new List<Guid>();
            foreach (var e in segEl.EnumerateArray())
            {
                if (e.ValueKind == JsonValueKind.String && Guid.TryParse(e.GetString(), out var g))
                    ids.Add(g);
            }
            return ids;
        }
        catch (JsonException)
        {
            return new();
        }
    }

    // ── Adjustment Sets ──────────────────────────────────────────────────

    public async Task<CountyAdjustmentSetDto> PromoteScenarioAsync(PromoteScenarioRequest req, string userId)
    {
        var scenario = await _db.CountyScenarios.FindAsync(req.ScenarioId)
            ?? throw new InvalidOperationException($"Scenario {req.ScenarioId} not found");

        // Enforce workflow: only Saved or Reviewed scenarios may be promoted.
        // Draft scenarios must go through SaveScenarioAsync first.
        if (scenario.Status != ScenarioStatus.Saved && scenario.Status != ScenarioStatus.Reviewed)
            throw new InvalidOperationException(
                $"Scenario {req.ScenarioId} cannot be promoted from status '{scenario.Status}'. " +
                "Only Saved or Reviewed scenarios may be promoted.");

        scenario.Status = ScenarioStatus.Promoted;
        scenario.UpdatedAt = DateTime.UtcNow;
        scenario.UpdatedBy = userId;

        var adjSet = new CountyAdjustmentSet
        {
            StudyId = scenario.StudyId,
            ScenarioId = scenario.ScenarioId,
            CountyId = scenario.CountyId,
            EffectiveScope = req.EffectiveScope,
            ApprovalState = AdjustmentSetApprovalState.Proposed,
            RollbackToken = Guid.NewGuid().ToString("N"),
            CreatedBy = userId,
            UpdatedBy = userId
        };
        _db.CountyAdjustmentSets.Add(adjSet);
        await _db.SaveChangesAsync();
        return MapAdjustmentSet(adjSet);
    }

    public async Task<List<CountyAdjustmentSetDto>> GetAdjustmentSetsAsync(Guid studyId)
    {
        return await _db.CountyAdjustmentSets
            .Where(a => a.StudyId == studyId)
            .OrderByDescending(a => a.CreatedAt)
            .Select(a => MapAdjustmentSet(a))
            .ToListAsync();
    }

    public async Task<CountyAdjustmentSetDto> UpdateApprovalStateAsync(
        Guid adjustmentSetId, AdjustmentSetApprovalState newState, string userId,
        string? rollbackReason = null)
    {
        var adj = await _db.CountyAdjustmentSets.FindAsync(adjustmentSetId)
            ?? throw new InvalidOperationException($"AdjustmentSet {adjustmentSetId} not found");

        // Enforce legal transitions
        var legal = (adj.ApprovalState, newState) switch
        {
            (AdjustmentSetApprovalState.Proposed,         AdjustmentSetApprovalState.ReadyForApproval) => true,
            (AdjustmentSetApprovalState.ReadyForApproval, AdjustmentSetApprovalState.Approved)         => true,
            (AdjustmentSetApprovalState.ReadyForApproval, AdjustmentSetApprovalState.Proposed)         => true, // send back
            _ => false,
        };
        if (!legal)
            throw new InvalidOperationException(
                $"Cannot transition AdjustmentSet from {adj.ApprovalState} to {newState}.");

        adj.ApprovalState = newState;
        adj.UpdatedAt     = DateTime.UtcNow;
        adj.UpdatedBy     = userId;

        if (newState == AdjustmentSetApprovalState.Approved)
            adj.ApprovedBy = userId;

        await _db.SaveChangesAsync();
        return MapAdjustmentSet(adj);
    }

    public async Task<List<CountyApplyHandoffReceiptDto>> GetApplyHandoffReceiptsAsync(Guid studyId)
    {
        return await _db.CountyApplyHandoffReceipts
            .AsNoTracking()
            .Where(r => r.StudyId == studyId)
            .OrderByDescending(r => r.UpdatedAt)
            .Select(r => MapApplyHandoffReceipt(r))
            .ToListAsync();
    }

    public async Task<CountyApplyHandoffReceiptDto> UpsertApplyHandoffReceiptAsync(
        Guid adjustmentSetId,
        UpsertAdjustmentApplyReceiptRequest req,
        string userId)
    {
        var adjustment = await _db.CountyAdjustmentSets.FindAsync(adjustmentSetId)
            ?? throw new InvalidOperationException($"AdjustmentSet {adjustmentSetId} not found");

        if (adjustment.ApprovalState != AdjustmentSetApprovalState.Approved
            && adjustment.ApprovalState != AdjustmentSetApprovalState.Published
            && adjustment.ApprovalState != AdjustmentSetApprovalState.RolledBack)
            throw new InvalidOperationException("Apply handoff receipts require an approved adjustment set.");

        var requestedStatus = CountyApplyHandoffReceiptStatus.Prepared;
        if (!string.IsNullOrWhiteSpace(req.Status)
            && !Enum.TryParse<CountyApplyHandoffReceiptStatus>(req.Status, ignoreCase: true, out requestedStatus))
            throw new InvalidOperationException($"Unsupported apply handoff receipt status '{req.Status}'.");

        ValidateApplyReceiptReturn(requestedStatus, req.EvidenceRef, req.Notes);

        var now = DateTime.UtcNow;
        var receipt = await _db.CountyApplyHandoffReceipts
            .FirstOrDefaultAsync(r => r.AdjustmentSetId == adjustmentSetId);

        if (receipt is null)
        {
            receipt = new CountyApplyHandoffReceipt
            {
                AdjustmentSetId = adjustmentSetId,
                StudyId = adjustment.StudyId,
                CountyId = adjustment.CountyId,
                ScenarioId = adjustment.ScenarioId,
                PreparedAt = now,
            };
            _db.CountyApplyHandoffReceipts.Add(receipt);
        }

        var trackedReceipt = receipt!;
        var status = requestedStatus == CountyApplyHandoffReceiptStatus.Prepared
                     || (IsTerminalApplyReceiptStatus(trackedReceipt.Status)
                         && !IsTerminalApplyReceiptStatus(requestedStatus))
            ? trackedReceipt.Status
            : requestedStatus;

        trackedReceipt.Template = string.IsNullOrWhiteSpace(req.Template)
            ? "AdjustmentApplyPacket"
            : req.Template;
        trackedReceipt.Status = status;
        trackedReceipt.EvidenceRef = string.IsNullOrWhiteSpace(req.EvidenceRef)
            ? trackedReceipt.EvidenceRef
            : req.EvidenceRef;
        trackedReceipt.Notes = string.IsNullOrWhiteSpace(req.Notes)
            ? trackedReceipt.Notes
            : req.Notes;
        trackedReceipt.UpdatedAt = now;
        trackedReceipt.UpdatedBy = userId;

        await _db.SaveChangesAsync();
        return MapApplyHandoffReceipt(trackedReceipt);
    }

    public async Task<CountyApplyHandoffReceiptDto> UpdateApplyHandoffReceiptStatusAsync(
        Guid adjustmentSetId,
        CountyApplyHandoffReceiptStatus status,
        string userId,
        string? evidenceRef = null,
        string? notes = null)
    {
        ValidateApplyReceiptReturn(status, evidenceRef, notes);

        var receipt = await _db.CountyApplyHandoffReceipts
            .FirstOrDefaultAsync(r => r.AdjustmentSetId == adjustmentSetId)
            ?? throw new InvalidOperationException($"Apply handoff receipt for AdjustmentSet {adjustmentSetId} not found");

        receipt.Status = status;
        receipt.EvidenceRef = string.IsNullOrWhiteSpace(evidenceRef) ? receipt.EvidenceRef : evidenceRef;
        receipt.Notes = string.IsNullOrWhiteSpace(notes) ? receipt.Notes : notes;
        receipt.UpdatedAt = DateTime.UtcNow;
        receipt.UpdatedBy = userId;
        await _db.SaveChangesAsync();
        return MapApplyHandoffReceipt(receipt);
    }

    // ── Exception Sets ────────────────────────────────────────────────────

    public async Task<CountyExceptionSetDto> CreateExceptionSetAsync(CreateCountyExceptionSetRequest req, string userId)
    {
        var scenario = await _db.CountyScenarios.FindAsync(req.SourceScenarioId)
            ?? throw new InvalidOperationException($"Scenario {req.SourceScenarioId} not found");
        if (scenario.StudyId != req.StudyId)
            throw new InvalidOperationException(
                $"Scenario {req.SourceScenarioId} does not belong to study {req.StudyId}.");
        var exc = new CountyExceptionSet
        {
            StudyId = req.StudyId,
            SourceScenarioId = req.SourceScenarioId,
            CountyId = scenario.CountyId,
            ReasonCode = req.ReasonCode,
            ParcelIdsJson = JsonSerializer.Serialize(req.ParcelIds),
            ParcelCount = req.ParcelIds.Count,
            Destination = req.Destination,
            Status = ExceptionSetStatus.Created,
            CreatedBy = userId,
            UpdatedBy = userId
        };
        _db.CountyExceptionSets.Add(exc);
        await _db.SaveChangesAsync();
        return MapExceptionSet(exc);
    }

    public async Task<List<CountyExceptionSetDto>> GetExceptionSetsAsync(Guid studyId)
    {
        return await _db.CountyExceptionSets
            .Where(e => e.StudyId == studyId)
            .OrderByDescending(e => e.CreatedAt)
            .Select(e => MapExceptionSet(e))
            .ToListAsync();
    }

    // ── Rollups (Task B — County → City → Neighborhood drill lattice) ────

    /// <summary>
    /// Builds the county-level city rollup from the study's active segment set.
    /// For every segment in the set we re-resolve the segment's parcels from
    /// canonical Properties + CamaCharacteristics (same grouping key used by
    /// derivation) so we can map a segment's city via CamaCharacteristic.City
    /// normalized to canonical city names. Medians are parcel-weighted,
    /// so we reconstitute parcel-level ratios using qualified ComparableSales
    /// for the study's tax-year window.
    /// </summary>
    public async Task<List<CityRollupRowDto>> GetCityRollupAsync(Guid studyId)
    {
        var (segments, perParcel) = await LoadRollupInputsAsync(studyId);

        // Group parcel-level ratio rows by city.
        var byCity = perParcel
            .GroupBy(p => p.City)
            .ToDictionary(g => g.Key, g => g.ToList());

        // Also group segments by city so SegmentCount, ExceptionCount,
        // WorstSegment metrics are aligned. A segment's city is the modal
        // (most-frequent) city among its parcels; ties break to the first
        // lexicographic canonical city name.
        var segmentCityMap = BuildSegmentCityMap(segments, perParcel);

        // Union of cities appearing either in ratios or in segment membership.
        var cityKeys = new HashSet<string>(byCity.Keys);
        foreach (var city in segmentCityMap.Values) cityKeys.Add(city);

        var rows = new List<CityRollupRowDto>();
        foreach (var city in cityKeys.OrderBy(c => c))
        {
            byCity.TryGetValue(city, out var parcelRows);
            parcelRows ??= new();

            // Segments assigned to this city via modal-city mapping.
            var segsInCity = segments
                .Where(s => segmentCityMap.TryGetValue(s.SegmentId, out var c) && c == city)
                .ToList();

            int parcelCount = segsInCity.Sum(s => s.ParcelCount);
            int exceptionCount = segsInCity.Sum(s => s.ExceptionCount);
            decimal exceptionRate = parcelCount > 0
                ? Math.Round((decimal)exceptionCount / parcelCount, 4)
                : 0m;

            // Parcel-weighted median: compute from all parcel-level ratios for this city.
            decimal? medianRatio = parcelRows.Count > 0
                ? ComputeMedian(parcelRows.Select(r => r.Ratio).ToList())
                : null;
            decimal? cod = parcelRows.Count >= 5 && medianRatio.HasValue && medianRatio.Value > 0
                ? ComputeCod(parcelRows.Select(r => r.Ratio).ToList(), medianRatio.Value)
                : null;
            decimal? prd = ComputePrd(parcelRows);

            // Worst segment: largest |MedianRatio - 1.0| (skip segments without a median).
            var worstSeg = segsInCity
                .Where(s => s.MedianRatio.HasValue)
                .OrderByDescending(s => Math.Abs(s.MedianRatio!.Value - 1.0m))
                .FirstOrDefault();
            var worstSegMetadata = worstSeg is null
                ? null
                : CountySegmentMetadataSupport.Parse(worstSeg.RuleDefinition, worstSeg.GeographyRef);

            var compliance = ClassifyCompliance(medianRatio, cod, prd);

            rows.Add(new CityRollupRowDto(
                City: city,
                SegmentCount: segsInCity.Count,
                ParcelCount: parcelCount,
                MedianRatio: medianRatio.HasValue ? Math.Round(medianRatio.Value, 4) : null,
                Cod: cod.HasValue ? Math.Round(cod.Value, 2) : null,
                Prd: prd.HasValue ? Math.Round(prd.Value, 4) : null,
                ExceptionCount: exceptionCount,
                ExceptionRate: exceptionRate,
                WorstSegmentName: worstSeg?.Name,
                WorstSegmentMedianRatio: worstSeg?.MedianRatio,
                WorstSegmentNeighborhoodCode: worstSegMetadata?.NeighborhoodCode,
                WorstSegmentRevalArea: worstSegMetadata?.RevalArea,
                WorstSegmentBuildingType: worstSegMetadata?.BuildingType,
                WorstSegmentQualityGrade: worstSegMetadata?.QualityGrade,
                ComplianceStatus: compliance.ToString()));
        }

        return rows;
    }

    public async Task<List<NeighborhoodRollupRowDto>> GetNeighborhoodRollupAsync(Guid studyId, string? cityFilter)
    {
        var (segments, perParcel) = await LoadRollupInputsAsync(studyId);
        var segmentCityMap = BuildSegmentCityMap(segments, perParcel);

        if (!string.IsNullOrWhiteSpace(cityFilter))
        {
            segments = segments
                .Where(s => segmentCityMap.TryGetValue(s.SegmentId, out var c) && string.Equals(c, cityFilter, StringComparison.OrdinalIgnoreCase))
                .ToList();
            perParcel = perParcel
                .Where(p => string.Equals(p.City, cityFilter, StringComparison.OrdinalIgnoreCase))
                .ToList();
        }

        // Group segments by neighborhood + reval area so Benton hood/cycle
        // combinations stay distinct through the rollup.
        var rows = new List<NeighborhoodRollupRowDto>();
        var byNeighborhood = segments
            .GroupBy(s =>
            {
                var metadata = CountySegmentMetadataSupport.Parse(s.RuleDefinition, s.GeographyRef);
                return (NeighborhoodCode: metadata.NeighborhoodCode, RevalArea: metadata.RevalArea);
            })
            .OrderBy(g => g.Key.NeighborhoodCode)
            .ThenBy(g => g.Key.RevalArea ?? int.MaxValue);

        foreach (var group in byNeighborhood)
        {
            var segsInHood = group.ToList();
            var hoodCode = group.Key.NeighborhoodCode;
            var revalArea = group.Key.RevalArea;

            // Neighborhood's city = modal city among its segments.
            var hoodCity = segsInHood
                .Select(s => segmentCityMap.TryGetValue(s.SegmentId, out var c) ? c : "Unincorporated")
                .GroupBy(c => c)
                .OrderByDescending(g => g.Count())
                .ThenBy(g => g.Key)
                .First().Key;

            var parcelRows = perParcel
                .Where(p => p.NeighborhoodCode == hoodCode && p.RevalArea == revalArea)
                .ToList();

            int parcelCount = segsInHood.Sum(s => s.ParcelCount);
            int exceptionCount = segsInHood.Sum(s => s.ExceptionCount);
            decimal exceptionRate = parcelCount > 0
                ? Math.Round((decimal)exceptionCount / parcelCount, 4)
                : 0m;

            decimal? medianRatio = parcelRows.Count > 0
                ? ComputeMedian(parcelRows.Select(r => r.Ratio).ToList())
                : null;
            decimal? cod = parcelRows.Count >= 5 && medianRatio.HasValue && medianRatio.Value > 0
                ? ComputeCod(parcelRows.Select(r => r.Ratio).ToList(), medianRatio.Value)
                : null;
            decimal? prd = ComputePrd(parcelRows);

            // Parcel-weighted averages for stability + risk.
            decimal totalWeight = segsInHood.Sum(s => (decimal)s.ParcelCount);
            decimal stability = totalWeight > 0
                ? Math.Round(segsInHood.Sum(s => s.StabilityScore * s.ParcelCount) / totalWeight, 2)
                : 0m;
            decimal risk = totalWeight > 0
                ? Math.Round(segsInHood.Sum(s => s.RiskScore * s.ParcelCount) / totalWeight, 2)
                : 0m;

            var compliance = ClassifyCompliance(medianRatio, cod, prd);

            rows.Add(new NeighborhoodRollupRowDto(
                NeighborhoodCode: hoodCode,
                NeighborhoodName: hoodCode,      // no human name dictionary available yet
                City: hoodCity,
                RevalArea: revalArea,
                SegmentCount: segsInHood.Count,
                ParcelCount: parcelCount,
                MedianRatio: medianRatio.HasValue ? Math.Round(medianRatio.Value, 4) : null,
                Cod: cod.HasValue ? Math.Round(cod.Value, 2) : null,
                Prd: prd.HasValue ? Math.Round(prd.Value, 4) : null,
                StabilityScore: stability,
                RiskScore: risk,
                ExceptionCount: exceptionCount,
                ExceptionRate: exceptionRate,
                ComplianceStatus: compliance.ToString()));
        }

        return rows;
    }

    // ── Rollup helpers ────────────────────────────────────────────────────

    /// <summary>
    /// Per-parcel rollup input row. Computed once and reused by both rollups
    /// so the two endpoints are consistent and the expensive PACS → canonical
    /// join only runs once per call.
    /// </summary>
    private record RollupParcelRow(
        string ParcelId,
        string NeighborhoodCode,
        int? RevalArea,
        string BuildingType,
        string QualityGrade,
        decimal AssessedValue,
        decimal SalePrice,
        decimal Ratio,
        string City);

    /// <summary>
    /// Loads the segments in the study's active segment set and computes a
    /// parcel-level ratio + city map by re-resolving the derivation grouping
    /// key against canonical Properties + CamaCharacteristics + qualified
    /// ComparableSales. Throws InvalidOperationException when the study has
    /// no active segment set (caller maps to 409).
    /// </summary>
    private async Task<(List<CountySegment> segments, List<RollupParcelRow> perParcel)>
        LoadRollupInputsAsync(Guid studyId)
    {
        var study = await _db.CountyStudySessions.FindAsync(studyId)
            ?? throw new InvalidOperationException($"Study {studyId} not found");
        if (study.ActiveSegmentSetId is null)
            throw new InvalidOperationException(
                $"Study {studyId} has no active segment set. Derive segments first via LeftRail → Derive Segment Metrics.");

        var setId = study.ActiveSegmentSetId.Value;
        var segments = await _db.CountySegments
            .Where(s => s.SegmentSetId == setId)
            .ToListAsync();

        var groupKeys = new HashSet<(string Hood, int? RevalArea, string BldgType, string Quality)>();
        foreach (var seg in segments)
        {
            var metadata = CountySegmentMetadataSupport.Parse(seg.RuleDefinition, seg.GeographyRef);
            groupKeys.Add((metadata.NeighborhoodCode, metadata.RevalArea, metadata.BuildingType, metadata.QualityGrade));
        }

        if (groupKeys.Count == 0)
            return (segments, new List<RollupParcelRow>());

        var countyId = study.CountyId;
        var taxYear  = study.TaxYear;

        // Parcels + CAMA — matches derivation service's left-join shape.
        var parcels = await (
            from p in _db.Properties.AsNoTracking()
            where p.CountyId == countyId && p.TaxYear == taxYear
            join c in _db.CamaCharacteristics.AsNoTracking()
                on new { p.ParcelId, p.TaxYear } equals new { c.ParcelId, c.TaxYear } into cj
            from c in cj.DefaultIfEmpty()
            select new
            {
                p.PropertyId,
                p.ParcelId,
                p.AssessedValue,
                Neighborhood = p.Neighborhood,
                BuildingType = c != null ? c.BuildingType : null,
                QualityGrade = c != null ? c.QualityGrade : null,
                City         = c != null ? c.City : null,
                SitusCity    = p.SitusCity,
            }).ToListAsync();

        var pacsPropIds = parcels
            .Select(p => int.TryParse(p.PropertyId, out var pacsPropId) ? pacsPropId : (int?)null)
            .Where(pacsPropId => pacsPropId.HasValue)
            .Select(pacsPropId => pacsPropId!.Value)
            .Distinct()
            .ToList();

        Dictionary<int, (string? NeighborhoodCode, int? Cycle)> pacsMetadataByPropId = pacsPropIds.Count == 0
            ? new Dictionary<int, (string? NeighborhoodCode, int? Cycle)>()
            : await _db.Set<PacsValuation>()
                .AsNoTracking()
                .Where(v => v.SupNum == 0 && v.PropValYear == taxYear && pacsPropIds.Contains(v.PacsPropId))
                .Select(v => new
                {
                    v.PacsPropId,
                    v.NeighborhoodCode,
                    v.Cycle,
                })
                .ToDictionaryAsync(
                    v => v.PacsPropId,
                    v => (v.NeighborhoodCode, CountySegmentMetadataSupport.NormalizeRevalArea(v.Cycle)));

        // Filter to parcels in scope for the segment set's grouping keys.
        var inScope = new List<(string ParcelId, string Hood, int? RevalArea, string BldgType, string Quality, decimal Assessed, string City)>();
        foreach (var pc in parcels)
        {
            var pacsPropId = int.TryParse(pc.PropertyId, out var parsedPropId) ? parsedPropId : (int?)null;
            var pacsMetadata = pacsPropId.HasValue && pacsMetadataByPropId.TryGetValue(pacsPropId.Value, out var metadata)
                ? metadata
                : (NeighborhoodCode: (string?)null, Cycle: (int?)null);
            var hood = !string.IsNullOrWhiteSpace(pacsMetadata.NeighborhoodCode)
                ? pacsMetadata.NeighborhoodCode!
                : !string.IsNullOrWhiteSpace(pc.Neighborhood)
                    ? pc.Neighborhood!
                    : "UNKNOWN";
            var key = (
                Hood: hood,
                RevalArea: (int?)pacsMetadata.Cycle,
                BldgType: string.IsNullOrWhiteSpace(pc.BuildingType) ? "UNKNOWN" : pc.BuildingType!,
                Quality: string.IsNullOrWhiteSpace(pc.QualityGrade) ? "UNKNOWN" : pc.QualityGrade!
            );
            if (!groupKeys.Contains(key)) continue;

            // Prefer CAMA-canonicalized City if present; fall back to Property.SitusCity.
            var cityRaw = !string.IsNullOrWhiteSpace(pc.City) ? pc.City : pc.SitusCity;
            var city = NormalizeCity(cityRaw);

            inScope.Add((ParcelId: pc.ParcelId, Hood: key.Hood, RevalArea: key.RevalArea, BldgType: key.BldgType, Quality: key.Quality, Assessed: pc.AssessedValue, City: city));
        }

        if (inScope.Count == 0)
            return (segments, new List<RollupParcelRow>());

        // Qualified sales for the tax-year window — same rule as derivation service.
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
            .ToListAsync();

        var priceByParcel = salesRows
            .GroupBy(s => s.ParcelId)
            .ToDictionary(g => g.Key, g => g.Select(x => x.Price).Average());

        var perParcel = new List<RollupParcelRow>();
        foreach (var p in inScope)
        {
            if (!priceByParcel.TryGetValue(p.ParcelId, out var price) || price <= 0) continue;
            if (p.Assessed <= 0) continue;

            perParcel.Add(new RollupParcelRow(
                ParcelId: p.ParcelId,
                NeighborhoodCode: p.Hood,
                RevalArea: p.RevalArea,
                BuildingType: p.BldgType,
                QualityGrade: p.Quality,
                AssessedValue: p.Assessed,
                SalePrice: price,
                Ratio: p.Assessed / price,
                City: p.City));
        }

        return (segments, perParcel);
    }

    /// <summary>
    /// Build a SegmentId → City mapping using the modal city among each
    /// segment's in-scope parcels. Segments without parcels (no ratio data)
    /// are assigned "Unincorporated" so they still surface in rollups.
    /// </summary>
    private static Dictionary<Guid, string> BuildSegmentCityMap(
        List<CountySegment> segments,
        List<RollupParcelRow> perParcel)
    {
        // Derive each segment's grouping key once from canonical metadata.
        var keyBySegment = new Dictionary<Guid, (string Hood, int? RevalArea, string BldgType, string Quality)>();
        foreach (var seg in segments)
        {
            var metadata = CountySegmentMetadataSupport.Parse(seg.RuleDefinition, seg.GeographyRef);
            keyBySegment[seg.SegmentId] = (metadata.NeighborhoodCode, metadata.RevalArea, metadata.BuildingType, metadata.QualityGrade);
        }

        var parcelsByKey = perParcel
            .GroupBy(p => (p.NeighborhoodCode, p.RevalArea, p.BuildingType, p.QualityGrade))
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
            // Modal city; lexicographic tiebreak keeps the choice deterministic.
            var modalCity = parcels
                .GroupBy(p => p.City)
                .OrderByDescending(g => g.Count())
                .ThenBy(g => g.Key)
                .First().Key;
            map[seg.SegmentId] = modalCity;
        }
        return map;
    }

    private static decimal ComputeMedian(IList<decimal> values)
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
    /// IAAO compliance thresholds per task spec:
    ///   median 0.90–1.10, COD ≤ 20, PRD 0.98–1.03.
    /// Rules:
    ///   - IaaoCompliant    → all three pass (a null metric counts as a pass only
    ///     when there are no parcels at all; otherwise it counts as non-compliant
    ///     because we cannot affirmatively say the rollup is compliant).
    ///   - NonCompliant     → any metric present AND failing.
    ///   - MarginalCompliance → metrics present and close to the edges but none
    ///     hard-fail (e.g. median in [0.90,0.92] ∪ [1.08,1.10] or COD in (15,20]
    ///     or PRD in [0.98,0.99] ∪ [1.02,1.03]).
    /// </summary>
    private static RollupComplianceStatus ClassifyCompliance(decimal? median, decimal? cod, decimal? prd)
    {
        // No metrics at all → not enough data to say anything.
        if (!median.HasValue && !cod.HasValue && !prd.HasValue)
            return RollupComplianceStatus.NonCompliant;

        bool medianHardFail = median.HasValue && (median.Value < 0.90m || median.Value > 1.10m);
        bool codHardFail    = cod.HasValue    &&  cod.Value   > 20m;
        bool prdHardFail    = prd.HasValue    && (prd.Value   < 0.98m || prd.Value   > 1.03m);
        if (medianHardFail || codHardFail || prdHardFail)
            return RollupComplianceStatus.NonCompliant;

        bool medianSoft = median.HasValue && (median.Value < 0.92m || median.Value > 1.08m);
        bool codSoft    = cod.HasValue    &&  cod.Value   > 15m;
        bool prdSoft    = prd.HasValue    && (prd.Value   < 0.99m || prd.Value   > 1.02m);
        if (medianSoft || codSoft || prdSoft)
            return RollupComplianceStatus.MarginalCompliance;

        return RollupComplianceStatus.IaaoCompliant;
    }

    /// <summary>
    /// Canonical city normalization. Mirrors PacsCanonicalizer.NormalizeCity
    /// (kept local to Core so the rollup service doesn't depend on the API project).
    /// Non-listed inputs fall back to "Unincorporated".
    /// </summary>
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

    // ── Mappers ──────────────────────────────────────────────────────────

    private static CountyStudySessionDto MapStudy(CountyStudySession s) =>
        new(s.StudyId, s.CountyId, s.CountyName, s.TaxYear, s.StudyType.ToString(),
            s.Status.ToString(), s.BaselineVersion, s.ActiveSegmentSetId,
            s.CreatedAt, s.CreatedBy);

    private static CountySegmentSetDto MapSegmentSet(CountySegmentSet ss, int segmentCount) =>
        new(ss.SegmentSetId, ss.StudyId, ss.Name, ss.SourceType.ToString(),
            ss.Version, ss.IsBaseline, segmentCount);

    private static CountySegmentDto MapSegment(CountySegment s, SegmentListDepthMetrics? metrics = null)
    {
        var metadata = CountySegmentMetadataSupport.Parse(s.RuleDefinition, s.GeographyRef);
        return new CountySegmentDto(
            s.SegmentId,
            s.SegmentSetId,
            s.Name,
            s.SegmentType.ToString(),
            s.GeographyRef,
            metadata.RevalArea,
            metadata.BuildingType,
            metadata.QualityGrade,
            s.ParcelCount,
            s.MedianRatio,
            s.CoefficientOfDispersion,
            s.PriceRelatedDifferential,
            s.StabilityScore,
            s.RiskScore,
            s.ExceptionCount,
            metrics?.RatioCount,
            metrics?.RatioCount,
            metrics?.Prb.HasValue == true ? Math.Round(metrics.Prb.Value, 4) : null,
            metrics?.WeightedMeanRatio.HasValue == true ? Math.Round(metrics.WeightedMeanRatio.Value, 4) : null,
            metrics?.YoyMedianRatioDelta.HasValue == true ? Math.Round(metrics.YoyMedianRatioDelta.Value, 4) : null);
    }

    private async Task<Dictionary<SegmentMetricKey, SegmentListDepthMetrics>> BuildSegmentListDepthMetricsAsync(
        CountyStudySession study,
        IReadOnlyList<CountySegment> segments)
    {
        if (segments.Count == 0)
            return new Dictionary<SegmentMetricKey, SegmentListDepthMetrics>();

        var currentMetrics = await BuildCurrentYearMetricMapAsync(study);
        var priorMedianByKey = await BuildPriorYearMedianMapAsync(study);

        return segments
            .Select(segment =>
            {
                var key = SegmentMetricKey.FromSegment(segment);
                currentMetrics.TryGetValue(key, out var metrics);
                priorMedianByKey.TryGetValue(key, out var priorMedian);
                var yoy = segment.MedianRatio.HasValue && priorMedian.HasValue
                    ? segment.MedianRatio.Value - priorMedian.Value
                    : (decimal?)null;
                return (key, value: new SegmentListDepthMetrics(
                    RatioCount: metrics?.RatioCount,
                    Prb: metrics?.Prb,
                    WeightedMeanRatio: metrics?.WeightedMeanRatio,
                    YoyMedianRatioDelta: yoy));
            })
            .ToDictionary(x => x.key, x => x.value);
    }

    private async Task<Dictionary<SegmentMetricKey, CurrentSegmentMetric>> BuildCurrentYearMetricMapAsync(
        CountyStudySession study)
    {
        var taxYear = study.TaxYear;
        var countyId = study.CountyId;

        var canonicalParcels = await (
            from p in _db.Properties.AsNoTracking()
            where p.CountyId == countyId && p.TaxYear == taxYear
            join c in _db.CamaCharacteristics.AsNoTracking()
                on new { p.ParcelId, p.TaxYear } equals new { c.ParcelId, c.TaxYear } into cj
            from c in cj.DefaultIfEmpty()
            select new
            {
                p.PropertyId,
                p.ParcelId,
                p.AssessedValue,
                Neighborhood = p.Neighborhood,
                BuildingType = c != null ? c.BuildingType : null,
                QualityGrade = c != null ? c.QualityGrade : null,
            }).ToListAsync();

        var pacsPropIds = canonicalParcels
            .Select(p => int.TryParse(p.PropertyId, out var pacsPropId) ? pacsPropId : (int?)null)
            .Where(pacsPropId => pacsPropId.HasValue)
            .Select(pacsPropId => pacsPropId!.Value)
            .Distinct()
            .ToList();

        var pacsMetadataByPropId = pacsPropIds.Count == 0
            ? new Dictionary<int, (string? NeighborhoodCode, int? Cycle)>()
            : await _db.Set<PacsValuation>()
                .AsNoTracking()
                .Where(v => v.SupNum == 0 && v.PropValYear == taxYear && pacsPropIds.Contains(v.PacsPropId))
                .Select(v => new
                {
                    v.PacsPropId,
                    v.NeighborhoodCode,
                    v.Cycle,
                })
                .ToDictionaryAsync(
                    v => v.PacsPropId,
                    v => (v.NeighborhoodCode, v.Cycle));

        var parcelRows = canonicalParcels
            .Select(p =>
            {
                var pacsPropId = int.TryParse(p.PropertyId, out var parsed) ? parsed : (int?)null;
                var pacsMetadata = pacsPropId.HasValue && pacsMetadataByPropId.TryGetValue(pacsPropId.Value, out var metadata)
                    ? metadata
                    : default;
                return new
                {
                    p.ParcelId,
                    p.AssessedValue,
                    Key = new SegmentMetricKey(
                        CountySegmentMetadataSupport.NormalizeToken(!string.IsNullOrWhiteSpace(pacsMetadata.NeighborhoodCode)
                            ? pacsMetadata.NeighborhoodCode
                            : p.Neighborhood),
                        CountySegmentMetadataSupport.NormalizeRevalArea(pacsMetadata.Cycle),
                        CountySegmentMetadataSupport.NormalizeToken(p.BuildingType),
                        CountySegmentMetadataSupport.NormalizeToken(p.QualityGrade)),
                };
            })
            .ToList();

        var lookbackStart = new DateTime(taxYear - 2, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        var lookbackEnd = new DateTime(taxYear, 12, 31, 23, 59, 59, DateTimeKind.Utc);

        var salesByParcel = await _db.ComparableSales.AsNoTracking()
            .Where(s => s.CountyId == countyId)
            .Where(s => s.SaleDate >= lookbackStart && s.SaleDate <= lookbackEnd)
            .Where(s => s.SalePrice > 0)
            .Where(s => (s.QualificationDecision ?? s.QualificationRecommendation ?? s.SaleQualification) == "qualified")
            .Select(s => new { s.ParcelId, Price = s.AdjustedSalePrice ?? s.SalePrice, s.SaleDate })
            .ToListAsync();

        var latestPriceByParcel = salesByParcel
            .GroupBy(s => s.ParcelId)
            .ToDictionary(g => g.Key, g => g.OrderByDescending(x => x.SaleDate).First());

        var metrics = new Dictionary<SegmentMetricKey, CurrentSegmentMetric>();
        foreach (var group in parcelRows.GroupBy(p => p.Key))
        {
            var ratios = group
                .Where(p => p.AssessedValue > 0
                    && latestPriceByParcel.TryGetValue(p.ParcelId, out var sale)
                    && sale.Price > 0)
                .Select(p =>
                {
                    var sale = latestPriceByParcel[p.ParcelId];
                    return new SaleRatio(
                        ParcelId: p.ParcelId,
                        AssessedValue: p.AssessedValue,
                        AdjustedSalePrice: sale.Price,
                        Ratio: p.AssessedValue / sale.Price,
                        SaleDate: sale.SaleDate,
                        YearBuilt: null,
                        NeighborhoodCode: group.Key.Neighborhood,
                        City: null,
                        PropertyUseStratum: group.Key.BuildingType,
                        ConditionGrade: null,
                        QualityGrade: group.Key.QualityGrade);
                })
                .ToList();

            if (ratios.Count == 0)
            {
                metrics[group.Key] = new CurrentSegmentMetric(0, null, null);
                continue;
            }

            var median = BentonEquityMath.Median(ratios.Select(r => r.Ratio).ToList());
            var sumSale = ratios.Sum(r => r.AdjustedSalePrice);
            var weightedMeanRatio = sumSale > 0
                ? ratios.Sum(r => r.AssessedValue) / sumSale
                : (decimal?)null;
            var prb = BentonEquityMath.ComputePrb(ratios, median);

            metrics[group.Key] = new CurrentSegmentMetric(
                RatioCount: ratios.Count,
                Prb: prb,
                WeightedMeanRatio: weightedMeanRatio);
        }

        return metrics;
    }

    private async Task<Dictionary<SegmentMetricKey, decimal?>> BuildPriorYearMedianMapAsync(CountyStudySession study)
    {
        var priorStudy = await _db.CountyStudySessions
            .AsNoTracking()
            .Where(s => s.CountyId == study.CountyId)
            .Where(s => s.TaxYear < study.TaxYear)
            .Where(s => s.ActiveSegmentSetId != null)
            .OrderByDescending(s => s.TaxYear)
            .Select(s => new { s.TaxYear, s.ActiveSegmentSetId })
            .FirstOrDefaultAsync();

        if (priorStudy?.ActiveSegmentSetId is null)
            return new Dictionary<SegmentMetricKey, decimal?>();

        var priorSegments = await _db.CountySegments
            .AsNoTracking()
            .Where(s => s.SegmentSetId == priorStudy.ActiveSegmentSetId.Value)
            .ToListAsync();

        return priorSegments
            .GroupBy(SegmentMetricKey.FromSegment)
            .ToDictionary(
                g => g.Key,
                g => g.OrderByDescending(s => s.ParcelCount).First().MedianRatio);
    }

    private sealed record CurrentSegmentMetric(
        int RatioCount,
        decimal? Prb,
        decimal? WeightedMeanRatio);

    private sealed record SegmentListDepthMetrics(
        int? RatioCount,
        decimal? Prb,
        decimal? WeightedMeanRatio,
        decimal? YoyMedianRatioDelta);

    private sealed record SegmentMetricKey(
        string Neighborhood,
        int? RevalArea,
        string BuildingType,
        string QualityGrade)
    {
        public static SegmentMetricKey FromSegment(CountySegment segment)
        {
            var metadata = CountySegmentMetadataSupport.Parse(segment.RuleDefinition, segment.GeographyRef);
            return new SegmentMetricKey(
                CountySegmentMetadataSupport.NormalizeToken(metadata.NeighborhoodCode ?? segment.GeographyRef),
                metadata.RevalArea,
                CountySegmentMetadataSupport.NormalizeToken(metadata.BuildingType),
                CountySegmentMetadataSupport.NormalizeToken(metadata.QualityGrade));
        }
    }

    private static CountyCohortDto MapCohort(CountyCohort c) =>
        new(c.CohortId, c.StudyId, c.Name, c.SelectionType.ToString(),
            c.Definition, c.ParcelCount, c.IsHybrid, c.CreatedAt);

    private static CountyScenarioDto MapScenario(CountyScenario s) =>
        new(s.ScenarioId, s.StudyId, s.CohortId, s.AdjustmentType.ToString(),
            s.Parameters, s.Rationale, s.Status.ToString(), s.ImpactPreviewJson,
            s.CreatedAt, s.CreatedBy);

    private static CountyAdjustmentSetDto MapAdjustmentSet(CountyAdjustmentSet a) =>
        new(a.AdjustmentSetId, a.StudyId, a.ScenarioId, a.EffectiveScope,
            a.ApprovalState.ToString(), a.ApprovedBy, a.PublishedAt, a.RollbackReason);

    private static bool IsTerminalApplyReceiptStatus(CountyApplyHandoffReceiptStatus status) =>
        status is CountyApplyHandoffReceiptStatus.AppliedExternally
            or CountyApplyHandoffReceiptStatus.RolledBack;

    private static void ValidateApplyReceiptReturn(
        CountyApplyHandoffReceiptStatus status,
        string? evidenceRef,
        string? notes)
    {
        if (status == CountyApplyHandoffReceiptStatus.AppliedExternally
            && string.IsNullOrWhiteSpace(evidenceRef))
            throw new InvalidOperationException("AppliedExternally apply handoff receipts require an evidenceRef.");

        if (status == CountyApplyHandoffReceiptStatus.RolledBack
            && string.IsNullOrWhiteSpace(notes))
            throw new InvalidOperationException("RolledBack apply handoff receipts require notes.");
    }

    private static CountyApplyHandoffReceiptDto MapApplyHandoffReceipt(CountyApplyHandoffReceipt r) =>
        new(r.ReceiptId, r.AdjustmentSetId, r.StudyId, r.CountyId, r.ScenarioId,
            r.Template, r.Status.ToString(), r.PreparedAt, r.UpdatedAt,
            r.EvidenceRef, r.Notes, r.UpdatedBy);

    public async Task<CountyExceptionSetDto> UpdateExceptionStatusAsync(
        Guid exceptionSetId, ExceptionSetStatus newStatus, string userId)
    {
        var exc = await _db.CountyExceptionSets.FindAsync(exceptionSetId)
            ?? throw new InvalidOperationException($"ExceptionSet {exceptionSetId} not found");
        exc.Status = newStatus;
        exc.UpdatedBy = userId;
        exc.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return MapExceptionSet(exc);
    }

    public async Task<CountyExceptionSetDto> AssignExceptionSetAsync(
        Guid exceptionSetId, string assignTo, string userId)
    {
        var exc = await _db.CountyExceptionSets.FindAsync(exceptionSetId)
            ?? throw new InvalidOperationException($"ExceptionSet {exceptionSetId} not found");
        exc.AssignedTo = assignTo;
        exc.UpdatedBy = userId;
        exc.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return MapExceptionSet(exc);
    }

    public async Task<CountyExceptionSetDto> AddExceptionNoteAsync(
        Guid exceptionSetId, string noteText, string userId)
    {
        var exc = await _db.CountyExceptionSets.FindAsync(exceptionSetId)
            ?? throw new InvalidOperationException($"ExceptionSet {exceptionSetId} not found");
        var timestamp = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm");
        var entry = $"[{timestamp} {userId}] {noteText}";
        exc.Notes = string.IsNullOrEmpty(exc.Notes) ? entry : $"{exc.Notes}\n{entry}";
        exc.UpdatedBy = userId;
        exc.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return MapExceptionSet(exc);
    }

    public async Task<List<CountyDownstreamClosureReceiptDto>> GetDownstreamClosureReceiptsAsync(Guid studyId)
    {
        return await _db.CountyDownstreamClosureReceipts
            .AsNoTracking()
            .Where(r => r.StudyId == studyId)
            .OrderByDescending(r => r.UpdatedAt)
            .Select(r => MapDownstreamReceipt(r))
            .ToListAsync();
    }

    public async Task<CountyDownstreamClosureReceiptDto> UpsertDownstreamClosureReceiptAsync(
        Guid exceptionSetId,
        UpsertDownstreamClosureReceiptRequest req,
        string userId)
    {
        var exc = await _db.CountyExceptionSets.FindAsync(exceptionSetId)
            ?? throw new InvalidOperationException($"ExceptionSet {exceptionSetId} not found");

        if (exc.Destination == ExceptionDestination.Internal)
            throw new InvalidOperationException("Internal exception sets do not have downstream closure receipts.");

        if (!Enum.TryParse<ExceptionDestination>(req.Destination, ignoreCase: true, out var destination)
            || destination == ExceptionDestination.Internal)
            throw new InvalidOperationException($"Unsupported downstream destination '{req.Destination}'.");

        if (destination != exc.Destination)
            throw new InvalidOperationException(
                $"Receipt destination '{destination}' does not match exception destination '{exc.Destination}'.");

        var requestedStatus = DownstreamClosureReceiptStatus.Drafted;
        if (!string.IsNullOrWhiteSpace(req.Status)
            && !Enum.TryParse<DownstreamClosureReceiptStatus>(req.Status, ignoreCase: true, out requestedStatus))
            throw new InvalidOperationException($"Unsupported downstream receipt status '{req.Status}'.");

        var now = DateTime.UtcNow;
        var receipt = await _db.CountyDownstreamClosureReceipts
            .FirstOrDefaultAsync(r => r.ExceptionSetId == exceptionSetId);

        if (receipt is null)
        {
            receipt = new CountyDownstreamClosureReceipt
            {
                ExceptionSetId = exceptionSetId,
                StudyId = exc.StudyId,
                CountyId = exc.CountyId,
                SourceType = DownstreamClosureReceiptSource.ExceptionQueue,
                DraftedAt = now,
            };
            _db.CountyDownstreamClosureReceipts.Add(receipt);
        }

        var trackedReceipt = receipt!;
        var status = requestedStatus == DownstreamClosureReceiptStatus.Drafted
            ? trackedReceipt.Status
            : requestedStatus;

        trackedReceipt.Destination = destination;
        trackedReceipt.Template = req.Template;
        trackedReceipt.SegmentId = req.SegmentId;
        trackedReceipt.SegmentLabel = string.IsNullOrWhiteSpace(req.SegmentLabel) ? req.SegmentId : req.SegmentLabel;
        trackedReceipt.Status = status;
        trackedReceipt.DownstreamEntityId = string.IsNullOrWhiteSpace(req.DownstreamEntityId)
            ? trackedReceipt.DownstreamEntityId
            : req.DownstreamEntityId;
        trackedReceipt.EvidenceRef = string.IsNullOrWhiteSpace(req.EvidenceRef)
            ? trackedReceipt.EvidenceRef
            : req.EvidenceRef;
        trackedReceipt.Notes = string.IsNullOrWhiteSpace(req.Notes)
            ? trackedReceipt.Notes
            : req.Notes;
        trackedReceipt.UpdatedAt = now;
        trackedReceipt.UpdatedBy = userId;

        await _db.SaveChangesAsync();
        return MapDownstreamReceipt(trackedReceipt);
    }

    public async Task<CountyDownstreamClosureReceiptDto> UpsertSegmentInspectorHandoffReceiptAsync(
        Guid segmentId,
        UpsertSegmentInspectorHandoffReceiptRequest req,
        string userId)
    {
        var segment = await _db.CountySegments.FindAsync(segmentId)
            ?? throw new InvalidOperationException($"Segment {segmentId} not found");

        var segmentSet = await _db.CountySegmentSets.FindAsync(segment.SegmentSetId)
            ?? throw new InvalidOperationException($"SegmentSet {segment.SegmentSetId} missing for segment {segmentId}");

        if (segmentSet.StudyId != req.StudyId)
            throw new InvalidOperationException($"Segment {segmentId} does not belong to study {req.StudyId}.");

        if (!Enum.TryParse<ExceptionDestination>(req.Destination, ignoreCase: true, out var destination)
            || destination == ExceptionDestination.Internal)
            throw new InvalidOperationException($"Unsupported downstream destination '{req.Destination}'.");

        var requestedStatus = DownstreamClosureReceiptStatus.Drafted;
        if (!string.IsNullOrWhiteSpace(req.Status)
            && !Enum.TryParse<DownstreamClosureReceiptStatus>(req.Status, ignoreCase: true, out requestedStatus))
            throw new InvalidOperationException($"Unsupported downstream receipt status '{req.Status}'.");

        var now = DateTime.UtcNow;
        var segmentKey = segmentId.ToString();
        var receipt = await _db.CountyDownstreamClosureReceipts
            .FirstOrDefaultAsync(r =>
                r.SourceType == DownstreamClosureReceiptSource.SegmentInspector
                && r.StudyId == req.StudyId
                && r.SegmentId == segmentKey
                && r.Destination == destination);

        if (receipt is null)
        {
            receipt = new CountyDownstreamClosureReceipt
            {
                ExceptionSetId = null,
                StudyId = req.StudyId,
                CountyId = segment.CountyId,
                SourceType = DownstreamClosureReceiptSource.SegmentInspector,
                Destination = destination,
                SegmentId = segmentKey,
                DraftedAt = now,
            };
            _db.CountyDownstreamClosureReceipts.Add(receipt);
        }

        var trackedReceipt = receipt!;
        var status = requestedStatus == DownstreamClosureReceiptStatus.Drafted
            ? trackedReceipt.Status
            : requestedStatus;

        trackedReceipt.Template = req.Template;
        trackedReceipt.SegmentLabel = string.IsNullOrWhiteSpace(req.SegmentLabel)
            ? segment.Name
            : req.SegmentLabel;
        trackedReceipt.Status = status;
        trackedReceipt.DownstreamEntityId = string.IsNullOrWhiteSpace(req.DownstreamEntityId)
            ? trackedReceipt.DownstreamEntityId
            : req.DownstreamEntityId;
        trackedReceipt.EvidenceRef = string.IsNullOrWhiteSpace(req.EvidenceRef)
            ? trackedReceipt.EvidenceRef
            : req.EvidenceRef;
        trackedReceipt.Notes = string.IsNullOrWhiteSpace(req.Notes)
            ? trackedReceipt.Notes
            : req.Notes;
        trackedReceipt.UpdatedAt = now;
        trackedReceipt.UpdatedBy = userId;

        await _db.SaveChangesAsync();
        return MapDownstreamReceipt(trackedReceipt);
    }

    public async Task<CountyDownstreamClosureReceiptDto> UpdateDownstreamClosureReceiptStatusAsync(
        Guid exceptionSetId,
        DownstreamClosureReceiptStatus status,
        string userId)
    {
        var receipt = await _db.CountyDownstreamClosureReceipts
            .FirstOrDefaultAsync(r => r.ExceptionSetId == exceptionSetId)
            ?? throw new InvalidOperationException($"Downstream receipt for ExceptionSet {exceptionSetId} not found");

        receipt.Status = status;
        receipt.UpdatedAt = DateTime.UtcNow;
        receipt.UpdatedBy = userId;
        await _db.SaveChangesAsync();
        return MapDownstreamReceipt(receipt);
    }

    public async Task<CountyDownstreamClosureReceiptDto> UpdateDownstreamClosureReceiptByReceiptIdAsync(
        Guid receiptId,
        DownstreamClosureReceiptStatus status,
        string userId,
        string? downstreamEntityId = null,
        string? evidenceRef = null,
        string? notes = null)
    {
        var receipt = await _db.CountyDownstreamClosureReceipts
            .FirstOrDefaultAsync(r => r.ReceiptId == receiptId)
            ?? throw new InvalidOperationException($"Downstream receipt {receiptId} not found");

        receipt.Status = status;
        receipt.DownstreamEntityId = string.IsNullOrWhiteSpace(downstreamEntityId)
            ? receipt.DownstreamEntityId
            : downstreamEntityId;
        receipt.EvidenceRef = string.IsNullOrWhiteSpace(evidenceRef)
            ? receipt.EvidenceRef
            : evidenceRef;
        receipt.Notes = string.IsNullOrWhiteSpace(notes)
            ? receipt.Notes
            : notes;
        receipt.UpdatedAt = DateTime.UtcNow;
        receipt.UpdatedBy = userId;
        await _db.SaveChangesAsync();
        return MapDownstreamReceipt(receipt);
    }

    private static CountyExceptionSetDto MapExceptionSet(CountyExceptionSet e) =>
        new(e.ExceptionSetId, e.StudyId, e.SourceScenarioId, e.ReasonCode.ToString(),
            e.ParcelCount, e.Destination.ToString(), e.Status.ToString(),
            e.AssignedTo, e.Notes, e.CreatedAt, e.CreatedBy);

    private static CountyDownstreamClosureReceiptDto MapDownstreamReceipt(CountyDownstreamClosureReceipt r) =>
        new(r.ReceiptId, r.ExceptionSetId, r.StudyId, r.CountyId, r.SourceType.ToString(),
            r.Destination.ToString(), r.Template, r.SegmentId, r.SegmentLabel, r.Status.ToString(),
            r.DownstreamEntityId, r.EvidenceRef, r.Notes,
            r.DraftedAt, r.UpdatedAt, r.UpdatedBy);
}
