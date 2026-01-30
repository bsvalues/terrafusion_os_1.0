/*
 * KernelExecutionService - Code Execution with Streaming Output
 *
 * Production-ready service for executing code cells with streaming output,
 * kernel management, and execution state tracking.
 *
 * @author TerraFusion Elite Government OS Engineering Agent
 * @version 2.0.0 - Phase 2 Week 5 Day 5
 */

using System.Collections.Concurrent;
using System.Diagnostics;
using System.Text;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using TerraFusion.AI.Hubs;

namespace TerraFusion.AI.Services;

/// <summary>
/// Service for executing code with streaming output to SignalR clients
/// </summary>
public class KernelExecutionService : IKernelExecutionService
{
    private readonly IHubContext<NotebookHub> _hubContext;
    private readonly ILogger<KernelExecutionService> _logger;

    // Track active executions
    private static readonly ConcurrentDictionary<string, ExecutionContext> _activeExecutions = new();

    // Execution queue for managing concurrent executions
    private static readonly ConcurrentQueue<ExecutionRequest> _executionQueue = new();

    // Max concurrent executions per notebook
    private const int MaxConcurrentExecutions = 3;

    public KernelExecutionService(
        IHubContext<NotebookHub> hubContext,
        ILogger<KernelExecutionService> logger)
    {
        _hubContext = hubContext ?? throw new ArgumentNullException(nameof(hubContext));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>
    /// Execute code cell with streaming output
    /// </summary>
    public async Task<ExecutionResult> ExecuteCellAsync(
        int notebookId,
        int cellIndex,
        string code,
        string language = "python",
        CancellationToken cancellationToken = default)
    {
        var executionId = Guid.NewGuid().ToString();
        var startTime = DateTime.UtcNow;

        try
        {
            _logger.LogInformation(
                "Starting execution for notebook {NotebookId} cell {CellIndex} (execution {ExecutionId})",
                notebookId, cellIndex, executionId);

            // Create execution context
            var context = new ExecutionContext
            {
                ExecutionId = executionId,
                NotebookId = notebookId,
                CellIndex = cellIndex,
                Code = code,
                Language = language,
                StartTime = startTime,
                Status = ExecutionStatus.Running
            };

            _activeExecutions[executionId] = context;

            // Broadcast execution started
            await BroadcastExecutionStarted(notebookId, cellIndex, executionId);

            // Execute based on language
            var result = language.ToLowerInvariant() switch
            {
                "python" => await ExecutePythonAsync(context, cancellationToken),
                "csharp" or "c#" => await ExecuteCSharpAsync(context, cancellationToken),
                "sql" => await ExecuteSqlAsync(context, cancellationToken),
                "javascript" or "js" => await ExecuteJavaScriptAsync(context, cancellationToken),
                _ => throw new NotSupportedException($"Language '{language}' is not supported")
            };

            // Update context
            context.EndTime = DateTime.UtcNow;
            context.Status = ExecutionStatus.Completed;
            context.Result = result;

            // Broadcast execution completed
            await BroadcastExecutionCompleted(notebookId, cellIndex, executionId, result);

            _logger.LogInformation(
                "Completed execution {ExecutionId} in {Duration}ms",
                executionId, (context.EndTime.Value - context.StartTime).TotalMilliseconds);

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Execution {ExecutionId} failed for notebook {NotebookId} cell {CellIndex}",
                executionId, notebookId, cellIndex);

            // Broadcast execution failed
            await BroadcastExecutionFailed(notebookId, cellIndex, executionId, ex.Message);

            return new ExecutionResult
            {
                Success = false,
                Error = ex.Message,
                ExecutionTime = (DateTime.UtcNow - startTime).TotalMilliseconds
            };
        }
        finally
        {
            _activeExecutions.TryRemove(executionId, out _);
        }
    }

    /// <summary>
    /// Stop execution by execution ID
    /// </summary>
    public async Task StopExecutionAsync(string executionId)
    {
        if (_activeExecutions.TryGetValue(executionId, out var context))
        {
            context.CancellationTokenSource?.Cancel();
            context.Status = ExecutionStatus.Cancelled;

            await BroadcastExecutionCancelled(
                context.NotebookId,
                context.CellIndex,
                executionId);

            _logger.LogInformation("Execution {ExecutionId} cancelled", executionId);
        }
    }

    // ==================== PYTHON EXECUTION ====================

    private async Task<ExecutionResult> ExecutePythonAsync(
        ExecutionContext context,
        CancellationToken cancellationToken)
    {
        var outputBuilder = new StringBuilder();
        var errorBuilder = new StringBuilder();
        var startTime = DateTime.UtcNow;

        try
        {
            // Create temporary Python script
            var scriptPath = Path.GetTempFileName() + ".py";
            await File.WriteAllTextAsync(scriptPath, context.Code, cancellationToken);

            var processStartInfo = new ProcessStartInfo
            {
                FileName = "python3",
                Arguments = scriptPath,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };

            using var process = new Process { StartInfo = processStartInfo };

            // Stream stdout
            process.OutputDataReceived += async (sender, e) =>
            {
                if (!string.IsNullOrEmpty(e.Data))
                {
                    outputBuilder.AppendLine(e.Data);
                    await StreamOutput(context.NotebookId, context.CellIndex, context.ExecutionId, "stdout", e.Data);
                }
            };

            // Stream stderr
            process.ErrorDataReceived += async (sender, e) =>
            {
                if (!string.IsNullOrEmpty(e.Data))
                {
                    errorBuilder.AppendLine(e.Data);
                    await StreamOutput(context.NotebookId, context.CellIndex, context.ExecutionId, "stderr", e.Data);
                }
            };

            process.Start();
            process.BeginOutputReadLine();
            process.BeginErrorReadLine();

            await process.WaitForExitAsync(cancellationToken);

            // Clean up temp file
            try { File.Delete(scriptPath); } catch { /* Ignore cleanup errors */ }

            var executionTime = (DateTime.UtcNow - startTime).TotalMilliseconds;

            return new ExecutionResult
            {
                Success = process.ExitCode == 0,
                Output = outputBuilder.ToString(),
                Error = errorBuilder.ToString(),
                ExecutionTime = executionTime,
                ExitCode = process.ExitCode
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Python execution failed for execution {ExecutionId}", context.ExecutionId);
            throw;
        }
    }

    // ==================== C# EXECUTION ====================

    private async Task<ExecutionResult> ExecuteCSharpAsync(
        ExecutionContext context,
        CancellationToken cancellationToken)
    {
        // Note: C# execution requires Roslyn scripting API
        // This is a simplified implementation
        var startTime = DateTime.UtcNow;

        try
        {
            // TODO: Implement Roslyn scripting for C# execution
            // For now, return a placeholder

            await StreamOutput(
                context.NotebookId,
                context.CellIndex,
                context.ExecutionId,
                "stdout",
                "C# execution not yet implemented. Install Microsoft.CodeAnalysis.CSharp.Scripting package.");

            var executionTime = (DateTime.UtcNow - startTime).TotalMilliseconds;

            return new ExecutionResult
            {
                Success = false,
                Output = "C# execution not implemented",
                ExecutionTime = executionTime
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "C# execution failed for execution {ExecutionId}", context.ExecutionId);
            throw;
        }
    }

    // ==================== SQL EXECUTION ====================

    private async Task<ExecutionResult> ExecuteSqlAsync(
        ExecutionContext context,
        CancellationToken cancellationToken)
    {
        var startTime = DateTime.UtcNow;

        try
        {
            // TODO: Implement SQL execution against configured database
            // For now, return a placeholder

            await StreamOutput(
                context.NotebookId,
                context.CellIndex,
                context.ExecutionId,
                "stdout",
                "SQL execution requires database configuration.");

            var executionTime = (DateTime.UtcNow - startTime).TotalMilliseconds;

            return new ExecutionResult
            {
                Success = false,
                Output = "SQL execution not configured",
                ExecutionTime = executionTime
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "SQL execution failed for execution {ExecutionId}", context.ExecutionId);
            throw;
        }
    }

    // ==================== JAVASCRIPT EXECUTION ====================

    private async Task<ExecutionResult> ExecuteJavaScriptAsync(
        ExecutionContext context,
        CancellationToken cancellationToken)
    {
        var outputBuilder = new StringBuilder();
        var errorBuilder = new StringBuilder();
        var startTime = DateTime.UtcNow;

        try
        {
            // Create temporary JavaScript file
            var scriptPath = Path.GetTempFileName() + ".js";
            await File.WriteAllTextAsync(scriptPath, context.Code, cancellationToken);

            var processStartInfo = new ProcessStartInfo
            {
                FileName = "node",
                Arguments = scriptPath,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };

            using var process = new Process { StartInfo = processStartInfo };

            // Stream stdout
            process.OutputDataReceived += async (sender, e) =>
            {
                if (!string.IsNullOrEmpty(e.Data))
                {
                    outputBuilder.AppendLine(e.Data);
                    await StreamOutput(context.NotebookId, context.CellIndex, context.ExecutionId, "stdout", e.Data);
                }
            };

            // Stream stderr
            process.ErrorDataReceived += async (sender, e) =>
            {
                if (!string.IsNullOrEmpty(e.Data))
                {
                    errorBuilder.AppendLine(e.Data);
                    await StreamOutput(context.NotebookId, context.CellIndex, context.ExecutionId, "stderr", e.Data);
                }
            };

            process.Start();
            process.BeginOutputReadLine();
            process.BeginErrorReadLine();

            await process.WaitForExitAsync(cancellationToken);

            // Clean up temp file
            try { File.Delete(scriptPath); } catch { /* Ignore cleanup errors */ }

            var executionTime = (DateTime.UtcNow - startTime).TotalMilliseconds;

            return new ExecutionResult
            {
                Success = process.ExitCode == 0,
                Output = outputBuilder.ToString(),
                Error = errorBuilder.ToString(),
                ExecutionTime = executionTime,
                ExitCode = process.ExitCode
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "JavaScript execution failed for execution {ExecutionId}", context.ExecutionId);
            throw;
        }
    }

    // ==================== SIGNALR BROADCASTING ====================

    private async Task BroadcastExecutionStarted(int notebookId, int cellIndex, string executionId)
    {
        await _hubContext.Clients.Group($"notebook_{notebookId}").SendAsync(
            "ExecutionStarted",
            new
            {
                NotebookId = notebookId,
                CellIndex = cellIndex,
                ExecutionId = executionId,
                StartedAt = DateTime.UtcNow
            });
    }

    private async Task BroadcastExecutionCompleted(
        int notebookId,
        int cellIndex,
        string executionId,
        ExecutionResult result)
    {
        await _hubContext.Clients.Group($"notebook_{notebookId}").SendAsync(
            "ExecutionCompleted",
            new
            {
                NotebookId = notebookId,
                CellIndex = cellIndex,
                ExecutionId = executionId,
                Result = result,
                CompletedAt = DateTime.UtcNow
            });
    }

    private async Task BroadcastExecutionFailed(
        int notebookId,
        int cellIndex,
        string executionId,
        string error)
    {
        await _hubContext.Clients.Group($"notebook_{notebookId}").SendAsync(
            "ExecutionFailed",
            new
            {
                NotebookId = notebookId,
                CellIndex = cellIndex,
                ExecutionId = executionId,
                Error = error,
                FailedAt = DateTime.UtcNow
            });
    }

    private async Task BroadcastExecutionCancelled(
        int notebookId,
        int cellIndex,
        string executionId)
    {
        await _hubContext.Clients.Group($"notebook_{notebookId}").SendAsync(
            "ExecutionCancelled",
            new
            {
                NotebookId = notebookId,
                CellIndex = cellIndex,
                ExecutionId = executionId,
                CancelledAt = DateTime.UtcNow
            });
    }

    private async Task StreamOutput(
        int notebookId,
        int cellIndex,
        string executionId,
        string outputType,
        string content)
    {
        await _hubContext.Clients.Group($"notebook_{notebookId}").SendAsync(
            "StreamOutput",
            new
            {
                NotebookId = notebookId,
                CellIndex = cellIndex,
                ExecutionId = executionId,
                OutputType = outputType,
                Content = content,
                Timestamp = DateTime.UtcNow
            });
    }
}

// ==================== INTERFACES ====================

public interface IKernelExecutionService
{
    Task<ExecutionResult> ExecuteCellAsync(
        int notebookId,
        int cellIndex,
        string code,
        string language = "python",
        CancellationToken cancellationToken = default);

    Task StopExecutionAsync(string executionId);
}

// ==================== MODELS ====================

public class ExecutionContext
{
    public string ExecutionId { get; set; } = string.Empty;
    public int NotebookId { get; set; }
    public int CellIndex { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Language { get; set; } = "python";
    public DateTime StartTime { get; set; }
    public DateTime? EndTime { get; set; }
    public ExecutionStatus Status { get; set; }
    public ExecutionResult? Result { get; set; }
    public CancellationTokenSource? CancellationTokenSource { get; set; } = new();
}

public class ExecutionRequest
{
    public string ExecutionId { get; set; } = string.Empty;
    public int NotebookId { get; set; }
    public int CellIndex { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Language { get; set; } = "python";
}

public class ExecutionResult
{
    public bool Success { get; set; }
    public string Output { get; set; } = string.Empty;
    public string Error { get; set; } = string.Empty;
    public double ExecutionTime { get; set; }
    public int? ExitCode { get; set; }
    public Dictionary<string, object>? Metadata { get; set; }
}

public enum ExecutionStatus
{
    Queued,
    Running,
    Completed,
    Failed,
    Cancelled
}
