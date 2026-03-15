// TFR-042 — AI-Assisted Valuation Service
// Provides predicted values using trained AVM models, comparable sales
// retrieval, and multi-approach valuation analysis.

using System;
using System.Collections.Generic;
using System.Linq;
using TerraFusion.AI.Regression;

namespace TerraFusion.AI.AVM
{
    /// <summary>
    /// Valuation mode controlling which approaches are executed.
    /// </summary>
    public enum ValuationMode
    {
        /// <summary>Run all approaches: sales comparison, cost, and income (if applicable).</summary>
        Full,

        /// <summary>Sales comparison approach only (fastest).</summary>
        Quick,

        /// <summary>Cost approach only.</summary>
        CostApproach
    }

    /// <summary>
    /// A comparable sale returned by the valuation service.
    /// </summary>
    public sealed class ComparableSale
    {
        /// <summary>Parcel identifier of the comparable.</summary>
        public string ParcelId { get; init; } = string.Empty;

        /// <summary>Sale price.</summary>
        public double SalePrice { get; init; }

        /// <summary>Sale date.</summary>
        public DateTime SaleDate { get; init; }

        /// <summary>Distance from subject parcel (in coordinate units).</summary>
        public double Distance { get; init; }

        /// <summary>Feature values of the comparable.</summary>
        public Dictionary<string, double> Features { get; init; } = new();

        /// <summary>Similarity score (0-1, higher = more similar).</summary>
        public double SimilarityScore { get; init; }

        /// <summary>Adjusted sale price after comparability adjustments.</summary>
        public double AdjustedPrice { get; init; }
    }

    /// <summary>
    /// Confidence interval for a predicted value.
    /// </summary>
    public sealed class ConfidenceInterval
    {
        /// <summary>Lower bound of the interval.</summary>
        public double Lower { get; init; }

        /// <summary>Upper bound of the interval.</summary>
        public double Upper { get; init; }

        /// <summary>Confidence level (e.g., 0.95 for 95%).</summary>
        public double Level { get; init; }
    }

    /// <summary>
    /// Full valuation result from the AI valuation service.
    /// </summary>
    public sealed class AiValuationResult
    {
        /// <summary>Subject parcel identifier.</summary>
        public string ParcelId { get; init; } = string.Empty;

        /// <summary>AVM-predicted value from the regression model.</summary>
        public double PredictedValue { get; init; }

        /// <summary>Confidence interval around the predicted value.</summary>
        public ConfidenceInterval Confidence { get; init; } = null!;

        /// <summary>Comparable sales used in the analysis.</summary>
        public ComparableSale[] Comparables { get; init; } = Array.Empty<ComparableSale>();

        /// <summary>Sales comparison approach indicated value (median adjusted comp price).</summary>
        public double? SalesComparisonValue { get; init; }

        /// <summary>Cost approach indicated value (if computed).</summary>
        public double? CostApproachValue { get; init; }

        /// <summary>Valuation mode that was executed.</summary>
        public ValuationMode Mode { get; init; }

        /// <summary>Methodology notes describing the analysis.</summary>
        public List<string> MethodologyNotes { get; init; } = new();

        /// <summary>Model identifier used for the AVM prediction.</summary>
        public string ModelId { get; init; } = string.Empty;

        /// <summary>Timestamp of the valuation.</summary>
        public DateTime Timestamp { get; init; }
    }

    /// <summary>
    /// Subject parcel data for valuation.
    /// </summary>
    public sealed class SubjectParcel
    {
        /// <summary>Parcel identifier.</summary>
        public string ParcelId { get; init; } = string.Empty;

        /// <summary>Feature values.</summary>
        public Dictionary<string, double> Features { get; init; } = new();

        /// <summary>Parcel centroid coordinate.</summary>
        public ParcelCoordinate Location { get; init; }

        /// <summary>Replacement cost new (for cost approach).</summary>
        public double? ReplacementCostNew { get; init; }

        /// <summary>Accumulated depreciation (for cost approach).</summary>
        public double? AccumulatedDepreciation { get; init; }

        /// <summary>Land value (for cost approach).</summary>
        public double? LandValue { get; init; }
    }

    /// <summary>
    /// A sale record with location data for comparable search.
    /// </summary>
    public sealed class LocatedSale
    {
        /// <summary>Parcel identifier.</summary>
        public string ParcelId { get; init; } = string.Empty;

        /// <summary>Sale price.</summary>
        public double SalePrice { get; init; }

        /// <summary>Sale date.</summary>
        public DateTime SaleDate { get; init; }

        /// <summary>Feature values.</summary>
        public Dictionary<string, double> Features { get; init; } = new();

        /// <summary>Location coordinate.</summary>
        public ParcelCoordinate Location { get; init; }
    }

    /// <summary>
    /// AI-assisted valuation analysis service.  Uses a trained AVM model
    /// for predicted values, fetches comparable sales within a configurable
    /// radius, and supports multiple valuation approaches.
    /// </summary>
    public sealed class AiValuationService
    {
        private readonly ModelReceipt _model;

        /// <summary>Default search radius for comparable sales (coordinate units).</summary>
        public const double DefaultSearchRadius = 5000;

        /// <summary>Default maximum number of comparables to return.</summary>
        public const int DefaultMaxComps = 10;

        /// <summary>Default confidence level for prediction intervals.</summary>
        public const double DefaultConfidenceLevel = 0.95;

        /// <summary>
        /// Create a valuation service backed by a trained AVM model.
        /// </summary>
        /// <param name="model">Trained model receipt from <see cref="AvmTrainingService"/>.</param>
        public AiValuationService(ModelReceipt model)
        {
            _model = model ?? throw new ArgumentNullException(nameof(model));
        }

        // ──────────────────────────────────────────────
        //  Primary API
        // ──────────────────────────────────────────────

        /// <summary>
        /// Perform an AI-assisted valuation analysis on a subject parcel.
        /// </summary>
        /// <param name="subject">Subject parcel data.</param>
        /// <param name="availableSales">Pool of available sales for comparable selection.</param>
        /// <param name="mode">Valuation mode (Full, Quick, CostApproach).</param>
        /// <param name="searchRadius">Search radius for comparables.</param>
        /// <param name="maxComps">Maximum number of comparables.</param>
        /// <param name="confidenceLevel">Confidence level for prediction interval.</param>
        public AiValuationResult Valuate(
            SubjectParcel subject,
            IEnumerable<LocatedSale> availableSales,
            ValuationMode mode = ValuationMode.Full,
            double searchRadius = DefaultSearchRadius,
            int maxComps = DefaultMaxComps,
            double confidenceLevel = DefaultConfidenceLevel)
        {
            var notes = new List<string>();

            // 1. AVM prediction
            double predicted = AvmTrainingService.Predict(_model, subject.Features);
            notes.Add($"AVM prediction using model {_model.ModelId} with {_model.Features.Length} features.");

            // 2. Prediction interval
            var confidence = ComputeConfidenceInterval(predicted, confidenceLevel);
            notes.Add($"Prediction interval at {confidenceLevel * 100:F0}% confidence: " +
                       $"[{confidence.Lower:N0}, {confidence.Upper:N0}].");

            // 3. Comparable sales (always done for Full and Quick)
            ComparableSale[] comps = Array.Empty<ComparableSale>();
            double? salesCompValue = null;

            if (mode == ValuationMode.Full || mode == ValuationMode.Quick)
            {
                comps = FindComparables(subject, availableSales, searchRadius, maxComps);
                notes.Add($"Found {comps.Length} comparable sales within {searchRadius:N0} unit radius.");

                if (comps.Length > 0)
                {
                    // Sales comparison value = median adjusted comp price
                    var adjustedPrices = comps.Select(c => c.AdjustedPrice).OrderBy(p => p).ToArray();
                    salesCompValue = adjustedPrices.Length % 2 == 0
                        ? (adjustedPrices[adjustedPrices.Length / 2 - 1] + adjustedPrices[adjustedPrices.Length / 2]) / 2.0
                        : adjustedPrices[adjustedPrices.Length / 2];
                    notes.Add($"Sales comparison indicated value: {salesCompValue:N0} (median of {comps.Length} adjusted comps).");
                }
            }

            // 4. Cost approach
            double? costValue = null;
            if (mode == ValuationMode.Full || mode == ValuationMode.CostApproach)
            {
                costValue = ComputeCostApproach(subject);
                if (costValue.HasValue)
                    notes.Add($"Cost approach indicated value: {costValue:N0}.");
                else
                    notes.Add("Cost approach: insufficient data (missing RCN, depreciation, or land value).");
            }

            return new AiValuationResult
            {
                ParcelId = subject.ParcelId,
                PredictedValue = predicted,
                Confidence = confidence,
                Comparables = comps,
                SalesComparisonValue = salesCompValue,
                CostApproachValue = costValue,
                Mode = mode,
                MethodologyNotes = notes,
                ModelId = _model.ModelId,
                Timestamp = DateTime.UtcNow
            };
        }

        // ──────────────────────────────────────────────
        //  Comparable sales search
        // ──────────────────────────────────────────────

        /// <summary>
        /// Find comparable sales within the search radius, scored by similarity.
        /// </summary>
        private ComparableSale[] FindComparables(
            SubjectParcel subject,
            IEnumerable<LocatedSale> sales,
            double radius,
            int maxComps)
        {
            var candidates = new List<(LocatedSale sale, double distance, double similarity)>();

            foreach (var sale in sales)
            {
                double dx = subject.Location.X - sale.Location.X;
                double dy = subject.Location.Y - sale.Location.Y;
                double dist = Math.Sqrt(dx * dx + dy * dy);

                if (dist > radius) continue;

                double similarity = ComputeSimilarity(subject.Features, sale.Features, dist, radius);
                candidates.Add((sale, dist, similarity));
            }

            // Sort by similarity descending, take top N
            var top = candidates
                .OrderByDescending(c => c.similarity)
                .Take(maxComps)
                .ToList();

            return top.Select(c =>
            {
                double adjustedPrice = AdjustCompPrice(subject.Features, c.sale.Features, c.sale.SalePrice);
                return new ComparableSale
                {
                    ParcelId = c.sale.ParcelId,
                    SalePrice = c.sale.SalePrice,
                    SaleDate = c.sale.SaleDate,
                    Distance = c.distance,
                    Features = c.sale.Features,
                    SimilarityScore = c.similarity,
                    AdjustedPrice = adjustedPrice
                };
            }).ToArray();
        }

        /// <summary>
        /// Compute similarity score between subject and a sale.
        /// Uses normalised feature differences and distance decay.
        /// </summary>
        private double ComputeSimilarity(
            Dictionary<string, double> subjectFeatures,
            Dictionary<string, double> saleFeatures,
            double distance,
            double maxRadius)
        {
            // Distance component (0-1, closer = higher)
            double distScore = 1.0 - (distance / maxRadius);

            // Feature similarity: average of 1 - |diff / max(subject, sale)|
            double featureScore = 0;
            int count = 0;

            foreach (var feature in _model.Features)
            {
                subjectFeatures.TryGetValue(feature, out double sv);
                saleFeatures.TryGetValue(feature, out double cv);

                double maxVal = Math.Max(Math.Abs(sv), Math.Abs(cv));
                if (maxVal > 0)
                {
                    featureScore += 1.0 - Math.Abs(sv - cv) / maxVal;
                    count++;
                }
                else
                {
                    featureScore += 1.0; // both zero = perfect match
                    count++;
                }
            }

            featureScore = count > 0 ? featureScore / count : 0;

            // Weighted combination: 30% distance, 70% features
            return 0.30 * distScore + 0.70 * featureScore;
        }

        /// <summary>
        /// Adjust a comparable sale price using coefficient-based adjustments.
        /// For each feature, adjustment = (subject_value - comp_value) * coefficient.
        /// </summary>
        private double AdjustCompPrice(
            Dictionary<string, double> subjectFeatures,
            Dictionary<string, double> compFeatures,
            double compPrice)
        {
            double adjustment = 0;

            for (int j = 0; j < _model.Features.Length; j++)
            {
                string feature = _model.Features[j];
                subjectFeatures.TryGetValue(feature, out double sv);
                compFeatures.TryGetValue(feature, out double cv);

                double diff = sv - cv;
                // Use the model coefficient as the per-unit adjustment
                double coeff = _model.Coefficients[j + 1]; // +1 to skip intercept
                adjustment += diff * coeff;
            }

            return compPrice + adjustment;
        }

        // ──────────────────────────────────────────────
        //  Cost approach
        // ──────────────────────────────────────────────

        /// <summary>
        /// Cost approach: Value = RCN - Depreciation + Land Value.
        /// Returns null if required inputs are missing.
        /// </summary>
        private double? ComputeCostApproach(SubjectParcel subject)
        {
            if (!subject.ReplacementCostNew.HasValue ||
                !subject.AccumulatedDepreciation.HasValue ||
                !subject.LandValue.HasValue)
                return null;

            return subject.ReplacementCostNew.Value
                 - subject.AccumulatedDepreciation.Value
                 + subject.LandValue.Value;
        }

        // ──────────────────────────────────────────────
        //  Prediction interval
        // ──────────────────────────────────────────────

        /// <summary>
        /// Compute a prediction interval using the model's residual standard error.
        /// Interval = predicted +/- t_{α/2, df} * RSE * sqrt(1 + 1/n).
        /// </summary>
        private ConfidenceInterval ComputeConfidenceInterval(double predicted, double level)
        {
            double rse = _model.TrainingResult.ResidualStandardError;
            int n = _model.TrainingResult.N;
            int df = _model.TrainingResult.N - _model.TrainingResult.P;

            // For large samples, use normal approximation
            double alpha = 1.0 - level;
            double zCrit = NormalQuantile(1.0 - alpha / 2.0);

            // Prediction interval width factor
            double factor = rse * Math.Sqrt(1.0 + 1.0 / n);
            double margin = zCrit * factor;

            return new ConfidenceInterval
            {
                Lower = predicted - margin,
                Upper = predicted + margin,
                Level = level
            };
        }

        /// <summary>Normal quantile approximation (Abramowitz & Stegun 26.2.23).</summary>
        private static double NormalQuantile(double p)
        {
            if (p <= 0) return double.NegativeInfinity;
            if (p >= 1) return double.PositiveInfinity;

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
