// TFT-180 — Geographically Weighted Regression (GWR) in C#
// Local regression at each observation using distance-weighted kernels.
// Supports Gaussian, bisquare, and tricube kernels with bandwidth selection
// via cross-validation or AICc.

using System;
using System.Collections.Generic;
using System.Linq;

namespace TerraFusion.AI.Regression
{
    /// <summary>
    /// Kernel function type for GWR spatial weighting.
    /// </summary>
    public enum GwrKernel
    {
        /// <summary>Gaussian: exp(-0.5 (d/h)²). Continuous, global influence.</summary>
        Gaussian,

        /// <summary>Bisquare: (1 - (d/h)²)² for d &lt; h, 0 otherwise. Compact support.</summary>
        Bisquare,

        /// <summary>Tricube: (1 - (d/h)³)³ for d &lt; h, 0 otherwise. Compact support.</summary>
        Tricube
    }

    /// <summary>
    /// Per-observation local regression coefficients from GWR.
    /// </summary>
    public sealed class GwrLocalCoefficients
    {
        /// <summary>Observation index.</summary>
        public int Index { get; init; }

        /// <summary>Coordinates of this observation.</summary>
        public ParcelCoordinate Location { get; init; }

        /// <summary>Local coefficient estimates at this location.</summary>
        public double[] Coefficients { get; init; } = Array.Empty<double>();

        /// <summary>Local R² at this observation.</summary>
        public double LocalRSquared { get; init; }

        /// <summary>Predicted value at this observation.</summary>
        public double Predicted { get; init; }

        /// <summary>Residual at this observation.</summary>
        public double Residual { get; init; }
    }

    /// <summary>
    /// Full result from a GWR model fit.
    /// </summary>
    public sealed class GwrResult
    {
        /// <summary>Per-observation local coefficients.</summary>
        public GwrLocalCoefficients[] LocalResults { get; init; } = Array.Empty<GwrLocalCoefficients>();

        /// <summary>Selected bandwidth.</summary>
        public double Bandwidth { get; init; }

        /// <summary>Kernel used.</summary>
        public GwrKernel Kernel { get; init; }

        /// <summary>Global R² (correlation between observed and GWR-predicted).</summary>
        public double GlobalRSquared { get; init; }

        /// <summary>AICc of the GWR model.</summary>
        public double AICc { get; init; }

        /// <summary>Effective number of parameters (trace of hat matrix).</summary>
        public double EffectiveParameters { get; init; }

        /// <summary>Residual sum of squares.</summary>
        public double RSS { get; init; }

        /// <summary>Number of observations.</summary>
        public int N { get; init; }

        /// <summary>
        /// Summary statistics for each coefficient across all locations:
        /// (min, Q1, median, Q3, max).
        /// </summary>
        public CoefficientSummary[] CoefficientSummaries { get; init; } = Array.Empty<CoefficientSummary>();

        /// <summary>Variable names corresponding to coefficients.</summary>
        public string[] VariableNames { get; init; } = Array.Empty<string>();
    }

    /// <summary>
    /// Five-number summary for a spatially varying coefficient.
    /// </summary>
    public sealed class CoefficientSummary
    {
        public string VariableName { get; init; } = string.Empty;
        public double Min { get; init; }
        public double Q1 { get; init; }
        public double Median { get; init; }
        public double Q3 { get; init; }
        public double Max { get; init; }
    }

    /// <summary>
    /// Geographically Weighted Regression: fits a local OLS at each observation
    /// using a distance-decay kernel, producing spatially varying coefficients.
    /// </summary>
    public static class GwrModel
    {
        // ──────────────────────────────────────────────
        //  Primary API
        // ──────────────────────────────────────────────

        /// <summary>
        /// Fit a GWR model with a specified bandwidth.
        /// </summary>
        /// <param name="X">Design matrix (n × p, include intercept).</param>
        /// <param name="y">Response vector (length n).</param>
        /// <param name="coords">Observation coordinates (length n).</param>
        /// <param name="bandwidth">Kernel bandwidth (distance units).</param>
        /// <param name="kernel">Kernel function to use.</param>
        /// <param name="variableNames">Optional variable names for reporting.</param>
        public static GwrResult Fit(
            double[,] X,
            double[] y,
            ParcelCoordinate[] coords,
            double bandwidth,
            GwrKernel kernel = GwrKernel.Bisquare,
            string[]? variableNames = null)
        {
            int n = X.GetLength(0);
            int p = X.GetLength(1);

            var localResults = new GwrLocalCoefficients[n];
            double rss = 0;
            double traceHat = 0; // effective number of parameters

            for (int i = 0; i < n; i++)
            {
                // Compute kernel weights for observation i
                double[] weights = ComputeWeights(coords, i, bandwidth, kernel);

                // Weighted least squares: (X'WX)^-1 X'Wy
                var localBeta = WeightedOls(X, y, weights, n, p, out double hatii);
                traceHat += hatii;

                // Predicted and residual
                double yHat = 0;
                for (int j = 0; j < p; j++)
                    yHat += X[i, j] * localBeta[j];
                double residual = y[i] - yHat;
                rss += residual * residual;

                // Local R²
                double localR2 = ComputeLocalR2(X, y, weights, localBeta, n, p);

                localResults[i] = new GwrLocalCoefficients
                {
                    Index = i,
                    Location = coords[i],
                    Coefficients = localBeta,
                    LocalRSquared = localR2,
                    Predicted = yHat,
                    Residual = residual
                };
            }

            // Global R²
            double yBar = y.Average();
            double ssTotal = y.Sum(v => (v - yBar) * (v - yBar));
            double globalR2 = ssTotal > 0 ? 1.0 - rss / ssTotal : 0;

            // AICc
            double sigma2 = rss / n;
            double aicc = sigma2 > 0
                ? n * Math.Log(sigma2) + n * Math.Log(2 * Math.PI) + n *
                  ((n + traceHat) / (n - 2 - traceHat))
                : double.PositiveInfinity;

            // Coefficient summaries
            var names = variableNames ?? Enumerable.Range(0, p).Select(j => $"X{j}").ToArray();
            var summaries = new CoefficientSummary[p];
            for (int j = 0; j < p; j++)
            {
                var vals = localResults.Select(lr => lr.Coefficients[j]).OrderBy(v => v).ToArray();
                summaries[j] = new CoefficientSummary
                {
                    VariableName = names[j],
                    Min = vals.First(),
                    Q1 = Quantile(vals, 0.25),
                    Median = Quantile(vals, 0.50),
                    Q3 = Quantile(vals, 0.75),
                    Max = vals.Last()
                };
            }

            return new GwrResult
            {
                LocalResults = localResults,
                Bandwidth = bandwidth,
                Kernel = kernel,
                GlobalRSquared = globalR2,
                AICc = aicc,
                EffectiveParameters = traceHat,
                RSS = rss,
                N = n,
                CoefficientSummaries = summaries,
                VariableNames = names
            };
        }

        // ──────────────────────────────────────────────
        //  Bandwidth Selection
        // ──────────────────────────────────────────────

        /// <summary>
        /// Select optimal bandwidth using leave-one-out cross-validation (minimise CV score).
        /// Searches over a grid of candidate bandwidths.
        /// </summary>
        /// <param name="X">Design matrix (n × p).</param>
        /// <param name="y">Response vector.</param>
        /// <param name="coords">Observation coordinates.</param>
        /// <param name="kernel">Kernel function.</param>
        /// <param name="nCandidates">Number of bandwidth candidates to evaluate.</param>
        /// <returns>Optimal bandwidth.</returns>
        public static double SelectBandwidthCV(
            double[,] X,
            double[] y,
            ParcelCoordinate[] coords,
            GwrKernel kernel = GwrKernel.Bisquare,
            int nCandidates = 20)
        {
            int n = coords.Length;
            int p = X.GetLength(1);

            // Determine range: from median nearest-neighbor distance to max distance
            double[] nnDists = new double[n];
            double maxDist = 0;
            for (int i = 0; i < n; i++)
            {
                double minD = double.MaxValue;
                for (int j = 0; j < n; j++)
                {
                    if (j == i) continue;
                    double d = Distance(coords[i], coords[j]);
                    if (d < minD) minD = d;
                    if (d > maxDist) maxDist = d;
                }
                nnDists[i] = minD;
            }

            Array.Sort(nnDists);
            double hMin = nnDists[n / 2] * 2; // at least 2× median NN distance
            double hMax = maxDist * 0.5;
            if (hMin >= hMax) hMax = hMin * 3;

            double bestH = hMin;
            double bestCV = double.PositiveInfinity;

            for (int c = 0; c < nCandidates; c++)
            {
                double h = hMin + (hMax - hMin) * c / (nCandidates - 1);
                double cvScore = 0;

                for (int i = 0; i < n; i++)
                {
                    double[] weights = ComputeWeights(coords, i, h, kernel);
                    weights[i] = 0; // leave-one-out

                    try
                    {
                        var beta = WeightedOls(X, y, weights, n, p, out _);
                        double yHat = 0;
                        for (int j = 0; j < p; j++)
                            yHat += X[i, j] * beta[j];
                        double diff = y[i] - yHat;
                        cvScore += diff * diff;
                    }
                    catch
                    {
                        cvScore += double.MaxValue / n;
                    }
                }

                if (cvScore < bestCV)
                {
                    bestCV = cvScore;
                    bestH = h;
                }
            }

            return bestH;
        }

        /// <summary>
        /// Select optimal bandwidth by minimising AICc.
        /// </summary>
        public static double SelectBandwidthAICc(
            double[,] X,
            double[] y,
            ParcelCoordinate[] coords,
            GwrKernel kernel = GwrKernel.Bisquare,
            int nCandidates = 20)
        {
            int n = coords.Length;

            double[] nnDists = new double[n];
            double maxDist = 0;
            for (int i = 0; i < n; i++)
            {
                double minD = double.MaxValue;
                for (int j = 0; j < n; j++)
                {
                    if (j == i) continue;
                    double d = Distance(coords[i], coords[j]);
                    if (d < minD) minD = d;
                    if (d > maxDist) maxDist = d;
                }
                nnDists[i] = minD;
            }
            Array.Sort(nnDists);
            double hMin = nnDists[n / 2] * 2;
            double hMax = maxDist * 0.5;
            if (hMin >= hMax) hMax = hMin * 3;

            double bestH = hMin;
            double bestAICc = double.PositiveInfinity;

            for (int c = 0; c < nCandidates; c++)
            {
                double h = hMin + (hMax - hMin) * c / (nCandidates - 1);
                var result = Fit(X, y, coords, h, kernel);
                if (result.AICc < bestAICc)
                {
                    bestAICc = result.AICc;
                    bestH = h;
                }
            }

            return bestH;
        }

        // ──────────────────────────────────────────────
        //  Internal helpers
        // ──────────────────────────────────────────────

        /// <summary>Compute kernel weights for observation i relative to all others.</summary>
        private static double[] ComputeWeights(
            ParcelCoordinate[] coords, int i, double bandwidth, GwrKernel kernel)
        {
            int n = coords.Length;
            var w = new double[n];
            for (int j = 0; j < n; j++)
            {
                double d = Distance(coords[i], coords[j]);
                w[j] = KernelWeight(d, bandwidth, kernel);
            }
            return w;
        }

        /// <summary>Evaluate kernel weight given distance and bandwidth.</summary>
        private static double KernelWeight(double distance, double bandwidth, GwrKernel kernel)
        {
            if (bandwidth <= 0) return 0;
            double u = distance / bandwidth;

            return kernel switch
            {
                GwrKernel.Gaussian => Math.Exp(-0.5 * u * u),
                GwrKernel.Bisquare => u < 1 ? Math.Pow(1 - u * u, 2) : 0,
                GwrKernel.Tricube => u < 1 ? Math.Pow(1 - u * u * u, 3) : 0,
                _ => Math.Exp(-0.5 * u * u)
            };
        }

        /// <summary>Euclidean distance between two coordinates.</summary>
        private static double Distance(ParcelCoordinate a, ParcelCoordinate b)
        {
            double dx = a.X - b.X;
            double dy = a.Y - b.Y;
            return Math.Sqrt(dx * dx + dy * dy);
        }

        /// <summary>
        /// Weighted OLS: β = (X'WX)⁻¹ X'Wy.
        /// Also returns h_ii (diagonal of hat matrix at this observation) for AICc.
        /// </summary>
        private static double[] WeightedOls(
            double[,] X, double[] y, double[] weights, int n, int p, out double hatii)
        {
            // X'WX (p × p)
            var XtWX = new double[p, p];
            for (int j = 0; j < p; j++)
                for (int k = 0; k < p; k++)
                {
                    double s = 0;
                    for (int i = 0; i < n; i++)
                        s += X[i, j] * weights[i] * X[i, k];
                    XtWX[j, k] = s;
                }

            // X'Wy (p × 1)
            var XtWy = new double[p];
            for (int j = 0; j < p; j++)
            {
                double s = 0;
                for (int i = 0; i < n; i++)
                    s += X[i, j] * weights[i] * y[i];
                XtWy[j] = s;
            }

            // Invert X'WX
            var inv = OlsSolver.InvertGaussJordan(XtWX, p);

            // β = inv * X'Wy
            var beta = OlsSolver.MatVecMul(inv, XtWy, p);

            // h_ii = x_i' (X'WX)^-1 x_i * w_i  (for the focal observation)
            // We approximate by finding the observation with weight = max (the focal one)
            int focalIdx = 0;
            double maxW = 0;
            for (int i = 0; i < n; i++)
                if (weights[i] > maxW) { maxW = weights[i]; focalIdx = i; }

            hatii = 0;
            for (int j = 0; j < p; j++)
                for (int k = 0; k < p; k++)
                    hatii += X[focalIdx, j] * inv[j, k] * X[focalIdx, k] * weights[focalIdx];

            return beta;
        }

        /// <summary>Compute local R² using weighted sums of squares.</summary>
        private static double ComputeLocalR2(
            double[,] X, double[] y, double[] weights, double[] beta, int n, int p)
        {
            // Weighted mean of y
            double sumW = 0, sumWY = 0;
            for (int i = 0; i < n; i++)
            {
                sumW += weights[i];
                sumWY += weights[i] * y[i];
            }
            double yBarW = sumW > 0 ? sumWY / sumW : 0;

            double ssTotal = 0, ssRes = 0;
            for (int i = 0; i < n; i++)
            {
                double yHat = 0;
                for (int j = 0; j < p; j++)
                    yHat += X[i, j] * beta[j];
                ssTotal += weights[i] * (y[i] - yBarW) * (y[i] - yBarW);
                ssRes += weights[i] * (y[i] - yHat) * (y[i] - yHat);
            }
            return ssTotal > 0 ? 1.0 - ssRes / ssTotal : 0;
        }

        /// <summary>Quantile from a sorted array using linear interpolation.</summary>
        private static double Quantile(double[] sorted, double q)
        {
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
