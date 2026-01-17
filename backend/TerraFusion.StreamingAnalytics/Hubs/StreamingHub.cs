/*
 * StreamingHub
 *
 * SignalR hub for real-time metric streaming and live data visualization.
 * Broadcasts analytics metrics to connected TerraFlow clients.
 *
 * @author TerraFusion Elite Government OS Engineering Agent
 * @version 1.0.0 - Phase 1 Foundation
 */

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using TerraFusion.StreamingAnalytics.Services;

namespace TerraFusion.StreamingAnalytics.Hubs;

/// <summary>
/// SignalR hub for streaming analytics data
/// </summary>
[Authorize] // Require JWT authentication
public class StreamingHub : Hub
{
    private readonly ILogger<StreamingHub> _logger;
    private readonly IMetricStreamingService _metricService;

    public StreamingHub(
        ILogger<StreamingHub> logger,
        IMetricStreamingService metricService)
    {
        _logger = logger;
        _metricService = metricService;
    }

    /// <summary>
    /// Handle client connection
    /// </summary>
    public override async Task OnConnectedAsync()
    {
        var connectionId = Context.ConnectionId;
        var userId = Context.User?.Identity?.Name ?? "Anonymous";

        _logger.LogInformation(
            "Client connected to StreamingHub: ConnectionId={ConnectionId}, User={User}",
            connectionId,
            userId
        );

        // Send welcome message
        await Clients.Caller.SendAsync("Connected", new
        {
            ConnectionId = connectionId,
            Timestamp = DateTime.UtcNow,
            Message = "Connected to TerraFusion StreamingAnalytics Hub"
        });

        await base.OnConnectedAsync();
    }

    /// <summary>
    /// Handle client disconnection
    /// </summary>
    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var connectionId = Context.ConnectionId;

        if (exception != null)
        {
            _logger.LogWarning(
                exception,
                "Client disconnected with error: ConnectionId={ConnectionId}",
                connectionId
            );
        }
        else
        {
            _logger.LogInformation(
                "Client disconnected: ConnectionId={ConnectionId}",
                connectionId
            );
        }

        await base.OnDisconnectedAsync(exception);
    }

    /// <summary>
    /// Subscribe to metric stream
    /// </summary>
    /// <param name="metricName">Name of metric to stream</param>
    /// <param name="intervalMs">Streaming interval in milliseconds</param>
    public async Task SubscribeToMetric(string metricName, int intervalMs = 1000)
    {
        _logger.LogInformation(
            "Client subscribed to metric: ConnectionId={ConnectionId}, Metric={Metric}, Interval={Interval}ms",
            Context.ConnectionId,
            metricName,
            intervalMs
        );

        await Clients.Caller.SendAsync("SubscriptionConfirmed", new
        {
            MetricName = metricName,
            Interval = intervalMs,
            Timestamp = DateTime.UtcNow
        });
    }

    /// <summary>
    /// Unsubscribe from metric stream
    /// </summary>
    public async Task UnsubscribeFromMetric(string metricName)
    {
        _logger.LogInformation(
            "Client unsubscribed from metric: ConnectionId={ConnectionId}, Metric={Metric}",
            Context.ConnectionId,
            metricName
        );

        await Clients.Caller.SendAsync("UnsubscriptionConfirmed", new
        {
            MetricName = metricName,
            Timestamp = DateTime.UtcNow
        });
    }

    /// <summary>
    /// Join a named group for filtered broadcasting
    /// </summary>
    public async Task JoinGroup(string groupName)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, groupName);

        _logger.LogInformation(
            "Client joined group: ConnectionId={ConnectionId}, Group={Group}",
            Context.ConnectionId,
            groupName
        );

        await Clients.Caller.SendAsync("GroupJoined", new
        {
            GroupName = groupName,
            Timestamp = DateTime.UtcNow
        });
    }

    /// <summary>
    /// Leave a named group
    /// </summary>
    public async Task LeaveGroup(string groupName)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);

        _logger.LogInformation(
            "Client left group: ConnectionId={ConnectionId}, Group={Group}",
            Context.ConnectionId,
            groupName
        );

        await Clients.Caller.SendAsync("GroupLeft", new
        {
            GroupName = groupName,
            Timestamp = DateTime.UtcNow
        });
    }

    /// <summary>
    /// Get current metric value (on-demand)
    /// </summary>
    public async Task<object> GetMetric(string metricName)
    {
        _logger.LogInformation(
            "Client requested metric: ConnectionId={ConnectionId}, Metric={Metric}",
            Context.ConnectionId,
            metricName
        );

        var value = await _metricService.GetMetricAsync(metricName);

        return new
        {
            MetricName = metricName,
            Value = value,
            Timestamp = DateTime.UtcNow
        };
    }

    /// <summary>
    /// Ping (health check from client)
    /// </summary>
    public Task<string> Ping()
    {
        return Task.FromResult("Pong");
    }
}
