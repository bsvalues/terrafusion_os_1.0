using TerraFusion.Core.DTOs;

namespace TerraFusion.Core.Services;

public interface IAIEngineService
{
    Task<AIEngineStatusDto> GetEngineStatusAsync();
    Task<AIModelTrainingResultDto> TrainModelAsync(AIModelTrainingRequestDto request);
    Task<PredictionResultDto> RunInferenceAsync(AIInferenceRequestDto request);
    Task<IEnumerable<AIModelDto>> GetAvailableModelsAsync();
    Task<AIModelDto> GetModelAsync(Guid modelId);
    Task<bool> DeployModelAsync(Guid modelId);
    Task<bool> UndeployModelAsync(Guid modelId);
    Task<AIEngineMetricsDto> GetEngineMetricsAsync();
    Task<bool> OptimizeModelAsync(Guid modelId, AIModelOptimizationDto options);
    Task<AIModelValidationResultDto> ValidateModelAsync(Guid modelId, AIModelValidationRequestDto request);
    Task<MarketTrendResult> AnalyzeMarketTrendsAsync(MarketTrendRequest request);
}

public class AIEngineStatusDto
{
    public string Status { get; set; } = string.Empty;
    public int ActiveModels { get; set; }
    public int TotalModels { get; set; }
    public double CpuUsage { get; set; }
    public double MemoryUsage { get; set; }
    public double GpuUsage { get; set; }
    public int QueuedJobs { get; set; }
    public int RunningJobs { get; set; }
    public DateTime LastUpdate { get; set; }
    public List<AIEngineComponentDto> Components { get; set; } = new();
}

public class AIEngineComponentDto
{
    public string Name { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public double Usage { get; set; }
    public DateTime LastHealthCheck { get; set; }
}

public class AIModelTrainingRequestDto
{
    public string ModelName { get; set; } = string.Empty;
    public string ModelType { get; set; } = string.Empty;
    public Dictionary<string, object> TrainingParameters { get; set; } = new();
    public string DatasetPath { get; set; } = string.Empty;
    public string ValidationDatasetPath { get; set; } = string.Empty;
    public int MaxEpochs { get; set; } = 100;
    public double LearningRate { get; set; } = 0.001;
    public int BatchSize { get; set; } = 32;
}

public class AIModelTrainingResultDto
{
    public Guid TrainingJobId { get; set; }
    public string Status { get; set; } = string.Empty;
    public double Progress { get; set; }
    public int CurrentEpoch { get; set; }
    public double TrainingLoss { get; set; }
    public double ValidationLoss { get; set; }
    public double Accuracy { get; set; }
    public TimeSpan EstimatedTimeRemaining { get; set; }
    public DateTime StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public Dictionary<string, object> Metrics { get; set; } = new();
}

public class AIInferenceRequestDto
{
    public Guid ModelId { get; set; }
    public Dictionary<string, object> InputData { get; set; } = new();
    public string OutputFormat { get; set; } = "json";
    public bool IncludeConfidence { get; set; } = true;
    public bool IncludeExplanation { get; set; } = false;
}

public class AIEngineMetricsDto
{
    public int TotalInferences { get; set; }
    public int InferencesPerSecond { get; set; }
    public double AverageInferenceTime { get; set; }
    public double AverageAccuracy { get; set; }
    public int ActiveTrainingJobs { get; set; }
    public int CompletedTrainingJobs { get; set; }
    public double SystemLoad { get; set; }
    public DateTime MetricsTimestamp { get; set; }
    public List<AIModelPerformanceDto> ModelPerformance { get; set; } = new();
}

public class AIModelPerformanceDto
{
    public Guid ModelId { get; set; }
    public string ModelName { get; set; } = string.Empty;
    public int InferenceCount { get; set; }
    public double AverageResponseTime { get; set; }
    public double Accuracy { get; set; }
    public double ErrorRate { get; set; }
    public DateTime LastUsed { get; set; }
}

public class AIModelOptimizationDto
{
    public string OptimizationType { get; set; } = string.Empty;
    public Dictionary<string, object> Parameters { get; set; } = new();
    public bool QuantizeWeights { get; set; } = false;
    public bool PruneModel { get; set; } = false;
    public double CompressionRatio { get; set; } = 0.5;
}

public class AIModelValidationRequestDto
{
    public string ValidationDatasetPath { get; set; } = string.Empty;
    public List<string> ValidationMetrics { get; set; } = new();
    public Dictionary<string, object> ValidationParameters { get; set; } = new();
}

public class AIModelValidationResultDto
{
    public Guid ValidationJobId { get; set; }
    public bool IsValid { get; set; }
    public double OverallScore { get; set; }
    public Dictionary<string, double> MetricScores { get; set; } = new();
    public List<string> ValidationErrors { get; set; } = new();
    public List<string> ValidationWarnings { get; set; } = new();
    public DateTime ValidatedAt { get; set; }
    public Dictionary<string, object> DetailedResults { get; set; } = new();
}
