using TerraFusion.Core.Enums;

namespace TerraFusion.Core.DTOs;

/// <summary>
/// Module Health DTO for tracking module status and performance
/// </summary>
public class ModuleHealthDto
{
    public Guid ModuleId { get; set; }
    public string ModuleName { get; set; } = string.Empty;
    public HealthStatus Status { get; set; }
    public double CpuUsage { get; set; }
    public long MemoryUsage { get; set; }
    public TimeSpan Uptime { get; set; }
    public string Version { get; set; } = string.Empty;
    public int ActiveConnections { get; set; }
    public int ErrorCount { get; set; }
    public int WarningCount { get; set; }
    public DateTime LastHealthCheck { get; set; } = DateTime.UtcNow;
    public bool IsResponding { get; set; }
    public string? ErrorMessage { get; set; }
    public Dictionary<string, object> HealthMetrics { get; set; } = new();
}