using Microsoft.EntityFrameworkCore;
using TerraFusion.Core.Entities.Sync.Profile;
using TerraFusion.Data;

namespace TerraFusion.Sync.Workbench.Atlas;

/// <summary>
/// Default <see cref="IDeepProfilePersistenceService"/> implementation. Writes
/// a single <see cref="DeepProfileResult"/> into the Slice B2.1 stats schema
/// using replace-for-batch-and-table semantics.
///
/// Implementation notes:
///   - The delete + insert happen in one <see cref="DbContext.SaveChangesAsync(CancellationToken)"/>
///     call so EF emits both phases transactionally on providers that support
///     transactions; on the in-memory provider used in tests, the operation
///     is naturally atomic.
///   - We materialize the existing rows via <c>ToListAsync</c> + <c>RemoveRange</c>
///     rather than <c>ExecuteDeleteAsync</c> so the in-memory provider keeps
///     working — <c>ExecuteDeleteAsync</c> requires a relational provider.
///     The deep-profile delete set is small (one table's worth, ~hundreds of
///     column-stats rows worst case), so the round trip is bounded.
///   - Field copying is explicit. We do NOT rely on auto-mapping or reflection
///     so a future entity-shape change forces a compile error here, which is
///     the right place for that signal to land.
/// </summary>
public sealed class DeepProfilePersistenceService : IDeepProfilePersistenceService
{
    private readonly TerraFusionDbContext _db;

    public DeepProfilePersistenceService(TerraFusionDbContext db)
    {
        ArgumentNullException.ThrowIfNull(db);
        _db = db;
    }

    public async System.Threading.Tasks.Task PersistAsync(
        Guid countyId,
        Guid profileBatchId,
        DeepProfileResult result,
        CancellationToken cancellationToken)
    {
        if (countyId == Guid.Empty)
        {
            throw new ArgumentException(
                "CountyId is required for deep-profile persistence.",
                nameof(countyId));
        }
        if (profileBatchId == Guid.Empty)
        {
            throw new ArgumentException(
                "ProfileBatchId is required for deep-profile persistence.",
                nameof(profileBatchId));
        }
        ArgumentNullException.ThrowIfNull(result);
        ArgumentNullException.ThrowIfNull(result.Table);

        var schemaName = result.Table.SchemaName;
        var tableName  = result.Table.TableName;

        // ── Phase 1: drop prior rows for THIS (batch, table) scope only.
        //    Other tables in the same batch and rows from other batches are
        //    untouched. B1 structural metadata
        //    (SyncProfileTable / Column / View / Procedure / etc.) is not
        //    queried at all — we don't need to delete what we didn't write.
        var existingTableStats = await _db.SyncProfileTableStats
            .Where(x => x.CountyId    == countyId
                     && x.SyncBatchId == profileBatchId
                     && x.SchemaName  == schemaName
                     && x.TableName   == tableName)
            .ToListAsync(cancellationToken);
        if (existingTableStats.Count > 0)
        {
            _db.SyncProfileTableStats.RemoveRange(existingTableStats);
        }

        var existingColumnStats = await _db.SyncProfileColumnStats
            .Where(x => x.CountyId    == countyId
                     && x.SyncBatchId == profileBatchId
                     && x.SchemaName  == schemaName
                     && x.TableName   == tableName)
            .ToListAsync(cancellationToken);
        if (existingColumnStats.Count > 0)
        {
            _db.SyncProfileColumnStats.RemoveRange(existingColumnStats);
        }

        var existingCodeCandidates = await _db.SyncProfileCodeCandidates
            .Where(x => x.CountyId    == countyId
                     && x.SyncBatchId == profileBatchId
                     && x.SchemaName  == schemaName
                     && x.TableName   == tableName)
            .ToListAsync(cancellationToken);
        if (existingCodeCandidates.Count > 0)
        {
            _db.SyncProfileCodeCandidates.RemoveRange(existingCodeCandidates);
        }

        // ── Phase 2: insert fresh rows from the result.
        var now = DateTime.UtcNow;

        _db.SyncProfileTableStats.Add(new SyncProfileTableStats
        {
            Id              = Guid.NewGuid(),
            CountyId        = countyId,
            SyncBatchId     = profileBatchId,
            SourceSystem    = "PACS",
            SchemaName      = result.Table.SchemaName,
            TableName       = result.Table.TableName,
            RowCount        = result.Table.RowCount,
            RowCountIsExact = result.Table.RowCountIsExact,
            SampleRowCount  = result.Table.SampleRowCount,
            SamplingMethod  = result.Table.SamplingMethod,
            CreatedAt       = now,
            UpdatedAt       = now,
        });

        foreach (var col in result.Columns)
        {
            _db.SyncProfileColumnStats.Add(new SyncProfileColumnStats
            {
                Id                   = Guid.NewGuid(),
                CountyId             = countyId,
                SyncBatchId          = profileBatchId,
                SourceSystem         = "PACS",
                SchemaName           = col.SchemaName,
                TableName            = col.TableName,
                ColumnName           = col.ColumnName,
                ParentRowCount       = col.ParentRowCount,
                NullCount            = col.NullCount,
                NullPct              = col.NullPct,
                DistinctCount        = col.DistinctCount,
                DistinctCountIsExact = col.DistinctCountIsExact,
                MinValue             = col.MinValue,
                MaxValue             = col.MaxValue,
                SampleValuesJson     = col.SampleValuesJson,
                TopValuesJson        = col.TopValuesJson,
                CreatedAt            = now,
                UpdatedAt            = now,
            });
        }

        foreach (var cand in result.CodeCandidates)
        {
            _db.SyncProfileCodeCandidates.Add(new SyncProfileCodeCandidate
            {
                Id                 = Guid.NewGuid(),
                CountyId           = countyId,
                SyncBatchId        = profileBatchId,
                SourceSystem       = "PACS",
                SchemaName         = cand.SchemaName,
                TableName          = cand.TableName,
                ColumnName         = cand.ColumnName,
                DistinctCount      = cand.DistinctCount,
                SampleSize         = cand.SampleSize,
                DistinctRatio      = cand.DistinctRatio,
                Reason             = cand.Reason,
                CandidateCodesJson = cand.CandidateCodesJson,
                CreatedAt          = now,
                UpdatedAt          = now,
            });
        }

        await _db.SaveChangesAsync(cancellationToken);
    }
}
