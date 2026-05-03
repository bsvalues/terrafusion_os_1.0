using System;

namespace TerraFusion.Core.Entities.LegacyTfUnproven;

/// <summary>
/// Slice L3: quarantine surface for land segments that could not be
/// canonical-promoted because their parcel could not be resolved
/// through <c>source_xref</c>.
/// </summary>
public sealed class LegacyTfUnprovenLandCurrent
{
    public Guid UnprovenRowId { get; set; } = Guid.NewGuid();

    /// <summary>PACS-side identity, preserved verbatim.</summary>
    public short PropValYr { get; set; }
    public short SupNum { get; set; }
    public int PropId { get; set; }
    public long LandSegId { get; set; }

    public string? LandSegTypeCd { get; set; }
    public string? LandSegUseCd { get; set; }
    public decimal? SizeAcres { get; set; }
    public decimal? LandSegMarketVal { get; set; }

    /// <summary>FK-style pointer to the truth-pacs row that produced this entry.</summary>
    public Guid SourceTruthLandId { get; set; }

    /// <summary>The L3 batch that produced this quarantine row.</summary>
    public Guid PromotionLoadBatchId { get; set; }

    /// <summary>Closed vocabulary: <c>"NO_PARCEL_XREF"</c>.</summary>
    public string QuarantineReason { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
