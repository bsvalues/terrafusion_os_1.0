namespace TerraFusion.Abstractions.DTOs;

public sealed class TrainingDataDto
{
    public string DatasetId { get; set; } = "";
    public string DataType { get; set; } = "";
    public int RecordCount { get; set; }
    public Dictionary<string, object> Metadata { get; set; } = new();
    public List<string> Features { get; set; } = new();
    public string TargetColumn { get; set; } = "";
}
