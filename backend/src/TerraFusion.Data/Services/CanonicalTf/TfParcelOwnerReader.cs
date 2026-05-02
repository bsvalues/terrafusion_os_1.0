using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using TerraFusion.Core.DTOs.CanonicalTf;
using TerraFusion.Core.Sync.PacsOwnerCanonical;

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
/// </summary>
public sealed class TfParcelOwnerReader : ITfParcelOwnerReader
{
    private readonly TerraFusionDbContext _db;

    public TfParcelOwnerReader(TerraFusionDbContext db) => _db = db;

    public async Task<ParcelOwnerLookup> GetOwnersAsync(
        Guid tfParcelId,
        short taxYear,
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

        var entries = await (
            from link in _db.TfParcelOwnerLinks.AsNoTracking()
            where link.TfParcelId == tfParcelId && link.OwnerTaxYr == taxYear
            join owner in _db.TfOwners.AsNoTracking()
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
}
