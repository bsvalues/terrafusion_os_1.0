using System;

namespace TerraFusion.Core.Entities.DoctrineTf;

/// <summary>
/// SYNC-DOCTRINE-4: per-universe, year-aware, evidence-backed
/// imprv_attr dictionary. Replaces the single global in-memory
/// <see cref="TerraFusion.Core.Sync.PacsImprvAttr.RefreshableImprvAttrDictionary"/>
/// which collapsed real / mobile-home / ag / personal-property /
/// legacy attribute namespaces into one bucket.
///
/// <para>One row per (county, universe, year, imprv_attr_id,
/// i_attr_val_cd) tuple. Quarantine semantics become per-universe:
/// <c>UNKNOWN_FOR_UNIVERSE_DICTIONARY</c> only fires when the code
/// is missing from THAT row's universe — not from any other
/// universe's dictionary.</para>
///
/// <para>Initial seed is intentionally empty (per design doc
/// §"Out of scope"): per-universe code distributions need a
/// profiling drain against live PACS before tightening.</para>
/// </summary>
public sealed class TfDoctrineAttributeDictionary
{
    /// <summary>Surrogate primary key.</summary>
    public Guid DictionaryRowId { get; set; } = Guid.NewGuid();

    /// <summary>County scope, lowercase-hyphenated. e.g. "benton-wa".</summary>
    public string County { get; set; } = string.Empty;

    /// <summary>First PropValYr the entry applies to (inclusive).</summary>
    public int EffectiveStartYear { get; set; }

    /// <summary>Last PropValYr the entry applies to (inclusive). NULL = "still in effect".</summary>
    public int? EffectiveEndYear { get; set; }

    /// <summary>
    /// Closed vocabulary from <see cref="TerraFusion.Core.Sync.Doctrine.UniverseCodes"/>.
    /// Never <c>UNKNOWN</c> — by definition no dictionary entries
    /// exist for an unclassified row.
    /// </summary>
    public string UniverseCode { get; set; } = string.Empty;

    /// <summary>
    /// PACS <c>imprv_attr_id</c> (column reference). Stored as string
    /// to match the ad-hoc-keyed nature of the legacy dictionary;
    /// real values are integers but the doctrine surface keeps the
    /// option open.
    /// </summary>
    public string ImprvAttrId { get; set; } = string.Empty;

    /// <summary>The PACS value-code being recognized (e.g. a quality grade or finish code).</summary>
    public string IAttrValCd { get; set; } = string.Empty;

    /// <summary>Human-friendly description, when known.</summary>
    public string? AttributeDescription { get; set; }

    /// <summary>Optional grouping for reporting (e.g. "QUALITY", "EXTERIOR").</summary>
    public string? AttributeGroup { get; set; }

    /// <summary>Source table the entry was learned from (e.g. <c>dbo.imprv_attr_val</c>).</summary>
    public string? SourceTable { get; set; }

    /// <summary>Source key in the source table (e.g. composite of imprv_attr_id + i_attr_val_cd).</summary>
    public string? SourceKey { get; set; }

    /// <summary>Why this entry exists. Free-text.</summary>
    public string Reason { get; set; } = string.Empty;

    /// <summary>Citation supporting the entry. Required for HIGH confidence.</summary>
    public string EvidenceSource { get; set; } = string.Empty;

    /// <summary>Closed vocab: <c>'HIGH'</c> | <c>'MED'</c> | <c>'LOW'</c>.</summary>
    public string Confidence { get; set; } = "MED";

    /// <summary>Free-text notes for future maintainers.</summary>
    public string? Notes { get; set; }

    /// <summary>Soft-disable; lookups ignore entries with <c>ActiveFlag = false</c>.</summary>
    public bool ActiveFlag { get; set; } = true;

    /// <summary>Operator who signed off.</summary>
    public string? ApprovedBy { get; set; }

    /// <summary>Timestamp of operator sign-off.</summary>
    public DateTime? ApprovedAt { get; set; }

    // ── Audit fields (auto-populated) ─────────────────────────────────
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }
}
