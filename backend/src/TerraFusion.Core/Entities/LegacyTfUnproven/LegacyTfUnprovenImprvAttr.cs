using System;

namespace TerraFusion.Core.Entities.LegacyTfUnproven;

/// <summary>
/// Slice C1-C: quarantine surface for <c>imprv_attr</c> rows whose
/// <see cref="IAttrValCd"/> is not in the active PACS dictionary.
///
/// <para>Per the 90-day plan §4 Block C: "any i_attr_val_cd not in
/// dictionary is quarantined to
/// <c>legacy_tf_unproven.unresolved_imprv_attr</c>." Preserved
/// (not discarded) so a future dictionary refresh can re-promote.</para>
///
/// <para>Distinct from the canonical-layer quarantines (which catch
/// missing canonical xrefs at S3/B3/B4). This quarantine catches
/// unrecognized closed-vocabulary codes at the RAW landing layer —
/// the doctrine's first line of defense against dictionary drift.</para>
/// </summary>
public sealed class LegacyTfUnprovenImprvAttr
{
    public Guid UnprovenRowId { get; set; } = Guid.NewGuid();

    // ── PACS source identity (the 6-key composite) ────────────────
    public short PropValYr { get; set; }
    public short SupNum { get; set; }
    public int PropId { get; set; }
    public long ImprvId { get; set; }
    public long ImprvDetId { get; set; }
    public long IAttrValId { get; set; }

    /// <summary>The unrecognized code that triggered quarantine.</summary>
    public string IAttrValCd { get; set; } = string.Empty;

    public string? AttrValueText { get; set; }
    public decimal? AttrValueNumeric { get; set; }

    /// <summary>The B1-C raw landing batch this row was rejected by.</summary>
    public Guid LandingLoadBatchId { get; set; }

    /// <summary>
    /// Closed vocabulary across two layers per Block-C contract
    /// v1.6 (<c>docs/pacs/block-c-contract-v1.6.md</c>):
    /// <list type="bullet">
    ///   <item>Landing-layer reasons live in
    ///     <see cref="TerraFusion.Core.Entities.LegacyPacsRaw.LandingQuarantineReasons"/>
    ///     (e.g. <c>UNKNOWN_I_ATTR_VAL_CD</c> from
    ///     <c>PacsImprvAttrLandingService</c>).</item>
    ///   <item>Canonical-layer reasons live in
    ///     <see cref="TerraFusion.Core.Entities.SyncBridge.QuarantineReasons"/>
    ///     (e.g. <c>UNKNOWN_ATTRIBUTE</c> from
    ///     <c>PacsImprvCanonicalProjector</c> v1.5 §2.2).</item>
    /// </list>
    /// The two vocabularies are disjoint by doctrine. Cleanup
    /// passes filter by reason to avoid cross-layer interference.
    /// </summary>
    public string QuarantineReason { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
