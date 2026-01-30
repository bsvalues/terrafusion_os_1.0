using System;
using System.Threading.Tasks;
using TerraFusion.Core.DTOs;
using System.Collections.Generic;

namespace TerraFusion.Core.Interfaces;

/// <summary>
/// AI Command Service Interface for managing AI command execution and orchestration
/// </summary>
public interface IAICommandService
{
    /// <summary>
    /// Execute an AI command with the given parameters
    /// </summary>
    Task<AICommandResult> ExecuteCommandAsync(string command, object parameters);

    /// <summary>
    /// Get available AI commands
    /// </summary>
    Task<IEnumerable<AICommandInfo>> GetAvailableCommandsAsync();

    /// <summary>
    /// Get command execution history
    /// </summary>
    Task<IEnumerable<AICommandExecution>> GetCommandHistoryAsync(int limit = 100);

    /// <summary>
    /// Get command execution statistics
    /// </summary>
    Task<AICommandStatistics> GetCommandStatisticsAsync();

    /// <summary>
    /// Validate a command before execution
    /// </summary>
    Task<AICommandValidationResult> ValidateCommandAsync(string command, object parameters);

    /// <summary>
    /// Cancel a running command
    /// </summary>
    Task<bool> CancelCommandAsync(Guid executionId);
}

/// <summary>
/// AI Command Result DTO
/// </summary>
public class AICommandResult
{
    public Guid ExecutionId { get; set; }
    public bool Success { get; set; }
    public object? Result { get; set; }
    public string? ErrorMessage { get; set; }
    public TimeSpan ExecutionTime { get; set; }
    public DateTime ExecutedAt { get; set; }
    public Dictionary<string, object> Metadata { get; set; } = new();
}

/// <summary>
/// AI Command Info DTO
/// </summary>
public class AICommandInfo
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Version { get; set; } = string.Empty;
    public Dictionary<string, object> Parameters { get; set; } = new();
    public bool IsEnabled { get; set; }
}

/// <summary>
/// AI Command Execution DTO
/// </summary>
public class AICommandExecution
{
    public Guid Id { get; set; }
    public string Command { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public TimeSpan? Duration { get; set; }
    public bool Success { get; set; }
    public string? ErrorMessage { get; set; }
    public string UserId { get; set; } = string.Empty;
}

/// <summary>
/// AI Command Statistics DTO
/// </summary>
public class AICommandStatistics
{
    public int TotalExecutions { get; set; }
    public int SuccessfulExecutions { get; set; }
    public int FailedExecutions { get; set; }
    public double AverageExecutionTimeMs { get; set; }
    public double SuccessRate { get; set; }
    public Dictionary<string, int> CommandsByCategory { get; set; } = new();
    public Dictionary<string, object> CustomMetrics { get; set; } = new();
}

/// <summary>
/// AI Command Validation Result DTO
/// </summary>
public class AICommandValidationResult
{
    public bool IsValid { get; set; }
    public List<string> Errors { get; set; } = new();
    public List<string> Warnings { get; set; } = new();
    public Dictionary<string, object> ValidatedParameters { get; set; } = new();
}
