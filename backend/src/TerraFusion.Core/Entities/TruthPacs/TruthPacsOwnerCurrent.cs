using System;

namespace TerraFusion.Core.Entities.TruthPacs;

/// <summary>
/// Slice B2-A: supp-aware-validated current owner snapshot for one
/// <c>(prop_id, owner_tax_yr)</c> pair. The middle layer of Block B's
/// owner doctrine — <c>legacy_pacs_raw.owner</c> JOIN
/// <c>legacy_pacs_raw.prop_supp_assoc</c> JOIN
/// <c>legacy_pacs_raw.account</c>, filtered to the active supplement.
///
/// <para>Three invariants hold by construction:
/// <list type="number">
///   <item><see cref="SupNum"/> matches the active supp pointer for
///   <see cref="PropId"/>/<see cref="OwnerTaxYr"/> at promotion time.</item>
///   <item>The party's identity exists in <c>account</c>; both
///   <see cref="OwnerId"/> and <see cref="AcctId"/> are populated and
///   numerically equal (PACS uses the same id space).</item>
///   <item>Lineage to all three source raw batches is preserved
///   (<see cref="SourceOwnerLandedRowId"/>,
///   <see cref="SourceAccountLandedRowId"/>,
///   <see cref="SourceSuppAssocLandedRowId"/>).</item>
/// </list>
/// </para>
///
/// <para>PII is preserved verbatim at this layer. Redaction happens
/// when projecting into <c>canonical_tf.tf_owner</c> (B3) — the
/// canonical layer consults <see cref="ConfidentialFlag"/> and
/// <see cref="WebSuppression"/>, both snapshotted here from the
/// account row at promotion time.</para>
/// </summary>
public sealed class TruthPacsOwnerCurrent
{
    public Guid TruthOwnerCurrentId { get; set; } = Guid.NewGuid();

    // ── PACS-side identity ────────────────────────────────────────
    public int PropId { get; set; }
    public short OwnerTaxYr { get; set; }
    public short SupNum { get; set; }
    public long OwnerId { get; set; }

    /// <summary>
    /// Account-side id. PACS uses the same identifier space as
    /// <see cref="OwnerId"/>; recorded explicitly so lineage is
    /// unambiguous.
    /// </summary>
    public long AcctId { get; set; }

    // ── Account snapshot at promotion time (PII verbatim) ─────────
    public string? FileAsName { get; set; }
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public bool ConfidentialFlag { get; set; }
    public bool WebSuppression { get; set; }

    // ── Owner snapshot ────────────────────────────────────────────
    public decimal? PctOwnership { get; set; }
    public string? TypeOfOwner { get; set; }
    public string? UdiStatus { get; set; }
    public DateTime? BirthDt { get; set; }

    // ── Lineage (the doctrine's traceback) ────────────────────────
    public Guid SourceOwnerLandedRowId { get; set; }
    public Guid SourceAccountLandedRowId { get; set; }
    public Guid SourceSuppAssocLandedRowId { get; set; }

    public Guid OwnerLoadBatchId { get; set; }
    public Guid AccountLoadBatchId { get; set; }
    public Guid SuppAssocLoadBatchId { get; set; }

    /// <summary>Truth-promotion LoadBatch (the B2-A batch).</summary>
    public Guid PromotionLoadBatchId { get; set; }

    public DateTime PromotedAt { get; set; } = DateTime.UtcNow;
}
