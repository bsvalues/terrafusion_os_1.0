using System;

namespace TerraFusion.Core.Entities.LegacyTfUnproven;

/// <summary>
/// Slice B3: quarantine surface for owner-current rows that could
/// not be canonical-promoted because their underlying parcel lacks
/// a <c>canonical_tf.tf_parcel</c> + <c>source_xref</c> entry.
///
/// <para>Per the doctrine: a row arrives here when the
/// <c>truth_pacs.owner_current</c> data is correct in itself but
/// cannot be safely linked to a TF canonical entity. Preserved (not
/// discarded) so a future slice that closes the parcel-side gap can
/// re-promote.</para>
///
/// <para>This quarantine record carries the <see cref="FileAsName"/>
/// VERBATIM. Quarantine is an audit surface, not a public surface;
/// the canonical PII redaction policy does not yet apply because
/// no canonical row was produced. Authorized roles inspecting the
/// quarantine for triage can see the original data.</para>
/// </summary>
public sealed class LegacyTfUnprovenOwnerCurrent
{
    public Guid UnprovenRowId { get; set; } = Guid.NewGuid();

    /// <summary>PACS-side identity, preserved verbatim.</summary>
    public int PropId { get; set; }
    public short OwnerTaxYr { get; set; }
    public short SupNum { get; set; }
    public long OwnerId { get; set; }
    public long AcctId { get; set; }

    public string? FileAsName { get; set; }
    public bool ConfidentialFlag { get; set; }
    public bool WebSuppression { get; set; }

    /// <summary>FK-style pointer to the truth-pacs row that produced this entry.</summary>
    public Guid SourceTruthOwnerCurrentId { get; set; }

    /// <summary>The B3 batch that produced this quarantine row.</summary>
    public Guid PromotionLoadBatchId { get; set; }

    /// <summary>
    /// Closed vocabulary: <c>"NO_PARCEL_XREF"</c> |
    /// <c>"AMBIGUOUS_PARCEL_XREF"</c> | <c>"PARCEL_XREF_INACTIVE"</c>.
    /// B3 v1 emits only the first.
    /// </summary>
    public string QuarantineReason { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
