using System;

namespace TerraFusion.Core.Entities.DoctrineTf;

/// <summary>
/// SYNC-DOCTRINE-4: year-aware, evidence-backed property-universe
/// classification rule. The doctrine layer that replaces the
/// implicit "real-residential by default" assumption baked into the
/// previous improvement promoter.
///
/// <para>Each row represents one rule that maps a tuple of PACS
/// property-level signals (<c>prop_type_cd</c>, <c>property_use_cd</c>,
/// <c>ag_apply</c>, <c>ag_use_cd</c>, optional legacy marker) onto
/// one of the seven universe codes. Rules are ranked by
/// <see cref="Precedence"/> (lower number = higher priority); the
/// first matching rule wins.</para>
///
/// <para>Six universes + UNKNOWN sentinel are locked in
/// <c>docs/sync/sync-doctrine-4-improvement-universe-design.md</c>:
/// REAL_RESIDENTIAL, REAL_COMMERCIAL, MOBILE_HOME, AG_CURRENT_USE,
/// PERSONAL_PROPERTY, CONVERSION_LEGACY, UNKNOWN. UNKNOWN is never
/// seeded; the classifier writes it when no rule matches.</para>
///
/// <para>Constitutional principle (operator, 2026-05-06):
/// "Transport gates can be green. Doctrine gates are not green
/// until policy is explicit, versioned, and evidence-backed."
/// Every row in this table MUST carry <see cref="EvidenceSource"/>,
/// <see cref="Confidence"/>, and (for production-active rules)
/// <see cref="ApprovedBy"/>.</para>
/// </summary>
public sealed class TfDoctrinePropertyUniverse
{
    /// <summary>Surrogate primary key.</summary>
    public Guid RuleId { get; set; } = Guid.NewGuid();

    /// <summary>County scope, lowercase-hyphenated. e.g. "benton-wa".</summary>
    public string County { get; set; } = string.Empty;

    /// <summary>First PropValYr the rule applies to (inclusive).</summary>
    public int EffectiveStartYear { get; set; }

    /// <summary>Last PropValYr the rule applies to (inclusive). NULL = "still in effect".</summary>
    public int? EffectiveEndYear { get; set; }

    /// <summary>
    /// Lower number = higher priority. The classifier walks
    /// active rules ordered by Precedence ASC and returns the
    /// first match. Locked precedence values (per design doc):
    /// 1=CONVERSION_LEGACY, 2=AG_CURRENT_USE, 3=PERSONAL_PROPERTY,
    /// 4=MOBILE_HOME, 5=REAL_COMMERCIAL, 6=REAL_RESIDENTIAL.
    /// </summary>
    public int Precedence { get; set; }

    /// <summary>
    /// Closed vocabulary from <see cref="TerraFusion.Core.Sync.Doctrine.UniverseCodes"/>.
    /// Never <c>UNKNOWN</c> — that sentinel is reserved for the
    /// classifier's no-match output, not for stored rules.
    /// </summary>
    public string UniverseCode { get; set; } = string.Empty;

    /// <summary>
    /// Comma-separated <c>prop_type_cd</c> values this rule matches.
    /// Empty / NULL = wildcard (any prop_type_cd). e.g. "R" or "P,B".
    /// </summary>
    public string? PropTypeCdCsv { get; set; }

    /// <summary>
    /// Comma-separated <c>property_use_cd</c> values relevant to
    /// <see cref="PropertyUseMode"/>. Free-text length to allow long
    /// CSV lists when tightening commercial / residential boundaries
    /// after profiling.
    /// </summary>
    public string? PropertyUseCdCsv { get; set; }

    /// <summary>
    /// How <see cref="PropertyUseCdCsv"/> participates in matching:
    /// <c>"ANY"</c> (column ignored — anything matches),
    /// <c>"INCLUDE"</c> (row's property_use_cd must be in the CSV),
    /// <c>"EXCLUDE"</c> (row's property_use_cd must NOT be in the
    /// CSV, used by the broad commercial seed rule to exclude
    /// residential codes).
    /// </summary>
    public string PropertyUseMode { get; set; } = "ANY";

    /// <summary>
    /// Required <c>ag_apply</c> value. <c>"T"</c> | <c>"F"</c> |
    /// NULL (= wildcard).
    /// </summary>
    public string? AgApplyValue { get; set; }

    /// <summary>
    /// Comma-separated <c>ag_use_cd</c> values (e.g. "AG,OSP,CNV").
    /// Reserved for future tightening of AG_CURRENT_USE; ignored at
    /// initial seed.
    /// </summary>
    public string? AgUseCdCsv { get; set; }

    /// <summary>
    /// True iff the rule requires a legacy marker to be present on
    /// the row before firing. Only true on the CONVERSION_LEGACY
    /// rule.
    /// </summary>
    public bool RequiresLegacyMarker { get; set; }

    /// <summary>
    /// Closed vocabulary identifying which legacy marker the rule
    /// looks for: <c>CREATED_DT_PRE_2017</c> | <c>SOURCE_SYSTEM</c> |
    /// <c>IMPORT_BATCH</c>. NULL when <see cref="RequiresLegacyMarker"/>
    /// is false.
    /// </summary>
    public string? LegacyMarkerType { get; set; }

    /// <summary>
    /// Optional value the legacy marker must equal (for SOURCE_SYSTEM
    /// or IMPORT_BATCH variants). NULL for date-based markers.
    /// </summary>
    public string? LegacyMarkerValue { get; set; }

    /// <summary>Why this rule exists. Free-text.</summary>
    public string Reason { get; set; } = string.Empty;

    /// <summary>
    /// Citation: where the rule comes from. Required for HIGH
    /// confidence rules. Mirrors <see cref="TfDoctrineRatioPolicy.EvidenceSource"/>.
    /// </summary>
    public string EvidenceSource { get; set; } = string.Empty;

    /// <summary>Closed vocab: <c>'HIGH'</c> | <c>'MED'</c> | <c>'LOW'</c>.</summary>
    public string Confidence { get; set; } = "MED";

    /// <summary>Free-text notes for future maintainers.</summary>
    public string? Notes { get; set; }

    /// <summary>Soft-disable knob; classifier ignores rules with <c>ActiveFlag = false</c>.</summary>
    public bool ActiveFlag { get; set; } = true;

    /// <summary>Operator who signed off. e.g. "operator-bsval".</summary>
    public string? ApprovedBy { get; set; }

    /// <summary>Timestamp of operator sign-off.</summary>
    public DateTime? ApprovedAt { get; set; }

    // ── Audit fields (auto-populated by AuditableEntityInterceptor) ────
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }
}
