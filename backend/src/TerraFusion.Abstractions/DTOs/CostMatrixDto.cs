namespace TerraFusion.Abstractions.DTOs;

public sealed class CostMatrixDto
{
    public string MatrixId { get; set; } = "default";
    public string? Version { get; set; }
    public DateOnly? EffectiveDate { get; set; }
    public List<CostMatrixItemDto> Items { get; set; } = new();
}

public sealed class CostMatrixItemDto
{
    public string Code { get; set; } = "";        
    public string Description { get; set; } = "";
    public decimal CostPerUnit { get; set; }      
    public string Unit { get; set; } = "sqft";    
    public DateOnly? EffectiveFrom { get; set; }
    public DateOnly? EffectiveTo { get; set; }
}
