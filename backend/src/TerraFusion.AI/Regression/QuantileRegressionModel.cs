// TFT-181 — Quantile Regression Model
// Iteratively reweighted least squares (IRLS) implementation for quantile
// regression at τ = 0.25, 0.50, 0.75 (and arbitrary quantiles).
// Bootstrap standard errors.

using System;
using System.Collections.Generic;
using System.Linq;

namespace TerraFusion.AI.Regression
{
    /// <summary>
    /// Coefficients and inference at a single quantile level.
    /// </summary>
    public sealed class QuantileCoefficients
    {
        /// <summary>Quantile level τ ∈ (0, 1).</summary>
        public double Tau { get; init; }

        /// <summary>Estimated coefficients at this quantile.</summary>
        public double[] Coefficients { get; init; } = Array.Empty<double>();

        /// <summary>Bootstrap standard errors.</summary>
        public double[] StandardErrors { get; init; } = Array.Empty<double>();

        /// <summary>t-statistics: β / SE(β).</summary>
        public double[] TStatistics { get; init; } = Array.Empty<double>();

        /// <summary>Pseudo R¹ (quantile regression analog of R²).</summary>
        public double PseudoR1 { get; init; }

        /// <summary>Check function objective value Σ ρ_τ(y_i - x_i'β).</summary>
        public double ObjectiveValue { get; init; }
    }

    /// <summary>
    /// Full result from quantile regression across multiple quantile levels.
    /// </summary>
    public sealed class QuantileRegressionResult
    {
        /// <summary>Results at each requested quantile level.</summary>
        public QuantileCoefficients[] Quantiles { get; init; } = Array.Empty<QuantileCoefficients>();

        /// <summary>Number of observations.</summary>
        public int N { get; init; }

        /// <summary>Number of parameters (columns of X).</summary>
        public int P { get; init; }

        /// <summary>Variable names corresponding to columns of X.</summary>
        public string[] VariableNames { get; init; } = Array.Empty<string>();
    }

    /// <summary>
    /// Quantile regression using iteratively reweighted least squares (IRLS).
    /// Minimises the check function ρ_τ(u) = u(τ - I(u &lt; 0)) for each
    /// quantile level, with bootstrap standard errors for inference.
    /// Useful for equity analysis in mass appraisal — reveals whether
    /// model accuracy varies across the value distribution.
    /// </summary>
    public static class QuantileRegressionModel
    {
        /// <summary>Standard quantile levels for mass appraisal equity analysis.</summary>
        public static readonly double[] StandardQuantiles = { 0.25, 0.50, 0.75 };

        /// <summary>Default number of IRLS iterations.</summary>
        public const int DefaultMaxIterations = 100;

        /// <summary>Default convergence tolerance for IRLS.</summary>
        public const double DefaultTolerance = 1e-6;

        /// <summary>Default number of bootstrap replications for standard errors.</summary>
        public const int DefaultBootstrapReplications = 200;

        // ──────────────────────────────────────────────
        //  Primary API
        // ──────────────────────────────────────────────

        /// <summary>
        /// Fit quantile regression at standard quantiles (0.25, 0.50, 0.75).
        /// </summary>
        /// <param name="X">Design matrix (n × p, include intercept).</param>
        /// <param name="y">Response vector (length n).</param>
        /// <param name="variableNames">Optional variable names.</param>
        /// <param name="bootstrapReplications">Number of bootstrap samples for SE.</param>
        public static QuantileRegressionResult Fit(
            double[,] X,
            double[] y,
            string[]? variableNames = null,
            int bootstrapReplications = DefaultBootstrapReplications)
        {
            return FitAtQuantiles(X, y, StandardQuantiles, variableNames, bootstrapReplications);
        }

        /// <summary>
        /// Fit quantile regression at specified quantile levels.
        /// </summary>
        public static QuantileRegressionResult FitAtQuantiles(
            double[,] X,
            double[] y,
            double[] quantiles,
            string[]? variableNames = null,
            int bootstrapReplications = DefaultBootstrapReplications)
        {
            int n = X.GetLength(0);
            int p = X.GetLength(1);

            var results = new QuantileCoefficients[quantiles.Length];

            for (int q = 0; q < quantiles.Length; q++)
            {
                double tau = quantiles[q];
                double[] beta = FitIRLS(X, y, tau, n, p);

                // Bootstrap standard errors
                double[] se = BootstrapSE(X, y, tau, n, p, bootstrapReplications);

                // t-statistics
                double[] tStats = new double[p];
                for (int j = 0; j < p; j++)
                    tStats[j] = se[j] > 0 ? beta[j] / se[j] : 0;

                // Pseudo R¹: 1 - Σρ_τ(e) / Σρ_τ(y - quantile(y, τ))
                double objModel = CheckFunctionSum(X, y, beta, tau, n, p);
                double yQuantile = Quantile(y, tau);
                double objNull = 0;
                for (int i = 0; i < n; i++)
                    objNull += CheckFunction(y[i] - yQuantile, tau);
                double pseudoR1 = objNull > 0 ? 1.0 - objModel / objNull : 0;

                results[q] = new QuantileCoefficients
                {
                    Tau = tau,
                    Coefficients = beta,
                    StandardErrors = se,
                    TStatistics = tStats,
                    PseudoR1 = pseudoR1,
                    ObjectiveValue = objModel
                };
            }

            return new QuantileRegressionResult
            {
                Quantiles = results,
                N = n,
                P = p,
                VariableNames = variableNames ?? Enumerable.Range(0, p).Select(j => $"X{j}").ToArray()
            };
        }

        // ──────────────────────────────────────────────
        //  IRLS Solver
        // ──────────────────────────────────────────────

        /// <summary>
        /// Iteratively Reweighted Least Squares for quantile regression.
        /// At each iteration, observations are reweighted based on the
        /// check function gradient.
        /// </summary>
        private static double[] FitIRLS(
            double[,] X, double[] y, double tau, int n, int p,
            int maxIter = DefaultMaxIterations, double tol = DefaultTolerance)
        {
            // Initialise with OLS coefficients
            double[] beta;
            try
            {
                var ols = OlsSolver.Fit(X, y);
                beta = ols.Coefficients;
            }
            catch
            {
                beta = new double[p];
            }

            for (int iter = 0; iter < maxIter; iter++)
            {
                // Compute residuals and weights
                double[] weights = new double[n];
                for (int i = 0; i < n; i++)
                {
                    double xb = 0;
                    for (int j = 0; j < p; j++)
                        xb += X[i, j] * beta[j];
                    double residual = y[i] - xb;

                    // Weight from check function subgradient
                    // w_i = τ / |e_i| if e_i > 0, (1-τ) / |e_i| if e_i < 0
                    double absR = Math.Abs(residual);
                    if (absR < 1e-10) absR = 1e-10; // avoid division by zero

                    weights[i] = residual >= 0 ? tau / absR : (1 - tau) / absR;
                }

                // Weighted least squares: β_new = (X'WX)^-1 X'Wy
                var XtWX = new double[p, p];
                var XtWy = new double[p];

                for (int j = 0; j < p; j++)
                {
                    double s = 0;
                    for (int i = 0; i < n; i++)
                        s += X[i, j] * weights[i] * y[i];
                    XtWy[j] = s;

                    for (int k = 0; k < p; k++)
                    {
                        double ss = 0;
                        for (int i = 0; i < n; i++)
                            ss += X[i, j] * weights[i] * X[i, k];
                        XtWX[j, k] = ss;
                    }
                }

                double[] betaNew;
                try
                {
                    var inv = OlsSolver.InvertGaussJordan(XtWX, p);
                    betaNew = OlsSolver.MatVecMul(inv, XtWy, p);
                }
                catch
                {
                    break; // singular, keep current beta
                }

                // Check convergence
                double maxChange = 0;
                for (int j = 0; j < p; j++)
                {
                    double change = Math.Abs(betaNew[j] - beta[j]);
                    double scale = Math.Max(1.0, Math.Abs(beta[j]));
                    maxChange = Math.Max(maxChange, change / scale);
                }

                beta = betaNew;
                if (maxChange < tol) break;
            }

            return beta;
        }

        // ──────────────────────────────────────────────
        //  Bootstrap Standard Errors
        // ──────────────────────────────────────────────

        /// <summary>
        /// Compute bootstrap standard errors by resampling observations
        /// and re-estimating the quantile regression.
        /// </summary>
        private static double[] BootstrapSE(
            double[,] X, double[] y, double tau, int n, int p, int B)
        {
            var rng = new Random(42); // fixed seed for reproducibility
            var bootCoefs = new double[B][];

            for (int b = 0; b < B; b++)
            {
                // Resample with replacement
                var indices = new int[n];
                for (int i = 0; i < n; i++)
                    indices[i] = rng.Next(n);

                var XBoot = new double[n, p];
                var yBoot = new double[n];
                for (int i = 0; i < n; i++)
                {
                    yBoot[i] = y[indices[i]];
                    for (int j = 0; j < p; j++)
                        XBoot[i, j] = X[indices[i], j];
                }

                try
                {
                    bootCoefs[b] = FitIRLS(XBoot, yBoot, tau, n, p, maxIter: 50);
                }
                catch
                {
                    bootCoefs[b] = new double[p]; // fallback
                }
            }

            // Standard deviation of bootstrap coefficients
            var se = new double[p];
            for (int j = 0; j < p; j++)
            {
                double mean = 0;
                int validCount = 0;
                for (int b = 0; b < B; b++)
                {
                    if (bootCoefs[b].Length > j)
                    {
                        mean += bootCoefs[b][j];
                        validCount++;
                    }
                }
                if (validCount == 0) { se[j] = double.NaN; continue; }
                mean /= validCount;

                double sumSq = 0;
                for (int b = 0; b < B; b++)
                {
                    if (bootCoefs[b].Length > j)
                    {
                        double diff = bootCoefs[b][j] - mean;
                        sumSq += diff * diff;
                    }
                }
                se[j] = Math.Sqrt(sumSq / (validCount - 1));
            }

            return se;
        }

        // ──────────────────────────────────────────────
        //  Check function and helpers
        // ──────────────────────────────────────────────

        /// <summary>
        /// Asymmetric check (pinball) function: ρ_τ(u) = u(τ - I(u &lt; 0)).
        /// </summary>
        public static double CheckFunction(double u, double tau)
        {
            return u >= 0 ? tau * u : (tau - 1) * u;
        }

        /// <summary>Sum of check function values for current model.</summary>
        private static double CheckFunctionSum(
            double[,] X, double[] y, double[] beta, double tau, int n, int p)
        {
            double sum = 0;
            for (int i = 0; i < n; i++)
            {
                double xb = 0;
                for (int j = 0; j < p; j++)
                    xb += X[i, j] * beta[j];
                sum += CheckFunction(y[i] - xb, tau);
            }
            return sum;
        }

        /// <summary>Sample quantile using linear interpolation.</summary>
        private static double Quantile(double[] data, double q)
        {
            var sorted = data.OrderBy(v => v).ToArray();
            if (sorted.Length == 0) return 0;
            if (sorted.Length == 1) return sorted[0];
            double h = (sorted.Length - 1) * q;
            int lo = (int)Math.Floor(h);
            int hi = lo + 1;
            if (hi >= sorted.Length) return sorted[^1];
            double frac = h - lo;
            return sorted[lo] * (1 - frac) + sorted[hi] * frac;
        }
    }
}
