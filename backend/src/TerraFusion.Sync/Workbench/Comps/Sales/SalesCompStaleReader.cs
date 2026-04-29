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
/// Slice C43-B implementation of <see cref="ISalesCompStaleReader"/>.
/// Pure projection of <c>CanonicalSaleQualifications</c> through the
/// C43-A predicate:
/// <c>CountyId = @countyId AND SourceWorkbookId &lt;&gt; @baselineWorkbookId</c>.
///
/// <para>Uses <c>AsNoTracking()</c> + the existing
/// <c>IX_CanonSaleQual_County_Decision</c> index for the
/// <c>CountyId</c> seek; the inequality on
/// <c>SourceWorkbookId</c> is a residual filter inside the seek.
/// At Benton scale this is cheap; future counties at much larger
/// scale may want a composite <c>(CountyId, SourceWorkbookId)</c>
/// index — flagged in the C43-A policy doc, deferred to its own
/// slice if benchmarks demand.</para>
///
/// <para>Result is sorted by <c>ChgOfOwnerId</c> ascending so
/// re-runs against identical canonical state produce identical
/// evidence ordering and cursor stability across pages (C43-A
/// Hard Guard 8 / inherited C39-A Hard Guard 4).</para>
/// </summary>
public sealed class SalesCompStaleReader : ISalesCompStaleReader
{
    private readonly TerraFusionDbContext _db;

    public SalesCompStaleReader(TerraFusionDbContext db)
    {
        ArgumentNullException.ThrowIfNull(db);
        _db = db;
    }

    public async Task<IReadOnlyList<StaleCanonicalSale>> ReadPageAsync(
        Guid countyId,
        Guid baselineWorkbookId,
        int  page,
        int  pageSize,
        CancellationToken cancellationToken = default)
    {
        ValidateInputs(countyId, baselineWorkbookId);
        if (page < 1)
            throw new ArgumentOutOfRangeException(nameof(page), "page must be >= 1.");
        if (pageSize < 1)
            throw new ArgumentOutOfRangeException(nameof(pageSize), "pageSize must be >= 1.");

        var skip = (page - 1) * pageSize;

        // Skip/Take pushes into the SQL layer (or InMemory provider)
        // so the unpaginated stale set never materializes server-side.
        // Casting the enum to int in the projection avoids EF
        // expression-tree complaints with named arguments.
        var rows = await BaseQuery(countyId, baselineWorkbookId)
            .OrderBy(r => r.ChgOfOwnerId)
            .Skip(skip)
            .Take(pageSize)
            .Select(r => new StaleCanonicalSale(
                r.ChgOfOwnerId,
                (int)r.ComputedDecision,
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
        Guid baselineWorkbookId,
        CancellationToken cancellationToken = default)
    {
        ValidateInputs(countyId, baselineWorkbookId);
        return BaseQuery(countyId, baselineWorkbookId).CountAsync(cancellationToken);
    }

    public async Task<DateTime?> MaxLockedAtAsync(
        Guid countyId,
        Guid baselineWorkbookId,
        CancellationToken cancellationToken = default)
    {
        ValidateInputs(countyId, baselineWorkbookId);
        return await BaseQuery(countyId, baselineWorkbookId)
            .Select(r => (DateTime?)r.SourceWorkbookLockedAt)
            .MaxAsync(cancellationToken);
    }

    /// <summary>
    /// Single-source-of-truth predicate per C43-A Hard Guard 1:
    /// <c>CountyId = @countyId AND SourceWorkbookId &lt;&gt;
    /// @baselineWorkbookId</c>. Both <see cref="ReadPageAsync"/>
    /// and <see cref="CountAsync"/> share this so the count and
    /// the page rows can never drift.
    /// </summary>
    private IQueryable<CanonicalSaleQualification> BaseQuery(
        Guid countyId, Guid baselineWorkbookId)
    {
        return _db.CanonicalSaleQualifications
            .AsNoTracking()
            .Where(r => r.CountyId == countyId
                     && r.SourceWorkbookId != baselineWorkbookId);
    }

    private static void ValidateInputs(Guid countyId, Guid baselineWorkbookId)
    {
        if (countyId == Guid.Empty)
            throw new ArgumentException("CountyId is required.", nameof(countyId));
        if (baselineWorkbookId == Guid.Empty)
            throw new ArgumentException(
                "BaselineWorkbookId is required (resolve via explicit query param or active-workbook pointer before calling the reader).",
                nameof(baselineWorkbookId));
    }
}
