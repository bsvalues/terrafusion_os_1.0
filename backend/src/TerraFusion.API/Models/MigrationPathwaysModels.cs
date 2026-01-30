using System.ComponentModel.DataAnnotations;

namespace TerraFusion.API.Models
{
    // <summary>
    // COUNTY MIGRATION PATHWAYS MODELS: Comprehensive Data Models
    //
    // These sophisticated models support zero-disruption county migration from Harris PACS
    // to pure TerraFusion OS with predictive analytics, rollback capabilities, and
    // comprehensive progress tracking.
    // </summary>

    #region Migration Assessment Models

    /// <summary>
    /// Migration Assessment Request - Comprehensive assessment initiation
    /// </summary>
    public class MigrationAssessmentRequest
    {
        [Required]
        public string CountyCode { get; set; } = string.Empty;

        [Required]
        public MigrationScope MigrationScope { get; set; }

        public List<string> TargetSystems { get; set; } = new();
        public List<string> CriticalWorkflows { get; set; } = new();
        public AssessmentDepth AssessmentDepth { get; set; } = AssessmentDepth.Comprehensive;

        public Dictionary<string, object> AdditionalParameters { get; set; } = new();
    }

    /// <summary>
    /// Migration Assessment Result - Comprehensive readiness analysis
    /// </summary>
    public class MigrationAssessmentResult
    {
        public string AssessmentId { get; set; } = string.Empty;
        public string CountyCode { get; set; } = string.Empty;
        public DateTime AssessmentStartTime { get; set; }
        public DateTime AssessmentEndTime { get; set; }
        public TimeSpan AssessmentDuration { get; set; }

        public bool Success { get; set; }
        public string? ErrorMessage { get; set; }
        public string? ErrorDetails { get; set; }

        // Assessment Components
        public MigrationScope RequestedMigrationScope { get; set; }
        public DataComplexityAnalysis DataComplexityAnalysis { get; set; } = new();
        public SystemDependenciesAssessment SystemDependenciesAssessment { get; set; } = new();
        public UserReadinessEvaluation UserReadinessEvaluation { get; set; } = new();
        public InfrastructureAssessment InfrastructureAssessment { get; set; } = new();
        public MigrationRiskAssessment RiskAssessment { get; set; } = new();
        public PredictiveSuccessAnalysis PredictiveSuccessAnalysis { get; set; } = new();

        // Results
        public decimal OverallReadinessScore { get; set; } // 0-100 percentage
        public MigrationStrategy RecommendedMigrationStrategy { get; set; } = new();
        public List<string> Recommendations { get; set; } = new();
        public List<string> Warnings { get; set; } = new();
    }

    /// <summary>
    /// Data Complexity Analysis - Assessment of data migration complexity
    /// </summary>
    public class DataComplexityAnalysis
    {
        public long TotalRecords { get; set; }
        public long ComplexRecords { get; set; }
        public decimal ComplexityScore { get; set; } // 0.0 to 1.0
        public TimeSpan EstimatedMigrationTime { get; set; }
        public RiskLevel DataIntegrityRisk { get; set; }

        public Dictionary<string, DataTableComplexity> TableComplexities { get; set; } = new();
        public List<string> ComplexityFactors { get; set; } = new();
    }

    /// <summary>
    /// System Dependencies Assessment - Integration complexity analysis
    /// </summary>
    public class SystemDependenciesAssessment
    {
        public int TotalDependencies { get; set; }
        public int CriticalDependencies { get; set; }
        public decimal DependencyComplexityScore { get; set; }
        public RiskLevel IntegrationRisk { get; set; }

        public List<SystemDependency> Dependencies { get; set; } = new();
        public List<string> IntegrationChallenges { get; set; } = new();
    }

    /// <summary>
    /// User Readiness Evaluation - Staff training and readiness assessment
    /// </summary>
    public class UserReadinessEvaluation
    {
        public int TotalUsers { get; set; }
        public int TrainingCompletedUsers { get; set; }
        public int TrainingInProgressUsers { get; set; }
        public decimal ReadinessScore { get; set; }

        public List<string> TrainingGaps { get; set; } = new();
        public List<UserSkillAssessment> UserSkillAssessments { get; set; } = new();
        public TimeSpan EstimatedTrainingTime { get; set; }
    }

    /// <summary>
    /// Infrastructure Assessment - Technical infrastructure readiness
    /// </summary>
    public class InfrastructureAssessment
    {
        public decimal InfrastructureScore { get; set; }
        public decimal NetworkCapacity { get; set; }
        public decimal StorageCapacity { get; set; }
        public decimal ComputeCapacity { get; set; }
        public decimal SecurityCompliance { get; set; }

        public List<InfrastructureRequirement> Requirements { get; set; } = new();
        public List<InfrastructureGap> Gaps { get; set; } = new();
    }

    #endregion

    #region Migration Strategy Models

    /// <summary>
    /// Migration Strategy - Comprehensive migration approach definition
    /// </summary>
    public class MigrationStrategy
    {
        public string StrategyId { get; set; } = Guid.NewGuid().ToString();
        public string StrategyName { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public MigrationStrategyType StrategyType { get; set; }

        public TimeSpan EstimatedDuration { get; set; }
        public decimal ConfidenceScore { get; set; }
        public RiskLevel RiskLevel { get; set; }

        public List<MigrationPhaseDefinition> Phases { get; set; } = new();
        public List<string> Prerequisites { get; set; } = new();
        public List<string> SuccessFactors { get; set; } = new();
    }

    /// <summary>
    /// Migration Phase Definition - Individual phase configuration
    /// </summary>
    public class MigrationPhaseDefinition
    {
        public string PhaseId { get; set; } = string.Empty;
        public string PhaseName { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public MigrationPhaseType PhaseType { get; set; }

        public int Order { get; set; }
        public TimeSpan EstimatedDuration { get; set; }
        public List<string> Prerequisites { get; set; } = new();
        public List<string> Deliverables { get; set; } = new();

        public Dictionary<string, object> PhaseConfiguration { get; set; } = new();
    }

    #endregion

    #region Migration Execution Models

    /// <summary>
    /// Migration Initialization Request - Migration session startup
    /// </summary>
    public class MigrationInitializationRequest
    {
        [Required]
        public string CountyCode { get; set; } = string.Empty;

        [Required]
        public MigrationStrategy MigrationStrategy { get; set; } = new();

        public MigrationConfiguration Configuration { get; set; } = new();
        public Dictionary<string, object> CustomParameters { get; set; } = new();
    }

    /// <summary>
    /// Migration Initialization Result - Session initialization outcome
    /// </summary>
    public class MigrationInitializationResult
    {
        public bool Success { get; set; }
        public string MigrationId { get; set; } = string.Empty;
        public string CountyCode { get; set; } = string.Empty;
        public string? ErrorMessage { get; set; }
        public string? ErrorDetails { get; set; }

        public MigrationSession? MigrationSession { get; set; }
        public MigrationMetrics? MigrationMetrics { get; set; }
        public string Message { get; set; } = string.Empty;
        public TimeSpan InitializationDuration { get; set; }
    }

    /// <summary>
    /// Migration Session - Active migration session state
    /// </summary>
    public class MigrationSession
    {
        public string MigrationId { get; set; } = string.Empty;
        public string CountyCode { get; set; } = string.Empty;
        public DateTime InitializationTime { get; set; }
        public DateTime? CompletionTime { get; set; }

        public MigrationStrategy MigrationStrategy { get; set; } = new();
        public MigrationConfiguration Configuration { get; set; } = new();

        public MigrationPhase CurrentPhase { get; set; }
        public MigrationStatus Status { get; set; }

        // Initialization Results
        public SecurityValidationResult? SecurityValidation { get; set; }
        public DataMigrationInitializationResult? DataMigrationInitialization { get; set; }
        public WorkflowTransitionInitializationResult? WorkflowTransitionInitialization { get; set; }
        public TrainingSystemInitializationResult? TrainingSystemInitialization { get; set; }
        public FeatureMigrationInitializationResult? FeatureMigrationInitialization { get; set; }

        // Runtime State
        public List<MigrationPhaseExecutionResult> CompletedPhases { get; set; } = new();
        public List<RollbackPoint> RollbackPoints { get; set; } = new();
        public Dictionary<string, object> SessionState { get; set; } = new();
    }

    /// <summary>
    /// Migration Phase Execution Request - Phase execution parameters
    /// </summary>
    public class MigrationPhaseExecutionRequest
    {
        [Required]
        public string PhaseId { get; set; } = string.Empty;

        public bool CreateRollbackPoint { get; set; } = true;
        public bool ValidatePrerequisites { get; set; } = true;
        public Dictionary<string, object> PhaseParameters { get; set; } = new();
    }

    /// <summary>
    /// Migration Phase Execution Result - Phase execution outcome
    /// </summary>
    public class MigrationPhaseExecutionResult
    {
        public string ExecutionId { get; set; } = string.Empty;
        public string MigrationId { get; set; } = string.Empty;
        public string PhaseId { get; set; } = string.Empty;

        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public TimeSpan ExecutionDuration { get; set; }

        public bool Success { get; set; }
        public string? ErrorMessage { get; set; }
        public string? ErrorDetails { get; set; }

        public RollbackPoint? RollbackPoint { get; set; }

        // Phase-Specific Results
        public DataMigrationPhaseResult? DataMigrationResult { get; set; }
        public WorkflowTransitionPhaseResult? WorkflowTransitionResult { get; set; }
        public FeatureMigrationPhaseResult? FeatureMigrationResult { get; set; }
        public TrainingPhaseResult? TrainingResult { get; set; }
        public PhaseValidationResult? ValidationResult { get; set; }
    }

    #endregion

    #region Migration Monitoring Models

    /// <summary>
    /// Migration Metrics - Comprehensive migration tracking
    /// </summary>
    public class MigrationMetrics
    {
        public string MigrationId { get; set; } = string.Empty;
        public string CountyCode { get; set; } = string.Empty;
        public DateTime StartTime { get; set; }
        public DateTime? EstimatedCompletionTime { get; set; }
        public DateTime? ActualCompletionTime { get; set; }

        // Progress Metrics
        public int TotalPhases { get; set; }
        public int CompletedPhases { get; set; }
        public decimal OverallProgress { get; set; } // 0.0 to 1.0

        // Data Migration Metrics
        public long TotalDataRecords { get; set; }
        public long MigratedDataRecords { get; set; }
        public decimal DataMigrationProgress { get; set; }

        // Workflow Migration Metrics
        public int TotalWorkflows { get; set; }
        public int MigratedWorkflows { get; set; }
        public decimal WorkflowMigrationProgress { get; set; }

        // Feature Migration Metrics
        public int TotalFeatures { get; set; }
        public int MigratedFeatures { get; set; }
        public decimal FeatureMigrationProgress { get; set; }

        // Training Metrics
        public int TotalTrainingModules { get; set; }
        public int CompletedTrainingModules { get; set; }
        public decimal TrainingProgress { get; set; }

        // Performance Metrics
        public TimeSpan AveragePhaseExecutionTime { get; set; }
        public DateTime? LastPhaseCompletionTime { get; set; }
        public List<PerformanceMetric> PerformanceMetrics { get; set; } = new();
    }

    #endregion

    #region Risk Assessment Models

    /// <summary>
    /// Migration Risk Assessment - Comprehensive risk analysis
    /// </summary>
    public class MigrationRiskAssessment
    {
        public decimal OverallRiskScore { get; set; } // 0.0 to 1.0
        public RiskLevel OverallRiskLevel { get; set; }

        public List<MigrationRisk> IdentifiedRisks { get; set; } = new();
        public List<RiskMitigationStrategy> MitigationStrategies { get; set; } = new();
        public Dictionary<string, decimal> RiskFactorScores { get; set; } = new();
    }

    /// <summary>
    /// Predictive Success Analysis - ML-powered success prediction
    /// </summary>
    public class PredictiveSuccessAnalysis
    {
        public decimal SuccessProbability { get; set; } // 0.0 to 1.0
        public TimeSpan PredictedDuration { get; set; }
        public TimeSpan ConfidenceInterval { get; set; }

        public List<SuccessFactor> KeySuccessFactors { get; set; } = new();
        public List<RiskFactor> KeyRiskFactors { get; set; } = new();
        public Dictionary<string, decimal> FactorWeights { get; set; } = new();
    }

    #endregion

    #region Rollback Models

    /// <summary>
    /// Rollback Point - Migration state snapshot for rollback
    /// </summary>
    public class RollbackPoint
    {
        public string RollbackPointId { get; set; } = string.Empty;
        public string MigrationId { get; set; } = string.Empty;
        public string PhaseId { get; set; } = string.Empty;
        public DateTime CreatedTime { get; set; }

        public string DataSnapshot { get; set; } = string.Empty;
        public string ConfigurationSnapshot { get; set; } = string.Empty;
        public Dictionary<string, object> StateSnapshot { get; set; } = new();
    }

    /// <summary>
    /// Migration Rollback Request - Rollback operation parameters
    /// </summary>
    public class MigrationRollbackRequest
    {
        [Required]
        public string RollbackTargetId { get; set; } = string.Empty;

        public bool ValidateIntegrity { get; set; } = true;
        public bool NotifyStakeholders { get; set; } = true;
        public string RollbackReason { get; set; } = string.Empty;
    }

    /// <summary>
    /// Migration Rollback Result - Rollback operation outcome
    /// </summary>
    public class MigrationRollbackResult
    {
        public string MigrationId { get; set; } = string.Empty;
        public string RollbackTargetId { get; set; } = string.Empty;

        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public TimeSpan RollbackDuration { get; set; }

        public bool Success { get; set; }
        public string? ErrorMessage { get; set; }
        public string? ErrorDetails { get; set; }

        // Rollback Results
        public DataRollbackResult? DataRollbackResult { get; set; }
        public WorkflowRollbackResult? WorkflowRollbackResult { get; set; }
        public FeatureRollbackResult? FeatureRollbackResult { get; set; }
        public IntegrityValidationResult? IntegrityValidation { get; set; }
    }

    #endregion

    #region Supporting Models

    /// <summary>
    /// Migration Configuration - Migration behavior configuration
    /// </summary>
    public class MigrationConfiguration
    {
        public bool EnableRealTimeMonitoring { get; set; } = true;
        public bool EnableAutoRollback { get; set; } = true;
        public TimeSpan MonitoringInterval { get; set; } = TimeSpan.FromSeconds(30);
        public int MaxRetryAttempts { get; set; } = 3;
        public TimeSpan RetryDelay { get; set; } = TimeSpan.FromMinutes(5);

        public Dictionary<string, object> AdditionalSettings { get; set; } = new();
    }

    // <summary>
    // Security Validation Result - Migration security assessment
    // NOTE: This type is now defined in GovernmentSecurityModels.cs to avoid duplication
    // </summary>
    // Removed duplicate - use TerraFusion.API.Models.SecurityValidationResult from GovernmentSecurityModels.cs

    #endregion

    #region Phase-Specific Result Models

    /// <summary>
    /// Data Migration Phase Result - Data migration outcomes
    /// </summary>
    public class DataMigrationPhaseResult
    {
        public long RecordsMigrated { get; set; }
        public long RecordsFailed { get; set; }
        public decimal SuccessRate { get; set; }
        public TimeSpan MigrationDuration { get; set; }

        public List<string> MigratedTables { get; set; } = new();
        public Dictionary<string, long> TableRecordCounts { get; set; } = new();
    }

    /// <summary>
    /// Workflow Transition Phase Result - Workflow migration outcomes
    /// </summary>
    public class WorkflowTransitionPhaseResult
    {
        public int WorkflowsTransitioned { get; set; }
        public int WorkflowsFailed { get; set; }
        public decimal TransitionSuccessRate { get; set; }

        public List<string> TransitionedWorkflows { get; set; } = new();
        public Dictionary<string, string> WorkflowMappings { get; set; } = new();
    }

    /// <summary>
    /// Feature Migration Phase Result - Feature migration outcomes
    /// </summary>
    public class FeatureMigrationPhaseResult
    {
        public int FeaturesMigrated { get; set; }
        public int FeaturesSkipped { get; set; }
        public decimal FeatureMigrationSuccessRate { get; set; }

        public List<string> MigratedFeatures { get; set; } = new();
        public Dictionary<string, string> FeatureStatus { get; set; } = new();
    }

    /// <summary>
    /// Training Phase Result - Training completion outcomes
    /// </summary>
    public class TrainingPhaseResult
    {
        public int UsersCompleted { get; set; }
        public int UsersInProgress { get; set; }
        public decimal TrainingCompletionRate { get; set; }

        public List<string> CompletedModules { get; set; } = new();
        public Dictionary<string, decimal> ModuleScores { get; set; } = new();
    }

    /// <summary>
    /// Phase Validation Result - Phase validation outcomes
    /// </summary>
    public class PhaseValidationResult
    {
        public bool ValidationPassed { get; set; }
        public decimal ValidationScore { get; set; }

        public List<string> ValidationDetails { get; set; } = new();
        public Dictionary<string, bool> ValidationChecks { get; set; } = new();
    }

    #endregion

    #region Initialization Result Models

    /// <summary>
    /// Data Migration Initialization Result
    /// </summary>
    public class DataMigrationInitializationResult
    {
        public bool Success { get; set; }
        public long TotalRecordsToMigrate { get; set; }
        public TimeSpan EstimatedMigrationTime { get; set; }
        public List<string> TablesToMigrate { get; set; } = new();
    }

    /// <summary>
    /// Workflow Transition Initialization Result
    /// </summary>
    public class WorkflowTransitionInitializationResult
    {
        public bool Success { get; set; }
        public int TotalWorkflowsToTransition { get; set; }
        public List<string> WorkflowsToTransition { get; set; } = new();
    }

    /// <summary>
    /// Training System Initialization Result
    /// </summary>
    public class TrainingSystemInitializationResult
    {
        public bool Success { get; set; }
        public int TotalTrainingModules { get; set; }
        public List<string> TrainingModules { get; set; } = new();
    }

    /// <summary>
    /// Feature Migration Initialization Result
    /// </summary>
    public class FeatureMigrationInitializationResult
    {
        public bool Success { get; set; }
        public int TotalFeaturesToMigrate { get; set; }
        public List<string> FeaturesToMigrate { get; set; } = new();
    }

    #endregion

    #region Rollback Result Models

    /// <summary>
    /// Data Rollback Result
    /// </summary>
    public class DataRollbackResult
    {
        public bool Success { get; set; }
        public long RecordsRolledBack { get; set; }
        public TimeSpan RollbackDuration { get; set; }
        public string MigrationId { get; set; } = string.Empty;
        public string Phase { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime RollbackTime { get; set; }
        public long RestoredRecords { get; set; }
        public string Message { get; set; } = string.Empty;
    }

    /// <summary>
    /// Workflow Rollback Result
    /// </summary>
    public class WorkflowRollbackResult
    {
        public bool Success { get; set; }
        public int WorkflowsRolledBack { get; set; }
        public List<string> RolledBackWorkflows { get; set; } = new();
    }

    /// <summary>
    /// Feature Rollback Result
    /// </summary>
    public class FeatureRollbackResult
    {
        public bool Success { get; set; }
        public int FeaturesRolledBack { get; set; }
        public List<string> RolledBackFeatures { get; set; } = new();
    }

    /// <summary>
    /// Integrity Validation Result
    /// </summary>
    public class IntegrityValidationResult
    {
        public bool IsValid { get; set; }
        public decimal ValidationScore { get; set; }
        public List<string> ValidationDetails { get; set; } = new();
    }

    #endregion

    #region Supporting Data Models

    public class DataTableComplexity
    {
        public string TableName { get; set; } = string.Empty;
        public long RecordCount { get; set; }
        public decimal ComplexityScore { get; set; }
        public List<string> ComplexityFactors { get; set; } = new();
    }

    public class SystemDependency
    {
        public string DependencyName { get; set; } = string.Empty;
        public string DependencyType { get; set; } = string.Empty;
        public bool IsCritical { get; set; }
        public RiskLevel Risk { get; set; }
    }

    public class UserSkillAssessment
    {
        public string UserId { get; set; } = string.Empty;
        public string UserName { get; set; } = string.Empty;
        public decimal SkillScore { get; set; }
        public List<string> CompletedTraining { get; set; } = new();
        public List<string> RequiredTraining { get; set; } = new();
    }

    public class InfrastructureRequirement
    {
        public string RequirementName { get; set; } = string.Empty;
        public string RequirementType { get; set; } = string.Empty;
        public bool IsMet { get; set; }
        public string Details { get; set; } = string.Empty;
    }

    public class InfrastructureGap
    {
        public string GapName { get; set; } = string.Empty;
        public string GapType { get; set; } = string.Empty;
        public RiskLevel Impact { get; set; }
        public string Resolution { get; set; } = string.Empty;
    }

    public class MigrationRisk
    {
        public string RiskId { get; set; } = string.Empty;
        public string RiskName { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public RiskLevel Level { get; set; }
        public decimal Probability { get; set; }
        public decimal Impact { get; set; }
    }

    public class RiskMitigationStrategy
    {
        public string StrategyId { get; set; } = string.Empty;
        public string RiskId { get; set; } = string.Empty;
        public string StrategyName { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public decimal EffectivenessScore { get; set; }
    }

    public class SuccessFactor
    {
        public string FactorName { get; set; } = string.Empty;
        public decimal Weight { get; set; }
        public decimal CurrentScore { get; set; }
        public string Impact { get; set; } = string.Empty;
    }

    public class RiskFactor
    {
        public string FactorName { get; set; } = string.Empty;
        public decimal Weight { get; set; }
        public decimal CurrentScore { get; set; }
        public string Impact { get; set; } = string.Empty;
    }

    public class PerformanceMetric
    {
        public string MetricName { get; set; } = string.Empty;
        public decimal Value { get; set; }
        public string Unit { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
    }

    public class SecurityCheck
    {
        public string CheckName { get; set; } = string.Empty;
        public bool Passed { get; set; }
        public string Details { get; set; } = string.Empty;
    }

    public class ComplianceValidation
    {
        public string ComplianceStandard { get; set; } = string.Empty;
        public bool IsCompliant { get; set; }
        public decimal ComplianceScore { get; set; }
        public List<string> Gaps { get; set; } = new();
        
        // Government-grade validation properties for cross-service compatibility
        public string ValidationCategory { get; set; } = string.Empty;
        public bool Passed { get; set; }
        public decimal Score { get; set; }
        public List<string> Details { get; set; } = new();
    }

    #endregion

    #region Enumerations

    public enum MigrationScope
    {
        Minimal,          // Core functionality only
        Standard,         // Most common features
        Comprehensive,    // All features and integrations
        Custom           // User-defined scope
    }

    public enum AssessmentDepth
    {
        Quick,           // Basic assessment
        Standard,        // Normal depth assessment
        Comprehensive,   // Thorough assessment
        Expert          // Deep technical assessment
    }

    public enum MigrationStrategyType
    {
        BigBang,         // All at once migration
        Phased,          // Gradual phase-by-phase
        Parallel,        // Run systems in parallel
        Pilot           // Start with pilot group
    }

    public enum MigrationPhaseType
    {
        Preparation,
        Training,
        DataMigration,
        WorkflowTransition,
        FeatureMigration,
        Validation,
        Optimization,
        Completion
    }

    public enum MigrationPhase
    {
        Initialization,
        Ready,
        Training,
        DataMigration,
        WorkflowTransition,
        FeatureMigration,
        Validation,
        Optimization,
        Completion,
        RolledBack,
        Failed,
        Unknown
    }

    public enum MigrationStatus
    {
        Created,
        Initializing,
        Ready,
        InProgress,
        Paused,
        Completed,
        Failed,
        RolledBack,
        Cancelled
    }

    public enum RiskLevel
    {
        VeryLow,
        Low,
        Medium,
        High,
        VeryHigh,
        Critical
    }

    #endregion
}
