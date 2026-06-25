using System.Collections.Generic;
using System.Text.Json;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using TerraFusion.API.Services.Valuation;
using TerraFusion.API.Services.Valuation.KernelContracts;
using TerraFusion.Abstractions.DTOs.Kernel;
using Xunit;

namespace TerraFusion.API.Tests.Services.Valuation;

public class KernelValuationServiceTests
{
    private static KernelInvocationResult<CostKernelResult> MakeCostOk(double rcnld = 90.0) =>
        new(true, "terraforge.kernel.cost", "git:cost-sha", "hash-c",
            DateTimeOffset.UtcNow, DateTimeOffset.UtcNow, 5,
            new CostKernelResult(100.0, 10.0, rcnld),
            new KernelAuditEvent("ce-1", "t", "system", "calculate_cost", "P1", "terraforge.kernel.cost", "git:cost-sha"),
            Array.Empty<string>(), null, null);

    private static KernelInvocationResult<ValuationKernelResult> MakeValOk(double total = 150.0) =>
        new(true, "terraforge.kernel.valuation", "git:val-sha", "hash-v",
            DateTimeOffset.UtcNow, DateTimeOffset.UtcNow, 5,
            new ValuationKernelResult(total, new ValuationComponents(50.0, total - 50.0)),
            new KernelAuditEvent("ve-1", "t", "system", "valuate", "P1", "terraforge.kernel.valuation", "git:val-sha"),
            Array.Empty<string>(), null, null);

    [Fact]
    public async Task ComputeCostWithKernelAsync_ChainsCostThenValuation()
    {
        var cost = new Mock<ICostKernelClient>();
        var valn = new Mock<IValuationKernelClient>();
        cost.Setup(c => c.CalculateCostAsync(It.IsAny<CostKernelPayload>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(MakeCostOk(rcnld: 90.0));
        valn.Setup(v => v.ValuateAsync(It.IsAny<ValuationKernelPayload>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(MakeValOk(total: 150.0));

        var sut = new KernelValuationService(cost.Object, valn.Object, NullLogger<KernelValuationService>.Instance);

        var req = new KernelCostApproachRequest(
            ParcelId: "P1", Sqft: 1850.0, Quality: "GOOD", Condition: "AVERAGE",
            BaseRate: 145.50,
            Modifiers: new Dictionary<string, double> { ["GOOD"] = 1.15 },
            LandValue: 65000.0,
            NeighborhoodFactor: 1.05, LocationFactor: 0.98);

        var result = await sut.ComputeCostWithKernelAsync(req);

        Assert.Equal("P1", result.ParcelId);
        Assert.Equal(90.0, result.Rcnld);
        Assert.Equal(150.0, result.TotalValue);
        Assert.Equal("git:cost-sha", result.Provenance.CostKernelHash);
        Assert.Equal("git:val-sha", result.Provenance.ValuationKernelHash);

        // Verify the valuation kernel receives the cost kernel's rcnld as input — wire check.
        valn.Verify(v => v.ValuateAsync(
            It.Is<ValuationKernelPayload>(p => p.CostBreakdown.Rcnld == 90.0),
            It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task ComputeCostWithKernelAsync_ThrowsWhenCostKernelFails()
    {
        var cost = new Mock<ICostKernelClient>();
        var valn = new Mock<IValuationKernelClient>();
        cost.Setup(c => c.CalculateCostAsync(It.IsAny<CostKernelPayload>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new KernelInvocationResult<CostKernelResult>(
                false, "terraforge.kernel.cost", null, "h",
                DateTimeOffset.UtcNow, DateTimeOffset.UtcNow, 1,
                null, null, Array.Empty<string>(),
                KernelFailureMode.KernelReportedError, "boom"));

        var sut = new KernelValuationService(cost.Object, valn.Object, NullLogger<KernelValuationService>.Instance);

        var req = new KernelCostApproachRequest(
            "P1", 1000, null, null, 100, new Dictionary<string, double>(), 0, null, null);

        var ex = await Assert.ThrowsAsync<KernelValuationException>(
            () => sut.ComputeCostWithKernelAsync(req));
        Assert.Contains("boom", ex.Message);
        Assert.Equal(KernelFailureMode.KernelReportedError, ex.FailureMode);

        // Valuation kernel must not be called when cost fails.
        valn.Verify(v => v.ValuateAsync(It.IsAny<ValuationKernelPayload>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }
}
