namespace TerraFusion.API.Contracts.Agents;

public sealed class AgentSystemStatusResponse
{
    public string ExecutionMode { get; init; } = "Passive";
    public int TotalAgents { get; init; }
    public int ActiveAgents { get; init; }
    public int QueueDepth { get; init; }
    public DateTime? LastActivityUtc { get; init; }
    public long EventCount { get; init; }
    public string Provider { get; init; } = "TerraFusion.API";
    public List<string> Warnings { get; init; } = new();
}
