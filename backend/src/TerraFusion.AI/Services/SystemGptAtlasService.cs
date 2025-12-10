// ═══════════════════════════════════════════════════════════════════════════════
// 🗺️ TerraFusion SystemGPT Atlas Service
// Phase 28: Map-Based AI Health Visualization
// "See the health of your AI valuation fleet across counties in a single glance."
// Government. Transcended.
// ═══════════════════════════════════════════════════════════════════════════════

using Microsoft.Extensions.Logging;
using TerraFusion.AI.Models;

namespace TerraFusion.AI.Services;

/// <summary>
/// Phase 28: Service interface for SystemGPT Atlas map visualization.
/// Aggregates health, capacity, RAG, drift, and guardrail data into map nodes.
/// </summary>
public interface ISystemGptAtlasService
{
    /// <summary>
    /// Get the atlas data for all counties.
    /// </summary>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Atlas response with all county nodes.</returns>
    Task<SystemGptAtlasResponseDto> GetAtlasAsync(CancellationToken cancellationToken = default);
}

/// <summary>
/// Phase 28: Implementation of SystemGPT Atlas service.
/// Aggregates data from federated overview, RAG fleet, and guardrails.
/// </summary>
public class SystemGptAtlasService : ISystemGptAtlasService
{
    private readonly ISystemGptFederatedOverviewService? _federatedOverviewService;
    private readonly ISystemGptRagFleetService? _ragFleetService;
    private readonly ISystemGptGuardrailService? _guardrailService;
    private readonly ILogger<SystemGptAtlasService> _logger;

    // Hard-coded pseudo-map positions for WA tri-county region
    // These are relative positions (0-1) for visual layout
    private static readonly Dictionary<string, (double X, double Y)> CountyMapPositions = new(StringComparer.OrdinalIgnoreCase)
    {
        ["benton"] = (0.40, 0.70),   // Benton: Lower-left area
        ["yakima"] = (0.60, 0.55),   // Yakima: Upper-right area
        ["franklin"] = (0.50, 0.85)  // Franklin: Lower-center area
    };

    public SystemGptAtlasService(
        ILogger<SystemGptAtlasService> logger,
        ISystemGptFederatedOverviewService? federatedOverviewService = null,
        ISystemGptRagFleetService? ragFleetService = null,
        ISystemGptGuardrailService? guardrailService = null)
    {
        _logger = logger;
        _federatedOverviewService = federatedOverviewService;
        _ragFleetService = ragFleetService;
        _guardrailService = guardrailService;
    }

    /// <inheritdoc />
    public async Task<SystemGptAtlasResponseDto> GetAtlasAsync(CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Phase 28: Generating SystemGPT Atlas data");
        var generatedAt = DateTimeOffset.UtcNow;

        // Fetch data from existing services
        var federatedOverview = await GetFederatedOverviewAsync(cancellationToken);
        var ragFleetReadiness = await GetRagFleetReadinessAsync(cancellationToken);

        // Build atlas nodes for each county
        var nodes = new List<SystemGptAtlasNodeDto>();
        foreach (var countyInfo in CountyHelper.AllCounties)
        {
            var node = BuildAtlasNode(
                countyInfo, 
                federatedOverview, 
                ragFleetReadiness);
            nodes.Add(node);
        }

        var configuredCount = nodes.Count(n => n.Configured);
        var healthyCount = nodes.Count(n => n.Health == "Healthy");

        _logger.LogInformation(
            "Phase 28: Atlas generated - {Total} counties, {Configured} configured, {Healthy} healthy",
            nodes.Count, configuredCount, healthyCount);

        return new SystemGptAtlasResponseDto
        {
            GeneratedAtUtc = generatedAt,
            Nodes = nodes.AsReadOnly(),
            TotalCounties = nodes.Count,
            ConfiguredCounties = configuredCount,
            HealthyCounties = healthyCount
        };
    }

    /// <summary>
    /// Build an atlas node for a single county by aggregating all available data.
    /// </summary>
    private SystemGptAtlasNodeDto BuildAtlasNode(
        CountyInfo countyInfo,
        SystemGptFederatedOverviewResponse? federatedOverview,
        RagFleetReadinessDto? ragFleetReadiness)
    {
        // Get county data from federated overview
        var countyOverview = federatedOverview?.Counties
            .FirstOrDefault(c => string.Equals(c.CountyId, countyInfo.Code, StringComparison.OrdinalIgnoreCase));

        // Get RAG county data from fleet readiness
        var ragCounty = ragFleetReadiness?.Counties
            .FirstOrDefault(c => string.Equals(c.CountyId, countyInfo.Code, StringComparison.OrdinalIgnoreCase));

        // Get guardrail decision for this county
        var guardrailDecision = GetLastGuardrailDecision(countyInfo.Code);

        // Determine fleet drift status for this county
        var (driftRisk, driftNote) = DetermineFleetDriftStatus(countyInfo.Code, ragCounty, ragFleetReadiness);

        // Get map position
        var (mapX, mapY) = GetMapPosition(countyInfo.Code);

        return new SystemGptAtlasNodeDto
        {
            CountyId = countyInfo.Code,
            CountyName = countyInfo.DisplayName,
            
            // Core signals from federated overview
            Health = countyOverview?.Health ?? "Unknown",
            CapacityRisk = countyOverview?.CapacityRisk ?? "Unknown",
            RagStatus = ragCounty?.RagStatus ?? countyOverview?.RagStatus ?? "Unknown",
            Configured = countyInfo.IsConfigured,
            
            // Fleet drift signals
            FleetRagDriftRisk = driftRisk,
            FleetRagNote = driftNote,
            
            // Guardrail signals
            RecentGuardrailDeny = guardrailDecision?.Allow == false,
            RecentSafeModeRecommended = guardrailDecision?.AutoSafeModeRecommended ?? false,
            
            // Map position
            MapX = mapX,
            MapY = mapY
        };
    }

    /// <summary>
    /// Determine the fleet drift status for a specific county.
    /// </summary>
    private (string DriftRisk, string? Note) DetermineFleetDriftStatus(
        string countyCode,
        RagCountyReadinessDto? ragCounty,
        RagFleetReadinessDto? fleetReadiness)
    {
        if (fleetReadiness == null || ragCounty == null)
            return ("Low", null);

        // If fleet has drift and this county is contributing
        var fleetDriftRisk = fleetReadiness.FleetDriftRisk;
        
        if (fleetDriftRisk == RagFleetDriftRisk.Low)
            return ("Low", null);

        // Check if this county is contributing to drift
        var isContributingToDrift = false;
        string? note = null;

        // Check if this county has stale/partial/unindexed status
        if (ragCounty.RagStatus is "Stale" or "Partial" or "Unindexed")
        {
            isContributingToDrift = true;
            note = $"{ragCounty.CountyName} RAG status: {ragCounty.RagStatus}";
        }

        // Check if this county has old index age
        if (ragCounty.IndexAgeHours.HasValue && ragCounty.IndexAgeHours > 24)
        {
            isContributingToDrift = true;
            var ageText = ragCounty.IndexAgeHours > 48 
                ? $"{(int)(ragCounty.IndexAgeHours / 24)} days old" 
                : $"{(int)ragCounty.IndexAgeHours}h old";
            note = note == null 
                ? $"{ragCounty.CountyName} index is {ageText}"
                : $"{note}; index is {ageText}";
        }

        if (isContributingToDrift)
        {
            return (fleetDriftRisk.ToString(), note);
        }

        // Fleet has drift but this county is not contributing
        return ("Low", null);
    }

    /// <summary>
    /// Get the last guardrail decision for a county (if available).
    /// </summary>
    private LastGuardrailDecisionDto? GetLastGuardrailDecision(string countyCode)
    {
        if (_guardrailService == null)
            return null;

        try
        {
            var countyId = CountyHelper.ParseCountyIdOrDefault(countyCode);
            var decision = _guardrailService.GetLastDecision(countyId);
            return decision != null 
                ? LastGuardrailDecisionDto.FromDecision(decision) 
                : null;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to get last guardrail decision for {County}", countyCode);
            return null;
        }
    }

    /// <summary>
    /// Get map position for a county.
    /// </summary>
    private static (double? X, double? Y) GetMapPosition(string countyCode)
    {
        if (CountyMapPositions.TryGetValue(countyCode, out var position))
            return (position.X, position.Y);
        
        // Default position for unknown counties
        return (0.5, 0.5);
    }

    /// <summary>
    /// Get federated overview data with graceful fallback.
    /// </summary>
    private async Task<SystemGptFederatedOverviewResponse?> GetFederatedOverviewAsync(CancellationToken cancellationToken)
    {
        if (_federatedOverviewService == null)
        {
            _logger.LogDebug("Phase 28: FederatedOverviewService not registered, using fallback data");
            return null;
        }

        try
        {
            return await _federatedOverviewService.GetOverviewAsync();
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to get federated overview for Atlas");
            return null;
        }
    }

    /// <summary>
    /// Get RAG fleet readiness data with graceful fallback.
    /// </summary>
    private async Task<RagFleetReadinessDto?> GetRagFleetReadinessAsync(CancellationToken cancellationToken)
    {
        if (_ragFleetService == null)
        {
            _logger.LogDebug("Phase 28: RagFleetService not registered, using fallback data");
            return null;
        }

        try
        {
            return await _ragFleetService.GetFleetReadinessAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to get RAG fleet readiness for Atlas");
            return null;
        }
    }
}
