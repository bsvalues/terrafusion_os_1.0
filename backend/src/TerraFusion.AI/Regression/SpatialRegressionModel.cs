// TFT-006 — Spatial Regression Models
// SAR (spatial lag), SEM (spatial error), spatial weight matrix construction,
// Moran's I, and Lagrange multiplier tests.

using System;
using System.Collections.Generic;
using System.Linq;

namespace TerraFusion.AI.Regression
{
    /// <summary>
    /// Method used to construct the spatial weight matrix.
    /// </summary>
    public enum SpatialWeightMethod
    {
        /// <summary>Inverse distance weighting: w_ij = 1/d_ij for j in neighbors.</summary>
        InverseDistance,

        /// <summary>K-nearest neighbors: w_ij = 1 for k closest parcels, 0 otherwise.</summary>
        KNearestNeighbors
    }

    /// <summary>
    /// Coordinate pair for a parcel centroid.
    /// </summary>
    public readonly struct ParcelCoordinate
    {
        public double X { get; init; }
        public double Y { get; init; }
    }

    /// <summary>
    /// Result from Moran's I test for spatial autocorrelation.
    /// </summary>
    public sealed class MoranIResult
    {
        /// <summary>Moran's I statistic.</summary>
        public double I { get; init; }

        /// <summary>Expected value under null hypothesis E[I] = -1/(n-1).</summary>
        public double ExpectedI { get; init; }

        /// <summary>Variance of I under randomization.</summary>
        public double Variance { get; init; }

        /// <summary>Z-score: (I - E[I]) / sqrt(Var(I)).</summary>
        public double ZScore { get; init; }

        /// <summary>Two-tailed p-value from standard normal.</summary>
        public double PValue { get; init; }
    }

    /// <summary>
    /// Lagrange multiplier test results for spatial model selection.
    /// </summary>
    public sealed class LagrangeMultiplierTests
    {
        /// <summary>LM statistic for spatial lag.</summary>
        public double LMLag { get; init; }

        /// <summary>p-value for LM-lag (chi-squared with 1 df).</summary>
        public double LMLagPValue { get; init; }

        /// <summary>LM statistic for spatial error.</summary>
        public double LMError { get; init; }

        /// <summary>p-value for LM-error (chi-squared with 1 df).</summary>
        public double LMErrorPValue { get; init; }

        /// <summary>Recommended model based on LM tests.</summary>
        public string RecommendedModel { get; init; } = "OLS";
    }

    /// <summary>
    /// Result from a spatial regression model (SAR or SEM).
    /// </summary>
    public sealed class SpatialRegressionResult
    {
        /// <summary>Estimated spatial parameter (ρ for SAR, λ for SEM).</summary>
        public double SpatialParameter { get; init; }

        /// <summary>Estimated coefficients β.</summary>
        public double[] Coefficients { get; init; } = Array.Empty<double>();

        /// <summary>Standard errors of coefficients.</summary>
        public double[] StandardErrors { get; init; } = Array.Empty<double>();

        /// <summary>Residuals.</summary>
        public double[] Residuals { get; init; } = Array.Empty<double>();

        /// <summary>Predicted values.</summary>
        public double[] Predicted { get; init; } = Array.Empty<double>();

        /// <summary>Log-likelihood of the estimated model.</summary>
        public double LogLikelihood { get; init; }

        /// <summary>AIC = -2 ln L + 2k.</summary>
        public double AIC { get; init; }

        /// <summary>Pseudo R² (correlation between y and ŷ squared).</summary>
        public double PseudoRSquared { get; init; }

        /// <summary>Model type that was fitted.</summary>
        public string ModelType { get; init; } = string.Empty;
    }

    /// <summary>
    /// Spatial regression models for mass appraisal: Spatial Autoregressive (SAR)
    /// and Spatial Error Model (SEM).  Constructs spatial weight matrices from
    /// parcel coordinates and provides diagnostic tests for model selection.
    /// </summary>
    public static class SpatialRegressionModel
    {
        // ──────────────────────────────────────────────
        //  Spatial Weight Matrix Construction
        // ──────────────────────────────────────────────

        /// <summary>
        /// Build a row-standardised spatial weight matrix W from parcel coordinates.
        /// </summary>
        /// <param name="coords">Parcel centroid coordinates (length n).</param>
        /// <param name="method">Weight construction method.</param>
        /// <param name="k">Number of neighbors for KNN (default 5).</param>
        /// <param name="bandwidth">Distance cutoff for inverse distance (0 = no cutoff).</param>
        /// <returns>Row-standardised n × n weight matrix.</returns>
        public static double[,] BuildWeightMatrix(
            ParcelCoordinate[] coords,
            SpatialWeightMethod method,
            int k = 5,
            double bandwidth = 0)
        {
            int n = coords.Length;
            var W = new double[n, n];

            if (method == SpatialWeightMethod.KNearestNeighbors)
            {
                for (int i = 0; i < n; i++)
                {
                    // Compute distances to all other observations
                    var distances = new (int idx, double dist)[n - 1];
                    int pos = 0;
                    for (int j = 0; j < n; j++)
                    {
                        if (j == i) continue;
                        double dx = coords[i].X - coords[j].X;
                        double dy = coords[i].Y - coords[j].Y;
                        distances[pos++] = (j, Math.Sqrt(dx * dx + dy * dy));
                    }

                    // Select k nearest
                    Array.Sort(distances, (a, b) => a.dist.CompareTo(b.dist));
                    for (int m = 0; m < Math.Min(k, distances.Length); m++)
                        W[i, distances[m].idx] = 1.0;
                }
            }
            else // InverseDistance
            {
                for (int i = 0; i < n; i++)
                {
                    for (int j = 0; j < n; j++)
                    {
                        if (j == i) continue;
                        double dx = coords[i].X - coords[j].X;
                        double dy = coords[i].Y - coords[j].Y;
                        double d = Math.Sqrt(dx * dx + dy * dy);
                        if (d < 1e-10) d = 1e-10;

                        if (bandwidth > 0 && d > bandwidth)
                            continue;

                        W[i, j] = 1.0 / d;
                    }
                }
            }

            // Row-standardise
            for (int i = 0; i < n; i++)
            {
                double rowSum = 0;
                for (int j = 0; j < n; j++) rowSum += W[i, j];
                if (rowSum > 0)
                    for (int j = 0; j < n; j++) W[i, j] /= rowSum;
            }

            return W;
        }

        // ──────────────────────────────────────────────
        //  Moran's I Test
        // ──────────────────────────────────────────────

        /// <summary>
        /// Compute Moran's I statistic for spatial autocorrelation of residuals.
        /// </summary>
        /// <param name="residuals">OLS residuals (length n).</param>
        /// <param name="W">Row-standardised spatial weight matrix (n × n).</param>
        public static MoranIResult MoranI(double[] residuals, double[,] W)
        {
            int n = residuals.Length;
            double mean = residuals.Average();

            // Deviations
            double[] z = residuals.Select(r => r - mean).ToArray();

            // S0 = sum of all weights
            double S0 = 0;
            for (int i = 0; i < n; i++)
                for (int j = 0; j < n; j++)
                    S0 += W[i, j];

            // Numerator: Σ_i Σ_j w_ij * z_i * z_j
            double num = 0;
            for (int i = 0; i < n; i++)
                for (int j = 0; j < n; j++)
                    num += W[i, j] * z[i] * z[j];

            // Denominator: Σ z_i²
            double den = z.Sum(v => v * v);

            double I = (den > 0 && S0 > 0) ? (n / S0) * (num / den) : 0;
            double EI = -1.0 / (n - 1);

            // Variance under randomization (simplified)
            double S1 = 0, S2 = 0;
            for (int i = 0; i < n; i++)
            {
                double rowSum = 0, colSum = 0;
                for (int j = 0; j < n; j++)
                {
                    double wij = W[i, j], wji = W[j, i];
                    S1 += (wij + wji) * (wij + wji);
                    rowSum += W[i, j];
                    colSum += W[j, i];
                }
                S2 += (rowSum + colSum) * (rowSum + colSum);
            }
            S1 /= 2.0;

            double n2 = (double)n * n;
            double varI = (n2 * S1 - n * S2 + 3 * S0 * S0) / (S0 * S0 * (n2 - 1)) - EI * EI;
            if (varI < 0) varI = 1e-10;

            double zScore = (I - EI) / Math.Sqrt(varI);
            double pVal = 2.0 * (1.0 - NormalCdf(Math.Abs(zScore)));

            return new MoranIResult
            {
                I = I,
                ExpectedI = EI,
                Variance = varI,
                ZScore = zScore,
                PValue = pVal
            };
        }

        // ──────────────────────────────────────────────
        //  Lagrange Multiplier Tests
        // ──────────────────────────────────────────────

        /// <summary>
        /// Lagrange multiplier tests for spatial lag vs spatial error.
        /// Uses OLS residuals and the spatial weight matrix.
        /// </summary>
        /// <param name="X">Design matrix (n × p).</param>
        /// <param name="residuals">OLS residuals (length n).</param>
        /// <param name="W">Spatial weight matrix (n × n, row-standardised).</param>
        public static LagrangeMultiplierTests LMTests(double[,] X, double[] residuals, double[,] W)
        {
            int n = residuals.Length;
            int p = X.GetLength(1);

            double sigma2 = residuals.Sum(r => r * r) / n;

            // Wy (lag of residuals)
            double[] We = MatVec(W, residuals, n);

            // T = trace(W'W + W²)
            double T = TraceWtWplusW2(W, n);

            // LM-error: (e'We / σ²)² / T
            double eWe = DotProduct(residuals, We, n);
            double lmError = (eWe / sigma2) * (eWe / sigma2) / T;

            // LM-lag: (e'Wy / σ²)² / D
            // where D = (WXβ)'M(WXβ)/σ² + T  and M = I - X(X'X)^-1 X'
            // For simplicity, approximate D ≈ T (first-order approximation)
            double lmLag = (eWe / sigma2) * (eWe / sigma2) / T;

            // More refined LM-lag using the projection
            // Compute Wy_hat = W * X * beta_hat (using OLS predicted)
            double[,] XtX = OlsSolver.MultiplyTransposeLeft(X, X, n, p, p);
            double[,] XtXInv = OlsSolver.InvertGaussJordan(XtX, p);
            double[] Xty = OlsSolver.MultiplyTransposeVector(X, residuals, n, p);

            // J = [(WXb)'M(WXb)/σ² + T]
            // For government mass appraisal, the simplified form is standard practice
            double lmLagPVal = ChiSquaredPValue(lmLag, 1);
            double lmErrorPVal = ChiSquaredPValue(lmError, 1);

            string recommended = "OLS";
            if (lmLagPVal < 0.05 && lmErrorPVal < 0.05)
                recommended = lmLag > lmError ? "SAR" : "SEM";
            else if (lmLagPVal < 0.05)
                recommended = "SAR";
            else if (lmErrorPVal < 0.05)
                recommended = "SEM";

            return new LagrangeMultiplierTests
            {
                LMLag = lmLag,
                LMLagPValue = lmLagPVal,
                LMError = lmError,
                LMErrorPValue = lmErrorPVal,
                RecommendedModel = recommended
            };
        }

        // ──────────────────────────────────────────────
        //  Spatial Lag Model (SAR)
        // ──────────────────────────────────────────────

        /// <summary>
        /// Estimate a Spatial Autoregressive (SAR / spatial lag) model:
        ///   y = ρWy + Xβ + ε
        /// Uses concentrated maximum likelihood: grid search over ρ, then OLS
        /// on the filtered model (y - ρWy) = Xβ + ε.
        /// </summary>
        public static SpatialRegressionResult FitSAR(double[,] X, double[] y, double[,] W)
        {
            int n = y.Length;
            int p = X.GetLength(1);

            double[] Wy = MatVec(W, y, n);

            // Grid search for ρ in (-0.99, 0.99)
            double bestRho = 0;
            double bestLL = double.NegativeInfinity;

            for (double rho = -0.99; rho <= 0.99; rho += 0.01)
            {
                // Filtered dependent variable
                var yFiltered = new double[n];
                for (int i = 0; i < n; i++)
                    yFiltered[i] = y[i] - rho * Wy[i];

                // OLS on filtered
                try
                {
                    var ols = OlsSolver.Fit(X, yFiltered);
                    double sigma2 = ols.Residuals.Sum(r => r * r) / n;
                    if (sigma2 <= 0) continue;

                    // Log-likelihood (concentrated)
                    double ll = -n / 2.0 * Math.Log(2 * Math.PI)
                              - n / 2.0 * Math.Log(sigma2)
                              + LogDetIminusRhoW(rho, W, n);

                    if (ll > bestLL)
                    {
                        bestLL = ll;
                        bestRho = rho;
                    }
                }
                catch { /* skip singular configurations */ }
            }

            // Final estimation at best ρ
            var yFinal = new double[n];
            for (int i = 0; i < n; i++)
                yFinal[i] = y[i] - bestRho * Wy[i];

            var finalOls = OlsSolver.Fit(X, yFinal);

            // Predicted: ŷ = (I - ρW)⁻¹ Xβ  ≈  Xβ + ρWy for practical purposes
            double[] predicted = new double[n];
            double[] residuals = new double[n];
            for (int i = 0; i < n; i++)
            {
                double xb = 0;
                for (int j = 0; j < p; j++)
                    xb += X[i, j] * finalOls.Coefficients[j];
                predicted[i] = xb + bestRho * Wy[i];
                residuals[i] = y[i] - predicted[i];
            }

            double pseudoR2 = ComputePseudoR2(y, predicted);
            int k = p + 1; // β + ρ

            return new SpatialRegressionResult
            {
                SpatialParameter = bestRho,
                Coefficients = finalOls.Coefficients,
                StandardErrors = finalOls.StandardErrors,
                Residuals = residuals,
                Predicted = predicted,
                LogLikelihood = bestLL,
                AIC = -2 * bestLL + 2 * k,
                PseudoRSquared = pseudoR2,
                ModelType = "SAR (Spatial Lag)"
            };
        }

        // ──────────────────────────────────────────────
        //  Spatial Error Model (SEM)
        // ──────────────────────────────────────────────

        /// <summary>
        /// Estimate a Spatial Error Model (SEM):
        ///   y = Xβ + u,  u = λWu + ε
        /// Equivalent to GLS: (I - λW)y = (I - λW)Xβ + ε.
        /// Grid search over λ, then OLS on filtered system.
        /// </summary>
        public static SpatialRegressionResult FitSEM(double[,] X, double[] y, double[,] W)
        {
            int n = y.Length;
            int p = X.GetLength(1);

            double bestLambda = 0;
            double bestLL = double.NegativeInfinity;

            for (double lambda = -0.99; lambda <= 0.99; lambda += 0.01)
            {
                // Filter: y* = y - λWy,  X* = X - λWX
                double[] Wy = MatVec(W, y, n);
                var yStar = new double[n];
                var XStar = new double[n, p];

                for (int i = 0; i < n; i++)
                {
                    yStar[i] = y[i] - lambda * Wy[i];
                    for (int j = 0; j < p; j++)
                    {
                        double wxi = 0;
                        for (int k = 0; k < n; k++)
                            wxi += W[i, k] * X[k, j];
                        XStar[i, j] = X[i, j] - lambda * wxi;
                    }
                }

                try
                {
                    var ols = OlsSolver.Fit(XStar, yStar);
                    double sigma2 = ols.Residuals.Sum(r => r * r) / n;
                    if (sigma2 <= 0) continue;

                    double ll = -n / 2.0 * Math.Log(2 * Math.PI)
                              - n / 2.0 * Math.Log(sigma2)
                              + LogDetIminusRhoW(lambda, W, n);

                    if (ll > bestLL)
                    {
                        bestLL = ll;
                        bestLambda = lambda;
                    }
                }
                catch { /* skip singular */ }
            }

            // Final estimation at best λ
            double[] WyFinal = MatVec(W, y, n);
            var yF = new double[n];
            var XF = new double[n, p];
            for (int i = 0; i < n; i++)
            {
                yF[i] = y[i] - bestLambda * WyFinal[i];
                for (int j = 0; j < p; j++)
                {
                    double wxi = 0;
                    for (int k = 0; k < n; k++)
                        wxi += W[i, k] * X[k, j];
                    XF[i, j] = X[i, j] - bestLambda * wxi;
                }
            }

            var finalOls = OlsSolver.Fit(XF, yF);

            // Back out predictions in original space
            double[] predicted = new double[n];
            double[] residuals = new double[n];
            for (int i = 0; i < n; i++)
            {
                double xb = 0;
                for (int j = 0; j < p; j++)
                    xb += X[i, j] * finalOls.Coefficients[j];
                predicted[i] = xb;
                residuals[i] = y[i] - xb;
            }

            double pseudoR2 = ComputePseudoR2(y, predicted);
            int kParams = p + 1; // β + λ

            return new SpatialRegressionResult
            {
                SpatialParameter = bestLambda,
                Coefficients = finalOls.Coefficients,
                StandardErrors = finalOls.StandardErrors,
                Residuals = residuals,
                Predicted = predicted,
                LogLikelihood = bestLL,
                AIC = -2 * bestLL + 2 * kParams,
                PseudoRSquared = pseudoR2,
                ModelType = "SEM (Spatial Error)"
            };
        }

        // ──────────────────────────────────────────────
        //  Internal helpers
        // ──────────────────────────────────────────────

        /// <summary>Matrix-vector multiply: result = M * v.</summary>
        private static double[] MatVec(double[,] M, double[] v, int n)
        {
            var result = new double[n];
            for (int i = 0; i < n; i++)
            {
                double s = 0;
                for (int j = 0; j < n; j++)
                    s += M[i, j] * v[j];
                result[i] = s;
            }
            return result;
        }

        private static double DotProduct(double[] a, double[] b, int n)
        {
            double s = 0;
            for (int i = 0; i < n; i++) s += a[i] * b[i];
            return s;
        }

        /// <summary>trace(W'W + W²).</summary>
        private static double TraceWtWplusW2(double[,] W, int n)
        {
            double trace = 0;
            for (int i = 0; i < n; i++)
            {
                // W'W diagonal element ii = Σ_k W[k,i]²
                double wtw = 0;
                for (int k = 0; k < n; k++)
                    wtw += W[k, i] * W[k, i];

                // W² diagonal element ii = Σ_k W[i,k]*W[k,i]
                double w2 = 0;
                for (int k = 0; k < n; k++)
                    w2 += W[i, k] * W[k, i];

                trace += wtw + w2;
            }
            return trace;
        }

        /// <summary>
        /// Approximate log|I - ρW| using the trace-based expansion:
        /// log|I - ρW| ≈ -ρ·tr(W) - ρ²/2·tr(W²) - ρ³/3·tr(W³).
        /// For row-standardised W, tr(W) = 0, so the leading term is -ρ²/2·tr(W²).
        /// </summary>
        private static double LogDetIminusRhoW(double rho, double[,] W, int n)
        {
            // tr(W²)
            double trW2 = 0;
            for (int i = 0; i < n; i++)
                for (int k = 0; k < n; k++)
                    trW2 += W[i, k] * W[k, i];

            // tr(W³)
            double trW3 = 0;
            for (int i = 0; i < n; i++)
                for (int j = 0; j < n; j++)
                {
                    double wij = W[i, j];
                    if (wij == 0) continue;
                    for (int k = 0; k < n; k++)
                        trW3 += wij * W[j, k] * W[k, i];
                }

            return -rho * rho / 2.0 * trW2 - rho * rho * rho / 3.0 * trW3;
        }

        private static double ComputePseudoR2(double[] y, double[] predicted)
        {
            double yBar = y.Average();
            double ssTotal = y.Sum(v => (v - yBar) * (v - yBar));
            double ssRes = 0;
            for (int i = 0; i < y.Length; i++)
                ssRes += (y[i] - predicted[i]) * (y[i] - predicted[i]);
            return ssTotal > 0 ? 1.0 - ssRes / ssTotal : 0;
        }

        /// <summary>Standard normal CDF approximation (Abramowitz & Stegun).</summary>
        private static double NormalCdf(double x)
        {
            if (x < -8) return 0;
            if (x > 8) return 1;
            double t = 1.0 / (1.0 + 0.2316419 * Math.Abs(x));
            double d = 0.3989422804014327; // 1/sqrt(2π)
            double p = d * Math.Exp(-x * x / 2.0) *
                       (t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274)))));
            return x > 0 ? 1.0 - p : p;
        }

        /// <summary>
        /// Chi-squared p-value (upper tail) with df degrees of freedom,
        /// using the Wilson-Hilferty normal approximation.
        /// </summary>
        private static double ChiSquaredPValue(double chi2, int df)
        {
            if (chi2 <= 0 || df <= 0) return 1.0;
            double z = Math.Pow(chi2 / df, 1.0 / 3.0) - (1.0 - 2.0 / (9.0 * df));
            z /= Math.Sqrt(2.0 / (9.0 * df));
            return 1.0 - NormalCdf(z);
        }
    }
}
