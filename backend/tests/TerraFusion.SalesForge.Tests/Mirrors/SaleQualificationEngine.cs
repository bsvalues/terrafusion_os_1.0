namespace TerraFusion.SalesForge.Tests.Mirrors;

/// <summary>
/// Mirror of the 5-layer sale qualification logic from TerraFusion.API.Services.SaleQualificationService.
/// Used for unit testing without referencing the full API project (which triggers OOM on TerraFusion.Data).
/// This MUST stay in sync with the production implementation.
/// </summary>
public static class SaleQualificationEngine
{
    /// <summary>
    /// 5-layer qualification logic — mirrors SaleQualificationService.Qualify().
    /// </summary>
    public static string Qualify(
        string? rawSaleQualifier,
        string? rawCountyRatioCd,
        string? rawExcludeCalcCd,
        string? rawWacCd)
    {
        // ── Layer 1: PACS SaleQualifier (sl_qualifier) ────────────────────────
        var qual = rawSaleQualifier?.Trim().ToUpperInvariant();
        switch (qual)
        {
            case "Q" or "1" or "VALID":         return "qualified";
            case "U" or "N":                    return "non-arms-length";
            case "E" or "FC" or "FORECLOSURE":  return "foreclosure";
            case "A" or "ESTATE" or "EST":      return "estate";
        }

        // ── Layer 2: County ratio code (sl_county_ratio_cd) ───────────────────
        var countyCode = rawCountyRatioCd?.Trim().ToUpperInvariant();
        if (!string.IsNullOrEmpty(countyCode))
        {
            return countyCode switch
            {
                "100" => "qualified",
                "0"   => "qualified",
                "200" => "non-arms-length",
                "300" => "land-only",
                "400" => "omitted",
                "500" => "dark-sale",
                _     => "non-arms-length"
            };
        }

        // ── Layer 3: Ratio study exclusion flag (sales_exclude_calc_cd) ───────
        if (!string.IsNullOrWhiteSpace(rawExcludeCalcCd))
            return "excluded";

        // ── Layer 4: WAC 458-61A excise exemption code (wac_cd) ───────────────
        if (!string.IsNullOrWhiteSpace(rawWacCd))
        {
            var wac = rawWacCd.Trim();
            return wac.Length > 22 ? "exempt" : $"exempt: {wac}";
        }

        // ── Layer 5: Default ───────────────────────────────────────────────────
        return "qualified";
    }
}
