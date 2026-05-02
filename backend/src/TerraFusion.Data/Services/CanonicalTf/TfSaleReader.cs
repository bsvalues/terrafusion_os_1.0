using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using TerraFusion.Core.DTOs.CanonicalTf;
using TerraFusion.Core.Sync.PacsSaleCanonical;

namespace TerraFusion.Data.Services.CanonicalTf;

/// <summary>
/// Slice S4: EF-backed implementation of
/// <see cref="ITfSaleReader"/>. <c>AsNoTracking</c> on every query;
/// no <c>SaveChangesAsync</c>; deterministic ordering by
/// <c>(SlDt DESC, ChgOfOwnerId DESC)</c>.
///
/// <para>The reader does NOT enforce county isolation on its own —
/// the controller is responsible for verifying the principal's
/// <c>countyId</c> claim before invoking this. The
/// <paramref name="countyId"/> filter applied here is the
/// belt-and-suspenders enforcement at the read path.</para>
/// </summary>
public sealed class TfSaleReader : ITfSaleReader
{
    private readonly TerraFusionDbContext _db;

    public TfSaleReader(TerraFusionDbContext db) => _db = db;

    public async Task<PagedTfSaleResponse> ReadAsync(
        Guid countyId,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        var baseQuery = _db.TfSales
            .AsNoTracking()
            .Where(s => s.CountyId == countyId);

        var totalCount = await baseQuery
            .CountAsync(cancellationToken)
            .ConfigureAwait(false);

        var totalPages = totalCount == 0
            ? 0
            : (int)Math.Ceiling(totalCount / (double)pageSize);

        var items = await baseQuery
            .OrderByDescending(s => s.SlDt)
            .ThenByDescending(s => s.ChgOfOwnerId)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(s => new TfSaleResponse
            {
                TfSaleId = s.TfSaleId,
                CountyId = s.CountyId,
                TfParcelId = s.TfParcelId,
                ChgOfOwnerId = s.ChgOfOwnerId,
                SlDt = s.SlDt,
                SlPrice = s.SlPrice,
                AdjSlPrice = s.AdjSlPrice,
                SaleQualified = s.SaleQualified,
            })
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        return new PagedTfSaleResponse
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount,
            TotalPages = totalPages,
            HasNextPage = page < totalPages,
            HasPreviousPage = page > 1 && totalCount > 0,
        };
    }
}
