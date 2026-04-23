// backend/TerraFusion.API.Tests/CountyStudyServiceTests.cs
using TerraFusion.API.Tests.TestHelpers;
using TerraFusion.Core.DTOs;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Services;
using Xunit;
using Task = System.Threading.Tasks.Task;
using System.Text.Json;

namespace TerraFusion.API.Tests;

public class CountyStudyServiceTests
{
    private (TerraFusion.Data.TerraFusionDbContext ctx, CountyStudyService svc) CreateSut()
    {
        var ctx = TestDbContextFactory.CreateInMemoryContext();
        var resolver = new PassThroughCountyResolver();
        var svc = new CountyStudyService(ctx, resolver);
        return (ctx, svc);
    }

    /// <summary>
    /// Test-only resolver: treats every input as a Guid string. Tests that pass
    /// Guids to CreateStudyRequest.CountyId will round-trip cleanly.
    /// </summary>
    private sealed class PassThroughCountyResolver : ICountyResolver
    {
        public Task<Guid> ResolveAsync(string input, CancellationToken ct = default)
            => Guid.TryParse(input, out var g)
                ? Task.FromResult(g)
                : throw new CountyNotFoundException(input);

        public Task<Guid?> TryResolveAsync(string input, CancellationToken ct = default)
            => Task.FromResult<Guid?>(Guid.TryParse(input, out var g) ? g : null);
    }

    [Fact]
    public async Task CreateStudy_ReturnsStudyWithNewId()
    {
        var (_, svc) = CreateSut();
        var req = new CreateStudyRequest(Guid.NewGuid().ToString(), 2026, StudyType.RatioStudy, "March");
        var result = await svc.CreateStudyAsync(req, "testuser");
        Assert.NotEqual(Guid.Empty, result.StudyId);
        Assert.Equal(2026, result.TaxYear);
    }

    [Fact]
    public async Task GetStudies_ReturnsOnlyCountyStudies()
    {
        var (_, svc) = CreateSut();
        var countyId = Guid.NewGuid();
        var otherCountyId = Guid.NewGuid();
        await svc.CreateStudyAsync(new CreateStudyRequest(countyId.ToString(), 2026, StudyType.RatioStudy, null), "u1");
        await svc.CreateStudyAsync(new CreateStudyRequest(otherCountyId.ToString(), 2026, StudyType.RatioStudy, null), "u2");

        var results = await svc.GetStudiesAsync(countyId);
        Assert.Single(results);
    }

    [Fact]
    public async Task CreateCohort_PersistsCohortWithStudyId()
    {
        var (_, svc) = CreateSut();
        var study = await svc.CreateStudyAsync(
            new CreateStudyRequest(Guid.NewGuid().ToString(), 2026, StudyType.RatioStudy, null), "u1");
        var req = new CreateCohortRequest(
            study.StudyId, "West Richland R1", CohortSelectionType.Segment,
            "{\"segmentIds\":[\"abc\"]}", 842, false);
        var cohort = await svc.CreateCohortAsync(req, "u1");
        Assert.Equal(study.StudyId, cohort.StudyId);
        Assert.Equal(842, cohort.ParcelCount);
    }

    [Fact]
    public async Task CreateScenario_PersistsWithDraftStatus()
    {
        var (_, svc) = CreateSut();
        var study = await svc.CreateStudyAsync(
            new CreateStudyRequest(Guid.NewGuid().ToString(), 2026, StudyType.RatioStudy, null), "u1");
        var cohort = await svc.CreateCohortAsync(
            new CreateCohortRequest(study.StudyId, "TestCohort", CohortSelectionType.Segment,
                "{}", 100, false), "u1");
        var req = new CreateScenarioRequest(
            study.StudyId, cohort.CohortId,
            ScenarioAdjustmentType.LandValuePercent, "{\"magnitude\":4.0}", "market lag");
        var scenario = await svc.CreateScenarioAsync(req, "u1");
        Assert.Equal("Draft", scenario.Status);
        Assert.Equal(study.StudyId, scenario.StudyId);
    }

    // ── PreviewScenarioImpact ─────────────────────────────────────────────

    [Fact]
    public async Task PreviewScenarioImpact_ReturnsDto_WithScenarioId()
    {
        var (_, svc) = CreateSut();
        var study = await svc.CreateStudyAsync(
            new CreateStudyRequest(Guid.NewGuid().ToString(), 2026, StudyType.RatioStudy, null), "u1");
        var cohort = await svc.CreateCohortAsync(
            new CreateCohortRequest(study.StudyId, "PreviewCohort", CohortSelectionType.Segment,
                "{}", 50, false), "u1");
        var scenario = await svc.CreateScenarioAsync(
            new CreateScenarioRequest(study.StudyId, cohort.CohortId,
                ScenarioAdjustmentType.LandValuePercent, "{\"magnitude\":5.0}", "preview test"), "u1");

        // No segments seeded — preview returns zero-value metric deltas, which is valid
        var preview = await svc.PreviewScenarioImpactAsync(scenario.ScenarioId);

        Assert.Equal(scenario.ScenarioId, preview.ScenarioId);
        Assert.Equal(50, preview.ParcelsAffected); // sourced from cohort.ParcelCount
    }

    // ── Chunk 4: honest scenario preview math ────────────────────────────

    private async Task<(CountyStudyService svc, TerraFusion.Data.TerraFusionDbContext ctx, Guid studyId, Guid cohortId)>
        SeedStudyWithSegments(string cohortDefinitionJson, params (decimal median, decimal cod, decimal prd, int parcels, int excCount)[] segs)
    {
        var (ctx, svc) = CreateSut();
        var study = await svc.CreateStudyAsync(
            new CreateStudyRequest(Guid.NewGuid().ToString(), 2026, StudyType.RatioStudy, null), "u1");
        var segSet = new TerraFusion.Core.Entities.CountySegmentSet
        {
            SegmentSetId = Guid.NewGuid(),
            StudyId      = study.StudyId,
            CountyId     = Guid.NewGuid(),
            Name         = "Test",
            SourceType   = TerraFusion.Core.Entities.SegmentSetSourceType.Hybrid,
            Version      = 1,
            IsBaseline   = true,
            CreatedBy    = "u1",
            UpdatedBy    = "u1",
        };
        ctx.CountySegmentSets.Add(segSet);
        foreach (var (median, cod, prd, parcels, exc) in segs)
        {
            ctx.CountySegments.Add(new TerraFusion.Core.Entities.CountySegment
            {
                SegmentId                = Guid.NewGuid(),
                SegmentSetId             = segSet.SegmentSetId,
                CountyId                 = segSet.CountyId,
                Name                     = "seg",
                SegmentType              = TerraFusion.Core.Entities.SegmentType.Residential,
                ParcelCount              = parcels,
                MedianRatio              = median,
                CoefficientOfDispersion  = cod,
                PriceRelatedDifferential = prd,
                ExceptionCount           = exc,
                StabilityScore           = 60,
                RiskScore                = 40,
            });
        }
        // Point the study at the segment set so preview finds it.
        var studyEntity = ctx.CountyStudySessions.First(s => s.StudyId == study.StudyId);
        studyEntity.ActiveSegmentSetId = segSet.SegmentSetId;
        await ctx.SaveChangesAsync();

        var cohort = await svc.CreateCohortAsync(
            new CreateCohortRequest(study.StudyId, "TestCohort", CohortSelectionType.Segment,
                cohortDefinitionJson, 100, false), "u1");
        return (svc, ctx, study.StudyId, cohort.CohortId);
    }

    [Fact]
    public async Task PreviewScenarioImpact_PercentAdjustment_CodIsScaleInvariant()
    {
        // Retires the 0.87m lie. Uniform percentage adjustment → COD is scale-
        // invariant under multiplication (see IAAO Standard on Ratio Studies §7).
        var (svc, _, studyId, cohortId) = await SeedStudyWithSegments(
            "{}",
            (median: 0.95m, cod: 12.0m, prd: 1.01m, parcels: 100, excCount: 5),
            (median: 0.92m, cod: 14.0m, prd: 1.02m, parcels:  50, excCount: 3));

        var scenario = await svc.CreateScenarioAsync(
            new CreateScenarioRequest(studyId, cohortId,
                ScenarioAdjustmentType.TotalValuePercent, "{\"magnitude\":4.0}", "test"), "u1");

        var preview = await svc.PreviewScenarioImpactAsync(scenario.ScenarioId);

        // Median shifted by factor 1.04 (average of 0.95 and 0.92 = 0.935 → 0.9724).
        Assert.Equal(0.935m, preview.MedianRatioBefore, precision: 3);
        Assert.Equal(0.9724m, preview.MedianRatioAfter, precision: 4);
        // COD invariant — both before and after equal (13.0 avg of 12/14).
        Assert.Equal(13.0m, preview.CodBefore, precision: 2);
        Assert.Equal(13.0m, preview.CodAfter,  precision: 2);
        // PRD also invariant (avg 1.015).
        Assert.Equal(1.015m, preview.PrdBefore, precision: 4);
        Assert.Equal(1.015m, preview.PrdAfter,  precision: 4);
    }

    [Fact]
    public async Task PreviewScenarioImpact_PercentAdjustment_MedianShiftsByFactor()
    {
        var (svc, _, studyId, cohortId) = await SeedStudyWithSegments(
            "{}",
            (median: 1.00m, cod: 10.0m, prd: 1.00m, parcels: 200, excCount: 0));

        var scenario = await svc.CreateScenarioAsync(
            new CreateScenarioRequest(studyId, cohortId,
                ScenarioAdjustmentType.TotalValuePercent, "{\"magnitude\":-5.0}", "decrease"), "u1");

        var preview = await svc.PreviewScenarioImpactAsync(scenario.ScenarioId);

        Assert.Equal(1.00m, preview.MedianRatioBefore, precision: 3);
        Assert.Equal(0.95m, preview.MedianRatioAfter,  precision: 3);
    }

    [Fact]
    public async Task PreviewScenarioImpact_PercentAdjustment_ExceptionsIncrease_WhenShiftCrossesIaaoFence()
    {
        // Segment with median 1.20 gets +15% → projected 1.38 > 1.30 IAAO high
        // fence. All 80 parcels count as exceptions after.
        var (svc, _, studyId, cohortId) = await SeedStudyWithSegments(
            "{}",
            (median: 1.20m, cod: 15.0m, prd: 1.02m, parcels: 80, excCount: 5),
            (median: 0.95m, cod: 10.0m, prd: 1.00m, parcels: 40, excCount: 2));

        var scenario = await svc.CreateScenarioAsync(
            new CreateScenarioRequest(studyId, cohortId,
                ScenarioAdjustmentType.TotalValuePercent, "{\"magnitude\":15.0}", "large increase"), "u1");

        var preview = await svc.PreviewScenarioImpactAsync(scenario.ScenarioId);

        // Before: 5 + 2 = 7 exceptions
        Assert.Equal(7, preview.ExceptionsBefore);
        // After: first segment (1.20 × 1.15 = 1.38 > 1.30) contributes all 80 parcels;
        // second segment (0.95 × 1.15 = 1.0925, inside fence) keeps its 2 exceptions.
        Assert.Equal(82, preview.ExceptionsAfter);
    }

    [Fact]
    public async Task PreviewScenarioImpact_FlatDollarAdjustment_CodChangesConservatively()
    {
        // Flat-dollar branch — COD scales up (not scale-invariant). Median barely moves.
        var (svc, _, studyId, cohortId) = await SeedStudyWithSegments(
            "{}",
            (median: 0.95m, cod: 12.0m, prd: 1.01m, parcels: 100, excCount: 5));

        var scenario = await svc.CreateScenarioAsync(
            new CreateScenarioRequest(studyId, cohortId,
                ScenarioAdjustmentType.LandValueFlat, "{\"magnitude\":5000.0}", "flat"), "u1");

        var preview = await svc.PreviewScenarioImpactAsync(scenario.ScenarioId);

        // Flat-dollar branch: median unchanged (flat dollar barely moves proportion).
        Assert.Equal(preview.MedianRatioBefore, preview.MedianRatioAfter);
        // COD increased (not scale-invariant for flat-dollar).
        Assert.True(preview.CodAfter > preview.CodBefore,
            $"expected COD to increase under flat-dollar; got before={preview.CodBefore} after={preview.CodAfter}");
    }

    [Fact]
    public async Task PreviewScenarioImpact_CohortWithSegmentIds_UsesOnlyThoseSegments()
    {
        // Seed two segments. Cohort's Definition references only the first one.
        // Preview must aggregate over segment 1 only — NOT both.
        var (ctx, svc) = CreateSut();
        var study = await svc.CreateStudyAsync(
            new CreateStudyRequest(Guid.NewGuid().ToString(), 2026, StudyType.RatioStudy, null), "u1");
        var segSet = new TerraFusion.Core.Entities.CountySegmentSet
        {
            SegmentSetId = Guid.NewGuid(),
            StudyId = study.StudyId, CountyId = Guid.NewGuid(),
            Name = "Test", SourceType = TerraFusion.Core.Entities.SegmentSetSourceType.Hybrid,
            Version = 1, IsBaseline = true, CreatedBy = "u1", UpdatedBy = "u1",
        };
        ctx.CountySegmentSets.Add(segSet);

        var seg1Id = Guid.NewGuid();
        var seg2Id = Guid.NewGuid();
        ctx.CountySegments.AddRange(
            new TerraFusion.Core.Entities.CountySegment
            {
                SegmentId = seg1Id, SegmentSetId = segSet.SegmentSetId, CountyId = segSet.CountyId,
                Name = "seg1", SegmentType = TerraFusion.Core.Entities.SegmentType.Residential,
                ParcelCount = 50, MedianRatio = 1.00m,
                CoefficientOfDispersion = 10m, PriceRelatedDifferential = 1.00m, ExceptionCount = 1,
            },
            new TerraFusion.Core.Entities.CountySegment
            {
                SegmentId = seg2Id, SegmentSetId = segSet.SegmentSetId, CountyId = segSet.CountyId,
                Name = "seg2", SegmentType = TerraFusion.Core.Entities.SegmentType.Residential,
                ParcelCount = 50, MedianRatio = 0.50m,  // way off — would skew if included
                CoefficientOfDispersion = 30m, PriceRelatedDifferential = 0.80m, ExceptionCount = 40,
            });

        var studyEntity = ctx.CountyStudySessions.First(s => s.StudyId == study.StudyId);
        studyEntity.ActiveSegmentSetId = segSet.SegmentSetId;
        await ctx.SaveChangesAsync();

        // Cohort points at seg1Id only.
        var cohortDef = System.Text.Json.JsonSerializer.Serialize(new { segmentIds = new[] { seg1Id.ToString() } });
        var cohort = await svc.CreateCohortAsync(
            new CreateCohortRequest(study.StudyId, "Seg1Only", CohortSelectionType.Segment,
                cohortDef, 50, false), "u1");

        var scenario = await svc.CreateScenarioAsync(
            new CreateScenarioRequest(study.StudyId, cohort.CohortId,
                ScenarioAdjustmentType.TotalValuePercent, "{\"magnitude\":5.0}", "test"), "u1");

        var preview = await svc.PreviewScenarioImpactAsync(scenario.ScenarioId);

        // Should see seg1's metrics only — not averaged with seg2.
        Assert.Equal(1.00m, preview.MedianRatioBefore, precision: 3);
        Assert.Equal(10m,   preview.CodBefore,         precision: 1);
        Assert.Equal(1,     preview.ExceptionsBefore);
    }

    // ── PromoteScenarioAsync ──────────────────────────────────────────────

    [Fact]
    public async Task PromoteScenario_Draft_ThrowsInvalidOperation()
    {
        var (_, svc) = CreateSut();
        var study = await svc.CreateStudyAsync(
            new CreateStudyRequest(Guid.NewGuid().ToString(), 2026, StudyType.RatioStudy, null), "u1");
        var cohort = await svc.CreateCohortAsync(
            new CreateCohortRequest(study.StudyId, "PromoteCohort", CohortSelectionType.Segment,
                "{}", 100, false), "u1");
        var scenario = await svc.CreateScenarioAsync(
            new CreateScenarioRequest(study.StudyId, cohort.CohortId,
                ScenarioAdjustmentType.LandValuePercent, "{}", "test rationale"), "u1");

        // Draft scenario must not be promotable — workflow requires Save first
        var req = new PromoteScenarioRequest(scenario.ScenarioId, "{}");
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(
            () => svc.PromoteScenarioAsync(req, "u1"));
        Assert.Contains("cannot be promoted", ex.Message);
    }

    [Fact]
    public async Task PromoteScenario_SavedStatus_CreatesAdjustmentSet()
    {
        var (_, svc) = CreateSut();
        var study = await svc.CreateStudyAsync(
            new CreateStudyRequest(Guid.NewGuid().ToString(), 2026, StudyType.RatioStudy, null), "u1");
        var cohort = await svc.CreateCohortAsync(
            new CreateCohortRequest(study.StudyId, "PromoteCohort", CohortSelectionType.Segment,
                "{}", 100, false), "u1");
        var scenario = await svc.CreateScenarioAsync(
            new CreateScenarioRequest(study.StudyId, cohort.CohortId,
                ScenarioAdjustmentType.LandValuePercent, "{}", "test rationale"), "u1");

        await svc.SaveScenarioAsync(scenario.ScenarioId, "u1"); // Draft → Saved

        var adjSet = await svc.PromoteScenarioAsync(
            new PromoteScenarioRequest(scenario.ScenarioId, "{\"scope\":\"county\"}"), "u1");

        Assert.Equal(scenario.ScenarioId, adjSet.ScenarioId);
        Assert.Equal("Proposed", adjSet.ApprovalState);
        Assert.NotEqual(Guid.Empty, adjSet.AdjustmentSetId);
    }

    // ── CreateExceptionSetAsync ───────────────────────────────────────────

    [Fact]
    public async Task CreateExceptionSet_PersistsWithCorrectStudy()
    {
        var (_, svc) = CreateSut();
        var study = await svc.CreateStudyAsync(
            new CreateStudyRequest(Guid.NewGuid().ToString(), 2026, StudyType.RatioStudy, null), "u1");
        var cohort = await svc.CreateCohortAsync(
            new CreateCohortRequest(study.StudyId, "ExcCohort", CohortSelectionType.Segment,
                "{}", 10, false), "u1");
        var scenario = await svc.CreateScenarioAsync(
            new CreateScenarioRequest(study.StudyId, cohort.CohortId,
                ScenarioAdjustmentType.LandValuePercent, "{}", "test rationale"), "u1");

        var req = new CreateCountyExceptionSetRequest(
            study.StudyId, scenario.ScenarioId,
            ExceptionReasonCode.Outlier,
            new List<string> { "parcel-1", "parcel-2" },
            ExceptionDestination.Dais);

        var result = await svc.CreateExceptionSetAsync(req, "u1");

        Assert.Equal(study.StudyId, result.StudyId);
        Assert.Equal(2, result.ParcelCount);
        Assert.Equal("Created", result.Status);
    }

    [Fact]
    public async Task CreateExceptionSet_WrongStudy_ThrowsInvalidOperation()
    {
        var (_, svc) = CreateSut();

        // Study A: the scenario lives here
        var studyA = await svc.CreateStudyAsync(
            new CreateStudyRequest(Guid.NewGuid().ToString(), 2026, StudyType.RatioStudy, null), "u1");
        var cohort = await svc.CreateCohortAsync(
            new CreateCohortRequest(studyA.StudyId, "CrossStudyCohort", CohortSelectionType.Segment,
                "{}", 5, false), "u1");
        var scenario = await svc.CreateScenarioAsync(
            new CreateScenarioRequest(studyA.StudyId, cohort.CohortId,
                ScenarioAdjustmentType.LandValuePercent, "{}", "test rationale"), "u1");

        // Study B: the exception set claims to belong here (cross-study injection)
        var studyB = await svc.CreateStudyAsync(
            new CreateStudyRequest(Guid.NewGuid().ToString(), 2026, StudyType.RatioStudy, null), "u2");

        var req = new CreateCountyExceptionSetRequest(
            studyB.StudyId, scenario.ScenarioId, // mismatch!
            ExceptionReasonCode.Outlier,
            new List<string> { "parcel-x" },
            ExceptionDestination.Dossier);

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => svc.CreateExceptionSetAsync(req, "u1"));
    }
}
