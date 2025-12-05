/**
 * ═══════════════════════════════════════════════════════════════
 * TERRAFUSION OS - CODEX 3-6-9 SIGNALR HUB
 * Real-Time Divine Balance Broadcasting
 * Live Updates for 1,008 AI Agents + 39 Counties
 * THE TERRAFUSION WAY - GOVERNMENT. TRANSCENDED.
 * ═══════════════════════════════════════════════════════════════
 */

using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using TerraFusion.AI.DTOs;
using TerraFusion.AI.Services;

namespace TerraFusion.AI.Hubs;

/// <summary>
/// SignalR Hub for real-time Codex 3-6-9 Framework updates
/// Broadcasts divine balance metrics to all connected clients
/// </summary>
public class Codex369Hub : Hub
{
    private readonly ICodex369FrameworkService _codexService;
    private readonly ILogger<Codex369Hub> _logger;

    public Codex369Hub(
        ICodex369FrameworkService codexService,
        ILogger<Codex369Hub> logger)
    {
        _codexService = codexService;
        _logger = logger;
    }

    /// <summary>
    /// Subscribe to real-time framework updates
    /// </summary>
    public async Task SubscribeToFrameworkUpdates(string? countyId = null)
    {
        var groupName = countyId ?? "ALL_COUNTIES";

        await Groups.AddToGroupAsync(Context.ConnectionId, groupName);

        _logger.LogInformation("🔔 Client {ConnectionId} subscribed to Codex 3-6-9 updates: {Group}",
            Context.ConnectionId, groupName);

        // Send immediate status
        var status = await _codexService.GetRealtimeFrameworkStatusAsync(countyId);
        await Clients.Caller.SendAsync("FrameworkStatusUpdate", status);
    }

    /// <summary>
    /// Unsubscribe from framework updates
    /// </summary>
    public async Task UnsubscribeFromFrameworkUpdates(string? countyId = null)
    {
        var groupName = countyId ?? "ALL_COUNTIES";
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);

        _logger.LogInformation("🔕 Client {ConnectionId} unsubscribed from: {Group}",
            Context.ConnectionId, groupName);
    }

    /// <summary>
    /// Get current framework status on demand
    /// </summary>
    public async Task<Codex369StatusDto> GetCurrentStatus(string? countyId = null)
    {
        _logger.LogInformation("📊 Client {ConnectionId} requesting status for: {County}",
            Context.ConnectionId, countyId ?? "ALL");

        return await _codexService.GetRealtimeFrameworkStatusAsync(countyId);
    }

    /// <summary>
    /// Get foundation metrics only
    /// </summary>
    public async Task<List<FoundationMetric>> GetFoundationMetrics(string? countyId = null)
    {
        return await _codexService.MeasureFoundationMetricsAsync(countyId);
    }

    /// <summary>
    /// Get amplification metrics with 666 safeguard check
    /// </summary>
    public async Task<List<AmplificationMetric>> GetAmplificationMetrics(string? countyId = null)
    {
        var foundationMetrics = await _codexService.MeasureFoundationMetricsAsync(countyId);
        return await _codexService.AmplifyMetricsAsync(foundationMetrics);
    }

    /// <summary>
    /// Get ultimate power score
    /// </summary>
    public async Task<UltimatePowerMetric> GetUltimatePower(string? countyId = null)
    {
        var foundationMetrics = await _codexService.MeasureFoundationMetricsAsync(countyId);
        var amplifications = await _codexService.AmplifyMetricsAsync(foundationMetrics);
        return await _codexService.CalculateUltimatePowerAsync(amplifications);
    }

    /// <summary>
    /// Client requests manual balance recalculation
    /// </summary>
    public async Task RequestBalanceRecalculation(string? countyId = null)
    {
        _logger.LogInformation("🔄 Client {ConnectionId} requested balance recalculation: {County}",
            Context.ConnectionId, countyId ?? "ALL");

        var status = await _codexService.CalculateFrameworkStatusAsync(new Codex369CalculationRequest
        {
            CountyId = countyId,
            StartTime = DateTime.UtcNow.AddMinutes(-5),
            EndTime = DateTime.UtcNow,
            IncludeDetailedBreakdown = true,
            IncludeRecommendations = true
        });

        // Broadcast to group
        var groupName = countyId ?? "ALL_COUNTIES";
        await Clients.Group(groupName).SendAsync("FrameworkStatusUpdate", status);

        if (status.UltimatePower.InDivineBalance)
        {
            await Clients.Group(groupName).SendAsync("DivineBalanceAchieved", new
            {
                Score = status.CurrentPowerScore,
                Timestamp = DateTime.UtcNow,
                Message = "🌟 DIVINE BALANCE ACHIEVED!"
            });
        }
    }

    /// <summary>
    /// Handle client connection
    /// </summary>
    public override async Task OnConnectedAsync()
    {
        _logger.LogInformation("✅ Client connected to Codex 3-6-9 Hub: {ConnectionId}",
            Context.ConnectionId);

        await base.OnConnectedAsync();
    }

    /// <summary>
    /// Handle client disconnection
    /// </summary>
    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        _logger.LogInformation("❌ Client disconnected from Codex 3-6-9 Hub: {ConnectionId}",
            Context.ConnectionId);

        await base.OnDisconnectedAsync(exception);
    }
}

/// <summary>
/// Background service to broadcast periodic updates
/// </summary>
public class Codex369BroadcastService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<Codex369BroadcastService> _logger;
    private const int UPDATE_INTERVAL_SECONDS = 30; // Broadcast every 30 seconds

    public Codex369BroadcastService(
        IServiceProvider serviceProvider,
        ILogger<Codex369BroadcastService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("🚀 Codex 3-6-9 Broadcast Service started - Updates every {Seconds}s",
            UPDATE_INTERVAL_SECONDS);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await BroadcastFrameworkUpdates();
                await Task.Delay(TimeSpan.FromSeconds(UPDATE_INTERVAL_SECONDS), stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error in Codex 3-6-9 broadcast service");
            }
        }

        _logger.LogInformation("⏹️ Codex 3-6-9 Broadcast Service stopped");
    }

    private async Task BroadcastFrameworkUpdates()
    {
        using var scope = _serviceProvider.CreateScope();
        var codexService = scope.ServiceProvider.GetRequiredService<ICodex369FrameworkService>();
        var hubContext = scope.ServiceProvider.GetRequiredService<IHubContext<Codex369Hub>>();

        // Broadcast global status
        var globalStatus = await codexService.GetRealtimeFrameworkStatusAsync();
        await hubContext.Clients.Group("ALL_COUNTIES").SendAsync("FrameworkStatusUpdate", globalStatus);

        // Check for divine balance achievement
        if (globalStatus.UltimatePower.InDivineBalance)
        {
            _logger.LogInformation("🌟 Broadcasting DIVINE BALANCE achievement: {Score:F2}/12",
                globalStatus.CurrentPowerScore);

            await hubContext.Clients.All.SendAsync("DivineBalanceAchieved", new
            {
                Score = globalStatus.CurrentPowerScore,
                Proximity = globalStatus.UltimatePower.BalanceProximity,
                Status = globalStatus.UltimatePower.HealthStatus,
                Timestamp = DateTime.UtcNow,
                Message = $"🌟 DIVINE BALANCE: {globalStatus.CurrentPowerScore:F2}/12 ({globalStatus.UltimatePower.BalanceProximity:P1} proximity)"
            });
        }

        // Check for 666 safeguard warnings
        var unsafeAmplifications = globalStatus.AmplificationMetrics
            .Where(a => !a.SafeFromImbalance)
            .ToList();

        if (unsafeAmplifications.Any())
        {
            _logger.LogWarning("⚠️ Broadcasting 666 safeguard warning: {Count} amplifications approaching threshold",
                unsafeAmplifications.Count);

            await hubContext.Clients.All.SendAsync("SafeguardWarning", new
            {
                UnsafeCount = unsafeAmplifications.Count,
                Amplifications = unsafeAmplifications.Select(a => new
                {
                    a.Name,
                    a.RawCombinedValue,
                    a.SafetyMargin
                }),
                Timestamp = DateTime.UtcNow,
                Message = $"⚠️ WARNING: {unsafeAmplifications.Count} amplifications approaching 666 threshold!"
            });
        }

        // Broadcast health summary
        await hubContext.Clients.All.SendAsync("HealthSummaryUpdate", new
        {
            CurrentPowerScore = globalStatus.CurrentPowerScore,
            TargetScore = 12.0,
            BalanceProximity = globalStatus.UltimatePower.BalanceProximity,
            InDivineBalance = globalStatus.UltimatePower.InDivineBalance,
            HealthStatus = globalStatus.UltimatePower.HealthStatus.ToString(),
            TotalMetrics = globalStatus.TotalFoundationMetrics,
            TotalAmplifications = globalStatus.TotalAmplifications,
            ComplianceAligned = globalStatus.ComplianceAligned,
            Timestamp = DateTime.UtcNow
        });
    }
}
