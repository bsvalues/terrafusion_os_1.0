// backend/src/TerraFusion.Core/Services/CountyStudyService.cs
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using TerraFusion.Core.DTOs;
using TerraFusion.Core.Entities;
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
        var study = new CountyStudySession
        {
            CountyId = countyId,
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
        return await _db.CountySegments
            .Where(s => s.SegmentSetId == segmentSetId)
            .OrderBy(s => s.Name)
            .Select(s => MapSegment(s))
            .ToListAsync();
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

    // ── Mappers ──────────────────────────────────────────────────────────

    private static CountyStudySessionDto MapStudy(CountyStudySession s) =>
        new(s.StudyId, s.CountyId, s.TaxYear, s.StudyType.ToString(),
            s.Status.ToString(), s.BaselineVersion, s.ActiveSegmentSetId,
            s.CreatedAt, s.CreatedBy);

    private static CountySegmentSetDto MapSegmentSet(CountySegmentSet ss, int segmentCount) =>
        new(ss.SegmentSetId, ss.StudyId, ss.Name, ss.SourceType.ToString(),
            ss.Version, ss.IsBaseline, segmentCount);

    private static CountySegmentDto MapSegment(CountySegment s) =>
        new(s.SegmentId, s.SegmentSetId, s.Name, s.SegmentType.ToString(),
            s.GeographyRef, s.ParcelCount, s.MedianRatio, s.CoefficientOfDispersion,
            s.PriceRelatedDifferential, s.StabilityScore, s.RiskScore, s.ExceptionCount);

    private static CountyCohortDto MapCohort(CountyCohort c) =>
        new(c.CohortId, c.StudyId, c.Name, c.SelectionType.ToString(),
            c.Definition, c.ParcelCount, c.IsHybrid, c.CreatedAt);

    private static CountyScenarioDto MapScenario(CountyScenario s) =>
        new(s.ScenarioId, s.StudyId, s.CohortId, s.AdjustmentType.ToString(),
            s.Parameters, s.Rationale, s.Status.ToString(), s.ImpactPreviewJson,
            s.CreatedAt, s.CreatedBy);

    private static CountyAdjustmentSetDto MapAdjustmentSet(CountyAdjustmentSet a) =>
        new(a.AdjustmentSetId, a.StudyId, a.ScenarioId, a.EffectiveScope,
            a.ApprovalState.ToString(), a.ApprovedBy, a.PublishedAt);

    private static CountyExceptionSetDto MapExceptionSet(CountyExceptionSet e) =>
        new(e.ExceptionSetId, e.StudyId, e.SourceScenarioId, e.ReasonCode.ToString(),
            e.ParcelCount, e.Destination.ToString(), e.Status.ToString());
}
