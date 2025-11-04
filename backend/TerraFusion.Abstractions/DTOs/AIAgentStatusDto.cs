namespace TerraFusion.Abstractions.DTOs;

public sealed class AIAgentStatusDto
{
    public string AgentId { get; set; } = "";
    public string Name { get; set; } = "";
    public string Type { get; set; } = "";
    public string Role { get; set; } = "";
    public string State { get; set; } = "Idle";
    public string Status { get; set; } = "Unknown";
    public decimal LoadPercentage { get; set; }
    public DateTime LastHeartbeatUtc { get; set; } = DateTime.UtcNow;
    public DateTime LastActivity { get; set; } = DateTime.UtcNow;
    public int TasksCompleted { get; set; }
    public double SuccessRate { get; set; }
    public double AvgLatencyMs { get; set; }
    public string? CurrentTaskId { get; set; }
    public string? CurrentTask { get; set; }
    public TimeSpan Uptime { get; set; }
}
