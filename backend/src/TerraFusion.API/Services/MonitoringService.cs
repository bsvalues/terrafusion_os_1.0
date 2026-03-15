// TFT-087 — canon-observability: Monitoring service with alert channels
// TerraCanon domain — observability infrastructure. No valuation math.

using System.Collections.Concurrent;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Logging;

namespace TerraFusion.API.Services;

#region Contracts

/// <summary>
/// Alert severity levels used for threshold evaluation and routing.
/// </summary>
public enum AlertSeverity
{
    /// <summary>Informational — no action required.</summary>
    Info,
    /// <summary>Warning — investigate soon.</summary>
    Warning,
    /// <summary>Critical — immediate attention required.</summary>
    Critical
}

/// <summary>
/// Channel through which an alert is delivered.
/// </summary>
public enum AlertChannel
{
    /// <summary>Console / structured log output.</summary>
    Console,
    /// <summary>Email notification.</summary>
    Email
}

/// <summary>
/// Defines an alert threshold rule.
/// </summary>
public sealed record AlertThreshold
{
    /// <summary>Unique rule name (e.g. "HighCpuUsage").</summary>
    public required string RuleName { get; init; }

    /// <summary>Metric name this threshold applies to.</summary>
    public required string MetricName { get; init; }

    /// <summary>Value that triggers the alert when exceeded.</summary>
    public double ThresholdValue { get; init; }

    /// <summary>Severity assigned when the threshold is breached.</summary>
    public AlertSeverity Severity { get; init; } = AlertSeverity.Warning;

    /// <summary>Channels to notify on breach.</summary>
    public IReadOnlyList<AlertChannel> Channels { get; init; } = [AlertChannel.Console];
}

/// <summary>
/// A fired alert instance.
/// </summary>
public sealed record AlertEvent
{
    public required string RuleName { get; init; }
    public required string MetricName { get; init; }
    public double ObservedValue { get; init; }
    public double ThresholdValue { get; init; }
    public AlertSeverity Severity { get; init; }
    public DateTimeOffset FiredAtUtc { get; init; } = DateTimeOffset.UtcNow;
    public string? Message { get; init; }
}

/// <summary>
/// Snapshot of a collected metric.
/// </summary>
public sealed record MetricSnapshot
{
    public required string Name { get; init; }
    public double Value { get; init; }
    public DateTimeOffset CollectedAtUtc { get; init; } = DateTimeOffset.UtcNow;
    public IReadOnlyDictionary<string, string> Labels { get; init; } = new Dictionary<string, string>();
}

/// <summary>
/// Provides health-check aggregation, metric collection, and alert routing.
/// </summary>
public interface IMonitoringService
{
    /// <summary>Register an alert threshold rule.</summary>
    void AddThreshold(AlertThreshold threshold);

    /// <summary>Record a metric value and evaluate thresholds.</summary>
    Task RecordMetricAsync(string metricName, double value, IReadOnlyDictionary<string, string>? labels = null);

    /// <summary>Retrieve the latest snapshot for a given metric.</summary>
    MetricSnapshot? GetMetric(string metricName);

    /// <summary>Retrieve all current metric snapshots.</summary>
    IReadOnlyList<MetricSnapshot> GetAllMetrics();

    /// <summary>Retrieve all fired alerts (most recent first).</summary>
    IReadOnlyList<AlertEvent> GetRecentAlerts(int maxCount = 50);

    /// <summary>Run all registered health checks and return an aggregate report.</summary>
    Task<HealthReport> AggregateHealthChecksAsync(CancellationToken ct = default);
}

#endregion

#region Implementation

/// <summary>
/// Default implementation of <see cref="IMonitoringService"/>.
/// Thread-safe metric collection with threshold evaluation and alert routing.
/// </summary>
public sealed class MonitoringService : IMonitoringService
{
    private readonly ILogger<MonitoringService> _logger;
    private readonly HealthCheckService _healthCheckService;

    private readonly ConcurrentDictionary<string, MetricSnapshot> _metrics = new(StringComparer.OrdinalIgnoreCase);
    private readonly ConcurrentDictionary<string, AlertThreshold> _thresholds = new(StringComparer.OrdinalIgnoreCase);
    private readonly ConcurrentQueue<AlertEvent> _alerts = new();

    private const int MaxAlertHistory = 500;

    public MonitoringService(ILogger<MonitoringService> logger, HealthCheckService healthCheckService)
    {
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _healthCheckService = healthCheckService ?? throw new ArgumentNullException(nameof(healthCheckService));
    }

    /// <inheritdoc />
    public void AddThreshold(AlertThreshold threshold)
    {
        ArgumentNullException.ThrowIfNull(threshold);
        _thresholds[threshold.RuleName] = threshold;
        _logger.LogInformation("Alert threshold registered: {Rule} on {Metric} > {Value}",
            threshold.RuleName, threshold.MetricName, threshold.ThresholdValue);
    }

    /// <inheritdoc />
    public async Task RecordMetricAsync(string metricName, double value, IReadOnlyDictionary<string, string>? labels = null)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(metricName);

        var snapshot = new MetricSnapshot
        {
            Name = metricName,
            Value = value,
            CollectedAtUtc = DateTimeOffset.UtcNow,
            Labels = labels ?? new Dictionary<string, string>()
        };

        _metrics[metricName] = snapshot;

        // Evaluate thresholds that match this metric
        foreach (var threshold in _thresholds.Values)
        {
            if (!string.Equals(threshold.MetricName, metricName, StringComparison.OrdinalIgnoreCase))
                continue;

            if (value > threshold.ThresholdValue)
            {
                var alert = new AlertEvent
                {
                    RuleName = threshold.RuleName,
                    MetricName = metricName,
                    ObservedValue = value,
                    ThresholdValue = threshold.ThresholdValue,
                    Severity = threshold.Severity,
                    FiredAtUtc = DateTimeOffset.UtcNow,
                    Message = $"{threshold.RuleName}: {metricName} = {value} exceeds threshold {threshold.ThresholdValue}"
                };

                EnqueueAlert(alert);
                await RouteAlertAsync(alert, threshold.Channels);
            }
        }
    }

    /// <inheritdoc />
    public MetricSnapshot? GetMetric(string metricName)
    {
        _metrics.TryGetValue(metricName, out var snapshot);
        return snapshot;
    }

    /// <inheritdoc />
    public IReadOnlyList<MetricSnapshot> GetAllMetrics()
    {
        return _metrics.Values.OrderBy(m => m.Name).ToList();
    }

    /// <inheritdoc />
    public IReadOnlyList<AlertEvent> GetRecentAlerts(int maxCount = 50)
    {
        return _alerts
            .OrderByDescending(a => a.FiredAtUtc)
            .Take(maxCount)
            .ToList();
    }

    /// <inheritdoc />
    public async Task<HealthReport> AggregateHealthChecksAsync(CancellationToken ct = default)
    {
        var report = await _healthCheckService.CheckHealthAsync(ct);

        _logger.LogInformation("Health check aggregate: Status={Status}, Entries={Count}",
            report.Status, report.Entries.Count);

        // Record aggregate health as a metric (Healthy=1, Degraded=0.5, Unhealthy=0)
        var healthValue = report.Status switch
        {
            HealthStatus.Healthy => 1.0,
            HealthStatus.Degraded => 0.5,
            _ => 0.0
        };

        await RecordMetricAsync("system.health.aggregate", healthValue);

        return report;
    }

    // ── Private helpers ──────────────────────────────────────────────

    private void EnqueueAlert(AlertEvent alert)
    {
        _alerts.Enqueue(alert);

        // Trim history to prevent unbounded growth
        while (_alerts.Count > MaxAlertHistory)
            _alerts.TryDequeue(out _);
    }

    private Task RouteAlertAsync(AlertEvent alert, IReadOnlyList<AlertChannel> channels)
    {
        foreach (var channel in channels)
        {
            switch (channel)
            {
                case AlertChannel.Console:
                    LogAlertToConsole(alert);
                    break;

                case AlertChannel.Email:
                    // Email delivery is a placeholder — integrate with IEmailSender when available.
                    _logger.LogWarning("Email alert channel invoked for {Rule} but no email sender configured",
                        alert.RuleName);
                    break;
            }
        }

        return Task.CompletedTask;
    }

    private void LogAlertToConsole(AlertEvent alert)
    {
        var logLevel = alert.Severity switch
        {
            AlertSeverity.Critical => LogLevel.Error,
            AlertSeverity.Warning => LogLevel.Warning,
            _ => LogLevel.Information
        };

        _logger.Log(logLevel,
            "ALERT [{Severity}] {Rule}: {Metric} = {Observed} (threshold {Threshold})",
            alert.Severity, alert.RuleName, alert.MetricName,
            alert.ObservedValue, alert.ThresholdValue);
    }
}

#endregion
