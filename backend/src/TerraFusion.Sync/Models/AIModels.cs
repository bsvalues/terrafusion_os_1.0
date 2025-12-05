using System;
using System.Collections.Generic;

namespace TerraFusion.Sync.Models
{
    public class DetectedSchema
    {
        public DateTime DetectionTimestamp { get; set; }
        public string DatabaseType { get; set; } = "";
        public string DatabaseVersion { get; set; } = "";
        public int TableCount { get; set; }
        public List<string> Tables { get; set; } = new();
        public SystemIdentification SystemIdentification { get; set; } = new();
        public List<string> CriticalTablesFound { get; set; } = new();
        public List<TableRelationship> Relationships { get; set; } = new();
        public double AIConfidenceScore { get; set; }
    }

    public class SystemIdentification
    {
        public string SystemName { get; set; } = "";
        public string SystemVersion { get; set; } = "";
        public double ConfidenceScore { get; set; }
        public int MatchedTables { get; set; }
        public int RequiredTables { get; set; }
    }

    public class SystemSignature
    {
        public string SystemName { get; set; } = "";
        public string Version { get; set; } = "";
        public List<string> CriticalTables { get; set; } = new();
        public List<string> UniqueIdentifiers { get; set; } = new();
        public List<string> RequiredTables { get; set; } = new();
    }

    public class TableRelationship
    {
        public string ForeignKeyName { get; set; } = "";
        public string ParentTable { get; set; } = "";
        public string ParentColumn { get; set; } = "";
        public string ReferencedTable { get; set; } = "";
        public string ReferencedColumn { get; set; } = "";
    }

    public class AITransformationResult
    {
        public Guid TransformationId { get; set; }
        public DateTime Timestamp { get; set; }
        public string SourceSystem { get; set; } = "";
        public Dictionary<string, object> TransformedData { get; set; } = new();
        public List<AIQualityIssue> QualityIssues { get; set; } = new();
        public List<string> AppliedRules { get; set; } = new();
        public double ConfidenceScore { get; set; }
    }

    public class AIQualityIssue
    {
        public string FieldName { get; set; } = "";
        public string IssueType { get; set; } = "";
        public string Description { get; set; } = "";
        public string OriginalValue { get; set; } = "";
        public string Value { get; set; } = "";
        public string Recommendation { get; set; } = "";
        public double SeverityScore { get; set; }
    }

    public class ValidationResult
    {
        public bool IsValid { get; set; }
        public List<string> Issues { get; set; } = new();
        public double ValidationScore { get; set; }
        public List<AIRecommendation> Recommendations { get; set; } = new();
    }

    public class AIRecommendation
    {
        public string Category { get; set; } = "";
        public string Message { get; set; } = "";
        public double Priority { get; set; }
    }

    // Quantum Coordination Models
    public class QuantumSynchronizationMatrix
    {
        public string CountyCode { get; set; } = "";
        public double QuantumCoherence { get; set; }
        public int MaxCapacity { get; set; }
        public int CurrentLoad { get; set; }
        public DateTime LastSync { get; set; }
        public List<string> OptimizationRecommendations { get; set; } = new();
        public bool SyncSuccess { get; set; }
        public bool PropertyAssessmentReady { get; set; }
    }

    public class TerraFusionSyncOptimizationResults
    {
        public DateTime OptimizationTimestamp { get; set; }
        public LegacySystemOptimization LegacySystemOptimization { get; set; } = new();
        public DataFlowOptimization DataFlowOptimization { get; set; } = new();
        public QuantumDataFlowOptimization QuantumDataFlowOptimization { get; set; } = new();
        public MultiSystemOptimization MultiSystemOptimization { get; set; } = new();
        public MultiSystemOptimization MultiSystemSynchronizationOptimization { get; set; } = new();
        public double OverallScore { get; set; }
        public double OverallTerraFusionSyncImprovement { get; set; }
        public double HarrisPACSOptimizationGain { get; set; }
        public double TylerOptimizationGain { get; set; }
        public double AumentumOptimizationGain { get; set; }
        public bool QuantumSyncAccelerationAchieved { get; set; }
        public double PropertyWorkbenchPerformanceBoost { get; set; }
    }

    public class LegacySystemOptimization
    {
        public double PerformanceImprovement { get; set; }
        public int ProcessedSystems { get; set; }
        public List<string> Optimizations { get; set; } = new();
        public double HarrisOptimization { get; set; }
        public double TylerOptimization { get; set; }
        public double AumentumOptimization { get; set; }
    }

    public class DataFlowOptimization
    {
        public double EfficiencyGain { get; set; }
        public double QuantumEnhancementFactor { get; set; }
        public int OptimizedPipelines { get; set; }
    }

    public class MultiSystemOptimization
    {
        public double CoordinationImprovement { get; set; }
        public int ConnectedSystems { get; set; }
        public List<string> IntegrationPatterns { get; set; } = new();
        public double TerraFusionSyncContribution { get; set; }
    }

    public class CountyAccuracyValidation
    {
        public string CountyCode { get; set; } = "";
        public double AccuracyScore { get; set; }
        public int ValidatedRecords { get; set; }
        public List<string> Issues { get; set; } = new();
        public double ValidatedAccuracy { get; set; }
        public bool EliteTargetAchieved { get; set; }
    }

    // Additional classes for quantum coordination
    public class EliteAccuracyValidationResults
    {
        public DateTime ValidationTimestamp { get; set; }
        public List<CountyAccuracyValidation> CountyValidations { get; set; } = new();
        public int CountiesAtEliteTarget { get; set; }
        public int TotalCountiesValidated { get; set; }
        public double EliteTargetAchievementRate { get; set; }
        public double AverageAccuracyAchieved { get; set; }
        public double AccuracyImprovementFromOptimization { get; set; }
        public double QuantumEnhancementContribution { get; set; }
        public double TerraFusionSyncContribution { get; set; }
        public bool PropertyAssessmentExcellenceAchieved { get; set; }
        public bool ChampionshipLevelValidated { get; set; }
    }

    public class QuantumEntanglementResults
    {
        public DateTime EntanglementTimestamp { get; set; }
        public List<string> EntangledCounties { get; set; } = new();
        public double CoherenceLevel { get; set; }
    }

    public class QuantumDataFlowOptimization
    {
        public double AccelerationFactor { get; set; }
        public double EfficiencyGain { get; set; }
        public double QuantumEnhancementFactor { get; set; }
        public int OptimizedPipelines { get; set; }
    }

    public class QuantumEnhancementRecommendations
    {
        public string NextPriorityAction { get; set; } = "";
        public bool PropertyWorkbenchOptimizationReady { get; set; }
    }

    public class EnhancedQuantumCoordinationResults
    {
        public DateTime CoordinationTimestamp { get; set; }
        public List<QuantumSynchronizationMatrix> SyncMatrix { get; set; } = new();
        public double QuantumCoherenceStability { get; set; }
        public double CrossCountyCoordinationEfficiency { get; set; }
        public QuantumEntanglementResults EntanglementResults { get; set; } = new();
        public int CountiesSuccessfullySynchronized { get; set; }
        public int TotalCountiesInSync { get; set; }
        public double GlobalQuantumCoherence { get; set; }
        public double TerraFusionSyncCapacityUtilization { get; set; }
        public bool PropertyAssessmentCoordinationAchieved { get; set; }
        public string[] MultiCountyOptimizationRecommendations { get; set; } = Array.Empty<string>();
    }
}
