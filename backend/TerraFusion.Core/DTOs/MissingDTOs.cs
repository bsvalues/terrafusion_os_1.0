namespace TerraFusion.Core.DTOs;

public class PropertyValuationInputDto
{
    public int PropertyId { get; set; }
    public string Address { get; set; } = string.Empty;
    public decimal SquareFootage { get; set; }
    public string PropertyType { get; set; } = string.Empty;
    public int? YearBuilt { get; set; }
    public decimal LotSize { get; set; }
    public string Region { get; set; } = string.Empty;
}

public class ValuationResultDto
{
    public int PropertyId { get; set; }
    public decimal EstimatedValue { get; set; }
    public decimal ConfidenceScore { get; set; }
    public string ValuationMethod { get; set; } = string.Empty;
    public DateTime ValuationDate { get; set; }
    public List<string> Factors { get; set; } = new();
}

public class ModelTrainingConfigDto
{
    public int ModelId { get; set; }
    public string ModelName { get; set; } = string.Empty;
    public string ModelType { get; set; } = string.Empty;
    public Dictionary<string, object> Parameters { get; set; } = new();
    public int TrainingEpochs { get; set; }
    public decimal LearningRate { get; set; }
}

public class ModelTrainingStatusDto
{
    public int ModelId { get; set; }
    public string Status { get; set; } = string.Empty;
    public decimal Progress { get; set; }
    public int CurrentEpoch { get; set; }
    public decimal CurrentLoss { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime? EndTime { get; set; }
}


public class CostFactorDto
{
    public string Name { get; set; } = string.Empty;
    public decimal Factor { get; set; }
    public string Description { get; set; } = string.Empty;
    public string Region { get; set; } = string.Empty;
    public DateTime EffectiveDate { get; set; }
}

public class SwarmOptimizationResult
{
    public string OptimizationId { get; set; } = string.Empty;
    public decimal ImprovementPercentage { get; set; }
    public Dictionary<string, decimal> Metrics { get; set; } = new();
    public DateTime CompletedAt { get; set; }
}

public class AgentCoordinationMetrics
{
    public int TotalAgents { get; set; }
    public int ActiveAgents { get; set; }
    public decimal CoordinationEfficiency { get; set; }
    public decimal ResponseTime { get; set; }
    public DateTime LastUpdate { get; set; }
}

// AICommandDto moved to IAICommandService.cs to avoid duplication

public class AICommandResultDto
{
    public Guid CommandId { get; set; }
    public bool Success { get; set; }
    public string Result { get; set; } = string.Empty;
    public string ErrorMessage { get; set; } = string.Empty;
    public DateTime ExecutedAt { get; set; }
    public double ExecutionTimeMs { get; set; }
}


