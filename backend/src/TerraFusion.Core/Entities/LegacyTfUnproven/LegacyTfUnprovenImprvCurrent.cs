using System;

namespace TerraFusion.Core.Entities.LegacyTfUnproven;

/// <summary>
/// Slice C3: quarantine surface for improvement rows that could not
/// be canonical-promoted because their parcel could not be resolved
/// through <c>source_xref</c>.
///
/// <para>Per the doctrine: a row arrives here when truth-pacs data
/// is correct in itself but cannot be safely linked to a TF
/// canonical entity. Preserved (not discarded) so a future slice
/// that closes the parcel-side gap can re-promote.</para>
/// </summary>
public sealed class LegacyTfUnprovenImprvCurrent
{
    public Guid UnprovenRowId { get; set; } = Guid.NewGuid();

    /// <summary>PACS-side identity, preserved verbatim.</summary>
    public short PropValYr { get; set; }
    public short SupNum { get; set; }
    public int PropId { get; set; }
    public long ImprvId { get; set; }

    public string? ImprvTypeCd { get; set; }
    public string? ImprvDesc { get; set; }
    public decimal? ImprvVal { get; set; }

    /// <summary>FK-style pointer to the truth-pacs row that produced this entry.</summary>
    public Guid SourceTruthImprvId { get; set; }

    /// <summary>The C3 batch that produced this quarantine row.</summary>
    public Guid PromotionLoadBatchId { get; set; }

    /// <summary>
    /// Closed vocabulary: <c>"NO_PARCEL_XREF"</c> — only reason emitted today.
    /// </summary>
    public string QuarantineReason { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
