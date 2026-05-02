using System;

namespace TerraFusion.Core.Entities.LegacyTfUnproven;

/// <summary>
/// Slice S3: quarantine surface for sales that could not be
/// canonical-promoted because their underlying parcel lacks a
/// <c>canonical_tf.tf_parcel</c> + <c>source_xref</c> entry.
///
/// <para>Per the doctrine: a row arrives here when truth_pacs.sale
/// data is correct in itself but cannot be safely linked to a TF
/// canonical entity. The row is preserved (not discarded) so a
/// future slice that closes the parcel-side gap can re-promote.</para>
///
/// <para><see cref="QuarantineReason"/> is a closed vocabulary:
/// <c>"NO_PARCEL_XREF"</c> | <c>"AMBIGUOUS_PARCEL_XREF"</c> |
/// <c>"PARCEL_XREF_INACTIVE"</c>. The S3 projector emits only the
/// first today; the others are reserved for future precision.</para>
/// </summary>
public sealed class LegacyTfUnprovenSale
{
    public Guid UnprovenRowId { get; set; } = Guid.NewGuid();

    /// <summary>PACS-side sale identity, preserved verbatim.</summary>
    public long ChgOfOwnerId { get; set; }
    public int PropId { get; set; }
    public short PropValYr { get; set; }
    public short SupNum { get; set; }

    public DateTime? SlDt { get; set; }
    public decimal? SlPrice { get; set; }
    public decimal? AdjSlPrice { get; set; }

    /// <summary>
    /// FK-style pointer to the truth-pacs row that produced this
    /// quarantine entry.
    /// </summary>
    public Guid SourceTruthSaleId { get; set; }

    /// <summary>The S3 batch that produced this quarantine row.</summary>
    public Guid PromotionLoadBatchId { get; set; }

    /// <summary>
    /// Closed vocabulary: <c>"NO_PARCEL_XREF"</c> |
    /// <c>"AMBIGUOUS_PARCEL_XREF"</c> | <c>"PARCEL_XREF_INACTIVE"</c>.
    /// </summary>
    public string QuarantineReason { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
