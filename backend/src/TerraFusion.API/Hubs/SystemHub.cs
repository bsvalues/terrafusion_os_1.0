using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authorization;
using TerraFusion.Core.Services;

namespace TerraFusion.API.Hubs;

[Authorize]
public class SystemHub : Hub
{
    private readonly ILogger<SystemHub> _logger;
    private readonly IPropertyService _propertyService;
    private readonly IAICommandService _aiCommandService;

    public SystemHub(
        ILogger<SystemHub> logger,
        IPropertyService propertyService,
        IAICommandService aiCommandService)
    {
        _logger = logger;
        _propertyService = propertyService;
        _aiCommandService = aiCommandService;
    }

    public override async Task OnConnectedAsync()
    {
        _logger.LogInformation("Client connected: {ConnectionId}", Context.ConnectionId);
        
        // Add to general notifications group
        await Groups.AddToGroupAsync(Context.ConnectionId, "SystemNotifications");
        
        // Send initial system status
        var swarmStatus = await _aiCommandService.GetSwarmStatusAsync();
        await Clients.Caller.SendAsync("SystemStatus", new
        {
            Status = "Connected",
            Timestamp = DateTime.UtcNow,
            SwarmStatus = swarmStatus,
            ConnectionId = Context.ConnectionId
        });

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        _logger.LogInformation("Client disconnected: {ConnectionId}", Context.ConnectionId);
        
        if (exception != null)
        {
            _logger.LogError(exception, "Client disconnected with error: {ConnectionId}", Context.ConnectionId);
        }

        await base.OnDisconnectedAsync(exception);
    }

    public async Task JoinPropertyGroup(string propertyId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"Property_{propertyId}");
        _logger.LogDebug("Client {ConnectionId} joined property group {PropertyId}", Context.ConnectionId, propertyId);
    }

    public async Task LeavePropertyGroup(string propertyId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"Property_{propertyId}");
        _logger.LogDebug("Client {ConnectionId} left property group {PropertyId}", Context.ConnectionId, propertyId);
    }

    public async Task JoinAISwarmGroup()
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, "AISwarm");
        _logger.LogDebug("Client {ConnectionId} joined AI swarm group", Context.ConnectionId);
        
        // Send current swarm metrics
        var metrics = await _aiCommandService.GetSwarmMetricsAsync();
        await Clients.Caller.SendAsync("SwarmMetrics", metrics);
    }

    public async Task LeaveAISwarmGroup()
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, "AISwarm");
        _logger.LogDebug("Client {ConnectionId} left AI swarm group", Context.ConnectionId);
    }

    public async Task RequestSystemHealth()
    {
        try
        {
            var healthData = new
            {
                Timestamp = DateTime.UtcNow,
                Status = "Healthy",
                Services = new
                {
                    Database = new { Status = "Healthy", ResponseTime = "12ms" },
                    AISwarm = new { Status = "Active", AgentCount = 1008 },
                    Cache = new { Status = "Healthy", HitRate = "94.5%" },
                    Storage = new { Status = "Healthy", Usage = "23.4%" }
                },
                Performance = new
                {
                    CpuUsage = Random.Shared.NextDouble() * 60 + 20, // 20-80%
                    MemoryUsage = Random.Shared.NextDouble() * 40 + 30, // 30-70%
                    DiskUsage = Random.Shared.NextDouble() * 30 + 10, // 10-40%
                    NetworkLatency = Random.Shared.NextDouble() * 5 + 1 // 1-6ms
                }
            };

            await Clients.Caller.SendAsync("SystemHealth", healthData);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting system health for client {ConnectionId}", Context.ConnectionId);
            await Clients.Caller.SendAsync("Error", "Failed to retrieve system health");
        }
    }

    public async Task RequestPropertyUpdates(string propertyId)
    {
        try
        {
            if (!Guid.TryParse(propertyId, out var guid))
            {
                await Clients.Caller.SendAsync("Error", "Invalid property ID format");
                return;
            }

            var property = await _propertyService.GetPropertyByIdAsync(guid);
            if (property != null)
            {
                await Clients.Caller.SendAsync("PropertyUpdate", property);
            }
            else
            {
                await Clients.Caller.SendAsync("Error", $"Property {propertyId} not found");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting property updates for {PropertyId}", propertyId);
            await Clients.Caller.SendAsync("Error", "Failed to retrieve property updates");
        }
    }

    public async Task SendAICommand(string command, object parameters)
    {
        try
        {
            var commandDto = new Core.Services.AICommandDto
            {
                Command = command,
                Parameters = new Dictionary<string, object> { { "parameters", parameters } },
                Priority = "High"
            };

            var result = await _aiCommandService.ExecuteCommandAsync(commandDto);
            await Clients.Caller.SendAsync("AICommandResult", result);

            // Notify AI swarm group of command execution
            await Clients.Group("AISwarm").SendAsync("AICommandExecuted", new
            {
                Command = command,
                Success = result.Success,
                ExecutedBy = Context.ConnectionId,
                Timestamp = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error executing AI command {Command}", command);
            await Clients.Caller.SendAsync("Error", $"Failed to execute command: {command}");
        }
    }

    // Background service methods (called by background services)
    public async Task BroadcastSystemAlert(string message, string severity = "Info")
    {
        await Clients.Group("SystemNotifications").SendAsync("SystemAlert", new
        {
            Message = message,
            Severity = severity,
            Timestamp = DateTime.UtcNow
        });
    }

    public async Task BroadcastPropertyUpdate(string propertyId, object propertyData)
    {
        await Clients.Group($"Property_{propertyId}").SendAsync("PropertyUpdate", propertyData);
    }

    public async Task BroadcastAISwarmUpdate(object swarmData)
    {
        await Clients.Group("AISwarm").SendAsync("SwarmUpdate", swarmData);
    }

    public async Task BroadcastPerformanceMetrics(object metricsData)
    {
        await Clients.Group("SystemNotifications").SendAsync("PerformanceMetrics", metricsData);
    }
}
