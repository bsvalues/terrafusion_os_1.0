// TFT-039 — GAMA (Government Automated Mass Appraisal) MRA Agent
// Orchestrates multi-neighborhood regression calibration with stepwise
// variable selection, model comparison (AIC/BIC), and batch execution.

using System;
using System.Collections.Generic;
using System.Linq;

namespace TerraFusion.AI.Regression
{
    /// <summary>
    /// Calibration receipt for a single neighborhood regression.
    /// </summary>
    public sealed class NeighborhoodCalibrationReceipt
    {
        /// <summary>Neighborhood code.</summary>
        public string NeighborhoodCode { get; init; } = string.Empty;

        /// <summary>Selected variable names in the final model.</summary>
        public string[] SelectedVariables { get; init; } = Array.Empty<string>();

        /// <summary>Estimated coefficients (aligned with SelectedVariables).</summary>
        public double[] Coefficients { get; init; } = Array.Empty<double>();

        /// <summary>Standard errors of coefficients.</summary>
        public double[] StandardErrors { get; init; } = Array.Empty<double>();

        /// <summary>t-statistics for coefficients.</summary>
        public double[] TStatistics { get; init; } = Array.Empty<double>();

        /// <summary>R² of the final model.</summary>
        public double RSquared { get; init; }

        /// <summary>Adjusted R².</summary>
        public double AdjustedRSquared { get; init; }

        /// <summary>AIC for model comparison.</summary>
        public double AIC { get; init; }

        /// <summary>BIC for model comparison.</summary>
        public double BIC { get; init; }

        /// <summary>F-statistic.</summary>
        public double FStatistic { get; init; }

        /// <summary>Number of observations (sales) in the neighborhood.</summary>
        public int SampleSize { get; init; }

        /// <summary>Timestamp of calibration.</summary>
        public DateTime CalibratedAt { get; init; }

        /// <summary>Variables excluded during stepwise selection.</summary>
        public string[] ExcludedVariables { get; init; } = Array.Empty<string>();

        /// <summary>Whether the model passed basic diagnostic checks.</summary>
        public bool PassedDiagnostics { get; init; }

        /// <summary>Diagnostic warnings (e.g., multicollinearity, autocorrelation).</summary>
        public string[] Warnings { get; init; } = Array.Empty<string>();
    }

    /// <summary>
    /// Batch calibration result aggregating all neighborhoods.
    /// </summary>
    public sealed class BatchCalibrationReceipt
    {
        /// <summary>Per-neighborhood calibration receipts.</summary>
        public NeighborhoodCalibrationReceipt[] Neighborhoods { get; init; } =
            Array.Empty<NeighborhoodCalibrationReceipt>();

        /// <summary>Count of neighborhoods successfully calibrated.</summary>
        public int SuccessCount { get; init; }

        /// <summary>Count of neighborhoods that failed calibration.</summary>
        public int FailureCount { get; init; }

        /// <summary>Median R² across all calibrated neighborhoods.</summary>
        public double MedianRSquared { get; init; }

        /// <summary>Overall batch timestamp.</summary>
        public DateTime BatchTimestamp { get; init; }

        /// <summary>Neighborhoods that could not be calibrated (too few sales, singular matrix, etc.).</summary>
        public string[] FailedNeighborhoods { get; init; } = Array.Empty<string>();
    }

    /// <summary>
    /// Input data for a single sale used in regression calibration.
    /// </summary>
    public sealed class SaleRecord
    {
        /// <summary>Parcel identifier.</summary>
        public string ParcelId { get; init; } = string.Empty;

        /// <summary>Neighborhood code.</summary>
        public string NeighborhoodCode { get; init; } = string.Empty;

        /// <summary>Sale price (dependent variable).</summary>
        public double SalePrice { get; init; }

        /// <summary>Feature values keyed by variable name.</summary>
        public Dictionary<string, double> Features { get; init; } = new();
    }

    /// <summary>
    /// GAMA MRA agent: runs stepwise regression calibration for each
    /// neighborhood and produces calibration receipts with model metrics.
    /// </summary>
    public static class GamaMraAgent
    {
        /// <summary>Default significance threshold for stepwise variable selection.</summary>
        public const double DefaultAlpha = 0.05;

        /// <summary>Minimum number of sales required to calibrate a neighborhood.</summary>
        public const int MinSalesForCalibration = 10;

        // ──────────────────────────────────────────────
        //  Batch Calibration
        // ──────────────────────────────────────────────

        /// <summary>
        /// Calibrate all neighborhoods in the provided sales data.
        /// Groups sales by neighborhood code, runs stepwise OLS on each group,
        /// and returns a batch receipt.
        /// </summary>
        /// <param name="sales">All qualified sales across the county.</param>
        /// <param name="candidateVariables">Variable names available for selection.</param>
        /// <param name="forcedVariables">Variables always included in the model (e.g., building_area).</param>
        /// <param name="alpha">Significance threshold for stepwise selection.</param>
        public static BatchCalibrationReceipt CalibrateAll(
            IEnumerable<SaleRecord> sales,
            string[] candidateVariables,
            string[]? forcedVariables = null,
            double alpha = DefaultAlpha)
        {
            var grouped = sales.GroupBy(s => s.NeighborhoodCode).ToList();
            var receipts = new List<NeighborhoodCalibrationReceipt>();
            var failed = new List<string>();

            foreach (var group in grouped)
            {
                var nbhdSales = group.ToList();
                try
                {
                    var receipt = CalibrateSingle(
                        group.Key, nbhdSales, candidateVariables, forcedVariables, alpha);
                    receipts.Add(receipt);
                }
                catch
                {
                    failed.Add(group.Key);
                }
            }

            double medianR2 = receipts.Count > 0
                ? Median(receipts.Select(r => r.RSquared).ToArray())
                : 0;

            return new BatchCalibrationReceipt
            {
                Neighborhoods = receipts.ToArray(),
                SuccessCount = receipts.Count,
                FailureCount = failed.Count,
                MedianRSquared = medianR2,
                BatchTimestamp = DateTime.UtcNow,
                FailedNeighborhoods = failed.ToArray()
            };
        }

        // ──────────────────────────────────────────────
        //  Single Neighborhood Calibration
        // ──────────────────────────────────────────────

        /// <summary>
        /// Calibrate a single neighborhood using stepwise variable selection.
        /// </summary>
        public static NeighborhoodCalibrationReceipt CalibrateSingle(
            string neighborhoodCode,
            List<SaleRecord> sales,
            string[] candidateVariables,
            string[]? forcedVariables = null,
            double alpha = DefaultAlpha)
        {
            if (sales.Count < MinSalesForCalibration)
                throw new InvalidOperationException(
                    $"Neighborhood {neighborhoodCode} has {sales.Count} sales; minimum is {MinSalesForCalibration}.");

            var forced = new HashSet<string>(forcedVariables ?? Array.Empty<string>());
            var available = candidateVariables
                .Where(v => !forced.Contains(v))
                .ToList();

            // Build response vector
            double[] y = sales.Select(s => s.SalePrice).ToArray();
            int n = y.Length;

            // Stepwise forward selection
            var selected = new List<string>(forced);
            var excluded = new List<string>();
            bool improved = true;

            while (improved && available.Count > 0)
            {
                improved = false;
                string? bestVar = null;
                double bestAIC = double.PositiveInfinity;

                // Current model AIC
                if (selected.Count > 0)
                {
                    var currentX = BuildDesignMatrix(sales, selected.ToArray(), n);
                    try
                    {
                        var currentOls = OlsSolver.Fit(currentX, y);
                        bestAIC = ComputeAIC(currentOls, n);
                    }
                    catch { /* if current model fails, any addition is an improvement */ }
                }

                foreach (var candidate in available)
                {
                    var testVars = new List<string>(selected) { candidate };
                    var testX = BuildDesignMatrix(sales, testVars.ToArray(), n);

                    try
                    {
                        var testOls = OlsSolver.Fit(testX, y);
                        double testAIC = ComputeAIC(testOls, n);

                        // Check if the new variable's t-stat is significant
                        int newIdx = testOls.Coefficients.Length - 1; // last coefficient
                        bool significant = testOls.PValues[newIdx] < alpha;

                        if (significant && testAIC < bestAIC)
                        {
                            bestAIC = testAIC;
                            bestVar = candidate;
                        }
                    }
                    catch { /* skip if matrix is singular */ }
                }

                if (bestVar != null)
                {
                    selected.Add(bestVar);
                    available.Remove(bestVar);
                    improved = true;
                }
            }

            // Backward elimination: remove non-significant variables (not forced)
            bool removed = true;
            while (removed)
            {
                removed = false;
                var finalX = BuildDesignMatrix(sales, selected.ToArray(), n);
                var finalOls = OlsSolver.Fit(finalX, y);

                // Find worst non-forced variable (highest p-value > alpha)
                // Index 0 is intercept, so coefficients 1..p correspond to selected[0..p-1]
                double worstP = 0;
                int worstIdx = -1;
                for (int j = 1; j < finalOls.Coefficients.Length; j++)
                {
                    string varName = selected[j - 1];
                    if (forced.Contains(varName)) continue;
                    if (finalOls.PValues[j] > alpha && finalOls.PValues[j] > worstP)
                    {
                        worstP = finalOls.PValues[j];
                        worstIdx = j - 1; // index in selected list
                    }
                }

                if (worstIdx >= 0)
                {
                    excluded.Add(selected[worstIdx]);
                    selected.RemoveAt(worstIdx);
                    removed = true;
                }
            }

            // Add remaining available variables to excluded
            excluded.AddRange(available);

            // Final fit
            if (selected.Count == 0)
                throw new InvalidOperationException(
                    $"No significant variables found for neighborhood {neighborhoodCode}.");

            var X = BuildDesignMatrix(sales, selected.ToArray(), n);
            var ols = OlsSolver.Fit(X, y);
            int p = ols.P;

            double aic = ComputeAIC(ols, n);
            double bic = ComputeBIC(ols, n);

            // Run diagnostics
            var diag = MultipleRegressionEngine.Fit(X, y, new[] { "Intercept" }.Concat(selected).ToArray());

            var warnings = new List<string>();
            if (!diag.Diagnostics.DurbinWatsonAcceptable)
                warnings.Add($"Durbin-Watson = {diag.Diagnostics.DurbinWatson:F3} (outside 1.5–2.5 range)");
            if (diag.Diagnostics.MulticollinearityFlags.Length > 0)
            {
                var flaggedVars = diag.Diagnostics.MulticollinearityFlags
                    .Select(i => i < selected.Count ? selected[i] : $"var[{i}]");
                warnings.Add($"VIF > 10 for: {string.Join(", ", flaggedVars)}");
            }

            // Variable names for output (skip intercept from OLS coefficients)
            var outputVarNames = new[] { "(Intercept)" }.Concat(selected).ToArray();

            return new NeighborhoodCalibrationReceipt
            {
                NeighborhoodCode = neighborhoodCode,
                SelectedVariables = outputVarNames,
                Coefficients = ols.Coefficients,
                StandardErrors = ols.StandardErrors,
                TStatistics = ols.TStatistics,
                RSquared = ols.RSquared,
                AdjustedRSquared = ols.AdjustedRSquared,
                AIC = aic,
                BIC = bic,
                FStatistic = ols.FStatistic,
                SampleSize = n,
                CalibratedAt = DateTime.UtcNow,
                ExcludedVariables = excluded.ToArray(),
                PassedDiagnostics = warnings.Count == 0,
                Warnings = warnings.ToArray()
            };
        }

        // ──────────────────────────────────────────────
        //  Model comparison metrics
        // ──────────────────────────────────────────────

        /// <summary>AIC = n·ln(SSE/n) + 2p.</summary>
        public static double ComputeAIC(OlsResult ols, int n)
        {
            double sse = ols.Residuals.Sum(r => r * r);
            return n * Math.Log(sse / n) + 2.0 * ols.P;
        }

        /// <summary>BIC = n·ln(SSE/n) + p·ln(n).</summary>
        public static double ComputeBIC(OlsResult ols, int n)
        {
            double sse = ols.Residuals.Sum(r => r * r);
            return n * Math.Log(sse / n) + ols.P * Math.Log(n);
        }

        // ──────────────────────────────────────────────
        //  Helpers
        // ──────────────────────────────────────────────

        /// <summary>
        /// Build a design matrix with intercept column from sale records and
        /// the specified variable names.
        /// </summary>
        private static double[,] BuildDesignMatrix(List<SaleRecord> sales, string[] variables, int n)
        {
            int p = variables.Length + 1; // +1 for intercept
            var X = new double[n, p];
            for (int i = 0; i < n; i++)
            {
                X[i, 0] = 1.0; // intercept
                for (int j = 0; j < variables.Length; j++)
                {
                    sales[i].Features.TryGetValue(variables[j], out double val);
                    X[i, j + 1] = val;
                }
            }
            return X;
        }

        private static double Median(double[] values)
        {
            if (values.Length == 0) return 0;
            var sorted = values.OrderBy(v => v).ToArray();
            int mid = sorted.Length / 2;
            return sorted.Length % 2 == 0
                ? (sorted[mid - 1] + sorted[mid]) / 2.0
                : sorted[mid];
        }
    }
}
