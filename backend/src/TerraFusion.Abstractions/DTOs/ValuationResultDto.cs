namespace TerraFusion.Abstractions.DTOs;

public sealed class ValuationResultDto
{
    public string ParcelId { get; set; } = "";
    public decimal EstimatedValue { get; set; }
    public double Confidence { get; set; }
    public string ModelUsed { get; set; } = "";                 
    public DateTime GeneratedAtUtc { get; set; } = DateTime.UtcNow;
    public Dictionary<string, decimal> ComponentBreakdown { get; set; } = new(); 
    public List<string> Warnings { get; set; } = new();         
}
