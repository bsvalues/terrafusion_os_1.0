using System.Collections.Generic;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Moq;
using TerraFusion.API.Configuration;
using TerraFusion.API.Services.Valuation;
using TerraFusion.API.Services.Valuation.KernelContracts;
using Xunit;

namespace TerraFusion.API.Tests.Services.Valuation;

public class CostKernelClientTests
{
    [Fact]
    public async Task CalculateCostAsync_PassesActionAndPayloadToHost()
    {
        var host = new Mock<IRustKernelProcessHost>();
        host
            .Setup(h => h.InvokeAsync<CostKernelPayload, CostKernelResult>(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<KernelInvocation<CostKernelPayload>>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new KernelInvocationResult<CostKernelResult>(
                Success: true,
                KernelName: "terraforge.kernel.cost",
                KernelVersion: "git:abc123",
                InputHash: "hash",
                StartedAt: DateTimeOffset.UtcNow,
                CompletedAt: DateTimeOffset.UtcNow,
                DurationMs: 42,
                Data: new CostKernelResult(100.0, 10.0, 90.0),
                AuditEvent: null,
                Warnings: Array.Empty<string>(),
                FailureMode: null,
                ErrorMessage: null));

        var opts = Options.Create(new RustKernelsOptions
        {
            CostKernelPath = "/fake/path/cost.exe",
            ContractPackVersion = "1.0.0",
            ModuleApiVersion = "1.0.0",
        });

        var sut = new CostKernelClient(host.Object, opts, NullLogger<CostKernelClient>.Instance);

        var payload = new CostKernelPayload(
            new CostSubject("P1", new CostAttributes(1000.0, "GOOD", "AVERAGE")),
            new CostTables(100.0, new Dictionary<string, double> { ["GOOD"] = 1.0 }));

        var result = await sut.CalculateCostAsync(payload);

        Assert.True(result.Success);
        host.Verify(h => h.InvokeAsync<CostKernelPayload, CostKernelResult>(
            "/fake/path/cost.exe",
            "terraforge.kernel.cost",
            It.Is<KernelInvocation<CostKernelPayload>>(i =>
                i.Action == "calculate_cost" &&
                i.ContractPackVersion == "1.0.0" &&
                i.ModuleApiVersion == "1.0.0" &&
                i.Payload == payload &&
                !string.IsNullOrEmpty(i.RequestId)),
            It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task CalculateCostAsync_GeneratesUniqueRequestIdPerCall()
    {
        var captured = new List<string>();
        var host = new Mock<IRustKernelProcessHost>();
        host
            .Setup(h => h.InvokeAsync<CostKernelPayload, CostKernelResult>(
                It.IsAny<string>(), It.IsAny<string>(),
                It.IsAny<KernelInvocation<CostKernelPayload>>(),
                It.IsAny<CancellationToken>()))
            .Callback<string, string, KernelInvocation<CostKernelPayload>, CancellationToken>(
                (_, _, inv, _) => captured.Add(inv.RequestId))
            .ReturnsAsync(new KernelInvocationResult<CostKernelResult>(
                true, "cost", null, "h", DateTimeOffset.UtcNow, DateTimeOffset.UtcNow, 1,
                new CostKernelResult(1, 1, 1), null, Array.Empty<string>(), null, null));

        var opts = Options.Create(new RustKernelsOptions { CostKernelPath = "x" });
        var sut = new CostKernelClient(host.Object, opts, NullLogger<CostKernelClient>.Instance);

        var payload = new CostKernelPayload(
            new CostSubject("P", new CostAttributes(1, null, null)),
            new CostTables(1, new Dictionary<string, double>()));

        await sut.CalculateCostAsync(payload);
        await sut.CalculateCostAsync(payload);

        Assert.Equal(2, captured.Count);
        Assert.NotEqual(captured[0], captured[1]);
    }
}
