using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TerraFusion.Data;
using System.Security.Claims;

namespace TerraFusion.API.Controllers;

/// <summary>
/// Codex 3-6-9 Framework - Notification Preferences Management Controller
///
/// User Preference Management:
/// - Email notification preferences
/// - Slack notification preferences
/// - Teams notification preferences
/// - Alert threshold customization
/// - Daily summary scheduling
///
/// Features:
/// - Per-user notification settings
/// - Platform-specific preferences
/// - Alert level customization
/// - Daily summary configuration
/// - Multi-county support
///
/// THE TERRAFUSION WAY - GOVERNMENT. TRANSCENDED.
/// </summary>
[ApiController]
[Route("api/codex/notifications/preferences")]
[Authorize]
public class CodexNotificationPreferencesController : ControllerBase
{
    private readonly TerraFusionDbContext _context;
    private readonly ILogger<CodexNotificationPreferencesController> _logger;

    public CodexNotificationPreferencesController(
        TerraFusionDbContext context,
        ILogger<CodexNotificationPreferencesController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Get current user's notification preferences
    /// </summary>
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetPreferences()
    {
        try
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { error = "User not authenticated" });
            }

            var preferences = await _context.NotificationPreferences
                .FirstOrDefaultAsync(p => p.UserId == userId);

            if (preferences == null)
            {
                // Return default preferences if none exist
                return Ok(new NotificationPreferencesDto
                {
                    Email = new EmailPreferencesDto
                    {
                        Enabled = true,
                        Address = User.FindFirstValue(ClaimTypes.Email) ?? "",
                        CriticalAlerts = true,
                        WarningAlerts = true,
                        InfoAlerts = false,
                        DailySummary = true,
                        Achievements = true
                    },
                    Slack = new SlackPreferencesDto
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
                        CriticalThreshold = 7.2,
                        WarningThreshold = 9.6
                    },
                    DailySummary = new DailySummaryPreferencesDto
                    {
                        Enabled = true,
                        Time = "08:00",
                        Timezone = "America/Los_Angeles",
                        IncludeAlerts = true,
                        IncludePerformance = true,
                        IncludeTrends = true
                    }
                });
            }

            return Ok(MapToDto(preferences));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get notification preferences");
            return StatusCode(500, new { error = "Failed to get notification preferences" });
        }
    }

    /// <summary>
    /// Update current user's notification preferences
    /// </summary>
    [HttpPut]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdatePreferences([FromBody] NotificationPreferencesDto dto)
    {
        try
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { error = "User not authenticated" });
            }

            // Validate input
            if (dto.Email.Enabled && string.IsNullOrWhiteSpace(dto.Email.Address))
            {
                return BadRequest(new { error = "Email address is required when email notifications are enabled" });
            }

            if (dto.Slack.Enabled && string.IsNullOrWhiteSpace(dto.Slack.Webhook))
            {
                return BadRequest(new { error = "Slack webhook URL is required when Slack notifications are enabled" });
            }

            if (dto.Teams.Enabled && string.IsNullOrWhiteSpace(dto.Teams.Webhook))
            {
                return BadRequest(new { error = "Teams webhook URL is required when Teams notifications are enabled" });
            }

            var preferences = await _context.NotificationPreferences
                .FirstOrDefaultAsync(p => p.UserId == userId);

            if (preferences == null)
            {
                // Create new preferences
                preferences = new TerraFusion.Core.Entities.NotificationPreferences
                {
                    UserId = userId,
                    CreatedAt = DateTime.UtcNow
                };
                _context.NotificationPreferences.Add(preferences);
            }

            // Update preferences
            MapFromDto(preferences, dto);
            preferences.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Updated notification preferences for user: {UserId}", userId);

            return Ok(MapToDto(preferences));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to update notification preferences");
            return StatusCode(500, new { error = "Failed to update notification preferences" });
        }
    }

    /// <summary>
    /// Reset preferences to default values
    /// </summary>
    [HttpPost("reset")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> ResetPreferences()
    {
        try
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { error = "User not authenticated" });
            }

            var preferences = await _context.NotificationPreferences
                .FirstOrDefaultAsync(p => p.UserId == userId);

            if (preferences != null)
            {
                _context.NotificationPreferences.Remove(preferences);
                await _context.SaveChangesAsync();
            }

            _logger.LogInformation("Reset notification preferences for user: {UserId}", userId);

            return Ok(new { success = true, message = "Preferences reset to default values" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to reset notification preferences");
            return StatusCode(500, new { error = "Failed to reset notification preferences" });
        }
    }

    // ============================================================================
    // PRIVATE HELPER METHODS
    // ============================================================================

    private NotificationPreferencesDto MapToDto(TerraFusion.Core.Entities.NotificationPreferences entity)
    {
        return new NotificationPreferencesDto
        {
            Email = new EmailPreferencesDto
            {
                Enabled = entity.EmailEnabled,
                Address = entity.EmailAddress ?? "",
                CriticalAlerts = entity.EmailCriticalAlerts,
                WarningAlerts = entity.EmailWarningAlerts,
                InfoAlerts = entity.EmailInfoAlerts,
                DailySummary = entity.EmailDailySummary,
                Achievements = entity.EmailAchievements
            },
            Slack = new SlackPreferencesDto
            {
                Enabled = entity.SlackEnabled,
                Webhook = entity.SlackWebhook ?? "",
                CriticalAlerts = entity.SlackCriticalAlerts,
                WarningAlerts = entity.SlackWarningAlerts,
                InfoAlerts = entity.SlackInfoAlerts,
                StatusUpdates = entity.SlackStatusUpdates,
                DailySummary = entity.SlackDailySummary,
                Achievements = entity.SlackAchievements
            },
            Teams = new TeamsPreferencesDto
            {
                Enabled = entity.TeamsEnabled,
                Webhook = entity.TeamsWebhook ?? "",
                CriticalAlerts = entity.TeamsCriticalAlerts,
                WarningAlerts = entity.TeamsWarningAlerts,
                InfoAlerts = entity.TeamsInfoAlerts,
                StatusUpdates = entity.TeamsStatusUpdates,
                DailySummary = entity.TeamsDailySummary,
                Achievements = entity.TeamsAchievements
            },
            AlertThresholds = new AlertThresholdsDto
            {
                UltimatePowerScore = entity.UltimatePowerScoreThreshold,
                DomainScore = entity.DomainScoreThreshold,
                CriticalThreshold = entity.CriticalAlertThreshold,
                WarningThreshold = entity.WarningAlertThreshold
            },
            DailySummary = new DailySummaryPreferencesDto
            {
                Enabled = entity.DailySummaryEnabled,
                Time = entity.DailySummaryTime ?? "08:00",
                Timezone = entity.DailySummaryTimezone ?? "America/Los_Angeles",
                IncludeAlerts = entity.DailySummaryIncludeAlerts,
                IncludePerformance = entity.DailySummaryIncludePerformance,
                IncludeTrends = entity.DailySummaryIncludeTrends
            }
        };
    }

    private void MapFromDto(TerraFusion.Core.Entities.NotificationPreferences entity, NotificationPreferencesDto dto)
    {
        // Email
        entity.EmailEnabled = dto.Email.Enabled;
        entity.EmailAddress = dto.Email.Address;
        entity.EmailCriticalAlerts = dto.Email.CriticalAlerts;
        entity.EmailWarningAlerts = dto.Email.WarningAlerts;
        entity.EmailInfoAlerts = dto.Email.InfoAlerts;
        entity.EmailDailySummary = dto.Email.DailySummary;
        entity.EmailAchievements = dto.Email.Achievements;

        // Slack
        entity.SlackEnabled = dto.Slack.Enabled;
        entity.SlackWebhook = dto.Slack.Webhook;
        entity.SlackCriticalAlerts = dto.Slack.CriticalAlerts;
        entity.SlackWarningAlerts = dto.Slack.WarningAlerts;
        entity.SlackInfoAlerts = dto.Slack.InfoAlerts;
        entity.SlackStatusUpdates = dto.Slack.StatusUpdates;
        entity.SlackDailySummary = dto.Slack.DailySummary;
        entity.SlackAchievements = dto.Slack.Achievements;

        // Teams
        entity.TeamsEnabled = dto.Teams.Enabled;
        entity.TeamsWebhook = dto.Teams.Webhook;
        entity.TeamsCriticalAlerts = dto.Teams.CriticalAlerts;
        entity.TeamsWarningAlerts = dto.Teams.WarningAlerts;
        entity.TeamsInfoAlerts = dto.Teams.InfoAlerts;
        entity.TeamsStatusUpdates = dto.Teams.StatusUpdates;
        entity.TeamsDailySummary = dto.Teams.DailySummary;
        entity.TeamsAchievements = dto.Teams.Achievements;

        // Thresholds
        entity.UltimatePowerScoreThreshold = dto.AlertThresholds.UltimatePowerScore;
        entity.DomainScoreThreshold = dto.AlertThresholds.DomainScore;
        entity.CriticalAlertThreshold = dto.AlertThresholds.CriticalThreshold;
        entity.WarningAlertThreshold = dto.AlertThresholds.WarningThreshold;

        // Daily Summary
        entity.DailySummaryEnabled = dto.DailySummary.Enabled;
        entity.DailySummaryTime = dto.DailySummary.Time;
        entity.DailySummaryTimezone = dto.DailySummary.Timezone;
        entity.DailySummaryIncludeAlerts = dto.DailySummary.IncludeAlerts;
        entity.DailySummaryIncludePerformance = dto.DailySummary.IncludePerformance;
        entity.DailySummaryIncludeTrends = dto.DailySummary.IncludeTrends;
    }
}

// ============================================================================
// DTOs
// ============================================================================

public class NotificationPreferencesDto
{
    public EmailPreferencesDto Email { get; set; } = new();
    public SlackPreferencesDto Slack { get; set; } = new();
    public TeamsPreferencesDto Teams { get; set; } = new();
    public AlertThresholdsDto AlertThresholds { get; set; } = new();
    public DailySummaryPreferencesDto DailySummary { get; set; } = new();
}

public class EmailPreferencesDto
{
    public bool Enabled { get; set; }
    public string Address { get; set; } = "";
    public bool CriticalAlerts { get; set; }
    public bool WarningAlerts { get; set; }
    public bool InfoAlerts { get; set; }
    public bool DailySummary { get; set; }
    public bool Achievements { get; set; }
}

public class SlackPreferencesDto
{
    public bool Enabled { get; set; }
    public string Webhook { get; set; } = "";
    public bool CriticalAlerts { get; set; }
    public bool WarningAlerts { get; set; }
    public bool InfoAlerts { get; set; }
    public bool StatusUpdates { get; set; }
    public bool DailySummary { get; set; }
    public bool Achievements { get; set; }
}

public class TeamsPreferencesDto
{
    public bool Enabled { get; set; }
    public string Webhook { get; set; } = "";
    public bool CriticalAlerts { get; set; }
    public bool WarningAlerts { get; set; }
    public bool InfoAlerts { get; set; }
    public bool StatusUpdates { get; set; }
    public bool DailySummary { get; set; }
    public bool Achievements { get; set; }
}

public class AlertThresholdsDto
{
    public double UltimatePowerScore { get; set; }
    public double DomainScore { get; set; }
    public double CriticalThreshold { get; set; }
    public double WarningThreshold { get; set; }
}

public class DailySummaryPreferencesDto
{
    public bool Enabled { get; set; }
    public string Time { get; set; } = "08:00";
    public string Timezone { get; set; } = "America/Los_Angeles";
    public bool IncludeAlerts { get; set; }
    public bool IncludePerformance { get; set; }
    public bool IncludeTrends { get; set; }
}

// ============================================================================
// DATABASE ENTITY
// ============================================================================

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

    // Audit fields
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
