namespace TerraFusion.Core.DTOs;

public class PropertyValuationInputDto
{
    public int PropertyId { get; set; }
    public string Address { get; set; } = string.Empty;
    public string ParcelNumber { get; set; } = string.Empty;
    public string BuildingType { get; set; } = string.Empty;
    public decimal SquareFootage { get; set; }
    public string PropertyType { get; set; } = string.Empty;
    public int? YearBuilt { get; set; }
    public decimal LotSize { get; set; }
    public string Region { get; set; } = string.Empty;
}

public class ValuationResultDto
{
    public int PropertyId { get; set; }
    public string ParcelNumber { get; set; } = string.Empty;
    public decimal EstimatedValue { get; set; }
    public decimal ConfidenceScore { get; set; }
    public decimal Confidence { get; set; }
    public decimal BaseValue { get; set; }
    public decimal AdjustedValue { get; set; }
    public decimal MarketAdjustment { get; set; }
    public string ValuationMethod { get; set; } = string.Empty;
    public DateTime ValuationDate { get; set; }
    public DateTime CalculatedAt { get; set; }
    public List<string> Factors { get; set; } = new();
}

public class ModelTrainingConfigDto
{
    public int ModelId { get; set; }
    public string ModelName { get; set; } = string.Empty;
    public string ModelType { get; set; } = string.Empty;
    public Dictionary<string, object> Parameters { get; set; } = new();
    public int TrainingEpochs { get; set; }
    public int Epochs { get; set; }
    public int BatchSize { get; set; }
    public int TrainingDataSize { get; set; }
    public decimal LearningRate { get; set; }
}

public class ModelTrainingStatusDto
{
    public int ModelId { get; set; }
    public string ModelName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public decimal Progress { get; set; }
    public int CurrentEpoch { get; set; }
    public decimal CurrentLoss { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime StartedAt { get; set; }
    public DateTime? EndTime { get; set; }
    public DateTime? EstimatedCompletionTime { get; set; }
    public int TrainingDataSize { get; set; }
    public int Epochs { get; set; }
    public int BatchSize { get; set; }
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

// Missing DTO properties for ForecastResult and RevenueDataPoint
public class ForecastResultExtensions
{
    public decimal Confidence { get; set; }
    public decimal ModelAccuracy { get; set; }
    public DateTime Timestamp { get; set; }
}

public class RevenueDataPointExtensions
{
    public decimal Revenue { get; set; }
    public string Source { get; set; } = string.Empty;
    public DateTime Date { get; set; }
}

public class EnsembleForecastResultExtensions
{
    public double WeightedPrediction { get; set; }
    public double[] ConfidenceInterval { get; set; } = Array.Empty<double>();
    public double Accuracy { get; set; }
}

// Championship-level AI Orchestration DTOs
public class TaskRequest
{
    public string TaskId { get; set; } = string.Empty;
    public string TaskType { get; set; } = string.Empty;
    public string Priority { get; set; } = string.Empty;
    public Dictionary<string, object> Parameters { get; set; } = new();
    public DateTime RequestedAt { get; set; } = DateTime.UtcNow;
}

public class TaskDistributionResult
{
    public string TaskId { get; set; } = string.Empty;
    public string AssignedAgentId { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime AssignedAt { get; set; } = DateTime.UtcNow;
    public decimal EstimatedCompletionTime { get; set; }
}

public class OptimizationConfig
{
    public string Strategy { get; set; } = string.Empty;
    public Dictionary<string, object> Parameters { get; set; } = new();
    public decimal TargetImprovement { get; set; }
    public bool EnableQuantumOptimization { get; set; }
}

public class LoadBalancingMetrics
{
    public decimal AverageAgentUtilization { get; set; }
    public int TotalActiveAgents { get; set; }
    public decimal RequestsPerSecond { get; set; }
    public Dictionary<string, decimal> AgentWorkloads { get; set; } = new();
    public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
}

public class SwarmOptimizationReport
{
    public string ReportId { get; set; } = string.Empty;
    public decimal ImprovementAchieved { get; set; }
    public Dictionary<string, decimal> MetricsImprovement { get; set; } = new();
    public List<string> OptimizationsApplied { get; set; } = new();
    public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
}

public class AgentCoordinationStatus
{
    public int TotalAgents { get; set; }
    public int CoordinatedAgents { get; set; }
    public decimal CoordinationEfficiency { get; set; }
    public decimal AverageResponseTime { get; set; }
    public List<string> ActiveCoordinationPatterns { get; set; } = new();
    public DateTime LastUpdate { get; set; } = DateTime.UtcNow;
}

public class SwarmIntelligenceMetric
{
    public string MetricName { get; set; } = string.Empty;
    public decimal Value { get; set; }
    public string Unit { get; set; } = string.Empty;
    public List<decimal> TrendData { get; set; } = new();
    public DateTime RecordedAt { get; set; } = DateTime.UtcNow;
}

// AgentPerformance already exists in AISuperiorityDTOs.cs

/// <summary>
/// AI orchestration status with championship performance metrics
/// </summary>
public class OrchestrationStatus
{
    public string Status { get; set; } = "OPERATIONAL";
    public int ActiveAgents { get; set; }
    public double PerformanceScore { get; set; }
    public double CoordinationLatency { get; set; }
    public string GovernmentCompliance { get; set; } = "FISMA_HIGH";
    public DateTime LastUpdate { get; set; } = DateTime.UtcNow;
    public Dictionary<string, object> Metrics { get; set; } = new();
}

// AISuperiorityController missing DTOs
public class AISwarmStatus
{
    public int TotalAgents { get; set; }
    public int ActiveAgents { get; set; }
    public int IdleAgents { get; set; }
    public decimal SwarmEfficiency { get; set; }
    public decimal CoordinationScore { get; set; }
    public decimal PowerProjection { get; set; }
    public List<string> ActiveMissions { get; set; } = new();
    public Dictionary<string, decimal> CapabilityMetrics { get; set; } = new();
    public DateTime LastUpdate { get; set; } = DateTime.UtcNow;
    
    // Additional properties for AISuperiorityController compatibility
    public int DeployedSwarms { get; set; }
    public decimal AverageResponseTime { get; set; }
    public long TotalProcessedRequests { get; set; }
    public bool QuantumOptimizationEnabled { get; set; }
    public string ConsciousnessLevel { get; set; } = "CHAMPIONSHIP";
    public decimal OperationalReadiness { get; set; }
    public string ThreatLevel { get; set; } = "MINIMAL";
    public decimal SupremacyScore { get; set; }
    
    // Controller-specific properties
    public int ActiveSwarms { get; set; }
    public bool QuantumOptimized { get; set; }
    public decimal PerformanceRating { get; set; }
    public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
}

public class DemonstrationScenario
{
    public string ScenarioId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Difficulty { get; set; } = string.Empty;
    public int EstimatedDuration { get; set; }
    public List<string> RequiredCapabilities { get; set; } = new();
    public Dictionary<string, object> Parameters { get; set; } = new();
    public decimal SuccessRate { get; set; }
    
    // Additional properties for AISuperiorityController compatibility
    public int RecordCount { get; set; }
    public string ComplexityLevel { get; set; } = string.Empty;
    public decimal ExpectedSuperiority { get; set; }
}

public class BattalionStatus
{
    public string BattalionId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public int TotalAgents { get; set; }
    public int DeployedAgents { get; set; }
    public decimal ReadinessLevel { get; set; }
    public decimal CombatEffectiveness { get; set; }
    public List<string> CurrentMissions { get; set; } = new();
    public Dictionary<string, decimal> CapabilityScores { get; set; } = new();
    public DateTime LastUpdate { get; set; } = DateTime.UtcNow;
    
    // Additional properties for AISuperiorityController compatibility
    public int AgentCount { get; set; }
    public string Specialization { get; set; } = string.Empty;
    public decimal PerformanceRating { get; set; }
    public string DeploymentStatus { get; set; } = string.Empty;
    public bool QuantumEnhanced { get; set; }
    public string ConsciousnessLevel { get; set; } = string.Empty;
    public DateTime LastActivity { get; set; } = DateTime.UtcNow;
}

public class CompetitiveAdvantages
{
    public decimal TechnologicalSuperiority { get; set; }
    public decimal OperationalExcellence { get; set; }
    public decimal StrategicDominance { get; set; }
    public decimal InnovationCapability { get; set; }
    public decimal AdaptabilityScore { get; set; }
    public List<string> KeyAdvantages { get; set; } = new();
    public Dictionary<string, decimal> CompetitiveMetrics { get; set; } = new();
    public DateTime AssessmentDate { get; set; } = DateTime.UtcNow;
    
    // Additional properties for AISuperiorityController compatibility
    public decimal ResponseTimeAdvantage { get; set; }
    public decimal ThroughputAdvantage { get; set; }
    public decimal AccuracyAdvantage { get; set; }
    public decimal ReliabilityAdvantage { get; set; }
    public decimal EfficiencyAdvantage { get; set; }
}


