using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace TerraFusion.Core.Sync.PacsProperty;

/// <summary>
/// Slice S1 (SYNC-POP-4a): PACS property raw landing orchestrator.
/// Drains a <see cref="IPacsPropertySource"/> and persists every row
/// into <c>legacy_pacs_raw.property</c> with full provenance, then
/// writes the S1 promotion gate results.
///
/// <para>Doctrine: this service does NOT promote into
/// <c>truth_pacs.parcel_spine</c> or <c>canonical_tf.tf_parcel</c>.
/// Those are SYNC-POP-4b (truth) and SYNC-POP-4c (canonical). This is
/// the FIRST stop only.</para>
/// </summary>
public interface IPacsPropertyLandingService
{
    Task<PacsPropertyLandingResult> LandPropertiesAsync(
        IPacsPropertySource source,
        string operatorName,
        CancellationToken cancellationToken = default);
}

/// <summary>
/// Slice S1 (SYNC-POP-4a): outcome of one parcel landing run.
/// </summary>
public sealed record PacsPropertyLandingResult
{
    public required Guid LoadBatchId { get; init; }

    /// <summary>'COMPLETED' | 'FAILED'.</summary>
    public required string Status { get; init; }

    public required int RowsLanded { get; init; }

    /// <summary>Histogram of <c>prop_type_cd</c> values seen.</summary>
    public required IReadOnlyDictionary<string, int> TypeDistribution { get; init; }

    /// <summary>Count of rows whose <c>prop_create_dt</c> is non-null.</summary>
    public required int WithCreateDtCount { get; init; }

    /// <summary>Count of rows whose <c>prop_create_dt</c> is null.</summary>
    public required int WithoutCreateDtCount { get; init; }

    /// <summary>
    /// Count of rows whose <c>prop_id</c> appears more than once in
    /// the landed batch. Modern Benton data MUST have zero duplicates;
    /// any non-zero indicates either a join blow-up or a duplicate
    /// source row.
    /// </summary>
    public required int DuplicatePropIdCount { get; init; }

    public string? ErrorSummary { get; init; }
}
