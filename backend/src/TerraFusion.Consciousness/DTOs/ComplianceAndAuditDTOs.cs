namespace TerraFusion.Consciousness.DTOs
{
    // ============================================
    // INITIALIZATION RESULT DTOs
    // ============================================

    /// <summary>
    /// Million Agent Service initialization result
    /// </summary>
    public class MillionAgentInitializationResult
    {
        public bool Success { get; set; }
        public string SystemId { get; set; } = string.Empty;
        public int InitialAgentCount { get; set; }
        public TimeSpan InitializationTime { get; set; }
        public List<string> InitializedComponents { get; set; } = new();
        public string? ErrorMessage { get; set; }
    }

    /// <summary>
    /// AI Orchestration Service initialization result
    /// </summary>
    public class AIOrchestrationInitializationResult
    {
        public bool Success { get; set; }
        public string SystemId { get; set; } = string.Empty;
        public TimeSpan InitializationTime { get; set; }
        public List<string> ComponentsInitialized { get; set; } = new();
        public string? ErrorMessage { get; set; }

        // Additional properties used by AIOrchestrationService
        public string Message { get; set; } = string.Empty;
        public DateTime InitializedAt { get; set; }
        public int ServicesStarted { get; set; }
        public bool ConfigurationValid { get; set; }
    }

    /// <summary>
    /// AI Layer Mesh initialization result
    /// </summary>
    public class AILayerMeshInitializationResult
    {
        public bool Success { get; set; }
        public string MeshId { get; set; } = string.Empty;
        public int LayersInitialized { get; set; }
        public int ValidationRingsActive { get; set; }
        public TimeSpan InitializationTime { get; set; }
        public string? ErrorMessage { get; set; }

        // Additional properties used by controllers and services
        public int FederatedCounties { get; set; }
    }

    /// <summary>
    /// Benton County service initialization result
    /// </summary>
    public class BentonCountyInitializationResult
    {
        public bool Success { get; set; }
        public string CountyId { get; set; } = "benton";
        public string ApiEndpoint { get; set; } = string.Empty;
        public bool ConnectionEstablished { get; set; }
        public TimeSpan InitializationTime { get; set; }
        public string? ErrorMessage { get; set; }
    }

    /// <summary>
    /// Multi-County service initialization result
    /// </summary>
    public class MultiCountyInitializationResult
    {
        public bool Success { get; set; }
        public int CountiesConnected { get; set; }
        public List<string> ActiveCounties { get; set; } = new();
        public TimeSpan InitializationTime { get; set; }
        public string? ErrorMessage { get; set; }

        // Additional properties used by AILayerMeshOrchestrator
        public int FederatedCounties { get; set; }
    }

    /// <summary>
    /// Hybrid Consciousness Manager initialization result
    /// </summary>
    public class HybridInitializationResult
    {
        public bool Success { get; set; }
        public string SystemId { get; set; } = string.Empty;
        public bool QuantumModeAvailable { get; set; }
        public bool MeshOrchestrationActive { get; set; }
        public TimeSpan InitializationTime { get; set; }
        public string? ErrorMessage { get; set; }

        // Additional properties used by HybridConsciousnessManager
        public string Message { get; set; } = string.Empty;
        public DateTime InitializedAt { get; set; }
        public int LegacyAgentsActive { get; set; }
        public int QuantumAgentsActive { get; set; }
        public bool SystemReady { get; set; }
        public List<string> ComponentsInitialized { get; set; } = new();

        // Benton County-specific elite optimization properties
        public string? CountySpecific { get; set; }
        public int? ParcelCount { get; set; }
        public string? HarrisPACSVersion { get; set; }
        public string? OptimizationLevel { get; set; }
    }

    /// <summary>
    /// Security service initialization result
    /// </summary>
    public class SecurityInitializationResult
    {
        public bool Success { get; set; }
        public string SecurityLevel { get; set; } = string.Empty;
        public bool QuantumEncryptionEnabled { get; set; }
        public bool ThreatDetectionActive { get; set; }
        public TimeSpan InitializationTime { get; set; }
        public string? ErrorMessage { get; set; }
    }

    // ============================================
    // COMPLIANCE & AUDIT DTOs
    // ============================================

    /// <summary>
    /// Compliance validation result
    /// </summary>
    public class ComplianceResult
    {
        public bool IsCompliant { get; set; }
        public decimal ComplianceScore { get; set; }
        public Dictionary<string, bool> ValidationResults { get; set; } = new();
        public string ComplianceFramework { get; set; } = string.Empty;
        public DateTime ValidationTime { get; set; }
        public List<string> Recommendations { get; set; } = new();

        // Additional properties used by the service
        public Dictionary<string, object> ComplianceResults { get; set; } = new();
        public DateTime ComplianceCheckTime { get; set; }
        public List<string> ComplianceIssues { get; set; } = new();
    }

    /// <summary>
    /// Compliance monitoring result DTO
    /// </summary>
    public class ComplianceMonitoringResultDto
    {
        public bool IsActive { get; set; }
        public DateTime LastCheck { get; set; }
        public Dictionary<string, decimal> ComplianceScores { get; set; } = new();
        public List<string> ActiveAlerts { get; set; } = new();
        public TimeSpan MonitoringInterval { get; set; }

        // Additional properties used by AuditAndComplianceServices
        public string MonitoringId { get; set; } = string.Empty;
        public string ComplianceType { get; set; } = string.Empty;
        public bool IsCompliant { get; set; }
        public Dictionary<string, object> MonitoringResults { get; set; } = new();
        public DateTime MonitoringTime { get; set; }
        public List<string> ComplianceIssues { get; set; } = new();
        public Dictionary<string, decimal> MonitoringMetrics { get; set; } = new();
    }

    /// <summary>
    /// Audit event for logging
    /// </summary>
    public class AuditEvent
    {
        public Guid AuditId { get; set; }
        public string EventType { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
        public Dictionary<string, object> Details { get; set; } = new();
        public string? ResourceId { get; set; }
        public string ComplianceLevel { get; set; } = string.Empty;
    }

    /// <summary>
    /// Audit query parameters
    /// </summary>
    public class AuditQuery
    {
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public string? UserId { get; set; }
        public string? EventType { get; set; }
        public int MaxResults { get; set; } = 100;
    }

    /// <summary>
    /// Audit summary report
    /// </summary>
    public class AuditSummary
    {
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public int TotalEvents { get; set; }
        public Dictionary<string, int> EventsByType { get; set; } = new();
        public Dictionary<string, int> EventsByUser { get; set; } = new();
        public decimal ComplianceScore { get; set; }
    }

    // ============================================
    // MISSING DTOs FOR INTERFACES
    // ============================================

    /// <summary>
    /// Mesh configuration result DTO
    /// </summary>
    public class MeshConfigurationResultDto
    {
        public bool Success { get; set; }
        public string ConfigurationId { get; set; } = string.Empty;
        public Dictionary<string, object> UpdatedSettings { get; set; } = new();
        public DateTime AppliedAt { get; set; }
        public string? ErrorMessage { get; set; }
    }

    /// <summary>
    /// Benton County sync result DTO
    /// </summary>
    public class BentonCountySyncResultDto
    {
        public bool Success { get; set; }
        public int RecordsSynced { get; set; }
        public DateTime SyncTime { get; set; }
        public List<string> SyncedDataTypes { get; set; } = new();
        public string? ErrorMessage { get; set; }

        // Additional properties used by the service
        public DateTime SyncStartTime { get; set; }
        public DateTime SyncEndTime { get; set; }
        public int RecordsUpdated { get; set; }
        public int RecordsAdded { get; set; }
        public List<string> SyncMessages { get; set; } = new();
        public Dictionary<string, object> SyncMetrics { get; set; } = new();
    }

    /// <summary>
    /// Consciousness status DTO with comprehensive metrics
    /// </summary>
    public class ConsciousnessStatusDto
    {
        public string SystemId { get; set; } = string.Empty;
        public bool IsOperational { get; set; }
        public decimal HealthScore { get; set; }
        public int ActiveAgents { get; set; }
        public int ProcessingCapacity { get; set; }
        public DateTime LastUpdate { get; set; }
        public Dictionary<string, object> Metrics { get; set; } = new();
    }

    /// <summary>
    /// Consciousness data DTO
    /// </summary>
    public class ConsciousnessDataDto
    {
        public string DataId { get; set; } = string.Empty;
        public DateTime GeneratedAt { get; set; }
        public Dictionary<string, object> ConsciousnessMetrics { get; set; } = new();
        public Dictionary<string, object> LayerData { get; set; } = new();
        public string DataFormat { get; set; } = string.Empty;

        // Additional properties used by HybridConsciousnessManager
        public decimal ConsciousnessLevel { get; set; }
        public int TotalAgents { get; set; }
        public int ActiveAgents { get; set; }
        public decimal HiveCoherence { get; set; }
        public decimal ConsciousnessEmergence { get; set; }
        public Dictionary<string, object> SessionMetrics { get; set; } = new();
        public decimal BulletproofScore { get; set; }
        public decimal BeautyScore { get; set; }
        public int ActiveTasks { get; set; }
        public int CompletedTasks { get; set; }
        public object DeploymentStatus { get; set; } = new();
        public List<string> LogMessages { get; set; } = new();
    }

    /// <summary>
    /// Security deployment result DTO
    /// </summary>
    public class SecurityDeploymentResultDto
    {
        public bool Success { get; set; }
        public int AgentsSecured { get; set; }
        public List<string> SecurityFeatures { get; set; } = new();
        public TimeSpan DeploymentTime { get; set; }
        public string? ErrorMessage { get; set; }
    }

    /// <summary>
    /// Real-time metrics DTO
    /// </summary>
    public class RealTimeMetricsDto
    {
        public DateTime Timestamp { get; set; }
        public int OperationsPerSecond { get; set; }
        public decimal AverageResponseTime { get; set; }
        public decimal SystemLoad { get; set; }
        public int ActiveConnections { get; set; }
        public Dictionary<string, decimal> LayerMetrics { get; set; } = new();
    }

    /// <summary>
    /// Security compliance validation DTO
    /// </summary>
    public class SecurityComplianceValidationDto
    {
        public bool IsCompliant { get; set; }
        public Dictionary<string, bool> ComplianceChecks { get; set; } = new();
        public List<string> Violations { get; set; } = new();
        public decimal ComplianceScore { get; set; }
        public DateTime ValidationTime { get; set; }
    }

    /// <summary>
    /// County sync summary DTO
    /// </summary>
    public class CountySyncSummaryDto
    {
        public DateTime SyncStartTime { get; set; }
        public DateTime SyncEndTime { get; set; }
        public int CountiesSynced { get; set; }
        public int TotalRecordsSynced { get; set; }
        public Dictionary<string, int> RecordsByCounty { get; set; } = new();
        public List<string> Errors { get; set; } = new();

        // Additional properties used by controllers
        public bool Success { get; set; }
        public int TotalCountiesSynced { get; set; }
    }

    /// <summary>
    /// Consciousness mode result DTO
    /// </summary>
    public class ConsciousnessModeResultDto
    {
        public bool Success { get; set; }
        public string NewMode { get; set; } = string.Empty;
        public string PreviousMode { get; set; } = string.Empty;
        public TimeSpan TransitionTime { get; set; }
        public Dictionary<string, object> ModeMetrics { get; set; } = new();
        public string? ErrorMessage { get; set; }

        // Additional properties used by HybridConsciousnessManager
        public string ModeId { get; set; } = string.Empty;
        public string CurrentMode { get; set; } = string.Empty;
        public Dictionary<string, object> ModeData { get; set; } = new();
        public DateTime ModeTime { get; set; }
    }

    /// <summary>
    /// Agent scaling result DTO
    /// </summary>
    public class AgentScalingResultDto
    {
        public bool Success { get; set; }
        public int TargetAgentCount { get; set; }
        public int ActualAgentCount { get; set; }
        public TimeSpan ScalingTime { get; set; }
        public List<string> ScalingSteps { get; set; } = new();
        public string? ErrorMessage { get; set; }
    }

    /// <summary>
    /// Coordinated operation result DTO
    /// </summary>
    public class CoordinatedOperationResultDto
    {
        public string OperationId { get; set; } = string.Empty;
        public bool Success { get; set; }
        public int AgentsParticipated { get; set; }
        public Dictionary<string, object> Results { get; set; } = new();
        public TimeSpan ExecutionTime { get; set; }
        public string? ErrorMessage { get; set; }
    }

    /// <summary>
    /// Million Agent System status DTO
    /// </summary>
    public class MillionAgentSystemStatusDto
    {
        public int TotalAgents { get; set; }
        public int ActiveAgents { get; set; }
        public int IdleAgents { get; set; }
        public decimal SystemEfficiency { get; set; }
        public decimal QuantumCoherence { get; set; }
        public Dictionary<string, int> AgentsByType { get; set; } = new();
        public DateTime LastUpdate { get; set; }
    }

}