using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using TerraFusion.Data;

namespace TerraFusion.Sync.Workbench.Mapping;

/// <summary>
/// Slice C7 implementation. Loads a county-scoped, Mapped Mapping
/// Workbook into an immutable <see cref="SyncMappingWorkbookSnapshot"/>
/// suitable for transform consumers (Slice C8+). See
/// <see cref="ISyncMappingWorkbookReadModel"/> for the contract.
/// </summary>
public sealed class SyncMappingWorkbookReadModel : ISyncMappingWorkbookReadModel
{
    /// <summary>The required workbook Status for a successful load.</summary>
    public const string RequiredStatus = "Mapped";

    private readonly TerraFusionDbContext _db;

    public SyncMappingWorkbookReadModel(TerraFusionDbContext db)
    {
        ArgumentNullException.ThrowIfNull(db);
        _db = db;
    }

    public async Task<SyncMappingWorkbookSnapshot> LoadMappedAsync(
        Guid countyId,
        Guid workbookId,
        CancellationToken cancellationToken = default)
    {
        if (countyId == Guid.Empty)
            throw new ArgumentException("CountyId is required.", nameof(countyId));
        if (workbookId == Guid.Empty)
            throw new ArgumentException("WorkbookId is required.", nameof(workbookId));

        // 1. County-scoped workbook lookup. Refuse cross-county.
        var workbook = await _db.SyncMappingWorkbooks
            .AsNoTracking()
            .FirstOrDefaultAsync(
                w => w.Id == workbookId && w.CountyId == countyId,
                cancellationToken);
        if (workbook is null)
        {
            throw new InvalidOperationException(
                $"Mapping workbook {workbookId} not found for county {countyId}.");
        }

        // 2. Status gate. Only Mapped workbooks load.
        if (!string.Equals(workbook.Status, RequiredStatus, StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException(
                $"Mapping workbook {workbookId} has Status='{workbook.Status}'. " +
                $"Only workbooks with Status='{RequiredStatus}' are readable through " +
                $"the transform read model.");
        }

        // 3. Pull columns + values, deterministically ordered. The
        //    snapshot's per-column CodeValues dictionary is keyed by the
        //    TRIMMED SourceValue so the consumer-facing TryResolveCode
        //    can do an exact-after-trim lookup without re-trimming
        //    every entry.
        var columns = await _db.SyncMappingColumns
            .AsNoTracking()
            .Where(c => c.WorkbookId == workbookId)
            .OrderBy(c => c.MappingLane)
            .ThenBy(c => c.SourceSchema)
            .ThenBy(c => c.SourceTable)
            .ThenBy(c => c.SourceColumn)
            .ToListAsync(cancellationToken);

        var columnIds = columns.Select(c => c.Id).ToList();

        var codeValues = await _db.SyncMappingCodeValues
            .AsNoTracking()
            .Where(v => columnIds.Contains(v.MappingColumnId))
            .ToListAsync(cancellationToken);

        var codeValuesByColumn = codeValues
            .GroupBy(v => v.MappingColumnId)
            .ToDictionary(g => g.Key, g => g.ToList());

        var decisions = new List<SyncMappingColumnDecision>(columns.Count);
        foreach (var column in columns)
        {
            // Per-column dictionary keyed by trimmed source value. Use
            // ordinal-equal — PACS values are case-significant, but
            // trailing-padding noise is not.
            var map = new Dictionary<string, SyncMappingCodeDecision>(StringComparer.Ordinal);
            if (codeValuesByColumn.TryGetValue(column.Id, out var rows))
            {
                foreach (var v in rows.OrderBy(x => x.SourceValue, StringComparer.Ordinal))
                {
                    var trimmed = v.SourceValue?.Trim() ?? string.Empty;
                    // Defensive: if the raw rows ever held duplicate
                    // (column, source-value) pairs, the EF unique index
                    // (C2) prevents that. If somehow we did see one,
                    // last-write-wins gives the snapshot a deterministic
                    // shape rather than throwing.
                    map[trimmed] = new SyncMappingCodeDecision(
                        CodeValueId:    v.Id,
                        SourceValue:    v.SourceValue ?? string.Empty,
                        SourceLabel:    v.SourceLabel,
                        ObservedCount:  v.ObservedCount,
                        CanonicalValue: v.CanonicalValue,
                        ReviewStatus:   v.ReviewStatus,
                        IsExcluded:     v.IsExcluded);
                }
            }

            decisions.Add(new SyncMappingColumnDecision(
                MappingColumnId: column.Id,
                MappingLane:     column.MappingLane,
                SourceSchema:    column.SourceSchema,
                SourceTable:     column.SourceTable,
                SourceColumn:    column.SourceColumn,
                CanonicalTarget: column.CanonicalTarget,
                ReviewStatus:    column.ReviewStatus,
                CodeValues:      map));
        }

        return new SyncMappingWorkbookSnapshot(
            WorkbookId:     workbook.Id,
            CountyId:       workbook.CountyId,
            ProfileBatchId: workbook.ProfileBatchId,
            Name:           workbook.Name,
            Columns:        decisions,
            UpdatedAt:      workbook.UpdatedAt);
    }
}
