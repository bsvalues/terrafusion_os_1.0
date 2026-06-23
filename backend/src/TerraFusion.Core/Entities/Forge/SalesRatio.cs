namespace TerraFusion.Core.Entities.Forge;

/// <summary>
/// One sale for the ratio study. Maps from TfSale (SlPrice/AdjSlPrice, sale date) + its
/// CanonicalSaleQualification / SaleQualified flag. <see cref="Qualified"/> = false is excluded.
/// </summary>
public sealed record RatioSale(decimal SalePrice, decimal AssessedValue, DateTime SaleDate, bool Qualified);

/// <summary>IAAO ratio-study result. A study with no qualified sales is an explicit miss.</summary>
public sealed record RatioStudyResult(
    bool Found,
    int Count,
    decimal MedianRatio,
    decimal Cod,
    decimal Prd,
    string Explanation);

/// <summary>
/// Deterministic TF-native sales-ratio study (D-VAL-1, IAAO). Excludes disqualified sales, applies
/// a TF linear time-trend (annual rate × whole-month fraction) to each sale price, then computes
/// median ratio, COD (coefficient of dispersion) and PRD (price-related differential).
/// Pure function — no vendor library.
/// </summary>
public static class SalesRatioCalculator
{
    /// <summary>Computes the IAAO ratio study over qualified, time-trended sales (deterministic).</summary>
    public static RatioStudyResult ComputeStudy(IEnumerable<RatioSale> sales, DateTime asOf, decimal annualTrendRate)
    {
        var rows = sales
            .Where(s => s.Qualified)
            .Select(s =>
            {
                var adjPrice = TrendPrice(s.SalePrice, s.SaleDate, asOf, annualTrendRate);
                return (Assessed: s.AssessedValue, AdjPrice: adjPrice, Ratio: s.AssessedValue / adjPrice);
            })
            .OrderBy(r => r.Ratio)
            .ToList();

        if (rows.Count == 0)
            return new RatioStudyResult(false, 0, 0m, 0m, 0m, "No qualified sales for the ratio study (all excluded or none provided).");

        var ratios = rows.Select(r => r.Ratio).ToList();
        var median = Median(ratios);

        var meanAbsDev = ratios.Select(r => Math.Abs(r - median)).Sum() / ratios.Count;
        var cod = median == 0m ? 0m : 100m * meanAbsDev / median;

        var meanRatio = ratios.Sum() / ratios.Count;
        var sumAssessed = rows.Sum(r => r.Assessed);
        var sumAdjPrice = rows.Sum(r => r.AdjPrice);
        var weightedMean = sumAdjPrice == 0m ? 0m : sumAssessed / sumAdjPrice;
        var prd = weightedMean == 0m ? 0m : meanRatio / weightedMean;

        return new RatioStudyResult(true, rows.Count, median, cod, prd,
            $"IAAO ratio study over {rows.Count} qualified sales (as-of {asOf:yyyy-MM-dd}, trend {annualTrendRate:P0}): median {median:0.####}, COD {cod:0.##}, PRD {prd:0.###}.");
    }

    private static decimal Median(List<decimal> sortedAscending)
    {
        var n = sortedAscending.Count;
        return n % 2 == 1
            ? sortedAscending[n / 2]
            : (sortedAscending[(n / 2) - 1] + sortedAscending[n / 2]) / 2m;
    }

    /// <summary>TF linear time-trend: adjusts a sale price to the as-of date by whole months.</summary>
    public static decimal TrendPrice(decimal salePrice, DateTime saleDate, DateTime asOf, decimal annualTrendRate)
    {
        var months = ((asOf.Year - saleDate.Year) * 12) + (asOf.Month - saleDate.Month);
        var yearsFraction = months / 12m;
        return salePrice * (1m + (annualTrendRate * yearsFraction));
    }
}
