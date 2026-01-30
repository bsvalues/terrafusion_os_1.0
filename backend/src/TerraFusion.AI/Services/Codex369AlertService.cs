/*
 * ═══════════════════════════════════════════════════════════════
 * TERRAFUSION OS - CODEX 3-6-9 ALERT & NOTIFICATION SERVICE
 * Real-Time Alerts for Divine Balance Events
 * 666 Safeguard Warnings, Divine Balance Achievements, Critical Issues
 * THE TERRAFUSION WAY - GOVERNMENT. TRANSCENDED.
 * ═══════════════════════════════════════════════════════════════
 */

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using TerraFusion.AI.DTOs;

namespace TerraFusion.AI.Services;

/// <summary>
/// Alert severity levels
/// </summary>
public enum AlertSeverity
{
    Info,
    Success,
    Warning,
    Critical
}

/// <summary>
/// Alert notification
/// </summary>
public class Codex369Alert
{
    public string AlertId { get; set; } = Guid.NewGuid().ToString();
    public AlertSeverity Severity { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string? CountyId { get; set; }
    public double? CurrentScore { get; set; }
    public double? TargetScore { get; set; }
    public Dictionary<string, object> Metadata { get; set; } = new();
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public bool Acknowledged { get; set; } = false;
}

/// <summary>
/// Service for managing Codex 3-6-9 alerts and notifications
/// </summary>
public interface ICodex369AlertService
{
    /// <summary>
    /// Create and dispatch an alert
    /// </summary>
    Task<Codex369Alert> CreateAlertAsync(Codex369Alert alert);

    /// <summary>
    /// Get active alerts
    /// </summary>
    Task<List<Codex369Alert>> GetActiveAlertsAsync(AlertSeverity? severity = null);

    /// <summary>
    /// Acknowledge an alert
    /// </summary>
    Task AcknowledgeAlertAsync(string alertId);

    /// <summary>
    /// Check for alert conditions and create alerts if needed
    /// </summary>
    Task CheckAndCreateAlertsAsync(Codex369StatusDto status);

    /// <summary>
    /// Get alert history
    /// </summary>
    Task<List<Codex369Alert>> GetAlertHistoryAsync(TimeSpan window);
}

public class Codex369AlertService : ICodex369AlertService
{
    private readonly ILogger<Codex369AlertService> _logger;
    private readonly List<Codex369Alert> _alerts = new();
    private readonly object _lock = new();
    private readonly List<IAlertHandler> _alertHandlers = new();

    public Codex369AlertService(ILogger<Codex369AlertService> logger)
    {
        _logger = logger;

        // Register default handlers
        RegisterHandler(new LogAlertHandler(logger));
    }

    public Task<Codex369Alert> CreateAlertAsync(Codex369Alert alert)
    {
        lock (_lock)
        {
            _alerts.Add(alert);
        }

        _logger.LogInformation("🔔 Alert created: [{Severity}] {Title}",
            alert.Severity, alert.Title);

        // Notify all handlers
        foreach (var handler in _alertHandlers)
        {
            _ = handler.HandleAlertAsync(alert);
        }

        return Task.FromResult(alert);
    }

    public Task<List<Codex369Alert>> GetActiveAlertsAsync(AlertSeverity? severity = null)
    {
        lock (_lock)
        {
            var query = _alerts.Where(a => !a.Acknowledged);

            if (severity.HasValue)
            {
                query = query.Where(a => a.Severity == severity.Value);
            }

            return Task.FromResult(query.OrderByDescending(a => a.Timestamp).ToList());
        }
    }

    public Task AcknowledgeAlertAsync(string alertId)
    {
        lock (_lock)
        {
            var alert = _alerts.FirstOrDefault(a => a.AlertId == alertId);
            if (alert != null)
            {
                alert.Acknowledged = true;
                _logger.LogInformation("✅ Alert acknowledged: {AlertId}", alertId);
            }
        }

        return Task.CompletedTask;
    }

    public async Task CheckAndCreateAlertsAsync(Codex369StatusDto status)
    {
        // Check for divine balance achievement
        if (status.UltimatePower.InDivineBalance)
        {
            // Only alert if not recently alerted (prevent spam)
            var recentDivineAlert = (await GetAlertHistoryAsync(TimeSpan.FromMinutes(30)))
                .Any(a => a.Title.Contains("DIVINE BALANCE") && a.Severity == AlertSeverity.Success);

            if (!recentDivineAlert)
            {
                await CreateAlertAsync(new Codex369Alert
                {
                    Severity = AlertSeverity.Success,
                    Title = "🌟 DIVINE BALANCE ACHIEVED",
                    Message = $"Codex 3-6-9 Framework has achieved divine balance! " +
                             $"Ultimate Power: {status.CurrentPowerScore:F2}/12 " +
                             $"(Proximity: {status.UltimatePower.BalanceProximity:P1})",
                    CurrentScore = status.CurrentPowerScore,
                    TargetScore = 12.0,
                    Metadata = new()
                    {
                        { "healthStatus", status.UltimatePower.HealthStatus.ToString() },
                        { "balanceProximity", status.UltimatePower.BalanceProximity },
                        { "complianceAligned", status.ComplianceAligned }
                    }
                });
            }
        }

        // Check for 666 safeguard warnings
        var unsafeAmplifications = status.AmplificationMetrics
            .Where(a => !a.SafeFromImbalance)
            .ToList();

        if (unsafeAmplifications.Any())
        {
            foreach (var amp in unsafeAmplifications)
            {
                var recentSafeguardAlert = (await GetAlertHistoryAsync(TimeSpan.FromMinutes(15)))
                    .Any(a => a.Title.Contains(amp.Name) && a.Title.Contains("666"));

                if (!recentSafeguardAlert)
                {
                    await CreateAlertAsync(new Codex369Alert
                    {
                        Severity = AlertSeverity.Critical,
                        Title = $"🚨 666 SAFEGUARD WARNING: {amp.Name}",
                        Message = $"Amplification '{amp.Name}' approaching 666 threshold! " +
                                 $"Raw value: {amp.RawCombinedValue:F2}, " +
                                 $"Safety margin: {amp.SafetyMargin:F2}",
                        CurrentScore = amp.RawCombinedValue,
                        TargetScore = 666.0,
                        Metadata = new()
                        {
                            { "amplificationName", amp.Name },
                            { "rawCombinedValue", amp.RawCombinedValue },
                            { "safetyMargin", amp.SafetyMargin },
                            { "scaledValue", amp.ScaledValue }
                        }
                    });
                }
            }
        }

        // Check for critical balance deficit
        if (status.CurrentPowerScore < 7.0)
        {
            var recentCriticalAlert = (await GetAlertHistoryAsync(TimeSpan.FromMinutes(30)))
                .Any(a => a.Title.Contains("CRITICAL") && a.Severity == AlertSeverity.Critical);

            if (!recentCriticalAlert)
            {
                await CreateAlertAsync(new Codex369Alert
                {
                    Severity = AlertSeverity.Critical,
                    Title = "🚨 CRITICAL BALANCE DEFICIT",
                    Message = $"System balance critically low: {status.CurrentPowerScore:F2}/12 " +
                             $"(Deficit: {status.BalanceDeficit:F2}). " +
                             $"IMMEDIATE ACTION REQUIRED!",
                    CurrentScore = status.CurrentPowerScore,
                    TargetScore = 12.0,
                    Metadata = new()
                    {
                        { "healthStatus", status.UltimatePower.HealthStatus.ToString() },
                        { "balanceDeficit", status.BalanceDeficit },
                        { "recommendations", status.SystemRecommendations }
                    }
                });
            }
        }

        // Check for degraded performance (7.0 - 10.0)
        else if (status.CurrentPowerScore < 10.0)
        {
            var recentWarningAlert = (await GetAlertHistoryAsync(TimeSpan.FromMinutes(30)))
                .Any(a => a.Title.Contains("NEEDS ATTENTION") && a.Severity == AlertSeverity.Warning);

            if (!recentWarningAlert)
            {
                await CreateAlertAsync(new Codex369Alert
                {
                    Severity = AlertSeverity.Warning,
                    Title = "⚠️ SYSTEM NEEDS ATTENTION",
                    Message = $"System performance degraded: {status.CurrentPowerScore:F2}/12. " +
                             $"Optimization recommended to achieve divine balance.",
                    CurrentScore = status.CurrentPowerScore,
                    TargetScore = 12.0,
                    Metadata = new()
                    {
                        { "healthStatus", status.UltimatePower.HealthStatus.ToString() },
                        { "recommendations", status.SystemRecommendations.Take(3).ToList() }
                    }
                });
            }
        }

        // Check for compliance issues
        if (!status.ComplianceAligned)
        {
            var recentComplianceAlert = (await GetAlertHistoryAsync(TimeSpan.FromMinutes(30)))
                .Any(a => a.Title.Contains("COMPLIANCE") && a.Severity == AlertSeverity.Warning);

            if (!recentComplianceAlert)
            {
                await CreateAlertAsync(new Codex369Alert
                {
                    Severity = AlertSeverity.Warning,
                    Title = "⚠️ COMPLIANCE ALIGNMENT ISSUE",
                    Message = "One or more compliance metrics are out of baseline. " +
                             "Review FISMA-HIGH compliance requirements.",
                    Metadata = new()
                    {
                        { "complianceAligned", status.ComplianceAligned },
                        { "totalMetrics", status.TotalFoundationMetrics }
                    }
                });
            }
        }
    }

    public Task<List<Codex369Alert>> GetAlertHistoryAsync(TimeSpan window)
    {
        var cutoff = DateTime.UtcNow - window;

        lock (_lock)
        {
            return Task.FromResult(_alerts
                .Where(a => a.Timestamp >= cutoff)
                .OrderByDescending(a => a.Timestamp)
                .ToList());
        }
    }

    public void RegisterHandler(IAlertHandler handler)
    {
        _alertHandlers.Add(handler);
        _logger.LogInformation("📢 Registered alert handler: {Handler}", handler.GetType().Name);
    }
}

/// <summary>
/// Interface for alert handlers
/// </summary>
public interface IAlertHandler
{
    Task HandleAlertAsync(Codex369Alert alert);
}

/// <summary>
/// Log alert handler - writes alerts to logs
/// </summary>
public class LogAlertHandler : IAlertHandler
{
    private readonly ILogger _logger;

    public LogAlertHandler(ILogger logger)
    {
        _logger = logger;
    }

    public Task HandleAlertAsync(Codex369Alert alert)
    {
        var logLevel = alert.Severity switch
        {
            AlertSeverity.Info => LogLevel.Information,
            AlertSeverity.Success => LogLevel.Information,
            AlertSeverity.Warning => LogLevel.Warning,
            AlertSeverity.Critical => LogLevel.Error,
            _ => LogLevel.Information
        };

        _logger.Log(logLevel, "🔔 CODEX 3-6-9 ALERT [{Severity}]: {Title} - {Message}",
            alert.Severity, alert.Title, alert.Message);

        return Task.CompletedTask;
    }
}

/// <summary>
/// Background service to periodically check for alert conditions
/// </summary>
public class Codex369AlertMonitoringService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<Codex369AlertMonitoringService> _logger;
    private const int CHECK_INTERVAL_SECONDS = 60; // Check every minute

    public Codex369AlertMonitoringService(
        IServiceProvider serviceProvider,
        ILogger<Codex369AlertMonitoringService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("🔔 Codex 3-6-9 Alert Monitoring Service started - Checks every {Seconds}s",
            CHECK_INTERVAL_SECONDS);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await CheckAlertsAsync();
                await Task.Delay(TimeSpan.FromSeconds(CHECK_INTERVAL_SECONDS), stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error in alert monitoring service");
            }
        }

        _logger.LogInformation("⏹️ Codex 3-6-9 Alert Monitoring Service stopped");
    }

    private async Task CheckAlertsAsync()
    {
        using var scope = _serviceProvider.CreateScope();
        var codexService = scope.ServiceProvider.GetRequiredService<ICodex369FrameworkService>();
        var alertService = scope.ServiceProvider.GetRequiredService<ICodex369AlertService>();

        // Get current status
        var status = await codexService.GetRealtimeFrameworkStatusAsync();

        // Check and create alerts
        await alertService.CheckAndCreateAlertsAsync(status);
    }
}
