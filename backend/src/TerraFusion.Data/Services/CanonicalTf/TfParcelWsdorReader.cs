using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using TerraFusion.Core.DTOs.CanonicalTf;
using TerraFusion.Core.Sync.PacsWsdorCanonical;

namespace TerraFusion.Data.Services.CanonicalTf;

/// <summary>
/// Slice B5': EF-backed implementation of
/// <see cref="ITfParcelWsdorReader"/>.
///
/// <para>Read-only by contract. The reader does NOT enforce county
/// isolation on its own — the controller verifies the principal's
/// claim against <see cref="ParcelWsdorLookup.CountyId"/> before
/// returning the payload.</para>
///
/// <para>Ordering: by descending <c>AssessedVal</c> (largest stake
/// first), then by <c>OwnerDisplayName</c> ascending for stable tie-
/// break. NULL <c>AssessedVal</c> sorts last.</para>
/// </summary>
public sealed class TfParcelWsdorReader : ITfParcelWsdorReader
{
    private readonly TerraFusionDbContext _db;

    public TfParcelWsdorReader(TerraFusionDbContext db) => _db = db;

    public async Task<ParcelWsdorLookup> GetWsdorRollAsync(
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
            return ParcelWsdorLookup.NotFound();
        }

        var entries = await (
            from a in _db.TfAssessmentWsdors.AsNoTracking()
            where a.TfParcelId == tfParcelId && a.AssessmentYear == taxYear
            join o in _db.TfOwners.AsNoTracking() on a.TfOwnerId equals o.TfOwnerId
            orderby (a.AssessedVal == null ? 1 : 0),
                    a.AssessedVal descending,
                    o.DisplayName
            select new ParcelWsdorEntry
            {
                TfAssessmentWsdorId = a.TfAssessmentWsdorId,
                TfOwnerId = o.TfOwnerId,
                OwnerDisplayName = o.DisplayName,
                AssessedVal = a.AssessedVal,
                MarketVal = a.MarketVal,
                AppraisedVal = a.AppraisedVal,
                TaxableClassified = a.TaxableClassified,
                TaxableNonClassified = a.TaxableNonClassified,
                LandTaxableClassified = a.LandTaxableClassified,
                LandTaxableNonClassified = a.LandTaxableNonClassified,
                ImprvTaxableClassified = a.ImprvTaxableClassified,
                ImprvTaxableNonClassified = a.ImprvTaxableNonClassified,
                StateValueClassified = a.StateValueClassified,
                StateValueNonClassified = a.StateValueNonClassified,
                BoeStatus = a.BoeStatus,
                DisasterProrationPct = a.DisasterProrationPct,
                SnrFrzImprvHs = a.SnrFrzImprvHs,
                SnrFrzLandHs = a.SnrFrzLandHs,
            }).ToListAsync(cancellationToken).ConfigureAwait(false);

        if (entries.Count == 0)
        {
            return ParcelWsdorLookup.NoEntries(parcel.CountyId);
        }

        // Aggregate sums — NULL excluded; report null if no rows had
        // a value (so the consumer can distinguish "not yet valued"
        // from "valued at zero").
        decimal? assessedTotal = entries.Any(e => e.AssessedVal.HasValue)
            ? entries.Where(e => e.AssessedVal.HasValue).Sum(e => e.AssessedVal!.Value)
            : (decimal?)null;
        decimal? marketTotal = entries.Any(e => e.MarketVal.HasValue)
            ? entries.Where(e => e.MarketVal.HasValue).Sum(e => e.MarketVal!.Value)
            : (decimal?)null;

        return ParcelWsdorLookup.Found(
            parcel.CountyId,
            new ParcelWsdorRollResponse
            {
                TfParcelId = tfParcelId,
                CountyId = parcel.CountyId,
                AssessmentYear = taxYear,
                Entries = entries,
                AssessedValTotal = assessedTotal,
                MarketValTotal = marketTotal,
            });
    }
}
