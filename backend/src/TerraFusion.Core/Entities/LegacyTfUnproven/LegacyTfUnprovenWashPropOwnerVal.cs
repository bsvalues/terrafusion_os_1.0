using System;

namespace TerraFusion.Core.Entities.LegacyTfUnproven;

/// <summary>
/// Slice B4: quarantine surface for WSDOR rows that could not be
/// canonical-promoted because either the parcel or the owner could
/// not be resolved through <c>source_xref</c>.
///
/// <para>Per the doctrine: a row arrives here when truth-pacs data
/// is correct in itself but cannot be safely linked to BOTH
/// canonical anchors (TfParcel and TfOwner) at the same time.
/// Preserved so a future slice that closes the gap can re-promote.</para>
///
/// <para><see cref="QuarantineReason"/> is a closed vocabulary:
/// <c>"NO_PARCEL_XREF"</c> | <c>"NO_OWNER_XREF"</c> |
/// <c>"BOTH_MISSING"</c>.</para>
/// </summary>
public sealed class LegacyTfUnprovenWashPropOwnerVal
{
    public Guid UnprovenRowId { get; set; } = Guid.NewGuid();

    /// <summary>PACS-side identity, preserved verbatim.</summary>
    public short PropValYr { get; set; }
    public short SupNum { get; set; }
    public int PropId { get; set; }
    public long OwnerId { get; set; }

    /// <summary>Headline values for triage (full row in truth_pacs).</summary>
    public decimal? AssessedVal { get; set; }
    public decimal? MarketVal { get; set; }
    public string? BoeStatus { get; set; }

    /// <summary>FK-style pointer to the truth-pacs row that produced this entry.</summary>
    public Guid SourceTruthWpovId { get; set; }

    /// <summary>The B4 batch that produced this quarantine row.</summary>
    public Guid PromotionLoadBatchId { get; set; }

    /// <summary>
    /// Closed vocabulary: <c>"NO_PARCEL_XREF"</c> |
    /// <c>"NO_OWNER_XREF"</c> | <c>"BOTH_MISSING"</c>.
    /// </summary>
    public string QuarantineReason { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
