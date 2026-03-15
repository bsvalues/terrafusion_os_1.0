// TFR-002 — Multiple Regression Engine
// Higher-level regression wrapping OlsSolver with ANOVA, diagnostics,
// neighborhood dummies, and residual analysis.

using System;
using System.Collections.Generic;
using System.Linq;

namespace TerraFusion.AI.Regression
{
    /// <summary>
    /// ANOVA table row for a regression model.
    /// </summary>
    public sealed class AnovaTable
    {
        public double SSR { get; init; }
        public double SSE { get; init; }
        public double SST { get; init; }
        public int DfRegression { get; init; }
        public int DfResidual { get; init; }
        public int DfTotal { get; init; }
        public double MSR { get; init; }
        public double MSE { get; init; }
        public double FStatistic { get; init; }
        public double FPValue { get; init; }
    }

    /// <summary>
    /// Diagnostics bundle produced by <see cref="MultipleRegressionEngine"/>.
    /// </summary>
    public sealed class RegressionDiagnostics
    {
        /// <summary>Cook's distance for each observation.</summary>
        public double[] CooksDistance { get; init; } = Array.Empty<double>();

        /// <summary>Variance Inflation Factor for each predictor (excluding intercept).</summary>
        public double[] VIF { get; init; } = Array.Empty<double>();

        /// <summary>Indices of predictors where VIF > 10 (multicollinearity flag).</summary>
        public int[] MulticollinearityFlags { get; init; } = Array.Empty<int>();

        /// <summary>Durbin-Watson statistic for autocorrelation (acceptable: 1.5–2.5).</summary>
        public double DurbinWatson { get; init; }

        /// <summary>Whether the Durbin-Watson value falls inside the acceptable range.</summary>
        public bool DurbinWatsonAcceptable { get; init; }
    }

    /// <summary>
    /// A point on the Q-Q plot (theoretical vs actual quantile).
    /// </summary>
    public readonly struct QQPoint
    {
        public double TheoreticalQuantile { get; init; }
        public double ActualQuantile { get; init; }
    }

    /// <summary>
    /// Full result from <see cref="MultipleRegressionEngine.Fit"/>.
    /// </summary>
    public sealed class MultipleRegressionResult
    {
        public OlsResult Ols { get; init; } = null!;
        public AnovaTable Anova { get; init; } = null!;
        public RegressionDiagnostics Diagnostics { get; init; } = null!;
        public QQPoint[] QQPlotData { get; init; } = Array.Empty<QQPoint>();
        public string[] VariableNames { get; init; } = Array.Empty<string>();
    }

    /// <summary>
    /// Higher-level multiple regression engine with ANOVA, neighborhood
    /// dummy variable generation, and comprehensive diagnostics.
    /// </summary>
    public static class MultipleRegressionEngine
    {
        // ──────────────────────────────────────────────
        //  Primary API
        // ──────────────────────────────────────────────

        /// <summary>
        /// Fit a multiple regression model and compute full diagnostics.
        /// </summary>
        /// <param name="X">Design matrix n × p (include intercept column if desired).</param>
        /// <param name="y">Response vector of length n.</param>
        /// <param name="variableNames">Optional names for each column of X.</param>
        public static MultipleRegressionResult Fit(double[,] X, double[] y, string[]? variableNames = null)
        {
            int n = X.GetLength(0);
            int p = X.GetLength(1);

            var ols = OlsSolver.Fit(X, y);

            // ANOVA
            double yBar = y.Average();
            double SST = y.Sum(v => (v - yBar) * (v - yBar));
            double SSE = ols.Residuals.Sum(r => r * r);
            double SSR = SST - SSE;
            int dfReg = p - 1;
            int dfRes = n - p;
            double MSR = dfReg > 0 ? SSR / dfReg : 0;
            double MSE = dfRes > 0 ? SSE / dfRes : 0;
            double F = MSE > 0 ? MSR / MSE : 0;
            double fPVal = OlsSolver.FPValue(F, dfReg, dfRes);

            var anova = new AnovaTable
            {
                SSR = SSR, SSE = SSE, SST = SST,
                DfRegression = dfReg, DfResidual = dfRes, DfTotal = n - 1,
                MSR = MSR, MSE = MSE, FStatistic = F, FPValue = fPVal
            };

            // Hat matrix diagonal for Cook's distance: h_ii = x_i' (X'X)^-1 x_i
            double[,] XtXInv = OlsSolver.InvertGaussJordan(
                OlsSolver.MultiplyTransposeLeft(X, X, n, p, p), p);
            double[] hatDiag = ComputeHatDiagonal(X, XtXInv, n, p);

            // Cook's distance
            double[] cooksD = new double[n];
            for (int i = 0; i < n; i++)
            {
                double hi = hatDiag[i];
                double ri = ols.Residuals[i];
                double denom = p * MSE * (1 - hi) * (1 - hi);
                cooksD[i] = denom > 0 ? (ri * ri * hi) / denom : 0;
            }

            // VIF: for each predictor j (skip intercept col 0), regress X_j on remaining X
            double[] vif = ComputeVIF(X, n, p);
            int[] mcFlags = vif.Select((v, i) => (v, i)).Where(t => t.v > 10).Select(t => t.i).ToArray();

            // Durbin-Watson
            double dw = ComputeDurbinWatson(ols.Residuals);
            bool dwOk = dw >= 1.5 && dw <= 2.5;

            var diagnostics = new RegressionDiagnostics
            {
                CooksDistance = cooksD,
                VIF = vif,
                MulticollinearityFlags = mcFlags,
                DurbinWatson = dw,
                DurbinWatsonAcceptable = dwOk
            };

            // Q-Q plot data
            QQPoint[] qq = GenerateQQData(ols.Residuals, MSE);

            return new MultipleRegressionResult
            {
                Ols = ols,
                Anova = anova,
                Diagnostics = diagnostics,
                QQPlotData = qq,
                VariableNames = variableNames ?? Enumerable.Range(0, p).Select(i => $"X{i}").ToArray()
            };
        }

        // ──────────────────────────────────────────────
        //  Neighborhood dummy variables
        // ──────────────────────────────────────────────

        /// <summary>
        /// Augment a feature matrix with 0/1 dummy columns for neighborhood codes.
        /// Uses n-1 dummies (reference category encoding) to avoid the dummy variable trap.
        /// </summary>
        /// <param name="features">Original feature matrix n × k.</param>
        /// <param name="neighborhoodCodes">Neighborhood code per observation (length n).</param>
        /// <param name="augmentedNames">Output: original variable names + dummy names.</param>
        /// <param name="originalNames">Names of original feature columns.</param>
        /// <returns>Augmented matrix n × (k + numNeighborhoods - 1).</returns>
        public static double[,] AddNeighborhoodDummies(
            double[,] features,
            string[] neighborhoodCodes,
            string[] originalNames,
            out string[] augmentedNames)
        {
            int n = features.GetLength(0);
            int k = features.GetLength(1);

            var uniqueCodes = neighborhoodCodes.Distinct().OrderBy(c => c).ToList();
            // Drop first as reference category
            var dummyCodes = uniqueCodes.Skip(1).ToList();
            int numDummies = dummyCodes.Count;

            var result = new double[n, k + numDummies];

            // Copy original features
            for (int i = 0; i < n; i++)
                for (int j = 0; j < k; j++)
                    result[i, j] = features[i, j];

            // Add dummy columns
            for (int d = 0; d < numDummies; d++)
            {
                string code = dummyCodes[d];
                for (int i = 0; i < n; i++)
                    result[i, k + d] = neighborhoodCodes[i] == code ? 1.0 : 0.0;
            }

            var names = new List<string>(originalNames);
            names.AddRange(dummyCodes.Select(c => $"Nbhd_{c}"));
            augmentedNames = names.ToArray();

            return result;
        }

        // ──────────────────────────────────────────────
        //  Internal helpers
        // ──────────────────────────────────────────────

        /// <summary>Compute the diagonal of the hat matrix H = X(X'X)⁻¹X'.</summary>
        private static double[] ComputeHatDiagonal(double[,] X, double[,] XtXInv, int n, int p)
        {
            var h = new double[n];
            for (int i = 0; i < n; i++)
            {
                double sum = 0;
                for (int j = 0; j < p; j++)
                    for (int k = 0; k < p; k++)
                        sum += X[i, j] * XtXInv[j, k] * X[i, k];
                h[i] = sum;
            }
            return h;
        }

        /// <summary>
        /// Variance Inflation Factor for each predictor (skip intercept at col 0).
        /// VIF_j = 1 / (1 - R²_j) where R²_j is from regressing X_j on remaining predictors.
        /// </summary>
        private static double[] ComputeVIF(double[,] X, int n, int p)
        {
            // VIF only meaningful for predictors beyond the intercept
            int numPredictors = p - 1;
            if (numPredictors <= 1) return new double[numPredictors];

            var vif = new double[numPredictors];

            for (int target = 1; target < p; target++)
            {
                // Build sub-design matrix: intercept + all other predictors
                int subP = p - 1; // intercept + (p-2) other predictors
                var subX = new double[n, subP];
                var subY = new double[n];

                for (int i = 0; i < n; i++)
                {
                    subX[i, 0] = 1.0; // intercept
                    subY[i] = X[i, target];
                    int col = 1;
                    for (int j = 1; j < p; j++)
                    {
                        if (j == target) continue;
                        subX[i, col++] = X[i, j];
                    }
                }

                try
                {
                    var subOls = OlsSolver.Fit(subX, subY);
                    double r2 = subOls.RSquared;
                    vif[target - 1] = r2 < 1.0 ? 1.0 / (1.0 - r2) : double.PositiveInfinity;
                }
                catch
                {
                    vif[target - 1] = double.NaN;
                }
            }

            return vif;
        }

        /// <summary>Durbin-Watson statistic: DW = Σ(e_t - e_{t-1})² / Σe_t².</summary>
        private static double ComputeDurbinWatson(double[] residuals)
        {
            int n = residuals.Length;
            if (n < 2) return 2.0;

            double num = 0, den = 0;
            for (int i = 0; i < n; i++)
            {
                den += residuals[i] * residuals[i];
                if (i > 0)
                {
                    double diff = residuals[i] - residuals[i - 1];
                    num += diff * diff;
                }
            }
            return den > 0 ? num / den : 2.0;
        }

        /// <summary>
        /// Generate Q-Q plot data: standardized residuals vs theoretical normal quantiles.
        /// </summary>
        private static QQPoint[] GenerateQQData(double[] residuals, double mse)
        {
            int n = residuals.Length;
            double sigma = Math.Sqrt(mse);
            if (sigma <= 0) sigma = 1;

            // Standardize and sort
            var stdResiduals = residuals.Select(r => r / sigma).OrderBy(r => r).ToArray();

            var points = new QQPoint[n];
            for (int i = 0; i < n; i++)
            {
                // Theoretical quantile from standard normal using rational approximation
                double p = (i + 0.5) / n;
                double theoretical = NormalQuantile(p);
                points[i] = new QQPoint
                {
                    TheoreticalQuantile = theoretical,
                    ActualQuantile = stdResiduals[i]
                };
            }
            return points;
        }

        /// <summary>
        /// Rational approximation of the standard normal quantile function (Beasley-Springer-Moro).
        /// </summary>
        private static double NormalQuantile(double p)
        {
            if (p <= 0) return double.NegativeInfinity;
            if (p >= 1) return double.PositiveInfinity;

            // Abramowitz & Stegun 26.2.23
            if (p < 0.5)
                return -RationalApprox(Math.Sqrt(-2.0 * Math.Log(p)));
            else
                return RationalApprox(Math.Sqrt(-2.0 * Math.Log(1.0 - p)));
        }

        private static double RationalApprox(double t)
        {
            double[] c = { 2.515517, 0.802853, 0.010328 };
            double[] d = { 1.432788, 0.189269, 0.001308 };
            return t - (c[0] + c[1] * t + c[2] * t * t)
                     / (1.0 + d[0] * t + d[1] * t * t + d[2] * t * t * t);
        }
    }
}
