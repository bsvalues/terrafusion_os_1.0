using System;

namespace TerraFusion.Core.Entities.CanonicalTf;

/// <summary>
/// JURISDICTION-SPINE (2026-06-07): canonical tax-code-area (TCA)
/// dictionary. County-isolated; <see cref="TaxAreaId"/> unique within
/// <see cref="CountyId"/>. Conversion artifacts (Converted note,
/// is_inactive_after_year) retained as metadata, not used to suppress
/// current active assignments.
/// </summary>
public sealed class TfTaxArea
{
    public Guid TfTaxAreaId { get; set; } = Guid.NewGuid();
    public Guid CountyId { get; set; }

    /// <summary>PACS tax_area_id (source identity, county-scoped).</summary>
    public int TaxAreaId { get; set; }
    public string? TaxAreaNumber { get; set; }
    public string? TaxAreaState { get; set; }
    public string? TaxAreaDescription { get; set; }
    public short? InactiveAfterYear { get; set; }
    public bool IsInactiveAfterYear { get; set; }

    public Guid LoadBatchId { get; set; }
    public string SourceQueryHash { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
