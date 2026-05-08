using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using TerraFusion.Core.Sync.Corpus;

namespace TerraFusion.Data.Services.Workbench.Corpus;

/// <summary>
/// SYNC-COMPLETE-2: HTTP-loopback implementation of
/// <see cref="ICorpusLaneRunner"/>.
///
/// <para><b>Design choice — HTTP loopback over direct DI</b>: each
/// lane endpoint in <c>DoctrineDrainController</c> injects 4-12
/// scoped services and threads a county-resolution + Benton xref
/// pre-call. Re-wiring all of those into a hosted-service-scope
/// would couple the corpus runner to every lane's internal
/// composition; an HTTP call against the local controller stays
/// stable across lane refactors and exercises the same code path
/// the operator uses today. The trade-off is one localhost roundtrip
/// per lane (six total per run) which is dwarfed by the multi-hour
/// lane drain itself.</para>
///
/// <para>Configuration:
/// <c>FullCorpus:LoopbackBaseUrl</c> (default
/// <c>http://localhost:5000</c>). Per-call timeout is unbounded
/// (PerRequest&gt;6h drains intentional).</para>
///
/// <para>The endpoints are <c>[AllowAnonymous]</c> so no auth is
/// required.</para>
/// </summary>
public sealed class HttpCorpusLaneRunner : ICorpusLaneRunner
{
    private const string DefaultBaseUrl = "http://localhost:5000";
    private const string LoopbackBaseUrlConfigPath = "FullCorpus:LoopbackBaseUrl";

    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;
    private readonly ILogger<HttpCorpusLaneRunner> _logger;

    public HttpCorpusLaneRunner(
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        ILogger<HttpCorpusLaneRunner> logger)
    {
        ArgumentNullException.ThrowIfNull(httpClientFactory);
        ArgumentNullException.ThrowIfNull(configuration);
        ArgumentNullException.ThrowIfNull(logger);
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<CorpusLaneRunResult> RunLaneAsync(
        string lane,
        string operatorName,
        short workingYear,
        bool fullCorpus,
        int? topN,
        CancellationToken cancellationToken)
    {
        if (!CorpusReconciliationPolicy.LaneOrder.Contains(lane, StringComparer.OrdinalIgnoreCase))
            return new CorpusLaneRunResult(
                CorpusLaneRunOutcome.UnknownLane,
                Array.Empty<Guid>(),
                null, null, null,
                $"Unknown lane: '{lane}'.");

        var baseUrl = (_configuration[LoopbackBaseUrlConfigPath] ?? DefaultBaseUrl).TrimEnd('/');
        var url = $"{baseUrl}/api/sync/doctrine/drain/{lane}";

        try
        {
            using var http = _httpClientFactory.CreateClient();
            // Lane drains can take hours on a full corpus run.
            http.Timeout = Timeout.InfiniteTimeSpan;

            var body = new
            {
                operatorName,
                workingYear = (int)workingYear,
                fullCorpus,
                topN,
            };

            _logger.LogInformation(
                "[CorpusRunner] Invoking lane={Lane} operator={Op} year={Yr} fullCorpus={Full} topN={Top}",
                lane, operatorName, workingYear, fullCorpus, topN);

            var response = await http.PostAsJsonAsync(url, body, cancellationToken).ConfigureAwait(false);
            var responseText = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);

            return ParseLaneResponse(response.IsSuccessStatusCode, responseText);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "[CorpusRunner] HTTP call to lane={Lane} threw.", lane);
            return new CorpusLaneRunResult(
                CorpusLaneRunOutcome.Failed,
                Array.Empty<Guid>(),
                null, null, null,
                $"Lane HTTP call failed: {ex.GetType().Name}: {ex.Message}");
        }
    }

    /// <summary>
    /// Parse the controller's response shape:
    /// <c>{ lane, status, batchIds, counts, durationSec, gateSummary,
    /// quarantineDelta, nextRecommendedLane, error?, failedStage? }</c>.
    /// Returns the runner's normalized result with JSON sub-objects
    /// preserved verbatim for the lane-result row.
    /// </summary>
    public static CorpusLaneRunResult ParseLaneResponse(bool isSuccess, string responseText)
    {
        if (string.IsNullOrWhiteSpace(responseText))
            return new CorpusLaneRunResult(
                CorpusLaneRunOutcome.Failed,
                Array.Empty<Guid>(),
                null, null, null,
                "Empty response from lane endpoint.");

        try
        {
            using var doc = JsonDocument.Parse(responseText);
            var root = doc.RootElement;

            var batchIds = ExtractBatchIds(root);
            var counts = root.TryGetProperty("counts", out var cEl)
                ? cEl.GetRawText()
                : null;
            var gates = root.TryGetProperty("gateSummary", out var gEl)
                ? gEl.GetRawText()
                : null;
            var quarantineDelta = root.TryGetProperty("quarantineDelta", out var qEl)
                ? qEl.GetRawText()
                : null;

            var status = root.TryGetProperty("status", out var sEl) && sEl.ValueKind == JsonValueKind.String
                ? sEl.GetString()
                : null;

            if (isSuccess && string.Equals(status, "Succeeded", StringComparison.OrdinalIgnoreCase))
                return new CorpusLaneRunResult(
                    CorpusLaneRunOutcome.Completed,
                    batchIds,
                    counts, gates, quarantineDelta,
                    null);

            var failedStage = root.TryGetProperty("failedStage", out var fEl) && fEl.ValueKind == JsonValueKind.String
                ? fEl.GetString()
                : null;
            var error = root.TryGetProperty("error", out var eEl) && eEl.ValueKind == JsonValueKind.String
                ? eEl.GetString()
                : null;
            var compositeError = string.IsNullOrEmpty(failedStage)
                ? error
                : $"{failedStage}: {error}";

            return new CorpusLaneRunResult(
                CorpusLaneRunOutcome.Failed,
                batchIds,
                counts, gates, quarantineDelta,
                compositeError ?? "Lane endpoint returned non-success status.");
        }
        catch (JsonException ex)
        {
            return new CorpusLaneRunResult(
                CorpusLaneRunOutcome.Failed,
                Array.Empty<Guid>(),
                null, null, null,
                $"Could not parse lane response JSON: {ex.Message}");
        }
    }

    private static IReadOnlyList<Guid> ExtractBatchIds(JsonElement root)
    {
        if (!root.TryGetProperty("batchIds", out var bEl) ||
            bEl.ValueKind != JsonValueKind.Array)
            return Array.Empty<Guid>();

        var list = new List<Guid>();
        foreach (var entry in bEl.EnumerateArray())
        {
            if (entry.ValueKind == JsonValueKind.String &&
                Guid.TryParse(entry.GetString(), out var g))
                list.Add(g);
        }
        return list;
    }
}
