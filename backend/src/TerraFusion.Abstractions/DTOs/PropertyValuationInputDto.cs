namespace TerraFusion.Abstractions.DTOs;

public sealed class PropertyValuationInputDto
{
    public string ParcelId { get; set; } = "";
    public DateOnly? AsOfDate { get; set; }
    public Dictionary<string, double> Features { get; set; } = new();
    public List<string> RequestedModels { get; set; } = new();   
    public double? ConfidenceTarget { get; set; }                
    public bool UseComparableSales { get; set; } = true;
    public string? CountyCode { get; set; }
    public string? Notes { get; set; }
}
