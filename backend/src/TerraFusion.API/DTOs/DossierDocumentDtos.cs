namespace TerraFusion.API.DTOs;

/// <summary>
/// R2.5: Document search request body.
/// </summary>
public sealed class DocumentSearchDto
{
    public string? Query { get; set; }
    public string? Type { get; set; }
    public string? Status { get; set; }
    public string? ParcelId { get; set; }
    public int? Limit { get; set; }
    public int? Offset { get; set; }
}

/// <summary>
/// R2.5: Document status transition request.
/// </summary>
public sealed class DocumentStatusUpdateDto
{
    public string? Status { get; set; }
}
