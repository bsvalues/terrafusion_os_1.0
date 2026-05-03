using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using TerraFusion.API.Controllers;
using TerraFusion.API.Services.Valuation;
using TerraFusion.API.Tests.TestHelpers;
using TerraFusion.Core.DTOs.Kernel;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Services;
using Xunit;

namespace TerraFusion.API.Tests.Controllers;

public sealed class CostForgeBatchKernelTests : IDisposable
{
    private static readonly Guid CountyId = Guid.Parse("19190019-1919-1919-1919-191919191919");
    private static readonly Guid PropertyGuid = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

    private readonly TerraFusion.Data.TerraFusionDbContext _db;

    public CostForgeBatchKernelTests()
    {
        _db = TestDbContextFactory.CreateInMemoryContext(nameof(CostForgeBatchKernelTests));
        _db.Counties.Add(new County
        {
            Id = CountyId,
            Name = "Benton County",
            FipsCode = "005",
            State = "WA",
        });
        _db.Properties.Add(new Property
        {
            Id = PropertyGuid,
            PropertyId = "PROP-001",
            ParcelId = "PARCEL-001",
            ParcelNumber = "PARCEL-001",
            Address = "123 Kernel Way",
            CountyId = CountyId,
            TaxYear = 2026,
            LandValue = 65_000m,
            ImprovementValue = 100_000m,
            AssessedValue = 165_000m,
            MarketValue = 165_000m,
            AssessmentDate = DateTime.UtcNow,
            LastUpdated = DateTime.UtcNow,
        });
        _db.SaveChanges();
    }

    [Fact]
    public async System.Threading.Tasks.Task BatchCalculate_UsesRustKernelServiceAndEmitsArtifactProvenance()
    {
        var costForgeService = new Mock<ICostForgeService>(MockBehavior.Strict);
        var kernelService = new Mock<IKernelValuationService>(MockBehavior.Strict);
        var auditLogger = new Mock<TerraFusion.Abstractions.Interfaces.IAuditLogger>();
        auditLogger
            .Setup(a => a.LogUserActionAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string?>()))
            .Returns(System.Threading.Tasks.Task.CompletedTask);

        var costBinary = new string('a', 64);
        var valuationBinary = new string('b', 64);
        kernelService
            .Setup(k => k.ComputeCostWithKernelAsync(
                It.Is<KernelCostApproachRequest>(r =>
                    r.ParcelId == "PARCEL-001" &&
                    r.Sqft == 1850d &&
                    r.BaseRate == 145.5d &&
                    r.LandValue == 65000d &&
                    r.Modifiers["GOOD"] == 1.15d &&
                    r.Modifiers["AVERAGE"] == 1.0d &&
                    r.Modifiers["DepreciationRate"] == 0.10d),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new KernelCostApproachResponse(
                ParcelId: "PARCEL-001",
                ReplacementCost: 309_551.25,
                Depreciation: 30_955.125,
                Rcnld: 278_596.125,
                LandValue: 65_000,
                BuildingValue: 286_675.49325,
                TotalValue: 351_675.49325,
                Provenance: new KernelProvenance(
                    CostKernelHash: "git:costsha1234",
                    ValuationKernelHash: "git:valsha12345",
                    CostInputHash: new string('c', 64),
                    ValuationInputHash: new string('d', 64),
                    CostDurationMs: 3,
                    ValuationDurationMs: 4,
                    CostAuditEventId: "cost-event",
                    ValuationAuditEventId: "valuation-event",
                    CostKernelBinarySha256: costBinary,
                    ValuationKernelBinarySha256: valuationBinary)));

        var services = new ServiceCollection()
            .AddSingleton(kernelService.Object)
            .BuildServiceProvider();

        var controller = new CostForgeController(
            costForgeService.Object,
            Mock.Of<ICostForgeAIService>(),
            _db,
            auditLogger.Object,
            NullLogger<CostForgeController>.Instance)
        {
            ControllerContext = ControllerTestSetup.WithCountyClaim(CountyId),
        };
        controller.HttpContext.RequestServices = services;

        var result = await controller.BatchCalculateValuations(new BatchValuationRequestDto
        {
            CountyId = "BENTON",
            PropertyIds = [PropertyGuid],
            Parameters = new Dictionary<string, object>
            {
                ["sqft"] = 1850d,
                ["baseRate"] = 145.5d,
                ["landValue"] = 65000d,
                ["quality"] = "GOOD",
                ["condition"] = "AVERAGE",
                ["modifiers"] = new Dictionary<string, object>
                {
                    ["GOOD"] = 1.15d,
                    ["AVERAGE"] = 1.0d,
                    ["DepreciationRate"] = 0.10d,
                },
            },
        });

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var payload = Assert.IsType<BatchValuationResultDto>(ok.Value);
        Assert.Equal(1, payload.SuccessfulCalculations);
        Assert.Empty(payload.Errors);
        var valuation = Assert.Single(payload.Results);
        Assert.Equal(PropertyGuid, valuation.PropertyId);
        Assert.Equal(351_675.49325m, valuation.EstimatedValue);
        Assert.Contains("engine=terraforge-rust-kernel-v1.2", valuation.CalculationFactors);
        Assert.Equal(costBinary, valuation.Provenance["costBinarySha256"]);
        Assert.Equal(valuationBinary, valuation.Provenance["valuationBinarySha256"]);

        costForgeService.Verify(s => s.AnalyzeCostAsync(It.IsAny<Guid>()), Times.Never);
        kernelService.VerifyAll();
    }

    public void Dispose() => _db.Dispose();
}
