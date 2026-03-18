// BIV-066 — Market Predictor: ML model layer for property value prediction
// NOTE: MarketPredictorService.cs in Services/ is the service facade;
//       this file is the underlying ML model (train / predict / evaluate).
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace TerraFusion.AI.ML;

#region Contracts

/// <summary>A single labelled training observation.</summary>
public sealed record TrainingObservation(
    double BuildingArea,
    double LandArea,
    int Age,
    int Bedrooms,
    int Bathrooms,
    int NeighborhoodCode,
    decimal SalePrice);

/// <summary>Feature vector for prediction (unlabelled).</summary>
public sealed record PredictionFeatures(
    double BuildingArea,
    double LandArea,
    int Age,
    int Bedrooms,
    int Bathrooms,
    int NeighborhoodCode);

/// <summary>Model evaluation metrics.</summary>
public sealed record ModelMetrics(
    double RSquared,
    double Rmse,
    double Mae,
    int TrainingSamples,
    DateTime TrainedAt);

/// <summary>Prediction output from the trained model.</summary>
public sealed record MarketPrediction(
    decimal PredictedPrice,
    double ConfidenceInterval95Low,
    double ConfidenceInterval95High,
    ModelMetrics ModelInfo);

/// <summary>
/// ML model abstraction: train on sales data, predict property values, evaluate fit.
/// </summary>
public interface IMarketPredictor
{
    /// <summary>Train (fit) the model on labelled sales data.</summary>
    Task<ModelMetrics> TrainAsync(IReadOnlyList<TrainingObservation> data, CancellationToken ct = default);

    /// <summary>Predict a property value using the trained model.</summary>
    Task<MarketPrediction> PredictAsync(PredictionFeatures features, CancellationToken ct = default);

    /// <summary>Batch prediction.</summary>
    Task<IReadOnlyList<MarketPrediction>> PredictBatchAsync(
        IReadOnlyList<PredictionFeatures> batch, CancellationToken ct = default);

    /// <summary>Current model metrics (null if not yet trained).</summary>
    ModelMetrics? CurrentMetrics { get; }
}

#endregion

/// <summary>
/// OLS linear-regression market predictor.
/// Features: building_area, land_area, age, bedrooms, bathrooms, neighbourhood_code.
/// Evaluates with R², RMSE, MAE.
/// </summary>
public sealed class MarketPredictor : IMarketPredictor
{
    private readonly ILogger<MarketPredictor> _logger;

    // Model state — coefficients fitted during Train().
    private double[]? _coefficients;
    private double _residualStdDev;
    private ModelMetrics? _metrics;

    /// <inheritdoc />
    public ModelMetrics? CurrentMetrics => _metrics;

    public MarketPredictor(ILogger<MarketPredictor> logger)
    {
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <inheritdoc />
    public Task<ModelMetrics> TrainAsync(IReadOnlyList<TrainingObservation> data, CancellationToken ct = default)
    {
        if (data.Count < 2)
            throw new InvalidOperationException("Training requires at least 2 observations.");

        _logger.LogInformation("Training MarketPredictor on {Count} observations", data.Count);

        // ── Build design matrix X and response vector y ──
        var n = data.Count;
        const int p = 7; // intercept + 6 features
        var x = new double[n, p];
        var y = new double[n];

        for (var i = 0; i < n; i++)
        {
            var obs = data[i];
            x[i, 0] = 1.0;                    // intercept
            x[i, 1] = obs.BuildingArea;
            x[i, 2] = obs.LandArea;
            x[i, 3] = obs.Age;
            x[i, 4] = obs.Bedrooms;
            x[i, 5] = obs.Bathrooms;
            x[i, 6] = obs.NeighborhoodCode;
            y[i] = (double)obs.SalePrice;
        }

        // ── Normal equations: β = (X'X)⁻¹ X'y ──
        _coefficients = SolveOls(x, y, n, p);

        // ── Evaluate ──
        var predictions = new double[n];
        for (var i = 0; i < n; i++)
        {
            var pred = 0.0;
            for (var j = 0; j < p; j++)
                pred += _coefficients[j] * x[i, j];
            predictions[i] = pred;
        }

        var yMean = y.Average();
        var ssRes = 0.0;
        var ssTot = 0.0;
        var absErrors = new double[n];

        for (var i = 0; i < n; i++)
        {
            var residual = y[i] - predictions[i];
            ssRes += residual * residual;
            ssTot += (y[i] - yMean) * (y[i] - yMean);
            absErrors[i] = Math.Abs(residual);
        }

        var rSquared = ssTot > 0 ? 1.0 - ssRes / ssTot : 0.0;
        var rmse = Math.Sqrt(ssRes / n);
        var mae = absErrors.Average();
        _residualStdDev = rmse;

        _metrics = new ModelMetrics(
            Math.Round(rSquared, 6),
            Math.Round(rmse, 2),
            Math.Round(mae, 2),
            n,
            DateTime.UtcNow);

        _logger.LogInformation(
            "Training complete — R²={R2:F4}, RMSE={RMSE:F0}, MAE={MAE:F0}, n={N}",
            _metrics.RSquared, _metrics.Rmse, _metrics.Mae, n);

        return Task.FromResult(_metrics);
    }

    /// <inheritdoc />
    public Task<MarketPrediction> PredictAsync(PredictionFeatures features, CancellationToken ct = default)
    {
        EnsureTrained();

        var xRow = new[]
        {
            1.0,
            features.BuildingArea,
            features.LandArea,
            features.Age,
            features.Bedrooms,
            features.Bathrooms,
            features.NeighborhoodCode
        };

        var predicted = 0.0;
        for (var j = 0; j < xRow.Length; j++)
            predicted += _coefficients![j] * xRow[j];

        predicted = Math.Max(predicted, 0);

        var ci95 = 1.96 * _residualStdDev;

        return Task.FromResult(new MarketPrediction(
            (decimal)Math.Round(predicted, 2),
            Math.Round(predicted - ci95, 2),
            Math.Round(predicted + ci95, 2),
            _metrics!));
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<MarketPrediction>> PredictBatchAsync(
        IReadOnlyList<PredictionFeatures> batch, CancellationToken ct = default)
    {
        var results = new List<MarketPrediction>(batch.Count);
        foreach (var f in batch)
            results.Add(await PredictAsync(f, ct));
        return results;
    }

    // ── Private helpers ─────────────────────────────────────────────

    private void EnsureTrained()
    {
        if (_coefficients is null || _metrics is null)
            throw new InvalidOperationException("Model has not been trained. Call TrainAsync first.");
    }

    /// <summary>
    /// Solve OLS via the normal equations using Gauss-Jordan elimination.
    /// For production workloads a LAPACK-backed solver or ML.NET trainer would replace this.
    /// </summary>
    private static double[] SolveOls(double[,] x, double[] y, int n, int p)
    {
        // Compute X'X (p × p) and X'y (p × 1).
        var xtx = new double[p, p];
        var xty = new double[p];

        for (var i = 0; i < p; i++)
        {
            for (var j = 0; j < p; j++)
            {
                var sum = 0.0;
                for (var k = 0; k < n; k++)
                    sum += x[k, i] * x[k, j];
                xtx[i, j] = sum;
            }

            var s = 0.0;
            for (var k = 0; k < n; k++)
                s += x[k, i] * y[k];
            xty[i] = s;
        }

        // Augmented matrix [X'X | X'y] for Gauss-Jordan.
        var aug = new double[p, p + 1];
        for (var i = 0; i < p; i++)
        {
            for (var j = 0; j < p; j++)
                aug[i, j] = xtx[i, j];
            aug[i, p] = xty[i];
        }

        // Forward elimination with partial pivoting.
        for (var col = 0; col < p; col++)
        {
            // Pivot.
            var maxRow = col;
            for (var row = col + 1; row < p; row++)
            {
                if (Math.Abs(aug[row, col]) > Math.Abs(aug[maxRow, col]))
                    maxRow = row;
            }

            if (maxRow != col)
            {
                for (var j = 0; j <= p; j++)
                    (aug[col, j], aug[maxRow, j]) = (aug[maxRow, j], aug[col, j]);
            }

            var pivot = aug[col, col];
            if (Math.Abs(pivot) < 1e-12)
            {
                // Near-singular — use ridge regularisation fallback.
                aug[col, col] += 1e-6;
                pivot = aug[col, col];
            }

            for (var j = col; j <= p; j++)
                aug[col, j] /= pivot;

            for (var row = 0; row < p; row++)
            {
                if (row == col) continue;
                var factor = aug[row, col];
                for (var j = col; j <= p; j++)
                    aug[row, j] -= factor * aug[col, j];
            }
        }

        var beta = new double[p];
        for (var i = 0; i < p; i++)
            beta[i] = aug[i, p];

        return beta;
    }
}
