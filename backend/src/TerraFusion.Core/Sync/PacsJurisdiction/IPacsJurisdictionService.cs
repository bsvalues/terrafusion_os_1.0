using System;
using System.Threading;
using System.Threading.Tasks;

namespace TerraFusion.Core.Sync.PacsJurisdiction;

public sealed class PacsJurisdictionDictResult
{
    public string Status { get; set; } = "IN_PROGRESS";
    public int Upserted { get; set; }
    public string? ErrorSummary { get; set; }
}

public sealed class PacsParcelTaxAreaResult
{
    public Guid PromotionLoadBatchId { get; set; }
    public string Status { get; set; } = "IN_PROGRESS";
    public int Landed { get; set; }
    public int Projected { get; set; }
    public int UnresolvedParcel { get; set; }
    public int DictUnbackedTaxArea { get; set; }
    public string? ErrorSummary { get; set; }
}

/// <summary>JURISDICTION-SPINE: dict populates + parcel→tax-area projection.</summary>
public interface IPacsJurisdictionService
{
    Task<PacsJurisdictionDictResult> PopulateTaxAreaDictAsync(
        IPacsJurisdictionSource source, Guid countyId, string operatorName, CancellationToken ct = default);
    Task<PacsJurisdictionDictResult> PopulateTaxDistrictDictAsync(
        IPacsJurisdictionSource source, Guid countyId, string operatorName, CancellationToken ct = default);
    Task<PacsJurisdictionDictResult> PopulateTaxAreaDistrictAsync(
        IPacsJurisdictionSource source, Guid countyId, short year, string operatorName, CancellationToken ct = default);
    Task<PacsParcelTaxAreaResult> ProjectParcelTaxAreaAsync(
        IPacsJurisdictionSource source, Guid countyId, short year, string operatorName, CancellationToken ct = default);
}
