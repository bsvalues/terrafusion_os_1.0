using System;
using System.Threading;
using System.Threading.Tasks;

namespace TerraFusion.Core.Sync.PacsPropertyVal;

/// <summary>
/// SYNC-DOCTRINE-4-IMPL-V4: PACS property_val raw landing orchestrator.
///
/// <para>Doctrine: this service does NOT promote into
/// <c>truth_pacs.*</c> or <c>canonical_tf.*</c>. It records two
/// promotion gates:</para>
/// <list type="bullet">
///   <item><c>property-val-distribution</c> — informational; rows
///   per (year, sup_num).</item>
///   <item><c>property-val-key-uniqueness</c> — FAIL when any 3-key
///   tuple appears more than once.</item>
/// </list>
/// </summary>
public interface IPacsPropertyValLandingService
{
    Task<PacsPropertyValLandingResult> LandPropertyValsAsync(
        IPacsPropertyValSource source,
        string operatorName,
        CancellationToken cancellationToken = default);
}

/// <summary>SYNC-DOCTRINE-4-IMPL-V4: outcome of one landing run.</summary>
public sealed record PacsPropertyValLandingResult
{
    public required Guid LoadBatchId { get; init; }

    /// <summary>'COMPLETED' | 'FAILED'.</summary>
    public required string Status { get; init; }

    public required int RowsLanded { get; init; }

    /// <summary>3-key duplicates. Doctrine: must be 0 for the gate to PASS.</summary>
    public required int DuplicateKeyViolations { get; init; }

    public required int RowsWithPropertyUseCd { get; init; }

    public string? ErrorSummary { get; init; }
}
