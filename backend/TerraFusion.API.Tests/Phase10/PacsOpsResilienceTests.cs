// =============================================================================
// PacsOpsResilienceTests
// =============================================================================
// Regression guard: PacsOpsController must return a valid PacsProofResponse
// (never HTTP 500) even when IPacsAdapter is unavailable or throws on
// construction (e.g. missing PACS connection string in dev).
//
// Bug fixed: constructor-injection of IPacsAdapter caused DI activation failure
// → HTTP 500 on all /ops/pacs/* requests in dev environments without SQL Server.
// Fix: lazy IServiceProvider resolution per-request (mirrors PacsController pattern).
// =============================================================================

using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using TerraFusion.API.Controllers;
using TerraFusion.Core.PACS;
using Xunit;

namespace TerraFusion.API.Tests.Phase10;

public sealed class PacsOpsResilienceTests
{
    // ── helpers ────────────────────────────────────────────────────────

    /// <summary>
    /// Build an IServiceProvider that has NO IPacsAdapter registered.
    /// Simulates a dev env where PacsSqlAdapter threw during construction.
    /// </summary>
    private static IServiceProvider ServiceProviderWithoutAdapter()
    {
        var services = new ServiceCollection();
        services.AddLogging();
        return services.BuildServiceProvider();
    }

    /// <summary>
    /// Build an IServiceProvider with a mock IPacsAdapter that throws
    /// PacsContractViolationException from every method it's called on.
    /// </summary>
    private static IServiceProvider ServiceProviderWithBrokenAdapter()
    {
        var mock = new Mock<IPacsAdapter>();

        mock.Setup(a => a.ValidateContractAsync(It.IsAny<CancellationToken>()))
            .ThrowsAsync(new PacsContractViolationException(
                PacsErrorCodes.ConnectionFailed,
                "PACS connection string not configured."));

        mock.Setup(a => a.GetConnectionStatusAsync(It.IsAny<CancellationToken>()))
            .ThrowsAsync(new PacsContractViolationException(
                PacsErrorCodes.ConnectionFailed,
                "PACS connection string not configured."));

        var services = new ServiceCollection();
        services.AddLogging();
        services.AddSingleton(mock.Object);
        return services.BuildServiceProvider();
    }

    private static PacsOpsController BuildController(IServiceProvider sp) =>
        new(sp, NullLogger<PacsOpsController>.Instance);

    // ── GetProof ───────────────────────────────────────────────────────

    [Fact]
    public async Task GetProof_WhenAdapterNotRegistered_ReturnsOkWithContractValidFalse()
    {
        // Regression: previously this path caused a 500 due to DI activation failure
        var controller = BuildController(ServiceProviderWithoutAdapter());

        var result = await controller.GetProof(CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(result);
        var proof = Assert.IsType<PacsProofResponse>(ok.Value);
        Assert.False(proof.ContractValid,
            "ContractValid must be false when adapter is unavailable");
        Assert.NotEmpty(proof.Errors);
    }

    [Fact]
    public async Task GetProof_WhenAdapterThrowsOnValidate_ReturnsOkWithContractValidFalse()
    {
        var controller = BuildController(ServiceProviderWithBrokenAdapter());

        var result = await controller.GetProof(CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(result);
        var proof = Assert.IsType<PacsProofResponse>(ok.Value);
        Assert.False(proof.ContractValid);
        Assert.NotEmpty(proof.Errors);
    }

    [Fact]
    public async Task GetProof_WhenAdapterThrows_NeverReturns500()
    {
        var controller = BuildController(ServiceProviderWithBrokenAdapter());

        var result = await controller.GetProof(CancellationToken.None);

        // Must not throw. Must not be a status 500.
        var ok = result as OkObjectResult;
        var status = result as StatusCodeResult;
        var objectResult = result as ObjectResult;

        if (ok != null) return; // HTTP 200 — pass

        // Any non-200 would be a ObjectResult with a StatusCode
        if (objectResult != null)
        {
            Assert.NotEqual(500, objectResult.StatusCode);
        }
    }

    // ── Ping ──────────────────────────────────────────────────────────

    [Fact]
    public async Task Ping_WhenAdapterNotRegistered_ReturnsOkWithErrorField()
    {
        var controller = BuildController(ServiceProviderWithoutAdapter());

        var result = await controller.Ping(CancellationToken.None);

        // Must return a valid response, not throw or 500
        var ok = Assert.IsType<OkObjectResult>(result);
        Assert.NotNull(ok.Value);
    }
}
