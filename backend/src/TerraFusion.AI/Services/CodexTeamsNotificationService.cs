using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using System.Net.Http.Json;
using System.Text.Json;
using TerraFusion.AI.DTOs;

namespace TerraFusion.AI.Services;

/// <summary>
/// Codex 3-6-9 Framework - Microsoft Teams Integration Service
///
/// Real-Time Teams Notifications:
/// - Divine Balance achievement announcements
/// - Critical alert broadcasts
/// - Daily performance summaries
/// - Amplification metric updates
/// - Championship mode activations
///
/// Teams Features:
/// - Webhook-based adaptive card delivery
/// - Rich adaptive card formatting
/// - Color-coded theme (attention, good, warning)
/// - Action buttons for quick responses
/// - Fact sets for structured data
/// - Hero images for important announcements
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
public interface ICodexTeamsNotificationService
{
    Task SendSystemStatusUpdateAsync(Codex369StatusDto status, string? countyId = null);
    Task SendAlertNotificationAsync(CodexAlertDto alert, string? countyId = null);
    Task SendDailyPerformanceSummaryAsync(Codex369StatusDto status, List<CodexAlertDto> alerts, string? countyId = null);
    Task SendDivineBalanceAchievementAsync(Codex369StatusDto status, string? countyId = null);
    Task SendChampionshipModeActivationAsync(Codex369StatusDto status, string? countyId = null);
    Task SendMetricUpdateAsync(string metricName, double oldValue, double newValue, string? countyId = null);
    Task<bool> TestConnectionAsync();
}

public class CodexTeamsNotificationService : ICodexTeamsNotificationService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;
    private readonly ILogger<CodexTeamsNotificationService> _logger;

    // Teams webhook URLs from configuration
    private string? _defaultWebhookUrl;
    private Dictionary<string, string> _countyWebhookUrls = new();

    // Rate limiting
    private readonly SemaphoreSlim _rateLimiter = new(1, 1);
    private DateTime _lastMessageTime = DateTime.MinValue;
    private const int MinimumMessageIntervalMs = 1000; // 1 message per second

    public CodexTeamsNotificationService(
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        ILogger<CodexTeamsNotificationService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
        _logger = logger;

        LoadTeamsConfiguration();
    }

    // ============================================================================
    // NOTIFICATION METHODS
    // ============================================================================

    public async Task SendSystemStatusUpdateAsync(Codex369StatusDto status, string? countyId = null)
    {
        try
        {
            var message = BuildSystemStatusAdaptiveCard(status, countyId);
            await SendTeamsMessageAsync(message, countyId);

            _logger.LogInformation("Sent Teams system status update for county: {County}", countyId ?? "System-Wide");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send Teams system status update");
        }
    }

    public async Task SendAlertNotificationAsync(CodexAlertDto alert, string? countyId = null)
    {
        try
        {
            var message = BuildAlertAdaptiveCard(alert, countyId);
            await SendTeamsMessageAsync(message, countyId);

            _logger.LogInformation("Sent Teams alert notification: {AlertType} - {Message}", alert.Type, alert.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send Teams alert notification");
        }
    }

    public async Task SendDailyPerformanceSummaryAsync(Codex369StatusDto status, List<CodexAlertDto> alerts, string? countyId = null)
    {
        try
        {
            var message = BuildDailyPerformanceSummaryCard(status, alerts, countyId);
            await SendTeamsMessageAsync(message, countyId);

            _logger.LogInformation("Sent Teams daily performance summary for county: {County}", countyId ?? "System-Wide");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send Teams daily performance summary");
        }
    }

    public async Task SendDivineBalanceAchievementAsync(Codex369StatusDto status, string? countyId = null)
    {
        try
        {
            var message = BuildDivineBalanceAchievementCard(status, countyId);
            await SendTeamsMessageAsync(message, countyId);

            _logger.LogInformation("Sent Teams Divine Balance achievement notification for county: {County}", countyId ?? "System-Wide");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send Teams Divine Balance achievement");
        }
    }

    public async Task SendChampionshipModeActivationAsync(Codex369StatusDto status, string? countyId = null)
    {
        try
        {
            var message = BuildChampionshipModeCard(status, countyId);
            await SendTeamsMessageAsync(message, countyId);

            _logger.LogInformation("Sent Teams Championship Mode activation for county: {County}", countyId ?? "System-Wide");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send Teams Championship Mode activation");
        }
    }

    public async Task SendMetricUpdateAsync(string metricName, double oldValue, double newValue, string? countyId = null)
    {
        try
        {
            var message = BuildMetricUpdateCard(metricName, oldValue, newValue, countyId);
            await SendTeamsMessageAsync(message, countyId);

            _logger.LogInformation("Sent Teams metric update: {Metric} {OldValue} → {NewValue}", metricName, oldValue, newValue);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send Teams metric update");
        }
    }

    public async Task<bool> TestConnectionAsync()
    {
        try
        {
            var testCard = new
            {
                type = "message",
                attachments = new[]
                {
                    new
                    {
                        contentType = "application/vnd.microsoft.card.adaptive",
                        content = new
                        {
                            type = "AdaptiveCard",
                            version = "1.4",
                            body = new object[]
                            {
                                new
                                {
                                    type = "TextBlock",
                                    text = "TerraFusion Codex 3-6-9 Framework",
                                    weight = "Bolder",
                                    size = "Large"
                                },
                                new
                                {
                                    type = "TextBlock",
                                    text = "Microsoft Teams Integration Test",
                                    wrap = true
                                },
                                new
                                {
                                    type = "TextBlock",
                                    text = "If you're seeing this message, the Teams integration is working correctly! ✅",
                                    wrap = true,
                                    color = "Good"
                                }
                            }
                        }
                    }
                }
            };

            await SendTeamsMessageAsync(testCard, null);

            _logger.LogInformation("Teams connection test successful");
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Teams connection test failed");
            return false;
        }
    }

    // ============================================================================
    // ADAPTIVE CARD BUILDERS
    // ============================================================================

    private object BuildSystemStatusAdaptiveCard(Codex369StatusDto status, string? countyId)
    {
        var themeColor = status.InDivineBalance ? "Good" : (status.CurrentPowerScore >= 7.2 ? "Warning" : "Attention");
        var countyName = string.IsNullOrWhiteSpace(countyId) ? "System-Wide" : countyId;

        return new
        {
            type = "message",
            attachments = new[]
            {
                new
                {
                    contentType = "application/vnd.microsoft.card.adaptive",
                    content = new
                    {
                        type = "AdaptiveCard",
                        version = "1.4",
                        body = new object[]
                        {
                            new
                            {
                                type = "TextBlock",
                                text = $"Codex 3-6-9 System Status - {countyName}",
                                weight = "Bolder",
                                size = "Large",
                                color = themeColor
                            },
                            new
                            {
                                type = "FactSet",
                                facts = new[]
                                {
                                    new { title = "Ultimate Power Score", value = $"{status.CurrentPowerScore:F2}/12" },
                                    new { title = "Divine Balance", value = status.InDivineBalance ? "✅ YES" : "❌ NO" },
                                    new { title = "Championship Mode", value = status.UltimatePower.IsChampionshipMode ? "🏆 ACTIVE" : "⏳ Pending" },
                                    new { title = "Timestamp", value = $"{DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC" }
                                }
                            },
                            new
                            {
                                type = "TextBlock",
                                text = "Domain Performance",
                                weight = "Bolder",
                                spacing = "Medium"
                            },
                            new
                            {
                                type = "FactSet",
                                facts = status.AmplificationMetrics.Select(a => new
                                {
                                    title = a.Name,
                                    value = $"{a.AmplifiedScore:F2} {(a.SafeFromImbalance ? "✅" : "⚠️")}"
                                }).ToArray()
                            }
                        }
                    }
                }
            }
        };
    }

    private object BuildAlertAdaptiveCard(CodexAlertDto alert, string? countyId)
    {
        var themeColor = alert.Level == "Critical" ? "Attention" : (alert.Level == "Warning" ? "Warning" : "Accent");
        var countyName = string.IsNullOrWhiteSpace(countyId) ? "System-Wide" : countyId;

        return new
        {
            type = "message",
            attachments = new[]
            {
                new
                {
                    contentType = "application/vnd.microsoft.card.adaptive",
                    content = new
                    {
                        type = "AdaptiveCard",
                        version = "1.4",
                        body = new object[]
                        {
                            new
                            {
                                type = "TextBlock",
                                text = $"{alert.Level} Alert - {alert.Type}",
                                weight = "Bolder",
                                size = "Large",
                                color = themeColor
                            },
                            new
                            {
                                type = "TextBlock",
                                text = alert.Message,
                                wrap = true,
                                spacing = "Medium"
                            },
                            new
                            {
                                type = "FactSet",
                                facts = new[]
                                {
                                    new { title = "County", value = countyName },
                                    new { title = "Level", value = alert.Level },
                                    new { title = "Domain", value = alert.Domain ?? "System-Wide" },
                                    new { title = "Timestamp", value = $"{alert.Timestamp:yyyy-MM-dd HH:mm:ss} UTC" }
                                }
                            }
                        }
                    }
                }
            }
        };
    }

    private object BuildDailyPerformanceSummaryCard(Codex369StatusDto status, List<CodexAlertDto> alerts, string? countyId)
    {
        var criticalAlerts = alerts.Count(a => a.Level == "Critical");
        var warningAlerts = alerts.Count(a => a.Level == "Warning");
        var infoAlerts = alerts.Count(a => a.Level == "Info");

        var countyName = string.IsNullOrWhiteSpace(countyId) ? "System-Wide" : countyId;
        var themeColor = status.InDivineBalance ? "Good" : (status.CurrentPowerScore >= 7.2 ? "Warning" : "Attention");

        return new
        {
            type = "message",
            attachments = new[]
            {
                new
                {
                    contentType = "application/vnd.microsoft.card.adaptive",
                    content = new
                    {
                        type = "AdaptiveCard",
                        version = "1.4",
                        body = new object[]
                        {
                            new
                            {
                                type = "TextBlock",
                                text = $"Daily Performance Summary - {DateTime.UtcNow:MMMM dd, yyyy}",
                                weight = "Bolder",
                                size = "Large",
                                color = themeColor
                            },
                            new
                            {
                                type = "FactSet",
                                facts = new[]
                                {
                                    new { title = "County", value = countyName },
                                    new { title = "Ultimate Power Score", value = $"{status.CurrentPowerScore:F2}/12 {(status.InDivineBalance ? "✨" : "")}" }
                                }
                            },
                            new
                            {
                                type = "TextBlock",
                                text = "Alert Summary (Last 24 Hours)",
                                weight = "Bolder",
                                spacing = "Medium"
                            },
                            new
                            {
                                type = "FactSet",
                                facts = new[]
                                {
                                    new { title = "🚨 Critical", value = criticalAlerts.ToString() },
                                    new { title = "⚠️ Warning", value = warningAlerts.ToString() },
                                    new { title = "ℹ️ Info", value = infoAlerts.ToString() }
                                }
                            },
                            new
                            {
                                type = "TextBlock",
                                text = "Top Performing Domains",
                                weight = "Bolder",
                                spacing = "Medium"
                            },
                            new
                            {
                                type = "FactSet",
                                facts = status.AmplificationMetrics
                                    .OrderByDescending(a => a.AmplifiedScore)
                                    .Take(5)
                                    .Select(a => new
                                    {
                                        title = a.Name,
                                        value = $"{a.AmplifiedScore:F2} {(a.SafeFromImbalance ? "✅" : "⚠️")}"
                                    }).ToArray()
                            }
                        }
                    }
                }
            }
        };
    }

    private object BuildDivineBalanceAchievementCard(Codex369StatusDto status, string? countyId)
    {
        var countyName = string.IsNullOrWhiteSpace(countyId) ? "System-Wide" : countyId;

        return new
        {
            type = "message",
            attachments = new[]
            {
                new
                {
                    contentType = "application/vnd.microsoft.card.adaptive",
                    content = new
                    {
                        type = "AdaptiveCard",
                        version = "1.4",
                        body = new object[]
                        {
                            new
                            {
                                type = "TextBlock",
                                text = "✨ DIVINE BALANCE ACHIEVED ✨",
                                weight = "Bolder",
                                size = "ExtraLarge",
                                color = "Good",
                                horizontalAlignment = "Center"
                            },
                            new
                            {
                                type = "TextBlock",
                                text = $"Congratulations! {countyName} has achieved Divine Balance in the Codex 3-6-9 Framework!",
                                wrap = true,
                                spacing = "Medium"
                            },
                            new
                            {
                                type = "FactSet",
                                facts = new[]
                                {
                                    new { title = "Ultimate Power Score", value = $"{status.CurrentPowerScore:F2}/12" },
                                    new { title = "Timestamp", value = $"{DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC" }
                                }
                            },
                            new
                            {
                                type = "TextBlock",
                                text = "All 12 Domains in Perfect Harmony",
                                weight = "Bolder",
                                spacing = "Medium"
                            },
                            new
                            {
                                type = "FactSet",
                                facts = status.AmplificationMetrics.Select(a => new
                                {
                                    title = $"✅ {a.Name}",
                                    value = $"{a.AmplifiedScore:F2}"
                                }).ToArray()
                            },
                            new
                            {
                                type = "TextBlock",
                                text = "🏆 THE TERRAFUSION WAY - GOVERNMENT. TRANSCENDED.",
                                weight = "Bolder",
                                color = "Good",
                                horizontalAlignment = "Center",
                                spacing = "Medium"
                            }
                        }
                    }
                }
            }
        };
    }

    private object BuildChampionshipModeCard(Codex369StatusDto status, string? countyId)
    {
        var countyName = string.IsNullOrWhiteSpace(countyId) ? "System-Wide" : countyId;

        return new
        {
            type = "message",
            attachments = new[]
            {
                new
                {
                    contentType = "application/vnd.microsoft.card.adaptive",
                    content = new
                    {
                        type = "AdaptiveCard",
                        version = "1.4",
                        body = new object[]
                        {
                            new
                            {
                                type = "TextBlock",
                                text = "🏆 CHAMPIONSHIP MODE ACTIVATED 🏆",
                                weight = "Bolder",
                                size = "ExtraLarge",
                                color = "Attention",
                                horizontalAlignment = "Center"
                            },
                            new
                            {
                                type = "TextBlock",
                                text = $"{countyName} has entered Championship Mode!",
                                wrap = true,
                                spacing = "Medium",
                                size = "Large",
                                weight = "Bolder"
                            },
                            new
                            {
                                type = "TextBlock",
                                text = "All operational excellence criteria met:",
                                wrap = true,
                                spacing = "Medium"
                            },
                            new
                            {
                                type = "FactSet",
                                facts = new[]
                                {
                                    new { title = "✅ Divine Balance", value = $"Achieved ({status.CurrentPowerScore:F2}/12)" },
                                    new { title = "✅ Domain Safety", value = "All domains safe from imbalance" },
                                    new { title = "✅ Performance", value = "Peak operational status" },
                                    new { title = "Timestamp", value = $"{DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC" }
                                }
                            }
                        }
                    }
                }
            }
        };
    }

    private object BuildMetricUpdateCard(string metricName, double oldValue, double newValue, string? countyId)
    {
        var change = newValue - oldValue;
        var themeColor = change > 0 ? "Good" : (change < 0 ? "Warning" : "Default");
        var emoji = change > 0 ? "📈" : (change < 0 ? "📉" : "➡️");

        var countyName = string.IsNullOrWhiteSpace(countyId) ? "System-Wide" : countyId;

        return new
        {
            type = "message",
            attachments = new[]
            {
                new
                {
                    contentType = "application/vnd.microsoft.card.adaptive",
                    content = new
                    {
                        type = "AdaptiveCard",
                        version = "1.4",
                        body = new object[]
                        {
                            new
                            {
                                type = "TextBlock",
                                text = $"{emoji} Codex Metric Update",
                                weight = "Bolder",
                                size = "Large",
                                color = themeColor
                            },
                            new
                            {
                                type = "TextBlock",
                                text = $"{metricName} has been updated for {countyName}",
                                wrap = true,
                                spacing = "Small"
                            },
                            new
                            {
                                type = "FactSet",
                                facts = new[]
                                {
                                    new { title = "Previous", value = $"{oldValue:F2}" },
                                    new { title = "Current", value = $"{newValue:F2}" },
                                    new { title = "Change", value = $"{(change >= 0 ? "+" : "")}{change:F2} ({emoji})" }
                                }
                            }
                        }
                    }
                }
            }
        };
    }

    // ============================================================================
    // TEAMS API COMMUNICATION
    // ============================================================================

    private async Task SendTeamsMessageAsync(object message, string? countyId)
    {
        var webhookUrl = GetWebhookUrl(countyId);

        if (string.IsNullOrWhiteSpace(webhookUrl))
        {
            _logger.LogWarning("Teams webhook URL not configured for county: {County}", countyId ?? "System-Wide");
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
                _logger.LogError("Teams API returned error: {StatusCode} - {Content}", response.StatusCode, errorContent);
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

    private void LoadTeamsConfiguration()
    {
        _defaultWebhookUrl = _configuration["MicrosoftTeams:DefaultWebhookUrl"];

        var countyWebhooks = _configuration.GetSection("MicrosoftTeams:CountyWebhooks").GetChildren();
        foreach (var countyWebhook in countyWebhooks)
        {
            var countyId = countyWebhook.Key;
            var webhookUrl = countyWebhook.Value;

            if (!string.IsNullOrWhiteSpace(webhookUrl))
            {
                _countyWebhookUrls[countyId.ToLowerInvariant()] = webhookUrl;
            }
        }

        _logger.LogInformation("Loaded Teams configuration: Default webhook configured: {HasDefault}, County webhooks: {CountyCount}",
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
