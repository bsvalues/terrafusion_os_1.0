namespace TerraFusion.API.Services;

/// <summary>
/// TerraFusion's authoritative sale qualification engine for IAAO ratio studies.
///
/// Four-layer decision hierarchy (first non-null layer wins):
///
///   Layer 1 — PACS SaleQualifier
///     Harris standard codes set at sale entry time. Benton may leave blank → fall through.
///
///   Layer 2 — SaleCountyRatioCd  ← THE KEY LAYER FOR BENTON
///     Benton's own explicit per-sale judgment applied during ratio study prep.
///     This is the county's direct answer to "qualified or not" — highest local authority.
///
///   Layer 3 — SalesExcludeCalcCd
///     Explicit flag to suppress a sale from ratio calculations. Non-empty → excluded.
///
///   Layer 4 — WacCd (WAC 458-61A)
///     State excise tax exemption code. Empty = standard REET-taxable = arms-length.
///     Non-empty = exemption claimed on affidavit → treat as potentially exempt.
///     TODO(WacCd): Once Bill Spencer provides the Benton-specific WAC code list that
///     are genuine arms-length (vs. true exemptions), replace the blanket "exempt"
///     fallback with an allowlist/denylist lookup.
///
///   Layer 5 — Default
///     No codes present → qualified (standard market sale, no flags raised).
/// </summary>
public sealed class SaleQualificationService : ISaleQualificationService
{
    /// <inheritdoc/>
    public string Qualify(
        string? rawSaleQualifier,
        string? rawCountyRatioCd,
        string? rawExcludeCalcCd,
        string? rawWacCd)
    {
        // ── Layer 1: PACS SaleQualifier ────────────────────────────────────────
        var upper = rawSaleQualifier?.Trim().ToUpperInvariant();
        switch (upper)
        {
            case "Q" or "1" or "VALID":            return "qualified";
            case "U" or "N":                        return "non-arms-length";
            case "E" or "FC" or "FORECLOSURE":      return "foreclosure";
            case "A" or "ESTATE" or "EST":          return "estate";
        }

        // ── Layer 2: Benton County ratio code ─────────────────────────────────
        var county = rawCountyRatioCd?.Trim().ToUpperInvariant();
        if (!string.IsNullOrEmpty(county))
        {
            return county switch
            {
                "Q" or "QA" or "1"       => "qualified",
                "U" or "UNQ"             => "non-arms-length",
                "E" or "EX" or "EXC"     => "excluded",
                _                        => "non-arms-length"   // unknown county code → conservative
            };
        }

        // ── Layer 3: Ratio study exclusion flag ────────────────────────────────
        if (!string.IsNullOrWhiteSpace(rawExcludeCalcCd))
            return $"excluded: {rawExcludeCalcCd.Trim()}";

        // ── Layer 4: WAC 458-61A state excise code ─────────────────────────────
        // Empty WacCd = standard REET-taxable transaction = arms-length qualified.
        // Non-empty WacCd = excise tax exemption code on the REET affidavit.
        // TODO(WacCd): Replace with Benton-specific code list once confirmed with Bill Spencer.
        if (!string.IsNullOrWhiteSpace(rawWacCd))
            return $"exempt: {rawWacCd.Trim()}";

        // ── Layer 5: Default ───────────────────────────────────────────────────
        return "qualified";
    }

    /// <inheritdoc/>
    public void RequalifyAll(IEnumerable<TerraFusion.Core.Entities.ComparableSale> sales)
    {
        foreach (var sale in sales)
        {
            sale.SaleQualification = Qualify(
                sale.RawSaleQualifier,
                sale.RawCountyRatioCd,
                sale.RawExcludeCalcCd,
                sale.RawWacCd);
        }
    }
}
