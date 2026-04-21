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
        var svc = new CountyStudyService(ctx);
        return (ctx, svc);
    }

    [Fact]
    public async Task CreateStudy_ReturnsStudyWithNewId()
    {
        var (_, svc) = CreateSut();
        var req = new CreateStudyRequest(Guid.NewGuid(), 2026, StudyType.RatioStudy, "March");
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
        await svc.CreateStudyAsync(new CreateStudyRequest(countyId, 2026, StudyType.RatioStudy, null), "u1");
        await svc.CreateStudyAsync(new CreateStudyRequest(otherCountyId, 2026, StudyType.RatioStudy, null), "u2");

        var results = await svc.GetStudiesAsync(countyId);
        Assert.Single(results);
    }

    [Fact]
    public async Task CreateCohort_PersistsCohortWithStudyId()
    {
        var (_, svc) = CreateSut();
        var study = await svc.CreateStudyAsync(
            new CreateStudyRequest(Guid.NewGuid(), 2026, StudyType.RatioStudy, null), "u1");
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
            new CreateStudyRequest(Guid.NewGuid(), 2026, StudyType.RatioStudy, null), "u1");
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
            new CreateStudyRequest(Guid.NewGuid(), 2026, StudyType.RatioStudy, null), "u1");
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

    // ── PromoteScenarioAsync ──────────────────────────────────────────────

    [Fact]
    public async Task PromoteScenario_Draft_ThrowsInvalidOperation()
    {
        var (_, svc) = CreateSut();
        var study = await svc.CreateStudyAsync(
            new CreateStudyRequest(Guid.NewGuid(), 2026, StudyType.RatioStudy, null), "u1");
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
            new CreateStudyRequest(Guid.NewGuid(), 2026, StudyType.RatioStudy, null), "u1");
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
            new CreateStudyRequest(Guid.NewGuid(), 2026, StudyType.RatioStudy, null), "u1");
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
            new CreateStudyRequest(Guid.NewGuid(), 2026, StudyType.RatioStudy, null), "u1");
        var cohort = await svc.CreateCohortAsync(
            new CreateCohortRequest(studyA.StudyId, "CrossStudyCohort", CohortSelectionType.Segment,
                "{}", 5, false), "u1");
        var scenario = await svc.CreateScenarioAsync(
            new CreateScenarioRequest(studyA.StudyId, cohort.CohortId,
                ScenarioAdjustmentType.LandValuePercent, "{}", "test rationale"), "u1");

        // Study B: the exception set claims to belong here (cross-study injection)
        var studyB = await svc.CreateStudyAsync(
            new CreateStudyRequest(Guid.NewGuid(), 2026, StudyType.RatioStudy, null), "u2");

        var req = new CreateCountyExceptionSetRequest(
            studyB.StudyId, scenario.ScenarioId, // mismatch!
            ExceptionReasonCode.Outlier,
            new List<string> { "parcel-x" },
            ExceptionDestination.Dossier);

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => svc.CreateExceptionSetAsync(req, "u1"));
    }
}
