using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace TerraFusion.Core.Sync.PacsImprv;

/// <summary>
/// Slice C1-A: PACS imprv raw landing orchestrator.
///
/// <para>Doctrine: this service does NOT promote into
/// <c>truth_pacs.*</c> or <c>canonical_tf.*</c>. The
/// <c>imprv-key-uniqueness</c> gate enforces source-side 4-key
/// uniqueness so downstream consumers can join on
/// <c>(prop_val_yr, sup_num, prop_id, imprv_id)</c> without
/// cross-row dedupe.</para>
/// </summary>
public interface IPacsImprvLandingService
{
    Task<PacsImprvLandingResult> LandImprvsAsync(
        IPacsImprvSource source,
        string operatorName,
        CancellationToken cancellationToken = default);
}

/// <summary>Slice C1-A: outcome of one landing run.</summary>
public sealed record PacsImprvLandingResult
{
    public required Guid LoadBatchId { get; init; }

    /// <summary>'COMPLETED' | 'FAILED'.</summary>
    public required string Status { get; init; }

    public required int RowsLanded { get; init; }

    /// <summary>
    /// Count of (PropValYr, SupNum, PropId, ImprvId) tuples that
    /// appeared more than once. Doctrine: must be 0 for the
    /// <c>imprv-key-uniqueness</c> gate to PASS.
    /// </summary>
    public required int DuplicateKeyViolations { get; init; }

    /// <summary>Distinct improvement-type codes observed.</summary>
    public required IReadOnlyDictionary<string, int> TypeCdHistogram { get; init; }

    /// <summary>Aggregate sum of <c>ImprvVal</c> over all landed rows.</summary>
    public required decimal ImprvValSum { get; init; }

    public string? ErrorSummary { get; init; }
}
