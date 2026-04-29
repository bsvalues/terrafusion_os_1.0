using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using TerraFusion.Core.Entities.Sync;
using TerraFusion.Core.Entities.Sync.Mapping;
using TerraFusion.Data;

namespace TerraFusion.Sync.Workbench.Mapping;

/// <summary>
/// Slice C41-B implementation of <see cref="ISyncCountyActiveWorkbookService"/>.
/// Pure metadata service over <c>SyncCountyActiveWorkbooks</c>; no
/// canonical / PACS / workbook mutation surfaces touched.
///
/// <para>The service relies on the existing
/// <c>AuditableEntityInterceptor</c> in
/// <see cref="TerraFusionDbContext"/> to populate FISMA audit
/// fields and to write the audit-trail row that records the
/// pointer change to <c>AuditLogs</c>. The service itself does NOT
/// write to <c>AuditLogs</c> directly.</para>
/// </summary>
public sealed class SyncCountyActiveWorkbookService : ISyncCountyActiveWorkbookService
{
    /// <summary>
    /// The required workbook <c>Status</c> for a successful SET
    /// (Hard Guard 2). Mirrors the constant used by the C7 read
    /// model so a future status-name change touches one place.
    /// </summary>
    private const string MappedStatus = "Mapped";

    private readonly TerraFusionDbContext _db;

    public SyncCountyActiveWorkbookService(TerraFusionDbContext db)
    {
        ArgumentNullException.ThrowIfNull(db);
        _db = db;
    }

    public async Task<SyncCountyActiveWorkbookSnapshot?> GetAsync(
        Guid countyId,
        CancellationToken cancellationToken = default)
    {
        if (countyId == Guid.Empty)
        {
            throw new ArgumentException("CountyId is required.", nameof(countyId));
        }

        var row = await _db.SyncCountyActiveWorkbooks
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.CountyId == countyId, cancellationToken);

        return row is null ? null : ToSnapshot(row);
    }

    public async Task<SyncCountyActiveWorkbookSnapshot> SetAsync(
        Guid countyId,
        Guid workbookId,
        string operatorId,
        string? reason,
        CancellationToken cancellationToken = default)
    {
        if (countyId == Guid.Empty)
            throw new ArgumentException("CountyId is required.", nameof(countyId));
        if (workbookId == Guid.Empty)
            throw new ArgumentException("WorkbookId is required.", nameof(workbookId));
        if (string.IsNullOrWhiteSpace(operatorId))
            throw new ArgumentException("OperatorId is required.", nameof(operatorId));

        // ── Hard Guard 2: target must be Mapped + same county ──
        // Look up the workbook ahead of touching the pointer so
        // the validation error surfaces before any audit-log row
        // gets written.
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
        if (!string.Equals(workbook.Status, MappedStatus, StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException(
                $"Mapping workbook {workbookId} has Status='{workbook.Status}'. " +
                $"Only workbooks with Status='{MappedStatus}' can be promoted to active.");
        }

        var existing = await _db.SyncCountyActiveWorkbooks
            .FirstOrDefaultAsync(p => p.CountyId == countyId, cancellationToken);

        // ── Hard Guard 3: SET is idempotent. If the existing
        //    pointer already names this workbook, short-circuit
        //    without any state change so the audit log stays
        //    quiet. ──
        if (existing is not null && existing.ActiveWorkbookId == workbookId)
        {
            return ToSnapshot(existing);
        }

        var nowUtc = DateTime.UtcNow;
        if (existing is null)
        {
            var fresh = new SyncCountyActiveWorkbook
            {
                CountyId         = countyId,
                ActiveWorkbookId = workbookId,
                SetAt            = nowUtc,
                SetBy            = operatorId,
                SetReason        = reason,
                CreatedAt        = nowUtc,
                UpdatedAt        = nowUtc,
                CreatedBy        = operatorId,
                UpdatedBy        = operatorId,
            };
            _db.SyncCountyActiveWorkbooks.Add(fresh);
            await _db.SaveChangesAsync(cancellationToken);
            return ToSnapshot(fresh);
        }

        existing.ActiveWorkbookId = workbookId;
        existing.SetAt            = nowUtc;
        existing.SetBy            = operatorId;
        existing.SetReason        = reason;
        existing.UpdatedAt        = nowUtc;
        existing.UpdatedBy        = operatorId;
        await _db.SaveChangesAsync(cancellationToken);
        return ToSnapshot(existing);
    }

    public async Task ClearAsync(
        Guid countyId,
        string operatorId,
        CancellationToken cancellationToken = default)
    {
        if (countyId == Guid.Empty)
            throw new ArgumentException("CountyId is required.", nameof(countyId));
        if (string.IsNullOrWhiteSpace(operatorId))
            throw new ArgumentException("OperatorId is required.", nameof(operatorId));

        var existing = await _db.SyncCountyActiveWorkbooks
            .FirstOrDefaultAsync(p => p.CountyId == countyId, cancellationToken);
        if (existing is null)
        {
            // Hard Guard: clearing a county with no pointer is a
            // no-op. No exception; no audit-log entry.
            return;
        }

        _db.SyncCountyActiveWorkbooks.Remove(existing);
        await _db.SaveChangesAsync(cancellationToken);
    }

    private static SyncCountyActiveWorkbookSnapshot ToSnapshot(SyncCountyActiveWorkbook row)
        => new(row.CountyId, row.ActiveWorkbookId, row.SetAt, row.SetBy, row.SetReason);
}
