using System;
using System.Threading.Tasks;
using TerraFusion.Core.DTOs;
using System.Collections.Generic;

namespace TerraFusion.Core.Interfaces;

/// <summary>
/// AI Engine Service Interface for managing AI model execution and orchestration
/// </summary>
public interface IAIEngineService
{
    /// <summary>
    /// Initialize the AI engine with configuration
    /// </summary>
    Task<bool> InitializeAsync();

    /// <summary>
    /// Get the current status of the AI engine
    /// </summary>
    Task<AIEngineStatus> GetStatusAsync();

    /// <summary>
    /// Execute an AI model with the given parameters
    /// </summary>
    Task<AIExecutionResult> ExecuteModelAsync(string modelName, object parameters);

    /// <summary>
    /// Get available AI models
    /// </summary>
    Task<IEnumerable<AIModelInfo>> GetAvailableModelsAsync();

    /// <summary>
    /// Update AI model configuration
    /// </summary>
    Task<bool> UpdateModelConfigurationAsync(string modelName, object configuration);

    /// <summary>
    /// Get performance metrics for AI models
    /// </summary>
    Task<AIPerformanceMetrics> GetPerformanceMetricsAsync();
}

/// <summary>
/// AI Engine Status DTO
/// </summary>
public class AIEngineStatus
{
    public bool IsInitialized { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime LastHeartbeat { get; set; }
    public int ActiveModels { get; set; }
    public double CpuUsage { get; set; }
    public double MemoryUsage { get; set; }
    public string? ErrorMessage { get; set; }
}

/// <summary>
/// AI Execution Result DTO
/// </summary>
public class AIExecutionResult
{
    public bool Success { get; set; }
    public object? Result { get; set; }
    public string? ErrorMessage { get; set; }
    public TimeSpan ExecutionTime { get; set; }
    public Dictionary<string, object> Metadata { get; set; } = new();
}

/// <summary>
/// AI Model Info DTO
/// </summary>
public class AIModelInfo
{
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string Version { get; set; } = string.Empty;
    public Dictionary<string, object> Configuration { get; set; } = new();
}

/// <summary>
/// AI Performance Metrics DTO
/// </summary>
public class AIPerformanceMetrics
{
    public int TotalExecutions { get; set; }
    public int SuccessfulExecutions { get; set; }
    public int FailedExecutions { get; set; }
    public double AverageExecutionTimeMs { get; set; }
    public double SuccessRate { get; set; }
    public Dictionary<string, object> CustomMetrics { get; set; } = new();
}
