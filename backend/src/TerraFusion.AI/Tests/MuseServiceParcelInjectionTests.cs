using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using TerraFusion.Core.DTOs.Pilot;
using TerraFusion.Core.Interfaces;
using TerraFusion.AI.Services;
using Xunit;

namespace TerraFusion.AI.Tests;

/// <summary>
/// Proves that MuseService injects ParcelSummary fields into contextLines
/// before the LLM call, so the model has parcel facts in its system prompt.
/// </summary>
public sealed class MuseServiceParcelInjectionTests
{
    // ── Helpers ─────────────────────────────────────────────────────────────

    private static MuseService BuildSut(string llmAnswer)
    {
        var llm = new Mock<IMuseLlmClient>();
        llm.Setup(x => x.CompleteAsync(
                It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
           .ReturnsAsync(llmAnswer);

        var git = new Mock<IGitContextService>();
        git.Setup(x => x.GetContextAsync(
                It.IsAny<string>(), It.IsAny<string?>(), It.IsAny<CancellationToken>()))
           .ReturnsAsync(new GitContext("main", null, [], false));

        var contracts = new Mock<ISurfaceContractService>();
        contracts.Setup(x => x.Resolve(
                It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<string?>()))
                 .Returns((SurfaceContract?)null);

        return new MuseService(
            NullLogger<MuseService>.Instance,
            git.Object,
            contracts.Object,
            llm.Object);
    }

    private static ExplainRequest ParcelRequest(Dictionary<string, object>? parcelSummary) =>
        new(
            Query: "does this depreciation rate look right?",
            CountyId: "benton",
            ActorId: "test",
            Source: "test",
            ParcelId: "117-230-114-0",
            ParcelSummary: parcelSummary,
            Statutes: null,
            Context: new WorkContext(
                ActiveBranch: null,
                ActiveFile: null,
                BuildStatus: "unknown",
                ActiveSuite: "forge",
                ActiveTab: "costforge"));

    // ── Tests ────────────────────────────────────────────────────────────────

    [Fact]
    public async Task ParcelSummary_Injected_Into_System_Prompt_When_Present()
    {
        // Arrange — LLM echoes back its system prompt for inspection
        string capturedPrompt = string.Empty;
        var llm = new Mock<IMuseLlmClient>();
        llm.Setup(x => x.CompleteAsync(
                It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
           .Callback<string, string, CancellationToken>((sys, _, _) => capturedPrompt = sys)
           .ReturnsAsync("plausible answer");

        var git = new Mock<IGitContextService>();
        git.Setup(x => x.GetContextAsync(
                It.IsAny<string>(), It.IsAny<string?>(), It.IsAny<CancellationToken>()))
           .ReturnsAsync(new GitContext("main", null, [], false));

        var contracts = new Mock<ISurfaceContractService>();
        contracts.Setup(x => x.Resolve(
                It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<string?>()))
                 .Returns((SurfaceContract?)null);

        var sut = new MuseService(
            NullLogger<MuseService>.Instance, git.Object, contracts.Object, llm.Object);

        var request = ParcelRequest(new Dictionary<string, object>
        {
            ["address"] = "1234 Main St",
            ["city"] = "Richland",
            ["propertyType"] = "residential",
            ["assessmentYear"] = "2025",
            ["assessmentStatus"] = "active",
            ["totalAssessedValue"] = "342500",
            ["landValue"] = "75000",
            ["improvementValue"] = "267500",
            ["marketValue"] = "355000",
            ["taxableValue"] = "342500",
            ["yearBuilt"] = "1987",
            ["buildingSquareFeet"] = "1840",
            ["landAcreage"] = "0.24",
            ["lastSaleDate"] = "2019-06-15",
            ["lastSalePrice"] = "298000",
            ["neighborhood"] = "Southridge",
            ["zoning"] = "R-1",
            ["taxDistrictName"] = "Richland #400",
        });

        // Act
        await sut.ExplainAsync(request);

        // Assert — parcel facts appear in the system prompt sent to the LLM
        Assert.Contains("1234 Main St", capturedPrompt);
        Assert.Contains("residential", capturedPrompt);
        Assert.Contains("342500", capturedPrompt);
        Assert.Contains("Southridge", capturedPrompt);
    }

    [Fact]
    public async Task ParcelSummary_Null_Does_Not_Throw_And_Uses_Static_Fallback()
    {
        var sut = BuildSut(string.Empty); // offline LLM → static fallback

        var request = ParcelRequest(parcelSummary: null);

        // Should not throw; response uses static fallback
        var result = await sut.ExplainAsync(request);
        Assert.NotEmpty(result.Explanation);
    }

    [Fact]
    public async Task ParcelSummary_EmptyDictionary_Does_Not_Inject_And_Does_Not_Throw()
    {
        string capturedPrompt = string.Empty;
        var llm = new Mock<IMuseLlmClient>();
        llm.Setup(x => x.CompleteAsync(
                It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
           .Callback<string, string, CancellationToken>((sys, _, _) => capturedPrompt = sys)
           .ReturnsAsync("answer");

        var git = new Mock<IGitContextService>();
        git.Setup(x => x.GetContextAsync(
                It.IsAny<string>(), It.IsAny<string?>(), It.IsAny<CancellationToken>()))
           .ReturnsAsync(new GitContext("main", null, [], false));

        var contracts = new Mock<ISurfaceContractService>();
        contracts.Setup(x => x.Resolve(
                It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<string?>()))
                 .Returns((SurfaceContract?)null);

        var sut = new MuseService(
            NullLogger<MuseService>.Instance, git.Object, contracts.Object, llm.Object);

        var request = ParcelRequest(parcelSummary: new Dictionary<string, object>());

        // Act
        var result = await sut.ExplainAsync(request);

        // Assert — no parcel lines injected, but call succeeds
        Assert.NotEmpty(result.Explanation);
        Assert.DoesNotContain("Parcel:", capturedPrompt);
    }

    [Fact]
    public async Task Geo_Fields_Omitted_From_Context_When_Missing_From_Summary()
    {
        string capturedPrompt = string.Empty;
        var llm = new Mock<IMuseLlmClient>();
        llm.Setup(x => x.CompleteAsync(
                It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
           .Callback<string, string, CancellationToken>((sys, _, _) => capturedPrompt = sys)
           .ReturnsAsync("answer");

        var git = new Mock<IGitContextService>();
        git.Setup(x => x.GetContextAsync(
                It.IsAny<string>(), It.IsAny<string?>(), It.IsAny<CancellationToken>()))
           .ReturnsAsync(new GitContext("main", null, [], false));

        var contracts = new Mock<ISurfaceContractService>();
        contracts.Setup(x => x.Resolve(
                It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<string?>()))
                 .Returns((SurfaceContract?)null);

        var sut = new MuseService(
            NullLogger<MuseService>.Instance, git.Object, contracts.Object, llm.Object);

        // Summary with values but no geo fields
        var request = ParcelRequest(new Dictionary<string, object>
        {
            ["address"] = "1234 Main St",
            ["city"] = "Richland",
            ["totalAssessedValue"] = "342500",
        });

        // Act
        await sut.ExplainAsync(request);

        // Assert — address line present, geo line absent
        Assert.Contains("1234 Main St", capturedPrompt);
        Assert.DoesNotContain("Geo:", capturedPrompt);
        Assert.DoesNotContain("Coordinates:", capturedPrompt);
        Assert.DoesNotContain("Special districts:", capturedPrompt);
    }
}
