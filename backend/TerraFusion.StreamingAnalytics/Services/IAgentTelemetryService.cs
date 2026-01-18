/**
 * IAgentTelemetryService Interface
 *
 * Service interface for AI agent telemetry collection and streaming.
 *
 * @author TerraFusion Elite Government OS Engineering Agent
 * @version 1.0.0 - Phase 1 Foundation
 */

namespace TerraFusion.StreamingAnalytics.Services;

/// <summary>
/// Service for agent telemetry management
/// </summary>
public interface IAgentTelemetryService
{
    /// <summary>
    /// Get telemetry for a specific agent
    /// </summary>
    Task<object> GetAgentTelemetryAsync(string agentId);

    /// <summary>
    /// Get swarm-wide telemetry aggregates
    /// </summary>
    Task<object> GetSwarmTelemetryAsync();

    /// <summary>
    /// Record agent telemetry update
    /// </summary>
    Task RecordTelemetryAsync(string agentId, object telemetryData);

    /// <summary>
    /// Get active agent count
    /// </summary>
    Task<int> GetActiveAgentCountAsync();
}
