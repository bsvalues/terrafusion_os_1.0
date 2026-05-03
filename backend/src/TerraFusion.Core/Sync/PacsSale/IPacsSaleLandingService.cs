using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace TerraFusion.Core.Sync.PacsSale;

/// <summary>
/// Slice S1: PACS sale raw landing orchestrator. Drains a
/// <see cref="IPacsSaleSource"/> and persists every row into
/// <c>legacy_pacs_raw.sale</c> with full provenance, then writes
/// the four S1 promotion gate results.
///
/// <para>Doctrine: this service does NOT promote into
/// <c>truth_pacs.sale</c> or <c>canonical_tf.tf_sale</c>. Those are
/// future slices. This is the FIRST stop only.</para>
/// </summary>
public interface IPacsSaleLandingService
{
    Task<PacsSaleLandingResult> LandSalesAsync(
        IPacsSaleSource source,
        string operatorName,
        CancellationToken cancellationToken = default);
}

/// <summary>
/// Slice S1: outcome of one landing run. Used by tests and a future
/// dashboard slice to surface batch outcomes.
/// </summary>
public sealed record PacsSaleLandingResult
{
    public required Guid LoadBatchId { get; init; }

    /// <summary>'COMPLETED' | 'FAILED'.</summary>
    public required string Status { get; init; }

    public required int RowsLanded { get; init; }

    /// <summary>Histogram of <c>sl_county_ratio_cd</c> values seen.</summary>
    public required IReadOnlyDictionary<string, int> CodeDistribution { get; init; }

    /// <summary>
    /// Count of rows whose <c>sl_county_ratio_cd</c> falls in the
    /// stale legacy vocabulary <c>{"01","02"}</c>. The doctrine: any
    /// non-zero value is a doctrine violation in modern data.
    /// </summary>
    public required int StaleCodeViolations { get; init; }

    /// <summary>Sales with <c>sl_dt</c> strictly before 2018-01-01 UTC.</summary>
    public required int Pre2018Count { get; init; }

    /// <summary>Sales with <c>sl_dt</c> on or after 2018-01-01 UTC.</summary>
    public required int Post2018Count { get; init; }

    /// <summary>Sales with NULL <c>sl_dt</c>.</summary>
    public required int UnknownDateCount { get; init; }

    public string? ErrorSummary { get; init; }
}
