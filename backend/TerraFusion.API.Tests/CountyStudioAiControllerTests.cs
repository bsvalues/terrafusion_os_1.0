// backend/TerraFusion.API.Tests/CountyStudioAiControllerTests.cs
//
// Task E — HTTP shape tests for the two diagnosis endpoints.
// Service layer is mocked; real diagnosis logic is exercised in
// CountyStudioAiServiceTests.

using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using TerraFusion.API.Controllers;
using TerraFusion.API.Tests.TestHelpers;
using TerraFusion.Core.DTOs;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Interfaces;
using TerraFusion.Core.Services;
using Xunit;
using Task = System.Threading.Tasks.Task;

namespace TerraFusion.API.Tests;

public sealed class CountyStudioAiControllerTests
{
    private static CountyStudyController BuildController(
        ICountyStudioAiService aiSvc,
        Guid? countyClaim = null,
        Action<TerraFusion.Data.TerraFusionDbContext>? seed = null)
    {
        var claimId   = countyClaim ?? ControllerTestSetup.DefaultCountyClaimId;
        var svc       = new Mock<ICountyStudyService>();
        var resolver  = ControllerTestSetup.EchoCountyResolver();
        var derive    = new Mock<ICountyStudySegmentDerivationService>();
        var health    = new Mock<ICountyStudyHealthService>();
        var inspector = new Mock<ICountyStudyInspectorService>();
        var db        = TestDbContextFactory.CreateInMemoryContext();
        if (seed is not null)
        {
            seed(db);
            db.SaveChanges();
        }
        var controller = new CountyStudyController(
            svc.Object,
            db,
            resolver,
            derive.Object,
            health.Object,
            inspector.Object,
            aiSvc,
            NullLogger<CountyStudyController>.Instance);
        controller.ControllerContext = ControllerTestSetup.WithCountyClaim(claimId);
        return controller;
    }

    /// <summary>Seed action for a CountySegment scoped to the given countyId.</summary>
    private static Action<TerraFusion.Data.TerraFusionDbContext> SeedSegment(Guid segmentId, Guid countyId) =>
        db => db.CountySegments.Add(new CountySegment
        {
            SegmentId    = segmentId,
            SegmentSetId = Guid.NewGuid(),
            CountyId     = countyId,
            Name         = "Test Segment",
        });

    /// <summary>Seed action for a CountyStudySession scoped to the given countyId.</summary>
    private static Action<TerraFusion.Data.TerraFusionDbContext> SeedStudy(Guid studyId, Guid countyId) =>
        db => db.CountyStudySessions.Add(new CountyStudySession
        {
            StudyId    = studyId,
            CountyId   = countyId,
            CountyName = "Test County",
            TaxYear    = 2026,
        });

    private static SegmentDiagnosisDto BuildSegmentDiagnosis() => new(
        SegmentId:          Guid.NewGuid(),
        SegmentName:        "NBHD-K1/R1/STANDARD",
        City:               "Kennewick",
        NeighborhoodCode:   "NBHD-K1",
        ParcelCount:        128,
        PrimaryClass:       ProblemClass.Model,
        PrimaryConfidence:  0.70m,
        Findings:           new List<SegmentDiagnosisFinding>
        {
            new(
                Code:             "IAAO_COD_CEILING_BREACH",
                Category:         "Model",
                Summary:          "COD 27.4 exceeds IAAO ceiling of 20 — dispersion too high.",
                EvidenceStrength: 0.75m,
                Evidence:         new Dictionary<string, object> { ["cod"] = 27.4m, ["iaaoCeiling"] = 20m },
                ParcelIdHints:    new List<string>()),
        },
        RecommendedActions: new List<SegmentRecommendedAction>
        {
            new(
                ActionCode:      "RECALIBRATE_COST_TABLE",
                Target:          "CostForge",
                Summary:         "Recalibrate cost tables in CostForge.",
                Priority:        2,
                Rationale:       "COD 27.4 exceeds IAAO ceiling.",
                PrebuiltContext: new Dictionary<string, object> { ["segmentId"] = Guid.NewGuid() }),
        },
        Narrative:         "NBHD-K1/R1/STANDARD classifies as Model problem (confidence 70%). COD 27.4 exceeds IAAO ceiling of 20 — dispersion too high. Recommended: Recalibrate cost tables in CostForge.",
        InputFingerprint:  "abcd1234",
        GeneratedAt:       DateTime.UtcNow);

    [Fact]
    public async Task GetSegmentDiagnosis_Returns200_WithDto()
    {
        var expected = BuildSegmentDiagnosis();
        var countyId = ControllerTestSetup.DefaultCountyClaimId;
        var aiMock = new Mock<ICountyStudioAiService>();
        aiMock
            .Setup(a => a.DiagnoseSegmentAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(expected);

        var controller = BuildController(aiMock.Object, countyId, SeedSegment(expected.SegmentId, countyId));
        var result = await controller.GetSegmentDiagnosis(expected.SegmentId, CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(result);
        var dto = Assert.IsType<SegmentDiagnosisDto>(ok.Value);
        Assert.Equal(expected.SegmentId, dto.SegmentId);
        Assert.Equal(ProblemClass.Model, dto.PrimaryClass);
        Assert.Single(dto.Findings);
    }

    [Fact]
    public async Task GetSegmentDiagnosis_Returns404_WhenSegmentNotFound()
    {
        var aiMock = new Mock<ICountyStudioAiService>();
        aiMock
            .Setup(a => a.DiagnoseSegmentAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("Segment x not found"));

        var controller = BuildController(aiMock.Object);
        var result = await controller.GetSegmentDiagnosis(Guid.NewGuid(), CancellationToken.None);

        var nf = Assert.IsType<NotFoundObjectResult>(result);
        Assert.Equal(404, nf.StatusCode);
    }

    [Fact]
    public async Task GetSegmentDiagnosis_Returns409_WhenNoDerivedMetrics()
    {
        var segmentId = Guid.NewGuid();
        var countyId  = ControllerTestSetup.DefaultCountyClaimId;
        var aiMock = new Mock<ICountyStudioAiService>();
        aiMock
            .Setup(a => a.DiagnoseSegmentAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("Segment x has no derived metrics — derive segment metrics first."));

        var controller = BuildController(aiMock.Object, countyId, SeedSegment(segmentId, countyId));
        var result = await controller.GetSegmentDiagnosis(segmentId, CancellationToken.None);

        var cf = Assert.IsType<ConflictObjectResult>(result);
        Assert.Equal(409, cf.StatusCode);
    }

    [Fact]
    public async Task GetCountyDiagnosis_Returns200_WithDto()
    {
        var expected = new CountyDiagnosisDto(
            StudyId:             Guid.NewGuid(),
            TaxYear:             2026,
            CountyName:          "Benton",
            OverallClass:        ProblemClass.Model,
            OverallConfidence:   0.65m,
            HealthySegmentCount: 8,
            ProblemSegmentCount: 4,
            TopProblems:         new List<SegmentDiagnosisDto> { BuildSegmentDiagnosis() },
            Patterns:            new List<CountyPattern>
            {
                new(
                    PatternCode:          "CITY_WIDE_REGRESSIVITY",
                    Summary:              "3 of 5 segments in Kennewick (60%) show regressivity.",
                    AffectedSegmentCount: 3,
                    SegmentIds:           new List<Guid> { Guid.NewGuid() },
                    Severity:             0.6m),
            },
            Narrative:        "Benton 2026 classifies as Model problem (confidence 65%). 4 of 12 segments carry a diagnosed problem.",
            InputFingerprint: "deadbeef",
            GeneratedAt:      DateTime.UtcNow);
        var aiMock = new Mock<ICountyStudioAiService>();
        aiMock
            .Setup(a => a.DiagnoseCountyAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(expected);

        var countyId = ControllerTestSetup.DefaultCountyClaimId;
        var controller = BuildController(aiMock.Object, countyId, SeedStudy(expected.StudyId, countyId));
        var result = await controller.GetCountyDiagnosis(expected.StudyId, CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(result);
        var dto = Assert.IsType<CountyDiagnosisDto>(ok.Value);
        Assert.Equal(expected.StudyId, dto.StudyId);
        Assert.Equal(ProblemClass.Model, dto.OverallClass);
        Assert.Single(dto.Patterns);
    }

    [Fact]
    public async Task GetCountyDiagnosis_Returns409_WhenNoActiveSegmentSet()
    {
        var studyId  = Guid.NewGuid();
        var countyId = ControllerTestSetup.DefaultCountyClaimId;
        var aiMock = new Mock<ICountyStudioAiService>();
        aiMock
            .Setup(a => a.DiagnoseCountyAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("Study x has no active segment set. Derive segments first."));

        var controller = BuildController(aiMock.Object, countyId, SeedStudy(studyId, countyId));
        var result = await controller.GetCountyDiagnosis(studyId, CancellationToken.None);

        var cf = Assert.IsType<ConflictObjectResult>(result);
        Assert.Equal(409, cf.StatusCode);
    }
}
