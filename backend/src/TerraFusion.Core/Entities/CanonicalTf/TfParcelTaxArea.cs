using System;

namespace TerraFusion.Core.Entities.CanonicalTf;

/// <summary>
/// JURISDICTION-SPINE (2026-06-07): canonical parcel→tax-code-area
/// assignment for the current operational year, at the active supplement.
/// Parcel resolved via the existing parcel spine xref. One active TCA per
/// parcel-year.
/// </summary>
public sealed class TfParcelTaxArea
{
    public Guid TfParcelTaxAreaId { get; set; } = Guid.NewGuid();
    public Guid CountyId { get; set; }

    /// <summary>Canonical FK to the parcel.</summary>
    public Guid TfParcelId { get; set; }

    public int SourcePropId { get; set; }
    public short TaxYr { get; set; }
    public int TaxAreaId { get; set; }
    public short SupNum { get; set; }

    public Guid PromotionLoadBatchId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
