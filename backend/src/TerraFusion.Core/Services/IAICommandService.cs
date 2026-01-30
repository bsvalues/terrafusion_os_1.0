using TerraFusion.Core.DTOs;

namespace TerraFusion.Core.Services;

public interface IAICommandService
{
    Task<AISwarmStatusDto> GetSwarmStatusAsync();
    Task<AICommandResultDto> ExecuteCommandAsync(AICommandDto command);
    Task<IEnumerable<AIAgentDto>> GetActiveAgentsAsync();
    Task<AIAgentDto> GetAgentAsync(Guid agentId);
    Task<AISwarmMetricsDto> GetSwarmMetricsAsync();
    Task<bool> ScaleSwarmAsync(int targetAgentCount);
    Task<bool> RestartAgentAsync(Guid agentId);
    Task<IEnumerable<AITaskDto>> GetActiveTasksAsync();
    Task<AITaskDto> AssignTaskAsync(AITaskAssignmentDto assignment);
    Task<bool> CancelTaskAsync(Guid taskId);
}

public class AISwarmStatusDto
{
    public string Status { get; set; } = string.Empty;
    public int TotalAgents { get; set; }
    public int ActiveAgents { get; set; }
    public int IdleAgents { get; set; }
    public int BusyAgents { get; set; }
    public double AverageLoad { get; set; }
    public DateTime LastUpdate { get; set; }
            public List<TerraFusion.Abstractions.DTOs.AIAgentStatusDto> AgentStatuses { get; set; } = new();
}

// AIAgentStatusDto moved to dedicated file to avoid duplication

public class AICommandDto
{
    public string Command { get; set; } = string.Empty;
    public Dictionary<string, object> Parameters { get; set; } = new();
    public string Priority { get; set; } = "Medium";
    public Guid? TargetAgentId { get; set; }
    public int TimeoutSeconds { get; set; } = 30;
}

public class AICommandResultDto
{
    public Guid CommandId { get; set; }
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public Dictionary<string, object> Results { get; set; } = new();
    public double ExecutionTimeMs { get; set; }
    public DateTime ExecutedAt { get; set; }
    public Guid? ExecutedByAgentId { get; set; }
}

public class AIAgentDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string Specialization { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public double LoadPercentage { get; set; }
    public int TasksCompleted { get; set; }
    public int TasksFailed { get; set; }
    public double AverageTaskTime { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime LastActivity { get; set; }
    public Dictionary<string, object> Capabilities { get; set; } = new();
}

public class AISwarmMetricsDto
{
    public int TotalTasks { get; set; }
    public int CompletedTasks { get; set; }
    public int FailedTasks { get; set; }
    public int ActiveTasks { get; set; }
    public double AverageTaskTime { get; set; }
    public double SuccessRate { get; set; }
    public double ThroughputPerMinute { get; set; }
    public DateTime MetricsDate { get; set; }
    public List<AIPerformanceMetricDto> PerformanceMetrics { get; set; } = new();
}

public class AIPerformanceMetricDto
{
    public string MetricName { get; set; } = string.Empty;
    public double Value { get; set; }
    public string Unit { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
}

public class AITaskDto
{
    public Guid Id { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string Priority { get; set; } = string.Empty;
    public Guid? AssignedAgentId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public double? ExecutionTimeMs { get; set; }
    public Dictionary<string, object> Parameters { get; set; } = new();
    public Dictionary<string, object> Results { get; set; } = new();
    public string? ErrorMessage { get; set; }
}

public class AITaskAssignmentDto
{
    public string TaskType { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Priority { get; set; } = "Medium";
    public Dictionary<string, object> Parameters { get; set; } = new();
    public Guid? PreferredAgentId { get; set; }
    public string? RequiredSpecialization { get; set; }
    public int TimeoutSeconds { get; set; } = 300;
}
