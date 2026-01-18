/**
 * TelemetryHub
 *
 * SignalR hub for real-time agent telemetry and system monitoring.
 * Broadcasts AI agent metrics, system health, and performance data.
 *
 * @author TerraFusion Elite Government OS Engineering Agent
 * @version 1.0.0 - Phase 1 Foundation
 */

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using TerraFusion.StreamingAnalytics.Services;

namespace TerraFusion.StreamingAnalytics.Hubs;

/// <summary>
/// SignalR hub for agent telemetry streaming
/// </summary>
[Authorize]
public class TelemetryHub : Hub
{
    private readonly ILogger<TelemetryHub> _logger;
    private readonly IAgentTelemetryService _telemetryService;

    public TelemetryHub(
        ILogger<TelemetryHub> logger,
        IAgentTelemetryService telemetryService)
    {
        _logger = logger;
        _telemetryService = telemetryService;
    }

    public override async Task OnConnectedAsync()
    {
        var connectionId = Context.ConnectionId;
        var userId = Context.User?.Identity?.Name ?? "Anonymous";

        _logger.LogInformation(
            "Client connected to TelemetryHub: ConnectionId={ConnectionId}, User={User}",
            connectionId,
            userId
        );

        await Clients.Caller.SendAsync("Connected", new
        {
            ConnectionId = connectionId,
            Timestamp = DateTime.UtcNow,
            Message = "Connected to TerraFusion Telemetry Hub"
        });

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        if (exception != null)
        {
            _logger.LogWarning(
                exception,
                "Client disconnected with error: ConnectionId={ConnectionId}",
                Context.ConnectionId
            );
        }

        await base.OnDisconnectedAsync(exception);
    }

    /// <summary>
    /// Subscribe to agent telemetry updates
    /// </summary>
    public async Task SubscribeToAgentTelemetry(string agentId)
    {
        _logger.LogInformation(
            "Subscribing to agent telemetry: ConnectionId={ConnectionId}, AgentId={AgentId}",
            Context.ConnectionId,
            agentId
        );

        await Groups.AddToGroupAsync(Context.ConnectionId, $"agent:{agentId}");

        await Clients.Caller.SendAsync("TelemetrySubscriptionConfirmed", new
        {
            AgentId = agentId,
            Timestamp = DateTime.UtcNow
        });
    }

    /// <summary>
    /// Subscribe to swarm-wide telemetry
    /// </summary>
    public async Task SubscribeToSwarmTelemetry()
    {
        _logger.LogInformation(
            "Subscribing to swarm telemetry: ConnectionId={ConnectionId}",
            Context.ConnectionId
        );

        await Groups.AddToGroupAsync(Context.ConnectionId, "swarm:all");

        await Clients.Caller.SendAsync("SwarmTelemetrySubscriptionConfirmed", new
        {
            Timestamp = DateTime.UtcNow
        });
    }

    /// <summary>
    /// Get current agent telemetry snapshot
    /// </summary>
    public async Task<object> GetAgentTelemetry(string agentId)
    {
        var telemetry = await _telemetryService.GetAgentTelemetryAsync(agentId);

        return new
        {
            AgentId = agentId,
            Telemetry = telemetry,
            Timestamp = DateTime.UtcNow
        };
    }

    /// <summary>
    /// Get swarm-wide telemetry snapshot
    /// </summary>
    public async Task<object> GetSwarmTelemetry()
    {
        var telemetry = await _telemetryService.GetSwarmTelemetryAsync();

        return new
        {
            Telemetry = telemetry,
            Timestamp = DateTime.UtcNow
        };
    }

    /// <summary>
    /// Ping (health check)
    /// </summary>
    public Task<string> Ping()
    {
        return Task.FromResult("Pong");
    }
}
