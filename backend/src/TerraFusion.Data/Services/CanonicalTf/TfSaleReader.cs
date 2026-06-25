using System;
using System.Linq;
using System.Linq.Expressions;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using TerraFusion.Abstractions.DTOs.CanonicalTf;
using TerraFusion.Core.Entities.CanonicalTf;
using TerraFusion.Core.Entities.TruthPacs;
using TerraFusion.Core.Sync.PacsSaleCanonical;
using TerraFusion.Core.Sync.SalesRatioStudy;

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
///
/// <para>Slice G3 (v1.12): supports the <c>era</c> conversion-era
/// filter via the same predicate shape as
/// <c>SalesRatioStudyReader</c> — pre-G2 NULL rows fall back to a
/// year-derived era using <c>SlDt</c> vs the cutover date.</para>
/// </summary>
public sealed class TfSaleReader : ITfSaleReader
{
    private static readonly DateTime EraCutoverDate =
        new(ConversionEras.CutoverYear, 1, 1, 0, 0, 0, DateTimeKind.Utc);

    private readonly TerraFusionDbContext _db;

    public TfSaleReader(TerraFusionDbContext db) => _db = db;

    public async Task<PagedTfSaleResponse> ReadAsync(
        Guid countyId,
        int page,
        int pageSize,
        string? era = null,
        CancellationToken cancellationToken = default)
    {
        var eraPredicate = ResolveEraPredicate(era);
        var baseQuery = _db.TfSales
            .AsNoTracking()
            .Where(s => s.CountyId == countyId)
            .Where(eraPredicate);

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

    /// <summary>
    /// Slice G3 (v1.12): mirrors
    /// <c>SalesRatioStudyReader.ResolveEraPredicate</c>. Null →
    /// POST_CONVERSION; ALL bypasses the filter; recognized eras
    /// match column equality with year fallback for POST/PRE when
    /// <c>ConversionEra</c> is NULL (pre-G2 rows).
    /// </summary>
    private static Expression<Func<TfSale, bool>> ResolveEraPredicate(string? era)
    {
        var resolved = era ?? ConversionEras.PostConversion;

        if (resolved == ISalesRatioStudyReader.EraAll)
        {
            return _ => true;
        }
        if (resolved == ConversionEras.PostConversion)
        {
            return s => s.ConversionEra == ConversionEras.PostConversion
                || (s.ConversionEra == null && s.SlDt != null && s.SlDt >= EraCutoverDate);
        }
        if (resolved == ConversionEras.PreConversion2017)
        {
            return s => s.ConversionEra == ConversionEras.PreConversion2017
                || (s.ConversionEra == null && s.SlDt != null && s.SlDt < EraCutoverDate);
        }
        if (resolved == ConversionEras.Unknown)
        {
            return s => s.ConversionEra == ConversionEras.Unknown;
        }

        throw new ArgumentException(
            $"Unrecognized era '{era}'. Valid values: " +
            $"{ConversionEras.PostConversion}, {ConversionEras.PreConversion2017}, " +
            $"{ConversionEras.Unknown}, {ISalesRatioStudyReader.EraAll}.",
            nameof(era));
    }
}
