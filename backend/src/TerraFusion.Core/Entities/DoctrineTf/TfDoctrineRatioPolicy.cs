using System;

namespace TerraFusion.Core.Entities.DoctrineTf;

/// <summary>
/// SYNC-DOCTRINE-1 (B1): year-aware, source-aware, evidence-backed
/// sales-ratio qualification policy. The doctrine layer.
///
/// <para>Replaces hardcoded ratio constants in promoters with rows.
/// A canonical sale's "qualified" status is no longer a single
/// boolean — it is the evaluation of one or more rules drawn from
/// this table, scoped by county + study + sale-year window.</para>
///
/// <para>Two studies are modeled in Benton (per the operator):</para>
/// <list type="bullet">
///   <item><c>StudyName = "DOR"</c> — Washington Department of
///   Revenue ratio study. <c>SourceField = "sale.sl_ratio_type_cd"</c>;
///   <c>QualifiedCodesCsv = "00"</c>; effective always (no end year).</item>
///   <item><c>StudyName = "BENTON_INTERNAL"</c> — Benton County's
///   own internal ratio study, started ~2018.
///   <c>SourceField = "sale.sl_county_ratio_cd"</c>;
///   <c>QualifiedCodesCsv = "100"</c> for the post-2017 modern era
///   (and <c>"0"</c> for pre-2017 legacy "VALID SALE" entries
///   per <c>dbo.county_ratio_code</c>).</item>
/// </list>
///
/// <para>Lookup contract (see
/// <c>IRatioQualificationPolicy.EvaluateAsync</c>):</para>
/// <list type="number">
///   <item>Filter rules WHERE County = X AND StudyName = Y
///   AND EffectiveStartYear &lt;= saleYear
///   AND (EffectiveEndYear IS NULL OR EffectiveEndYear &gt;= saleYear).</item>
///   <item>Pick most-specific (smallest year window) match.</item>
///   <item>If <paramref>code</paramref> is null → Reviewed=false,
///   Qualified=false.</item>
///   <item>Else Reviewed=true; Qualified = (code IN QualifiedCodes
///   AND code NOT IN ExcludedCodes).</item>
/// </list>
///
/// <para>Constitutional principle (operator, 2026-05-06):
/// "Transport gates can be green. Doctrine gates are not green
/// until policy is explicit, versioned, and evidence-backed."
/// Every row in this table MUST carry <see cref="EvidenceSource"/>
/// (a citation), <see cref="Confidence"/>, and (for production-
/// active rules) <see cref="ApprovedBy"/>.</para>
/// </summary>
public sealed class TfDoctrineRatioPolicy
{
    /// <summary>Surrogate primary key.</summary>
    public Guid RuleId { get; set; } = Guid.NewGuid();

    /// <summary>
    /// County scope. Lowercase-hyphenated. e.g. "benton-wa".
    /// Required.
    /// </summary>
    public string County { get; set; } = string.Empty;

    /// <summary>
    /// First sale year (YEAR(sale.sl_dt)) for which the rule
    /// applies. Inclusive.
    /// </summary>
    public int EffectiveStartYear { get; set; }

    /// <summary>
    /// Last sale year for which the rule applies. Inclusive.
    /// NULL = "rule still in effect (no scheduled retirement)".
    /// </summary>
    public int? EffectiveEndYear { get; set; }

    /// <summary>
    /// Closed vocabulary identifying the ratio-study program:
    /// <c>'DOR'</c> | <c>'BENTON_INTERNAL'</c>.
    /// </summary>
    public string StudyName { get; set; } = string.Empty;

    /// <summary>
    /// PACS source field this rule queries. Free-text in v1
    /// (e.g. <c>"sale.sl_ratio_type_cd"</c>,
    /// <c>"sale.sl_county_ratio_cd"</c>). A future v2 may move to
    /// a closed vocabulary.
    /// </summary>
    public string SourceField { get; set; } = string.Empty;

    /// <summary>
    /// Comma-separated qualified-code values. Empty string means
    /// no codes qualify (rule documents an explicit "nothing
    /// qualifies under this study in this year window" stance).
    /// Comparison is ordinal-exact, post-trim.
    /// </summary>
    public string QualifiedCodesCsv { get; set; } = string.Empty;

    /// <summary>
    /// Comma-separated explicitly-excluded codes. Used for
    /// documentation and as a defensive "definitely not qualified"
    /// filter. A code in both Qualified and Excluded resolves as
    /// Excluded (Excluded wins). Same comparison rules.
    /// </summary>
    public string ExcludedCodesCsv { get; set; } = string.Empty;

    /// <summary>
    /// Optional canonical SQL fragment expressing the rule, for
    /// documentation. e.g. <c>"s.sl_ratio_type_cd = '00'"</c>.
    /// Not auto-executed; the promoter applies the in-memory
    /// evaluation defined above.
    /// </summary>
    public string? SqlFragment { get; set; }

    /// <summary>Why this rule exists. Free-text.</summary>
    public string? Reason { get; set; }

    /// <summary>
    /// Citation: where the rule comes from. Required for HIGH
    /// confidence rules. e.g. <c>"E:\PACS\...\Sales Ratio (use top one).txt:70"</c>,
    /// <c>"Harris support email 2017-X-Y"</c>,
    /// <c>"dbo.county_ratio_code['100'] = 'Valid Sale'"</c>.
    /// </summary>
    public string? EvidenceSource { get; set; }

    /// <summary>
    /// Closed vocabulary: <c>'HIGH'</c> | <c>'MED'</c> | <c>'LOW'</c>.
    /// HIGH means "verified against operator-authored query and live
    /// data distribution"; LOW means "best-guess pending evidence".
    /// </summary>
    public string Confidence { get; set; } = "MED";

    /// <summary>Operator who signed off. e.g. "operator-bsval".</summary>
    public string? ApprovedBy { get; set; }

    /// <summary>Timestamp of operator sign-off.</summary>
    public DateTime? ApprovedAt { get; set; }

    /// <summary>Free-text notes for future maintainers.</summary>
    public string? Notes { get; set; }

    // ── Audit fields (auto-populated by AuditableEntityInterceptor) ────
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }
}
