// TMR-106: Alert Manager - Create, acknowledge, and resolve alerts
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace TerraFusion.DataMining.Monitoring
{
    /// <summary>
    /// Severity levels for monitoring alerts.
    /// </summary>
    public enum AlertSeverity
    {
        Info,
        Warning,
        Critical
    }

    /// <summary>
    /// Status of a monitoring alert.
    /// </summary>
    public enum AlertStatus
    {
        Active,
        Acknowledged,
        Resolved
    }

    /// <summary>
    /// Represents a monitoring alert raised by the system.
    /// </summary>
    public class Alert
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string Source { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public AlertSeverity Severity { get; set; }
        public AlertStatus Status { get; set; } = AlertStatus.Active;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? AcknowledgedAt { get; set; }
        public DateTime? ResolvedAt { get; set; }
        public string? AcknowledgedBy { get; set; }
    }

    /// <summary>
    /// Manages lifecycle of monitoring alerts: creation, acknowledgement, and resolution.
    /// </summary>
    public class AlertManager
    {
        private readonly ConcurrentDictionary<string, Alert> _alerts = new();
        private readonly ILogger<AlertManager> _logger;
        private readonly IConfiguration _configuration;

        public AlertManager(ILogger<AlertManager> logger, IConfiguration configuration)
        {
            _logger = logger;
            _configuration = configuration;
        }

        /// <summary>
        /// Creates a new alert and stores it.
        /// </summary>
        public Task<Alert> CreateAlertAsync(string source, string message, AlertSeverity severity)
        {
            var alert = new Alert { Source = source, Message = message, Severity = severity };
            _alerts[alert.Id] = alert;
            _logger.LogWarning("Alert created [{Severity}] from {Source}: {Message}", severity, source, message);
            return Task.FromResult(alert);
        }

        /// <summary>
        /// Acknowledges an active alert.
        /// </summary>
        public Task<bool> AcknowledgeAlertAsync(string alertId, string acknowledgedBy)
        {
            if (!_alerts.TryGetValue(alertId, out var alert) || alert.Status != AlertStatus.Active)
                return Task.FromResult(false);

            alert.Status = AlertStatus.Acknowledged;
            alert.AcknowledgedAt = DateTime.UtcNow;
            alert.AcknowledgedBy = acknowledgedBy;
            _logger.LogInformation("Alert {AlertId} acknowledged by {User}", alertId, acknowledgedBy);
            return Task.FromResult(true);
        }

        /// <summary>
        /// Resolves an alert (active or acknowledged).
        /// </summary>
        public Task<bool> ResolveAlertAsync(string alertId)
        {
            if (!_alerts.TryGetValue(alertId, out var alert) || alert.Status == AlertStatus.Resolved)
                return Task.FromResult(false);

            alert.Status = AlertStatus.Resolved;
            alert.ResolvedAt = DateTime.UtcNow;
            _logger.LogInformation("Alert {AlertId} resolved", alertId);
            return Task.FromResult(true);
        }

        /// <summary>
        /// Returns all alerts, optionally filtered by status.
        /// </summary>
        public Task<IReadOnlyList<Alert>> GetAlertsAsync(AlertStatus? statusFilter = null)
        {
            IEnumerable<Alert> query = _alerts.Values;
            if (statusFilter.HasValue)
                query = query.Where(a => a.Status == statusFilter.Value);

            IReadOnlyList<Alert> result = query.OrderByDescending(a => a.CreatedAt).ToList();
            return Task.FromResult(result);
        }

        /// <summary>
        /// Returns the count of active alerts.
        /// </summary>
        public int ActiveAlertCount => _alerts.Values.Count(a => a.Status == AlertStatus.Active);
    }
}
