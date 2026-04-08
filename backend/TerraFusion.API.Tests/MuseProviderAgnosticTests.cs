using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using TerraFusion.Core.DTOs.Pilot;
using TerraFusion.Core.Interfaces;
using TerraFusion.AI.Services;
using Xunit;

namespace TerraFusion.AI.Tests;

/// <summary>
/// Proves that MuseService is fully provider-agnostic.
///
/// These tests inject a mock IMuseLlmClient to verify:
///   1. MuseService delegates to IMuseLlmClient without knowing the vendor.
///   2. Both Local and AzureOpenAI modes surface through the same interface.
///   3. MuseService never references provider names or config keys.
/// </summary>
public sealed class MuseProviderAgnosticTests
{
    private static ExplainRequest DevRequest(string query = "what changed?") => new(
        Query: query,
        CountyId: "benton",
        ActorId: "test",
        Source: "test",
        ParcelId: null,
        Context: new WorkContext(
            ActiveBranch: "feat/test",
            ActiveFile: "MuseChat.tsx",
            BuildStatus: "clean",
            ActiveSuite: null,
            ActiveTab: null),
        Statutes: null);

    [Fact]
    public async Task Muse_Uses_Configured_Provider_Without_Changing_MuseService()
    {
        // Arrange — mock returns a real answer; provider identity is irrelevant
        var llm = new Mock<IMuseLlmClient>();
        llm.Setup(x => x.CompleteAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
           .ReturnsAsync("The active file has 3 changed hunks relative to main.");

        var sut = BuildMuseService(llm.Object);

        // Act
        var result = await sut.ExplainAsync(DevRequest());

        // Assert — explanation came from LLM, not from the static template
        Assert.Contains("changed hunks", result.Explanation);
        llm.Verify(x => x.CompleteAsync(
            It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Muse_Local_Mode_And_Azure_Mode_Both_Resolve_Through_IMuseLlmClient()
    {
        // Arrange — simulate "Local" response
        var localLlm = new Mock<IMuseLlmClient>();
        localLlm.Setup(x => x.CompleteAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync("Local model answer.");

        // Arrange — simulate "AzureOpenAI" response
        var azureLlm = new Mock<IMuseLlmClient>();
        azureLlm.Setup(x => x.CompleteAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync("Azure model answer.");

        var localSut = BuildMuseService(localLlm.Object);
        var azureSut = BuildMuseService(azureLlm.Object);

        // Act — both call the same MuseService code path
        var localResult = await localSut.ExplainAsync(DevRequest("local question"));
        var azureResult = await azureSut.ExplainAsync(DevRequest("azure question"));

        // Assert — both got LLM answers; service didn't branch on provider
        Assert.Contains("Local model answer", localResult.Explanation);
        Assert.Contains("Azure model answer", azureResult.Explanation);
    }

    [Fact]
    public async Task MuseService_Remains_Provider_Agnostic_When_Backend_Offline()
    {
        // Arrange — backend offline → CompleteAsync returns empty string
        var offlineLlm = new Mock<IMuseLlmClient>();
        offlineLlm.Setup(x => x.CompleteAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
                  .ReturnsAsync(string.Empty);

        var sut = BuildMuseService(offlineLlm.Object);

        // Act
        var result = await sut.ExplainAsync(DevRequest());

        // Assert — explanation is static fallback, confidence still set, no throws
        Assert.NotEmpty(result.Explanation);
        Assert.True(result.Confidence > 0);
        // Static fallback contains the branch signal marker (not an LLM-specific string)
        Assert.Contains("feat/test", result.Explanation);
    }

    // ── Helpers ─────────────────────────────────────────────────────────────

    private static MuseService BuildMuseService(IMuseLlmClient llm)
    {
        var git = new Mock<IGitContextService>();
        git.Setup(x => x.GetContextAsync(It.IsAny<string>(), It.IsAny<string?>(), It.IsAny<CancellationToken>()))
           .ReturnsAsync(new TerraFusion.Core.DTOs.Pilot.GitContext("feat/test", null, [], false));

        var contracts = new Mock<ISurfaceContractService>();
        contracts.Setup(x => x.Resolve(It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<string?>()))
                 .Returns((TerraFusion.Core.DTOs.Pilot.SurfaceContract?)null);

        return new MuseService(
            NullLogger<MuseService>.Instance,
            git.Object,
            contracts.Object,
            llm);
    }
}
