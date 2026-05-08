using System;

namespace TerraFusion.Core.Entities.DoctrineTf;

/// <summary>
/// SYNC-DOCTRINE-5: year-aware, evidence-backed sales qualification
/// codes table. Companion to <see cref="TfDoctrineRatioPolicy"/> —
/// where the ratio policy table models named studies (DOR_RATIO,
/// COUNTY_INTERNAL_RATIO, LEGACY_CODEBOOK_VALID) keyed by county +
/// study + year window, this table indexes the same domain by
/// <em>doctrine vocabulary surface</em> (DOR_RATIO | COUNTY_RATIO)
/// and the underlying PACS column (<c>sl_county_ratio_cd</c> |
/// <c>sl_ratio_type_cd</c>).
///
/// <para>The operator's prescription
/// (reference_benton_sync_doctrine_corrections.md) calls for four
/// doctrine-* tables:
/// {sales, improvement, property_universe, ratio_policy}. The
/// ratio_policy table (D1) and the property_universe + attribute
/// dictionary tables (D4) are already shipped; this slice (D5) adds
/// the missing <c>sales</c> doctrine table so audit tooling can
/// answer "what qualified codes does Benton consider valid for which
/// surface, in which year window?" without grepping promoter source.
/// </para>
///
/// <para>Critical Benton-specific facts encoded by this table
/// (per the operator's 2026-05-06 corrections):</para>
/// <list type="bullet">
///   <item><c>SurfaceCode = "DOR_RATIO"</c> /
///   <c>SourceField = "sl_county_ratio_cd"</c> / years 2017+ /
///   QualifiedCodes = ["100"] — post-2017 PACS DOR ratio convention.</item>
///   <item><c>SurfaceCode = "DOR_RATIO"</c> /
///   <c>SourceField = "sl_county_ratio_cd"</c> / years 1990-2016 /
///   QualifiedCodes = ["0"] — pre-2017 legacy carryover ('0' meant
///   "Valid Sale" in the legacy <c>county_ratio_code</c> codebook).</item>
///   <item><c>SurfaceCode = "COUNTY_RATIO"</c> /
///   <c>SourceField = "sl_ratio_type_cd"</c> / years 2018+ /
///   QualifiedCodes = ["00"] — county started using its own ratio
///   for internal studies ~2018.</item>
/// </list>
///
/// <para>Lookup contract: callers filter
/// <c>WHERE EffectiveStartYear &lt;= year AND
/// (EffectiveEndYear IS NULL OR EffectiveEndYear &gt;= year)
/// AND ActiveFlag = true</c>, optionally narrowed by SurfaceCode or
/// SourceField. The most-specific (smallest year window) match wins.
/// </para>
///
/// <para>Constitutional principle (operator, 2026-05-06):
/// "Transport gates can be green. Doctrine gates are not green
/// until policy is explicit, versioned, and evidence-backed."
/// Every row carries <see cref="EvidenceSource"/> and
/// <see cref="Confidence"/>; soft-disable via
/// <see cref="ActiveFlag"/> rather than DELETE so the audit trail
/// survives.</para>
/// </summary>
public sealed class TfDoctrineSalesQualificationCode
{
    /// <summary>Surrogate primary key.</summary>
    public Guid RuleId { get; set; } = Guid.NewGuid();

    /// <summary>
    /// Doctrine vocabulary surface this rule belongs to:
    /// <c>"DOR_RATIO"</c> (Washington Department of Revenue ratio
    /// study) | <c>"COUNTY_RATIO"</c> (Benton internal ratio study).
    /// Closed vocab.
    /// </summary>
    public string SurfaceCode { get; set; } = string.Empty;

    /// <summary>
    /// The PACS column this rule applies to:
    /// <c>"sl_county_ratio_cd"</c> | <c>"sl_ratio_type_cd"</c>.
    /// Free-text in v1; future v2 may move to closed vocab.
    /// </summary>
    public string SourceField { get; set; } = string.Empty;

    /// <summary>
    /// Year boundary: rule applies to PACS sales with
    /// <c>prop_val_yr &gt;= EffectiveStartYear</c>. Inclusive.
    /// </summary>
    public short EffectiveStartYear { get; set; }

    /// <summary>
    /// Year boundary: rule applies to <c>prop_val_yr &lt;=
    /// EffectiveEndYear</c>. Inclusive end. NULL = open-ended
    /// ("rule still in effect").
    /// </summary>
    public short? EffectiveEndYear { get; set; }

    /// <summary>
    /// JSON array of qualified codes for this
    /// (Surface, SourceField, year-range) tuple. e.g. <c>["100"]</c>,
    /// <c>["00"]</c>, <c>["0"]</c>. Empty array = "no codes qualify
    /// under this surface in this year window".
    /// </summary>
    public string QualifiedCodesJson { get; set; } = "[]";

    /// <summary>
    /// Free-text evidence: WAC ref, DOR memo URL, operator-email
    /// subject, codebook citation, etc. Required for HIGH confidence.
    /// </summary>
    public string EvidenceSource { get; set; } = string.Empty;

    /// <summary>
    /// Closed vocabulary: <c>'HIGH'</c> | <c>'MEDIUM'</c> |
    /// <c>'LOW'</c>. HIGH = formal WAC/DOR ref. MEDIUM = operator
    /// confirmation. LOW = inferred.
    /// </summary>
    public string Confidence { get; set; } = "MEDIUM";

    /// <summary>Soft-disable knob; lookups skip rules with <c>ActiveFlag = false</c>.</summary>
    public bool ActiveFlag { get; set; } = true;

    // ── Audit fields (auto-populated by AuditableEntityInterceptor) ────
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }
}
