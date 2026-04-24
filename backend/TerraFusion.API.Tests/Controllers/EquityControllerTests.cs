using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using TerraFusion.API.Controllers;
using TerraFusion.Core.DTOs;
using TerraFusion.Core.Interfaces;
using Xunit;

namespace TerraFusion.API.Tests.Controllers;

public class EquityControllerTests
{
    private static EquityController BuildController(
        IEquityMetricService? equity = null,
        IRollupService? rollup = null,
        IBentonCustomMetricService? custom = null)
    {
        equity ??= Mock.Of<IEquityMetricService>(m =>
            m.GetMetricsAsync(
                It.IsAny<Guid>(),
                It.IsAny<int>(),
                It.IsAny<string>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>())
            == Task.FromResult<IDictionary<string, EquityMetricsDto>>(
                new Dictionary<string, EquityMetricsDto>()));

        rollup ??= Mock.Of<IRollupService>();
        custom ??= Mock.Of<IBentonCustomMetricService>();

        return new EquityController(
            equity,
            rollup,
            custom,
            NullLogger<EquityController>.Instance);
    }

    [Fact]
    public async Task GetMetrics_invalid_stratum_returns_400()
    {
        var ctrl = BuildController();
        var result = await ctrl.GetMetrics(Guid.NewGuid(), 2026, "bogus", null, default);
        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Fact]
    public async Task GetMetrics_valid_stratum_returns_200()
    {
        var ctrl = BuildController();
        var result = await ctrl.GetMetrics(Guid.NewGuid(), 2026, "county", null, default);
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task GetMetrics_empty_countyId_returns_400()
    {
        var ctrl = BuildController();
        var result = await ctrl.GetMetrics(Guid.Empty, 2026, "county", null, default);
        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Fact]
    public async Task GetMetrics_out_of_range_taxYear_returns_400()
    {
        var ctrl = BuildController();
        var result = await ctrl.GetMetrics(Guid.NewGuid(), 1999, "county", null, default);
        Assert.IsType<BadRequestObjectResult>(result);
    }
}
