using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace TerraFusion.Core.Sync.Doctrine;

/// <summary>
/// SYNC-DOCTRINE-4-IMPL-V5: backfill universe classification onto
/// existing <c>truth_pacs.imprv_current</c> rows that were promoted
/// before the current rule set fired correctly.
///
/// <para>Use cases:</para>
/// <list type="bullet">
///   <item>Pre-D4 rows promoted before SYNC-DOCTRINE-4-IMPL —
///   <c>UniverseCode IS NULL</c>.</item>
///   <item>V1 cohort rows that classified <c>CONVERSION_LEGACY</c>
///   under the over-firing precedence-1 rule that V2 deactivated.</item>
///   <item>V2 cohort rows classified <c>REAL_RESIDENTIAL</c> when
///   the underlying parcel actually had ag_apply='T' (V3 fix) or
///   non-residential property_use_cd (V4 fix).</item>
/// </list>
///
/// <para>Re-runs the V4 classifier in place against the same data
/// sources the truth promoter uses (property, property_val,
/// land_detail). Updates <c>truth_pacs.imprv_current.UniverseCode</c>
/// + sibling fields directly. Idempotent — re-running on rows that
/// already match the latest classification is a no-op.</para>
///
/// <para>Out of scope for V5: forwarding the new universe values to
/// <c>canonical_tf.tf_improvement</c>. The canonical projector
/// rebuilds canonical from truth on next imprv drain; until then
/// canonical reflects last-projection state. A future slice may
/// add joint truth+canonical backfill.</para>
/// </summary>
public interface IPacsImprvUniverseBackfillService
{
    Task<ImprvUniverseBackfillResult> BackfillAsync(
        ImprvUniverseBackfillRequest request,
        CancellationToken cancellationToken = default);
}

/// <summary>SYNC-DOCTRINE-4-IMPL-V5: backfill input.</summary>
/// <param name="County">Lowercase-hyphenated county slug.</param>
/// <param name="DryRun">
/// True = scan + classify but never UPDATE. Returns the
/// transition map so the operator can audit before committing.
/// </param>
/// <param name="MaxRows">
/// Hard cap on truth rows scanned in a single invocation. NULL =
/// no cap. Use to bound long-running backfills.
/// </param>
/// <param name="OnlyNullUniverse">
/// True = scan only rows where <c>UniverseCode IS NULL</c>; ignore
/// rows already classified (skips V1/V2 cohorts that have stale
/// labels). False (default) = scan rows whose universe is null OR
/// whose UniverseRuleId references a now-inactive doctrine rule.
/// </param>
public sealed record ImprvUniverseBackfillRequest(
    string County,
    bool DryRun,
    int? MaxRows = null,
    bool OnlyNullUniverse = false);

/// <summary>SYNC-DOCTRINE-4-IMPL-V5: backfill outcome.</summary>
public sealed record ImprvUniverseBackfillResult
{
    public required string Status { get; init; }
    public required bool DryRun { get; init; }
    public required int RowsScanned { get; init; }
    public required int RowsUnchanged { get; init; }
    public required int RowsUpdated { get; init; }
    public required int RowsCouldNotClassify { get; init; }

    /// <summary>
    /// Map "OldUniverse → NewUniverse" → count of transitions. Use
    /// to audit shift in classification. NULL old / new are
    /// rendered as "(null)".
    /// </summary>
    public required IReadOnlyDictionary<string, int> Transitions { get; init; }

    public string? ErrorSummary { get; init; }
}
