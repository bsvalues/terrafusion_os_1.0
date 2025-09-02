namespace TerraFusion.Abstractions.DTOs;

public sealed class AIAgentStatusDto
{
    public string AgentId { get; set; } = "";
    public string Role { get; set; } = "";                 
    public string State { get; set; } = "Idle";            
    public DateTime LastHeartbeatUtc { get; set; } = DateTime.UtcNow;
    public int TasksCompleted { get; set; }
    public double SuccessRate { get; set; }                
    public double AvgLatencyMs { get; set; }
    public string? CurrentTaskId { get; set; }
}
