namespace TerraFusion.Core.Entities.Forge;

/// <summary>
/// A single TF-owned cost factor line item within a <see cref="CostFactorSet"/>. Keyed by
/// improvement class code (maps to <c>TfImprovement.ImprvClassCd</c>) and an optional size band.
/// <see cref="UnitCostPerSqFt"/> is a TerraFusion-owned replacement-cost-new input, not a vendor figure.
/// </summary>
public sealed class CostFactor
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid CostFactorSetId { get; set; }

    /// <summary>Improvement class code this factor applies to.</summary>
    public required string ImprovementClassCode { get; set; }

    /// <summary>Inclusive lower bound of the size band (sq ft); null = no lower bound.</summary>
    public int? SizeBandMinSqFt { get; set; }

    /// <summary>Inclusive upper bound of the size band (sq ft); null = no upper bound.</summary>
    public int? SizeBandMaxSqFt { get; set; }

    /// <summary>TF-owned RCN unit cost ($/sq ft).</summary>
    public decimal UnitCostPerSqFt { get; set; }
}
