namespace TerraFusion.Core.Sync.PacsJurisdiction;

public sealed record PacsSourceTaxArea(
    int TaxAreaId, string? TaxAreaNumber, string? TaxAreaState, string? TaxAreaDescription,
    short? InactiveAfterYear, bool IsInactiveAfterYear);

public sealed record PacsSourceTaxDistrict(
    int TaxDistrictId, string? TaxDistrictCd, string? TaxDistrictDesc,
    string? TaxDistrictTypeCd, string? LocationCode);

public sealed record PacsSourceTaxAreaDistrict(int TaxAreaId, int TaxDistrictId);

public sealed record PacsSourceParcelTaxArea(int PropId, short TaxYr, short SupNum, int TaxAreaId);

/// <summary>
/// JURISDICTION-SPINE: streams the tax-area / tax-district dictionaries, the
/// TCA→district expansion (tax_area_id → tax_district_id only; Revenue keys
/// excluded), and the current-year active-supplement parcel→tax-area
/// assignments from live Harris PACS.
/// </summary>
public interface IPacsJurisdictionSource
{
    string SourceSystem { get; }
    string SourceFileOrDatabase { get; }

    IAsyncEnumerable<PacsSourceTaxArea> StreamTaxAreasAsync(System.Threading.CancellationToken ct);
    IAsyncEnumerable<PacsSourceTaxDistrict> StreamTaxDistrictsAsync(System.Threading.CancellationToken ct);
    IAsyncEnumerable<PacsSourceTaxAreaDistrict> StreamTaxAreaDistrictsAsync(short year, System.Threading.CancellationToken ct);
    IAsyncEnumerable<PacsSourceParcelTaxArea> StreamParcelTaxAreasAsync(short year, System.Threading.CancellationToken ct);
}
