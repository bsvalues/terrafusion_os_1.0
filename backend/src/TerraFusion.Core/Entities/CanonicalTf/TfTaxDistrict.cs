using System;

namespace TerraFusion.Core.Entities.CanonicalTf;

/// <summary>
/// JURISDICTION-SPINE (2026-06-07): canonical taxing-district dictionary
/// (cities / schools / fire / etc., typed by tax_district_type_cd).
/// County-isolated; <see cref="TaxDistrictId"/> unique within
/// <see cref="CountyId"/>. Revenue concepts (levy/fund/rate) are NOT here.
/// </summary>
public sealed class TfTaxDistrict
{
    public Guid TfTaxDistrictId { get; set; } = Guid.NewGuid();
    public Guid CountyId { get; set; }

    public int TaxDistrictId { get; set; }
    public string? TaxDistrictCd { get; set; }
    public string? TaxDistrictDesc { get; set; }
    public string? TaxDistrictTypeCd { get; set; }
    public string? LocationCode { get; set; }

    public Guid LoadBatchId { get; set; }
    public string SourceQueryHash { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
