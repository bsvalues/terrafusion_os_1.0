using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using TerraFusion.Core.Entities.CanonicalTf;
using TerraFusion.Core.Entities.TruthPacs;
using TerraFusion.Core.Sync.Doctrine;
using TerraFusion.Core.Sync.ImprovementFieldCheck;

namespace TerraFusion.Data.Services.CanonicalTf;

/// <summary>
/// Block F3: EF-backed read-model for the improvement field-check
/// queue. Joins <c>canonical_tf.tf_improvement</c> with the per-
/// component <c>tf_improvement_feature</c> rows to surface the
/// "needs an in-the-field re-look" backlog.
///
/// <para>Read-only by contract: <c>AsNoTracking</c> on every
/// query, no <c>SaveChangesAsync</c>. The reader DOES enforce
/// county isolation as belt-and-suspenders behind the controller's
/// claim check.</para>
/// </summary>
public sealed class ImprovementFieldCheckReader : IImprovementFieldCheckReader
{
    private readonly TerraFusionDbContext _db;

    public ImprovementFieldCheckReader(TerraFusionDbContext db) => _db = db;

    public async Task<IReadOnlyList<ImprovementFieldCheckItem>> GetFieldCheckQueueAsync(
        Guid countyId,
        string? universeCode = null,
        string? era = null,
        bool missingFeaturesOnly = false,
        short? minYearBuilt = null,
        short? maxYearBuilt = null,
        int? maxResults = null,
        CancellationToken cancellationToken = default)
    {
        if (universeCode is not null && !UniverseCodes.IsKnown(universeCode))
        {
            throw new ArgumentException(
                $"Unrecognized universeCode '{universeCode}'. Valid values: " +
                string.Join(", ", UniverseCodes.AllIncludingUnknown) + ".",
                nameof(universeCode));
        }

        var resolvedTake = ResolveMaxResults(maxResults);
        var eraPredicate = ResolveEraPredicate(era);

        var query = _db.TfImprovements
            .AsNoTracking()
            .Where(i => i.CountyId == countyId)
            .Where(eraPredicate);

        if (universeCode is not null)
        {
            query = query.Where(i => i.UniverseCode == universeCode);
        }

        if (minYearBuilt is not null)
        {
            query = query.Where(i => i.YearBuilt != null && i.YearBuilt >= minYearBuilt);
        }
        if (maxYearBuilt is not null)
        {
            query = query.Where(i => i.YearBuilt != null && i.YearBuilt <= maxYearBuilt);
        }

        // Project (improvement, total feature count, attributed
        // count) in one shot. Group on FK so we don't materialize
        // every feature row. EF in-memory provider handles this
        // pattern; Postgres will translate via a correlated subquery.
        var projected = query
            .Select(i => new
            {
                i.TfImprovementId,
                i.TfParcelId,
                i.UniverseCode,
                i.ImprvTypeCd,
                i.ImprvDesc,
                i.YearBuilt,
                i.EffectiveYearBuilt,
                FeatureCount = _db.TfImprovementFeatures
                    .Count(f => f.TfImprovementId == i.TfImprovementId),
                AttributedFeatureCount = _db.TfImprovementFeatures
                    .Count(f => f.TfImprovementId == i.TfImprovementId
                                && f.AttributeId != null),
            });

        if (missingFeaturesOnly)
        {
            // True-gap rows: NO feature row carries a resolved
            // AttributeId. Includes "zero feature rows at all" and
            // "feature rows exist but none resolve" — both are
            // visits-the-field-needs-to-make.
            projected = projected.Where(x => x.AttributedFeatureCount == 0);
        }

        var rows = await projected
            // Stable triage ordering: oldest YearBuilt first (the
            // re-look backlog skews toward older stock), then
            // deterministic ID for ties.
            .OrderBy(x => x.YearBuilt ?? short.MaxValue)
            .ThenBy(x => x.TfImprovementId)
            .Take(resolvedTake)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        return rows
            .Select(x => new ImprovementFieldCheckItem
            {
                TfImprovementId = x.TfImprovementId,
                TfParcelId = x.TfParcelId,
                UniverseCode = x.UniverseCode,
                ImprvTypeCd = x.ImprvTypeCd,
                ImprvDesc = x.ImprvDesc,
                YearBuilt = x.YearBuilt,
                EffectiveYearBuilt = x.EffectiveYearBuilt,
                FeatureCount = x.FeatureCount,
                AttributedFeatureCount = x.AttributedFeatureCount,
                ReviewReason = ResolveReviewReason(
                    x.FeatureCount,
                    x.AttributedFeatureCount),
            })
            .ToList();
    }

    /// <summary>
    /// Clamps <paramref name="maxResults"/> to
    /// [1, <see cref="IImprovementFieldCheckReader.MaxAllowedResults"/>],
    /// defaulting null to
    /// <see cref="IImprovementFieldCheckReader.DefaultMaxResults"/>.
    /// </summary>
    private static int ResolveMaxResults(int? maxResults)
    {
        if (maxResults is null)
            return IImprovementFieldCheckReader.DefaultMaxResults;
        if (maxResults < 1) return 1;
        if (maxResults > IImprovementFieldCheckReader.MaxAllowedResults)
            return IImprovementFieldCheckReader.MaxAllowedResults;
        return maxResults.Value;
    }

    /// <summary>
    /// Block-C contract v1.12 §2 era predicate adapted to
    /// <c>tf_improvement</c>. Improvements have no date column to
    /// fall back on (YearBuilt is construction year, NOT capture
    /// year), so pre-G2 NULL-era rows fall through only under the
    /// <c>ALL</c> sentinel. POST/PRE/UNKNOWN match the column value
    /// strictly.
    /// </summary>
    private static Expression<Func<TfImprovement, bool>> ResolveEraPredicate(string? era)
    {
        var resolved = era ?? ConversionEras.PostConversion;

        if (resolved == IImprovementFieldCheckReader.EraAll)
        {
            return _ => true;
        }
        if (resolved == ConversionEras.PostConversion)
        {
            return i => i.ConversionEra == ConversionEras.PostConversion;
        }
        if (resolved == ConversionEras.PreConversion2017)
        {
            return i => i.ConversionEra == ConversionEras.PreConversion2017;
        }
        if (resolved == ConversionEras.Unknown)
        {
            return i => i.ConversionEra == ConversionEras.Unknown;
        }

        throw new ArgumentException(
            $"Unrecognized era '{era}'. Valid values: " +
            $"{ConversionEras.PostConversion}, {ConversionEras.PreConversion2017}, " +
            $"{ConversionEras.Unknown}, {IImprovementFieldCheckReader.EraAll}.",
            nameof(era));
    }

    /// <summary>
    /// Maps the (total, attributed) feature counts to the contract's
    /// closed vocabulary of review reasons. Pure function so
    /// controllers and tests can re-invoke if needed.
    /// </summary>
    private static string ResolveReviewReason(int total, int attributed)
    {
        if (total == 0) return "NO_FEATURES";
        if (attributed == 0) return "NO_ATTRIBUTED_FEATURES";
        if (attributed < total) return "PARTIAL_ATTRIBUTION";
        return "FULLY_ATTRIBUTED";
    }
}
