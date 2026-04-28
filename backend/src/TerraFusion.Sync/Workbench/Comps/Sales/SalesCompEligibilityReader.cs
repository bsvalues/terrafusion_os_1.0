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

        // The base predicate. Keep this in sync with the C37-A
        // selection rule and the SQL view definition. Both must
        // resolve to the same row set for a given county.
        var query = _db.CanonicalSaleQualifications
            .AsNoTracking()
            .Where(r => r.CountyId == countyId
                     && r.ComputedDecision == CanonicalSaleQualificationDecision.Qualified);

        if (sourceWorkbookId.HasValue && sourceWorkbookId.Value != Guid.Empty)
        {
            // Workbook-pin is opt-in per Hard Guard 7. We do NOT
            // default to a workbook here — when null, all Qualified
            // rows are returned regardless of provenance. Filtering on
            // a non-empty Guid only.
            var pin = sourceWorkbookId.Value;
            query = query.Where(r => r.SourceWorkbookId == pin);
        }

        // EF expression trees don't permit named arguments in
        // constructor calls, so positional construction here. Order is
        // anchored by the CompEligibleSale record's parameter list.
        var rows = await query
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
}
