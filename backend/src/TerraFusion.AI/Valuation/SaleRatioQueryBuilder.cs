/*
 * SaleRatioQueryBuilder
 *
 * Single source of truth for how CostForge v2 assembles a qualified SaleRatio[]
 * from canonical entities. Every equity metric, every custom metric, every
 * data-quality check that uses sale ratios goes through this helper — so the
 * 3-layer qualification fallback is applied identically everywhere.
 *
 * Qualification decision precedence: Decision > Recommendation > legacy SaleQualification.
 * Only sales where the effective qualification == "qualified" are included.
 *
 * @version 1.0.0 - Track 1 (CostForge Benton Method v2)
 */

using Microsoft.EntityFrameworkCore;
using TerraFusion.Core.DTOs;
using TerraFusion.Core.Entities;
using TerraFusion.Data;

namespace TerraFusion.AI.Valuation;

public static class SaleRatioQueryBuilder
{
    /// <summary>
    /// Effective qualification from the 3-layer model.
    /// Returns true iff the sale is "qualified" for ratio study use.
    /// </summary>
    public static bool IsQualified(ComparableSale cs)
    {
        var effective = cs.QualificationDecision
                       ?? cs.QualificationRecommendation
                       ?? cs.SaleQualification;
        return string.Equals(effective, "qualified", StringComparison.OrdinalIgnoreCase);
    }

    /// <summary>
    /// Build qualified SaleRatio list for a county + tax year.
    /// Data flow:
    ///   Properties (string ParcelId ↔ Guid Id)
    ///   PropertyAssessments (Guid PropertyId, AssessmentYear == taxYear, AssessedValue)
    ///   ComparableSales (string ParcelId, AdjustedSalePrice, SaleDate)
    ///   CamaCharacteristics (string ParcelId, stratum fields)
    /// Excludes: IncludeNoCalc, SuppressOnRatioRpt='T', LandOnlySale, OutlierExclusions.
    /// Ratio = AssessedValue / AdjustedSalePrice.
    /// </summary>
    public static async Task<List<SaleRatio>> BuildAsync(
        TerraFusionDbContext ctx,
        Guid countyId,
        int taxYear,
        CancellationToken ct = default)
    {
        // Step 1: Build {ParcelId string -> AssessedValue} map via Property ↔ PropertyAssessment Guid join.
        var avMap = await (
            from pa in ctx.PropertyAssessments
            join p in ctx.Properties on pa.PropertyId equals p.Id
            where p.CountyId == countyId
                  && pa.AssessmentYear == taxYear
                  && pa.IsActive
                  && pa.AssessedValue > 0
            select new { p.ParcelId, pa.AssessedValue }
        ).ToListAsync(ct);

        var avByParcel = avMap
            .GroupBy(x => x.ParcelId)
            .ToDictionary(
                g => g.Key,
                g => g.First().AssessedValue,
                StringComparer.OrdinalIgnoreCase);

        // Step 2: Outlier exclusions
        // NOTE: OutlierExclusion is keyed by MatrixVersionId+SaleRecordId (not CountyId+TaxYear+ParcelId).
        // T4 (Data Quality) surfaces IQR-based outliers dynamically. For now the set is empty;
        // if explicit parcel-level exclusions are needed later, add a dedicated
        // RatioStudyExclusion entity with (CountyId, TaxYear, ParcelId) keys.
        var excludedSet = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        // Step 3: CAMA characteristics keyed by ParcelId for stratum fields
        var camaList = await ctx.CamaCharacteristics
            .Where(c => c.CountyId == countyId && c.TaxYear == taxYear)
            .Select(c => new
            {
                c.ParcelId,
                c.NeighborhoodCode,
                c.City,
                c.PropertyUseStratum,
                c.ConditionGrade,
                c.QualityGrade,
                c.YearBuilt
            })
            .ToListAsync(ct);

        var camaByParcel = camaList
            .GroupBy(x => x.ParcelId)
            .ToDictionary(g => g.Key, g => g.First(), StringComparer.OrdinalIgnoreCase);

        // Step 4: Pull candidate sales (filter at DB, further filter in memory).
        // Prefer AdjustedSalePrice (adjusted for ratio study per PACS spec); fall back
        // to SalePrice when AdjustedSalePrice hasn't been populated during canonical sync.
        var cutoff = DateTime.UtcNow.AddYears(-4);
        var salesRaw = await ctx.ComparableSales
            .Where(cs => cs.CountyId == countyId
                         && cs.SaleDate >= cutoff
                         && ((cs.AdjustedSalePrice != null && cs.AdjustedSalePrice > 0m)
                             || cs.SalePrice > 0m))
            .ToListAsync(ct);

        // Step 5: Apply exclusions + qualification + assemble SaleRatio[]
        var result = new List<SaleRatio>(salesRaw.Count);
        foreach (var cs in salesRaw)
        {
            if (excludedSet.Contains(cs.ParcelId)) continue;
            if (cs.IncludeNoCalc == true) continue;
            if (cs.SuppressOnRatioRptCd == "T") continue;
            if (cs.LandOnlySale == true) continue;
            if (!IsQualified(cs)) continue;
            if (!avByParcel.TryGetValue(cs.ParcelId, out var av)) continue;

            // AdjustedSalePrice preferred; fall back to SalePrice if not populated.
            var price = (cs.AdjustedSalePrice.HasValue && cs.AdjustedSalePrice.Value > 0)
                ? cs.AdjustedSalePrice.Value
                : cs.SalePrice;
            if (price <= 0) continue;
            var ratio = av / price;

            camaByParcel.TryGetValue(cs.ParcelId, out var cama);

            result.Add(new SaleRatio(
                ParcelId: cs.ParcelId,
                AssessedValue: av,
                AdjustedSalePrice: price,
                Ratio: ratio,
                SaleDate: cs.SaleDate,
                YearBuilt: cama?.YearBuilt,
                NeighborhoodCode: cama?.NeighborhoodCode,
                City: cama?.City,
                PropertyUseStratum: cama?.PropertyUseStratum,
                ConditionGrade: cama?.ConditionGrade,
                QualityGrade: cama?.QualityGrade
            ));
        }

        return result;
    }
}
