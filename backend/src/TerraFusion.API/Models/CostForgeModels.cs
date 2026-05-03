namespace TerraFusion.API.Models;

/// <summary>Request body for POST cost-forge/batch/apply.</summary>
public sealed class BatchApplyRequest
{
    /// <summary>Optional neighborhood code filter (empty = all neighborhoods).</summary>
    public string? NeighborhoodFilter { get; set; }

    /// <summary>Optional property type filter (empty = all types).</summary>
    public string? PropertyType { get; set; }

    /// <summary>Cost schedule identifier to apply.</summary>
    public string? CostScheduleId { get; set; }
}
