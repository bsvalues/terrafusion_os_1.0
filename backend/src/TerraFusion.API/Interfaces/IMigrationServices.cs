/**
 * ═══════════════════════════════════════════════════════════════
 * TERRAFUSION OS - MIGRATION SERVICE INTERFACES
 * County Migration, Data Migration, and Workflow Transition Interfaces
 * THE TERRAFUSION WAY - GOVERNMENT. TRANSCENDED.
 * ═══════════════════════════════════════════════════════════════
 */

using TerraFusion.API.Models;

namespace TerraFusion.API.Interfaces;

/// <summary>
/// County Migration Pathways Interface
/// Orchestrates multi-county migration with championship-level excellence
/// </summary>
public interface ICountyMigrationPathways
{
    Task<MigrationPathwayResult> AnalyzeMigrationPathwayAsync(string countyCode);
    Task<MigrationPlanResult> GenerateMigrationPlanAsync(string countyCode);
    Task<MigrationExecutionResult> ExecuteMigrationAsync(string countyCode);
    Task<MigrationStatusResult> GetMigrationStatusAsync(string countyCode);
    Task<object> RollbackMigrationAsync(string countyCode, object phase);
    Task<object> AssessCountyMigrationReadinessAsync(string countyCode, object request);
    Task<object> InitializeCountyMigrationAsync(string countyCode, object request);
    Task<object> ExecuteMigrationPhaseAsync(string countyCode, object phase);
}

/// <summary>
/// Data Migration Engine Interface
/// Handles county data migration with sovereign data isolation
/// </summary>
public interface IDataMigrationEngine
{
    Task<DataMigrationResult> MigrateCountyDataAsync(string countyCode);
    Task<DataValidationResult> ValidateDataIntegrityAsync(string countyCode);
    Task<DataTransformationResult> TransformLegacyDataAsync(string countyCode);
    Task<object> ExecuteDataMigrationPhaseAsync(string migrationId, object phase, object request);
    Task<DataRollbackResult> RollbackDataMigrationAsync(string migrationId, object phase);
    Task<object> InitializeMigrationAsync(string migrationId, string countyCode, object request);
    Task<object> InitializeTransformationAsync(string migrationId);
    Task<object> InitializeValidationAsync(string migrationId);
    Task<object> ValidatePostRollbackIntegrityAsync(string migrationId);
}

/// <summary>
/// Workflow Transition Guide Interface
/// Guides workflow transitions during county migrations
/// </summary>
public interface IWorkflowTransitionGuide
{
    Task<WorkflowAnalysisResult> AnalyzeCurrentWorkflowsAsync(string countyCode);
    Task<WorkflowMappingResult> MapWorkflowsToTerraFusionAsync(string countyCode);
    Task<WorkflowTransitionResult> ExecuteWorkflowTransitionAsync(string countyCode);
    Task<object> ExecuteWorkflowTransitionPhaseAsync(string migrationId, object phase, object request);
    Task<WorkflowRollbackResult> RollbackWorkflowTransitionAsync(string migrationId, object phase);
    Task<object> InitializeTransitionGuideAsync(string migrationId, string countyCode, object request);
}

/// <summary>
/// Training System Interface
/// Provides training and change management for county staff
/// </summary>
public interface ITrainingSystem
{
    Task<TrainingPlanResult> GenerateTrainingPlanAsync(string countyCode);
    Task<TrainingMaterialResult> CreateTrainingMaterialsAsync(string countyCode);
    Task<TrainingProgressResult> TrackTrainingProgressAsync(string countyCode);
    Task<object> ExecuteTrainingPhaseAsync(string migrationId, object phase, object request);
    Task<object> InitializeTrainingForMigrationAsync(string migrationId, string countyCode, object request);
}

/// <summary>
/// Gradual Feature Migration Interface
/// Manages gradual rollout of TerraFusion features
/// </summary>
public interface IGradualFeatureMigration
{
    Task<FeatureMigrationPlanResult> CreateFeatureMigrationPlanAsync(string countyCode);
    Task<FeatureActivationResult> ActivateFeatureAsync(string countyCode, string featureName);
    Task<FeatureStatusResult> GetFeatureMigrationStatusAsync(string countyCode);
    Task<object> ExecuteFeatureMigrationPhaseAsync(string migrationId, object phase, object request);
    Task<FeatureRollbackResult> RollbackFeatureMigrationAsync(string migrationId, object phase);
    Task<object> InitializeFeatureMigrationAsync(string migrationId, string countyCode, object request);
}

/// <summary>
/// Elite Performance Monitoring Interface
/// Monitors migration performance with championship standards
/// </summary>
public interface IElitePerformanceMonitoring
{
    Task<MigrationPerformanceResult> GetMigrationPerformanceAsync(string countyCode);
    Task<PerformanceOptimizationResult> OptimizeMigrationPerformanceAsync(string countyCode);
    Task<object> StartActivity(string activityName, string countyCode);
    Task<object> RegisterEnhancementSessionAsync(string sessionId, string countyCode);
    Task<object> TrackEnhancementPerformanceAsync(string sessionId, object metrics);
    Task<object> TrackReportGenerationAsync(string reportId, object performance);
    Task<object> RegisterMigrationSessionAsync(string sessionId, string countyCode);
}

/// <summary>
/// Workflow Mapping Service Interface
/// Maps legacy workflows to TerraFusion workflows
/// </summary>
public interface IWorkflowMappingService
{
    Task<WorkflowMappingResult> MapWorkflowsAsync(string countyCode);
    Task<WorkflowCompatibilityResult> AssessWorkflowCompatibilityAsync(string countyCode);
    Task<object> CreateWorkflowMappingAsync(string countyCode, object workflowAnalysis);
}

/// <summary>
/// User Training Service Interface
/// Manages user training programs
/// </summary>
public interface IUserTrainingService
{
    Task<TrainingSessionResult> CreateTrainingSessionAsync(string countyCode);
    Task<TrainingProgressResult> GetTrainingProgressAsync(string countyCode);
    Task<object> PrepareWorkflowTrainingMaterialsAsync(string countyCode, object transitionPlans);
}

/// <summary>
/// Change Management Service Interface
/// Handles organizational change management
/// </summary>
public interface IChangeManagementService
{
    Task<ChangeManagementPlanResult> CreateChangeManagementPlanAsync(string countyCode);
    Task<ChangeReadinessResult> AssessChangeReadinessAsync(string countyCode);
}

/// <summary>
/// Workflow Validation Service Interface
/// Validates workflow configurations
/// </summary>
public interface IWorkflowValidationService
{
    Task<WorkflowValidationResult> ValidateWorkflowsAsync(string countyCode);
    Task<WorkflowErrorResult> GetWorkflowErrorsAsync(string countyCode);
}

/// <summary>
/// Data Integrity Validator Interface
/// Validates data integrity during migrations
/// </summary>
public interface IDataIntegrityValidator
{
    Task InitializeValidationAsync(string migrationId, object sourceAnalysis);
    Task<DataIntegrityResult> ValidateDataIntegrityAsync(string countyCode);
    Task<DataQualityResult> AssessDataQualityAsync(string countyCode);
    Task<object> ValidatePostRollbackIntegrityAsync(string migrationId);
}

/// <summary>
/// Data Transformation Service Interface
/// Transforms data between formats
/// </summary>
public interface IDataTransformationService
{
    Task InitializeTransformationAsync(string migrationId, object migrationMapping);
    Task<DataTransformationResult> TransformDataAsync(string countyCode);
    Task<TransformationValidationResult> ValidateTransformationAsync(string countyCode);
}

// Result type placeholders (will be defined in Models)
public class MigrationPathwayResult
{
    public string RecommendedStrategy { get; set; } = string.Empty;
    public int EstimatedDurationDays { get; set; }
    public bool Success { get; set; }
    public string CountyCode { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public TimeSpan EstimatedDuration { get; set; }
    public string RiskLevel { get; set; } = string.Empty;
}
public class MigrationPlanResult
{
    public bool Success { get; set; }
    public string CountyCode { get; set; } = string.Empty;
    public string PlanId { get; set; } = string.Empty;
    public List<object> Phases { get; set; } = new();
    public string Message { get; set; } = string.Empty;
}
public class MigrationExecutionResult
{
    public bool Success { get; set; }
    public string CountyCode { get; set; } = string.Empty;
    public string MigrationId { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
}
public class MigrationStatusResult
{
    public string Status { get; set; } = string.Empty;
    public string CountyCode { get; set; } = string.Empty;
    public decimal ProgressPercentage { get; set; }
    public string Message { get; set; } = string.Empty;
}
public class DataMigrationResult { public bool Success { get; set; } public string CountyCode { get; set; } = string.Empty; public int RecordsMigrated { get; set; } public string Message { get; set; } = string.Empty; }
public class DataValidationResult { public bool IsValid { get; set; } public string CountyCode { get; set; } = string.Empty; public int ValidationsPassed { get; set; } public int ValidationsFailed { get; set; } public string Message { get; set; } = string.Empty; }
public class DataTransformationResult { public bool Success { get; set; } public string CountyCode { get; set; } = string.Empty; public int RecordsTransformed { get; set; } public string Message { get; set; } = string.Empty; }
public class WorkflowAnalysisResult { public bool Success { get; set; } }
public class WorkflowMappingResult { public bool Success { get; set; } }
public class WorkflowTransitionResult { public bool Success { get; set; } }
public class TrainingPlanResult { public bool Success { get; set; } }
public class TrainingMaterialResult { public bool Success { get; set; } }
public class TrainingProgressResult { public bool Success { get; set; } }
public class FeatureMigrationPlanResult { public bool Success { get; set; } }
public class FeatureActivationResult { public bool Success { get; set; } }
public class FeatureStatusResult { public string Status { get; set; } = string.Empty; }
public class MigrationPerformanceResult { public bool Success { get; set; } }
public class PerformanceOptimizationResult { public bool Success { get; set; } }
public class WorkflowCompatibilityResult { public bool Compatible { get; set; } }
public class TrainingSessionResult { public bool Success { get; set; } }
public class ChangeManagementPlanResult { public bool Success { get; set; } }
public class ChangeReadinessResult { public bool Ready { get; set; } }
public class WorkflowValidationResult { public bool Valid { get; set; } }
public class WorkflowErrorResult { public List<string> Errors { get; set; } = new(); }
public class DataIntegrityResult { public bool Valid { get; set; } }
public class DataQualityResult { public decimal QualityScore { get; set; } }
public class TransformationValidationResult { public bool Valid { get; set; } }

