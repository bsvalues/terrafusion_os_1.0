using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using TerraFusion.Core.Entities.CanonicalTf;
using TerraFusion.Core.Entities.TruthPacs;
using TerraFusion.Core.Sync.LandSegmentException;

namespace TerraFusion.Data.Services.CanonicalTf;

/// <summary>
/// Slice F4: EF-backed read-model surface for land-segment
/// exceptions over <c>canonical_tf.tf_land</c>. Per
/// <c>docs/pacs/blocks-d-through-h-design.md</c> §F.4.
///
/// <para>Read-only by contract: <c>AsNoTracking</c> on every
/// query, no <c>SaveChangesAsync</c>. The era filter mirrors
/// <c>SalesRatioStudyReader</c> (v1.12 §2 doctrine) including
/// the year-fallback for pre-G2 rows whose
/// <see cref="TfLand.ConversionEra"/> column is still <c>NULL</c>.</para>
///
/// <para>The reader enforces the doctrine-frozen anomaly
/// taxonomy: any row whose <c>LandSegMarketVal</c> is
/// <c>NULL</c>, whose <c>SizeAcres</c> is <c>NULL</c> or
/// <c>0</c>, whose <c>LandSegTypeCd</c> is null/empty, or
/// whose <c>LandSegStateCd</c> is null/empty matches at least
/// one reason and is returned. Rows with no anomalies are
/// excluded.</para>
/// </summary>
public sealed class LandSegmentExceptionReader : ILandSegmentExceptionReader
{
    private readonly TerraFusionDbContext _db;

    public LandSegmentExceptionReader(TerraFusionDbContext db) => _db = db;

    public async Task<IReadOnlyList<LandSegmentExceptionItem>> GetExceptionsAsync(
        Guid countyId,
        string? era = null,
        int? maxResults = null,
        CancellationToken cancellationToken = default)
    {
        var eraPredicate = ResolveEraPredicate(era);
        var limit = maxResults ?? ILandSegmentExceptionReader.DefaultMaxResults;
        if (limit <= 0)
        {
            return Array.Empty<LandSegmentExceptionItem>();
        }
        if (limit > ILandSegmentExceptionReader.AbsoluteMaxResults)
        {
            limit = ILandSegmentExceptionReader.AbsoluteMaxResults;
        }

        // Anomaly predicate: the row matches if ANY of the four
        // reasons fires. EF translates each branch to SQL.
        // Order of branches mirrors the doctrine-frozen reason
        // string ordering (MarketVal, Area, TypeCd, StateCd).
        var rows = await _db.TfLands
            .AsNoTracking()
            .Where(l => l.CountyId == countyId)
            .Where(eraPredicate)
            .Where(l =>
                l.LandSegMarketVal == null
                || l.SizeAcres == null
                || l.SizeAcres == 0m
                || l.LandSegTypeCd == null
                || l.LandSegTypeCd == string.Empty
                || l.LandSegStateCd == null
                || l.LandSegStateCd == string.Empty)
            // Stable ordering for paging — TfLandId is a Guid, not
            // monotonic, but a deterministic order keeps the panel
            // from reshuffling between calls.
            .OrderBy(l => l.TfLandId)
            .Take(limit)
            .Select(l => new
            {
                l.TfLandId,
                l.TfParcelId,
                l.LandSegTypeCd,
                l.LandSegStateCd,
                l.SizeAcres,
                l.LandSegMarketVal,
            })
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        var items = new List<LandSegmentExceptionItem>(rows.Count);
        foreach (var r in rows)
        {
            var reasons = BuildReasonString(
                marketValMissing: r.LandSegMarketVal == null,
                areaMissing: r.SizeAcres == null || r.SizeAcres == 0m,
                typeMissing: string.IsNullOrEmpty(r.LandSegTypeCd),
                stateMissing: string.IsNullOrEmpty(r.LandSegStateCd));
            // Defensive: the SQL filter guarantees at least one
            // reason fired, but if a future schema change drops a
            // branch this skip prevents an empty-string row.
            if (reasons.Length == 0) continue;

            items.Add(new LandSegmentExceptionItem
            {
                TfLandId = r.TfLandId,
                TfParcelId = r.TfParcelId,
                LandSegTypeCd = r.LandSegTypeCd,
                LandSegStateCd = r.LandSegStateCd,
                AreaAcres = r.SizeAcres,
                LandSegMarketVal = r.LandSegMarketVal,
                ExceptionReasons = reasons,
            });
        }
        return items;
    }

    /// <summary>
    /// Builds the comma-joined reason string in the doctrine-
    /// frozen order: MarketVal, Area, TypeCd, StateCd. Empty
    /// string when no reason fires (defensive — caller skips).
    /// </summary>
    private static string BuildReasonString(
        bool marketValMissing,
        bool areaMissing,
        bool typeMissing,
        bool stateMissing)
    {
        var sb = new StringBuilder();
        if (marketValMissing)
        {
            sb.Append(ILandSegmentExceptionReader.ReasonMissingMarketVal);
        }
        if (areaMissing)
        {
            if (sb.Length > 0) sb.Append(',');
            sb.Append(ILandSegmentExceptionReader.ReasonMissingArea);
        }
        if (typeMissing)
        {
            if (sb.Length > 0) sb.Append(',');
            sb.Append(ILandSegmentExceptionReader.ReasonMissingTypeCd);
        }
        if (stateMissing)
        {
            if (sb.Length > 0) sb.Append(',');
            sb.Append(ILandSegmentExceptionReader.ReasonMissingStateCd);
        }
        return sb.ToString();
    }

    /// <summary>
    /// Slice G3 (v1.12) parity: translates an era filter token
    /// into a <see cref="TfLand"/> predicate. Mirrors
    /// <c>SalesRatioStudyReader.ResolveEraPredicate</c>.
    ///
    /// <para>Year-fallback for pre-G2 rows: <see cref="TfLand"/>
    /// does not carry a sale date — the canonical row is
    /// projected from <c>truth_pacs.land_current</c> which keys
    /// on <c>(prop_val_yr, sup_num, prop_id, land_seg_id)</c>.
    /// Pre-G2 rows have <c>ConversionEra == NULL</c>; they have
    /// no per-row date column on <see cref="TfLand"/> itself, so
    /// the fallback for POST/PRE matches only the explicit
    /// column value. UNKNOWN is the canonical-disagreement
    /// signal and never falls back.</para>
    /// </summary>
    private static Expression<Func<TfLand, bool>> ResolveEraPredicate(string? era)
    {
        var resolved = era ?? ConversionEras.PostConversion;

        if (resolved == ILandSegmentExceptionReader.EraAll)
        {
            return _ => true;
        }
        if (resolved == ConversionEras.PostConversion)
        {
            return l => l.ConversionEra == ConversionEras.PostConversion;
        }
        if (resolved == ConversionEras.PreConversion2017)
        {
            return l => l.ConversionEra == ConversionEras.PreConversion2017;
        }
        if (resolved == ConversionEras.Unknown)
        {
            return l => l.ConversionEra == ConversionEras.Unknown;
        }

        throw new ArgumentException(
            $"Unrecognized era '{era}'. Valid values: " +
            $"{ConversionEras.PostConversion}, {ConversionEras.PreConversion2017}, " +
            $"{ConversionEras.Unknown}, {ILandSegmentExceptionReader.EraAll}.",
            nameof(era));
    }
}
