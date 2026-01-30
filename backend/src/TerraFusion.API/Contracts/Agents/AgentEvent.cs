namespace TerraFusion.API.Contracts.Agents;

public sealed class AgentEvent
{
    public long Seq { get; init; }
    public string Id { get; init; } = Guid.NewGuid().ToString("D");
    public DateTime TsUtc { get; init; } = DateTime.UtcNow;
    public string Level { get; init; } = "Info";
    public string Agent { get; init; } = "System";
    public string Topic { get; init; } = "General";
    public string Message { get; init; } = "";
    public string? CorrelationId { get; init; }
    public object? Data { get; init; }
}
