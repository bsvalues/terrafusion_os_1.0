using System;
using System.Threading;
using System.Threading.Tasks;

namespace TerraFusion.Core.Sync.PacsWashPropOwnerVal;

/// <summary>
/// Slice B1-C: PACS wash_prop_owner_val raw landing orchestrator.
///
/// <para>Doctrine: this service does NOT promote into
/// <c>truth_pacs.*</c> or <c>canonical_tf.*</c>. The
/// <c>wash-prop-owner-val-key-uniqueness</c> gate enforces source-
/// side 4-key uniqueness so the truth_pacs.wash_prop_owner_val
/// promoter (B2-B) can safely use the
/// <c>(year, sup_num, prop_id, owner_id)</c> tuple as a join key.</para>
/// </summary>
public interface IPacsWashPropOwnerValLandingService
{
    Task<PacsWashPropOwnerValLandingResult> LandWashPropOwnerValsAsync(
        IPacsWashPropOwnerValSource source,
        string operatorName,
        CancellationToken cancellationToken = default);
}

/// <summary>Slice B1-C: outcome of one landing run.</summary>
public sealed record PacsWashPropOwnerValLandingResult
{
    public required Guid LoadBatchId { get; init; }

    /// <summary>'COMPLETED' | 'FAILED'.</summary>
    public required string Status { get; init; }

    public required int RowsLanded { get; init; }

    /// <summary>
    /// Count of (PropValYr, SupNum, PropId, OwnerId) tuples that
    /// appeared more than once. Doctrine: must be 0 for the
    /// <c>wash-prop-owner-val-key-uniqueness</c> gate to PASS.
    /// </summary>
    public required int DuplicateKeyViolations { get; init; }

    /// <summary>Distinct years observed in this batch.</summary>
    public required int DistinctYears { get; init; }

    /// <summary>Aggregate sum of <c>AssessedVal</c> over all landed rows.</summary>
    public required decimal AssessedValSum { get; init; }

    /// <summary>Aggregate sum of <c>MarketVal</c> over all landed rows.</summary>
    public required decimal MarketValSum { get; init; }

    public string? ErrorSummary { get; init; }
}
