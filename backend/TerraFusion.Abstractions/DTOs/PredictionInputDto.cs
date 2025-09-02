namespace TerraFusion.Abstractions.DTOs;

public sealed class PredictionInputDto
{
    public string ModelId { get; set; } = "";
    public Dictionary<string, object> Features { get; set; } = new();
    public string? RequestId { get; set; }
    public DateTime RequestedAt { get; set; } = DateTime.UtcNow;
}
