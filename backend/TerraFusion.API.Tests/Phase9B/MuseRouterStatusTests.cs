using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using TerraFusion.AI.Services;
using TerraFusion.Core.Configuration;
using Xunit;
using Xunit.Abstractions;

namespace TerraFusion.API.Tests.Phase9B;

/// <summary>
/// Unit tests for MuseRouterStatusService.
///
/// Live probe tests skip when Ollama is offline (same skip pattern as
/// MuseTruthGateTests). Offline tests validate fallback structure and
/// that all lanes are surfaced regardless of model availability.
/// </summary>
public class MuseRouterStatusTests(ITestOutputHelper output)
{
    private const string OllamaBase = "http://localhost:11434";

    private static async Task<bool> OllamaReachableAsync()
    {
        try
        {
            using var http = new HttpClient { Timeout = TimeSpan.FromSeconds(3) };
            var resp = await http.GetAsync($"{OllamaBase}/api/tags");
            return resp.IsSuccessStatusCode;
        }
        catch { return false; }
    }

    private static MuseRouterStatusService BuildSvc(
        Dictionary<string, MuseRouteEntry>? routes = null,
        string rootEndpoint = "http://localhost:11434/v1",
        string rootModelId = "devstral-small-2")
    {
        var routerOpts = Options.Create(new MuseRouterOptions
        {
            Routes = routes ?? []
        });
        var llmOpts = Options.Create(new MuseLlmOptions
        {
            Provider = "Local",
            ModelId = rootModelId,
            Endpoint = rootEndpoint
        });
        return new MuseRouterStatusService(routerOpts, llmOpts, NullLogger<MuseRouterStatusService>.Instance);
    }

    // ── Structure tests — always run, no network needed ──────────────────────

    [Fact]
    public async Task Status_NoRoutes_ReturnsSingleDefaultLane()
    {
        var svc = BuildSvc(); // no routes configured
        var result = await svc.GetStatusAsync();

        // Should surface root provider as "*" default lane
        Assert.Single(result.Lanes);
        Assert.True(result.Lanes.ContainsKey("*"));
        Assert.Equal("devstral-small-2", result.Lanes["*"].Model);
    }

    [Fact]
    public async Task Status_FourLanes_ReturnsFourEntries()
    {
        var routes = new Dictionary<string, MuseRouteEntry>(StringComparer.OrdinalIgnoreCase)
        {
            ["DevAssist"]  = new MuseRouteEntry { ModelId = "devstral-small-2", Endpoint = "http://localhost:11434/v1" },
            ["Reasoning"]  = new MuseRouteEntry { ModelId = "deepseek-r1",      Endpoint = "http://localhost:11434/v1" },
            ["AgentTools"] = new MuseRouteEntry { ModelId = "deepseek-v3",      Endpoint = "http://localhost:11434/v1" },
            ["Document"]   = new MuseRouteEntry { ModelId = "qwen2.5",          Endpoint = "http://localhost:11434/v1" }
        };

        var svc = BuildSvc(routes);
        var result = await svc.GetStatusAsync();

        Assert.Equal(4, result.Lanes.Count);
        Assert.True(result.Lanes.ContainsKey("DevAssist"));
        Assert.True(result.Lanes.ContainsKey("Reasoning"));
        Assert.True(result.Lanes.ContainsKey("AgentTools"));
        Assert.True(result.Lanes.ContainsKey("Document"));
    }

    [Fact]
    public async Task Status_OfflineEndpoint_ReturnsLiveEqualsFalse_LatencyNull()
    {
        // Endpoint that will never respond
        var routes = new Dictionary<string, MuseRouteEntry>
        {
            ["DevAssist"] = new MuseRouteEntry
            {
                ModelId  = "devstral-small-2",
                Endpoint = "http://localhost:19999/v1" // nothing listening here
            }
        };

        var svc = BuildSvc(routes);
        var result = await svc.GetStatusAsync();

        var lane = result.Lanes["DevAssist"];
        Assert.False(lane.Live);
        Assert.Null(lane.LatencyMs);
        Assert.True(result.FallbackActive);
    }

    [Fact]
    public async Task Status_OfflineEndpoint_ModelAndEndpointStillPopulated()
    {
        var routes = new Dictionary<string, MuseRouteEntry>
        {
            ["Reasoning"] = new MuseRouteEntry
            {
                ModelId  = "deepseek-r1",
                Endpoint = "http://localhost:19999/v1"
            }
        };

        var svc = BuildSvc(routes);
        var result = await svc.GetStatusAsync();

        var lane = result.Lanes["Reasoning"];
        Assert.Equal("deepseek-r1", lane.Model);
        Assert.Contains("19999", lane.Endpoint);
    }

    [Fact]
    public async Task Status_FallbackActive_True_WhenAnyLaneOffline()
    {
        // Mix: one valid endpoint (httpbin), one invalid
        var routes = new Dictionary<string, MuseRouteEntry>
        {
            ["A"] = new MuseRouteEntry { ModelId = "m1", Endpoint = "http://localhost:19999/v1" },
            ["B"] = new MuseRouteEntry { ModelId = "m2", Endpoint = "http://localhost:19998/v1" }
        };

        var svc = BuildSvc(routes);
        var result = await svc.GetStatusAsync();

        Assert.True(result.FallbackActive);
    }

    // ── Live probe tests — skip when Ollama offline ───────────────────────────

    [Fact]
    public async Task Status_OllamaLive_DevAssistLane_ReportsLiveAndLatency()
    {
        if (!await OllamaReachableAsync())
        {
            output.WriteLine("[SKIP] Ollama not reachable — start with: ollama serve");
            return;
        }

        var routes = new Dictionary<string, MuseRouteEntry>
        {
            ["DevAssist"] = new MuseRouteEntry
            {
                ModelId  = "devstral-small-2",
                Endpoint = "http://localhost:11434/v1"
            }
        };

        var svc = BuildSvc(routes);
        var result = await svc.GetStatusAsync();

        var lane = result.Lanes["DevAssist"];
        output.WriteLine($"[LIVE] DevAssist: live={lane.Live} latency={lane.LatencyMs}ms");

        Assert.True(lane.Live);
        Assert.NotNull(lane.LatencyMs);
        Assert.True(lane.LatencyMs < 3000);
    }
}
