namespace TerraFusion.API.Services;

/// <summary>
/// Ordinary Least Squares multiple regression engine for the Sales Comparison approach.
///
/// Ported from TerraFusion-Valuator-Pro-Studio CompVault/regression-engine.ts.
/// Produces market-extracted adjustment factors from comparable sales consistent
/// with IAAO Standard on Mass Appraisal requirements.
///
/// Predictors used in the default residential model:
///   X0: intercept (1.0)
///   X1: GrossLivingArea (sf)
///   X2: LotSizeSqft
///   X3: YearBuilt
///
/// Returns:
///   Beta        — regression coefficients [intercept, GLA, lot, yearBuilt]
///   RSquared    — coefficient of determination
///   RSquaredAdj — adjusted R² (penalizes extra predictors)
///   Residuals   — per-observation error (actual − predicted)
///   Predict()   — apply the model to a subject property
/// </summary>
public interface IOlsRegressionService
{
    /// <summary>
    /// Fit an OLS model from a set of observed sales.
    /// Returns null if there are insufficient observations (fewer than predictors + 2).
    /// </summary>
    OlsResult? Fit(IReadOnlyList<OlsObservation> observations);
}

/// <summary>One comparable sale row in the OLS design matrix.</summary>
public record OlsObservation(
    double SalePrice,
    double Gla,
    double LotSizeSqft,
    double YearBuilt);

/// <summary>OLS fit result.</summary>
public record OlsResult
{
    /// <summary>Coefficients: [intercept, GLA, lot, yearBuilt]</summary>
    public double[] Beta { get; init; } = [];

    public double RSquared { get; init; }
    public double RSquaredAdj { get; init; }

    /// <summary>Per-observation residual (actual − fitted).</summary>
    public double[] Residuals { get; init; } = [];

    /// <summary>Number of observations used in the fit.</summary>
    public int N { get; init; }

    /// <summary>Number of predictors (excluding intercept).</summary>
    public int K { get; init; }

    /// <summary>
    /// Apply the fitted model to a subject property.
    /// Returns null if Beta is empty.
    /// </summary>
    public double? Predict(double gla, double lotSizeSqft, double yearBuilt)
    {
        if (Beta.Length < 4) return null;
        return Beta[0]
             + Beta[1] * gla
             + Beta[2] * lotSizeSqft
             + Beta[3] * yearBuilt;
    }
}
