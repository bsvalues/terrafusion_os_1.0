using TerraFusion.Core.Entities.CanonicalTf;

namespace TerraFusion.Core.Entities.Forge;

/// <summary>
/// Canonical inputs assembled for one parcel. <see cref="Neighborhood"/> is the post-addition
/// dependency (supplied from TfParcel.Neighborhood once the Sync-lane slice lands; injected today).
/// </summary>
public sealed record AssembledParcel(
    TfParcel Parcel,
    string? Neighborhood,
    IReadOnlyList<TfImprovement> Improvements,
    IReadOnlyDictionary<Guid, IReadOnlyList<TfImprovementFeature>> FeaturesByImprovement,
    IReadOnlyList<TfLand> Lands,
    IReadOnlyList<TfSale> Sales,
    decimal? NetOperatingIncome = null,
    string? IncomePropertyClass = null);

/// <summary>
/// Forge-lane, read-only assembler (WS-1 canonical-extension slice). Maps canonical entities to the
/// engine's <see cref="ParcelValuationInput"/> without writing canonical data. County-guarded;
/// shadow-only (produces inputs; the engine + persistence remain non-authoritative). Per-parcel
/// sales-comparison value is out of scope (ratio study is calibration, not value).
/// </summary>
public static class ParcelValuationAssembler
{
    /// <summary>Sums improvement size (sq ft) from its feature areas.</summary>
    public static decimal ImprovementSizeSqFt(
        Guid improvementId, IReadOnlyDictionary<Guid, IReadOnlyList<TfImprovementFeature>> featuresByImprovement)
        => featuresByImprovement.TryGetValue(improvementId, out var features)
            ? features.Sum(f => f.Area ?? 0m)
            : 0m;

    /// <summary>
    /// True when the land segment is in WA current-use/ag: it carries a positive ag value and is not
    /// a homesite. Uses canonical signals only (no PACS use-code guessing).
    /// </summary>
    public static bool IsCurrentUse(TfLand land)
        => !land.IsHomesite && land.LandSegAgValue is decimal ag && ag > 0m;

    /// <summary>Maps canonical sales to ratio-study inputs (qualified = SaleQualified AND DorRatioQualified).</summary>
    public static IReadOnlyList<RatioSale> MapSales(IEnumerable<TfSale> sales, Func<TfSale, decimal> assessedValue)
        => sales.Select(s => new RatioSale(
                SalePrice: s.SlPrice ?? s.AdjSlPrice ?? 0m,
                AssessedValue: assessedValue(s),
                SaleDate: s.SlDt ?? default,
                Qualified: s.SaleQualified && s.DorRatioQualified))
            .ToList();

    /// <summary>
    /// Assembles canonical inputs into a ParcelValuationInput. Cost approach total = Σ depreciated
    /// improvements + land value; vacant parcels use the land approach total; income where applicable.
    /// Every reference set is county-guarded against the parcel. A missing input drops that approach.
    /// </summary>
    public static ParcelValuationInput Assemble(
        AssembledParcel parcel, int year,
        CostFactorSet? costSet, DepreciationSchedule? depreciation,
        LandScheduleSet? landSchedule, CapRateSet? capRateSet)
    {
        var countyId = parcel.Parcel.CountyId;
        var approaches = new List<ApproachValue>();

        // Land value (also the land component of the cost approach).
        decimal landValue = 0m;
        var landFound = false;
        if (landSchedule is not null && !string.IsNullOrWhiteSpace(parcel.Neighborhood))
        {
            ForgeCountyGuard.EnsureSameCounty(countyId, landSchedule.CountyId);
            foreach (var land in parcel.Lands)
            {
                var size = land.SizeSquareFeet ?? 0m;
                if (size <= 0m) continue;
                var res = LandApproachCalculator.Compute(
                    new LandApproachInput(parcel.Neighborhood!, size, IsCurrentUse(land)), landSchedule);
                if (res.Found) { landValue += res.IndicatedValue; landFound = true; }
            }
        }

        // Cost approach total = depreciated improvements + land value.
        if (costSet is not null && depreciation is not null && parcel.Improvements.Count > 0)
        {
            ForgeCountyGuard.EnsureSameCounty(countyId, costSet.CountyId);
            ForgeCountyGuard.EnsureSameCounty(countyId, depreciation.CountyId);

            decimal improvementsValue = 0m;
            var anyImprovement = false;
            foreach (var imp in parcel.Improvements)
            {
                var size = (int)Math.Round(ImprovementSizeSqFt(imp.TfImprovementId, parcel.FeaturesByImprovement));
                if (size <= 0 || string.IsNullOrWhiteSpace(imp.ImprvClassCd)) continue;

                var res = CostApproachCalculator.Compute(
                    new CostApproachInput(imp.ImprvClassCd!, size, EffectiveAge(imp, year), 0m),
                    costSet, depreciation);
                if (res.Found) { improvementsValue += res.DepreciatedImprovementValue; anyImprovement = true; }
            }

            if (anyImprovement)
                approaches.Add(new ApproachValue("Cost", improvementsValue + landValue));
        }
        else if (landFound && parcel.Improvements.Count == 0)
        {
            // Vacant parcel: land approach is the total.
            approaches.Add(new ApproachValue("Land", landValue));
        }

        // Income approach (income property classes only; NOI supplied externally).
        if (capRateSet is not null && parcel.NetOperatingIncome is decimal noi && !string.IsNullOrWhiteSpace(parcel.IncomePropertyClass))
        {
            ForgeCountyGuard.EnsureSameCounty(countyId, capRateSet.CountyId);
            var res = IncomeApproachCalculator.Compute(new IncomeApproachInput(parcel.IncomePropertyClass!, noi), capRateSet);
            if (res.Found) approaches.Add(new ApproachValue("Income", res.IndicatedValue));
        }

        return new ParcelValuationInput(
            parcel.Parcel.TfParcelId, year, countyId, parcel.Parcel.PropertyType ?? "Unknown", approaches);
    }

    private static int EffectiveAge(TfImprovement imp, int year)
    {
        if (imp.EffectiveYearBuilt is short eyb && eyb > 0) return Math.Max(0, year - eyb);
        if (imp.YearBuilt is short yb && yb > 0) return Math.Max(0, year - yb);
        return 0;
    }
}
