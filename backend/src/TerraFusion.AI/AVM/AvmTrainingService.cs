// TFR-041 — AVM Training Service
// Model training pipeline: feature computation, train/test splitting,
// regression fitting, and evaluation with IAAO ratio study metrics.

using System;
using System.Collections.Generic;
using System.Linq;
using TerraFusion.AI.Regression;

namespace TerraFusion.AI.AVM
{
    /// <summary>
    /// Standard feature set for AVM models.
    /// </summary>
    public static class AvmFeatures
    {
        public const string BuildingArea = "building_area";
        public const string LandArea = "land_area";
        public const string Age = "age";
        public const string Bedrooms = "bedrooms";
        public const string Bathrooms = "bathrooms";
        public const string QualityCode = "quality_code";
        public const string ConditionCode = "condition_code";

        /// <summary>All standard features in canonical order.</summary>
        public static readonly string[] All =
        {
            BuildingArea, LandArea, Age, Bedrooms, Bathrooms, QualityCode, ConditionCode
        };
    }

    /// <summary>
    /// Input record for AVM training (one per qualified sale).
    /// </summary>
    public sealed class AvmTrainingRecord
    {
        /// <summary>Parcel identifier.</summary>
        public string ParcelId { get; init; } = string.Empty;

        /// <summary>Sale price (dependent variable).</summary>
        public double SalePrice { get; init; }

        /// <summary>Feature values keyed by feature name.</summary>
        public Dictionary<string, double> Features { get; init; } = new();
    }

    /// <summary>
    /// Evaluation metrics for a trained AVM model.
    /// </summary>
    public sealed class AvmEvaluation
    {
        /// <summary>R² on the test set.</summary>
        public double RSquared { get; init; }

        /// <summary>Root Mean Squared Error on the test set.</summary>
        public double RMSE { get; init; }

        /// <summary>Mean Absolute Error on the test set.</summary>
        public double MAE { get; init; }

        /// <summary>Median assessment ratio (predicted / actual) on the test set.</summary>
        public double MedianRatio { get; init; }

        /// <summary>Coefficient of Dispersion on the test set.</summary>
        public double COD { get; init; }

        /// <summary>Number of test observations.</summary>
        public int TestSize { get; init; }

        /// <summary>Number of training observations.</summary>
        public int TrainSize { get; init; }
    }

    /// <summary>
    /// Receipt documenting a trained AVM model, for audit and reproducibility.
    /// </summary>
    public sealed class ModelReceipt
    {
        /// <summary>Unique model identifier.</summary>
        public string ModelId { get; init; } = Guid.NewGuid().ToString("N")[..12].ToUpperInvariant();

        /// <summary>Feature names used in the model (in coefficient order).</summary>
        public string[] Features { get; init; } = Array.Empty<string>();

        /// <summary>Estimated coefficients (index 0 = intercept).</summary>
        public double[] Coefficients { get; init; } = Array.Empty<double>();

        /// <summary>Evaluation metrics on the held-out test set.</summary>
        public AvmEvaluation Evaluation { get; init; } = null!;

        /// <summary>OLS result from training.</summary>
        public OlsResult TrainingResult { get; init; } = null!;

        /// <summary>Timestamp of training.</summary>
        public DateTime TrainedAt { get; init; }

        /// <summary>Random seed used for train/test split.</summary>
        public int RandomSeed { get; init; }

        /// <summary>Train/test split ratio (fraction used for training).</summary>
        public double TrainFraction { get; init; }
    }

    /// <summary>
    /// AVM model training pipeline.  Computes features, splits data 80/20,
    /// trains via OLS or MultipleRegressionEngine, evaluates on the test set,
    /// and produces a <see cref="ModelReceipt"/>.
    /// </summary>
    public static class AvmTrainingService
    {
        /// <summary>Default train fraction (80% train, 20% test).</summary>
        public const double DefaultTrainFraction = 0.80;

        /// <summary>Default random seed for reproducible splits.</summary>
        public const int DefaultSeed = 42;

        // ──────────────────────────────────────────────
        //  Primary API
        // ──────────────────────────────────────────────

        /// <summary>
        /// Train an AVM model on the provided sales data.
        /// </summary>
        /// <param name="records">Qualified sales with features populated.</param>
        /// <param name="features">Feature names to include (defaults to all standard features).</param>
        /// <param name="trainFraction">Fraction of data for training (default 0.80).</param>
        /// <param name="seed">Random seed for split reproducibility.</param>
        /// <returns>A <see cref="ModelReceipt"/> documenting the trained model.</returns>
        public static ModelReceipt Train(
            IEnumerable<AvmTrainingRecord> records,
            string[]? features = null,
            double trainFraction = DefaultTrainFraction,
            int seed = DefaultSeed)
        {
            features ??= AvmFeatures.All;
            var allRecords = records.ToList();

            if (allRecords.Count < 20)
                throw new InvalidOperationException(
                    $"Need at least 20 records for AVM training; got {allRecords.Count}.");

            // Shuffle and split
            var rng = new Random(seed);
            var shuffled = allRecords.OrderBy(_ => rng.Next()).ToList();
            int trainSize = (int)(shuffled.Count * trainFraction);
            var trainSet = shuffled.Take(trainSize).ToList();
            var testSet = shuffled.Skip(trainSize).ToList();

            // Build matrices
            var (XTrain, yTrain) = BuildMatrix(trainSet, features);
            var (XTest, yTest) = BuildMatrix(testSet, features);

            // Train
            var ols = OlsSolver.Fit(XTrain, yTrain);

            // Evaluate on test set
            var eval = Evaluate(XTest, yTest, ols.Coefficients, features.Length);

            return new ModelReceipt
            {
                Features = features,
                Coefficients = ols.Coefficients,
                Evaluation = new AvmEvaluation
                {
                    RSquared = eval.r2,
                    RMSE = eval.rmse,
                    MAE = eval.mae,
                    MedianRatio = eval.medianRatio,
                    COD = eval.cod,
                    TestSize = testSet.Count,
                    TrainSize = trainSize
                },
                TrainingResult = ols,
                TrainedAt = DateTime.UtcNow,
                RandomSeed = seed,
                TrainFraction = trainFraction
            };
        }

        /// <summary>
        /// Predict a value using a trained model's coefficients.
        /// </summary>
        /// <param name="receipt">Trained model receipt.</param>
        /// <param name="featureValues">Feature values keyed by name.</param>
        /// <returns>Predicted value.</returns>
        public static double Predict(ModelReceipt receipt, Dictionary<string, double> featureValues)
        {
            double predicted = receipt.Coefficients[0]; // intercept
            for (int j = 0; j < receipt.Features.Length; j++)
            {
                featureValues.TryGetValue(receipt.Features[j], out double val);
                predicted += receipt.Coefficients[j + 1] * val;
            }
            return predicted;
        }

        // ──────────────────────────────────────────────
        //  Internal helpers
        // ──────────────────────────────────────────────

        /// <summary>Build design matrix with intercept from training records.</summary>
        private static (double[,] X, double[] y) BuildMatrix(
            List<AvmTrainingRecord> records, string[] features)
        {
            int n = records.Count;
            int p = features.Length + 1; // +1 for intercept
            var X = new double[n, p];
            var y = new double[n];

            for (int i = 0; i < n; i++)
            {
                X[i, 0] = 1.0;
                y[i] = records[i].SalePrice;
                for (int j = 0; j < features.Length; j++)
                {
                    records[i].Features.TryGetValue(features[j], out double val);
                    X[i, j + 1] = val;
                }
            }

            return (X, y);
        }

        /// <summary>Evaluate model on a test set, returning ratio study metrics.</summary>
        private static (double r2, double rmse, double mae, double medianRatio, double cod)
            Evaluate(double[,] X, double[] y, double[] coefficients, int numFeatures)
        {
            int n = y.Length;
            int p = numFeatures + 1;

            double[] predicted = new double[n];
            double[] ratios = new double[n];
            double sumSqErr = 0, sumAbsErr = 0;
            double yBar = y.Average();
            double ssTotal = 0;

            for (int i = 0; i < n; i++)
            {
                double yHat = 0;
                for (int j = 0; j < p; j++)
                    yHat += X[i, j] * coefficients[j];
                predicted[i] = yHat;

                double err = y[i] - yHat;
                sumSqErr += err * err;
                sumAbsErr += Math.Abs(err);
                ssTotal += (y[i] - yBar) * (y[i] - yBar);

                ratios[i] = y[i] > 0 ? yHat / y[i] : 0;
            }

            double r2 = ssTotal > 0 ? 1.0 - sumSqErr / ssTotal : 0;
            double rmse = Math.Sqrt(sumSqErr / n);
            double mae = sumAbsErr / n;

            // Median ratio
            var sortedRatios = ratios.OrderBy(r => r).ToArray();
            double medianRatio = sortedRatios.Length % 2 == 0
                ? (sortedRatios[n / 2 - 1] + sortedRatios[n / 2]) / 2.0
                : sortedRatios[n / 2];

            // COD
            double meanAbsDev = ratios.Average(r => Math.Abs(r - medianRatio));
            double cod = medianRatio > 0 ? (meanAbsDev / medianRatio) * 100.0 : 0;

            return (r2, rmse, mae, medianRatio, cod);
        }
    }
}
