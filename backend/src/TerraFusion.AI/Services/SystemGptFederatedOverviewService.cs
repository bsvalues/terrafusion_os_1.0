// ═══════════════════════════════════════════════════════════════════════════════
// 📊 TerraFusion SystemGPT Federated Overview Service
// Phase 23: Multi-County Dashboard - Aggregates all counties' SystemGPT status
// Government. Transcended.
// ═══════════════════════════════════════════════════════════════════════════════

using Microsoft.Extensions.Logging;
using TerraFusion.AI.Models;

namespace TerraFusion.AI.Services;

/// <summary>
/// Phase 23: Service interface for aggregating SystemGPT status across all counties.
/// Provides a federated view for the Multi-County Dashboard.
/// </summary>
public interface ISystemGptFederatedOverviewService
{
    /// <summary>
    /// Get an overview of all counties' SystemGPT operational status.
    /// </summary>
    /// <returns>Federated overview response with all counties' data.</returns>
    Task<SystemGptFederatedOverviewResponse> GetOverviewAsync();
}

/// <summary>
/// Phase 23: Implementation of the federated overview service.
/// Aggregates existing per-county services into a single multi-county dashboard view.
/// </summary>
public class SystemGptFederatedOverviewService : ISystemGptFederatedOverviewService
{
    private readonly ISystemGptMetricsService? _metricsService;
    private readonly ISystemGptModeService? _modeService;
    private readonly IBentonRagReadinessService? _bentonRagService;
    private readonly ILogger<SystemGptFederatedOverviewService> _logger;

    /// <summary>
    /// Default metrics window for federated overview (15 minutes).
    /// </summary>
    private static readonly TimeSpan DefaultMetricsWindow = TimeSpan.FromMinutes(15);

    public SystemGptFederatedOverviewService(
        ILogger<SystemGptFederatedOverviewService> logger,
        ISystemGptMetricsService? metricsService = null,
        ISystemGptModeService? modeService = null,
        IBentonRagReadinessService? bentonRagService = null)
    {
        _logger = logger;
        _metricsService = metricsService;
        _modeService = modeService;
        _bentonRagService = bentonRagService;
    }

    /// <inheritdoc />
    public async Task<SystemGptFederatedOverviewResponse> GetOverviewAsync()
    {
        _logger.LogInformation("SystemGPT: Generating federated overview for all counties");
        var generatedAt = DateTimeOffset.UtcNow;

        var counties = new List<SystemGptCountyOverviewDto>();

        foreach (var countyInfo in CountyHelper.AllCounties)
        {
            try
            {
                var overview = await BuildCountyOverviewAsync(countyInfo);
                counties.Add(overview);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to build overview for {County}, using fallback", countyInfo.DisplayName);
                counties.Add(CreateFallbackOverview(countyInfo, "Error retrieving data"));
            }
        }

        var configuredCount = counties.Count(c => c.Configured);

        _logger.LogInformation("SystemGPT: Federated overview complete - {Total} counties, {Configured} configured",
            counties.Count, configuredCount);

        return new SystemGptFederatedOverviewResponse
        {
            GeneratedAtUtc = generatedAt,
            TotalCounties = counties.Count,
            ConfiguredCounties = configuredCount,
            Counties = counties.AsReadOnly()
        };
    }

    /// <summary>
    /// Build the overview for a single county by aggregating available services.
    /// </summary>
    private async Task<SystemGptCountyOverviewDto> BuildCountyOverviewAsync(CountyInfo countyInfo)
    {
        // Non-configured counties return placeholder data
        if (!countyInfo.IsConfigured)
        {
            return CreateFallbackOverview(countyInfo, "Not configured");
        }

        // For Benton County (configured), aggregate real data
        var health = SystemHealthStatus.Healthy;
        var capacityRisk = "Low";
        double p95Latency = -1;
        double errorRate = -1;
        var ragStatus = "Unknown";
        var aiMode = "Normal";
        string? note = null;

        // Get metrics snapshot if available
        if (_metricsService != null)
        {
            try
            {
                var metrics = _metricsService.GetSnapshot(DefaultMetricsWindow);
                p95Latency = metrics.GptLatencyMsP95;
                errorRate = metrics.ErrorRatePercent;

                // Derive capacity risk from metrics
                if (metrics.Capacity != null)
                {
                    capacityRisk = metrics.Capacity.SaturationRisk;
                }

                // Derive health from error rate
                if (errorRate > 10)
                {
                    health = SystemHealthStatus.Unhealthy;
                }
                else if (errorRate > 5 || p95Latency > 2000)
                {
                    health = SystemHealthStatus.Degraded;
                }
            }
            catch (Exception ex)
            {
                _logger.LogDebug(ex, "Could not retrieve metrics for {County}", countyInfo.DisplayName);
                note = "Metrics unavailable";
            }
        }

        // Get AI mode if available
        if (_modeService != null)
        {
            try
            {
                aiMode = _modeService.CurrentMode == SystemGptMode.SafeMode ? "SafeMode" : "Normal";
                if (_modeService.IsSafeMode)
                {
                    // If in safe mode, consider it "degraded" for the overview
                    if (health == SystemHealthStatus.Healthy)
                    {
                        health = SystemHealthStatus.Degraded;
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogDebug(ex, "Could not retrieve mode for {County}", countyInfo.DisplayName);
            }
        }

        // Get RAG status if available (only for Benton)
        if (countyInfo.Id == CountyId.Benton && _bentonRagService != null)
        {
            try
            {
                var ragReadiness = await _bentonRagService.GetReadinessAsync();
                ragStatus = ragReadiness.OverallStatus.ToString();

                // If RAG is not ready, mark as degraded
                if (ragReadiness.OverallStatus != BentonRagStatus.Ready && health == SystemHealthStatus.Healthy)
                {
                    health = SystemHealthStatus.Degraded;
                }
            }
            catch (Exception ex)
            {
                _logger.LogDebug(ex, "Could not retrieve RAG status for {County}", countyInfo.DisplayName);
                ragStatus = "Unknown";
            }
        }

        return new SystemGptCountyOverviewDto
        {
            CountyId = countyInfo.Code,
            CountyName = countyInfo.DisplayName,
            Configured = countyInfo.IsConfigured,
            Health = health.ToString(),
            CapacityRisk = capacityRisk,
            P95LatencyMs = p95Latency,
            ErrorRatePercent = errorRate,
            RagStatus = ragStatus,
            AiMode = aiMode,
            Note = note
        };
    }

    /// <summary>
    /// Create a fallback overview for non-configured or error counties.
    /// </summary>
    private static SystemGptCountyOverviewDto CreateFallbackOverview(CountyInfo countyInfo, string note)
    {
        return new SystemGptCountyOverviewDto
        {
            CountyId = countyInfo.Code,
            CountyName = countyInfo.DisplayName,
            Configured = countyInfo.IsConfigured,
            Health = countyInfo.IsConfigured ? "Unknown" : "Unknown",
            CapacityRisk = "Unknown",
            P95LatencyMs = -1,
            ErrorRatePercent = -1,
            RagStatus = "Unknown",
            AiMode = "Unknown",
            Note = note
        };
    }
}
