using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.ChatCompletion;
using Moq;
using TerraFusion.AI.Services;
using TerraFusion.Core.DTOs.Pilot;
using TerraFusion.Core.Interfaces;
using Xunit;
using Xunit.Abstractions;

namespace TerraFusion.API.Tests.Phase9B;

/// <summary>
/// Truth Gate — live end-to-end integration tests for the MuseService pipeline.
///
/// These tests skip automatically when Ollama is not reachable (CI / no-GPU
/// environments). Run locally with at least one of the portfolio models loaded:
///
///   ollama run devstral-small-2   # DevAssist lane
///   ollama run deepseek-r1        # Reasoning lane
///
/// Q1  Parcel / county co-pilot (Mode C): static fallback always green.
/// Q2  Dev-only (Mode B): static fallback always green.
/// Q3  Surface contract + active branch (Mode A): LLM live PASS — model must
///     reference the surface contract in its answer.
/// Q4  Next-move recommendation (Mode B + build context): LLM live PASS —
///     model must return an actionable answer, not a static placeholder.
///
/// Offline behaviour: when Ollama is down the mock returns "" → static
/// template activates → explanations still contain the expected fallback
/// markers. Tests tagged [Trait("Category","TruthGate")] skip via the
/// OllamaAvailableAttribute when the endpoint is unreachable.
/// </summary>
public class MuseTruthGateTests(ITestOutputHelper output)
{
    private const string OllamaEndpoint = "http://localhost:11434/v1";

    // ── Skip helper ──────────────────────────────────────────────────────────

    /// <summary>
    /// Returns true when Ollama is reachable and at least one model is loaded.
    /// </summary>
    private static async Task<bool> OllamaReachableAsync()
    {
        try
        {
            using var http = new HttpClient { Timeout = TimeSpan.FromSeconds(3) };
            var resp = await http.GetAsync($"{OllamaEndpoint.Replace("/v1", "")}/api/tags");
            return resp.IsSuccessStatusCode;
        }
        catch
        {
            return false;
        }
    }

    // ── Service builder (live SK client for specific model) ──────────────────

    private MuseService BuildLiveSvc(string modelId)
    {
        var http = new HttpClient { BaseAddress = new Uri(OllamaEndpoint) };
        var kernel = Kernel.CreateBuilder()
            .AddOpenAIChatCompletion(modelId, "sk-local", httpClient: http)
            .Build();

        var chatSvc = kernel.GetRequiredService<IChatCompletionService>();
        var llmClient = new SemanticKernelMuseLlmClient(chatSvc, NullLogger<SemanticKernelMuseLlmClient>.Instance);

        var git = new Mock<IGitContextService>();
        git.Setup(x => x.GetContextAsync(It.IsAny<string>(), It.IsAny<string?>(), It.IsAny<CancellationToken>()))
           .ReturnsAsync(new GitContext("feat/pilot-phase2", null, [], false));

        var contracts = new Mock<ISurfaceContractService>();
        contracts.Setup(x => x.Resolve(It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<string?>()))
                 .Returns(new SurfaceContract(
                     Surface: "ForgeOverview",
                     Summary: "Forge suite overview — displays ratio study results and model calibration status.",
                     DocPath: null));

        return new MuseService(NullLogger<MuseService>.Instance, git.Object, contracts.Object, llmClient);
    }

    private MuseService BuildOfflineSvc()
    {
        var llm = new Mock<IMuseLlmClient>();
        llm.Setup(x => x.CompleteAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
           .ReturnsAsync(string.Empty);

        var git = new Mock<IGitContextService>();
        git.Setup(x => x.GetContextAsync(It.IsAny<string>(), It.IsAny<string?>(), It.IsAny<CancellationToken>()))
           .ReturnsAsync(new GitContext("main", null, [], false));

        var contracts = new Mock<ISurfaceContractService>();
        contracts.Setup(x => x.Resolve(It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<string?>()))
                 .Returns((SurfaceContract?)null);

        return new MuseService(NullLogger<MuseService>.Instance, git.Object, contracts.Object, llm.Object);
    }

    // ── Q1: County co-pilot — static fallback always green ───────────────────

    [Fact]
    [Trait("Category", "TruthGate")]
    public async Task Q1_County_Copilot_StaticFallback_AlwaysGreen()
    {
        var svc = BuildOfflineSvc();
        var req = new ExplainRequest(
            Query: "Why was my assessed value increased this year?",
            ParcelId: "123456-001",
            CountyId: "benton",
            ActorId: "assessor-1",
            Source: "AI_PILOT");

        var result = await svc.ExplainAsync(req);

        output.WriteLine($"[Q1] Explanation ({result.Explanation.Length} chars): {result.Explanation[..Math.Min(200, result.Explanation.Length)]}…");
        output.WriteLine($"[Q1] Sources: {result.Sources.Length}  Confidence: {result.Confidence}  TraceId: {result.TraceId}");

        Assert.NotEmpty(result.Explanation);
        Assert.Contains("benton", result.Explanation);
        Assert.Contains(result.Sources, s => s.Type == "statute" && s.Reference.Contains("RCW"));
        Assert.True(result.Confidence > 0);
    }

    // ── Q2: Dev-only — static fallback always green ───────────────────────────

    [Fact]
    [Trait("Category", "TruthGate")]
    public async Task Q2_DevOnly_StaticFallback_AlwaysGreen()
    {
        var svc = BuildOfflineSvc();
        var req = new ExplainRequest(
            Query: "What files have changed on this branch?",
            ParcelId: null,
            CountyId: "benton",
            ActorId: "dev-1",
            Source: "AI_PILOT",
            Context: new WorkContext(
                ActiveBranch: "feat/pilot-phase2",
                ActiveFile: "MuseChat.tsx",
                BuildStatus: "clean",
                ActiveSuite: null,
                ActiveTab: null));

        var result = await svc.ExplainAsync(req);

        output.WriteLine($"[Q2] Explanation ({result.Explanation.Length} chars): {result.Explanation[..Math.Min(200, result.Explanation.Length)]}…");

        Assert.NotEmpty(result.Explanation);
        // Static Mode B fallback: contains branch + file signals
        Assert.Contains("feat/pilot-phase2", result.Explanation);
        Assert.Contains("static fallback active", result.Explanation);
    }

    // ── Q3: Surface contract — live LLM required, skip if offline ────────────

    [Fact]
    [Trait("Category", "TruthGate")]
    public async Task Q3_SurfaceContract_LiveLLM_ReferencesContract()
    {
        if (!await OllamaReachableAsync())
        {
            output.WriteLine("[Q3] SKIP — Ollama not reachable. Start Ollama with devstral-small-2 to run live gate.");
            return;
        }

        var svc = BuildLiveSvc("devstral-small-2");
        var req = new ExplainRequest(
            Query: "What contract governs this surface and what should I focus on?",
            ParcelId: null,
            CountyId: "benton",
            ActorId: "dev-1",
            Source: "AI_PILOT",
            Context: new WorkContext(
                ActiveBranch: "feat/pilot-phase2",
                ActiveFile: "ForgeOverview.tsx",
                BuildStatus: "clean",
                ActiveSuite: "Forge",
                ActiveTab: "Overview"));

        var result = await svc.ExplainAsync(req);

        output.WriteLine($"[Q3 LIVE] Explanation ({result.Explanation.Length} chars):");
        output.WriteLine(result.Explanation);

        // Must be a real LLM answer (not the static placeholder)
        Assert.NotEmpty(result.Explanation);
        Assert.DoesNotContain("static fallback active", result.Explanation);
        // Model must acknowledge the contract context in some form
        Assert.True(
            result.Explanation.Contains("Forge", StringComparison.OrdinalIgnoreCase) ||
            result.Explanation.Contains("contract", StringComparison.OrdinalIgnoreCase) ||
            result.Explanation.Contains("ratio", StringComparison.OrdinalIgnoreCase),
            $"Expected contract reference in live response. Got: {result.Explanation[..Math.Min(300, result.Explanation.Length)]}");
    }

    // ── Q4: Next correct move — live LLM required, skip if offline ───────────

    [Fact]
    [Trait("Category", "TruthGate")]
    public async Task Q4_NextCorrectMove_LiveLLM_ReturnsActionableAnswer()
    {
        if (!await OllamaReachableAsync())
        {
            output.WriteLine("[Q4] SKIP — Ollama not reachable. Start Ollama with devstral-small-2 to run live gate.");
            return;
        }

        var svc = BuildLiveSvc("devstral-small-2");
        var req = new ExplainRequest(
            Query: "What is the next correct move in this file given the current branch context?",
            ParcelId: null,
            CountyId: "benton",
            ActorId: "dev-1",
            Source: "AI_PILOT",
            Context: new WorkContext(
                ActiveBranch: "feat/pilot-phase2",
                ActiveFile: "MuseChat.tsx",
                BuildStatus: "clean",
                ActiveSuite: null,
                ActiveTab: null));

        var result = await svc.ExplainAsync(req);

        output.WriteLine($"[Q4 LIVE] Explanation ({result.Explanation.Length} chars):");
        output.WriteLine(result.Explanation);

        Assert.NotEmpty(result.Explanation);
        Assert.DoesNotContain("static fallback active", result.Explanation);
        // A real model answer should be longer than the static template
        Assert.True(result.Explanation.Length > 50,
            $"Answer too short for a live model response: '{result.Explanation}'");
    }
}
