using System;

namespace TerraFusion.Core.Entities.CanonicalTf;

/// <summary>
/// Slice B3: canonical many-to-many link between a parcel and an
/// owner for a specific tax year.
///
/// <para>One <see cref="TfParcelOwnerLink"/> per
/// <c>(TfParcelId, TfOwnerId, OwnerTaxYr)</c> tuple. Co-ownership
/// for one parcel produces N>1 link rows, each with its
/// <see cref="PctOwnership"/> share. The canonical doctrine:
/// links sum to 100 per <c>(TfParcelId, OwnerTaxYr)</c> by
/// construction (the truth-pacs.owner_current promoter's hard gate
/// already enforced this upstream).</para>
///
/// <para>Lineage: <see cref="SourceTruthOwnerCurrentId"/> points back
/// to <c>truth_pacs.owner_current</c>, which itself points to
/// <c>legacy_pacs_raw.owner</c> + <c>account</c> +
/// <c>prop_supp_assoc</c>. The full PACS chain is reachable.</para>
///
/// <para>The link does NOT carry its own <c>source_xref</c> — the
/// link's existence is fully derived from the upstream truth row,
/// and adding an extra xref would duplicate lineage. This is the
/// doctrine's "lineage column on the row" exception for derived
/// edges.</para>
/// </summary>
public sealed class TfParcelOwnerLink
{
    public Guid TfParcelOwnerLinkId { get; set; } = Guid.NewGuid();

    public Guid TfParcelId { get; set; }
    public Guid TfOwnerId { get; set; }

    /// <summary>Year this ownership row applies to.</summary>
    public short OwnerTaxYr { get; set; }

    public decimal? PctOwnership { get; set; }

    /// <summary>
    /// Convenience flag set true when <see cref="PctOwnership"/> is
    /// at least 50 (a simple v1 rule). Allows a UI to highlight
    /// the principal owner without re-querying co-owners.
    /// </summary>
    public bool IsPrimary { get; set; }

    // ── Lineage ──────────────────────────────────────────────────
    public Guid SourceTruthOwnerCurrentId { get; set; }
    public Guid PromotionLoadBatchId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
