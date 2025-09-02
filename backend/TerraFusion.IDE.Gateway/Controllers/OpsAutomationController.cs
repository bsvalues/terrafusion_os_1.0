using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System.Diagnostics;
using System.Text.Json;
using TerraFusion.Core.Services;
using TerraFusion.Core.Security;
using TerraFusion.Core.Audit;

namespace TerraFusion.IDE.Gateway.Controllers
{
    /// <summary>
    /// Operations Automation Controller - 45-Tool Suite Integration
    /// Provides secure execution of TerraFusion operational tools
    /// Classification: FOR OFFICIAL USE ONLY
    /// </summary>
    [Authorize(Roles = "GovernmentUser,SystemAdministrator,DevOpsEngineer")]
    [ApiController]
    [Route("api/ops")]
    [Produces("application/json")]
    public class OpsAutomationController : ControllerBase
    {
        private readonly ILogger<OpsAutomationController> _logger;
        private readonly IAuditService _auditService;
        private readonly ISecurityService _securityService;
        private readonly IOpsToolExecutor _opsToolExecutor;
        private readonly IOpsToolRegistry _opsToolRegistry;

        // Ops tools base directory
        private const string OpsToolsBasePath = "/mnt/c/Users/bsval/terrafusion_os_1.0/terrafusion-ops-tools";

        public OpsAutomationController(
            ILogger<OpsAutomationController> logger,
            IAuditService auditService,
            ISecurityService securityService,
            IOpsToolExecutor opsToolExecutor,
            IOpsToolRegistry opsToolRegistry)
        {
            _logger = logger;
            _auditService = auditService;
            _securityService = securityService;
            _opsToolExecutor = opsToolExecutor;
            _opsToolRegistry = opsToolRegistry;
        }

        /// <summary>
        /// Get all available ops tools
        /// </summary>
        [HttpGet("tools")]
        [ProducesResponseType(typeof(OpsToolsResponse), 200)]
        public async Task<ActionResult<OpsToolsResponse>> GetAvailableTools()
        {
            var auditContext = await _auditService.StartAuditAsync(new AuditRequest
            {
                Controller = nameof(OpsAutomationController),
                Action = nameof(GetAvailableTools),
                UserId = User.Identity?.Name ?? "Anonymous",
                Timestamp = DateTime.UtcNow
            });

            try
            {
                var tools = await _opsToolRegistry.GetAllToolsAsync();
                
                await _auditService.LogSuccessAsync(auditContext, new AuditSuccess
                {
                    Operation = "GET_OPS_TOOLS",
                    ResultCount = tools.Count()
                });

                return Ok(new OpsToolsResponse
                {
                    Tools = tools,
                    TotalCount = tools.Count(),
                    Categories = tools.GroupBy(t => t.Category).ToDictionary(g => g.Key, g => g.Count()),
                    Timestamp = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to retrieve ops tools");
                await _auditService.LogErrorAsync(auditContext, new AuditError
                {
                    Exception = ex,
                    Operation = "GET_OPS_TOOLS"
                });
                return StatusCode(500, "Failed to retrieve ops tools");
            }
        }

        /// <summary>
        /// Execute an ops automation tool
        /// </summary>
        [HttpPost("execute")]
        [ProducesResponseType(typeof(OpsExecutionResult), 200)]
        [ProducesResponseType(typeof(ErrorResponse), 400)]
        [ProducesResponseType(typeof(ErrorResponse), 403)]
        [ProducesResponseType(typeof(ErrorResponse), 500)]
        public async Task<ActionResult<OpsExecutionResult>> ExecuteTool([FromBody] OpsExecutionRequest request)
        {
            var auditContext = await _auditService.StartAuditAsync(new AuditRequest
            {
                Controller = nameof(OpsAutomationController),
                Action = nameof(ExecuteTool),
                UserId = User.Identity?.Name ?? "Anonymous",
                ResourceId = request.ToolId,
                Timestamp = DateTime.UtcNow,
                RequestId = HttpContext.TraceIdentifier
            });

            try
            {
                // Validate security permissions
                var securityResult = await _securityService.ValidateOpsToolAccessAsync(new OpsSecurityRequest
                {
                    UserId = User.Identity?.Name,
                    ToolId = request.ToolId,
                    RiskLevel = request.RiskLevel,
                    RequiredPermissions = request.RequiredPermissions ?? new List<string>(),
                    Command = request.Command
                });

                if (!securityResult.IsAuthorized)
                {
                    _logger.LogWarning("Unauthorized ops tool execution attempt: {ToolId} by user {UserId}",
                        request.ToolId, User.Identity?.Name);
                    
                    await _auditService.LogSecurityViolationAsync(auditContext, new SecurityViolation
                    {
                        ViolationType = "UNAUTHORIZED_OPS_TOOL_ACCESS",
                        UserId = User.Identity?.Name,
                        ResourceId = request.ToolId,
                        AttemptedAction = "EXECUTE_OPS_TOOL"
                    });

                    return Forbid("Insufficient permissions for ops tool execution");
                }

                // Get tool definition
                var tool = await _opsToolRegistry.GetToolAsync(request.ToolId);
                if (tool == null)
                {
                    return BadRequest($"Ops tool '{request.ToolId}' not found");
                }

                // Execute the tool with proper security context
                _logger.LogInformation("Executing ops tool: {ToolId} for user {UserId} with risk level {RiskLevel}",
                    request.ToolId, User.Identity?.Name, request.RiskLevel);

                var executionResult = await _opsToolExecutor.ExecuteToolAsync(new OpsToolExecution
                {
                    Tool = tool,
                    Parameters = request.Parameters ?? new Dictionary<string, object>(),
                    UserId = User.Identity?.Name,
                    ExecutionContext = new OpsExecutionContext
                    {
                        WorkingDirectory = Path.Combine(OpsToolsBasePath, GetToolDirectory(tool.Category)),
                        Environment = GetEnvironmentVariables(),
                        Timeout = GetToolTimeout(request.RiskLevel),
                        AuditEnabled = true,
                        SecureExecution = request.RiskLevel == "high" || request.RiskLevel == "critical"
                    }
                });

                // Log successful execution
                await _auditService.LogSuccessAsync(auditContext, new AuditSuccess
                {
                    Operation = "EXECUTE_OPS_TOOL",
                    ResourceId = request.ToolId,
                    ExecutionTime = executionResult.ExecutionTime,
                    ResultSize = executionResult.Output?.Length ?? 0
                });

                _logger.LogInformation("Successfully executed ops tool: {ToolId} in {ExecutionTime}ms",
                    request.ToolId, executionResult.ExecutionTime);

                return Ok(new OpsExecutionResult
                {
                    Success = executionResult.Success,
                    ToolId = request.ToolId,
                    ExecutionTime = executionResult.ExecutionTime,
                    Output = executionResult.Output,
                    ErrorOutput = executionResult.ErrorOutput,
                    ExitCode = executionResult.ExitCode,
                    AuditId = auditContext.Id,
                    Timestamp = DateTime.UtcNow,
                    Metadata = new Dictionary<string, object>
                    {
                        ["command"] = request.Command,
                        ["riskLevel"] = request.RiskLevel,
                        ["workingDirectory"] = Path.Combine(OpsToolsBasePath, GetToolDirectory(tool.Category)),
                        ["userId"] = User.Identity?.Name,
                        ["parameters"] = request.Parameters ?? new Dictionary<string, object>()
                    }
                });
            }
            catch (SecurityException secEx)
            {
                _logger.LogError(secEx, "Security violation during ops tool execution: {ToolId}", request.ToolId);
                await _auditService.LogSecurityErrorAsync(auditContext, secEx);
                return StatusCode(403, "Security validation failed");
            }
            catch (InvalidOperationException opEx)
            {
                _logger.LogError(opEx, "Invalid operation during ops tool execution: {ToolId}", request.ToolId);
                await _auditService.LogErrorAsync(auditContext, new AuditError
                {
                    Exception = opEx,
                    Operation = "EXECUTE_OPS_TOOL",
                    ResourceId = request.ToolId
                });
                return BadRequest($"Tool execution failed: {opEx.Message}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error executing ops tool: {ToolId}", request.ToolId);
                await _auditService.LogErrorAsync(auditContext, new AuditError
                {
                    Exception = ex,
                    Operation = "EXECUTE_OPS_TOOL",
                    ResourceId = request.ToolId,
                    UserId = User.Identity?.Name
                });
                return StatusCode(500, "An internal error occurred during tool execution");
            }
        }

        /// <summary>
        /// Get execution status of running tools
        /// </summary>
        [HttpGet("status")]
        [ProducesResponseType(typeof(OpsStatusResponse), 200)]
        public async Task<ActionResult<OpsStatusResponse>> GetExecutionStatus()
        {
            try
            {
                var runningTools = await _opsToolExecutor.GetRunningToolsAsync();
                var recentExecutions = await _opsToolExecutor.GetRecentExecutionsAsync(User.Identity?.Name, 50);

                return Ok(new OpsStatusResponse
                {
                    RunningTools = runningTools,
                    RecentExecutions = recentExecutions,
                    SystemLoad = await _opsToolExecutor.GetSystemLoadAsync(),
                    Timestamp = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get ops execution status");
                return StatusCode(500, "Failed to retrieve execution status");
            }
        }

        /// <summary>
        /// Schedule an ops tool for automated execution
        /// </summary>
        [HttpPost("schedule")]
        [ProducesResponseType(typeof(ScheduleResponse), 200)]
        [ProducesResponseType(typeof(ErrorResponse), 400)]
        public async Task<ActionResult<ScheduleResponse>> ScheduleTool([FromBody] ScheduleToolRequest request)
        {
            var auditContext = await _auditService.StartAuditAsync(new AuditRequest
            {
                Controller = nameof(OpsAutomationController),
                Action = nameof(ScheduleTool),
                UserId = User.Identity?.Name ?? "Anonymous",
                ResourceId = request.ToolId,
                Timestamp = DateTime.UtcNow
            });

            try
            {
                var scheduleResult = await _opsToolExecutor.ScheduleToolAsync(new OpsToolSchedule
                {
                    ToolId = request.ToolId,
                    CronExpression = request.Schedule,
                    Parameters = request.Parameters ?? new Dictionary<string, object>(),
                    UserId = User.Identity?.Name,
                    Enabled = true,
                    CreatedAt = DateTime.UtcNow
                });

                await _auditService.LogSuccessAsync(auditContext, new AuditSuccess
                {
                    Operation = "SCHEDULE_OPS_TOOL",
                    ResourceId = request.ToolId,
                    Metadata = new Dictionary<string, object>
                    {
                        ["schedule"] = request.Schedule,
                        ["scheduleId"] = scheduleResult.ScheduleId
                    }
                });

                return Ok(new ScheduleResponse
                {
                    Success = true,
                    ScheduleId = scheduleResult.ScheduleId,
                    ToolId = request.ToolId,
                    NextExecution = scheduleResult.NextExecution,
                    Message = "Tool scheduled successfully"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to schedule ops tool: {ToolId}", request.ToolId);
                await _auditService.LogErrorAsync(auditContext, new AuditError
                {
                    Exception = ex,
                    Operation = "SCHEDULE_OPS_TOOL",
                    ResourceId = request.ToolId
                });
                return BadRequest($"Failed to schedule tool: {ex.Message}");
            }
        }

        /// <summary>
        /// Health check for ops automation system
        /// </summary>
        [HttpGet("health")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(OpsHealthResponse), 200)]
        public async Task<ActionResult<OpsHealthResponse>> HealthCheck()
        {
            try
            {
                var systemHealth = await _opsToolExecutor.GetSystemHealthAsync();
                var opsToolsAvailable = Directory.Exists(OpsToolsBasePath);

                return Ok(new OpsHealthResponse
                {
                    Status = systemHealth.IsHealthy && opsToolsAvailable ? "Operational" : "Degraded",
                    OpsToolsAvailable = opsToolsAvailable,
                    SystemLoad = systemHealth.SystemLoad,
                    RunningTools = systemHealth.RunningToolsCount,
                    Timestamp = DateTime.UtcNow,
                    Version = "1.0.0",
                    Components = new Dictionary<string, string>
                    {
                        ["OpsToolsDirectory"] = opsToolsAvailable ? "Available" : "Missing",
                        ["ToolExecutor"] = systemHealth.IsHealthy ? "Operational" : "Error",
                        ["AuditService"] = "Operational",
                        ["SecurityService"] = "Operational"
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ops automation health check failed");
                return Ok(new OpsHealthResponse
                {
                    Status = "Error",
                    Timestamp = DateTime.UtcNow,
                    Error = ex.Message
                });
            }
        }

        #region Helper Methods

        private static string GetToolDirectory(string category) => category switch
        {
            "core-infrastructure" => "scripts",
            "security-compliance" => "scripts",
            "monitoring-observability" => "monitoring",
            "deployment-cicd" => "ci-cd",
            "data-management" => "scripts/migration",
            "operations" => "scripts",
            "advanced-infrastructure" => "advanced",
            "next-gen-operations" => "advanced",
            "ultra-advanced" => "advanced",
            _ => "scripts"
        };

        private static Dictionary<string, string> GetEnvironmentVariables() => new()
        {
            ["TERRAFUSION_ENV"] = "production",
            ["TERRAFUSION_OPS_MODE"] = "government",
            ["TERRAFUSION_AUDIT_ENABLED"] = "true",
            ["TERRAFUSION_SECURITY_LEVEL"] = "high",
            ["PATH"] = $"{Environment.GetEnvironmentVariable("PATH")}:{OpsToolsBasePath}/scripts"
        };

        private static TimeSpan GetToolTimeout(string riskLevel) => riskLevel switch
        {
            "low" => TimeSpan.FromMinutes(5),
            "medium" => TimeSpan.FromMinutes(15),
            "high" => TimeSpan.FromMinutes(30),
            "critical" => TimeSpan.FromHours(1),
            _ => TimeSpan.FromMinutes(10)
        };

        #endregion
    }

    #region Data Models

    public class OpsExecutionRequest
    {
        public string ToolId { get; set; } = string.Empty;
        public string Command { get; set; } = string.Empty;
        public Dictionary<string, object>? Parameters { get; set; }
        public string RiskLevel { get; set; } = "medium";
        public List<string>? RequiredPermissions { get; set; }
    }

    public class OpsExecutionResult
    {
        public bool Success { get; set; }
        public string ToolId { get; set; } = string.Empty;
        public long ExecutionTime { get; set; }
        public string? Output { get; set; }
        public string? ErrorOutput { get; set; }
        public int ExitCode { get; set; }
        public string AuditId { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
        public Dictionary<string, object>? Metadata { get; set; }
    }

    public class ScheduleToolRequest
    {
        public string ToolId { get; set; } = string.Empty;
        public string Schedule { get; set; } = string.Empty; // Cron expression
        public Dictionary<string, object>? Parameters { get; set; }
    }

    public class ScheduleResponse
    {
        public bool Success { get; set; }
        public string ScheduleId { get; set; } = string.Empty;
        public string ToolId { get; set; } = string.Empty;
        public DateTime? NextExecution { get; set; }
        public string Message { get; set; } = string.Empty;
    }

    public class OpsToolsResponse
    {
        public IEnumerable<OpsTool> Tools { get; set; } = Array.Empty<OpsTool>();
        public int TotalCount { get; set; }
        public Dictionary<string, int> Categories { get; set; } = new();
        public DateTime Timestamp { get; set; }
    }

    public class OpsStatusResponse
    {
        public IEnumerable<RunningTool> RunningTools { get; set; } = Array.Empty<RunningTool>();
        public IEnumerable<RecentExecution> RecentExecutions { get; set; } = Array.Empty<RecentExecution>();
        public SystemLoad SystemLoad { get; set; } = new();
        public DateTime Timestamp { get; set; }
    }

    public class OpsHealthResponse
    {
        public string Status { get; set; } = string.Empty;
        public bool OpsToolsAvailable { get; set; }
        public SystemLoad? SystemLoad { get; set; }
        public int RunningTools { get; set; }
        public DateTime Timestamp { get; set; }
        public string Version { get; set; } = string.Empty;
        public Dictionary<string, string>? Components { get; set; }
        public string? Error { get; set; }
    }

    public class OpsTool
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string Command { get; set; } = string.Empty;
        public string AutomationLevel { get; set; } = string.Empty;
        public string RiskLevel { get; set; } = string.Empty;
        public List<string>? RequiredPermissions { get; set; }
        public List<OpsParameter>? Parameters { get; set; }
    }

    public class OpsParameter
    {
        public string Name { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public bool Required { get; set; }
        public string Description { get; set; } = string.Empty;
        public object? DefaultValue { get; set; }
        public List<string>? Options { get; set; }
    }

    public class RunningTool
    {
        public string ToolId { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public DateTime StartTime { get; set; }
        public TimeSpan ElapsedTime { get; set; }
        public string Status { get; set; } = string.Empty;
    }

    public class RecentExecution
    {
        public string ToolId { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public DateTime ExecutionTime { get; set; }
        public long Duration { get; set; }
        public bool Success { get; set; }
        public string? Error { get; set; }
    }

    public class SystemLoad
    {
        public double CpuUsage { get; set; }
        public double MemoryUsage { get; set; }
        public double DiskUsage { get; set; }
        public int RunningProcesses { get; set; }
        public bool IsHealthy => CpuUsage < 80 && MemoryUsage < 85 && DiskUsage < 90;
    }

    #endregion
}