using System;
using System.Threading;
using System.Threading.Tasks;

namespace TerraFusion.Core.Sync.PacsPropSuppAssoc;

/// <summary>
/// Slice S2-A: PACS prop_supp_assoc raw landing orchestrator.
///
/// <para>Doctrine: this service does NOT promote into
/// <c>truth_pacs.*</c>. The <c>prop-supp-assoc-uniqueness</c> gate
/// enforces the (prop_id, prop_val_yr) invariant so S2-B can
/// safely use this data as a join key without a cross-row dedupe.</para>
/// </summary>
public interface IPacsPropSuppAssocLandingService
{
    Task<PacsPropSuppAssocLandingResult> LandPropSuppAssocsAsync(
        IPacsPropSuppAssocSource source,
        string operatorName,
        CancellationToken cancellationToken = default);
}

/// <summary>Slice S2-A: outcome of one landing run.</summary>
public sealed record PacsPropSuppAssocLandingResult
{
    public required Guid LoadBatchId { get; init; }

    /// <summary>'COMPLETED' | 'FAILED'.</summary>
    public required string Status { get; init; }

    public required int RowsLanded { get; init; }

    /// <summary>
    /// Count of (PropId, PropValYr) pairs that appeared more than
    /// once in this batch. Doctrine: must be 0 for the
    /// <c>prop-supp-assoc-uniqueness</c> gate to PASS.
    /// </summary>
    public required int DuplicateKeyViolations { get; init; }

    /// <summary>Distinct years observed in this batch.</summary>
    public required int DistinctYears { get; init; }

    public string? ErrorSummary { get; init; }
}
