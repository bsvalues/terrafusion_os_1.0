using System.Security.Cryptography;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using TerraFusion.API.Services.Valuation;
using TerraFusion.API.Services.Valuation.KernelContracts;
using TerraFusion.Core.DTOs;
using TerraFusion.Core.Entities.Forge;
using Xunit;
using ForgeCostFactor = TerraFusion.Core.Entities.Forge.CostFactor;

namespace TerraFusion.API.Tests.Services.Valuation;

public class ForgeCanonicalCostConsumerTests
{
    private static readonly Guid CountyId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private const string ParcelId = "P-100";
    private const string Source = "git:24059c3642339f36877cb454ca63683180915b71";

    [Fact]
    public async Task ConsumeAsync_PreservesIdentityAndReturnsBoundedEvidence()
    {
        var kernel = SuccessfulKernel();
        var sut = new ForgeCanonicalCostConsumer(kernel.Object);

        var result = await sut.ConsumeAsync(CreateRequest());

        Assert.Equal("corr-100", result.Evidence.RequestId);
        Assert.Equal(Source, result.Evidence.SourceIdentity);
        Assert.Equal(162950m, result.Value.TotalValue);
        Assert.Matches("^[a-f0-9]{64}$", result.Evidence.FactSnapshotSha256);
        kernel.Verify(client => client.ValuateAsync(
            It.Is<ValuationKernelPayload>(payload =>
                payload.Subject.ParcelId == ParcelId
                && payload.CostBreakdown.ReplacementCost == 125500d
                && payload.Model.LandValue == 50000d
                && payload.Model.AdjustmentFactors == null),
            It.Is<KernelExecutionContext>(context => context.RequestId == "corr-100"),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task ConsumeAsync_ResolvesOneCanonicalPropertyAlias()
    {
        var request = CreateRequest() with
        {
            Identity = new(CountyId, "ALIAS-100", 2026, "corr-100")
        };

        var result = await new ForgeCanonicalCostConsumer(SuccessfulKernel().Object)
            .ConsumeAsync(request);

        Assert.Equal(ParcelId, result.Value.Projection.Identity.ParcelId);
    }

    [Theory]
    [InlineData("property")]
    [InlineData("cama")]
    [InlineData("land")]
    [InlineData("cost")]
    [InlineData("depreciation")]
    public async Task ConsumeAsync_RejectsAmbiguousCandidateSets(string candidateSet)
    {
        var request = CreateRequest();
        request = candidateSet switch
        {
            "property" => request with { Properties = [request.Properties[0], request.Properties[0]] },
            "cama" => request with { CamaFacts = [request.CamaFacts[0], request.CamaFacts[0]] },
            "land" => request with { LandFacts = [request.LandFacts[0], request.LandFacts[0]] },
            "cost" => request with { CostFactorSets = [request.CostFactorSets[0], request.CostFactorSets[0]] },
            _ => request with { DepreciationSchedules = [request.DepreciationSchedules[0], request.DepreciationSchedules[0]] },
        };

        var exception = await Assert.ThrowsAsync<InvalidOperationException>(
            () => new ForgeCanonicalCostConsumer(SuccessfulKernel().Object).ConsumeAsync(request));

        Assert.Contains("ambiguous", exception.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task ConsumeAsync_RejectsCrossCountyCandidate()
    {
        var request = CreateRequest() with
        {
            CamaFacts = [CreateRequest().CamaFacts[0] with { CountyId = Guid.NewGuid() }]
        };

        var exception = await Assert.ThrowsAsync<InvalidOperationException>(
            () => new ForgeCanonicalCostConsumer(SuccessfulKernel().Object).ConsumeAsync(request));

        Assert.Contains("none matched", exception.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task ConsumeAsync_RejectsKernelSourceOrParcelMismatch()
    {
        var kernel = SuccessfulKernel(auditHash: "git:wrong", resourceId: "OTHER");

        var exception = await Assert.ThrowsAsync<InvalidOperationException>(
            () => new ForgeCanonicalCostConsumer(kernel.Object).ConsumeAsync(CreateRequest()));

        Assert.Contains("identity", exception.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task ConsumeAsync_ReportsOnlyTypedKernelFailure()
    {
        var kernel = new Mock<IValuationKernelClient>();
        kernel.Setup(client => client.ValuateAsync(
                It.IsAny<ValuationKernelPayload>(), It.IsAny<KernelExecutionContext>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new KernelInvocationResult<ValuationKernelResult>(
                false, "terraforge.kernel.valuation", null, "input", DateTimeOffset.UtcNow,
                DateTimeOffset.UtcNow, 1, null, null, Array.Empty<string>(),
                KernelFailureMode.Timeout, "raw secret must not escape"));

        var exception = await Assert.ThrowsAsync<InvalidOperationException>(
            () => new ForgeCanonicalCostConsumer(kernel.Object).ConsumeAsync(CreateRequest()));

        Assert.Contains("Timeout", exception.Message, StringComparison.Ordinal);
        Assert.DoesNotContain("raw secret", exception.Message, StringComparison.Ordinal);
    }

    private static Mock<IValuationKernelClient> SuccessfulKernel(
        string auditHash = Source,
        string resourceId = ParcelId)
    {
        var kernel = new Mock<IValuationKernelClient>();
        kernel.Setup(client => client.ValuateAsync(
                It.IsAny<ValuationKernelPayload>(), It.IsAny<KernelExecutionContext>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new KernelInvocationResult<ValuationKernelResult>(
                true, "terraforge.kernel.valuation", auditHash, new string('a', 64),
                DateTimeOffset.UtcNow, DateTimeOffset.UtcNow, 1,
                new(162950d, new(50000d, 112950d)),
                new("event-1", "synthetic", "kernel", "valuate", resourceId,
                    "terraforge.kernel.valuation", auditHash),
                Array.Empty<string>(), null, null, new string('b', 64),
                100, new string('c', 64), 0, Convert.ToHexString(SHA256.HashData([])).ToLowerInvariant(),
                "corr-100"));
        return kernel;
    }

    private static ForgeCanonicalConsumerRequest CreateRequest()
    {
        var costs = new CostFactorSet
        {
            Id = Guid.Parse("11111111-1111-1111-1111-111111111111"), CountyId = CountyId,
            EffectiveYear = 2026, Version = "cost-v1", ProvenanceAuthor = "tf",
        };
        costs.Factors.Add(new ForgeCostFactor
        {
            Id = Guid.Parse("22222222-2222-2222-2222-222222222222"),
            CostFactorSetId = costs.Id, ImprovementClassCode = "R1",
            SizeBandMinSqFt = 0, SizeBandMaxSqFt = 2000, UnitCostPerSqFt = 125.5m,
        });
        var depreciation = new DepreciationSchedule
        {
            Id = Guid.Parse("33333333-3333-3333-3333-333333333333"), CountyId = CountyId,
            EffectiveYear = 2026, Version = "dep-v1", ProvenanceAuthor = "tf",
        };
        depreciation.Factors.Add(new DepreciationFactor
        {
            Id = Guid.Parse("44444444-4444-4444-4444-444444444444"),
            DepreciationScheduleId = depreciation.Id, AgeMinYears = 0,
            AgeMaxYears = 100, DepreciationFraction = 0.1m,
        });
        return new(
            new(CountyId, ParcelId, 2026, "corr-100"),
            new(true, "subject-1", CountyId, "access:forge"),
            [new(CountyId, ParcelId, ["ALIAS-100"])],
            [new(CountyId, ParcelId, 2026, "R1", 1000, 10)],
            [new(CountyId, ParcelId, 2026, 50000m)],
            [costs],
            [depreciation]);
    }
}
