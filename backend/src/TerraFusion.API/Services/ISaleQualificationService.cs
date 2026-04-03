namespace TerraFusion.API.Services;

/// <summary>
/// TerraFusion owns sale qualification decisions — independent of PACS/Harris encoding.
/// Implements IAAO ratio-study arms-length standards for Benton County.
///
/// Qualification may be re-run at any time against stored raw PACS codes without
/// re-importing raw data from the source system.
///
/// ARCHITECTURAL CONTRACT:
///   - Raw PACS codes (SaleQualifier, SaleCountyRatioCd, SalesExcludeCalcCd, WacCd)
///     are preserved on ComparableSale.Raw* fields.
///   - ComparableSale.SaleQualification is always TerraFusion's derived verdict from
///     this service — never a verbatim copy of a PACS code.
///   - PacsCanonicalizer calls this service during import to set the initial verdict.
///   - Future admin API may call RequalifyAll() to update verdicts without re-import.
/// </summary>
public interface ISaleQualificationService
{
    /// <summary>
    /// Qualify a single sale from its raw PACS codes.
    /// Returns one of: "qualified" | "non-arms-length" | "foreclosure" | "estate"
    ///                 | "excluded: {code}" | "exempt: {code}"
    /// </summary>
    string Qualify(
        string? rawSaleQualifier,
        string? rawCountyRatioCd,
        string? rawExcludeCalcCd,
        string? rawWacCd);

    /// <summary>
    /// Re-qualify a collection of ComparableSale records using the current rules.
    /// Updates ComparableSale.SaleQualification in-place on each record.
    /// Caller is responsible for persisting changes (SaveChangesAsync).
    /// </summary>
    void RequalifyAll(IEnumerable<TerraFusion.Core.Entities.ComparableSale> sales);
}
