using System;
using System.Threading;
using System.Threading.Tasks;

namespace TerraFusion.Core.Sync.PacsLandCanonical;

/// <summary>
/// Slice L3: orchestrator for truth → canonical projection of PACS
/// land segments.
///
/// <para>Input: a completed L2 truth_pacs.land_current promotion
/// batch.</para>
///
/// <para>Output: rows in <c>canonical_tf.tf_land</c> for every
/// truth-pacs land segment whose <c>prop_id</c> resolves to a
/// <c>tf_parcel</c> via <c>source_xref</c>; rows whose parcel
/// cannot be resolved are quarantined to
/// <c>legacy_tf_unproven.land_current</c>. Each projected row
/// writes a <c>source_xref</c> entry with
/// <c>TfEntityType="land"</c>.</para>
///
/// <para>Idempotent by truth promotion batch: re-running deletes
/// any prior canonical rows produced from the same truth batch
/// (lands + xrefs + quarantine) before inserting new ones.</para>
/// </summary>
public interface IPacsLandCanonicalProjector
{
    Task<PacsLandCanonicalResult> ProjectAsync(
        Guid truthPromotionLoadBatchId,
        string operatorName,
        CancellationToken cancellationToken = default);
}

/// <summary>Slice L3: outcome of one projection run.</summary>
public sealed record PacsLandCanonicalResult
{
    public required Guid PromotionLoadBatchId { get; init; }

    /// <summary>'COMPLETED' | 'FAILED' | 'REFUSED'.</summary>
    public required string Status { get; init; }

    public required int TruthRowsConsidered { get; init; }
    public required int LandsProjected { get; init; }
    public required int RowsQuarantined { get; init; }

    /// <summary>Aggregate sum of projected rows' <c>SizeAcres</c>.</summary>
    public required decimal SizeAcresProjected { get; init; }

    /// <summary>Aggregate sum of projected rows' <c>LandSegMarketVal</c>.</summary>
    public required decimal LandSegMarketValProjected { get; init; }

    public required int PriorLandsRemoved { get; init; }
    public required int PriorQuarantineRowsRemoved { get; init; }

    public string? ErrorSummary { get; init; }
}
