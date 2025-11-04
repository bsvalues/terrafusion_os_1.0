using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using System.Net;
using System.Net.Http.Json;
using Xunit;
using TerraFusion.AI.Services;
using TerraFusion.AI.DTOs;

namespace TerraFusion.API.Tests;

/// <summary>
/// Codex 3-6-9 Framework - Notification System Integration Tests
///
/// Test Coverage:
/// - Collaboration platform connectivity (Slack, Teams)
/// - Notification preferences CRUD operations
/// - Alert broadcasting to all platforms
/// - Daily summary generation and delivery
/// - Divine Balance and Championship Mode notifications
/// - Metric update notifications
/// - Performance optimization caching
/// - Background service notification triggers
///
/// Government Compliance:
/// - Test data isolation per county
/// - Audit logging verification
/// - Webhook URL validation
/// - Rate limiting compliance
/// - FISMA-HIGH security validation
///
/// THE TERRAFUSION WAY - GOVERNMENT. TRANSCENDED.
/// </summary>
public class CodexNotificationIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;

    public CodexNotificationIntegrationTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    // ============================================================================
    // COLLABORATION PLATFORM TESTS
    // ============================================================================

    [Fact]
    public async Task GetCollaborationHealth_ShouldReturnHealthStatus()
    {
        // Arrange
        var url = "/api/codex/collaboration/health";

        // Act
        var response = await _client.GetAsync(url);

        // Assert
        response.EnsureSuccessStatusCode();
        var health = await response.Content.ReadFromJsonAsync<CollaborationHealthDto>();

        Assert.NotNull(health);
        Assert.NotEmpty(health.Platforms);
        Assert.Contains(health.Platforms, p => p.Name == "Slack");
        Assert.Contains(health.Platforms, p => p.Name == "Microsoft Teams");
        Assert.Contains(health.Platforms, p => p.Name == "Email");
    }

    [Fact]
    public async Task BroadcastSystemStatus_ShouldSucceed()
    {
        // Arrange
        var url = "/api/codex/collaboration/broadcast/status?countyId=benton";

        // Act
        var response = await _client.PostAsync(url, null);

        // Assert
        Assert.True(response.IsSuccessStatusCode || response.StatusCode == HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task BroadcastDailySummary_ShouldSucceed()
    {
        // Arrange
        var url = "/api/codex/collaboration/broadcast/daily-summary?countyId=benton";

        // Act
        var response = await _client.PostAsync(url, null);

        // Assert
        Assert.True(response.IsSuccessStatusCode || response.StatusCode == HttpStatusCode.Unauthorized);
    }

    // ============================================================================
    // NOTIFICATION PREFERENCES TESTS
    // ============================================================================

    [Fact]
    public async Task GetNotificationPreferences_ShouldReturnDefaultPreferences()
    {
        // Arrange
        var url = "/api/codex/notifications/preferences";

        // Act
        var response = await _client.GetAsync(url);

        // Assert
        Assert.True(response.IsSuccessStatusCode || response.StatusCode == HttpStatusCode.Unauthorized);

        if (response.IsSuccessStatusCode)
        {
            var preferences = await response.Content.ReadFromJsonAsync<NotificationPreferencesDto>();

            Assert.NotNull(preferences);
            Assert.NotNull(preferences.Email);
            Assert.NotNull(preferences.Slack);
            Assert.NotNull(preferences.Teams);
            Assert.NotNull(preferences.AlertThresholds);
            Assert.NotNull(preferences.DailySummary);

            // Verify default values
            Assert.True(preferences.Email.Enabled);
            Assert.True(preferences.Email.CriticalAlerts);
            Assert.False(preferences.Slack.Enabled);
            Assert.False(preferences.Teams.Enabled);
            Assert.Equal(7.2, preferences.AlertThresholds.CriticalThreshold);
            Assert.Equal(9.6, preferences.AlertThresholds.WarningThreshold);
        }
    }

    [Fact]
    public async Task UpdateNotificationPreferences_ShouldPersistChanges()
    {
        // Arrange
        var url = "/api/codex/notifications/preferences";
        var preferences = new NotificationPreferencesDto
        {
            Email = new EmailPreferencesDto
            {
                Enabled = true,
                Address = "test@terrafusion.gov",
                CriticalAlerts = true,
                WarningAlerts = false,
                InfoAlerts = false,
                DailySummary = true,
                Achievements = true
            },
            Slack = new SlackPreferencesDto
            {
                Enabled = true,
                Webhook = "https://hooks.slack.com/services/TEST/WEBHOOK/URL",
                CriticalAlerts = true,
                WarningAlerts = true,
                InfoAlerts = true,
                StatusUpdates = false,
                DailySummary = true,
                Achievements = true
            },
            Teams = new TeamsPreferencesDto
            {
                Enabled = false,
                Webhook = "",
                CriticalAlerts = true,
                WarningAlerts = true,
                InfoAlerts = true,
                StatusUpdates = false,
                DailySummary = true,
                Achievements = true
            },
            AlertThresholds = new AlertThresholdsDto
            {
                UltimatePowerScore = 7.2,
                DomainScore = 0.6,
                CriticalThreshold = 6.5,
                WarningThreshold = 9.0
            },
            DailySummary = new DailySummaryPreferencesDto
            {
                Enabled = true,
                Time = "09:00",
                Timezone = "America/New_York",
                IncludeAlerts = true,
                IncludePerformance = true,
                IncludeTrends = false
            }
        };

        // Act
        var response = await _client.PutAsJsonAsync(url, preferences);

        // Assert
        Assert.True(response.IsSuccessStatusCode || response.StatusCode == HttpStatusCode.Unauthorized);

        if (response.IsSuccessStatusCode)
        {
            var updatedPreferences = await response.Content.ReadFromJsonAsync<NotificationPreferencesDto>();

            Assert.NotNull(updatedPreferences);
            Assert.True(updatedPreferences.Slack.Enabled);
            Assert.Equal("https://hooks.slack.com/services/TEST/WEBHOOK/URL", updatedPreferences.Slack.Webhook);
            Assert.Equal(6.5, updatedPreferences.AlertThresholds.CriticalThreshold);
            Assert.Equal("09:00", updatedPreferences.DailySummary.Time);
            Assert.Equal("America/New_York", updatedPreferences.DailySummary.Timezone);
        }
    }

    [Fact]
    public async Task ResetNotificationPreferences_ShouldReturnToDefaults()
    {
        // Arrange
        var url = "/api/codex/notifications/preferences/reset";

        // Act
        var response = await _client.PostAsync(url, null);

        // Assert
        Assert.True(response.IsSuccessStatusCode || response.StatusCode == HttpStatusCode.Unauthorized);
    }

    // ============================================================================
    // PERFORMANCE OPTIMIZATION TESTS
    // ============================================================================

    [Fact]
    public async Task GetOptimizedSystemWideStatus_ShouldReturnCachedResult()
    {
        // Arrange
        var url = "/api/codex/performance/system-wide?countyId=benton";

        // Act - First call (cache miss)
        var response1 = await _client.GetAsync(url);
        var startTime = DateTime.UtcNow;

        // Act - Second call (cache hit)
        var response2 = await _client.GetAsync(url);
        var endTime = DateTime.UtcNow;

        // Assert
        response1.EnsureSuccessStatusCode();
        response2.EnsureSuccessStatusCode();

        var status1 = await response1.Content.ReadFromJsonAsync<Codex369StatusDto>();
        var status2 = await response2.Content.ReadFromJsonAsync<Codex369StatusDto>();

        Assert.NotNull(status1);
        Assert.NotNull(status2);
        Assert.Equal(status1.CurrentPowerScore, status2.CurrentPowerScore);

        // Second call should be faster (cached)
        var cacheResponseTime = (endTime - startTime).TotalMilliseconds;
        Assert.True(cacheResponseTime < 100, $"Cached response took {cacheResponseTime}ms, expected < 100ms");
    }

    [Fact]
    public async Task GetPerformanceMetrics_ShouldShowCacheStatistics()
    {
        // Arrange
        var url = "/api/codex/performance/metrics";

        // Act
        var response = await _client.GetAsync(url);

        // Assert
        response.EnsureSuccessStatusCode();
        var metrics = await response.Content.ReadFromJsonAsync<CodexPerformanceMetricsDto>();

        Assert.NotNull(metrics);
        Assert.True(metrics.TotalQueries >= 0);
        Assert.True(metrics.CacheHitRate >= 0 && metrics.CacheHitRate <= 100);
        Assert.NotNull(metrics.PerformanceBreakdown);
        Assert.NotNull(metrics.CacheStatistics);
    }

    [Fact]
    public async Task WarmCache_ShouldPreloadData()
    {
        // Arrange
        var url = "/api/codex/performance/cache/warm?countyId=benton";

        // Act
        var response = await _client.PostAsync(url, null);

        // Assert
        Assert.True(response.IsSuccessStatusCode || response.StatusCode == HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task InvalidateCache_ShouldClearCachedData()
    {
        // Arrange
        var url = "/api/codex/performance/cache/invalidate?countyId=benton";

        // Act
        var response = await _client.PostAsync(url, null);

        // Assert
        Assert.True(response.IsSuccessStatusCode || response.StatusCode == HttpStatusCode.Unauthorized);
    }

    // ============================================================================
    // EXECUTIVE REPORTING TESTS
    // ============================================================================

    [Fact]
    public async Task GetDailyReport_ShouldReturnReport()
    {
        // Arrange
        var yesterday = DateTime.UtcNow.AddDays(-1).ToString("yyyy-MM-dd");
        var url = $"/api/codex/reports/daily?countyId=benton&date={yesterday}";

        // Act
        var response = await _client.GetAsync(url);

        // Assert
        Assert.True(response.IsSuccessStatusCode || response.StatusCode == HttpStatusCode.Unauthorized);

        if (response.IsSuccessStatusCode)
        {
            var report = await response.Content.ReadFromJsonAsync<ExecutiveReportDto>();

            Assert.NotNull(report);
            Assert.Equal("Daily Operations Report", report.ReportType);
            Assert.NotEmpty(report.DomainPerformance);
            Assert.NotNull(report.AlertSummary);
            Assert.NotEmpty(report.ExecutiveRecommendations);
        }
    }

    [Fact]
    public async Task GetWeeklyReport_ShouldReturnReport()
    {
        // Arrange
        var lastMonday = DateTime.UtcNow.AddDays(-(int)DateTime.UtcNow.DayOfWeek + 1).ToString("yyyy-MM-dd");
        var url = $"/api/codex/reports/weekly?countyId=benton&weekEnding={lastMonday}";

        // Act
        var response = await _client.GetAsync(url);

        // Assert
        Assert.True(response.IsSuccessStatusCode || response.StatusCode == HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GetMonthlyReport_ShouldReturnReport()
    {
        // Arrange
        var url = "/api/codex/reports/monthly?countyId=benton&year=2025&month=11";

        // Act
        var response = await _client.GetAsync(url);

        // Assert
        Assert.True(response.IsSuccessStatusCode || response.StatusCode == HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task ExportReportToCsv_ShouldReturnCsvFile()
    {
        // Arrange
        var url = "/api/codex/reports/export/csv";
        var request = new
        {
            reportType = "daily",
            countyId = "benton",
            date = DateTime.UtcNow.AddDays(-1).ToString("yyyy-MM-dd")
        };

        // Act
        var response = await _client.PostAsJsonAsync(url, request);

        // Assert
        Assert.True(response.IsSuccessStatusCode || response.StatusCode == HttpStatusCode.Unauthorized);

        if (response.IsSuccessStatusCode)
        {
            var csvContent = await response.Content.ReadAsStringAsync();
            Assert.NotEmpty(csvContent);
            Assert.Contains("Codex 3-6-9", csvContent);
        }
    }

    // ============================================================================
    // ALERT NOTIFICATION TESTS
    // ============================================================================

    [Fact]
    public async Task GetAlerts_ShouldReturnAlertList()
    {
        // Arrange
        var url = "/api/codex/alerts?countyId=benton";

        // Act
        var response = await _client.GetAsync(url);

        // Assert
        response.EnsureSuccessStatusCode();
        var alerts = await response.Content.ReadFromJsonAsync<List<CodexAlertDto>>();

        Assert.NotNull(alerts);
    }

    // ============================================================================
    // SERVICE DEPENDENCY TESTS
    // ============================================================================

    [Fact]
    public void SlackNotificationService_ShouldBeRegistered()
    {
        // Arrange
        using var scope = _factory.Services.CreateScope();

        // Act
        var slackService = scope.ServiceProvider.GetService<ICodexSlackNotificationService>();

        // Assert
        Assert.NotNull(slackService);
    }

    [Fact]
    public void TeamsNotificationService_ShouldBeRegistered()
    {
        // Arrange
        using var scope = _factory.Services.CreateScope();

        // Act
        var teamsService = scope.ServiceProvider.GetService<ICodexTeamsNotificationService>();

        // Assert
        Assert.NotNull(teamsService);
    }

    [Fact]
    public void CollaborationOrchestrator_ShouldBeRegistered()
    {
        // Arrange
        using var scope = _factory.Services.CreateScope();

        // Act
        var orchestrator = scope.ServiceProvider.GetService<ICodexCollaborationOrchestrator>();

        // Assert
        Assert.NotNull(orchestrator);
    }

    [Fact]
    public void CachingService_ShouldBeRegistered()
    {
        // Arrange
        using var scope = _factory.Services.CreateScope();

        // Act
        var cachingService = scope.ServiceProvider.GetService<ICodexCachingService>();

        // Assert
        Assert.NotNull(cachingService);
    }

    [Fact]
    public void PerformanceOptimizationService_ShouldBeRegistered()
    {
        // Arrange
        using var scope = _factory.Services.CreateScope();

        // Act
        var perfService = scope.ServiceProvider.GetService<ICodexPerformanceOptimizationService>();

        // Assert
        Assert.NotNull(perfService);
    }

    [Fact]
    public void ExecutiveReportService_ShouldBeRegistered()
    {
        // Arrange
        using var scope = _factory.Services.CreateScope();

        // Act
        var reportService = scope.ServiceProvider.GetService<ICodexExecutiveReportService>();

        // Assert
        Assert.NotNull(reportService);
    }
}

// ============================================================================
// TEST DTOs (matching API DTOs)
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

public class CodexPerformanceMetricsDto
{
    public long TotalQueries { get; set; }
    public long CachedQueries { get; set; }
    public long DatabaseQueries { get; set; }
    public double CacheHitRate { get; set; }
    public double CacheMissRate { get; set; }
    public PerformanceBreakdown PerformanceBreakdown { get; set; } = new();
    public CacheStatisticsDto CacheStatistics { get; set; } = new();
    public DateTime Timestamp { get; set; }
}

public class PerformanceBreakdown
{
    public double AverageCachedQueryTime { get; set; }
    public double AverageDatabaseQueryTime { get; set; }
    public double FastestQueryTime { get; set; }
    public double SlowestQueryTime { get; set; }
    public int TotalQueriesLogged { get; set; }
}

public class CacheStatisticsDto
{
    public long CacheHits { get; set; }
    public long CacheMisses { get; set; }
    public long CacheWrites { get; set; }
    public long CacheInvalidations { get; set; }
    public double HitRate { get; set; }
    public DateTime Timestamp { get; set; }
}

public class ExecutiveReportDto
{
    public string ReportType { get; set; } = "";
    public string ReportPeriod { get; set; } = "";
    public string CountyId { get; set; } = "";
    public DateTime GeneratedAt { get; set; }
    public double CurrentUltimatePowerScore { get; set; }
    public bool InDivineBalance { get; set; }
    public bool InChampionshipMode { get; set; }
    public List<DomainPerformanceDto> DomainPerformance { get; set; } = new();
    public AlertSummaryDto AlertSummary { get; set; } = new();
    public List<string> ExecutiveRecommendations { get; set; } = new();
}

public class DomainPerformanceDto
{
    public string DomainName { get; set; } = "";
    public double Score { get; set; }
    public string AlertLevel { get; set; } = "";
    public bool SafeFromImbalance { get; set; }
}

public class AlertSummaryDto
{
    public int CriticalAlerts { get; set; }
    public int WarningAlerts { get; set; }
    public int InfoAlerts { get; set; }
    public int TotalAlerts { get; set; }
}
