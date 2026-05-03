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
/// Slice C44-B implementation of <see cref="ISalesCompStaleSummaryReader"/>.
/// Three single-predicate aggregations against
/// <c>CanonicalSaleQualifications</c> sharing the C43-B / C44-A
/// stale predicate
/// <c>WHERE CountyId = @countyId AND SourceWorkbookId &lt;&gt;
/// @baselineWorkbookId</c>.
///
/// <para>EF translates <see cref="GroupAsync"/>'s
/// <c>GroupBy</c>+<c>OrderByDescending</c>+<c>Take</c> to a
/// server-side aggregation; the unpaginated group set never
/// materializes server-side. Tie-break ordering on
/// <c>SourceWorkbookId</c> is locked per C44-A Hard Guard 8.</para>
///
/// <para><see cref="GroupCountAsync"/> uses
/// <c>Select(...).Distinct().CountAsync()</c> so the controller
/// can detect truncation cheaply without materializing the full
/// group list.</para>
/// </summary>
public sealed class SalesCompStaleSummaryReader : ISalesCompStaleSummaryReader
{
    private readonly TerraFusionDbContext _db;

    public SalesCompStaleSummaryReader(TerraFusionDbContext db)
    {
        ArgumentNullException.ThrowIfNull(db);
        _db = db;
    }

    public async Task<IReadOnlyList<StaleSummaryGroupRow>> GroupAsync(
        Guid countyId,
        Guid baselineWorkbookId,
        int  maxGroups,
        CancellationToken cancellationToken = default)
    {
        ValidateInputs(countyId, baselineWorkbookId);
        if (maxGroups < 1)
            throw new ArgumentOutOfRangeException(nameof(maxGroups), "maxGroups must be >= 1.");

        // Project to (SourceWorkbookId, ComputedDecision-as-int)
        // first so the GROUP BY pushes into SQL cleanly. Cast the
        // enum to int in the projection step; EF can't translate a
        // GROUP BY directly on the enum-typed column on every
        // provider.
        var grouped = await BaseQuery(countyId, baselineWorkbookId)
            .Select(r => new
            {
                r.SourceWorkbookId,
                Decision = (int)r.ComputedDecision,
            })
            .GroupBy(x => new { x.SourceWorkbookId, x.Decision })
            .Select(g => new
            {
                g.Key.SourceWorkbookId,
                g.Key.Decision,
                Count = g.Count(),
            })
            .OrderByDescending(g => g.Count)
            .ThenBy(g => g.SourceWorkbookId)
            .Take(maxGroups)
            .ToListAsync(cancellationToken);

        return grouped
            .Select(g => new StaleSummaryGroupRow(g.SourceWorkbookId, g.Decision, g.Count))
            .ToList();
    }

    public async Task<int> GroupCountAsync(
        Guid countyId,
        Guid baselineWorkbookId,
        CancellationToken cancellationToken = default)
    {
        ValidateInputs(countyId, baselineWorkbookId);

        // Distinct (SourceWorkbookId, ComputedDecision) tuples →
        // count of groups. Cheaper than materializing the full
        // GROUP BY just to count its rows.
        return await BaseQuery(countyId, baselineWorkbookId)
            .Select(r => new
            {
                r.SourceWorkbookId,
                Decision = (int)r.ComputedDecision,
            })
            .Distinct()
            .CountAsync(cancellationToken);
    }

    public Task<int> TotalStaleRowsAsync(
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
    /// Single-source-of-truth predicate per C44-A Hard Guard 1
    /// (mirrors the C43-B per-row reader so both endpoints can
    /// never drift in their definition of "stale").
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
