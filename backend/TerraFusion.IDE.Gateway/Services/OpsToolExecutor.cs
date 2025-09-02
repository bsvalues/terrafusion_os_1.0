using System.Diagnostics;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using TerraFusion.Core.Services;
using TerraFusion.Core.Audit;

namespace TerraFusion.IDE.Gateway.Services
{
    /// <summary>
    /// TerraFusion Operations Tool Executor
    /// Secure execution engine for 45-tool automation suite
    /// Classification: FOR OFFICIAL USE ONLY
    /// </summary>
    public interface IOpsToolExecutor
    {
        Task<OpsExecutionResult> ExecuteToolAsync(OpsToolExecution execution);
        Task<IEnumerable<RunningTool>> GetRunningToolsAsync();
        Task<IEnumerable<RecentExecution>> GetRecentExecutionsAsync(string? userId = null, int limit = 50);
        Task<SystemHealthInfo> GetSystemHealthAsync();
        Task<SystemLoad> GetSystemLoadAsync();
        Task<OpsScheduleResult> ScheduleToolAsync(OpsToolSchedule schedule);
    }

    public class OpsToolExecutor : IOpsToolExecutor
    {
        private readonly ILogger<OpsToolExecutor> _logger;
        private readonly IAuditService _auditService;
        private readonly Dictionary<string, Process> _runningTools = new();
        private readonly List<RecentExecution> _recentExecutions = new();
        private readonly Dictionary<string, OpsToolSchedule> _scheduledTools = new();
        private readonly object _lockObject = new object();

        public OpsToolExecutor(ILogger<OpsToolExecutor> logger, IAuditService auditService)
        {
            _logger = logger;
            _auditService = auditService;
        }

        public async Task<OpsExecutionResult> ExecuteToolAsync(OpsToolExecution execution)
        {
            var executionId = Guid.NewGuid().ToString();
            var startTime = DateTime.UtcNow;

            _logger.LogInformation("Starting ops tool execution: {ToolId} with execution ID: {ExecutionId}",
                execution.Tool.Id, executionId);

            try
            {
                // Prepare execution environment
                var processInfo = PrepareProcessInfo(execution);
                var process = new Process { StartInfo = processInfo };

                // Setup output capture
                var outputBuilder = new StringBuilder();
                var errorBuilder = new StringBuilder();

                process.OutputDataReceived += (sender, args) =>
                {
                    if (!string.IsNullOrEmpty(args.Data))
                    {
                        outputBuilder.AppendLine(args.Data);
                        _logger.LogDebug("Tool output [{ToolId}]: {Output}", execution.Tool.Id, args.Data);
                    }
                };

                process.ErrorDataReceived += (sender, args) =>
                {
                    if (!string.IsNullOrEmpty(args.Data))
                    {
                        errorBuilder.AppendLine(args.Data);
                        _logger.LogWarning("Tool error [{ToolId}]: {Error}", execution.Tool.Id, args.Data);
                    }
                };

                // Start process and track it
                lock (_lockObject)
                {
                    _runningTools[executionId] = process;
                }

                var stopwatch = Stopwatch.StartNew();
                process.Start();
                
                process.BeginOutputReadLine();
                process.BeginErrorReadLine();

                // Wait for completion with timeout
                var completed = await WaitForProcessAsync(process, execution.ExecutionContext.Timeout);
                stopwatch.Stop();

                // Remove from running tools
                lock (_lockObject)
                {
                    _runningTools.Remove(executionId);
                }

                var result = new OpsExecutionResult
                {
                    Success = completed && process.ExitCode == 0,
                    ToolId = execution.Tool.Id,
                    ExecutionId = executionId,
                    ExecutionTime = stopwatch.ElapsedMilliseconds,
                    Output = outputBuilder.ToString(),
                    ErrorOutput = errorBuilder.ToString(),
                    ExitCode = process.ExitCode,
                    StartTime = startTime,
                    EndTime = DateTime.UtcNow,
                    Timeout = !completed
                };

                // Record execution
                var recentExecution = new RecentExecution
                {
                    ToolId = execution.Tool.Id,
                    UserId = execution.UserId ?? "system",
                    ExecutionTime = startTime,
                    Duration = stopwatch.ElapsedMilliseconds,
                    Success = result.Success,
                    Error = result.Success ? null : (result.ErrorOutput ?? "Unknown error")
                };

                lock (_lockObject)
                {
                    _recentExecutions.Insert(0, recentExecution);
                    if (_recentExecutions.Count > 1000) // Keep last 1000 executions
                    {
                        _recentExecutions.RemoveRange(1000, _recentExecutions.Count - 1000);
                    }
                }

                // Audit log the execution
                if (execution.ExecutionContext.AuditEnabled)
                {
                    await AuditToolExecution(execution, result);
                }

                _logger.LogInformation("Completed ops tool execution: {ToolId} in {ExecutionTime}ms with success: {Success}",
                    execution.Tool.Id, result.ExecutionTime, result.Success);

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to execute ops tool: {ToolId}", execution.Tool.Id);

                lock (_lockObject)
                {
                    _runningTools.Remove(executionId);
                }

                return new OpsExecutionResult
                {
                    Success = false,
                    ToolId = execution.Tool.Id,
                    ExecutionId = executionId,
                    ExecutionTime = (long)(DateTime.UtcNow - startTime).TotalMilliseconds,
                    ErrorOutput = ex.Message,
                    ExitCode = -1,
                    StartTime = startTime,
                    EndTime = DateTime.UtcNow
                };
            }
        }

        public async Task<IEnumerable<RunningTool>> GetRunningToolsAsync()
        {
            await Task.CompletedTask; // Async for interface consistency
            
            lock (_lockObject)
            {
                return _runningTools.Select(kvp => new RunningTool
                {
                    ExecutionId = kvp.Key,
                    ToolId = "unknown", // Would need to track this separately
                    UserId = "unknown", // Would need to track this separately
                    StartTime = kvp.Value.StartTime,
                    ElapsedTime = DateTime.UtcNow - kvp.Value.StartTime,
                    Status = kvp.Value.HasExited ? "completed" : "running"
                }).ToList();
            }
        }

        public async Task<IEnumerable<RecentExecution>> GetRecentExecutionsAsync(string? userId = null, int limit = 50)
        {
            await Task.CompletedTask; // Async for interface consistency

            lock (_lockObject)
            {
                var executions = _recentExecutions.AsEnumerable();
                
                if (!string.IsNullOrEmpty(userId))
                {
                    executions = executions.Where(e => e.UserId == userId);
                }

                return executions.Take(limit).ToList();
            }
        }

        public async Task<SystemHealthInfo> GetSystemHealthAsync()
        {
            try
            {
                var systemLoad = await GetSystemLoadAsync();
                
                return new SystemHealthInfo
                {
                    IsHealthy = systemLoad.IsHealthy,
                    SystemLoad = systemLoad,
                    RunningToolsCount = _runningTools.Count,
                    TotalExecutions = _recentExecutions.Count,
                    LastHealthCheck = DateTime.UtcNow
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get system health");
                return new SystemHealthInfo
                {
                    IsHealthy = false,
                    SystemLoad = new SystemLoad(),
                    RunningToolsCount = _runningTools.Count,
                    TotalExecutions = _recentExecutions.Count,
                    LastHealthCheck = DateTime.UtcNow,
                    Error = ex.Message
                };
            }
        }

        public async Task<SystemLoad> GetSystemLoadAsync()
        {
            try
            {
                // Get system performance metrics
                var process = Process.GetCurrentProcess();
                var totalMemory = GC.GetTotalMemory(false);
                var workingSet = process.WorkingSet64;

                // Calculate CPU usage (simplified)
                var cpuUsage = await GetCpuUsageAsync();

                // Get disk usage for current directory
                var driveInfo = new DriveInfo(Directory.GetCurrentDirectory());
                var diskUsage = ((double)(driveInfo.TotalSize - driveInfo.AvailableFreeSpace) / driveInfo.TotalSize) * 100;

                return new SystemLoad
                {
                    CpuUsage = cpuUsage,
                    MemoryUsage = (double)totalMemory / (1024 * 1024 * 1024), // Convert to GB
                    DiskUsage = diskUsage,
                    RunningProcesses = Process.GetProcesses().Length
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get system load");
                return new SystemLoad
                {
                    CpuUsage = 0,
                    MemoryUsage = 0,
                    DiskUsage = 0,
                    RunningProcesses = 0
                };
            }
        }

        public async Task<OpsScheduleResult> ScheduleToolAsync(OpsToolSchedule schedule)
        {
            var scheduleId = Guid.NewGuid().ToString();
            
            try
            {
                // Store the schedule
                lock (_lockObject)
                {
                    _scheduledTools[scheduleId] = schedule with { ScheduleId = scheduleId };
                }

                // Calculate next execution time based on cron expression
                var nextExecution = CalculateNextExecution(schedule.CronExpression);

                _logger.LogInformation("Scheduled ops tool: {ToolId} with schedule: {Schedule}, next execution: {NextExecution}",
                    schedule.ToolId, schedule.CronExpression, nextExecution);

                return new OpsScheduleResult
                {
                    Success = true,
                    ScheduleId = scheduleId,
                    NextExecution = nextExecution
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to schedule ops tool: {ToolId}", schedule.ToolId);
                return new OpsScheduleResult
                {
                    Success = false,
                    Error = ex.Message
                };
            }
        }

        #region Private Methods

        private ProcessStartInfo PrepareProcessInfo(OpsToolExecution execution)
        {
            var processInfo = new ProcessStartInfo
            {
                WorkingDirectory = execution.ExecutionContext.WorkingDirectory,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };

            // Set environment variables
            foreach (var env in execution.ExecutionContext.Environment)
            {
                processInfo.EnvironmentVariables[env.Key] = env.Value;
            }

            // Prepare command and arguments
            if (execution.Tool.Command.EndsWith(".sh"))
            {
                // Shell script execution
                processInfo.FileName = "/bin/bash";
                processInfo.Arguments = $"-c \"{execution.Tool.Command} {BuildArgumentString(execution.Parameters)}\"";
            }
            else if (execution.Tool.Command.StartsWith("docker"))
            {
                // Docker command
                processInfo.FileName = "docker";
                processInfo.Arguments = execution.Tool.Command.Substring(7) + " " + BuildArgumentString(execution.Parameters);
            }
            else
            {
                // Direct command execution
                var parts = execution.Tool.Command.Split(' ', 2);
                processInfo.FileName = parts[0];
                processInfo.Arguments = parts.Length > 1 ? parts[1] + " " + BuildArgumentString(execution.Parameters) : BuildArgumentString(execution.Parameters);
            }

            return processInfo;
        }

        private static string BuildArgumentString(Dictionary<string, object> parameters)
        {
            var args = new StringBuilder();
            
            foreach (var param in parameters)
            {
                if (param.Value is bool boolValue)
                {
                    if (boolValue)
                    {
                        args.Append($" --{param.Key}");
                    }
                }
                else if (param.Value != null)
                {
                    args.Append($" --{param.Key} \"{param.Value}\"");
                }
            }

            return args.ToString();
        }

        private static async Task<bool> WaitForProcessAsync(Process process, TimeSpan timeout)
        {
            using var cancellationTokenSource = new CancellationTokenSource(timeout);
            try
            {
                await process.WaitForExitAsync(cancellationTokenSource.Token);
                return true;
            }
            catch (OperationCanceledException)
            {
                // Timeout occurred
                if (!process.HasExited)
                {
                    process.Kill(true);
                }
                return false;
            }
        }

        private async Task<double> GetCpuUsageAsync()
        {
            try
            {
                var process = Process.GetCurrentProcess();
                var startTime = DateTime.UtcNow;
                var startCpuUsage = process.TotalProcessorTime;
                
                await Task.Delay(1000); // Wait 1 second
                
                var endTime = DateTime.UtcNow;
                var endCpuUsage = process.TotalProcessorTime;
                
                var cpuUsedMs = (endCpuUsage - startCpuUsage).TotalMilliseconds;
                var totalMsPassed = (endTime - startTime).TotalMilliseconds;
                
                var cpuUsageTotal = cpuUsedMs / (Environment.ProcessorCount * totalMsPassed);
                
                return cpuUsageTotal * 100;
            }
            catch
            {
                return 0; // Return 0 if calculation fails
            }
        }

        private static DateTime CalculateNextExecution(string cronExpression)
        {
            // Simplified cron calculation - in production, use a proper cron library
            // This is a basic implementation for common patterns
            
            var now = DateTime.UtcNow;
            
            return cronExpression switch
            {
                "@hourly" or "0 * * * *" => now.AddHours(1),
                "@daily" or "0 0 * * *" => now.AddDays(1),
                "@weekly" or "0 0 * * 0" => now.AddDays(7),
                "@monthly" or "0 0 1 * *" => now.AddMonths(1),
                _ => now.AddHours(1) // Default to 1 hour
            };
        }

        private async Task AuditToolExecution(OpsToolExecution execution, OpsExecutionResult result)
        {
            try
            {
                var auditData = new
                {
                    toolId = execution.Tool.Id,
                    toolName = execution.Tool.Name,
                    category = execution.Tool.Category,
                    riskLevel = execution.Tool.RiskLevel,
                    userId = execution.UserId,
                    executionTime = result.ExecutionTime,
                    success = result.Success,
                    exitCode = result.ExitCode,
                    parameters = execution.Parameters,
                    workingDirectory = execution.ExecutionContext.WorkingDirectory,
                    secureExecution = execution.ExecutionContext.SecureExecution
                };

                await _auditService.LogToolExecutionAsync(auditData);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to audit tool execution: {ToolId}", execution.Tool.Id);
            }
        }

        #endregion
    }

    #region Data Models

    public class OpsToolExecution
    {
        public OpsTool Tool { get; set; } = new();
        public Dictionary<string, object> Parameters { get; set; } = new();
        public string? UserId { get; set; }
        public OpsExecutionContext ExecutionContext { get; set; } = new();
    }

    public class OpsExecutionContext
    {
        public string WorkingDirectory { get; set; } = Environment.CurrentDirectory;
        public Dictionary<string, string> Environment { get; set; } = new();
        public TimeSpan Timeout { get; set; } = TimeSpan.FromMinutes(10);
        public bool AuditEnabled { get; set; } = true;
        public bool SecureExecution { get; set; } = false;
    }

    public class OpsExecutionResult
    {
        public bool Success { get; set; }
        public string ToolId { get; set; } = string.Empty;
        public string ExecutionId { get; set; } = string.Empty;
        public long ExecutionTime { get; set; }
        public string? Output { get; set; }
        public string? ErrorOutput { get; set; }
        public int ExitCode { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public bool Timeout { get; set; }
    }

    public class OpsToolSchedule
    {
        public string ScheduleId { get; set; } = string.Empty;
        public string ToolId { get; set; } = string.Empty;
        public string CronExpression { get; set; } = string.Empty;
        public Dictionary<string, object> Parameters { get; set; } = new();
        public string? UserId { get; set; }
        public bool Enabled { get; set; } = true;
        public DateTime CreatedAt { get; set; }
        public DateTime? LastExecution { get; set; }
        public DateTime? NextExecution { get; set; }
    }

    public class OpsScheduleResult
    {
        public bool Success { get; set; }
        public string ScheduleId { get; set; } = string.Empty;
        public DateTime? NextExecution { get; set; }
        public string? Error { get; set; }
    }

    public class SystemHealthInfo
    {
        public bool IsHealthy { get; set; }
        public SystemLoad SystemLoad { get; set; } = new();
        public int RunningToolsCount { get; set; }
        public int TotalExecutions { get; set; }
        public DateTime LastHealthCheck { get; set; }
        public string? Error { get; set; }
    }

    public class RunningTool
    {
        public string ExecutionId { get; set; } = string.Empty;
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
        public bool IsHealthy => CpuUsage < 80 && MemoryUsage < 4 && DiskUsage < 90; // Memory in GB
    }

    public class OpsTool
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string Command { get; set; } = string.Empty;
        public string RiskLevel { get; set; } = string.Empty;
        public List<string>? RequiredPermissions { get; set; }
    }

    #endregion
}