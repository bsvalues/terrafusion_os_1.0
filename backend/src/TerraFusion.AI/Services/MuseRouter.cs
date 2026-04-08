using Microsoft.Extensions.Logging;
using TerraFusion.Core.Interfaces;

namespace TerraFusion.AI.Services;

/// <summary>
/// Task-aware LLM router for the Muse pipeline.
///
/// Holds a named registry of IMuseLlmClient instances — one per configured
/// route lane. Dispatches to the correct lane based on the MuseTaskType
/// supplied by MuseService.
///
/// Fallback chain (first available wins):
///   1. Lane registered for the exact task type.
///   2. Default lane (registered under MuseRouter.DefaultKey).
///   3. Returns string.Empty so MuseService activates its static template.
///
/// DI wiring (see MuseServiceExtensions.AddMuseRouter):
///   The router is registered as a SINGLETON. Route-specific IMuseLlmClient
///   instances are registered as KEYED singletons. The router resolves them
///   lazily on first call to avoid startup latency.
/// </summary>
public sealed class MuseRouter : IMuseRouter
{
    /// <summary>
    /// Registry key for the fallback lane (used when no per-task route matched).
    /// </summary>
    public const string DefaultKey = "*";

    private readonly ILogger<MuseRouter> _logger;
    private readonly IReadOnlyDictionary<string, IMuseLlmClient> _lanes;

    public MuseRouter(
        ILogger<MuseRouter> logger,
        IReadOnlyDictionary<string, IMuseLlmClient> lanes)
    {
        _logger = logger;
        _lanes = lanes;
    }

    public async Task<string> CompleteAsync(
        MuseTaskType task,
        string systemPrompt,
        string userQuery,
        CancellationToken ct = default)
    {
        var taskKey = task.ToString();

        if (_lanes.TryGetValue(taskKey, out var laneClient))
        {
            _logger.LogDebug("Muse router dispatching task {Task} to lane '{Lane}'", task, taskKey);
            return await laneClient.CompleteAsync(systemPrompt, userQuery, ct);
        }

        if (_lanes.TryGetValue(DefaultKey, out var defaultClient))
        {
            _logger.LogDebug("Muse router task {Task} has no lane — using default", task);
            return await defaultClient.CompleteAsync(systemPrompt, userQuery, ct);
        }

        _logger.LogWarning("Muse router: no lane configured for {Task} and no default lane — returning empty", task);
        return string.Empty;
    }
}
