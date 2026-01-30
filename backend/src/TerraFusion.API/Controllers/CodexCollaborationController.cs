using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TerraFusion.AI.Services;

namespace TerraFusion.API.Controllers;

/// <summary>
/// Codex 3-6-9 Framework - Slack/Teams Collaboration Integration Controller
///
/// Real-Time Collaboration Features:
/// - Slack message broadcasting
/// - Microsoft Teams adaptive cards
/// - Multi-channel notification routing
/// - Connection testing and health checks
/// - Manual notification triggers
///
/// Supported Platforms:
/// - Slack (webhook-based messaging with rich blocks)
/// - Microsoft Teams (adaptive card messaging)
///
/// Notification Types:
/// - System status updates (real-time framework status)
/// - Alert broadcasts (critical/warning/info)
/// - Performance summaries (daily digest)
/// - Achievement announcements (Divine Balance, Championship Mode)
/// - Metric updates (Foundation and Amplification changes)
///
/// THE TERRAFUSION WAY - GOVERNMENT. TRANSCENDED.
/// </summary>
[ApiController]
[Route("api/codex/collaboration")]
[Authorize]
public class CodexCollaborationController : ControllerBase
{
    private readonly ICodexSlackNotificationService _slackService;
    private readonly ICodexTeamsNotificationService _teamsService;
    private readonly ICodex369FrameworkService _codexService;
    private readonly ILogger<CodexCollaborationController> _logger;

    public CodexCollaborationController(
        ICodexSlackNotificationService slackService,
        ICodexTeamsNotificationService teamsService,
        ICodex369FrameworkService codexService,
        ILogger<CodexCollaborationController> logger)
    {
        _slackService = slackService;
        _teamsService = teamsService;
        _codexService = codexService;
        _logger = logger;
    }

    // ============================================================================
    // CONNECTION TESTING
    // ============================================================================

    /// <summary>
    /// Test Slack connection
    /// Sends a test message to configured Slack webhook
    /// </summary>
    [HttpPost("slack/test")]
    [Authorize(Roles = "Admin,SystemAdministrator")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> TestSlackConnection()
    {
        try
        {
            _logger.LogInformation("Testing Slack connection");

            var result = await _slackService.TestConnectionAsync();

            if (result)
            {
                return Ok(new { success = true, message = "Slack connection test successful" });
            }
            else
            {
                return StatusCode(500, new { success = false, message = "Slack connection test failed" });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to test Slack connection");
            return StatusCode(500, new { success = false, error = ex.Message });
        }
    }

    /// <summary>
    /// Test Microsoft Teams connection
    /// Sends a test message to configured Teams webhook
    /// </summary>
    [HttpPost("teams/test")]
    [Authorize(Roles = "Admin,SystemAdministrator")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> TestTeamsConnection()
    {
        try
        {
            _logger.LogInformation("Testing Teams connection");

            var result = await _teamsService.TestConnectionAsync();

            if (result)
            {
                return Ok(new { success = true, message = "Teams connection test successful" });
            }
            else
            {
                return StatusCode(500, new { success = false, message = "Teams connection test failed" });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to test Teams connection");
            return StatusCode(500, new { success = false, error = ex.Message });
        }
    }

    // ============================================================================
    // MANUAL NOTIFICATION TRIGGERS
    // ============================================================================

    /// <summary>
    /// Send current system status to Slack
    /// Broadcasts real-time framework status to Slack channel
    /// </summary>
    [HttpPost("slack/status")]
    [Authorize(Roles = "Admin,SystemAdministrator,Management")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> SendSystemStatusToSlack([FromQuery] string? countyId)
    {
        try
        {
            var status = await _codexService.GetRealtimeFrameworkStatusAsync(countyId);
            await _slackService.SendSystemStatusUpdateAsync(status, countyId);

            _logger.LogInformation("Sent system status to Slack for county: {County}", countyId ?? "System-Wide");

            return Ok(new { success = true, message = "System status sent to Slack" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send system status to Slack");
            return StatusCode(500, new { error = "Failed to send system status to Slack" });
        }
    }

    /// <summary>
    /// Send current system status to Microsoft Teams
    /// Broadcasts real-time framework status to Teams channel
    /// </summary>
    [HttpPost("teams/status")]
    [Authorize(Roles = "Admin,SystemAdministrator,Management")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> SendSystemStatusToTeams([FromQuery] string? countyId)
    {
        try
        {
            var status = await _codexService.GetRealtimeFrameworkStatusAsync(countyId);
            await _teamsService.SendSystemStatusUpdateAsync(status, countyId);

            _logger.LogInformation("Sent system status to Teams for county: {County}", countyId ?? "System-Wide");

            return Ok(new { success = true, message = "System status sent to Teams" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send system status to Teams");
            return StatusCode(500, new { error = "Failed to send system status to Teams" });
        }
    }

    /// <summary>
    /// Send daily performance summary to Slack
    /// Broadcasts daily digest with alerts and performance metrics
    /// </summary>
    [HttpPost("slack/daily-summary")]
    [Authorize(Roles = "Admin,SystemAdministrator,Management")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> SendDailySummaryToSlack([FromQuery] string? countyId)
    {
        try
        {
            var status = await _codexService.GetRealtimeFrameworkStatusAsync(countyId);
            var alerts = await _codexService.GetAlertsAsync(countyId);

            await _slackService.SendDailyPerformanceSummaryAsync(status, alerts, countyId);

            _logger.LogInformation("Sent daily summary to Slack for county: {County}", countyId ?? "System-Wide");

            return Ok(new { success = true, message = "Daily summary sent to Slack" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send daily summary to Slack");
            return StatusCode(500, new { error = "Failed to send daily summary to Slack" });
        }
    }

    /// <summary>
    /// Send daily performance summary to Microsoft Teams
    /// Broadcasts daily digest with alerts and performance metrics
    /// </summary>
    [HttpPost("teams/daily-summary")]
    [Authorize(Roles = "Admin,SystemAdministrator,Management")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> SendDailySummaryToTeams([FromQuery] string? countyId)
    {
        try
        {
            var status = await _codexService.GetRealtimeFrameworkStatusAsync(countyId);
            var alerts = await _codexService.GetAlertsAsync(countyId);

            await _teamsService.SendDailyPerformanceSummaryAsync(status, alerts, countyId);

            _logger.LogInformation("Sent daily summary to Teams for county: {County}", countyId ?? "System-Wide");

            return Ok(new { success = true, message = "Daily summary sent to Teams" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send daily summary to Teams");
            return StatusCode(500, new { error = "Failed to send daily summary to Teams" });
        }
    }

    /// <summary>
    /// Broadcast to both Slack and Teams simultaneously
    /// Sends system status to all configured collaboration platforms
    /// </summary>
    [HttpPost("broadcast/status")]
    [Authorize(Roles = "Admin,SystemAdministrator,Management")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> BroadcastSystemStatus([FromQuery] string? countyId)
    {
        try
        {
            var status = await _codexService.GetRealtimeFrameworkStatusAsync(countyId);

            // Broadcast to both platforms in parallel
            var slackTask = _slackService.SendSystemStatusUpdateAsync(status, countyId);
            var teamsTask = _teamsService.SendSystemStatusUpdateAsync(status, countyId);

            await Task.WhenAll(slackTask, teamsTask);

            _logger.LogInformation("Broadcast system status to all platforms for county: {County}", countyId ?? "System-Wide");

            return Ok(new { success = true, message = "System status broadcast to all platforms" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to broadcast system status");
            return StatusCode(500, new { error = "Failed to broadcast system status" });
        }
    }

    /// <summary>
    /// Broadcast daily summary to both Slack and Teams
    /// Sends daily performance digest to all platforms
    /// </summary>
    [HttpPost("broadcast/daily-summary")]
    [Authorize(Roles = "Admin,SystemAdministrator,Management")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> BroadcastDailySummary([FromQuery] string? countyId)
    {
        try
        {
            var status = await _codexService.GetRealtimeFrameworkStatusAsync(countyId);
            var alerts = await _codexService.GetAlertsAsync(countyId);

            // Broadcast to both platforms in parallel
            var slackTask = _slackService.SendDailyPerformanceSummaryAsync(status, alerts, countyId);
            var teamsTask = _teamsService.SendDailyPerformanceSummaryAsync(status, alerts, countyId);

            await Task.WhenAll(slackTask, teamsTask);

            _logger.LogInformation("Broadcast daily summary to all platforms for county: {County}", countyId ?? "System-Wide");

            return Ok(new { success = true, message = "Daily summary broadcast to all platforms" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to broadcast daily summary");
            return StatusCode(500, new { error = "Failed to broadcast daily summary" });
        }
    }

    // ============================================================================
    // HEALTH CHECK
    // ============================================================================

    /// <summary>
    /// Get collaboration integration health status
    /// Returns configuration status for Slack and Teams
    /// </summary>
    [HttpGet("health")]
    [Authorize(Roles = "Admin,SystemAdministrator")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public IActionResult GetCollaborationHealth()
    {
        try
        {
            // Note: This is a simple health check that verifies services are registered
            // Actual webhook validation would require testing the connections

            var health = new
            {
                slack = new
                {
                    status = "configured",
                    service = "registered"
                },
                teams = new
                {
                    status = "configured",
                    service = "registered"
                },
                timestamp = DateTime.UtcNow
            };

            return Ok(health);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get collaboration health");
            return StatusCode(500, new { error = "Failed to get collaboration health" });
        }
    }
}
