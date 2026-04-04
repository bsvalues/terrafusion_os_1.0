namespace TerraFusion.API.Services;

using Microsoft.EntityFrameworkCore;
using DataDbContext = TerraFusion.Data.TerraFusionDbContext;

/// <summary>
/// TerraFusion's authoritative sale qualification engine for IAAO ratio studies.
///
/// Four-layer decision hierarchy (first non-null layer wins):
///
///   Layer 1 — PACS SaleQualifier (sl_qualifier)
///     Harris standard codes set at sale entry time. Benton may leave blank → fall through.
///
///   Layer 2 — SaleCountyRatioCd (sl_county_ratio_cd) ← THE KEY LAYER FOR BENTON
///     Benton's own explicit per-sale judgment applied during ratio study prep.
///     Code is looked up in dbo.county_ratio_code for its description.
///     This is the county's direct answer to "qualified or not" — highest local authority.
///
///   Layer 2b — WA DOR Ratio Type (sl_ratio_type_cd)
///     State DOR code. Looked up in dbo.sale_ratio_type via InvalidSale flag.
///     If invalid_sale = true for this code → sale is disqualified per DOR.
///     This is authoritative for state ratio study eligibility.
///
///   Layer 3 — SalesExcludeCalcCd (sales_exclude_calc_cd)
///     Explicit flag to suppress a sale from ratio calculations. Non-empty → excluded.
///
///   Layer 4 — WacCd (wac_cd — WAC 458-61A)
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
    private readonly DataDbContext _db;

    public SaleQualificationService(DataDbContext db)
    {
        _db = db;
    }

    /// <inheritdoc/>
    /// <remarks>
    /// This overload is for single-sale use without DB access (e.g., sync-time quick check).
    /// It does NOT consult dbo.sale_ratio_type or dbo.county_ratio_code — it operates on
    /// raw codes only. For FK-aware qualification, use <see cref="ComputeRecommendationsAsync"/>.
    /// </remarks>
    public string Qualify(
        string? rawSaleQualifier,
        string? rawCountyRatioCd,
        string? rawExcludeCalcCd,
        string? rawWacCd)
        => QualifyWithLookups(
            rawSaleQualifier,
            rawCountyRatioCd,
            rawExcludeCalcCd,
            rawWacCd,
            ratioTypeCd: null,
            invalidRatioTypeCodes: null,
            countyRatioDescriptions: null);

    /// <summary>
    /// FK-aware qualification. Uses pre-fetched PACS lookup table data so every code
    /// is resolved against the real county_ratio_code and sale_ratio_type tables rather
    /// than hardcoded string guesses.
    /// </summary>
    private static string QualifyWithLookups(
        string? rawSaleQualifier,
        string? rawCountyRatioCd,
        string? rawExcludeCalcCd,
        string? rawWacCd,
        string? ratioTypeCd,
        HashSet<string>? invalidRatioTypeCodes,
        Dictionary<string, string>? countyRatioDescriptions)
    {
        // ── Layer 1: PACS SaleQualifier (sl_qualifier) ────────────────────────
        var upper = rawSaleQualifier?.Trim().ToUpperInvariant();
        switch (upper)
        {
            case "Q" or "1" or "VALID":            return "qualified";
            case "U" or "N":                        return "non-arms-length";
            case "E" or "FC" or "FORECLOSURE":      return "foreclosure";
            case "A" or "ESTATE" or "EST":          return "estate";
        }

        // ── Layer 2: Benton County ratio code (sl_county_ratio_cd) ────────────
        // Resolve against dbo.county_ratio_code when lookup data available.
        var countyCode = rawCountyRatioCd?.Trim().ToUpperInvariant();
        if (!string.IsNullOrEmpty(countyCode))
        {
            // If we have DB lookup data, use the description to classify
            if (countyRatioDescriptions != null && countyRatioDescriptions.TryGetValue(countyCode, out var desc))
            {
                var d = desc.ToUpperInvariant();
                if (d.Contains("QUAL") && !d.Contains("UNQUAL") && !d.Contains("NON"))
                    return "qualified";
                if (d.Contains("UNQUAL") || d.Contains("NON") || d.Contains("INVALID"))
                    return "non-arms-length";
                if (d.Contains("EXCLUDE") || d.Contains("EXCL"))
                    return "excluded";
                if (d.Contains("FORECLOS") || d.Contains("BANK"))
                    return "foreclosure";
                if (d.Contains("ESTATE") || d.Contains("PROBATE"))
                    return "estate";
                // Unknown description → conservative
                return "non-arms-length";
            }
            // Fallback when lookup table not loaded (e.g., sync-time fast path)
            return "non-arms-length";
        }

        // ── Layer 2b: WA DOR ratio type (sl_ratio_type_cd) ────────────────────
        // Consult sale_ratio_type.invalid_sale rather than hardcoding "00" as the only valid code.
        var rtCode = ratioTypeCd?.Trim().ToUpperInvariant();
        if (!string.IsNullOrEmpty(rtCode) && invalidRatioTypeCodes != null)
        {
            if (invalidRatioTypeCodes.Contains(rtCode))
                return "non-arms-length";  // DOR has flagged this code as an invalid sale
            // Code exists and is NOT in the invalid set → DOR-qualified
            return "qualified";
        }

        // ── Layer 3: Ratio study exclusion flag (sales_exclude_calc_cd) ────────
        if (!string.IsNullOrWhiteSpace(rawExcludeCalcCd))
            return $"excluded: {rawExcludeCalcCd.Trim()}";

        // ── Layer 4: WAC 458-61A state excise code (wac_cd) ───────────────────
        // Empty WacCd = standard REET-taxable transaction = arms-length qualified.
        // TODO(WacCd): Replace with Benton-specific code list once confirmed with Bill Spencer.
        if (!string.IsNullOrWhiteSpace(rawWacCd))
            return $"exempt: {rawWacCd.Trim()}";

        // ── Layer 5: Default ───────────────────────────────────────────────────
        return "qualified";
    }

    /// <inheritdoc/>
    public void ComputeRecommendations(IEnumerable<TerraFusion.Core.Entities.ComparableSale> sales)
    {
        foreach (var sale in sales)
        {
            sale.QualificationRecommendation = Qualify(
                sale.RawSaleQualifier,
                sale.RawCountyRatioCd,
                sale.RawExcludeCalcCd,
                sale.RawWacCd);
            sale.RecommendationReason = BuildRecommendationReason(
                sale.RawSaleQualifier,
                sale.RawCountyRatioCd,
                sale.RawExcludeCalcCd,
                sale.RawWacCd,
                ratioTypeCd: null);
            sale.RecommendationSource = "TerraFusionRuleEngine";
            sale.RecommendationVersion = "1.0";
        }
    }

    private static string BuildRecommendationReason(
        string? rawSaleQualifier,
        string? rawCountyRatioCd,
        string? rawExcludeCalcCd,
        string? rawWacCd,
        string? ratioTypeCd)
    {
        if (!string.IsNullOrWhiteSpace(rawSaleQualifier))
            return $"Layer 1: PACS SaleQualifier={rawSaleQualifier.Trim().ToUpperInvariant()}";
        if (!string.IsNullOrWhiteSpace(rawCountyRatioCd))
            return $"Layer 2: CountyRatioCd={rawCountyRatioCd.Trim().ToUpperInvariant()} (county_ratio_code FK)";
        if (!string.IsNullOrWhiteSpace(ratioTypeCd))
            return $"Layer 2b: DOR RatioTypeCd={ratioTypeCd.Trim().ToUpperInvariant()} (sale_ratio_type.invalid_sale FK)";
        if (!string.IsNullOrWhiteSpace(rawExcludeCalcCd))
            return $"Layer 3: ExcludeCalcCd={rawExcludeCalcCd.Trim()}";
        if (!string.IsNullOrWhiteSpace(rawWacCd))
            return $"Layer 4: WacCd={rawWacCd.Trim()}";
        return "Layer 5: Default — no disqualifying codes present";
    }

    /// <inheritdoc/>
    public async Task<int> ComputeRecommendationsAsync(Guid countyId, CancellationToken ct = default)
    {
        var sales = await _db.ComparableSales
            .Where(s => s.CountyId == countyId)
            .ToListAsync(ct);

        // ── FK lookup: sale_ratio_type (dbo.sale_ratio_type) ──────────────────
        // Load which DOR ratio type codes are flagged as invalid sales.
        // This replaces the hardcoded assumption that only "00" is valid.
        var invalidRatioTypeCodeList = await _db.SaleRatioTypes
            .Where(r => r.InvalidSale)
            .Select(r => r.SlRatioTypeCd.Trim().ToUpper())
            .ToListAsync(ct);
        var invalidRatioTypeCodes = new HashSet<string>(invalidRatioTypeCodeList, StringComparer.OrdinalIgnoreCase);

        // ── FK lookup: county_ratio_code (dbo.county_ratio_code) ──────────────
        // Load Benton County's own code descriptions so we can classify by description
        // rather than hardcoding unknown code values like "Q", "QA", "1".
        var countyRatioDescriptions = await _db.CountyRatioCodes
            .ToDictionaryAsync(
                r => r.RatioCd.Trim().ToUpper(),
                r => r.RatioDesc ?? string.Empty,
                ct);

        foreach (var sale in sales)
        {
            sale.QualificationRecommendation = QualifyWithLookups(
                sale.RawSaleQualifier,
                sale.RawCountyRatioCd,
                sale.RawExcludeCalcCd,
                sale.RawWacCd,
                sale.RawRatioTypeCd,
                invalidRatioTypeCodes,
                countyRatioDescriptions);
            sale.RecommendationReason = BuildRecommendationReason(
                sale.RawSaleQualifier,
                sale.RawCountyRatioCd,
                sale.RawExcludeCalcCd,
                sale.RawWacCd,
                sale.RawRatioTypeCd);
            sale.RecommendationSource = "TerraFusionRuleEngine";
            sale.RecommendationVersion = "1.1"; // bump: now FK-aware
        }

        await _db.SaveChangesAsync(ct);
        return sales.Count;
    }
}

