using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using TerraFusion.CurrentUse.Controllers;
using TerraFusion.CurrentUse.DTOs;
using TerraFusion.CurrentUse.Services;
using Xunit;

namespace TerraFusion.CurrentUse.Tests;

/// <summary>
/// Controller-level tests verifying HTTP response codes and routing behavior.
/// Uses mocked services to isolate controller logic.
/// </summary>
public class CurrentUseControllerTests
{
    private readonly Mock<IClassificationService> _classificationsMock = new();
    private readonly Mock<IRollbackCalculationService> _rollbackMock = new();
    private readonly Mock<IInterestService> _interestMock = new();
    private readonly Mock<IRemovalService> _removalsMock = new();
    private readonly Mock<IPenaltyExceptionService> _penaltyMock = new();
    private readonly Mock<ILogger<CurrentUseController>> _loggerMock = new();

    private CurrentUseController CreateController() => new(
        _classificationsMock.Object,
        _rollbackMock.Object,
        _interestMock.Object,
        _removalsMock.Object,
        _penaltyMock.Object,
        _loggerMock.Object
    );

    [Fact]
    public async Task ListClassifications_ReturnsOk()
    {
        _classificationsMock.Setup(s => s.ListAsync(null, null, 1, 50, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ClassificationsResponse(0, 1, 50, new List<ClassificationDto>()));

        var controller = CreateController();
        var result = await controller.ListClassifications(null, null, 1, 50);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task GetClassification_NotFound_Returns404()
    {
        _classificationsMock.Setup(s => s.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((ClassificationDto?)null);

        var controller = CreateController();
        var result = await controller.GetClassification(Guid.NewGuid(), CancellationToken.None);

        result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task GetClassification_Found_ReturnsOk()
    {
        var dto = new ClassificationDto(
            Guid.NewGuid(), "P-001", "DFL", "Test", "2020-01-01", "Active",
            80m, 450000m, 52000m, 4200m, "benton"
        );
        _classificationsMock.Setup(s => s.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(dto);

        var controller = CreateController();
        var result = await controller.GetClassification(dto.Id, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
        var ok = (OkObjectResult)result;
        ok.Value.Should().Be(dto);
    }

    [Fact]
    public async Task CreateClassification_ReturnsCreated()
    {
        var dto = new ClassificationDto(
            Guid.NewGuid(), "NEW-001", "CUFA", "New", "2026-01-01", "Active",
            100m, 500000m, 80000m, 5000m, "benton"
        );
        _classificationsMock.Setup(s => s.CreateAsync(It.IsAny<ClassificationCreateRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(dto);

        var controller = CreateController();
        var request = new ClassificationCreateRequest("NEW-001", "CUFA", "New", new DateOnly(2026, 1, 1), 100m, 500000m, 80000m);
        var result = await controller.CreateClassification(request, CancellationToken.None);

        result.Should().BeOfType<CreatedAtActionResult>();
    }

    [Fact]
    public async Task CalculateRollback_ReturnsOk()
    {
        var rollbackResult = new RollbackResult(100000m, 5000m, 20000m, 125000m,
            new List<YearBreakdown>(), true, false, null);
        _rollbackMock.Setup(s => s.CalculateAsync(It.IsAny<RollbackCalculationRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(rollbackResult);

        var controller = CreateController();
        var request = new RollbackCalculationRequest("P-001", "CUFA", 2020, 2025,
            new Dictionary<string, decimal>(), new Dictionary<string, decimal>(), null);
        var result = await controller.CalculateRollback(request, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task CalculateInterest_InvalidPrincipal_ReturnsBadRequest()
    {
        var controller = CreateController();
        var result = await controller.CalculateInterest(0, 2020, 2025, CancellationToken.None);

        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task CalculateInterest_InvalidYears_ReturnsBadRequest()
    {
        var controller = CreateController();
        var result = await controller.CalculateInterest(10000m, 2025, 2020, CancellationToken.None);

        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task CalculateInterest_ValidParams_ReturnsOk()
    {
        var calcResult = new InterestCalcResult(10000m, 800m, 10800m, 2023, 2024,
            new List<InterestYearBreakdown> { new(2024, 0.08m, 800m, 800m) });
        _interestMock.Setup(s => s.CalculateAsync(10000m, 2023, 2024, It.IsAny<CancellationToken>()))
            .ReturnsAsync(calcResult);

        var controller = CreateController();
        var result = await controller.CalculateInterest(10000m, 2023, 2024, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task EvaluatePenaltyExceptions_MissingParcelId_ReturnsBadRequest()
    {
        var controller = CreateController();
        var result = await controller.EvaluatePenaltyExceptions("", CancellationToken.None);

        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task EvaluatePenaltyExceptions_ValidParcel_ReturnsOk()
    {
        _penaltyMock.Setup(s => s.EvaluateAsync("P-001", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<PenaltyExceptionDto>());

        var controller = CreateController();
        var result = await controller.EvaluatePenaltyExceptions("P-001", CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task ListRemovals_ReturnsOk()
    {
        _removalsMock.Setup(s => s.ListAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<RemovalDto>());

        var controller = CreateController();
        var result = await controller.ListRemovals(CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task InitiateRemoval_ReturnsCreated()
    {
        var dto = new RemovalDto(Guid.NewGuid(), "P-001", "DFL", "Test", "2026-01-01",
            "Pending", null, null, null, null, null);
        _removalsMock.Setup(s => s.InitiateAsync(It.IsAny<RemovalInitiateRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(dto);

        var controller = CreateController();
        var request = new RemovalInitiateRequest("P-001", "DFL", "Test", null);
        var result = await controller.InitiateRemoval(request, CancellationToken.None);

        result.Should().BeOfType<CreatedAtActionResult>();
    }
}
