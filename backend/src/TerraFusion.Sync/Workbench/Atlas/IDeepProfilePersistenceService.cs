namespace TerraFusion.Sync.Workbench.Atlas;

/// <summary>
/// Persists a single <see cref="DeepProfileResult"/> (one source table's worth
/// of B2 deep-profile output) into the Slice B2.1 stats schema:
///   - <c>SyncProfileTableStats</c>      — one row per (batch, schema, table)
///   - <c>SyncProfileColumnStats</c>     — one row per (batch, schema, table, column)
///   - <c>SyncProfileCodeCandidate</c>   — one row per detected candidate column
///
/// Replace-for-batch-and-table semantics: a re-run of the deep profile on the
/// same source table within the same SyncBatch deletes the prior stats rows
/// (scoped to <c>CountyId + ProfileBatchId + SchemaName + TableName</c>) and
/// inserts the fresh rows in a single SaveChanges. This gives idempotent
/// per-table re-runs without disturbing other tables in the same batch or
/// any rows from other batches.
///
/// What this service does NOT do (intentionally narrow surface for B2.3):
///   - Run the reader. Caller already has a populated DeepProfileResult.
///   - Decide which tables to profile, in what order, with what concurrency.
///     Slice B2.4 (CLI flag) and B2.5 (orchestrator) own that policy.
///   - Touch B1 structural metadata
///     (SyncProfileTable / Column / View / Procedure / etc.). Those rows are
///     written by AtlasProfiler during the structural pass and are completely
///     untouched by deep-profile persistence.
///   - Update the SyncBatch envelope. The batch row is owned by AtlasProfiler.
/// </summary>
public interface IDeepProfilePersistenceService
{
    /// <summary>
    /// Persists the deep-profile result under the given county + batch scope.
    /// Replaces any prior stats rows for the same scope+table; never
    /// touches rows for other tables, other batches, or B1 structural
    /// metadata.
    /// </summary>
    /// <param name="countyId">Sovereign-county scope. Must be non-empty.</param>
    /// <param name="profileBatchId">SyncBatch.Id (Mode='profile'). Must be non-empty.</param>
    /// <param name="result">Deep-profile output for ONE source table.</param>
    /// <param name="cancellationToken">Cancellation propagated to EF.</param>
    System.Threading.Tasks.Task PersistAsync(
        Guid countyId,
        Guid profileBatchId,
        DeepProfileResult result,
        CancellationToken cancellationToken);
}
