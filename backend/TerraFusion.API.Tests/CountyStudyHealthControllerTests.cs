// backend/TerraFusion.API.Tests/CountyStudyHealthControllerTests.cs
//
// Task C — HTTP shape tests for GET /api/county-study/studies/{id}/health-summary.
// Service layer is mocked; the real CountyStudyHealthService is exercised in
// CountyStudyHealthServiceTests.

using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using TerraFusion.API.Controllers;
using TerraFusion.Core.DTOs;
using TerraFusion.Core.Interfaces;
using TerraFusion.Core.Services;
using Xunit;
using Task = System.Threading.Tasks.Task;

namespace TerraFusion.API.Tests;

public sealed class CountyStudyHealthControllerTests
{
    private static CountyStudyController BuildController(ICountyStudyHealthService healthSvc)
    {
        var svc      = new Mock<ICountyStudyService>();
        var resolver = new Mock<ICountyResolver>();
        resolver
            .Setup(r => r.ResolveAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns<string, CancellationToken>((s, _) => Task.FromResult(Guid.Parse(s)));
        var derive    = new Mock<ICountyStudySegmentDerivationService>();
        var inspector = new Mock<ICountyStudyInspectorService>();
        var ai        = new Mock<ICountyStudioAiService>();

        return new(svc.Object, resolver.Object, derive.Object, healthSvc,
            inspector.Object, ai.Object, NullLogger<CountyStudyController>.Instance);
    }

    private static CountyHealthSummaryDto BuildSampleDto() => new(
        StudyId: Guid.NewGuid(),
        CountyId: Guid.NewGuid(),
        TaxYear: 2026,
        ParcelCount: 89_247,
        RatioCount: 1_240,
        MedianRatio: 0.96m,
        Cod: 12.3m,
        Prd: 1.01m,
        StabilityScore: 85m,
        RiskScore: 22m,
        ExceptionCount: 8,
        ComplianceStatus: nameof(CountyHealthComplianceStatus.IaaoCompliant),
        TopAlerts: new List<HealthAlertDto>
        {
            new(
                SegmentId: Guid.NewGuid(),
                SegmentName: "NBHD-K1 · R1 · GOOD",
                NeighborhoodCode: "NBHD-K1",
                City: "Kennewick",
                ParcelCount: 120,
                MedianRatio: 0.82m,
                Cod: 27.4m,
                Prd: 1.04m,
                ExceptionCount: 12,
                CompositeRisk: 42.8m,
                Reasons: new List<string> { "median 0.82 outside fair range (0.90–1.10)", "COD 27.4 exceeds IAAO ceiling (20)" }
            ),
        },
        CriticalCount: 1,
        WarningCount: 3,
        HealthyCount: 8,
        DerivedAt: DateTime.UtcNow);

    [Fact]
    public async Task HealthSummaryController_Returns200_WithDto()
    {
        var healthMock = new Mock<ICountyStudyHealthService>();
        var expected   = BuildSampleDto();
        healthMock
            .Setup(h => h.GetHealthSummaryAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(expected);

        var controller = BuildController(healthMock.Object);
        var result = await controller.GetHealthSummary(expected.StudyId, CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(result);
        var dto = Assert.IsType<CountyHealthSummaryDto>(ok.Value);
        Assert.Equal(expected.StudyId, dto.StudyId);
        Assert.Equal(expected.RatioCount, dto.RatioCount);
        Assert.Equal(nameof(CountyHealthComplianceStatus.IaaoCompliant), dto.ComplianceStatus);
        Assert.Single(dto.TopAlerts);
    }

    [Fact]
    public async Task HealthSummaryController_Returns409_WhenNoActiveSegmentSet()
    {
        var healthMock = new Mock<ICountyStudyHealthService>();
        healthMock
            .Setup(h => h.GetHealthSummaryAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("Study x has no active segment set. Derive first."));

        var controller = BuildController(healthMock.Object);
        var result = await controller.GetHealthSummary(Guid.NewGuid(), CancellationToken.None);

        var conflict = Assert.IsType<ConflictObjectResult>(result);
        Assert.Equal(409, conflict.StatusCode);
    }

    [Fact]
    public async Task HealthSummaryController_Returns400_ForOtherInvalidOperations()
    {
        var healthMock = new Mock<ICountyStudyHealthService>();
        healthMock
            .Setup(h => h.GetHealthSummaryAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("Study Guid.NewGuid not found"));

        var controller = BuildController(healthMock.Object);
        var result = await controller.GetHealthSummary(Guid.NewGuid(), CancellationToken.None);

        var bad = Assert.IsType<BadRequestObjectResult>(result);
        Assert.Equal(400, bad.StatusCode);
    }

    [Fact]
    public async Task HealthSummaryController_Returns500_OnUnhandledException()
    {
        var healthMock = new Mock<ICountyStudyHealthService>();
        healthMock
            .Setup(h => h.GetHealthSummaryAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new Exception("boom"));

        var controller = BuildController(healthMock.Object);
        var result = await controller.GetHealthSummary(Guid.NewGuid(), CancellationToken.None);

        var status = Assert.IsType<ObjectResult>(result);
        Assert.Equal(500, status.StatusCode);
    }
}
