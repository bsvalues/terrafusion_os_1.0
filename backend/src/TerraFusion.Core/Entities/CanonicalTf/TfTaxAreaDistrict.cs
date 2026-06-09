using System;

namespace TerraFusion.Core.Entities.CanonicalTf;

/// <summary>
/// JURISDICTION-SPINE (2026-06-07): canonical TCA→district expansion for
/// the current year — distinct (tax_area_id → tax_district_id) pairs from
/// PACS <c>tax_area_fund_assoc</c>. Revenue keys (levy_cd, fund_id) are
/// deliberately EXCLUDED; this is the jurisdiction membership only.
/// Combined with <see cref="TfParcelTaxArea"/> it answers "which districts
/// apply to this parcel".
/// </summary>
public sealed class TfTaxAreaDistrict
{
    public Guid TfTaxAreaDistrictId { get; set; } = Guid.NewGuid();
    public Guid CountyId { get; set; }

    public short TaxYr { get; set; }
    public int TaxAreaId { get; set; }
    public int TaxDistrictId { get; set; }

    public Guid LoadBatchId { get; set; }
    public string SourceQueryHash { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
