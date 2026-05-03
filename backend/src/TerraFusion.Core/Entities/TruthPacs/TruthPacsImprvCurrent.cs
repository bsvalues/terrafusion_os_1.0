using System;

namespace TerraFusion.Core.Entities.TruthPacs;

/// <summary>
/// Slice C2: supp-aware-validated current improvement snapshot.
///
/// <para>The middle layer of Block C's improvement doctrine —
/// <c>legacy_pacs_raw.imprv</c> JOIN
/// <c>legacy_pacs_raw.prop_supp_assoc</c>, filtered to the active
/// supplement. This is the parent-improvement projection; per-
/// component detail rows (<c>imprv_detail</c>) and per-attribute
/// rows (<c>imprv_attr</c>) are projected at canonical layer (C3 —
/// tf_improvement + tf_improvement_feature).</para>
///
/// <para>Two invariants hold by construction:
/// <list type="number">
///   <item><see cref="SupNum"/> matches the active supp pointer for
///   <see cref="PropId"/>/<see cref="PropValYr"/> at promotion time.</item>
///   <item>Lineage to BOTH source raw rows is preserved
///   (<see cref="SourceImprvLandedRowId"/> +
///   <see cref="SourceSuppAssocLandedRowId"/>).</item>
/// </list>
/// </para>
/// </summary>
public sealed class TruthPacsImprvCurrent
{
    public Guid TruthImprvId { get; set; } = Guid.NewGuid();

    // ── PACS-side identity (the supp-aware-validated 4-key) ──────
    public short PropValYr { get; set; }
    public short SupNum { get; set; }
    public int PropId { get; set; }
    public long ImprvId { get; set; }

    // ── Type / classification (preserved verbatim) ───────────────
    public string? ImprvTypeCd { get; set; }
    public string? ImprvStateCd { get; set; }
    public string? ImprvClassCd { get; set; }
    public string? ImprvHomesite { get; set; }

    // ── Value + description ──────────────────────────────────────
    public decimal? ImprvVal { get; set; }
    public string? ImprvDesc { get; set; }

    // ── Year-built fields (three flavors per PACS) ───────────────
    public short? YearBuilt { get; set; }
    public short? EffectiveYearBuilt { get; set; }
    public short? ActualYearBuilt { get; set; }

    // ── Lineage (the doctrine's traceback) ────────────────────────
    public Guid SourceImprvLandedRowId { get; set; }
    public Guid SourceSuppAssocLandedRowId { get; set; }

    public Guid ImprvLoadBatchId { get; set; }
    public Guid SuppAssocLoadBatchId { get; set; }

    /// <summary>Truth-promotion LoadBatch (the C2 batch).</summary>
    public Guid PromotionLoadBatchId { get; set; }

    /// <summary>
    /// Slice G1 (v1.10): conversion-era marker derived from
    /// <see cref="PropValYr"/> at promotion time. See
    /// <see cref="ConversionEras"/>. Nullable for back-compat
    /// with rows promoted before G1; new promotions always set
    /// it.
    /// </summary>
    public string? ConversionEra { get; set; }

    public DateTime PromotedAt { get; set; } = DateTime.UtcNow;
}
