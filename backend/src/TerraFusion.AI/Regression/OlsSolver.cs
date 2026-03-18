// TFR-001 — Pure OLS Regression Solver
// Solves normal equations X'X β = X'y via Gauss-Jordan inversion.
// No external ML library dependency.

using System;
using System.Collections.Generic;
using System.Linq;

namespace TerraFusion.AI.Regression
{
    /// <summary>
    /// Result container for an OLS regression fit.
    /// </summary>
    public sealed class OlsResult
    {
        /// <summary>Estimated coefficients β (length = p, includes intercept if design matrix has one).</summary>
        public double[] Coefficients { get; init; } = Array.Empty<double>();

        /// <summary>Standard errors of the coefficient estimates.</summary>
        public double[] StandardErrors { get; init; } = Array.Empty<double>();

        /// <summary>t-statistics: β_j / SE(β_j).</summary>
        public double[] TStatistics { get; init; } = Array.Empty<double>();

        /// <summary>Two-tailed p-values from the t-distribution.</summary>
        public double[] PValues { get; init; } = Array.Empty<double>();

        /// <summary>Coefficient of determination R².</summary>
        public double RSquared { get; init; }

        /// <summary>Adjusted R² corrected for degrees of freedom.</summary>
        public double AdjustedRSquared { get; init; }

        /// <summary>Overall F-statistic for the regression.</summary>
        public double FStatistic { get; init; }

        /// <summary>p-value for the F-statistic.</summary>
        public double FPValue { get; init; }

        /// <summary>Residual standard error (root MSE).</summary>
        public double ResidualStandardError { get; init; }

        /// <summary>Residuals (y - ŷ) for every observation.</summary>
        public double[] Residuals { get; init; } = Array.Empty<double>();

        /// <summary>Predicted values ŷ = Xβ.</summary>
        public double[] Predicted { get; init; } = Array.Empty<double>();

        /// <summary>Number of observations n.</summary>
        public int N { get; init; }

        /// <summary>Number of parameters p (columns in X).</summary>
        public int P { get; init; }
    }

    /// <summary>
    /// Pure-math OLS regression solver.  Accepts a design matrix X (n × p) and
    /// response vector y (n × 1), solves β = (X'X)⁻¹ X'y, and computes full
    /// inference statistics.  Neighborhood-scoped: callers filter sales data
    /// before passing it in.
    /// </summary>
    public static class OlsSolver
    {
        // ──────────────────────────────────────────────
        //  Public API
        // ──────────────────────────────────────────────

        /// <summary>
        /// Fit an OLS model.
        /// </summary>
        /// <param name="X">Design matrix (n × p). Caller must prepend a column of 1s for an intercept.</param>
        /// <param name="y">Response vector of length n.</param>
        /// <returns>Full <see cref="OlsResult"/> with coefficients, diagnostics, and inference.</returns>
        /// <exception cref="ArgumentException">Thrown when dimensions are inconsistent or n ≤ p.</exception>
        public static OlsResult Fit(double[,] X, double[] y)
        {
            int n = X.GetLength(0);
            int p = X.GetLength(1);

            if (y.Length != n)
                throw new ArgumentException($"Row count of X ({n}) must equal length of y ({y.Length}).");
            if (n <= p)
                throw new ArgumentException($"Need n > p for OLS (n={n}, p={p}).");

            // 1. Compute X'X  (p × p)
            double[,] XtX = MultiplyTransposeLeft(X, X, n, p, p);

            // 2. Compute X'y  (p × 1)
            double[] Xty = MultiplyTransposeVector(X, y, n, p);

            // 3. Invert X'X via Gauss-Jordan
            double[,] XtXInv = InvertGaussJordan(XtX, p);

            // 4. β = (X'X)⁻¹ X'y
            double[] beta = MatVecMul(XtXInv, Xty, p);

            // 5. Predicted and residuals
            double[] yHat = new double[n];
            double[] residuals = new double[n];
            for (int i = 0; i < n; i++)
            {
                double sum = 0;
                for (int j = 0; j < p; j++)
                    sum += X[i, j] * beta[j];
                yHat[i] = sum;
                residuals[i] = y[i] - sum;
            }

            // 6. Sums of squares
            double yBar = 0;
            for (int i = 0; i < n; i++) yBar += y[i];
            yBar /= n;

            double SST = 0, SSE = 0;
            for (int i = 0; i < n; i++)
            {
                SST += (y[i] - yBar) * (y[i] - yBar);
                SSE += residuals[i] * residuals[i];
            }
            double SSR = SST - SSE;

            double R2 = SST > 0 ? 1.0 - SSE / SST : 0;
            double adjR2 = 1.0 - (1.0 - R2) * (n - 1.0) / (n - p);
            double MSE = SSE / (n - p);
            double rse = Math.Sqrt(MSE);

            // 7. Standard errors, t-stats, p-values
            double[] se = new double[p];
            double[] tStats = new double[p];
            double[] pValues = new double[p];
            for (int j = 0; j < p; j++)
            {
                se[j] = Math.Sqrt(MSE * XtXInv[j, j]);
                tStats[j] = se[j] > 0 ? beta[j] / se[j] : 0;
                pValues[j] = TwoTailPValue(tStats[j], n - p);
            }

            // 8. F-statistic
            int dfReg = p - 1; // assumes intercept is one of the p columns
            double MSR = dfReg > 0 ? SSR / dfReg : 0;
            double F = MSE > 0 ? MSR / MSE : 0;
            double fPVal = FPValue(F, dfReg, n - p);

            return new OlsResult
            {
                Coefficients = beta,
                StandardErrors = se,
                TStatistics = tStats,
                PValues = pValues,
                RSquared = R2,
                AdjustedRSquared = adjR2,
                FStatistic = F,
                FPValue = fPVal,
                ResidualStandardError = rse,
                Residuals = residuals,
                Predicted = yHat,
                N = n,
                P = p
            };
        }

        /// <summary>
        /// Convenience overload: builds a design matrix from a list of feature
        /// arrays and automatically prepends an intercept column.
        /// </summary>
        public static OlsResult Fit(double[][] features, double[] y)
        {
            int n = y.Length;
            int p = (features.Length > 0 ? features[0].Length : 0) + 1; // +1 for intercept
            var X = new double[n, p];
            for (int i = 0; i < n; i++)
            {
                X[i, 0] = 1.0; // intercept
                for (int j = 0; j < p - 1; j++)
                    X[i, j + 1] = features[i][j];
            }
            return Fit(X, y);
        }

        // ──────────────────────────────────────────────
        //  Matrix helpers (pure math, no dependencies)
        // ──────────────────────────────────────────────

        /// <summary>Compute A'B where A is n×p and B is n×q, result is p×q.</summary>
        internal static double[,] MultiplyTransposeLeft(double[,] A, double[,] B, int n, int p, int q)
        {
            var result = new double[p, q];
            for (int i = 0; i < p; i++)
                for (int j = 0; j < q; j++)
                {
                    double s = 0;
                    for (int k = 0; k < n; k++)
                        s += A[k, i] * B[k, j];
                    result[i, j] = s;
                }
            return result;
        }

        /// <summary>Compute A'v where A is n×p and v is n×1, result is p×1.</summary>
        internal static double[] MultiplyTransposeVector(double[,] A, double[] v, int n, int p)
        {
            var result = new double[p];
            for (int j = 0; j < p; j++)
            {
                double s = 0;
                for (int i = 0; i < n; i++)
                    s += A[i, j] * v[i];
                result[j] = s;
            }
            return result;
        }

        /// <summary>Matrix-vector multiply: result = M * v, both of dimension p.</summary>
        internal static double[] MatVecMul(double[,] M, double[] v, int p)
        {
            var result = new double[p];
            for (int i = 0; i < p; i++)
            {
                double s = 0;
                for (int j = 0; j < p; j++)
                    s += M[i, j] * v[j];
                result[i] = s;
            }
            return result;
        }

        /// <summary>
        /// In-place Gauss-Jordan elimination to invert a p×p matrix.
        /// Returns the inverse; throws if singular.
        /// </summary>
        internal static double[,] InvertGaussJordan(double[,] matrix, int p)
        {
            // Build augmented matrix [A | I]
            var aug = new double[p, 2 * p];
            for (int i = 0; i < p; i++)
            {
                for (int j = 0; j < p; j++)
                    aug[i, j] = matrix[i, j];
                aug[i, p + i] = 1.0;
            }

            for (int col = 0; col < p; col++)
            {
                // Partial pivoting
                int maxRow = col;
                double maxVal = Math.Abs(aug[col, col]);
                for (int row = col + 1; row < p; row++)
                {
                    double v = Math.Abs(aug[row, col]);
                    if (v > maxVal) { maxVal = v; maxRow = row; }
                }
                if (maxVal < 1e-14)
                    throw new InvalidOperationException("X'X is singular or near-singular; cannot invert.");

                // Swap rows
                if (maxRow != col)
                {
                    for (int j = 0; j < 2 * p; j++)
                    {
                        double tmp = aug[col, j];
                        aug[col, j] = aug[maxRow, j];
                        aug[maxRow, j] = tmp;
                    }
                }

                // Scale pivot row
                double pivot = aug[col, col];
                for (int j = 0; j < 2 * p; j++)
                    aug[col, j] /= pivot;

                // Eliminate column
                for (int row = 0; row < p; row++)
                {
                    if (row == col) continue;
                    double factor = aug[row, col];
                    for (int j = 0; j < 2 * p; j++)
                        aug[row, j] -= factor * aug[col, j];
                }
            }

            // Extract inverse from right half
            var inv = new double[p, p];
            for (int i = 0; i < p; i++)
                for (int j = 0; j < p; j++)
                    inv[i, j] = aug[i, p + j];
            return inv;
        }

        // ──────────────────────────────────────────────
        //  Statistical distribution approximations
        // ──────────────────────────────────────────────

        /// <summary>
        /// Two-tailed p-value from Student's t-distribution using the
        /// regularised incomplete beta function approximation.
        /// </summary>
        internal static double TwoTailPValue(double t, int df)
        {
            if (df <= 0) return 1.0;
            double x = df / (df + t * t);
            double p = RegularizedIncompleteBeta(df / 2.0, 0.5, x);
            return Math.Min(p, 1.0);
        }

        /// <summary>
        /// p-value for F-distribution using the incomplete beta function.
        /// P(F > f | df1, df2) = 1 - I_x(df1/2, df2/2) where x = df1*f/(df1*f+df2).
        /// </summary>
        internal static double FPValue(double f, int df1, int df2)
        {
            if (df1 <= 0 || df2 <= 0 || f <= 0) return 1.0;
            double x = df2 / (df2 + df1 * f);
            return RegularizedIncompleteBeta(df2 / 2.0, df1 / 2.0, x);
        }

        /// <summary>
        /// Regularised incomplete beta function I_x(a, b) via continued fraction
        /// (Lentz's algorithm).  Adequate precision for statistical p-values.
        /// </summary>
        internal static double RegularizedIncompleteBeta(double a, double b, double x)
        {
            if (x <= 0) return 0;
            if (x >= 1) return 1;

            // Use symmetry relation when x > (a+1)/(a+b+2)
            if (x > (a + 1) / (a + b + 2))
                return 1.0 - RegularizedIncompleteBeta(b, a, 1.0 - x);

            double lnPre = LogGamma(a + b) - LogGamma(a) - LogGamma(b)
                         + a * Math.Log(x) + b * Math.Log(1.0 - x);
            double front = Math.Exp(lnPre) / a;

            // Continued fraction (Lentz)
            const int maxIter = 200;
            const double eps = 1e-14;
            const double tiny = 1e-30;

            double f = 1.0, c = 1.0, d = 1.0 - (a + b) * x / (a + 1.0);
            if (Math.Abs(d) < tiny) d = tiny;
            d = 1.0 / d;
            f = d;

            for (int m = 1; m <= maxIter; m++)
            {
                // even step
                int m2 = 2 * m;
                double num = m * (b - m) * x / ((a + m2 - 1) * (a + m2));
                d = 1.0 + num * d; if (Math.Abs(d) < tiny) d = tiny; d = 1.0 / d;
                c = 1.0 + num / c; if (Math.Abs(c) < tiny) c = tiny;
                f *= d * c;

                // odd step
                num = -(a + m) * (a + b + m) * x / ((a + m2) * (a + m2 + 1));
                d = 1.0 + num * d; if (Math.Abs(d) < tiny) d = tiny; d = 1.0 / d;
                c = 1.0 + num / c; if (Math.Abs(c) < tiny) c = tiny;
                double delta = d * c;
                f *= delta;

                if (Math.Abs(delta - 1.0) < eps) break;
            }

            return front * f;
        }

        /// <summary>
        /// Lanczos approximation of ln(Γ(x)).
        /// </summary>
        internal static double LogGamma(double x)
        {
            double[] c =
            {
                76.18009172947146,
                -86.50532032941677,
                24.01409824083091,
                -1.231739572450155,
                0.1208650973866179e-2,
                -0.5395239384953e-5
            };
            double y = x, tmp = x + 5.5;
            tmp -= (x + 0.5) * Math.Log(tmp);
            double ser = 1.000000000190015;
            for (int j = 0; j < 6; j++)
                ser += c[j] / ++y;
            return -tmp + Math.Log(2.5066282746310005 * ser / x);
        }
    }
}
