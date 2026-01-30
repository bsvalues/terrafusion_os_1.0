// =============================================================================
// PACS Readiness Health Check - pacscontract.v1 Enforcement
// =============================================================================
// Integrates with ASP.NET Health Checks to enforce PACS compliance.
// When PACS is required (PACS_REQUIRED=true), readiness fails if PACS broken.
// =============================================================================

using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Logging;
using TerraFusion.Core.PACS;

namespace TerraFusion.API.Health;

/// <summary>
/// Health check for PACS contract compliance.
/// Integrates with /healthz/ready endpoint.
/// </summary>
/// <remarks>
/// <para><b>Behavior:</b></para>
/// <list type="bullet">
///   <item>If PACS_REQUIRED=true and PACS broken → Unhealthy (503)</item>
///   <item>If PACS_REQUIRED=true and PACS ok → Healthy (200)</item>
///   <item>If PACS_REQUIRED=false and PACS broken → Degraded (200)</item>
///   <item>If PACS_REQUIRED=false and PACS ok → Healthy (200)</item>
/// </list>
/// </remarks>
public sealed class PacsReadinessHealthCheck : IHealthCheck
{
    private readonly IPacsAdapter _pacsAdapter;
    private readonly IConfiguration _configuration;
    private readonly ILogger<PacsReadinessHealthCheck> _logger;

    private readonly bool _pacsRequired;

    public PacsReadinessHealthCheck(
        IPacsAdapter pacsAdapter,
        IConfiguration configuration,
        ILogger<PacsReadinessHealthCheck> logger)
    {
        _pacsAdapter = pacsAdapter ?? throw new ArgumentNullException(nameof(pacsAdapter));
        _configuration = configuration ?? throw new ArgumentNullException(nameof(configuration));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));

        // Config-driven, not environment-guessed
        _pacsRequired = configuration.GetValue<bool>("PACS:Required", false)
                     || configuration.GetValue<bool>("PACS_REQUIRED", false)
                     || Environment.GetEnvironmentVariable("PACS_REQUIRED")?.Equals("true", StringComparison.OrdinalIgnoreCase) == true;

        _logger.LogInformation("PACS readiness check initialized: required={Required}", _pacsRequired);
    }

    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        var startTime = DateTime.UtcNow;

        try
        {
            // Validate PACS contract
            var proof = await _pacsAdapter.ValidateContractAsync(cancellationToken);

            var latencyMs = (DateTime.UtcNow - startTime).TotalMilliseconds;

            var data = new Dictionary<string, object>
            {
                ["contract"] = "pacscontract.v1",
                ["pacs_required"] = _pacsRequired,
                ["latency_ms"] = latencyMs,
                ["timestamp"] = DateTime.UtcNow
            };

            if (proof.IsValid)
            {
                _logger.LogDebug("PACS readiness check passed in {Latency}ms", latencyMs);

                data["database_connection"] = "ok";
                data["views"] = "ok";
                data["health_check"] = "ok";

                return HealthCheckResult.Healthy(
                    $"PACS contract valid (latency: {latencyMs:F0}ms)",
                    data);
            }

            // Contract invalid
            data["errors"] = proof.Errors;
            data["warnings"] = proof.Warnings;
            data["database_connection"] = proof.DatabaseConnection.Passed ? "ok" : "failed";
            data["views"] = proof.RequiredViews.Passed ? "ok" : "missing";
            data["health_check"] = proof.HealthCheckExecution.Passed ? "ok" : "failed";

            var errorSummary = $"PACS contract invalid: {string.Join("; ", proof.Errors)}";

            if (_pacsRequired)
            {
                // Fail-closed: PACS required but broken → Unhealthy (503)
                _logger.LogError(
                    "PACS readiness FAILED (required=true): {ErrorCount} errors",
                    proof.Errors.Count);

                return HealthCheckResult.Unhealthy(errorSummary, null, data);
            }
            else
            {
                // PACS not required but broken → Degraded (still 200)
                _logger.LogWarning(
                    "PACS readiness DEGRADED (required=false): {ErrorCount} errors",
                    proof.Errors.Count);

                return HealthCheckResult.Degraded(errorSummary, null, data);
            }
        }
        catch (PacsContractViolationException ex)
        {
            var data = new Dictionary<string, object>
            {
                ["contract"] = "pacscontract.v1",
                ["pacs_required"] = _pacsRequired,
                ["error_code"] = ex.ErrorCode,
                ["error"] = ex.Message,
                ["timestamp"] = DateTime.UtcNow
            };

            if (_pacsRequired)
            {
                _logger.LogError(ex, "PACS contract violation (required=true): {ErrorCode}", ex.ErrorCode);
                return HealthCheckResult.Unhealthy($"PACS contract violation: {ex.ErrorCode}", ex, data);
            }
            else
            {
                _logger.LogWarning(ex, "PACS contract violation (required=false): {ErrorCode}", ex.ErrorCode);
                return HealthCheckResult.Degraded($"PACS contract violation: {ex.ErrorCode}", ex, data);
            }
        }
        catch (Exception ex)
        {
            var data = new Dictionary<string, object>
            {
                ["contract"] = "pacscontract.v1",
                ["pacs_required"] = _pacsRequired,
                ["error"] = ex.Message,
                ["timestamp"] = DateTime.UtcNow
            };

            if (_pacsRequired)
            {
                _logger.LogError(ex, "PACS readiness check failed unexpectedly (required=true)");
                return HealthCheckResult.Unhealthy($"PACS check failed: {ex.Message}", ex, data);
            }
            else
            {
                _logger.LogWarning(ex, "PACS readiness check failed unexpectedly (required=false)");
                return HealthCheckResult.Degraded($"PACS check failed: {ex.Message}", ex, data);
            }
        }
    }
}

/// <summary>
/// Extension methods to register PACS health checks.
/// </summary>
public static class PacsHealthCheckExtensions
{
    /// <summary>
    /// Adds PACS readiness health check to the health check builder.
    /// </summary>
    /// <param name="builder">Health check builder.</param>
    /// <param name="tags">Optional tags (defaults to "ready").</param>
    /// <returns>Builder for chaining.</returns>
    public static IHealthChecksBuilder AddPacsReadiness(
        this IHealthChecksBuilder builder,
        params string[] tags)
    {
        var healthTags = tags.Length > 0 ? tags : new[] { "ready", "pacs" };

        return builder.AddCheck<PacsReadinessHealthCheck>(
            "pacs-contract",
            failureStatus: HealthStatus.Unhealthy,
            tags: healthTags);
    }
}
