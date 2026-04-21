// backend/TerraFusion.API.Tests/CountyStudyServiceTests.cs
using TerraFusion.API.Tests.TestHelpers;
using TerraFusion.Core.DTOs;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Services;
using Xunit;
using Task = System.Threading.Tasks.Task;

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
}
