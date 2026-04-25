// backend/TerraFusion.API.Tests/CountyStudyControllerTests.cs
//
// Unit tests for CountyStudyController.
// Uses direct controller instantiation + Moq (no WebApplicationFactory overhead).
// Pattern matches BentonCountyGisControllerTests and CountyStudyHubTests.

using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using TerraFusion.API.Controllers;
using TerraFusion.Core.DTOs;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Interfaces;
using TerraFusion.Core.Services;
using Xunit;
using Task = System.Threading.Tasks.Task;

namespace TerraFusion.API.Tests;

public class CountyStudyControllerTests
{
    private static CountyStudyController BuildController(ICountyStudyService svc)
    {
        var resolver = new Mock<ICountyResolver>();
        // Default behavior: parse any Guid-string input back to that Guid.
        resolver
            .Setup(r => r.ResolveAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns<string, CancellationToken>((s, _) =>
                Guid.TryParse(s, out var g)
                    ? Task.FromResult(g)
                    : throw new CountyNotFoundException(s));
        var derive    = new Mock<ICountyStudySegmentDerivationService>();
        var health    = new Mock<ICountyStudyHealthService>();
        var inspector = new Mock<ICountyStudyInspectorService>();
        var ai        = new Mock<ICountyStudioAiService>();
        return new(svc, resolver.Object, derive.Object, health.Object, inspector.Object,
            ai.Object, NullLogger<CountyStudyController>.Instance);
    }

    // ── Studies ───────────────────────────────────────────────────────────────

    [Fact]
    public async Task CreateStudy_Returns201_WithCreatedDto()
    {
        var countyId = Guid.NewGuid();
        var studyId  = Guid.NewGuid();

        var expected = new CountyStudySessionDto(
            studyId, countyId, "Test County", 2026,
            nameof(StudyType.RatioStudy), nameof(StudyStatus.Draft),
            null, null,
            DateTime.UtcNow, "system");

        var svcMock = new Mock<ICountyStudyService>();
        svcMock.Setup(s => s.CreateStudyAsync(It.IsAny<CreateStudyRequest>(), It.IsAny<string>()))
               .ReturnsAsync(expected);

        var controller = BuildController(svcMock.Object);
        var req        = new CreateStudyRequest(countyId.ToString(), 2026, StudyType.RatioStudy, null);

        var result = await controller.CreateStudy(req);

        var created = Assert.IsType<CreatedAtActionResult>(result);
        Assert.Equal(201, created.StatusCode);
        var dto = Assert.IsType<CountyStudySessionDto>(created.Value);
        Assert.Equal(studyId, dto.StudyId);
        Assert.Equal(countyId, dto.CountyId);
    }

    [Fact]
    public async Task GetStudyById_Returns404_WhenNotFound()
    {
        var svcMock = new Mock<ICountyStudyService>();
        svcMock.Setup(s => s.GetStudyAsync(It.IsAny<Guid>()))
               .ReturnsAsync((CountyStudySessionDto?)null);

        var controller = BuildController(svcMock.Object);

        var result = await controller.GetStudyById(Guid.NewGuid());

        Assert.IsType<NotFoundObjectResult>(result);
    }

    [Fact]
    public async Task GetStudies_Returns200_WithList()
    {
        var countyId = Guid.NewGuid();
        var studies  = new List<CountyStudySessionDto>
        {
            new(Guid.NewGuid(), countyId, "Test County", 2026, nameof(StudyType.RatioStudy), nameof(StudyStatus.Draft),
                null, null, DateTime.UtcNow, "system"),
            new(Guid.NewGuid(), countyId, "Test County", 2025, nameof(StudyType.MassAppraisal), nameof(StudyStatus.Active),
                null, null, DateTime.UtcNow.AddYears(-1), "system")
        };

        var svcMock = new Mock<ICountyStudyService>();
        svcMock.Setup(s => s.GetStudiesAsync(countyId))
               .ReturnsAsync(studies);

        var controller = BuildController(svcMock.Object);

        var result = await controller.GetStudies(countyId.ToString(), CancellationToken.None);

        var ok   = Assert.IsType<OkObjectResult>(result);
        var list = Assert.IsAssignableFrom<List<CountyStudySessionDto>>(ok.Value);
        Assert.Equal(2, list.Count);
    }

    // ── Cohorts ───────────────────────────────────────────────────────────────

    [Fact]
    public async Task CreateCohort_Returns201_WithCohortDto()
    {
        var studyId  = Guid.NewGuid();
        var cohortId = Guid.NewGuid();

        var expected = new CountyCohortDto(
            cohortId, studyId, "West Richland R1",
            nameof(CohortSelectionType.Segment),
            "{\"segmentIds\":[\"abc\"]}",
            842, false, DateTime.UtcNow);

        var svcMock = new Mock<ICountyStudyService>();
        svcMock.Setup(s => s.CreateCohortAsync(It.IsAny<CreateCohortRequest>(), It.IsAny<string>()))
               .ReturnsAsync(expected);

        var controller = BuildController(svcMock.Object);
        var req = new CreateCohortRequest(
            studyId, "West Richland R1",
            CohortSelectionType.Segment,
            "{\"segmentIds\":[\"abc\"]}",
            842, false);

        var result = await controller.CreateCohort(req);

        var created = Assert.IsType<CreatedAtActionResult>(result);
        Assert.Equal(201, created.StatusCode);
        var dto = Assert.IsType<CountyCohortDto>(created.Value);
        Assert.Equal(cohortId, dto.CohortId);
        Assert.Equal(studyId, dto.StudyId);
        Assert.Equal(842, dto.ParcelCount);
    }

    // ── Study Status ──────────────────────────────────────────────────────────

    [Fact]
    public async Task UpdateStudyStatus_Returns200_WithUpdatedDto()
    {
        var studyId  = Guid.NewGuid();
        var countyId = Guid.NewGuid();

        var expected = new CountyStudySessionDto(
            studyId, countyId, "Test County", 2026,
            nameof(StudyType.RatioStudy), nameof(StudyStatus.Active),
            null, null,
            DateTime.UtcNow, "system");

        var svcMock = new Mock<ICountyStudyService>();
        svcMock.Setup(s => s.UpdateStudyStatusAsync(studyId, "Active", It.IsAny<string>()))
               .ReturnsAsync(expected);

        var controller = BuildController(svcMock.Object);

        var result = await controller.UpdateStudyStatus(studyId, new UpdateStudyStatusRequest("Active"));

        var ok  = Assert.IsType<OkObjectResult>(result);
        var dto = Assert.IsType<CountyStudySessionDto>(ok.Value);
        Assert.Equal(studyId, dto.StudyId);
        Assert.Equal(nameof(StudyStatus.Active), dto.Status);
    }

    [Fact]
    public async Task UpdateStudyStatus_Returns404_WhenStudyNotFound()
    {
        var svcMock = new Mock<ICountyStudyService>();
        svcMock.Setup(s => s.UpdateStudyStatusAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<string>()))
               .ReturnsAsync((CountyStudySessionDto?)null);

        var controller = BuildController(svcMock.Object);

        var result = await controller.UpdateStudyStatus(Guid.NewGuid(), new UpdateStudyStatusRequest("Archived"));

        Assert.IsType<NotFoundObjectResult>(result);
    }

    // ── DeriveSegments ────────────────────────────────────────────────────────

    [Fact]
    public async Task DeriveSegments_Returns400_WhenServiceThrowsInvalidOperation()
    {
        var studyId = Guid.NewGuid();

        var deriveMock = new Mock<ICountyStudySegmentDerivationService>();
        deriveMock
            .Setup(d => d.DeriveAsync(studyId, It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException($"Study {studyId} not found"));

        var resolver      = new Mock<ICountyResolver>();
        var svcMock       = new Mock<ICountyStudyService>();
        var healthMock    = new Mock<ICountyStudyHealthService>();
        var inspectorMock = new Mock<ICountyStudyInspectorService>();
        var aiMock        = new Mock<ICountyStudioAiService>();
        var controller = new CountyStudyController(
            svcMock.Object,
            resolver.Object,
            deriveMock.Object,
            healthMock.Object,
            inspectorMock.Object,
            aiMock.Object,
            NullLogger<CountyStudyController>.Instance);

        var result = await controller.DeriveSegments(studyId, CancellationToken.None);

        var bad = Assert.IsType<BadRequestObjectResult>(result);
        Assert.Equal(400, bad.StatusCode);
    }

    [Fact]
    public async Task DeriveSegments_Returns200_WithDerivationResult()
    {
        var studyId = Guid.NewGuid();
        var expected = new SegmentDerivationResult(
            SegmentSetId:              Guid.NewGuid(),
            SegmentCount:              4,
            TotalParcels:              100,
            SegmentsWithRatios:        3,
            SegmentsWithIaaoExceptions: 1);

        var deriveMock = new Mock<ICountyStudySegmentDerivationService>();
        deriveMock
            .Setup(d => d.DeriveAsync(studyId, It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(expected);

        var resolver      = new Mock<ICountyResolver>();
        var svcMock       = new Mock<ICountyStudyService>();
        var healthMock    = new Mock<ICountyStudyHealthService>();
        var inspectorMock = new Mock<ICountyStudyInspectorService>();
        var aiMock        = new Mock<ICountyStudioAiService>();
        var controller = new CountyStudyController(
            svcMock.Object,
            resolver.Object,
            deriveMock.Object,
            healthMock.Object,
            inspectorMock.Object,
            aiMock.Object,
            NullLogger<CountyStudyController>.Instance);

        var result = await controller.DeriveSegments(studyId, CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(result);
        var dto = Assert.IsType<SegmentDerivationResult>(ok.Value);
        Assert.Equal(expected.SegmentSetId,              dto.SegmentSetId);
        Assert.Equal(expected.SegmentCount,              dto.SegmentCount);
        Assert.Equal(expected.SegmentsWithIaaoExceptions, dto.SegmentsWithIaaoExceptions);
    }
}
