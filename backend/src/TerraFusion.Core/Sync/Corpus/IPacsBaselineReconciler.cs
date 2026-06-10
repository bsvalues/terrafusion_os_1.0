using System.Threading;
using System.Threading.Tasks;

namespace TerraFusion.Core.Sync.Corpus;

/// <summary>
/// SYNC-COMPLETE-2: queries the PACS baseline row count for a given
/// lane so the orchestrator can compute delta vs. canonical.
///
/// <para>Implementations query <c>ConnectionStrings:PacsConnection</c>
/// (or for the geometry lane, the ArcGIS feature service). When the
/// underlying query is unreachable or misconfigured, the result
/// returns <see cref="PacsBaselineOutcome.Unreachable"/> with
/// <see cref="PacsBaselineResult.Notes"/> populated; the orchestrator
/// records that as <c>Investigate</c> instead of throwing.</para>
/// </summary>
public interface IPacsBaselineReconciler
{
    Task<PacsBaselineResult> QueryAsync(
        string lane,
        short workingYear,
        CancellationToken cancellationToken);

    Task<long> CountTfCanonicalAsync(
        string lane,
        short workingYear,
        CancellationToken cancellationToken);
}

public enum PacsBaselineOutcome
{
    Ok,
    Unreachable,
    UnknownLane,
}

public sealed record PacsBaselineResult(
    PacsBaselineOutcome Outcome,
    long Count,
    string? Notes);
