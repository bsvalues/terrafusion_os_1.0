using System;
using System.Collections.Generic;

namespace TerraFusion.CostForge.Models
{
    /// <summary>
    /// Property Assessment Request Model for Quantum Enhancement Processing
    /// </summary>
    public class PropertyAssessmentRequest
    {
        public string PropertyId { get; set; } = "";
        public string CountyCode { get; set; } = "";
        public string ParcelNumber { get; set; } = "";
        public decimal CurrentAssessedValue { get; set; }
        public PropertyType PropertyType { get; set; }
        public Dictionary<string, object> PropertyCharacteristics { get; set; } = new();
        public List<ComparableProperty> Comparables { get; set; } = new();
        public QuantumOptimizationLevel OptimizationLevel { get; set; }
        public bool RequireIAAOCompliance { get; set; } = true;
        public DateTime RequestTimestamp { get; set; } = DateTime.UtcNow;
    }

    /// <summary>
    /// Quantum Enhancement Result for Property Assessment
    /// </summary>
    public class QuantumEnhancementResult
    {
        public string PropertyId { get; set; } = "";
        public decimal EnhancedAssessedValue { get; set; }
        public double ConfidenceScore { get; set; }
        public double AccuracyImprovement { get; set; }
        public List<QuantumFactor> AppliedQuantumFactors { get; set; } = new();
        public PerformanceMetrics Performance { get; set; } = new();
        public bool IAAOCompliant { get; set; }
        public DateTime ProcessingTimestamp { get; set; } = DateTime.UtcNow;
    }

    /// <summary>
    /// Property Assessment Task for Swarm Intelligence Coordination
    /// </summary>
    public class PropertyAssessmentTask
    {
        public string TaskId { get; set; } = Guid.NewGuid().ToString();
        public List<PropertyAssessmentRequest> Properties { get; set; } = new();
        public TaskPriority Priority { get; set; }
        public DateTime Deadline { get; set; }
        public string CountyCode { get; set; } = "";
        public TaskComplexity Complexity { get; set; }
        public bool RequireQuantumEnhancement { get; set; } = true;
    }

    /// <summary>
    /// Swarm Coordination Options for Elite Performance
    /// </summary>
    public class SwarmCoordinationOptions
    {
        public int MaxAgentsToAllocate { get; set; } = 1000;
        public TimeSpan MaxProcessingTime { get; set; } = TimeSpan.FromMinutes(5);
        public double MinAccuracyTarget { get; set; } = 0.999;
        public bool EnableQuantumOptimization { get; set; } = true;
        public bool EnableConsciousnessEnhancement { get; set; } = true;
        public CoordinationStrategy Strategy { get; set; } = CoordinationStrategy.Elite;
    }

    /// <summary>
    /// Swarm Coordination Result
    /// </summary>
    public class SwarmCoordinationResult
    {
        public string TaskId { get; set; } = "";
        public int AgentsUtilized { get; set; }
        public TimeSpan ActualProcessingTime { get; set; }
        public double AchievedAccuracy { get; set; }
        public List<PropertyAssessmentResult> Results { get; set; } = new();
        public SwarmPerformanceMetrics PerformanceMetrics { get; set; } = new();
        public bool TargetsMet { get; set; }
    }

    /// <summary>
    /// Swarm Performance Data for Optimization
    /// </summary>
    public class SwarmPerformanceData
    {
        public string SessionId { get; set; } = "";
        public List<AgentPerformanceMetric> AgentMetrics { get; set; } = new();
        public double OverallThroughput { get; set; }
        public double AverageAccuracy { get; set; }
        public TimeSpan AverageResponseTime { get; set; }
        public int TotalTasksCompleted { get; set; }
        public DateTime DataCollectionPeriod { get; set; }
    }

    /// <summary>
    /// Swarm Optimization Result
    /// </summary>
    public class SwarmOptimizationResult
    {
        public double PerformanceImprovement { get; set; }
        public List<OptimizationRecommendation> Recommendations { get; set; } = new();
        public SwarmConfiguration OptimalConfiguration { get; set; } = new();
        public double PredictedAccuracyGain { get; set; }
        public TimeSpan ExpectedSpeedImprovement { get; set; }
    }

    /// <summary>
    /// Agent Team for Coordinated Tasks
    /// </summary>
    public class AgentTeam
    {
        public string TeamId { get; set; } = Guid.NewGuid().ToString();
        public List<string> AgentIds { get; set; } = new();
        public AgentSpecialization Specialization { get; set; }
        public TeamLeadershipModel Leadership { get; set; }
        public int MaxConcurrentTasks { get; set; } = 10;
        public double TeamEfficiency { get; set; }
    }

    /// <summary>
    /// Agent Team Coordination Result
    /// </summary>
    public class AgentTeamCoordinationResult
    {
        public string CoordinationId { get; set; } = Guid.NewGuid().ToString();
        public List<TeamPerformanceMetric> TeamMetrics { get; set; } = new();
        public double OverallCoordinationEfficiency { get; set; }
        public int TasksCompleted { get; set; }
        public TimeSpan CoordinationDuration { get; set; }
        public bool CoordinationSuccessful { get; set; }
    }

    #region Supporting Data Models

    public class ComparableProperty
    {
        public string PropertyId { get; set; } = "";
        public decimal SalePrice { get; set; }
        public DateTime SaleDate { get; set; }
        public double SimilarityScore { get; set; }
        public Dictionary<string, object> Characteristics { get; set; } = new();
    }

    public class QuantumFactor
    {
        public string FactorName { get; set; } = "";
        public double Weight { get; set; }
        public double Contribution { get; set; }
        public string Description { get; set; } = "";
    }

    public class PerformanceMetrics
    {
        public TimeSpan ProcessingTime { get; set; }
        public double CPUUtilization { get; set; }
        public double MemoryUsage { get; set; }
        public int QuantumOperationsPerformed { get; set; }
    }

    public class PropertyAssessmentResult
    {
        public string PropertyId { get; set; } = "";
        public decimal AssessedValue { get; set; }
        public double ConfidenceScore { get; set; }
        public bool IAAOCompliant { get; set; }
        public DateTime AssessmentTimestamp { get; set; }
    }

    public class AgentPerformanceMetric
    {
        public string AgentId { get; set; } = "";
        public double Throughput { get; set; }
        public double Accuracy { get; set; }
        public TimeSpan AverageResponseTime { get; set; }
        public int TasksCompleted { get; set; }
    }

    public class OptimizationRecommendation
    {
        public string Category { get; set; } = "";
        public string Description { get; set; } = "";
        public double ExpectedImpact { get; set; }
        public int Priority { get; set; }
    }

    public class SwarmConfiguration
    {
        public int OptimalAgentCount { get; set; }
        public Dictionary<string, object> Parameters { get; set; } = new();
        public CoordinationStrategy RecommendedStrategy { get; set; }
    }

    public class TeamPerformanceMetric
    {
        public string TeamId { get; set; } = "";
        public double TeamEfficiency { get; set; }
        public int TasksCompleted { get; set; }
        public TimeSpan AverageTaskTime { get; set; }
    }

    #endregion

    #region Enumerations

    public enum PropertyType
    {
        Residential,
        Commercial,
        Industrial,
        Agricultural,
        MixedUse
    }

    public enum QuantumOptimizationLevel
    {
        Standard,
        Enhanced,
        Elite,
        Championship
    }

    public enum TaskPriority
    {
        Low = 1,
        Medium = 2,
        High = 3,
        Critical = 4,
        Emergency = 5
    }

    public enum TaskComplexity
    {
        Simple,
        Moderate,
        Complex,
        HighlyComplex,
        ExtremelyComplex
    }

    public enum CoordinationStrategy
    {
        Basic,
        Optimized,
        Elite,
        Championship
    }

    public enum AgentSpecialization
    {
        PropertyValuation,
        MarketAnalysis,
        ComplianceValidation,
        QuantumOptimization,
        DataProcessing
    }

    public enum TeamLeadershipModel
    {
        Hierarchical,
        Collaborative,
        Autonomous,
        QuantumCoordinated
    }

    #endregion
}
