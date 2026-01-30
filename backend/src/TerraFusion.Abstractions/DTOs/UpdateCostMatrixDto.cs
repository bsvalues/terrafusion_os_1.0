namespace TerraFusion.Abstractions.DTOs;

public sealed class UpdateCostMatrixDto
{
    public string MatrixId { get; set; } = "default";
    public DateOnly? EffectiveDate { get; set; }
    public List<CostMatrixItemDto> AddOrUpdate { get; set; } = new();
    public List<string> RemoveCodes { get; set; } = new();
    public string? ChangeReason { get; set; }
}
