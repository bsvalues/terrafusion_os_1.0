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
}
