using System;
using System.Threading;
using System.Threading.Tasks;

namespace TerraFusion.Core.Sync.PacsOwner;

/// <summary>
/// Slice B1-B: PACS owner raw landing orchestrator.
///
/// <para>Doctrine: this service does NOT promote into
/// <c>truth_pacs.*</c> or <c>canonical_tf.*</c>. The
/// <c>owner-key-uniqueness</c> gate enforces source-side 4-key
/// uniqueness so the truth_pacs.owner_current promoter (B2-A) can
/// safely use the (PropId, OwnerTaxYr, SupNum, OwnerId) tuple as a
/// join key without a cross-row dedupe.</para>
/// </summary>
public interface IPacsOwnerLandingService
{
    Task<PacsOwnerLandingResult> LandOwnersAsync(
        IPacsOwnerSource source,
        string operatorName,
        CancellationToken cancellationToken = default);
}

/// <summary>Slice B1-B: outcome of one landing run.</summary>
public sealed record PacsOwnerLandingResult
{
    public required Guid LoadBatchId { get; init; }

    /// <summary>'COMPLETED' | 'FAILED'.</summary>
    public required string Status { get; init; }

    public required int RowsLanded { get; init; }

    /// <summary>
    /// Count of (OwnerTaxYr, SupNum, PropId, OwnerId) tuples that
    /// appeared more than once. Doctrine: must be 0 for the
    /// <c>owner-key-uniqueness</c> gate to PASS.
    /// </summary>
    public required int DuplicateKeyViolations { get; init; }

    /// <summary>Distinct (PropId, OwnerTaxYr, SupNum) groups observed.</summary>
    public required int DistinctOwnershipGroups { get; init; }

    /// <summary>
    /// Groups whose <see cref="LegacyPacsRaw.LegacyPacsRawOwner.PctOwnership"/>
    /// values sum to exactly 100.0 (informational signal — the doctrine
    /// only tightens this in B2-A).
    /// </summary>
    public required int GroupsWithFullPctSum { get; init; }

    /// <summary>
    /// Groups whose pct sums diverge from 100.0 (NULL pct, partial,
    /// or over-100). Surfaced as informational only at this layer.
    /// </summary>
    public required int GroupsWithPartialPctSum { get; init; }

    public string? ErrorSummary { get; init; }
}
