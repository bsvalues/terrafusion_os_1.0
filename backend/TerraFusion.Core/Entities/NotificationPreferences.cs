namespace TerraFusion.Core.Entities;

/// <summary>
/// Codex 3-6-9 Framework - User Notification Preferences Entity
///
/// User-Customizable Notification Settings:
/// - Email notification preferences (enable/disable, alert levels, summaries)
/// - Slack notification preferences (webhook URL, alert levels, status updates)
/// - Teams notification preferences (webhook URL, alert levels, summaries)
/// - Alert threshold customization (critical/warning levels)
/// - Daily summary scheduling (time, timezone, content selection)
///
/// Government Compliance:
/// - Per-user notification settings
/// - FISMA-HIGH audit trail (CreatedAt, UpdatedAt)
/// - Secure webhook URL storage (recommend Azure Key Vault in production)
/// - Multi-county support via UserId isolation
///
/// THE TERRAFUSION WAY - GOVERNMENT. TRANSCENDED.
/// </summary>
public class NotificationPreferences
{
    public int Id { get; set; }
    public string UserId { get; set; } = "";

    // Email Preferences
    public bool EmailEnabled { get; set; } = true;
    public string? EmailAddress { get; set; }
    public bool EmailCriticalAlerts { get; set; } = true;
    public bool EmailWarningAlerts { get; set; } = true;
    public bool EmailInfoAlerts { get; set; } = false;
    public bool EmailDailySummary { get; set; } = true;
    public bool EmailAchievements { get; set; } = true;

    // Slack Preferences
    public bool SlackEnabled { get; set; } = false;
    public string? SlackWebhook { get; set; }
    public bool SlackCriticalAlerts { get; set; } = true;
    public bool SlackWarningAlerts { get; set; } = true;
    public bool SlackInfoAlerts { get; set; } = true;
    public bool SlackStatusUpdates { get; set; } = false;
    public bool SlackDailySummary { get; set; } = true;
    public bool SlackAchievements { get; set; } = true;

    // Teams Preferences
    public bool TeamsEnabled { get; set; } = false;
    public string? TeamsWebhook { get; set; }
    public bool TeamsCriticalAlerts { get; set; } = true;
    public bool TeamsWarningAlerts { get; set; } = true;
    public bool TeamsInfoAlerts { get; set; } = true;
    public bool TeamsStatusUpdates { get; set; } = false;
    public bool TeamsDailySummary { get; set; } = true;
    public bool TeamsAchievements { get; set; } = true;

    // Alert Thresholds
    public double UltimatePowerScoreThreshold { get; set; } = 7.2;
    public double DomainScoreThreshold { get; set; } = 0.6;
    public double CriticalAlertThreshold { get; set; } = 7.2;
    public double WarningAlertThreshold { get; set; } = 9.6;

    // Daily Summary Preferences
    public bool DailySummaryEnabled { get; set; } = true;
    public string? DailySummaryTime { get; set; } = "08:00";
    public string? DailySummaryTimezone { get; set; } = "America/Los_Angeles";
    public bool DailySummaryIncludeAlerts { get; set; } = true;
    public bool DailySummaryIncludePerformance { get; set; } = true;
    public bool DailySummaryIncludeTrends { get; set; } = true;

    // Audit fields (FISMA-HIGH compliance)
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
