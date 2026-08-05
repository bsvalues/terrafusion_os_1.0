using System.Text.Json;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Moq;
using TerraFusion.API.Configuration;
using TerraFusion.API.Services.Valuation;
using TerraFusion.API.Services.Valuation.KernelContracts;
using Xunit;

namespace TerraFusion.API.Tests.Services.Valuation;

public class ValuationKernelClientTests
{
    [Fact]
    public async Task ValuateAsync_PassesValuateActionToHost()
    {
        var host = new Mock<IRustKernelProcessHost>();
        host
            .Setup(h => h.InvokeAsync<ValuationKernelPayload, ValuationKernelResult>(
                It.IsAny<string>(), It.IsAny<string>(),
                It.IsAny<KernelInvocation<ValuationKernelPayload>>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new KernelInvocationResult<ValuationKernelResult>(
                true, "terraforge.kernel.valuation", "git:abc", "hash",
                DateTimeOffset.UtcNow, DateTimeOffset.UtcNow, 10,
                new ValuationKernelResult(100.0, new ValuationComponents(30.0, 70.0)),
                null, Array.Empty<string>(), null, null));

        var opts = Options.Create(new RustKernelsOptions
        {
            ValuationKernelPath = @"C:\tf-tests\fake\valuation.exe",
        });

        var sut = new ValuationKernelClient(host.Object, opts, NullLogger<ValuationKernelClient>.Instance);

        var payload = new ValuationKernelPayload(
            new ValuationSubject("P1", JsonDocument.Parse("{}").RootElement),
            new ValuationCostBreakdown(100, 10, 90),
            new ValuationModel(30, null));

        var result = await sut.ValuateAsync(payload);

        Assert.True(result.Success);
        host.Verify(h => h.InvokeAsync<ValuationKernelPayload, ValuationKernelResult>(
            Path.GetFullPath(@"C:\tf-tests\fake\valuation.exe"),
            "terraforge.kernel.valuation",
            It.Is<KernelInvocation<ValuationKernelPayload>>(i => i.Action == "valuate"),
            It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task ValuateAsync_PreservesCallerOwnedRequestIdentity()
    {
        var host = new Mock<IRustKernelProcessHost>();
        host.Setup(h => h.InvokeAsync<ValuationKernelPayload, ValuationKernelResult>(
                It.IsAny<string>(), It.IsAny<string>(),
                It.IsAny<KernelInvocation<ValuationKernelPayload>>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new KernelInvocationResult<ValuationKernelResult>(
                true, "terraforge.kernel.valuation", "git:abc", "hash",
                DateTimeOffset.UtcNow, DateTimeOffset.UtcNow, 1,
                new(1, new(0, 1)), null, Array.Empty<string>(), null, null));
        var sut = new ValuationKernelClient(
            host.Object,
            Options.Create(new RustKernelsOptions { ValuationKernelPath = "valuation.exe" }),
            NullLogger<ValuationKernelClient>.Instance);
        var payload = new ValuationKernelPayload(
            new("P1", JsonDocument.Parse("{}").RootElement.Clone()),
            new(1, 0, 1),
            new(0, null));

        await sut.ValuateAsync(payload, KernelExecutionContext.Create("corr-owned-001"));

        host.Verify(h => h.InvokeAsync<ValuationKernelPayload, ValuationKernelResult>(
            It.IsAny<string>(), "terraforge.kernel.valuation",
            It.Is<KernelInvocation<ValuationKernelPayload>>(invocation =>
                invocation.RequestId == "corr-owned-001"),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Theory]
    [InlineData("")]
    [InlineData("unsafe value")]
    [InlineData("unsafe/value")]
    public void KernelExecutionContext_RejectsUnsafeIdentity(string value)
        => Assert.Throws<InvalidOperationException>(() => KernelExecutionContext.Create(value));
}
