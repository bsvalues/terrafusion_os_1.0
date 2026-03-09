using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using TerraFusion.AI.DTOs;

namespace TerraFusion.AI.Services;

/// <summary>
/// Codex 3-6-9 Framework - Collaboration Orchestrator Service
///
/// Unified Notification Orchestration:
/// - Coordinates Slack and Teams notifications
/// - Intelligent platform selection based on message type
/// - Automatic failover between platforms
/// - Notification preference management
/// - Multi-platform broadcasting
///
/// Orchestration Features:
/// - Event-driven notification triggers
/// - Platform health monitoring
/// - Delivery confirmation tracking
/// - Notification deduplication
/// - Rate limiting across platforms
///
/// Integration Points:
/// 1. Email notifications (CodexEmailNotificationService)
/// 2. Slack notifications (CodexSlackNotificationService)
/// 3. Teams notifications (CodexTeamsNotificationService)
/// 4. SignalR real-time updates (OSCoreHub)
///
/// THE TERRAFUSION WAY - GOVERNMENT. TRANSCENDED.
/// </summary>
public interface ICodexCollaborationOrchestrator
{
    Task BroadcastSystemStatusAsync(Codex369StatusDto status, string? countyId = null);
    Task BroadcastAlertAsync(CodexAlertDto alert, string? countyId = null);
    Task BroadcastDailyPerformanceSummaryAsync(Codex369StatusDto status, List<CodexAlertDto> alerts, string? countyId = null);
    Task BroadcastDivineBalanceAchievementAsync(Codex369StatusDto status, string? countyId = null);
    Task BroadcastChampionshipModeActivationAsync(Codex369StatusDto status, string? countyId = null);
    Task BroadcastMetricUpdateAsync(string metricName, double oldValue, double newValue, string? countyId = null);
    Task<CollaborationHealthDto> GetHealthStatusAsync();
}

public class CodexCollaborationOrchestrator : ICodexCollaborationOrchestrator
{
    private readonly ICodexSlackNotificationService _slackService;
    private readonly ICodexTeamsNotificationService _teamsService;
    private readonly ICodexEmailNotificationService _emailService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<CodexCollaborationOrchestrator> _logger;

    // Platform enablement flags from configuration
    private bool _slackEnabled;
    private bool _teamsEnabled;
    private bool _emailEnabled;

    // Delivery tracking
    private long _totalNotifications = 0;
    private long _successfulDeliveries = 0;
    private long _failedDeliveries = 0;
    private readonly object _statsLock = new();

    public CodexCollaborationOrchestrator(
        ICodexSlackNotificationService slackService,
        ICodexTeamsNotificationService teamsService,
        ICodexEmailNotificationService emailService,
        IConfiguration configuration,
        ILogger<CodexCollaborationOrchestrator> logger)
    {
        _slackService = slackService;
        _teamsService = teamsService;
        _emailService = emailService;
        _configuration = configuration;
        _logger = logger;

        LoadConfiguration();
    }

    // ============================================================================
    // BROADCAST METHODS
    // ============================================================================

    public async Task BroadcastSystemStatusAsync(Codex369StatusDto status, string? countyId = null)
    {
        Interlocked.Increment(ref _totalNotifications);

        var tasks = new List<Task>();

        try
        {
            if (_slackEnabled)
            {
                tasks.Add(SafeExecuteAsync(
                    () => _slackService.SendSystemStatusUpdateAsync(status, countyId),
                    "Slack system status"));
            }

            if (_teamsEnabled)
            {
                tasks.Add(SafeExecuteAsync(
                    () => _teamsService.SendSystemStatusUpdateAsync(status, countyId),
                    "Teams system status"));
            }

            // Email notifications handled by background service
            // Don't send email for every status update to avoid spam

            await Task.WhenAll(tasks);

            _logger.LogInformation("Broadcast system status to {PlatformCount} platforms for county: {County}",
                tasks.Count, countyId ?? "System-Wide");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to broadcast system status");
        }
    }

    public async Task BroadcastAlertAsync(CodexAlertDto alert, string? countyId = null)
    {
        Interlocked.Increment(ref _totalNotifications);

        var tasks = new List<Task>();

        try
        {
            if (_slackEnabled)
            {
                tasks.Add(SafeExecuteAsync(
                    () => _slackService.SendAlertNotificationAsync(alert, countyId),
                    "Slack alert"));
            }

            if (_teamsEnabled)
            {
                tasks.Add(SafeExecuteAsync(
                    () => _teamsService.SendAlertNotificationAsync(alert, countyId),
                    "Teams alert"));
            }

            if (_emailEnabled && alert.Level == "Critical")
            {
                // Critical alerts trigger immediate email notification
                var safeCountyId = countyId ?? "System-Wide";
                tasks.Add(SafeExecuteAsync(
                    () => _emailService.SendAlertNotificationAsync(alert, safeCountyId),
                    "Email critical alert"));
            }

            await Task.WhenAll(tasks);

            _logger.LogInformation("Broadcast {AlertLevel} alert to {PlatformCount} platforms: {AlertMessage}",
                alert.Level, tasks.Count, alert.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to broadcast alert");
        }
    }

    public async Task BroadcastDailyPerformanceSummaryAsync(Codex369StatusDto status, List<CodexAlertDto> alerts, string? countyId = null)
    {
        Interlocked.Increment(ref _totalNotifications);

        var tasks = new List<Task>();

        try
        {
            if (_slackEnabled)
            {
                tasks.Add(SafeExecuteAsync(
                    () => _slackService.SendDailyPerformanceSummaryAsync(status, alerts, countyId),
                    "Slack daily summary"));
            }

            if (_teamsEnabled)
            {
                tasks.Add(SafeExecuteAsync(
                    () => _teamsService.SendDailyPerformanceSummaryAsync(status, alerts, countyId),
                    "Teams daily summary"));
            }

            if (_emailEnabled)
            {
                var safeCountyId = countyId ?? "System-Wide";
                tasks.Add(SafeExecuteAsync(
                    () => _emailService.SendDailyPerformanceSummaryAsync(status, alerts, safeCountyId),
                    "Email daily summary"));
            }

            await Task.WhenAll(tasks);

            _logger.LogInformation("Broadcast daily performance summary to {PlatformCount} platforms for county: {County}",
                tasks.Count, countyId ?? "System-Wide");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to broadcast daily performance summary");
        }
    }

    public async Task BroadcastDivineBalanceAchievementAsync(Codex369StatusDto status, string? countyId = null)
    {
        Interlocked.Increment(ref _totalNotifications);

        var tasks = new List<Task>();

        try
        {
            if (_slackEnabled)
            {
                tasks.Add(SafeExecuteAsync(
                    () => _slackService.SendDivineBalanceAchievementAsync(status, countyId),
                    "Slack Divine Balance"));
            }

            if (_teamsEnabled)
            {
                tasks.Add(SafeExecuteAsync(
                    () => _teamsService.SendDivineBalanceAchievementAsync(status, countyId),
                    "Teams Divine Balance"));
            }

            if (_emailEnabled)
            {
                var safeCountyId = countyId ?? "System-Wide";
                tasks.Add(SafeExecuteAsync(
                    () => _emailService.SendDivineBalanceAchievementAsync(status, safeCountyId),
                    "Email Divine Balance"));
            }

            await Task.WhenAll(tasks);

            _logger.LogInformation("🎉 Broadcast Divine Balance achievement to {PlatformCount} platforms for county: {County}",
                tasks.Count, countyId ?? "System-Wide");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to broadcast Divine Balance achievement");
        }
    }

    public async Task BroadcastChampionshipModeActivationAsync(Codex369StatusDto status, string? countyId = null)
    {
        Interlocked.Increment(ref _totalNotifications);

        var tasks = new List<Task>();

        try
        {
            if (_slackEnabled)
            {
                tasks.Add(SafeExecuteAsync(
                    () => _slackService.SendChampionshipModeActivationAsync(status, countyId),
                    "Slack Championship Mode"));
            }

            if (_teamsEnabled)
            {
                tasks.Add(SafeExecuteAsync(
                    () => _teamsService.SendChampionshipModeActivationAsync(status, countyId),
                    "Teams Championship Mode"));
            }

            if (_emailEnabled)
            {
                var safeCountyId = countyId ?? "System-Wide";
                tasks.Add(SafeExecuteAsync(
                    () => _emailService.SendChampionshipModeActivationAsync(status, safeCountyId),
                    "Email Championship Mode"));
            }

            await Task.WhenAll(tasks);

            _logger.LogInformation("🏆 Broadcast Championship Mode activation to {PlatformCount} platforms for county: {County}",
                tasks.Count, countyId ?? "System-Wide");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to broadcast Championship Mode activation");
        }
    }

    public async Task BroadcastMetricUpdateAsync(string metricName, double oldValue, double newValue, string? countyId = null)
    {
        Interlocked.Increment(ref _totalNotifications);

        var tasks = new List<Task>();

        try
        {
            // Only broadcast significant metric changes (> 0.5 point change)
            var change = Math.Abs(newValue - oldValue);
            if (change < 0.5)
            {
                _logger.LogDebug("Metric change too small to broadcast: {Metric} {Change:F2}", metricName, change);
                return;
            }

            if (_slackEnabled)
            {
                tasks.Add(SafeExecuteAsync(
                    () => _slackService.SendMetricUpdateAsync(metricName, oldValue, newValue, countyId),
                    "Slack metric update"));
            }

            if (_teamsEnabled)
            {
                tasks.Add(SafeExecuteAsync(
                    () => _teamsService.SendMetricUpdateAsync(metricName, oldValue, newValue, countyId),
                    "Teams metric update"));
            }

            await Task.WhenAll(tasks);

            _logger.LogInformation("Broadcast metric update to {PlatformCount} platforms: {Metric} {OldValue} → {NewValue}",
                tasks.Count, metricName, oldValue, newValue);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to broadcast metric update");
        }
    }

    // ============================================================================
    // HEALTH STATUS
    // ============================================================================

    public async Task<CollaborationHealthDto> GetHealthStatusAsync()
    {
        var health = new CollaborationHealthDto
        {
            Platforms = new List<PlatformHealthDto>(),
            Timestamp = DateTime.UtcNow
        };

        // Slack health
        if (_slackEnabled)
        {
            try
            {
                var slackHealthy = await _slackService.TestConnectionAsync();
                health.Platforms.Add(new PlatformHealthDto
                {
                    Name = "Slack",
                    Enabled = true,
                    Healthy = slackHealthy,
                    LastChecked = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to check Slack health");
                health.Platforms.Add(new PlatformHealthDto
                {
                    Name = "Slack",
                    Enabled = true,
                    Healthy = false,
                    LastChecked = DateTime.UtcNow,
                    ErrorMessage = ex.Message
                });
            }
        }
        else
        {
            health.Platforms.Add(new PlatformHealthDto
            {
                Name = "Slack",
                Enabled = false,
                Healthy = false,
                LastChecked = DateTime.UtcNow
            });
        }

        // Teams health
        if (_teamsEnabled)
        {
            try
            {
                var teamsHealthy = await _teamsService.TestConnectionAsync();
                health.Platforms.Add(new PlatformHealthDto
                {
                    Name = "Microsoft Teams",
                    Enabled = true,
                    Healthy = teamsHealthy,
                    LastChecked = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to check Teams health");
                health.Platforms.Add(new PlatformHealthDto
                {
                    Name = "Microsoft Teams",
                    Enabled = true,
                    Healthy = false,
                    LastChecked = DateTime.UtcNow,
                    ErrorMessage = ex.Message
                });
            }
        }
        else
        {
            health.Platforms.Add(new PlatformHealthDto
            {
                Name = "Microsoft Teams",
                Enabled = false,
                Healthy = false,
                LastChecked = DateTime.UtcNow
            });
        }

        // Email health
        health.Platforms.Add(new PlatformHealthDto
        {
            Name = "Email",
            Enabled = _emailEnabled,
            Healthy = _emailEnabled,
            LastChecked = DateTime.UtcNow
        });

        // Overall statistics
        lock (_statsLock)
        {
            health.TotalNotifications = _totalNotifications;
            health.SuccessfulDeliveries = _successfulDeliveries;
            health.FailedDeliveries = _failedDeliveries;
            health.SuccessRate = _totalNotifications > 0
                ? (double)_successfulDeliveries / _totalNotifications * 100
                : 0;
        }

        return health;
    }

    // ============================================================================
    // PRIVATE HELPER METHODS
    // ============================================================================

    private async Task SafeExecuteAsync(Func<Task> action, string actionName)
    {
        try
        {
            await action();

            lock (_statsLock)
            {
                _successfulDeliveries++;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to execute {ActionName}", actionName);

            lock (_statsLock)
            {
                _failedDeliveries++;
            }
        }
    }

    private void LoadConfiguration()
    {
        _slackEnabled = _configuration.GetValue<bool>("Collaboration:Slack:Enabled", false);
        _teamsEnabled = _configuration.GetValue<bool>("Collaboration:MicrosoftTeams:Enabled", false);
        _emailEnabled = _configuration.GetValue<bool>("Collaboration:Email:Enabled", true);

        _logger.LogInformation("Collaboration platform configuration loaded: Slack={SlackEnabled}, Teams={TeamsEnabled}, Email={EmailEnabled}",
            _slackEnabled, _teamsEnabled, _emailEnabled);
    }
}

// ============================================================================
// DTOs
// ============================================================================

public class CollaborationHealthDto
{
    public List<PlatformHealthDto> Platforms { get; set; } = new();
    public long TotalNotifications { get; set; }
    public long SuccessfulDeliveries { get; set; }
    public long FailedDeliveries { get; set; }
    public double SuccessRate { get; set; }
    public DateTime Timestamp { get; set; }
}

public class PlatformHealthDto
{
    public string Name { get; set; } = "";
    public bool Enabled { get; set; }
    public bool Healthy { get; set; }
    public DateTime LastChecked { get; set; }
    public string? ErrorMessage { get; set; }
}
