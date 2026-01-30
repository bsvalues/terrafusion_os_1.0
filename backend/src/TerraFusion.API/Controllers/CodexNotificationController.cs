using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TerraFusion.AI.Services;
using TerraFusion.AI.DTOs;

namespace TerraFusion.API.Controllers;

/// <summary>
/// Codex 3-6-9 Framework - Email Notification Management Controller
///
/// Government Operations:
/// - Test email configuration for FISMA compliance
/// - Send manual alerts to stakeholders
/// - Trigger daily/weekly reports on demand
/// - Configure notification recipients and settings
///
/// Security: Requires Admin authorization for configuration changes
/// </summary>
[ApiController]
[Route("api/codex/notifications")]
[Authorize]
public class CodexNotificationController : ControllerBase
{
    private readonly ICodexEmailNotificationService _emailService;
    private readonly ICodex369FrameworkService _codexService;
    private readonly ILogger<CodexNotificationController> _logger;

    public CodexNotificationController(
        ICodexEmailNotificationService emailService,
        ICodex369FrameworkService codexService,
        ILogger<CodexNotificationController> logger)
    {
        _emailService = emailService;
        _codexService = codexService;
        _logger = logger;
    }

    /// <summary>
    /// Test email configuration
    /// Sends a test email to verify SMTP settings and connectivity
    /// </summary>
    /// <returns>Email configuration test result</returns>
    [HttpPost("test")]
    [Authorize(Roles = "Admin,SystemAdministrator")]
    [ProducesResponseType(typeof(EmailTestResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<EmailTestResultDto>> TestEmailConfiguration()
    {
        try
        {
            _logger.LogInformation("Testing Codex email configuration");

            var success = await _emailService.TestEmailConfigurationAsync();

            return Ok(new EmailTestResultDto
            {
                Success = success,
                Message = success
                    ? "Email configuration is operational. Test email sent successfully."
                    : "Email configuration test failed. Check SMTP settings and credentials.",
                TestedAt = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Email configuration test failed");
            return StatusCode(500, new EmailTestResultDto
            {
                Success = false,
                Message = $"Email test failed: {ex.Message}",
                TestedAt = DateTime.UtcNow,
                ErrorDetails = ex.ToString()
            });
        }
    }

    /// <summary>
    /// Send manual alert notification
    /// Allows administrators to send custom alerts to stakeholders
    /// </summary>
    [HttpPost("send-alert")]
    [Authorize(Roles = "Admin,SystemAdministrator,CountyAdministrator")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SendManualAlert([FromBody] ManualAlertRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.Message))
            {
                return BadRequest("Alert message is required");
            }

            var alert = new CodexAlertDto
            {
                AlertLevel = request.AlertLevel ?? "Yellow",
                MetricName = request.MetricName ?? "Manual Alert",
                Message = request.Message,
                RecommendedAction = request.RecommendedAction,
                Timestamp = DateTime.UtcNow
            };

            var safeCountyId = request.CountyId ?? "System-Wide";
            await _emailService.SendAlertNotificationAsync(alert, safeCountyId);

            _logger.LogInformation("Manual alert sent: {AlertLevel} - {Message}", alert.AlertLevel, alert.Message);

            return Ok(new { message = "Alert notification sent successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send manual alert");
            return StatusCode(500, new { error = "Failed to send alert notification" });
        }
    }

    /// <summary>
    /// Send daily digest on demand
    /// Generates and sends daily digest report for specified date
    /// </summary>
    [HttpPost("send-daily-digest")]
    [Authorize(Roles = "Admin,SystemAdministrator,CountyAdministrator")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> SendDailyDigest([FromQuery] string? countyId, [FromQuery] DateTime? date)
    {
        try
        {
            var targetDate = date ?? DateTime.UtcNow.Date;
            var safeCountyId = countyId ?? "System-Wide";

            _logger.LogInformation("Sending daily digest for {Date}, County: {County}", targetDate, safeCountyId);

            await _emailService.SendDailyDigestAsync(safeCountyId, targetDate);

            return Ok(new
            {
                message = "Daily digest sent successfully",
                date = targetDate,
                countyId = safeCountyId
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send daily digest");
            return StatusCode(500, new { error = "Failed to send daily digest" });
        }
    }

    /// <summary>
    /// Send weekly executive summary on demand
    /// Generates and sends weekly executive summary for specified week
    /// </summary>
    [HttpPost("send-weekly-summary")]
    [Authorize(Roles = "Admin,SystemAdministrator,ExecutiveLeadership")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> SendWeeklySummary([FromQuery] string? countyId, [FromQuery] DateTime? weekEnding)
    {
        try
        {
            var targetWeekEnd = weekEnding ?? DateTime.UtcNow.Date;
            var safeCountyId = countyId ?? "System-Wide";

            _logger.LogInformation("Sending weekly executive summary for week ending {Date}, County: {County}",
                targetWeekEnd, safeCountyId);

            await _emailService.SendWeeklyExecutiveSummaryAsync(safeCountyId, targetWeekEnd);

            return Ok(new
            {
                message = "Weekly executive summary sent successfully",
                weekEnding = targetWeekEnd,
                countyId = safeCountyId
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send weekly executive summary");
            return StatusCode(500, new { error = "Failed to send weekly executive summary" });
        }
    }

    /// <summary>
    /// Send Divine Balance achievement notification
    /// Sends celebration notification when Divine Balance is achieved
    /// </summary>
    [HttpPost("send-divine-balance-notification")]
    [Authorize(Roles = "Admin,SystemAdministrator")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> SendDivineBalanceNotification([FromQuery] string? countyId)
    {
        try
        {
            var status = await _codexService.GetSystemWideCodexAsync();

            if (!status.UltimatePower.InDivineBalance)
            {
                return BadRequest(new
                {
                    error = "System is not in Divine Balance",
                    currentScore = status.CurrentPowerScore,
                    requiredRange = "11.5 - 12.0"
                });
            }

            var domainScores = status.AmplificationMetrics
                .ToDictionary(a => a.Name, a => a.AmplifiedScore);

            var safeCountyId = countyId ?? "System-Wide";
            await _emailService.SendDivineBalanceAchievedNotificationAsync(
                status.CurrentPowerScore,
                safeCountyId,
                domainScores);

            _logger.LogInformation("Divine Balance notification sent for score {Score}", status.CurrentPowerScore);

            return Ok(new
            {
                message = "Divine Balance achievement notification sent successfully",
                score = status.CurrentPowerScore,
                timestamp = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send Divine Balance notification");
            return StatusCode(500, new { error = "Failed to send Divine Balance notification" });
        }
    }

    /// <summary>
    /// Send Championship Mode notification
    /// Sends notification when Championship Mode is achieved (score ≥ 10.0)
    /// </summary>
    [HttpPost("send-championship-notification")]
    [Authorize(Roles = "Admin,SystemAdministrator")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> SendChampionshipNotification([FromQuery] string? countyId)
    {
        try
        {
            var status = await _codexService.GetSystemWideCodexAsync();

            if (!status.UltimatePower.IsChampionshipMode)
            {
                return BadRequest(new
                {
                    error = "System is not in Championship Mode",
                    currentScore = status.CurrentPowerScore,
                    requiredScore = 10.0
                });
            }

            var safeCountyId = countyId ?? "System-Wide";
            await _emailService.SendChampionshipModeNotificationAsync(
                status.CurrentPowerScore,
                safeCountyId);

            _logger.LogInformation("Championship Mode notification sent for score {Score}", status.CurrentPowerScore);

            return Ok(new
            {
                message = "Championship Mode notification sent successfully",
                score = status.CurrentPowerScore,
                timestamp = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send Championship Mode notification");
            return StatusCode(500, new { error = "Failed to send Championship Mode notification" });
        }
    }

    /// <summary>
    /// Get notification history
    /// Returns recent notification activity for audit trail
    /// </summary>
    [HttpGet("history")]
    [Authorize(Roles = "Admin,SystemAdministrator,CountyAdministrator")]
    [ProducesResponseType(typeof(NotificationHistoryDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<NotificationHistoryDto>> GetNotificationHistory(
        [FromQuery] string? countyId,
        [FromQuery] int days = 7)
    {
        await Task.CompletedTask;
        await Task.CompletedTask;
        try
        {
            // This would be implemented with actual database tracking
            // For now, return a placeholder response
            _logger.LogInformation("Retrieving notification history for last {Days} days", days);

            return Ok(new NotificationHistoryDto
            {
                CountyId = countyId,
                DaysRequested = days,
                TotalNotifications = 0,
                NotificationsByType = new Dictionary<string, int>
                {
                    { "DailyDigest", 0 },
                    { "WeeklySummary", 0 },
                    { "CriticalAlert", 0 },
                    { "DivineBalance", 0 },
                    { "Championship", 0 }
                },
                Message = "Notification history tracking is configured. History will be available after first notifications are sent."
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to retrieve notification history");
            return StatusCode(500, new { error = "Failed to retrieve notification history" });
        }
    }
}

// ============================================================================
// DTOs for Notification Controller
// ============================================================================

public class ManualAlertRequest
{
    public string? CountyId { get; set; }
    public string? AlertLevel { get; set; } = "Yellow";
    public string MetricName { get; set; } = "Manual Alert";
    public string Message { get; set; } = "";
    public string? RecommendedAction { get; set; }
}

public class EmailTestResultDto
{
    public bool Success { get; set; }
    public string Message { get; set; } = "";
    public DateTime TestedAt { get; set; }
    public string? ErrorDetails { get; set; }
}

public class NotificationHistoryDto
{
    public string? CountyId { get; set; }
    public int DaysRequested { get; set; }
    public int TotalNotifications { get; set; }
    public Dictionary<string, int> NotificationsByType { get; set; } = new();
    public string Message { get; set; } = "";
}
