using Microsoft.EntityFrameworkCore;
using TerraFusion.Core.Entities.Sync;
using TerraFusion.Core.Entities.Sync.Profile;
using TerraFusion.Data;

namespace TerraFusion.Sync.Workbench.Atlas;

/// <summary>
/// Result of running <see cref="IAtlasProfiler.ProfileAsync"/>.
/// </summary>
public sealed record AtlasProfileResult(
    Guid BatchId,
    string Status,
    int TableCount,
    int ColumnCount,
    int ViewCount,
    int ProcedureCount,
    int UdfCount,
    int TriggerCount,
    int ConstraintCount,
    DateTimeOffset StartedAtUtc,
    DateTimeOffset? CompletedAtUtc,
    string? FailureMessage);

/// <summary>
/// Orchestrates a Database Atlas profile run for a single source connection.
///
/// Workflow (Slice B1.4):
///   1. Look up <see cref="SyncSourceConnection"/> by id, scoped to the operator's CountyId.
///   2. Reject if connection is missing, inactive, or in a different county.
///   3. Create a <see cref="SyncBatch"/> with Mode='profile', Status='running'.
///   4. Open a metadata reader via <see cref="IMetadataReaderFactory"/>.
///   5. For each metadata domain (tables, columns, views, procs, UDFs, triggers, constraints):
///        - Read DTOs from source.
///        - Map to SyncProfile* entities with CountyId + SyncBatchId.
///        - SaveChanges per domain (failures isolate to one domain).
///   6. Update batch with final counts + Status='completed' OR 'failed'.
///   7. Return <see cref="AtlasProfileResult"/>.
///
/// Error handling: any reader exception fails the batch with the exception
/// message in <see cref="SyncBatch.FailureMessage"/>. Partial profile rows
/// remain attached to the failed batch for diagnosis (operator can re-run
/// with Mode='profile' to overwrite, or query by BatchId to inspect).
/// </summary>
public interface IAtlasProfiler
{
    Task<AtlasProfileResult> ProfileAsync(
        Guid sourceConnectionId,
        Guid countyId,
        string operatorId,
        CancellationToken ct = default);
}

public sealed class AtlasProfiler : IAtlasProfiler
{
    private readonly TerraFusionDbContext _db;
    private readonly IMetadataReaderFactory _readerFactory;

    public AtlasProfiler(TerraFusionDbContext db, IMetadataReaderFactory readerFactory)
    {
        ArgumentNullException.ThrowIfNull(db);
        ArgumentNullException.ThrowIfNull(readerFactory);
        _db = db;
        _readerFactory = readerFactory;
    }

    public async Task<AtlasProfileResult> ProfileAsync(
        Guid sourceConnectionId,
        Guid countyId,
        string operatorId,
        CancellationToken ct = default)
    {
        // 1. Look up connection scoped to caller's county. Cross-county lookup returns null.
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

        // 2. Create batch.
        var batch = new SyncBatch
        {
            CountyId = countyId,
            SourceSystem = connection.SourceSystem,
            Mode = "profile",
            Status = "running",
            StartedAtUtc = DateTimeOffset.UtcNow,
            CreatedBy = operatorId,
            UpdatedBy = operatorId
        };
        _db.SyncBatches.Add(batch);
        await _db.SaveChangesAsync(ct);

        var counts = new ProfileCounts();
        try
        {
            await using var session = await _readerFactory.OpenAsync(connection, ct);

            counts.Tables = await PersistTablesAsync(session.Reader, batch, connection, operatorId, ct);
            counts.Columns = await PersistColumnsAsync(session.Reader, batch, connection, operatorId, ct);
            counts.Views = await PersistViewsAsync(session.Reader, batch, connection, operatorId, ct);
            counts.Procedures = await PersistProceduresAsync(session.Reader, batch, connection, operatorId, ct);
            counts.Udfs = await PersistUdfsAsync(session.Reader, batch, connection, operatorId, ct);
            counts.Triggers = await PersistTriggersAsync(session.Reader, batch, connection, operatorId, ct);
            counts.Constraints = await PersistConstraintsAsync(session.Reader, batch, connection, operatorId, ct);

            // Connection succeeded — record diagnostics on the connection.
            connection.LastSuccessfulConnectionAtUtc = DateTimeOffset.UtcNow;
            connection.UpdatedBy = operatorId;
            connection.UpdatedAt = DateTime.UtcNow;

            batch.Status = "completed";
            batch.CompletedAtUtc = DateTimeOffset.UtcNow;
            batch.ReadCount = counts.Total;
            batch.UpdatedAt = DateTime.UtcNow;
            batch.UpdatedBy = operatorId;
            await _db.SaveChangesAsync(ct);
        }
        catch (OperationCanceledException)
        {
            batch.Status = "cancelled";
            batch.CompletedAtUtc = DateTimeOffset.UtcNow;
            batch.FailureMessage = "Cancelled by operator.";
            batch.UpdatedAt = DateTime.UtcNow;
            batch.UpdatedBy = operatorId;
            await _db.SaveChangesAsync(CancellationToken.None);
            throw;
        }
        catch (Exception ex)
        {
            connection.LastConnectionErrorAtUtc = DateTimeOffset.UtcNow;
            connection.LastConnectionErrorMessage = Truncate(ex.Message, 2048);
            connection.UpdatedBy = operatorId;
            connection.UpdatedAt = DateTime.UtcNow;

            batch.Status = "failed";
            batch.CompletedAtUtc = DateTimeOffset.UtcNow;
            batch.FailureMessage = Truncate(ex.Message, 2048);
            batch.UpdatedAt = DateTime.UtcNow;
            batch.UpdatedBy = operatorId;
            await _db.SaveChangesAsync(CancellationToken.None);
        }

        return new AtlasProfileResult(
            BatchId: batch.Id,
            Status: batch.Status,
            TableCount: counts.Tables,
            ColumnCount: counts.Columns,
            ViewCount: counts.Views,
            ProcedureCount: counts.Procedures,
            UdfCount: counts.Udfs,
            TriggerCount: counts.Triggers,
            ConstraintCount: counts.Constraints,
            StartedAtUtc: batch.StartedAtUtc,
            CompletedAtUtc: batch.CompletedAtUtc,
            FailureMessage: batch.FailureMessage);
    }

    // ────────────────────────────────────────────────────────────────────
    // Per-domain persisters
    // ────────────────────────────────────────────────────────────────────

    private async Task<int> PersistTablesAsync(IMetadataReader reader, SyncBatch batch, SyncSourceConnection conn, string operatorId, CancellationToken ct)
    {
        var rows = await reader.ReadTablesAsync(ct);
        foreach (var t in rows)
        {
            _db.SyncProfileTables.Add(new SyncProfileTable
            {
                CountyId = batch.CountyId,
                SyncBatchId = batch.Id,
                SourceSystem = conn.SourceSystem,
                SchemaName = t.SchemaName,
                TableName = t.TableName,
                IsView = t.IsView,
                RowCountEstimate = t.RowCountEstimate,
                ColumnCount = t.ColumnCount,
                CreatedBy = operatorId,
                UpdatedBy = operatorId
            });
        }
        await _db.SaveChangesAsync(ct);
        return rows.Count;
    }

    private async Task<int> PersistColumnsAsync(IMetadataReader reader, SyncBatch batch, SyncSourceConnection conn, string operatorId, CancellationToken ct)
    {
        var rows = await reader.ReadColumnsAsync(ct);
        foreach (var c in rows)
        {
            _db.SyncProfileColumns.Add(new SyncProfileColumn
            {
                CountyId = batch.CountyId,
                SyncBatchId = batch.Id,
                SourceSystem = conn.SourceSystem,
                SchemaName = c.SchemaName,
                TableName = c.TableName,
                ColumnName = c.ColumnName,
                OrdinalPosition = c.OrdinalPosition,
                DataType = c.DataType,
                MaxLength = c.MaxLength,
                NumericPrecision = c.NumericPrecision,
                NumericScale = c.NumericScale,
                IsNullable = c.IsNullable,
                IsPrimaryKey = c.IsPrimaryKey,
                IsForeignKey = c.IsForeignKey,
                DefaultValue = c.DefaultValue,
                CreatedBy = operatorId,
                UpdatedBy = operatorId
            });
        }
        await _db.SaveChangesAsync(ct);
        return rows.Count;
    }

    private async Task<int> PersistViewsAsync(IMetadataReader reader, SyncBatch batch, SyncSourceConnection conn, string operatorId, CancellationToken ct)
    {
        var rows = await reader.ReadViewsAsync(ct);
        foreach (var v in rows)
        {
            _db.SyncProfileViews.Add(new SyncProfileView
            {
                CountyId = batch.CountyId,
                SyncBatchId = batch.Id,
                SourceSystem = conn.SourceSystem,
                SchemaName = v.SchemaName,
                ViewName = v.ViewName,
                Definition = v.Definition,
                CreatedBy = operatorId,
                UpdatedBy = operatorId
            });
        }
        await _db.SaveChangesAsync(ct);
        return rows.Count;
    }

    private async Task<int> PersistProceduresAsync(IMetadataReader reader, SyncBatch batch, SyncSourceConnection conn, string operatorId, CancellationToken ct)
    {
        var rows = await reader.ReadProceduresAsync(ct);
        foreach (var p in rows)
        {
            _db.SyncProfileProcedures.Add(new SyncProfileProcedure
            {
                CountyId = batch.CountyId,
                SyncBatchId = batch.Id,
                SourceSystem = conn.SourceSystem,
                SchemaName = p.SchemaName,
                ProcedureName = p.ProcedureName,
                Definition = p.Definition,
                CreatedBy = operatorId,
                UpdatedBy = operatorId
            });
        }
        await _db.SaveChangesAsync(ct);
        return rows.Count;
    }

    private async Task<int> PersistUdfsAsync(IMetadataReader reader, SyncBatch batch, SyncSourceConnection conn, string operatorId, CancellationToken ct)
    {
        var rows = await reader.ReadUdfsAsync(ct);
        foreach (var f in rows)
        {
            _db.SyncProfileFunctions.Add(new SyncProfileFunction
            {
                CountyId = batch.CountyId,
                SyncBatchId = batch.Id,
                SourceSystem = conn.SourceSystem,
                SchemaName = f.SchemaName,
                FunctionName = f.FunctionName,
                FunctionType = f.FunctionType,
                Definition = f.Definition,
                CreatedBy = operatorId,
                UpdatedBy = operatorId
            });
        }
        await _db.SaveChangesAsync(ct);
        return rows.Count;
    }

    private async Task<int> PersistTriggersAsync(IMetadataReader reader, SyncBatch batch, SyncSourceConnection conn, string operatorId, CancellationToken ct)
    {
        var rows = await reader.ReadTriggersAsync(ct);
        foreach (var tr in rows)
        {
            _db.SyncProfileTriggers.Add(new SyncProfileTrigger
            {
                CountyId = batch.CountyId,
                SyncBatchId = batch.Id,
                SourceSystem = conn.SourceSystem,
                SchemaName = tr.SchemaName,
                TriggerName = tr.TriggerName,
                ParentTableName = tr.ParentTableName,
                IsAfter = tr.IsAfter,
                IsInsteadOf = tr.IsInsteadOf,
                Events = tr.Events,
                Definition = tr.Definition,
                CreatedBy = operatorId,
                UpdatedBy = operatorId
            });
        }
        await _db.SaveChangesAsync(ct);
        return rows.Count;
    }

    private async Task<int> PersistConstraintsAsync(IMetadataReader reader, SyncBatch batch, SyncSourceConnection conn, string operatorId, CancellationToken ct)
    {
        var rows = await reader.ReadConstraintsAsync(ct);
        foreach (var k in rows)
        {
            _db.SyncProfileConstraints.Add(new SyncProfileConstraint
            {
                CountyId = batch.CountyId,
                SyncBatchId = batch.Id,
                SourceSystem = conn.SourceSystem,
                SchemaName = k.SchemaName,
                TableName = k.TableName,
                ConstraintName = k.ConstraintName,
                ConstraintType = k.ConstraintType,
                Definition = k.Definition,
                ReferencedTable = k.ReferencedTable,
                ReferencedColumns = k.ReferencedColumns,
                CreatedBy = operatorId,
                UpdatedBy = operatorId
            });
        }
        await _db.SaveChangesAsync(ct);
        return rows.Count;
    }

    private static string Truncate(string s, int max)
        => s.Length <= max ? s : s[..max];

    private sealed class ProfileCounts
    {
        public int Tables;
        public int Columns;
        public int Views;
        public int Procedures;
        public int Udfs;
        public int Triggers;
        public int Constraints;
        public int Total => Tables + Columns + Views + Procedures + Udfs + Triggers + Constraints;
    }
}
