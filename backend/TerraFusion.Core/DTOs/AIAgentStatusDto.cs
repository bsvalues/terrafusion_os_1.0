using TerraFusion.Core.Enums;

namespace TerraFusion.Core.DTOs;

/// <summary>
/// AI Agent Status DTO for tracking agent health and performance
/// </summary>
public class AIAgentStatusDto
{
    public Guid AgentId { get; set; }
    public string AgentName { get; set; } = string.Empty;
    public string AgentType { get; set; } = string.Empty;
    public AgentStatus Status { get; set; }
    public DateTime LastHeartbeat { get; set; }
    public DateTime LastTaskExecution { get; set; }
    public int TasksCompleted { get; set; }
    public int TasksFailed { get; set; }
    public double AverageResponseTimeMs { get; set; }
    public double CpuUsage { get; set; }
    public double MemoryUsage { get; set; }
    public Dictionary<string, object> Metrics { get; set; } = new();
    public List<string> ActiveCapabilities { get; set; } = new();
    public string CurrentTask { get; set; } = string.Empty;
    public bool IsHealthy { get; set; }
    public string? ErrorMessage { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? LastMaintenance { get; set; }
    
    // Additional properties for swarm status tracking
    public int TotalAgents { get; set; }
    public int ActiveAgents { get; set; }
    public int IdleAgents { get; set; }
    public int BusyAgents { get; set; }
    public double AverageUtilization { get; set; }
    public List<object> Agents { get; set; } = new();
}
