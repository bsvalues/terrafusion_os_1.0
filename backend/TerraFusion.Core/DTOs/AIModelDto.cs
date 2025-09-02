using System.ComponentModel.DataAnnotations;
using TerraFusion.Core.Enums;
using TerraFusion.Abstractions.DTOs;

namespace TerraFusion.Core.DTOs;

public class AIModelDto
{
    public int Id { get; set; }
    
    [Required]
    [StringLength(100)]
    public string Name { get; set; } = string.Empty;
    
    [StringLength(500)]
    public string? Description { get; set; }
    
    [Required]
    public AIModelType Type { get; set; }
    
    [Required]
    public AIModelStatus Status { get; set; }
    
    [StringLength(20)]
    public string? Version { get; set; }
    
    [Range(0, 1)]
    public decimal Accuracy { get; set; }
    
    [Range(0, int.MaxValue)]
    public int TrainingDataSize { get; set; }
    
    [StringLength(500)]
    public string? ModelPath { get; set; }
    
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public DateTime? LastTrainedAt { get; set; }
    public DateTime? LastUsedAt { get; set; }
}

public class AIModelHealthDto
{
    public int ModelId { get; set; }
    public string ModelName { get; set; } = string.Empty;
    public AIModelStatus Status { get; set; }
    public double CpuUsage { get; set; }
    public long MemoryUsage { get; set; }
    public int RequestsPerMinute { get; set; }
    public decimal AverageResponseTime { get; set; }
    public DateTime LastHealthCheck { get; set; }
    public bool IsResponding { get; set; }
    public string? ErrorMessage { get; set; }
}

public class PredictionInputDto
{
    [Required]
    public Dictionary<string, object> Features { get; set; } = new();
    
    [StringLength(50)]
    public string? RequestId { get; set; }
}

public class PredictionResultDto
{
    [StringLength(50)]
    public string? RequestId { get; set; }
    
    [Required]
    public Dictionary<string, object> Predictions { get; set; } = new();
    
    [Range(0, 1)]
    public decimal Confidence { get; set; }
    
    public TimeSpan ProcessingTime { get; set; }
    public DateTime Timestamp { get; set; }
    public Guid ModelId { get; set; }
    public double ProcessingTimeMs { get; set; }
    public Dictionary<string, object> Metadata { get; set; } = new();
    public string ModelName { get; set; } = string.Empty;
    public Dictionary<string, object> InputData { get; set; } = new();
    public string PredictionId { get; set; } = Guid.NewGuid().ToString();
    public Dictionary<string, object> Results { get; set; } = new();
}

public class BatchPredictionResultDto
{
    public IEnumerable<PredictionResultDto> Results { get; set; } = new List<PredictionResultDto>();
    public int TotalProcessed { get; set; }
    public int SuccessCount { get; set; }
    public int ErrorCount { get; set; }
    public TimeSpan TotalProcessingTime { get; set; }
    public string ModelId { get; set; } = string.Empty;
    public int TotalPredictions { get; set; }
    public int SuccessfulPredictions { get; set; }
}

public class TrainingConfigDto
{
    [Required]
    public Dictionary<string, object> Parameters { get; set; } = new();
    
    [StringLength(500)]
    public string? DatasetPath { get; set; }
    
    [Range(1, 10000)]
    public int Epochs { get; set; } = 100;
    
    [Range(0.0001, 1)]
    public decimal LearningRate { get; set; } = 0.001m;
    
    [Range(1, 1000)]
    public int BatchSize { get; set; } = 32;
}

public class TrainingStatusDto
{
    public int ModelId { get; set; }
    public string Status { get; set; } = string.Empty;
    public decimal Progress { get; set; }
    public int CurrentEpoch { get; set; }
    public int TotalEpochs { get; set; }
    public decimal CurrentLoss { get; set; }
    public decimal CurrentAccuracy { get; set; }
    public DateTime StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string? ErrorMessage { get; set; }
}

// Moved to TerraFusion.Abstractions.DTOs
/*
public class CostMatrixDto
{
    public int Id { get; set; }
    
    [Required]
    [StringLength(100)]
    public string Region { get; set; } = string.Empty;
    
    [Required]
    [StringLength(100)]
    public string BuildingType { get; set; } = string.Empty;
    
    [Range(0, double.MaxValue)]
    public decimal CostPerSqFt { get; set; }
    
    [Range(0, 10)]
    public decimal AdjustmentFactor { get; set; }
    
    [StringLength(20)]
    public string? Grade { get; set; }
    
    [StringLength(50)]
    public string? Condition { get; set; }
    
    [Range(1800, 2100)]
    public int? YearBuilt { get; set; }
    
    [Range(0, 1)]
    public decimal? DepreciationRate { get; set; }
    
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public DateTime? EffectiveDate { get; set; }
}

public class UpdateCostMatrixDto
{
    public decimal? CostPerSqFt { get; set; }
    public decimal? AdjustmentFactor { get; set; }
    public string? Grade { get; set; }
    public string? Condition { get; set; }
    public decimal? DepreciationRate { get; set; }
    public DateTime? EffectiveDate { get; set; }
}

public class TrainingDataDto
{
    public IEnumerable<Dictionary<string, object>> Features { get; set; } = new List<Dictionary<string, object>>();
    public IEnumerable<object> Labels { get; set; } = new List<object>();
    public string? DatasetName { get; set; }
    public Dictionary<string, object> Metadata { get; set; } = new();
}

public class CostForgeStatsDto
{
    public int TotalValuations { get; set; }
    public decimal AverageAccuracy { get; set; }
    public TimeSpan AverageProcessingTime { get; set; }
    public int ValuationsToday { get; set; }
    public decimal TotalValueProcessed { get; set; }
    public DateTime LastUpdated { get; set; }
}
*/

public class AICommandStatsDto
{
    public int TotalModels { get; set; }
    public int ActiveModels { get; set; }
    public int TotalPredictions { get; set; }
    public decimal AverageAccuracy { get; set; }
    public TimeSpan AverageResponseTime { get; set; }
    public long TotalMemoryUsage { get; set; }
    public double TotalCpuUsage { get; set; }
    public DateTime LastUpdated { get; set; }
}
