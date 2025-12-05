namespace TerraFusion.AI.Models;

/// <summary>
/// Result of AI Swarm workflow execution
/// </summary>
public class WorkflowExecutionResult
{
    public string WorkflowId { get; set; } = string.Empty;
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public Dictionary<string, object> Results { get; set; } = new();
    public DateTime ExecutionTime { get; set; } = DateTime.UtcNow;
    public TimeSpan Duration { get; set; }
    public List<string> Errors { get; set; } = new();
}