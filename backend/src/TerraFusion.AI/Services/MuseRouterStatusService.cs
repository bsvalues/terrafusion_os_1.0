using System.Diagnostics;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using TerraFusion.Core.Configuration;
using TerraFusion.Core.DTOs.Pilot;
using TerraFusion.Core.Interfaces;

namespace TerraFusion.AI.Services;

/// <summary>
/// Probes each configured router lane by hitting {endpoint}/models
/// (the OpenAI-compatible models list — supported by Ollama, LM Studio,
/// and any other /v1-compatible server).
///
/// Probe strategy:
///   GET {laneEndpoint}/models  with a 3-second timeout
///   200 → live, latency recorded
///   Any error / timeout → offline, latencyMs = null
///
/// All lanes are probed concurrently so the endpoint returns in one
/// round-trip time (the slowest responding lane), not N sequential calls.
/// </summary>
public sealed class MuseRouterStatusService : IMuseRouterStatusService
{
    private const int ProbeTimeoutMs = 3_000;
    private const string ModelsPath = "/models";

    private readonly MuseRouterOptions _routerOpts;
    private readonly MuseLlmOptions _llmOpts;
    private readonly ILogger<MuseRouterStatusService> _logger;

    // Shared client — status probes are fire-and-measure, no credentials needed.
    private static readonly HttpClient _http = new()
    {
        Timeout = TimeSpan.FromMilliseconds(ProbeTimeoutMs)
    };

    public MuseRouterStatusService(
        IOptions<MuseRouterOptions> routerOpts,
        IOptions<MuseLlmOptions> llmOpts,
        ILogger<MuseRouterStatusService> logger)
    {
        _routerOpts = routerOpts.Value;
        _llmOpts = llmOpts.Value;
        _logger = logger;
    }

    public async Task<RouterStatusResponse> GetStatusAsync(CancellationToken ct = default)
    {
        // Build the set of lanes to probe. When no router routes are configured,
        // surface the root provider as a single "default" lane so the status
        // endpoint always returns something useful.
        var lanesToProbe = BuildLaneProbeList();

        // Probe all lanes concurrently.
        var probeResults = await Task.WhenAll(
            lanesToProbe.Select(l => ProbeLaneAsync(l.Key, l.ModelId, l.Endpoint, ct)));

        var lanes = probeResults.ToDictionary(
            r => r.Key,
            r => new LaneStatus(r.ModelId, r.Endpoint, r.Live, r.LatencyMs),
            StringComparer.OrdinalIgnoreCase);

        bool fallbackActive = lanes.Values.Any(l => !l.Live);

        _logger.LogDebug(
            "Router status: {Live}/{Total} lanes live, fallback={Fallback}",
            lanes.Values.Count(l => l.Live), lanes.Count, fallbackActive);

        return new RouterStatusResponse(lanes, fallbackActive);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private List<(string Key, string ModelId, string Endpoint)> BuildLaneProbeList()
    {
        if (_routerOpts.Routes is { Count: > 0 } routes)
        {
            return routes
                .Select(kvp => (
                    kvp.Key,
                    kvp.Value.ModelId,
                    kvp.Value.Endpoint ?? _llmOpts.Endpoint ?? "http://localhost:11434/v1"))
                .ToList();
        }

        // No router configured — surface root provider as "*" lane.
        return
        [
            (
                "*",
                _llmOpts.ModelId,
                _llmOpts.Endpoint ?? "http://localhost:11434/v1"
            )
        ];
    }

    private async Task<(string Key, string ModelId, string Endpoint, bool Live, int? LatencyMs)>
        ProbeLaneAsync(string key, string modelId, string endpoint, CancellationToken ct)
    {
        var probeUrl = endpoint.TrimEnd('/') + ModelsPath;
        var sw = Stopwatch.StartNew();

        try
        {
            using var cts = CancellationTokenSource.CreateLinkedTokenSource(ct);
            cts.CancelAfter(ProbeTimeoutMs);

            var response = await _http.GetAsync(probeUrl, cts.Token);
            sw.Stop();

            var latency = (int)sw.ElapsedMilliseconds;

            if (response.IsSuccessStatusCode)
            {
                _logger.LogDebug("Lane {Key} ({Model}): live at {Url} ({Latency}ms)",
                    key, modelId, probeUrl, latency);
                return (key, modelId, endpoint, true, latency);
            }

            _logger.LogDebug("Lane {Key} ({Model}): HTTP {Status} from {Url}",
                key, modelId, (int)response.StatusCode, probeUrl);
            return (key, modelId, endpoint, false, null);
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or OperationCanceledException)
        {
            sw.Stop();
            _logger.LogDebug("Lane {Key} ({Model}): offline — {Reason}",
                key, modelId, ex.GetType().Name);
            return (key, modelId, endpoint, false, null);
        }
    }
}
