using System;

namespace TerraFusion.Core.Entities.CanonicalTf;

/// <summary>
/// REVENUE-SPINE Stage 1: canonical levy rate per (tax_yr, tax_district_id,
/// levy_cd) from PACS <c>levy.levy_rate</c>. County-isolated. Read-only rate
/// reference; no fund/distribution.
/// </summary>
public sealed class TfLevyRate
{
    public Guid TfLevyRateId { get; set; } = Guid.NewGuid();
    public Guid CountyId { get; set; }

    public short TaxYr { get; set; }
    public int TaxDistrictId { get; set; }
    public string LevyCd { get; set; } = string.Empty;
    public decimal? LevyRate { get; set; }

    public Guid LoadBatchId { get; set; }
    public string SourceQueryHash { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
