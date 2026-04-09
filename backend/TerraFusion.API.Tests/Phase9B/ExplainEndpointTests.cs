using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using TerraFusion.AI.Services;
using TerraFusion.Core.DTOs.Pilot;
using TerraFusion.Core.Interfaces;
using Xunit;

namespace TerraFusion.API.Tests.Phase9B;

public class ExplainEndpointTests
{
    // ── Helper: build MuseService with all required dependencies ─────────────

    private static MuseService BuildSvc()
    {
        var git = new Mock<IGitContextService>();
        git.Setup(x => x.GetContextAsync(It.IsAny<string>(), It.IsAny<string?>(), It.IsAny<CancellationToken>()))
           .ReturnsAsync(new GitContext("main", null, [], false));

        var contracts = new Mock<ISurfaceContractService>();
        contracts.Setup(x => x.Resolve(It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<string?>()))
                 .Returns((SurfaceContract?)null);

        var llm = new Mock<IMuseLlmClient>();
        llm.Setup(x => x.CompleteAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
           .ReturnsAsync(string.Empty); // offline → static fallback

        return new MuseService(NullLogger<MuseService>.Instance, git.Object, contracts.Object, llm.Object);
    }

    [Fact]
    public async Task MuseService_ReturnsExplanation_WithStatuteSource()
    {
        var svc = BuildSvc();
        var req = new ExplainRequest(
            Query: "Why was my property value increased?",
            ParcelId: "12345-001",
            CountyId: "benton",
            ActorId: "assessor-1",
            Source: "AI_PILOT"
        );

        var result = await svc.ExplainAsync(req);

        result.Explanation.Should().NotBeNullOrWhiteSpace();
        result.Sources.Should().Contain(s => s.Type == "statute");
        result.Sources.Should().Contain(s => s.Reference.Contains("RCW"));
        result.Confidence.Should().BeGreaterThan(0.0);
        result.TraceId.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public async Task MuseService_IncludesParcelSource_WhenParcelIdProvided()
    {
        var svc = BuildSvc();
        var req = new ExplainRequest("What does this value mean?", "ABC-123", "benton", "u1", "AI_PILOT");

        var result = await svc.ExplainAsync(req);

        result.Sources.Should().Contain(s => s.Type == "parcel_data" && s.Reference == "ABC-123");
    }

    [Fact]
    public async Task MuseService_HandlesNullParcelId_Gracefully()
    {
        var svc = BuildSvc();
        var req = new ExplainRequest("General question", null, "benton", "u1", "AI_PILOT");

        var act = () => svc.ExplainAsync(req);

        await act.Should().NotThrowAsync();
    }

    [Fact]
    public async Task MuseService_CountyId_AppearsInExplanation()
    {
        var svc = BuildSvc();
        var req = new ExplainRequest("Explain assessment", "P1", "franklin", "u1", "AI_PILOT");

        var result = await svc.ExplainAsync(req);

        result.Explanation.Should().Contain("franklin");
    }
}
