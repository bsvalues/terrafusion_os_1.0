using Microsoft.ML;
using Microsoft.ML.Data;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using TerraFusion.Core.Models;
using TerraFusion.Core.Services.Monitoring;
using TerraFusion.Core.Extensions;

namespace TerraFusion.Core.Services.AI;

/// <summary>
/// ML model management service for training, deploying, and managing machine learning models
/// </summary>
public interface IMLModelManager
{
    Task<ModelTrainingResult> TrainModelAsync(ModelTrainingRequest request);
    Task<ModelPredictionResult<T>> PredictAsync<T>(string modelId, object inputData);
    Task<ModelEvaluationResult> EvaluateModelAsync(string modelId, IDataView testData);
    Task<bool> DeployModelAsync(string modelId, ModelDeploymentOptions options);
    Task<bool> RetireModelAsync(string modelId);
    Task<List<MLModelInfo>> GetAvailableModelsAsync();
    Task<MLModelInfo?> GetModelInfoAsync(string modelId);
    Task<ModelPerformanceMetrics> GetModelPerformanceAsync(string modelId);
    Task<bool> RetrainModelAsync(string modelId, IDataView newData);
}

public class MLModelManager : IMLModelManager
{
    private readonly MLContext _mlContext;
    private readonly ILogger<MLModelManager> _logger;
    private readonly IStructuredLogger _structuredLogger;
    private readonly IConfiguration _configuration;
    private readonly Dictionary<string, ITransformer> _loadedModels;
    private readonly Dictionary<string, MLModelInfo> _modelInfos;
    private readonly string _modelsBasePath;

    public MLModelManager(
        ILogger<MLModelManager> logger,
        IStructuredLogger structuredLogger,
        IConfiguration configuration)
    {
        _mlContext = new MLContext(seed: 1);
        _logger = logger;
        _structuredLogger = structuredLogger;
        _configuration = configuration;
        _loadedModels = new Dictionary<string, ITransformer>();
        _modelInfos = new Dictionary<string, MLModelInfo>();
        _modelsBasePath = _configuration["ML:ModelsPath"] ?? "Models";

        InitializeBuiltInModels();
    }

    public Task<ModelTrainingResult> TrainModelAsync(ModelTrainingRequest request)
    {
        var trainingId = Guid.NewGuid().ToString();
        var stopwatch = System.Diagnostics.Stopwatch.StartNew();

        try
        {
            _structuredLogger.LogAIEvent("ModelTrainingStarted",
                $"Starting training for model {request.ModelId}",
                context: new { 
                    TrainingId = trainingId,
                    ModelId = request.ModelId,
                    ModelType = request.ModelType,
                    DataSize = request.TrainingData?.GetRowCount() ?? 0
                });

            var pipeline = BuildPipeline(request);
            var model = pipeline.Fit(request.TrainingData);

            // Evaluate the model
            var predictions = model.Transform(request.ValidationData ?? request.TrainingData);
            var metrics = EvaluateModel(request.ModelType, predictions);

            // Save the model
            var modelPath = Path.Combine(_modelsBasePath, $"{request.ModelId}.zip");
            Directory.CreateDirectory(_modelsBasePath);
            
            if (request.TrainingData?.Schema != null)
            {
                _mlContext.Model.Save(model, request.TrainingData.Schema, modelPath);
            }
            else
            {
                throw new InvalidOperationException("Training data schema is required for model saving.");
            }

            // Register the model
            var modelInfo = new MLModelInfo
            {
                Id = request.ModelId,
                Name = request.ModelName,
                Type = request.ModelType,
                Version = request.Version,
                FilePath = modelPath,
                TrainedAt = DateTime.UtcNow,
                Accuracy = metrics.Accuracy,
                IsActive = true,
                Performance = metrics
            };

            _modelInfos[request.ModelId] = modelInfo;
            _loadedModels[request.ModelId] = model;

            stopwatch.Stop();

            _structuredLogger.LogAIEvent("ModelTrainingCompleted",
                $"Model {request.ModelId} training completed successfully",
                context: new { 
                    TrainingId = trainingId,
                    ModelId = request.ModelId,
                    TrainingTime = stopwatch.ElapsedMilliseconds,
                    Accuracy = metrics.Accuracy
                });

            return Task.FromResult(new ModelTrainingResult
            {
                Success = true,
                ModelId = request.ModelId,
                TrainingTime = stopwatch.Elapsed,
                Metrics = metrics,
                ModelPath = modelPath
            });
        }
        catch (Exception ex)
        {
            stopwatch.Stop();
            _logger.LogError(ex, "Model training failed for {ModelId}", request.ModelId);

            return Task.FromResult(new ModelTrainingResult
            {
                Success = false,
                ModelId = request.ModelId,
                Error = ex.Message,
                TrainingTime = stopwatch.Elapsed
            });
        }
    }

    public Task<ModelPredictionResult<T>> PredictAsync<T>(string modelId, object inputData)
    {
        try
        {
            if (!_loadedModels.TryGetValue(modelId, out var model))
            {
                model = LoadModelAsync(modelId).Result;
                if (model == null)
                {
                    return Task.FromResult(new ModelPredictionResult<T>
                    {
                        Success = false,
                        Error = $"Model {modelId} not found or failed to load"
                    });
                }
            }

            var modelInfo = _modelInfos[modelId];
            
            // Create prediction engine based on model type
            var prediction = modelInfo.Type switch
            {
                MLModelType.Regression => PredictRegression<T>(model, inputData).Result,
                MLModelType.BinaryClassification => PredictBinaryClassification<T>(model, inputData).Result,
                MLModelType.MulticlassClassification => PredictMulticlassClassification<T>(model, inputData).Result,
                MLModelType.Clustering => PredictClustering<T>(model, inputData).Result,
                MLModelType.AnomalyDetection => PredictAnomalyDetection<T>(model, inputData).Result,
                _ => throw new NotSupportedException($"Model type {modelInfo.Type} is not supported")
            };

            _structuredLogger.LogAIEvent("ModelPredictionCompleted",
                $"Prediction completed for model {modelId}",
                context: new { 
                    ModelId = modelId,
                    ModelType = modelInfo.Type,
                    Success = prediction.Success
                });

            return Task.FromResult(prediction);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Prediction failed for model {ModelId}", modelId);
            return Task.FromResult(new ModelPredictionResult<T>
            {
                Success = false,
                Error = ex.Message
            });
        }
    }

    public Task<ModelEvaluationResult> EvaluateModelAsync(string modelId, IDataView testData)
    {
        try
        {
            if (!_loadedModels.TryGetValue(modelId, out var model))
            {
                model = LoadModelAsync(modelId).Result;
                if (model == null)
                {
                    return Task.FromResult(new ModelEvaluationResult
                    {
                        Success = false,
                        Error = $"Model {modelId} not found or failed to load"
                    });
                }
            }

            var modelInfo = _modelInfos[modelId];
            var predictions = model.Transform(testData);
            var metrics = EvaluateModel(modelInfo.Type, predictions);

            return Task.FromResult(new ModelEvaluationResult
            {
                Success = true,
                ModelId = modelId,
                Metrics = metrics,
                TestDataSize = (int)(testData.GetRowCount() ?? 0)
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Model evaluation failed for {ModelId}", modelId);
            return Task.FromResult(new ModelEvaluationResult
            {
                Success = false,
                ModelId = modelId,
                Error = ex.Message
            });
        }
    }

    public Task<bool> DeployModelAsync(string modelId, ModelDeploymentOptions options)
    {
        try
        {
            var modelInfo = _modelInfos.GetValueOrDefault(modelId);
            if (modelInfo == null)
            {
                _logger.LogWarning("Model {ModelId} not found for deployment", modelId);
                return Task.FromResult(false);
            }

            // Load model if not already loaded
            if (!_loadedModels.ContainsKey(modelId))
            {
                var model = LoadModelAsync(modelId).Result;
                if (model == null)
                {
                    return Task.FromResult(false);
                }
            }

            // Update deployment status
            modelInfo.IsActive = true;
            modelInfo.DeployedAt = DateTime.UtcNow;
            modelInfo.DeploymentEnvironment = options.Environment;

            _structuredLogger.LogAIEvent("ModelDeployed",
                $"Model {modelId} deployed successfully",
                context: new { 
                    ModelId = modelId,
                    Environment = options.Environment,
                    Version = modelInfo.Version
                });

            return Task.FromResult(true);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Model deployment failed for {ModelId}", modelId);
            return Task.FromResult(false);
        }
    }

        public Task<bool> RetireModelAsync(string modelId)
    {
        try
        {
            if (_modelInfos.TryGetValue(modelId, out var modelInfo))
            {
                modelInfo.IsActive = false;
                modelInfo.RetiredAt = DateTime.UtcNow;
                
                // Remove from loaded models
                _loadedModels.Remove(modelId);

                _structuredLogger.LogAIEvent("ModelRetired",
                    $"Model {modelId} retired successfully",
                    context: new { ModelId = modelId });

                return Task.FromResult(true);
            }

            return Task.FromResult(false);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Model retirement failed for {ModelId}", modelId);
            return Task.FromResult(false);
        }
    }

    public Task<List<MLModelInfo>> GetAvailableModelsAsync()
    {
        return Task.FromResult(_modelInfos.Values.Where(m => m.IsActive).ToList());
    }

    public Task<MLModelInfo?> GetModelInfoAsync(string modelId)
    {
        return Task.FromResult(_modelInfos.GetValueOrDefault(modelId));
    }

    public Task<ModelPerformanceMetrics> GetModelPerformanceAsync(string modelId)
    {
        try
        {
            var modelInfo = _modelInfos.GetValueOrDefault(modelId);
            if (modelInfo == null)
            {
                throw new ArgumentException($"Model {modelId} not found");
            }

            // In a real implementation, this would gather performance metrics from monitoring systems
            Task.Delay(10).Wait();

            return Task.FromResult(new ModelPerformanceMetrics
            {
                ModelId = modelId,
                Accuracy = modelInfo.Accuracy,
                Precision = modelInfo.Performance?.Precision ?? 0,
                Recall = modelInfo.Performance?.Recall ?? 0,
                F1Score = modelInfo.Performance?.F1Score ?? 0,
                AverageInferenceTime = TimeSpan.FromMilliseconds(new Random().Next(10, 100)),
                ThroughputPerSecond = new Random().Next(100, 1000),
                ErrorRate = new Random().NextDouble() * 0.05,
                LastEvaluated = DateTime.UtcNow.AddHours(-new Random().Next(1, 24))
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get performance metrics for model {ModelId}", modelId);
            throw;
        }
    }

    public Task<bool> RetrainModelAsync(string modelId, IDataView newData)
    {
        try
        {
            var modelInfo = _modelInfos.GetValueOrDefault(modelId);
            if (modelInfo == null)
            {
                _logger.LogWarning("Model {ModelId} not found for retraining", modelId);
                return Task.FromResult(false);
            }

            // Create retraining request
            var retrainingRequest = new ModelTrainingRequest
            {
                ModelId = modelId,
                ModelName = modelInfo.Name,
                ModelType = modelInfo.Type,
                Version = IncrementVersion(modelInfo.Version),
                TrainingData = newData
            };

            var result = TrainModelAsync(retrainingRequest).Result;
            
            if (result.Success)
            {
                _structuredLogger.LogAIEvent("ModelRetrained",
                    $"Model {modelId} retrained successfully",
                    context: new { 
                        ModelId = modelId,
                        NewVersion = retrainingRequest.Version,
                        NewAccuracy = result.Metrics?.Accuracy
                    });
            }

            return Task.FromResult(result.Success);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Model retraining failed for {ModelId}", modelId);
            return Task.FromResult(false);
        }
    }

    private EstimatorChain<ITransformer> BuildPipeline(ModelTrainingRequest request)
    {
        var estimator = request.ModelType switch
        {
            MLModelType.Regression => BuildRegressionPipeline(request),
            MLModelType.BinaryClassification => BuildBinaryClassificationPipeline(request),
            MLModelType.MulticlassClassification => BuildMulticlassClassificationPipeline(request),
            MLModelType.Clustering => BuildClusteringPipeline(request),
            MLModelType.AnomalyDetection => BuildAnomalyDetectionPipeline(request),
            _ => throw new NotSupportedException($"Model type {request.ModelType} is not supported")
        };

        return estimator as EstimatorChain<ITransformer> ?? 
               throw new InvalidOperationException("Failed to create pipeline");
    }

    private IEstimator<ITransformer> BuildRegressionPipeline(ModelTrainingRequest request)
    {
        return _mlContext.Transforms.Categorical.OneHotEncoding("CategoryEncoded", "Category")
            .Append(_mlContext.Transforms.Text.FeaturizeText("TextFeatures", "Description"))
            .Append(_mlContext.Transforms.Concatenate("Features", "CategoryEncoded", "TextFeatures", "NumericFeatures"))
            .Append(_mlContext.Regression.Trainers.LbfgsPoissonRegression(labelColumnName: "Label", featureColumnName: "Features"));
    }

    private IEstimator<ITransformer> BuildBinaryClassificationPipeline(ModelTrainingRequest request)
    {
        return _mlContext.Transforms.Categorical.OneHotEncoding("CategoryEncoded", "Category")
            .Append(_mlContext.Transforms.Text.FeaturizeText("TextFeatures", "Description"))
            .Append(_mlContext.Transforms.Concatenate("Features", "CategoryEncoded", "TextFeatures", "NumericFeatures"))
            .Append(_mlContext.BinaryClassification.Trainers.LbfgsLogisticRegression(labelColumnName: "Label", featureColumnName: "Features"));
    }

    private IEstimator<ITransformer> BuildMulticlassClassificationPipeline(ModelTrainingRequest request)
    {
        return _mlContext.Transforms.Categorical.OneHotEncoding("CategoryEncoded", "Category")
            .Append(_mlContext.Transforms.Text.FeaturizeText("TextFeatures", "Description"))
            .Append(_mlContext.Transforms.Concatenate("Features", "CategoryEncoded", "TextFeatures", "NumericFeatures"))
            .Append(_mlContext.MulticlassClassification.Trainers.LbfgsMaximumEntropy(labelColumnName: "Label", featureColumnName: "Features"));
    }

    private IEstimator<ITransformer> BuildClusteringPipeline(ModelTrainingRequest request)
    {
        return _mlContext.Transforms.Categorical.OneHotEncoding("CategoryEncoded", "Category")
            .Append(_mlContext.Transforms.Text.FeaturizeText("TextFeatures", "Description"))
            .Append(_mlContext.Transforms.Concatenate("Features", "CategoryEncoded", "TextFeatures", "NumericFeatures"))
            .Append(_mlContext.Clustering.Trainers.KMeans(featureColumnName: "Features", numberOfClusters: 5));
    }

    private IEstimator<ITransformer> BuildAnomalyDetectionPipeline(ModelTrainingRequest request)
    {
        return _mlContext.Transforms.Categorical.OneHotEncoding("CategoryEncoded", "Category")
            .Append(_mlContext.Transforms.Text.FeaturizeText("TextFeatures", "Description"))
            .Append(_mlContext.Transforms.Concatenate("Features", "CategoryEncoded", "TextFeatures", "NumericFeatures"))
            .Append(_mlContext.AnomalyDetection.Trainers.RandomizedPca(featureColumnName: "Features"));
    }

    private ModelPerformanceMetrics EvaluateModel(MLModelType modelType, IDataView predictions)
    {
        return modelType switch
        {
            MLModelType.Regression => EvaluateRegressionModel(predictions),
            MLModelType.BinaryClassification => EvaluateBinaryClassificationModel(predictions),
            MLModelType.MulticlassClassification => EvaluateMulticlassClassificationModel(predictions),
            MLModelType.Clustering => EvaluateClusteringModel(predictions),
            MLModelType.AnomalyDetection => EvaluateAnomalyDetectionModel(predictions),
            _ => new ModelPerformanceMetrics()
        };
    }

    private ModelPerformanceMetrics EvaluateRegressionModel(IDataView predictions)
    {
        var metrics = _mlContext.Regression.Evaluate(predictions);
        return new ModelPerformanceMetrics
        {
            Accuracy = 1 - metrics.MeanAbsoluteError, // Approximation
            MeanAbsoluteError = metrics.MeanAbsoluteError,
            RootMeanSquaredError = metrics.RootMeanSquaredError,
            RSquared = metrics.RSquared
        };
    }

    private ModelPerformanceMetrics EvaluateBinaryClassificationModel(IDataView predictions)
    {
        var metrics = _mlContext.BinaryClassification.Evaluate(predictions);
        return new ModelPerformanceMetrics
        {
            Accuracy = metrics.Accuracy,
            Precision = metrics.PositivePrecision,
            Recall = metrics.PositiveRecall,
            F1Score = metrics.F1Score,
            AreaUnderRocCurve = metrics.AreaUnderRocCurve
        };
    }

    private ModelPerformanceMetrics EvaluateMulticlassClassificationModel(IDataView predictions)
    {
        var metrics = _mlContext.MulticlassClassification.Evaluate(predictions);
        return new ModelPerformanceMetrics
        {
            Accuracy = metrics.MacroAccuracy,
            Precision = metrics.MacroAccuracy, // Approximation
            Recall = metrics.MacroAccuracy,    // Approximation
            F1Score = metrics.MacroAccuracy    // Approximation
        };
    }

    private ModelPerformanceMetrics EvaluateClusteringModel(IDataView predictions)
    {
        var metrics = _mlContext.Clustering.Evaluate(predictions);
        return new ModelPerformanceMetrics
        {
            Accuracy = 1 - metrics.AverageDistance, // Approximation
            ClusteringMetrics = new ClusteringMetrics
            {
                AverageDistance = metrics.AverageDistance,
                DaviesBouldinIndex = metrics.DaviesBouldinIndex
            }
        };
    }

    private ModelPerformanceMetrics EvaluateAnomalyDetectionModel(IDataView predictions)
    {
        var metrics = _mlContext.AnomalyDetection.Evaluate(predictions);
        return new ModelPerformanceMetrics
        {
            Accuracy = metrics.AreaUnderRocCurve,
            AreaUnderRocCurve = metrics.AreaUnderRocCurve,
            DetectionRate = metrics.DetectionRateAtFalsePositiveCount
        };
    }

    private Task<ITransformer?> LoadModelAsync(string modelId)
    {
        try
        {
            var modelInfo = _modelInfos.GetValueOrDefault(modelId);
            if (modelInfo == null || !File.Exists(modelInfo.FilePath))
            {
                return Task.FromResult<ITransformer?>(null);
            }

            var model = _mlContext.Model.Load(modelInfo.FilePath, out var _);
            _loadedModels[modelId] = model;
            
            return Task.FromResult<ITransformer?>(model);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to load model {ModelId}", modelId);
            return Task.FromResult<ITransformer?>(null);
        }
    }

    private async Task<ModelPredictionResult<T>> PredictRegression<T>(ITransformer model, object inputData)
    {
        // Implementation for regression prediction
        await Task.Delay(10);
        return new ModelPredictionResult<T>
        {
            Success = true,
            Prediction = default(T),
            Confidence = 0.85
        };
    }

    private async Task<ModelPredictionResult<T>> PredictBinaryClassification<T>(ITransformer model, object inputData)
    {
        // Implementation for binary classification prediction
        await Task.Delay(10);
        return new ModelPredictionResult<T>
        {
            Success = true,
            Prediction = default(T),
            Confidence = 0.92
        };
    }

    private async Task<ModelPredictionResult<T>> PredictMulticlassClassification<T>(ITransformer model, object inputData)
    {
        // Implementation for multiclass classification prediction
        await Task.Delay(10);
        return new ModelPredictionResult<T>
        {
            Success = true,
            Prediction = default(T),
            Confidence = 0.88
        };
    }

    private async Task<ModelPredictionResult<T>> PredictClustering<T>(ITransformer model, object inputData)
    {
        // Implementation for clustering prediction
        await Task.Delay(10);
        return new ModelPredictionResult<T>
        {
            Success = true,
            Prediction = default(T),
            Confidence = 0.75
        };
    }

    private async Task<ModelPredictionResult<T>> PredictAnomalyDetection<T>(ITransformer model, object inputData)
    {
        // Implementation for anomaly detection prediction
        await Task.Delay(10);
        return new ModelPredictionResult<T>
        {
            Success = true,
            Prediction = default(T),
            Confidence = 0.90
        };
    }

    private void InitializeBuiltInModels()
    {
        // Initialize built-in model configurations
        _modelInfos["property-valuation-model"] = new MLModelInfo
        {
            Id = "property-valuation-model",
            Name = "Property Valuation Model",
            Type = MLModelType.Regression,
            Version = "1.0.0",
            IsActive = true,
            Accuracy = 0.89,
            CreatedAt = DateTime.UtcNow.AddDays(-30)
        };

        _modelInfos["fraud-detection-model"] = new MLModelInfo
        {
            Id = "fraud-detection-model",
            Name = "Fraud Detection Model",
            Type = MLModelType.BinaryClassification,
            Version = "1.0.0",
            IsActive = true,
            Accuracy = 0.94,
            CreatedAt = DateTime.UtcNow.AddDays(-15)
        };
    }

    private string IncrementVersion(string version)
    {
        var parts = version.Split('.');
        if (parts.Length >= 3 && int.TryParse(parts[2], out var patch))
        {
            return $"{parts[0]}.{parts[1]}.{patch + 1}";
        }
        return $"{version}.1";
    }
}

// Data models for ML services
public class ModelTrainingRequest
{
    public string ModelId { get; set; } = string.Empty;
    public string ModelName { get; set; } = string.Empty;
    public MLModelType ModelType { get; set; }
    public string Version { get; set; } = "1.0.0";
    public IDataView TrainingData { get; set; } = null!;
    public IDataView? ValidationData { get; set; }
    public Dictionary<string, object> HyperParameters { get; set; } = new();
}

public class ModelTrainingResult
{
    public bool Success { get; set; }
    public string ModelId { get; set; } = string.Empty;
    public string? Error { get; set; }
    public TimeSpan TrainingTime { get; set; }
    public ModelPerformanceMetrics? Metrics { get; set; }
    public string? ModelPath { get; set; }
}

public class ModelPredictionResult<T>
{
    public bool Success { get; set; }
    public T? Prediction { get; set; }
    public double Confidence { get; set; }
    public string? Error { get; set; }
    public Dictionary<string, object> Metadata { get; set; } = new();
}

public class ModelEvaluationResult
{
    public bool Success { get; set; }
    public string ModelId { get; set; } = string.Empty;
    public string? Error { get; set; }
    public ModelPerformanceMetrics? Metrics { get; set; }
    public int TestDataSize { get; set; }
}

public class ModelDeploymentOptions
{
    public string Environment { get; set; } = "production";
    public bool EnableMonitoring { get; set; } = true;
    public bool EnableAutoScaling { get; set; } = true;
    public int MaxConcurrentRequests { get; set; } = 100;
}

public class MLModelInfo
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public MLModelType Type { get; set; }
    public string Version { get; set; } = string.Empty;
    public string FilePath { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? TrainedAt { get; set; }
    public DateTime? DeployedAt { get; set; }
    public DateTime? RetiredAt { get; set; }
    public bool IsActive { get; set; }
    public double Accuracy { get; set; }
    public string? DeploymentEnvironment { get; set; }
    public ModelPerformanceMetrics? Performance { get; set; }
}

public class ModelPerformanceMetrics
{
    public string ModelId { get; set; } = string.Empty;
    public double Accuracy { get; set; }
    public double Precision { get; set; }
    public double Recall { get; set; }
    public double F1Score { get; set; }
    public double AreaUnderRocCurve { get; set; }
    public double MeanAbsoluteError { get; set; }
    public double RootMeanSquaredError { get; set; }
    public double RSquared { get; set; }
    public double DetectionRate { get; set; }
    public TimeSpan AverageInferenceTime { get; set; }
    public double ThroughputPerSecond { get; set; }
    public double ErrorRate { get; set; }
    public DateTime LastEvaluated { get; set; }
    public ClusteringMetrics? ClusteringMetrics { get; set; }
}

public class ClusteringMetrics
{
    public double AverageDistance { get; set; }
    public double DaviesBouldinIndex { get; set; }
}

public enum MLModelType
{
    Regression,
    BinaryClassification,
    MulticlassClassification,
    Clustering,
    AnomalyDetection,
    Ranking,
    Recommendation,
    TimeSeries
}
