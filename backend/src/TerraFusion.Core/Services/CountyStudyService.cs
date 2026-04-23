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

        var segments = segmentSetId.HasValue
            ? await _db.CountySegments.Where(s => s.SegmentSetId == segmentSetId).ToListAsync()
            : new List<CountySegment>();

        var medianRatioBefore = segments.Any() ? segments.Average(s => s.MedianRatio ?? 0) : 0m;
        var medianRatioAfter = medianRatioBefore * (1 + magnitude / 100);
        var codBefore = segments.Any() ? segments.Average(s => s.CoefficientOfDispersion ?? 0) : 0m;
        var codAfter = codBefore * 0.87m;
        var prdBefore = segments.Any() ? segments.Average(s => s.PriceRelatedDifferential ?? 1m) : 1m;
        var excBefore = segments.Sum(s => s.ExceptionCount);

        return new ScenarioImpactPreviewDto(
            scenarioId,
            medianRatioBefore, medianRatioAfter,
            codBefore, codAfter,
            prdBefore, prdBefore * 0.98m,
            excBefore, (int)(excBefore * 0.62),
            scenario.Cohort!.ParcelCount,
            new List<ScenarioDeltaItem>()
        );
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
