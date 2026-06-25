using System;
using System.Linq;
using System.Linq.Expressions;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using TerraFusion.Abstractions.DTOs.CanonicalTf;
using TerraFusion.Core.Entities.CanonicalTf;
using TerraFusion.Core.Entities.TruthPacs;
using TerraFusion.Core.Sync.PacsWsdorCanonical;
using TerraFusion.Core.Sync.SalesRatioStudy;

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
///
/// <para>Slice G3 (v1.12): supports the <c>era</c> conversion-era
/// filter on <c>tf_assessment_wsdor</c>. The entity has an
/// <c>AssessmentYear</c> column, so pre-G2 NULL rows fall back to a
/// year-derived era using <c>AssessmentYear</c> vs the cutover year
/// (mirrors the TfSale fallback shape).</para>
/// </summary>
public sealed class TfParcelWsdorReader : ITfParcelWsdorReader
{
    private readonly TerraFusionDbContext _db;

    public TfParcelWsdorReader(TerraFusionDbContext db) => _db = db;

    public async Task<ParcelWsdorLookup> GetWsdorRollAsync(
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
            return ParcelWsdorLookup.NotFound();
        }

        var assessmentEraPredicate = ResolveWsdorEraPredicate(era);

        var entries = await (
            from a in _db.TfAssessmentWsdors.AsNoTracking().Where(assessmentEraPredicate)
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

    /// <summary>
    /// Slice G3 (v1.12): translates an era filter token into a
    /// <c>tf_assessment_wsdor</c> predicate. NULL <c>ConversionEra</c>
    /// rows fall back to a year-derived era using
    /// <see cref="TfAssessmentWsdor.AssessmentYear"/> vs
    /// <see cref="ConversionEras.CutoverYear"/>.
    /// </summary>
    private static Expression<Func<TfAssessmentWsdor, bool>> ResolveWsdorEraPredicate(string? era)
    {
        var resolved = era ?? ConversionEras.PostConversion;

        if (resolved == ISalesRatioStudyReader.EraAll)
        {
            return _ => true;
        }
        if (resolved == ConversionEras.PostConversion)
        {
            return a => a.ConversionEra == ConversionEras.PostConversion
                || (a.ConversionEra == null && a.AssessmentYear >= ConversionEras.CutoverYear);
        }
        if (resolved == ConversionEras.PreConversion2017)
        {
            return a => a.ConversionEra == ConversionEras.PreConversion2017
                || (a.ConversionEra == null && a.AssessmentYear < ConversionEras.CutoverYear);
        }
        if (resolved == ConversionEras.Unknown)
        {
            return a => a.ConversionEra == ConversionEras.Unknown;
        }

        throw new ArgumentException(
            $"Unrecognized era '{era}'. Valid values: " +
            $"{ConversionEras.PostConversion}, {ConversionEras.PreConversion2017}, " +
            $"{ConversionEras.Unknown}, {ISalesRatioStudyReader.EraAll}.",
            nameof(era));
    }
}
