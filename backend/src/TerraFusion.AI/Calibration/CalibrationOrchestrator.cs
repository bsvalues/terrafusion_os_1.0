// TFR-003 — Calibration Orchestrator
// Coordinates regression calibration across neighborhoods, emitting
// CalibrationReceipts with model specs, coefficients, and diagnostics.

using System;
using System.Collections.Generic;
using System.Linq;
using TerraFusion.AI.Regression;

namespace TerraFusion.AI.Calibration
{
    /// <summary>
    /// Variable management configuration for a calibration run.
    /// </summary>
    public sealed class VariableSet
    {
        /// <summary>Variables available for model selection.</summary>
        public string[] CandidateVariables { get; init; } = Array.Empty<string>();

        /// <summary>Variables that must be in every model regardless of significance.</summary>
        public string[] ForcedVariables { get; init; } = Array.Empty<string>();

        /// <summary>Variables explicitly excluded from consideration.</summary>
        public string[] ExcludedVariables { get; init; } = Array.Empty<string>();

        /// <summary>Effective candidate list (candidates minus excluded).</summary>
        public string[] EffectiveCandidates =>
            CandidateVariables.Except(ExcludedVariables).Except(ForcedVariables).ToArray();
    }

    /// <summary>
    /// Result from calibrating a single neighborhood.
    /// </summary>
    public sealed class CalibrationResult
    {
        /// <summary>Neighborhood code.</summary>
        public string NeighborhoodCode { get; init; } = string.Empty;

        /// <summary>Calibration receipt from the GAMA agent.</summary>
        public NeighborhoodCalibrationReceipt Receipt { get; init; } = null!;

        /// <summary>Coefficient of Dispersion (COD) on the calibration sample.</summary>
        public double COD { get; init; }

        /// <summary>Median assessment ratio (predicted / actual).</summary>
        public double MedianRatio { get; init; }

        /// <summary>Price-Related Differential (PRD).</summary>
        public double PRD { get; init; }

        /// <summary>Whether the model meets IAAO standards (COD ≤ 15 for residential).</summary>
        public bool MeetsIAAOStandard { get; init; }
    }

    /// <summary>
    /// Batch result from calibrating all neighborhoods.
    /// </summary>
    public sealed class BatchCalibrationResult
    {
        /// <summary>Per-neighborhood calibration results.</summary>
        public CalibrationResult[] Results { get; init; } = Array.Empty<CalibrationResult>();

        /// <summary>Neighborhoods that were successfully calibrated.</summary>
        public int SuccessCount { get; init; }

        /// <summary>Neighborhoods that failed calibration.</summary>
        public int FailureCount { get; init; }

        /// <summary>Failed neighborhood codes and reasons.</summary>
        public Dictionary<string, string> Failures { get; init; } = new();

        /// <summary>Variable set used for calibration.</summary>
        public VariableSet Variables { get; init; } = null!;

        /// <summary>Analyst who initiated the calibration.</summary>
        public string Analyst { get; init; } = string.Empty;

        /// <summary>Timestamp of the batch run.</summary>
        public DateTime Timestamp { get; init; }

        /// <summary>Overall median COD across calibrated neighborhoods.</summary>
        public double MedianCOD { get; init; }

        /// <summary>Overall median R² across calibrated neighborhoods.</summary>
        public double MedianRSquared { get; init; }
    }

    /// <summary>
    /// Calibration receipt emitted after a calibration run, suitable for
    /// audit logging and compliance records.
    /// </summary>
    public sealed class CalibrationReceipt
    {
        /// <summary>Unique receipt identifier.</summary>
        public string ReceiptId { get; init; } = Guid.NewGuid().ToString("N")[..12].ToUpperInvariant();

        /// <summary>Model specification (variable list).</summary>
        public string[] ModelSpec { get; init; } = Array.Empty<string>();

        /// <summary>Estimated coefficients.</summary>
        public double[] Coefficients { get; init; } = Array.Empty<double>();

        /// <summary>R² of the model.</summary>
        public double RSquared { get; init; }

        /// <summary>COD on the calibration sample.</summary>
        public double COD { get; init; }

        /// <summary>Timestamp.</summary>
        public DateTime Timestamp { get; init; }

        /// <summary>Analyst identifier.</summary>
        public string Analyst { get; init; } = string.Empty;

        /// <summary>Neighborhood code.</summary>
        public string NeighborhoodCode { get; init; } = string.Empty;

        /// <summary>Sample size.</summary>
        public int SampleSize { get; init; }
    }

    /// <summary>
    /// Orchestrates regression calibration across neighborhoods.
    /// Manages variable sets, delegates to <see cref="GamaMraAgent"/>,
    /// computes ratio study statistics, and emits calibration receipts.
    /// </summary>
    public sealed class CalibrationOrchestrator
    {
        private readonly string _analyst;

        /// <summary>
        /// Create a new calibration orchestrator.
        /// </summary>
        /// <param name="analyst">Analyst name for audit trail.</param>
        public CalibrationOrchestrator(string analyst)
        {
            _analyst = analyst ?? throw new ArgumentNullException(nameof(analyst));
        }

        // ──────────────────────────────────────────────
        //  Single neighborhood
        // ──────────────────────────────────────────────

        /// <summary>
        /// Calibrate a single neighborhood.
        /// </summary>
        /// <param name="neighborhoodCode">Neighborhood code to calibrate.</param>
        /// <param name="variables">Variable set configuration.</param>
        /// <param name="salesData">Sales for this neighborhood.</param>
        /// <param name="alpha">Significance level for stepwise selection.</param>
        public CalibrationResult CalibrateSingle(
            string neighborhoodCode,
            VariableSet variables,
            List<SaleRecord> salesData,
            double alpha = GamaMraAgent.DefaultAlpha)
        {
            var receipt = GamaMraAgent.CalibrateSingle(
                neighborhoodCode,
                salesData,
                variables.EffectiveCandidates,
                variables.ForcedVariables,
                alpha);

            // Compute ratio study statistics
            var ratioStats = ComputeRatioStatistics(salesData, receipt);

            return new CalibrationResult
            {
                NeighborhoodCode = neighborhoodCode,
                Receipt = receipt,
                COD = ratioStats.cod,
                MedianRatio = ratioStats.medianRatio,
                PRD = ratioStats.prd,
                MeetsIAAOStandard = ratioStats.cod <= 15.0
            };
        }

        // ──────────────────────────────────────────────
        //  Batch calibration
        // ──────────────────────────────────────────────

        /// <summary>
        /// Calibrate all neighborhoods in the provided county sales data.
        /// </summary>
        /// <param name="countyData">All qualified sales for the county.</param>
        /// <param name="variableSet">Variable configuration.</param>
        /// <param name="alpha">Significance level.</param>
        public BatchCalibrationResult CalibrateAll(
            IEnumerable<SaleRecord> countyData,
            VariableSet variableSet,
            double alpha = GamaMraAgent.DefaultAlpha)
        {
            var grouped = countyData.GroupBy(s => s.NeighborhoodCode).ToList();
            var results = new List<CalibrationResult>();
            var failures = new Dictionary<string, string>();

            foreach (var group in grouped)
            {
                var nbhdSales = group.ToList();
                try
                {
                    var result = CalibrateSingle(group.Key, variableSet, nbhdSales, alpha);
                    results.Add(result);
                }
                catch (Exception ex)
                {
                    failures[group.Key] = ex.Message;
                }
            }

            double medianCOD = results.Count > 0
                ? Median(results.Select(r => r.COD).ToArray())
                : 0;
            double medianR2 = results.Count > 0
                ? Median(results.Select(r => r.Receipt.RSquared).ToArray())
                : 0;

            return new BatchCalibrationResult
            {
                Results = results.ToArray(),
                SuccessCount = results.Count,
                FailureCount = failures.Count,
                Failures = failures,
                Variables = variableSet,
                Analyst = _analyst,
                Timestamp = DateTime.UtcNow,
                MedianCOD = medianCOD,
                MedianRSquared = medianR2
            };
        }

        // ──────────────────────────────────────────────
        //  Receipt emission
        // ──────────────────────────────────────────────

        /// <summary>
        /// Generate a calibration receipt from a calibration result.
        /// </summary>
        public CalibrationReceipt EmitReceipt(CalibrationResult result)
        {
            return new CalibrationReceipt
            {
                ModelSpec = result.Receipt.SelectedVariables,
                Coefficients = result.Receipt.Coefficients,
                RSquared = result.Receipt.RSquared,
                COD = result.COD,
                Timestamp = DateTime.UtcNow,
                Analyst = _analyst,
                NeighborhoodCode = result.NeighborhoodCode,
                SampleSize = result.Receipt.SampleSize
            };
        }

        // ──────────────────────────────────────────────
        //  Ratio study statistics
        // ──────────────────────────────────────────────

        /// <summary>
        /// Compute IAAO ratio study statistics (COD, median ratio, PRD)
        /// using the calibrated model's predicted values.
        /// </summary>
        private (double cod, double medianRatio, double prd) ComputeRatioStatistics(
            List<SaleRecord> sales,
            NeighborhoodCalibrationReceipt receipt)
        {
            int n = sales.Count;
            if (n == 0) return (0, 0, 0);

            // Reconstruct predicted values from coefficients
            // receipt.SelectedVariables[0] = "(Intercept)", rest are variable names
            var varNames = receipt.SelectedVariables.Skip(1).ToArray();
            var ratios = new double[n];
            double sumRatio = 0, sumValue = 0, sumPredicted = 0;

            for (int i = 0; i < n; i++)
            {
                double predicted = receipt.Coefficients[0]; // intercept
                for (int j = 0; j < varNames.Length; j++)
                {
                    sales[i].Features.TryGetValue(varNames[j], out double featureVal);
                    predicted += receipt.Coefficients[j + 1] * featureVal;
                }

                double salePrice = sales[i].SalePrice;
                if (salePrice > 0)
                {
                    ratios[i] = predicted / salePrice;
                    sumRatio += ratios[i];
                    sumValue += salePrice;
                    sumPredicted += predicted;
                }
            }

            // Median ratio
            double medianRatio = Median(ratios);

            // COD = (mean absolute deviation from median / median) × 100
            double meanAbsDev = ratios.Average(r => Math.Abs(r - medianRatio));
            double cod = medianRatio > 0 ? (meanAbsDev / medianRatio) * 100.0 : 0;

            // PRD = mean ratio / weighted mean ratio
            double meanRatio = sumRatio / n;
            double weightedMeanRatio = sumValue > 0 ? sumPredicted / sumValue : 0;
            double prd = weightedMeanRatio > 0 ? meanRatio / weightedMeanRatio : 0;

            return (cod, medianRatio, prd);
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
