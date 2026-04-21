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
using Xunit;
using Task = System.Threading.Tasks.Task;

namespace TerraFusion.API.Tests;

public class CountyStudyControllerTests
{
    private static CountyStudyController BuildController(ICountyStudyService svc) =>
        new(svc, NullLogger<CountyStudyController>.Instance);

    // ── Studies ───────────────────────────────────────────────────────────────

    [Fact]
    public async Task CreateStudy_Returns201_WithCreatedDto()
    {
        var countyId = Guid.NewGuid();
        var studyId  = Guid.NewGuid();

        var expected = new CountyStudySessionDto(
            studyId, countyId, 2026,
            nameof(StudyType.RatioStudy), nameof(StudyStatus.Draft),
            null, null,
            DateTime.UtcNow, "system");

        var svcMock = new Mock<ICountyStudyService>();
        svcMock.Setup(s => s.CreateStudyAsync(It.IsAny<CreateStudyRequest>(), It.IsAny<string>()))
               .ReturnsAsync(expected);

        var controller = BuildController(svcMock.Object);
        var req        = new CreateStudyRequest(countyId, 2026, StudyType.RatioStudy, null);

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
            new(Guid.NewGuid(), countyId, 2026, nameof(StudyType.RatioStudy), nameof(StudyStatus.Draft),
                null, null, DateTime.UtcNow, "system"),
            new(Guid.NewGuid(), countyId, 2025, nameof(StudyType.MassAppraisal), nameof(StudyStatus.Active),
                null, null, DateTime.UtcNow.AddYears(-1), "system")
        };

        var svcMock = new Mock<ICountyStudyService>();
        svcMock.Setup(s => s.GetStudiesAsync(countyId))
               .ReturnsAsync(studies);

        var controller = BuildController(svcMock.Object);

        var result = await controller.GetStudies(countyId);

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

        Assert.Equal(201, (result as ObjectResult)?.StatusCode);
        var dto = Assert.IsType<CountyCohortDto>((result as ObjectResult)!.Value);
        Assert.Equal(cohortId, dto.CohortId);
        Assert.Equal(studyId, dto.StudyId);
        Assert.Equal(842, dto.ParcelCount);
    }
}
