using System;
using System.Linq;
using System.Linq.Expressions;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using TerraFusion.Core.DTOs.CanonicalTf;
using TerraFusion.Core.Entities.CanonicalTf;
using TerraFusion.Core.Entities.TruthPacs;
using TerraFusion.Core.Sync.PacsOwnerCanonical;
using TerraFusion.Core.Sync.SalesRatioStudy;

namespace TerraFusion.Data.Services.CanonicalTf;

/// <summary>
/// Slice B5: EF-backed implementation of
/// <see cref="ITfParcelOwnerReader"/>.
///
/// <para>Read-only by contract. The reader does NOT enforce county
/// isolation on its own — the controller verifies the principal's
/// claim against <see cref="ParcelOwnerLookup.CountyId"/> before
/// returning the payload.</para>
///
/// <para>Ordering: primary owners first (<c>IsPrimary DESC</c>),
/// then by descending <c>PctOwnership</c>. Stable across requests.</para>
///
/// <para>Slice G3 (v1.12): supports the <c>era</c> conversion-era
/// filter on the joined <c>tf_owner</c> row. <c>tf_owner</c> has no
/// year column for fallback (per the entity contract), so pre-G2
/// rows whose <c>ConversionEra</c> is NULL are NOT folded into
/// POST/PRE — they only surface under the <c>ALL</c> escape hatch.
/// This is intentional: re-promotion is the prescribed remediation
/// per v1.11 §0.5 once G2 is deployed.</para>
/// </summary>
public sealed class TfParcelOwnerReader : ITfParcelOwnerReader
{
    private readonly TerraFusionDbContext _db;

    public TfParcelOwnerReader(TerraFusionDbContext db) => _db = db;

    public async Task<ParcelOwnerLookup> GetOwnersAsync(
        Guid tfParcelId,
        short taxYear,
        string? era = null,
        CancellationToken cancellationToken = default)
    {
        var parcel = await _db.TfParcels
            .AsNoTracking()
            .Where(p => p.TfParcelId == tfParcelId)
            .Select(p => new { p.TfParcelId, p.CountyId })
            .FirstOrDefaultAsync(cancellationToken).ConfigureAwait(false);

        if (parcel is null)
        {
            return ParcelOwnerLookup.NotFound();
        }

        var ownerEraPredicate = ResolveOwnerEraPredicate(era);

        var entries = await (
            from link in _db.TfParcelOwnerLinks.AsNoTracking()
            where link.TfParcelId == tfParcelId && link.OwnerTaxYr == taxYear
            join owner in _db.TfOwners.AsNoTracking().Where(ownerEraPredicate)
                on link.TfOwnerId equals owner.TfOwnerId
            orderby link.IsPrimary descending,
                    link.PctOwnership descending,
                    owner.AcctId
            select new ParcelOwnerEntry
            {
                TfOwnerId = owner.TfOwnerId,
                AcctId = owner.AcctId,
                DisplayName = owner.DisplayName,
                PctOwnership = link.PctOwnership,
                IsPrimary = link.IsPrimary,
                ConfidentialFlag = owner.ConfidentialFlag,
                WebSuppression = owner.WebSuppression,
            }).ToListAsync(cancellationToken).ConfigureAwait(false);

        if (entries.Count == 0)
        {
            return ParcelOwnerLookup.NoOwners(parcel.CountyId);
        }

        return ParcelOwnerLookup.Found(
            parcel.CountyId,
            new ParcelOwnerCurrentResponse
            {
                TfParcelId = tfParcelId,
                CountyId = parcel.CountyId,
                TaxYear = taxYear,
                Owners = entries,
            });
    }

    /// <summary>
    /// Slice G3 (v1.12): translates an era filter token into a
    /// <c>tf_owner</c> predicate. <c>tf_owner</c> has no year column
    /// so there's no year-fallback for NULL <c>ConversionEra</c> —
    /// callers needing pre-G2 rows must pass <c>ALL</c>.
    /// </summary>
    private static Expression<Func<TfOwner, bool>> ResolveOwnerEraPredicate(string? era)
    {
        var resolved = era ?? ConversionEras.PostConversion;

        if (resolved == ISalesRatioStudyReader.EraAll)
        {
            return _ => true;
        }
        if (resolved == ConversionEras.PostConversion)
        {
            return o => o.ConversionEra == ConversionEras.PostConversion;
        }
        if (resolved == ConversionEras.PreConversion2017)
        {
            return o => o.ConversionEra == ConversionEras.PreConversion2017;
        }
        if (resolved == ConversionEras.Unknown)
        {
            return o => o.ConversionEra == ConversionEras.Unknown;
        }

        throw new ArgumentException(
            $"Unrecognized era '{era}'. Valid values: " +
            $"{ConversionEras.PostConversion}, {ConversionEras.PreConversion2017}, " +
            $"{ConversionEras.Unknown}, {ISalesRatioStudyReader.EraAll}.",
            nameof(era));
    }
}
