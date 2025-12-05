using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Logging;
using TerraFusion.AI.Services;
using TerraFusion.Abstractions.Interfaces;

namespace TerraFusion.AI.Controllers;

/// <summary>
/// 🚀 Enterprise AI Agent Coordination API Controller
/// Provides REST endpoints for managing 50,000+ AI agents across Washington State counties
/// Military-grade command and control interface
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class EnterpriseAgentController : ControllerBase
{
    private readonly IEnterpriseAIAgentCoordinator _coordinator;
    private readonly IAuditLogger _auditLogger;
    private readonly ILogger<EnterpriseAgentController> _logger;

    public EnterpriseAgentController(
        IEnterpriseAIAgentCoordinator coordinator,
        IAuditLogger auditLogger,
        ILogger<EnterpriseAgentController> logger)
    {
        _coordinator = coordinator;
        _auditLogger = auditLogger;
        _logger = logger;
    }

    /// <summary>
    /// Register a new AI agent team in the enterprise coordination system
    /// </summary>
    [HttpPost("register-team")]
    public async Task<ActionResult<AgentRegistrationResult>> RegisterAgentTeam([FromBody] AIAgentTeam team)
    {
        try
        {
            _logger.LogInformation("🎯 Registering AI agent team: {TeamName}", team.TeamName);

            var result = await _coordinator.RegisterAgentTeamAsync(team);

            if (result.Success)
            {
                await _auditLogger.LogAsync("Enterprise Agent Team Registration",
                    $"Successfully registered team: {team.TeamName} ({team.TeamId})", true);
                return Ok(result);
            }
            else
            {
                await _auditLogger.LogAsync("Enterprise Agent Team Registration Failed",
                    $"Failed to register team: {team.TeamName} - {result.ErrorMessage}", false);
                return BadRequest(result);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error registering agent team: {TeamName}", team.TeamName);
            return StatusCode(500, new { error = "Internal server error during team registration" });
        }
    }

    /// <summary>
    /// Get all active AI agent teams
    /// </summary>
    [HttpGet("active-teams")]
    public async Task<ActionResult<List<AIAgentTeam>>> GetActiveAgentTeams()
    {
        try
        {
            var teams = await _coordinator.GetActiveAgentTeamsAsync();

            _logger.LogInformation("📊 Retrieved {TeamCount} active agent teams", teams.Count);

            return Ok(teams);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error retrieving active agent teams");
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    /// <summary>
    /// Get comprehensive coordination status across all agent teams
    /// </summary>
    [HttpGet("coordination-status")]
    public async Task<ActionResult<EnterpriseAgentCoordinationStatus>> GetCoordinationStatus()
    {
        try
        {
            var status = await _coordinator.GetCoordinationStatusAsync();

            _logger.LogInformation("📈 System coordination status: {TotalAgents} agents across {CountiesCovered} counties",
                status.TotalAgents, status.CountiesCovered);

            return Ok(status);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error retrieving coordination status");
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    /// <summary>
    /// Execute a coordinated command across multiple agent teams
    /// </summary>
    [HttpPost("execute-command")]
    public async Task<ActionResult<CoordinatedCommandResult>> ExecuteCoordinatedCommand(
        [FromBody] CoordinatedCommandRequest request)
    {
        try
        {
            _logger.LogInformation("⚡ Executing coordinated command: {Command} for {TeamCount} teams",
                request.Command, request.TargetTeams.Length);

            var success = await _coordinator.ExecuteCoordinatedCommandAsync(request.Command, request.TargetTeams);

            var result = new CoordinatedCommandResult
            {
                Success = success,
                Command = request.Command,
                TargetTeams = request.TargetTeams,
                ExecutedAt = DateTime.UtcNow,
                Message = success ? "Command executed successfully across all target teams" :
                                  "Command execution failed on one or more target teams"
            };

            await _auditLogger.LogAsync("Coordinated Command Execution",
                $"Command: {request.Command}, Success: {success}", success);

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error executing coordinated command: {Command}", request.Command);
            return StatusCode(500, new { error = "Internal server error during command execution" });
        }
    }

    /// <summary>
    /// Generate comprehensive performance report for all agent teams
    /// </summary>
    [HttpGet("performance-report")]
    public async Task<ActionResult<AgentPerformanceReport>> GetPerformanceReport()
    {
        try
        {
            var report = await _coordinator.GeneratePerformanceReportAsync();

            _logger.LogInformation("📊 Generated performance report: {TotalAgents} agents, {SuccessRate:F2}% avg success rate",
                report.TotalAgents, report.AverageSuccessRate);

            return Ok(report);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error generating performance report");
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    /// <summary>
    /// Get agent teams assigned to a specific Washington State county
    /// </summary>
    [HttpGet("county/{countyName}/teams")]
    public async Task<ActionResult<List<AIAgentTeam>>> GetTeamsByCounty(string countyName)
    {
        try
        {
            var allTeams = await _coordinator.GetActiveAgentTeamsAsync();
            var countyTeams = allTeams.Where(t =>
                string.Equals(t.AssignedCounty, countyName, StringComparison.OrdinalIgnoreCase)).ToList();

            _logger.LogInformation("🏛️ Retrieved {TeamCount} teams for {County} County",
                countyTeams.Count, countyName);

            return Ok(countyTeams);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error retrieving teams for county: {County}", countyName);
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    /// <summary>
    /// Emergency shutdown command for specific agent teams
    /// </summary>
    [HttpPost("emergency-shutdown")]
    [Authorize(Roles = "SuperAdmin,EmergencyCoordinator")]
    public async Task<ActionResult<EmergencyShutdownResult>> EmergencyShutdown(
        [FromBody] EmergencyShutdownRequest request)
    {
        try
        {
            _logger.LogWarning("🚨 EMERGENCY SHUTDOWN initiated for teams: {Teams}",
                string.Join(", ", request.TeamIds));

            var success = await _coordinator.ExecuteCoordinatedCommandAsync("EMERGENCY_SHUTDOWN", request.TeamIds);

            var result = new EmergencyShutdownResult
            {
                Success = success,
                ShutdownTime = DateTime.UtcNow,
                AffectedTeams = request.TeamIds,
                Reason = request.Reason,
                InitiatedBy = User.Identity?.Name ?? "Unknown"
            };

            await _auditLogger.LogAsync("Emergency Agent Shutdown",
                $"Reason: {request.Reason}, Teams: {request.TeamIds.Length}, Initiated by: {result.InitiatedBy}",
                success);

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error during emergency shutdown");
            return StatusCode(500, new { error = "Internal server error during emergency shutdown" });
        }
    }

    /// <summary>
    /// Health check endpoint for the coordination system
    /// </summary>
    [HttpGet("health")]
    [AllowAnonymous]
    public async Task<ActionResult<AgentCoordinationHealth>> GetHealth()
    {
        try
        {
            var status = await _coordinator.GetCoordinationStatusAsync();

            var health = new AgentCoordinationHealth
            {
                IsHealthy = status.SystemHealth > 90.0,
                SystemHealth = status.SystemHealth,
                TotalAgents = status.TotalAgents,
                ActiveTeams = status.ActiveAgentTeams,
                LastCheck = DateTime.UtcNow,
                Status = status.SystemHealth > 95.0 ? "Excellent" :
                        status.SystemHealth > 90.0 ? "Good" :
                        status.SystemHealth > 75.0 ? "Warning" : "Critical"
            };

            return Ok(health);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error checking coordination health");
            return StatusCode(500, new { error = "Health check failed" });
        }
    }
}

// Supporting DTOs for API endpoints
public class CoordinatedCommandRequest
{
    public required string Command { get; set; }
    public required string[] TargetTeams { get; set; }
    public string? Parameters { get; set; }
    public int TimeoutSeconds { get; set; } = 30;
}

public class CoordinatedCommandResult
{
    public required bool Success { get; set; }
    public required string Command { get; set; }
    public required string[] TargetTeams { get; set; }
    public required DateTime ExecutedAt { get; set; }
    public required string Message { get; set; }
}

public class EmergencyShutdownRequest
{
    public required string[] TeamIds { get; set; }
    public required string Reason { get; set; }
    public bool ForceShutdown { get; set; } = false;
}

public class EmergencyShutdownResult
{
    public required bool Success { get; set; }
    public required DateTime ShutdownTime { get; set; }
    public required string[] AffectedTeams { get; set; }
    public required string Reason { get; set; }
    public required string InitiatedBy { get; set; }
}

public class AgentCoordinationHealth
{
    public required bool IsHealthy { get; set; }
    public required double SystemHealth { get; set; }
    public required int TotalAgents { get; set; }
    public required int ActiveTeams { get; set; }
    public required DateTime LastCheck { get; set; }
    public required string Status { get; set; }
}
