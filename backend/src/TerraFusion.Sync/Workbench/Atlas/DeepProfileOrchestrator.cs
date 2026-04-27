using Microsoft.EntityFrameworkCore;
using TerraFusion.Core.Entities.Sync;
using TerraFusion.Core.Entities.Sync.Profile;
using TerraFusion.Data;

namespace TerraFusion.Sync.Workbench.Atlas;

/// <summary>
/// Result of a deep-profile orchestration run.
/// </summary>
public sealed record DeepProfileOrchestrationResult(
    Guid BatchId,
    int TablesAttempted,
    int TablesProfiled,
    int TablesFailed,
    int TablesSkipped,
    DateTimeOffset StartedAtUtc,
    DateTimeOffset CompletedAtUtc,
    IReadOnlyList<DeepProfileTableFailure> Failures);

/// <summary>One per-table failure — captured for the operator-facing summary.</summary>
public sealed record DeepProfileTableFailure(
    string SchemaName,
    string TableName,
    string Reason);

/// <summary>
/// Orchestrates a B2 deep-profile pass for a SyncBatch that already has B1
/// structural metadata persisted. Reads <c>SyncProfileTable</c> +
/// <c>SyncProfileColumn</c> rows for the batch to discover what to profile,
/// then loops:
///
///   for each non-view table in the batch:
///     1. project the columns into <see cref="ColumnRef"/>s
///     2. ask <see cref="IDeepProfileReader.ProfileTableAsync"/> for stats
///     3. hand the result to <see cref="IDeepProfilePersistenceService"/>
///     4. on per-table failure: capture the reason, continue with the next
///        table (don't fail the whole orchestration on one bad table —
///        deep-profile is sample-based and individual table failures should
///        not poison the batch's other tables' work).
///
/// Views are intentionally skipped: the deep-profile sampler runs against
/// real tables only. Views' shape lives in the structural atlas.
///
/// The orchestrator does NOT modify the SyncBatch envelope — that's
/// AtlasProfiler's responsibility. It only writes B2.1 stats rows and reads
/// B1.1 / B1.2 / structural rows.
/// </summary>
public interface IDeepProfileOrchestrator
{
    Task<DeepProfileOrchestrationResult> RunAsync(
        Guid batchId,
        Guid countyId,
        Guid sourceConnectionId,
        string operatorId,
        CancellationToken ct = default);
}

public sealed class DeepProfileOrchestrator : IDeepProfileOrchestrator
{
    private readonly TerraFusionDbContext _db;
    private readonly IDeepProfileReaderFactory _readerFactory;
    private readonly IDeepProfilePersistenceService _persistence;

    public DeepProfileOrchestrator(
        TerraFusionDbContext db,
        IDeepProfileReaderFactory readerFactory,
        IDeepProfilePersistenceService persistence)
    {
        ArgumentNullException.ThrowIfNull(db);
        ArgumentNullException.ThrowIfNull(readerFactory);
        ArgumentNullException.ThrowIfNull(persistence);
        _db = db;
        _readerFactory = readerFactory;
        _persistence = persistence;
    }

    public async Task<DeepProfileOrchestrationResult> RunAsync(
        Guid batchId,
        Guid countyId,
        Guid sourceConnectionId,
        string operatorId,
        CancellationToken ct = default)
    {
        if (batchId == Guid.Empty)
            throw new ArgumentException("BatchId is required.", nameof(batchId));
        if (countyId == Guid.Empty)
            throw new ArgumentException("CountyId is required.", nameof(countyId));
        if (sourceConnectionId == Guid.Empty)
            throw new ArgumentException("SourceConnectionId is required.", nameof(sourceConnectionId));
        if (string.IsNullOrWhiteSpace(operatorId))
            throw new ArgumentException("OperatorId is required.", nameof(operatorId));

        var startedAt = DateTimeOffset.UtcNow;

        // Connection lookup, county-scoped — same guard as AtlasProfiler.
        var connection = await _db.SyncSourceConnections
            .FirstOrDefaultAsync(x => x.Id == sourceConnectionId && x.CountyId == countyId, ct);
        if (connection is null)
        {
            throw new InvalidOperationException(
                $"SyncSourceConnection {sourceConnectionId} not found for county {countyId}.");
        }
        if (!connection.IsActive)
        {
            throw new InvalidOperationException(
                $"SyncSourceConnection '{connection.Name}' is not active.");
        }

        // Pull the structural rows for this batch. Filter out views — deep
        // profile only sampples real tables (see comment block on this class).
        var tables = await _db.SyncProfileTables
            .Where(t => t.SyncBatchId == batchId
                     && t.CountyId    == countyId
                     && !t.IsView)
            .OrderBy(t => t.SchemaName)
            .ThenBy(t => t.TableName)
            .ToListAsync(ct);

        var allColumns = await _db.SyncProfileColumns
            .Where(c => c.SyncBatchId == batchId && c.CountyId == countyId)
            .ToListAsync(ct);

        var columnsByTable = allColumns
            .GroupBy(c => (c.SchemaName, c.TableName))
            .ToDictionary(
                g => g.Key,
                g => (IReadOnlyList<SyncProfileColumn>)g.OrderBy(c => c.OrdinalPosition).ToList());

        var profiled = 0;
        var failed   = 0;
        var skipped  = 0;
        var failures = new List<DeepProfileTableFailure>();

        await using var session = await _readerFactory.OpenAsync(connection, ct);

        foreach (var table in tables)
        {
            ct.ThrowIfCancellationRequested();

            if (!columnsByTable.TryGetValue((table.SchemaName, table.TableName), out var cols)
                || cols.Count == 0)
            {
                // Table exists in structural atlas but has no columns recorded
                // (e.g. permission-restricted introspection). Don't try to
                // sample what we don't know how to project.
                skipped++;
                continue;
            }

            var refs = new List<ColumnRef>(cols.Count);
            foreach (var col in cols)
            {
                refs.Add(new ColumnRef(col.ColumnName, col.DataType, col.IsNullable));
            }

            try
            {
                var result = await session.Reader.ProfileTableAsync(
                    table.SchemaName, table.TableName, refs, ct);
                await _persistence.PersistAsync(countyId, batchId, result, ct);
                profiled++;
            }
            catch (OperationCanceledException)
            {
                throw; // operator cancellation surfaces all the way up
            }
            catch (Exception ex)
            {
                failed++;
                failures.Add(new DeepProfileTableFailure(
                    SchemaName: table.SchemaName,
                    TableName:  table.TableName,
                    Reason:     Truncate(ex.Message, 1024)));
            }
        }

        return new DeepProfileOrchestrationResult(
            BatchId:          batchId,
            TablesAttempted:  tables.Count,
            TablesProfiled:   profiled,
            TablesFailed:     failed,
            TablesSkipped:    skipped,
            StartedAtUtc:     startedAt,
            CompletedAtUtc:   DateTimeOffset.UtcNow,
            Failures:         failures);
    }

    private static string Truncate(string s, int max)
        => s.Length <= max ? s : s[..max];
}
