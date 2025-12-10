// ═══════════════════════════════════════════════════════════════════════════════
// 🐝 PHASE 30: SystemGPT Swarm Bridge Service
// Executes Swarm control actions via HTTP calls to the control plane
// "Government. Transcended."
// ═══════════════════════════════════════════════════════════════════════════════

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Diagnostics;
using System.Net.Http.Json;
using System.Text.Json;
using TerraFusion.AI.Models;

namespace TerraFusion.AI.Services;

/// <summary>
/// Phase 30: Swarm Bridge Service.
/// Executes Swarm control actions by calling the Swarm control plane API.
/// Handles retries, timeouts, and error responses.
/// </summary>
public class SystemGptSwarmBridgeService : ISystemGptSwarmBridgeService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly SwarmBridgeOptions _options;
    private readonly ILogger<SystemGptSwarmBridgeService> _logger;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    // Endpoint mappings for each action type
    private static readonly Dictionary<SwarmActionKind, string> ActionEndpoints = new()
    {
        [SwarmActionKind.EnableSafeMode] = "/safemode/enable",
        [SwarmActionKind.DisableSafeMode] = "/safemode/disable",
        [SwarmActionKind.IncreaseCapacity] = "/capacity/increase",
        [SwarmActionKind.DecreaseCapacity] = "/capacity/decrease",
        [SwarmActionKind.ThrottleRequests] = "/throttle/enable",
        [SwarmActionKind.RelaxThrottle] = "/throttle/disable",
        [SwarmActionKind.RouteToSafeModel] = "/route/safemodel"
    };

    public SystemGptSwarmBridgeService(
        IHttpClientFactory httpClientFactory,
        IOptions<SwarmBridgeOptions> options,
        ILogger<SystemGptSwarmBridgeService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _options = options.Value;
        _logger = logger;
    }

    /// <summary>
    /// Execute a Swarm action based on policy decision.
    /// </summary>
    public async Task<SwarmActionResult> ExecuteActionAsync(
        SwarmPolicyDecision decision,
        CancellationToken cancellationToken = default)
    {
        var stopwatch = Stopwatch.StartNew();

        // Skip execution for None action
        if (decision.Action == SwarmActionKind.None)
        {
            _logger.LogDebug("No action needed for county {CountyId}", decision.CountyId);
            return new SwarmActionResult
            {
                Success = true,
                Action = SwarmActionKind.None,
                CountyId = decision.CountyId,
                ExecutedAt = DateTimeOffset.UtcNow,
                ResponseMessage = "No action required",
                ExecutionTimeMs = stopwatch.ElapsedMilliseconds
            };
        }

        _logger.LogInformation(
            "Executing Swarm action {Action} for county {CountyId}: {Reason}",
            decision.Action, decision.CountyId, decision.Reason);

        try
        {
            var result = await ExecuteWithRetryAsync(decision, cancellationToken);
            result = result with { ExecutionTimeMs = stopwatch.ElapsedMilliseconds };

            if (result.Success)
            {
                _logger.LogInformation(
                    "Swarm action {Action} succeeded for county {CountyId} in {ElapsedMs}ms",
                    decision.Action, decision.CountyId, stopwatch.ElapsedMilliseconds);
            }
            else
            {
                _logger.LogWarning(
                    "Swarm action {Action} failed for county {CountyId}: {FailureReason}",
                    decision.Action, decision.CountyId, result.FailureReason);
            }

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Exception executing Swarm action {Action} for county {CountyId}",
                decision.Action, decision.CountyId);

            return new SwarmActionResult
            {
                Success = false,
                Action = decision.Action,
                CountyId = decision.CountyId,
                ExecutedAt = DateTimeOffset.UtcNow,
                FailureReason = ex.Message,
                ExecutionTimeMs = stopwatch.ElapsedMilliseconds
            };
        }
    }

    private async Task<SwarmActionResult> ExecuteWithRetryAsync(
        SwarmPolicyDecision decision,
        CancellationToken cancellationToken)
    {
        Exception? lastException = null;

        for (int attempt = 1; attempt <= _options.MaxRetries; attempt++)
        {
            try
            {
                return await ExecuteHttpCallAsync(decision, cancellationToken);
            }
            catch (HttpRequestException ex)
            {
                lastException = ex;
                _logger.LogWarning(
                    "Swarm API call failed (attempt {Attempt}/{MaxRetries}): {Message}",
                    attempt, _options.MaxRetries, ex.Message);

                if (attempt < _options.MaxRetries)
                {
                    await Task.Delay(_options.RetryDelayMs, cancellationToken);
                }
            }
            catch (TaskCanceledException ex) when (ex.InnerException is TimeoutException)
            {
                lastException = ex;
                _logger.LogWarning(
                    "Swarm API call timed out (attempt {Attempt}/{MaxRetries})",
                    attempt, _options.MaxRetries);

                if (attempt < _options.MaxRetries)
                {
                    await Task.Delay(_options.RetryDelayMs, cancellationToken);
                }
            }
        }

        return new SwarmActionResult
        {
            Success = false,
            Action = decision.Action,
            CountyId = decision.CountyId,
            ExecutedAt = DateTimeOffset.UtcNow,
            FailureReason = lastException?.Message ?? "Max retries exceeded"
        };
    }

    private async Task<SwarmActionResult> ExecuteHttpCallAsync(
        SwarmPolicyDecision decision,
        CancellationToken cancellationToken)
    {
        if (!ActionEndpoints.TryGetValue(decision.Action, out var endpoint))
        {
            throw new InvalidOperationException($"Unknown action type: {decision.Action}");
        }

        var url = $"{_options.SwarmControlPlaneUrl.TrimEnd('/')}{endpoint}";

        // Note: HttpClient from IHttpClientFactory should NOT be disposed by the consumer.
        // The factory manages the lifetime of the underlying HttpMessageHandler.
        var client = _httpClientFactory.CreateClient("SwarmBridge");
        client.Timeout = TimeSpan.FromSeconds(_options.TimeoutSeconds);

        var requestBody = new SwarmActionRequest
        {
            CountyId = decision.CountyId,
            Action = decision.Action.ToString(),
            Reason = decision.Reason,
            Timestamp = decision.Timestamp
        };

        var response = await client.PostAsJsonAsync(url, requestBody, JsonOptions, cancellationToken);
        var responseContent = await response.Content.ReadAsStringAsync(cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            return new SwarmActionResult
            {
                Success = false,
                Action = decision.Action,
                CountyId = decision.CountyId,
                ExecutedAt = DateTimeOffset.UtcNow,
                FailureReason = $"HTTP {(int)response.StatusCode}: {responseContent}"
            };
        }

        // Try to parse response message
        string? responseMessage = null;
        try
        {
            var responseObj = JsonSerializer.Deserialize<SwarmActionResponse>(responseContent, JsonOptions);
            responseMessage = responseObj?.Message;
        }
        catch (JsonException)
        {
            // Ignore parsing errors - response may not be JSON
        }

        return new SwarmActionResult
        {
            Success = true,
            Action = decision.Action,
            CountyId = decision.CountyId,
            ExecutedAt = DateTimeOffset.UtcNow,
            ResponseMessage = responseMessage
        };
    }

    /// <summary>
    /// Request body for Swarm control plane API.
    /// </summary>
    private sealed class SwarmActionRequest
    {
        public string CountyId { get; init; } = "";
        public string Action { get; init; } = "";
        public string Reason { get; init; } = "";
        public DateTimeOffset Timestamp { get; init; }
    }

    /// <summary>
    /// Response from Swarm control plane API.
    /// </summary>
    private sealed class SwarmActionResponse
    {
        public bool Success { get; init; }
        public string? Message { get; init; }
        public int? NewCapacity { get; init; }
        public string? Model { get; init; }
    }
}

/// <summary>
/// Interface for Swarm Bridge Service.
/// </summary>
public interface ISystemGptSwarmBridgeService
{
    Task<SwarmActionResult> ExecuteActionAsync(SwarmPolicyDecision decision, CancellationToken cancellationToken = default);
}

/// <summary>
/// Phase 30: Configuration options for Swarm Bridge.
/// Moved to Models file for shared access.
/// </summary>
public class SwarmBridgeOptions
{
    /// <summary>Configuration section name.</summary>
    public const string SectionName = "SystemGptSwarm:Bridge";

    /// <summary>URL of the Swarm control plane API.</summary>
    public string SwarmControlPlaneUrl { get; init; } = "http://localhost:9000/swarm";

    /// <summary>HTTP timeout in seconds.</summary>
    public int TimeoutSeconds { get; init; } = 30;

    /// <summary>Maximum number of retry attempts.</summary>
    public int MaxRetries { get; init; } = 3;

    /// <summary>Delay between retries in milliseconds.</summary>
    public int RetryDelayMs { get; init; } = 1000;
}
