using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using TerraFusion.Core.Entities.Canonical;
using TerraFusion.Data;

namespace TerraFusion.Sync.Workbench.Comps.Sales;

/// <summary>
/// Slice C37-B implementation of <see cref="ISalesCompEligibilityReader"/>.
/// Pure projection of <c>CanonicalSaleQualifications</c> through the
/// C37-A selection rule:
/// <c>CountyId = @countyId AND ComputedDecision = Qualified</c>
/// (with optional <c>SourceWorkbookId = @workbookId</c> when the
/// caller pins).
///
/// <para>Uses <c>AsNoTracking()</c> + the C35-B
/// <c>IX_CanonicalSaleQualifications_County_Decision</c> covering
/// index. The query is read-only by construction — no <c>Add</c> /
/// <c>Update</c> / <c>SaveChangesAsync</c> calls anywhere in this
/// class.</para>
///
/// <para>Result is sorted by <c>ChgOfOwnerId</c> so re-runs against
/// identical canonical state produce identical evidence ordering.
/// This satisfies C37-A Hard Guard 6 (idempotent).</para>
/// </summary>
public sealed class SalesCompEligibilityReader : ISalesCompEligibilityReader
{
    private readonly TerraFusionDbContext _db;

    public SalesCompEligibilityReader(TerraFusionDbContext db)
    {
        ArgumentNullException.ThrowIfNull(db);
        _db = db;
    }

    public async Task<IReadOnlyList<CompEligibleSale>> ReadAsync(
        Guid countyId,
        Guid? sourceWorkbookId,
        CancellationToken cancellationToken = default)
    {
        if (countyId == Guid.Empty)
        {
            throw new ArgumentException("CountyId is required.", nameof(countyId));
        }

        // EF expression trees don't permit named arguments in
        // constructor calls, so positional construction here. Order is
        // anchored by the CompEligibleSale record's parameter list.
        var rows = await BaseQuery(countyId, sourceWorkbookId)
            .OrderBy(r => r.ChgOfOwnerId)
            .Select(r => new CompEligibleSale(
                r.ChgOfOwnerId,
                r.WacCdSourceValue,
                r.WacCdCanonicalValue,
                r.SlRatioTypeCdSourceValue,
                r.SlRatioTypeCdCanonicalValue,
                r.SaleDate,
                r.SalePrice,
                r.SourceWorkbookId,
                r.SourceWorkbookLockedAt))
            .ToListAsync(cancellationToken);

        return rows;
    }

    public async Task<IReadOnlyList<CompEligibleSale>> ReadPageAsync(
        Guid countyId,
        Guid? sourceWorkbookId,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        if (countyId == Guid.Empty)
        {
            throw new ArgumentException("CountyId is required.", nameof(countyId));
        }
        if (page < 1)
        {
            throw new ArgumentOutOfRangeException(nameof(page), "page must be >= 1.");
        }
        if (pageSize < 1)
        {
            throw new ArgumentOutOfRangeException(nameof(pageSize), "pageSize must be >= 1.");
        }

        var query = BaseQuery(countyId, sourceWorkbookId);

        // Skip/Take pushes into the SQL layer (or InMemory provider)
        // so the unpaginated row set never materializes server-side.
        var skip = (page - 1) * pageSize;

        var rows = await query
            .OrderBy(r => r.ChgOfOwnerId)
            .Skip(skip)
            .Take(pageSize)
            .Select(r => new CompEligibleSale(
                r.ChgOfOwnerId,
                r.WacCdSourceValue,
                r.WacCdCanonicalValue,
                r.SlRatioTypeCdSourceValue,
                r.SlRatioTypeCdCanonicalValue,
                r.SaleDate,
                r.SalePrice,
                r.SourceWorkbookId,
                r.SourceWorkbookLockedAt))
            .ToListAsync(cancellationToken);

        return rows;
    }

    public Task<int> CountAsync(
        Guid countyId,
        Guid? sourceWorkbookId,
        CancellationToken cancellationToken = default)
    {
        if (countyId == Guid.Empty)
        {
            throw new ArgumentException("CountyId is required.", nameof(countyId));
        }

        return BaseQuery(countyId, sourceWorkbookId).CountAsync(cancellationToken);
    }

    public async Task<DateTime?> MaxLockedAtAsync(
        Guid countyId,
        Guid? sourceWorkbookId,
        CancellationToken cancellationToken = default)
    {
        if (countyId == Guid.Empty)
        {
            throw new ArgumentException("CountyId is required.", nameof(countyId));
        }

        // EF Core's MaxAsync on an empty source throws; project to
        // nullable first so the empty-set case returns null cleanly.
        return await BaseQuery(countyId, sourceWorkbookId)
            .Select(r => (DateTime?)r.SourceWorkbookLockedAt)
            .MaxAsync(cancellationToken);
    }

    /// <summary>
    /// Build the shared base query used by every public surface.
    /// Anchors the C37-A selection rule
    /// (<c>ComputedDecision = Qualified</c>) and the optional
    /// workbook-pin in one place so the unpaginated, paginated, and
    /// count overloads can never drift.
    /// </summary>
    private IQueryable<CanonicalSaleQualification> BaseQuery(
        Guid countyId,
        Guid? sourceWorkbookId)
    {
        var query = _db.CanonicalSaleQualifications
            .AsNoTracking()
            .Where(r => r.CountyId == countyId
                     && r.ComputedDecision == CanonicalSaleQualificationDecision.Qualified);

        if (sourceWorkbookId.HasValue && sourceWorkbookId.Value != Guid.Empty)
        {
            var pin = sourceWorkbookId.Value;
            query = query.Where(r => r.SourceWorkbookId == pin);
        }

        return query;
    }
}
