using System.Collections.Generic;

namespace TerraFusion.Core.Sync.Doctrine;

/// <summary>
/// SYNC-DOCTRINE-2 (B2): static snapshot of Benton County's
/// <c>dbo.county_ratio_code</c> dictionary. Used by the sale truth
/// promoter to populate
/// <see cref="TerraFusion.Core.Entities.TruthPacs.TruthPacsSale.CountyRatioDescription"/>
/// without re-querying PACS per row.
///
/// <para>Snapshot taken 2026-05-06 against tf-mssql / pacs_oltp:</para>
/// <code>
/// SELECT ratio_cd, ratio_desc FROM dbo.county_ratio_code ORDER BY ratio_cd
/// </code>
///
/// <para>Per the operator's "no doctrine widening in B2" directive,
/// this is a code constant rather than a doctrine table. If the PACS
/// dictionary changes upstream, update this constant and ship a
/// new build. A future SYNC-DOCTRINE-3 may move this to a governed
/// doctrine table; not in B2 scope.</para>
/// </summary>
public static class CountyRatioCodebook
{
    private static readonly IReadOnlyDictionary<string, string> Codes =
        new Dictionary<string, string>(System.StringComparer.Ordinal)
        {
            // Legacy ALL-CAPS codebook (pre-2017 conversion era).
            ["0"] = "VALID SALE",
            ["1"] = "FAMILY-SALE BETWEEN RELATIVES",
            ["3"] = "ADMIN/GRDN/EXECUTOR OF ESTATE",
            ["6"] = "TAX DEED",
            ["9"] = "QUIT CLAIM DEED",
            ["10"] = "GIFT DEED, LOVE & AFFECTION",
            ["11"] = "PACD OR SACD TRANSFER OF INT",
            ["12"] = "CORRECTION DEED",
            ["14"] = "DEEDS INVOLVING PARTIAL INT",
            ["15"] = "FORCED SALE",
            ["16"] = "EASEMENTS OR RIGHT OF WAYS",
            ["18"] = "PROP PHYSICALLY IMP AFTER SALE",
            ["23"] = "LEASE-ASSIGNMENT,OPTION,LSHLD",
            ["24"] = "DESIGNATED O/S(AS OF SALE DT)",
            ["27"] = "OTHER",
            ["28"] = "MULTI-PARCELS",
            ["30"] = "NOT VERIFIED",

            // Modern mixed-case codebook (post-2017 conversion era).
            ["100"] = "Valid Sale",
            ["200"] = "Invalid Sale",
            ["300"] = "Land Only Sale",
            ["400"] = "Omitted Current Year; Review",
            ["500"] = "Dark Sales (Commercial)",
        };

    /// <summary>
    /// Look up the human-readable description for a county ratio
    /// code. Returns NULL if the code is null/empty/unknown — the
    /// promoter writes that NULL through to truth_pacs.sale verbatim.
    /// </summary>
    public static string? Describe(string? code)
    {
        if (string.IsNullOrWhiteSpace(code)) return null;
        return Codes.TryGetValue(code.Trim(), out var desc) ? desc : null;
    }

    /// <summary>Total codes in this snapshot (22 as of 2026-05-06).</summary>
    public static int Count => Codes.Count;
}
