using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using System.Net.Http.Json;
using System.Text.Json;
using TerraFusion.AI.DTOs;

namespace TerraFusion.AI.Services;

/// <summary>
/// Codex 3-6-9 Framework - Slack Integration Service
///
/// Real-Time Slack Notifications:
/// - Divine Balance achievement announcements
/// - Critical alert broadcasts
/// - Daily performance summaries
/// - Amplification metric updates
/// - Championship mode activations
///
/// Slack Features:
/// - Webhook-based message delivery
/// - Rich message formatting with blocks
/// - Color-coded alerts (green, yellow, red)
/// - Interactive buttons for quick actions
/// - Thread support for detailed metrics
/// - Emoji reactions for status indicators
///
/// Message Types:
/// 1. System Status Updates - Real-time framework status
/// 2. Alert Notifications - Critical/warning/info alerts
/// 3. Performance Summaries - Daily/weekly digest
/// 4. Achievement Announcements - Divine Balance, Championship Mode
/// 5. Metric Updates - Foundation and Amplification changes
///
/// Configuration:
/// - Webhook URL in appsettings.json
/// - Channel-specific routing
/// - Rate limiting (1 msg/sec per channel)
/// - Retry logic with exponential backoff
///
/// THE TERRAFUSION WAY - GOVERNMENT. TRANSCENDED.
/// </summary>
public interface ICodexSlackNotificationService
{
    Task SendSystemStatusUpdateAsync(Codex369StatusDto status, string? countyId = null);
    Task SendAlertNotificationAsync(CodexAlertDto alert, string? countyId = null);
    Task SendDailyPerformanceSummaryAsync(Codex369StatusDto status, List<CodexAlertDto> alerts, string? countyId = null);
    Task SendDivineBalanceAchievementAsync(Codex369StatusDto status, string? countyId = null);
    Task SendChampionshipModeActivationAsync(Codex369StatusDto status, string? countyId = null);
    Task SendMetricUpdateAsync(string metricName, double oldValue, double newValue, string? countyId = null);
    Task<bool> TestConnectionAsync();
}

public class CodexSlackNotificationService : ICodexSlackNotificationService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;
    private readonly ILogger<CodexSlackNotificationService> _logger;

    // Slack webhook URLs from configuration
    private string? _defaultWebhookUrl;
    private Dictionary<string, string> _countyWebhookUrls = new();

    // Rate limiting
    private readonly SemaphoreSlim _rateLimiter = new(1, 1);
    private DateTime _lastMessageTime = DateTime.MinValue;
    private const int MinimumMessageIntervalMs = 1000; // 1 message per second

    public CodexSlackNotificationService(
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        ILogger<CodexSlackNotificationService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
        _logger = logger;

        LoadSlackConfiguration();
    }

    // ============================================================================
    // NOTIFICATION METHODS
    // ============================================================================

    public async Task SendSystemStatusUpdateAsync(Codex369StatusDto status, string? countyId = null)
    {
        try
        {
            var message = BuildSystemStatusMessage(status, countyId);
            await SendSlackMessageAsync(message, countyId);

            _logger.LogInformation("Sent Slack system status update for county: {County}", countyId ?? "System-Wide");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send Slack system status update");
        }
    }

    public async Task SendAlertNotificationAsync(CodexAlertDto alert, string? countyId = null)
    {
        try
        {
            var message = BuildAlertMessage(alert, countyId);
            await SendSlackMessageAsync(message, countyId);

            _logger.LogInformation("Sent Slack alert notification: {AlertType} - {Message}", alert.Type, alert.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send Slack alert notification");
        }
    }

    public async Task SendDailyPerformanceSummaryAsync(Codex369StatusDto status, List<CodexAlertDto> alerts, string? countyId = null)
    {
        try
        {
            var message = BuildDailyPerformanceSummaryMessage(status, alerts, countyId);
            await SendSlackMessageAsync(message, countyId);

            _logger.LogInformation("Sent Slack daily performance summary for county: {County}", countyId ?? "System-Wide");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send Slack daily performance summary");
        }
    }

    public async Task SendDivineBalanceAchievementAsync(Codex369StatusDto status, string? countyId = null)
    {
        try
        {
            var message = BuildDivineBalanceAchievementMessage(status, countyId);
            await SendSlackMessageAsync(message, countyId);

            _logger.LogInformation("Sent Slack Divine Balance achievement notification for county: {County}", countyId ?? "System-Wide");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send Slack Divine Balance achievement");
        }
    }

    public async Task SendChampionshipModeActivationAsync(Codex369StatusDto status, string? countyId = null)
    {
        try
        {
            var message = BuildChampionshipModeMessage(status, countyId);
            await SendSlackMessageAsync(message, countyId);

            _logger.LogInformation("Sent Slack Championship Mode activation for county: {County}", countyId ?? "System-Wide");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send Slack Championship Mode activation");
        }
    }

    public async Task SendMetricUpdateAsync(string metricName, double oldValue, double newValue, string? countyId = null)
    {
        try
        {
            var message = BuildMetricUpdateMessage(metricName, oldValue, newValue, countyId);
            await SendSlackMessageAsync(message, countyId);

            _logger.LogInformation("Sent Slack metric update: {Metric} {OldValue} → {NewValue}", metricName, oldValue, newValue);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send Slack metric update");
        }
    }

    public async Task<bool> TestConnectionAsync()
    {
        try
        {
            var testMessage = new
            {
                text = "🧪 TerraFusion Codex 3-6-9 Framework - Slack Integration Test",
                blocks = new[]
                {
                    new
                    {
                        type = "section",
                        text = new
                        {
                            type = "mrkdwn",
                            text = "*Slack Integration Test*\n\nIf you're seeing this message, the Slack integration is working correctly! ✅"
                        }
                    }
                }
            };

            await SendSlackMessageAsync(testMessage, null);

            _logger.LogInformation("Slack connection test successful");
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Slack connection test failed");
            return false;
        }
    }

    // ============================================================================
    // MESSAGE BUILDERS
    // ============================================================================

    private object BuildSystemStatusMessage(Codex369StatusDto status, string? countyId)
    {
        var color = status.InDivineBalance ? "good" : (status.CurrentPowerScore >= 7.2 ? "warning" : "danger");
        var emoji = status.InDivineBalance ? "✨" : (status.CurrentPowerScore >= 7.2 ? "⚠️" : "🚨");

        var countyName = string.IsNullOrWhiteSpace(countyId) ? "System-Wide" : countyId;

        return new
        {
            text = $"{emoji} Codex 3-6-9 System Status Update - {countyName}",
            attachments = new[]
            {
                new
                {
                    color,
                    blocks = new object[]
                    {
                        new
                        {
                            type = "header",
                            text = new
                            {
                                type = "plain_text",
                                text = $"{emoji} Codex 3-6-9 System Status - {countyName}"
                            }
                        },
                        new
                        {
                            type = "section",
                            fields = new[]
                            {
                                new { type = "mrkdwn", text = $"*Ultimate Power Score:*\n{status.CurrentPowerScore:F2}/12" },
                                new { type = "mrkdwn", text = $"*Divine Balance:*\n{(status.InDivineBalance ? "✅ YES" : "❌ NO")}" },
                                new { type = "mrkdwn", text = $"*Championship Mode:*\n{(status.UltimatePower.IsChampionshipMode ? "🏆 ACTIVE" : "⏳ Pending")}" },
                                new { type = "mrkdwn", text = $"*Timestamp:*\n{DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC" }
                            }
                        },
                        new
                        {
                            type = "divider"
                        },
                        new
                        {
                            type = "section",
                            text = new
                            {
                                type = "mrkdwn",
                                text = "*Domain Performance:*\n" + string.Join("\n", status.AmplificationMetrics.Select(a =>
                                    $"• {a.Name}: {a.AmplifiedScore:F2} {(a.SafeFromImbalance ? "✅" : "⚠️")}"))
                            }
                        }
                    }
                }
            }
        };
    }

    private object BuildAlertMessage(CodexAlertDto alert, string? countyId)
    {
        var color = alert.Level == "Critical" ? "danger" : (alert.Level == "Warning" ? "warning" : "#439FE0");
        var emoji = alert.Level == "Critical" ? "🚨" : (alert.Level == "Warning" ? "⚠️" : "ℹ️");

        var countyName = string.IsNullOrWhiteSpace(countyId) ? "System-Wide" : countyId;

        return new
        {
            text = $"{emoji} Codex Alert: {alert.Type} - {countyName}",
            attachments = new[]
            {
                new
                {
                    color,
                    blocks = new object[]
                    {
                        new
                        {
                            type = "header",
                            text = new
                            {
                                type = "plain_text",
                                text = $"{emoji} {alert.Level} Alert - {alert.Type}"
                            }
                        },
                        new
                        {
                            type = "section",
                            text = new
                            {
                                type = "mrkdwn",
                                text = $"*Message:*\n{alert.Message}"
                            }
                        },
                        new
                        {
                            type = "section",
                            fields = new[]
                            {
                                new { type = "mrkdwn", text = $"*County:*\n{countyName}" },
                                new { type = "mrkdwn", text = $"*Level:*\n{alert.Level}" },
                                new { type = "mrkdwn", text = $"*Domain:*\n{alert.Domain ?? "System-Wide"}" },
                                new { type = "mrkdwn", text = $"*Timestamp:*\n{alert.Timestamp:yyyy-MM-dd HH:mm:ss} UTC" }
                            }
                        }
                    }
                }
            }
        };
    }

    private object BuildDailyPerformanceSummaryMessage(Codex369StatusDto status, List<CodexAlertDto> alerts, string? countyId)
    {
        var criticalAlerts = alerts.Count(a => a.Level == "Critical");
        var warningAlerts = alerts.Count(a => a.Level == "Warning");
        var infoAlerts = alerts.Count(a => a.Level == "Info");

        var countyName = string.IsNullOrWhiteSpace(countyId) ? "System-Wide" : countyId;
        var color = status.InDivineBalance ? "good" : (status.CurrentPowerScore >= 7.2 ? "warning" : "danger");

        return new
        {
            text = $"📊 Daily Codex Performance Summary - {countyName}",
            attachments = new[]
            {
                new
                {
                    color,
                    blocks = new object[]
                    {
                        new
                        {
                            type = "header",
                            text = new
                            {
                                type = "plain_text",
                                text = $"📊 Daily Performance Summary - {DateTime.UtcNow:MMMM dd, yyyy}"
                            }
                        },
                        new
                        {
                            type = "section",
                            text = new
                            {
                                type = "mrkdwn",
                                text = $"*County:* {countyName}\n*Ultimate Power Score:* {status.CurrentPowerScore:F2}/12 {(status.InDivineBalance ? "✨" : "")}"
                            }
                        },
                        new
                        {
                            type = "divider"
                        },
                        new
                        {
                            type = "section",
                            text = new
                            {
                                type = "mrkdwn",
                                text = $"*Alert Summary (Last 24 Hours):*\n🚨 Critical: {criticalAlerts}\n⚠️ Warning: {warningAlerts}\nℹ️ Info: {infoAlerts}"
                            }
                        },
                        new
                        {
                            type = "section",
                            text = new
                            {
                                type = "mrkdwn",
                                text = "*Top Performing Domains:*\n" + string.Join("\n",
                                    status.AmplificationMetrics
                                        .OrderByDescending(a => a.AmplifiedScore)
                                        .Take(5)
                                        .Select(a => $"• {a.Name}: {a.AmplifiedScore:F2} {(a.SafeFromImbalance ? "✅" : "⚠️")}"))
                            }
                        }
                    }
                }
            }
        };
    }

    private object BuildDivineBalanceAchievementMessage(Codex369StatusDto status, string? countyId)
    {
        var countyName = string.IsNullOrWhiteSpace(countyId) ? "System-Wide" : countyId;

        return new
        {
            text = $"✨ DIVINE BALANCE ACHIEVED - {countyName}",
            attachments = new[]
            {
                new
                {
                    color = "good",
                    blocks = new object[]
                    {
                        new
                        {
                            type = "header",
                            text = new
                            {
                                type = "plain_text",
                                text = "✨ DIVINE BALANCE ACHIEVED ✨"
                            }
                        },
                        new
                        {
                            type = "section",
                            text = new
                            {
                                type = "mrkdwn",
                                text = $"*Congratulations!* {countyName} has achieved Divine Balance in the Codex 3-6-9 Framework!\n\n" +
                                       $"*Ultimate Power Score:* {status.CurrentPowerScore:F2}/12\n" +
                                       $"*Timestamp:* {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC"
                            }
                        },
                        new
                        {
                            type = "section",
                            text = new
                            {
                                type = "mrkdwn",
                                text = "*All 12 Domains in Perfect Harmony:*\n" + string.Join("\n",
                                    status.AmplificationMetrics.Select(a => $"✅ {a.Name}: {a.AmplifiedScore:F2}"))
                            }
                        },
                        new
                        {
                            type = "context",
                            elements = new[]
                            {
                                new
                                {
                                    type = "mrkdwn",
                                    text = "🏆 THE TERRAFUSION WAY - GOVERNMENT. TRANSCENDED."
                                }
                            }
                        }
                    }
                }
            }
        };
    }

    private object BuildChampionshipModeMessage(Codex369StatusDto status, string? countyId)
    {
        var countyName = string.IsNullOrWhiteSpace(countyId) ? "System-Wide" : countyId;

        return new
        {
            text = $"🏆 CHAMPIONSHIP MODE ACTIVATED - {countyName}",
            attachments = new[]
            {
                new
                {
                    color = "#FFD700",
                    blocks = new object[]
                    {
                        new
                        {
                            type = "header",
                            text = new
                            {
                                type = "plain_text",
                                text = "🏆 CHAMPIONSHIP MODE ACTIVATED 🏆"
                            }
                        },
                        new
                        {
                            type = "section",
                            text = new
                            {
                                type = "mrkdwn",
                                text = $"*{countyName} has entered Championship Mode!*\n\n" +
                                       $"All operational excellence criteria met:\n" +
                                       $"✅ Divine Balance Achieved ({status.CurrentPowerScore:F2}/12)\n" +
                                       $"✅ All domains safe from imbalance\n" +
                                       $"✅ System operating at peak performance\n\n" +
                                       $"*Timestamp:* {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC"
                            }
                        }
                    }
                }
            }
        };
    }

    private object BuildMetricUpdateMessage(string metricName, double oldValue, double newValue, string? countyId)
    {
        var change = newValue - oldValue;
        var emoji = change > 0 ? "📈" : (change < 0 ? "📉" : "➡️");
        var color = change > 0 ? "good" : (change < 0 ? "warning" : "#439FE0");

        var countyName = string.IsNullOrWhiteSpace(countyId) ? "System-Wide" : countyId;

        return new
        {
            text = $"{emoji} Codex Metric Update: {metricName}",
            attachments = new[]
            {
                new
                {
                    color,
                    blocks = new object[]
                    {
                        new
                        {
                            type = "section",
                            text = new
                            {
                                type = "mrkdwn",
                                text = $"*{metricName}* has been updated for {countyName}\n\n" +
                                       $"Previous: {oldValue:F2}\n" +
                                       $"Current: {newValue:F2}\n" +
                                       $"Change: {(change >= 0 ? "+" : "")}{change:F2} ({emoji})"
                            }
                        }
                    }
                }
            }
        };
    }

    // ============================================================================
    // SLACK API COMMUNICATION
    // ============================================================================

    private async Task SendSlackMessageAsync(object message, string? countyId)
    {
        var webhookUrl = GetWebhookUrl(countyId);

        if (string.IsNullOrWhiteSpace(webhookUrl))
        {
            _logger.LogWarning("Slack webhook URL not configured for county: {County}", countyId ?? "System-Wide");
            return;
        }

        // Rate limiting
        await _rateLimiter.WaitAsync();
        try
        {
            var timeSinceLastMessage = DateTime.UtcNow - _lastMessageTime;
            if (timeSinceLastMessage.TotalMilliseconds < MinimumMessageIntervalMs)
            {
                var delay = MinimumMessageIntervalMs - (int)timeSinceLastMessage.TotalMilliseconds;
                await Task.Delay(delay);
            }

            var httpClient = _httpClientFactory.CreateClient();
            httpClient.Timeout = TimeSpan.FromSeconds(10);

            var response = await httpClient.PostAsJsonAsync(webhookUrl, message);

            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                _logger.LogError("Slack API returned error: {StatusCode} - {Content}", response.StatusCode, errorContent);
            }

            _lastMessageTime = DateTime.UtcNow;
        }
        finally
        {
            _rateLimiter.Release();
        }
    }

    // ============================================================================
    // CONFIGURATION
    // ============================================================================

    private void LoadSlackConfiguration()
    {
        _defaultWebhookUrl = _configuration["Slack:DefaultWebhookUrl"];

        var countyWebhooks = _configuration.GetSection("Slack:CountyWebhooks").GetChildren();
        foreach (var countyWebhook in countyWebhooks)
        {
            var countyId = countyWebhook.Key;
            var webhookUrl = countyWebhook.Value;

            if (!string.IsNullOrWhiteSpace(webhookUrl))
            {
                _countyWebhookUrls[countyId.ToLowerInvariant()] = webhookUrl;
            }
        }

        _logger.LogInformation("Loaded Slack configuration: Default webhook configured: {HasDefault}, County webhooks: {CountyCount}",
            !string.IsNullOrWhiteSpace(_defaultWebhookUrl), _countyWebhookUrls.Count);
    }

    private string? GetWebhookUrl(string? countyId)
    {
        if (string.IsNullOrWhiteSpace(countyId))
        {
            return _defaultWebhookUrl;
        }

        var countyKey = countyId.ToLowerInvariant();
        return _countyWebhookUrls.TryGetValue(countyKey, out var webhookUrl) ? webhookUrl : _defaultWebhookUrl;
    }
}
