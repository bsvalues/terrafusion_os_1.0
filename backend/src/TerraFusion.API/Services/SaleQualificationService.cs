namespace TerraFusion.API.Services;

using Microsoft.EntityFrameworkCore;
using TerraFusion.Core.Entities.Pacs;
using DataDbContext = TerraFusion.Data.TerraFusionDbContext;

/// <summary>
/// County-only sale qualification engine for IAAO / WA county ratio studies.
///
/// ARCHITECTURAL NOTE:
///   County ratio code (sl_county_ratio_cd) and DOR ratio type (sl_ratio_type_cd) are
///   INDEPENDENT classification systems for INDEPENDENT purposes:
///     - County ratio code → Benton County's own ratio study (CostForge / TerraForge)
///     - DOR ratio type    → Washington State statewide ratio report (separate output)
///   Neither overrides the other. This service handles county-only qualification.
///   DOR ratio type is stored as RawRatioTypeCd on ComparableSale for state reporting use.
///
/// Four-layer decision hierarchy for county qualification (first applicable layer wins):
///
///   Layer 1 — PACS SaleQualifier (sl_qualifier)
///     Harris standard codes set at sale entry time.
///     Benton often leaves blank for modern sales → falls through to county code.
///
///   Layer 2 — County Ratio Code (sl_county_ratio_cd)  ← PRIMARY AUTHORITY FOR BENTON
///     The county's own per-sale judgment applied during ratio study prep.
///     Resolved against CountyRatioCodes table when available.
///     Benton codes: 100/0 = Valid Sale, 200 = Invalid, 300 = Land Only,
///                   400 = Omitted/Review, 500 = Dark (Commercial).
///
///   Layer 3 — Exclude-Calc Flag (sales_exclude_calc_cd)
///     Explicit flag to suppress a sale from ratio calculations.
///
///   Layer 4 — WAC 458-61A Excise Exemption (wac_cd)
///     Empty = standard REET-taxable arms-length sale.
///     Non-empty = buyer claimed REET exemption on affidavit → treat as exempt.
///     Inactive WAC codes (retired exemptions) → treat as qualified.
///
///   Layer 5 — Default
///     No codes, no flags → qualified (standard arms-length market sale).
/// </summary>
public sealed class SaleQualificationService : ISaleQualificationService
{
    private readonly DataDbContext _db;

    public SaleQualificationService(DataDbContext db)
    {
        _db = db;
    }

    /// <inheritdoc/>
    public string Qualify(
        string? rawSaleQualifier,
        string? rawCountyRatioCd,
        string? rawExcludeCalcCd,
        string? rawWacCd)
        => QualifyForCounty(
            rawSaleQualifier,
            rawCountyRatioCd,
            rawExcludeCalcCd,
            rawWacCd,
            countyRatioDescriptions: null,
            reetWacCodes: null);

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
            sale.RecommendationReason   = BuildRecommendationReason(sale);
            sale.RecommendationSource   = "TerraFusionRuleEngine";
            sale.RecommendationVersion  = "2.0";
        }
    }

    /// <inheritdoc/>
    public async Task<int> ComputeRecommendationsAsync(Guid countyId, CancellationToken ct = default)
    {
        var sales = await _db.ComparableSales
            .Where(s => s.CountyId == countyId)
            .ToListAsync(ct);

        // County ratio code descriptions — county-agnostic FK lookup.
        // Allows correct classification of non-Benton county codes without hardcoding.
        // NOTE: DOR SaleRatioTypes are NOT loaded here — state reporting is out of scope.
        var countyRatioDescriptions = await _db.CountyRatioCodes
            .ToDictionaryAsync(
                r => r.RatioCd.Trim().ToUpper(),
                r => r.RatioDesc ?? string.Empty,
                ct);

        // WAC 458-61A exemption codes — distinguish active exemptions from retired codes.
        var reetWacCodes = await _db.ReetWacCodes
            .ToDictionaryAsync(
                w => w.WacCd.Trim().ToUpperInvariant(),
                w => w,
                ct);

        foreach (var sale in sales)
        {
            sale.QualificationRecommendation = QualifyForCounty(
                sale.RawSaleQualifier,
                sale.RawCountyRatioCd,
                sale.RawExcludeCalcCd,
                sale.RawWacCd,
                countyRatioDescriptions,
                reetWacCodes);
            sale.RecommendationReason   = BuildRecommendationReason(sale);
            sale.RecommendationSource   = "TerraFusionRuleEngine";
            sale.RecommendationVersion  = "2.0";
        }

        await _db.SaveChangesAsync(ct);
        return sales.Count;
    }

    // ── Core qualification logic ──────────────────────────────────────────────

    private static string QualifyForCounty(
        string? rawSaleQualifier,
        string? rawCountyRatioCd,
        string? rawExcludeCalcCd,
        string? rawWacCd,
        Dictionary<string, string>? countyRatioDescriptions,
        Dictionary<string, PacsReetWacCode>? reetWacCodes)
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
        // This is the county's authoritative answer for its own ratio study.
        // DOR ratio type (sl_ratio_type_cd) is NOT consulted here — that is state
        // reporting metadata and is stored separately on RawRatioTypeCd.
        var countyCode = rawCountyRatioCd?.Trim().ToUpperInvariant();
        if (!string.IsNullOrEmpty(countyCode))
        {
            // FK-aware path: use county_ratio_code description when loaded.
            // Matches on keywords in the description so any county's codes work.
            if (countyRatioDescriptions != null && countyRatioDescriptions.TryGetValue(countyCode, out var desc))
            {
                var d = desc.ToUpperInvariant();
                if (d.Contains("VALID") && !d.Contains("INVALID"))  return "qualified";
                if (d.Contains("LAND ONLY") || d.Contains("LAND-ONLY")) return "land-only";
                if (d.Contains("OMIT"))                              return "omitted";
                if (d.Contains("DARK") || d.Contains("COMMERCIAL")) return "dark-sale";
                // Any other description with a county code → conservative
                return "non-arms-length";
            }

            // Hardcoded Benton fallback — confirmed from live PACS query 2026-04-04.
            return countyCode switch
            {
                "100" => "qualified",       // Valid Sale          (21,715 sales)
                "0"   => "qualified",       // VALID SALE legacy   (   219 sales)
                "200" => "non-arms-length", // Invalid Sale        (10,445 sales)
                "300" => "land-only",       // Land Only Sale      ( 3,363 sales)
                "400" => "omitted",         // Omitted / Review    (   557 sales)
                "500" => "dark-sale",       // Dark (Commercial)   (    33 sales)
                _     => "non-arms-length"  // Unknown → conservative
            };
        }

        // ── Layer 3: Ratio study exclusion flag (sales_exclude_calc_cd) ───────
        if (!string.IsNullOrWhiteSpace(rawExcludeCalcCd))
            return "excluded";

        // ── Layer 4: WAC 458-61A excise exemption code (wac_cd) ───────────────
        // Empty = standard REET-taxable transaction = arms-length.
        // Non-empty = exemption claimed on affidavit → exempt (not arms-length).
        // Inactive codes are retired exemptions → no active exemption applies → qualified.
        if (!string.IsNullOrWhiteSpace(rawWacCd))
        {
            var normalizedWac = rawWacCd.Trim().ToUpperInvariant();
            if (reetWacCodes != null && reetWacCodes.TryGetValue(normalizedWac, out var wacEntry))
            {
                if (wacEntry.Inactive) return "qualified"; // retired code — no exemption in force
                var wacTrimmed = rawWacCd.Trim();
                return wacTrimmed.Length > 22 ? "exempt" : $"exempt: {wacTrimmed}";
            }
            var wac = rawWacCd.Trim();
            return wac.Length > 22 ? "exempt" : $"exempt: {wac}";
        }

        // ── Layer 5: Default ───────────────────────────────────────────────────
        // No codes, no flags → standard arms-length market sale.
        return "qualified";
    }

    private static string BuildRecommendationReason(TerraFusion.Core.Entities.ComparableSale sale)
    {
        if (!string.IsNullOrWhiteSpace(sale.RawSaleQualifier))
            return $"L1: SaleQualifier={sale.RawSaleQualifier.Trim().ToUpperInvariant()}";
        if (!string.IsNullOrWhiteSpace(sale.RawCountyRatioCd))
            return $"L2: CountyRatioCd={sale.RawCountyRatioCd.Trim().ToUpperInvariant()}";
        if (!string.IsNullOrWhiteSpace(sale.RawExcludeCalcCd))
            return $"L3: ExcludeCalcCd={sale.RawExcludeCalcCd.Trim()}";
        if (!string.IsNullOrWhiteSpace(sale.RawWacCd))
            return $"L4: WacCd={sale.RawWacCd.Trim()}";
        return "L5: Default — no disqualifying codes present";
    }
}
